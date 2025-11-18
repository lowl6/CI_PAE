// 模拟用户数据存储（实际项目中应使用数据库）
const users = [
  { 
    id: 1, 
    username: 'admin', 
    password: 'admin123', // 实际项目中应加密存储
    role: 'admin' 
  }
]

// 生成JWT令牌的函数（简化版，实际项目中应使用jsonwebtoken库）
function generateToken(user) {
  // 简化的令牌生成，实际项目中应使用标准JWT库
  return Buffer.from(JSON.stringify({
    userId: user.id,
    username: user.username,
    role: user.role
  })).toString('base64')
}

exports.login = async (username, password) => {
  // 查找用户
  const user = users.find(u => u.username === username && u.password === password)
  
  if (!user) {
    throw new Error('Invalid username or password')
  }
  
  // 生成令牌
  const token = generateToken(user)
  
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  }
}

exports.register = async (username, password) => {
  // 检查用户名是否已存在
  const existingUser = users.find(u => u.username === username)
  
  if (existingUser) {
    throw new Error('Username already exists')
  }
  
  // 创建新用户
  const newUser = {
    id: users.length + 1,
    username,
    password, // 实际项目中应加密存储
    role: 'user' // 默认角色
  }
  
  users.push(newUser)
  
  // 生成令牌
  const token = generateToken(newUser)
  
  return {
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role
    }
  }
}