const express = require('express')
const router = express.Router()
const dataController = require('../controllers/dataController')
const analysisController = require('../controllers/analysisController')
const nlpController = require('../controllers/nlpController')
const authController = require('../controllers/authController')
const authMiddleware = require('../middleware/auth')
const policyRoutes = require('./policy')
// const compareController = require('../controllers/compareController') // <--- 1. 这行可以删了
// 导入仪表盘路由
const dashboardRoutes = require('./dashboard')

// 认证相关路由（公开访问）
router.post('/auth/login', authController.login)
router.post('/auth/register', authController.register)
router.post('/auth/logout', authController.logout)

// 需要认证的路由
router.get('/data/summary', authMiddleware, dataController.getSummary)
router.post('/analysis/report', authMiddleware, analysisController.generateReport)
router.post('/nlp/query', authMiddleware, nlpController.query)

// 政策相关API（公开访问）
router.use('/policies', policyRoutes)
// 仪表盘相关API（公开访问，因为前端没有传token）
router.use('/dashboard', dashboardRoutes)

// 分析相关API（公开访问,因为前端没有传token）
router.get('/analysis/cities', analysisController.getCities);
router.get('/analysis/counties', analysisController.getCounties);
router.get('/analysis/all-counties', analysisController.getAllCounties);
router.get('/analysis/indicators/tree', analysisController.getIndicatorsTree);
router.get('/analysis/policy-types', analysisController.getPolicyTypes);
router.post('/analysis/data', analysisController.getAnalysisData);
router.get('/analysis/export/csv', analysisController.exportCsv);

// 保留旧路径兼容（可选）
router.get('/meta/cities', analysisController.getCities);
router.get('/meta/counties', analysisController.getCounties);
router.get('/meta/policy-types', analysisController.getPolicyTypes);
// router.get('/compare/data', compareController.getComparisonData) // <--- 2. 删除这一行

module.exports = router