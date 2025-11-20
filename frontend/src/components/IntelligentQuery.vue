<template>
  <div class="intelligent-query">
    <textarea 
      v-model="question" 
      placeholder="请输入您的查询问题... 例如：2023年兴和县的GDP和粮食产量分别是多少？"
      class="query-input"
    ></textarea>
    <button 
      @click="handleQuery" 
      :disabled="isLoading"
      class="query-btn"
    >
      {{ isLoading ? '查询中...' : '查询' }}
    </button>
    
    <!-- 结果展示 -->
    <div v-if="queryData" class="result-container">

      <!-- ============================ -->
      <!-- 1. 分析报告 (默认展开) -->
      <!-- ============================ -->
      <div class="result-section">
        <h3>分析报告</h3>
        <div class="report-content" v-html="formatReport(queryData.report)"></div>
      </div>

      <!-- ============================ -->
      <!-- 2. 查询结果 (默认折叠) -->
      <!-- ============================ -->
      <div class="result-section">
        <h3 @click="isTableVisible = !isTableVisible" class="collapsible-header">
          查询结果 (数据)
          <span class="toggle-icon">{{ isTableVisible ? '▲ 折叠' : '▼ 展开' }}</span>
        </h3>
        <div v-if="isTableVisible">
          <div v-if="!queryData.result || queryData.result.length === 0" class="no-data">
            数据库未返回任何数据。
          </div>
          <table v-else>
            <thead>
              <tr>
                <th v-for="header in tableHeaders" :key="header">{{ header }}</th>
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
      
      <!-- ============================ -->
      <!-- 3. 生成的SQL (默认折叠) -->
      <!-- ============================ -->
      <div class="result-section">
        <h3 @click="isSqlVisible = !isSqlVisible" class="collapsible-header">
          生成的SQL
          <span class="toggle-icon">{{ isSqlVisible ? '▲ 折叠' : '▼ 展开' }}</span>
        </h3>
        <pre v-if="isSqlVisible">{{ queryData.sql }}</pre>
      </div>

      <!-- ============================ -->
      <!-- 4. AI 规划步骤 (新增, 默认折叠) -->
      <!-- ============================ -->
      <div class="result-section">
        <h3 @click="isPlanVisible = !isPlanVisible" class="collapsible-header">
          AI 分析规划
          <span class="toggle-icon">{{ isPlanVisible ? '▲ 折叠' : '▼ 展开' }}</span>
        </h3>
        <div v-if="isPlanVisible" class="plan-content">
          {{ queryData.plan }}
        </div>
      </div>

    </div>
    
    <!-- 错误提示 -->
    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { nlpApi } from '../api/nlpApi';
import { marked } from 'marked'; 

const question = ref('');
const isLoading = ref(false);
const error = ref('');

// 将原来的 result 重命名为 queryData，更清晰
const queryData = ref(null); 

// 控制折叠状态
const isTableVisible = ref(false);
const isSqlVisible = ref(false);
const isPlanVisible = ref(false); // 新增 Plan 的折叠状态

// 动态计算表头
const tableHeaders = computed(() => {
  if (queryData.value && queryData.value.result && queryData.value.result.length > 0) {
    return Object.keys(queryData.value.result[0]);
  }
  return [];
});

// 格式化单元格值
const formatValue = (value) => {
  if (value === null) return 'N/A';
  // 你可以在这里添加更多格式化，例如日期或数字
  // 示例：将 "2023-10-01T00:00:00.000Z" 格式化为 "2023-10-01"
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
    return value.split('T')[0];
  }
  return value;
};

// 使用 marked 解析报告
const formatReport = (report) => {
  if (!report) return '';
  return marked.parse(report);
};

const handleQuery = async () => {
  if (!question.value.trim()) {
    error.value = '请输入查询问题';
    return;
  }
  
  // 重置状态
  error.value = '';
  queryData.value = null; // 重置数据
  isLoading.value = true;
  
  // 重置折叠状态
  isTableVisible.value = false;
  isSqlVisible.value = false;
  isPlanVisible.value = false; // 重置 Plan
  
  try {
    const response = await nlpApi.submitQuery(question.value);
    if (response.data.ok) {
      queryData.value = response.data.data; // 绑定到 queryData
      // 如果报告中包含错误信息，也将其显示在顶部的错误提示中
      if (queryData.value.report.includes("失败") || queryData.value.report.includes("出错")) {
        error.value = "查询处理中发生错误，详情请查看报告。";
      }
    } else {
      error.value = response.data.error;
G    }
  } catch (err) {
    const apiError = err.response?.data?.error || '查询失败，请稍后重试';
    error.value = apiError;
    console.error('查询错误:', err);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* --- 现有样式 (基本无变化) --- */
.query-input {
  width: 100%;
  height: 100px;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
}
.query-btn {
  padding: 10px 20px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}
.query-btn:disabled {
  background-color: #9e9e9e;
  cursor: not-allowed;
}
.result-container {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 4px;
}
.result-section {
  margin-bottom: 20px;
}
.result-section h3 {
  border-bottom: 2px solid #42b983;
  padding-bottom: 5px;
  margin-bottom: 10px;
}
.result-section pre {
  background-color: #f5f5ff;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-family: 'Courier New', Courier, monospace;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: left;
}
th {
  background-color: #f2f2f2;
  font-weight: bold;
}
.no-data {
  padding: 10px;
  color: #666;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.report-content {
  background-color: #fdfdfd;
  padding: 10px;
  border-radius: 4px;
  line-height: 1.6;
}
.error-message {
  color: #ff4444;
  margin-top: 10px;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
}

/* --- 新增/修改样式 --- */

/* 可折叠标题 */
.collapsible-header {
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none;
  border-radius: 4px;
  padding-top: 5px;
  padding-bottom: 5px;
}
.collapsible-header:hover {
  background-color: #f9f9f9;
}
.toggle-icon {
  font-size: 14px;
  color: #555;
  font-weight: normal;
}

/* AI 规划步骤的样式 */
.plan-content {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  color: #333;
  font-family: 'Courier New', Courier, monospace;
  line-height: 1.5;
  white-space: pre-wrap; /* 保持规划文本的换行 */
}

/* Markdown 渲染样式 */
.report-content :deep(p) {
  margin: 0 0 12px 0;
}
.report-content :deep(ul),
.report-content :deep(ol) {
  padding-left: 25px;
  margin-bottom: 12px;
}
.report-content :deep(li) {
  margin-bottom: 5px;
}
.report-content :deep(strong) {
  color: #333;
}
</style>