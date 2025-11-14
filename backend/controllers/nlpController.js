const nlpService = require('../services/nlpService')

exports.query = async (req, res, next) => {
  try {
    const { query } = req.body
    const result = await nlpService.query(query)
    res.json({ ok: true, data: result })
  } catch (err) { next(err) }
}
