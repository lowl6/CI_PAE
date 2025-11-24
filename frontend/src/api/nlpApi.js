import axios from 'axios';

// 动态获取后端API地址
const getBaseURL = () => {
  const currentHost = window.location.hostname;
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return 'http://localhost:3001';
  } else {
    // 如果是通过局域网IP访问的，使用相同的IP访问后端
    return `http://${currentHost}:3001`;
  }
};

const api = axios.create({
    baseURL: getBaseURL(),
    timeout: 300000,
    headers: {
        'Content-Type': 'application/json' // 全局设置
    }
});

api.interceptors.request.use(config => {
    console.log("=== 前端发送请求 ===");
    console.log("请求地址:", config.url);
    console.log("请求方法:", config.method);
    console.log("请求体:", config.data);
    console.log("请求头:", config.headers);
    return config;
});

export const nlpApi = {
    submitQuery: (question) => {
        return api.post('/query', { question });
    }
};