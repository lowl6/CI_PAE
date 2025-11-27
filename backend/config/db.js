// 引入 mysql2 的 Promise 版本，适配 async/await
const mysql = require('mysql2/promise');
const path = require('path');
// 统一从项目根目录加载 .env，避免使用 backend/.env
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// 创建数据库连接池（连接池比单次连接更高效，避免频繁创建/关闭连接）
// 注意：初始连接不指定数据库，允许在数据库不存在时也能连接
const commonConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    database: 'ci_pae', // 这里必须指定数据库，因为普通用户没有权限访问其他库
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10, // 每个角色限制连接数，防止总连接数过多
    queueLimit: 0
};

// 1. Root Pool (用于初始化和管理员操作)
const rootPool = mysql.createPool({
    ...commonConfig,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: undefined // Root 连接初始不指定库，为了兼容 initDb 的创建库逻辑
});

// 2. 定义角色与数据库用户的映射配置
const roleConfigs = {
    'researcher': { user: 'researcher', password: process.env.DB_PWD_RESEARCHER },
    'analyst': { user: 'analyst', password: process.env.DB_PWD_ANALYST },
    'policy_admin': { user: 'policy_admin', password: process.env.DB_PWD_POLICY_ADMIN },
    'statistician': { user: 'statistician', password: process.env.DB_PWD_STATISTICIAN },
    'user': { user: 'user', password: process.env.DB_PWD_USER },
    'admin': { user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD } // Admin 使用 root
};

// 3. 懒加载连接池容器
const pools = {};

// 4. 获取特定角色的连接池
function getPool(role = 'user') {
    // 默认回退到 user 权限
    const targetRole = roleConfigs[role] ? role : 'user';
    
    if (!pools[targetRole]) {
        const config = roleConfigs[targetRole];
        console.log(`[DB] Creating pool for role: ${targetRole}`);
        pools[targetRole] = mysql.createPool({
            ...commonConfig,
            user: config.user,
            password: config.password
        });
    }
    return pools[targetRole];
}

// 测试连接并初始化数据库
async function testDbConnection() {
    try {
        const connection = await rootPool.getConnection();
        console.log('✓ MySQL 数据库连接成功！');
        connection.release();

        // 检查并初始化数据库
        const { checkDatabaseInitialized, initDatabase } = require('./initDb');
        const isInitialized = await checkDatabaseInitialized();

        if (!isInitialized) {
            console.log('检测到数据库未初始化，开始自动初始化...');
            await initDatabase();
        } else {
            console.log('✓ 数据库已初始化');
        }
    } catch (err) {
        console.error('✗ MySQL 数据库连接失败：', err.message);
        console.error('请检查 .env 文件中的数据库配置');
    }
}

// 仅在非测试脚本环境下自动执行
// 检查是否是通过 test-init-db.js 运行
const isTestScript = process.argv.some(arg => arg.includes('test-init-db'));

if (!isTestScript) {
    // 正常启动服务器时才自动测试连接
    testDbConnection();
}

// 导出连接池，供其他文件调用
// 保持向后兼容，导出 rootPool 作为默认 pool (用于 initDb.js 等不带上下文的脚本)
module.exports = rootPool; 
// 导出获取特定 Pool 的方法
module.exports.getPool = getPool;