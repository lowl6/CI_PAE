import axios from 'axios';

const api = axios.create({
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
        return api.post('/api/query', { question });
    }
};