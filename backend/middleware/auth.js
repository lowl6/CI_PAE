// 认证中间件

function parseToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
    return payload
  } catch (err) {
    return null
  }
}

module.exports = (req, res, next) => {
  // 检查 Authorization header
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN
  
  // 如果没有令牌，则拒绝访问
  if (!token) {
    return res.status(401).json({ 
      ok: false, 
      error: 'Access denied. No token provided.' 
    })
  }
  
  try {
    // 解析令牌
    const decoded = parseToken(token)
    if (!decoded) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Invalid token.' 
      })
    }
    
    // 将用户信息附加到请求对象
    req.user = decoded
    next()
  } catch (err) {
    res.status(400).json({ 
      ok: false, 
      error: 'Invalid token.' 
    })
  }
}