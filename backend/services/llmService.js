require('dotenv').config();
const { OpenAI } = require('openai');
// 导入数据库连接池
const pool = require('../config/db');

// 初始化客户端
const client = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
});

// =================================================================
// 关键更新：使用你的真实数据库表结构
// =================================================================
const SQL_GENERATION_SYSTEM_PROMPT = `你是一名 MySQL 专家，只返回可执行的、格式化良好的 MySQL 语句，不要任何解释。
你的任务是根据用户的自然语言问题，查询一个关于“内蒙古自治区贫困县”的数据库。

数据库结构如下 (只使用这些表):

-- 县基础信息表
CREATE TABLE \`counties\` (
  \`county_id\` VARCHAR(50) NOT NULL COMMENT 'CountyID - 县唯一标识',
  \`county_name\` VARCHAR(100) NOT NULL COMMENT 'CountyName - 县名',
  \`city\` VARCHAR(50) DEFAULT NULL COMMENT '所属市',
  \`province\` VARCHAR(50) DEFAULT NULL COMMENT '所属省',
  \`is_poverty_alleviated\` TINYINT(1) DEFAULT 0 COMMENT '是否脱贫 (0:否, 1:是)',
  \`alleviation_year\` INT DEFAULT NULL COMMENT '脱贫年份',
  PRIMARY KEY (\`county_id\`)
);

-- 经济指标表
CREATE TABLE \`economic_indicators\` (
  \`county_id\` VARCHAR(50) NOT NULL COMMENT 'CountyID [FK]',
  \`year\` INT NOT NULL COMMENT 'Year - 年份',
  \`gdp\` DECIMAL(20,4) DEFAULT NULL COMMENT '地区生产总值(亿元)',
  \`public_budget_income\` DECIMAL(20,4) DEFAULT NULL COMMENT '一般公共预算收入(万元)',
  \`disp_income_total\` DECIMAL(20,4) DEFAULT NULL COMMENT '全体居民人均可支配收入(元)',
  \`disp_income_rural\` DECIMAL(20,4) DEFAULT NULL COMMENT '农村牧区常住居民人均可支配收入(元)',
  PRIMARY KEY (\`county_id\`, \`year\`)
);

-- 人口指标表
CREATE TABLE \`population_indicators\` (
  \`county_id\` VARCHAR(50) NOT NULL COMMENT 'CountyID [FK]',
  \`year\` INT NOT NULL COMMENT 'Year',
  \`land_area\` DECIMAL(20,4) DEFAULT NULL COMMENT '行政区域土地面积(平方公里)',
  \`households\` INT DEFAULT NULL COMMENT '户籍户数(户)',
  \`registered_pop\` DECIMAL(20,4) DEFAULT NULL COMMENT '户籍人口(万人)',
  PRIMARY KEY (\`county_id\`, \`year\`)
);

-- 农业指标表
CREATE TABLE \`agriculture_indicators\` (
  \`county_id\` VARCHAR(50) NOT NULL COMMENT 'CountyID [FK]',
  \`year\` INT NOT NULL COMMENT 'Year',
  \`arable_land\` DECIMAL(20,4) DEFAULT NULL COMMENT '耕地面积(公顷)',
  \`grain_yield\` DECIMAL(20,4) DEFAULT NULL COMMENT '粮食产量(吨)',
  \`oil_yield\` DECIMAL(20,4) DEFAULT NULL COMMENT '油料产量(吨)',
  PRIMARY KEY (\`county_id\`, \`year\`)
);

-- 工业贸易指标表
CREATE TABLE \`industry_trade_indicators\` (
  \`county_id\` VARCHAR(50) NOT NULL COMMENT 'CountyID [FK]',
  \`year\` INT NOT NULL COMMENT 'Year',
  \`industrial_enterprises\` INT DEFAULT NULL COMMENT '规模以上工业企业单位数(个)',
  \`retail_sales\` DECIMAL(20,4) DEFAULT NULL COMMENT '社会消费品零售总额(万元)',
  PRIMARY KEY (\`county_id\`, \`year\`)
);

-- 基础设施指标表
CREATE TABLE \`infrastructure_indicators\` (
  \`county_id\` VARCHAR(50) NOT NULL COMMENT 'CountyID [FK]',
  \`year\` INT NOT NULL COMMENT 'Year',
  \`road_mileage\` DECIMAL(20,4) DEFAULT NULL COMMENT '公路里程(公里)',
  \`mobile_users\` INT DEFAULT NULL COMMENT '移动电话用户(户)',
  PRIMARY KEY (\`county_id\`, \`year\`)
);

-- (已省略其他指标表以简化提示词)

查询规则 (必须遵守):
1.  **强制JOIN**: 几乎所有查询都需要将 \`counties\` 表和某个指标表 (如 \`economic_indicators\`) 连接起来才能获取县名。
2.  **JOIN 键**: 必须使用 \`t1.county_id = t2.county_id\`。如果查询涉及年份，还需 \`t1.year = t2.year\` (如果指标表有 year)。
3.  **表连接**: 当需要县名(\`county_name\`)和指标(如 \`gdp\`)时，必须 JOIN \`counties\` AS t1 和 \`economic_indicators\` AS t2。
4.  **省份**: 用户的查询都是关于 '内蒙古自治区' 的，在查询 \`counties\` 表时，必须加上 \`WHERE province = '内蒙古自治区'\`。
5.  **字段名**: 严格使用 \`\` 符号包围所有表名和字段名，例如 \`SELECT t1.\`county_name\`, t2.\`gdp\` FROM \`counties\` AS t1 JOIN \`economic_indicators\` AS t2 ON t1.\`county_id\` = t2.\`county_id\` WHERE t1.\`province\` = '内蒙古自治区' AND t2.\`year\` = 2023\`。
6.  **安全**: 绝对不允许生成 \`DROP\`, \`DELETE\`, \`UPDATE\`, \`INSERT\` 等修改性语句。只允许 \`SELECT\`。
7.  **简洁**: 只返回SQL语句。`;

// 系统提示词 - 报告生成
const REPORT_GENERATION_SYSTEM_PROMPT = `你是一名数据分析专家，需要基于提供的查询结果，生成简洁易懂的分析报告。
要求：
1. 语言简洁明了，不超过300字
2. 突出关键数据和趋势
3. 使用自然流畅的中文表达`;

class LLMService {
    // 1. 生成SQL查询
    async generateSQL(userQuery) {
        try {
            console.log("=== 开始生成SQL ===");
            console.log("用户查询:", userQuery);
            console.log("API Key是否存在:", !!process.env.DASHSCOPE_API_KEY);
            console.log("调用模型:", "qwen3-max");

            const completion = await client.chat.completions.create({
                model: "qwen3-max",
                messages: [
                    { role: "system", content: SQL_GENERATION_SYSTEM_PROMPT },
                    { role: "user", content: userQuery }
                ]
            });

            console.log("大模型响应成功");
            // 移除SQL语句前后的 ```sql 和 ```
            const sql = completion.choices[0].message.content
                .replace(/```sql/g, '')
                .replace(/```/g, '')
                .trim();
            console.log("生成的SQL:", sql);
            return sql;
        } catch (error) {
            console.error("=== SQL生成失败 ===", error.message);
            throw new Error("生成查询语句失败");
        }
    }

    // 2. 执行数据库查询 (已替换为真实数据库)
    async executeQuery(sql) {
        try {
            console.log("=== 正在执行SQL ===");
            console.log("待执行SQL:", sql);

            // 安全检查：防止执行修改性操作
            if (!sql.trim().toLowerCase().startsWith('select')) {
                console.error("SQL 安全检查失败: 非 SELECT 语句");
                throw new Error("无效的查询操作。只允许执行 SELECT 语句。");
            }

            // 使用导入的连接池执行查询
            // 假设 db.js 导出的 pool 已正确配置了 database: 'ci_pae'
            // 注意：你的 db.js 文件必须在 pool 创建时指定 database: process.env.DB_NAME
            const [rows] = await pool.query(sql);

            console.log("数据库查询成功, 行数:", rows.length);
            return { data: rows }; // 返回查询到的数据

        } catch (error) {
            console.error("=== SQL执行失败 ===", error.message);
            // 向前端返回一个结构化的错误
            return { error: `数据库查询失败: ${error.sqlMessage || error.message}` };
        }
    }

    // 3. 生成分析报告
    async generateReport(queryResult, userQuery) {
        try {
            console.log("=== 开始生成报告 ===");
            const completion = await client.chat.completions.create({
                model: "qwen3-max",
                messages: [
                    { role: "system", content: REPORT_GENERATION_SYSTEM_PROMPT },
                    { role: "user", content: `用户查询: ${userQuery}\n查询结果(JSON格式): ${JSON.stringify(queryResult)}` }
                ]
            });
            console.log("报告生成成功");
            return completion.choices[0].message.content;
        } catch (error) {
            console.error("报告生成失败:", error);
            throw new Error("生成分析报告失败");
        }
    }

    // 4. 处理完整查询流程 (已疏通)
    async processQuery(userQuery) {
        try {
            // 第1步：生成SQL
            const sql = await this.generateSQL(userQuery);

            // 第2步：执行SQL
            const dbResult = await this.executeQuery(sql);

            // 第3步：检查SQL执行是否出错
            if (dbResult.error) {
                // 如果数据库执行失败，直接返回错误报告
                return {
                    sql: sql,
                    result: [], // 返回空结果
                    report: `数据库执行出错：\n${dbResult.error}`
                };
            }

            // 第4步：生成报告
            const report = await this.generateReport(dbResult.data, userQuery);

            // 第5步：返回完整结果
            return {
                sql: sql,
                result: dbResult.data,
                report: report
            };

        } catch (error) {
            console.error("processQuery 核心错误:", error.message);
            throw new Error(`查询处理失败：${error.message}`);
        }
    }
}

module.exports = new LLMService();