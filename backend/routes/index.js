const express = require('express')
const router = express.Router()
const dataController = require('../controllers/dataController')
const analysisController = require('../controllers/analysisController')
const nlpController = require('../controllers/nlpController')
const authController = require('../controllers/authController')
const authMiddleware = require('../middleware/auth')

router.get('/data/summary', authMiddleware, dataController.getSummary)
router.post('/analysis/report', authMiddleware, analysisController.generateReport)
router.post('/nlp/query', authMiddleware, nlpController.query)

// 认证相关路由（公开访问）
router.post('/auth/login', authController.login)
router.post('/auth/register', authController.register)
router.post('/auth/logout', authController.logout)

module.exports = router