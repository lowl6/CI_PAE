<template>
  <div class="compare-page">
    <!-- 筛选器面板 -->
    <a-card class="filter-panel" size="small" style="margin-bottom: 20px;">
      <a-row :gutter="16">
        <!-- 地区筛选 -->
        <a-col :span="8">
          <a-form-item label="县区对比（请选择两个县区）">
            <a-select 
              mode="multiple" 
              v-model:value="selectedRegions" 
              placeholder="请选择两个县区进行对比" 
              @change="onRegionChange"
              :max-tag-count="2"
            >
              <a-select-option 
                v-for="region in regions" 
                :key="region.id" 
                :value="region.id"
              >
                {{ region.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        
        <!-- 时间筛选 -->
        <a-col :span="8">
          <a-form-item label="时间范围">
            <a-range-picker v-model:value="dateRange" @change="onDateChange" />
          </a-form-item>
        </a-col>
        
        <!-- 政策类型筛选 -->
        <a-col :span="8">
          <a-form-item label="政策类型（可选）">
            <a-select 
              v-model:value="selectedPolicyType" 
              placeholder="选择政策类型以查看相关指标"
              @change="onPolicyTypeChange"
              allow-clear
            >
              <a-select-option value="经济发展">经济发展</a-select-option>
              <a-select-option value="农业扶贫">农业扶贫</a-select-option>
              <a-select-option value="社会保障与就业">社会保障与就业</a-select-option>
              <a-select-option value="基础设施建设">基础设施建设</a-select-option>
              <a-select-option value="教育文化">教育文化</a-select-option>
              <a-select-option value="工业招商">工业招商</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
      
      <!-- 数据概览 -->
      <a-row :gutter="16" style="margin-top: 20px;">
        <a-col :span="6">
          <a-statistic title="选择地区数" :value="selectedRegions.length" />
        </a-col>
        <a-col :span="6">
          <a-statistic title="时间范围" :value="getDateRangeText()" />
        </a-col>
        <a-col :span="6">
          <a-statistic title="政策类型" :value="selectedPolicyType || '全部'" />
        </a-col>
        <a-col :span="6">
          <a-statistic title="数据点数" :value="policyEffectData.length" />
        </a-col>
      </a-row>
    </a-card>
    
    <div class="results">
      <a-card title="对比分析结果" size="small">
        <!-- 图表区域 -->
        <a-tabs v-model:activeKey="activeTab">
          <a-tab-pane key="2" tab="政策效果对比">
            <!-- 
              ⬇⬇ ⬇⬇ ⬇⬇ 
              新增：添加一个动态副标题来显示所选政策
              ⬇⬇ ⬇⬇ ⬇⬇ 
            -->
            <h5 style="text-align: center; color: #666; font-weight: normal; margin-top: -8px; margin-bottom: 12px;">
              {{ chartSubtitle }}
            </h5>
            <!-- ⬆⬆ ⬆⬆ ⬆⬆ 结束新增 ⬆⬆ ⬆⬆ ⬆⬆ -->

            <policy-effect-chart :data="policyEffectData" :regions="selectedRegions.map(id => regions.find(r => r.id === id) || { id, name: id })" />
          </a-tab-pane>
          
          <!-- 新增：政策相关领域指标对比 -->
          <a-tab-pane key="3" tab="相关领域指标" :disabled="relatedIndicators.length === 0">
            <a-empty v-if="relatedIndicators.length === 0" description="请选择政策类型以查看相关指标" />
            <div v-else class="indicators-grid">
              <div 
                v-for="(indicator, index) in relatedIndicators" 
                :key="index"
                class="indicator-chart-card"
              >
                <h4 class="indicator-title">{{ indicator.name }} ({{ indicator.unit }})</h4>
                <related-indicator-chart 
                  :data="indicator.data" 
                  :indicator-name="indicator.name"
                  :regions="selectedRegions.map(id => regions.find(r => r.id === id) || { id, name: id })" 
                />
              </div>
            </div>
          </a-tab-pane>
        </a-tabs>
        
        <!-- 表格对比 -->
        <a-table 
          :data-source="comparisonTableData" 
          :columns="tableColumns" 
          :loading="tableLoading"
          style="margin-top: 20px;"
          :scroll="{ x: true }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'gdpGrowth'">
              <span :style="{ color: getGrowthColor(record.gdpGrowth) }">{{ record.gdpGrowth }}</span>
            </template>
            <template v-else-if="column.dataIndex === 'povertyReduction'">
              <span :style="{ color: getPovertyReductionColor(record.povertyReduction) }">{{ record.povertyReduction }}</span>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue' // <--- 1. 导入 computed
import api from '@/api'
import PolicyEffectChart from '@/components/Charts/PolicyEffectChart.vue'
import RelatedIndicatorChart from '@/components/Charts/RelatedIndicatorChart.vue'

export default {
  name: 'Compare',
  components: {
    PolicyEffectChart,
    RelatedIndicatorChart
  },
  setup() {
    // 数据源
    const regions = ref([])
    const policyTypes = ref([])
    const policyTypesLoading = ref(false) // <--- 新增：政策类型加载状态
    const selectedRegions = ref([])
    const dateRange = ref([])
    const selectedPolicyType = ref('') // 改为单选
    const activeTab = ref('2') // 新增：当前激活的Tab
    
    // 图表数据
    const gdpData = ref([])
    const policyEffectData = ref([])
    const relatedIndicators = ref([]) // 新增：政策相关领域指标数据
    const comparisonTableData = ref([])
    const tableColumns = ref([])
    const tableLoading = ref(false)

    // <--- 2. 新增:创建 chartSubtitle 计算属性
    const chartSubtitle = computed(() => {
      if (!selectedPolicyType.value) {
        return '(全部政策类型)';
      }
      return `(${selectedPolicyType.value})`;
    });
    
    // 获取时间范围文本
    const getDateRangeText = () => {
      if (!dateRange.value || dateRange.value.length === 0) {
        return '未选择';
      }
      const start = dateRange.value[0] ? dateRange.value[0].format('YYYY') : 'N/A';
      const end = dateRange.value[1] ? dateRange.value[1].format('YYYY') : 'N/A';
      return `${start}-${end}`;
    };
    

    
    // 根据增长率设置颜色
    const getGrowthColor = (growth) => {
      if (growth === 'N/A') return '#999';
      const value = parseFloat(growth);
      if (isNaN(value)) return '#999';
      return value > 0 ? '#52c41a' : value < 0 ? '#ff4d4f' : '#1890ff';
    };
    
    // 根据政策效果指数设置颜色（0-100分值）
    const getPovertyReductionColor = (index) => {
      if (index === 'N/A') return '#999';
      const value = parseFloat(index);
      if (isNaN(value)) return '#999';
      
      // 分级着色：
      // 80-100: 深绿（优秀）
      // 60-80:  浅绿（良好）
      // 40-60:  蓝色（中等）
      // 20-40:  橙色（较差）
      // 0-20:   红色（差）
      if (value >= 80) return '#52c41a';      // 深绿
      if (value >= 60) return '#73d13d';      // 浅绿
      if (value >= 40) return '#1890ff';      // 蓝色
      if (value >= 20) return '#fa8c16';      // 橙色
      return '#ff4d4f';                        // 红色
    };
    
    // 加载页面初始化数据（仅县区）
    const loadData = async () => {
      try {
        // 加载县区数据
        const countiesResp = await api.analysis.getAllCounties();
        console.log('API返回的县区数据:', countiesResp);
        
        const countiesData = countiesResp.data || countiesResp;
        if (countiesData && Array.isArray(countiesData)) {
          regions.value = countiesData.map(county => ({
            id: county.county_id,
            name: county.county_name
          }));
        } else {
          console.error('县区数据格式不正确:', countiesData);
          regions.value = [];
        }
      } catch (error) {
        console.error('加载县区数据失败:', error);
        regions.value = [];
      }
      
      // ❗️ 修改：不再此处加载政策类型
      policyTypes.value = [];
    }
    


    // 加载图表和表格数据
    const loadChartData = async () => {
      tableLoading.value = true
      try {
        // 如果没有选择地区，不加载数据并清空
        if (selectedRegions.value.length === 0) {
          gdpData.value = []
          policyEffectData.value = []
          comparisonTableData.value = []
          tableColumns.value = []
          tableLoading.value = false
          return
        }
        
        // 调用后端实际的对比分析API
        const params = {
          regions: selectedRegions.value,
          startDate: dateRange.value && dateRange.value[0] ? dateRange.value[0].format('YYYY-MM-DD') : '2015-01-01',
          endDate: dateRange.value && dateRange.value[1] ? dateRange.value[1].format('YYYY-MM-DD') : '2023-12-31',
          policyTypes: selectedPolicyType.value ? [selectedPolicyType.value] : []
        };
        
        console.log('请求参数:', params);
        
        // ❗️ 修复：确保 API 名称与 api/index.js 中定义的一致
        const response = await api.compare.getComparisonData(params); 
        console.log('API返回数据:', response);
        
        // 处理响应数据
        const responseData = response.data || response;
        if (responseData && responseData.ok) {
          const data = responseData.data || {};
          gdpData.value = data.gdpTrend || [];
          policyEffectData.value = data.policyEffect || [];
          relatedIndicators.value = data.relatedIndicators || []; // 新增：接收相关指标数据
          
          // ========================================
          // 表格数据计算 - 政策效果指标详细逻辑
          // ========================================
          const tableData = []
          selectedRegions.value.forEach((regionId, index) => {
            const region = regions.value.find(r => r.id === regionId)
            const regionName = region ? region.name : regionId
            
            // 初始化指标
            let gdpGrowth = 'N/A'
            let policyEffectIndex = 'N/A'
            
            // ----------------------------------------
            // 1. GDP 增长率计算
            // ----------------------------------------
            // 计算逻辑：使用首尾年份的 GDP 数据计算增长率
            // 公式：((末期GDP - 初期GDP) / 初期GDP) × 100%
            // 目的：反映该地区在时间段内的经济增长情况
            // ----------------------------------------
            const gdpTrendData = data.gdpTrend || [];
            if (gdpTrendData && gdpTrendData.length > 1) {
              // 获取时间序列的首尾数据点
              const firstYearData = gdpTrendData[0]
              const lastYearData = gdpTrendData[gdpTrendData.length - 1]
              
              // 提取当前地区的 GDP 值（region1, region2 对应两个县区）
              const firstYearGDP = parseFloat(firstYearData[`region${index + 1}`])
              const lastYearGDP = parseFloat(lastYearData[`region${index + 1}`])
              
              // 验证数据有效性：非空、非零、数字格式
              if (!isNaN(firstYearGDP) && !isNaN(lastYearGDP) && firstYearGDP !== 0) {
                // 增长率 = (变化量 / 基期值) × 100
                const growthRate = ((lastYearGDP - firstYearGDP) / Math.abs(firstYearGDP) * 100).toFixed(2)
                gdpGrowth = `${growthRate}%`
              }
            }
            
            // ----------------------------------------
            // 2. 政策效果指数计算（改进版）
            // ----------------------------------------
            // 计算逻辑：基于政策关联强度(strength)计算综合效果指数
            // 
            // 数据来源：后端返回的 policyEffect 包含每年每个县区的平均 strength 值
            //          strength 范围：0-1 (rel_policy_county 表中的关联强度)
            // 
            // 步骤：
            //   a) 提取该地区所有年份的 strength 值
            //   b) 过滤无效数据（null、NaN、0）
            //   c) 计算时间序列的趋势变化（后期 vs 前期）
            //   d) 综合平均值和增长趋势得出最终指数
            //   e) 映射到 0-100 分值便于理解
            // 
            // 目的：量化政策实施对该地区的综合影响力和改善趋势
            // ----------------------------------------
            const policyEffectData = data.policyEffect || [];
            if (policyEffectData && policyEffectData.length > 0) {
              // 提取该地区在所有年份的 strength 效果值（0-1范围）
              const regionEffects = policyEffectData
                .map(item => {
                  const value = parseFloat(item[`region${index + 1}`] || 0)
                  return isNaN(value) ? null : value
                })
                .filter(v => v !== null && v !== 0) // 过滤掉无效值
              
              if (regionEffects.length > 0) {
                // 计算平均政策关联强度（0-1范围）
                const totalEffect = regionEffects.reduce((sum, value) => sum + value, 0)
                const avgStrength = totalEffect / regionEffects.length
                
                // 计算趋势变化：比较前半段和后半段的平均值
                const midPoint = Math.floor(regionEffects.length / 2)
                const firstHalf = regionEffects.slice(0, midPoint)
                const secondHalf = regionEffects.slice(midPoint)
                
                const avgFirstHalf = firstHalf.length > 0 ? 
                  firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length : 0
                const avgSecondHalf = secondHalf.length > 0 ? 
                  secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length : 0
                
                // 计算改善率（后期相对前期的变化百分比）
                const improvementRate = avgFirstHalf > 0 ? 
                  ((avgSecondHalf - avgFirstHalf) / avgFirstHalf) * 100 : 0
                
                // 归一化处理：将 strength (0-1) 映射到 0-100 基础分
                const baseScore = avgStrength * 100
                
                // 趋势加成：正增长加分，负增长减分（最多±20分）
                const trendBonus = Math.max(-20, Math.min(20, improvementRate))
                
                // 数据完整度加成：数据点越多越可信（最多+10分）
                const dataCompletenessBonus = Math.min(10, regionEffects.length * 2)
                
                // 最终指数 = 基础分 + 趋势加成 + 完整度加成
                // 确保在 0-100 范围内
                const finalIndex = Math.max(0, Math.min(100, 
                  baseScore + trendBonus + dataCompletenessBonus
                )).toFixed(2)
                
                policyEffectIndex = finalIndex
                
                // 调试日志：帮助理解计算过程
                console.log(`${regionName} 政策效果计算:`, {
                  平均强度: avgStrength.toFixed(3),
                  前半段平均: avgFirstHalf.toFixed(3),
                  后半段平均: avgSecondHalf.toFixed(3),
                  改善率: improvementRate.toFixed(2) + '%',
                  基础分: baseScore.toFixed(2),
                  趋势加成: trendBonus.toFixed(2),
                  完整度加成: dataCompletenessBonus.toFixed(2),
                  最终指数: finalIndex
                })
              }
            }
            
            // 构建表格行数据
            tableData.push({
              key: index.toString(),
              region: regionName,
              gdpGrowth: gdpGrowth,
              povertyReduction: policyEffectIndex // 重命名为更准确的 policyEffectIndex
            })
          })
          
          comparisonTableData.value = tableData
          
          // ----------------------------------------
          // 3. 表格列定义 - 添加详细说明
          // ----------------------------------------
          if (tableData.length > 0) {
            tableColumns.value = [
              { 
                title: '地区', 
                dataIndex: 'region', 
                key: 'region', 
                fixed: 'left', 
                width: 150 
              },
              { 
                title: 'GDP增长率 (%)', 
                dataIndex: 'gdpGrowth', 
                key: 'gdpGrowth',
                align: 'center',
                // 说明：基于首尾年份GDP计算的增长百分比
              },
              { 
                title: '政策效果指数 (0-100)', 
                dataIndex: 'povertyReduction', 
                key: 'povertyReduction',
                align: 'center',
                // 说明：综合多种政策类型效果的加权指数
                // 数值越高表示政策实施效果越好
              }
            ]
          } else {
             tableColumns.value = [];
          }
        } else {
          console.warn('API调用失败或未返回ok:true，清空图表和表格');
          gdpData.value = [];
          policyEffectData.value = [];
          comparisonTableData.value = [];
          tableColumns.value = [];
        }
      } catch (error) {
        console.error('加载图表数据失败:', error);
        gdpData.value = [];
        policyEffectData.value = [];
        comparisonTableData.value = [];
        tableColumns.value = [];
      } finally {
        tableLoading.value = false
      }
    }
    
    // 筛选器变更事件
    const onRegionChange = (value) => {
      // 限制只能选择两个地区进行对比
      if (value.length > 2) {
        selectedRegions.value = value.slice(0, 2);
      } else {
        selectedRegions.value = value;
      }
      
      // 只有在选择了两个地区时才加载数据
      if (selectedRegions.value.length === 2) {
        loadChartData()
      } else {
        // 如果选择少于2个，清空图表
        gdpData.value = [];
        policyEffectData.value = [];
        relatedIndicators.value = [];
        comparisonTableData.value = [];
        tableColumns.value = [];
      }
    }
    
    const onDateChange = (dates) => {
      if (selectedRegions.value.length === 2) {
        loadChartData()
      }
    }
    
    const onPolicyTypeChange = (value) => {
      if (selectedRegions.value.length === 2) {
        loadChartData()
      }
      // 当选择了政策类型时,自动切换到相关领域指标Tab
      if (value) {
        activeTab.value = '3'
      } else {
        // 清空政策类型时,切回政策效果对比Tab
        activeTab.value = '2'
      }
    }
    
    onMounted(() => {
      loadData()
    })
    
    return {
      regions,
      selectedRegions,
      dateRange,
      selectedPolicyType,
      activeTab, // 新增：导出activeTab
      gdpData,
      policyEffectData,
      relatedIndicators, // 新增：导出相关指标数据
      comparisonTableData,
      tableColumns,
      tableLoading,
      onRegionChange,
      onDateChange,
      onPolicyTypeChange,
      getDateRangeText,
      getGrowthColor,
      getPovertyReductionColor,
      chartSubtitle // <--- 3. 导出 chartSubtitle
    }
  }
}
</script>

<style scoped>
.compare-page {
  padding: 20px;
}

.filter-panel {
  margin-bottom: 20px;
}

/* 新增：相关指标网格布局 */
.indicators-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 20px;
  margin-top: 16px;
}

.indicator-chart-card {
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 16px;
  background: #fafafa;
  transition: all 0.3s;
}

.indicator-chart-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.indicator-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1890ff;
  text-align: center;
}

/* 移动端响应式 */
@media (max-width: 768px) {
  .compare-page {
    padding: 12px;
  }
  
  /* 筛选面板优化 */
  .filter-panel {
    margin-bottom: 12px;
  }
  
  .filter-panel :deep(.ant-row) {
    flex-direction: column;
  }
  
  .filter-panel :deep(.ant-col) {
    width: 100% !important;
    max-width: 100% !important;
    margin-bottom: 12px;
  }
  
  .filter-panel :deep(.ant-select),
  .filter-panel :deep(.ant-input),
  .filter-panel :deep(.ant-btn) {
    width: 100%;
  }
  
  .filter-panel :deep(.ant-select-selector),
  .filter-panel :deep(.ant-input),
  .filter-panel :deep(.ant-btn) {
    height: 44px !important;
    font-size: 15px;
  }
  
  /* 指标网格改为单列 */
  .indicators-grid {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-top: 12px;
  }
  
  .indicator-chart-card {
    padding: 12px;
  }
  
  .indicator-title {
    font-size: 13px;
    margin-bottom: 8px;
  }
  
  /* 图表容器调整 */
  :deep(.chart-container) {
    height: 250px !important;
  }
  
  /* 卡片标题优化 */
  :deep(.ant-card-head-title) {
    font-size: 15px;
  }
  
  /* 统计数据优化 */
  :deep(.ant-statistic) {
    text-align: center;
  }
  
  :deep(.ant-statistic-title) {
    font-size: 12px;
  }
  
  :deep(.ant-statistic-content) {
    font-size: 18px;
  }
}

/* 超小屏幕 */
@media (max-width: 480px) {
  .compare-page {
    padding: 8px;
  }
  
  .filter-panel :deep(.ant-select-selector),
  .filter-panel :deep(.ant-input),
  .filter-panel :deep(.ant-btn) {
    height: 40px !important;
    font-size: 14px;
  }
  
  .indicators-grid {
    gap: 8px;
  }
  
  .indicator-chart-card {
    padding: 10px;
  }
  
  :deep(.chart-container) {
    height: 220px !important;
  }
}

/* 平板横屏 */
@media (min-width: 769px) and (max-width: 1024px) {
  .indicators-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>