// 引入 mysql2 的 Promise 版本，适配 async/await
const mysql = require('mysql2/promise');
const path = require('path');
// 统一从项目根目录加载 .env，避免使用 backend/.env
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// 创建数据库连接池（连接池比单次连接更高效，避免频繁创建/关闭连接）
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'ci_pae',
    port: parseInt(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0
});

// 测试连接并初始化数据库
async function testDbConnection() {
    try {
        const connection = await pool.getConnection();
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

// 执行测试和初始化
testDbConnection();

// 导出连接池，供其他文件调用
module.exports = pool;