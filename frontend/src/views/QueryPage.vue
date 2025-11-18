<template>
  <div class="query-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>智能数据查询</h2>
      <p>通过自然语言提问，快速获取数据分析结果</p>
    </div>
    
    <!-- 引入智能查询组件 -->
    <IntelligentQuery />
  </div>
</template>

<script setup>
// 导入之前创建的智能查询组件
import IntelligentQuery from '../components/IntelligentQuery.vue';
</script>

<style scoped>
.query-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.page-header h2 {
  margin: 0 0 10px 0;
  font-size: 24px;
  color: #333;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 16px;
}
</style>