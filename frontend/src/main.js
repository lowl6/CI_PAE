import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles/main.css'
import Antd from 'ant-design-vue'

const app = createApp(App)   // 1. 先创建实例
app.use(router)              // 2. 装插件
app.use(Antd)
app.mount('#app')            // 3. 挂载