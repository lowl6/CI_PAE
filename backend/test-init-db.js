/**
 * 数据库初始化测试脚本
 * 运行: node backend/test-init-db.js
 */

const { initDatabase } = require('./config/initDb');
const pool = require('./config/db');

async function testInitialization() {
    console.log('开始测试数据库初始化...\n');

    try {
        // 执行初始化
        const result = await initDatabase();
        
        if (!result) {
            console.error('\n初始化失败！');
            process.exit(1);
        }

        // 验证数据
        console.log('\n=== 验证导入的数据 ===');
        
        const tables = [
            'counties',
            'economic_indicators',
            'population_indicators',
            'agriculture_indicators',
            'industry_trade_indicators',
            'infrastructure_indicators',
            'edu_culture_indicators',
            'medical_social_indicators',
            'policies',
            'policy_resources',
            'interviewees',
            'interview_events',
            'interview_data',
            'researchers',
            'rel_interviewee_event',
            'rel_data_researcher'
        ];

        console.log('\n表名\t\t\t\t记录数');
        console.log('─'.repeat(50));

        for (const table of tables) {
            try {
                const [rows] = await pool.query(`SELECT COUNT(*) AS cnt FROM \`${table}\``);
                const count = rows[0].cnt;
                const padding = '\t'.repeat(Math.max(1, 4 - Math.floor(table.length / 8)));
                console.log(`${table}${padding}${count}`);
            } catch (err) {
                console.error(`${table}\t\t\t✗ 错误: ${err.message}`);
            }
        }

        // 测试查询一些样本数据
        console.log('\n=== 样本数据验证 ===');
        
        const [counties] = await pool.query('SELECT county_name, province FROM counties LIMIT 5');
        console.log('\n前5个县:');
        counties.forEach(c => console.log(`  - ${c.county_name} (${c.province})`));

        const [policies] = await pool.query('SELECT policy_name, policy_type FROM policies LIMIT 3');
        console.log('\n前3个政策:');
        policies.forEach(p => console.log(`  - ${p.policy_name} [${p.policy_type}]`));

        console.log('\n✓ 所有测试通过！');
        
    } catch (err) {
        console.error('\n测试过程出错:', err.message);
        console.error(err.stack);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// 运行测试
testInitialization();
