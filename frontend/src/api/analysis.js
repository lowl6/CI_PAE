// src/api/analysis.js
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
    // 开发环境：使用localhost
    return 'http://localhost:3001/api'
  }
}

// 创建axios实例
const api = axios.create({
    baseURL: getBaseURL(), // 动态配置后端接口地址
    headers: {
        'Content-Type': 'application/json',
    },
});

// 添加请求拦截器，自动添加 token（如果需要的话）
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

// 添加响应拦截器，处理错误
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

// 获取内蒙古的城市列表
export const getCities = async () => {
    try {
        const response = await api.get('/analysis/cities');
        return response.data;
    } catch (error) {
        throw error.response?.data || { ok: false, error: '获取城市失败' };
    }
};

// 获取县区列表（支持不选城市时获取所有县区）
export const getCounties = async (city = '') => {
    try {
        let url = '/analysis/counties';
        if (city) {
            url += `?city=${encodeURIComponent(city)}`;
        }

        const response = await api.get(url);
        return response.data;
    } catch (error) {
        throw error.response?.data || { ok: false, error: '获取县区失败' };
    }
};

// 获取指标树数据
export const getIndicatorsTree = async () => {
    try {
        const response = await api.get('/analysis/indicators/tree');
        return response.data;
    } catch (error) {
        throw error.response?.data || { ok: false, error: '获取指标树失败' };
    }
};

// 获取政策类型列表
export const getPolicyTypes = async () => {
    try {
        const response = await api.get('/analysis/policy-types');
        return response.data;
    } catch (error) {
        throw error.response?.data || { ok: false, error: '获取政策类型失败' };
    }
};

// 获取分析数据（核心接口）
export const getAnalysisData = async (params) => {
    try {
        const response = await api.post('/analysis/data', params);
        return response.data;
    } catch (error) {
        throw error.response?.data || { ok: false, error: '获取分析数据失败' };
    }
};

// 导出CSV数据
export const exportCsvData = async (params) => {
    try {
        const response = await api.get('/analysis/export/csv', {
            params,
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { ok: false, error: '导出CSV失败' };
    }
};

export default api;