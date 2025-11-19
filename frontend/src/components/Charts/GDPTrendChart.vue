<template>
  <div ref="chartContainer" class="gdp-trend-chart"></div>
</template>

<script>
import * as echarts from 'echarts';

export default {
  name: 'GDPTrendChart',
  props: {
    countyData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      chartInstance: null
    }
  },
  watch: {
    countyData: {
      handler(newVal) {
        if (newVal && newVal.gdpData) {
          this.$nextTick(() => {
            this.renderChart();
          });
        }
      },
      deep: true,
      immediate: true
    }
  },
  mounted() {
    this.initChart();
  },
  beforeUnmount() {
    if (this.chartInstance) {
      this.chartInstance.dispose();
    }
  },
  methods: {
    initChart() {
      if (!this.$refs.chartContainer) return;
      
      this.chartInstance = echarts.init(this.$refs.chartContainer);
      this.renderChart();
      
      // 响应式调整
      window.addEventListener('resize', this.handleResize);
    },
    
    renderChart() {
      if (!this.chartInstance || !this.countyData.gdpData) return;
      
      const gdpData = this.countyData.gdpData;
      const labels = ['2018', '2019', '2020', '2021', '2022', '2023'];
      
      // 计算增长率
      const growthRates = gdpData.map((value, index, array) => {
        if (index === 0) return 0;
        const prevValue = array[index - 1];
        return ((value - prevValue) / prevValue * 100).toFixed(1);
      });
      
      const option = {
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#ddd',
          borderWidth: 1,
          textStyle: {
            color: '#333'
          },
          formatter: function(params) {
            let result = `<div style="font-weight: bold; margin-bottom: 5px;">${params[0].name}</div>`;
            params.forEach(param => {
              const value = param.seriesName.includes('增长率') ? 
                param.value + '%' : 
                param.value.toLocaleString() + ' 万元';
              const color = param.color;
              result += `
                <div style="display: flex; align-items: center; margin: 5px 0;">
                  <span style="display: inline-block; width: 10px; height: 10px; background: ${color}; border-radius: 50%; margin-right: 8px;"></span>
                  <span style="flex: 1;">${param.seriesName}:</span>
                  <span style="font-weight: bold;">${value}</span>
                </div>
              `;
            });
            return result;
          }
        },
        legend: {
          data: ['GDP（万元）', '增长率（%）'],
          right: 10,
          top: 5, // 上移图例位置
          textStyle: {
            color: '#666',
            fontSize: 12
          },
          itemGap: 15,
          itemWidth: 12,
          itemHeight: 12,
          padding: [5, 10, 5, 10]
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '25%', // 增加顶部间距，为图例留出更多空间
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: labels,
          axisLine: {
            lineStyle: {
              color: '#ccc'
            }
          },
          axisLabel: {
            color: '#666'
          }
        },
        yAxis: [
          {
            type: 'value',
            name: 'GDP（万元）',
            position: 'left',
            axisLine: {
              show: true,
              lineStyle: {
                color: '#3498db'
              }
            },
            axisLabel: {
              formatter: function(value) {
                if (value >= 10000) {
                  return (value / 10000).toFixed(0) + '万';
                }
                return value;
              },
              color: '#666'
            },
            splitLine: {
              lineStyle: {
                color: '#f0f0f0',
                type: 'dashed'
              }
            }
          },
          {
            type: 'value',
            name: '增长率（%）',
            position: 'right',
            axisLine: {
              show: true,
              lineStyle: {
                color: '#2ecc71'
              }
            },
            axisLabel: {
              formatter: '{value}%',
              color: '#666'
            },
            splitLine: {
              show: false
            }
          }
        ],
        series: [
          {
            name: 'GDP（万元）',
            type: 'line',
            data: gdpData,
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: {
              width: 3,
              color: '#3498db'
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(52, 152, 219, 0.3)' },
                { offset: 1, color: 'rgba(52, 152, 219, 0.05)' }
              ])
            },
            itemStyle: {
              color: '#3498db'
            },
            yAxisIndex: 0
          },
          {
            name: '增长率（%）',
            type: 'line',
            data: growthRates,
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: {
              width: 3,
              color: '#2ecc71'
            },
            itemStyle: {
              color: '#2ecc71'
            },
            yAxisIndex: 1
          }
        ]
      };
      
      this.chartInstance.setOption(option);
    },
    
    handleResize() {
      if (this.chartInstance) {
        this.chartInstance.resize();
      }
    }
  }
}
</script>

<style scoped>
.gdp-trend-chart {
  width: 100%;
  height: 300px;
}
</style>