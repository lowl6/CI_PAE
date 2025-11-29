import request from '@/utils/request'

// 获取仪表盘核心指标数据
export function getDashboardData() {
  return request({
    url: '/api/dashboard/indicators',
    method: 'get'
  })
}

// 获取贫困县数据
export function getPoorCountyData() {
  return request({
    url: '/api/dashboard/poor-counties',
    method: 'get'
  })
}

// 获取盟市列表数据
export function getCityList() {
  return request({
    url: '/api/dashboard/cities',
    method: 'get'
  })
}

// 获取统计数据概览
export function getStatisticsOverview() {
  return request({
    url: '/api/dashboard/overview',
    method: 'get'
  })
}

// 新增API方法
// export function getCityDetail(cityId) {
//     return request({
//         url: `/api/dashboard/city/${cityId}/detail`,
//         method: 'get'
//     });
// }

export function getCitiesSummary() {
    return request({
        url: '/api/dashboard/cities/summary',
        method: 'get'
    });
}

export function getCityDetail(cityName) {
    return request({
        url: `/api/dashboard/city/${encodeURIComponent(cityName)}`,
        method: 'get'
    });
}