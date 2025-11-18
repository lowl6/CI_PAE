// 引入 axios（用于发送 HTTP 请求）
import axios from 'axios';

// 创建 axios 实例，统一配置基础路径和请求头（避免重复写地址前缀）
const api = axios.create({
    baseURL: 'http://localhost:3001/api', // 后端接口的基础路径（对应 app.js 中的 /api 前缀）
    headers: {
        'Content-Type': 'application/json', // 统一设置请求体为 JSON 格式
    },
});

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
export const register = async (username, password) => {
    try {
        const response = await api.post('/auth/register', { username, password });
        return response.data;
    } catch (error) {
        throw error.response?.data || { ok: false, error: '注册请求失败' };
    }
};

export default api; // 导出 axios 实例，方便其他地方复用（如请求拦截器）