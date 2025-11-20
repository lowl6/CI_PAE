# 数据库说明

## 项目概述

本项目基于 **832 工程系统**，用于管理和分析全国 832 个原国家级贫困县的脱贫攻坚数据。数据库名称为 `ci_pae`。

## 数据库结构

### 核心实体表

1. **县** - 832个原国家级贫困县基本信息
   - CountyID（主键）、县名、行政区划、所属省市
   - 脱贫状态、脱贫年份

### 经济与社会发展指标表（7类）

2. **核心经济指标表** - GDP、财政收入支出、居民收入等
3. **人口与户籍表** - 土地面积、户籍人口、户数等
4. **农业指标表** - 耕地面积、粮食产量、高标准农田等
5. **工业投资贸易表** - 工业企业数、固定资产投资、出口额等
6. **基础设施表** - 公路里程、通信用户数等
7. **教育科技文旅表** - 学校数、专利、体育场馆等
8. **医疗卫生社保表** - 床位数、医护人员、社保参保人数等

### 政策相关表

9. **政策** - 国家/省/市级脱贫攻坚政策
10. **政策投入资源** - 政策投入的资源/指标及影响信息

### 访谈调研相关表

11. **受访者** - 扶贫干部、脱贫户等受访者信息
12. **访谈事件** - 访谈活动记录
13. **访谈数据** - 访谈内容、关键词、经验总结
14. **调研者** - 调研团队成员信息

### 关联表

15. **受访者_访谈事件** - 多对多关系
16. **访谈数据_调研者** - 多对多关系

## 初始化数据库

### 方式一：自动化初始化（推荐）⭐

使用 Node.js 脚本自动完成表结构创建和数据导入：

```bash
# ⚠️ 如果之前已创建过数据库，必须先删除
mysql -u root -p -e "DROP DATABASE IF EXISTS ci_pae;"

# 在后端目录运行初始化脚本
cd backend
node test-init-db.js
```

**特点**：
- ✅ 自动检查数据是否已存在，避免重复插入
- ✅ 按正确顺序导入数据（先主表后外键表）
- ✅ 自动显示导入统计和验证结果
- ✅ 支持断点续传（已导入的表会自动跳过）

**数据来源**：
- `database/data_all/real/sql/` - 真实的832个贫困县数据
- `database/data_all/fake/sql/` - 模拟的访谈与政策数据

### 方式二：仅初始化表结构

如果只需要创建表结构，不导入数据：

```bash
mysql -u root -p < database/init.sql
```

### 方式三：手动导入数据（高级）

如需单独导入某个表的数据：

```bash
# 导入县基本信息
mysql -u root -p ci_pae < database/data_all/real/sql/counties.sql

# 导入经济指标
mysql -u root -p ci_pae < database/data_all/real/sql/economic_indicators.sql

# 导入政策数据
mysql -u root -p ci_pae < database/data_all/fake/sql/policies.sql
```

**PowerShell 环境**：
```powershell
Get-Content database\data_all\real\sql\counties.sql | mysql -u root -p ci_pae
```

## 初始数据说明

### 真实数据（real/sql）

- **counties.sql** - 832个原国家级贫困县基本信息
- **economic_indicators.sql** - 各县经济发展指标（GDP、收入等）
- **population_indicators.sql** - 人口与户籍数据
- **agriculture_indicators.sql** - 农业生产指标
- **industry_trade_indicators.sql** - 工业投资贸易数据
- **infrastructure_indicators.sql** - 基础设施建设数据
- **edu_culture_indicators.sql** - 教育科技文旅数据
- **medical_social_indicators.sql** - 医疗卫生社保数据

### 模拟数据（fake/sql）

- **policies.sql** - 扶贫政策记录（11条）
- **policy_resources.sql** - 政策投入资源
- **interviewees.sql** - 受访者信息
- **interview_events.sql** - 访谈事件
- **interview_data.sql** - 访谈内容数据
- **researchers.sql** - 调研人员信息
- **rel_interviewee_event.sql** - 受访者与事件关联
- **rel_data_researcher.sql** - 数据与调研者关联
- **rel_policy_county.sql** - 政策与县关联

## 数据重新导入

### 推荐方式：删除数据库重建

这是最简单、最安全的方式：

```bash
# 1. 删除整个数据库
mysql -u root -p -e "DROP DATABASE IF EXISTS ci_pae;"

# 2. 重新初始化（自动创建数据库、表结构并导入数据）
cd backend
node test-init-db.js
```

### 高级方式：清空单个表

如需重新导入某个表的数据（需注意外键约束顺序）：

```sql
-- 1. 清空表数据（保留结构）
TRUNCATE TABLE counties;

-- 2. 重新运行初始化脚本
-- 方式一：使用自动化脚本
node backend/test-init-db.js

-- 方式二：手动导入
mysql -u root -p ci_pae < database/data_all/real/sql/counties.sql
```

**注意外键约束**：清空数据时请按以下顺序：
1. 先清空关联表（rel_data_researcher, rel_interviewee_event, rel_policy_county）
2. 再清空外键表（interview_data, interviewees, interview_events, researchers, policy_resources, medical_social_indicators, edu_culture_indicators, infrastructure_indicators, industry_trade_indicators, agriculture_indicators, population_indicators, economic_indicators）
3. 最后清空主表（counties, policies）

**建议**：如果不确定顺序，直接删除数据库重建更安全快捷。

## 数据备份与恢复

### 备份整个数据库

```bash
mysqldump -u root -p ci_pae > backup_$(date +%Y%m%d).sql
```

### 恢复数据库

```bash
mysql -u root -p ci_pae < backup.sql
```

### 仅备份结构（不含数据）

```bash
mysqldump -u root -p --no-data ci_pae > schema_only.sql
```

## 连接配置

数据库连接配置位于 `config/index.js`，通过环境变量 `.env` 配置：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ci_pae
```

## 注意事项

- ✅ **已提交到 Git**：`init.sql` 文件（表结构定义）、`data_all/` 目录（示例数据）
- ❌ **不要提交**：`.env` 文件、生产环境真实数据、数据库备份文件
- 🔒 生产环境务必修改默认密码和敏感信息
- 📊 定期备份生产数据库
- 🌐 SQL 脚本使用 UTF-8 编码
