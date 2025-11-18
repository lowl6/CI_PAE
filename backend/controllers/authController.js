const authService = require('../services/authService')

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body
    const result = await authService.login(username, password)
    res.json({ ok: true, data: result })
  } catch (err) { 
    next(err) 
  }
}

exports.register = async (req, res, next) => {
  try {
    const { username, password } = req.body
    const result = await authService.register(username, password)
    res.json({ ok: true, data: result })
  } catch (err) { 
    next(err) 
  }
}

exports.logout = async (req, res, next) => {
  try {
    // 清除会话或令牌
    res.json({ ok: true, message: 'Logged out successfully' })
  } catch (err) { 
    next(err) 
  }
}