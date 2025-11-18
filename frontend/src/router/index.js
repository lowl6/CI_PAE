import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/analysis',
    name: 'Analysis',
    component: () => import('../views/Analysis.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/patterns',
    name: 'Patterns',
    component: () => import('../views/Patterns.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/compare',
    name: 'Compare',
    component: () => import('../views/Compare.vue'),
    meta: { requiresAuth: true }
  },
  // 新增智能查询页面路由（带权限控制）
  {
    path: '/intelligent-query',
    name: 'IntelligentQuery',
    component: () => import('../views/QueryPage.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫保持不变
router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn')

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isLoggedIn) {
      next('/login')
    } else {
      next()
    }
  } else {
    if (isLoggedIn && to.path === '/login') {
      next('/')
    } else {
      next()
    }
  }
})

export default router