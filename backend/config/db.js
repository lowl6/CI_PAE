// 引入 mysql2 的 Promise 版本，适配 async/await
const mysql = require('mysql2/promise');

// 创建数据库连接池（连接池比单次连接更高效，避免频繁创建/关闭连接）
const pool = mysql.createPool({
    host: 'localhost', // 数据库地址，本地默认 localhost
    user: 'root', // 如 root（需替换为你实际的MySQL用户名）
    password: 'luchen', // 如 123456（需替换为你实际的MySQL密码）
    database: 'ci_pae', // 之前创建的专属数据库名
    port: 3306, // MySQL 默认端口，一般无需修改
    waitForConnections: true, // 无可用连接时等待，而非直接报错
    connectionLimit: 10, // 最大连接数，根据项目规模调整
    queueLimit: 0 // 连接请求队列无限制
});

// 测试连接是否成功（可选，用于验证配置是否正确）
async function testDbConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('MySQL 数据库连接成功！');
        connection.release(); // 释放连接回连接池
    } catch (err) {
        console.error('MySQL 数据库连接失败：', err.message);
    }
}

// 执行测试（首次创建文件时运行一次，确认配置正确后可注释）
testDbConnection();

// 导出连接池，供其他文件调用
module.exports = pool;