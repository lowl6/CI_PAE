<template>
  <a-modal
    :open="visible"
    title="政策详情"
    :width="1200"
    :closable="true"
    :footer="null"
    centered
    :bodyStyle="{ maxHeight: '80vh', overflowY: 'auto', padding: '24px' }"
    :wrapClassName="'policy-detail-modal-wrap'"
    :transitionName="'zoom-fade'"
    @update:open="(val) => $emit('update:visible', val)"
    @cancel="handleClose"
  >
    <template v-if="loading">
      <div class="loading-container">
        <a-spin size="large" />
      </div>
    </template>

    <template v-else-if="policyDetail">
      <a-tabs v-model:activeKey="activeTab" type="card">
        <!-- 概览标签页 -->
        <a-tab-pane key="overview" tab="概览">
          <div class="policy-overview">
            <a-descriptions :column="1" bordered size="small">
              <a-descriptions-item label="政策名称">
                {{ policyDetail.policy.policy_name }}
              </a-descriptions-item>
              <a-descriptions-item label="政策类型">
                <a-tag :color="getPolicyTypeColor(policyDetail.policy.policy_type)">
                  {{ policyDetail.policy.policy_type }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="发布部门">
                {{ policyDetail.policy.department || '未指定' }}
              </a-descriptions-item>
              <a-descriptions-item label="发布日期">
                {{ policyDetail.policy.issue_date }}
              </a-descriptions-item>
              <a-descriptions-item label="实施日期">
                {{ policyDetail.policy.implementation_date || '未指定' }}
              </a-descriptions-item>
              <a-descriptions-item label="状态">
                <a-tag :color="policyDetail.policy.status === '有效' ? 'green' : 'default'">
                  {{ policyDetail.policy.status || '未知' }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="覆盖范围">
                {{ policyDetail.policy.county_count || 0 }}个县
              </a-descriptions-item>
              <a-descriptions-item label="相关访谈">
                {{ policyDetail.policy.interview_count || 0 }}条
              </a-descriptions-item>
              <a-descriptions-item label="资源投入">
                {{ policyDetail.policy.resource_count || 0 }}个指标
              </a-descriptions-item>
            </a-descriptions>

            <a-divider>政策摘要</a-divider>
            <p class="policy-description">
              {{ policyDetail.policy.summary || '暂无摘要信息' }}
            </p>
          </div>
        </a-tab-pane>

        <!-- 覆盖县标签页 -->
        <a-tab-pane key="counties" :tab="`覆盖县 (${policyDetail.counties.length})`">
          <a-list
            :data-source="policyDetail.counties"
            :pagination="{ pageSize: 10 }"
            size="small"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #title>
                    {{ item.county_name }}
                  </template>
                  <template #description>
                    <span v-if="item.adopt_year">采纳年份: {{ item.adopt_year }}</span>
                    <span v-if="item.notes" style="margin-left: 12px;">{{ item.notes }}</span>
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </a-tab-pane>

        <!-- 资源投入标签页 -->
        <a-tab-pane key="resources" :tab="`资源投入 (${policyDetail.resources?.length || 0})`">
          <a-empty v-if="!policyDetail.resources || policyDetail.resources.length === 0" description="暂无资源投入数据" />
          <a-list
            v-else
            :data-source="policyDetail.resources"
            :pagination="{ pageSize: 8 }"
            size="small"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #title>
                    {{ item.indicator_name }}
                    <a-tag v-if="item.impact_level" :color="getImpactLevelColor(item.impact_level)" style="margin-left: 8px;">
                      影响程度: {{ item.impact_level }}
                    </a-tag>
                  </template>
                  <template #description>
                    <div style="margin-bottom: 8px;">
                      <span v-if="item.category" style="font-weight: 500;">类别: {{ item.category }}</span>
                      <a-divider v-if="item.category && item.unit" type="vertical" />
                      <span v-if="item.unit">单位: {{ item.unit }}</span>
                      <a-divider v-if="item.related_field" type="vertical" />
                      <span v-if="item.related_field">领域: {{ item.related_field }}</span>
                    </div>
                    
                    <!-- 投入金额/数量 -->
                    <div v-if="item.amount != null" style="margin-bottom: 8px;">
                      <a-tag color="green" style="margin-right: 8px;">
                        <template #icon>💰</template>
                        投入金额: {{ formatAmount(item.amount) }} {{ item.unit || '元' }}
                      </a-tag>
                      <a-tag v-if="item.beneficiary_count" color="blue">
                        <template #icon>👥</template>
                        受益人数: {{ item.beneficiary_count }} 人
                      </a-tag>
                    </div>
                    
                    <!-- 投入年份 -->
                    <div v-if="item.year" style="margin-bottom: 8px;">
                      <span style="color: #8c8c8c;">投入年份: {{ item.year }}</span>
                    </div>
                    
                    <!-- 描述信息 -->
                    <div v-if="item.description" style="margin-top: 8px; padding: 8px; background: #fafafa; border-radius: 4px; color: #595959; line-height: 1.6;">
                      {{ item.description }}
                    </div>
                    
                    <!-- 数据来源 -->
                    <div v-if="item.source" style="margin-top: 8px; font-size: 12px; color: #bfbfbf;">
                      📊 数据来源: {{ item.source }}
                    </div>
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </a-tab-pane>

        <!-- 相关访谈标签页 -->
        <a-tab-pane key="interviews" :tab="`相关访谈 (${policyDetail.interviews.length})`">
          <a-list
            :data-source="policyDetail.interviews"
            :pagination="{ pageSize: 5 }"
            size="small"
          >
            <template #renderItem="{ item }">
              <InterviewCard 
                :interview="item" 
                @view-full="handleViewFullInterview"
              />
            </template>
          </a-list>
        </a-tab-pane>

        <!-- 指标影响标签页 -->
        <a-tab-pane 
          key="effects" 
          :tab="`指标影响 (${policyDetail.indicator_effects?.length || 0})`"
        >
          <IndicatorEffectChart 
            v-if="policyDetail.indicator_effects && policyDetail.indicator_effects.length > 0"
            :effects="policyDetail.indicator_effects"
          />
          <a-empty v-else description="暂无指标影响数据" />
        </a-tab-pane>
      </a-tabs>
    </template>
  </a-modal>

  <!-- 完整访谈内容弹窗 -->
  <a-modal
    v-model:open="interviewModalVisible"
    :title="currentInterview?.topic || '访谈详情'"
    width="800px"
    :footer="null"
  >
    <div v-if="loadingInterview" class="loading-container">
      <a-spin />
    </div>
    <div v-else-if="currentInterview" class="interview-full-content">
      <a-descriptions :column="2" bordered size="small">
        <a-descriptions-item label="访谈主题" :span="2">{{ currentInterview.topic || '未指定' }}</a-descriptions-item>
        <a-descriptions-item label="访谈地点">{{ currentInterview.location || '未指定' }}</a-descriptions-item>
        <a-descriptions-item label="访谈日期">{{ currentInterview.interview_date }}</a-descriptions-item>
        <a-descriptions-item label="调研员" :span="2">{{ currentInterview.researcher_name }}</a-descriptions-item>
      </a-descriptions>
      
      <a-divider>受访者名单 ({{ currentInterview.interviewees?.length || 0 }}人)</a-divider>
      <a-list
        :data-source="currentInterview.interviewees || []"
        size="small"
        bordered
      >
        <template #renderItem="{ item }">
          <a-list-item>
            <a-list-item-meta>
              <template #title>
                <span style="font-weight: 600;">{{ item.interviewee_name }}</span>
                <a-tag size="small" :color="getIdentityColor(item.identity)" style="margin-left: 8px;">
                  {{ item.identity }}
                </a-tag>
              </template>
              <template #description>
                <span v-if="item.unit">{{ item.unit }}</span>
                <a-divider v-if="item.unit && item.county_name" type="vertical" />
                <span v-if="item.county_name">{{ item.county_name }}</span>
                <span v-if="item.city">·{{ item.city }}</span>
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>
      
      <a-divider>脱贫经验总结</a-divider>
      <div v-if="currentInterview.experience_summary" class="interview-summary">
        {{ currentInterview.experience_summary }}
      </div>
      <a-empty v-else description="暂无经验总结" :image="null" style="padding: 12px;" />
      
      <a-divider>访谈内容</a-divider>
      <div class="interview-content">{{ currentInterview.content }}</div>
      
      <a-divider>关键词</a-divider>
      <div v-if="currentInterview.keywords" class="interview-keywords">
        <a-tag v-for="keyword in parseKeywords(currentInterview.keywords)" :key="keyword" color="blue">
          {{ keyword }}
        </a-tag>
      </div>
      <a-empty v-else description="暂无关键词" :image="null" style="padding: 12px;" />
    </div>
  </a-modal>
</template>

<style>
/* 模态框弹出动画 - 优化性能 */
.policy-detail-modal-wrap .ant-modal {
  animation: modalZoomIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes modalZoomIn {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 遮罩层渐入效果 */
.policy-detail-modal-wrap .ant-modal-mask {
  animation: fadeIn 0.25s ease-out;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>

<script>
import { ref, computed, watch } from 'vue'
import { getPolicyDetail, getInterviewFullContent } from '@/api/policy'
import InterviewCard from './InterviewCard.vue'
import IndicatorEffectChart from './IndicatorEffectChart.vue'

export default {
  name: 'PolicyDetailDrawer',
  components: {
    InterviewCard,
    IndicatorEffectChart
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    policyId: {
      type: String,
      default: null
    }
  },
  emits: ['update:visible', 'close'],
  setup(props, { emit }) {
    const loading = ref(false)
    const policyDetail = ref(null)
    const activeTab = ref('overview')

    // 完整访谈内容弹窗
    const interviewModalVisible = ref(false)
    const loadingInterview = ref(false)
    const currentInterview = ref(null)

    // 获取政策详情
    const fetchPolicyDetail = async () => {
      if (!props.policyId) return
      loading.value = true
      try {
        const res = await getPolicyDetail(props.policyId)
        if (res.ok) {
          policyDetail.value = res.data
        } else {
          console.error('获取政策详情失败:', res.error)
        }
      } catch (error) {
        console.error('获取政策详情异常:', error)
      } finally {
        loading.value = false
      }
    }

    // 监听policyId变化自动加载
    const visibleComputed = computed({
      get: () => props.visible,
      set: (val) => emit('update:visible', val)
    })

    const handleClose = () => {
      emit('close')
      emit('update:visible', false)
      policyDetail.value = null
      activeTab.value = 'overview'
    }

    // 政策类型颜色映射
    const getPolicyTypeColor = (type) => {
      const colors = {
        agriculture: 'green',
        medical: 'blue',
        education: 'purple',
        poverty_alleviation: 'orange',
        infrastructure: 'cyan',
        other: 'default'
      }
      return colors[type] || 'default'
    }

    // 影响程度颜色映射
    const getImpactLevelColor = (level) => {
      const colors = {
        '高': 'red',
        '中': 'orange', 
        '低': 'blue',
        '重大': 'red',
        '一般': 'default'
      }
      return colors[level] || 'default'
    }

    // 查看完整访谈内容
    const handleViewFullInterview = async (dataId) => {
      loadingInterview.value = true
      interviewModalVisible.value = true
      try {
        const res = await getInterviewFullContent(dataId)
        if (res.ok) {
          currentInterview.value = res.data
        } else {
          console.error('获取访谈内容失败:', res.error)
        }
      } catch (error) {
        console.error('获取访谈内容异常:', error)
      } finally {
        loadingInterview.value = false
      }
    }

    // 解析逗号分隔的关键词/事件
    const parseKeywords = (str) => {
      if (!str) return []
      return str.split(',').map(s => s.trim()).filter(Boolean)
    }
    
    // 根据身份获取颜色
    const getIdentityColor = (identity) => {
      const colors = {
        '村干部': '#1890ff',
        '村民': '#52c41a',
        '乡镇干部': '#722ed1',
        '驻村干部': '#fa8c16',
        '企业家': '#13c2c2',
        '教师': '#eb2f96'
      }
      return colors[identity] || '#8c8c8c'
    }
    
    // 格式化金额显示
    const formatAmount = (amount) => {
      if (amount == null) return '-'
      const num = parseFloat(amount)
      if (num >= 10000) {
        return (num / 10000).toFixed(2) + '万'
      }
      return num.toLocaleString()
    }

    // 使用watch监听props变化自动加载数据
    watch(
      () => [props.visible, props.policyId],
      ([newVisible, newPolicyId]) => {
        if (newVisible && newPolicyId) {
          fetchPolicyDetail()
        }
      },
      { immediate: true }
    )

    return {
      loading,
      policyDetail,
      activeTab,
      interviewModalVisible,
      loadingInterview,
      currentInterview,
      handleClose,
      getPolicyTypeColor,
      getImpactLevelColor,
      handleViewFullInterview,
      parseKeywords,
      getIdentityColor,
      formatAmount
    }
  }
}
</script>

<style scoped>
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.policy-overview {
  padding: 0;
}

.policy-description {
  line-height: 1.8;
  color: #595959;
  text-align: justify;
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
}

.interview-full-content {
  max-height: 70vh;
  overflow-y: auto;
}

.interview-summary {
  line-height: 1.8;
  color: #262626;
  text-align: justify;
  padding: 16px;
  background: #fff7e6;
  border-left: 4px solid #fa8c16;
  border-radius: 4px;
  font-size: 14px;
}

.interview-content {
  line-height: 2;
  color: #262626;
  text-align: justify;
  white-space: pre-wrap;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 4px;
  max-height: 400px;
  overflow-y: auto;
}

.interview-keywords,
.interview-events {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
