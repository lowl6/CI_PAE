const express = require('express');
const router = express.Router();
const llmService = require('../services/llmService');
const authMiddleware = require('../middleware/auth');

router.post('/query', async (req, res) => {
    try {
        // 手动解析 token 以获取角色，如果失败则默认为 'user'
        let role = 'user';
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
                if (payload && payload.role) role = payload.role;
            } catch (e) {}
        }

        // 打印后端接收的请求
        console.log("=== 后端接收请求 ===");
        console.log("请求路径:", req.path);
        console.log("请求方法:", req.method);
        console.log("请求体:", req.body);
        console.log("请求头:", req.headers['content-type']);

        const { question } = req.body;
        if (!question) {
            return res.json({ ok: false, error: "请输入查询问题" });
        }

        const result = await llmService.processQuery(question, role);
        res.json({ ok: true, data: result });
    } catch (error) {
        res.json({ ok: false, error: error.message });
    }
});

module.exports = router;