import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Dashboard', component: () => import('../views/Dashboard.vue') },
  { path: '/analysis', name: 'Analysis', component: () => import('../views/Analysis.vue') },
  { path: '/patterns', name: 'Patterns', component: () => import('../views/Patterns.vue') },
  { path: '/compare', name: 'Compare', component: () => import('../views/Compare.vue') }
]

const router = createRouter({ history: createWebHistory(), routes })

export default router
