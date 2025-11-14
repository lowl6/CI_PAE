<template>
  <div class="region-filter">
    <label>地区</label>
    <select v-model="region">
      <option value="all">全部</option>
      <option value="county-a">某贫困县A</option>
      <option value="county-b">某贫困县B</option>
    </select>
  </div>
</template>

<script>
export default { name: 'RegionFilter', data(){ return { region: 'all' } } }
</script>

<style scoped>
.region-filter{ display:flex; gap:8px; align-items:center }
</style>
