<template>
  <header class="app-header">
    <div class="brand">CI-PAE ⎯ 脱贫经验智能提炼</div>
    <nav>
      <router-link to="/">看板</router-link>
      <router-link to="/analysis">综合分析</router-link>
      <router-link to="/patterns">经验模式库</router-link>
      <router-link to="/compare">对比研究</router-link>
    </nav>
  </header>
</template>

<script>
export default { name: 'AppHeader' }
</script>

<style scoped>
.app-header{ display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:#fff; border-bottom:1px solid #e6edf3 }
.app-header nav{ display:flex; gap:12px }
.app-header a{ color:#333; text-decoration:none }
</style>
