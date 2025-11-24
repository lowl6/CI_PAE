const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const routes = require('./routes')
const errorHandler = require('./middleware/errorHandler')
const authMiddleware = require('./middleware/auth')

const app = express()

// CORS 配置 - 支持公网访问
const corsOptions = {
  origin: function (origin, callback) {
    // 开发环境允许所有origin
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true)
    }

    // 生产环境才需要限制具体域名
    const allowedOrigins = [
      'http://localhost:5174',
      'http://localhost:3000',
      'http://10.47.179.167:5174',  // 局域网IP
      'http://10.47.179.167:3000',  // 局域网IP
      // 添加你的公网IP和端口
      // 例如: 'http://YOUR_PUBLIC_IP:5174', 'http://YOUR_DOMAIN.com'
    ]

    // 生产环境检查origin
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true, // 允许发送 cookies 和认证信息
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 应用CORS中间件
app.use(cors(corsOptions))

// 处理预检请求
app.options('*', cors(corsOptions))

// 路由配置
const nlpRoutes = require('./routes/nlpRoutes')
const compareRoutes = require('./routes/compare')
const analysisRoutes = require('./routes/analysis')

app.use('/', nlpRoutes)
app.use('/compare', compareRoutes)
app.use('/analysis', analysisRoutes)

// 中间件
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// API 路由 - 所有路由都通过统一前缀访问
app.use('/api', routes)

// NLP 路由 - 直接暴露用于智能查询
app.use('/query', require('./routes/nlpRoutes'))

// 错误处理中间件
app.use(errorHandler)

module.exports = app