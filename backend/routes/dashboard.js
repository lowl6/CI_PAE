const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// 仪表盘数据路由（全部公开访问）
router.get('/indicators', dashboardController.getDashboardData);
router.get('/poor-counties', dashboardController.getPoorCountyData);
router.get('/cities', dashboardController.getCityList);
router.get('/overview', dashboardController.getStatisticsOverview);

module.exports = router;