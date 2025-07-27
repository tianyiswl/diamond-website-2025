#!/bin/bash

# 🔧 钻石网站部署配置向导
# 无锡皇德国际贸易有限公司 - 自动生成部署配置

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 生成随机密钥
generate_secret() {
    openssl rand -hex 32 2>/dev/null || echo "$(date +%s)_$(whoami)_$(hostname)" | sha256sum | cut -d' ' -f1
}

generate_password() {
    openssl rand -base64 16 2>/dev/null || echo "Diamond$(date +%Y)_$(whoami)" | sha256sum | cut -c1-16
}

# 配置向导
echo "🚀 钻石网站部署配置向导"
echo "无锡皇德国际贸易有限公司"
echo "=========================================="
echo ""

# 已知服务器信息
log_info "已知服务器信息:"
echo "  服务器IP: 167.88.43.193"
echo "  用户名: root"
echo "  项目目录: /var/www/diamond-website"
echo "  Git仓库: /var/git/diamond-website.git"
echo "  域名: www.diamond-auto.com"
echo "  PostgreSQL: 需要安装"
echo ""

# 1. SSH连接测试
log_info "步骤1: 测试SSH连接..."
read -p "是否测试SSH连接？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if ssh -o ConnectTimeout=10 root@167.88.43.193 "echo 'SSH连接成功'" 2>/dev/null; then
        log_success "SSH连接测试通过"
    else
        log_error "SSH连接失败，请检查："
        echo "  1. 服务器是否可访问"
        echo "  2. 用户名是否正确"
        echo "  3. SSH密钥是否已配置"
        echo ""
        read -p "是否继续配置？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# 2. 域名配置
log_info "步骤2: 域名配置"
read -p "请输入主域名 [diamond-auto.com]: " DOMAIN
if [ -z "$DOMAIN" ]; then
    DOMAIN="diamond-auto.com"
    log_info "使用默认域名: $DOMAIN"
fi

WWW_DOMAIN="www.$DOMAIN"
BASE_URL="https://www.$DOMAIN"

# 3. 数据库配置
log_info "步骤3: 数据库配置"
read -p "数据库名称 [diamond_website]: " DB_NAME
DB_NAME=${DB_NAME:-diamond_website}

read -p "数据库用户名 [diamond_user]: " DB_USER
DB_USER=${DB_USER:-diamond_user}

read -p "数据库密码 (留空自动生成): " DB_PASSWORD
if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD=$(generate_password)
    log_info "自动生成数据库密码: $DB_PASSWORD"
fi

read -p "数据库主机 [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "数据库端口 [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

# 4. 安全配置
log_info "步骤4: 安全配置"
JWT_SECRET=$(generate_secret)
SESSION_SECRET=$(generate_secret)

log_info "自动生成安全密钥:"
echo "  JWT密钥: ${JWT_SECRET:0:16}..."
echo "  Session密钥: ${SESSION_SECRET:0:16}..."

# 5. 应用配置
log_info "步骤5: 应用配置"
read -p "应用端口 [3001]: " APP_PORT
APP_PORT=${APP_PORT:-3001}

read -p "PM2进程数量 [1]: " PM2_INSTANCES
PM2_INSTANCES=${PM2_INSTANCES:-1}

# 6. SSL配置
log_info "步骤6: SSL配置"
read -p "是否自动申请Let's Encrypt SSL证书？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    SSL_AUTO="true"
    read -p "SSL证书邮箱: " SSL_EMAIL
else
    SSL_AUTO="false"
    SSL_EMAIL=""
fi

# 生成配置文件
log_info "生成配置文件..."

# 生成 .env 文件
cat > .env.production << EOF
# 🔐 钻石网站生产环境配置
# 无锡皇德国际贸易有限公司 - Diamond Website 2025
# 自动生成于: $(date)

# 应用基本配置
NODE_ENV=production
PORT=$APP_PORT
APP_NAME=diamond-website
APP_VERSION=1.0.0

# 域名配置
DOMAIN=$DOMAIN
BASE_URL=$BASE_URL

# 安全配置
JWT_SECRET=$JWT_SECRET
SESSION_SECRET=$SESSION_SECRET
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=86400000

# 时区配置
TZ=Asia/Shanghai
NODE_TZ=Asia/Shanghai

# 数据库配置 - PostgreSQL
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?schema=public"
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_SCHEMA=public

# 数据库连接池配置
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_ACQUIRE_TIMEOUT=30000
DB_POOL_IDLE_TIMEOUT=10000

# 数据库迁移配置
MIGRATION_BACKUP_ENABLED=true
MIGRATION_BACKUP_PATH=./backup/migration
MIGRATION_LOG_LEVEL=info

# 文件上传配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,webp,pdf

# 日志配置
LOG_LEVEL=info
LOG_FILE=./logs/app.log
ERROR_LOG_FILE=./logs/error.log

# 缓存配置
CACHE_TTL=3600
STATIC_CACHE_TTL=31536000

# 限流配置
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
API_RATE_LIMIT_MAX=50
ADMIN_RATE_LIMIT_MAX=20

# 监控配置
HEALTH_CHECK_ENDPOINT=/api/health
METRICS_ENDPOINT=/api/metrics

# 性能配置
COMPRESSION_ENABLED=true
COMPRESSION_LEVEL=6
STATIC_GZIP_ENABLED=true

# 安全头配置
SECURITY_HEADERS_ENABLED=true
CORS_ORIGIN=$BASE_URL
CSP_ENABLED=true
EOF

# 生成数据库创建脚本
cat > create-database.sql << EOF
-- 钻石网站数据库创建脚本
-- 在PostgreSQL中执行

-- 创建用户
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- 创建数据库
CREATE DATABASE $DB_NAME OWNER $DB_USER;

-- 授权
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;

-- 验证
\l
\du
EOF

# 生成部署命令脚本
cat > deploy-commands.sh << 'EOF'
#!/bin/bash

# 钻石网站部署命令集合

echo "🚀 钻石网站部署命令"
echo "===================="

echo ""
echo "1. 测试SSH连接:"
echo "   ssh diamond-deploy@167.88.43.193"

echo ""
echo "2. 创建数据库:"
echo "   sudo -u postgres psql < create-database.sql"

echo ""
echo "3. 上传环境变量文件:"
echo "   scp .env.production diamond-deploy@167.88.43.193:/var/www/diamond-website/.env"

echo ""
echo "4. 执行自动部署:"
echo "   ./deploy-to-server.sh production"

echo ""
echo "5. 手动部署步骤:"
echo "   ssh diamond-deploy@167.88.43.193"
echo "   cd /var/www/diamond-website"
echo "   npm install --production"
echo "   npx prisma generate"
echo "   npx prisma db push"
echo "   npm run migrate:run"
echo "   pm2 start ecosystem.config.js --env production"

echo ""
echo "6. 验证部署:"
echo "   curl http://167.88.43.193:3001/api/health"
echo "   pm2 status"
echo "   pm2 logs diamond-website"
EOF

chmod +x deploy-commands.sh

# 生成服务器检查脚本
cat > check-server.sh << 'EOF'
#!/bin/bash

# 服务器环境检查脚本

echo "🔍 检查服务器环境..."

ssh diamond-deploy@167.88.43.193 << 'ENDSSH'
echo "📊 系统信息:"
uname -a
echo ""

echo "🟢 Node.js 版本:"
node --version
npm --version
echo ""

echo "🔧 PM2 状态:"
pm2 --version
pm2 list
echo ""

echo "🗄️ PostgreSQL 状态:"
sudo systemctl status postgresql --no-pager
psql --version
echo ""

echo "🔥 防火墙状态:"
sudo ufw status
echo ""

echo "📁 项目目录:"
ls -la /var/www/diamond-website/ || echo "目录不存在"
echo ""

echo "💾 磁盘空间:"
df -h
echo ""

echo "🧠 内存使用:"
free -h
ENDSSH
EOF

chmod +x check-server.sh

# 显示配置摘要
echo ""
log_success "配置文件生成完成！"
echo ""
echo "📁 生成的文件:"
echo "  ✅ .env.production - 生产环境变量"
echo "  ✅ create-database.sql - 数据库创建脚本"
echo "  ✅ deploy-commands.sh - 部署命令集合"
echo "  ✅ check-server.sh - 服务器检查脚本"
echo ""

echo "📋 配置摘要:"
echo "  🌐 域名: $DOMAIN"
echo "  🗄️ 数据库: $DB_NAME"
echo "  👤 数据库用户: $DB_USER"
echo "  🔐 数据库密码: ${DB_PASSWORD:0:8}..."
echo "  🚀 应用端口: $APP_PORT"
echo "  🔒 SSL自动申请: $SSL_AUTO"
echo ""

echo "🎯 下一步操作:"
echo "  1. 检查服务器环境: ./check-server.sh"
echo "  2. 创建数据库: 在服务器上执行 create-database.sql"
echo "  3. 上传环境变量: scp .env.production diamond-deploy@167.88.43.193:/var/www/diamond-website/.env"
echo "  4. 执行部署: ./deploy-to-server.sh production"
echo ""

log_warning "重要提醒:"
echo "  🔐 请妥善保管生成的密码和密钥"
echo "  📧 如需SSL证书，请确保域名已解析到服务器"
echo "  🔍 部署前请先运行服务器检查脚本"
echo ""

read -p "是否立即检查服务器环境？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ./check-server.sh
fi
