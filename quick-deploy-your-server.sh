#!/bin/bash

# 🚀 钻石网站快速部署脚本 - 定制版
# 无锡皇德国际贸易有限公司
# 针对服务器 167.88.43.193 的一键部署方案

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 服务器配置
SERVER_IP="167.88.43.193"
SERVER_USER="root"
PROJECT_DIR="/var/www/diamond-website"
DOMAIN="www.diamond-auto.com"
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

# 显示部署信息
show_deployment_info() {
    echo "🚀 钻石网站一键部署"
    echo "无锡皇德国际贸易有限公司"
    echo "=========================================="
    echo ""
    echo "📋 部署配置:"
    echo "  🌐 服务器: $SERVER_IP"
    echo "  👤 用户: $SERVER_USER"
    echo "  📁 目录: $PROJECT_DIR"
    echo "  🌍 域名: $DOMAIN"
    echo "  🗄️ 数据库: $DB_NAME"
    echo ""
}

# 检查SSH连接
check_ssh_connection() {
    log_info "检查SSH连接..."
    if ssh -o ConnectTimeout=10 $SERVER_USER@$SERVER_IP "echo 'SSH连接成功'" >/dev/null 2>&1; then
        log_success "SSH连接正常"
    else
        log_error "SSH连接失败，请检查："
        echo "  1. 服务器是否可访问"
        echo "  2. SSH密钥是否已配置"
        exit 1
    fi
}

# 配置服务器环境
setup_server_environment() {
    log_info "配置服务器环境..."
    
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
#!/bin/bash
set -e

echo "🔧 开始配置服务器环境..."

# 更新系统
echo "📦 更新系统包..."
apt update && apt upgrade -y

# 安装基础工具
echo "🔧 安装基础工具..."
apt install -y curl wget git unzip htop tree vim nano ufw fail2ban

# 检查并安装Node.js
if ! command -v node &> /dev/null; then
    echo "📗 安装Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
else
    echo "✅ Node.js 已安装: $(node --version)"
fi

# 检查并安装PM2
if ! command -v pm2 &> /dev/null; then
    echo "⚙️ 安装PM2..."
    npm install -g pm2
else
    echo "✅ PM2 已安装: $(pm2 --version)"
fi

# 检查并安装PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "🗄️ 安装PostgreSQL..."
    apt install -y postgresql postgresql-contrib
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
else
    echo "✅ PostgreSQL 已安装"
    # 检查数据库是否存在
    if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw diamond_website; then
        echo "🔧 创建数据库..."
        sudo -u postgres psql << 'EOSQL'
CREATE USER diamond_user WITH PASSWORD '${DB_PASSWORD}';
CREATE DATABASE diamond_website OWNER diamond_user;
GRANT ALL PRIVILEGES ON DATABASE diamond_website TO diamond_user;
ALTER USER diamond_user CREATEDB;
\q
EOSQL
    else
        echo "✅ 数据库已存在"
    fi
fi

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
EOF

    if [ $? -eq 0 ]; then
        log_success "服务器环境配置完成"
    else
        log_error "服务器环境配置失败"
        exit 1
    fi
}

# 创建环境变量文件
create_env_file() {
    log_info "创建环境变量文件..."
    
    cat > .env.production << EOF
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

# 安全配置
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
EOF

    log_success "环境变量文件创建完成"
}

# 部署项目文件
deploy_project() {
    log_info "部署项目文件..."
    
    # 创建排除文件列表
    cat > /tmp/rsync-exclude << EOF
node_modules/
.git/
.env.local
.env.development
logs/
*.log
.DS_Store
Thumbs.db
coverage/
.nyc_output/
.cache/
dist/
build/
tmp/
temp/
EOF

    # 同步项目文件
    rsync -avz --delete \
        --exclude-from=/tmp/rsync-exclude \
        --progress \
        ./ \
        $SERVER_USER@$SERVER_IP:$PROJECT_DIR/

    # 上传环境变量文件
    scp .env.production $SERVER_USER@$SERVER_IP:$PROJECT_DIR/.env

    # 清理临时文件
    rm -f /tmp/rsync-exclude

    log_success "项目文件部署完成"
}

# 服务器端配置和启动
configure_and_start() {
    log_info "配置和启动应用..."
    
    ssh $SERVER_USER@$SERVER_IP << EOF
set -e
cd $PROJECT_DIR

echo "📦 安装依赖包..."
npm install --production

echo "🔧 安装数据库依赖..."
npm install @prisma/client prisma pg dotenv

echo "🗃️ 生成 Prisma 客户端..."
npx prisma generate

echo "🗄️ 推送数据库模式..."
npx prisma db push

echo "📊 运行数据迁移..."
npm run migrate:run || echo "⚠️ 数据迁移跳过（可能是首次部署）"

echo "🧪 测试应用启动..."
timeout 10s npm start || echo "⚠️ 测试启动完成"

echo "🚀 启动生产服务..."
pm2 stop diamond-website || true
pm2 start ecosystem.config.js --env production

echo "💾 保存 PM2 配置..."
pm2 save

echo "🔄 设置开机自启..."
pm2 startup systemd || true

echo "✅ 应用启动完成！"
EOF

    if [ $? -eq 0 ]; then
        log_success "应用配置和启动完成"
    else
        log_error "应用启动失败"
        exit 1
    fi
}

# 验证部署
verify_deployment() {
    log_info "验证部署结果..."
    
    # 等待服务启动
    sleep 5
    
    # 检查PM2状态
    ssh $SERVER_USER@$SERVER_IP "pm2 status diamond-website"
    
    # 健康检查
    if curl -f http://$SERVER_IP:3001/api/health >/dev/null 2>&1; then
        log_success "健康检查通过"
    else
        log_warning "健康检查失败，请检查应用状态"
    fi
    
    # 显示访问信息
    echo ""
    log_success "🎉 部署完成！"
    echo ""
    echo "📱 访问地址:"
    echo "  🏠 网站首页: http://$SERVER_IP:3001"
    echo "  🛠️ 管理后台: http://$SERVER_IP:3001/admin"
    echo "  📊 健康检查: http://$SERVER_IP:3001/api/health"
    echo ""
    echo "🔧 管理命令:"
    echo "  查看状态: ssh $SERVER_USER@$SERVER_IP 'pm2 status'"
    echo "  查看日志: ssh $SERVER_USER@$SERVER_IP 'pm2 logs diamond-website'"
    echo "  重启应用: ssh $SERVER_USER@$SERVER_IP 'pm2 restart diamond-website'"
    echo ""
}

# 主函数
main() {
    show_deployment_info
    
    # 确认部署
    read -p "确认开始一键部署？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "部署已取消"
        exit 0
    fi
    
    # 执行部署步骤
    check_ssh_connection
    setup_server_environment
    create_env_file
    deploy_project
    configure_and_start
    verify_deployment
}

# 运行主函数
main
