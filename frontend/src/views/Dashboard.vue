<template>
  <div class="app-container">


    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 页面标题与面包屑 -->
      <div class="page-header">
        <div class="breadcrumb">
          <span>首页</span>
          <span class="icon-arrow-right">→</span>
          <span class="active">数据概览</span>
        </div>
        <div class="date-range">
          <span>统计周期：</span>
          <select v-model="selectedDateRange">
            <option value="all">全部时期</option>
            <option value="5y">近5年</option>
            <option value="3y">近3年</option>
            <option value="1y">近1年</option>
          </select>
        </div>
      </div>

     

      <!-- 核心指标卡片 -->
      <div class="indicator-cards">
        <div class="card" v-for="(item, index) in indicators" :key="index">
          <div class="card-header">
            <span class="card-icon">{{ getIndicatorIcon(index) }}</span>
            <span class="change-rate" :class="{ positive: item.change > 0 }">
              <span class="icon-arrow-up">{{ item.change > 0 ? '↑' : '↓' }}</span>
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

      <!-- 图表区域 -->
      <div class="chart-container">
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">脱贫时间趋势分析</span>
            <div class="chart-actions">
              <button class="chart-btn active">折线图</button>
              <button class="chart-btn">柱状图</button>
            </div>
          </div>
          <div class="chart-content">
            <DataChart type="trend" />
          </div>
        </div>

        <div class="chart-row">
          <div class="chart-card half-width">
            <div class="chart-header">
              <span class="chart-title">地区分布情况</span>
            </div>
            <div class="chart-content">
              <DataChart type="distribution" />
            </div>
          </div>

          <div class="chart-card half-width">
            <div class="chart-header">
              <span class="chart-title">成功模式分类</span>
            </div>
            <div class="chart-content">
              <DataChart type="category" />
            </div>
          </div>
        </div>
      </div>

      <!-- 快速访问模块 -->
      <div class="quick-access">
        <div class="section-title">快速操作</div>
        <div class="access-cards">
          <div class="access-card">
            <i class="iconfont icon-analysis"></i>
            <span>深度分析</span>
          </div>
          <div class="access-card">
            <i class="iconfont icon-report"></i>
            <span>生成报告</span>
          </div>
          <div class="access-card">
            <i class="iconfont icon-share"></i>
            <span>数据共享</span>
          </div>
          <div class="access-card">
            <i class="iconfont icon-setting"></i>
            <span>系统设置</span>
          </div>
        </div>
      </div>
    </main>

    <!-- 页脚 -->
    <footer class="app-footer">
      <div class="footer-content">
        <span>攻坚印记脱贫攻坚经验智能提炼系统 © 2025 版权所有</span>
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
import AppNav from './AppNav.vue'
import DataChart from '../components/Charts/DataChart.vue'
import { nlpApi } from '../api/nlpApi' // 导入API客户端

export default {
  name: 'Dashboard',
  components: { DataChart, AppNav }, 
  data() {
    return {
      username: '',
      userRole: '',
      selectedDateRange: 'all',
      cardAnimation: 'card-enter',
      questionInput: '', // 绑定输入框的变量（原questionText改为与v-model一致）
      isLoading: false, // 加载状态
      queryResult: null, // 查询结果
      queryError: '', // 错误信息
      // 核心指标数据（保留原有逻辑）
      indicators: [
        { title: '累计脱贫人数', value: '9899万', change: 12.5, desc: '较上一周期增长' },
        { title: '帮扶政策数', value: '326项', change: 8.3, desc: '较上一周期增长' },
        { title: '特色产业数', value: '1258个', change: 15.7, desc: '较上一周期增长' },
        { title: '典型案例数', value: '532个', change: 5.2, desc: '较上一周期增长' }
      ]
    }
  },
  mounted() {
    const userInfo = JSON.parse(localStorage.getItem('user')) || {};
    this.username = userInfo.username || '未知用户'; // 不再硬编码“管理员”
    this.userRole = userInfo.role || '普通用户'; // 新增角色变量，默认普通用户
    setTimeout(() => {
      this.cardAnimation = ''
    }, 800)
    this.simulateDataLoading()
  },
  methods: {
    simulateDataLoading() {
      setTimeout(() => {
        this.$emit('data-loaded', true)
      }, 1200)
    },
    // 提交查询（核心逻辑）
    async submitQuestion() {
      // 验证输入
      if (!this.questionInput.trim()) {
        this.queryError = '请输入查询问题'
        return
      }

      // 重置状态
      this.queryError = ''
      this.queryResult = null
      this.isLoading = true

      try {
        // 调用后端API
        const response = await nlpApi.submitQuery(this.questionInput)
        if (response.data.ok) {
          this.queryResult = response.data.data
        } else {
          this.queryError = response.data.error
        }
      } catch (err) {
      this.queryError = '查询失败，请稍后重试';
      // 打印详细错误到前端控制台
      console.log("=== 前端查询错误详情 ===");
      console.log("错误对象:", err);
      if (err.response) {
        console.log("后端响应:", err.response.data);
        console.log("状态码:", err.response.status);
      } else {
        console.log("无响应原因:", err.message);
      }
    } finally {
        this.isLoading = false
      }
    },
    // 填充热门问题到输入框
    fillQuestion(question) {
      this.questionInput = question
    },
    // 登出功能
    handleLogout() {
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('username')
      this.$router.push('/login')
    },
    onLogoError(event) {
      event.target.src = 'https://via.placeholder.com/40'
    },
    // 指标图标（保留原有逻辑）
    getIndicatorIcon(index) {
      const icons = ['👥', '📜', '🏭', '📊']
      return icons[index % icons.length]
    }
  }
}
</script>

<style scoped>
/* 全局样式 */
.app-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
}

/* 导航栏样式 */
.navbar {
  background-color: #c0392b;
  color: white;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 10;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.iconfont {
  font-size: 24px;
}

.system-name {
  font-size: 20px;
  font-weight: 600;
}

.system-desc {
  font-size: 14px;
  opacity: 0.9;
  margin-left: 8px;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.refresh-btn {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
}

.refresh-btn:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.logout-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 主内容区样式 */
.main-content {
  padding: 24px;
  max-width: 1920px;
  margin: 0 auto;
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

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.date-range select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  transition: border-color 0.3s;
}

.date-range select:focus {
  outline: none;
  border-color: #c0392b;
}

/* 突出显示的问答组件样式 - 核心修改部分 */
.question-section {
  background: linear-gradient(135deg, #c0392b 0%, #d35400 100%);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 8px 24px rgba(192, 57, 43, 0.2);
  color: white;
  position: relative;
  overflow: hidden;
}

/* 装饰元素 */
.question-section::before {
  content: '';
  position: absolute;
  top: -20px;
  right: -20px;
  width: 120px;
  height: 120px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.question-section::after {
  content: '';
  position: absolute;
  bottom: -30px;
  left: 20%;
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.question-header {
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}

.question-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.question-title::before {
  content: '';
  width: 4px;
  height: 24px;
  background-color: white;
  border-radius: 2px;
}

.question-desc {
  font-size: 16px;
  opacity: 0.9;
  max-width: 800px;
}

.question-input-group {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: white;
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.question-icon {
  color: #c0392b;
  font-size: 20px;
  margin-left: 12px;
}

.question-input {
  flex: 1;
  border: none;
  padding: 12px 8px;
  font-size: 16px;
  outline: none;
  color: #333;
  min-width: 200px;
}

.question-input::placeholder {
  color: #999;
}

.question-btn {
  background-color: #c0392b;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.question-btn:hover {
  background-color: #a52c1e;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(192, 57, 43, 0.3);
}

.hot-questions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.hot-title {
  font-size: 14px;
  opacity: 0.9;
  white-space: nowrap;
}

.hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hot-tag {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.hot-tag:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

/* 指标卡片样式 */
.indicator-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.card {
  flex: 1;
  min-width: 220px;
  background-color: white;
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

.card-enter {
  animation: cardFadeIn 0.8s ease forwards;
  opacity: 0;
  transform: translateY(20px);
}

@keyframes cardFadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.card-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(192, 57, 43, 0.1);
  color: #c0392b;
  font-size: 18px;
}

.card-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.unit {
  font-size: 16px;
  font-weight: 500;
  color: #666;
  margin-left: 4px;
}

.card-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.card-trend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.positive {
  color: #27ae60;
}

/* 图表区域样式 */
.chart-container {
  margin-bottom: 24px;
}

.chart-card {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-title {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.chart-actions {
  display: flex;
  gap: 8px;
}

.chart-btn {
  padding: 4px 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  background-color: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.chart-btn.active {
  background-color: #c0392b;
  color: white;
  border-color: #c0392b;
}

.chart-btn:hover:not(.active) {
  border-color: #c0392b;
  color: #c0392b;
}

.chart-content {
  height: 320px;
}

.chart-row {
  display: flex;
  gap: 20px;
}

.half-width {
  flex: 1;
  min-width: 300px;
}

/* 快速访问模块 */
.quick-access {
  background-color: white;
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
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.access-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  background-color: #f9f9f9;
  cursor: pointer;
  transition: all 0.3s;
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

/* 页脚样式 */
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
  color: white;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .indicator-cards {
    flex-wrap: wrap;
  }
  
  .card {
    flex: 1 1 calc(50% - 10px);
  }
}

@media (max-width: 768px) {
  .navbar {
    height: auto;
    padding: 12px 16px;
    flex-direction: column;
    gap: 12px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .question-section {
    padding: 20px;
  }
  
  .question-title {
    font-size: 20px;
  }
  
  .question-input-group {
    flex-direction: column;
    padding: 12px;
  }
  
  .question-btn {
    width: 100%;
  }
  
  .card {
    flex: 1 1 100%;
  }
  
  .chart-row {
    flex-direction: column;
  }
  
  .footer-content {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .question-input {
    font-size: 14px;
  }
  
  .hot-questions {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .system-desc {
    display: none;
  }
}

.logo-icon {
  width: 32px;
  height: 32px;
  margin-right: 10px;
  vertical-align: middle;
}

.logo-text {
  display: inline-block;
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  background-color: #409EFF;
  color: white;
  border-radius: 4px;
  font-weight: bold;
  margin-right: 10px;
  vertical-align: middle;
}

.icon-refresh, .icon-search, .icon-arrow-right, 
.icon-arrow-up, .icon-analysis {
  font-size: 16px;
  margin-right: 4px;
}

.card-icon {
  font-size: 24px;
  margin-right: 8px;
}

.access-item .icon-analysis {
  font-size: 20px;
  margin-right: 8px;
}

.change-rate.positive {
  color: #67C23A;
}

.change-rate.negative {
  color: #F56C6C;
}
</style>