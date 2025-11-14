// 返回模拟的统计摘要（占位）
exports.fetchSummary = async (params) => {
  // TODO: 连接数据库并返回真实统计
  return {
    totalCount: 12345,
    counties: 12,
    period: params.period || '2015-2020'
  }
}
