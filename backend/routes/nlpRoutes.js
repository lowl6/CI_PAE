const express = require('express');
const router = express.Router();
const llmService = require('../services/llmService');

router.post('/query', async (req, res) => {
    try {
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

        const result = await llmService.processQuery(question);
        res.json({ ok: true, data: result });
    } catch (error) {
        res.json({ ok: false, error: error.message });
    }
});

module.exports = router;