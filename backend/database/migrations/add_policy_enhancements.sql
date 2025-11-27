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

-- 7. 基于实际指标数据计算政策关联强度
-- 计算逻辑：综合多个维度的指标变化率，反映政策实施效果
-- 
-- 计算维度：
--   1. 经济增长维度 (40%权重): GDP增长率、人均收入增长率
--   2. 农业发展维度 (30%权重): 粮食产量增长、耕地面积变化
--   3. 基础设施维度 (20%权重): 公路里程增长、宽带用户增长
--   4. 社会保障维度 (10%权重): 医疗床位增长、医保参保率增长
--
-- 计算方法：
--   - 对比政策发布年份前后的指标变化
--   - 计算年均增长率，归一化到 0-1 范围
--   - 加权求和得到综合强度值

UPDATE rel_policy_county rpc
JOIN policies p ON rpc.policy_id = p.policy_id
SET rpc.strength = GREATEST(0.20, LEAST(0.95, (
  -- 1. 经济增长维度 (40%权重)
  COALESCE((
    SELECT 
      0.40 * (
        -- GDP增长率贡献 (20%)
        0.50 * CASE 
          WHEN ei_before.gdp > 0 AND ei_after.gdp > 0 
          THEN LEAST(1.0, (ei_after.gdp - ei_before.gdp) / ei_before.gdp / 0.15)  -- 归一化：15%增长率 = 1.0
          ELSE 0.5 
        END +
        -- 人均收入增长率贡献 (20%)
        0.50 * CASE 
          WHEN ei_before.disp_income_rural > 0 AND ei_after.disp_income_rural > 0 
          THEN LEAST(1.0, (ei_after.disp_income_rural - ei_before.disp_income_rural) / ei_before.disp_income_rural / 0.10)  -- 归一化：10%增长率 = 1.0
          ELSE 0.5 
        END
      )
    FROM 
      (SELECT AVG(gdp) as gdp, AVG(disp_income_rural) as disp_income_rural
       FROM economic_indicators 
       WHERE county_id = rpc.county_id 
       AND year BETWEEN YEAR(p.issue_date) - 2 AND YEAR(p.issue_date) - 1
      ) ei_before,
      (SELECT AVG(gdp) as gdp, AVG(disp_income_rural) as disp_income_rural
       FROM economic_indicators 
       WHERE county_id = rpc.county_id 
       AND year BETWEEN YEAR(p.issue_date) + 1 AND YEAR(p.issue_date) + 3
      ) ei_after
  ), 0.20) +
  
  -- 2. 农业发展维度 (30%权重)
  COALESCE((
    SELECT 
      0.30 * (
        -- 粮食产量增长贡献 (20%)
        0.67 * CASE 
          WHEN ai_before.grain_yield > 0 AND ai_after.grain_yield > 0 
          THEN LEAST(1.0, (ai_after.grain_yield - ai_before.grain_yield) / ai_before.grain_yield / 0.08)  -- 归一化：8%增长率 = 1.0
          ELSE 0.5 
        END +
        -- 耕地面积增长贡献 (10%)
        0.33 * CASE 
          WHEN ai_before.arable_land > 0 AND ai_after.arable_land > 0 
          THEN LEAST(1.0, (ai_after.arable_land - ai_before.arable_land) / ai_before.arable_land / 0.05 + 0.5)  -- 归一化：5%增长率 = 1.0, 负增长映射到0-0.5
          ELSE 0.5 
        END
      )
    FROM 
      (SELECT AVG(grain_yield) as grain_yield, AVG(arable_land) as arable_land
       FROM agriculture_indicators 
       WHERE county_id = rpc.county_id 
       AND year BETWEEN YEAR(p.issue_date) - 2 AND YEAR(p.issue_date) - 1
      ) ai_before,
      (SELECT AVG(grain_yield) as grain_yield, AVG(arable_land) as arable_land
       FROM agriculture_indicators 
       WHERE county_id = rpc.county_id 
       AND year BETWEEN YEAR(p.issue_date) + 1 AND YEAR(p.issue_date) + 3
      ) ai_after
  ), 0.15) +
  
  -- 3. 基础设施维度 (20%权重)
  COALESCE((
    SELECT 
      0.20 * (
        -- 公路里程增长贡献 (10%)
        0.50 * CASE 
          WHEN ii_before.road_mileage > 0 AND ii_after.road_mileage > 0 
          THEN LEAST(1.0, (ii_after.road_mileage - ii_before.road_mileage) / ii_before.road_mileage / 0.06)  -- 归一化：6%增长率 = 1.0
          ELSE 0.5 
        END +
        -- 宽带用户增长贡献 (10%)
        0.50 * CASE 
          WHEN ii_before.broadband_users > 0 AND ii_after.broadband_users > 0 
          THEN LEAST(1.0, (ii_after.broadband_users - ii_before.broadband_users) / ii_before.broadband_users / 0.20)  -- 归一化：20%增长率 = 1.0
          ELSE 0.5 
        END
      )
    FROM 
      (SELECT AVG(road_mileage) as road_mileage, AVG(broadband_users) as broadband_users
       FROM infrastructure_indicators 
       WHERE county_id = rpc.county_id 
       AND year BETWEEN YEAR(p.issue_date) - 2 AND YEAR(p.issue_date) - 1
      ) ii_before,
      (SELECT AVG(road_mileage) as road_mileage, AVG(broadband_users) as broadband_users
       FROM infrastructure_indicators 
       WHERE county_id = rpc.county_id 
       AND year BETWEEN YEAR(p.issue_date) + 1 AND YEAR(p.issue_date) + 3
      ) ii_after
  ), 0.10) +
  
  -- 4. 社会保障维度 (10%权重)
  COALESCE((
    SELECT 
      0.10 * (
        -- 医疗床位增长贡献 (5%)
        0.50 * CASE 
          WHEN mi_before.medical_beds > 0 AND mi_after.medical_beds > 0 
          THEN LEAST(1.0, (mi_after.medical_beds - mi_before.medical_beds) / mi_before.medical_beds / 0.08)  -- 归一化：8%增长率 = 1.0
          ELSE 0.5 
        END +
        -- 医保参保人数增长贡献 (5%)
        0.50 * CASE 
          WHEN mi_before.medical_insurance_users > 0 AND mi_after.medical_insurance_users > 0 
          THEN LEAST(1.0, (mi_after.medical_insurance_users - mi_before.medical_insurance_users) / mi_before.medical_insurance_users / 0.05)  -- 归一化：5%增长率 = 1.0
          ELSE 0.5 
        END
      )
    FROM 
      (SELECT AVG(medical_beds) as medical_beds, AVG(medical_insurance_users) as medical_insurance_users
       FROM medical_social_indicators 
       WHERE county_id = rpc.county_id 
       AND year BETWEEN YEAR(p.issue_date) - 2 AND YEAR(p.issue_date) - 1
      ) mi_before,
      (SELECT AVG(medical_beds) as medical_beds, AVG(medical_insurance_users) as medical_insurance_users
       FROM medical_social_indicators 
       WHERE county_id = rpc.county_id 
       AND year BETWEEN YEAR(p.issue_date) + 1 AND YEAR(p.issue_date) + 3
      ) mi_after
  ), 0.05)
)))
WHERE rpc.strength = 1.0;

-- 8. 创建索引优化查询性能（idx_policy_type 和 idx_issue_date 已在 init.sql 中创建）
-- 幂等：重复执行时忽略错误
CREATE INDEX idx_status ON policies(status);

-- 9. 验证迁移结果
SELECT '✓ 政策可视化数据库增强完成！' AS message;
SELECT CONCAT('统计视图记录数: ', COUNT(*)) AS stats FROM v_policy_stats;
SELECT CONCAT('关联缓存记录数: ', COUNT(*)) AS cache_count FROM policy_interview_cache;
