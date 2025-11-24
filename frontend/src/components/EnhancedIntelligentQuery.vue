<template>
  <div class="enhanced-intelligent-query">
    <div class="query-input-section">
      <h3>智能政策查询</h3>
      <p class="subtitle">通过自然语言提问，获取政策效果分析和数据洞察</p>

      <!-- 主要查询输入 -->
      <div class="query-input-container">
        <textarea
          v-model="question"
          placeholder="请输入您的查询问题... 例如：武川县马铃薯种薯补贴政策实施后对当地经济有什么影响？"
          class="query-input"
          rows="3"
        ></textarea>
        <div class="query-controls">
          <button
            @click="handleQuery"
            :disabled="isLoading"
            class="query-btn primary"
          >
            {{ isLoading ? '查询中...' : '开始分析' }}
          </button>
          <button
            @click="clearQuery"
            :disabled="isLoading"
            class="query-btn secondary"
          >
            清空
          </button>
        </div>
      </div>

      <!-- 快速查询建议 -->
      <div class="quick-suggestions">
        <h4>快速查询建议：</h4>
        <div class="suggestion-chips">
          <button
            v-for="suggestion in policySuggestions"
            :key="suggestion.id"
            @click="selectSuggestion(suggestion)"
            class="suggestion-chip"
          >
            {{ suggestion.text }}
          </button>
        </div>
      </div>
    </div>

    <!-- 相关政策展示 -->
    <div v-if="relevantPolicies.length > 0" class="relevant-policies">
      <h4>相关政策分析</h4>
      <div class="policy-cards">
        <div v-for="policy in relevantPolicies" :key="policy.policy_id" class="policy-card">
          <div class="policy-header">
            <h5>{{ policy.policy_name }}</h5>
            <span class="policy-type">{{ policy.policy_type }}</span>
          </div>
          <div class="policy-content">
            <p class="policy-summary">{{ policy.summary }}</p>
            <div class="policy-details">
              <span class="detail-item">实施部门：{{ policy.department }}</span>
              <span class="detail-item">实施时间：{{ policy.implementation_date }}</span>
              <span class="detail-item">状态：{{ policy.status }}</span>
            </div>
            <div class="coverage-counties">
              <strong>覆盖县域：</strong>{{ policy.coverage_counties.join('、') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 结果展示 -->
    <div v-if="queryData" class="result-container">
      <!-- 分析报告 -->
      <div class="result-section">
        <h3 @click="isReportVisible = !isReportVisible" class="collapsible-header">
          <span class="icon">📊</span> 政策分析报告
          <span class="toggle-icon">{{ isReportVisible ? '▲ 折叠' : '▼ 展开' }}</span>
        </h3>
        <div v-if="isReportVisible" class="report-content enhanced" v-html="formatReport(queryData.report)"></div>
      </div>

      <!-- 查询结果数据 -->
      <div class="result-section">
        <h3 @click="isTableVisible = !isTableVisible" class="collapsible-header">
          <span class="icon">📋</span> 数据明细
          <span class="toggle-icon">{{ isTableVisible ? '▲ 折叠' : '▼ 展开' }}</span>
        </h3>
        <div v-if="isTableVisible">
          <div v-if="!queryData.result || queryData.result.length === 0" class="no-data">
            暂无相关数据
          </div>
          <div v-else class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th v-for="header in tableHeaders" :key="header">{{ formatHeader(header) }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in queryData.result" :key="index">
                  <td v-for="header in tableHeaders" :key="header">
                    {{ formatValue(item[header]) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- AI 分析规划 -->
      <div class="result-section">
        <h3 @click="isPlanVisible = !isPlanVisible" class="collapsible-header">
          <span class="icon">🤖</span> AI 分析思路
          <span class="toggle-icon">{{ isPlanVisible ? '▲ 折叠' : '▼ 展开' }}</span>
        </h3>
        <div v-if="isPlanVisible" class="plan-content enhanced">
          <div class="plan-section">
            <h5>分析策略：</h5>
            <p>{{ queryData.plan }}</p>
          </div>
          <div v-if="relevantPoliciesFromAI.length > 0" class="plan-section">
            <h5>AI识别的相关政策：</h5>
            <ul>
              <li v-for="policy in relevantPoliciesFromAI" :key="policy.policy_id">
                <strong>{{ policy.policy_name }}</strong> - {{ policy.relevance }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 生成的SQL -->
      <div class="result-section">
        <h3 @click="isSqlVisible = !isSqlVisible" class="collapsible-header">
          <span class="icon">💾</span> 查询语句
          <span class="toggle-icon">{{ isSqlVisible ? '▲ 折叠' : '▼ 展开' }}</span>
        </h3>
        <pre v-if="isSqlVisible" class="sql-code">{{ queryData.sql }}</pre>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { nlpApi } from '../api/nlpApi';
import { marked } from 'marked';
import { POLICY_DATA, matchPoliciesByQuestion } from '../data/policyData';

const question = ref('');
const isLoading = ref(false);
const error = ref('');
const queryData = ref(null);
const relevantPolicies = ref([]);
const relevantPoliciesFromAI = ref([]);

// 折叠状态控制
const isReportVisible = ref(true); // 报告默认展开
const isTableVisible = ref(false);
const isPlanVisible = ref(false);
const isSqlVisible = ref(false);

// 快速查询建议
const policySuggestions = ref([
  {
    id: 1,
    text: '武川县马铃薯补贴政策效果如何？'
  },
  {
    id: 2,
    text: '健康扶贫政策对因病致贫的影响'
  },
  {
    id: 3,
    text: '旅游扶贫政策的经济发展效果'
  },
  {
    id: 4,
    text: '产业扶持政策对就业的影响'
  },
  {
    id: 5,
    text: '技能培训政策的效果分析'
  }
]);

// 动态计算表头
const tableHeaders = computed(() => {
  if (queryData.value && queryData.value.result && queryData.value.result.length > 0) {
    return Object.keys(queryData.value.result[0]);
  }
  return [];
});

// 格式化表头显示
const formatHeader = (header) => {
  const headerMap = {
    'county_name': '县名',
    'city': '市',
    'year': '年份',
    'gdp': 'GDP(亿元)',
    'disp_income_rural': '农村居民人均可支配收入(元)',
    'grain_yield': '粮食产量(吨)',
    'arable_land': '耕地面积(公顷)',
    'policy_name': '政策名称',
    'policy_type': '政策类型',
    'implementation_date': '实施日期',
    'status': '状态'
  };
  return headerMap[header] || header;
};

// 格式化单元格值
const formatValue = (value) => {
  if (value === null || value === undefined) return 'N/A';

  // 日期格式化
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
    return value.split('T')[0];
  }

  // 数值格式化
  if (typeof value === 'number') {
    if (value > 100000000) {
      return (value / 100000000).toFixed(2) + '亿';
    } else if (value > 10000) {
      return (value / 10000).toFixed(2) + '万';
    }
    return value.toFixed(2);
  }

  return value;
};

// 使用 marked 解析报告
const formatReport = (report) => {
  if (!report) return '';
  return marked.parse(report);
};

// 选择快速建议
const selectSuggestion = (suggestion) => {
  question.value = suggestion.text;
  handleQuery();
};

// 清空查询
const clearQuery = () => {
  question.value = '';
  queryData.value = null;
  error.value = '';
  relevantPolicies.value = [];
  relevantPoliciesFromAI.value = [];
  // 重置折叠状态
  isReportVisible.value = true;
  isTableVisible.value = false;
  isPlanVisible.value = false;
  isSqlVisible.value = false;
};

// 主查询处理
const handleQuery = async () => {
  if (!question.value.trim()) {
    error.value = '请输入查询问题';
    return;
  }

  // 重置状态
  error.value = '';
  queryData.value = null;
  relevantPoliciesFromAI.value = [];

  // 前端匹配相关政策
  const matchedPolicies = matchPoliciesByQuestion(question.value);
  relevantPolicies.value = matchedPolicies.slice(0, 3); // 最多显示3个相关政策

  isLoading.value = true;

  try {
    const response = await nlpApi.submitQuery(question.value);
    if (response.data.ok) {
      queryData.value = response.data.data;

      // 解析AI识别的相关政策（如果有的话）
      try {
        // 这里可以尝试从AI的plan中提取政策信息
        // 但目前的格式可能不支持，先保留这个结构
        if (queryData.value.plan && queryData.value.plan.includes('政策')) {
          // 可以在这里添加解析逻辑
        }
      } catch (e) {
        console.log('解析AI政策信息失败:', e);
      }

      // 如果报告中包含错误信息，也显示在错误提示中
      if (queryData.value.report.includes("失败") || queryData.value.report.includes("出错")) {
        error.value = "查询处理中发生错误，详情请查看报告。";
      }
    } else {
      error.value = response.data.error;
    }
  } catch (err) {
    const apiError = err.response?.data?.error || '查询失败，请稍后重试';
    error.value = apiError;
    console.error('查询错误:', err);
  } finally {
    isLoading.value = false;
  }
};

// 组件挂载时设置默认展开报告
onMounted(() => {
  isReportVisible.value = true;
});
</script>

<style scoped>
.enhanced-intelligent-query {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.query-input-section h3 {
  color: #1890ff;
  margin-bottom: 8px;
  font-size: 20px;
}

.subtitle {
  color: #666;
  margin-bottom: 20px;
  font-size: 14px;
}

.query-input-container {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.query-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #d9d9d9;
  border-radius: 6px;
  font-size: 16px;
  resize: vertical;
  margin-bottom: 15px;
}

.query-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24,144,255,0.2);
}

.query-controls {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.query-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.query-btn.primary {
  background-color: #1890ff;
  color: white;
}

.query-btn.primary:hover {
  background-color: #40a9ff;
}

.query-btn.primary:disabled {
  background-color: #d9d9d9;
  cursor: not-allowed;
}

.query-btn.secondary {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #d9d9d9;
}

.query-btn.secondary:hover {
  background-color: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.quick-suggestions {
  background: #fff;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}

.quick-suggestions h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 14px;
}

.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-chip {
  padding: 6px 12px;
  background: #f0f9ff;
  border: 1px solid #91d5ff;
  border-radius: 16px;
  color: #1890ff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.suggestion-chip:hover {
  background: #e6f7ff;
  border-color: #1890ff;
  transform: translateY(-1px);
}

.relevant-policies {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.relevant-policies h4 {
  margin: 0 0 15px 0;
  color: #1890ff;
  font-size: 16px;
}

.policy-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.policy-card {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 15px;
  background: #fafafa;
}

.policy-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.policy-header h5 {
  margin: 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
  flex: 1;
  line-height: 1.4;
}

.policy-type {
  background: #e6f7ff;
  color: #1890ff;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  white-space: nowrap;
}

.policy-summary {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 12px;
  line-height: 1.4;
}

.policy-details {
  margin-bottom: 10px;
}

.detail-item {
  font-size: 11px;
  color: #999;
  margin-right: 15px;
}

.coverage-counties {
  font-size: 12px;
  color: #333;
}

.result-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.result-section {
  border-bottom: 1px solid #f0f0f0;
}

.result-section:last-child {
  border-bottom: none;
}

.collapsible-header {
  padding: 15px 20px;
  margin: 0;
  background: #fafafa;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: none;
  width: 100%;
  text-align: left;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  transition: background-color 0.3s;
}

.collapsible-header:hover {
  background: #f0f0f0;
}

.collapsible-header .icon {
  margin-right: 8px;
}

.toggle-icon {
  font-size: 12px;
  color: #999;
  font-weight: normal;
}

.report-content.enhanced {
  padding: 20px;
  line-height: 1.6;
}

.report-content.enhanced :deep(h1),
.report-content.enhanced :deep(h2),
.report-content.enhanced :deep(h3),
.report-content.enhanced :deep(h4),
.report-content.enhanced :deep(h5) {
  color: #1890ff;
  margin-top: 20px;
  margin-bottom: 10px;
}

.report-content.enhanced :deep(p) {
  margin: 0 0 12px 0;
}

.report-content.enhanced :deep(ul),
.report-content.enhanced :deep(ol) {
  padding-left: 25px;
  margin-bottom: 12px;
}

.report-content.enhanced :deep(li) {
  margin-bottom: 5px;
}

.report-content.enhanced :deep(strong) {
  color: #333;
}

.report-content.enhanced :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 15px 0;
}

.report-content.enhanced :deep(th),
.report-content.enhanced :deep(td) {
  border: 1px solid #f0f0f0;
  padding: 8px 12px;
  text-align: left;
}

.report-content.enhanced :deep(th) {
  background: #fafafa;
  font-weight: 600;
}

.data-table-container {
  padding: 20px;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th,
.data-table td {
  border: 1px solid #f0f0f0;
  padding: 12px;
  text-align: left;
}

.data-table th {
  background: #fafafa;
  font-weight: 600;
  color: #333;
}

.data-table tr:hover {
  background: #f9f9f9;
}

.plan-content.enhanced {
  padding: 20px;
  background: #f8f9fa;
}

.plan-section {
  margin-bottom: 20px;
}

.plan-section:last-child {
  margin-bottom: 0;
}

.plan-section h5 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.plan-section p {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

.plan-section ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.plan-section li {
  margin-bottom: 5px;
  color: #666;
  line-height: 1.4;
}

.sql-code {
  padding: 20px;
  background: #f5f5f5;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  overflow-x: auto;
  margin: 0;
  color: #333;
}

.no-data {
  padding: 40px;
  text-align: center;
  color: #999;
  background: #fafafa;
}

.error-message {
  color: #ff4d4f;
  padding: 15px;
  background: #fff2f0;
  border-radius: 6px;
  margin-top: 20px;
  border: 1px solid #ffccc7;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .enhanced-intelligent-query {
    padding: 10px;
  }

  .policy-cards {
    grid-template-columns: 1fr;
  }

  .query-controls {
    flex-direction: column;
  }

  .suggestion-chips {
    justify-content: center;
  }
}
</style>