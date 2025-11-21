# 1. 删除整个数据库
mysql -u root -p -e "DROP DATABASE IF EXISTS ci_pae;"# 政策可视化系统实现总结

删除后重启后端即可
## 📋 系统概述

政策可视化系统是 CI-PAE 项目的核心功能模块，提供基于 D3.js 力导向布局的政策气泡可视化，并结合口述史（访谈）数据实现多维分析与关联洞察。

---

## 🗄️ 数据库层

### 1. 自动迁移与结构增强（v1.2.0 更新）
**迁移目录**: `backend/database/migrations/`

初始化入口 `initDb.js` 已在第三步自动执行所有迁移脚本：
1. 创建/检查基础库与表结构（`init.sql`）
2. 导入初始数据（`data_all/real` 与 `data_all/fake`）
3. 自动遍历执行 `migrations` 下所有 `.sql` 按文件名排序（幂等：已存在/重复键跳过）

#### 核心迁移脚本：`add_policy_enhancements.sql`

**数据库改动详解：**

##### A. 表结构增强

1. **`rel_policy_county` 表扩展**（政策-县关联表）
   ```sql
   ALTER TABLE rel_policy_county ADD COLUMN strength DECIMAL(3,2) DEFAULT 1.0;
   ALTER TABLE rel_policy_county ADD COLUMN adopt_year INT DEFAULT NULL;
   ALTER TABLE rel_policy_county ADD COLUMN notes TEXT DEFAULT NULL;
   ```
   - `strength`: 关联强度(0-1)，基于访谈提及频率计算
     - 计算逻辑：`0.5 + 访谈数 × 0.1`，上限1.0
     - 无访谈数据时默认0.7
   - `adopt_year`: 该县采纳政策的年份
   - `notes`: 备注信息

2. **`policy_keywords` 表**（政策关键词表）
   ```sql
   CREATE TABLE policy_keywords (
     policy_id VARCHAR(50),
     keyword VARCHAR(100),
     weight DECIMAL(3,2) DEFAULT 1.0,
     PRIMARY KEY (policy_id, keyword)
   );
   ```
   - 存储从政策摘要中提取的关键词
   - `weight`: 关键词权重(0-1)，用于相关度计算
   - 示例数据：('POL001', '马铃薯', 1.0), ('POL001', '种薯', 0.9)

3. **`policy_interview_cache` 表**（政策-访谈关联缓存表）
   ```sql
   CREATE TABLE policy_interview_cache (
     policy_id VARCHAR(50),
     data_id VARCHAR(50),
     county_id VARCHAR(50),
     relevance_score DECIMAL(4,2) DEFAULT 1.0,
     matched_keywords TEXT,
     updated_at TIMESTAMP,
     PRIMARY KEY (policy_id, data_id)
   );
   ```
   - **核心作用**：预计算政策-访谈相关度，避免实时复杂查询
   - `relevance_score`: 相关度评分(0-10分制)
   - `matched_keywords`: 匹配到的关键词列表（逗号分隔）

##### B. 相关度计算逻辑

**相关度评分公式**：
```
relevance_score = (匹配关键词数量 × 1.5) + 3.0
```

**匹配规则**：
- 在访谈 `keywords` 字段中匹配：`LIKE '%关键词%'`
- 在访谈 `content` 全文中匹配：`LIKE '%关键词%'`
- 多个关键词匹配时累加计分

**示例**：
- 访谈提到2个政策关键词：`2 × 1.5 + 3.0 = 6.0分`
- 访谈提到4个政策关键词：`4 × 1.5 + 3.0 = 9.0分`

**缓存填充SQL**（简化版）：
```sql
INSERT INTO policy_interview_cache (policy_id, data_id, relevance_score, matched_keywords)
SELECT 
  rpc.policy_id,
  id.data_id,
  (SELECT COUNT(*) * 1.5 FROM policy_keywords pk 
   WHERE pk.policy_id = rpc.policy_id 
   AND (id.keywords LIKE CONCAT('%', pk.keyword, '%') 
        OR id.content LIKE CONCAT('%', pk.keyword, '%'))
  ) + 3.0 as relevance_score,
  (SELECT GROUP_CONCAT(pk.keyword) FROM policy_keywords pk 
   WHERE pk.policy_id = rpc.policy_id 
   AND (id.keywords LIKE CONCAT('%', pk.keyword, '%') 
        OR id.content LIKE CONCAT('%', pk.keyword, '%'))
  ) as matched_keywords
FROM rel_policy_county rpc
JOIN ... -- 通过县域关联访谈
```

##### C. `policy_resources` 表增强

**新增字段**（资源投入量化）：
```sql
ALTER TABLE policy_resources ADD COLUMN amount DECIMAL(12,2);
ALTER TABLE policy_resources ADD COLUMN beneficiary_count INT;
ALTER TABLE policy_resources ADD COLUMN year INT;
```
- `amount`: 资金投入金额（单位：万元）
- `beneficiary_count`: 受益人数
- `year`: 投入年份

##### D. `v_policy_stats` 视图（政策统计视图）

**设计理念**：使用子查询替代 LEFT JOIN + GROUP BY，避免笛卡尔积导致的统计错误

```sql
CREATE OR REPLACE VIEW v_policy_stats AS
SELECT 
  p.policy_id,
  p.policy_name,
  p.policy_type,
  p.department,
  p.issue_date,
  p.implementation_date,
  p.status,
  p.summary,
  -- 子查询1: 覆盖县数（避免JOIN导致的重复计数）
  (SELECT COUNT(DISTINCT rpc_inner.county_id) 
   FROM rel_policy_county rpc_inner 
   WHERE rpc_inner.policy_id = p.policy_id
  ) as county_count,
  -- 子查询2: 资源投入数
  (SELECT COUNT(DISTINCT pr_inner.resource_id) 
   FROM policy_resources pr_inner 
   WHERE pr_inner.policy_id = p.policy_id
  ) as resource_count,
  -- 子查询3: 关联访谈数（从缓存表读取，性能优化）
  (SELECT COUNT(DISTINCT pic.data_id)
   FROM policy_interview_cache pic
   WHERE pic.policy_id = p.policy_id
  ) as interview_count,
  -- 子查询4: 平均关联强度
  (SELECT AVG(rpc_strength.strength) 
   FROM rel_policy_county rpc_strength 
   WHERE rpc_strength.policy_id = p.policy_id
  ) as avg_strength,
  -- 子查询5: 最早和最晚采纳年份
  (SELECT MIN(rpc_adopt.adopt_year) 
   FROM rel_policy_county rpc_adopt 
   WHERE rpc_adopt.policy_id = p.policy_id
  ) as first_adopt_year,
  (SELECT MAX(rpc_adopt.adopt_year) 
   FROM rel_policy_county rpc_adopt 
   WHERE rpc_adopt.policy_id = p.policy_id
  ) as last_adopt_year
FROM policies p;
```

**为什么使用子查询？**
- 传统 `LEFT JOIN + GROUP BY` 会产生笛卡尔积：政策 × 县 × 资源 × 访谈
- 示例：1个政策 × 3个县 × 2个资源 = 6行记录 → `COUNT(DISTINCT county_id)` 仍正确，但性能差
- 子查询方案：每个维度独立统计，避免多表JOIN膨胀

##### E. 索引优化

**新增索引**：
```sql
CREATE INDEX idx_status ON policies(status);
CREATE INDEX idx_relevance ON policy_interview_cache(relevance_score);
```

**已有索引**（`init.sql` 中创建）：
- `idx_policy_type`: 加速政策类型筛选
- `idx_issue_date`: 加速时间范围查询

#### 手动执行迁移（可选）

```powershell
# 方法1: PowerShell管道（推荐）
Get-Content backend/database/migrations/add_policy_enhancements.sql | mysql -u root -p ci_pae

# 方法2: MySQL source命令
mysql -u root -p ci_pae -e "source backend/database/migrations/add_policy_enhancements.sql"
```

#### 验证迁移结果

```sql
-- 检查新增字段
DESC rel_policy_county;  -- 应显示 strength, adopt_year, notes
DESC policy_resources;   -- 应显示 amount, beneficiary_count, year

-- 检查新增表
SHOW TABLES LIKE 'policy%';  -- 应显示 policy_keywords, policy_interview_cache

-- 检查视图
SHOW CREATE VIEW v_policy_stats;

-- 检查数据
SELECT COUNT(*) FROM policy_keywords;           -- 应有9条关键词
SELECT COUNT(*) FROM policy_interview_cache;    -- 应有28条缓存记录
SELECT * FROM v_policy_stats LIMIT 3;           -- 应显示完整统计数据

-- 检查相关度评分
SELECT policy_id, data_id, relevance_score, matched_keywords 
FROM policy_interview_cache 
WHERE relevance_score > 5.0 
ORDER BY relevance_score DESC 
LIMIT 5;
```

### 2. 初始化脚本与数据源
**文件**: `backend/database/init.sql` & `backend/config/initDb.js`
`initDb.js` 完整流程：表结构 → 数据导入 → 迁移执行。支持幂等与跳过已存在数据。

---

## 🔧 后端服务层

### 3. 政策服务模块
**文件**: `backend/services/policyService.js`

主要方法：
- `getPolicyList(filters)`：从视图 `v_policy_stats` 读取气泡数据，可按类型、城市、年份、关键词筛选。
- `getPolicyDetail(policyId)`：多表组合，返回政策核心、覆盖县、资源指标、访谈列表、指标影响（预留）。
- `getPolicyStats()`：聚合统计（类型、年份、城市、覆盖度）。
- `getInterviewFullContent(dataId)`：返回单条访谈完整信息（v1.1.0：一访谈一受访者，兼容旧多受访者返回数组）。
- `getCities()`：提取所有城市列表。

返回结构示例：
```javascript
{
  policy: {},
  counties: [],
  resources: [],
  interviews: [],
  indicator_effects: []
}
```

### 4. 访谈获取逻辑（v1.1.0 更新）
- 去除受访者 `GROUP_CONCAT` 聚合，接口按一访谈一受访者返回。
- 控制器层将 `event_date` 兼容映射为 `interview_date`。
- 若出现旧多受访者模式（数组返回），前端仅取第一条显示。

### 5. 政策控制器与路由
**文件**: `backend/controllers/policyController.js`, `backend/routes/*`

端点：
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/policies` | 列表筛选 |
| GET | `/api/policies/stats` | 统计数据 |
| GET | `/api/policies/cities` | 城市列表 |
| GET | `/api/policies/:id` | 政策详情 |
| GET | `/api/policies/interviews/:dataId` | 访谈内容（event_date→interview_date） |

错误统一封装：
```javascript
res.json({ ok: true, data }); // 成功
res.status(500).json({ ok: false, error: err.message }); // 失败
```

---

## 🎨 前端实现

### 6. API 客户端
**文件**: `frontend/src/api/policy.js`
方法：`getPolicies` / `getPolicyDetail` / `getPolicyStats` / `getInterviewFullContent` / `getCities`

调用示例：
```javascript
const res = await getPolicies({ type: 'agriculture', city: '呼和浩特市', page: 1, pageSize: 50 });
if (res.ok) console.log(res.data.policies);
```

### 7. 力导向气泡组件
**文件**: `frontend/src/components/PolicyBubbles.vue`
特性：平方根半径映射、类型颜色、辉光 + 脉冲动画、碰撞力 & 居中力、拖拽交互、tooltip。

### 8. 政策详情抽屉
**文件**: `frontend/src/components/PolicyDetailDrawer.vue`
标签页：概览 / 覆盖县 / 资源指标 / 相关访谈 / 指标影响。监听 `policyId` 自动加载。

### 9. 访谈卡片组件（更新）
**文件**: `frontend/src/components/InterviewCard.vue`
更新内容：移除相关度展示；关键词优先使用 `matched_keywords`；日期字段统一使用 `interview_date`；单受访者模式。

### 10. 指标影响图表
**文件**: `frontend/src/components/IndicatorEffectChart.vue`
柱 + 折线组合，变化率标注，响应式 resize。当前可能无真实数据（占位）。

### 11. 经验模式库页面
**文件**: `frontend/src/views/Patterns.vue`
包含筛选工具栏 + 统计卡片 + 气泡图 + 详情抽屉；监听筛选条件动态刷新。

---

## 📝 访谈接口（单受访者模式）
### GET `/api/policies/interviews/:dataId`
对象形式：
```json
{
  "ok": true,
  "data": {
    "data_id": "DAT001",
    "interviewee_name": "张三",
    "identity": "村干部",
    "unit": "村委会",
    "county_name": "新城区",
    "city": "呼和浩特市",
    "interview_date": "2018-06-15",
    "researcher_name": "李四",
    "content": "完整访谈内容...",
    "keywords": "扶贫,产业,收入"
  }
}
```
兼容旧数组：
```json
{
  "ok": true,
  "data": [ { "data_id": "DAT001", "interviewee_name": "张三" } ]
}
```
前端已做：若 `data` 数组 → 取首元素。

---

## 🚀 初始化与运行

### 步骤 1：可选重建数据库
```powershell
# 完全重建（删除所有数据）
mysql -u root -plcx666666 -e "DROP DATABASE IF EXISTS ci_pae;"
```

### 步骤 2：启动后端（触发自动迁移）
```powershell
cd backend
npm run dev
```
**自动执行流程**：
1. 检查数据库是否存在，不存在则创建
2. 执行 `init.sql`：创建所有基础表结构
3. 导入 `data_all/real` 和 `data_all/fake` 数据
4. 自动执行 `migrations/` 目录下的所有 `.sql` 文件
5. 迁移脚本是幂等的：重复执行不会报错

**验证迁移成功**：
- 终端显示：`✓ 政策可视化数据库增强完成！`
- 统计视图记录数：11条
- 关联缓存记录数：28条

### 步骤 3：启动前端
```powershell
cd frontend
npm install  # 首次运行需要安装依赖
npm run dev
```
**访问地址**：`http://localhost:5174`

### 步骤 4：功能验证清单

#### 4.1 气泡可视化验证
- [ ] 打开 `http://localhost:5174/patterns`
- [ ] 统计卡片显示数据（政策总数、覆盖县数、平均覆盖度、访谈记录）
- [ ] 气泡图渲染，大小反映覆盖县数
- [ ] 有访谈的气泡显示辉光效果
- [ ] 悬浮显示tooltip（政策名称、类型、覆盖县数、访谈数）

#### 4.2 筛选功能验证
- [ ] 政策类型下拉显示类型+数量
- [ ] 城市下拉显示所有城市
- [ ] 发布年份下拉显示年份+数量
- [ ] 关键词搜索实时查询
- [ ] 重置按钮清空所有筛选条件

#### 4.3 详情抽屉验证
- [ ] 点击气泡触发破碎粒子动画
- [ ] 中央弹出详情模态框（1200px宽）
- [ ] **Tab 1 - 概览**：显示政策基本信息
- [ ] **Tab 2 - 覆盖县**：显示县列表，含强度标签和采纳年份
- [ ] **Tab 3 - 资源投入**：显示资金金额、受益人数、投入年份
- [ ] **Tab 4 - 相关访谈**：按相关度排序，显示匹配关键词
- [ ] **Tab 5 - 指标影响**：显示6个独立图表，每个指标前后对比

#### 4.4 访谈详情验证
- [ ] 点击"查看完整内容"打开访谈弹窗
- [ ] 显示受访者姓名、身份、单位、县名
- [ ] 显示访谈日期（格式正确）
- [ ] 显示调研员姓名
- [ ] 显示完整访谈内容和关键词

#### 4.5 指标图表验证
- [ ] 每个指标有独立图表（避免数量级混合）
- [ ] 显示指标图标（📊 GDP、🌾 粮食、🛣️ 公路等）
- [ ] 显示变化百分比标签（红色↓或绿色↑）
- [ ] 柱状图显示前期/后期对比
- [ ] 悬浮显示具体数值和变化幅度

#### 4.6 控制台检查
- [ ] 无 500 错误
- [ ] 无 undefined 字段警告
- [ ] Network 面板所有 API 返回 `{ok: true}`

---

## 🐛 常见问题排查

| 问题 | 症状 | 排查点 | 解决方案 |
|------|------|--------|----------|
| **气泡数量错误** | 显示的政策数与预期不符 | 1. 检查筛选条件<br>2. 查看Network面板`/api/policies`响应 | 检查视图数据：`SELECT * FROM v_policy_stats;` |
| **访谈相关度全为0** | 所有访谈显示0分 | 1. `policy_interview_cache` 表是否有数据<br>2. 关键词是否匹配 | 手动执行：`SELECT * FROM policy_interview_cache WHERE relevance_score > 4;` |
| **指标影响无数据** | Tab 5显示"暂无指标影响数据" | 1. 政策是否覆盖县<br>2. 指标表是否有数据 | 检查：`SELECT COUNT(*) FROM economic_indicators WHERE county_id IN (SELECT county_id FROM rel_policy_county WHERE policy_id='POL001');` |
| **迁移脚本重复执行报错** | ALTER TABLE Duplicate column | 正常（幂等设计） | initDb.js 已捕获错误，可忽略 |
| **强度字段全为NULL** | 县列表不显示强度标签 | 迁移的步骤7未执行 | 手动执行：`UPDATE rel_policy_county SET strength = 0.7 WHERE strength IS NULL;` |
| **资源金额不显示** | 资源列表只有文件名 | `policy_resources` 表未添加新字段 | 检查：`DESC policy_resources;` 应有 amount, beneficiary_count, year |
| **点击×出现空白闪烁** | 关闭模态框时短暂空白 | `handleClose` 立即清空数据 | 已修复：延迟300ms清空 `policyDetail.value` |
| **图表不同数量级混合** | GDP(亿)和收入(元)在同一图 | 旧版4分类图表 | 已修复：v1.2.0 改为每指标独立图表 |

---

## 📊 性能与扩展
数据库：索引齐备后考虑缓存热点政策详情；定期刷新 `policy_interview_cache`。
前端：>200 气泡启用 Canvas；ECharts/Drawer 组件惰性加载。
后端：多段查询可拆分为并行 Promise.all；可引入 Redis。

---

## 🔐 安全
- 参数化查询防 SQL 注入
- Vue 模板默认转义防 XSS
- 未来需：文件下载路径校验、令牌鉴权、中间件限流

---

## ✅ 验收清单（更新）
数据库：视图/新增字段/缓存表均存在；关键词与缓存有数据。
后端：5 个端点正常；访谈接口对象模式；错误统一。
前端：气泡/筛选/抽屉/访谈弹窗渲染无 undefined；日期正确。
交互：拖拽/tooltip/加载状态正常。

---

## 📝 快速 API 参考
（其余端点与 v1.0.0 一致，仅访谈与视图字段更新）

---

## 📞 支持与排查
提交 Issue 前收集：浏览器 Console、Network 响应、后端终端日志、相关 SQL 查询结果。

---

**生成时间**: 2025-11-21  
**版本**: v1.2.0  
**更新内容**: 
- 详细说明数据库表结构改动（rel_policy_county, policy_resources新增字段）
- 详解相关度计算逻辑（关键词匹配算法和评分公式）
- 详解指标影响分析机制（6指标前后期对比查询）
- 修复图表数量级混合问题（改为独立图表）
- 修复模态框关闭空白闪烁问题
**维护者**: CI-PAE 开发团队

# 政策可视化系统实现总结

## 📋 系统概述

政策可视化系统是CI-PAE项目的核心功能模块,实现了基于D3.js力导向图的政策气泡可视化,并结合口述史数据提供深度分析能力。

---

## 🗄️ 数据库层

### 1. 数据库增强迁移脚本
**文件**: `backend/database/migrations/add_policy_enhancements.sql`

**功能**:
- 为`rel_policy_county`表添加强度字段(strength: 0-1浮点数)和采纳年份
- 创建`v_policy_stats`视图聚合政策统计(覆盖县数、访谈数、资源数)
- 创建`policy_keywords`表用于关键词匹配
- 创建`policy_interview_cache`表预缓存政策-访谈关联及相关度评分
- 添加优化索引(policy_type, publish_date, interview_date等)

**核心视图定义**:
```sql
CREATE VIEW v_policy_stats AS
SELECT 
  p.policy_id,
  p.policy_name,
  p.policy_type,
  p.publish_date,
  COUNT(DISTINCT rpc.county_id) AS county_count,
  COUNT(DISTINCT id.data_id) AS interview_count,
  COUNT(DISTINCT pr.resource_id) AS resource_count
FROM policies p
LEFT JOIN rel_policy_county rpc ON p.policy_id = rpc.policy_id
LEFT JOIN interviewees i ON rpc.county_id = i.county_id
LEFT JOIN interview_data id ON i.interviewee_id = id.interviewee_id
LEFT JOIN policy_resources pr ON p.policy_id = pr.policy_id
GROUP BY p.policy_id;
```

**使用方法**: 在PowerShell中执行此脚本
```powershell
# 方法1: 使用Get-Content管道(推荐)
Get-Content backend/database/migrations/add_policy_enhancements.sql | mysql -u root -p ci_pae

# 方法2: 使用mysql的source命令
mysql -u root -p ci_pae -e "source backend/database/migrations/add_policy_enhancements.sql"

# 方法3: 使用cmd执行
cmd /c "mysql -u root -p ci_pae < backend/database/migrations/add_policy_enhancements.sql"
```

---

## 🔧 后端服务层

### 2. 政策服务模块
**文件**: `backend/services/policyService.js`

**核心方法**:

#### `getPolicyList(filters)` - 获取政策列表
- 参数: `{ type, city, year, keyword, page, pageSize }`
- 查询: `v_policy_stats` 视图,支持多条件筛选
- 返回: 气泡图所需的完整数据(policy_id, policy_name, county_count, interview_count等)

#### `getPolicyDetail(policyId)` - 获取政策详情

**查询策略**：多表联合查询 + 缓存表优化

**涉及表**：`policies` + `rel_policy_county` + `counties` + `policy_resources` + `policy_interview_cache` + 多个指标表

**返回结构**:
```javascript
{
  policy: {}, // 政策基本信息
  counties: [], // 覆盖县列表(含strength, adopt_year, notes)
  resources: [], // 资源文件列表(含amount, beneficiary_count, year)
  interviews: [], // 相关访谈列表(含relevance_score, matched_keywords)
  indicator_effects: [] // 指标影响数据(6个指标的前后对比)
}
```

**访谈获取逻辑（分两步）**：

1. **第一步：从缓存表获取高相关度访谈**
   ```sql
   SELECT ... FROM policy_interview_cache pic
   WHERE pic.policy_id = ? AND pic.relevance_score >= 4.0
   ORDER BY pic.relevance_score DESC
   LIMIT 20
   ```
   - 使用 `policy_interview_cache` 表，直接读取预计算的相关度
   - 阈值：`relevance_score >= 4.0`（至少匹配1个关键词或基础分）

2. **第二步：补充县域内其他访谈**（如果缓存不足20条）
   ```sql
   SELECT ... FROM interview_data id
   WHERE c.county_id IN (政策覆盖的县)
   AND id.data_id NOT IN (已获取的缓存访谈)
   LIMIT 30
   ```
   - 按县域关联补充访谈，`relevance_score` 设为0
   - 最终结果：缓存访谈（高分在前） + 县域访谈（补充）

**指标影响分析机制**：

**步骤1：确定时间分界点**
```sql
SELECT MIN(year) as min_year, MAX(year) as max_year
FROM economic_indicators
WHERE county_id IN (政策覆盖的县)
```
- 计算中位年份：`midYear = floor((minYear + maxYear) / 2)`
- 示例：2015-2023年数据 → midYear = 2019

**步骤2：前后期对比查询（6个指标）**

| 指标 | 表名 | 字段 | 单位 |
|-----|------|------|-----|
| GDP总量 | economic_indicators | gdp | 亿元 |
| 农村居民人均可支配收入 | economic_indicators | disp_income_rural | 元 |
| 户籍人口 | population_indicators | registered_pop | 万人 |
| 粮食产量 | agriculture_indicators | grain_yield | 万吨 |
| 公路里程 | infrastructure_indicators | road_mileage | 公里 |
| 小学数量 | edu_culture_indicators | primary_schools | 所 |

**SQL模式**（以GDP为例）：
```sql
SELECT 
  'gdp' as indicator,
  'GDP总量' as name,
  AVG(CASE WHEN year <= midYear THEN gdp END) as before_avg,
  AVG(CASE WHEN year > midYear THEN gdp END) as after_avg,
  '亿元' as unit
FROM economic_indicators
WHERE county_id IN (?)
```

**步骤3：计算变化率**
```javascript
const change_pct = ((after_avg - before_avg) / before_avg) * 100;
const period = `${minYear}-${midYear} vs ${midYear+1}-${maxYear}`;
```

**返回格式**：
```javascript
[
  {
    indicator: 'gdp',
    name: 'GDP总量',
    before_avg: 125.50,
    after_avg: 180.30,
    unit: '亿元',
    change_pct: 43.67,
    period: '2015-2019 vs 2020-2023'
  },
  // ... 其他5个指标
]
```

#### `getPolicyStats()` - 获取统计数据
- 聚合维度: 政策类型、年份、城市、覆盖度
- 用途: 筛选器选项填充、仪表盘统计卡片

#### `getInterviewFullContent(dataId)` - 获取完整访谈
- 单条访谈完整信息(含受访者、调研员、事件、关键词)

#### `getCities()` - 获取城市列表
- 从counties表提取所有城市,用于筛选器

---

### 3. 政策控制器
**文件**: `backend/controllers/policyController.js`

**端点映射**:
| HTTP方法 | 路径 | 控制器方法 | 说明 |
|---------|------|-----------|------|
| GET | `/api/policies` | `getPolicies` | 获取政策列表(支持query参数筛选) |
| GET | `/api/policies/stats` | `getPolicyStats` | 获取统计数据 |
| GET | `/api/policies/cities` | `getCities` | 获取城市列表 |
| GET | `/api/policies/:id` | `getPolicyById` | 获取政策详情 |
| GET | `/api/policies/interviews/:dataId` | `getInterviewFullContent` | 获取完整访谈 |

**错误处理模式**:
```javascript
try {
  const data = await policyService.someMethod(params);
  res.json({ ok: true, data });
} catch (error) {
  console.error('错误:', error);
  res.status(500).json({ ok: false, error: error.message });
}
```

---

### 4. 路由配置
**文件**: `backend/routes/policy.js`

**路由定义顺序** (关键:避免`:id`捕获统计/城市路由):
```javascript
router.get('/stats', policyController.getPolicyStats);       // 1. 统计优先
router.get('/cities', policyController.getCities);           // 2. 城市列表
router.get('/interviews/:dataId', policyController.getInterviewFullContent); // 3. 特定访谈
router.get('/', policyController.getPolicies);               // 4. 列表查询
router.get('/:id', policyController.getPolicyById);          // 5. 详情最后(避免捕获stats/cities)
```

**注册到主路由** (`backend/routes/index.js`):
```javascript
const policyRoutes = require('./policy');
router.use('/policies', policyRoutes);
```

---

## 🎨 前端实现

### 5. API客户端封装
**文件**: `frontend/src/api/policy.js`

**方法列表**:
```javascript
getPolicies(params)              // 获取政策列表(支持type/city/year/keyword筛选)
getPolicyDetail(policyId)        // 获取政策详情
getPolicyStats()                 // 获取统计数据
getInterviewFullContent(dataId)  // 获取完整访谈
getCities()                      // 获取城市列表
```

**示例调用**:
```javascript
import { getPolicies, getPolicyDetail } from '@/api/policy';

const res = await getPolicies({ 
  type: 'agriculture', 
  city: '呼和浩特市', 
  page: 1, 
  pageSize: 50 
});

if (res.ok) {
  console.log(res.data.policies); // 政策列表数组
}
```

---

### 6. 政策气泡可视化组件
**文件**: `frontend/src/components/PolicyBubbles.vue`

**技术栈**: Vue 3 Composition API + D3.js v7

**可视化逻辑**:
1. **气泡大小**: 使用`d3.scaleSqrt()`平方根比例尺映射`county_count`→半径(20-80px)
2. **气泡颜色**: 根据`policy_type`映射到预定义色板
   ```javascript
   const policyTypeColors = {
     agriculture: '#52c41a',        // 绿色-农业
     medical: '#1890ff',            // 蓝色-医疗
     education: '#722ed1',          // 紫色-教育
     poverty_alleviation: '#fa8c16' // 橙色-扶贫
   };
   ```
3. **辉光效果**: `interview_count > 0`的气泡应用SVG滤镜`url(#glow-filter)`
4. **脉冲动画**: CSS动画`pulse 2s ease-in-out infinite`
5. **力导向模拟**:
   ```javascript
   d3.forceSimulation(nodes)
     .force('charge', d3.forceManyBody().strength(5))       // 微弱排斥
     .force('center', d3.forceCenter(width/2, height/2))    // 中心引力
     .force('collision', d3.forceCollide().radius(d => d.radius + 2)) // 碰撞检测
   ```

**交互功能**:
- 拖拽气泡(drag behavior)
- 悬浮显示tooltip(政策名称、类型、覆盖县数、访谈数)
- 点击气泡触发`bubble-click`事件传递给父组件

**Props**:
| 属性 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| policies | Array | ✅ | 政策数据数组 |
| containerWidth | Number | ❌ | 容器宽度(默认自动获取) |
| containerHeight | Number | ❌ | 容器高度(默认600) |

**Emits**: `bubble-click(policy)` - 点击气泡时触发

---

### 7. 政策详情抽屉组件
**文件**: `frontend/src/components/PolicyDetailDrawer.vue`

**布局**: Ant Design Vue Drawer(720px宽) + Tabs(5个标签页)

**标签页结构**:

#### Tab 1: 概览
- 使用`a-descriptions`展示政策基本信息(名称、类型、发布机构、日期、覆盖范围等)
- 政策描述长文本展示

#### Tab 2: 覆盖县 (`counties.length`)
- `a-list`展示县列表(分页10条/页)
- 显示县名、强度标签(strength×100%)、采纳年份、备注

#### Tab 3: 资源文件 (`resources.length`)
- `a-list`展示文件列表(分页8条/页)
- Avatar显示文件类型图标(PDF/DOC/XLS等)
- 文件大小格式化显示(formatFileSize)
- 下载按钮(当前为占位)

#### Tab 4: 相关访谈 (`interviews.length`)
- 使用`InterviewCard`子组件渲染(分页5条/页)
- 点击"查看完整内容"按钮打开`a-modal`显示全文

#### Tab 5: 指标影响 (`indicator_effects.length`)
- 使用`IndicatorEffectChart`子组件渲染ECharts图表
- 无数据时显示`a-empty`

**数据加载**:
- 使用`watchEffect`监听`props.visible`和`props.policyId`
- 自动调用`getPolicyDetail(policyId)`获取完整数据

---

### 8. 访谈卡片组件
**文件**: `frontend/src/components/InterviewCard.vue`

**功能**: 紧凑展示单条访谈信息

**布局**:
- Avatar: 根据`identity`(身份)显示不同颜色和图标
- Title: 受访者姓名 + 身份标签 + 相关度标签(relevance_score×100%)
- Meta: 访谈日期(图标📅)
- Keywords: 关键词标签云(蓝色小标签)
- Snippet: 内容摘要(前120字+`...`)
- Action: "查看完整内容"按钮

**身份颜色映射**:
```javascript
const identityColors = {
  '村干部': '#1890ff',
  '村民': '#52c41a',
  '乡镇干部': '#722ed1',
  '驻村干部': '#fa8c16',
  '企业家': '#13c2c2',
  '教师': '#eb2f96'
};
```

**Props**: `interview` (访谈对象)  
**Emits**: `view-full(data_id)` - 点击查看完整内容时触发

---

### 9. 指标影响对比图组件
**文件**: `frontend/src/components/IndicatorEffectChart.vue`

**技术栈**: Vue 3 + ECharts 5.x

**图表类型**: 柱状图(before/after对比) + 折线图(变化率)

**配置亮点**:
1. **双Y轴共享**: 左侧Y轴显示指标值,折线图复用同一Y轴
2. **渐变色柱状图**: 实施后数据使用蓝色渐变(`LinearGradient`)
3. **标签显示**: 柱子顶部显示值+变化率(如`1234\n(+12.3%)`)
4. **Tooltip增强**: 自定义formatter显示前后对比和彩色变化率
5. **响应式**: 监听window resize事件自动调整图表尺寸

**数据格式**:
```javascript
effects: [
  {
    indicator_name: '人均收入',
    before_value: 5000,
    after_value: 8000,
    change_percent: 60.00
  }
]
```

---

### 10. 经验模式库主页
**文件**: `frontend/src/views/Patterns.vue`

**布局结构**:

#### 区域1: 页面头部
- `a-page-header`: 标题+副标题+刷新按钮
- 4个统计卡片(政策总数、覆盖县数、平均覆盖度、访谈记录)
- 使用`a-statistic`组件展示数据和图标

#### 区域2: 筛选工具栏
- `a-form` inline布局
- 4个筛选条件:
  - 政策类型下拉(显示类型名+数量)
  - 城市下拉
  - 发布年份下拉(显示年份+数量)
  - 关键词搜索框(支持回车查询)
- 重置按钮

#### 区域3: 气泡可视化区域
- `PolicyBubbles`组件渲染
- 标题带提示图标(说明气泡含义)
- 自动监听`filters`变化重新查询

#### 区域4: 详情抽屉(浮层)
- `PolicyDetailDrawer`组件
- 点击气泡时显示

**数据流**:
```
onMounted → fetchStats + fetchCities + fetchPolicies
   ↓
filters change → handleFilterChange → fetchPolicies (自动查询)
   ↓
bubble click → handleBubbleClick → drawerVisible=true + selectedPolicyId=xxx
   ↓
PolicyDetailDrawer监听policyId → fetchPolicyDetail
```

**响应式设计**:
- 移动端(<768px)时调整表单布局
- 使用`@media`查询隐藏部分元素

---

## 🎨 全局样式增强

**文件**: `frontend/src/assets/styles/main.css`

**新增特性**:
1. **动画**:
   - `@keyframes pulse`: 气泡脉冲(0%/100%缩放1, 50%缩放1.05)
   - `@keyframes glow`: 辉光效果(阴影强度变化)
   - `@keyframes spin`: 加载旋转
2. **滚动条美化**: Webkit内核浏览器自定义滚动条样式
3. **响应式断点辅助类**: `.hide-on-mobile`, `.hide-on-tablet`, `.hide-on-desktop`
4. **卡片阴影层次**: `.card-shadow-sm/md/lg`
5. **文本截断**: `.text-ellipsis`, `.text-ellipsis-2/3`
6. **过渡效果**: `.fade-enter-active`, `.slide-enter-active`

---

## 📦 依赖安装

### 后端无需新增依赖
已使用: `express`, `mysql2`, `dotenv`, `cors`, `body-parser`

### 前端新增依赖
```bash
cd frontend
npm install d3
```

**当前package.json**:
```json
{
  "dependencies": {
    "ant-design-vue": "^4.2.6",
    "axios": "^1.4.0",
    "d3": "^7.x.x",          // 新增
    "echarts": "^6.0.0",
    "marked": "^17.0.0",
    "vue": "^3.2.0",
    "vue-router": "^4.2.0"
  }
}
```

---

## 🚀 部署流程

### 步骤1: 执行数据库迁移
```powershell
# 确保MySQL服务运行中,在项目根目录执行
Get-Content backend/database/migrations/add_policy_enhancements.sql | mysql -u root -p ci_pae
```

**预期结果**:
- `rel_policy_county`表新增`strength`, `adopt_year`, `notes`字段
- 创建`v_policy_stats`视图
- 创建`policy_keywords`和`policy_interview_cache`表
- 插入初始关键词和缓存数据

### 步骤2: 启动后端服务
```bash
cd backend
npm run dev  # 使用nodemon监听文件变化
```

**验证**: 访问 `http://localhost:3001/api/policies` 应返回政策列表JSON

### 步骤3: 安装前端依赖并启动
```bash
cd frontend
npm install      # 确保d3已安装
npm run dev      # 启动Vite开发服务器
```

**验证**: 访问 `http://localhost:5174/patterns` 应看到气泡可视化页面

### 步骤4: 测试完整流程
1. 打开经验模式库页面
2. 验证4个统计卡片显示数据
3. 尝试筛选条件(类型/城市/年份/关键词)
4. 点击任意气泡打开详情抽屉
5. 切换5个标签页验证数据加载
6. 点击访谈卡片查看完整内容
7. 验证指标影响图表渲染

---

## 🐛 常见问题排查

### 问题1: 气泡不显示
**检查项**:
- [ ] `policies`数组是否为空?查看Network面板`/api/policies`响应
- [ ] D3.js是否成功安装?检查`node_modules/d3`
- [ ] SVG容器尺寸是否正确?查看元素审查器

### 问题2: 抽屉打开无数据
**检查项**:
- [ ] `policyId`是否正确传递?在`handleBubbleClick`中打印
- [ ] 后端`/api/policies/:id`是否返回数据?查看Network
- [ ] 是否存在CORS错误?检查浏览器Console

### 问题3: 统计数据不准确
**检查项**:
- [ ] 数据库迁移脚本是否成功执行?检查表结构和视图
- [ ] `v_policy_stats`视图数据是否正确?直接查询验证
- [ ] 关键词和缓存表是否有初始数据?检查`policy_keywords`和`policy_interview_cache`

### 问题4: 指标影响图表不渲染
**检查项**:
- [ ] `indicator_effects`数组是否有数据?当前为预留字段,可能返回空数组
- [ ] ECharts是否正确初始化?检查`chartRef.value`是否存在
- [ ] 容器高度是否为0?使用开发者工具检查

---

## 📊 性能优化建议

### 数据库层
1. **索引优化**: 已添加`policy_type`, `publish_date`, `interview_date`索引
2. **视图缓存**: 考虑使用物化视图或定期更新缓存表
3. **分页查询**: 前端默认100条,生产环境建议降低到50

### 后端层
1. **查询优化**: `getPolicyDetail`的7表联合查询可能较慢,考虑:
   - 分步查询改为并行Promise.all
   - 使用Redis缓存热点政策详情
2. **API限流**: 添加`express-rate-limit`中间件防止滥用

### 前端层
1. **D3渲染优化**:
   - 数据量>200时启用Canvas渲染模式
   - 添加虚拟滚动支持大数据集
2. **图片懒加载**: 资源文件缩略图使用`IntersectionObserver`
3. **组件懒加载**: 使用Vue的`defineAsyncComponent`加载抽屉和图表

---

## 🔐 安全注意事项

1. **SQL注入防护**: 当前使用参数化查询(`pool.query(sql, params)`),已基本防护
2. **XSS防护**: Vue模板默认转义,访谈内容使用`v-text`或`{{}}`输出
3. **文件下载**: 资源文件下载功能当前为占位,实现时需验证文件路径防止目录遍历
4. **API鉴权**: 当前政策API为公开访问,生产环境建议添加token验证

---

## 📈 未来扩展方向

### 功能扩展
1. **高级筛选**:
   - 多选政策类型
   - 覆盖县数范围滑块筛选
   - 时间范围选择器
2. **数据导出**:
   - 导出当前筛选结果为CSV/Excel
   - 生成政策分析报告PDF
3. **协作功能**:
   - 为政策添加标注和评论
   - 分享特定筛选条件的URL

### 可视化增强
1. **多视图模式**:
   - 力导向图(当前)
   - 树状图(按类型层级)
   - 时间轴视图(按年份排列)
   - 地图视图(县级热力图)
2. **交互增强**:
   - 气泡间连线显示政策关联
   - 双击气泡缩放聚焦
   - 搜索高亮匹配气泡
3. **动画改进**:
   - 气泡入场动画(从中心扩散)
   - 筛选过渡动画(平滑淡入淡出)

### 智能分析
1. **NLP增强**:
   - 自动提取政策核心要素
   - 访谈关键词云
   - 情感分析(受访者态度)
2. **推荐系统**:
   - 相似政策推荐
   - 基于访谈的政策效果预测
3. **知识图谱**:
   - 政策-县-访谈-指标关系网络
   - 实体抽取和关系推理

---

## 📝 API文档速查

### GET /api/policies
**查询参数**:
```
type: string (agriculture|medical|education|poverty_alleviation)
city: string (城市名称)
year: string (发布年份)
keyword: string (关键词)
page: number (页码,默认1)
pageSize: number (每页数量,默认20)
```
**响应**:
```json
{
  "ok": true,
  "data": {
    "policies": [
      {
        "policy_id": "POL001",
        "policy_name": "精准扶贫政策",
        "policy_type": "poverty_alleviation",
        "type_name": "扶贫政策",
        "county_count": 25,
        "interview_count": 12,
        "resource_count": 5,
        "publish_year": 2015
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

### GET /api/policies/stats
**响应**:
```json
{
  "ok": true,
  "data": {
    "by_type": [
      { "policy_type": "agriculture", "type_name": "农业政策", "count": 15 }
    ],
    "coverage": {
      "total_policies": 50,
      "total_counties": 31,
      "avg_coverage": 0.68
    },
    "by_year": [
      { "publish_year": "2015", "count": 20 }
    ],
    "by_city": [
      { "city": "呼和浩特市", "count": 10 }
    ]
  }
}
```

### GET /api/policies/:id
**响应**:
```json
{
  "ok": true,
  "data": {
    "policy": { "policy_id": "POL001", "policy_name": "...", "description": "..." },
    "counties": [
      { "county_id": "NMG000001", "county_name": "新城区", "strength": 0.85, "adopt_year": 2016 }
    ],
    "resources": [
      { "resource_id": "RES001", "file_name": "政策文件.pdf", "file_type": "pdf", "file_size": 1048576 }
    ],
    "interviews": [
      { "data_id": "DAT001", "interviewee_name": "张三", "identity": "村干部", "relevance_score": 0.92 }
    ],
    "indicator_effects": [
      { "indicator_name": "人均收入", "before_value": 5000, "after_value": 8000, "change_percent": 60 }
    ]
  }
}
```

### GET /api/policies/cities
**响应**:
```json
{
  "ok": true,
  "data": ["呼和浩特市", "包头市", "鄂尔多斯市"]
}
```

### GET /api/policies/interviews/:dataId
**响应**:
```json
{
  "ok": true,
  "data": {
    "data_id": "DAT001",
    "interviewee_name": "张三",
    "identity": "村干部",
    "county_name": "新城区",
    "city": "呼和浩特市",
    "interview_date": "2018-06-15",
    "researcher_name": "李四",
    "content": "完整访谈内容...",
    "keywords": "扶贫,产业,收入",
    "event_names": "产业扶贫启动,合作社成立"
  }
}
```

---

## ✅ 验收清单

### 数据库
- [x] 迁移脚本成功执行
- [x] `v_policy_stats`视图查询返回正确数据
- [x] `policy_keywords`表有初始��据
- [x] `policy_interview_cache`表有关联数据

### 后端
- [x] 5个API端点正常响应
- [x] 错误处理返回正确状态码
- [x] 查询支持筛选参数
- [x] 详情接口返回完整数据结构

### 前端
- [x] 气泡可视化正常渲染
- [x] 筛选器自动查询生效
- [x] 抽屉5个标签页正常切换
- [x] 访谈卡片显示正确
- [x] 指标图表渲染(有数据时)
- [x] 响应式布局适配移动端

### 交互体验
- [x] 气泡可拖拽
- [x] 悬浮显示tooltip
- [x] 点击气泡打开抽屉
- [x] 统计卡片数据实时更新
- [x] 加载状态反馈(loading spin)

---

## 📞 技术支持

如遇到问题,请检查以下内容后提交Issue:
1. 浏览器Console错误日志(F12)
2. Network面板API响应内容
3. 后端Terminal错误输出
4. 数据库查询结果(直接SQL验证)

**项目结构参考**: 参见根目录`.github/copilot-instructions.md`

---

**生成时间**: 2025-01-XX  
**版本**: v1.0.0  
**维护者**: CI-PAE开发团队
