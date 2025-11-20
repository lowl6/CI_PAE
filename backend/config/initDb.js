// 数据库初始化工具
const pool = require('./db');
const fs = require('fs');
const path = require('path');

/**
 * 执行单个SQL文件（支持事务和批量插入）
 * @param {Object} connection - 数据库连接
 * @param {String} sqlFilePath - SQL文件路径
 * @param {String} tableName - 目标表名（用于检查数据是否已存在）
 */
async function executeSqlFile(connection, sqlFilePath, tableName) {
    if (!fs.existsSync(sqlFilePath)) {
        console.warn(`  ⚠ 文件不存在: ${sqlFilePath}`);
        return false;
    }

    // 检查表是否已有数据
    try {
        const [rows] = await connection.query(`SELECT COUNT(*) AS cnt FROM \`${tableName}\``);
        if (rows[0].cnt > 0) {
            console.log(`  ⏭ 跳过 ${tableName}: 已有 ${rows[0].cnt} 条数据`);
            return true;
        }
    } catch (countErr) {
        console.warn(`  ⚠ 无法检查表 ${tableName}:`, countErr.message);
    }

    // 读取并执行SQL文件
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    try {
        // 分割SQL语句并逐条执行
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.toUpperCase().startsWith('COMMIT'));
        
        for (const statement of statements) {
            if (statement.toUpperCase() === 'START TRANSACTION' || 
                statement.toUpperCase().startsWith('START TRANSACTION')) {
                await connection.beginTransaction();
            } else {
                await connection.query(statement);
            }
        }
        
        await connection.commit();
        
        const [countResult] = await connection.query(`SELECT COUNT(*) AS cnt FROM \`${tableName}\``);
        console.log(`  ✓ 导入 ${tableName}: ${countResult[0].cnt} 条数据`);
        return true;
    } catch (err) {
        try {
            await connection.rollback();
        } catch (rollbackErr) {
            // 忽略 rollback 错误
        }
        
        // 检查是否是重复键错误（数据已存在）
        if (err.message.includes('Duplicate entry')) {
            // 静默处理，不显示错误（数据已存在是正常的）
            return false;
        }
        
        console.error(`  ✗ 导入 ${tableName} 失败:`, err.message.substring(0, 200));
        return false;
    }
}

/**
 * 初始化数据库表结构
 */
async function initDatabaseSchema() {
    let connection;
    try {
        console.log('\n=== 第一步: 初始化数据库表结构 ===');

        // 先创建数据库（如果不存在）
        connection = await pool.getConnection();
        await connection.query("CREATE DATABASE IF NOT EXISTS ci_pae DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        await connection.query("USE ci_pae");
        console.log('✓ 数据库 ci_pae 已就绪');

        const sqlFilePath = path.join(__dirname, '../database/init.sql');
        if (!fs.existsSync(sqlFilePath)) {
            console.warn('未找到 init.sql，跳过表结构初始化');
            return false;
        }

        const raw = fs.readFileSync(sqlFilePath, 'utf8');

        // 去除行级注释并标准化换行
        const cleaned = raw
            .replace(/--[^\n]*\n/g, '\n') // 删除 -- 注释行
            .replace(/\/\*[^]*?\*\//g, '') // 删除块注释
            .replace(/\r\n/g, '\n');

        // 按分号+换行进行分割
        const statements = cleaned
            .split(/;\n/)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const stmt of statements) {
            const statement = stmt.endsWith(';') ? stmt.slice(0, -1) : stmt;
            const upper = statement.trim().toUpperCase();

            // 跳过空语句和数据导入命令（SOURCE/IMPORT_CMD）
            if (!upper || upper.startsWith('SOURCE:') || upper.startsWith('IMPORT_CMD:')) continue;

            // 只执行结构相关的SQL（CREATE, DROP, ALTER, USE等）
            if (upper.startsWith('CREATE') || upper.startsWith('DROP') || 
                upper.startsWith('ALTER') || upper.startsWith('USE') ||
                upper.startsWith('SET') || upper.startsWith('SELECT')) {
                try {
                    await connection.query(statement);
                } catch (err) {
                    const msg = err.message || '';
                    if (msg.includes('already exists')) {
                        // 表已存在，正常情况
                    } else {
                        console.warn('执行 SQL 时警告:', msg.substring(0, 160));
                    }
                }
            }
        }

        console.log('✓ 数据库表结构初始化完成');
        return true;
    } catch (err) {
        console.error('✗ 数据库表结构初始化失败:', err.message);
        return false;
    } finally {
        if (connection) connection.release();
    }
}

/**
 * 导入初始数据（从 data_all 目录）
 */
async function importInitialData() {
    let connection;
    try {
        console.log('\n=== 第二步: 导入初始数据 ===');

        connection = await pool.getConnection();

        const dataAllPath = path.join(__dirname, '../database/data_all');
        
        // 导入顺序很重要！必须先导入主表，再导入外键关联表
        const importTasks = [
            // 真实数据（real/sql）
            { file: path.join(dataAllPath, 'real/sql/counties.sql'), table: 'counties' },
            { file: path.join(dataAllPath, 'real/sql/economic_indicators.sql'), table: 'economic_indicators' },
            { file: path.join(dataAllPath, 'real/sql/population_indicators.sql'), table: 'population_indicators' },
            { file: path.join(dataAllPath, 'real/sql/agriculture_indicators.sql'), table: 'agriculture_indicators' },
            { file: path.join(dataAllPath, 'real/sql/industry_trade_indicators.sql'), table: 'industry_trade_indicators' },
            { file: path.join(dataAllPath, 'real/sql/infrastructure_indicators.sql'), table: 'infrastructure_indicators' },
            { file: path.join(dataAllPath, 'real/sql/edu_culture_indicators.sql'), table: 'edu_culture_indicators' },
            { file: path.join(dataAllPath, 'real/sql/medical_social_indicators.sql'), table: 'medical_social_indicators' },
            // 模拟数据（fake/sql）
            { file: path.join(dataAllPath, 'fake/sql/policies.sql'), table: 'policies' },
            { file: path.join(dataAllPath, 'fake/sql/policy_resources.sql'), table: 'policy_resources' },
            { file: path.join(dataAllPath, 'fake/sql/interview_events.sql'), table: 'interview_events' },
            { file: path.join(dataAllPath, 'fake/sql/interviewees.sql'), table: 'interviewees' },
            { file: path.join(dataAllPath, 'fake/sql/interview_data.sql'), table: 'interview_data' },
            { file: path.join(dataAllPath, 'fake/sql/researchers.sql'), table: 'researchers' },
            { file: path.join(dataAllPath, 'fake/sql/rel_interviewee_event.sql'), table: 'rel_interviewee_event' },
            { file: path.join(dataAllPath, 'fake/sql/rel_data_researcher.sql'), table: 'rel_data_researcher' },
            { file: path.join(dataAllPath, 'fake/sql/rel_policy_county.sql'), table: 'rel_policy_county' },
        ];

        let successCount = 0;
        let skipCount = 0;
        let failCount = 0;

        for (const task of importTasks) {
            const result = await executeSqlFile(connection, task.file, task.table);
            if (result === true) {
                successCount++;
            } else if (result === false) {
                // 检查是否是因为已有数据而跳过
                try {
                    const [rows] = await connection.query(`SELECT COUNT(*) AS cnt FROM \`${task.table}\``);
                    if (rows[0].cnt > 0) {
                        skipCount++;
                    } else {
                        failCount++;
                    }
                } catch {
                    failCount++;
                }
            }
        }

        console.log(`\n✓ 数据导入完成: ${successCount} 个表成功, ${skipCount} 个表跳过, ${failCount} 个表失败`);
        return failCount === 0;
    } catch (err) {
        console.error('✗ 数据导入失败:', err.message);
        return false;
    } finally {
        if (connection) connection.release();
    }
}

/**
 * 完整的数据库初始化流程
 */
async function initDatabase() {
    try {
        console.log('\n╔════════════════════════════════════════════╗');
        console.log('║      CI-PAE 数据库初始化工具 v2.0        ║');
        console.log('╚════════════════════════════════════════════╝');

        // 第一步：初始化表结构
        const schemaResult = await initDatabaseSchema();
        if (!schemaResult) {
            console.error('\n✗ 表结构初始化失败，终止流程');
            return false;
        }

        // 第二步：导入初始数据
        const dataResult = await importInitialData();
        if (!dataResult) {
            console.warn('\n⚠ 数据导入部分失败，但表结构已就绪');
            return true; // 即使数据导入失败，表结构也已创建
        }

        console.log('\n╔════════════════════════════════════════════╗');
        console.log('║       ✓ 数据库初始化全部完成！           ║');
        console.log('╚════════════════════════════════════════════╝\n');
        return true;
    } catch (err) {
        console.error('\n✗ 数据库初始化过程出错:', err.message);
        return false;
    }
}

/**
 * 检查数据库是否已初始化
 */
async function checkDatabaseInitialized() {
    let connection;
    try {
        connection = await pool.getConnection();
        
        // 先确保数据库存在并选中
        await connection.query("CREATE DATABASE IF NOT EXISTS ci_pae DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        await connection.query("USE ci_pae");
        
        // 检查关键表是否存在
        const [rows] = await connection.query("SHOW TABLES LIKE 'users'");
        return rows.length > 0;
    } catch (err) {
        console.error('检查数据库状态失败:', err.message);
        return false;
    } finally {
        if (connection) connection.release();
    }
}

module.exports = { initDatabase, checkDatabaseInitialized };
