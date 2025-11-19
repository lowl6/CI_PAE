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

          <!-- 图表区 -->
          <a-card size="small" class="chart-card">
            <template #extra>
              <a-radio-group v-model="chartType" size="small">
                <a-radio-button value="line">折线</a-radio-button>
                <a-radio-button value="bar">柱状</a-radio-button>
                <a-radio-button value="radar">雷达</a-radio-button>
              </a-radio-group>
              <a-button size="small" @click="exportPic">导出图片</a-button>
              <a-button size="small" @click="handleExportCsv">导出 CSV</a-button>
            </template>
            <div id="main-chart" style="height: 420px"></div>
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
      chart: null,
      cards: [],
      drawerVisible: false,
      selectedCounties: [],
      checkedIndicators: []
    }
  },
  mounted() {
    this.initChart()
    this.loadCities()
    this.loadIndicators()
  },
  watch: {
    checkedKeys() {
      this.checkedIndicators = this.flattenTree(this.indicatorTree).filter(
        item => this.checkedKeys.includes(item.key)
      )
    }
  },
  methods: {
    /* ===== 初始化 ===== */
    initChart() {
      this.chart = echarts.init(document.getElementById('main-chart'))
      window.addEventListener('resize', () => this.chart.resize())
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
          this.drawChart(result.data.xAxis, result.data.series)
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
    drawChart(xAxis, series) {
      if (!xAxis || !series || series.length === 0) {
        this.chart.clear()
        return
      }
      
      const opts = {
        line: () => ({
          tooltip: { trigger: 'axis' },
          legend: { data: series.map(s => s.name) },
          xAxis: { type: 'category', data: xAxis },
          yAxis: { type: 'value' },
          series: series.map(s => ({ ...s, type: 'line', smooth: true }))
        }),
        bar: () => ({
          tooltip: { trigger: 'axis' },
          legend: { data: series.map(s => s.name) },
          xAxis: { type: 'category', data: xAxis },
          yAxis: { type: 'value' },
          series: series.map(s => ({ ...s, type: 'bar' }))
        }),
        radar: () => {
          const ind = series.map(s => ({ 
            name: s.name, 
            max: Math.max(...s.data) * 1.2 
          }))
          return {
            tooltip: {},
            legend: { data: series.map(s => s.name) },
            radar: { indicator: ind },
            series: [{ 
              type: 'radar', 
              data: series.map(s => ({ value: s.data, name: s.name })) 
            }]
          }
        }
      }
      
      this.chart.setOption(opts[this.chartType](), true)
    },
    
    /* ===== 导出功能 ===== */
    exportPic() {
      try {
        const url = this.chart.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: '#fff'
        })
        const a = document.createElement('a')
        a.href = url
        a.download = `内蒙古贫困县分析图表_${new Date().getTime()}.png`
        a.click()
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
.chart-card {
  margin-top: 12px;
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
</style>