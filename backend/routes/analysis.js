const express = require('express')
const router = express.Router()
const analysisController = require('../controllers/analysisController')
const authMiddleware = require('../middleware/auth') // <--- ！！就是这一行，请确保它存在！！

// 当 app.js 将 /analysis 请求转到这里时，
// 这些路由将匹配路径的剩余部分，例如 /all-counties

// 分析相关API
router.post('/report', authMiddleware, analysisController.generateReport) // <--- 这一行需要 authMiddleware
router.get('/cities', analysisController.getCities);
router.get('/counties', analysisController.getCounties);
router.get('/all-counties', analysisController.getAllCounties);
router.get('/indicators/tree', analysisController.getIndicatorsTree);
router.get('/policy-types', analysisController.getPolicyTypes);
router.post('/data', analysisController.getAnalysisData);
router.get('/export/csv', analysisController.exportCsv);
router.get('/dynamic-policy-types', analysisController.getDynamicPolicyTypes);

module.exports = router