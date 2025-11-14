const analysisService = require('../services/analysisService')

exports.generateReport = async (req, res, next) => {
  try {
    const payload = req.body
    const report = await analysisService.runAnalysis(payload)
    res.json({ ok: true, data: report })
  } catch (err) { next(err) }
}
