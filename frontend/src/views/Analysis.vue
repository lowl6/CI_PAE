<template>
  <div class="deep-analysis">
    <!-- 顶部筛选 -->
    <a-card class="filter-bar" size="small">
      <a-row :gutter="16" align="middle">
        <!-- 城市 -->
        <a-col :span="6">
          <a-form-item label="城市" style="margin: 0">
            <a-select v-model:value="selectedCity"  placeholder="请选择城市"
                      allow-clear
                      @focus="loadCities"
                      @change="handleCityChange"
                      style="width: 100%">
              <a-select-option v-for="c in cities" :key="c" :value="c">{{ c }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>

        <!-- 县区 -->
        <a-col :span="6">
          <a-form-item label="县区" style="margin: 0">
            <a-select v-model:value="selectedCountyId"  placeholder="请选择县区"
                      allow-clear
                      style="width: 100%"
                      :disabled="!selectedCity">
              <a-select-option v-for="ct in counties" :key="ct.county_id" :value="ct.county_id">{{ ct.county_name }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>

        <!-- 年份区间 -->
        <a-col :span="10">
          <a-form-item label="年份区间" style="margin: 0">
            <a-row :gutter="8">
              <a-col :span="10">
                <a-input 
                  v-model:value="startYear" 
                  placeholder="开始年份" 
                  type="number"
                  min="2015"
                  max="2023"
                  style="width: 100%"/>
              </a-col>
              <a-col :span="4" style="text-align: center; line-height: 48px;">
                至
              </a-col>
              <a-col :span="10">
                <a-input 
                  v-model:value="endYear" 
                  placeholder="结束年份" 
                  type="number"
                  min="2015"
                  max="2023"
                  style="width: 100%"/>
              </a-col>
            </a-row>
          </a-form-item>
        </a-col>

        <!-- 查询按钮 -->
        <a-col :span="2" style="text-align: right">
          <a-button type="primary"
                    :loading="loading"
                    @click="handleQuery"
                    style="width: 100%">
            查询
          </a-button>
        </a-col>
      </a-row>
    </a-card>

    <a-row :gutter="12" class="main-body">
      <!-- 左侧指标树 -->
      <a-col :span="5">
        <a-card title="选择指标" size="small">
          <div class="indicator-tip">请选择指标并点击查询</div>
          <a-tree v-model:checkedKeys="checkedKeys"
                  :tree-data="indicatorTree"
                  checkable
                  show-line/>
        </a-card>
      </a-col>

      <!-- 右侧主内容 -->
      <a-col :span="19">
        <a-spin :spinning="loading">
          <!-- 指标卡片 -->
          <a-row :gutter="12" v-if="cards.length">
            <a-col :span="8" v-for="(card,index) in cards" :key="index">
              <indicator-card :title="card.name" :unit="card.unit"
                              :value="card.value" :yoy="card.yoy"/>
            </a-col>
          </a-row>

          <!-- 图表区 - 多指标独立展示 -->
          <div v-if="chartData.series && chartData.series.length > 0" class="charts-container">
            <!-- 单指标使用大图 -->
            <a-card v-if="chartData.series.length === 1" size="small" class="chart-card single-chart">
              <template #title>
                <span class="chart-title">
                  <span class="indicator-icon">📊</span>
                  {{ chartData.series[0].name }}
                </span>
              </template>
              <template #extra>
                <a-radio-group v-model:value="chartType" size="small">
                  <a-radio-button value="line">折线</a-radio-button>
                  <a-radio-button value="bar">柱状</a-radio-button>
                  <a-radio-button value="area">面积</a-radio-button>
                </a-radio-group>
                <a-button size="small" @click="exportAllPics">导出图片</a-button>
                <a-button size="small" @click="handleExportCsv">导出 CSV</a-button>
              </template>
              <div :id="'chart-0'" class="chart-item" style="height: 420px"></div>
            </a-card>

            <!-- 多指标使用网格布局 -->
            <template v-else>
              <div class="chart-grid-header">
                <a-space>
                  <a-radio-group v-model:value="chartType" size="small">
                    <a-radio-button value="line">折线</a-radio-button>
                    <a-radio-button value="bar">柱状</a-radio-button>
                    <a-radio-button value="area">面积</a-radio-button>
                  </a-radio-group>
                  <a-button size="small" @click="exportAllPics">导出全部图片</a-button>
                  <a-button size="small" @click="handleExportCsv">导出 CSV</a-button>
                </a-space>
              </div>
              <a-row :gutter="[12, 12]" class="chart-grid">
                <a-col 
                  v-for="(serie, index) in chartData.series" 
                  :key="index"
                  :span="chartData.series.length === 2 ? 12 : 8">
                  <a-card size="small" class="chart-card mini-chart" :class="'chart-card-' + index">
                    <template #title>
                      <span class="chart-title">
                        <span class="indicator-icon">{{ getIndicatorIcon(serie.name) }}</span>
                        {{ serie.name }}
                      </span>
                    </template>
                    <template #extra>
                      <a-tag :color="getIndicatorColor(index)">
                        {{ serie.unit || '单位' }}
                      </a-tag>
                    </template>
                    <div :id="'chart-' + index" class="chart-item" style="height: 280px"></div>
                  </a-card>
                </a-col>
              </a-row>
            </template>
          </div>
          
          <!-- 空状态 -->
          <a-card v-else size="small" class="chart-card">
            <a-empty description="请选择指标并点击查询以查看图表" />
          </a-card>
        </a-spin>
      </a-col>
    </a-row>

    <!-- 底部对比抽屉 -->
    <quick-compare-drawer :visible.sync="drawerVisible"
                          :counties="selectedCounties"
                          :indicators="checkedIndicators"
                          @removeCounty="removeCounty"/>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { Card, Row, Col, Select, Button, Tree, Input, Spin, Radio, message } from 'ant-design-vue'
import IndicatorCard from './IndicatorCard.vue'
import QuickCompareDrawer from './QuickCompareDrawer.vue'
import {
  getCities,
  getCounties,
  getIndicatorsTree,
  getAnalysisData,
  exportCsvData
} from '@/api/analysis'

export default {
  name: 'DeepAnalysis',
  components: {
    ACard: Card, ARow: Row, ACol: Col, ASelect: Select, ASelectOption: Select.Option,
    AButton: Button, ATree: Tree, AInput: Input, ASpin: Spin,
    ARadioGroup: Radio.Group, ARadioButton: Radio.Button,
    IndicatorCard, QuickCompareDrawer
  },
  data() {
    return {
      loading: false,
      cities: [],
      counties: [],
      selectedCity: '',
      selectedCountyId: '',
      startYear: '2015',
      endYear: '2023',
      indicatorTree: [],
      checkedKeys: [],
      chartType: 'line',
      charts: [], // 改为数组存储多个图表实例
      chartData: { xAxis: [], series: [] }, // 存储图表数据
      cards: [],
      drawerVisible: false,
      selectedCounties: [],
      checkedIndicators: [],
      autoQueryTimer: null, // 防抖定时器
      autoQueryDelay: 500   // 自动查询延迟毫秒
    }
  },
  mounted() {
    this.loadCities()
    this.loadIndicators()
  },
  watch: {
    chartType() {
      // 图表类型切换时重绘
      if (this.chartData.series.length > 0) {
        this.$nextTick(() => {
          this.drawCharts(this.chartData.xAxis, this.chartData.series)
        })
      }
    },
    checkedKeys() {
      this.checkedIndicators = this.flattenTree(this.indicatorTree).filter(
        item => this.checkedKeys.includes(item.key)
      )
      // 指标选择变化后尝试自动查询
      this.scheduleAutoQuery()
    },
    selectedCountyId(newVal) {
      if (newVal) {
        this.scheduleAutoQuery()
      }
    },
    startYear() {
      this.scheduleAutoQuery()
    },
    endYear() {
      this.scheduleAutoQuery()
    }
  },
  methods: {
    /* ===== 自动查询防抖调度 ===== */
    scheduleAutoQuery() {
      // 初始阶段或未满足查询条件时不触发
      if (!this.selectedCity || !this.selectedCountyId || this.checkedKeys.length === 0) return
      if (!this.validateYears()) return
      // 防抖
      if (this.autoQueryTimer) clearTimeout(this.autoQueryTimer)
      this.autoQueryTimer = setTimeout(() => {
        // 二次校验，防止定时器期间状态变化
        if (!this.selectedCity || !this.selectedCountyId || this.checkedKeys.length === 0) return
        if (!this.validateYears()) return
        this.handleQuery()
      }, this.autoQueryDelay)
    },
    /* ===== 初始化 ===== */
    initCharts() {
      // 清理旧图表
      this.charts.forEach(chart => {
        if (chart) chart.dispose()
      })
      this.charts = []

      // 为每个指标创建独立图表
      this.chartData.series.forEach((serie, index) => {
        const dom = document.getElementById(`chart-${index}`)
        if (dom) {
          const chart = echarts.init(dom)
          this.charts.push(chart)
        }
      })

      // 监听窗口大小变化
      window.addEventListener('resize', this.handleResize)
    },

    handleResize() {
      this.charts.forEach(chart => {
        if (chart) chart.resize()
      })
    },

    getIndicatorIcon(name) {
      const iconMap = {
        'GDP': '💰',
        '人口': '👥',
        '收入': '💵',
        '支出': '💳',
        '投资': '📈',
        '消费': '🛒',
        '产量': '🌾',
        '面积': '🏞️',
        '学校': '🏫',
        '医院': '🏥',
        '公路': '🛣️',
        '铁路': '🚄'
      }
      for (const [key, icon] of Object.entries(iconMap)) {
        if (name.includes(key)) return icon
      }
      return '📊'
    },

    getIndicatorColor(index) {
      const colors = ['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2', '#faad14', '#f5222d']
      return colors[index % colors.length]
    },
    
    /* ===== 加载数据 ===== */
    async loadCities() {
      try {
        this.cities = await getCities()
      } catch (error) {
        message.error(error.error || '加载城市失败')
      }
    },
    
    async loadCounties(city) {
      try {
        this.counties = await getCounties(city);
        
        // --- 诊断日志 ---
        // 这行会打印出 API 返回的县区列表
        console.log('API 返回的县区数据:', this.counties); 
        // --- 诊断日志结束 ---

        this.selectedCountyId = '' // 清空县区选择
      } catch (error) {
        message.error(error.error || '加载县区失败');
      }
    },
    
    async loadIndicators() {
      try {
        this.indicatorTree = await getIndicatorsTree()
      } catch (error) {
        message.error(error.error || '加载指标树失败')
      }
    },
    
    /* ===== 事件处理 ===== */
    handleCityChange(city) {
      this.selectedCity = city
      this.loadCounties(city)
    },
    
    /* ===== 工具方法 ===== */
    flattenTree(tree) {
      const res = []
      function dfs(list) {
        list.forEach(n => {
          if (n.children) dfs(n.children)
          else res.push(n)
        })
      }
      dfs(tree)
      return res
    },
    
    /* ===== 数据验证 ===== */
    validateYears() {
      if (!this.startYear || !this.endYear) {
        message.warning('请输入完整的年份区间')
        return false
      }
      
      const start = parseInt(this.startYear)
      const end = parseInt(this.endYear)
      
      if (isNaN(start) || isNaN(end)) {
        message.warning('请输入有效的年份数字')
        return false
      }
      
      if (start > end) {
        message.warning('开始年份不能大于结束年份')
        return false
      }
      
      if (start < 2015 || end > 2023) {
        message.warning('年份范围应在2015-2023之间')
        return false
      }
      
      return true
    },
    
    /* ===== 查询数据 ===== */
    /* ===== 查询数据 ===== */
    async handleQuery() {

      // --- 诊断日志 ---
      // 这行会打印出你点击查询按钮那一刻，县区 ID 到底是什么值
      console.log('点击查询时, selectedCountyId 的值是:', this.selectedCountyId);
      // --- 诊断日志结束 ---

      if (!this.validateYears()) return
      if (!this.selectedCity) {
        message.warning('请选择城市')
        return
      }
      
      if (this.selectedCountyId === '' || this.selectedCountyId === null || this.selectedCountyId === undefined) {
        message.warning('请选择县区')
        return
      }

      if (this.checkedKeys.length === 0) {
        message.warning('请选择指标并点击查询')
        return
      }
      
      this.loading = true
      try {
        const payload = {
          city: this.selectedCity,
          countyId: this.selectedCountyId,
          startYear: this.startYear,
          endYear: this.endYear,
          indicators: this.checkedKeys
        }
        
        console.log('查询参数:', payload);
        
        const result = await getAnalysisData(payload)
        
        if (result.ok) {
          this.cards = result.data.cards
          this.selectedCounties = result.data.counties
          this.chartData = {
            xAxis: result.data.xAxis,
            series: result.data.series
          }
          // 等待DOM更新后初始化图表
          this.$nextTick(() => {
            this.initCharts()
            this.drawCharts(result.data.xAxis, result.data.series)
          })
        } else {
          message.error(result.error || '查询数据失败')
        }
      } catch (error) {
        message.error(error.error || '服务器错误')
        console.error('查询失败:', error)
      } finally {
        this.loading = false
      }
    },
    
    /* ===== 绘制图表 ===== */
    drawCharts(xAxis, series) {
      if (!xAxis || !series || series.length === 0) {
        return
      }

      // 为每个指标创建独立图表
      series.forEach((serie, index) => {
        const chart = this.charts[index]
        if (!chart) return

        const option = this.getChartOption(xAxis, serie, index)
        chart.setOption(option, true)
      })
    },

    getChartOption(xAxis, serie, index) {
      const color = this.getIndicatorColor(index)
      
      const baseOption = {
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderColor: color,
          borderWidth: 1,
          textStyle: { color: '#fff' },
          axisPointer: {
            type: 'cross',
            crossStyle: { color: '#999' }
          },
          formatter: (params) => {
            const param = params[0]
            return `${param.name}<br/>${serie.name}: <strong>${param.value}${serie.unit || ''}</strong>`
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '10%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: xAxis,
          boundaryGap: this.chartType === 'bar',
          axisLine: { lineStyle: { color: '#ccc' } },
          axisLabel: { color: '#666' }
        },
        yAxis: {
          type: 'value',
          name: serie.unit || '',
          nameTextStyle: { color: '#999' },
          axisLine: { lineStyle: { color: '#ccc' } },
          axisLabel: { color: '#666' },
          splitLine: { lineStyle: { type: 'dashed', color: '#eee' } }
        }
      }

      if (this.chartType === 'line') {
        return {
          ...baseOption,
          series: [{
            name: serie.name,
            type: 'line',
            smooth: true,
            data: serie.data,
            symbolSize: 8,
            itemStyle: { color: color },
            lineStyle: { width: 3, color: color },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: `${color}40` },
                { offset: 1, color: `${color}10` }
              ])
            }
          }]
        }
      } else if (this.chartType === 'bar') {
        return {
          ...baseOption,
          series: [{
            name: serie.name,
            type: 'bar',
            data: serie.data,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: color },
                { offset: 1, color: `${color}80` }
              ]),
              borderRadius: [6, 6, 0, 0]
            },
            label: {
              show: serie.data.length <= 10,
              position: 'top',
              formatter: '{c}',
              color: '#666'
            }
          }]
        }
      } else if (this.chartType === 'area') {
        return {
          ...baseOption,
          series: [{
            name: serie.name,
            type: 'line',
            smooth: true,
            data: serie.data,
            symbolSize: 6,
            itemStyle: { color: color },
            lineStyle: { width: 2, color: color },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: `${color}60` },
                { offset: 1, color: `${color}05` }
              ])
            }
          }]
        }
      }
      
      return baseOption
    },
    
    /* ===== 导出功能 ===== */
    exportAllPics() {
      try {
        this.charts.forEach((chart, index) => {
          if (!chart) return
          const url = chart.getDataURL({
            type: 'png',
            pixelRatio: 2,
            backgroundColor: '#fff'
          })
          const a = document.createElement('a')
          a.href = url
          const indicatorName = this.chartData.series[index]?.name || `指标${index + 1}`
          a.download = `${indicatorName}_${new Date().getTime()}.png`
          a.click()
          // 延迟下一个下载，避免浏览器拦截
          if (index < this.charts.length - 1) {
            setTimeout(() => {}, 200)
          }
        })
        message.success('图片导出成功')
      } catch (error) {
        message.error('导出图片失败')
      }
    },
    
    async handleExportCsv() {
      if (!this.selectedCity || !this.selectedCountyId) {
        message.warning('请选择城市和县区')
        return
      }
      if (this.checkedKeys.length === 0) {
        message.warning('请选择指标并点击查询')
        return
      }
      
      try {
        const params = {
          city: this.selectedCity,
          countyId: this.selectedCountyId,
          startYear: this.startYear,
          endYear: this.endYear,
          indicators: this.checkedKeys.join(',')
        }
        
        const blob = await exportCsvData(params)
        
        const url = window.URL.createObjectURL(new Blob([blob]))
        const a = document.createElement('a')
        a.href = url
        a.download = `内蒙古贫困县分析数据_${new Date().getTime()}.csv`
        a.click()
        
        window.URL.revokeObjectURL(url)
        message.success('CSV导出成功')
      } catch (error) {
        message.error(error.error || '导出CSV失败')
      }
    },
    
    /* ===== 抽屉操作 ===== */
    removeCounty(id) {
      this.selectedCounties = this.selectedCounties.filter(c => c.county_id !== id)
    }
  },
  beforeUnmount() {
    // 清理图表实例
    this.charts.forEach(chart => {
      if (chart) chart.dispose()
    })
    window.removeEventListener('resize', this.handleResize)
  }
}
</script>

<style scoped lang="less">
.deep-analysis {
  padding: 12px;
  background: #f0f2f5;
  min-height: 100vh;
}
.filter-bar {
  width: 100%;
  padding: 16px 0;
  margin-bottom: 12px;
}
.main-body {
  margin-top: 12px;
}

/* 图表容器样式 */
.charts-container {
  margin-top: 12px;
}

/* 单图表大图样式 */
.single-chart {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  overflow: hidden;
  
  .chart-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    
    .indicator-icon {
      font-size: 20px;
    }
  }
}

/* 多图表网格头部 */
.chart-grid-header {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: flex-end;
}

/* 图表网格样式 */
.chart-grid {
  .mini-chart {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s ease;
    border: 2px solid transparent;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }
    
    .chart-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      
      .indicator-icon {
        font-size: 18px;
      }
    }
  }
  
  // 为每个卡片添加渐变边框效果
  .chart-card-0 { border-color: #1890ff20; }
  .chart-card-1 { border-color: #52c41a20; }
  .chart-card-2 { border-color: #fa8c1620; }
  .chart-card-3 { border-color: #722ed120; }
  .chart-card-4 { border-color: #eb2f9620; }
  .chart-card-5 { border-color: #13c2c220; }
}

.chart-card {
  margin-top: 12px;
}

.chart-item {
  width: 100%;
}

.indicator-tip {
  color: #999;
  padding: 8px 0;
  font-size: 14px;
}
.filter-bar .ant-select-selector,
.filter-bar .ant-input,
.filter-bar .ant-btn {
  height: 48px !important;
  line-height: 48px !important;
  font-size: 16px;
}
.filter-bar .ant-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding-top: 0;
  padding-bottom: 0;
  line-height: 1;
}

/* 移动端响应式 */
@media (max-width: 768px) {
  .deep-analysis {
    padding: 8px;
  }
  
  .filter-bar {
    padding: 12px 0;
    margin-bottom: 8px;
  }
  
  /* 筛选栏改为纵向布局 */
  .filter-bar .ant-row {
    flex-direction: column;
  }
  
  .filter-bar .ant-col {
    width: 100% !important;
    max-width: 100% !important;
    margin-bottom: 12px;
  }
  
  .filter-bar .ant-col:last-child {
    margin-bottom: 0;
  }
  
  .filter-bar .ant-select-selector,
  .filter-bar .ant-input,
  .filter-bar .ant-btn {
    height: 44px !important;
    line-height: 44px !important;
    font-size: 15px;
  }
  
  /* 主体区域改为纵向 */
  .main-body {
    flex-direction: column;
    margin-top: 8px;
  }
  
  .main-body .ant-col {
    width: 100% !important;
    max-width: 100% !important;
    margin-bottom: 12px;
  }
  
  /* 指标卡片改为单列 */
  .main-body .ant-row[gutter] .ant-col {
    width: 100% !important;
    max-width: 100% !important;
  }
  
  /* 图表容器 */
  .charts-container {
    margin-top: 8px;
  }
  
  /* 图表网格改为单列 */
  .chart-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .chart-grid .ant-col {
    width: 100% !important;
    max-width: 100% !important;
  }
  
  /* 图表卡片优化 */
  .single-chart,
  .mini-chart {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  
  .single-chart .chart-title,
  .mini-chart .chart-title {
    font-size: 14px;
  }
  
  .single-chart .indicator-icon,
  .mini-chart .indicator-icon {
    font-size: 16px;
  }
  
  /* 图表高度调整 */
  .chart-item {
    height: 250px !important;
  }
  
  /* 指标树优化 */
  .indicator-tip {
    font-size: 12px;
    padding: 6px 0;
  }
  
  /* 网格头部优化 */
  .chart-grid-header {
    padding: 12px;
    margin-bottom: 8px;
    flex-direction: column;
    align-items: stretch;
  }
  
  .chart-grid-header .ant-btn {
    width: 100%;
    margin-top: 8px;
  }
}

/* 超小屏幕 */
@media (max-width: 480px) {
  .deep-analysis {
    padding: 6px;
  }
  
  .filter-bar .ant-select-selector,
  .filter-bar .ant-input,
  .filter-bar .ant-btn {
    height: 40px !important;
    line-height: 40px !important;
    font-size: 14px;
  }
  
  .chart-item {
    height: 220px !important;
  }
}

/* 平板横屏 */
@media (min-width: 769px) and (max-width: 1024px) {
  .main-body .ant-col:first-child {
    width: 30% !important;
    max-width: 30% !important;
  }
  
  .main-body .ant-col:last-child {
    width: 70% !important;
    max-width: 70% !important;
  }
  
  .chart-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
</style>