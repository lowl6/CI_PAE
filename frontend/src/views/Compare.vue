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
          <a-form-item label="政策类型">
            <!-- 
              修改：
              1. 添加 :loading="policyTypesLoading"
              2. 添加 :disabled="policyTypesLoading || selectedRegions.length === 0"
              3. placeholder 根据状态变化
            -->
            <a-select 
              mode="multiple" 
              v-model:value="selectedPolicyTypes" 
              :placeholder="getPolicyPlaceholder()"
              @change="onPolicyTypeChange"
              :loading="policyTypesLoading"
              :disabled="policyTypesLoading || selectedRegions.length === 0"
            >
              <a-select-option v-for="type in policyTypes" :key="type.policy_type" :value="type.policy_type">
                {{ type.type_name }}
              </a-select-option>
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
          <a-statistic title="政策类型数" :value="selectedPolicyTypes.length" />
        </a-col>
        <a-col :span="6">
          <a-statistic title="数据点数" :value="policyEffectData.length" />
        </a-col>
      </a-row>
    </a-card>
    
    <div class="results">
      <a-card title="对比分析结果" size="small">
        <!-- 图表区域 -->
        <a-tabs default-active-key="2">
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

export default {
  name: 'Compare',
  components: {
    PolicyEffectChart
  },
  setup() {
    // 数据源
    const regions = ref([])
    const policyTypes = ref([])
    const policyTypesLoading = ref(false) // <--- 新增：政策类型加载状态
    const selectedRegions = ref([])
    const dateRange = ref([])
    const selectedPolicyTypes = ref([])
    
    // 图表数据
    const gdpData = ref([])
    const policyEffectData = ref([])
    const comparisonTableData = ref([])
    const tableColumns = ref([])
    const tableLoading = ref(false)

    // <--- 2. 新增：创建 chartSubtitle 计算属性
    const chartSubtitle = computed(() => {
      if (selectedPolicyTypes.value.length === 0) {
        return '(全部政策类型)';
      }
      return `(${selectedPolicyTypes.value.join(', ')})`;
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
    
    // <--- 新增：动态设置政策下拉框的占位符
    const getPolicyPlaceholder = () => {
      if (policyTypesLoading.value) {
        return '正在加载政策类型...';
      }
      if (selectedRegions.value.length === 0) {
        return '请先选择县区';
      }
      if (policyTypes.value.length === 0) {
        return '无相关政策类型';
      }
      return '请选择政策类型 (可选)';
    };
    
    // 根据增长率设置颜色
    const getGrowthColor = (growth) => {
      if (growth === 'N/A') return '#999';
      const value = parseFloat(growth);
      if (isNaN(value)) return '#999';
      return value > 0 ? '#52c41a' : value < 0 ? '#ff4d4f' : '#1890ff';
    };
    
    // 根据贫困减少率设置颜色
    const getPovertyReductionColor = (reduction) => {
      if (reduction === 'N/A') return '#999';
      const value = parseFloat(reduction);
      if (isNaN(value)) return '#999';
      return value > 0 ? '#52c41a' : value < 0 ? '#ff4d4f' : '#1890ff';
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
    
    // <--- 新增：动态加载政策类型的函数
    const loadDynamicPolicyTypes = async (regionIds) => {
      if (regionIds.length === 0) {
        policyTypes.value = []; // 清空
        return;
      }
      
      policyTypesLoading.value = true;
      try {
        const params = { regions: regionIds };
        // 调用我们新创建的API
        const policyTypesResp = await api.analysis.getDynamicPolicyTypes(params);
        
        const typesData = policyTypesResp.data || policyTypesResp;
        if (typesData && Array.isArray(typesData)) {
          policyTypes.value = typesData.map(type => ({
            policy_type: type,
            type_name: type
          }));
        } else {
          console.error('动态政策类型数据格式不正确:', typesData);
          policyTypes.value = [];
        }
      } catch (error) {
        console.error('加载动态政策类型失败:', error);
        policyTypes.value = [];
      } finally {
        policyTypesLoading.value = false;
      }
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
          policyTypes: selectedPolicyTypes.value
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
          
          // 表格数据 - 使用真实数据计算
          const tableData = []
          selectedRegions.value.forEach((regionId, index) => {
            const region = regions.value.find(r => r.id === regionId)
            const regionName = region ? region.name : regionId
            
            let gdpGrowth = 'N/A'
            let povertyReduction = 'N/A'
            
            const gdpTrendData = data.gdpTrend || [];
            if (gdpTrendData && gdpTrendData.length > 1) {
              const firstYearGDP = parseFloat(gdpTrendData[0][`region${index + 1}`])
              const lastYearGDP = parseFloat(gdpTrendData[gdpTrendData.length - 1][`region${index + 1}`])
              
              if (!isNaN(firstYearGDP) && !isNaN(lastYearGDP) && firstYearGDP !== 0) {
                const growthRate = ((lastYearGDP - firstYearGDP) / Math.abs(firstYearGDP) * 100).toFixed(2)
                gdpGrowth = `${growthRate}%`
              }
            }
            
            const policyEffectData = data.policyEffect || [];
            if (policyEffectData && policyEffectData.length > 0) {
              const regionEffects = policyEffectData.map(item => parseFloat(item[`region${index + 1}`] || 0)).filter(v => !isNaN(v));
              
              if (regionEffects.length > 0) {
                 const totalEffect = regionEffects.reduce((sum, item) => sum + item, 0)
                 const avgEffect = (totalEffect / regionEffects.length).toFixed(2)
                 povertyReduction = `${avgEffect}`
              }
            }
            
            tableData.push({
              key: index.toString(),
              region: regionName,
              gdpGrowth: gdpGrowth,
              povertyReduction: povertyReduction
            })
          })
          
          comparisonTableData.value = tableData
          
          if (tableData.length > 0) {
            tableColumns.value = [
              { title: '地区', dataIndex: 'region', key: 'region', fixed: 'left', width: 150 },
              { title: 'GDP增长率 (首尾年)', dataIndex: 'gdpGrowth', key: 'gdpGrowth' },
              { title: '政策效果指数 (平均)', dataIndex: 'povertyReduction', key: 'povertyReduction' }
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
    // ❗️ 修改：onRegionChange 变为 async
    const onRegionChange = async (value) => {
      // 限制只能选择两个地区进行对比
      if (value.length > 2) {
        selectedRegions.value = value.slice(0, 2);
      } else {
        selectedRegions.value = value;
      }
      
      // ❗️ 新增：清空已选的政策类型并动态加载新的
      selectedPolicyTypes.value = [];
      await loadDynamicPolicyTypes(selectedRegions.value);
      
      // 只有在选择了两个地区时才加载数据
      if (selectedRegions.value.length === 2) {
        loadChartData() // 这将使用新清空的 policyTypes (即 "全部") 来加载图表
      } else {
        // 如果选择少于2个，清空图表
        gdpData.value = [];
        policyEffectData.value = [];
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
    }
    
    onMounted(() => {
      loadData()
    })
    
    return {
      regions,
      policyTypes,
      policyTypesLoading, // <--- 新增
      selectedRegions,
      dateRange,
      selectedPolicyTypes,
      gdpData,
      policyEffectData,
      comparisonTableData,
      tableColumns,
      tableLoading,
      onRegionChange,
      onDateChange,
      onPolicyTypeChange,
      getDateRangeText,
      getPolicyPlaceholder, 
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
</style>