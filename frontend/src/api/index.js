import axios from 'axios'

const instance = axios.create({ baseURL: '/api', timeout: 10000 })

export default {
  data: {
    fetchSummary(params){ return instance.get('/data/summary', { params }) }
  },
  analysis: {
    runReport(params){ return instance.post('/analysis/report', params) }
  },
  nlp: {
    query(payload){ return instance.post('/nlp/query', payload) }
  }
}
