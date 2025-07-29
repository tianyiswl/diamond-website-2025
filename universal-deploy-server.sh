#!/bin/bash

# 🚀 钻石网站通用部署脚本
# 无锡皇德国际贸易有限公司
# 支持多种Linux发行版的一键部署方案

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

# 检测操作系统
detect_os() {
    log_info "检测服务器操作系统..."
    
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
#!/bin/bash

echo "🔍 检测操作系统类型..."

# 检测操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
elif type lsb_release >/dev/null 2>&1; then
    OS=$(lsb_release -si)
    VER=$(lsb_release -sr)
elif [ -f /etc/lsb-release ]; then
    . /etc/lsb-release
    OS=$DISTRIB_ID
    VER=$DISTRIB_RELEASE
elif [ -f /etc/debian_version ]; then
    OS=Debian
    VER=$(cat /etc/debian_version)
elif [ -f /etc/SuSe-release ]; then
    OS=openSUSE
elif [ -f /etc/redhat-release ]; then
    OS=RedHat
else
    OS=$(uname -s)
    VER=$(uname -r)
fi

echo "操作系统: $OS"
echo "版本: $VER"

# 检测包管理器
if command -v yum &> /dev/null; then
    echo "包管理器: yum (RedHat/CentOS)"
    echo "PKG_MANAGER=yum" > /tmp/os_info
elif command -v dnf &> /dev/null; then
    echo "包管理器: dnf (Fedora/Rocky/AlmaLinux)"
    echo "PKG_MANAGER=dnf" > /tmp/os_info
elif command -v apt &> /dev/null; then
    echo "包管理器: apt (Debian/Ubuntu)"
    echo "PKG_MANAGER=apt" > /tmp/os_info
elif command -v zypper &> /dev/null; then
    echo "包管理器: zypper (openSUSE)"
    echo "PKG_MANAGER=zypper" > /tmp/os_info
else
    echo "未知包管理器"
    echo "PKG_MANAGER=unknown" > /tmp/os_info
fi

# 检查现有软件
echo ""
echo "🔍 检查已安装软件:"
node --version 2>/dev/null && echo "✅ Node.js 已安装" || echo "❌ Node.js 未安装"
npm --version 2>/dev/null && echo "✅ npm 已安装" || echo "❌ npm 未安装"
pm2 --version 2>/dev/null && echo "✅ PM2 已安装" || echo "❌ PM2 未安装"
psql --version 2>/dev/null && echo "✅ PostgreSQL 已安装" || echo "❌ PostgreSQL 未安装"
git --version 2>/dev/null && echo "✅ Git 已安装" || echo "❌ Git 未安装"
EOF

    log_success "操作系统检测完成"
}

# 配置服务器环境（通用版本）
setup_server_environment() {
    log_info "配置服务器环境（通用版本）..."
    
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
#!/bin/bash
set -e

echo "🔧 开始配置服务器环境..."

# 读取包管理器信息
if [ -f /tmp/os_info ]; then
    . /tmp/os_info
else
    echo "❌ 无法检测包管理器"
    exit 1
fi

echo "使用包管理器: $PKG_MANAGER"

# 根据包管理器更新系统和安装基础工具
case $PKG_MANAGER in
    "yum")
        echo "📦 更新系统包 (yum)..."
        yum update -y
        echo "🔧 安装基础工具..."
        yum install -y curl wget git unzip htop vim nano firewalld
        systemctl start firewalld
        systemctl enable firewalld
        ;;
    "dnf")
        echo "📦 更新系统包 (dnf)..."
        dnf update -y
        echo "🔧 安装基础工具..."
        dnf install -y curl wget git unzip htop vim nano firewalld
        systemctl start firewalld
        systemctl enable firewalld
        ;;
    "apt")
        echo "📦 更新系统包 (apt)..."
        apt update && apt upgrade -y
        echo "🔧 安装基础工具..."
        apt install -y curl wget git unzip htop vim nano ufw
        ;;
    "zypper")
        echo "📦 更新系统包 (zypper)..."
        zypper refresh && zypper update -y
        echo "🔧 安装基础工具..."
        zypper install -y curl wget git unzip htop vim nano firewalld
        ;;
    *)
        echo "❌ 不支持的包管理器: $PKG_MANAGER"
        exit 1
        ;;
esac

# 安装Node.js
if ! command -v node &> /dev/null; then
    echo "📗 安装Node.js 18..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - 2>/dev/null || \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - 2>/dev/null || {
        echo "⚠️ 使用备用方法安装Node.js..."
        # 备用安装方法
        case $PKG_MANAGER in
            "yum"|"dnf")
                $PKG_MANAGER install -y nodejs npm
                ;;
            "apt")
                apt install -y nodejs npm
                ;;
            "zypper")
                zypper install -y nodejs npm
                ;;
        esac
    }
    
    # 如果还是没有安装成功，尝试从官网下载
    if ! command -v node &> /dev/null; then
        echo "📥 从官网下载Node.js..."
        cd /tmp
        wget https://nodejs.org/dist/v18.19.0/node-v18.19.0-linux-x64.tar.xz
        tar -xf node-v18.19.0-linux-x64.tar.xz
        cp -r node-v18.19.0-linux-x64/* /usr/local/
        ln -sf /usr/local/bin/node /usr/bin/node
        ln -sf /usr/local/bin/npm /usr/bin/npm
    fi
else
    echo "✅ Node.js 已安装: $(node --version)"
fi

# 安装PM2
if ! command -v pm2 &> /dev/null; then
    echo "⚙️ 安装PM2..."
    npm install -g pm2
else
    echo "✅ PM2 已安装: $(pm2 --version)"
fi

# 安装PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "🗄️ 安装PostgreSQL..."
    case $PKG_MANAGER in
        "yum")
            yum install -y postgresql-server postgresql-contrib
            postgresql-setup initdb
            systemctl start postgresql
            systemctl enable postgresql
            ;;
        "dnf")
            dnf install -y postgresql-server postgresql-contrib
            postgresql-setup --initdb
            systemctl start postgresql
            systemctl enable postgresql
            ;;
        "apt")
            apt install -y postgresql postgresql-contrib
            systemctl start postgresql
            systemctl enable postgresql
            ;;
        "zypper")
            zypper install -y postgresql-server postgresql-contrib
            systemctl start postgresql
            systemctl enable postgresql
            ;;
    esac
    
    # 配置PostgreSQL
    echo "🔧 配置PostgreSQL..."
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
if command -v firewall-cmd &> /dev/null; then
    # CentOS/RHEL/Rocky Linux 防火墙
    firewall-cmd --permanent --add-port=22/tcp
    firewall-cmd --permanent --add-port=80/tcp
    firewall-cmd --permanent --add-port=443/tcp
    firewall-cmd --permanent --add-port=3001/tcp
    firewall-cmd --reload
elif command -v ufw &> /dev/null; then
    # Ubuntu/Debian 防火墙
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80
    ufw allow 443
    ufw allow 3001
    ufw --force enable
fi

echo "✅ 服务器环境配置完成！"
echo ""
echo "📋 安装摘要:"
echo "  📗 Node.js: $(node --version 2>/dev/null || echo '安装失败')"
echo "  📦 npm: $(npm --version 2>/dev/null || echo '安装失败')"
echo "  ⚙️ PM2: $(pm2 --version 2>/dev/null || echo '安装失败')"
echo "  🗄️ PostgreSQL: $(psql --version 2>/dev/null || echo '安装失败')"
EOF

    if [ $? -eq 0 ]; then
        log_success "服务器环境配置完成"
    else
        log_error "服务器环境配置失败"
        exit 1
    fi
}

# 其他函数保持不变...
create_env_file() {
    log_info "创建环境变量文件..."
    
    cat > .env.production << EOF
# 🔐 钻石网站生产环境配置
NODE_ENV=production
PORT=3001
APP_NAME=diamond-website
DOMAIN=diamond-auto.com
BASE_URL=https://www.diamond-auto.com
DATABASE_URL="postgresql://diamond_user:${DB_PASSWORD}@localhost:5432/diamond_website?schema=public"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=diamond_website
DB_USER=diamond_user
DB_PASSWORD=${DB_PASSWORD}
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

    log_success "环境变量文件创建完成"
}

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
EOF

    # 同步项目文件
    rsync -avz --delete \
        --exclude-from=/tmp/rsync-exclude \
        --progress \
        ./ \
        $SERVER_USER@$SERVER_IP:$PROJECT_DIR/

    # 上传环境变量文件
    scp .env.production $SERVER_USER@$SERVER_IP:$PROJECT_DIR/.env

    rm -f /tmp/rsync-exclude
    log_success "项目文件部署完成"
}

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
npm run migrate:run || echo "⚠️ 数据迁移跳过"

echo "🚀 启动生产服务..."
pm2 stop diamond-website || true
pm2 start ecosystem.config.js --env production

echo "💾 保存 PM2 配置..."
pm2 save

echo "✅ 应用启动完成！"
EOF

    log_success "应用配置和启动完成"
}

verify_deployment() {
    log_info "验证部署结果..."
    sleep 5
    
    ssh $SERVER_USER@$SERVER_IP "pm2 status diamond-website"
    
    if curl -f http://$SERVER_IP:3001/api/health >/dev/null 2>&1; then
        log_success "健康检查通过"
    else
        log_warning "健康检查失败，请检查应用状态"
    fi
    
    echo ""
    log_success "🎉 部署完成！"
    echo ""
    echo "📱 访问地址:"
    echo "  🏠 网站首页: http://$SERVER_IP:3001"
    echo "  🛠️ 管理后台: http://$SERVER_IP:3001/admin"
    echo "  📊 健康检查: http://$SERVER_IP:3001/api/health"
}

# 主函数
main() {
    echo "🚀 钻石网站通用部署脚本"
    echo "无锡皇德国际贸易有限公司"
    echo "支持多种Linux发行版"
    echo "=========================================="
    
    detect_os
    setup_server_environment
    create_env_file
    deploy_project
    configure_and_start
    verify_deployment
}

# 运行主函数
main
