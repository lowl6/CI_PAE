const dataService = require('../services/dataService')

exports.getSummary = async (req, res, next) => {
  try {
    const params = req.query
    const summary = await dataService.fetchSummary(params)
    res.json({ ok: true, data: summary })
  } catch (err) { next(err) }
}
