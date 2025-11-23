// 对比分析控制器
const pool = require('../config/db');

// 获取对比分析数据
exports.getComparisonData = async (req, res) => {
  // --- 新增日志 ---
  console.log('-----------------------------------');
  console.log('Step 1: getComparisonData 被调用');
  console.log('收到的 req.query:', JSON.stringify(req.query, null, 2));
  // --- 结束 ---

  try {
    const { regions, startDate, endDate, policyTypes } = req.query;
    
    // 解析地区参数
    const regionIds = regions ? (Array.isArray(regions) ? regions : [regions]) : [];
    const policyTypeIds = policyTypes ? (Array.isArray(policyTypes) ? policyTypes : [policyTypes]) : [];
    if (regionIds.length === 0) {
      return res.status(400).json({ ok: false, error: '请至少选择一个地区进行对比' });
    }
    
    // 解析日期参数
    const startYear = startDate ? new Date(startDate).getFullYear() : 2015;
    const endYear = endDate ? new Date(endDate).getFullYear() : 2020;
    
    // --- 新增日志 ---
    console.log('Step 2: 准备执行 gdpTrendSql');
    // --- 结束 ---
    
    // 获取GDP趋势数据
    const gdpTrendSql = `
      SELECT 
        ei.year,
        ${regionIds.map((regionId, index) => `
        MAX(CASE WHEN ei.county_id = ? THEN ei.gdp END) as region${index + 1}`).join(',')}
      FROM economic_indicators ei
      WHERE ei.county_id IN (${regionIds.map(() => '?').join(',')})
      AND ei.year BETWEEN ? AND ?
      GROUP BY ei.year
      ORDER BY ei.year
    `;
    
    // 构造参数数组
    const gdpParams = [...regionIds, ...regionIds, startYear, endYear];
    
    const [gdpTrendRows] = await pool.query(gdpTrendSql, gdpParams);
    
    // --- 新增日志 ---
    console.log('Step 3: gdpTrendSql 执行完毕');
    // --- 结束 ---
    
    // 获取政策效果数据（基于政策关联强度）
    const policyEffectSql = `
      SELECT 
        YEAR(p.issue_date) as year,
        ${regionIds.map((_, index) => `
        AVG(CASE WHEN rpc.county_id = ? THEN rpc.strength END) as region${index + 1}`).join(',')}
      FROM policies p
      JOIN rel_policy_county rpc ON p.policy_id = rpc.policy_id
      WHERE rpc.county_id IN (${regionIds.map(() => '?').join(',')})
      AND p.issue_date BETWEEN ? AND ?
      ${policyTypeIds && policyTypeIds.length > 0 ?
        `AND p.policy_type IN (${policyTypes.map(() => '?').join(',')})` : ''}
      GROUP BY YEAR(p.issue_date)
      ORDER BY YEAR(p.issue_date)
    `;
    
    // 构造政策效果查询参数
    const policyParams = [
      ...regionIds,  // CASE WHEN 条件参数
      ...regionIds,  // IN 条件参数
      `${startYear}-01-01`, 
      `${endYear}-12-31`,
      ...(policyTypeIds && policyTypeIds.length > 0 ? policyTypeIds : [])   // 政策类型参数
    ];
    
    // --- 新增日志 ---
    console.log('Step 4: 准备执行 policyEffectSql');
    // --- 结束 ---

    const [policyEffectRows] = await pool.query(policyEffectSql, policyParams);
    
    // --- 新增日志 ---
    console.log('Step 5: policyEffectSql 执行完毕');
    // --- 结束 ---

    // 构造返回数据
    const comparisonData = {
      gdpTrend: gdpTrendRows.map(row => {
        const result = { year: row.year };
        regionIds.forEach((_, index) => {
          result[`region${index + 1}`] = row[`region${index + 1}`] || 0;
        });
        return result;
      }),
      policyEffect: policyEffectRows.map(row => {
        const result = { year: row.year };
        regionIds.forEach((_, index) => {
          result[`region${index + 1}`] = row[`region${index + 1}`] ? 
            parseFloat(row[`region${index + 1}`]).toFixed(2) : 0;
        });
        return result;
      }),
      tableData: [] // 可以根据需要添加表格数据
    };
    
    // --- 新增日志 ---
    console.log('Step 6: 准备发送 res.json 响应');
    // --- 结束 ---
    res.json({ ok: true, data: comparisonData });

  } catch (error) {
    console.error('获取对比数据失败:', error);
    // --- 新增日志 ---
    console.log('Step E: API 执行出错', error.message);
    // --- 结束 ---
    res.status(500).json({ ok: false, error: '获取对比数据失败: ' + error.message });
  }
};