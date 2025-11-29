<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>脱贫攻坚经验智能提炼系统</h2>
        <p>登录到您的账户</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">用户名</label>
          <input 
            id="username"
            v-model="loginForm.username" 
            type="text" 
            placeholder="请输入用户名"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input 
            id="password"
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码"
            required
          />
        </div>
        
        <button type="submit" class="login-button" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      
      <div class="register-link">
        <p>还没有账户？ <a href="#" @click="showRegister = true">立即注册</a></p>
      </div>
      
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </div>
    
    <!-- 注册表单 -->
    <div v-if="showRegister" class="register-overlay" @click="showRegister = false">
      <div class="register-box" @click.stop>
        <div class="register-header">
          <h2>用户注册</h2>
          <button class="close-button" @click="showRegister = false">&times;</button>
        </div>
        
        <form @submit.prevent="handleRegister" class="register-form">
          <div class="form-group">
            <label for="regUsername">用户名</label>
            <input 
              id="regUsername"
              v-model="registerForm.username" 
              type="text" 
              placeholder="请输入用户名"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="regPassword">密码</label>
            <input 
              id="regPassword"
              v-model="registerForm.password" 
              type="password" 
              placeholder="请输入密码"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">确认密码</label>
            <input 
              id="confirmPassword"
              v-model="registerForm.confirmPassword" 
              type="password" 
              placeholder="请再次输入密码"
              required
            />
          </div>

          <div class="form-group">
            <label for="regRole">选择角色</label>
            <select id="regRole" v-model="registerForm.role" class="role-select">
              <option value="user">普通用户</option>
              <option value="researcher">调研员</option>
              <option value="analyst">数据分析师</option>
              <option value="policy_admin">政策管理员</option>
              <option value="statistician">数据统计员</option>
            </select>
          </div>

          <div class="form-group" v-if="registerForm.role !== 'user'">
            <label for="regSecret">身份授权码</label>
            <input 
              id="regSecret"
              v-model="registerForm.secretKey" 
              type="password" 
              placeholder="请输入该身份的授权码"
              class="secret-input"
            />
          </div>
          
          <button type="submit" class="register-button" :disabled="registerLoading">
            {{ registerLoading ? '注册中...' : '注册' }}
          </button>
        </form>
        
        <div v-if="registerMessage" class="register-message" :class="{ error: registerError }">
          {{ registerMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// 1. 引入 account.js 中的 login 和 register 函数（替换原有的 api 引入）
import { login, register } from '@/api/account';

export default {
  name: 'Login',
  data() {
    return {
      loginForm: {
        username: '',
        password: ''
      },
      registerForm: {
        username: '',
        password: '',
        confirmPassword: '',
        role: 'user',
        secretKey: ''
      },
      loading: false,
      registerLoading: false,
      errorMessage: '',
      showRegister: false,
      registerMessage: '',
      registerError: false
    }
  },
  methods: {
    async handleLogin() {
      this.loading = true
      this.errorMessage = ''
      
      try {
        // 2. 调用 account.js 的 login 函数，传入用户名和密码
        const response = await login(this.loginForm.username, this.loginForm.password);
        
        // 3. 登录成功：存储后端返回的 Token 和用户信息（用于后续受保护接口）
        if (response.ok && response.data?.token) {
          localStorage.setItem('token', response.data.token); // 存储 Token
          localStorage.setItem('user', JSON.stringify(response.data.user)); // 存储用户信息
          localStorage.setItem('isLoggedIn', 'true');
          this.$router.push('/'); // 跳转到首页
        } else {
          throw new Error('登录响应异常，请重试');
        }
      } catch (error) {
        // 4. 捕获错误：优先显示后端返回的错误信息，无则用默认提示
        this.errorMessage = error.error || '登录失败，请检查用户名和密码';
      } finally {
        this.loading = false
      }
    },
    
    async handleRegister() {
      this.registerLoading = true
      this.registerMessage = ''
      this.registerError = false
      
      try {
        // 5. 先验证密码一致性（前端基础校验）
        if (this.registerForm.password !== this.registerForm.confirmPassword) {
          throw new Error('两次输入的密码不一致');
        }

        // 【新增】前端简单校验：选了特殊身份但没填码，直接拦截
        if (this.registerForm.role !== 'user' && !this.registerForm.secretKey) {
            throw new Error('注册该身份需要输入授权码');
        }
        
        // 6. 调用 account.js 的 register 函数，传入用户名和密码
        // 【修改】调用 register 时传入 role
        const response = await register(
          this.registerForm.username, 
          this.registerForm.password,
          this.registerForm.role,
          this.registerForm.secretKey
        );
        
        // 7. 注册成功：存储 Token 和用户信息，提示并跳转
        if (response.ok && response.data?.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          localStorage.setItem('isLoggedIn', 'true');
          this.registerMessage = '注册成功，即将跳转...';
          
          setTimeout(() => {
            this.$router.push('/');
          }, 1500);
        } else {
          throw new Error('注册响应异常，请重试');
        }
      } catch (error) {
        // 8. 捕获注册错误：后端错误（如用户名已存在）或前端校验错误
        this.registerError = true;
        this.registerMessage = error.error || error.message || '注册失败，请重试';
      } finally {
        this.registerLoading = false
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
  position: relative;
}

.login-box {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  color: #333;
  margin-bottom: 10px;
}

.login-header p {
  color: #666;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #333;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #c0392b;
}

.login-button {
  width: 100%;
  padding: 12px;
  background-color: #c0392b;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-button:hover:not(:disabled) {
  background-color: #a5281b;
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.register-link {
  text-align: center;
  margin-top: 20px;
}

.register-link a {
  color: #c0392b;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}

.error-message {
  color: #e74c3c;
  text-align: center;
  margin-top: 15px;
  padding: 10px;
  background-color: #fdf2f2;
  border-radius: 4px;
  border: 1px solid #f5c6cb;
}

.register-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.register-box {
  width: 100%;
  max-width: 400px;
  padding: 30px;
  background: white;
  border-radius: 8px;
  position: relative;
}

.register-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.register-header h2 {
  margin: 0;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.close-button:hover {
  color: #333;
}

.register-form {
  margin-bottom: 15px;
}

.register-button {
  width: 100%;
  padding: 12px;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.register-button:hover:not(:disabled) {
  background-color: #219653;
}

.register-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.register-message {
  text-align: center;
  padding: 10px;
  border-radius: 4px;
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.register-message.error {
  background-color: #f8d7da;
  color: #721c24;
  border-color: #f5c6cb;
}

/* 【新增】下拉框样式，与 input 保持一致 */
.role-select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;
  background-color: white;
  cursor: pointer;
}

.role-select:focus {
  outline: none;
  border-color: #27ae60; /* 注册框的主色调是绿色，这里可以匹配一下 */
}

.secret-input {
  border-color: #f39c12; /* 橙色边框提示这是特殊字段 */
}

.secret-input:focus {
  border-color: #e67e22;
}

/* 移动端响应式 */
@media (max-width: 768px) {
  .login-container {
    padding: 16px;
    align-items: flex-start;
    padding-top: 10vh;
  }
  
  .login-box {
    max-width: 100%;
    padding: 24px 20px;
    margin: 0 16px;
  }
  
  .login-header {
    margin-bottom: 24px;
  }
  
  .login-header h2 {
    font-size: 22px;
  }
  
  .login-header p {
    font-size: 14px;
  }
  
  .form-group {
    margin-bottom: 16px;
  }
  
  .form-group label {
    font-size: 14px;
    margin-bottom: 5px;
  }
  
  .form-group input,
  .role-select {
    padding: 12px;
    font-size: 16px; /* 保持16px防止iOS自动缩放 */
    height: 44px;
  }
  
  .login-button,
  .register-button {
    padding: 12px;
    font-size: 16px;
    height: 44px;
  }
  
  .register-link {
    margin-top: 16px;
    font-size: 14px;
  }
  
  /* 注册弹窗优化 */
  .register-overlay {
    padding: 16px;
  }
  
  .register-box {
    max-width: 100%;
    padding: 20px;
    margin: 0;
  }
  
  .register-header h2 {
    font-size: 20px;
  }
  
  .close-button {
    font-size: 20px;
  }
  
  .register-form {
    margin-bottom: 12px;
  }
  
  .error-message,
  .register-message {
    font-size: 14px;
    padding: 8px;
  }
}

/* 超小屏幕 */
@media (max-width: 480px) {
  .login-container {
    padding: 12px;
    padding-top: 8vh;
  }
  
  .login-box {
    padding: 20px 16px;
    margin: 0 12px;
  }
  
  .login-header h2 {
    font-size: 20px;
  }
  
  .login-header p {
    font-size: 13px;
  }
  
  .form-group input,
  .role-select,
  .login-button,
  .register-button {
    height: 40px;
    padding: 10px;
    font-size: 15px;
  }
  
  .register-box {
    padding: 16px;
  }
}

/* 横屏优化 */
@media (max-height: 600px) and (orientation: landscape) {
  .login-container {
    padding-top: 20px;
  }
  
  .login-box {
    padding: 20px;
  }
  
  .login-header {
    margin-bottom: 16px;
  }
  
  .form-group {
    margin-bottom: 12px;
  }
  
  .register-link {
    margin-top: 12px;
  }
}

</style>