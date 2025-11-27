<template>
  <div class="app-container">
    <main class="main-content">
      <!-- 面包屑 -->
      <div class="page-header">
        <div class="breadcrumb">
          <span>首页</span>
          <span class="icon-arrow-right">→</span>
          <span class="active">数据概览</span>
        </div>
      </div>

      <!-- 系统功能简介 -->
      <div class="system-features card">
        <div class="feature-main">
          <h2>内蒙古自治区乡村振兴监测系统</h2>
          <p class="feature-desc">
            本系统整合了内蒙古自治区各县区的多维度数据，提供全面的数据查询、趋势分析和区域对比功能，
            涵盖经济、人口、农业、工业、基础设施、教育科技、医疗卫生等七大核心领域，助力乡村振兴战略实施。
          </p>
          <div class="data-stats">
            <div class="stat-item">
              <span class="stat-number">12</span>
              <span class="stat-label">覆盖盟市</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">7</span>
              <span class="stat-label">数据维度</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">2018-2023</span>
              <span class="stat-label">统计年份</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ totalPoorCounties }}</span>
              <span class="stat-label">重点帮扶县</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 内蒙古地图 -->
      <div class="map-section card">
        <div class="chart-header">
          <h3 class="chart-title">内蒙古自治区行政区划</h3>
          <div class="map-controls">
            <span class="county-count">共 {{ totalCounties }} 个盟市</span>
          </div>
        </div>
        <div class="map-container">
          <div class="map-image-container">
            <img 
              src="/images/inner-mongolia-map.png" 
              alt="内蒙古自治区地图"
              class="inner-mongolia-map"
              @load="handleMapLoad"
              @error="handleMapError"
            >
            <div v-if="mapError" class="empty-state">
              <div class="empty-content">
                <div class="empty-icon">🗺️</div>
                <h3>地图加载失败</h3>
                <p>无法加载内蒙古地图，请检查网络连接或图片路径</p>
              </div>
            </div>
            <div v-else-if="!mapLoaded" class="empty-state">
              <div class="empty-content">
                <div class="loading-spinner"></div>
                <h3>地图加载中...</h3>
              </div>
            </div>
          </div>
          
          <div class="county-list">
            <h4>盟市列表 <span class="list-tip">(点击查看详情)</span></h4>
            <div class="county-grid">
              <div 
                v-for="county in counties" 
                :key="county.id"
                class="county-item"
                :class="{ 'active': selectedCounty === county.id }"
                @click="handleCountyClick(county)"
              >
                <span class="county-name">{{ county.name }}</span>
                <span class="county-data">重点帮扶县: {{ county.poorCountyCount || 0 }}</span>
                <span class="icon-arrow">→</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 盟市详情弹窗 -->
      <a-modal
        v-model:open="countyDetailVisible"
        :title="`${selectedCountyData.name} - 重点帮扶县详情`"
        width="700px"
        :footer="null"
      >
        <div class="county-detail-content">
          <div class="detail-summary">
            <a-statistic 
              title="重点帮扶县总数" 
              :value="selectedCountyData.poorCountyCount || 0" 
              suffix="个"
            />
            <a-statistic 
              title="已脱贫人口" 
              :value="selectedCountyData.poorPopulation || '--'" 
            />
          </div>
          
          <a-divider />
          
          <div class="poor-counties-list" v-if="selectedCountyData.poorCounties && selectedCountyData.poorCounties.length > 0">
            <h4>重点帮扶县列表</h4>
            <a-list
              :data-source="selectedCountyData.poorCounties"
              :grid="{ gutter: 16, column: 2 }"
            >
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-card size="small" hoverable>
                    <template #title>
                      <span style="font-size: 14px;">{{ item.name }}</span>
                    </template>
                    <p style="margin: 0; font-size: 12px; color: #666;">
                      贫困程度: <a-tag :color="getPovertyLevelColor(item.level)">{{ item.level }}</a-tag>
                    </p>
                  </a-card>
                </a-list-item>
              </template>
            </a-list>
          </div>
          
          <a-empty v-else description="暂无重点帮扶县数据" />
        </div>
      </a-modal>

      <!-- 核心指标 -->
      <div class="indicator-cards">
        <div
          class="card"
          v-for="(item, index) in indicators"
          :key="index"
        >
          <div class="card-header">
            <span class="card-icon">{{ getIndicatorIcon(index) }}</span>
            <span
              class="change-rate"
              :class="{ positive: item.change > 0 }"
            >
              <span class="icon-arrow-up">{{
                item.change > 0 ? '↑' : '↓'
              }}</span>
              {{ Math.abs(item.change) }}%
            </span>
          </div>
          <div class="card-body">
            <h4>{{ item.title }}</h4>
            <p class="card-value">{{ item.value }}</p>
          </div>
          <div class="card-footer">
            <span>{{ item.desc }}</span>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-overlay">
        <div class="loading-content">
          <div class="loading-spinner large"></div>
          <p>数据加载中...</p>
        </div>
      </div>

    </main>

    <!-- 页脚 -->
    <footer class="app-footer">
      <div class="footer-content">
        <span>内蒙古自治区乡村振兴智能监测系统 © 2025 版权所有</span>
        <div class="footer-links">
          <a href="#">关于系统</a>
          <a href="#">使用帮助</a>
          <a href="#">联系我们</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import { getDashboardData, getPoorCountyData } from '@/api/dashboard';

export default {
  name: 'Dashboard',
  data() {
    return {
      selectedCounty: '',
      countyDetailVisible: false,
      selectedCountyData: {},
      mapLoaded: false,
      mapError: false,
      loading: false,
      totalPoorCounties: 0,
      counties: [
        { id: 1, name: '呼和浩特市', poorCountyCount: 0 },
        { id: 2, name: '包头市', poorCountyCount: 0 },
        { id: 3, name: '呼伦贝尔市', poorCountyCount: 0 },
        { id: 4, name: '兴安盟', poorCountyCount: 0 },
        { id: 5, name: '通辽市', poorCountyCount: 0 },
        { id: 6, name: '赤峰市', poorCountyCount: 0 },
        { id: 7, name: '锡林郭勒盟', poorCountyCount: 0 },
        { id: 8, name: '乌兰察布市', poorCountyCount: 0 },
        { id: 9, name: '鄂尔多斯市', poorCountyCount: 0 },
        { id: 10, name: '巴彦淖尔市', poorCountyCount: 0 },
        { id: 11, name: '乌海市', poorCountyCount: 0 },
        { id: 12, name: '阿拉善盟', poorCountyCount: 0 }
      ],
      indicators: [
        { title: '已脱贫人数', value: '--', change: 0, desc: '较上一周期数据' },
        { title: '帮扶政策数', value: '--', change: 0, desc: '较上一周期增长' },
        { title: '访谈记录数', value: '--', change: 0, desc: '较上一周期增长' },
        { title: '群众满意度', value: '--', change: 0, desc: '较上一周期增长' }
      ],
      useMockData: false // 标记是否使用模拟数据
    };
  },
  computed: {
    totalCounties() {
      return this.counties.length;
    }
  },
  methods: {
    getIndicatorIcon(index) {
      const icons = ['👥', '📜', '🎙️', '😊'];
      return icons[index % icons.length];
    },
    handleMapLoad() {
      this.mapLoaded = true;
    },
    handleMapError() {
      this.mapError = true;
    },
    
    // 处理盟市点击事件
    handleCountyClick(county) {
      this.selectedCounty = county.id;
      this.selectedCountyData = {
        ...county,
        poorCounties: this.getMockPoorCountiesByCity(county.name),
        poorPopulation: this.calculatePoorPopulation(county.poorCountyCount)
      };
      this.countyDetailVisible = true;
    },
    
    // 获取贫困程度颜色
    getPovertyLevelColor(level) {
      const colorMap = {
        '深度贫困': 'red',
        '重度贫困': 'orange',
        '中度贫困': 'blue',
        '轻度贫困': 'green'
      };
      return colorMap[level] || 'default';
    },
    
    // 计算已脱贫人口(模拟数据)
    calculatePoorPopulation(countyCount) {
      if (!countyCount) return '0万人';
      const population = (countyCount * 1.5 + Math.random() * 2).toFixed(1);
      return `${population}万人`;
    },
    
    // 模拟获取盟市下的贫困县详情
    getMockPoorCountiesByCity(cityName) {
      const poorCountiesMap = {
        '呼和浩特市': [
          { name: '武川县', level: '中度贫困' },
          { name: '清水河县', level: '轻度贫困' }
        ],
        '包头市': [
          { name: '固阳县', level: '轻度贫困' }
        ],
        '呼伦贝尔市': [
          { name: '鄂伦春自治旗', level: '深度贫困' },
          { name: '莫力达瓦达斡尔族自治旗', level: '重度贫困' },
          { name: '阿荣旗', level: '中度贫困' },
          { name: '鄂温克族自治旗', level: '中度贫困' },
          { name: '陈巴尔虎旗', level: '轻度贫困' }
        ],
        '兴安盟': [
          { name: '科尔沁右翼前旗', level: '重度贫困' },
          { name: '科尔沁右翼中旗', level: '深度贫困' },
          { name: '扎赉特旗', level: '中度贫困' }
        ],
        '通辽市': [
          { name: '科尔沁左翼中旗', level: '深度贫困' },
          { name: '科尔沁左翼后旗', level: '重度贫困' },
          { name: '库伦旗', level: '中度贫困' },
          { name: '奈曼旗', level: '中度贫困' }
        ],
        '赤峰市': [
          { name: '阿鲁科尔沁旗', level: '重度贫困' },
          { name: '巴林左旗', level: '重度贫困' },
          { name: '巴林右旗', level: '中度贫困' },
          { name: '林西县', level: '中度贫困' },
          { name: '克什克腾旗', level: '轻度贫困' },
          { name: '翁牛特旗', level: '轻度贫困' }
        ],
        '锡林郭勒盟': [
          { name: '太仆寺旗', level: '中度贫困' },
          { name: '正镶白旗', level: '中度贫困' },
          { name: '正蓝旗', level: '轻度贫困' }
        ],
        '乌兰察布市': [
          { name: '化德县', level: '深度贫困' },
          { name: '商都县', level: '重度贫困' },
          { name: '兴和县', level: '中度贫困' },
          { name: '察哈尔右翼前旗', level: '轻度贫困' }
        ],
        '鄂尔多斯市': [
          { name: '杭锦旗', level: '轻度贫困' }
        ],
        '巴彦淖尔市': [
          { name: '磴口县', level: '中度贫困' },
          { name: '乌拉特中旗', level: '轻度贫困' }
        ],
        '乌海市': [],
        '阿拉善盟': [
          { name: '阿拉善左旗', level: '中度贫困' },
          { name: '阿拉善右旗', level: '轻度贫困' }
        ]
      };
      
      return poorCountiesMap[cityName] || [];
    },
    
    // 模拟核心指标数据
    getMockDashboardData() {
      return {
        indicators: [
          {
            title: "已脱贫人数",
            value: "9899万",
            change: 12.5,
            desc: "较上一周期数据"
          },
          {
            title: "帮扶政策数",
            value: "326项",
            change: 8.3,
            desc: "较上一周期增长"
          },
          {
            title: "访谈记录数", 
            value: "1258个",
            change: 15.7,
            desc: "较上一周期增长"
          },
          {
            title: "群众满意度",
            value: "95.2%",
            change: 5.2,
            desc: "较上一周期增长"
          }
        ]
      };
    },
    
    // 模拟贫困县数据
    getMockPoorCountyData() {
      const mockCityData = {
        '呼和浩特市': 2,
        '包头市': 1,
        '呼伦贝尔市': 5,
        '兴安盟': 3,
        '通辽市': 4,
        '赤峰市': 6,
        '锡林郭勒盟': 3,
        '乌兰察布市': 4,
        '鄂尔多斯市': 1,
        '巴彦淖尔市': 2,
        '乌海市': 0,
        '阿拉善盟': 2
      };
      
      const cities = Object.keys(mockCityData).map(city => ({
        city: city,
        count: mockCityData[city]
      }));
      
      const total = Object.values(mockCityData).reduce((sum, count) => sum + count, 0);
      
      return {
        total: total,
        cities: cities
      };
    },
    
    // 使用模拟数据更新界面
    updateWithMockData() {
      const dashboardData = this.getMockDashboardData();
      const poorCountyData = this.getMockPoorCountyData();
      
      // 更新核心指标数据
      if (dashboardData && dashboardData.indicators) {
        this.indicators = this.indicators.map((item, index) => {
          const apiData = dashboardData.indicators[index];
          return {
            ...item,
            value: apiData.value,
            change: apiData.change
          };
        });
      }
      
      // 更新贫困县数据
      if (poorCountyData) {
        this.totalPoorCounties = poorCountyData.total || 0;
        
        // 更新每个盟市的贫困县数量
        this.counties = this.counties.map(county => {
          const poorData = poorCountyData.cities.find(item => item.city === county.name);
          return {
            ...county,
            poorCountyCount: poorData ? poorData.count : 0
          };
        });
      }
    },
    async loadDashboardDataNew() {
    this.loading = true;
    this.useMockData = false;
    
    try {
      console.log('开始加载Dashboard数据...');
      
      // 并行加载所有数据
      const [dashboardResponse, poorCountyResponse] = await Promise.all([
        getDashboardData(),
        getPoorCountyData()
      ]);
      
      console.log(' Dashboard API响应:', {
        dashboardResponse,
        poorCountyResponse
      });
      
      // 更新核心指标数据
      if (dashboardResponse && dashboardResponse.code === 200 && dashboardResponse.data) {
        console.log('Dashboard指标数据:', dashboardResponse.data.indicators);
        this.indicators = this.indicators.map((item, index) => {
          const apiData = dashboardResponse.data.indicators[index];
          return {
            ...item,
            value: apiData.value,
            change: apiData.change
          };
        });
      } else {
        console.warn(' Dashboard指标数据格式不正确，使用模拟数据');
        throw new Error('Dashboard指标数据格式不正确');
      }
      
      if (poorCountyResponse && poorCountyResponse.code === 200 && poorCountyResponse.data) {
      console.log(' Dashboard贫困县数据:', poorCountyResponse.data);
      this.totalPoorCounties = poorCountyResponse.data.total || 0;
        
        // 更新每个盟市的贫困县数量
        this.counties = this.counties.map(county => {
          const poorData = poorCountyResponse.data.cities?.find(item => item.city === county.name);
          return {
            ...county,
            poorCountyCount: poorData ? poorData.count : 0
          };
        });
      } else {
        console.warn('Dashboard贫困县数据格式不正确，使用模拟数据');
        throw new Error('Dashboard贫困县数据格式不正确');
      }
      
      console.log('Dashboard数据更新完成');
      
    } catch (error) {
      console.error('加载Dashboard数据失败:', error);
      this.useMockData = true;
      this.updateWithMockData();
      this.$message.warning('数据加载失败，已显示模拟数据供演示使用');
    } finally {
      this.loading = false;
    }
  },
    
    // 加载仪表盘数据
    async loadDashboardData() {
      this.loading = true;
      this.useMockData = false;
      
      try {
        // 并行加载所有数据
        const [dashboardData, poorCountyData] = await Promise.all([
          getDashboardData(),
          getPoorCountyData()
        ]);
        
        // 更新核心指标数据
        if (dashboardData && dashboardData.indicators) {
          this.indicators = this.indicators.map((item, index) => {
            const apiData = dashboardData.indicators[index];
            return {
              ...item,
              value: apiData.value,
              change: apiData.change
            };
          });
        }
        
        // 更新贫困县数据
        if (poorCountyData) {
          this.totalPoorCounties = poorCountyData.total || 0;
          
          // 更新每个盟市的贫困县数量
          this.counties = this.counties.map(county => {
            const poorData = poorCountyData.cities?.find(item => item.city === county.name);
            return {
              ...county,
              poorCountyCount: poorData ? poorData.count : 0
            };
          });
        }
        
      } catch (error) {
        console.error('加载仪表盘数据失败，使用模拟数据:', error);
        this.useMockData = true;
        this.updateWithMockData();
        this.$message.warning('数据加载失败，已显示模拟数据供演示使用');
      } finally {
        this.loading = false;
      }
    }
  },
  mounted() {
    //this.loadDashboardData();
    this.loadDashboardDataNew(); 
  }
};
</script>

<style scoped>
/* 样式保持不变 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.loading-spinner.large {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

.loading-content p {
  margin: 0;
  color: #666;
  font-size: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
}

.main-content {
  flex: 1;
  padding: 24px;
  max-width: 1920px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}
.breadcrumb .active {
  color: #c0392b;
  font-weight: 500;
}

.indicator-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.card {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.card-icon {
  font-size: 24px;
}
.change-rate {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
}
.change-rate.positive {
  color: #27ae60;
}
.change-rate.negative {
  color: #e74c3c;
}

.card-body h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 16px;
}
.card-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0;
}
.card-footer {
  margin-top: 12px;
  font-size: 14px;
  color: #666;
}

.system-features {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin-bottom: 24px;
}

.feature-main h2 {
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: 600;
}

.feature-desc {
  margin: 0 0 24px 0;
  font-size: 14px;
  line-height: 1.6;
  opacity: 0.9;
}

.data-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.stat-number {
  display: block;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 6px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
}

.map-section {
  margin-bottom: 24px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-title {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.map-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.county-count {
  font-size: 14px;
  color: #666;
  background: #f5f7fa;
  padding: 4px 12px;
  border-radius: 16px;
}

.map-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}

.map-image-container {
  position: relative;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  background: #f8f9fa;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.inner-mongolia-map {
  max-width: 400%;
  max-height: 800px;
  object-fit: contain;
}

.empty-state {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-content {
  text-align: center;
  color: #666;
}

.empty-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.empty-content h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.empty-content p {
  margin: 0;
  font-size: 14px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}

.county-list {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.county-list h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.list-tip {
  font-size: 12px;
  color: #999;
  font-weight: normal;
}

.county-grid {
  display: grid;
  gap: 6px;
}

.county-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.county-item:hover {
  border-color: #667eea;
  background: #f8f9ff;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

.county-item.active {
  border-color: #667eea;
  background: linear-gradient(90deg, #f8f9ff 0%, #fff 100%);
}

.county-item .icon-arrow {
  color: #667eea;
  font-size: 14px;
  opacity: 0;
  transition: all 0.3s ease;
}

.county-item:hover .icon-arrow {
  opacity: 1;
  transform: translateX(4px);
}

.county-name {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.county-data {
  font-size: 11px;
  color: #666;
}

.app-footer {
  background-color: #333;
  color: #aaa;
  padding: 20px;
  margin-top: auto;
}
.footer-content {
  max-width: 1920px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}
.footer-links {
  display: flex;
  gap: 20px;
}
.footer-links a {
  color: #aaa;
  text-decoration: none;
  transition: color 0.3s;
}
.footer-links a:hover {
  color: #fff;
}

/* 弹窗样式 */
.county-detail-content {
  padding: 8px 0;
}

.detail-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 8px;
}

.poor-counties-list h4 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .map-container {
    grid-template-columns: 1fr;
  }
  
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .data-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .main-content {
    padding: 16px;
  }
  
  .indicator-cards {
    grid-template-columns: 1fr;
  }
}
</style>