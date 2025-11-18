<template>
  <div class="intelligent-query">
    <textarea 
      v-model="question" 
      placeholder="请输入您的查询问题..."
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
      <div class="result-section">
        <h3>生成的SQL</h3>
        <pre>{{ result.sql }}</pre>
      </div>
      
      <div class="result-section">
        <h3>查询结果</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>用户ID</th>
              <th>金额</th>
              <th>状态</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in result.result" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.user_id }}</td>
              <td>{{ item.amount }}</td>
              <td>{{ item.status }}</td>
              <td>{{ item.create_time }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="result-section">
        <h3>分析报告</h3>
        <div class="report-content">{{ result.report }}</div>
      </div>
    </div>
    
    <!-- 错误提示 -->
    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { nlpApi } from '../api/nlpApi';

const question = ref('');
const isLoading = ref(false);
const result = ref(null);
const error = ref('');

const handleQuery = async () => {
  // 验证输入
  if (!question.value.trim()) {
    error.value = '请输入查询问题';
    return;
  }
  
  // 重置状态
  error.value = '';
  result.value = null;
  isLoading.value = true;
  
  try {
    // 调用API
    const response = await nlpApi.submitQuery(question.value);
    if (response.data.ok) {
      result.value = response.data.data;
    } else {
      error.value = response.data.error;
    }
  } catch (err) {
    error.value = '查询失败，请稍后重试';
    console.error('查询错误:', err);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.query-input {
  width: 100%;
  height: 100px;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.query-btn {
  padding: 8px 16px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
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

.result-section pre {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}

.error-message {
  color: #ff4444;
  margin-top: 10px;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
}
</style>