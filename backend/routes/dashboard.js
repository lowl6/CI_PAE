const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// 仪表盘数据路由（全部公开访问）
router.get('/indicators', dashboardController.getDashboardData);
router.get('/poor-counties', dashboardController.getPoorCountyData);
router.get('/cities', dashboardController.getCityList);
router.get('/overview', dashboardController.getStatisticsOverview);
router.get('/city/:cityName', dashboardController.getCityDetail);           // 获取特定盟市详情
router.get('/cities/summary', dashboardController.getCitiesSummary);          // 获取所有盟市汇总

module.exports = router;