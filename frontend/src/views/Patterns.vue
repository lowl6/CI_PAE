<template>
  <div class="patterns-page">
    <!-- 页面标题与统计卡片 -->
    <div class="page-header">
      <a-page-header
        title="经验模式库"
        sub-title="基于政策与口述史的扶贫经验可视化分析"
      >
        <template #extra>
          <a-button type="primary" @click="refreshData">
            <template #icon><ReloadOutlined /></template>
            刷新数据
          </a-button>
        </template>
      </a-page-header>

      <!-- 统计卡片 -->
      <a-row :gutter="16" style="margin-top: 16px;">
        <a-col :span="6">
          <a-card size="small">
            <a-statistic
              title="政策总数"
              :value="stats.total_policies"
              :value-style="{ color: '#3f8600' }"
            >
              <template #prefix>
                <FileTextOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card size="small">
            <a-statistic
              title="覆盖县数"
              :value="stats.total_counties"
              :value-style="{ color: '#1890ff' }"
            >
              <template #prefix>
                <EnvironmentOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card size="small">
            <a-statistic
              title="平均覆盖度"
              :value="stats.avg_coverage"
              :precision="1"
              suffix="%"
              :value-style="{ color: '#cf1322' }"
            >
              <template #prefix>
                <RiseOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card size="small">
            <a-statistic
              title="访谈记录"
              :value="totalInterviews"
              :value-style="{ color: '#722ed1' }"
            >
              <template #prefix>
                <TeamOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 筛选工具栏 -->
    <a-card class="filter-card" size="small">
      <a-form layout="inline" :model="filters">
        <a-form-item label="政策类型">
          <a-select
            v-model:value="filters.type"
            placeholder="全部类型"
            style="width: 160px;"
            @change="handleFilterChange"
          >
            <a-select-option value="">全部类型</a-select-option>
            <a-select-option
              v-for="type in policyTypes"
              :key="type.policy_type"
              :value="type.policy_type"
            >
              {{ type.type_name }} ({{ type.count }})
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="城市">
          <a-select
            v-model:value="filters.city"
            placeholder="全部城市"
            style="width: 140px;"
            @change="handleFilterChange"
          >
            <a-select-option value="">全部城市</a-select-option>
            <a-select-option v-for="city in cities" :key="city" :value="city">
              {{ city }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="发布年份">
          <a-select
            v-model:value="filters.year"
            placeholder="全部年份"
            style="width: 120px;"
            @change="handleFilterChange"
          >
            <a-select-option value="">全部年份</a-select-option>
            <a-select-option
              v-for="year in publishYears"
              :key="year.publish_year"
              :value="year.publish_year"
            >
              {{ year.publish_year }} ({{ year.count }})
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="关键词">
          <a-input
            v-model:value="filters.keyword"
            placeholder="搜索政策名称或关键词"
            style="width: 200px;"
            @pressEnter="handleFilterChange"
          >
            <template #suffix>
              <SearchOutlined @click="handleFilterChange" style="cursor: pointer;" />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item>
          <a-button @click="handleResetFilters">重置</a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 气泡可视化区域 -->
    <a-card class="bubbles-card" :loading="loading">
      <template #title>
        <span>政策气泡图</span>
        <a-tooltip title="气泡大小代表覆盖县数,颜色代表政策类型,辉光效果代表存在访谈记录">
          <QuestionCircleOutlined style="margin-left: 8px; color: #8c8c8c;" />
        </a-tooltip>
      </template>

      <PolicyBubbles
        v-if="policies.length > 0"
        :policies="policies"
        :container-height="800"
        @bubble-click="handleBubbleClick"
      />
      <a-empty v-else description="暂无政策数据" />
    </a-card>

    <!-- 政策详情抽屉 -->
    <PolicyDetailDrawer
      v-model:visible="drawerVisible"
      :policy-id="selectedPolicyId"
      @close="handleDrawerClose"
    />
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import {
  ReloadOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  RiseOutlined,
  TeamOutlined,
  SearchOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons-vue'
import { getPolicies, getPolicyStats, getCities } from '@/api/policy'
import PolicyBubbles from '@/components/PolicyBubbles.vue'
import PolicyDetailDrawer from '@/components/PolicyDetailDrawer.vue'

export default {
  name: 'Patterns',
  components: {
    ReloadOutlined,
    FileTextOutlined,
    EnvironmentOutlined,
    RiseOutlined,
    TeamOutlined,
    SearchOutlined,
    QuestionCircleOutlined,
    PolicyBubbles,
    PolicyDetailDrawer
  },
  setup() {
    const loading = ref(false)
    const policies = ref([])
    const stats = reactive({
      total_policies: 0,
      total_counties: 0,
      avg_coverage: 0
    })
    const policyTypes = ref([])
    const publishYears = ref([])
    const cities = ref([])

    // 筛选条件
    const filters = reactive({
      type: '',
      city: '',
      year: '',
      keyword: ''
    })

    // 抽屉状态
    const drawerVisible = ref(false)
    const selectedPolicyId = ref(null)

    // 计算总访谈数
    const totalInterviews = computed(() => {
      return policies.value.reduce((sum, p) => sum + (p.interview_count || 0), 0)
    })

    // 获取政策统计数据
    const fetchStats = async () => {
      try {
        const res = await getPolicyStats()
        if (res.ok) {
          const data = res.data
          // 计算政策总数(从by_type统计)
          const typeData = data.by_type || []
          stats.total_policies = typeData.reduce((sum, item) => sum + item.count, 0)
          // 使用实际覆盖的不重复县数
          stats.total_counties = data.coverage.total || 0
          // 平均覆盖度 = 平均每个政策覆盖的县数 / 总县数
          stats.avg_coverage = ((data.coverage.avg || 0) / (data.coverage.total || 1) * 100).toFixed(1)
          policyTypes.value = data.by_type || []
          publishYears.value = data.by_year || []
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
      }
    }

    // 获取城市列表
    const fetchCities = async () => {
      try {
        const res = await getCities()
        if (res.ok) {
          cities.value = res.data || []
        }
      } catch (error) {
        console.error('获取城市列表失败:', error)
      }
    }

    // 获取政策列表
    const fetchPolicies = async () => {
      loading.value = true
      try {
        const params = {
          page: 1,
          pageSize: 100, // 气泡图通常显示所有数据
          ...filters
        }
        // 移除空值参数
        Object.keys(params).forEach(key => {
          if (params[key] === '' || params[key] === null || params[key] === undefined) {
            delete params[key]
          }
        })

        const res = await getPolicies(params)
        console.log('筛选参数:', params)
        console.log('API响应:', res)
        console.log('返回的政策数量:', res.data?.policies?.length)
        if (res && res.ok) {
          policies.value = res.data.policies || []
        } else {
          console.error('获取政策列表失败:', res)
        }
      } catch (error) {
        console.error('获取政策列表异常:', error, error.response)
      } finally {
        loading.value = false
      }
    }

    // 刷新所有数据
    const refreshData = async () => {
      await fetchStats()
      await fetchCities()
      await fetchPolicies()
    }

    // 筛选条件变化(自动查询)
    const handleFilterChange = () => {
      fetchPolicies()
    }

    // 重置筛选条件
    const handleResetFilters = () => {
      filters.type = ''
      filters.city = ''
      filters.year = ''
      filters.keyword = ''
      fetchPolicies()
    }

    // 创建带“年纪”差异（依据 issue_date 年份）的破碎粒子效果
    // 年份越新：粒子更大、更亮、飞行更快；年份越旧：更暗、更小、速度更慢
    const createShatterEffect = (policy, event) => {
      // 计算点击中心坐标: 优先使用原始事件的 clientX/clientY, 其次使用 target bounding rect
      let centerX, centerY
      if (event && typeof event.clientX === 'number') {
        centerX = event.clientX
        centerY = event.clientY
      } else if (event && event.target) {
        const rect = event.target.getBoundingClientRect()
        centerX = rect.left + rect.width / 2
        centerY = rect.top + rect.height / 2
      } else {
        // 最后兜底: 使用窗口中心
        centerX = window.innerWidth / 2
        centerY = window.innerHeight / 2
      }

      // 计算政策“年纪”
      const nowYear = new Date().getFullYear()
      const issueYear = (() => {
        if (!policy || !policy.issue_date) return nowYear
        const y = parseInt(String(policy.issue_date).substring(0, 4))
        return isNaN(y) ? nowYear : y
      })()
      const age = Math.max(0, Math.min(15, nowYear - issueYear)) // 限制在0-15
      const freshness = 1 - age / 15 // 新鲜度(0旧-1新)

      const particleCount = 18

      // 创建扩散环（随年纪淡化）
      const ring = document.createElement('div')
      ring.className = 'shatter-ring'
      ring.style.left = `${centerX}px`
      ring.style.top = `${centerY}px`
      ring.style.setProperty('--ring-scale', (0.8 + freshness * 0.7).toFixed(2))
      ring.style.setProperty('--ring-opacity', (0.35 + freshness * 0.4).toFixed(2))
      document.body.appendChild(ring)
      setTimeout(() => ring.remove(), 650)

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div')
        particle.className = 'shatter-particle'
        particle.style.left = `${centerX}px`
        particle.style.top = `${centerY}px`

        // 角度与随机扰动
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() * 0.25)
        // 根据新鲜度调节速度范围（新政策更快）
        const baseVelocity = 90 + freshness * 90 // 90 - 180
        const velocity = baseVelocity + Math.random() * 40
        const tx = Math.cos(angle) * velocity
        const ty = Math.sin(angle) * velocity

        // 粒子大小（6 - 12px）
        const size = 6 + freshness * 6 + Math.random() * 2
        // 色相：从 210(新-亮蓝) → 260(旧-偏紫)
        const hue = 210 + age * 3
        // 动画时长（旧政策更慢）
        const duration = 0.55 + (1 - freshness) * 0.35 // 0.55 - 0.9s

        particle.style.setProperty('--tx', `${tx}px`)
        particle.style.setProperty('--ty', `${ty}px`)
        particle.style.setProperty('--size', `${size}px`)
        particle.style.setProperty('--hue', hue)
        particle.style.setProperty('--duration', `${duration}s`)
        particle.style.setProperty('--particle-opacity', (0.9 - age * 0.02).toFixed(2))

        document.body.appendChild(particle)
        setTimeout(() => particle.remove(), duration * 1000)
      }
    }

    // 气泡点击事件(添加破碎动画)
    const handleBubbleClick = (policy, event) => {
      // 粒子破碎动效
      createShatterEffect(policy, event)
      // 打开详情
      if (policy && policy.policy_id) {
        selectedPolicyId.value = policy.policy_id
        drawerVisible.value = true
      }
    }

    // 抽屉关闭事件
    const handleDrawerClose = () => {
      selectedPolicyId.value = null
    }

    // 初始化加载
    onMounted(() => {
      refreshData()
    })

    return {
      loading,
      policies,
      stats,
      policyTypes,
      publishYears,
      cities,
      filters,
      drawerVisible,
      selectedPolicyId,
      totalInterviews,
      refreshData,
      handleFilterChange,
      handleResetFilters,
      handleBubbleClick,
      handleDrawerClose
    }
  }
}
</script>

<style scoped>
.patterns-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
}

.page-header {
  background: #fff;
  border-radius: 8px;
  padding: 16px 24px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.filter-card {
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.bubbles-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
}

/* 响应式布局 - 手机 */
@media (max-width: 768px) {
  .patterns-page {
    padding: 8px;
  }
  
  .page-header {
    padding: 12px 16px;
    margin-bottom: 12px;
  }
  
  .page-header h1 {
    font-size: 18px;
  }
  
  .page-header p {
    font-size: 13px;
    margin-bottom: 0;
  }
  
  .filter-card {
    margin-bottom: 12px;
  }
  
  /* 筛选表单优化 */
  :deep(.ant-form-inline) {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  :deep(.ant-form-inline .ant-form-item) {
    width: 100%;
    margin-right: 0 !important;
    margin-bottom: 0;
  }
  
  :deep(.ant-form-inline .ant-select),
  :deep(.ant-form-inline .ant-input),
  :deep(.ant-form-inline .ant-btn) {
    width: 100%;
  }
  
  :deep(.ant-select-selector),
  :deep(.ant-input),
  :deep(.ant-btn) {
    height: 44px !important;
    font-size: 15px;
  }
  
  /* 气泡卡片优化 */
  .bubbles-card {
    border-radius: 6px;
  }
  
  /* 气泡容器调整 */
  :deep(.bubble-container) {
    height: 400px !important;
    padding: 8px;
  }
  
  /* 气泡大小调整 */
  :deep(.policy-bubble) {
    font-size: 11px !important;
    min-width: 60px !important;
    min-height: 60px !important;
  }
}

/* 超小屏幕 */
@media (max-width: 480px) {
  .patterns-page {
    padding: 6px;
  }
  
  :deep(.ant-select-selector),
  :deep(.ant-input),
  :deep(.ant-btn) {
    height: 40px !important;
    font-size: 14px;
  }
  
  :deep(.bubble-container) {
    height: 350px !important;
  }
}

/* 平板横屏 */
@media (min-width: 769px) and (max-width: 1024px) {
  .patterns-page {
    padding: 16px;
  }
}
</style>

<style>
/* 全局样式：破碎粒子动画 */
.shatter-particle {
  position: fixed;
  width: var(--size, 8px);
  height: var(--size, 8px);
  background: radial-gradient(circle, hsla(var(--hue,210),70%,65%,1), hsla(var(--hue,210),70%,40%,1));
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  animation: shatter var(--duration,0.8s) ease-out forwards;
  box-shadow: 0 0 6px hsla(var(--hue,210),70%,50%,0.85);
  opacity: var(--particle-opacity,0.85);
}

@keyframes shatter {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    transform: translate(var(--tx), var(--ty)) scale(0);
    opacity: 0;
  }
}

/* 扩散环 */
.shatter-ring {
  position: fixed;
  left: 0;
  top: 0;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(24,144,255,var(--ring-opacity,0.5));
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0.3);
  pointer-events: none;
  z-index: 9998;
  animation: ring-expand 0.65s ease-out forwards;
}

@keyframes ring-expand {
  0% {
    transform: translate(-50%, -50%) scale(0.3);
    opacity: var(--ring-opacity,0.5);
  }
  70% {
    opacity: var(--ring-opacity,0.35);
  }
  100% {
    transform: translate(-50%, -50%) scale(var(--ring-scale,1.2));
    opacity: 0;
  }
}
</style>
