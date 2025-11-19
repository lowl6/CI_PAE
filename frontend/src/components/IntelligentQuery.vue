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
    <div v-if="result" class="result-container">

      <!-- ============================ -->
      <!-- 1. 分析报告 (默认展开) -->
      <!-- ============================ -->
      <div class="result-section">
        <h3>分析报告</h3>
        <!-- v-html 会渲染 marked 解析后的 HTML -->
        <div class="report-content" v-html="formatReport(result.report)"></div>
      </div>

      <!-- ============================ -->
      <!-- 2. 查询结果 (默认折叠) -->
      <!-- ============================ -->
      <div class="result-section">
        <!-- 可点击的标题 -->
        <h3 @click="isTableVisible = !isTableVisible" class="collapsible-header">
          查询结果
          <span class="toggle-icon">{{ isTableVisible ? '▲ 折叠' : '▼ 展开' }}</span>
        </h3>
        <div v-if="isTableVisible">
          <div v-if="!result.result || result.result.length === 0" class="no-data">
            数据库未返回任何数据。
          </div>
          <table v-else>
            <thead>
              <tr>
                <th v-for="header in tableHeaders" :key="header">{{ header }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in result.result" :key="index">
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
        <pre v-if="isSqlVisible">{{ result.sql }}</pre>
      </div>
    </div>
    
    <!-- 错误提示 -->
    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { nlpApi } from '../api/nlpApi';
import { marked } from 'marked'; // 1. 导入 marked

const question = ref('');
const isLoading = ref(false);
const result = ref(null);
const error = ref('');

// 2. 新增: 控制折叠状态
const isTableVisible = ref(false);
const isSqlVisible = ref(false);

// 动态计算表头 (不变)
const tableHeaders = computed(() => {
  if (result.value && result.value.result && result.value.result.length > 0) {
    return Object.keys(result.value.result[0]);
  }
  return [];
});

// 格式化单元格值 (不变)
const formatValue = (value) => {
  if (value === null) return 'N/A';
  return value;
};

// 3. 更新: 使用 marked 解析报告
const formatReport = (report) => {
  if (!report) return '';
  // marked.parse 会将 Markdown 字符串转换为 HTML
  return marked.parse(report);
};

const handleQuery = async () => {
  if (!question.value.trim()) {
    error.value = '请输入查询问题';
    return;
  }
  
  // 重置状态
  error.value = '';
  result.value = null;
  isLoading.value = true;
  
  // 4. 新增: 重置折叠状态
  isTableVisible.value = false;
  isSqlVisible.value = false;
  
  try {
    const response = await nlpApi.submitQuery(question.value);
    if (response.data.ok) {
      result.value = response.data.data;
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
</script>

<style scoped>
/* --- 现有样式 (无变化) --- */
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
  background-color: #f5f5f5;
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

/* --- 5. 新增样式 --- */

/* 可折叠标题的样式 */
.collapsible-header {
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none; /* 防止点击时选中文本 */
  border-radius: 4px;
  padding-top: 5px;
  padding-bottom: 5px;
}
.collapsible-header:hover {
  background-color: #f9f9f9; /* 悬停时轻微背景色 */
}
.toggle-icon {
  font-size: 14px;
  color: #555;
  font-weight: normal;
}

/*  使用 :deep() 穿透 scoped 样式,
  美化 marked 渲染出的 HTML 
*/
.report-content :deep(p) {
  margin: 0 0 12px 0; /* 段落下边距 */
}
.report-content :deep(ul),
.report-content :deep(ol) {
  padding-left: 25px; /* 列表缩进 */
  margin-bottom: 12px;
}
.report-content :deep(li) {
  margin-bottom: 5px; /* 列表项间距 */
}
.report-content :deep(strong) {
  color: #333; /* 加深粗体颜色 */
}
</style>