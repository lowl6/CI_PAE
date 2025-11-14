<template>
  <aside class="app-sidebar">
    <nav>
      <ul>
        <li>看板</li>
        <li>综合分析</li>
        <li>经验模式库</li>
        <li>对比研究</li>
      </ul>
    </nav>
  </aside>
</template>

<script>
export default { name: 'AppSidebar' }
</script>

<style scoped>
.app-sidebar{ width:200px; background:#f7fafc; padding:12px }
.app-sidebar ul{ list-style:none; padding:0 }
.app-sidebar li{ padding:8px 4px }
</style>
