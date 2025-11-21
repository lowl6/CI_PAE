import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ command, mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue()],

    // 开发环境配置
    server: {
      port: 5174,
      host: '0.0.0.0', // 允许局域网访问
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },

    // 生产环境配置
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      // 生产环境移除 console
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      }
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },

    // 定义全局常量
    define: {
      __APP_ENV__: JSON.stringify(env.VITE_APP_ENV)
    }
  }
})