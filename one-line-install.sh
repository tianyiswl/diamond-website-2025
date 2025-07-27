#!/bin/bash

# 🚀 钻石网站一行安装脚本
# 无锡皇德国际贸易有限公司
# 在Hostinger Web终端中直接运行

# 一行安装命令（复制到Web终端中运行）
cat << 'EOF'
# 钻石网站一键安装命令 - 复制以下整个代码块到Hostinger Web终端中运行

#!/bin/bash
set -e

echo "🚀 钻石网站 AlmaLinux 一键安装"
echo "无锡皇德国际贸易有限公司"
echo "========================================"

# 检查系统
echo "📋 系统信息:"
cat /etc/os-release | grep -E "NAME|VERSION"

# 更新系统
echo "📦 更新系统..."
dnf update -y

# 安装EPEL
echo "📚 安装EPEL仓库..."
dnf install -y epel-release

# 安装基础工具
echo "🔧 安装基础工具..."
dnf groupinstall -y "Development Tools"
dnf install -y curl wget git unzip htop vim nano tree firewalld

# 启动防火墙
systemctl start firewalld
systemctl enable firewalld

# 安装Node.js
echo "📗 安装Node.js 18..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
dnf install -y nodejs

echo "Node.js版本: $(node --version)"
echo "npm版本: $(npm --version)"

# 安装PM2
echo "⚙️ 安装PM2..."
npm install -g pm2

# 安装PostgreSQL
echo "🗄️ 安装PostgreSQL..."
dnf install -y postgresql-server postgresql-contrib
postgresql-setup --initdb
systemctl start postgresql
systemctl enable postgresql

# 配置PostgreSQL
echo "🔧 配置PostgreSQL..."
cp /var/lib/pgsql/data/pg_hba.conf /var/lib/pgsql/data/pg_hba.conf.backup
sed -i 's/ident/md5/g' /var/lib/pgsql/data/pg_hba.conf
systemctl restart postgresql

# 创建数据库
echo "🗃️ 创建数据库..."
sudo -u postgres psql << EOSQL
CREATE USER diamond_user WITH PASSWORD 'Diamond2025_Secure!';
CREATE DATABASE diamond_website OWNER diamond_user;
GRANT ALL PRIVILEGES ON DATABASE diamond_website TO diamond_user;
ALTER USER diamond_user CREATEDB;
\q
EOSQL

# 创建目录
echo "📁 创建项目目录..."
mkdir -p /var/www/diamond-website
mkdir -p /var/backups/diamond-website

# 配置防火墙
echo "🔥 配置防火墙..."
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --permanent --add-port=3001/tcp
firewall-cmd --reload

# 创建环境变量文件
echo "🔐 创建环境配置..."
cat > /var/www/diamond-website/.env << ENVEOF
NODE_ENV=production
PORT=3001
APP_NAME=diamond-website
DOMAIN=diamond-auto.com
BASE_URL=https://www.diamond-auto.com
DATABASE_URL="postgresql://diamond_user:Diamond2025_Secure!@localhost:5432/diamond_website?schema=public"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=diamond_website
DB_USER=diamond_user
DB_PASSWORD=Diamond2025_Secure!
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
BCRYPT_ROUNDS=12
TZ=Asia/Shanghai
NODE_TZ=Asia/Shanghai
UPLOAD_MAX_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,webp,pdf
CACHE_TTL=3600
SECURITY_HEADERS_ENABLED=true
CORS_ORIGIN=https://www.diamond-auto.com
ENVEOF

echo "✅ 服务器环境配置完成！"
echo ""
echo "📋 安装摘要:"
echo "  📗 Node.js: $(node --version)"
echo "  📦 npm: $(npm --version)"
echo "  ⚙️ PM2: $(pm2 --version)"
echo "  🗄️ PostgreSQL: $(psql --version | head -1)"
echo ""
echo "🎯 下一步："
echo "1. 上传项目文件到 /var/www/diamond-website/"
echo "2. 运行项目部署命令"
echo ""
echo "📁 项目部署命令："
echo "cd /var/www/diamond-website"
echo "npm install --production"
echo "npm install @prisma/client prisma pg dotenv"
echo "npx prisma generate"
echo "npx prisma db push"
echo "npm run migrate:run || echo 'Migration skipped'"
echo "pm2 start ecosystem.config.js --env production"
echo "pm2 save"
echo ""
echo "🔍 验证命令："
echo "pm2 status"
echo "curl http://localhost:3001/api/health"

EOF
