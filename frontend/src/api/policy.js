/**
 * 政策相关API
 * 用于政策可视化(经验模式库)页面
 */
import request from '../utils/request'

/**
 * 获取政策列表(用于气泡可视化)
 * @param {Object} params - 查询参数
 * @param {string} [params.type] - 政策类型(agriculture/medical/education/poverty_alleviation/all)
 * @param {string} [params.city] - 城市名称
 * @param {string} [params.year] - 发布年份或生效年份
 * @param {string} [params.keyword] - 关键词搜索
 * @param {number} [params.page=1] - 页码
 * @param {number} [params.pageSize=100] - 每页数量(气泡图通常需要较多数据)
 * @returns {Promise<{ok: boolean, data: {policies: Array, total: number, page: number, pageSize: number}}>}
 */
export function getPolicies(params = {}) {
  return request({
    url: '/api/policies',
    method: 'get',
    params
  })
}

/**
 * 获取政策详情(包含覆盖县、资源文件、访谈记录、指标影响)
 * @param {string} policyId - 政策ID(如POL001)
 * @returns {Promise<{ok: boolean, data: {
 *   policy: Object,
 *   counties: Array<{county_id, county_name, strength, adopt_year}>,
 *   resources: Array<{resource_id, file_name, file_type, file_size, upload_date, uploader}>,
 *   interviews: Array<{data_id, interviewee_name, identity, interview_date, relevance_score, content, keywords}>,
 *   indicator_effects: Array<{indicator_name, before_value, after_value, change_percent}>
 * }}>}
 */
export function getPolicyDetail(policyId) {
  return request({
    url: `/api/policies/${policyId}`,
    method: 'get'
  })
}

/**
 * 获取政策统计数据(用于筛选器选项和图表)
 * @returns {Promise<{ok: boolean, data: {
 *   by_type: Array<{policy_type, type_name, count}>,
 *   coverage: {total_policies, total_counties, avg_coverage},
 *   by_year: Array<{publish_year, count}>,
 *   by_city: Array<{city, count}>
 * }}>}
 */
export function getPolicyStats() {
  return request({
    url: '/api/policies/stats',
    method: 'get'
  })
}

/**
 * 获取单个访谈完整内容(用于抽屉内查看完整口述史)
 * @param {string} dataId - 访谈数据ID
 * @returns {Promise<{ok: boolean, data: {
 *   data_id, interviewee_id, interviewee_name, identity, county_name, city,
 *   interview_date, researcher_name, content, keywords, event_names
 * }}>}
 */
export function getInterviewFullContent(dataId) {
  return request({
    url: `/api/policies/interviews/${dataId}`,
    method: 'get'
  })
}

/**
 * 获取所有城市列表(用于筛选器)
 * @returns {Promise<{ok: boolean, data: Array<string>}>}
 */
export function getCities() {
  return request({
    url: '/api/policies/cities',
    method: 'get'
  })
}
