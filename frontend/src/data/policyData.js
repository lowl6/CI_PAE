/**
 * 政策数据管理模块
 * 用于智能查询系统的政策数据集成
 */

// 静态政策数据 - 来自用户的政策列表
export const POLICY_DATA = [
  {
    policy_id: 'POL001',
    policy_name: '武川县马铃薯种薯繁育基地建设补贴实施方案',
    policy_type: '农业产业扶持',
    department: '武川县农牧业局',
    issue_date: '2016-03-15',
    implementation_date: '2016-04-01',
    status: '已完成',
    summary: '针对建档立卡贫困户种植高产马铃薯提供种薯补贴和技术指导，旨在提升亩产值。',
    keywords: ['马铃薯', '种薯', '补贴', '技术指导', '建档立卡'],
    coverage_counties: ['武川县'],
    similar_policies: [] // 将通过算法计算相似政策
  },
  {
    policy_id: 'POL002',
    policy_name: '林西县健康扶贫"兜底保障"工程实施细则',
    policy_type: '医疗保障',
    department: '林西县卫生健康委员会',
    issue_date: '2017-05-20',
    implementation_date: '2017-06-01',
    status: '执行中',
    summary: '为贫困人口购买补充商业医疗保险，将慢性病门诊报销比例提高至90%以上，解决因病致贫问题。',
    keywords: ['健康扶贫', '兜底保障', '医疗保险', '慢性病', '报销比例'],
    coverage_counties: ['林西县'],
    similar_policies: []
  },
  {
    policy_id: 'POL003',
    policy_name: '阿尔山市"旅游+扶贫"生态农家乐奖补办法',
    policy_type: '产业发展',
    department: '阿尔山市文化旅游体育局',
    issue_date: '2018-02-10',
    implementation_date: '2018-03-01',
    status: '已完成',
    summary: '鼓励贫困户利用自家房屋改造为特色民宿或农家乐，政府提供装修补贴和经营培训。',
    keywords: ['旅游扶贫', '农家乐', '民宿', '装修补贴', '经营培训'],
    coverage_counties: ['阿尔山市'],
    similar_policies: []
  },
  {
    policy_id: 'POL004',
    policy_name: '扎赉特旗农村牧区饮水安全巩固提升工程方案',
    policy_type: '基础设施建设',
    department: '扎赉特旗水利局',
    issue_date: '2018-04-05',
    implementation_date: '2018-05-01',
    status: '已完成',
    summary: '重点解决偏远嘎查村季节性缺水和水质氟超标问题，建设集中供水站和管网入户。',
    keywords: ['饮水安全', '水利工程', '集中供水', '水质改善', '管网建设'],
    coverage_counties: ['扎赉特旗'],
    similar_policies: []
  },
  {
    policy_id: 'POL005',
    policy_name: '科右中旗蒙古族刺绣非遗传承与技能培训计划',
    policy_type: '教育与文化',
    department: '科右中旗文化馆',
    issue_date: '2019-01-15',
    implementation_date: '2019-02-01',
    status: '执行中',
    summary: '设立刺绣扶贫车间，对贫困妇女进行免费刺绣技能培训，并回购成品，实现居家就业。',
    keywords: ['蒙古族刺绣', '非遗传承', '技能培训', '扶贫车间', '居家就业'],
    coverage_counties: ['科右中旗'],
    similar_policies: []
  },
  {
    policy_id: 'POL006',
    policy_name: '化德县服装加工产业园区招商引资及就业补贴政策',
    policy_type: '工业招商',
    department: '化德县工业和信息化局',
    issue_date: '2017-08-08',
    implementation_date: '2017-09-01',
    status: '执行中',
    summary: '利用京蒙对口帮扶资金建设服装加工园，对吸纳贫困人口就业的企业给予税收优惠和工资补贴。',
    keywords: ['服装加工', '产业园区', '招商引资', '就业补贴', '税收优惠'],
    coverage_counties: ['化德县'],
    similar_policies: []
  },
  {
    policy_id: 'POL007',
    policy_name: '全区建档立卡贫困劳动力转移就业交通补贴办法',
    policy_type: '社会保障与就业',
    department: '内蒙古自治区人力资源和社会保障厅',
    issue_date: '2019-02-20',
    implementation_date: '2019-03-01',
    status: '已完成',
    summary: '对跨盟市务工的贫困劳动力提供一次性交通补贴，鼓励外出务工增收。',
    keywords: ['转移就业', '交通补贴', '贫困劳动力', '外出务工', '增收'],
    coverage_counties: ['全区范围'], // 全区政策
    similar_policies: []
  },
  {
    policy_id: 'POL008',
    policy_name: '卓资县特色熏鸡产业发展基金管理办法',
    policy_type: '经济发展',
    department: '卓资县财政局',
    issue_date: '2018-06-10',
    implementation_date: '2018-07-01',
    status: '执行中',
    summary: '设立专项基金支持熏鸡产业链上下游企业，带动贫困户参与养殖和加工环节。',
    keywords: ['熏鸡产业', '发展基金', '产业链', '养殖加工', '贫困户参与'],
    coverage_counties: ['卓资县'],
    similar_policies: []
  },
  {
    policy_id: 'POL009',
    policy_name: '赤峰市易地扶贫搬迁后续产业扶持指导意见',
    policy_type: '人口与户籍',
    department: '赤峰市乡村振兴局',
    issue_date: '2017-03-12',
    implementation_date: '2017-04-01',
    status: '已完成',
    summary: '针对巴林左旗、巴林右旗等地搬迁人口，在安置点配套建设设施农业产业园，确保搬得出、稳得住。',
    keywords: ['易地搬迁', '后续扶持', '产业园区', '设施农业', '安置点'],
    coverage_counties: ['巴林左旗', '巴林右旗'],
    similar_policies: []
  },
  {
    policy_id: 'POL010',
    policy_name: '锡林郭勒盟草原生态补奖机制与脱贫攻坚衔接方案',
    policy_type: '生态经济',
    department: '锡林郭勒盟林草局',
    issue_date: '2018-05-05',
    implementation_date: '2018-06-01',
    status: '执行中',
    summary: '在苏尼特右旗等地聘用贫困人口为生态护林员，实现生态保护与脱贫增收双赢。',
    keywords: ['草原生态', '补奖机制', '生态护林员', '脱贫攻坚', '生态保护'],
    coverage_counties: ['苏尼特右旗'],
    similar_policies: []
  },
  {
    policy_id: 'POL011',
    policy_name: '通辽市"互联网+农产品"电商扶贫三年行动计划',
    policy_type: '工业投资贸易',
    department: '通辽市商务局',
    issue_date: '2019-08-20',
    implementation_date: '2019-09-01',
    status: '执行中',
    summary: '支持库伦旗、奈曼旗建设县级电商服务中心，打通杂粮杂豆上行渠道。',
    keywords: ['电商扶贫', '互联网+', '农产品', '电商服务', '杂粮杂豆'],
    coverage_counties: ['库伦旗', '奈曼旗'],
    similar_policies: []
  }
];

/**
 * 政策类型映射
 */
export const POLICY_TYPE_MAPPING = {
  '农业产业扶持': 'agriculture',
  '医疗保障': 'medical',
  '产业发展': 'industry',
  '基础设施建设': 'infrastructure',
  '教育与文化': 'education',
  '工业招商': 'investment',
  '社会保障与就业': 'social_security',
  '经济发展': 'economy',
  '人口与户籍': 'population',
  '生态经济': 'ecology',
  '工业投资贸易': 'trade'
};

/**
 * 政策效果指标映射
 */
export const POLICY_INDICATORS = {
  '农业产业扶持': ['gdp', 'disp_income_rural', 'grain_yield'],
  '医疗保障': ['disp_income_rural', 'registered_pop'],
  '产业发展': ['gdp', 'disp_income_rural', 'registered_pop'],
  '基础设施建设': ['road_mileage', 'gdp', 'registered_pop'],
  '教育与文化': ['primary_schools', 'disp_income_rural'],
  '工业招商': ['gdp', 'registered_pop', 'industrial_output'],
  '社会保障与就业': ['disp_income_rural', 'unemployment_rate'],
  '经济发展': ['gdp', 'industrial_output', 'fiscal_revenue'],
  '人口与户籍': ['registered_pop', 'urbanization_rate'],
  '生态经济': ['forest_coverage', 'environmental_quality'],
  '工业投资贸易': ['gdp', 'foreign_trade', 'industrial_output']
};

/**
 * 计算政策相似度
 * @param {string} policyId - 基准政策ID
 * @returns {Array} 相似政策列表
 */
export function calculateSimilarPolicies(policyId) {
  const basePolicy = POLICY_DATA.find(p => p.policy_id === policyId);
  if (!basePolicy) return [];

  const similarities = POLICY_DATA
    .filter(p => p.policy_id !== policyId)
    .map(policy => {
      let score = 0;

      // 政策类型相同 (权重: 0.3)
      if (policy.policy_type === basePolicy.policy_type) {
        score += 0.3;
      }

      // 关键词重叠度 (权重: 0.4)
      const keywordOverlap = basePolicy.keywords.filter(k =>
        policy.keywords.some(pk => pk.includes(k) || k.includes(pk))
      ).length;
      score += (keywordOverlap / Math.max(basePolicy.keywords.length, policy.keywords.length)) * 0.4;

      // 实施年份相近度 (权重: 0.2)
      const yearDiff = Math.abs(
        new Date(policy.implementation_date).getFullYear() -
        new Date(basePolicy.implementation_date).getFullYear()
      );
      score += Math.max(0, (5 - yearDiff) / 5) * 0.2;

      // 覆盖县域邻近度 (权重: 0.1)
      const hasCommonCounty = policy.coverage_counties.some(c =>
        basePolicy.coverage_counties.includes(c)
      );
      if (hasCommonCounty) score += 0.1;

      return {
        policy_id: policy.policy_id,
        policy_name: policy.policy_name,
        similarity_score: score,
        similarity_reason: getSimilarityReason(basePolicy, policy, score)
      };
    })
    .filter(p => p.similarity_score > 0.3)
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, 3);

  return similarities;
}

/**
 * 生成相似性说明
 */
function getSimilarityReason(basePolicy, policy, score) {
  const reasons = [];

  if (basePolicy.policy_type === policy.policy_type) {
    reasons.push('同类型政策');
  }

  const keywordOverlap = basePolicy.keywords.filter(k =>
    policy.keywords.some(pk => pk.includes(k) || k.includes(pk))
  );
  if (keywordOverlap.length > 0) {
    reasons.push(`关键词匹配: ${keywordOverlap.join(', ')}`);
  }

  const commonCounties = policy.coverage_counties.filter(c =>
    basePolicy.coverage_counties.includes(c)
  );
  if (commonCounties.length > 0) {
    reasons.push(`覆盖相同县域: ${commonCounties.join(', ')}`);
  }

  return reasons.join('; ') || '政策内容相似';
}

/**
 * 根据问题匹配相关政策
 * @param {string} question - 用户问题
 * @returns {Array} 匹配的政策列表
 */
export function matchPoliciesByQuestion(question) {
  const questionLower = question.toLowerCase();
  const matchedPolicies = [];

  POLICY_DATA.forEach(policy => {
    let score = 0;
    const matchDetails = [];

    // 政策名称匹配
    if (policy.policy_name.toLowerCase().includes(questionLower) ||
        questionLower.includes(policy.policy_name.toLowerCase())) {
      score += 1.0;
      matchDetails.push('政策名称匹配');
    }

    // 关键词匹配
    policy.keywords.forEach(keyword => {
      if (questionLower.includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(questionLower)) {
        score += 0.3;
        matchDetails.push(`关键词: ${keyword}`);
      }
    });

    // 政策类型匹配
    if (questionLower.includes(policy.policy_type.toLowerCase())) {
      score += 0.5;
      matchDetails.push(`政策类型: ${policy.policy_type}`);
    }

    // 覆盖县域匹配
    policy.coverage_counties.forEach(county => {
      if (questionLower.includes(county.toLowerCase())) {
        score += 0.4;
        matchDetails.push(`覆盖县域: ${county}`);
      }
    });

    if (score > 0.3) {
      matchedPolicies.push({
        ...policy,
        match_score: score,
        match_details: matchDetails
      });
    }
  });

  return matchedPolicies.sort((a, b) => b.match_score - a.match_score);
}

/**
 * 获取政策相关的查询建议
 * @param {Object} policy - 政策对象
 * @returns {Array} 查询建议列表
 */
export function getPolicyQuerySuggestions(policy) {
  const suggestions = [];
  const indicators = POLICY_INDICATORS[policy.policy_type] || [];

  // 基于政策覆盖县的指标查询
  policy.coverage_counties.forEach(county => {
    indicators.forEach(indicator => {
      suggestions.push({
        question: `${county}${policy.policy_name}实施后的${indicator}指标变化情况如何？`,
        type: 'indicator_analysis',
        county: county,
        policy: policy.policy_id,
        indicator: indicator
      });
    });
  });

  // 政策效果对比查询
  suggestions.push({
    question: `实施${policy.policy_name}的县与同类县的发展指标对比如何？`,
    type: 'comparison_analysis',
    policy: policy.policy_id
  });

  // 相似政策查询
  const similarPolicies = calculateSimilarPolicies(policy.policy_id);
  similarPolicies.forEach(similar => {
    suggestions.push({
      question: `${policy.policy_name}与${similar.policy_name}的实施效果有何异同？`,
      type: 'policy_comparison',
      policy1: policy.policy_id,
      policy2: similar.policy_id
    });
  });

  return suggestions;
}