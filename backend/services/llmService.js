require('dotenv').config();
const { OpenAI } = require('openai');
const pool = require('../config/db'); // 导入真实数据库连接池

// 初始化客户端 (保持不变)
const client = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
});

// =================================================================
// 1. 新的“规划”提示词 (使用你的完整 Schema)
// =================================================================
const PLANNER_SYSTEM_PROMPT = `你是一个数据分析规划师。你的任务是分析用户的查询和数据库结构，然后以 JSON 格式输出一个清晰的“查询计划”。

### 数据库结构 (Schema):
${"```sql"}
-- 县基础信息表
CREATE TABLE \`counties\` (
  \`county_id\` VARCHAR(50) NOT NULL COMMENT 'CountyID - 县唯一标识',
  \`county_name\` VARCHAR(100) NOT NULL COMMENT 'CountyName - 县名',
  \`city\` VARCHAR(50) DEFAULT NULL COMMENT '所属市',
  \`province\` VARCHAR(50) DEFAULT NULL COMMENT '所属省',
  \`is_poverty_alleviated\` TINYINT(1) DEFAULT 0 COMMENT '是否脱贫',
  \`alleviation_year\` INT DEFAULT NULL COMMENT '脱贫年份'
);

-- 经济指标
CREATE TABLE \`economic_indicators\` (
  \`county_id\` VARCHAR(50) NOT NULL COMMENT '[FK]',
  \`year\` INT NOT NULL COMMENT '年份',
  \`gdp\` DECIMAL(20,4) DEFAULT NULL COMMENT '地区生产总值(亿元)',
  \`public_budget_income\` DECIMAL(20,4) DEFAULT NULL COMMENT '一般公共预算收入(万元)',
  \`disp_income_rural\` DECIMAL(20,4) DEFAULT NULL COMMENT '农村牧区常住居民人均可支配收入(元)'
);

-- 农业指标
CREATE TABLE \`agriculture_indicators\` (
  \`county_id\` VARCHAR(50) NOT NULL COMMENT '[FK]',
  \`year\` INT NOT NULL COMMENT '年份',
  \`arable_land\` DECIMAL(20,4) DEFAULT NULL COMMENT '耕地面积(公顷)',
  \`grain_yield\` DECIMAL(20,4) DEFAULT NULL COMMENT '粮食产量(吨)'
);

-- 访谈数据 (定性)
CREATE TABLE \`interview_data\` (
  \`data_id\` VARCHAR(50) NOT NULL,
  \`content\` LONGTEXT COMMENT '访谈内容',
  \`keywords\` VARCHAR(255) DEFAULT NULL COMMENT '关键词',
  \`experience_summary\` TEXT COMMENT '脱贫经验总结',
  \`event_id\` VARCHAR(50) NOT NULL COMMENT '[FK]'
);

-- 访谈事件 (定性)
CREATE TABLE \`interview_events\` (
  \`event_id\` VARCHAR(50) NOT NULL,
  \`location\` VARCHAR(255) DEFAULT NULL COMMENT '访谈地点',
  \`event_date\` DATE DEFAULT NULL COMMENT '访谈日期',
  \`topic\` VARCHAR(255) DEFAULT NULL COMMENT '访谈主题'
);

-- 受访者 (定性)
CREATE TABLE \`interviewees\` (
  \`interviewee_id\` VARCHAR(50) NOT NULL,
  \`name\` VARCHAR(100) DEFAULT NULL COMMENT '姓名',
  \`identity\` VARCHAR(50) DEFAULT NULL COMMENT '身份',
  \`county_id\` VARCHAR(50) DEFAULT NULL COMMENT '[FK]'
);

-- 调研者 (定性)
CREATE TABLE \`researchers\` (
  \`researcher_id\` VARCHAR(50) NOT NULL,
  \`name\` VARCHAR(100) DEFAULT NULL COMMENT '姓名',
  \`role\` VARCHAR(50) DEFAULT NULL COMMENT '角色'
);

-- 政策表
CREATE TABLE \`policies\` (
  \`policy_id\` VARCHAR(50) NOT NULL,
  \`policy_name\` VARCHAR(255) NOT NULL COMMENT '政策名称',
  \`policy_type\` VARCHAR(50) DEFAULT NULL COMMENT '政策类型',
  \`issue_date\` DATE DEFAULT NULL COMMENT '颁布日期'
);

DROP TABLE IF EXISTS  \`policy_resources \`;
CREATE TABLE  \`policy_resources \` (
   \`resource_id \` VARCHAR(50) NOT NULL COMMENT 'PolicyIndicatorID - 主键',
   \`policy_id \` VARCHAR(50) NOT NULL COMMENT 'PolicyID [FK]',
   \`indicator_name \` VARCHAR(100) DEFAULT NULL COMMENT '指标名称',
   \`category \` VARCHAR(50) DEFAULT NULL COMMENT '指标类别',
   \`description \` TEXT COMMENT '指标描述',
   \`unit \` VARCHAR(50) DEFAULT NULL COMMENT '计量单位',
   \`source \` VARCHAR(100) DEFAULT NULL COMMENT '数据来源',
   \`impact_level \` VARCHAR(50) DEFAULT NULL COMMENT '影响程度',
   \`related_field \` VARCHAR(100) DEFAULT NULL COMMENT '关联领域',
  PRIMARY KEY ( \`resource_id \`),
  INDEX  \`idx_category \` ( \`category \`),
  CONSTRAINT  \`fk_resource_policy \` FOREIGN KEY ( \`policy_id \`) REFERENCES  \`policies \` ( \`policy_id \`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='政策投入资源表';

-- ===============================
-- 访谈调研相关表
-- ===============================

DROP TABLE IF EXISTS  \`interviewees \`;
CREATE TABLE  \`interviewees \` (
   \`interviewee_id \` VARCHAR(50) NOT NULL COMMENT 'IntervieweeID',
   \`name \` VARCHAR(100) DEFAULT NULL COMMENT '姓名',
   \`unit \` VARCHAR(100) DEFAULT NULL COMMENT '单位',
   \`identity \` VARCHAR(50) DEFAULT NULL COMMENT '身份',
   \`county_id \` VARCHAR(50) DEFAULT NULL COMMENT 'CountyID [FK]',
  PRIMARY KEY ( \`interviewee_id \`),
  CONSTRAINT  \`fk_interviewee_county \` FOREIGN KEY ( \`county_id \`) REFERENCES  \`counties \` ( \`county_id \`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='受访者表';

DROP TABLE IF EXISTS  \`interview_events \`;
CREATE TABLE  \`interview_events \` (
   \`event_id \` VARCHAR(50) NOT NULL COMMENT 'EventID',
   \`location \` VARCHAR(255) DEFAULT NULL COMMENT '访谈地点',
   \`event_date \` DATE DEFAULT NULL COMMENT '访谈日期',
   \`topic \` VARCHAR(255) DEFAULT NULL COMMENT '访谈主题',
  PRIMARY KEY ( \`event_id \`),
  INDEX  \`idx_event_date \` ( \`event_date \`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='访谈事件表';

DROP TABLE IF EXISTS  \`interview_data \`;
CREATE TABLE  \`interview_data \` (
   \`data_id \` VARCHAR(50) NOT NULL COMMENT 'DataID',
   \`content \` LONGTEXT COMMENT '访谈内容',
   \`keywords \` VARCHAR(255) DEFAULT NULL COMMENT '关键词',
   \`experience_summary \` TEXT COMMENT '脱贫经验总结',
   \`event_id \` VARCHAR(50) NOT NULL COMMENT 'EventID [FK]',
  PRIMARY KEY ( \`data_id \`),
  CONSTRAINT  \`fk_data_event \` FOREIGN KEY ( \`event_id \`) REFERENCES  \`interview_events \` ( \`event_id \`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='访谈数据表';

DROP TABLE IF EXISTS  \`researchers \`;
CREATE TABLE  \`researchers \` (
   \`researcher_id \` VARCHAR(50) NOT NULL COMMENT 'ResearcherID',
   \`name \` VARCHAR(100) DEFAULT NULL COMMENT '姓名',
   \`unit \` VARCHAR(100) DEFAULT NULL COMMENT '单位',
   \`role \` VARCHAR(50) DEFAULT NULL COMMENT '角色',
  PRIMARY KEY ( \`researcher_id \`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='调研者表';

-- ===============================
-- 关联表（多对多关系）
-- ===============================

DROP TABLE IF EXISTS  \`rel_interviewee_event \`;
CREATE TABLE  \`rel_interviewee_event \` (
   \`interviewee_id \` VARCHAR(50) NOT NULL COMMENT 'IntervieweeID [FK]',
   \`event_id \` VARCHAR(50) NOT NULL COMMENT 'EventID [FK]',
   \`role \` VARCHAR(50) DEFAULT NULL COMMENT '参与角色',
  PRIMARY KEY ( \`interviewee_id \`,  \`event_id \`),
  CONSTRAINT  \`fk_rel_ie_interviewee \` FOREIGN KEY ( \`interviewee_id \`) REFERENCES  \`interviewees \` ( \`interviewee_id \`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT  \`fk_rel_ie_event \` FOREIGN KEY ( \`event_id \`) REFERENCES  \`interview_events \` ( \`event_id \`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='受访者与访谈事件关联表';

DROP TABLE IF EXISTS  \`rel_data_researcher \`;
CREATE TABLE  \`rel_data_researcher \` (
   \`data_id \` VARCHAR(50) NOT NULL COMMENT 'DataID [FK]',
   \`researcher_id \` VARCHAR(50) NOT NULL COMMENT 'ResearcherID [FK]',
   \`collection_role \` VARCHAR(50) DEFAULT NULL COMMENT '收集角色',
  PRIMARY KEY ( \`data_id \`,  \`researcher_id \`),
  CONSTRAINT  \`fk_rel_dr_data \` FOREIGN KEY ( \`data_id \`) REFERENCES  \`interview_data \` ( \`data_id \`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT  \`fk_rel_dr_researcher \` FOREIGN KEY ( \`researcher_id \`) REFERENCES  \`researchers \` ( \`researcher_id \`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='访谈数据与调研者关联表';

DROP TABLE IF EXISTS  \`rel_policy_county \`;
CREATE TABLE  \`rel_policy_county \` (
   \`policy_id \` VARCHAR(50) NOT NULL COMMENT 'PolicyID [FK]',
   \`county_id \` VARCHAR(50) NOT NULL COMMENT 'CountyID [FK]',
  PRIMARY KEY ( \`policy_id \`,  \`county_id \`),
  CONSTRAINT  \`fk_rpc_policy \` FOREIGN KEY ( \`policy_id \`) REFERENCES  \`policies \` ( \`policy_id \`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT  \`fk_rpc_county \` FOREIGN KEY ( \`county_id \`) REFERENCES  \`counties \` ( \`county_id \`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='政策与县关联表';

SET FOREIGN_KEY_CHECKS = 1;
${"```"}

### 任务:
根据用户查询，返回一个 JSON 对象，包含 'analysis' (分析) 和 'tables_needed' (所需表) 两个键。

### 规则:
1.  **分析 (analysis):** 详细说明为了回答问题，你需要哪些数据，以及这些数据在哪些表里。
2.  **所需表 (tables_needed):** 列出所有需要查询的表名。
3.  **定性数据:** 如果用户提到“访谈”、“经验”、“政策”或“原因”，你必须在计划中包含 \`interview_data\`, \`policies\` 等相关定性表。
4.  **权限 (TODO):** (这是一个占位符，未来可以实现) 假设用户是 'admin'，可以访问所有表。

### 示例:
用户查询: "2023年兴和县的GDP和粮食产量分别是多少？"
你的输出:
{
  "analysis": "我需要查询兴和县的 'county_id'，然后用这个ID去查询 'economic_indicators' 表获取 'gdp'，以及 'agriculture_indicators' 表获取 'grain_yield'。所有查询都应限定在 2023 年。",
  "tables_needed": ["counties", "economic_indicators", "agriculture_indicators"]
}
`;

// =================================================================
// 2. 新的“SQL生成”提示词
// =================================================================
const SQL_GENERATOR_SYSTEM_PROMPT = `你是一名 MySQL 专家。你的任务是根据“查询计划”和“数据库结构”，生成一个单一、高效、可执行的 \`SELECT\` 语句来回答用户最初的问题。

### 数据库结构:
### 数据库结构 (Schema):
${"```sql"}
-- 县基础信息表
CREATE TABLE \`counties\` (
  \`county_id\` VARCHAR(50) NOT NULL COMMENT 'CountyID - 县唯一标识',
  \`county_name\` VARCHAR(100) NOT NULL COMMENT 'CountyName - 县名',
  \`city\` VARCHAR(50) DEFAULT NULL COMMENT '所属市',
  \`province\` VARCHAR(50) DEFAULT NULL COMMENT '所属省',
  \`is_poverty_alleviated\` TINYINT(1) DEFAULT 0 COMMENT '是否脱贫',
  \`alleviation_year\` INT DEFAULT NULL COMMENT '脱贫年份'
);

-- 经济指标
CREATE TABLE \`economic_indicators\` (
  \`county_id\` VARCHAR(50) NOT NULL COMMENT '[FK]',
  \`year\` INT NOT NULL COMMENT '年份',
  \`gdp\` DECIMAL(20,4) DEFAULT NULL COMMENT '地区生产总值(亿元)',
  \`public_budget_income\` DECIMAL(20,4) DEFAULT NULL COMMENT '一般公共预算收入(万元)',
  \`disp_income_rural\` DECIMAL(20,4) DEFAULT NULL COMMENT '农村牧区常住居民人均可支配收入(元)'
);

-- 农业指标
CREATE TABLE \`agriculture_indicators\` (
  \`county_id\` VARCHAR(50) NOT NULL COMMENT '[FK]',
  \`year\` INT NOT NULL COMMENT '年份',
  \`arable_land\` DECIMAL(20,4) DEFAULT NULL COMMENT '耕地面积(公顷)',
  \`grain_yield\` DECIMAL(20,4) DEFAULT NULL COMMENT '粮食产量(吨)'
);

-- 访谈数据 (定性)
CREATE TABLE \`interview_data\` (
  \`data_id\` VARCHAR(50) NOT NULL,
  \`content\` LONGTEXT COMMENT '访谈内容',
  \`keywords\` VARCHAR(255) DEFAULT NULL COMMENT '关键词',
  \`experience_summary\` TEXT COMMENT '脱贫经验总结',
  \`event_id\` VARCHAR(50) NOT NULL COMMENT '[FK]'
);

-- 访谈事件 (定性)
CREATE TABLE \`interview_events\` (
  \`event_id\` VARCHAR(50) NOT NULL,
  \`location\` VARCHAR(255) DEFAULT NULL COMMENT '访谈地点',
  \`event_date\` DATE DEFAULT NULL COMMENT '访谈日期',
  \`topic\` VARCHAR(255) DEFAULT NULL COMMENT '访谈主题'
);

-- 受访者 (定性)
CREATE TABLE \`interviewees\` (
  \`interviewee_id\` VARCHAR(50) NOT NULL,
  \`name\` VARCHAR(100) DEFAULT NULL COMMENT '姓名',
  \`identity\` VARCHAR(50) DEFAULT NULL COMMENT '身份',
  \`county_id\` VARCHAR(50) DEFAULT NULL COMMENT '[FK]'
);

-- 调研者 (定性)
CREATE TABLE \`researchers\` (
  \`researcher_id\` VARCHAR(50) NOT NULL,
  \`name\` VARCHAR(100) DEFAULT NULL COMMENT '姓名',
  \`role\` VARCHAR(50) DEFAULT NULL COMMENT '角色'
);

-- 政策表
CREATE TABLE \`policies\` (
  \`policy_id\` VARCHAR(50) NOT NULL,
  \`policy_name\` VARCHAR(255) NOT NULL COMMENT '政策名称',
  \`policy_type\` VARCHAR(50) DEFAULT NULL COMMENT '政策类型',
  \`issue_date\` DATE DEFAULT NULL COMMENT '颁布日期'
);

DROP TABLE IF EXISTS  \`policy_resources \`;
CREATE TABLE  \`policy_resources \` (
   \`resource_id \` VARCHAR(50) NOT NULL COMMENT 'PolicyIndicatorID - 主键',
   \`policy_id \` VARCHAR(50) NOT NULL COMMENT 'PolicyID [FK]',
   \`indicator_name \` VARCHAR(100) DEFAULT NULL COMMENT '指标名称',
   \`category \` VARCHAR(50) DEFAULT NULL COMMENT '指标类别',
   \`description \` TEXT COMMENT '指标描述',
   \`unit \` VARCHAR(50) DEFAULT NULL COMMENT '计量单位',
   \`source \` VARCHAR(100) DEFAULT NULL COMMENT '数据来源',
   \`impact_level \` VARCHAR(50) DEFAULT NULL COMMENT '影响程度',
   \`related_field \` VARCHAR(100) DEFAULT NULL COMMENT '关联领域',
  PRIMARY KEY ( \`resource_id \`),
  INDEX  \`idx_category \` ( \`category \`),
  CONSTRAINT  \`fk_resource_policy \` FOREIGN KEY ( \`policy_id \`) REFERENCES  \`policies \` ( \`policy_id \`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='政策投入资源表';

-- ===============================
-- 访谈调研相关表
-- ===============================

DROP TABLE IF EXISTS  \`interviewees \`;
CREATE TABLE  \`interviewees \` (
   \`interviewee_id \` VARCHAR(50) NOT NULL COMMENT 'IntervieweeID',
   \`name \` VARCHAR(100) DEFAULT NULL COMMENT '姓名',
   \`unit \` VARCHAR(100) DEFAULT NULL COMMENT '单位',
   \`identity \` VARCHAR(50) DEFAULT NULL COMMENT '身份',
   \`county_id \` VARCHAR(50) DEFAULT NULL COMMENT 'CountyID [FK]',
  PRIMARY KEY ( \`interviewee_id \`),
  CONSTRAINT  \`fk_interviewee_county \` FOREIGN KEY ( \`county_id \`) REFERENCES  \`counties \` ( \`county_id \`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='受访者表';

DROP TABLE IF EXISTS  \`interview_events \`;
CREATE TABLE  \`interview_events \` (
   \`event_id \` VARCHAR(50) NOT NULL COMMENT 'EventID',
   \`location \` VARCHAR(255) DEFAULT NULL COMMENT '访谈地点',
   \`event_date \` DATE DEFAULT NULL COMMENT '访谈日期',
   \`topic \` VARCHAR(255) DEFAULT NULL COMMENT '访谈主题',
  PRIMARY KEY ( \`event_id \`),
  INDEX  \`idx_event_date \` ( \`event_date \`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='访谈事件表';

DROP TABLE IF EXISTS  \`interview_data \`;
CREATE TABLE  \`interview_data \` (
   \`data_id \` VARCHAR(50) NOT NULL COMMENT 'DataID',
   \`content \` LONGTEXT COMMENT '访谈内容',
   \`keywords \` VARCHAR(255) DEFAULT NULL COMMENT '关键词',
   \`experience_summary \` TEXT COMMENT '脱贫经验总结',
   \`event_id \` VARCHAR(50) NOT NULL COMMENT 'EventID [FK]',
  PRIMARY KEY ( \`data_id \`),
  CONSTRAINT  \`fk_data_event \` FOREIGN KEY ( \`event_id \`) REFERENCES  \`interview_events \` ( \`event_id \`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='访谈数据表';

DROP TABLE IF EXISTS  \`researchers \`;
CREATE TABLE  \`researchers \` (
   \`researcher_id \` VARCHAR(50) NOT NULL COMMENT 'ResearcherID',
   \`name \` VARCHAR(100) DEFAULT NULL COMMENT '姓名',
   \`unit \` VARCHAR(100) DEFAULT NULL COMMENT '单位',
   \`role \` VARCHAR(50) DEFAULT NULL COMMENT '角色',
  PRIMARY KEY ( \`researcher_id \`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='调研者表';

-- ===============================
-- 关联表（多对多关系）
-- ===============================

DROP TABLE IF EXISTS  \`rel_interviewee_event \`;
CREATE TABLE  \`rel_interviewee_event \` (
   \`interviewee_id \` VARCHAR(50) NOT NULL COMMENT 'IntervieweeID [FK]',
   \`event_id \` VARCHAR(50) NOT NULL COMMENT 'EventID [FK]',
   \`role \` VARCHAR(50) DEFAULT NULL COMMENT '参与角色',
  PRIMARY KEY ( \`interviewee_id \`,  \`event_id \`),
  CONSTRAINT  \`fk_rel_ie_interviewee \` FOREIGN KEY ( \`interviewee_id \`) REFERENCES  \`interviewees \` ( \`interviewee_id \`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT  \`fk_rel_ie_event \` FOREIGN KEY ( \`event_id \`) REFERENCES  \`interview_events \` ( \`event_id \`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='受访者与访谈事件关联表';

DROP TABLE IF EXISTS  \`rel_data_researcher \`;
CREATE TABLE  \`rel_data_researcher \` (
   \`data_id \` VARCHAR(50) NOT NULL COMMENT 'DataID [FK]',
   \`researcher_id \` VARCHAR(50) NOT NULL COMMENT 'ResearcherID [FK]',
   \`collection_role \` VARCHAR(50) DEFAULT NULL COMMENT '收集角色',
  PRIMARY KEY ( \`data_id \`,  \`researcher_id \`),
  CONSTRAINT  \`fk_rel_dr_data \` FOREIGN KEY ( \`data_id \`) REFERENCES  \`interview_data \` ( \`data_id \`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT  \`fk_rel_dr_researcher \` FOREIGN KEY ( \`researcher_id \`) REFERENCES  \`researchers \` ( \`researcher_id \`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='访谈数据与调研者关联表';

DROP TABLE IF EXISTS  \`rel_policy_county \`;
CREATE TABLE  \`rel_policy_county \` (
   \`policy_id \` VARCHAR(50) NOT NULL COMMENT 'PolicyID [FK]',
   \`county_id \` VARCHAR(50) NOT NULL COMMENT 'CountyID [FK]',
  PRIMARY KEY ( \`policy_id \`,  \`county_id \`),
  CONSTRAINT  \`fk_rpc_policy \` FOREIGN KEY ( \`policy_id \`) REFERENCES  \`policies \` ( \`policy_id \`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT  \`fk_rpc_county \` FOREIGN KEY ( \`county_id \`) REFERENCES  \`counties \` ( \`county_id \`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='政策与县关联表';

SET FOREIGN_KEY_CHECKS = 1;
${"```"}

### 规则:
1.  **只返回SQL:** 你的回答必须以 \`SELECT\` 开头，不要包含任何解释、Markdown标记 (\`\`\`sql\`)。
2.  **JOIN**: 必须正确使用 \`JOIN\`。所有指标表都通过 \`county_id\` 关联 \`counties\` 表。
3.  **别名**: 必须使用表别名 (如 t1, t2) 来提高可读性。
4.  **省份**: 所有查询 \`counties\` 表时，必须默认加上 \`WHERE t1.province = '内蒙古自治区'\`。
5.  **定性查询**: 如果计划包含 \`interview_data\`，你需要 JOIN \`interview_events\`, \`interviewees\`, \`researchers\` 等表来获取完整的访谈信息 (内容, 主题, 受访者, 调研员, 日期)。
6.  **安全**: 绝对禁止 \`DROP\`, \`DELETE\`, \`UPDATE\`, \`INSERT\`。`;

// =================================================================
// 3. 新的“报告生成”提示词
// =================================================================
const REPORT_GENERATOR_SYSTEM_PROMPT = `你是一名数据分析专家。请根据用户的“原始查询”和 JSON 格式的“查询结果”，生成一份简洁、易懂、专业的分析报告 (使用 Markdown 格式)。

### 规则:
1.  **突出重点:** 直接回答用户的问题。
2.  **引用定性数据:** 如果“查询结果”中包含访谈内容 (如 \`content\`, \`experience_summary\`)，你必须在报告中引用这些内容作为例证或分析。
3.  **归因:** 当引用访谈时，必须注明“受访者”、“调研员”和“日期”（如果数据中有）。
4.  **格式:** 使用 Markdown (如加粗、列表) 来美化报告。`;

// =================================================================
// 核心服务类
// =================================================================
class LLMService {

    // 统一的 LLM 调用函数
    async callLLM(systemPrompt, userPrompt) {
        console.log("=== 调用 LLM ===");
        console.log("System Prompt (head):", systemPrompt.substring(0, 100) + "...");

        const completion = await client.chat.completions.create({
            model: "qwen3-max", // 或你选择的模型
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ]
        });

        const content = completion.choices[0].message.content.trim();
        console.log("LLM 响应:", content);
        return content;
    }

    // 执行 SQL (保持不变)
    async executeQuery(sql) {
        try {
            console.log("=== 正在执行SQL ===");
            console.log("待执行SQL:", sql);
            if (!sql.trim().toLowerCase().startsWith('select')) {
                console.error("SQL 安全检查失败: 非 SELECT 语句");
                throw new Error("无效的查询操作。只允许执行 SELECT 语句。");
            }
            const [rows] = await pool.query(sql);
            console.log("数据库查询成功, 行数:", rows.length);
            return { data: rows };
        } catch (error) {
            console.error("=== SQL执行失败 ===", error.message);
            return { error: `数据库查询失败: ${error.sqlMessage || error.message}` };
        }
    }

    // =================================================================
    // 新的“三阶段”处理流程
    // =================================================================
    async processQuery(userQuery) {
        let plan = {};
        let sql = "";
        let dbResult = {};
        let report = "";

        try {
            // --- 阶段 1: AI 生成查询计划 ---
            console.log("--- 阶段 1: 生成规划 ---");
            const planRaw = await this.callLLM(PLANNER_SYSTEM_PROMPT, userQuery);
            try {
                // 解析 AI 返回的 JSON 计划
                plan = JSON.parse(planRaw.replace(/```json/g, '').replace(/```/g, ''));
            } catch (e) {
                console.error("解析 Plan JSON 失败:", e.message);
                throw new Error("AI 规划步骤返回了无效的格式。");
            }

            // --- 阶段 2: AI 根据计划生成 SQL ---
            console.log("--- 阶段 2: 生成 SQL ---");
            const sqlPrompt = `原始查询: "${userQuery}"\n\n查询计划: ${JSON.stringify(plan)}`;
            // 注意：这里我们把完整的 Schema (在系统提示词中) 和刚生成的 Plan (在用户提示中) 都发给了 SQL 生成器
            sql = await this.callLLM(SQL_GENERATOR_SYSTEM_PROMPT.replace("(结构同上...)", PLANNER_SYSTEM_PROMPT), sqlPrompt);

            // --- 阶段 3: 执行 SQL ---
            console.log("--- 阶段 3: 执行 SQL ---");
            dbResult = await this.executeQuery(sql);

            // 检查 SQL 执行是否出错
            if (dbResult.error) {
                report = `数据库执行出错：\n${dbResult.error}`;
            } else {
                // --- 阶段 4: AI 总结报告 ---
                console.log("--- 阶段 4: 生成报告 ---");
                const reportPrompt = `原始查询: "${userQuery}"\n\n查询结果 (JSON): ${JSON.stringify(dbResult.data)}`;
                report = await this.callLLM(REPORT_GENERATOR_SYSTEM_PROMPT, reportPrompt);
            }

            // --- 阶段 5: 返回所有步骤的结果 ---
            return {
                plan: plan.analysis, // 规划文本
                sql: sql, // SQL 语句
                result: dbResult.data || [], // 表格数据
                report: report // 最终报告
            };

        } catch (error) {
            console.error("processQuery 核心错误:", error.message);
            // 将错误信息打包返回
            return {
                plan: plan.analysis || "规划失败",
                sql: sql || "SQL生成失败",
                result: [],
                report: `查询处理失败：${error.message}`
            };
        }
    }
}

module.exports = new LLMService();