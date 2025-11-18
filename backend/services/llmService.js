require('dotenv').config();
const { OpenAI } = require('openai');

// 初始化客户端
const client = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
});

// 系统提示词 - SQL生成
const SQL_GENERATION_SYSTEM_PROMPT = `你是一名 MySQL 专家，只返回可执行的 SQL 语句，不要任何解释。
数据库结构如下：
CREATE TABLE orders (
id INT PRIMARY KEY AUTO_INCREMENT,
user_id INT NOT NULL,
amount DECIMAL(10,2) NOT NULL,
status VARCHAR(20) NOT NULL,
create_time DATETIME DEFAULT NOW());
强制规则：① 凡是提到‘大于’、‘多于’、‘超过’、‘高于’必须用 > ；② 凡是提到‘小于’、‘少于’、‘低于’必须用 <`;

// 系统提示词 - 报告生成
const REPORT_GENERATION_SYSTEM_PROMPT = `你是一名数据分析专家，需要基于提供的查询结果，生成简洁易懂的分析报告。
要求：
1. 语言简洁明了，不超过300字
2. 突出关键数据和趋势
3. 使用自然流畅的中文表达`;

class LLMService {
    // 生成SQL查询
    async generateSQL(userQuery) {
        try {
            console.log("=== 开始生成SQL ===");
            console.log("用户查询:", userQuery);
            console.log("API Key是否存在:", !!process.env.DASHSCOPE_API_KEY); // 打印密钥是否配置
            console.log("调用模型:", "qwen3-max");

            const completion = await client.chat.completions.create({
                model: "qwen3-max",
                messages: [
                    { role: "system", content: SQL_GENERATION_SYSTEM_PROMPT },
                    { role: "user", content: userQuery }
                ]
            });

            console.log("大模型响应成功");
            const sql = completion.choices[0].message.content.trim();
            console.log("生成的SQL:", sql);
            return sql;
        } catch (error) {
            console.error("=== SQL生成失败（详细错误）===");
            console.error("错误类型:", error.name);
            console.error("错误信息:", error.message);
            console.error("错误堆栈:", error.stack);
            if (error.response) {
                console.error("响应状态码:", error.response.status);
                console.error("响应数据:", error.response.data);
            }
            throw new Error("生成查询语句失败");
        }
    }
    // 执行数据库查询（这里用模拟数据，实际项目中替换为真实数据库查询）
    // 执行数据库查询（修改后）
    async executeQuery(sql) {
        try {
            console.log("待执行SQL:", sql);

            // 无实际数据库时，返回模拟警告信息
            return {
                warning: "未配置实际数据库，以下为模拟结果",
                mockData: [
                    { id: 1, user_id: 101, amount: 350.00, status: 'completed', create_time: '2023-10-01' },
                    { id: 2, user_id: 102, amount: 450.00, status: 'completed', create_time: '2023-10-05' }
                ]
            };
        } catch (error) {
            console.error("查询执行错误:", error);
            // 不抛出错误，仅返回错误信息
            return { error: "数据库查询失败: " + error.message };
        }
    }

    // 生成分析报告
    async generateReport(queryResult, userQuery) {
        try {
            const completion = await client.chat.completions.create({
                model: "qwen3-max",
                messages: [
                    { role: "system", content: REPORT_GENERATION_SYSTEM_PROMPT },
                    { role: "user", content: `用户查询: ${userQuery}\n查询结果: ${JSON.stringify(queryResult)}` }
                ]
            });
            return completion.choices[0].message.content;
        } catch (error) {
            console.error("报告生成失败:", error);
            throw new Error("生成分析报告失败");
        }
    }

    // 处理完整查询流程
    // 处理完整查询流程（修改后）
    async processQuery(userQuery) {
        try {
            // 只执行第一步：生成SQL
            const sql = await this.generateSQL(userQuery);

            // 直接返回SQL，跳过后续步骤
            return {
                sql: sql,
                result: { message: "未连接数据库，仅展示生成的SQL" },
                report: `已为您生成查询SQL：\n${sql}\n\n（提示：当前未配置实际数据库，无法执行查询）`
            };
        } catch (error) {
            console.error("核心错误：", error); // 打印详细错误
            throw new Error(`查询失败：${error.message}`); // 把真实错误返回给前端
        }
    }
}

module.exports = new LLMService();