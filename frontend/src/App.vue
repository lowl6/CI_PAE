<template>
  <AppNav :username="username" @logout="handleLogout" />
  <router-view />
</template>

<script setup>
import { ref } from 'vue'
import AppNav from './views/AppNav.vue'

/* 简单示例：用户名 & 登出 */
const username = ref(localStorage.getItem('username') || 'admin')

function handleLogout() {
  localStorage.clear()
  location.reload()          // 简单粗暴回登录页
}
</script>