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

## 核心功能模块

### 1. 用户认证模块
- **功能**: 用户登录、注册、登出
- **实现**: 简单的token认证机制
- **路由**: `/login`
- **API**: `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`

### 2. 数据仪表盘模块
- **功能**: 展示扶贫数据的统计概览
- **组件**: `Dashboard.vue`
- **API**: `/api/dashboard/*`
- **特性**: 数据可视化、实时统计

### 3. 分析模块
- **功能**: 扶贫数据的深度分析
- **组件**: `Analysis.vue`
- **API**: `/api/analysis/*`
- **子功能**:
  - 城市列表获取 (`/api/analysis/cities`)
  - 县区列表获取 (`/api/analysis/counties`)
  - 指标树结构 (`/api/analysis/indicators/tree`)
  - 政策类型 (`/api/analysis/policy-types`)
  - 数据分析 (`/api/analysis/data`)
  - CSV导出 (`/api/analysis/export/csv`)

### 4. 对比分析模块
- **功能**: 不同地区扶贫政策的对比分析
- **组件**: `Compare.vue`
- **API**: `/api/compare/*`
- **特性**: 多维度对比、可视化展示

### 5. 模式分析模块
- **功能**: 扶贫模式识别和规律发现
- **组件**: `Patterns.vue`
- **特性**: 模式识别、趋势分析

### 6. 智能查询模块
- **功能**: 基于NLP的自然语言查询
- **组件**: `QueryPage.vue`
- **API**: `/api/nlp/query`
- **特性**: 自然语言处理、智能问答

### 7. 政策管理模块
- **功能**: 政策信息的CRUD操作
- **API**: `/api/policies/*`
- **特性**: 政策检索、分类管理

## 数据库设计

### 主要表结构
1. **counties**: 县区信息表
   - `county_id`: 县区ID
   - `county_name`: 县区名称
   - `city`: 所属城市
   - `province`: 省份

2. **扶贫指标表**: 存储各项扶贫数据指标

3. **政策表**: 存储扶贫政策信息

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

## 安全机制

### 认证机制
- **当前**: 简单的API Key认证
- **待升级**: JWT认证
- **路由守卫**: 前端实现路由级别的权限控制

### 数据安全
- 环境变量配置敏感信息
- 数据库连接池管理
- 错误处理统一机制

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