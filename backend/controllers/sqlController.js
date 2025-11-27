const { getPool } = require('../config/db');

/**
 * 执行原生SQL查询
 * POST /api/sql/execute
 */
exports.execute = async (req, res) => {
  try {
    const { sql } = req.body;
    
    // 1. 基础校验
    if (!sql || typeof sql !== 'string' || !sql.trim()) {
      return res.json({ ok: false, error: '请输入有效的SQL查询语句' });
    }

    const cleanSql = sql.trim();
    const lowerSql = cleanSql.toLowerCase();


    
    // 3. 权限控制：尝试获取当前用户角色
    // 默认为 'user' (只读权限)，如果前端传递了 Token，则尝试提升权限
    let role = 'user';
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        // 这里使用简单的 base64 解码 (对应 authService 中的 generateToken 逻辑)
        // 如果将来使用了标准 JWT，这里需要换成 jwt.verify
        const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
        if (payload && payload.role) {
          role = payload.role;
        }
      } catch (e) {
        // token 解析失败，静默降级为 user 角色
        console.warn('[SQL API] Token解析失败，使用默认 user 权限');
      }
    }

    console.log(`[SQL] Role: ${role} | Query: ${cleanSql.substring(0, 100)}${cleanSql.length > 100 ? '...' : ''}`);

    // 4. 执行查询
    const pool = getPool(role);
    const [rows] = await pool.query(cleanSql);

    // 5. 返回结果
    res.json({ ok: true, data: rows });

  } catch (error) {
    console.error('SQL执行失败:', error.message);
    res.json({ ok: false, error: '查询执行出错: ' + error.message });
  }
};