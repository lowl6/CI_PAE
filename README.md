# CI-PAE: 脱贫攻坚经验智能提炼系统

<div align="center">

![CI-PAE Logo](https://img.shields.io/badge/CI-PAE-v1.0.0-blue.svg)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.2+-brightgreen.svg)](https://vuejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**基于Vue 3 + Node.js的扶贫经验智能提取与数据分析平台**

[在线演示](https://lowl6.github.io/CI_PAE/) | [项目文档](./docs) | [快速开始](#快速开始) | [贡献指南](./CONTRIBUTING.md)

</div>

## 📋 项目概述

**CI-PAE** (Campaign Imprints: Intelligent Extraction System for Poverty Alleviation Experience) 是一个现代化的全栈Web应用，专注于扶贫政策的智能分析、数据可视化和经验提取。系统通过数据挖掘、自然语言处理等技术，为扶贫工作提供科学决策支持。

### 🎯 核心功能

- **📊 数据可视化**: 动态图表展示扶贫成效
- **🔍 智能分析**: 多维度数据对比与趋势分析
- **🤖 AI查询**: 基于NLP的自然语言智能问答
- **📱 响应式设计**: 支持PC、平板、手机多端访问
- **👥 用户管理**: 完整的认证授权体系
- **📈 实时监控**: 扶贫指标实时跟踪

### 🛠️ 技术栈

#### 前端技术
- **框架**: Vue 3.2+ (Composition API)
- **构建工具**: Vite 5.0+
- **UI组件**: Ant Design Vue 4.2+
- **状态管理**: Vue Router 4.2+
- **可视化**: ECharts 6.0+ / D3.js 7.9+
- **HTTP客户端**: Axios 1.4+
- **样式**: Less 4.4+

#### 后端技术
- **运行环境**: Node.js 18+
- **Web框架**: Express.js 4.18+
- **数据库**: MySQL 8.0+
- **认证**: JWT (开发阶段简化版)
- **AI集成**: OpenAI API 6.9+
- **开发工具**: Nodemon 2.0+

#### 架构设计
- **模式**: 前后端分离架构
- **API风格**: RESTful API
- **数据格式**: JSON
- **部署**: Docker / 传统部署

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- MySQL >= 8.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/lowl6/CI_PAE.git
cd CI_PAE
```

2. **安装依赖**
```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

3. **配置环境变量**
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量，配置数据库连接等
vim .env
```

4. **初始化数据库**
```bash
cd backend
npm run init-db  # 自动创建数据库和表结构
```

5. **启动服务**
```bash
# 启动后端服务 (端口3001)
cd backend
npm run dev

# 启动前端服务 (端口5174) - 新终端
cd frontend
npm run dev
```

6. **访问应用**
- 前端应用: [http://localhost:5174](http://localhost:5174)
- 后端API: [http://localhost:3001/api](http://localhost:3001/api)

## 📁 项目结构

```
CI_PAE/
├── docs/                       # 项目文档
│   ├── API.md                  # API接口文档
│   ├── DEPLOYMENT.md           # 部署指南
│   ├── DEVELOPMENT.md          # 开发指南
│   └── DATABASE.md             # 数据库设计
├── frontend/                   # 前端应用
│   ├── public/                 # 静态资源
│   ├── src/                    # 源代码
│   │   ├── api/                # API调用
│   │   ├── components/         # 通用组件
│   │   ├── router/             # 路由配置
│   │   ├── utils/              # 工具函数
│   │   ├── views/              # 页面组件
│   │   └── assets/             # 资源文件
│   ├── package.json
│   └── vite.config.js
├── backend/                    # 后端应用
│   ├── config/                 # 配置文件
│   ├── controllers/            # 控制器层
│   ├── middleware/             # 中间件
│   ├── routes/                 # 路由定义
│   ├── services/               # 业务逻辑层
│   ├── database/               # 数据库相关
│   ├── package.json
│   └── server.js
├── scripts/                    # 脚本文件
├── tests/                      # 测试文件
├── .env.example               # 环境变量模板
├── package.json               # 项目配置
└── README.md                  # 项目说明
```

## 🔧 开发模式

### 本地开发

```bash
# 启动开发环境 (热重载)
npm run dev

# 启动生产环境构建
npm run build
```

### 局域网部署

```bash
# 启动局域网模式
npm run dev:lan

# 或使用环境变量
VITE_APP_ENV=lan npm run dev -- --host 0.0.0.0
```

### 生产环境部署

```bash
# 构建生产版本
npm run build

# 启动生产服务
npm run start
```

## 📊 功能模块

### 1. 用户认证模块
- 用户注册/登录
- JWT认证授权
- 权限管理

### 2. 数据仪表盘
- 实时数据概览
- 关键指标监控
- 可视化图表展示

### 3. 深度分析模块
- 多维度数据分析
- 趋势预测
- 对比分析

### 4. 智能查询模块
- 自然语言处理
- 智能问答
- 语义搜索

### 5. 政策管理模块
- 政策信息管理
- 政策效果评估
- 经验提炼

## 🔌 API接口

### 认证相关
```http
POST /api/auth/login    # 用户登录
POST /api/auth/register # 用户注册
POST /api/auth/logout   # 用户登出
```

### 数据分析
```http
GET  /api/analysis/cities           # 获取城市列表
GET  /api/analysis/counties         # 获取县区列表
GET  /api/analysis/indicators/tree  # 获取指标树
POST /api/analysis/data             # 获取分析数据
```

### 智能查询
```http
POST /api/nlp/query  # 自然语言查询
```

详细API文档请参考: [API文档](./docs/API.md)

## 🗄️ 数据库设计

系统使用MySQL数据库，主要包含以下表结构：

- `users` - 用户信息表
- `counties` - 县区信息表
- `policies` - 政策信息表
- `economic_indicators` - 经济指标表
- `agriculture_indicators` - 农业指标表
- `population_indicators` - 人口指标表

详细数据库设计请参考: [数据库文档](./docs/DATABASE.md)

## 🚀 部署指南

### Docker部署

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d
```

### 传统部署

```bash
# 安装依赖
npm ci --production

# 构建前端
cd frontend && npm run build

# 启动服务
cd backend && npm start
```

详细部署指南请参考: [部署文档](./docs/DEPLOYMENT.md)

## 🧪 测试

```bash
# 运行单元测试
npm run test

# 运行集成测试
npm run test:integration

# 测试覆盖率
npm run test:coverage
```

## 📈 性能优化

- **前端优化**:
  - 组件懒加载
  - 路由懒加载
  - 资源压缩
  - CDN加速

- **后端优化**:
  - 数据库连接池
  - API响应缓存
  - 数据库索引优化
  - 接口限流

## 🔐 安全特性

- JWT认证授权
- CORS跨域配置
- SQL注入防护
- XSS攻击防护
- 数据加密传输

## 📝 更新日志

### v1.0.0 (2024-01-XX)
- ✨ 完成基础架构搭建
- ✨ 实现用户认证系统
- ✨ 完成数据可视化功能
- ✨ 添加智能查询模块
- 🐛 修复局域网部署问题
- 🔧 优化API响应性能

## 🤝 贡献指南

我们欢迎所有形式的贡献！请阅读 [贡献指南](./CONTRIBUTING.md) 了解详情。

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 👥 开发团队

- **项目负责人**: [Your Name](mailto:your.email@example.com)
- **前端开发**: [Frontend Developer](mailto:frontend@example.com)
- **后端开发**: [Backend Developer](mailto:backend@example.com)
- **UI/UX设计**: [Designer](mailto:design@example.com)

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [Express.js](https://expressjs.com/) - Node.js Web框架
- [Ant Design Vue](https://antdv.com/) - 企业级UI设计语言
- [ECharts](https://echarts.apache.org/) - 数据可视化图表库

## 📞 联系我们

- **项目主页**: [https://github.com/lowl6/CI_PAE](https://github.com/lowl6/CI_PAE)
- **问题反馈**: [Issues](https://github.com/lowl6/CI_PAE/issues)
- **邮箱**: [3108169667@qq.com](mailto:3108169667@qq.com)

---

<div align="center">

**[⬆ 回到顶部](#ci-pae-脱贫攻坚经验智能提炼系统)**

Made with ❤️ by CI-PAE Team

</div>