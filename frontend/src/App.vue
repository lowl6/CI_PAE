<template>
  <div class="app-root">
    <AppHeader />
    <div class="main-area">
      <AppSidebar />
      <section class="content">
        <router-view />
      </section>
    </div>
  </div>
</template>

<script>
import AppHeader from './components/Layout/AppHeader.vue'
import AppSidebar from './components/Layout/AppSidebar.vue'

export default {
  name: 'App',
  components: { AppHeader, AppSidebar }
}
</script>

<style scoped>
.app-root { font-family: Arial, Helvetica, sans-serif; }
.main-area { display: flex; }
.content { flex:1; padding:16px; }
</style>
