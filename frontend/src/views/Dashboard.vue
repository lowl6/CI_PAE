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

      <!-- 旗县 GDP 卡片 -->
      <CountyGdpCard :countyId="selectedCounty" />

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

      <!-- 快速操作 -->
      <div class="quick-access">
        <div class="section-title">快速操作</div>
        <div class="access-cards">
          <div class="access-card" @click="exportCountyReport">
            <i class="iconfont icon-report"></i>
            <span>深度分析</span>
          </div>
          <div class="access-card" @click="compareCounties">
            <i class="iconfont icon-analysis"></i>
            <span>区域对比</span>
          </div>
          <div class="access-card" @click="generatePlanning">
            <i class="iconfont icon-share"></i>
            <span>模式提炼</span>
          </div>
          <div class="access-card">
            <i class="iconfont icon-setting"></i>
            <span>智能查询</span>
          </div>
        </div>
      </div>
    </main>

    <!-- 页脚 -->
    <footer class="app-footer">
      <div class="footer-content">
        <span>攻坚印记内蒙古自治区经验智能提炼系统 © 2025 版权所有</span>
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
export default {
  name: 'Dashboard',
  components: {
    /* 删除未在模板出现的 GDPTrendChart */
  },
  data() {
    return {
      /* 只保留真正在模板或业务方法里用到的数据 */
      selectedCounty: '',          // 旗县下拉选中值（模板里 CountyGdpCard 依赖）
      indicators: [
        { title: '累计脱贫人数', value: '9899万', change: 12.5, desc: '较上一周期增长' },
        { title: '帮扶政策数', value: '326项', change: 8.3, desc: '较上一周期增长' },
        { title: '特色产业数', value: '1258个', change: 15.7, desc: '较上一周期增长' },
        { title: '典型案例数', value: '532个', change: 5.2, desc: '较上一周期增长' }
      ]
    };
  },
  methods: {
    /* 只保留被模板 @click 或模板调用到的方法 */
    exportCountyReport() {
      if (!this.selectedCounty) {
        alert('请先选择旗县');
        return;
      }
      console.log('导出旗县报告:', this.selectedCounty);
    },
    compareCounties() {
      this.$router.push('/compare');
    },
    generatePlanning() {
      if (!this.selectedCounty) {
        alert('请先选择旗县');
        return;
      }
      console.log('生成发展规划:', this.selectedCounty);
    },
    getIndicatorIcon(index) {
      const icons = ['👥', '📜', '🏭', '📊'];
      return icons[index % icons.length];
    }
  }
};
</script>

<style scoped>
/* ===== 仅保留仍在模板出现的样式 ===== */
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

/* 指标卡片 */
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

/* 快速操作 */
.quick-access {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}
.section-title {
  font-size: 16px;
  color: #333;
  font-weight: 500;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}
.access-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}
.access-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border-radius: 8px;
  background-color: #f9f9f9;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}
.access-card:hover {
  background-color: rgba(192, 57, 43, 0.1);
  transform: translateY(-3px);
}
.access-card .iconfont {
  font-size: 28px;
  color: #c0392b;
  margin-bottom: 8px;
}
.access-card span {
  font-size: 14px;
  color: #333;
}

/* 页脚 */
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

/* 响应式 */
@media (max-width: 768px) {
  .main-content {
    padding: 16px;
  }
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .indicator-cards {
    grid-template-columns: 1fr;
  }
  .access-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .footer-content {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
}
</style>