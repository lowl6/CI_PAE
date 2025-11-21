// 政策数据服务层
const pool = require('../config/db');

/**
 * 获取政策列表（用于泡泡可视化）
 * @param {Object} filters - 筛选条件 { type, city, yearStart, yearEnd, keyword }
 * @returns {Promise<Array>} 政策列表
 */
exports.getPolicyList = async (filters = {}) => {
  try {
    const { type, city, year, yearStart, yearEnd, keyword } = filters;
    // console.log('收到的筛选条件:', { type, city, year, yearStart, yearEnd, keyword });
    
    let sql = `
      SELECT 
        policy_id,
        policy_name,
        policy_type,
        issue_date,
        status,
        county_count,
        resource_count,
        interview_count,
        avg_strength,
        LEFT(summary, 100) as summary_snippet
      FROM v_policy_stats
      WHERE 1=1
    `;
    
    const params = [];
    
    if (type) {
      sql += ' AND policy_type = ?';
      params.push(type);
    }
    
    if (city) {
      sql += ` AND policy_id IN (
        SELECT DISTINCT rpc.policy_id 
        FROM rel_policy_county rpc 
        JOIN counties c ON rpc.county_id = c.county_id 
        WHERE c.city = ?
      )`;
      params.push(city);
    }
    
    // 支持单个年份或年份范围筛选
    if (year) {
      sql += ' AND YEAR(issue_date) = ?';
      params.push(year);
    } else if (yearStart && yearEnd) {
      sql += ' AND YEAR(issue_date) BETWEEN ? AND ?';
      params.push(yearStart, yearEnd);
    }
    
    if (keyword) {
      sql += ' AND (policy_name LIKE ? OR summary LIKE ?)';
      const kw = `%${keyword}%`;
      params.push(kw, kw);
    }
    
    sql += ' ORDER BY issue_date DESC';
    
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (error) {
    console.error('获取政策列表失败:', error);
    throw error;
  }
};

/**
 * 获取政策详情（完整信息）
 * @param {String} policyId - 政策ID
 * @returns {Promise<Object>} 政策详情对象
 */
exports.getPolicyDetail = async (policyId) => {
  try {
    // 1. 政策基本信息(从统计视图获取完整信息)
    const [policyRows] = await pool.query(
      'SELECT * FROM v_policy_stats WHERE policy_id = ?',
      [policyId]
    );
    
    if (policyRows.length === 0) {
      throw new Error('政策不存在');
    }
    
    const policy = policyRows[0];
    
    // 2. 覆盖县域列表
    const [counties] = await pool.query(`
      SELECT 
        c.county_id, 
        c.county_name, 
        c.city, 
        c.province,
        rpc.strength,
        rpc.adopt_year
      FROM rel_policy_county rpc
      JOIN counties c ON rpc.county_id = c.county_id
      WHERE rpc.policy_id = ?
      ORDER BY rpc.strength DESC, c.county_name
    `, [policyId]);
    
    // 3. 政策资源投入
    const [resources] = await pool.query(
      'SELECT * FROM policy_resources WHERE policy_id = ? ORDER BY impact_level DESC',
      [policyId]
    );
    
    // 4. 关联访谈（两步策略）
    // 第一步：通过关键词精准匹配（包括policy_type）
    const [policyKeywords] = await pool.query(
      'SELECT keyword FROM policy_keywords WHERE policy_id = ? ORDER BY weight DESC',
      [policyId]
    );
    
    let keywords = [];
    // 添加政策类型作为首要关键词
    if (policy.policy_type) {
      keywords.push(policy.policy_type);
    }
    
    if (policyKeywords.length > 0) {
      keywords.push(...policyKeywords.map(row => row.keyword));
    } else {
      const stopwords = ['的', '和', '与', '及', '关于', '实施', '管理', '办法', '方案', '通知', '意见', '建设', '工程', '计划', '细则', '政策', '全区', '全市'];
      if (policy.policy_name) {
        const words = policy.policy_name.split(/[,、，。\s]+/).filter(w => w.length > 1 && !stopwords.includes(w));
        keywords.push(...words.slice(0, 5));
      }
      if (policy.summary && keywords.length < 3) {
        const summaryWords = policy.summary.split(/[,、，。\s]+/).filter(w => w.length > 1 && !stopwords.includes(w));
        keywords.push(...summaryWords.slice(0, 3));
      }
    }
    // 去重
    keywords = [...new Set(keywords)];
    
    // 提取县域ID列表（用于第二步查询）
    const countyIds = counties.map(c => c.county_id);
    
    let keywordMatchedInterviews = [];
    let countyInterviews = [];
    
    // 第一步：关键词匹配的访谈（高相关度）
    if (keywords.length > 0) {
      const topicConditions = keywords.map(() => 'evt.topic LIKE ?').join(' OR ');
      const keywordConditions = keywords.map(() => 'id.keywords LIKE ?').join(' OR ');
      const contentConditions = keywords.map(() => 'id.content LIKE ?').join(' OR ');
      
      const topicParams = keywords.map(kw => `%${kw}%`);
      const keywordParams = keywords.map(kw => `%${kw}%`);
      const contentParams = keywords.map(kw => `%${kw}%`);
      
      const [rows] = await pool.query(`
        SELECT DISTINCT
          id.data_id,
          id.keywords,
          id.experience_summary,
          LEFT(id.content, 300) as content_snippet,
          GROUP_CONCAT(DISTINCT ie.name SEPARATOR ', ') as interviewee_name,
          GROUP_CONCAT(DISTINCT ie.identity SEPARATOR ', ') as identity,
          c.county_name,
          evt.event_date,
          evt.topic as interview_topic,
          GROUP_CONCAT(DISTINCT r.name SEPARATOR ', ') as researcher_name,
          (CASE WHEN ${topicConditions} THEN 3 ELSE 0 END +
           CASE WHEN ${keywordConditions} THEN 2 ELSE 0 END +
           CASE WHEN ${contentConditions} THEN 1 ELSE 0 END) as relevance_score
        FROM interview_data id
        JOIN interview_events evt ON id.event_id = evt.event_id
        LEFT JOIN rel_interviewee_event rie ON evt.event_id = rie.event_id
        LEFT JOIN interviewees ie ON rie.interviewee_id = ie.interviewee_id
        LEFT JOIN counties c ON ie.county_id = c.county_id
        LEFT JOIN rel_data_researcher rdr ON id.data_id = rdr.data_id
        LEFT JOIN researchers r ON rdr.researcher_id = r.researcher_id
        WHERE (${topicConditions}) OR (${keywordConditions}) OR (${contentConditions})
        GROUP BY id.data_id, id.keywords, id.experience_summary, id.content, 
                 c.county_name, evt.event_date, evt.topic
        HAVING relevance_score > 0
        ORDER BY relevance_score DESC, evt.event_date DESC
      `, [...topicParams, ...keywordParams, ...contentParams, ...topicParams, ...keywordParams, ...contentParams]);
      
      keywordMatchedInterviews = rows;
    }
    
    // 第二步：获取政策覆盖县域的所有访谈（补充相关性）
    if (countyIds.length > 0) {
      const keywordMatchedIds = keywordMatchedInterviews.map(i => i.data_id);
      const excludeCondition = keywordMatchedIds.length > 0 
        ? `AND id.data_id NOT IN (${keywordMatchedIds.map(() => '?').join(',')})` 
        : '';
      
      const [rows] = await pool.query(`
        SELECT DISTINCT
          id.data_id,
          id.keywords,
          id.experience_summary,
          LEFT(id.content, 300) as content_snippet,
          GROUP_CONCAT(DISTINCT ie.name SEPARATOR ', ') as interviewee_name,
          GROUP_CONCAT(DISTINCT ie.identity SEPARATOR ', ') as identity,
          c.county_name,
          evt.event_date,
          evt.topic as interview_topic,
          GROUP_CONCAT(DISTINCT r.name SEPARATOR ', ') as researcher_name,
          0 as relevance_score
        FROM interview_data id
        JOIN interview_events evt ON id.event_id = evt.event_id
        LEFT JOIN rel_interviewee_event rie ON evt.event_id = rie.event_id
        LEFT JOIN interviewees ie ON rie.interviewee_id = ie.interviewee_id
        LEFT JOIN counties c ON ie.county_id = c.county_id
        LEFT JOIN rel_data_researcher rdr ON id.data_id = rdr.data_id
        LEFT JOIN researchers r ON rdr.researcher_id = r.researcher_id
        WHERE c.county_id IN (${countyIds.map(() => '?').join(',')})
        ${excludeCondition}
        GROUP BY id.data_id, id.keywords, id.experience_summary, id.content, 
                 c.county_name, evt.event_date, evt.topic
        ORDER BY evt.event_date DESC
        LIMIT 30
      `, [...countyIds, ...keywordMatchedIds]);
      
      countyInterviews = rows;
    }
    
    // 合并两部分访谈：关键词匹配的在前，县域相关的在后
    const interviews = [...keywordMatchedInterviews, ...countyInterviews];
    
    // 5. 指标效应分析（基于实际数据年份的前后对比）
    let indicatorEffects = [];
    
    if (countyIds.length > 0) {
      // 先获取该县域的数据年份范围
      const [yearRange] = await pool.query(`
        SELECT MIN(year) as min_year, MAX(year) as max_year
        FROM economic_indicators
        WHERE county_id IN (${countyIds.map(() => '?').join(',')})
      `, countyIds);
      
      if (yearRange.length > 0 && yearRange[0].min_year && yearRange[0].max_year) {
        const minYear = yearRange[0].min_year;
        const maxYear = yearRange[0].max_year;
        const midYear = Math.floor((minYear + maxYear) / 2);
        
        // 使用中位年份作为分界点，对比前半段和后半段
        const [effects] = await pool.query(`
          SELECT 
            'gdp' as indicator,
            'GDP总量' as name,
            AVG(CASE WHEN year <= ? THEN gdp END) as before_avg,
            AVG(CASE WHEN year > ? THEN gdp END) as after_avg,
            '亿元' as unit
          FROM economic_indicators
          WHERE county_id IN (${countyIds.map(() => '?').join(',')})
          UNION ALL
          SELECT 
            'disp_income_rural' as indicator,
            '农村居民人均可支配收入' as name,
            AVG(CASE WHEN year <= ? THEN disp_income_rural END) as before_avg,
            AVG(CASE WHEN year > ? THEN disp_income_rural END) as after_avg,
            '元' as unit
          FROM economic_indicators
          WHERE county_id IN (${countyIds.map(() => '?').join(',')})
          UNION ALL
          SELECT 
            'registered_pop' as indicator,
            '户籍人口' as name,
            AVG(CASE WHEN year <= ? THEN registered_pop END) as before_avg,
            AVG(CASE WHEN year > ? THEN registered_pop END) as after_avg,
            '万人' as unit
          FROM population_indicators
          WHERE county_id IN (${countyIds.map(() => '?').join(',')})
          UNION ALL
          SELECT 
            'grain_yield' as indicator,
            '粮食产量' as name,
            AVG(CASE WHEN year <= ? THEN grain_yield END) as before_avg,
            AVG(CASE WHEN year > ? THEN grain_yield END) as after_avg,
            '万吨' as unit
          FROM agriculture_indicators
          WHERE county_id IN (${countyIds.map(() => '?').join(',')})
          UNION ALL
          SELECT 
            'road_mileage' as indicator,
            '公路里程' as name,
            AVG(CASE WHEN year <= ? THEN road_mileage END) as before_avg,
            AVG(CASE WHEN year > ? THEN road_mileage END) as after_avg,
            '公里' as unit
          FROM infrastructure_indicators
          WHERE county_id IN (${countyIds.map(() => '?').join(',')})
          UNION ALL
          SELECT 
            'primary_schools' as indicator,
            '小学数量' as name,
            AVG(CASE WHEN year <= ? THEN primary_schools END) as before_avg,
            AVG(CASE WHEN year > ? THEN primary_schools END) as after_avg,
            '所' as unit
          FROM edu_culture_indicators
          WHERE county_id IN (${countyIds.map(() => '?').join(',')})
        `, [
          midYear, midYear, ...countyIds,
          midYear, midYear, ...countyIds,
          midYear, midYear, ...countyIds,
          midYear, midYear, ...countyIds,
          midYear, midYear, ...countyIds,
          midYear, midYear, ...countyIds
        ]);
        
        indicatorEffects = effects.map(e => ({
          ...e,
          before_avg: parseFloat(e.before_avg) || 0,
          after_avg: parseFloat(e.after_avg) || 0,
          change_pct: e.before_avg > 0 
            ? (((e.after_avg - e.before_avg) / e.before_avg) * 100).toFixed(1)
            : 0,
          period: `${minYear}-${midYear} vs ${midYear + 1}-${maxYear}`
        })).filter(e => e.before_avg > 0 && e.after_avg > 0);
      }
    }
    
    return {
      policy,
      counties,
      resources,
      interviews,
      indicator_effects: indicatorEffects
    };
  } catch (error) {
    console.error('获取政策详情失败:', error);
    throw error;
  }
};

/**
 * 获取政策统计信息（用于筛选器和概览）
 * @returns {Promise<Object>} 统计数据
 */
exports.getPolicyStats = async () => {
  try {
    // 1. 按类型统计
    const [typeStats] = await pool.query(`
      SELECT policy_type, COUNT(*) as count
      FROM policies
      GROUP BY policy_type
      ORDER BY count DESC
    `);
    
    // 2. 覆盖范围统计
    const [coverageStats] = await pool.query(`
      SELECT 
        MIN(county_count) as min_coverage,
        MAX(county_count) as max_coverage,
        AVG(county_count) as avg_coverage,
        COUNT(DISTINCT rpc.county_id) as total_counties
      FROM v_policy_stats
      LEFT JOIN rel_policy_county rpc ON 1=1
    `);
    
    // 3. 年份分布
    const [yearStats] = await pool.query(`
      SELECT 
        YEAR(issue_date) as year,
        COUNT(*) as count
      FROM policies
      WHERE issue_date IS NOT NULL
      GROUP BY YEAR(issue_date)
      ORDER BY year DESC
      LIMIT 10
    `);
    
    // 4. 城市分布
    const [cityStats] = await pool.query(`
      SELECT 
        c.city,
        COUNT(DISTINCT rpc.policy_id) as policy_count
      FROM rel_policy_county rpc
      JOIN counties c ON rpc.county_id = c.county_id
      GROUP BY c.city
      ORDER BY policy_count DESC
    `);
    
    return {
      by_type: typeStats.map(({ policy_type, count }) => ({
        policy_type: policy_type,
        type_name: policy_type,
        count: parseInt(count)
      })),
      coverage: {
        min: parseInt(coverageStats[0].min_coverage) || 0,
        max: parseInt(coverageStats[0].max_coverage) || 0,
        avg: parseFloat(coverageStats[0].avg_coverage) || 0,
        total: parseInt(coverageStats[0].total_counties) || 0
      },
      by_year: yearStats.map(({ year, count }) => ({
        publish_year: year,
        count: parseInt(count)
      })),
      by_city: cityStats.reduce((acc, { city, policy_count }) => {
        acc[city] = parseInt(policy_count);
        return acc;
      }, {})
    };
  } catch (error) {
    console.error('获取政策统计失败:', error);
    throw error;
  }
};

/**
 * 获取单条访谈完整内容
 * @param {String} dataId - 访谈数据ID
 * @returns {Promise<Object>} 访谈完整内容
 */
exports.getInterviewFullContent = async (dataId) => {
  try {
    // 获取访谈基本信息
    const [basicInfo] = await pool.query(`
      SELECT 
        id.data_id,
        id.event_id,
        id.keywords,
        id.experience_summary,
        id.content,
        evt.event_date,
        evt.location,
        evt.topic,
        GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ', ') as researcher_name
      FROM interview_data id
      JOIN interview_events evt ON id.event_id = evt.event_id
      LEFT JOIN rel_data_researcher rdr ON id.data_id = rdr.data_id
      LEFT JOIN researchers r ON rdr.researcher_id = r.researcher_id
      WHERE id.data_id = ?
      GROUP BY id.data_id, id.event_id, id.keywords, id.experience_summary, id.content,
               evt.event_date, evt.location, evt.topic
    `, [dataId]);
    
    if (basicInfo.length === 0) {
      throw new Error('访谈数据不存在');
    }
    
    // 获取该访谈事件的所有受访者列表
    const [interviewees] = await pool.query(`
      SELECT 
        ie.interviewee_id,
        ie.name as interviewee_name,
        ie.identity,
        ie.unit,
        c.county_name,
        c.city
      FROM rel_interviewee_event rie
      JOIN interviewees ie ON rie.interviewee_id = ie.interviewee_id
      LEFT JOIN counties c ON ie.county_id = c.county_id
      WHERE rie.event_id = ?
      ORDER BY ie.name
    `, [basicInfo[0].event_id]);
    
    // 合并数据
    const result = {
      ...basicInfo[0],
      interview_date: basicInfo[0].event_date, // 添加兼容字段
      interviewees: interviewees // 受访者列表
    };
    
    return result;
  } catch (error) {
    console.error('获取访谈完整内容失败:', error);
    throw error;
  }
};

/**
 * 获取城市列表（用于筛选）
 * @returns {Promise<Array>} 城市列表
 */
exports.getCities = async () => {
  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT city 
      FROM counties 
      WHERE city IS NOT NULL 
      ORDER BY city
    `);
    return rows.map(r => r.city);
  } catch (error) {
    console.error('获取城市列表失败:', error);
    throw error;
  }
};
