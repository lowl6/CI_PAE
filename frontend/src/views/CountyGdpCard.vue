<template>
<!-- 旗县选择器区域 -->
      <div class="county-selector-section">
        <div class="section-title">旗县详情分析</div>
        <div class="selector-container">
          <div class="selector-group">
            <label>选择盟市：</label>
            <select v-model="selectedCity" @change="handleCityChange">
              <option value="">全部盟市</option>
              <option v-for="city in cities" :key="city" :value="city">{{ city }}</option>
            </select>
          </div>
          <div class="selector-group">
            <label>选择旗县：</label>
            <select v-model="selectedCounty" @change="handleCountyChange">
              <option value="">请选择旗县</option>
              <option v-for="county in filteredCounties" :key="county.id" :value="county.id">
                {{ county.name }}
              </option>
            </select>
          </div>
        
        </div>
      </div>

      <!-- 旗县基本信息卡片 -->
      <div v-if="selectedCountyData" class="county-basic-info">
        <div class="info-card">
          <h3>{{ selectedCountyData.name }} - 基本信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">所属盟市：</span>
              <span class="info-value">{{ selectedCountyData.city }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">面积：</span>
              <span class="info-value">{{ selectedCountyData.area }} 平方公里</span>
            </div>
            <div class="info-item">
              <span class="info-label">户籍人口：</span>
              <span class="info-value">{{ formatNumber(selectedCountyData.population) }} 人</span>
            </div>
            <div class="info-item">
              <span class="info-label">贫困等级：</span>
              <span class="info-value" :class="getPovertyLevelClass(selectedCountyData.povertyLevel)">
                {{ selectedCountyData.povertyLevel }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 核心经济指标趋势图 -->
      <div v-if="selectedCountyData" class="trend-charts">
        <div class="chart-section">
          <h3>地区生产总值趋势 (2018-2023)</h3>
          <div class="chart-container">
            <div class="chart-card full-width">
              <div class="chart-header">
                <span class="chart-title">GDP发展趋势 - {{ selectedCountyData.name }}</span>
                <div class="chart-legend">
                  
                </div>
              </div>
              <div class="chart-content">
                <GDPTrendChart :countyData="selectedCountyData" />
              </div>
            </div>
          </div>
        </div>
      </div>
</template>

<script>
const props = defineProps({
  countyId: { type: String, default: '' }
})

// 写死数据示例（仅兴和县）
const mockMap = {
  '150924': {
    id: '150924',
    name: '兴和县',
    city: '乌兰察布市',
    area: 3513,
    population: 305200,
    povertyLevel: '已脱贫'
  }
}

const mock = mockMap[props.countyId]

// 工具函数
function formatNumber(n) {
  return n?.toLocaleString('zh-CN') || ''
}
function getPovertyLevelClass(level) {
  return level === '已脱贫' ? 'success' : ''
}
</script>

<style scoped>
/* 新增样式 - 旗县详情相关 */

/* 旗县选择器区域 */
.county-selector-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #c0392b;
}
.selector-container {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.selector-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.selector-group label {
  font-weight: 500;
  color: #555;
  white-space: nowrap;
}

.selector-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  min-width: 150px;
}
/* 基本信息卡片 */
.county-basic-info {
  margin-bottom: 20px;
}

.info-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.info-card h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-label {
  color: #666;
}

.info-value {
  font-weight: 500;
  color: #333;
}

/* 贫困等级样式 */
.poverty-high { color: #e74c3c; font-weight: bold; }
.poverty-medium { color: #f39c12; font-weight: bold; }
.poverty-low { color: #27ae60; font-weight: bold; }

/* 趋势图表区域 */
.trend-charts {
  margin-bottom: 20px;
}

.chart-section h3 {
  margin: 0 0 16px ;
  color: #333;
  font-size: 16px;
}

.chart-card.full-width {
  width: 100%;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-legend {
  display: flex;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.gdp { background: #3498db; }
.legend-color.growth { background: #2ecc71; }

.chart-content {
  height: 300px;
}
/* 政策更新区域 */
.policies-section {
  margin-bottom: 20px;
}

.policies-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.policies-card h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
}

.policies-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.policy-item {
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  transition: all 0.3s;
}

.policy-item:hover {
  border-color: #c0392b;
  box-shadow: 0 2px 8px rgba(192, 57, 43, 0.1);
}

.policy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.policy-title {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.policy-date {
  color: #999;
  font-size: 12px;
}

.policy-content p {
  margin: 0 0 8px 0;
  color: #666;
  line-height: 1.5;
}

.policy-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.policy-status {
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.policy-status.implementing { background: #fff3cd; color: #856404; }
.policy-status.completed { background: #d4edda; color: #155724; }

.policy-source {
  color: #999;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .selector-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .selector-group {
    justify-content: space-between;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>