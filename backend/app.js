const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const routes = require('./routes')
const errorHandler = require('./middleware/errorHandler')
const authMiddleware = require('./middleware/auth')

const app = express()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const nlpRoutes = require('./routes/nlpRoutes');
const compareRoutes = require('./routes/compare');
const analysisRoutes = require('./routes/analysis'); 
app.use('/', nlpRoutes);
app.use('/compare', compareRoutes);
app.use('/analysis', analysisRoutes);
// 中间件
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// API 路由 - 所有路由都通过统一前缀访问
app.use('/api', routes)

// 错误处理中间件
app.use(errorHandler)

module.exports = app