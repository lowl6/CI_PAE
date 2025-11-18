// 用户认证和权限管理工具

export function isLoggedIn() {
  return !!localStorage.getItem('isLoggedIn')
}

export function getUserInfo() {
  return {
    username: localStorage.getItem('username') || '',
    isLoggedIn: isLoggedIn()
  }
}

export function login(username) {
  localStorage.setItem('isLoggedIn', 'true')
  localStorage.setItem('username', username)
}

export function logout() {
  localStorage.removeItem('isLoggedIn')
  localStorage.removeItem('username')
}

export function requireAuth(to, from, next) {
  if (!isLoggedIn()) {
    next('/login')
  } else {
    next()
  }
}