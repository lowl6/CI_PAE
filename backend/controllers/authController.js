const authService = require('../services/authService')

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body
    const result = await authService.login(username, password)
    res.json({ ok: true, data: result })
  } catch (err) { 
    next(err) 
  }
}

exports.register = async (req, res, next) => {
  try {
    const { username, password, role, secretKey } = req.body

    const roleSecretMap = {
      'researcher': 'SK_RESEARCHER',      // 调研员
      'analyst': 'SK_ANALYST',            // 分析师
      'policy_admin': 'SK_POLICY_ADMIN',  // 政策管理员
      'statistician': 'SK_STATISTICIAN'   // 统计员
      // 'user': 普通用户不在表中，默认不需要校验
    };

    const envVarName = roleSecretMap[role];

    if (envVarName) {
      // 3. 获取服务器端配置的真实密钥
      // 逻辑：优先找角色专属的 Key，如果没有配置，则尝试使用SK_ANALYST
      const requiredKey = process.env[envVarName] || process.env.SK_ANALYST;

      // 如果连通用密钥也没配置，说明服务器配置有误，拦截注册以防安全漏洞
      if (!requiredKey) {
        console.error(`注册失败: 服务器未配置 ${envVarName} 或 SK_ANALYST`);
        return res.status(500).json({ 
          ok: false, 
          error: `服务器安全配置缺失，无法注册 ${role} 身份` 
        });
      }

      // 4. 核心校验：对比前端输入的码与后端配置的码
      if (secretKey !== requiredKey) {
        return res.status(403).json({ 
          ok: false, 
          error: `${role} 身份授权码错误` 
        });
      }
    }

    const result = await authService.register(username, password, role)
    res.json({ ok: true, data: result })
  } catch (err) { 
    next(err) 
  }
}

exports.logout = async (req, res, next) => {
  try {
    // 清除会话或令牌
    res.json({ ok: true, message: 'Logged out successfully' })
  } catch (err) { 
    next(err) 
  }
}