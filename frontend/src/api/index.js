import axios from 'axios'

// 根据环境变量动态配置baseURL
const getBaseURL = () => {
  const env = import.meta.env.VITE_APP_ENV

  if (env === 'production') {
    // 生产环境：直接使用完整的后端URL
    return import.meta.env.VITE_API_URL || 'http://localhost:3001'
  } else if (env === 'lan') {
    // 局域网环境：使用局域网IP
    return import.meta.env.VITE_API_URL || 'http://10.47.179.167:3001'
  } else {
    // 开发环境：使用相对路径，由vite代理转发
    return '/api'
  }
}

const instance = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000
})

// 添加请求拦截器
instance.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    // 对请求错误做些什么
    return Promise.reject(error)
  }
)

// 添加响应拦截器
instance.interceptors.response.use(
  response => {
    // 对响应数据做点什么
    return response
  },
  error => {
    // 对响应错误做点什么
    if (error.response && error.response.status === 401) {
      // 令牌无效或过期，清除本地存储并重定向到登录页
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('username')
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default {
  data: {
    fetchSummary(params){ return instance.get('/data/summary', { params }) }
  },
  analysis: {
    runReport(params){ return instance.post('/analysis/report', params) },
    getPolicyTypes(){ return instance.get('/analysis/policy-types') },
    getCities(){ return instance.get('/analysis/cities') },
    getCounties(params){ return instance.get('/analysis/counties', { params }) },
    getAllCounties(){ return instance.get('/analysis/all-counties') },
    getDynamicPolicyTypes(params) {
      return instance.get('/analysis/dynamic-policy-types', { params })
    }
  },
  nlp: {
    query(payload){ return instance.post('/nlp/query', payload) }
  },
  sql: {
    execute(sqlStatement) { 
      return instance.post('/sql/execute', { sql: sqlStatement }) 
    }
  },
  auth: {
    login(credentials){ return instance.post('/auth/login', credentials) },
    register(userData){ return instance.post('/auth/register', userData) },
    logout(){ return instance.post('/auth/logout') }
  },
  compare: {
    // 新增对比分析API
    getComparisonData(params) { return instance.get('/compare/data', { params }) }
  }
}