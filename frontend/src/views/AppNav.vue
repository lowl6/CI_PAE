<template>
  <nav class="app-nav">
    <div class="nav-container">
      <!-- 左侧：logo 保留 -->
      <div class="nav-left">
        <img src="/icons/logo.png" alt="Logo" class="logo-icon" @error="$event.target.src='https://via.placeholder.com/40'">
        <span class="system-name">攻坚印记</span>
      </div>

      <!-- 中间：页面导航 -->
      <ul class="nav-center">
        <li v-for="item in filteredMenuList" :key="item.path">
          <router-link :to="item.path" active-class="active">
            {{ item.title }}
          </router-link>
        </li>
      </ul>

      <!-- 右侧：用户信息 / 登出 -->
      <div class="nav-right">
        <img :src="avatar" alt="avatar" class="user-avatar">
        <span class="user-name">{{ username }}</span>
        <button class="logout-btn" @click="$emit('logout')">登出</button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'

/* 接收外部传参，保持 Dashboard 的登录信息 */
const props = defineProps({
  username: { type: String, default: '' },
  avatar:   { type: String, default: 'https://picsum.photos/id/1005/40/40' },
  userRole: { type: String, default: 'user' } // 接收角色
})

defineEmits(['logout'])

/* 导航清单 */
const rawMenuList = [
  { path: '/',           title: '数据概览' },
  { path: '/analysis',   title: '深度分析' },
  { path: '/patterns',   title: '模式提炼' },
  { path: '/compare',    title: '区域对比' },
  { path: '/intelligent-query', title: '智能查询' },
  { path: '/sql-query',  title: 'SQL查询' }
]

/* 使用 computed 动态过滤菜单 */
const filteredMenuList = computed(() => {
  return rawMenuList.filter(item => {
    // 如果是 SQL查询 页面
    if (item.path === '/sql-query') {
      // 只有当角色不是 'user' 时才显示 (即 user 角色隐藏该项)
      return props.userRole !== 'user'
    }
    // 其他页面默认显示
    return true
  })
})
</script>

<style scoped>
.app-nav{
  height: 60px;
  background: #d7000f; 
  display: flex;
  align-items: center;
  justify-content: center;
  position: sticky;
  top: 0;
  z-index: 999;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.nav-container{
  max-width: 1400px;
  width: 100%;
  display: flex;
  align-items: center;
  padding: 0 24px;
}
.nav-left{
  display: flex;
  align-items: center;
  margin-right: 40px;
}
.logo-icon{
  width: 36px;
  height: 36px;
  margin-right: 8px;
}
.system-name{
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 1px;
}
.nav-center{
  flex: 1;
  list-style: none;
  display: flex;
  gap: 32px;
}
.nav-center li a{
  text-decoration: none;
  color: rgba(255, 255, 255, 0.85);
  font-size: 15px;
  padding: 6px 0;
  border-bottom: 2px solid transparent;
  transition: all .3s;
  font-weight: 500;
}
.nav-center li a:hover{
  color: #ffffff;
  border-bottom-color: #ffffff;
}
.nav-center li a.active{
  color: #ffffff;
  border-bottom-color: #ffffff;
  font-weight: 600;
}
.nav-right{
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-avatar{
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3);
}

.user-name{
  font-size: 15px;
  color: #ffffff;
  font-weight: 500;
  margin-right: 12px;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.logout-btn{
  border: 1px solid rgba(255,255,255,0.4);
  background: transparent;
  color: #fff;
  padding: 4px 12px;
  font-size: 13px;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s;
}
.logout-btn:hover{
  background: #fff;
  color: #d7000f;
  border-color: #fff;
}
</style>