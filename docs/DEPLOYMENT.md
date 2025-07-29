# 🚀 Diamond Website 部署指南

## 📋 概述

本文档详细介绍了 Diamond Website 模块化版本的部署流程，包括开发环境、测试环境和生产环境的部署方案。

## 🔧 环境要求

### 系统要求

- **操作系统**: Linux (推荐 Ubuntu 20.04+), Windows 10+, macOS 10.15+
- **Node.js**: >= 14.0.0 (推荐 16.x LTS)
- **npm**: >= 6.0.0 (或 yarn >= 1.22.0)
- **内存**: 最低 512MB，推荐 2GB+
- **磁盘空间**: 最低 1GB，推荐 5GB+

### 依赖检查

```bash
# 检查 Node.js 版本
node --version

# 检查 npm 版本
npm --version

# 检查系统资源
free -h  # Linux
```

## 🏠 开发环境部署

### 1. 克隆项目

```bash
git clone https://github.com/your-repo/diamond-website.git
cd diamond-website
```

### 2. 安装依赖

```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install
```

### 3. 环境配置

创建环境变量文件：

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

`.env` 文件内容：

```bash
# 服务器配置
NODE_ENV=development
PORT=3000
HOST=localhost

# 数据存储
DATA_PATH=./data

# 安全配置
JWT_SECRET=your-development-secret-key
BCRYPT_ROUNDS=10

# 缓存配置
ENABLE_CACHE=true
CACHE_TTL=300000

# 日志配置
LOG_LEVEL=debug
ENABLE_ACCESS_LOG=true

# 时区配置
TIMEZONE=Asia/Shanghai
```

### 4. 初始化数据

```bash
# 运行集成测试（包含数据初始化）
node integration-test.js

# 或手动初始化
node -e "require('./src/dao').initializeAllData()"
```

### 5. 启动开发服务器

```bash
# 使用模块化服务器
node server-modular.js

# 或使用原始服务器（兼容性）
node server.js

# 使用 nodemon 自动重启
npx nodemon server-modular.js
```

### 6. 验证部署

```bash
# 检查服务器状态
curl http://localhost:3000/health

# 检查API
curl http://localhost:3000/api

# 运行测试
node integration-test.js
```

## 🧪 测试环境部署

### 1. 环境配置

```bash
# 测试环境变量
NODE_ENV=testing
PORT=3001
HOST=0.0.0.0
JWT_SECRET=testing-secret-key-change-in-production
DATA_PATH=./data-test
```

### 2. 数据库准备

```bash
# 创建测试数据目录
mkdir -p data-test

# 复制测试数据
cp -r data-sample/* data-test/
```

### 3. 启动测试服务

```bash
# 设置环境变量
export NODE_ENV=testing
export PORT=3001

# 启动服务
node server-modular.js
```

### 4. 自动化测试

```bash
# 运行所有测试
npm test

# 或分别运行
node integration-test.js
node performance-test.js
```

## 🌐 生产环境部署

### 方案一：直接部署

#### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js (Ubuntu)
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2
sudo npm install -g pm2
```

#### 2. 项目部署

```bash
# 创建应用目录
sudo mkdir -p /var/www/diamond-website
cd /var/www/diamond-website

# 克隆代码
git clone https://github.com/your-repo/diamond-website.git .

# 安装生产依赖
npm ci --only=production

# 设置权限
sudo chown -R www-data:www-data /var/www/diamond-website
```

#### 3. 生产环境配置

```bash
# 生产环境变量
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
JWT_SECRET=your-super-secure-production-secret-key
DATA_PATH=/var/www/diamond-website/data
ENABLE_CACHE=true
CACHE_TTL=600000
LOG_LEVEL=info
```

#### 4. PM2 配置

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'diamond-website',
    script: 'server-modular.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024'
  }]
};
```

#### 5. 启动生产服务

```bash
# 创建日志目录
mkdir -p logs

# 启动应用
pm2 start ecosystem.config.js --env production

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

### 方案二：Docker 部署

#### 1. Dockerfile

```dockerfile
FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 复制应用代码
COPY . .

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S diamond -u 1001

# 设置权限
RUN chown -R diamond:nodejs /app
USER diamond

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 启动应用
CMD ["node", "server-modular.js"]
```

#### 2. docker-compose.yml

```yaml
version: '3.8'

services:
  diamond-website:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - HOST=0.0.0.0
      - JWT_SECRET=${JWT_SECRET}
      - DATA_PATH=/app/data
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - diamond-website
    restart: unless-stopped
```

#### 3. 构建和启动

```bash
# 构建镜像
docker build -t diamond-website .

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f diamond-website
```

### 方案三：云平台部署

#### Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

`vercel.json` 配置：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server-modular.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server-modular.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### Heroku 部署

```bash
# 安装 Heroku CLI
# 登录 Heroku
heroku login

# 创建应用
heroku create diamond-website

# 设置环境变量
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-key

# 部署
git push heroku main
```

`Procfile`：

```
web: node server-modular.js
```

## 🔧 Nginx 配置

### 反向代理配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL 配置
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # 静态文件
    location /static/ {
        alias /var/www/diamond-website/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 主应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 监控和日志

### 1. 应用监控

```bash
# PM2 监控
pm2 monit

# 查看应用状态
pm2 status

# 查看日志
pm2 logs diamond-website

# 重启应用
pm2 restart diamond-website
```

### 2. 系统监控

```bash
# 安装监控工具
sudo apt install htop iotop

# 监控系统资源
htop

# 监控磁盘使用
df -h

# 监控网络连接
netstat -tulpn | grep :3000
```

### 3. 日志管理

```bash
# 日志轮转配置
sudo nano /etc/logrotate.d/diamond-website
```

```
/var/www/diamond-website/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload diamond-website
    endscript
}
```

## 🔒 安全配置

### 1. 防火墙设置

```bash
# 启用 UFW
sudo ufw enable

# 允许 SSH
sudo ufw allow ssh

# 允许 HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# 检查状态
sudo ufw status
```

### 2. SSL 证书

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. 安全更新

```bash
# 自动安全更新
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 🚨 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查找占用端口的进程
   sudo lsof -i :3000
   
   # 杀死进程
   sudo kill -9 PID
   ```

2. **权限问题**
   ```bash
   # 修复权限
   sudo chown -R www-data:www-data /var/www/diamond-website
   sudo chmod -R 755 /var/www/diamond-website
   ```

3. **内存不足**
   ```bash
   # 增加 swap
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

4. **数据库文件损坏**
   ```bash
   # 恢复备份
   cp data-backup/* data/
   
   # 重新初始化
   node -e "require('./src/dao').initializeAllData()"
   ```

### 性能优化

1. **启用 Gzip 压缩**
2. **配置 CDN**
3. **优化静态资源缓存**
4. **数据库查询优化**
5. **内存缓存配置**

## 📞 技术支持

部署过程中如遇问题，请联系：

- 📧 邮箱: deploy-support@diamond-website.com
- 📖 文档: 查看完整部署文档
- 🐛 问题反馈: GitHub Issues

---

**🎉 祝您部署成功！**
