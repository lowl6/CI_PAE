const app = require('./app')
const config = require('../config')
const os = require('os')

const port = config.port || 3001
const host = '0.0.0.0' // 允许局域网访问

// 获取本机IP地址
function getServerIP() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // 跳过内部地址和非IPv4地址
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address
      }
    }
  }
  return 'localhost'
}

const serverIP = getServerIP()

app.listen(port, host, () => {
  console.log(`CI-PAE backend listening on http://localhost:${port}`)
  console.log(`局域网访问地址: http://${serverIP}:${port}`)
})
