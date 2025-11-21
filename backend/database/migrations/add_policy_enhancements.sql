-- 政策可视化增强：为 rel_policy_county 添加关联强度字段
-- 执行方式：mysql -u root -p ci_pae < backend/database/migrations/add_policy_enhancements.sql

USE ci_pae;

-- 保证视图重新创建前删除旧版本（防止结构变化导致后续统计失败）
DROP VIEW IF EXISTS v_policy_stats;

-- 1. 为政策-县关联表添加关联强度字段（幂等：重复执行时忽略错误）
-- 注意：initDb.js会捕获这些ALTER TABLE错误并标记为幂等操作跳过
ALTER TABLE rel_policy_county ADD COLUMN strength DECIMAL(3,2) DEFAULT 1.0 COMMENT '关联强度(0-1,基于访谈提及频率和指标效应)';
ALTER TABLE rel_policy_county ADD COLUMN adopt_year INT DEFAULT NULL COMMENT '该县采纳政策年份';
ALTER TABLE rel_policy_county ADD COLUMN notes TEXT DEFAULT NULL COMMENT '备注信息';

-- 2. 创建政策关键词提取表（用于访谈内容匹配）
CREATE TABLE IF NOT EXISTS policy_keywords (
  policy_id VARCHAR(50) NOT NULL,
  keyword VARCHAR(100) NOT NULL,
  weight DECIMAL(3,2) DEFAULT 1.0 COMMENT '关键词权重',
  PRIMARY KEY (policy_id, keyword),
  FOREIGN KEY (policy_id) REFERENCES policies(policy_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='政策关键词表';

-- 3. 初始化政策关键词（从摘要中提取）
INSERT INTO policy_keywords (policy_id, keyword, weight) VALUES
('POL001', '马铃薯', 1.0),
('POL001', '种薯', 0.9),
('POL001', '补贴', 0.8),
('POL002', '健康', 1.0),
('POL002', '医疗', 0.9),
('POL002', '兜底', 0.8),
('POL003', '旅游', 1.0),
('POL003', '生态', 0.9),
('POL003', '农家乐', 0.8)
ON DUPLICATE KEY UPDATE weight = VALUES(weight);

-- 4. 创建政策访谈关联缓存表（提升查询性能）
CREATE TABLE IF NOT EXISTS policy_interview_cache (
  policy_id VARCHAR(50) NOT NULL,
  data_id VARCHAR(50) NOT NULL,
  county_id VARCHAR(50) NOT NULL,
  relevance_score DECIMAL(4,2) DEFAULT 1.0 COMMENT '相关度评分(0-10)',
  matched_keywords TEXT COMMENT '匹配到的关键词列表',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (policy_id, data_id),
  FOREIGN KEY (policy_id) REFERENCES policies(policy_id) ON DELETE CASCADE,
  FOREIGN KEY (data_id) REFERENCES interview_data(data_id) ON DELETE CASCADE,
  FOREIGN KEY (county_id) REFERENCES counties(county_id) ON DELETE CASCADE,
  INDEX idx_relevance (relevance_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='政策-访谈关联缓存表';

-- 5. 填充关联缓存（基于县域关联 + 关键词匹配）
INSERT INTO policy_interview_cache (policy_id, data_id, county_id, relevance_score, matched_keywords)
SELECT DISTINCT
  rpc.policy_id,
  id.data_id,
  rpc.county_id,
  (SELECT COUNT(*) * 1.5 
   FROM policy_keywords pk 
   WHERE pk.policy_id = rpc.policy_id 
   AND (id.keywords LIKE CONCAT('%', pk.keyword, '%') 
        OR id.content LIKE CONCAT('%', pk.keyword, '%'))
  ) + 3.0 as relevance_score,
  (SELECT GROUP_CONCAT(pk.keyword SEPARATOR ',')
   FROM policy_keywords pk 
   WHERE pk.policy_id = rpc.policy_id 
   AND (id.keywords LIKE CONCAT('%', pk.keyword, '%') 
        OR id.content LIKE CONCAT('%', pk.keyword, '%'))
  ) as matched_keywords
FROM rel_policy_county rpc
JOIN counties c ON rpc.county_id = c.county_id
JOIN interviewees ie ON ie.county_id = c.county_id
JOIN rel_interviewee_event rie ON ie.interviewee_id = rie.interviewee_id
JOIN interview_events evt ON rie.event_id = evt.event_id
JOIN interview_data id ON evt.event_id = id.event_id
ON DUPLICATE KEY UPDATE 
  relevance_score = VALUES(relevance_score),
  matched_keywords = VALUES(matched_keywords);

-- 6. 创建政策统计视图（用于快速查询泡泡数据）
CREATE OR REPLACE VIEW v_policy_stats AS
SELECT 
  p.policy_id,
  p.policy_name,
  p.policy_type,
  p.department,
  p.issue_date,
  p.implementation_date,
  p.status,
  p.summary,
  -- 覆盖县数（使用子查询确保准确统计）
  (SELECT COUNT(DISTINCT rpc_inner.county_id) 
   FROM rel_policy_county rpc_inner 
   WHERE rpc_inner.policy_id = p.policy_id
  ) as county_count,
  -- 资源投入数
  (SELECT COUNT(DISTINCT pr_inner.resource_id) 
   FROM policy_resources pr_inner 
   WHERE pr_inner.policy_id = p.policy_id
  ) as resource_count,
  -- 关联访谈数(从缓存表读取)
  (SELECT COUNT(DISTINCT pic.data_id)
   FROM policy_interview_cache pic
   WHERE pic.policy_id = p.policy_id
  ) as interview_count,
  -- 平均关联强度
  (SELECT AVG(rpc_strength.strength) 
   FROM rel_policy_county rpc_strength 
   WHERE rpc_strength.policy_id = p.policy_id
  ) as avg_strength,
  -- 最早和最晚采纳年份
  (SELECT MIN(rpc_adopt.adopt_year) 
   FROM rel_policy_county rpc_adopt 
   WHERE rpc_adopt.policy_id = p.policy_id
  ) as first_adopt_year,
  (SELECT MAX(rpc_adopt.adopt_year) 
   FROM rel_policy_county rpc_adopt 
   WHERE rpc_adopt.policy_id = p.policy_id
  ) as last_adopt_year
FROM policies p;

-- 7. 为关联强度字段设置初始值（基于已有数据）
UPDATE rel_policy_county rpc
SET strength = (
  SELECT CASE 
    WHEN COUNT(id.data_id) > 0 THEN LEAST(1.0, 0.5 + COUNT(id.data_id) * 0.1)
    ELSE 0.7
  END
  FROM counties c
  LEFT JOIN interviewees ie ON ie.county_id = c.county_id
  LEFT JOIN rel_interviewee_event rie ON ie.interviewee_id = rie.interviewee_id
  LEFT JOIN interview_events evt ON rie.event_id = evt.event_id
  LEFT JOIN interview_data id ON evt.event_id = id.event_id
  WHERE c.county_id = rpc.county_id
)
WHERE strength = 1.0;

-- 8. 创建索引优化查询性能（idx_policy_type 和 idx_issue_date 已在 init.sql 中创建）
-- 幂等：重复执行时忽略错误
CREATE INDEX idx_status ON policies(status);

-- 9. 验证迁移结果
SELECT '✓ 政策可视化数据库增强完成！' AS message;
SELECT CONCAT('统计视图记录数: ', COUNT(*)) AS stats FROM v_policy_stats;
SELECT CONCAT('关联缓存记录数: ', COUNT(*)) AS cache_count FROM policy_interview_cache;
