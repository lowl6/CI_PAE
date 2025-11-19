// routes/analysisRoutes.js
const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');

// 获取内蒙古的城市列表
router.get('/cities', analysisController.getCities);

// 获取县区列表
router.get('/counties', analysisController.getCounties);

// 获取指标树
router.get('/indicators/tree', analysisController.getIndicatorsTree);

// 获取政策类型
router.get('/policy-types', analysisController.getPolicyTypes);

// 获取分析数据
router.post('/data', analysisController.getAnalysisData);

// 导出CSV
router.get('/export/csv', analysisController.exportCsv);

module.exports = router;