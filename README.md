## 项目概述

**CI-PAE**（Campaign Imprints: Intelligent Extraction System for Poverty Alleviation Experience）是一个全栈 Web 应用，展示了用于数据分析和自然语言处理（NLP）驱动洞察的骨架架构。项目分为以下两个部分：

- **后端**：基于 Express.js 的 API（运行在 3001 端口），采用 controller → service → mock-data 的分层结构
- **前端**：基于 Vue 3 + Vite 的单页应用（SPA，运行在 5174 端口），使用基于路由的导航和 Axios API 客户端

**关键背景**：当前后端服务返回的是模拟数据，数据库/机器学习模型的集成点位于 `backend/services/` 中，标记为 `TODO`。

---

## 架构模式

### 后端请求流程

```
前端 API 调用 → Vite 代理 (/api → localhost:3001)
  ↓
Express 路由 (/api/*)
  ↓
中间件（认证、CORS、body-parser）
  ↓
控制器（解析请求）
  ↓
服务层（业务逻辑 + 数据获取，当前为模拟数据）
  ↓
响应（JSON 格式：{ok, data/error}）
```

**关键文件**：

- `backend/app.js`：Express 应用设置及中间件管道
- `backend/routes/index.js`：端点定义（3 个接口：data、analysis、nlp）
- `backend/controllers/`：请求处理器，调用服务层
- `backend/services/`：模拟实现——可替换为真实数据或模型

### 前端架构

- **入口**：`frontend/src/main.js` 启动 Vue 应用并加载路由
- **布局**：`App.vue` 包含 `AppHeader` + `AppSidebar` + `<router-view>`
- **路由**（4 个页面）：Dashboard、Analysis、Patterns、Compare（定义在 `frontend/src/router/index.js`）
- **API 客户端**：`frontend/src/api/index.js` 提供统一的后端调用接口（如 `.data.fetchSummary()`、`.analysis.runReport()`、`.nlp.query()`）

### 数据流

前端组件引入 API 客户端 → 调用方法并传参 → Vite 开发服务器代理到后端 → 控制器处理 → 服务层返回模拟数据 → 响应返回前端组件

---

## 开发流程

### 安装与运行

```bash
# 首次安装
cd CI_PAE\backend
npm install

cd CI_PAE\frontend
npm install

# 终端 1：后端（使用 nodemon 监听）
cd backend && npm run dev  # 监听 server.js，修改自动重启

# 终端 2：前端（Vite 开发服务器）
cd frontend && npm run dev  # .vue/.js 修改后热更新，/api 请求代理到后端
```

**端口说明**：后端 3001，前端 5174（Vite 代理解决跨域）

### 构建生产版本

```bash
cd frontend && npm run build  # 生成 dist/ 目录，包含优化后的打包文件
npm run serve  # 本地预览生产构建结果
```

---

## 关键规范与模式

### 端点结构

所有后端接口遵循 `/api/{domain}/{action}` 格式：

- `/api/data/summary`（GET）——获取统计数据，支持 `period` 查询参数
- `/api/analysis/report`（POST）——生成分析报告
- `/api/nlp/query`（POST）——处理自然语言查询

**统一响应格式**：

```json
{ "ok": true, "data": {...} }  // 成功
{ "ok": false, "error": "..." }  // 失败
```

### 服务层实现模板

在 `backend/services/` 中添加真实功能时，参考以下结构：

```javascript
// 当前模拟模式（如 dataService.js）：
exports.fetchSummary = async (params) => {
  // TODO: 替换为数据库查询
  return { totalCount: 12345, counties: 12, period: params.period || '2015-2020' }
}

// 替换后的预期模式：
// - 查询数据库或调用 ML 模型
// - 在服务中处理错误（抛给控制器的 try-catch）
// - 返回与模拟数据结构一致的结果
```

### 前端 API 调用

所有后端请求必须通过统一的 API 客户端（`frontend/src/api/index.js`）：

```javascript
import api from '@/api'

// 在组件中使用：
const result = await api.data.fetchSummary({ period: '2020-2024' })
const report = await api.analysis.runReport({ type: 'detailed' })
```

禁止硬编码 Axios 实例——新增端点必须先添加到 `api/index.js`

### 认证机制

当前为**占位实现**：通过 `x-api-key` 请求头进行简单校验（`backend/middleware/auth.js` 中的 dev-key）。所有请求目前都放行。生产环境应替换为 JWT 验证。

---

## 文件组织与职责说明

| 路径                                     | 用途                                                 |
| ---------------------------------------- | ---------------------------------------------------- |
| `backend/app.js`                       | Express 应用设置与中间件配置                         |
| `backend/server.js`                    | 服务入口文件（绑定端口）                             |
| `backend/routes/index.js`              | 接口路由定义                                         |
| `backend/controllers/*.js`             | 请求处理器，负责参数解析                             |
| `backend/services/*.js`                | **【集成点】** 业务逻辑与数据获取              |
| `backend/middleware/*.js`              | 认证、错误处理等中间件                               |
| `frontend/src/main.js`                 | Vue 应用启动入口                                     |
| `frontend/src/router/index.js`         | 路由定义（4 个视图）                                 |
| `frontend/src/api/index.js`            | **【集成点】** Axios 客户端与命名空间方法      |
| `frontend/src/components/Layout/*.vue` | 头部、侧边栏等全局布局组件                           |
| `frontend/src/views/*.vue`             | 页面级组件（Dashboard、Analysis、Patterns、Compare） |
| `frontend/vite.config.js`              | 开发代理配置与构建设置                               |
| `config/index.js`                      | 中心化配置（端口、API 前缀等）                       |

---

## 常见任务与操作指南

### 添加新的后端接口

1. 在 `backend/routes/index.js` 定义路由（如：`router.get('/feature/action', featureController.action)`）
2. 创建/更新控制器 `backend/controllers/featureController.js`，添加 try-catch 包装
3. 在 `backend/services/featureService.js` 实现服务方法
4. 在 `frontend/src/api/index.js` 添加对应的命名空间方法

### 添加新的前端页面

1. 在 `frontend/src/views/` 创建 `.vue` 文件（如：`NewPage.vue`）
2. 在 `frontend/src/router/index.js` 中导入并添加路由
3. 在 `frontend/src/components/Layout/AppSidebar.vue` 中添加导航链接

### 后端调试技巧

- 查看 `backend/middleware/errorHandler.js` 了解错误响应格式
- nodemon 会输出日志，终端中可查看 console.log 输出
- 在服务中使用 `console.log()` 跟踪数据流

### 前端调试技巧

- Vite 会将构建警告输出到浏览器控制台和终端
- 使用 Vue DevTools 插件查看组件状态
- 在浏览器 Network 面板中检查 `/api` 请求是否成功代理到后端

---

## 下一步集成建议

1. **数据库连接**（在 `backend/services/` 中）

   - 替换模拟数据为真实查询
   - 保持响应格式一致，如 `{ totalCount, counties, period }`
2. **ML/NLP 模型集成**（在 `backend/services/nlpService.js` 中）

   - 当前为占位：`nlpController.query()` → 服务层
   - 期望：处理自然语言输入，返回分析结果
3. **认证机制增强**（在 `backend/middleware/auth.js` 中）

   - 从 x-api-key 升级为 JWT 验证
   - 在请求对象中添加用户上下文
4. **前端状态管理**（可选）

   - 若多视图间数据共享复杂，可考虑引入 Pinia 或 Vuex
   - 当前为简单模式，各视图自行获取数据

---

## 给 AI 助手的说明

- **Monorepo 结构**：修改前请确认是 `/backend` 还是 `/frontend`
- **模拟 vs 真实**：服务层当前返回硬编码数据，`TODO` 注释为替换入口
- **端口依赖**：必须先启动后端，前端依赖其代理 `/api` 请求
- **暂无测试**：扩展时可考虑添加 Jest（后端）或 Vitest（前端）

---
