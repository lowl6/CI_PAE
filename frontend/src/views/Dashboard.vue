<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="navbar">
      <div class="navbar-left">
        <div class="logo">
          <i class="iconfont icon-zhishitongxin"></i>
          <span class="system-name">攻坚印记</span>
          <span class="system-desc">脱贫攻坚经验智能提炼系统</span>
        </div>
      </div>
      <div class="navbar-right">
        <div class="user-info">
          <img src="https://picsum.photos/id/1005/40/40" alt="用户头像" class="user-avatar">
          <span class="user-name">管理员</span>
        </div>
        <button class="refresh-btn">
          <i class="iconfont icon-refresh"></i>
        </button>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 页面标题与面包屑 -->
      <div class="page-header">
        <div class="breadcrumb">
          <span>首页</span>
          <i class="iconfont icon-arrow-right"></i>
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

      <!-- 突出显示的问答组件（智能查询）- 最显眼位置 -->
      <div class="question-section">
        <div class="question-header">
          <h3 class="question-title">智能问答 · 经验提炼</h3>
          <p class="question-desc">基于自然语言处理技术，快速查询脱贫攻坚经验、政策效果与成功模式</p>
        </div>
        <div class="question-input-group">
          <i class="iconfont icon-search question-icon"></i>
          <input 
            type="text" 
            class="question-input" 
            placeholder="请输入您的查询问题，例如：内蒙古产业扶贫成功模式有哪些？"
            v-model="questionText"
            @keyup.enter="submitQuestion"
          >
          <button class="question-btn" @click="submitQuestion">
            智能查询
          </button>
        </div>
        <div class="hot-questions">
          <span class="hot-title">热门查询：</span>
          <div class="hot-tags">
            <span class="hot-tag" @click="selectHotQuestion('易地搬迁政策效果分析')">易地搬迁政策效果分析</span>
            <span class="hot-tag" @click="selectHotQuestion('光伏扶贫成功案例')">光伏扶贫成功案例</span>
            <span class="hot-tag" @click="selectHotQuestion('牧民增收主要途径')">牧民增收主要途径</span>
            <span class="hot-tag" @click="selectHotQuestion('教育扶贫成效数据')">教育扶贫成效数据</span>
          </div>
        </div>
      </div>

      <!-- 核心指标卡片区 -->
      <div class="indicator-cards">
        <div class="card" :class="cardAnimation">
          <div class="card-header">
            <span class="card-title">脱贫县数量</span>
            <i class="iconfont icon-map-location card-icon"></i>
          </div>
          <div class="card-value">57 <span class="unit">个</span></div>
          <div class="card-desc">覆盖内蒙古全部贫困县</div>
          <div class="card-trend positive">
            <i class="iconfont icon-arrow-up"></i>
            <span>100% 脱贫率</span>
          </div>
        </div>

        <div class="card" :class="cardAnimation">
          <div class="card-header">
            <span class="card-title">访谈资料</span>
            <i class="iconfont icon-microphone card-icon"></i>
          </div>
          <div class="card-value">12,846 <span class="unit">份</span></div>
          <div class="card-desc">涵盖干部、村民、企业家等</div>
          <div class="card-trend positive">
            <i class="iconfont icon-arrow-up"></i>
            <span>23.5% 年增长</span>
          </div>
        </div>

        <div class="card" :class="cardAnimation">
          <div class="card-header">
            <span class="card-title">成功模式</span>
            <i class="iconfont icon-lightbulb card-icon"></i>
          </div>
          <div class="card-value">89 <span class="unit">种</span></div>
          <div class="card-desc">产业扶贫、易地搬迁等</div>
          <div class="card-trend positive">
            <i class="iconfont icon-arrow-up"></i>
            <span>15.2% 新增</span>
          </div>
        </div>

        <div class="card" :class="cardAnimation">
          <div class="card-header">
            <span class="card-title">政策验证案例</span>
            <i class="iconfont icon-file-text card-icon"></i>
          </div>
          <div class="card-value">326 <span class="unit">个</span></div>
          <div class="card-desc">政策效果量化分析</div>
          <div class="card-trend positive">
            <i class="iconfont icon-arrow-up"></i>
            <span>31.8% 年增长</span>
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
import DataChart from '../components/Charts/DataChart.vue'

// 引入图标库（实际项目中建议使用IconFont或其他图标库）
export default {
  name: 'Dashboard',
  components: { DataChart },
  data() {
    return {
      selectedDateRange: 'all',
      cardAnimation: 'card-enter',
      questionText: '' // 问答输入框绑定值
    }
  },
  mounted() {
    // 卡片进入动画
    setTimeout(() => {
      this.cardAnimation = ''
    }, 800)
    
    // 模拟数据加载效果
    this.simulateDataLoading()
  },
  methods: {
    simulateDataLoading() {
      // 模拟图表数据加载延迟
      setTimeout(() => {
        this.$emit('data-loaded', true)
      }, 1200)
    },
    // 提交问答查询
    submitQuestion() {
      if (!this.questionText.trim()) {
        alert('请输入查询问题')
        return
      }
      // 这里可以添加实际的查询逻辑
      console.log('查询问题：', this.questionText)
      // 模拟查询中状态
      this.$message({
        message: '正在智能分析您的问题，请稍候...',
        type: 'info'
      })
    },
    // 选择热门问题
    selectHotQuestion(question) {
      this.questionText = question
      // 自动提交查询
      this.submitQuestion()
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
</style>

<!-- 引入图标库（实际项目中需替换为真实图标库） -->
<style>
@font-face {
  font-family: 'iconfont';
  src: url('//at.alicdn.com/t/c/font_3283598_8s3k9l6z07e.woff2?t=1678293064202') format('woff2'),
       url('//at.alicdn.com/t/c/font_3283598_8s3k9l6z07e.woff?t=1678293064202') format('woff'),
       url('//at.alicdn.com/t/c/font_3283598_8s3k9l6z07e.ttf?t=1678293064202') format('truetype');
}

.iconfont {
  font-family: "iconfont" !important;
  font-size: 16px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.icon-zhishitongxin:before { content: "\e61c"; }
.icon-map-location:before { content: "\e64d"; }
.icon-microphone:before { content: "\e64e"; }
.icon-lightbulb:before { content: "\e65c"; }
.icon-file-text:before { content: "\e660"; }
.icon-arrow-up:before { content: "\e664"; }
.icon-arrow-right:before { content: "\e665"; }
.icon-refresh:before { content: "\e673"; }
.icon-search:before { content: "\e67d"; }
.icon-analysis:before { content: "\e680"; }
.icon-report:before { content: "\e681"; }
.icon-share:before { content: "\e682"; }
.icon-setting:before { content: "\e683"; }
</style>