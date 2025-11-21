// 政策路由
const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policyController');

// 统计信息（放在前面避免被 :id 路由捕获）
router.get('/stats', policyController.getPolicyStats);

// 城市列表
router.get('/cities', policyController.getCities);

// 访谈完整内容
router.get('/interviews/:dataId', policyController.getInterviewFullContent);

// 政策列表
router.get('/', policyController.getPolicies);

// 政策详情
router.get('/:id', policyController.getPolicyById);

module.exports = router;
