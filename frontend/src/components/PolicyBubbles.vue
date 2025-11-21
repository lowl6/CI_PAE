<template>
  <div class="policy-bubbles-container" ref="containerRef">
    <svg ref="svgRef" :width="width" :height="height">
      <!-- 定义辉光滤镜(根据访谈数量动态应用) -->
      <defs>
        <filter id="glow-filter">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <!-- 气泡将由D3.js动态生成并挂载到此 -->
    </svg>
    
    <!-- 悬浮提示框 -->
    <div 
      v-if="tooltip.visible" 
      class="bubble-tooltip" 
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
    >
      <div class="tooltip-title">{{ tooltip.data.policy_name }}</div>
      <div class="tooltip-item">
        <span class="label">政策类型:</span>
          <span class="value">{{ formatPolicyType(tooltip.data) }}</span>
      </div>
      <div class="tooltip-item">
        <span class="label">覆盖县数:</span>
        <span class="value">{{ tooltip.data.county_count }}个</span>
      </div>
      <div class="tooltip-item">
        <span class="label">相关访谈:</span>
        <span class="value">{{ tooltip.data.interview_count }}条</span>
      </div>
      <div class="tooltip-hint">点击查看详情</div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as d3 from 'd3'

export default {
  name: 'PolicyBubbles',
  props: {
    // 政策数据列表(从父组件传入)
    policies: {
      type: Array,
      required: true,
      // 每个政策对象包含: policy_id, policy_name, policy_type, type_name, 
      // county_count, interview_count, resource_count, publish_year
    },
    // 容器宽度(默认自动获取)
    containerWidth: {
      type: Number,
      default: null
    },
    // 容器高度
    containerHeight: {
      type: Number,
      default: 800
    }
  },
  emits: ['bubble-click'],
  setup(props, { emit }) {
    const containerRef = ref(null)
    const svgRef = ref(null)
    const width = ref(1200)
    const height = ref(800)
    
    // 提示框状态
    const tooltip = ref({
      visible: false,
      x: 0,
      y: 0,
      data: {}
    })

    // D3.js力导向模拟实例
    let simulation = null
    let nodes = null
    let bubbles = null

    // 政策类型颜色映射(使用色相环分布)
    const policyTypeColors = {
      agriculture: '#52c41a',        // 绿色-农业
      medical: '#1890ff',            // 蓝色-医疗
      education: '#722ed1',          // 紫色-教育
      poverty_alleviation: '#fa8c16', // 橙色-扶贫
      infrastructure: '#13c2c2',     // 青色-基建
      other: '#8c8c8c'               // 灰色-其他
    }

    // 类型中文名称映射
    const policyTypeLabels = {
      agriculture: '农业政策',
      medical: '医疗卫生',
      education: '教育发展',
      poverty_alleviation: '扶贫政策',
      infrastructure: '基础设施',
      other: '其他'
    }

    const formatPolicyType = (p) => {
      if (!p) return '未知'
      if (p.policy_type && policyTypeLabels[p.policy_type]) {
        return policyTypeLabels[p.policy_type]
      }
      return p.type_name || p.policy_type || '未知'
    }

    // 根据覆盖县数计算气泡半径(平方根比例尺，增大范围以显示文字)
    const radiusScale = computed(() => {
      if (!props.policies || props.policies.length === 0) return d3.scaleSqrt().domain([0, 10]).range([40, 120])
      const maxCounty = d3.max(props.policies, d => d.county_count) || 10
      return d3.scaleSqrt().domain([0, maxCounty]).range([40, 120])
    })

    // 初始化力导向图
    const initSimulation = () => {
      if (!svgRef.value || !props.policies || props.policies.length === 0) return

      // 清空之前的内容
      d3.select(svgRef.value).selectAll('*').remove()

      // 准备节点数据(为D3添加x,y,vx,vy属性)
      nodes = props.policies.map(p => ({
        ...p,
        radius: radiusScale.value(p.county_count),
        color: policyTypeColors[p.policy_type] || policyTypeColors.other,
        hasGlow: p.interview_count > 0 // 有访谈数据的气泡添加辉光
      }))

      // 创建力模拟 - 添加边界约束和持续运动
      simulation = d3.forceSimulation(nodes)
        .velocityDecay(0.2) // 降低速度衰减保持运动
        .force('charge', d3.forceManyBody().strength(-3)) // 增强排斥力避免聚集
        .force('x', d3.forceX(width.value / 2).strength(0.0002)) // X轴向中心引力
        .force('y', d3.forceY(height.value / 2).strength(0.0002)) // Y轴向中心引力
        .force('collision', d3.forceCollide().radius(d => d.radius + 15).strength(1)) // 强碰撞检测
        .alphaTarget(0.3) // 提高alphaTarget保持持续运动
        .alphaDecay(0) // 禁用alpha衰减,永久运动
        .on('tick', ticked)

      // 创建气泡分组
      const svg = d3.select(svgRef.value)
      bubbles = svg.selectAll('.bubble')
        .data(nodes, d => d.policy_id)
        .join('g')
        .attr('class', 'bubble')
        .style('cursor', 'pointer')
        .call(drag(simulation)) // 添加拖拽行为
        .on('mouseenter', handleMouseEnter)
        .on('mousemove', handleMouseMove)
        .on('mouseleave', handleMouseLeave)
        .on('click', handleClick)

      // 绘制圆形气泡
      bubbles.append('circle')
        .attr('r', d => d.radius)
        .attr('fill', d => d.color)
        .attr('fill-opacity', 0.7)
        .attr('stroke', d => d.color)
        .attr('stroke-width', 2)
        .style('filter', d => d.hasGlow ? 'url(#glow-filter)' : 'none')

      // 添加政策名称文本(精简版,去除地名)
      bubbles.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.3em')
        .style('fill', '#fff')
        .style('font-size', d => Math.min(d.radius / 2, 20) + 'px')
        .style('font-weight', 'bold')
        .style('pointer-events', 'none')
        .text(d => {
          // 去除地名后缀(如"××市"、"××县")
          let simpleName = d.policy_name.replace(/[\u4e00-\u9fa5]{2,}[市县区]/, '')
          // 进一步精简:提取核心关键词
          simpleName = simpleName.replace(/关于|的通知|的意见|实施方案/g, '').trim()
          
          const maxLen = Math.floor(d.radius / 4)
          return simpleName.length > maxLen ? simpleName.slice(0, maxLen) + '...' : simpleName
        })

      // 添加覆盖县数标签
      bubbles.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.5em')
        .style('fill', '#fff')
        .style('font-size', d => Math.min(d.radius / 3, 16) + 'px')
        .style('pointer-events', 'none')
        .text(d => `${d.county_count}县`)

      // 添加脉冲动画(有访谈的气泡)
      bubbles.filter(d => d.hasGlow)
        .select('circle')
        .style('animation', 'pulse 2s ease-in-out infinite')
    }

    // 更新气泡位置(每个tick触发) - 添加边界碰撞检测
    const ticked = () => {
      if (!bubbles) return
      
      // 检测边界碰撞并反弹
      bubbles.each(function(d) {
        // 左右边界
        if (d.x - d.radius < 0) {
          d.x = d.radius
          d.vx = Math.abs(d.vx) * 0.8 // 反弹并减速
        } else if (d.x + d.radius > width.value) {
          d.x = width.value - d.radius
          d.vx = -Math.abs(d.vx) * 0.8
        }
        
        // 上下边界
        if (d.y - d.radius < 0) {
          d.y = d.radius
          d.vy = Math.abs(d.vy) * 0.8
        } else if (d.y + d.radius > height.value) {
          d.y = height.value - d.radius
          d.vy = -Math.abs(d.vy) * 0.8
        }
      })
      
      bubbles.attr('transform', d => `translate(${d.x},${d.y})`)
    }

    // 拖拽行为
    const drag = (simulation) => {
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      }
      function dragged(event, d) {
        d.fx = event.x
        d.fy = event.y
      }
      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
      }
      return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
    }

    // 鼠标事件处理
    const handleMouseEnter = (event, d) => {
      tooltip.value.visible = true
      tooltip.value.data = d
    }

    const handleMouseMove = (event) => {
      tooltip.value.x = event.pageX + 15
      tooltip.value.y = event.pageY + 15
    }

    const handleMouseLeave = () => {
      tooltip.value.visible = false
    }

    const handleClick = (event, d) => {
      // 传递 policy 数据与原始事件,供外层用于粒子特效定位
      emit('bubble-click', d, event)
    }

    // 响应式更新容器尺寸
    const updateDimensions = () => {
      if (containerRef.value) {
        width.value = props.containerWidth || containerRef.value.offsetWidth
        height.value = props.containerHeight
      }
    }

    // 监听数据变化重新初始化
    watch(() => props.policies, () => {
      initSimulation()
    }, { deep: true })

    onMounted(() => {
      updateDimensions()
      window.addEventListener('resize', updateDimensions)
      initSimulation()
    })

    onUnmounted(() => {
      window.removeEventListener('resize', updateDimensions)
      if (simulation) simulation.stop()
    })

    return {
      containerRef,
      svgRef,
      width,
      height,
      tooltip,
      formatPolicyType
    }
  }
}
</script>

<style scoped>
.policy-bubbles-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  overflow: hidden;
}

svg {
  display: block;
}

/* 气泡脉冲动画 */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}

/* 悬浮提示框样式 */
.bubble-tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  padding: 12px 16px;
  border-radius: 6px;
  pointer-events: none;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 200px;
}

.tooltip-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 6px;
}

.tooltip-item {
  font-size: 12px;
  margin: 4px 0;
  display: flex;
  justify-content: space-between;
}

.tooltip-item .label {
  color: rgba(255, 255, 255, 0.7);
  margin-right: 8px;
}

.tooltip-item .value {
  font-weight: 500;
}

.tooltip-hint {
  margin-top: 8px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 6px;
}
</style>
