// 1. 引入 MySQL 连接池（新增）
const pool = require('../config/db');

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
  try {
    // 从连接池获取连接
    const [rows] = await pool.query(
      'SELECT id, username, password, role FROM users WHERE username = ?',
      [username] // 使用参数占位符，避免SQL注入（安全优化，虽当前只看可行性，但建议保留）
    );

    // 检查是否查询到用户
    if (rows.length === 0) {
      throw new Error('Invalid username or password');
    }

    const user = rows[0];
    // 检查密码是否匹配（当前暂用明文对比，后续需优化为密码加密存储）
    if (user.password !== password) {
      throw new Error('Invalid username or password');
    }

    // 生成令牌（逻辑不变）
    const token = generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    };
  } catch (err) {
    // 若为业务错误（如用户名/密码错误）直接抛出，若为数据库错误包装后抛出
    if (err.message === 'Invalid username or password') {
      throw err;
    }
    throw new Error('Failed to query user from database: ' + err.message);
  }
}
exports.register = async (username, password, role) => {
  try {
    // 验证角色合法性
    const allowedRoles = ['researcher', 'analyst', 'policy_admin', 'statistician', 'user'];
    const userRole = allowedRoles.includes(role) ? role : 'user'; // 默认为 user，不允许注册为 admin

    // 1. 先查询数据库，检查用户名是否已存在（避免重复注册）
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [username] // 参数占位符，防止SQL注入
    );

    // 2. 若用户名已存在，抛出错误
    if (existingUsers.length > 0) {
      throw new Error('Username already exists');
    }

    // 3. 若用户名不存在，向数据库插入新用户（默认角色为 user）
    const [result] = await pool.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, password, userRole] // 对应 SQL 中的三个 ? 占位符
    );

    // 4. 获取新插入用户的 ID（result.insertId 是 MySQL 插入后返回的自增 ID）
    const newUserId = result.insertId;

    // 5. 再次查询数据库，获取完整的新用户信息（用于生成 Token）
    const [newUserRows] = await pool.query(
      'SELECT id, username, role FROM users WHERE id = ?',
      [newUserId]
    );
    const newUser = newUserRows[0];

    // 6. 生成 Token 并返回结果（格式与 login 一致）
    const token = generateToken(newUser);
    return {
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role
      }
    };
  } catch (err) {
    // 区分业务错误（用户名已存在）和数据库错误
    if (err.message === 'Username already exists') {
      throw err;
    }
    throw new Error('Failed to register user to database: ' + err.message);
  }
}