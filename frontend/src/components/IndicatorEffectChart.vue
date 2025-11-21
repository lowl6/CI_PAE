<template>
  <div class="indicator-effect-charts">
    <div class="charts-container">
      <div 
        v-for="(effect, index) in effects" 
        :key="index" 
        class="chart-item"
      >
        <div class="chart-header">
          <span class="indicator-icon">{{ getIndicatorIcon(effect.indicator) }}</span>
          <h4 class="chart-title">{{ effect.name }}</h4>
          <a-tag 
            :color="parseFloat(effect.change_pct) >= 0 ? 'success' : 'error'"
            class="change-tag"
          >
            {{ parseFloat(effect.change_pct) >= 0 ? '↑' : '↓' }}
            {{ Math.abs(parseFloat(effect.change_pct)).toFixed(1) }}%
          </a-tag>
        </div>
        <div :ref="el => chartRefs[index] = el" class="chart-container"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'

export default {
  name: 'IndicatorEffectChart',
  props: {
    effects: {
      type: Array,
      required: true
      // 每个元素包含: indicator_name, before_value, after_value, change_percent
    }
  },
  setup(props) {
    const chartRefs = ref([])
    const chartInstances = []

    // 获取指标图标
    const getIndicatorIcon = (indicator) => {
      const icons = {
        'gdp': '📊',
        'disp_income_rural': '🌾',
        'registered_pop': '👥',
        'grain_yield': '🌾',
        'road_mileage': '🛣️',
        'primary_schools': '🏫'
      }
      return icons[indicator] || '📈'
    }

    // 创建单个指标的图表
    const createChart = (container, effect, index) => {
      if (!container) return null

      const chart = echarts.init(container)
      
      const beforeValue = parseFloat(effect.before_avg)
      const afterValue = parseFloat(effect.after_avg)
      const changePercent = parseFloat(effect.change_pct)
      const unit = effect.unit || ''
      const period = effect.period || ''

      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: () => {
            return `
              <div style="padding: 8px;">
                <strong>${effect.name}</strong><br/>
                <div style="margin-top: 8px;">
                  前期平均: <strong>${beforeValue.toFixed(2)}${unit}</strong><br/>
                  后期平均: <strong>${afterValue.toFixed(2)}${unit}</strong><br/>
                  变化幅度: <strong style="color: ${changePercent >= 0 ? '#52c41a' : '#f5222d'}">
                    ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%
                  </strong>
                </div>
              </div>
            `
          }
        },
        grid: {
          left: '15%',
          right: '15%',
          bottom: '15%',
          top: '10%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['前期平均', '后期平均'],
          axisLabel: {
            fontSize: 12,
            color: '#595959'
          },
          axisLine: {
            lineStyle: {
              color: '#d9d9d9'
            }
          }
        },
        yAxis: {
          type: 'value',
          name: unit,
          nameTextStyle: {
            fontSize: 11,
            color: '#8c8c8c'
          },
          axisLabel: {
            fontSize: 11,
            color: '#8c8c8c',
            formatter: (value) => {
              if (value >= 10000) {
                return (value / 10000).toFixed(1) + '万'
              }
              return value.toFixed(0)
            }
          },
          splitLine: {
            lineStyle: {
              type: 'dashed',
              color: '#f0f0f0'
            }
          }
        },
        series: [
          {
            type: 'bar',
            data: [
              {
                value: beforeValue,
                itemStyle: {
                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#d9d9d9' },
                    { offset: 1, color: '#bfbfbf' }
                  ]),
                  borderRadius: [6, 6, 0, 0]
                }
              },
              {
                value: afterValue,
                itemStyle: {
                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: changePercent >= 0 ? '#73d13d' : '#ff7875' },
                    { offset: 1, color: changePercent >= 0 ? '#52c41a' : '#f5222d' }
                  ]),
                  borderRadius: [6, 6, 0, 0]
                }
              }
            ],
            barWidth: '40%',
            label: {
              show: true,
              position: 'top',
              fontSize: 12,
              fontWeight: 'bold',
              formatter: (params) => {
                if (params.dataIndex === 0) {
                  return `${beforeValue.toFixed(1)}${unit}`
                } else {
                  return `${afterValue.toFixed(1)}${unit}`
                }
              },
              color: '#262626'
            }
          }
        ]
      }

      chart.setOption(option)
      return chart
    }

    // 初始化所有图表
    const initCharts = () => {
      if (!props.effects || props.effects.length === 0) return

      // 清理旧实例
      chartInstances.forEach(chart => chart?.dispose())
      chartInstances.length = 0
      
      // 为每个指标创建独立图表
      props.effects.forEach((effect, index) => {
        setTimeout(() => {
          const container = chartRefs.value[index]
          if (container) {
            const chart = createChart(container, effect, index)
            if (chart) {
              chartInstances.push(chart)
            }
          }
        }, 50 * index) // 错开创建时间,避免性能问题
      })
    }

    // 响应式调整
    const handleResize = () => {
      chartInstances.forEach(chart => chart?.resize())
    }

    // 监听数据变化
    watch(() => props.effects, () => {
      initCharts()
    }, { deep: true })

    onMounted(() => {
      initCharts()
      window.addEventListener('resize', handleResize)
    })

    // 组件卸载前清理
    onBeforeUnmount(() => {
      chartInstances.forEach(chart => chart?.dispose())
      window.removeEventListener('resize', handleResize)
    })

    return {
      chartRefs,
      getIndicatorIcon
    }
  }
}
</script>

<style scoped>
.indicator-effect-charts {
  padding: 16px;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.chart-item {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
}

.chart-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.chart-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.indicator-icon {
  font-size: 18px;
}

.chart-title {
  flex: 1;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}

.change-tag {
  font-size: 12px;
  font-weight: 600;
}

.chart-container {
  width: 100%;
  height: 240px;
}

@media (max-width: 768px) {
  .charts-container {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    height: 200px;
  }
}
</style>
