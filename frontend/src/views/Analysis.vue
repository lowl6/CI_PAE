<template>
  <div class="deep-analysis">
    <!-- 顶部筛选 -->
 <a-card class="filter-bar" size="small">
  <!-- 一行 5 列，每列 4/24 ≈ 16.7% -->
  <a-row :gutter="16" align="middle">
    <a-col :span="4">
      <a-form-item label="城市" style="margin: 0">
        <a-select v-model="params.city"
                  placeholder="请选择城市"
                  allow-clear
                  @change="loadCounties"
                  style="width: 100%" />
      </a-form-item>
    </a-col>

    <a-col :span="4">
      <a-form-item label="县区" style="margin: 0">
        <a-select v-model="params.countyId"
                  placeholder="全部县区"
                  allow-clear
                  style="width: 100%" />
      </a-form-item>
    </a-col>

    <a-col :span="4">
      <a-form-item label="政策类型" style="margin: 0">
        <a-select v-model="params.policyType"
                  placeholder="全部政策"
                  allow-clear
                  style="width: 100%" />
      </a-form-item>
    </a-col>

    <a-col :span="8">
      <a-form-item label="年份区间" style="margin: 0">
        <a-range-picker v-model="yearRange"
                        value-format="YYYY"
                        mode="year"
                        style="width: 100%" />
      </a-form-item>
    </a-col>

    <a-col :span="4" style="text-align: right">
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
          <a-row :gutter="12">
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
              <a-button size="small" @click="exportCsv">导出 CSV</a-button>
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
import { Card, Row, Col, Select, Button, Tree, RangePicker, Spin, Radio } from 'ant-design-vue'
import IndicatorCard from './IndicatorCard.vue'
import QuickCompareDrawer from './QuickCompareDrawer.vue'
import {
    getProvinces,
    getCities,
    getCounties,
    getIndicatorsTree,
    getAnalysisData
} from '@/api/analysis'

const API_BASE = import.meta.env.VITE_API_BASE

export default {
  name: 'DeepAnalysis',
  components: {
    ACard: Card, ARow: Row, ACol: Col, ASelect: Select, ASelectOption: Select.Option,
    AButton: Button, ATree: Tree, ARangePicker: RangePicker, ASpin: Spin,
    ARadioGroup: Radio.Group, ARadioButton: Radio.Button,
    IndicatorCard, QuickCompareDrawer
  },
  data() {
    return {
      loading: false,
      provinces: [],
      cities: [],
      counties: [],
      policyTypes: ['产业扶贫', '易地搬迁', '教育扶贫', '健康扶贫', '生态扶贫', '兜底保障'],
      params: { province: '', city: '', countyId: '', policyType: '' },
      yearRange: ['2015', '2023'],
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
    this.loadProvinces()
    this.loadIndicators()
  },
  watch: {
    checkedKeys() {
      this.checkedIndicators = this.flattenTree(this.indicatorTree).filter(
        item => this.checkedKeys.includes(item.key)
      )
      this.handleQuery()
    }
  },
  methods: {
    /* ===== 初始化 ===== */
    initChart() {
      this.chart = echarts.init(document.getElementById('main-chart'))
      window.addEventListener('resize', () => this.chart.resize())
    },
    /* ===== 级联加载 ===== */
    async loadProvinces() {
      this.provinces = await getProvinces()
    },
    async loadCities() {
      this.cities = this.params.province ? await getCities(this.params.province) : []
      this.params.city = ''
      this.counties = []
    },
    async loadCounties() {
      this.counties = this.params.city ? await getCounties(this.params.province, this.params.city) : []
      this.params.countyId = ''
    },
    async loadIndicators() {
      this.indicatorTree = await getIndicatorsTree()
    },
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
    /* ===== 查询 ===== */
    async handleQuery() {
      if (!this.checkedKeys.length) return this.$message.warning('请先选择指标')
      this.loading = true
      const payload = {
        ...this.params,
        startYear: this.yearRange[0],
        endYear: this.yearRange[1],
        indicators: this.checkedKeys
      }
      const { cards, series, xAxis, counties } = await getAnalysisData(payload)
      this.cards = cards
      this.selectedCounties = counties
      this.drawChart(xAxis, series)
      this.loading = false
    },
    /* ===== 绘图 ===== */
    drawChart(xAxis, series) {
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
          const ind = series.map(s => ({ name: s.name, max: Math.max(...s.data) * 1.2 }))
          return {
            tooltip: {},
            legend: { data: series.map(s => s.name) },
            radar: { indicator: ind },
            series: [{ type: 'radar', data: series.map(s => ({ value: s.data, name: s.name })) }]
          }
        }
      }
      this.chart.setOption(opts[this.chartType](), true)
    },
    /* ===== 导出 ===== */
    exportPic() {
      const url = this.chart.getDataURL()
      const a = document.createElement('a')
      a.href = url
      a.download = '深度分析图表.png'
      a.click()
    },
    exportCsv() {
      window.open(`${API_BASE}/analysis/exportCsv?indicators=${this.checkedKeys.join(',')}&countyId=${this.params.countyId || ''}&startYear=${this.yearRange[0]}&endYear=${this.yearRange[1]}`)
    },
    /* ===== 抽屉 ===== */
    removeCounty(id) {
      this.selectedCounties = this.selectedCounties.filter(c => c.countyId !== id)
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
}
.chart-card {
  margin-top: 12px;
}
.filter-bar .ant-select-selector,
.filter-bar .ant-picker,
.filter-bar .ant-btn {
  height: 48px !important;   /* 想再厚就继续加 */
  line-height: 48px !important;
  font-size: 16px;
}
.filter-bar .ant-btn {
  height: 48px !important;
  font-size: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding-top: 0;
  padding-bottom: 0;
  line-height: 1;
}
</style>