// NLP 服务占位：后续可对接模型或外部 API
exports.query = async (q) => {
  // 简单 mock：如果空查询返回说明
  if(!q) return { message: '请提供查询内容' }
  return { query: q, answers: [ { text: '示例回答 A' }, { text: '示例回答 B' } ] }
}
