<template>
  <a-list-item class="interview-card">
    <a-list-item-meta>
      <template #avatar>
        <a-avatar :style="{ backgroundColor: getIdentityColor(interview.identity) }">
          {{ getIdentityIcon(interview.identity) }}
        </a-avatar>
      </template>
      <template #title>
        <span class="interviewee-name">{{ interview.interviewee_name }}</span>
        <a-tag size="small" :color="getIdentityColor(interview.identity)" style="margin-left: 8px;">
          {{ interview.identity }}
        </a-tag>
      </template>
      <template #description>
        <div class="interview-meta">
          <span>📍 {{ interview.county_name }}</span>
          <a-divider type="vertical" />
          <span>📅 {{ interview.event_date }}</span>
        </div>
        <div class="interview-keywords">
          <span v-if="interview.matched_keywords" style="color: #8c8c8c; font-size: 12px; margin-right: 8px;">匹配关键词:</span>
          <a-tag 
            v-for="keyword in parseKeywords(interview.matched_keywords || interview.keywords)" 
            :key="keyword" 
            size="small"
            color="blue"
          >
            {{ keyword }}
          </a-tag>
        </div>
        <div class="interview-snippet">
          {{ interview.content_snippet || interview.experience_summary || '暂无内容摘要' }}
        </div>
      </template>
    </a-list-item-meta>
    <template #actions>
      <a-button type="link" size="small" @click="handleViewFull">
        查看完整内容
      </a-button>
    </template>
  </a-list-item>
</template>

<script>
export default {
  name: 'InterviewCard',
  props: {
    interview: {
      type: Object,
      required: true
      // 包含: data_id, interviewee_name, identity, interview_date, 
      // relevance_score, content, keywords
    }
  },
  emits: ['view-full'],
  setup(props, { emit }) {
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

    // 根据身份获取图标
    const getIdentityIcon = (identity) => {
      const icons = {
        '村干部': '干',
        '村民': '民',
        '乡镇干部': '镇',
        '驻村干部': '驻',
        '企业家': '企',
        '教师': '师'
      }
      return icons[identity] || identity.charAt(0)
    }

    // 解析关键词
    const parseKeywords = (keywords) => {
      if (!keywords) return []
      return keywords.split(',').map(k => k.trim()).filter(Boolean)
    }

    // 获取内容摘要(前120字)
    const getContentSnippet = (content) => {
      if (!content) return ''
      const maxLen = 120
      return content.length > maxLen ? content.slice(0, maxLen) + '...' : content
    }

    // 查看完整内容
    const handleViewFull = () => {
      emit('view-full', props.interview.data_id)
    }

    return {
      getIdentityColor,
      getIdentityIcon,
      parseKeywords,
      getContentSnippet,
      handleViewFull
    }
  }
}
</script>

<style scoped>
.interview-card {
  margin-bottom: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.interview-card:hover {
  background: #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.interviewee-name {
  font-weight: 600;
  font-size: 14px;
  color: #262626;
}

.interview-meta {
  margin-bottom: 8px;
  color: #8c8c8c;
  font-size: 12px;
}

.interview-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.interview-snippet {
  margin-top: 8px;
  line-height: 1.6;
  color: #595959;
  font-size: 13px;
  text-align: justify;
}
</style>
