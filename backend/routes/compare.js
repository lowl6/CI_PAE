const express = require('express')
const router = express.Router()
const compareController = require('../controllers/compareController')

// 当 app.js 将 /compare 请求转到这里时，
// 这个路由将匹配路径的剩余部分 /data
// 最终匹配到 GET /compare/data
router.get('/data', compareController.getComparisonData)

module.exports = router