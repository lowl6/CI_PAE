# 数据库初始化升级说明

## 📋 改动概览

本次更新将数据库初始化数据从硬编码的测试数据更换为 `backend/database/data_all` 目录中的完整数据集，并增强了数据检查机制以避免重复插入。

## 🎯 主要改动

### 1. 更新 `backend/database/init.sql`
- **移除**：原有的硬编码测试数据（3个县样本）
- **新增**：指向 `data_all` 目录的数据源说明和导入命令注释
- **保留**：完整的表结构定义（CREATE TABLE 语句）

### 2. 重构 `backend/config/initDb.js`
**新功能**：
- ✅ 分两步初始化：先创建表结构，再导入数据
- ✅ 智能检测表是否已有数据，避免重复插入
- ✅ 按正确顺序导入（先主表后外键表）
- ✅ 支持事务（每个SQL文件包含 START TRANSACTION/COMMIT）
- ✅ 详细的导入进度和结果统计

**导入顺序**：
```
1. 真实数据 (real/sql)：
   counties → economic_indicators → population_indicators 
   → agriculture_indicators → industry_trade_indicators 
   → infrastructure_indicators → edu_culture_indicators 
   → medical_social_indicators

2. 模拟数据 (fake/sql)：
   policies → policy_resources → interview_events 
   → interviewees → interview_data → researchers 
   → rel_interviewee_event → rel_data_researcher
```

### 3. 新增 `backend/test-init-db.js`
独立的测试脚本，用于：
- 执行完整的数据库初始化流程
- 验证各表的数据记录数
- 显示样本数据进行快速检查

### 4. 更新 `backend/database/README.md`
- 添加三种初始化方式的详细说明
- 补充数据源文件说明（real/fake 目录结构）
- 添加数据重新导入和清空操作指南

## 📊 数据规模

### 真实数据 (real/sql)
- **counties.sql**: 832个贫困县基本信息
- **各类 indicators**: 多年度多维度指标数据

### 模拟数据 (fake/sql)
- **policies.sql**: 11条政策记录
- **访谈相关**: 完整的访谈调研数据集

## 🚀 使用方法

### 快速开始（推荐）

```bash
# 1. 配置数据库连接（如果还没配置）
cp .env.example .env
# 编辑 .env 文件，填入你的数据库账号密码

# 2. 删除旧数据库（如果存在）
mysql -u root -p -e "DROP DATABASE IF EXISTS ci_pae;"

# 3. 进入后端目录并运行初始化脚本
cd backend
node test-init-db.js
```

### ⚠️ 重要提示

如果你之前已经创建过 `ci_pae` 数据库，**必须先删除旧数据库**，否则可能出现数据不一致或外键冲突问题。

**删除旧数据库的两种方式：**

```bash
# 方式1: 命令行快速删除
mysql -u root -p -e "DROP DATABASE IF EXISTS ci_pae;"

# 方式2: 登录MySQL后删除
mysql -u root -p
mysql> DROP DATABASE IF EXISTS ci_pae;
mysql> EXIT;
```

删除后再运行 `node test-init-db.js` 即可完成全新初始化。

### 预期输出

```
╔════════════════════════════════════════════╗
║      CI-PAE 数据库初始化工具 v2.0        ║
╚════════════════════════════════════════════╝

=== 第一步: 初始化数据库表结构 ===
✓ 数据库表结构初始化完成

=== 第二步: 导入初始数据 ===
  ✓ 导入 counties: 832 条数据
  ✓ 导入 economic_indicators: XXXX 条数据
  ...
  
✓ 数据导入完成: 16 个表成功, 0 个表跳过, 0 个表失败

=== 验证导入的数据 ===
表名                           记录数
──────────────────────────────────────────────
counties                      832
economic_indicators           XXXX
...

╔════════════════════════════════════════════╗
║       ✓ 数据库初始化全部完成！           ║
╚════════════════════════════════════════════╝
```

## 🔄 重新导入数据

### 方式1: 删除数据库重建（推荐）

**这是最干净、最安全的方式，避免外键冲突和数据不一致：**

```bash
# 1. 删除整个数据库
mysql -u root -p -e "DROP DATABASE IF EXISTS ci_pae;"

# 2. 重新初始化（会自动创建数据库、表结构和导入数据）
cd backend
node test-init-db.js
```

### 方式2: 清空表并重新导入（高级）

如果只想清空数据而保留数据库，需要按**正确顺序**清空表（先关联表，后主表）：

```sql
-- 1. 清空表（必须按此顺序避免外键约束错误）
-- 关联表
TRUNCATE TABLE rel_data_researcher;
TRUNCATE TABLE rel_interviewee_event;

-- 外键表
TRUNCATE TABLE interview_data;
TRUNCATE TABLE interviewees;
TRUNCATE TABLE interview_events;
TRUNCATE TABLE researchers;
TRUNCATE TABLE policy_resources;
TRUNCATE TABLE policies;
TRUNCATE TABLE medical_social_indicators;
TRUNCATE TABLE edu_culture_indicators;
TRUNCATE TABLE infrastructure_indicators;
TRUNCATE TABLE industry_trade_indicators;
TRUNCATE TABLE agriculture_indicators;
TRUNCATE TABLE population_indicators;
TRUNCATE TABLE economic_indicators;

-- 主表
TRUNCATE TABLE counties;

-- 2. 重新运行初始化
-- EXIT; （退出MySQL）
cd backend
node test-init-db.js
```

### ⚠️ 建议

**推荐使用方式1（删除数据库重建）**，因为：
- ✅ 简单快速，一条命令解决
- ✅ 保证数据完全一致
- ✅ 避免外键约束问题
- ✅ 不需要记住表的清空顺序

## ⚙️ 技术细节

### 数据检查机制

在插入数据前，`initDb.js` 会：
1. 执行 `SELECT COUNT(*) FROM table_name`
2. 如果 count > 0，则跳过该表的数据导入
3. 如果 count = 0，则执行整个 SQL 文件

### 事务处理

每个 SQL 文件都包含：
```sql
START TRANSACTION;
INSERT INTO table VALUES (...);
INSERT INTO table VALUES (...);
...
COMMIT;
```

确保数据导入的原子性（全部成功或全部失败）。

### 错误处理

- 表不存在：继续执行（由 init.sql 创建）
- 外键约束失败：记录警告，继续下一个表
- 重复键错误：跳过，视为已存在

## 📝 注意事项

1. **首次运行**：会自动创建数据库、所有表并导入全部数据
2. **重复运行**：只会导入空表，已有数据的表会被跳过
3. **数据冲突**：如果遇到外键约束或数据不一致问题，建议删除整个数据库重建
4. **外键顺序**：手动清空数据时必须先清空关联表，后清空主表
5. **推荐做法**：每次重新初始化前先执行 `DROP DATABASE IF EXISTS ci_pae;`

## 🐛 故障排查

### 问题：连接数据库失败
```
✗ MySQL 数据库连接失败
```

**解决方案**：
1. 检查 MySQL 服务是否运行
2. 验证 `.env` 文件中的数据库配置
3. 确认数据库用户有足够权限

### 问题：外键约束失败
```
外键约束失败，可能插入顺序问题
```

**解决方案**：
- 检查主表数据是否已导入（如 counties）
- 确认数据文件中的外键值存在于主表中

### 问题：数据重复导入
```
Duplicate entry 'XXX' for key 'PRIMARY'
```

**解决方案**：
- 正常情况下不会发生（有数据检查机制）
- 如果发生，说明表有数据但检查失败
- 可手动清空表后重新导入

## 🔗 相关文件

- `backend/database/init.sql` - 表结构定义
- `backend/config/initDb.js` - 初始化逻辑
- `backend/config/db.js` - 数据库连接池
- `backend/test-init-db.js` - 测试脚本
- `backend/database/README.md` - 数据库文档
- `backend/database/data_all/` - 数据源目录
  - `real/sql/` - 真实832县数据
  - `fake/sql/` - 模拟访谈政策数据

## ✅ 测试清单

- [x] 表结构正确创建
- [x] 数据按顺序导入
- [x] 重复运行不会重复插入
- [x] 外键约束正确处理
- [x] 统计信息准确显示
- [x] 样本数据可以查询

## 💡 后续建议

1. 定期备份生产数据库
2. 监控数据导入日志
3. 考虑添加数据版本管理
4. 为大表添加索引优化查询性能
