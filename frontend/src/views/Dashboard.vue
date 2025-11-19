<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="navbar">
      <div class="navbar-left">
        <div class="logo">
          <img src="/icons/logo.png" alt="Logo" class="logo-icon" @error="onLogoError">
          <span class="system-name">攻坚印记</span>
          <span class="system-desc">内蒙古自治区脱贫攻坚经验智能提炼系统</span>
        </div>
      </div>
      <div class="navbar-right">
        <div class="user-info">
          <img src="https://picsum.photos/id/1005/40/40" alt="用户头像" class="user-avatar">
          <span class="user-name">{{ username }}</span>
        </div>
        <button class="logout-btn" @click="handleLogout">
          登出
        </button>
        <button class="refresh-btn" @click="refreshData">
          <span class="icon-refresh">🔄</span>
        </button>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 页面标题与面包屑 -->
      <div class="page-header">
        <div class="breadcrumb">
          <span>首页</span>
          <span class="icon-arrow-right">→</span>
          <span class="active">数据概览</span>
        </div>
      </div>

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

      <!-- 智能查询输入框 -->
      <div class="question-input-group">
        <input 
          v-model="questionInput" 
          placeholder="请输入您想了解的扶贫政策、措施或成效..." 
          class="question-input"
          @keyup.enter="submitQuestion"
        >
        <button class="question-btn" @click="submitQuestion" :disabled="isLoading">
          <span class="icon-search">🔍</span>
          {{ isLoading ? '查询中...' : '智能查询' }}
        </button>
      </div>

      <!-- 错误提示 -->
      <div v-if="queryError" class="query-error">{{ queryError }}</div>

      <!-- 查询结果展示 -->
      <div v-if="queryResult" class="query-result">
        <div class="result-section">
          <h3>分析报告</h3>
          <div class="report-content">{{ queryResult.report }}</div>
        </div>
      </div>

      <!-- 热门问题推荐 -->
      <div class="hot-questions">
        <span class="hot-label">热门查询：</span>
        <a href="#" v-for="(item, index) in hotQuestions" :key="index" @click.prevent="fillQuestion(item)">
          {{ item }}
        </a>
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

      <!-- 快速访问模块 -->
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
import GDPTrendChart from '../components/Charts/GDPTrendChart.vue'

// 创建模拟的nlpApi
const nlpApi = {
  submitQuery: async (question) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            ok: true,
            data: {
              report: `关于"${question}"的智能分析报告：这是一份基于您查询的模拟分析报告。系统检测到您关注${question}相关数据，建议查看详细分析报告获取更深入的信息。`,
              sql: `SELECT * FROM relevant_tables WHERE query LIKE '%${question}%'`,
              result: []
            }
          }
        })
      }, 1500)
    })
  }
}

export default {
  name: 'Dashboard',
  components: { 
    GDPTrendChart 
  },
  data() {
    return {
      username: '',
      selectedDateRange: 'all',
      cardAnimation: 'card-enter',
      questionInput: '',
      isLoading: false,
      queryResult: null,
      queryError: '',
      
      // 旗县详情相关数据
      selectedCity: '',
      selectedCounty: '',
      selectedYear: 'all',
      cities: ['赤峰市', '乌兰察布市', '兴安盟', '通辽市', '锡林郭勒盟', '呼和浩特市', '呼伦贝尔市'],
      years: [2023, 2022, 2021, 2020, 2019, 2018],
      
      // 旗县数据
      counties: [
        {
          "id": 1,
          "name": "兴和县",
          "city": "乌兰察布市",
          "area": 3513,
          "population": 305200,
          "povertyLevel": "已脱贫",
          "gdpData": [531700, 566000, 579800, 635400, 732099, 811100]
        },
        {
          "id": 2,
          "name": "化德县",
          "city": "乌兰察布市",
          "area": 2534,
          "population": 154300,
          "povertyLevel": "已脱贫",
          "gdpData": [406100, 464099, 476200, 500900, 580000, 642700]
        },
        {
          "id": 3,
          "name": "卓资县",
          "city": "乌兰察布市",
          "area": 3119,
          "population": 185200,
          "povertyLevel": "已脱贫",
          "gdpData": [510600, 505600, 549600, 629900, 725900, 767700]
        },
        {
          "id": 4,
          "name": "商都县",
          "city": "乌兰察布市",
          "area": 4284,
          "population": 315600,
          "povertyLevel": "已脱贫",
          "gdpData": [551200, 585200, 598000, 648300, 754200, 794599]
        },
        {
          "id": 5,
          "name": "四子王旗",
          "city": "乌兰察布市",
          "area": 24036,
          "population": 202399,
          "povertyLevel": "已脱贫",
          "gdpData": [555500, 589300, 605200, 639000, 718199, 767400]
        },
        {
          "id": 6,
          "name": "察哈尔右翼中旗",
          "city": "乌兰察布市",
          "area": 4186,
          "population": 187500,
          "povertyLevel": "已脱贫",
          "gdpData": [483200, 495300, 536700, 560000, 619800, 654800]
        },
        {
          "id": 7,
          "name": "兴和县",
          "city": "乌兰察布市",
          "area": 2454,
          "population": 202600,
          "povertyLevel": "已脱贫",
          "gdpData": [695100, 778900, 781400, 839300, 973300, 1033800]
        },
        {
          "id": 8,
          "name": "察哈尔右翼后旗",
          "city": "乌兰察布市",
          "area": 3910,
          "population": 194899,
          "povertyLevel": "已脱贫",
          "gdpData": [600100, 655200, 671200, 757000, 907900, 905500]
        },
        {
          "id": 9,
          "name": "扎赉特旗",
          "city": "兴安盟",
          "area": 11116,
          "population": 377500,
          "povertyLevel": "已脱贫",
          "gdpData": [879000, 963900, 1027700, 1106100, 1279300, 1318500]
        },
        {
          "id": 10,
          "name": "科尔沁右翼中旗",
          "city": "兴安盟",
          "area": 15613,
          "population": 246800,
          "povertyLevel": "已脱贫",
          "gdpData": [591600, 648800, 686900, 725300, 828300, 892600]
        },
        {
          "id": 11,
          "name": "科尔沁右翼前旗",
          "city": "兴安盟",
          "area": 16964,
          "population": 329700,
          "povertyLevel": "已脱贫",
          "gdpData": [867700, 955000, 1040400, 1142200, 1287900, 1348700]
        },
        {
          "id": 12,
          "name": "突泉县",
          "city": "兴安盟",
          "area": 4797,
          "population": 290400,
          "povertyLevel": "已脱贫",
          "gdpData": [611600, 674300, 755500, 817000, 1017500, 1004300]
        },
        {
          "id": 13,
          "name": "阿尔山市",
          "city": "兴安盟",
          "area": 7398,
          "population": 40300,
          "povertyLevel": "已脱贫",
          "gdpData": [178600, 193800, 197200, 205600, 220799, 231000]
        },
        {
          "id": 14,
          "name": "莫力达瓦达斡尔族自治旗",
          "city": "呼伦贝尔市",
          "area": 10356,
          "population": 306000,
          "povertyLevel": "已脱贫",
          "gdpData": [876200, 852900, 866900, 932600, 1093500, 1111000]
        },
        {
          "id": 15,
          "name": "鄂伦春自治旗",
          "city": "呼伦贝尔市",
          "area": 54688,
          "population": 227200,
          "povertyLevel": "已脱贫",
          "gdpData": [611200, 655100, 683100, 750900, 837500, 880600]
        },
        {
          "id": 16,
          "name": "武川县",
          "city": "呼和浩特市",
          "area": 4682,
          "population": 160400,
          "povertyLevel": "已脱贫",
          "gdpData": [480500, 506300, 512100, 552700, 574000, 658600]
        },
        {
          "id": 17,
          "name": "喀喇沁旗",
          "city": "赤峰市",
          "area": 3050,
          "population": 340000,
          "povertyLevel": "已脱贫",
          "gdpData": [774200, 831200, 872200, 993600, 1085700, 1123500]
        },
        {
          "id": 18,
          "name": "宁城县",
          "city": "赤峰市",
          "area": 4311,
          "population": 598200,
          "povertyLevel": "已脱贫",
          "gdpData": [1421399, 1521600, 1562100, 1759000, 2044400, 2173000]
        },
        {
          "id": 19,
          "name": "巴林右旗",
          "city": "赤峰市",
          "area": 9837,
          "population": 177500,
          "povertyLevel": "已脱贫",
          "gdpData": [546600, 579300, 589700, 653600, 699200, 726200]
        },
        {
          "id": 20,
          "name": "巴林左旗",
          "city": "赤峰市",
          "area": 6471,
          "population": 332400,
          "povertyLevel": "已脱贫",
          "gdpData": [1106400, 1195400, 1242100, 1428800, 1546300, 1618200]
        },
        {
          "id": 21,
          "name": "敖汉旗",
          "city": "赤峰市",
          "area": 8294,
          "population": 590000,
          "povertyLevel": "已脱贫",
          "gdpData": [1302700, 1402300, 1465700, 1631699, 1772700, 1776100]
        },
        {
          "id": 22,
          "name": "林西县",
          "city": "赤峰市",
          "area": 3933,
          "population": 220700,
          "povertyLevel": "已脱贫",
          "gdpData": [734700, 786000, 827500, 899500, 976100, 1046000]
        },
        {
          "id": 23,
          "name": "翁牛特旗",
          "city": "赤峰市",
          "area": 11882,
          "population": 463900,
          "povertyLevel": "已脱贫",
          "gdpData": [1279300, 1377800, 1439400, 1532900, 1766699, 1810900]
        },
        {
          "id": 24,
          "name": "阿鲁科尔沁旗",
          "city": "赤峰市",
          "area": 14555,
          "population": 286300,
          "povertyLevel": "已脱贫",
          "gdpData": [861300, 924400, 920800, 996600, 1102200, 1135800]
        },
        {
          "id": 25,
          "name": "奈曼旗",
          "city": "通辽市",
          "area": 8135,
          "population": 443400,
          "povertyLevel": "已脱贫",
          "gdpData": [1151100, 1239900, 1245300, 1342500, 1436000, 1460100]
        },
        {
          "id": 26,
          "name": "库伦旗",
          "city": "通辽市",
          "area": 4709,
          "population": 174700,
          "povertyLevel": "已脱贫",
          "gdpData": [523200, 536600, 540000, 555900, 611800, 638300]
        },
        {
          "id": 27,
          "name": "科尔沁左翼中旗",
          "city": "通辽市",
          "area": 9572,
          "population": 512600,
          "povertyLevel": "已脱贫",
          "gdpData": [1195900, 1287500, 1310800, 1377300, 1439800, 1505600]
        },
        {
          "id": 28,
          "name": "科尔沁左翼后旗",
          "city": "通辽市",
          "area": 11500,
          "population": 391900,
          "povertyLevel": "已脱贫",
          "gdpData": [1133500, 1220500, 1228300, 1270600, 1340700, 1429300]
        },
        {
          "id": 29,
          "name": "太仆寺旗",
          "city": "锡林郭勒盟",
          "area": 3426,
          "population": 198900,
          "povertyLevel": "已脱贫",
          "gdpData": [397400, 434099, 457900, 526700, 591300, 624500]
        },
        {
          "id": 30,
          "name": "正镶白旗",
          "city": "锡林郭勒盟",
          "area": 6253,
          "population": 68200,
          "povertyLevel": "已脱贫",
          "gdpData": [245000, 267500, 306900, 364900, 380100, 427600]
        },
        {
          "id": 31,
          "name": "苏尼特右旗",
          "city": "锡林郭勒盟",
          "area": 22455,
          "population": 64700,
          "povertyLevel": "已脱贫",
          "gdpData": [396800, 417200, 375500, 432200, 471599, 494900]
        }
      ],
      
      // 政策数据
      recentPolicies: [
        {
          id: 1,
          title: '乡村振兴产业发展扶持政策',
          date: '2023-06-15',
          description: '支持特色产业发展，提供资金和技术支持，促进农牧民增收致富。',
          status: 'implementing',
          statusText: '实施中',
          source: '自治区扶贫办'
        },
        {
          id: 2,
          title: '生态保护补偿机制',
          date: '2023-03-20',
          description: '建立生态保护补偿机制，对参与生态保护的农牧民给予经济补偿',
          status: 'completed',
          statusText: '已完成',
          source: '自治区生态环境厅'
        },
        {
          id: 3,
          title: '教育扶贫专项计划',
          date: '2022-12-10',
          description: '改善贫困地区教育条件，提供助学资金，阻断贫困代际传递',
          status: 'completed',
          statusText: '已完成',
          source: '自治区教育厅'
        },
        {
          id: 4,
          title: '医疗健康保障工程',
          date: '2022-08-05',
          description: '提升基层医疗服务能力，完善医疗保障体系，防止因病致贫',
          status: 'implementing',
          statusText: '实施中',
          source: '自治区卫健委'
        }
      ],
      
      // 图表配置
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false
      },
      
      // 原有数据
      hotQuestions: [
        "近5年脱贫人数统计",
        "各地区扶贫措施对比", 
        "产业扶贫成效分析"
      ],
      indicators: [
        { title: '累计脱贫人数', value: '9899万', change: 12.5, desc: '较上一周期增长' },
        { title: '帮扶政策数', value: '326项', change: 8.3, desc: '较上一周期增长' },
        { title: '特色产业数', value: '1258个', change: 15.7, desc: '较上一周期增长' },
        { title: '典型案例数', value: '532个', change: 5.2, desc: '较上一周期增长' }
      ]
    }
  },
  computed: {
    // 根据选择的盟市过滤旗县
    filteredCounties() {
      if (!this.selectedCity) return this.counties
      return this.counties.filter(county => county.city === this.selectedCity)
    },
    
    // 当前选中的旗县数据
    selectedCountyData() {
      if (!this.selectedCounty) return null
      return this.counties.find(county => county.id == this.selectedCounty)
    }
  },
  mounted() {
    this.username = localStorage.getItem('username') || '管理员'
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
    
    // 旗县选择相关方法
    handleCityChange() {
      this.selectedCounty = '' // 清空旗县选择
    },
    
    handleCountyChange() {
      // 不需要额外加载，因为数据已经在counties数组中
    },
    
    handleYearChange() {
      // 不需要额外加载，因为数据已经在counties数组中
    },
    
    handleDateRangeChange() {
      // 处理时间范围变化
    },
    
    // 工具方法
    formatNumber(num) {
      return new Intl.NumberFormat('zh-CN').format(num)
    },
    
    getPovertyLevelClass(level) {
      const classes = {
        '深度贫困': 'poverty-high',
        '一般贫困': 'poverty-medium', 
        '已脱贫': 'poverty-low'
      }
      return classes[level] || ''
    },
    
    // 快速操作功能
    exportCountyReport() {
      if (!this.selectedCounty) {
        alert('请先选择旗县')
        return
      }
      console.log('导出旗县报告:', this.selectedCountyData.name)
    },
    
    compareCounties() {
      this.$router.push('/compare')
    },
    
    generatePlanning() {
      if (!this.selectedCounty) {
        alert('请先选择旗县')
        return
      }
      console.log('生成发展规划:', this.selectedCountyData.name)
    },
    
    refreshData() {
      this.$emit('refresh')
    },
    
    // 原有方法
    async submitQuestion() {
      if (!this.questionInput.trim()) {
        this.queryError = '请输入查询问题'
        return
      }

      this.queryError = ''
      this.queryResult = null
      this.isLoading = true

      try {
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
    
    fillQuestion(question) {
      this.questionInput = question
    },
    
    handleLogout() {
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('username')
      this.$router.push('/login')
    },
    
    onLogoError(event) {
      event.target.src = 'https://via.placeholder.com/40'
    },
    
    getIndicatorIcon(index) {
      const icons = ['👥', '📜', '🏭', '📊']
      return icons[index % icons.length]
    }
  }
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

/* 保留原有样式 */
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

/* 空状态样式 */
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.empty-content {
  text-align: center;
  max-width: 500px;
  padding: 40px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.7;
}

.empty-content h3 {
  font-size: 24px;
  color: #333;
  margin-bottom: 12px;
}

.empty-content p {
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
}

.empty-tips {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: #888;
}

.tip-icon {
  font-size: 16px;
}

.navbar {
  background-color: #c0392b;
  color: white;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  position: relative;
  z-index: 10;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}
.logo-icon {
  width: 40px; /* 调整Logo图标宽度 */
  height: 40px; /* 调整Logo图标高度 */
  object-fit: contain; /* 保持图片比例 */
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
  border: 2px solid rgba(255,255,255,0.3);
}

.refresh-btn, .logout-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.refresh-btn:hover, .logout-btn:hover {
  background: rgba(255,255,255,0.3);
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

/* 智能查询输入框 */
.question-input-group {
  display: flex;
  margin-bottom: 20px;
  gap: 12px;
}

.question-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.3s;
}

.question-input:focus {
  border-color: #c0392b;
}

.question-btn {
  background-color: #c0392b;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.question-btn:hover:not(:disabled) {
  background-color: #a52c1e;
  transform: translateY(-2px);
}

.question-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 错误提示 */
.query-error {
  background: #fee;
  color: #c0392b;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  border-left: 4px solid #c0392b;
}

/* 查询结果 */
.query-result {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.result-section {
  margin-bottom: 20px;
}

.result-section h3 {
  margin: 0 0 12px 0;
  color: #333;
}

.report-content {
  line-height: 1.6;
  color: #666;
}

.sql-code {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 14px;
}

/* 热门问题 */
.hot-questions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px 0;
}

.hot-label {
  color: #666;
  font-size: 14px;
}

.hot-questions a {
  color: #c0392b;
  text-decoration: none;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.3s;
}

.hot-questions a:hover {
  background: rgba(192, 57, 43, 0.1);
}

/* 核心指标卡片 */
.indicator-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.card {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
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

/* 图表区域 */
.chart-container {
  margin-bottom: 24px;
}

.chart-card {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  margin-bottom: 20px;
}
.gdp-trend-chart {
  width: 100%;
  height: 100%;
  min-height: 300px;
  position: relative;
  overflow: visible !important;
}

.chart-card.half-width {
  flex: 1;
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
.chart-content {
  height: 320px;
  position: relative;
  overflow: visible !important; /* 确保提示框不会被裁剪 */
  z-index: 10; /* 提高层级 */
}

/* 确保GDP趋势图组件正确填充容器 */
.gdp-trend-chart {
  width: 100%;
  height: 100% !important; /* 使用100%填充父容器 */
}

/* 快速访问 */
.quick-access {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
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
@media (max-width: 768px) {
  .main-content {
    padding: 16px;
  }
  
  .empty-state {
    min-height: 300px;
  }
  
  .empty-content {
    padding: 20px;
  }
  
  .empty-icon {
    font-size: 48px;
  }
  
  .empty-content h3 {
    font-size: 20px;
  }
  
  .footer-content {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .indicator-cards {
    grid-template-columns: 1fr;
  }
  
  .chart-row {
    flex-direction: column;
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