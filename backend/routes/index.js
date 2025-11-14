const express = require('express')
const router = express.Router()
const dataController = require('../controllers/dataController')
const analysisController = require('../controllers/analysisController')
const nlpController = require('../controllers/nlpController')

router.get('/data/summary', dataController.getSummary)
router.post('/analysis/report', analysisController.generateReport)
router.post('/nlp/query', nlpController.query)

module.exports = router
