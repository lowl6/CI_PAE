// 数据库初始化工具
const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
    let connection;
    try {
        console.log('开始初始化数据库...');

        const sqlFilePath = path.join(__dirname, '../database/init.sql');
        if (!fs.existsSync(sqlFilePath)) {
            console.warn('未找到 init.sql，跳过初始化');
            return false;
        }
        const raw = fs.readFileSync(sqlFilePath, 'utf8');

        // 去除行级注释并标准化换行
        const cleaned = raw
            .replace(/--[^\n]*\n/g, '\n') // 删除 -- 注释行
            .replace(/\/\*[^]*?\*\//g, '') // 删除块注释
            .replace(/\r\n/g, '\n');

        // 按分号+换行进行分割，避免拆分存储过程（当前无存储过程）
        const statements = cleaned
            .split(/;\n/) // 保留末尾可能未跟换行的语句
            .map(s => s.trim())
            .filter(s => s.length > 0);

        connection = await pool.getConnection();

        for (const stmt of statements) {
            const statement = stmt.endsWith(';') ? stmt.slice(0, -1) : stmt;
            const upper = statement.trim().toUpperCase();

            // 跳过空
            if (!upper) continue;

            // 如果是 INSERT 语句，判断对应表是否已有数据，避免重复插入
            if (upper.startsWith('INSERT INTO')) {
                // 提取表名：INSERT INTO `table` 或 INSERT INTO table
                const tableMatch = statement.match(/INSERT\s+INTO\s+`?(\w+)`?/i);
                if (tableMatch) {
                    const tableName = tableMatch[1];
                    try {
                        const [rows] = await connection.query(`SELECT COUNT(*) AS cnt FROM \`${tableName}\``);
                        if (rows[0].cnt > 0) {
                            console.log(`跳过种子数据插入：表 ${tableName} 已有 ${rows[0].cnt} 行`);
                            continue;
                        }
                    } catch (countErr) {
                        // 如果表不存在则继续执行该 INSERT
                    }
                }
            }

            try {
                await connection.query(statement);
            } catch (err) {
                const msg = err.message || '';
                // 忽略常见的存在性错误
                if (msg.includes('already exists') || msg.includes('Duplicate entry')) {
                    console.warn(`跳过：${msg.split('\n')[0]}`);
                } else if (msg.includes('foreign key constraint fails')) {
                    console.warn(`外键约束失败，可能插入顺序问题：${msg.split('\n')[0]}`);
                } else {
                    console.warn('执行 SQL 时警告:', msg.substring(0, 160));
                }
            }
        }

        console.log('✓ 数据库初始化过程结束');
        return true;
    } catch (err) {
        console.error('✗ 数据库初始化失败:', err.message);
        return false;
    } finally {
        if (connection) connection.release();
    }
}

// 检查数据库是否已初始化
async function checkDatabaseInitialized() {
    try {
        const [rows] = await pool.query("SHOW TABLES LIKE 'users'");
        return rows.length > 0;
    } catch (err) {
        console.error('检查数据库状态失败:', err.message);
        return false;
    }
}

module.exports = { initDatabase, checkDatabaseInitialized };
