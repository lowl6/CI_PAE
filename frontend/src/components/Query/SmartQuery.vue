<template>
  <div class="smart-query">
    <label>智能查询（示例）</label>
    <input v-model="q" placeholder="输入查询或问题" />
    <button @click="run">查询</button>
    <pre v-if="result">{{ result }}</pre>
  </div>
</template>

<script>
import api from '../../api'
export default {
  name: 'SmartQuery',
  data(){ return { q:'', result: null } },
  methods:{
    async run(){
      const res = await api.nlp.query({ query: this.q })
      this.result = JSON.stringify(res.data, null, 2)
    }
  }
}
</script>

<style scoped>
.smart-query{ display:flex; flex-direction:column; gap:8px }
.smart-query input{ padding:8px; border-radius:4px }
</style>
