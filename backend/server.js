const app = require('./app')
const config = require('../config')

const port = config.port || 3001
app.listen(port, ()=>{
  console.log(`CI-PAE backend listening on http://localhost:${port}`)
})
