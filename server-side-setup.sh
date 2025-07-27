#!/bin/bash

# 🚀 钻石网站服务器端安装脚本
# 无锡皇德国际贸易有限公司
# 直接在 AlmaLinux 10 服务器上运行的安装脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量
PROJECT_DIR="/var/www/diamond-website"
DB_NAME="diamond_website"
DB_USER="diamond_user"
DB_PASSWORD="${DB_PASSWORD}"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🚀 钻石网站服务器端环境配置"
echo "无锡皇德国际贸易有限公司"
echo "AlmaLinux 10 - Hostinger VPS"
echo "=========================================="
echo ""

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    log_error "请使用 root 用户运行此脚本"
    echo "使用命令: sudo bash server-side-setup.sh"
    exit 1
fi

# 显示系统信息
log_info "系统信息:"
cat /etc/os-release | grep -E "NAME|VERSION"
echo ""

# 更新系统
log_info "更新系统包..."
dnf update -y

# 安装 EPEL 仓库
log_info "安装 EPEL 仓库..."
dnf install -y epel-release

# 安装基础工具
log_info "安装基础工具..."
dnf groupinstall -y "Development Tools"
dnf install -y curl wget git unzip htop vim nano tree firewalld rsync

# 启动防火墙
log_info "配置防火墙..."
systemctl start firewalld
systemctl enable firewalld

# 安装 Node.js 18
log_info "安装 Node.js 18..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
dnf install -y nodejs

# 验证 Node.js 安装
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
log_success "Node.js 安装完成: $NODE_VERSION"
log_success "npm 版本: $NPM_VERSION"

# 安装 PM2
log_info "安装 PM2..."
npm install -g pm2

# 安装 PostgreSQL
log_info "安装 PostgreSQL 15..."
dnf install -y postgresql-server postgresql-contrib

# 初始化 PostgreSQL
log_info "初始化 PostgreSQL..."
postgresql-setup --initdb

# 启动 PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# 配置 PostgreSQL 认证
log_info "配置 PostgreSQL 认证..."
cp /var/lib/pgsql/data/pg_hba.conf /var/lib/pgsql/data/pg_hba.conf.backup
sed -i 's/ident/md5/g' /var/lib/pgsql/data/pg_hba.conf
systemctl restart postgresql

# 创建数据库和用户
log_info "创建数据库和用户..."
sudo -u postgres psql << EOSQL
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
\q
EOSQL

# 测试数据库连接
log_info "测试数据库连接..."
PGPASSWORD="$DB_PASSWORD" psql -h localhost -U $DB_USER -d $DB_NAME -c "SELECT version();" && log_success "数据库连接成功" || log_warning "数据库连接测试失败"

# 创建项目目录
log_info "创建项目目录..."
mkdir -p $PROJECT_DIR
mkdir -p /var/backups/diamond-website
mkdir -p /var/log/diamond-website

# 配置防火墙规则
log_info "配置防火墙规则..."
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --permanent --add-port=3001/tcp
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

# 安装 Nginx
log_info "安装 Nginx..."
dnf install -y nginx
systemctl enable nginx

# 配置 SELinux
log_info "配置 SELinux..."
setsebool -P httpd_can_network_connect 1
setsebool -P httpd_can_network_relay 1

# 创建环境变量文件
log_info "创建环境变量文件..."
cat > $PROJECT_DIR/.env << EOF
# 🔐 钻石网站生产环境配置
NODE_ENV=production
PORT=3001
APP_NAME=diamond-website
DOMAIN=diamond-auto.com
BASE_URL=https://www.diamond-auto.com
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
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
EOF

# 创建项目下载脚本
log_info "创建项目下载脚本..."
cat > /tmp/download-project.sh << 'EOF'
#!/bin/bash
cd /var/www/diamond-website

echo "📥 下载项目文件..."
# 如果有Git仓库，使用git clone
# git clone https://github.com/your-repo/diamond-website-2025.git .

# 或者提供文件上传说明
echo "请通过以下方式上传项目文件："
echo "1. 使用 scp 命令上传"
echo "2. 使用 FTP/SFTP 客户端"
echo "3. 使用 Hostinger 文件管理器"
echo "4. 压缩文件后上传并解压"

echo "上传完成后，运行以下命令："
echo "cd /var/www/diamond-website"
echo "npm install --production"
echo "npm install @prisma/client prisma pg dotenv"
echo "npx prisma generate"
echo "npx prisma db push"
echo "npm run migrate:run"
echo "pm2 start ecosystem.config.js --env production"
EOF

chmod +x /tmp/download-project.sh

# 显示完成信息
echo ""
log_success "🎉 服务器环境配置完成！"
echo ""
echo "📋 配置摘要:"
echo "  📗 Node.js: $NODE_VERSION"
echo "  📦 npm: $NPM_VERSION"
echo "  ⚙️ PM2: $(pm2 --version)"
echo "  🗄️ PostgreSQL: $(psql --version | head -1)"
echo "  📁 项目目录: $PROJECT_DIR"
echo "  🗃️ 数据库: $DB_NAME"
echo "  👤 数据库用户: $DB_USER"
echo ""
echo "🎯 下一步操作:"
echo "1. 上传项目文件到: $PROJECT_DIR"
echo "2. 运行项目部署命令"
echo ""
echo "📁 文件上传方式:"
echo "  - Hostinger 文件管理器"
echo "  - FTP/SFTP 客户端"
echo "  - scp 命令（如果SSH可用）"
echo ""
echo "🚀 项目启动命令:"
echo "cd $PROJECT_DIR"
echo "npm install --production"
echo "npm install @prisma/client prisma pg dotenv"
echo "npx prisma generate"
echo "npx prisma db push"
echo "npm run migrate:run"
echo "pm2 start ecosystem.config.js --env production"
echo ""
echo "🔍 验证命令:"
echo "pm2 status"
echo "curl http://localhost:3001/api/health"
echo ""
echo "🔥 防火墙状态:"
firewall-cmd --list-all
echo ""
log_success "环境配置完成！请上传项目文件并启动应用。"
