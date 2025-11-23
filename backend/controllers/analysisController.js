// controllers/analysisController.js
const pool = require('../config/db');

// 获取内蒙古的城市列表
exports.getCities = async (req, res) => {
  try {
    const [cities] = await pool.query(
      'SELECT DISTINCT city FROM counties WHERE province = ? AND city IS NOT NULL AND city != "" ORDER BY city',
      ['内蒙古自治区']
    );

    res.json(cities.map(item => item.city));
  } catch (error) {
    console.error('获取城市失败:', error);
    res.status(500).json({ ok: false, error: '获取城市数据失败' });
  }
};

// 获取县区列表（支持不选城市时获取所有县区）
exports.getCounties = async (req, res) => {
  try {
    const { city } = req.query;
    let sql = 'SELECT county_id, county_name FROM counties WHERE province = ?';
    const params = ['内蒙古自治区'];

    if (city && city.trim()) {
      sql += ' AND city = ?';
      params.push(city.trim());
    }

    sql += ' ORDER BY city, county_name';

    const [counties] = await pool.query(sql, params);
    res.json(counties);
  } catch (error) {
    console.error('获取县区失败:', error);
    res.status(500).json({ ok: false, error: '获取县区数据失败' });
  }
};

// 获取所有县区（用于对比分析页面）
exports.getAllCounties = async (req, res) => {
  try {
    const [counties] = await pool.query(
      'SELECT county_id, county_name FROM counties WHERE province = ? ORDER BY city, county_name',
      ['内蒙古自治区']
    );
    res.json(counties);
  } catch (error) {
    console.error('获取所有县区失败:', error);
    res.status(500).json({ ok: false, error: '获取所有县区数据失败' });
  }
};

// 获取政策类型
exports.getPolicyTypes = async (req, res) => {
  try {
    const [types] = await pool.query(
      'SELECT DISTINCT policy_type FROM policies WHERE policy_type IS NOT NULL ORDER BY policy_type'
    );

    res.json(types.map(item => item.policy_type));
  } catch (error) {
    console.error('获取政策类型失败:', error);
    res.status(500).json({ ok: false, error: '获取政策类型失败' });
  }
};

// 获取指标树
exports.getIndicatorsTree = async (req, res) => {
  try {
    const indicatorTree = [
      {
        title: '经济指标',
        key: 'economic',
        children: [
          { title: '地区生产总值', key: 'gdp', meta: { unit: '亿元', table: 'economic_indicators' } },
          { title: '一般公共预算收入', key: 'public_budget_income', meta: { unit: '万元', table: 'economic_indicators' } },
          { title: '全体居民人均可支配收入', key: 'disp_income_total', meta: { unit: '元', table: 'economic_indicators' } },
          { title: '农村牧区常住居民人均可支配收入', key: 'disp_income_rural', meta: { unit: '元', table: 'economic_indicators' } }
        ]
      },
      {
        title: '农业指标',
        key: 'agriculture',
        children: [
          { title: '耕地面积', key: 'arable_land', meta: { unit: '公顷', table: 'agriculture_indicators' } },
          { title: '粮食产量', key: 'grain_yield', meta: { unit: '吨', table: 'agriculture_indicators' } },
          { title: '油料产量', key: 'oil_yield', meta: { unit: '吨', table: 'agriculture_indicators' } }
        ]
      },
      {
        title: '人口指标',
        key: 'population',
        children: [
          { title: '户籍人口', key: 'registered_pop', meta: { unit: '万人', table: 'population_indicators' } },
          { title: '行政区域土地面积', key: 'land_area', meta: { unit: '平方公里', table: 'population_indicators' } }
        ]
      },
      {
        title: '基础设施指标',
        key: 'infrastructure',
        children: [
          { title: '公路里程', key: 'road_mileage', meta: { unit: '公里', table: 'infrastructure_indicators' } },
          { title: '移动电话用户', key: 'mobile_users', meta: { unit: '户', table: 'infrastructure_indicators' } }
        ]
      }
    ];

    res.json(indicatorTree);
  } catch (error) {
    console.error('获取指标树失败:', error);
    res.status(500).json({ ok: false, error: '获取指标树失败' });
  }
};

// 获取政策类型 (这个函数重复了, 但我们保留它以防万一)
exports.getPolicyTypes = async (req, res) => {
  try {
    const [types] = await pool.query(
      'SELECT DISTINCT policy_type FROM policies ORDER BY policy_type'
    );

    res.json(types.map(item => item.policy_type));
  } catch (error) {
    console.error('获取政策类型失败:', error);
    res.status(500).json({ ok: false, error: '获取政策类型失败' });
  }
};

// 获取分析数据
exports.getAnalysisData = async (req, res) => {
  try {
    const { city, countyId, policyType, startYear, endYear, indicators } = req.body;

    // 如果没有选择具体县区，获取该城市下的所有县区
    // 只保留选中的县区（如果有选择）
    let countyIds = [];
    if (countyId) {
      countyIds = [countyId]; // 仅包含选中的单个县区
    } else if (city) {
      const [counties] = await pool.query(
        'SELECT county_id FROM counties WHERE city = ? AND province = ?',
        [city, '内蒙古自治区']
      );
      countyIds = counties.map(item => item.county_id);
    } else {
      // 获取内蒙古所有县区
      const [counties] = await pool.query(
        'SELECT county_id FROM counties WHERE province = ?',
        ['内蒙古自治区']
      );
      countyIds = counties.map(item => item.county_id);
    }

    if (countyIds.length === 0) {
      return res.json({
        ok: true,
        data: {
          cards: [],
          xAxis: [],
          series: [],
          counties: []
        }
      });
    }

    // 获取县区名称映射
    const [countyNames] = await pool.query(
      'SELECT county_id, county_name FROM counties WHERE county_id IN (?)',
      [countyIds]
    );
    const countyNameMap = {};
    countyNames.forEach(item => {
      countyNameMap[item.county_id] = item.county_name;
    });

    // 生成年份数组
    const years = [];
    for (let year = parseInt(startYear); year <= parseInt(endYear); year++) {
      years.push(year);
    }

    // 生成卡片数据
    const cards = [];
    if (countyIds.length === 1) {
      // 单县区模式
      const currentCountyId = countyIds[0];

      for (const indicatorKey of indicators) {
        // 根据指标key获取对应的表和字段
        const indicatorInfo = getIndicatorInfo(indicatorKey);
        if (!indicatorInfo) continue;

        let yoyField = null;
        let queryFields = indicatorKey;

        // 只有非GDP指标才查询同比字段
        if (!['gdp', 'gdp_primary', 'gdp_secondary', 'gdp_tertiary'].includes(indicatorKey)) {
          yoyField = `${indicatorKey}_yoy`;
          queryFields += `, ${yoyField}`;
        }

        // --- 修复开始 (SQL 语法 1) ---
        // 将 SQL 查询语句放在一行，移除换行符和多余空格
        const [data] = await pool.query(
          `SELECT ${queryFields} FROM ${indicatorInfo.table} WHERE county_id = ? AND year = ?`,
          [currentCountyId, endYear]
        );
        // --- 修复结束 (SQL 语法 1) ---

        if (data.length > 0) {
          const value = data[0][indicatorKey];
          const yoy = (yoyField && data[0][yoyField] !== undefined) ? data[0][yoyField] : null;

          cards.push({
            name: indicatorInfo.title,
            unit: indicatorInfo.unit || '',
            value: value !== null ? formatNumber(value) : '无数据',
            yoy: yoy !== null ? `${yoy > 0 ? '+' : ''}${yoy}%` : '无数据'
          });
        }
      }
    }

    // 生成图表数据
    const series = [];
    if (countyIds.length === 1) {
      // 单县区多指标模式
      const currentCountyId = countyIds[0];

      for (const indicatorKey of indicators) {
        const indicatorInfo = getIndicatorInfo(indicatorKey);
        if (!indicatorInfo) continue;

        const seriesData = [];
        for (const year of years) {
          // --- 修复开始 (SQL 语法 2) ---
          const [data] = await pool.query(
            `SELECT ${indicatorKey} FROM ${indicatorInfo.table} WHERE county_id = ? AND year = ?`,
            [currentCountyId, year]
          );
          // --- 修复结束 (SQL 语法 2) ---

          seriesData.push(data.length > 0 && data[0][indicatorKey] !== null
            ? parseFloat(data[0][indicatorKey])
            : null);
        }

        series.push({
          name: indicatorInfo.title,
          data: seriesData
        });
      }
    } else {
      // 多县区对比模式（取第一个指标）
      if (indicators.length > 0) {
        const indicatorKey = indicators[0];
        const indicatorInfo = getIndicatorInfo(indicatorKey);

        if (indicatorInfo) {
          for (const countyId of countyIds) {
            const seriesData = [];
            for (const year of years) {
              // --- 修复开始 (SQL 语法 3) ---
              const [data] = await pool.query(
                `SELECT ${indicatorKey} FROM ${indicatorInfo.table} WHERE county_id = ? AND year = ?`,
                [countyId, year]
              );
              // --- 修复结束 (SQL 语法 3) ---

              seriesData.push(data.length > 0 && data[0][indicatorKey] !== null
                ? parseFloat(data[0][indicatorKey])
                : null);
            }

            series.push({
              name: countyNameMap[countyId] || countyId,
              data: seriesData
            });
          }
        }
      }
    }

    res.json({
      ok: true,
      data: {
        cards: cards,
        xAxis: years.map(String),
        series: series,
        counties: countyNames
      }
    });

  } catch (error) {
    console.error('获取分析数据失败:', error);
    res.status(500).json({ ok: false, error: '获取分析数据失败' });
  }
};

// 导出CSV
exports.exportCsv = async (req, res) => {
  try {
    // 简单实现，返回成功响应
    res.status(200).json({ ok: true, message: 'CSV导出功能待实现' });
  } catch (error) {
    console.error('导出CSV失败:', error);
    res.status(500).json({ ok: false, error: '导出CSV失败' });
  }
};

// 辅助函数：获取指标信息
function getIndicatorInfo(key) {
  const indicatorsMap = {
    // 经济指标（有同比字段）
    'public_budget_income': { title: '一般公共预算收入', unit: '万元', table: 'economic_indicators' },
    'public_budget_exp': { title: '一般公共预算支出', unit: '万元', table: 'economic_indicators' },
    'disp_income_total': { title: '全体居民人均可支配收入', unit: '元', table: 'economic_indicators' },
    'disp_income_urban': { title: '城镇常住居民人均可支配收入', unit: '元', table: 'economic_indicators' },
    'disp_income_rural': { title: '农村牧区常住居民人均可支配收入', unit: '元', table: 'economic_indicators' },

    // 农业指标（有同比字段）
    'arable_land': { title: '耕地面积', unit: '公顷', table: 'agriculture_indicators' },
    'high_std_farmland': { title: '高标准农田面积', unit: '公顷', table: 'agriculture_indicators' },
    'sown_area': { title: '农作物总播种面积', unit: '公顷', table: 'agriculture_indicators' },
    'grain_yield': { title: '粮食产量', unit: '吨', table: 'agriculture_indicators' },
    'oil_yield': { title: '油料产量', unit: '吨', table: 'agriculture_indicators' },

    // 人口指标（有同比字段）
    'land_area': { title: '行政区域土地面积', unit: '平方公里', table: 'population_indicators' },
    'households': { title: '户籍户数', unit: '户', table: 'population_indicators' },
    'registered_pop': { title: '户籍人口', unit: '万人', table: 'population_indicators' },

    // 其他指标（无同比字段，但可以显示数值）
    'gdp': { title: '地区生产总值', unit: '亿元', table: 'economic_indicators' },
    'road_mileage': { title: '公路里程', unit: '公里', table: 'infrastructure_indicators' },
    'mobile_users': { title: '移动电话用户', unit: '户', table: 'infrastructure_indicators' },
    'broadband_users': { title: '互联网宽带接入用户', unit: '户', table: 'infrastructure_indicators' },
    'industrial_enterprises': { title: '规模以上工业企业单位数', unit: '个', table: 'industry_trade_indicators' },
    'retail_sales': { title: '社会消费品零售总额', unit: '万元', table: 'industry_trade_indicators' },
    'export_total_rmb': { title: '出口总额_人民币', unit: '万元', table: 'industry_trade_indicators' },
    'primary_schools': { title: '小学学校数', unit: '所', table: 'edu_culture_indicators' },
    'middle_schools': { title: '普通中学学校数', unit: '所', table: 'edu_culture_indicators' },
    'patents_granted': { title: '全年专利授权', unit: '件', table: 'edu_culture_indicators' },
    'medical_beds': { title: '医疗卫生机构床位数', unit: '张', table: 'medical_social_indicators' },
    'medical_tech_personnel': { title: '医疗卫生技术人员', unit: '人', table: 'medical_social_indicators' },
    'medical_insurance_users': { title: '基本医疗保险参保人数', unit: '人', table: 'medical_social_indicators' }
  };

  return indicatorsMap[key];
}

// 辅助函数：格式化数字显示
function formatNumber(num) {
  if (num === null || num === undefined) return '0';

  // 根据数值大小使用不同的格式化
  if (num >= 100000000) {
    return (num / 100000000).toFixed(2) + '亿';
  } else if (num >= 10000) {
    return (num / 10000).toFixed(2) + '万';
  } else {
    return num.toLocaleString();
  }
}

// 如果原来有 generateReport 方法，也添加进来（避免路由引用错误）
exports.generateReport = async (req, res) => {
  try {
    res.json({ ok: true, data: { report: '报告生成功能待实现' } });
  } catch (error) {
    res.status(500).json({ ok: false, error: '生成报告失败' });
  }
};