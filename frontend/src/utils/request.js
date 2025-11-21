import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 10000 })

// 响应拦截器：自动提取data字段
api.interceptors.response.use(
  res => res.data,  // 直接返回data，简化调用
  err => { 
    console.error('API请求错误:', err.response?.data || err.message)
    return Promise.reject(err) 
  }
)

export default api
