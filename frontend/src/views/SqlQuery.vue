<template>
  <div class="sql-query-container">
    <div class="header-section">
      <h2>SQL查询工具</h2>
      <p class="subtitle">请输入 SQL 查询语句</p>
    </div>

    <div class="input-section">
      <div class="label-row">
        <label>SQL 语句输入:</label>
        <div class="actions">
          <button class="btn-clear" @click="clearSql">清空</button>
          <button class="btn-run" @click="handleExecute" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? '查询中...' : '执行查询' }}
          </button>
        </div>
      </div>
      <textarea 
        v-model="sqlInput" 
        class="sql-editor" 
        placeholder="例如: SELECT * FROM counties LIMIT 10;"
      ></textarea>
    </div>

    <div class="output-section">
      <label>查询结果:</label>
      
      <div class="result-container">
        <div v-if="isError" class="message-box error">
          <strong>执行出错:</strong>
          <pre>{{ errorMessage }}</pre>
        </div>

        <div v-else-if="loading" class="message-box loading">
          正在从数据库检索数据...
        </div>

        <div v-else-if="queryResult.length > 0" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th v-for="col in columns" :key="col">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in queryResult" :key="index">
                <td v-for="col in columns" :key="col">{{ formatValue(row[col]) }}</td>
              </tr>
            </tbody>
          </table>
          <div class="record-count">共查询到 {{ queryResult.length }} 条记录</div>
        </div>

        <div v-else class="message-box empty">
          {{ hasExecuted ? '查询成功，但未返回任何数据。' : '等待执行查询...' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api'

export default {
  name: 'SqlQuery',
  data() {
    return {
      sqlInput: '',
      loading: false,
      hasExecuted: false,
      isError: false,
      errorMessage: '',
      queryResult: [], // 存储原始数据数组
      columns: []      // 存储动态表头
    }
  },
  methods: {
    async handleExecute() {
      if (!this.sqlInput.trim()) {
        this.isError = true;
        this.errorMessage = '请输入 SQL 语句后再执行。';
        return;
      }

      this.loading = true;
      this.isError = false;
      this.hasExecuted = false;
      this.queryResult = [];
      this.columns = [];

      try {
        const res = await api.sql.execute(this.sqlInput);
        
        if (res.data.ok) {
          const rows = res.data.data;
          this.queryResult = rows;
          
          // 动态提取表头：取第一行数据的 Key
          if (Array.isArray(rows) && rows.length > 0) {
            this.columns = Object.keys(rows[0]);
          }
        } else {
          this.isError = true;
          this.errorMessage = res.data.error;
        }
      } catch (err) {
        this.isError = true;
        this.errorMessage = err.message || '请求发送失败';
      } finally {
        this.loading = false;
        this.hasExecuted = true;
      }
    },
    clearSql() {
      this.sqlInput = '';
      this.queryResult = [];
      this.columns = [];
      this.isError = false;
      this.hasExecuted = false;
    },
    formatValue(val) {
      if (val === null || val === undefined) return '-';
      if (typeof val === 'object') return JSON.stringify(val);
      return val;
    }
  }
}
</script>

<style scoped>
.sql-query-container {
  padding: 24px;
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
  gap: 20px;
  box-sizing: border-box;
}

.header-section h2 {
  margin: 0 0 8px 0;
  color: #2c3e50;
}

.subtitle {
  color: #666;
  font-size: 0.9em;
  margin: 0;
}

.input-section {
  flex: 0 0 30%; /* 固定高度比例 */
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.output-section {
  flex: 1; /* 剩余空间全给结果区 */
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden; /* 防止父容器撑开 */
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

label {
  font-weight: bold;
  color: #34495e;
}

.actions button {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  margin-left: 10px;
  transition: background 0.2s;
}

.btn-run {
  background-color: #1677ff;
  color: white;
}
.btn-run:hover { background-color: #4096ff; }
.btn-run:disabled { background-color: #91caff; cursor: not-allowed; }

.btn-clear {
  background-color: #f0f0f0;
  color: #333;
}
.btn-clear:hover { background-color: #d9d9d9; }

.sql-editor {
  width: 100%;
  height: 100%;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  box-sizing: border-box;
}
.sql-editor:focus {
  outline: none;
  border-color: #1677ff;
}

/* 结果容器 */
.result-container {
  flex-grow: 1;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* 表格包装器：负责滚动 */
.table-wrapper {
  flex: 1;
  overflow: auto;
  padding: 0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 600px; /* 保证最小宽度 */
}

.data-table th {
  background-color: #fafafa;
  color: #262626;
  font-weight: 600;
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0; /* 固定表头 */
  z-index: 10;
  white-space: nowrap;
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  color: #595959;
  white-space: nowrap;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.data-table tr:hover td {
  background-color: #fafafa;
}

.record-count {
  padding: 8px 16px;
  font-size: 12px;
  color: #999;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
  text-align: right;
}

/* 提示框样式 */
.message-box {
  padding: 40px;
  text-align: center;
  color: #999;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.message-box.error {
  color: #ff4d4f;
  background: #fff2f0;
  align-items: flex-start;
  text-align: left;
  padding: 20px;
}

.message-box.error pre {
  margin-top: 10px;
  white-space: pre-wrap;
  font-family: monospace;
}
</style>