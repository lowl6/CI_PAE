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

    // 根据政策类型获取相关领域的指标数据
    let relatedIndicators = [];
    if (policyTypeIds && policyTypeIds.length > 0) {
      relatedIndicators = await getRelatedIndicators(regionIds, startYear, endYear, policyTypeIds);
    }

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
      relatedIndicators: relatedIndicators, // 新增：政策相关指标数据
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

// 辅助函数：根据政策类型获取相关指标数据
async function getRelatedIndicators(regionIds, startYear, endYear, policyTypes) {
  // 政策类型到指标的映射关系
  const policyIndicatorMap = {
    '经济发展': [
      { table: 'economic_indicators', field: 'gdp', name: 'GDP', unit: '亿元' },
      { table: 'economic_indicators', field: 'public_budget_income', name: '财政收入', unit: '万元' },
      { table: 'economic_indicators', field: 'disp_income_rural', name: '农村居民收入', unit: '元' }
    ],
    '农业扶贫': [
      { table: 'agriculture_indicators', field: 'grain_yield', name: '粮食产量', unit: '吨' },
      { table: 'agriculture_indicators', field: 'arable_land', name: '耕地面积', unit: '公顷' },
      { table: 'agriculture_indicators', field: 'sown_area', name: '播种面积', unit: '公顷' }
    ],
    '社会保障与就业': [
      { table: 'medical_social_indicators', field: 'medical_beds', name: '医疗床位', unit: '张' },
      { table: 'medical_social_indicators', field: 'medical_insurance_users', name: '医保参保人数', unit: '人' },
      { table: 'economic_indicators', field: 'disp_income_total', name: '居民人均收入', unit: '元' }
    ],
    '基础设施建设': [
      { table: 'infrastructure_indicators', field: 'road_mileage', name: '公路里程', unit: '公里' },
      { table: 'infrastructure_indicators', field: 'mobile_users', name: '移动电话用户', unit: '户' },
      { table: 'infrastructure_indicators', field: 'broadband_users', name: '宽带用户', unit: '户' }
    ],
    '教育文化': [
      { table: 'edu_culture_indicators', field: 'primary_schools', name: '小学数量', unit: '所' },
      { table: 'edu_culture_indicators', field: 'middle_schools', name: '中学数量', unit: '所' },
      { table: 'edu_culture_indicators', field: 'patents_granted', name: '专利授权', unit: '件' }
    ],
    '工业招商': [
      { table: 'industry_trade_indicators', field: 'industrial_enterprises', name: '规上工业企业', unit: '个' },
      { table: 'industry_trade_indicators', field: 'retail_sales', name: '零售总额', unit: '万元' },
      { table: 'industry_trade_indicators', field: 'export_total_rmb', name: '出口总额', unit: '万元' }
    ]
  };

  // 收集所有需要查询的指标
  const allIndicators = [];
  policyTypes.forEach(policyType => {
    const indicators = policyIndicatorMap[policyType];
    if (indicators) {
      indicators.forEach(ind => {
        // 避免重复添加
        if (!allIndicators.find(i => i.table === ind.table && i.field === ind.field)) {
          allIndicators.push(ind);
        }
      });
    }
  });

  if (allIndicators.length === 0) {
    return [];
  }

  // 按表分组查询
  const result = [];
  const tableGroups = {};
  allIndicators.forEach(ind => {
    if (!tableGroups[ind.table]) {
      tableGroups[ind.table] = [];
    }
    tableGroups[ind.table].push(ind);
  });

  // 对每个表执行查询
  for (const [table, indicators] of Object.entries(tableGroups)) {
    const fields = indicators.map(ind => ind.field).join(', ');
    const sql = `
      SELECT 
        year,
        county_id,
        ${fields}
      FROM ${table}
      WHERE county_id IN (${regionIds.map(() => '?').join(',')})
      AND year BETWEEN ? AND ?
      ORDER BY year, county_id
    `;
    
    const [rows] = await pool.query(sql, [...regionIds, startYear, endYear]);
    
    // 为每个指标构造数据
    indicators.forEach(indicator => {
      const indicatorData = {
        name: indicator.name,
        unit: indicator.unit,
        data: []
      };
      
      // 按年份分组数据
      const yearMap = {};
      rows.forEach(row => {
        const year = row.year;
        if (!yearMap[year]) {
          yearMap[year] = { year };
        }
        // 找到这是第几个region
        const regionIndex = regionIds.indexOf(row.county_id);
        if (regionIndex !== -1) {
          yearMap[year][`region${regionIndex + 1}`] = row[indicator.field] || 0;
        }
      });
      
      indicatorData.data = Object.values(yearMap);
      result.push(indicatorData);
    });
  }

  return result;
}