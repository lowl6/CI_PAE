import axios from 'axios'

// 后端基础路径（和你 account.js 完全一致）
const api = axios.create({
    baseURL: 'http://localhost:3001/api',
    headers: { 'Content-Type': 'application/json' }
})

/* ===== 1. 省市区级联 ===== */
export const getProvinces = async () => {
    try {
        const { data } = await api.get('/area/provinces')
        return data
    } catch (e) {
        throw e.response?.data || { ok: false, error: '获取省份失败' }
    }
}

export const getCities = async (province) => {
    try {
        const { data } = await api.get('/area/cities', { params: { province } })
        return data
    } catch (e) {
        throw e.response?.data || { ok: false, error: '获取城市失败' }
    }
}

export const getCounties = async (city) => {
    try {
        const { data } = await api.get('/area/counties', { params: { city } })
        return data
    } catch (e) {
        throw e.response?.data || { ok: false, error: '获取县区失败' }
    }
}

/* ===== 2. 指标树 ===== */
export const getIndicatorsTree = async () => {
    try {
        const { data } = await api.get('/indicators/tree')
        return data
    } catch (e) {
        throw e.response?.data || { ok: false, error: '获取指标树失败' }
    }
}

/* ===== 3. 深度分析数据 ===== */
export const getAnalysisData = async (params) => {
    try {
        const { data } = await api.post('/analysis/deep', params)
        return data
    } catch (e) {
        throw e.response?.data || { ok: false, error: '分析数据获取失败' }
    }
}