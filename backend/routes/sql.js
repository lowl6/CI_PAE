const express = require('express');
const router = express.Router();
const sqlController = require('../controllers/sqlController');

// 路由前缀: /api/sql

// 执行 SQL 查询
router.post('/execute', sqlController.execute);

module.exports = router;