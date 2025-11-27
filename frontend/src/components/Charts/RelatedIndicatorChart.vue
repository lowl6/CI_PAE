<template>
  <div class="related-chart-container">
    <div ref="chartContainer" style="width: 100%; height: 280px;"></div>
  </div>
</template>

<script>
import { onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'

export default {
  name: 'RelatedIndicatorChart',
  props: {
    data: {
      type: Array,
      default: () => []
    },
    indicatorName: {
      type: String,
      default: ''
    },
    regions: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const chartContainer = ref(null)
    let chartInstance = null
    
    const initChart = () => {
      if (chartContainer.value && props.data.length > 0) {
        if (!chartInstance) {
          chartInstance = echarts.init(chartContainer.value)
        }
        
        const option = {
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            }
          },
          legend: {
            data: props.regions.map(region => typeof region === 'object' ? region.name || region.id : region),
            bottom: 0
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '60px',
            top: '10px',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: props.data.map(item => item.year),
            axisLabel: {
              rotate: 45
            }
          },
          yAxis: {
            type: 'value',
            name: props.indicatorName,
            nameTextStyle: {
              fontSize: 12
            }
          },
          series: props.regions.map((region, index) => {
            const regionKey = `region${index + 1}`;
            const regionName = typeof region === 'object' ? (region.name || region.id) : region;
            
            return {
              name: regionName,
              type: 'line',
              smooth: true,
              data: props.data.map(item => {
                const value = item[regionKey];
                return isNaN(parseFloat(value)) ? 0 : parseFloat(value);
              }),
              // 为不同地区使用不同颜色
              itemStyle: {
                color: index === 0 ? '#5470c6' : '#91cc75'
              },
              lineStyle: {
                width: 2
              },
              areaStyle: {
                opacity: 0.1
              }
            };
          })
        }
        
        chartInstance.setOption(option)
      }
    }
    
    // 监听props变化并重新渲染
    watch([() => props.data, () => props.regions, () => props.indicatorName], () => {
      if (chartInstance) {
        initChart()
      }
    }, { deep: true })
    
    onMounted(() => {
      initChart()
      
      // 监听窗口大小变化
      window.addEventListener('resize', () => {
        if (chartInstance) {
          chartInstance.resize()
        }
      })
    })
    
    return {
      chartContainer
    }
  }
}
</script>

<style scoped>
.related-chart-container {
  width: 100%;
  height: 100%;
}
</style>
