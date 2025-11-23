<template>
  <div class="chart-container">
    <div ref="chartContainer" style="width: 100%; height: 300px;"></div>
  </div>
</template>

<script>
import { onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'

export default {
  name: 'PolicyEffectChart',
  props: {
    data: {
      type: Array,
      default: () => []
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
      if (chartContainer.value) {
        chartInstance = echarts.init(chartContainer.value)
        
        const option = {
          title: {
            text: '政策效果对比'
          },
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            data: props.regions.map(region => typeof region === 'object' ? region.name || region.id : region)
          },
          xAxis: {
            type: 'category',
            data: props.data.map(item => item.year)
          },
          yAxis: {
            type: 'value',
            name: '效果指数'
          },
          series: props.regions.map((region, index) => {
            const regionKey = `region${index + 1}`;
            const regionName = typeof region === 'object' ? (region.name || region.id) : region;
            return {
              name: regionName,
              type: 'bar',
              data: props.data.map(item => {
                // 确保数据是数值类型
                const value = item[regionKey];
                return isNaN(parseFloat(value)) ? 0 : parseFloat(value);
              }),
              smooth: true
            };
          })
        }
        
        chartInstance.setOption(option)
      }
    }
    
    // 监听props变化并重新渲染
    watch([() => props.data, () => props.regions], () => {
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
.chart-container {
  width: 100%;
  height: 100%;
}
</style>