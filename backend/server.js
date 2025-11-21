const app = require('./app')
const config = require('../config')

const port = config.port || 3001
const host = '0.0.0.0' // 允许局域网访问

app.listen(port, host, () => {
  console.log(`CI-PAE backend listening on http://localhost:${port}`)
  console.log(`局域网访问地址: http://10.47.179.167:${port}`)
})
