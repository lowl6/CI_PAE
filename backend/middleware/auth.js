exports.authMiddleware = (req, res, next) => {
  // 简单示例：使用 header 中的 x-api-key 进行校验（生产请替换成 JWT/更安全方式）
  const key = req.headers['x-api-key']
  if(!key || key !== 'dev-key'){
    // 允许访问公共接口（例如 /api/nlp），这里示例中对所有接口都允许通过，仅作占位
    // return res.status(401).json({ ok:false, error: 'Unauthorized' })
  }
  next()
}
