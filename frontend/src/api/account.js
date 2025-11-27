// 引入 axios（用于发送 HTTP 请求）
import axios from 'axios';

// 根据环境变量动态配置 baseURL
const getBaseURL = () => {
  const env = import.meta.env.VITE_APP_ENV

  if (env === 'production') {
    // 生产环境：直接使用完整的后端URL
    return `${import.meta.env.VITE_API_URL}/api`
  } else if (env === 'lan') {
    // 局域网环境：使用局域网IP
    return `${import.meta.env.VITE_API_URL}/api`
  } else {
    // 开发环境：检查当前访问地址
    const currentHost = window.location.hostname;
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      return 'http://localhost:3001/api'
    } else {
      // 如果是通过局域网IP访问的，使用相同的IP访问后端
      return `http://${currentHost}:3001/api`
    }
  }
}

// 创建 axios 实例，统一配置基础路径和请求头（避免重复写地址前缀）
const api = axios.create({
    baseURL: getBaseURL(), // 动态配置后端接口地址
    headers: {
        'Content-Type': 'application/json', // 统一设置请求体为 JSON 格式
    },
});

// 添加请求拦截器，自动添加 token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 添加响应拦截器，处理 401 错误
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.response && error.response.status === 401) {
      // 清除本地存储并重定向到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 1. 登录接口调用函数（参数为用户名和密码，返回后端响应结果）
export const login = async (username, password) => {
    try {
        // 发送 POST 请求到 /auth/login（拼接 baseURL 后实际地址是 http://localhost:3001/api/auth/login）
        const response = await api.post('/auth/login', { username, password });
        return response.data; // 返回后端返回的 JSON 数据（如 { ok: true, data: { token, user } }）
    } catch (error) {
        // 捕获请求错误（如网络问题、后端报错），方便组件中处理
        throw error.response?.data || { ok: false, error: '登录请求失败' };
    }
};

// 2. 后续可添加注册接口（待后端 register 函数修改为数据库存储后启用）
export const register = async (username, password, role, secretKey = '') => {
    try {
        const response = await api.post('/auth/register', { username, password, role, secretKey});
        return response.data;
    } catch (error) {
        throw error.response?.data || { ok: false, error: '注册请求失败' };
    }
};

export default api; // 导出 axios 实例，方便其他地方复用（如请求拦截器）