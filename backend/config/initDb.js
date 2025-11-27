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
 * 初始化数据库用户和权限
 */
async function initPrivileges(connection) {
    console.log('\n=== 配置数据库用户权限 ===');
    const dbName = 'ci_pae';
    
    // 定义用户及其对应的密码环境变量Key
    const users = [
        { name: 'researcher', pwd: process.env.DB_PWD_RESEARCHER },
        { name: 'analyst', pwd: process.env.DB_PWD_ANALYST },
        { name: 'policy_admin', pwd: process.env.DB_PWD_POLICY_ADMIN },
        { name: 'statistician', pwd: process.env.DB_PWD_STATISTICIAN },
        { name: 'user', pwd: process.env.DB_PWD_USER }
    ];

    for (const u of users) {
        if (!u.pwd) {
            console.warn(`  ⚠ 跳过创建用户 ${u.name}: 未在 .env 配置密码`);
            continue;
        }
        // 重建用户 (先删除再创建，确保清除旧的残留权限)
        try {
            await connection.query(`DROP USER IF EXISTS '${u.name}'@'%';`);
            await connection.query(`CREATE USER '${u.name}'@'%' IDENTIFIED BY '${u.pwd}';`);
        } catch (err) {
            console.error(`  ✗ 重建用户 ${u.name} 失败:`, err.message);
        }
    }

    // 定义所有指标表名
    const indicatorTables = [
        'economic_indicators',
        'population_indicators',
        'agriculture_indicators',
        'industry_trade_indicators',
        'infrastructure_indicators',
        'edu_culture_indicators',
        'medical_social_indicators'
    ];

    const publicTables = [
        'counties',
        // 指标表
        ...indicatorTables,
        // 政策相关
        'policies', 'policy_resources', 'rel_policy_county', 
        'policy_keywords', 'policy_interview_cache',
        // 访谈相关
        'interviewees', 'interview_events', 'interview_data', 
        'researchers', 'rel_interviewee_event', 'rel_data_researcher'
    ];

    // 生成基础读权限 SQL (所有角色都需要读取业务数据)
    // 注意：必须逐表授权，不能使用 db.*，否则无法排除 users 表
    const allRoles = ['researcher', 'analyst', 'policy_admin', 'statistician', 'user'];
    const baseSelectGrants = [];
    
    for (const role of allRoles) {
        for (const table of publicTables) {
            // 使用 IGNORE 避免表不存在时报错(比如视图可能未创建)
            // 但 GRANT 语句不支持 IGNORE，我们只能在执行时捕获错误，或者确保表存在
            // 这里假设表都已存在
            baseSelectGrants.push(`GRANT SELECT ON ${dbName}.${table} TO '${role}'@'%'`);
        }
    }

    // 定义权限 SQL
    const grants = [
        // 0. 基础读权限 (替换原来的 GRANT SELECT ON *.*)
        ...baseSelectGrants,

        // 1. 调研员: 写访谈相关
        `GRANT INSERT, UPDATE, DELETE ON ${dbName}.interview_data TO 'researcher'@'%'`,
        `GRANT INSERT, UPDATE, DELETE ON ${dbName}.interview_events TO 'researcher'@'%'`,
        `GRANT INSERT, UPDATE, DELETE ON ${dbName}.interviewees TO 'researcher'@'%'`,
        `GRANT INSERT, UPDATE, DELETE ON ${dbName}.researchers TO 'researcher'@'%'`,
        `GRANT INSERT, UPDATE, DELETE ON ${dbName}.rel_interviewee_event TO 'researcher'@'%'`,
        `GRANT INSERT, UPDATE, DELETE ON ${dbName}.rel_data_researcher TO 'researcher'@'%'`,

        // 2. 数据分析师: (已通过 baseSelectGrants 获得读权限)

        // 3. 政策管理员: 写政策相关
        `GRANT INSERT, UPDATE, DELETE ON ${dbName}.policies TO 'policy_admin'@'%'`,
        `GRANT INSERT, UPDATE, DELETE ON ${dbName}.policy_resources TO 'policy_admin'@'%'`,
        `GRANT INSERT, UPDATE, DELETE ON ${dbName}.rel_policy_county TO 'policy_admin'@'%'`,
        `GRANT INSERT, UPDATE, DELETE ON ${dbName}.policy_keywords TO 'policy_admin'@'%'`, 
        `GRANT INSERT, UPDATE, DELETE ON ${dbName}.policy_interview_cache TO 'policy_admin'@'%'`,

        // 4. 数据统计员: 写指标相关
        ...indicatorTables.map(tb => `GRANT INSERT, UPDATE, DELETE ON ${dbName}.${tb} TO 'statistician'@'%'`),

        // 5. 普通用户: (已通过 baseSelectGrants 获得读权限)
    ];

    for (const sql of grants) {
        try {
            await connection.query(sql);
        } catch (err) {
            console.warn(`  ⚠ 授权失败: ${sql} -> ${err.message}`);
        }
    }
    
    await connection.query('FLUSH PRIVILEGES;');
    console.log('  ✓ 用户权限配置完成');
}

/**
 * 初始化应用内的默认管理员账号
 */
async function seedAdminUser(connection) {
    console.log('\n=== 植入默认管理员账号 ===');
    const adminUser = 'admin';
    const adminPwd = process.env.ADMIN_INIT_PASSWORD || 'admin123';
    
    try {
        // 检查是否存在
        const [rows] = await connection.query(
            `SELECT id FROM users WHERE username = ? AND role = ?`, 
            [adminUser, 'admin']
        );
        if (rows.length === 0) {
            await connection.query(
                `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
                [adminUser, adminPwd, 'admin']
            );
            console.log(`  ✓ 创建应用管理员: ${adminUser} / ${adminPwd}`);
        } else {
            console.log(`  ⏭ 应用管理员已存在`);
        }
    } catch (err) {
        console.error('  ✗ 植入管理员失败:', err.message);
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
 * 执行数据库迁移（migrations 目录中 *.sql）
 */
async function runMigrations() {
    let connection;
    try {
        console.log('\n=== 第三步: 执行数据库迁移脚本 ===');
        connection = await pool.getConnection();
        await connection.query('USE ci_pae');

        const migrationsDir = path.join(__dirname, '../database/migrations');
        if (!fs.existsSync(migrationsDir)) {
            console.log('无 migrations 目录，跳过');
            return true;
        }

        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort(); // 按文件名顺序执行

        if (files.length === 0) {
            console.log('未找到任何迁移脚本 (*.sql)，跳过');
            return true;
        }

        for (const file of files) {
            const fullPath = path.join(migrationsDir, file);
            console.log(`→ 执行迁移: ${file}`);
            try {
                const raw = fs.readFileSync(fullPath, 'utf8');
                // 去除注释（保留换行便于后续分割）
                const cleaned = raw
                    .replace(/--[^\n]*$/gm, '') // 行尾注释
                    .replace(/\/\*[^]*?\*\//g, '')
                    .replace(/\r\n/g, '\n');
                
                // 按 ";\n" 分割（要求分号后有换行），避免拆散多行语句
                const statements = cleaned
                    .split(/;\s*\n/)
                    .map(s => s.trim())
                    .filter(s => s.length > 0 && !s.match(/^(USE |SET |DELIMITER)/i));
                
                for (const stmt of statements) {
                    const execStmt = stmt.endsWith(';') ? stmt.slice(0, -1).trim() : stmt.trim();
                    try {
                        await connection.query(execStmt);
                    } catch (e) {
                        const msg = e.message || '';
                        // 幂等处理：列/索引已存在视为成功
                        if (msg.includes('Duplicate column') || msg.includes('Duplicate key name') || 
                            msg.includes('already exists') || msg.includes('exists')) {
                            console.log(`  ⏭ 跳过语句 (幂等): ${msg.split('\n')[0]}`);
                        } else {
                            console.warn(`  ⚠ 语句执行警告: ${msg.substring(0,160)}`);
                            console.warn(`    ↳ 语句片段: ${execStmt.substring(0,100)}...`);
                        }
                    }
                }
                console.log(`  ✓ 迁移完成: ${file}`);
            } catch (fileErr) {
                console.error(`  ✗ 迁移失败: ${file} -> ${fileErr.message}`);
            }
        }
        // 自愈：关键表缺失时尝试直接创建
        const ensureTable = async (tableName, createSQL) => {
            try {
                const [chk] = await connection.query(`SHOW TABLES LIKE '${tableName}'`);
                if (chk.length === 0) {
                    console.log(`  ⚠ 检测到缺失表 ${tableName}，尝试补建...`);
                    await connection.query(createSQL);
                    console.log(`  ✓ 补建成功: ${tableName}`);
                }
            } catch (e) {
                console.warn(`  ✗ 补建 ${tableName} 失败: ${e.message}`);
            }
        }; 
        console.log('✓ 所有迁移脚本执行完毕');
        return true;
    } catch (err) {
        console.error('✗ 执行迁移脚本失败:', err.message);
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
        console.log('║      CI-PAE 数据库初始化工具 v2.5        ║');
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
        }

        // 第三步：执行迁移脚本
        const migrationsResult = await runMigrations();
        if (!migrationsResult) {
            console.warn('\n⚠ 迁移脚本存在错误，请检查日志');
        }

        // 【新增】初始化权限和默认账号
        console.log('\n=== 第四步: 配置权限与账号 ===');
        let connection = await pool.getConnection();
        
        try {
            await initPrivileges(connection);
            await seedAdminUser(connection);
        } finally {
            connection.release();
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

module.exports = { initDatabase, checkDatabaseInitialized, runMigrations };
