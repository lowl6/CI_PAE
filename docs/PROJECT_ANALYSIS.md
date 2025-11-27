# CI-PAE 项目分析文档

## 项目概述

**CI-PAE**（Campaign Imprints: Intelligent Extraction System for Poverty Alleviation Experience）是一个扶贫经验智能提取系统的全栈Web应用。该项目专注于扶贫政策的分析、对比和智能查询，为用户提供数据驱动的扶贫经验洞察。

## 技术架构

### 整体架构
- **前后端分离架构**：前端Vue 3 + 后端Express.js
- **数据库**：MySQL
- **开发模式**：前端SPA单页应用 + 后端RESTful API

### 技术栈

#### 后端技术栈
- **运行环境**: Node.js
- **Web框架**: Express.js 4.18.2
- **数据库**: MySQL 3.15.3
- **认证**: 简单API Key认证 (待升级为JWT)
- **开发工具**: Nodemon 2.0.22
- **AI集成**: OpenAI API 6.9.1

#### 前端技术栈
- **框架**: Vue 3.2.0
- **构建工具**: Vite 5.0.0
- **UI组件库**: Ant Design Vue 4.2.6
- **路由**: Vue Router 4.2.0
- **HTTP客户端**: Axios 1.4.0
- **可视化**: D3.js 7.9.0, ECharts 6.0.0
- **样式**: Less 4.4.2
- **Markdown渲染**: Marked 17.0.0

## 项目结构

```
CI_PAE/
├── backend/                    # 后端服务
│   ├── app.js                 # Express应用配置
│   ├── server.js              # 服务启动入口
│   ├── config/                # 配置文件
│   │   └── db.js              # 数据库配置
│   ├── controllers/           # 控制器层
│   │   ├── analysisController.js
│   │   ├── authController.js
│   │   ├── compareController.js
│   │   ├── dashboardController.js
│   │   ├── dataController.js
│   │   ├── nlpController.js
│   │   └── policyController.js
│   ├── middleware/            # 中间件
│   │   ├── auth.js            # 认证中间件
│   │   └── errorHandler.js    # 错误处理
│   ├── routes/                # 路由定义
│   │   ├── index.js           # 主路由
│   │   ├── analysis.js        # 分析相关
│   │   ├── compare.js         # 对比相关
│   │   ├── dashboard.js       # 仪表盘相关
│   │   ├── nlpRoutes.js       # NLP相关
│   │   └── policy.js          # 政策相关
│   ├── services/              # 业务逻辑层
│   ├── database/              # 数据库相关
│   │   ├── data_all/          # 数据文件
│   │   └── migrations/        # 数据库迁移
│   └── package.json
├── frontend/                  # 前端应用
│   ├── src/
│   │   ├── main.js            # 应用入口
│   │   ├── router/            # 路由配置
│   │   │   └── index.js
│   │   ├── api/               # API调用
│   │   │   └── index.js
│   │   ├── views/             # 页面组件
│   │   │   ├── Login.vue      # 登录页
│   │   │   ├── Dashboard.vue  # 仪表盘
│   │   │   ├── Analysis.vue   # 分析页面
│   │   │   ├── Patterns.vue   # 模式分析
│   │   │   ├── Compare.vue    # 对比分析
│   │   │   └── QueryPage.vue  # 智能查询
│   │   ├── components/        # 通用组件
│   │   │   └── Layout/        # 布局组件
│   │   ├── assets/            # 静态资源
│   │   └── utils/             # 工具函数
│   ├── public/                # 公共资源
│   ├── dist/                  # 构建输出
│   ├── vite.config.js         # Vite配置
│   └── package.json
├── config/                    # 全局配置
├── log/                       # 日志文件
├── .env                       # 环境变量
├── .env.example               # 环境变量示例
└── README.md                  # 项目说明
```

## 核心功能模块与页面设计

### 1. 用户认证模块（Login.vue）

#### 页面设计
- **路由**: `/login`
- **布局**: 居中对话框设计，简洁现代风格
- **组件**: `Login.vue` (440行)
- **响应式**: 支持桌面和移动端自适应

#### 核心功能

##### 1.1 登录功能
- **表单字段**:
  - 用户名输入框（必填）
  - 密码输入框（必填，type="password"）
- **验证机制**:
  - 前端：非空验证
  - 后端：用户名存在性验证、bcrypt密码匹配
- **API**: `POST /api/auth/login`
  ```json
  // 请求
  { "username": "admin", "password": "admin123" }
  // 响应
  { "ok": true, "data": { "token": "...", "user": {...} } }
  ```
- **成功处理**:
  - 存储token到localStorage
  - 存储用户信息（username, role）
  - 跳转到首页（/dashboard）
- **错误处理**:
  - 显示错误提示信息
  - 高亮错误的表单字段
  - 3秒后自动清除错误提示

##### 1.2 注册功能
- **触发方式**: 点击"立即注册"链接弹出注册表单
- **表单设计**: 模态对话框（可点击外部关闭）
- **表单字段**:
  - 用户名（必填，唯一性）
  - 密码（必填，至少6位）
  - 确认密码（必填，需与密码一致）
  - 角色选择（下拉框，6个选项）
    - admin - 系统管理员
    - researcher - 调研人员
    - policy_admin - 政策管理员
    - statistician - 统计员
    - analyst - 分析师
    - user - 普通用户（默认）
- **验证逻辑**:
  ```javascript
  // 前端验证
  - 用户名长度 >= 3
  - 密码长度 >= 6
  - 两次密码必须一致
  - 角色必须选择
  ```
- **API**: `POST /api/auth/register`
- **成功处理**:
  - 显示成功提示
  - 自动填充登录表单
  - 关闭注册对话框
  - 建议用户立即登录

##### 1.3 UI/UX设计
- **视觉风格**:
  - 渐变背景色（蓝紫色系）
  - 卡片阴影效果（box-shadow）
  - 圆角设计（border-radius: 8px）
- **交互动画**:
  - 输入框聚焦动画
  - 按钮悬停效果
  - 加载状态旋转动画
- **状态反馈**:
  - 加载中：按钮禁用 + "登录中..."文字
  - 错误提示：红色文字 + 抖动动画
  - 成功提示：绿色提示 + 跳转倒计时

### 2. 数据仪表盘模块（Dashboard.vue）

#### 页面设计
- **路由**: `/dashboard` (默认首页)
- **布局**: 卡片式网格布局
- **组件**: `Dashboard.vue` (977行)
- **响应式**: 12列栅格系统，移动端自动折叠

#### 核心功能

##### 2.1 系统功能简介卡片
- **标题**: "内蒙古自治区乡村振兴监测系统"
- **描述**: 系统覆盖范围和功能说明
- **数据统计**（4个指标卡）:
  - 覆盖盟市: 12个
  - 数据维度: 7类（经济、人口、农业、工业、基建、教育、医疗）
  - 统计年份: 2018-2023
  - 重点帮扶县: 动态统计（totalPoorCounties）
- **视觉设计**: 大号数字 + 标签，网格布局

##### 2.2 内蒙古地图展示
- **地图类型**: 静态图片（/images/inner-mongolia-map.png）
- **容器设计**: 左右分栏
  - 左侧：地图图片展示
  - 右侧：盟市列表（可交互）
- **加载状态**:
  - 加载中：显示旋转动画 + "地图加载中..."
  - 加载失败：显示错误图标 + 提示信息
  - 加载成功：显示完整地图
- **地图标注**（未来扩展）:
  - 各盟市位置标记
  - 重点帮扶县高亮显示
  - 悬停显示详细信息

##### 2.3 盟市列表与交互
- **列表设计**: 
  - 网格卡片布局（每行3个）
  - 每个卡片包含：
    - 盟市名称
    - 重点帮扶县数量
    - 右箭头图标（→）
- **交互特性**:
  - 悬停效果: translateX(4px) + 边框颜色变化
  - 点击效果: 触发 `handleCountyClick(county)` 方法
  - 选中状态: active类高亮显示
- **数据结构**:
  ```javascript
  counties = [
    { id: 1, name: "呼和浩特市", poorCountyCount: 3 },
    { id: 2, name: "包头市", poorCountyCount: 2 },
    // ...共12个盟市
  ]
  ```

##### 2.4 盟市详情弹窗（Modal）
- **触发**: 点击盟市卡片
- **弹窗尺寸**: 宽度700px，自适应高度
- **标题**: "{盟市名} - 重点帮扶县详情"
- **内容区域**:
  - **摘要统计**:
    - 重点帮扶县总数
    - 已脱贫人数（totalAlleviated）
    - 平均贫困程度
  - **县区列表**:
    - 县名
    - 贫困程度标签（深度/重度/中度/轻度）
    - 已脱贫人数
    - 脱贫年份
- **贫困程度色彩映射**:
  ```javascript
  深度: #ff4d4f (红色)
  重度: #ff7a45 (橙色)
  中度: #ffa940 (橙黄)
  轻度: #52c41a (绿色)
  ```
- **关闭方式**: 点击遮罩层、点击X按钮、ESC键

##### 2.5 空状态处理
- **无数据情况**:
  - 显示空状态图标（📭）
  - 提示文字："暂无重点帮扶县数据"
  - 建议操作按钮
- **数据加载失败**:
  - 显示错误图标（⚠️）
  - 错误信息说明
  - 重试按钮

### 3. 数据分析模块（Analysis.vue）

#### 页面设计
- **路由**: `/analysis`
- **布局**: 左右分栏（5/19比例）
- **组件**: `Analysis.vue` (767行)
- **设计风格**: 专业数据分析工具界面

#### 核心功能

##### 3.1 顶部筛选器面板
- **布局**: 栅格布局（6+6+10+2列）
- **筛选字段**:
  
  **城市选择器**:
  - 下拉框，支持搜索
  - 数据源: `GET /api/analysis/cities`
  - 懒加载: 聚焦时才加载数据
  - 支持清空按钮
  
  **县区选择器**:
  - 级联依赖：城市选中后激活
  - 数据源: `GET /api/analysis/counties?city=xxx`
  - 未选城市时禁用
  
  **年份区间**:
  - 双输入框: 开始年份 + 结束年份
  - 年份范围: 2015-2023
  - 输入类型: number
  - 中间分隔符: "至"
  
  **查询按钮**:
  - 类型: primary
  - 加载状态: 显示旋转图标
  - 触发: `handleQuery()` 方法

##### 3.2 左侧指标树（Tree）
- **组件**: a-tree（Ant Design Vue）
- **功能**: 多选指标
- **数据结构**: 树形层级结构
  ```javascript
  indicatorTree = [
    {
      title: "经济指标",
      key: "economic",
      children: [
        { title: "GDP", key: "gdp" },
        { title: "财政收入", key: "public_budget_income" },
        { title: "农村居民收入", key: "disp_income_rural" }
      ]
    },
    {
      title: "农业指标",
      key: "agriculture",
      children: [
        { title: "耕地面积", key: "arable_land" },
        { title: "粮食产量", key: "grain_yield" }
      ]
    },
    // ...其他5个大类
  ]
  ```
- **数据源**: `GET /api/analysis/indicators/tree`
- **交互特性**:
  - 支持折叠/展开
  - 复选框多选
  - 显示连接线
  - 存储选中状态到 `checkedKeys`
- **提示信息**: "请选择指标并点击查询"

##### 3.3 右侧主内容区

**指标卡片区（Indicator Cards）**:
- **显示条件**: 查询成功且有数据
- **布局**: 3列网格（每行3个卡片）
- **组件**: `IndicatorCard.vue`
- **卡片内容**:
  - 指标名称
  - 数值（大号字体）
  - 单位
  - 同比增长率（YoY）
    - 正数：绿色向上箭头
    - 负数：红色向下箭头
- **数据来源**: `cards[]` 数组

**图表区（Charts）**:
- **显示条件**: chartData.series存在且长度>0
- **布局模式**:
  
  **单指标模式**（series.length === 1）:
  - 大图显示（全宽）
  - 图表类型: 折线图
  - 标题: 指标名称 + 图标
  - 副标题: 单位
  
  **多指标模式**（series.length > 1）:
  - 网格布局（2列或3列）
  - 每个指标独立图表
  - 动态列数:
    ```javascript
    2个指标: 每个占12列（50%）
    3个指标: 每个占8列（33.3%）
    4+指标: 每个占6列（25%）
    ```
  
- **图表组件**: `DataChart.vue`（基于ECharts）
- **图表配置**:
  - X轴: 年份
  - Y轴: 指标数值
  - 折线: 平滑曲线（smooth: true）
  - 标记点: 圆形节点
  - 工具提示: 悬停显示详细信息
  - 图例: 底部居中
  - 配色方案: 
    ```javascript
    ['#5470c6', '#91cc75', '#fac858', '#ee6666', 
     '#73c0de', '#3ba272', '#fc8452', '#9a60b4']
    ```

##### 3.4 数据加载流程
1. 用户选择筛选条件
2. 点击"查询"按钮
3. 显示加载遮罩（a-spin）
4. 调用API: `POST /api/analysis/data`
   ```json
   {
     "countyId": "C001",
     "startYear": 2018,
     "endYear": 2023,
     "indicators": ["gdp", "grain_yield"]
   }
   ```
5. 解析返回数据
6. 更新cards数组（指标卡片）
7. 更新chartData对象（图表数据）
8. 隐藏加载遮罩

##### 3.5 CSV导出功能
- **触发**: 右上角导出按钮（规划中）
- **API**: `GET /api/analysis/export/csv?countyId=xxx&...`
- **文件格式**: 
  ```csv
  年份,GDP,粮食产量,耕地面积
  2018,123.45,98765,45000
  2019,145.67,102345,46000
  ```
- **文件名**: `{县名}_{开始年份}-{结束年份}_分析数据.csv`

### 4. 对比分析模块（Compare.vue）

#### 页面设计
- **路由**: `/compare`
- **布局**: 上下结构（筛选器 + 结果展示）
- **组件**: `Compare.vue` (552行)
- **设计理念**: 双县对比 + 多维度分析

#### 核心功能

##### 4.1 筛选器面板
- **布局**: 3列栅格（8+8+8）

**县区对比选择器**:
- **模式**: 多选（mode="multiple"）
- **限制**: 必须选择恰好2个县区
- **最大标签**: max-tag-count="2"
- **数据源**: regions数组
- **交互**: 选择变化时触发 `onRegionChange()`
- **验证**: 
  ```javascript
  if (selectedRegions.length !== 2) {
    // 禁用查询或显示提示
  }
  ```

**时间范围选择器**:
- **组件**: a-range-picker
- **格式**: YYYY-MM-DD
- **返回**: [startDate, endDate]
- **触发**: `onDateChange()`

**政策类型选择器**:
- **模式**: 单选
- **选项**: 6个固定政策类型
  - 经济发展
  - 农业扶贫
  - 社会保障与就业
  - 基础设施建设
  - 教育文化
  - 工业招商
- **可选性**: allow-clear（可清空）
- **特殊功能**: 选择后自动切换到"相关领域指标"Tab
- **触发**: `onPolicyTypeChange()`

**数据概览统计**:
- 4个统计卡片（a-statistic）:
  - 选择地区数: selectedRegions.length
  - 时间范围: getDateRangeText()
  - 政策类型: selectedPolicyType || '全部'
  - 数据点数: policyEffectData.length

##### 4.2 结果展示区（Tabs）

**Tab 1: 政策效果对比**
- **组件**: `PolicyEffectChart.vue`
- **图表类型**: 柱状图（Bar Chart）
- **数据维度**:
  - X轴: 政策名称
  - Y轴: 政策效果指数（0-100）
  - 系列: 两个县区（不同颜色）
- **效果指数计算**:
  ```javascript
  // 基础分数（60分制）
  baseScore = strength × 100
  
  // 趋势加分（±20分）
  trendBonus = (当前增长率 > 历史平均) ? +20 : -20
  
  // 完整性加分（0-10分）
  completenessBonus = 政策覆盖年份 / 总年份 × 10
  
  // 最终效果指数
  effectIndex = baseScore + trendBonus + completenessBonus
  ```
- **颜色分级**:
  ```javascript
  85-100: #52c41a (优秀-绿色)
  70-84:  #1890ff (良好-蓝色)
  55-69:  #faad14 (中等-橙色)
  40-54:  #ff7a45 (较差-浅红)
  0-39:   #ff4d4f (差-红色)
  ```
- **动态副标题**: 
  - 未选政策: "所有政策类型"
  - 已选政策: "政策类型: {类型名称}"

**Tab 2: 相关领域指标**
- **激活条件**: selectedPolicyType不为空
- **禁用状态**: relatedIndicators.length === 0
- **空状态**: 显示提示"请选择政策类型以查看相关指标"
- **数据来源**: `GET /api/compare/data?regions=xxx&policyType=xxx`
  - 后端根据政策类型映射到相关指标
  - 政策-指标映射表:
    ```javascript
    {
      "经济发展": ["gdp", "public_budget_income", "disp_income_rural"],
      "农业扶贫": ["grain_yield", "arable_land", "sown_area"],
      "基础设施建设": ["road_mileage", "mobile_users", "broadband_users"],
      // ...
    }
    ```
- **展示方式**: 
  - 网格布局（2列）
  - 每个指标一个图表
  - 组件: `RelatedIndicatorChart.vue`
- **图表设计**:
  - 类型: 折线图（Line Chart）
  - X轴: 年份
  - Y轴: 指标数值
  - 两条线: region1（蓝色）、region2（绿色）
  - 区域填充: areaStyle with opacity 0.1
  - 标题: 指标名称 (单位)

##### 4.3 数据加载与状态管理
- **响应式数据**:
  ```javascript
  const selectedRegions = ref([])
  const dateRange = ref([])
  const selectedPolicyType = ref('')
  const activeTab = ref('2') // 默认政策效果Tab
  const policyEffectData = ref([])
  const relatedIndicators = ref([])
  ```
- **自动切换逻辑**:
  ```javascript
  onPolicyTypeChange() {
    if (selectedPolicyType.value) {
      activeTab.value = '3' // 切换到相关指标
      loadRelatedIndicators() // 加载指标数据
    } else {
      activeTab.value = '2' // 回到政策效果
    }
  }
  ```
- **数据验证**:
  - 必须选择2个县区
  - 时间范围合法性检查
  - 政策类型可选

### 5. 模式分析模块（Patterns.vue - 经验模式库）

#### 页面设计
- **路由**: `/patterns`
- **布局**: 上中下结构（标题 + 筛选 + 可视化）
- **组件**: `Patterns.vue` (531行)
- **设计理念**: 政策网络可视化 + 经验知识库

#### 核心功能

##### 5.1 页面标题与统计卡片
- **标题**: "经验模式库"
- **副标题**: "基于政策与口述史的扶贫经验可视化分析"
- **刷新按钮**: 
  - 图标: ReloadOutlined
  - 功能: 重新加载所有数据
  - 触发: `refreshData()`

**4个统计卡片**（a-row with gutter=16）:
1. **政策总数**:
   - 图标: FileTextOutlined
   - 数值: stats.total_policies
   - 颜色: #3f8600（绿色）
   
2. **覆盖县数**:
   - 图标: EnvironmentOutlined
   - 数值: stats.total_counties
   - 颜色: #1890ff（蓝色）
   
3. **平均覆盖度**:
   - 图标: RiseOutlined
   - 数值: stats.avg_coverage
   - 精度: 1位小数
   - 后缀: %
   - 颜色: #cf1322（红色）
   
4. **访谈记录**:
   - 图标: TeamOutlined
   - 数值: totalInterviews
   - 颜色: #722ed1（紫色）

##### 5.2 筛选工具栏
- **容器**: a-card（size="small"）
- **布局**: inline表单

**筛选器字段**:

**政策类型选择器**:
- 数据源: `policyTypes[]` 数组
- 选项格式: "{类型名} ({数量})"
- 示例: "农业产业扶持 (3)"
- 包含"全部类型"选项
- 触发: `handleFilterChange()`

**城市选择器**:
- 下拉框，包含"全部城市"
- 数据源: 从政策数据中提取的城市列表
- 多选支持（规划中）

**时间段选择器**:
- 范围选择器（date-range-picker）
- 格式: YYYY-MM-DD
- 筛选政策发布日期

**快捷筛选按钮**（规划中）:
- 近1年
- 近3年
- 近5年
- 全部

##### 5.3 力导向图可视化（核心）

**可视化容器**:
- **尺寸**: 自适应宽度 × 600px高度
- **技术**: D3.js v7 + forceSimulation
- **SVG容器**: 动态创建和更新

**节点设计**:

**政策节点（Policy Nodes）**:
- **形状**: 圆形（circle）
- **半径**: 根据覆盖县数计算
  ```javascript
  radius = 20 + (coverageCount * 2)
  范围: 20-60px
  ```
- **颜色**: 根据政策类型映射
  ```javascript
  {
    "农业产业扶持": "#52c41a",
    "医疗保障": "#1890ff",
    "产业发展": "#faad14",
    "基础设施建设": "#ff7a45",
    "教育与文化": "#722ed1",
    "社会保障与就业": "#13c2c2",
    "经济发展": "#eb2f96",
    // 其他: "#8c8c8c"
  }
  ```
- **标签**: 政策名称（超过15字截断 + "..."）
- **位置**: 节点上方

**县区节点（County Nodes）**:
- **形状**: 圆形
- **半径**: 固定15px
- **颜色**: 
  - 有政策覆盖: #91cc75（浅绿）
  - 无政策覆盖: #d9d9d9（灰色）
- **标签**: 县名

**连接线（Links）**:
- **样式**: 直线（line）
- **颜色**: rgba(0,0,0,0.2)（半透明黑）
- **宽度**: 1px
- **表示**: 政策覆盖关系
  - 起点: 政策节点
  - 终点: 县区节点

**力模拟配置**:
```javascript
const simulation = d3.forceSimulation(nodes)
  .force("link", d3.forceLink(links)
    .id(d => d.id)
    .distance(100) // 连线长度
  )
  .force("charge", d3.forceManyBody()
    .strength(-300) // 排斥力
  )
  .force("center", d3.forceCenter(width/2, height/2))
  .force("collision", d3.forceCollide()
    .radius(d => d.radius + 10) // 防止重叠
  )
```

##### 5.4 交互特性

**节点拖拽**:
- 鼠标按下: 固定节点位置
- 拖动中: 实时更新节点位置
- 松开: 恢复力模拟

**缩放与平移**:
- 滚轮: 缩放（0.1x - 4x）
- 拖拽空白: 平移画布
- 双击: 重置视图

**节点悬停**:
- 节点高亮
- 连接线加粗
- 显示详细信息工具提示

**节点点击**:
- **触发**: 弹出详情弹窗
- **弹窗内容**（政策节点）:
  - 政策名称
  - 政策类型
  - 发布机构
  - 发布日期
  - 实施日期
  - 政策摘要
  - 覆盖县区列表
  - 文号
- **弹窗内容**（县区节点）:
  - 县区名称
  - 所属城市
  - 相关政策列表
  - 政策数量统计

**粒子效果动画**:
- **触发**: 点击节点时
- **技术**: Canvas 2D API
- **效果**: 
  - 从节点中心向外发射粒子
  - 粒子数量: 30个
  - 粒子颜色: 节点颜色 + 透明度渐变
  - 动画时长: 1.5秒
  - 粒子轨迹: 随机角度扩散

##### 5.5 数据源与加载
- **API**: `GET /api/patterns/data`
- **返回数据结构**:
  ```json
  {
    "policies": [
      {
        "policy_id": "POL001",
        "policy_name": "马铃薯种薯繁育基地建设",
        "policy_type": "农业产业扶持",
        "issue_date": "2016-03-15",
        "coverage_counties": ["武川县", "土默特左旗"]
      }
    ],
    "counties": [...],
    "relationships": [
      { "source": "POL001", "target": "C001" }
    ]
  }
  ```
- **数据转换**: 
  - 转换为D3所需的nodes和links格式
  - 计算节点半径和颜色
  - 建立ID映射关系

##### 5.6 经验提炼功能（规划中）
- **访谈数据关联**: 
  - 显示与政策相关的访谈记录
  - 提取关键词标签
- **经验总结展示**: 
  - 基于NLP提取经验要点
  - 按主题分类（产业、就业、基建等）
- **模式识别**: 
  - 识别成功模式的共性特征
  - 生成最佳实践报告

### 6. 智能查询模块（NLP查询）
- **功能**: 基于大语言模型（LLM）的自然语言查询系统
- **组件**: `QueryPage.vue`, `IntelligentQuery.vue`
- **路由**: `/query`
- **API**: `POST /api/nlp/query`
- **技术栈**:
  - **前端**: Vue 3 Composition API + Marked.js（Markdown渲染）
  - **后端**: OpenAI API + 通义千问（DashScope）
  - **数据库**: MySQL查询执行
- **工作流程**:
  1. **用户输入**: 自然语言问题（如"2023年兴和县的GDP和粮食产量是多少？"）
  2. **AI规划**: LLM分析问题并生成查询计划（JSON格式）
     ```json
     {
       "target_table": "economic_indicators",
       "target_county": "兴和县",
       "target_year": 2023,
       "target_indicators": ["gdp", "grain_yield"],
       "need_join": true
     }
     ```
  3. **SQL生成**: 根据查询计划自动生成SQL语句
     ```sql
     SELECT c.county_name, e.year, e.gdp, a.grain_yield
     FROM counties c
     JOIN economic_indicators e ON c.county_id = e.county_id
     JOIN agriculture_indicators a ON c.county_id = a.county_id
     WHERE c.county_name = '兴和县' AND e.year = 2023 AND a.year = 2023
     ```
  4. **数据库执行**: 在真实MySQL数据库中执行查询
  5. **结果分析**: LLM基于查询结果生成自然语言分析报告（Markdown格式）
  6. **前端展示**: 
     - 分析报告（默认展开，支持Markdown渲染）
     - 查询结果数据表（可折叠）
     - 生成的SQL（可折叠）
     - AI分析规划（可折叠）

- **核心特性**:
  - **智能理解**: 自动识别县名、年份、指标类型
  - **表关联**: 智能判断是否需要JOIN多个表
  - **容错处理**: 处理拼写错误、模糊匹配
  - **多轮对话**: 支持上下文理解（规划中）
  - **结果可视化**: 表格展示 + 图表展示（规划中）
  
- **支持的查询类型**:
  - 单县单年查询："2023年兴和县的GDP是多少？"
  - 多指标查询："武川县2022年的GDP和粮食产量"
  - 对比查询："比较林西县和阿尔山市2023年的经济指标"
  - 趋势查询："兴和县2015-2023年GDP变化趋势"
  - 政策查询："哪些县实施了农业扶持政策？"
  
- **数据库Schema支持**:
  系统维护完整的数据库Schema描述，包含16个表的结构信息：
  - 县基础信息表 (`counties`)
  - 7类指标表 (经济、人口、农业、工业、基础设施、教育、医疗)
  - 政策相关表 (`policies`, `policy_resources`, `rel_policy_county`)
  - 访谈相关表 (`interview_data`, `interview_events`, `interviewees`, `researchers`)
  
- **LLM服务实现**:
  - **服务层**: `backend/services/llmService.js`
  - **控制器**: `backend/controllers/nlpController.js`
  - **路由**: `backend/routes/nlpRoutes.js`
  - **API提供商**: 阿里云通义千问（DashScope）
  - **模型**: qwen-plus / qwen-turbo

- **安全机制**:
  - SQL注入防护：使用参数化查询
  - 权限控制：基于用户角色的查询限制
  - 查询超时：防止复杂查询占用过多资源
  - 错误处理：友好的错误提示和降级方案

### 7. SQL查询模块（高级）
- **功能**: 提供直接执行SQL语句的界面，用于体现角色权限差异
- **组件**: `SqlQuery.vue`
- **路由**: `/sql-query`
- **API**: `POST /api/sql/execute`
- **核心特性**:
  - **SQL编辑器**: 
    - 代码高亮显示
    - 多行输入支持
    - 一键清空功能
  - **可视化加载**:
    - 旋转圆环动画
    - 加载文字提示
    - 跳动圆点效果
  - **结果展示**:
    - 动态表头（根据查询结果自动生成）
    - 固定表头滚动
    - 响应式表格设计
    - 记录数统计
  - **权限体现**:
    - admin: 可执行所有SQL（包括DDL、DML、DCL）
    - researcher: 可修改访谈相关表
    - policy_admin: 可修改政策相关表
    - statistician: 可修改指标表
    - analyst: 仅SELECT权限
    - user: 仅SELECT权限（未来可能隐藏此页面）
  - **错误处理**:
    - 语法错误提示
    - 权限不足提示
    - 友好的错误消息展示

### 8. 政策管理模块
- **功能**: 政策信息的CRUD操作
- **API**: `/api/policies/*`
- **特性**: 政策检索、分类管理

## 数据库设计

### 数据库概述
- **数据库名称**: `ci_pae`
- **字符集**: UTF8MB4
- **排序规则**: utf8mb4_unicode_ci
- **数据库引擎**: InnoDB
- **基于**: 832工程系统（全国832个原国家级贫困县）

### 核心表结构

#### 1. 用户认证表
**users** - 用户账号和权限管理
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```
- **字段说明**:
  - `id`: 用户唯一标识
  - `username`: 用户名（唯一）
  - `password`: 加密后的密码
  - `role`: 用户角色（admin/researcher/analyst/policy_admin/statistician/user）
  - `created_at`: 创建时间
  - `updated_at`: 更新时间

#### 2. 县区基础信息表
**counties** - 832个原国家级贫困县基本信息
```sql
CREATE TABLE counties (
  county_id VARCHAR(50) NOT NULL PRIMARY KEY,
  county_name VARCHAR(100) NOT NULL,
  admin_code VARCHAR(20),
  city VARCHAR(50),
  province VARCHAR(50),
  is_poverty_alleviated TINYINT(1) DEFAULT 0,
  alleviation_year INT,
  INDEX idx_province (province),
  INDEX idx_city (city)
);
```
- **字段说明**:
  - `county_id`: 县唯一标识（主键）
  - `county_name`: 县名称
  - `admin_code`: 行政区划代码
  - `city`: 所属地级市
  - `province`: 所属省份
  - `is_poverty_alleviated`: 是否已脱贫（0:否, 1:是）
  - `alleviation_year`: 脱贫年份
- **索引**: 按省份、城市建立索引以优化查询性能

#### 3. 经济与社会发展指标表（7类）

##### 3.1 核心经济指标表
**economic_indicators** - GDP、财政收入、居民收入等核心经济数据
- **主键**: (`county_id`, `year`)
- **外键**: `county_id` → `counties.county_id`
- **核心字段**:
  - `gdp`: 地区生产总值（亿元）
  - `gdp_primary/secondary/tertiary`: 三次产业GDP
  - `gdp_index`: GDP指数（%）
  - `public_budget_income`: 一般公共预算收入（万元）
  - `public_budget_exp`: 一般公共预算支出（万元）
  - `disp_income_total`: 全体居民人均可支配收入（元）
  - `disp_income_urban`: 城镇居民人均可支配收入（元）
  - `disp_income_rural`: 农村居民人均可支配收入（元）
- **特点**: 包含同比增长率（_yoy字段）

##### 3.2 人口与户籍表
**population_indicators** - 土地面积、人口、户数数据
- **核心字段**:
  - `land_area`: 行政区域土地面积（平方公里）
  - `households`: 户籍户数（户）
  - `registered_pop`: 户籍人口（万人）

##### 3.3 农业指标表
**agriculture_indicators** - 耕地、粮食产量等农业数据
- **核心字段**:
  - `arable_land`: 耕地面积（公顷）
  - `high_std_farmland`: 高标准农田面积（公顷）
  - `sown_area`: 农作物总播种面积（公顷）
  - `grain_yield`: 粮食产量（吨）
  - `oil_yield`: 油料产量（吨）

##### 3.4 工业投资贸易表
**industry_trade_indicators** - 工业企业、固定资产投资、出口额
- **核心字段**:
  - `industrial_enterprises`: 规模以上工业企业单位数（个）
  - `industrial_added_value_yoy`: 规模以上工业增加值同比增长（%）
  - `fixed_asset_invest_yoy`: 固定资产投资同比增长（%）
  - `real_estate_invest`: 房地产开发投资（万元）
  - `retail_sales`: 社会消费品零售总额（万元）
  - `export_total_rmb/usd`: 出口总额（人民币/美元）

##### 3.5 基础设施表
**infrastructure_indicators** - 公路、通信等基础设施数据
- **核心字段**:
  - `road_mileage`: 公路里程（公里）
  - `mobile_users`: 移动电话用户（户）
  - `broadband_users`: 互联网宽带接入用户（户）

##### 3.6 教育科技文旅表
**edu_culture_indicators** - 学校、专利、体育场馆等
- **核心字段**:
  - `primary_schools`: 小学学校数（所）
  - `middle_schools`: 普通中学学校数（所）
  - `stadiums`: 体育场馆数（个）
  - `patents_granted`: 全年专利授权（件）
  - `theaters`: 剧场影剧院数（个）

##### 3.7 医疗卫生社保表
**medical_social_indicators** - 医疗床位、社保参保等数据
- **核心字段**:
  - `medical_beds`: 医疗卫生机构床位数（张）
  - `doctors`: 执业（助理）医师数（人）
  - `nurses`: 注册护士数（人）
  - `insurance_users`: 基本养老保险参保人数（人）
  - `medical_insurance_users`: 基本医疗保险参保人数（人）

**所有指标表共同特点**:
- 复合主键: (`county_id`, `year`)
- 外键约束: 关联到 `counties` 表，级联删除/更新
- 增长率字段: 大部分指标包含同比增长率（_yoy后缀）
- 数据类型: 数值型用 DECIMAL 保证精度
- 年份索引: 按年份建立索引优化时间序列查询

#### 4. 政策相关表

##### 4.1 政策表
**policies** - 国家/省/市级扶贫政策
```sql
CREATE TABLE policies (
  policy_id INT PRIMARY KEY AUTO_INCREMENT,
  policy_name VARCHAR(200) NOT NULL,
  policy_type VARCHAR(100),
  issue_org VARCHAR(200),
  issue_date DATE,
  summary TEXT,
  file_number VARCHAR(100),
  INDEX idx_type (policy_type),
  INDEX idx_date (issue_date)
);
```
- **字段说明**:
  - `policy_id`: 政策唯一标识
  - `policy_name`: 政策名称
  - `policy_type`: 政策类型（经济发展/农业扶贫/社会保障等）
  - `issue_org`: 发布机构
  - `issue_date`: 发布日期
  - `summary`: 政策摘要
  - `file_number`: 文号

##### 4.2 政策投入资源表
**policy_resources** - 政策投入的资源和影响指标
```sql
CREATE TABLE policy_resources (
  resource_id INT PRIMARY KEY AUTO_INCREMENT,
  policy_id INT NOT NULL,
  resource_name VARCHAR(200),
  resource_value DECIMAL(20,4),
  resource_unit VARCHAR(50),
  impact_indicator VARCHAR(200),
  FOREIGN KEY (policy_id) REFERENCES policies(policy_id)
);
```

##### 4.3 政策-县区关联表
**rel_policy_county** - 政策与县区的多对多关系及效果强度
```sql
CREATE TABLE rel_policy_county (
  policy_id INT NOT NULL,
  county_id VARCHAR(50) NOT NULL,
  strength DECIMAL(5,2) DEFAULT 0.60,
  PRIMARY KEY (policy_id, county_id),
  FOREIGN KEY (policy_id) REFERENCES policies(policy_id),
  FOREIGN KEY (county_id) REFERENCES counties(county_id)
);
```
- **strength字段**: 政策效果强度（0.20-0.95）
  - 基于4维度指标计算: 经济40% + 农业30% + 基础设施20% + 社保10%
  - 对比政策发布前后2-3年的指标变化
  - 详见 `backend/database/migrations/add_policy_enhancements.sql`

#### 5. 访谈调研相关表

##### 5.1 受访者表
**interviewees** - 扶贫干部、脱贫户等受访者信息
```sql
CREATE TABLE interviewees (
  interviewee_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(100),
  county_id VARCHAR(50),
  contact_info VARCHAR(200),
  FOREIGN KEY (county_id) REFERENCES counties(county_id)
);
```

##### 5.2 访谈事件表
**interview_events** - 访谈活动记录
```sql
CREATE TABLE interview_events (
  event_id INT PRIMARY KEY AUTO_INCREMENT,
  event_name VARCHAR(200),
  event_date DATE,
  county_id VARCHAR(50),
  location VARCHAR(200),
  FOREIGN KEY (county_id) REFERENCES counties(county_id)
);
```

##### 5.3 访谈数据表
**interview_data** - 访谈内容、关键词、经验总结
```sql
CREATE TABLE interview_data (
  data_id INT PRIMARY KEY AUTO_INCREMENT,
  event_id INT NOT NULL,
  content TEXT,
  keywords VARCHAR(500),
  experience_summary TEXT,
  FOREIGN KEY (event_id) REFERENCES interview_events(event_id)
);
```

##### 5.4 调研者表
**researchers** - 调研团队成员信息
```sql
CREATE TABLE researchers (
  researcher_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  institution VARCHAR(200),
  title VARCHAR(100),
  contact_info VARCHAR(200)
);
```

#### 6. 关联表

##### 6.1 受访者-访谈事件关联表
**rel_interviewee_event** - 多对多关系
```sql
CREATE TABLE rel_interviewee_event (
  interviewee_id INT NOT NULL,
  event_id INT NOT NULL,
  PRIMARY KEY (interviewee_id, event_id),
  FOREIGN KEY (interviewee_id) REFERENCES interviewees(interviewee_id),
  FOREIGN KEY (event_id) REFERENCES interview_events(event_id)
);
```

##### 6.2 访谈数据-调研者关联表
**rel_data_researcher** - 多对多关系
```sql
CREATE TABLE rel_data_researcher (
  data_id INT NOT NULL,
  researcher_id INT NOT NULL,
  PRIMARY KEY (data_id, researcher_id),
  FOREIGN KEY (data_id) REFERENCES interview_data(data_id),
  FOREIGN KEY (researcher_id) REFERENCES researchers(researcher_id)
);
```

### 数据库初始化

#### 自动化初始化（推荐）
```bash
# 1. 删除旧数据库（如果存在）
mysql -u root -p -e "DROP DATABASE IF EXISTS ci_pae;"

# 2. 运行初始化脚本
cd backend
node test-init-db.js
```

**初始化流程**:
1. 检查数据库是否存在
2. 创建数据库和表结构（执行 `init.sql`）
3. 初始化数据库角色和权限
4. 植入管理员账号
5. 按顺序导入数据:
   - 真实数据: 832个县的统计指标（`data_all/real/sql/`）
   - 模拟数据: 政策和访谈数据（`data_all/fake/sql/`）
6. 执行数据库迁移（计算政策效果强度等）

#### 数据来源
- **真实数据** (`database/data_all/real/sql/`):
  - `counties.sql` - 832个贫困县基本信息
  - `economic_indicators.sql` - 经济发展指标
  - `population_indicators.sql` - 人口户籍数据
  - `agriculture_indicators.sql` - 农业生产数据
  - `industry_trade_indicators.sql` - 工业投资贸易
  - `infrastructure_indicators.sql` - 基础设施
  - `edu_culture_indicators.sql` - 教育科技文旅
  - `medical_social_indicators.sql` - 医疗卫生社保

- **模拟数据** (`database/data_all/fake/sql/`):
  - `policies.sql` - 11条扶贫政策
  - `policy_resources.sql` - 政策投入资源
  - `interviewees.sql` - 受访者信息
  - `interview_events.sql` - 访谈事件
  - `interview_data.sql` - 访谈内容
  - `researchers.sql` - 调研人员
  - `rel_*.sql` - 各种关联关系

### 数据库连接配置

#### 配置文件位置
- `config/index.js` - 全局配置
- `backend/config/db.js` - 数据库连接池

#### 环境变量配置
`.env` 文件配置:
```env
# 数据库连接
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ci_pae

# 数据库角色密码（用于权限管理）
DB_ROLE_RESEARCHER_PASSWORD=researcher123
DB_ROLE_ANALYST_PASSWORD=analyst123
DB_ROLE_POLICY_ADMIN_PASSWORD=policy_admin123
DB_ROLE_STATISTICIAN_PASSWORD=statistician123

# 管理员账号初始密码
ADMIN_DEFAULT_PASSWORD=admin123
```

#### 连接池配置
```javascript
// backend/config/db.js
const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

### 数据库权限管理

#### 角色体系
系统实现了基于角色的数据库权限控制（RBAC）:

1. **admin** - 管理员
   - 使用root权限
   - 可以执行所有SQL操作
   - 可以管理用户表（users）
   - 可以修改其他用户的角色和密码

2. **researcher** - 调研人员
   - 对访谈相关表有 INSERT, UPDATE, DELETE 权限
   - 相关表: `interviewees`, `interview_events`, `interview_data`, `researchers`
   - 对所有表（除users）有 SELECT 权限

3. **policy_admin** - 政策管理员
   - 对政策相关表有 INSERT, UPDATE, DELETE 权限
   - 相关表: `policies`, `policy_resources`, `rel_policy_county`
   - 对所有表（除users）有 SELECT 权限

4. **statistician** - 统计员
   - 对所有指标表有 INSERT, UPDATE, DELETE 权限
   - 相关表: 7个指标表（economic/population/agriculture等）
   - 对所有表（除users）有 SELECT 权限

5. **analyst** - 分析师
   - 只有 SELECT 权限
   - 可以查询所有表（除users）
   - 可以使用SQL查询页面

6. **user** - 普通用户
   - 只有 SELECT 权限
   - 可以查询所有表（除users）
   - 无法使用SQL查询页面（未来实现）

#### 权限初始化
权限在数据库初始化时自动创建:
```javascript
// backend/config/initDb.js
async function initPrivileges() {
  // 创建5个角色（admin使用root）
  // 为每个角色分配相应的表权限
  // 使用 GRANT 语句精确控制权限
}
```

#### 权限实现机制
```javascript
// backend/config/db.js
function getPoolForRole(role) {
  if (role === 'admin') return rootPool;
  if (role === 'researcher') return researcherPool;
  if (role === 'policy_admin') return policyAdminPool;
  if (role === 'statistician') return statisticianPool;
  if (role === 'analyst') return analystPool;
  return userPool; // 默认用户权限
}
```

### 数据库迁移

#### 迁移文件位置
`backend/database/migrations/` - 数据库结构变更和数据更新脚本

#### 核心迁移脚本
**add_policy_enhancements.sql** - 政策效果强度计算
- **Section 1-6**: 数据清理和验证
- **Section 7**: 复杂的strength计算逻辑
  ```sql
  -- 4维度加权计算:
  -- 经济维度 (40%): GDP增长 + 农村收入增长
  -- 农业维度 (30%): 粮食产量增长 + 耕地面积变化
  -- 基础设施维度 (20%): 公路里程增长 + 宽带用户增长
  -- 社保维度 (10%): 医疗床位增长 + 社保参保增长
  
  -- 时间对比: 政策发布日期前2年 vs 发布后1-3年
  -- 归一化处理: GDP增长15%→1.0, 粮食8%→1.0等
  -- 最终范围: GREATEST(0.20, LEAST(0.95, 加权总和))
  ```

#### 迁移执行
迁移在初始化过程中自动执行:
```javascript
// backend/config/initDb.js
async function runMigrations() {
  const migrations = fs.readdirSync(migrationsDir);
  for (const file of migrations) {
    await executeSqlFile(path.join(migrationsDir, file));
  }
}
```

### 数据备份与恢复

#### 备份整个数据库
```bash
# Windows PowerShell
mysqldump -u root -p ci_pae > "backup_$(Get-Date -Format 'yyyyMMdd').sql"

# 仅备份结构（不含数据）
mysqldump -u root -p --no-data ci_pae > schema_only.sql
```

#### 恢复数据库
```bash
# 删除旧库并恢复
mysql -u root -p -e "DROP DATABASE IF EXISTS ci_pae;"
mysql -u root -p -e "CREATE DATABASE ci_pae CHARACTER SET utf8mb4;"
mysql -u root -p ci_pae < backup.sql
```

### 数据库性能优化

#### 索引策略
1. **主键索引**: 所有表都有主键
2. **外键索引**: 自动为外键字段创建索引
3. **复合索引**: 指标表使用 (county_id, year) 复合主键
4. **查询索引**: 
   - counties表: province, city索引
   - policies表: policy_type, issue_date索引

#### 查询优化
```sql
-- 使用索引的高效查询示例
-- 按省份统计县数
SELECT province, COUNT(*) FROM counties 
GROUP BY province; -- 使用idx_province索引

-- 查询某年某县指标
SELECT * FROM economic_indicators 
WHERE county_id = 'C001' AND year = 2020; -- 使用主键索引

-- 按政策类型查询
SELECT * FROM policies 
WHERE policy_type = '经济发展' 
ORDER BY issue_date DESC; -- 使用idx_type和idx_date索引
```

#### 连接池优化
- **连接限制**: 10个并发连接
- **等待机制**: 启用连接等待队列
- **连接复用**: 自动管理连接生命周期

### 数据完整性约束

#### 外键约束
- **级联删除**: 删除县时自动删除相关指标数据
- **级联更新**: 更新县ID时自动更新关联表
- **引用完整性**: 防止插入无效的county_id

#### 数据验证
- **NOT NULL**: 关键字段必填
- **UNIQUE**: 用户名唯一性
- **DEFAULT**: 合理的默认值（如角色默认为'user'）
- **CHECK**: 数值范围验证（如strength范围0.20-0.95）

### 安全最佳实践

1. **密码存储**: 使用bcrypt加密用户密码
2. **环境变量**: 敏感信息不提交到Git
3. **角色隔离**: 不同角色使用不同的数据库用户
4. **最小权限**: 每个角色只授予必要的权限
5. **审计日志**: 记录敏感操作（未来实现）
6. **定期备份**: 建议每日备份生产数据库

## API设计

### 统一响应格式
```json
{
  "ok": true,
  "data": {...}
}
// 或
{
  "ok": false,
  "error": "错误信息"
}
```

### 主要API端点

#### 认证相关
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/logout` - 用户登出

#### 数据获取
- `GET /api/data/summary` - 获取数据摘要
- `GET /api/analysis/cities` - 获取城市列表
- `GET /api/analysis/counties` - 获取县区列表
- `GET /api/analysis/all-counties` - 获取所有县区
- `GET /api/analysis/indicators/tree` - 获取指标树
- `GET /api/analysis/policy-types` - 获取政策类型

#### 分析功能
- `POST /api/analysis/data` - 获取分析数据
- `GET /api/analysis/export/csv` - 导出CSV
- `POST /api/analysis/report` - 生成分析报告

#### 智能查询
- `POST /api/nlp/query` - NLP智能查询

#### 仪表盘
- `GET /api/dashboard/*` - 仪表盘数据

#### 对比分析
- `/compare/*` - 对比分析相关API

## 开发环境配置

### 端口配置
- **后端**: 3001端口
- **前端**: 5174端口
- **代理**: 前端通过Vite代理将`/api`请求转发到后端

### 启动命令

#### 后端启动
```bash
cd backend
npm install
npm run dev  # 开发模式（使用nodemon）
npm start    # 生产模式
```

#### 前端启动
```bash
cd frontend
npm install
npm run dev  # 开发模式
npm run build  # 构建生产版本
npm run serve  # 预览生产构建
```

## 用户认证与权限系统

### 认证机制

#### Token认证流程
1. **用户登录**: 
   - 前端: `Login.vue` 提交用户名、密码和角色选择
   - API: `POST /api/auth/login`
   - 验证: bcrypt密码验证
   - 返回: 生成token并返回用户信息

2. **Token存储**:
   - 使用 localStorage 存储token和用户信息
   - 格式: `{ token, user: { username, role } }`

3. **请求拦截**:
   ```javascript
   // frontend/src/utils/request.js
   axios.interceptors.request.use(config => {
     const token = localStorage.getItem('token');
     if (token) {
       config.headers['Authorization'] = `Bearer ${token}`;
     }
     return config;
   });
   ```

4. **路由守卫**:
   ```javascript
   // frontend/src/router/index.js
   router.beforeEach((to, from, next) => {
     const token = localStorage.getItem('token');
     if (to.path !== '/login' && !token) {
       next('/login'); // 未登录跳转到登录页
     } else {
       next();
     }
   });
   ```

5. **后端验证**:
   ```javascript
   // backend/middleware/auth.js
   const auth = (req, res, next) => {
     const token = req.headers['authorization'];
     if (!token) return res.status(401).json({ ok: false, error: '未授权' });
     // 验证token...
     next();
   };
   ```

### 角色权限体系（RBAC）

#### 六大角色定义

##### 1. admin（系统管理员）
- **权限范围**: 最高权限
- **数据库权限**: 使用root连接，可执行所有SQL操作
- **功能权限**:
  - ✅ 访问所有页面和功能
  - ✅ 执行任意SQL语句（包括DDL、DML、DCL）
  - ✅ 管理用户表（users）
  - ✅ 修改其他用户的角色和密码
  - ✅ 删除数据库（危险操作）
- **使用场景**: 系统维护、用户管理、数据库管理
- **初始账号**: 
  - 用户名: `admin`
  - 密码: 由 `.env` 中的 `ADMIN_DEFAULT_PASSWORD` 配置
  - 初始化: 在数据库初始化时自动创建

##### 2. researcher（调研人员）
- **权限范围**: 访谈数据管理
- **数据库权限**: 
  - 相关表: `interviewees`, `interview_events`, `interview_data`, `researchers`
  - 操作: INSERT, UPDATE, DELETE, SELECT
  - 其他表: 仅SELECT
  - 禁止: 访问users表
- **功能权限**:
  - ✅ 录入访谈记录
  - ✅ 编辑受访者信息
  - ✅ 管理访谈事件
  - ✅ 使用SQL查询页面（受权限限制）
  - ✅ 查看所有分析页面
- **使用场景**: 田野调查、访谈数据录入、经验总结提取
- **注册方式**: 注册时选择"调研人员"角色

##### 3. policy_admin（政策管理员）
- **权限范围**: 政策数据管理
- **数据库权限**:
  - 相关表: `policies`, `policy_resources`, `rel_policy_county`
  - 操作: INSERT, UPDATE, DELETE, SELECT
  - 其他表: 仅SELECT
  - 禁止: 访问users表
- **功能权限**:
  - ✅ 添加新政策
  - ✅ 编辑政策信息
  - ✅ 管理政策资源投入
  - ✅ 维护政策-县区关联关系
  - ✅ 使用SQL查询页面（受权限限制）
- **使用场景**: 政策信息维护、政策效果评估数据录入
- **注册方式**: 注册时选择"政策管理员"角色

##### 4. statistician（统计员）
- **权限范围**: 统计指标数据管理
- **数据库权限**:
  - 相关表: 7个指标表
    - `economic_indicators` (经济指标)
    - `population_indicators` (人口指标)
    - `agriculture_indicators` (农业指标)
    - `industry_trade_indicators` (工业贸易)
    - `infrastructure_indicators` (基础设施)
    - `edu_culture_indicators` (教育文化)
    - `medical_social_indicators` (医疗社保)
  - 操作: INSERT, UPDATE, DELETE, SELECT
  - 其他表: 仅SELECT
  - 禁止: 访问users表
- **功能权限**:
  - ✅ 录入各项经济社会指标
  - ✅ 更新统计数据
  - ✅ 批量导入CSV数据
  - ✅ 使用SQL查询页面（受权限限制）
- **使用场景**: 统计年鉴数据录入、指标更新、数据校验
- **注册方式**: 注册时选择"统计员"角色

##### 5. analyst（分析师）
- **权限范围**: 只读分析权限
- **数据库权限**:
  - 所有表（除users）: 仅SELECT
  - 禁止: 任何写操作、访问users表
- **功能权限**:
  - ✅ 访问所有分析页面
  - ✅ 使用智能查询（NLP查询）
  - ✅ 使用SQL查询页面（仅SELECT）
  - ✅ 导出数据为CSV
  - ❌ 不能修改任何数据
- **使用场景**: 数据分析、报告生成、趋势研究
- **注册方式**: 注册时选择"分析师"角色

##### 6. user（普通用户）
- **权限范围**: 基础只读权限
- **数据库权限**:
  - 所有表（除users）: 仅SELECT
  - 禁止: 任何写操作、访问users表
- **功能权限**:
  - ✅ 访问仪表盘
  - ✅ 查看分析页面
  - ✅ 使用智能查询（NLP查询）
  - ❌ 无法使用SQL查询页面（未来实现）
  - ❌ 不能修改任何数据
- **使用场景**: 浏览数据、简单查询
- **注册方式**: 注册时默认角色或选择"普通用户"

#### 角色对比表

| 功能/权限 | admin | researcher | policy_admin | statistician | analyst | user |
|---------|-------|------------|--------------|--------------|---------|------|
| 查看仪表盘 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 查看分析页面 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 智能查询(NLP) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| SQL查询页面 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| 修改访谈数据 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 修改政策数据 | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| 修改指标数据 | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| 管理用户 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 执行DDL语句 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 权限实现机制

#### 数据库层面权限控制

##### 1. 多连接池架构
```javascript
// backend/config/db.js

// Root连接池（admin使用）
const rootPool = mysql.createPool({
  host: config.db.host,
  user: 'root',
  password: config.db.password,
  database: config.db.name
});

// 角色连接池（其他角色使用）
const researcherPool = mysql.createPool({
  host: config.db.host,
  user: 'researcher',
  password: process.env.DB_ROLE_RESEARCHER_PASSWORD,
  database: config.db.name
});

// ... 其他角色连接池

// 根据角色获取连接池
function getPoolForRole(role) {
  switch(role) {
    case 'admin': return rootPool;
    case 'researcher': return researcherPool;
    case 'policy_admin': return policyAdminPool;
    case 'statistician': return statisticianPool;
    case 'analyst': return analystPool;
    default: return userPool;
  }
}
```

##### 2. 数据库角色初始化
```javascript
// backend/config/initDb.js

async function initPrivileges() {
  // 1. 删除旧角色（如果存在）
  await executeQuery("DROP USER IF EXISTS 'researcher'@'localhost'");
  
  // 2. 创建数据库用户
  await executeQuery(`
    CREATE USER 'researcher'@'localhost' 
    IDENTIFIED BY '${process.env.DB_ROLE_RESEARCHER_PASSWORD}'
  `);
  
  // 3. 授予表权限
  await executeQuery(`
    GRANT SELECT, INSERT, UPDATE, DELETE 
    ON ci_pae.interviewees TO 'researcher'@'localhost'
  `);
  
  await executeQuery(`
    GRANT SELECT, INSERT, UPDATE, DELETE 
    ON ci_pae.interview_events TO 'researcher'@'localhost'
  `);
  
  // 4. 授予其他表的只读权限
  await executeQuery(`
    GRANT SELECT ON ci_pae.* TO 'researcher'@'localhost'
  `);
  
  // 5. 撤销users表权限
  await executeQuery(`
    REVOKE ALL PRIVILEGES ON ci_pae.users 
    FROM 'researcher'@'localhost'
  `);
  
  // 6. 刷新权限
  await executeQuery("FLUSH PRIVILEGES");
}
```

#### 应用层面权限控制

##### 1. SQL查询权限验证
```javascript
// backend/controllers/sqlController.js

exports.executeQuery = async (req, res) => {
  try {
    const { sql } = req.body;
    const userRole = req.user.role; // 从token中获取
    
    // 根据角色获取对应的连接池
    const pool = getPoolForRole(userRole);
    
    // 执行SQL（权限由数据库层控制）
    const [results] = await pool.query(sql);
    
    res.json({ ok: true, data: results });
  } catch (error) {
    // 权限错误特殊处理
    if (error.code === 'ER_TABLEACCESS_DENIED_ERROR') {
      return res.status(403).json({ 
        ok: false, 
        error: '权限不足：您没有权限访问此表' 
      });
    }
    res.status(500).json({ ok: false, error: error.message });
  }
};
```

##### 2. 前端路由权限控制
```javascript
// frontend/src/router/index.js

const routes = [
  {
    path: '/sql-query',
    name: 'SqlQuery',
    component: () => import('@/views/SqlQuery.vue'),
    meta: { 
      requiresAuth: true,
      // 未来可添加角色限制
      // allowedRoles: ['admin', 'researcher', 'policy_admin', 'statistician', 'analyst']
    }
  }
];

router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (to.meta.requiresAuth && !user.username) {
    next('/login');
  } else if (to.meta.allowedRoles && !to.meta.allowedRoles.includes(user.role)) {
    next('/'); // 权限不足，跳转首页
  } else {
    next();
  }
});
```

### 用户注册与初始化

#### 注册流程
1. **前端表单**: `Login.vue` 提供注册选项卡
   - 输入: 用户名、密码、确认密码
   - 选择: 角色下拉框（6个角色选项）
   
2. **API调用**: `POST /api/auth/register`
   ```json
   {
     "username": "zhang_san",
     "password": "password123",
     "role": "researcher"
   }
   ```

3. **后端验证**:
   ```javascript
   // backend/services/authService.js
   exports.register = async (username, password, role) => {
     // 1. 检查用户名是否已存在
     const existing = await findUserByUsername(username);
     if (existing) throw new Error('用户名已存在');
     
     // 2. 验证角色是否合法
     const validRoles = ['admin', 'researcher', 'analyst', 
                         'policy_admin', 'statistician', 'user'];
     if (!validRoles.includes(role)) {
       role = 'user'; // 非法角色回退为user
     }
     
     // 3. 密码加密
     const hashedPassword = await bcrypt.hash(password, 10);
     
     // 4. 插入数据库
     await insertUser({ username, password: hashedPassword, role });
   };
   ```

4. **数据存储**: 
   ```sql
   INSERT INTO users (username, password, role, created_at, updated_at)
   VALUES (?, ?, ?, NOW(), NOW())
   ```

#### 管理员初始化
```javascript
// backend/config/initDb.js

async function seedAdminUser() {
  const adminUsername = 'admin';
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
  
  // 检查是否已存在admin
  const existing = await findUserByUsername(adminUsername);
  if (existing) {
    console.log('Admin user already exists');
    return;
  }
  
  // 创建admin账号
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  await executeQuery(`
    INSERT INTO users (username, password, role)
    VALUES (?, ?, 'admin')
  `, [adminUsername, hashedPassword]);
  
  console.log('Admin user created successfully');
}
```

### 安全最佳实践

#### 1. 密码安全
- **加密算法**: bcrypt (cost factor = 10)
- **密码强度**: 建议至少8位，包含字母和数字
- **密码存储**: 永不存储明文密码
- **密码重置**: 支持管理员重置（未来实现）

#### 2. Token安全
- **生成**: 使用加密算法生成随机token
- **有效期**: 建议7天（可配置）
- **刷新机制**: Token过期自动跳转登录页
- **存储**: localStorage（生产环境建议使用httpOnly cookie）

#### 3. SQL注入防护
- **参数化查询**: 所有预设查询使用占位符
- **智能查询**: LLM生成的SQL经过验证
- **权限隔离**: 不同角色使用不同数据库用户
- **输入验证**: 前端和后端双重验证

#### 4. 权限最小化
- **按需授权**: 每个角色只授予必要的表权限
- **操作级控制**: 精确到SELECT/INSERT/UPDATE/DELETE
- **表级隔离**: users表对所有非admin角色不可见
- **审计追踪**: 记录敏感操作（规划中）

### 权限问题排查

#### 常见问题

**问题1**: "权限不足：您没有权限访问此表"
- **原因**: 当前角色没有该表的操作权限
- **解决**: 
  - 检查用户角色是否正确
  - 使用admin账号执行GRANT语句授权
  - 重新初始化数据库权限

**问题2**: admin角色丢失
- **原因**: 误将admin账号的role改为其他值
- **解决**: 
  ```bash
  # 删除数据库重新初始化
  mysql -u root -p -e "DROP DATABASE IF EXISTS ci_pae;"
  cd backend && node test-init-db.js
  ```

**问题3**: 角色未初始化
- **检查**: 
  ```sql
  SELECT User, Host FROM mysql.user WHERE User IN ('researcher', 'analyst', 'policy_admin', 'statistician');
  ```
- **解决**: 重新运行initDb.js

### 数据安全
- 环境变量配置敏感信息
- 数据库连接池管理
- 错误处理统一机制
- 基于角色的访问控制（RBAC）
- 审计日志（规划中）

## 性能优化

### 前端优化
- Vite构建优化
- 组件懒加载
- API请求拦截和统一处理

### 后端优化
- 数据库连接池
- 中间件优化
- 错误处理机制

## 部署架构

### 开发环境
- 前后端分离开发
- 热重载支持
- 代理解决跨域问题

### 生产环境（建议）
- 前端构建为静态文件
- 后端独立部署
- 数据库独立服务器
- Nginx反向代理

## 扩展计划

### 短期计划
1. 完善JWT认证机制
2. 添加单元测试
3. 完善错误处理
4. 优化数据库查询

### 中期计划
1. 集成真实的AI模型
2. 添加数据可视化组件
3. 实现实时数据更新
4. 添加用户权限管理

### 长期计划
1. 微服务架构升级
2. 大数据处理能力
3. 机器学习模型集成
4. 移动端适配

## 代码规范

### 后端规范
- MVC架构模式
- 统一错误处理
- 中间件机制
- 服务层抽象

### 前端规范
- 组件化开发
- 路由守卫
- API统一管理
- 响应式设计

## 总结

CI-PAE项目是一个架构清晰、功能完整的扶贫经验智能提取系统。项目采用现代化的技术栈，具有良好的可扩展性和维护性。当前项目已具备基本的数据分析、对比和智能查询功能，为扶贫工作提供了数据支持和决策辅助。

项目当前处于开发阶段，部分功能还在完善中，特别是AI模型集成和高级分析功能有待进一步开发。但整体架构设计合理，为后续功能扩展奠定了良好基础。