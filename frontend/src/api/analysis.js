// src/api/analysis.js
import axios from 'axios';

// 创建axios实例
const api = axios.create({
    baseURL: 'http://localhost:3001/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

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