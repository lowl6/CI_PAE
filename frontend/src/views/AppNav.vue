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
        <li v-for="item in menuList" :key="item.path">
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
/* 接收外部传参，保持 Dashboard 的登录信息 */
defineProps({
  username: { type: String, default: '' },
  avatar:   { type: String, default: 'https://picsum.photos/id/1005/40/40' }
})
defineEmits(['logout'])

/* 导航清单，这里只写需要展示的页面 */
const menuList = [
  { path: '/',           title: '数据概览' },
  { path: '/analysis',   title: '深度分析' },
  { path: '/patterns',   title: '模式提炼' },
  { path: '/compare',    title: '区域对比' },
  { path: '/intelligent-query', title: '智能查询' }
]
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
}
.nav-center{
  flex: 1;
  list-style: none;
  display: flex;
  gap: 32px;
}
.nav-center li a{
  text-decoration: none;
  color: #ffffff;
  font-size: 15px;
  padding: 6px 0;
  border-bottom: 2px solid transparent;
  transition: all .3s;
}
.nav-center li a:hover{
  color: #1677ff;
  border-bottom-color: #1677ff;
}
.nav-center li a.active{
  color: #1677ff;
  border-bottom-color: #1677ff;
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
}
.user-name{
  font-size: 14px;
  color: #262626;
  margin-right: 12px;
}
.logout-btn{
  border: 1px solid #d9d9d9;
  background: #fff;
  padding: 5px 12px;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
}
.logout-btn:hover{
  border-color: #1677ff;
  color: #1677ff;
}
</style>