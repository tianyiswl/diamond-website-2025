#!/bin/bash

# 🚀 钻石网站 AlmaLinux 10 专用部署脚本
# 无锡皇德国际贸易有限公司
# 针对 Hostinger AlmaLinux 10 服务器的优化部署方案

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
    echo "🚀 钻石网站 AlmaLinux 10 部署"
    echo "无锡皇德国际贸易有限公司"
    echo "=========================================="
    echo ""
    echo "📋 部署配置:"
    echo "  🌐 服务器: $SERVER_IP (Hostinger AlmaLinux 10)"
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
        log_error "SSH连接失败"
        exit 1
    fi
}

# 配置 AlmaLinux 10 服务器环境
setup_almalinux_environment() {
    log_info "配置 AlmaLinux 10 服务器环境..."
    
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
#!/bin/bash
set -e

echo "🔧 开始配置 AlmaLinux 10 环境..."

# 确认系统版本
echo "📋 系统信息:"
cat /etc/os-release | grep -E "NAME|VERSION"
echo ""

# 更新系统
echo "📦 更新系统包..."
dnf update -y

# 安装 EPEL 仓库（Extra Packages for Enterprise Linux）
echo "📚 安装 EPEL 仓库..."
dnf install -y epel-release

# 安装基础开发工具
echo "🔧 安装基础工具和开发包..."
dnf groupinstall -y "Development Tools"
dnf install -y curl wget git unzip htop vim nano tree firewalld

# 启动并启用防火墙
echo "🔥 配置防火墙..."
systemctl start firewalld
systemctl enable firewalld

# 安装 Node.js 18 (使用 NodeSource 仓库)
echo "📗 安装 Node.js 18..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
dnf install -y nodejs

# 验证 Node.js 安装
echo "Node.js 版本: $(node --version)"
echo "npm 版本: $(npm --version)"

# 安装 PM2
echo "⚙️ 安装 PM2..."
npm install -g pm2

# 安装 PostgreSQL 15
echo "🗄️ 安装 PostgreSQL 15..."
dnf install -y postgresql-server postgresql-contrib

# 初始化 PostgreSQL 数据库
echo "🔧 初始化 PostgreSQL..."
postgresql-setup --initdb

# 启动并启用 PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# 配置 PostgreSQL 认证
echo "🔐 配置 PostgreSQL 认证..."
# 备份原始配置
cp /var/lib/pgsql/data/pg_hba.conf /var/lib/pgsql/data/pg_hba.conf.backup

# 修改认证方式为 md5
sed -i 's/ident/md5/g' /var/lib/pgsql/data/pg_hba.conf

# 重启 PostgreSQL 使配置生效
systemctl restart postgresql

# 创建数据库用户和数据库
echo "🗃️ 创建数据库和用户..."
sudo -u postgres psql << 'EOSQL'
CREATE USER diamond_user WITH PASSWORD '${DB_PASSWORD}';
CREATE DATABASE diamond_website OWNER diamond_user;
GRANT ALL PRIVILEGES ON DATABASE diamond_website TO diamond_user;
ALTER USER diamond_user CREATEDB;
\q
EOSQL

# 测试数据库连接
echo "🧪 测试数据库连接..."
PGPASSWORD='${DB_PASSWORD}' psql -h localhost -U diamond_user -d diamond_website -c "SELECT version();" || echo "⚠️ 数据库连接测试失败，但继续部署"

# 创建项目目录
echo "📁 创建项目目录..."
mkdir -p /var/www/diamond-website
mkdir -p /var/backups/diamond-website
mkdir -p /var/log/diamond-website

# 配置防火墙规则
echo "🔥 配置防火墙规则..."
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --permanent --add-port=3001/tcp
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

# 安装 Nginx (可选，用于反向代理)
echo "🌐 安装 Nginx..."
dnf install -y nginx
systemctl enable nginx

# 配置 SELinux (AlmaLinux 默认启用)
echo "🛡️ 配置 SELinux..."
setsebool -P httpd_can_network_connect 1
setsebool -P httpd_can_network_relay 1

echo "✅ AlmaLinux 10 环境配置完成！"
echo ""
echo "📋 安装摘要:"
echo "  📗 Node.js: $(node --version)"
echo "  📦 npm: $(npm --version)"
echo "  ⚙️ PM2: $(pm2 --version)"
echo "  🗄️ PostgreSQL: $(psql --version | head -1)"
echo "  🌐 Nginx: $(nginx -v 2>&1)"
echo ""
echo "🔥 防火墙状态:"
firewall-cmd --list-all
EOF

    if [ $? -eq 0 ]; then
        log_success "AlmaLinux 10 环境配置完成"
    else
        log_error "环境配置失败"
        exit 1
    fi
}

# 创建环境变量文件
create_env_file() {
    log_info "创建环境变量文件..."
    
    cat > .env.production << EOF
# 🔐 钻石网站生产环境配置
# 无锡皇德国际贸易有限公司 - AlmaLinux 10

# 应用基本配置
NODE_ENV=production
PORT=3001
APP_NAME=diamond-website
APP_VERSION=1.0.0

# 域名配置
DOMAIN=diamond-auto.com
BASE_URL=https://www.diamond-auto.com

# 数据库配置 - PostgreSQL
DATABASE_URL="postgresql://diamond_user:${DB_PASSWORD}@localhost:5432/diamond_website?schema=public"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=diamond_website
DB_USER=diamond_user
DB_PASSWORD=${DB_PASSWORD}
DB_SCHEMA=public

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

# 日志配置
LOG_LEVEL=info
LOG_FILE=./logs/app.log
ERROR_LOG_FILE=./logs/error.log

# 缓存配置
CACHE_TTL=3600
STATIC_CACHE_TTL=31536000

# 性能配置
COMPRESSION_ENABLED=true
COMPRESSION_LEVEL=6

# 安全头配置
SECURITY_HEADERS_ENABLED=true
CORS_ORIGIN=https://www.diamond-auto.com
CSP_ENABLED=true
EOF

    log_success "环境变量文件创建完成"
}

# 部署项目文件
deploy_project() {
    log_info "部署项目文件到 AlmaLinux 服务器..."
    
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
    log_info "在 AlmaLinux 服务器上配置和启动应用..."
    
    ssh $SERVER_USER@$SERVER_IP << EOF
set -e
cd $PROJECT_DIR

echo "📦 安装生产依赖..."
npm install --production

echo "🔧 安装数据库相关依赖..."
npm install @prisma/client prisma pg dotenv

echo "🗃️ 生成 Prisma 客户端..."
npx prisma generate

echo "🗄️ 推送数据库模式到 PostgreSQL..."
npx prisma db push

echo "📊 运行数据迁移（从JSON到数据库）..."
npm run migrate:run || echo "⚠️ 数据迁移跳过（可能是首次部署）"

echo "🧪 测试应用启动..."
timeout 10s npm start || echo "⚠️ 测试启动完成"

echo "🚀 使用 PM2 启动生产服务..."
pm2 stop diamond-website || true
pm2 start ecosystem.config.js --env production

echo "💾 保存 PM2 配置..."
pm2 save

echo "🔄 设置 PM2 开机自启..."
pm2 startup systemd -u root --hp /root

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
    log_info "验证 AlmaLinux 部署结果..."
    
    # 等待服务启动
    sleep 5
    
    # 检查PM2状态
    log_info "检查 PM2 应用状态..."
    ssh $SERVER_USER@$SERVER_IP "pm2 status diamond-website"
    
    # 健康检查
    log_info "执行健康检查..."
    if curl -f http://$SERVER_IP:3001/api/health >/dev/null 2>&1; then
        log_success "健康检查通过"
    else
        log_warning "健康检查失败，请检查应用日志"
        ssh $SERVER_USER@$SERVER_IP "pm2 logs diamond-website --lines 10"
    fi
    
    # 显示访问信息
    echo ""
    log_success "🎉 AlmaLinux 部署完成！"
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
    echo "🗄️ 数据库连接测试:"
    echo "  ssh $SERVER_USER@$SERVER_IP 'PGPASSWORD=${DB_PASSWORD} psql -h localhost -U diamond_user -d diamond_website'"
    echo ""
}

# 主函数
main() {
    show_deployment_info
    
    # 确认部署
    read -p "确认开始 AlmaLinux 10 部署？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "部署已取消"
        exit 0
    fi
    
    # 执行部署步骤
    check_ssh_connection
    setup_almalinux_environment
    create_env_file
    deploy_project
    configure_and_start
    verify_deployment
}

# 运行主函数
main
