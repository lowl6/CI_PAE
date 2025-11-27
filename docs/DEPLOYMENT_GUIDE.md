# CI-PAE 项目部署指南

## 🚨 部署问题诊断

你的问题主要是前后端分离项目在公网部署时的配置问题：

1. **前端**：Vite 代理只在开发环境生效，生产环境需要直接请求后端 API
2. **后端**：CORS 配置需要允许公网访问
3. **环境变量**：需要配置生产环境的 API 地址

## 🛠️ 解决方案

### 第一步：配置后端服务器

1. **修改 CORS 配置**
   - 编辑 `backend/app.js`，在 `allowedOrigins` 中添加你的公网 IP 和端口
   - 例如：`'http://YOUR_PUBLIC_IP:5174'`

2. **设置环境变量**
   ```bash
   export NODE_ENV=production
   export PORT=3001
   ```

### 第二步：配置前端

1. **创建生产环境配置文件**
   ```bash
   # 在 frontend 目录下创建 .env.production
   VITE_APP_ENV=production
   VITE_API_URL=http://YOUR_PUBLIC_IP:3001
   ```

2. **重新构建前端**
   ```bash
   cd frontend
   npm run build
   ```

### 第三步：部署方式选择

#### 方式一：简单部署（推荐新手）

1. **后端部署**
   ```bash
   cd backend
   npm install
   npm start  # 使用 pm2 或 forever 保持运行
   ```

2. **前端部署**
   ```bash
   cd frontend
   npm install
   npm run build

   # 使用 nginx 或 Apache 部署 dist 目录
   # 或者使用简单的 http-server
   npx http-server dist -p 5174 -a 0.0.0.0
   ```

#### 方式二：Nginx 反向代理（推荐）

1. **安装 Nginx**
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. **配置 Nginx**
   ```nginx
   server {
       listen 80;
       server_name YOUR_PUBLIC_IP;

       # 前端静态文件
       location / {
           root /path/to/frontend/dist;
           try_files $uri $uri/ /index.html;
       }

       # API 代理到后端
       location /api/ {
           proxy_pass http://localhost:3001/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

#### 方式三：使用 Docker（高级）

1. **创建后端 Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY backend/package*.json ./
   RUN npm ci --only=production
   COPY backend/ .
   EXPOSE 3001
   CMD ["npm", "start"]
   ```

2. **创建前端 Dockerfile**
   ```dockerfile
   FROM node:18-alpine as build
   WORKDIR /app
   COPY frontend/package*.json ./
   RUN npm ci
   COPY frontend/ .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=build /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/nginx.conf
   EXPOSE 80
   ```

## 🔧 具体操作步骤

### 1. 修改配置文件

**后端 CORS 配置** (`backend/app.js`):
```javascript
const allowedOrigins = [
  'http://localhost:5174',
  'http://YOUR_PUBLIC_IP:5174',  // 替换为你的公网IP
  'http://YOUR_DOMAIN.com'       // 如果有域名，添加域名
]
```

**前端生产环境配置** (`frontend/.env.production`):
```bash
VITE_APP_ENV=production
VITE_API_URL=http://YOUR_PUBLIC_IP:3001  # 替换为你的公网IP和端口
```

### 2. 重新构建和部署

```bash
# 后端
cd backend
npm install
npm start

# 前端
cd frontend
npm install
npm run build
```

### 3. 测试部署

1. **测试后端**：访问 `http://YOUR_PUBLIC_IP:3001/api/data/summary`
2. **测试前端**：访问 `http://YOUR_PUBLIC_IP:5174`
3. **检查浏览器网络面板**：确认 API 请求正确发送到后端

## 🐛 常见问题解决

### 问题1：CORS 错误
- 确认后端 `allowedOrigins` 包含你的前端地址
- 检查防火墙是否阻止端口访问

### 问题2：API 404 错误
- 确认后端服务正在运行
- 检查 API 路径是否正确（应该有 `/api` 前缀）

### 问题3：数据库连接失败
- 检查数据库服务是否运行
- 确认数据库配置文件 `backend/config/db.js`

### 问题4：端口被占用
```bash
# 查看端口占用
sudo netstat -tulpn | grep :3001
sudo netstat -tulpn | grep :5174

# 杀死进程
sudo kill -9 PROCESS_ID
```

## 📋 部署检查清单

- [ ] 后端服务正在运行（端口 3001）
- [ ] 前端构建完成并部署（端口 5174）
- [ ] CORS 配置正确
- [ ] 环境变量设置正确
- [ ] 数据库连接正常
- [ ] 防火墙端口开放
- [ ] API 请求可以正常到达后端
- [ ] 前端页面可以正常加载

## 🎯 快速修复命令

如果你想要快速修复，可以执行以下命令：

```bash
# 1. 设置你的公网IP（替换 YOUR_PUBLIC_IP）
export PUBLIC_IP="YOUR_PUBLIC_IP"

# 2. 修改前端配置
cd frontend
echo "VITE_APP_ENV=production" > .env.production
echo "VITE_API_URL=http://$PUBLIC_IP:3001" >> .env.production

# 3. 重新构建前端
npm run build

# 4. 修改后端 CORS（手动编辑 backend/app.js）
# 在 allowedOrigins 数组中添加: "http://$PUBLIC_IP:5174"

# 5. 重启后端服务
cd ../backend
npm restart
```

这样配置后，你的前端就能正确连接到后端 API 了！