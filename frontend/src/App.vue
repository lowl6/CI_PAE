<template>
  <AppNav 
    v-if="!isLoginPage" 
    :username="username" 
    :user-role="userRole"
    @logout="handleLogout" 
  />
  <router-view />
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import AppNav from './views/AppNav.vue'

const route = useRoute()
const username = ref('admin')
const userRole = ref('user')  // 默认为 'user' 以保证安全

const isLoginPage = computed(() => {
  return route.path === '/login'
})

// 同时解析 username 和 role
const updateUserInfo = () => {
  try {
    // 1. 尝试从 'user' 对象中解析完整信息
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      if (user) {
        // 获取用户名
        username.value = user.username || 'admin'
        // 获取角色，如果不存在则默认为 'user'
        userRole.value = user.role || 'user'
        return
      }
    }
    
    // 2. 兼容性处理
    const simpleName = localStorage.getItem('username')
    if (simpleName) {
      username.value = simpleName
      userRole.value = 'user' // 旧版登录默认视为普通用户
      return
    }

    // 3. 默认兜底
    username.value = 'admin'
    userRole.value = 'user'
  } catch (e) {
    console.warn('解析用户信息失败:', e)
    username.value = 'admin'
    userRole.value = 'user'
  }
}

// 初始化
updateUserInfo()

// 监听路由变化，确保登录跳转后状态更新
watch(() => route.path, () => {
  updateUserInfo()
})

function handleLogout() {
  localStorage.clear()
  location.reload()          // 简单粗暴回登录页
}
</script>