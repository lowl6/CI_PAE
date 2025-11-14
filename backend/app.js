const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const routes = require('./routes')
const { errorHandler } = require('./middleware/errorHandler')

const app = express()
app.use(cors())
app.use(bodyParser.json())

// 简单认证中间件示例
const { authMiddleware } = require('./middleware/auth')
app.use(authMiddleware)

app.use('/api', routes)

app.use(errorHandler)

module.exports = app
