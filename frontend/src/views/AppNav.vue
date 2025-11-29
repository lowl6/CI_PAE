<template>
  <nav class="app-nav">
    <div class="nav-container">
      <!-- 左侧：logo 保留 -->
      <div class="nav-left">
        <img src="/icons/logo.png" alt="Logo" class="logo-icon" @error="$event.target.src='https://via.placeholder.com/40'">
        <span class="system-name">攻坚印记</span>
      </div>

      <!-- 中间：页面导航 (桌面端) -->
      <ul class="nav-center">
        <li v-for="item in filteredMenuList" :key="item.path">
          <router-link :to="item.path" active-class="active">
            {{ item.title }}
          </router-link>
        </li>
      </ul>

      <!-- 右侧：用户信息 / 登出 (桌面端) -->
      <div class="nav-right">
        <img :src="avatar" alt="avatar" class="user-avatar">
        <span class="user-name">{{ username }}</span>
        <button class="logout-btn" @click="$emit('logout')">登出</button>
      </div>

      <!-- 移动端汉堡菜单按钮 -->
      <button class="mobile-menu-btn" @click="toggleMobileMenu">
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>
    </div>

    <!-- 移动端菜单抽屉 -->
    <transition name="slide">
      <div v-if="isMobileMenuOpen" class="mobile-menu">
        <div class="mobile-menu-overlay" @click="closeMobileMenu"></div>
        <div class="mobile-menu-content">
          <!-- 移动端用户信息 -->
          <div class="mobile-user-info">
            <img :src="avatar" alt="avatar" class="mobile-avatar">
            <div class="mobile-user-details">
              <span class="mobile-username">{{ username }}</span>
              <button class="mobile-logout-btn" @click="handleMobileLogout">登出</button>
            </div>
          </div>
          
          <!-- 移动端导航菜单 -->
          <ul class="mobile-nav-list">
            <li v-for="item in filteredMenuList" :key="item.path">
              <router-link :to="item.path" active-class="active" @click="closeMobileMenu">
                {{ item.title }}
              </router-link>
            </li>
          </ul>
        </div>
      </div>
    </transition>
  </nav>
</template>

<script setup>
import { computed, ref } from 'vue'

/* 接收外部传参，保持 Dashboard 的登录信息 */
const props = defineProps({
  username: { type: String, default: '' },
  avatar:   { type: String, default: 'https://picsum.photos/id/1005/40/40' },
  userRole: { type: String, default: 'user' } // 接收角色
})

const emit = defineEmits(['logout'])

// 移动端菜单状态
const isMobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const handleMobileLogout = () => {
  closeMobileMenu()
  emit('logout')
}

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
  cursor: pointer;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s;
}
.logout-btn:hover{
  background: #fff;
  color: #d7000f;
  border-color: #fff;
}

/* 移动端汉堡菜单按钮 */
.mobile-menu-btn {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 30px;
  height: 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 1001;
}

.hamburger-line {
  width: 100%;
  height: 3px;
  background: #ffffff;
  border-radius: 2px;
  transition: all 0.3s;
}

/* 移动端菜单 */
.mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 1000;
}

.mobile-menu-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
}

.mobile-menu-content {
  position: absolute;
  top: 0;
  right: 0;
  width: 280px;
  height: 100vh;
  background: #ffffff;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  padding: 20px;
}

.mobile-user-info {
  display: flex;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #e8e8e8;
  margin-bottom: 20px;
}

.mobile-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 12px;
}

.mobile-user-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-username {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.mobile-logout-btn {
  align-self: flex-start;
  background: #d7000f;
  color: #ffffff;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}

.mobile-nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.mobile-nav-list li {
  margin-bottom: 8px;
}

.mobile-nav-list li a {
  display: block;
  padding: 12px 16px;
  color: #333;
  text-decoration: none;
  font-size: 15px;
  border-radius: 6px;
  transition: all 0.3s;
}

.mobile-nav-list li a:hover {
  background: #f5f5f5;
}

.mobile-nav-list li a.active {
  background: #d7000f;
  color: #ffffff;
  font-weight: 600;
}

/* 滑动动画 */
.slide-enter-active, .slide-leave-active {
  transition: opacity 0.3s;
}

.slide-enter-active .mobile-menu-content,
.slide-leave-active .mobile-menu-content {
  transition: transform 0.3s;
}

.slide-enter-from, .slide-leave-to {
  opacity: 0;
}

.slide-enter-from .mobile-menu-content {
  transform: translateX(100%);
}

.slide-leave-to .mobile-menu-content {
  transform: translateX(100%);
}

/* 响应式布局 - 平板 */
@media (max-width: 992px) {
  .nav-center {
    gap: 20px;
  }
  
  .nav-center li a {
    font-size: 14px;
  }
  
  .nav-left {
    margin-right: 24px;
  }
  
  .user-name {
    display: none;
  }
}

/* 响应式布局 - 手机 */
@media (max-width: 768px) {
  .app-nav {
    height: 56px;
  }
  
  .nav-container {
    padding: 0 16px;
  }
  
  .nav-center {
    display: none;
  }
  
  .nav-right {
    display: none;
  }
  
  .mobile-menu-btn {
    display: flex;
  }
  
  .logo-icon {
    width: 32px;
    height: 32px;
  }
  
  .system-name {
    font-size: 16px;
  }
  
  .nav-left {
    margin-right: auto;
  }
}

/* 超小屏幕优化 */
@media (max-width: 480px) {
  .mobile-menu-content {
    width: 240px;
  }
  
  .system-name {
    font-size: 14px;
  }
}
</style>