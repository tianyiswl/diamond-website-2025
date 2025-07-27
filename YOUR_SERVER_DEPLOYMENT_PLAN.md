# 🚀 您的服务器部署方案
## 无锡皇德国际贸易有限公司 - 定制化部署计划

### 📋 确认的服务器信息
- ✅ **服务器IP**: 167.88.43.193
- ✅ **SSH用户**: root（有完整权限）
- ✅ **项目目录**: /var/www/diamond-website/
- ✅ **域名**: www.diamond-auto.com
- ❌ **PostgreSQL**: 未安装（需要安装）

---

## 🎯 部署计划

### 第一阶段：服务器环境准备
由于PostgreSQL未安装，我们需要先配置完整的服务器环境。

#### 1. 一键环境配置（推荐）
```bash
# 在服务器上运行环境配置脚本
ssh root@167.88.43.193
wget https://raw.githubusercontent.com/your-repo/diamond-website-2025/main/setup-server-environment.sh
chmod +x setup-server-environment.sh
./setup-server-environment.sh
```

#### 2. 手动环境配置
```bash
# SSH连接到服务器
ssh root@167.88.43.193

# 更新系统
apt update && apt upgrade -y

# 安装基础工具
apt install -y curl wget git unzip htop tree vim nano ufw

# 安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 安装PM2
npm install -g pm2

# 安装PostgreSQL
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# 安装Nginx（可选）
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### 第二阶段：数据库配置
```bash
# 创建数据库和用户
sudo -u postgres psql << 'EOF'
CREATE USER diamond_user WITH PASSWORD '${DB_PASSWORD}';
CREATE DATABASE diamond_website OWNER diamond_user;
GRANT ALL PRIVILEGES ON DATABASE diamond_website TO diamond_user;
ALTER USER diamond_user CREATEDB;
\q
EOF
```

### 第三阶段：项目部署
```bash
# 在本地执行自动化部署
./deploy-to-server.sh production
```

---

## 🔧 快速配置生成

### 生成您的环境变量文件
```env
# 🔐 钻石网站生产环境配置
# 无锡皇德国际贸易有限公司

# 应用基本配置
NODE_ENV=production
PORT=3001
APP_NAME=diamond-website
APP_VERSION=1.0.0

# 域名配置
DOMAIN=diamond-auto.com
BASE_URL=https://www.diamond-auto.com

# 数据库配置
DATABASE_URL="postgresql://diamond_user:${DB_PASSWORD}@localhost:5432/diamond_website?schema=public"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=diamond_website
DB_USER=diamond_user
DB_PASSWORD=${DB_PASSWORD}

# 安全配置（自动生成的密钥）
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=86400000

# 时区配置
TZ=Asia/Shanghai
NODE_TZ=Asia/Shanghai

# 文件上传配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,webp,pdf

# 缓存配置
CACHE_TTL=3600
STATIC_CACHE_TTL=31536000

# 安全头配置
SECURITY_HEADERS_ENABLED=true
CORS_ORIGIN=https://www.diamond-auto.com
CSP_ENABLED=true
```

### 数据库创建脚本
```sql
-- 在服务器上执行
sudo -u postgres psql << 'EOF'
CREATE USER diamond_user WITH PASSWORD '${DB_PASSWORD}';
CREATE DATABASE diamond_website OWNER diamond_user;
GRANT ALL PRIVILEGES ON DATABASE diamond_website TO diamond_user;
ALTER USER diamond_user CREATEDB;
\l
\du
\q
EOF
```

---

## 🚀 一键部署命令

### 完整部署流程
```bash
# 1. 测试SSH连接
ssh root@167.88.43.193 "echo '服务器连接成功'"

# 2. 配置服务器环境（首次部署需要）
ssh root@167.88.43.193 << 'EOF'
# 更新系统
apt update && apt upgrade -y

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 安装PM2
npm install -g pm2

# 安装PostgreSQL
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# 创建数据库
sudo -u postgres psql << 'EOSQL'
CREATE USER diamond_user WITH PASSWORD '${DB_PASSWORD}';
CREATE DATABASE diamond_website OWNER diamond_user;
GRANT ALL PRIVILEGES ON DATABASE diamond_website TO diamond_user;
ALTER USER diamond_user CREATEDB;
\q
EOSQL

# 创建项目目录
mkdir -p /var/www/diamond-website
mkdir -p /var/backups/diamond-website

echo "✅ 服务器环境配置完成"
EOF

# 3. 执行项目部署
./deploy-to-server.sh production
```

---

## 📝 部署步骤详解

### 步骤1: 准备本地环境
```bash
# 确保部署脚本有执行权限
chmod +x deploy-to-server.sh setup-deployment-config.sh

# 运行配置向导（可选，已为您预配置）
./setup-deployment-config.sh
```

### 步骤2: 服务器环境检查
```bash
# 检查服务器基础环境
ssh root@167.88.43.193 << 'EOF'
echo "🔍 系统信息:"
uname -a
echo ""

echo "📦 检查已安装软件:"
node --version 2>/dev/null || echo "❌ Node.js 未安装"
npm --version 2>/dev/null || echo "❌ npm 未安装"
pm2 --version 2>/dev/null || echo "❌ PM2 未安装"
psql --version 2>/dev/null || echo "❌ PostgreSQL 未安装"

echo ""
echo "📁 检查目录:"
ls -la /var/www/ 2>/dev/null || echo "❌ /var/www/ 目录不存在"

echo ""
echo "🔥 防火墙状态:"
ufw status 2>/dev/null || echo "❌ UFW 未配置"
EOF
```

### 步骤3: 一键环境配置
```bash
# 在服务器上运行完整环境配置
ssh root@167.88.43.193 << 'EOF'
#!/bin/bash
set -e

echo "🚀 开始配置钻石网站服务器环境..."

# 更新系统
echo "📦 更新系统包..."
apt update && apt upgrade -y

# 安装基础工具
echo "🔧 安装基础工具..."
apt install -y curl wget git unzip htop tree vim nano ufw fail2ban

# 安装Node.js 18
echo "📗 安装Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 验证Node.js安装
echo "Node.js版本: $(node --version)"
echo "npm版本: $(npm --version)"

# 安装PM2
echo "⚙️ 安装PM2..."
npm install -g pm2

# 安装PostgreSQL
echo "🗄️ 安装PostgreSQL..."
apt install -y postgresql postgresql-contrib

# 启动PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# 创建数据库用户和数据库
echo "🔧 配置数据库..."
sudo -u postgres psql << 'EOSQL'
CREATE USER diamond_user WITH PASSWORD '${DB_PASSWORD}';
CREATE DATABASE diamond_website OWNER diamond_user;
GRANT ALL PRIVILEGES ON DATABASE diamond_website TO diamond_user;
ALTER USER diamond_user CREATEDB;
\q
EOSQL

# 创建项目目录
echo "📁 创建项目目录..."
mkdir -p /var/www/diamond-website
mkdir -p /var/backups/diamond-website
mkdir -p /var/log/diamond-website

# 配置防火墙
echo "🔥 配置防火墙..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 3001
ufw --force enable

echo "✅ 服务器环境配置完成！"
echo ""
echo "📋 配置摘要:"
echo "  🗄️ 数据库: diamond_website"
echo "  👤 数据库用户: diamond_user"
echo "  📁 项目目录: /var/www/diamond-website"
echo "  🌐 域名: www.diamond-auto.com"
echo ""
echo "🎯 下一步: 执行项目部署"
EOF
```

### 步骤4: 项目部署
```bash
# 执行自动化部署
./deploy-to-server.sh production
```

---

## 🔍 部署验证

### 验证命令
```bash
# 1. 检查应用状态
ssh root@167.88.43.193 "pm2 status"

# 2. 健康检查
curl http://167.88.43.193:3001/api/health

# 3. 检查网站访问
curl http://167.88.43.193:3001

# 4. 查看日志
ssh root@167.88.43.193 "pm2 logs diamond-website --lines 20"
```

### 访问地址
- 🏠 **网站首页**: http://167.88.43.193:3001
- 🛠️ **管理后台**: http://167.88.43.193:3001/admin
- 📊 **健康检查**: http://167.88.43.193:3001/api/health

---

## 🎯 推荐的部署顺序

### 方案A: 完全自动化（推荐）
```bash
# 一条命令完成所有配置和部署
ssh root@167.88.43.193 'bash -s' < setup-server-environment.sh && ./deploy-to-server.sh production
```

### 方案B: 分步执行
```bash
# 1. 配置服务器环境
ssh root@167.88.43.193 < setup-server-environment.sh

# 2. 执行项目部署
./deploy-to-server.sh production
```

---

## 📞 下一步操作

1. **立即开始部署**
   ```bash
   ./deploy-to-server.sh production
   ```

2. **如需SSL证书配置**
   ```bash
   ssh root@167.88.43.193
   apt install certbot python3-certbot-nginx
   certbot --nginx -d www.diamond-auto.com
   ```

3. **域名解析配置**
   - 将 www.diamond-auto.com 解析到 167.88.43.193

**🎉 准备就绪！您现在可以开始部署了！**
