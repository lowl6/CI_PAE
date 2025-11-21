# 部署指南

本文档详细说明了CI-PAE项目的部署流程，包括开发环境、局域网环境和生产环境的部署方案。

## 📋 目录

- [环境要求](#环境要求)
- [快速部署](#快速部署)
- [开发环境部署](#开发环境部署)
- [局域网环境部署](#局域网环境部署)
- [生产环境部署](#生产环境部署)
- [Docker部署](#docker部署)
- [Nginx配置](#nginx配置)
- [故障排除](#故障排除)

## 🔧 环境要求

### 基础环境

- **操作系统**: Linux (推荐Ubuntu 20.04+) / macOS / Windows
- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0 或 **yarn**: >= 1.22.0
- **MySQL**: >= 8.0.0
- **Git**: >= 2.0.0

### 可选环境

- **Docker**: >= 20.0.0 (用于容器化部署)
- **Nginx**: >= 1.18.0 (用于反向代理)
- **PM2**: >= 5.0.0 (用于进程管理)

## 🚀 快速部署

### 一键启动（开发环境）

```bash
# 克隆项目
git clone https://github.com/your-username/CI_PAE.git
cd CI_PAE

# 快速启动脚本
chmod +x scripts/quick-start.sh
./scripts/quick-start.sh
```

### 使用Docker快速启动

```bash
# 使用Docker Compose
docker-compose up -d

# 访问应用
# 前端: http://localhost:5174
# 后端: http://localhost:3001
```

## 💻 开发环境部署

### 1. 环境准备

```bash
# 检查Node.js版本
node --version  # 应该 >= 18.0.0

# 检查npm版本
npm --version   # 应该 >= 8.0.0

# 检查MySQL状态
mysql --version
```

### 2. 项目安装

```bash
# 克隆项目
git clone https://github.com/your-username/CI_PAE.git
cd CI_PAE

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 3. 环境配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
vim .env
```

**.env 配置示例：**
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ci_pae

# 应用配置
NODE_ENV=development
PORT=3001

# 前端配置
VITE_APP_ENV=development
VITE_API_URL=http://localhost:3001
```

### 4. 数据库初始化

```bash
cd backend

# 创建数据库
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS ci_pae CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 初始化表结构和数据
npm run init-db
```

### 5. 启动服务

```bash
# 启动后端服务 (终端1)
cd backend
npm run dev

# 启动前端服务 (终端2)
cd frontend
npm run dev
```

### 6. 验证部署

```bash
# 检查后端API
curl http://localhost:3001/api/data/summary

# 检查前端服务
curl http://localhost:5174
```

## 🌐 局域网环境部署

### 1. 网络配置

首先获取本机IP地址：

```bash
# Linux/macOS
hostname -I | awk '{print $1}'

# Windows
ipconfig | findstr "IPv4"
```

### 2. 环境变量配置

创建局域网环境配置：

```bash
# 前端环境配置
cd frontend
cat > .env.lan << EOF
VITE_APP_ENV=lan
VITE_API_URL=http://YOUR_LAN_IP:3001
EOF
```

### 3. 后端配置

修改后端CORS配置 (`backend/app.js`)：

```javascript
const allowedOrigins = [
  'http://localhost:5174',
  'http://YOUR_LAN_IP:5174',
  'http://YOUR_LAN_IP:3000'
];
```

### 4. 启动服务

```bash
# 启动后端（监听所有网络接口）
cd backend
npm run dev -- --host 0.0.0.0

# 启动前端（监听所有网络接口）
cd frontend
npm run dev -- --host 0.0.0.0 --mode lan
```

### 5. 防火墙配置

```bash
# Ubuntu/Debian
sudo ufw allow 3001  # 后端端口
sudo ufw allow 5174  # 前端端口

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --permanent --add-port=5174/tcp
sudo firewall-cmd --reload
```

### 6. 访问验证

局域网内其他设备访问：
- 前端应用: `http://YOUR_LAN_IP:5174`
- 后端API: `http://YOUR_LAN_IP:3001`

## 🏭 生产环境部署

### 1. 服务器要求

**最低配置：**
- CPU: 2核
- 内存: 4GB
- 存储: 20GB
- 网络: 10Mbps

**推荐配置：**
- CPU: 4核
- 内存: 8GB
- 存储: 50GB SSD
- 网络: 100Mbps

### 2. 环境准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装MySQL
sudo apt install mysql-server -y

# 安装Nginx
sudo apt install nginx -y

# 安装PM2
sudo npm install -g pm2
```

### 3. 数据库配置

```bash
# 创建数据库用户
sudo mysql -e "CREATE USER 'ci_pae'@'localhost' IDENTIFIED BY 'strong_password';"
sudo mysql -e "GRANT ALL PRIVILEGES ON ci_pae.* TO 'ci_pae'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# 创建数据库
sudo mysql -e "CREATE DATABASE ci_pae CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 4. 应用部署

```bash
# 克隆项目
git clone https://github.com/your-username/CI_PAE.git /var/www/ci-pae
cd /var/www/ci-pae

# 设置权限
sudo chown -R $USER:$USER /var/www/ci-pae

# 安装依赖
cd backend && npm ci --production
cd ../frontend && npm ci --production
```

### 5. 构建前端

```bash
cd /var/www/ci-pae/frontend

# 创建生产环境配置
cat > .env.production << EOF
VITE_APP_ENV=production
VITE_API_URL=https://your-domain.com:3001
EOF

# 构建前端
npm run build
```

### 6. PM2配置

创建PM2配置文件：

```bash
cd /var/www/ci-pae
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'ci-pae-backend',
    script: './backend/server.js',
    cwd: '/var/www/ci-pae',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF
```

启动应用：

```bash
# 创建日志目录
mkdir -p logs

# 启动应用
pm2 start ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save
```

### 7. Nginx配置

创建Nginx站点配置：

```bash
sudo cat > /etc/nginx/sites-available/ci-pae << EOF
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/ci-pae/frontend/dist;
        try_files \$uri \$uri/ /index.html;

        # 缓存配置
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API代理到后端
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# 启用站点
sudo ln -s /etc/nginx/sites-available/ci-pae /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8. SSL证书配置

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取SSL证书
sudo certbot --nginx -d your-domain.com

# 设置自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🐳 Docker部署

### 1. Dockerfile配置

**后端Dockerfile:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制package文件
COPY backend/package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源码
COPY backend/ .

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 切换用户
USER nodejs

EXPOSE 3001

CMD ["npm", "start"]
```

**前端Dockerfile:**

```dockerfile
FROM node:18-alpine as build

WORKDIR /app

# 复制package文件
COPY frontend/package*.json ./

# 安装依赖
RUN npm ci

# 复制源码
COPY frontend/ .

# 构建应用
RUN npm run build

# 生产环境
FROM nginx:alpine

# 复制构建文件
COPY --from=build /app/dist /usr/share/nginx/html

# 复制Nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2. Docker Compose配置

```yaml
version: '3.8'

services:
  # MySQL数据库
  mysql:
    image: mysql:8.0
    container_name: ci-pae-mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ci_pae
      MYSQL_USER: ci_pae
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./backend/database/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "3306:3306"
    restart: unless-stopped

  # 后端服务
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    container_name: ci-pae-backend
    environment:
      NODE_ENV: production
      DB_HOST: mysql
      DB_USER: ci_pae
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ci_pae
    depends_on:
      - mysql
    ports:
      - "3001:3001"
    restart: unless-stopped

  # 前端服务
  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    container_name: ci-pae-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mysql_data:
```

### 3. 部署命令

```bash
# 创建环境变量文件
cat > .env << EOF
DB_ROOT_PASSWORD=your_root_password
DB_PASSWORD=your_app_password
EOF

# 构建并启动
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## 🔧 Nginx配置

### 完整Nginx配置示例

```nginx
# /etc/nginx/nginx.conf
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 1024;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # 上游服务器
    upstream ci_pae_backend {
        server 127.0.0.1:3001;
        keepalive 32;
    }

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    # 包含站点配置
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

## 🔍 故障排除

### 常见问题及解决方案

#### 1. 端口被占用

```bash
# 查看端口占用
sudo netstat -tulpn | grep :3001
sudo netstat -tulpn | grep :5174

# 杀死进程
sudo kill -9 PROCESS_ID
```

#### 2. 数据库连接失败

```bash
# 检查MySQL状态
sudo systemctl status mysql

# 检查数据库连接
mysql -u ci_pae -p -h localhost ci_pae

# 查看MySQL日志
sudo tail -f /var/log/mysql/error.log
```

#### 3. 前端构建失败

```bash
# 清除缓存
cd frontend
rm -rf node_modules package-lock.json
npm install

# 检查Node.js版本
node --version
```

#### 4. CORS错误

检查后端CORS配置：

```javascript
// 确保allowedOrigins包含正确的前端地址
const allowedOrigins = [
  'http://localhost:5174',
  'http://your-domain.com',
  'https://your-domain.com'
];
```

#### 5. 内存不足

```bash
# 增加swap空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
sudo swapon --show
```

### 监控和日志

#### 查看应用状态

```bash
# PM2状态
pm2 status
pm2 logs ci-pae-backend

# Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 系统资源监控
htop
df -h
free -h
```

#### 性能监控

```bash
# 安装监控工具
npm install -g pm2-logrotate
pm2 install pm2-server-monit
```

## 📋 部署检查清单

### 部署前检查

- [ ] 服务器配置满足要求
- [ ] 域名DNS已配置
- [ ] SSL证书已申请（如需要）
- [ ] 数据库已创建
- [ ] 防火墙端口已开放
- [ ] 环境变量已配置

### 部署后验证

- [ ] 前端页面正常访问
- [ ] 后端API响应正常
- [ ] 用户注册/登录功能
- [ ] 数据查询功能
- [ ] 图表显示正常
- [ ] 移动端适配正常
- [ ] 性能指标正常

### 安全检查

- [ ] 数据库密码安全
- [ ] API接口权限控制
- [ ] HTTPS证书有效
- [ ] 敏感信息已加密
- [ ] 日志记录正常
- [ ] 备份策略已制定

## 📞 技术支持

如果在部署过程中遇到问题，请：

1. 查看 [故障排除](#故障排除) 部分
2. 检查项目的 [Issues](https://github.com/your-username/CI_PAE/issues)
3. 联系技术支持：support@ci-pae.com

---

**最后更新**: 2024年1月XX日
**版本**: 1.0.0