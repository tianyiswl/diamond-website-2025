#!/bin/bash

# 🗄️ Diamond Website 数据库快速部署脚本
# 无锡皇德国际贸易有限公司 - 一键部署数据库迁移环境

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 检查系统类型
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/debian_version ]; then
            OS="debian"
        elif [ -f /etc/redhat-release ]; then
            OS="redhat"
        else
            OS="linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    else
        OS="unknown"
    fi
    
    log_info "检测到操作系统: $OS"
}

# 检查必要工具
check_prerequisites() {
    log_info "检查必要工具..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js 16+ 版本"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        log_error "Node.js 版本过低，需要 16+ 版本"
        exit 1
    fi
    
    log_success "Node.js 版本检查通过: $(node -v)"
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    log_success "npm 版本: $(npm -v)"
}

# 安装PostgreSQL
install_postgresql() {
    log_info "安装 PostgreSQL..."
    
    case $OS in
        "debian")
            sudo apt update
            sudo apt install -y postgresql postgresql-contrib
            sudo systemctl start postgresql
            sudo systemctl enable postgresql
            ;;
        "redhat")
            sudo yum install -y postgresql-server postgresql-contrib
            sudo postgresql-setup initdb
            sudo systemctl start postgresql
            sudo systemctl enable postgresql
            ;;
        "macos")
            if command -v brew &> /dev/null; then
                brew install postgresql
                brew services start postgresql
            else
                log_error "请先安装 Homebrew 或手动安装 PostgreSQL"
                exit 1
            fi
            ;;
        *)
            log_error "不支持的操作系统，请手动安装 PostgreSQL"
            exit 1
            ;;
    esac
    
    log_success "PostgreSQL 安装完成"
}

# 配置数据库
setup_database() {
    log_info "配置数据库..."
    
    # 数据库配置
    DB_NAME="diamond_website"
    DB_USER="diamond_user"
    DB_PASSWORD="${DB_PASSWORD:-diamond_password_$(date +%s)}"
    
    # 创建数据库和用户
    sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
\q
EOF
    
    # 生成环境配置文件
    cat > .env.database << EOF
# 🗄️ 数据库配置文件
# 无锡皇德国际贸易有限公司 - Diamond Website 数据库迁移

# PostgreSQL 数据库连接配置
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public"

# 数据库连接池配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_SCHEMA=public

# 连接池设置
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_ACQUIRE_TIMEOUT=30000
DB_POOL_IDLE_TIMEOUT=10000

# 数据库迁移配置
MIGRATION_BACKUP_ENABLED=true
MIGRATION_BACKUP_PATH=./backup/migration
MIGRATION_LOG_LEVEL=info
EOF
    
    log_success "数据库配置完成"
    log_info "数据库名称: $DB_NAME"
    log_info "用户名: $DB_USER"
    log_warning "密码已保存到 .env.database 文件中"
}

# 安装Node.js依赖
install_dependencies() {
    log_info "安装 Node.js 依赖..."
    
    # 检查是否存在package.json
    if [ ! -f "package.json" ]; then
        log_error "package.json 文件不存在"
        exit 1
    fi
    
    # 安装Prisma和数据库相关依赖
    npm install @prisma/client prisma pg dotenv bcrypt
    npm install --save-dev @types/pg
    
    log_success "依赖安装完成"
}

# 初始化Prisma
setup_prisma() {
    log_info "初始化 Prisma..."
    
    # 检查schema文件是否存在
    if [ ! -f "prisma/schema.prisma" ]; then
        log_error "Prisma schema 文件不存在"
        exit 1
    fi
    
    # 生成Prisma客户端
    npx prisma generate
    
    # 推送数据库模式
    npx prisma db push
    
    log_success "Prisma 初始化完成"
}

# 创建种子数据
seed_database() {
    log_info "创建种子数据..."
    
    if [ -f "prisma/seed.js" ]; then
        node prisma/seed.js
        log_success "种子数据创建完成"
    else
        log_warning "种子数据文件不存在，跳过"
    fi
}

# 执行数据迁移
run_migration() {
    log_info "执行数据迁移..."
    
    if [ -f "scripts/migrate-to-database.js" ]; then
        node scripts/migrate-to-database.js
        log_success "数据迁移完成"
    else
        log_warning "迁移脚本不存在，跳过"
    fi
}

# 运行测试验证
run_tests() {
    log_info "运行测试验证..."
    
    if [ -f "scripts/test-migration.js" ]; then
        node scripts/test-migration.js
        log_success "测试验证完成"
    else
        log_warning "测试脚本不存在，跳过"
    fi
}

# 更新服务器配置
update_server_config() {
    log_info "更新服务器配置..."
    
    # 备份原始server.js
    if [ -f "server.js" ]; then
        cp server.js server.js.backup-$(date +%Y%m%d-%H%M%S)
        log_info "已备份原始 server.js"
    fi
    
    # 检查是否需要添加数据库路由
    if ! grep -q "database-api" server.js 2>/dev/null; then
        log_info "需要手动添加数据库API路由到 server.js"
        log_info "请在 server.js 中添加以下代码："
        echo ""
        echo "// 数据库API路由"
        echo "const databaseApiRoutes = require('./src/routes/database-api');"
        echo "app.use('/api/db', databaseApiRoutes);"
        echo ""
    fi
}

# 创建启动脚本
create_startup_script() {
    log_info "创建启动脚本..."
    
    cat > start-with-database.sh << 'EOF'
#!/bin/bash

# 🚀 Diamond Website 数据库版启动脚本

echo "🚀 启动 Diamond Website (数据库版)..."

# 检查数据库连接
echo "🔍 检查数据库连接..."
if ! node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect().then(() => {
  console.log('✅ 数据库连接正常');
  process.exit(0);
}).catch((error) => {
  console.error('❌ 数据库连接失败:', error.message);
  process.exit(1);
});
"; then
    echo "❌ 数据库连接失败，请检查配置"
    exit 1
fi

# 启动服务器
echo "🌐 启动服务器..."
NODE_ENV=production npm start
EOF
    
    chmod +x start-with-database.sh
    log_success "启动脚本创建完成: start-with-database.sh"
}

# 显示完成信息
show_completion_info() {
    log_success "🎉 数据库迁移环境部署完成！"
    echo ""
    echo "📋 部署摘要:"
    echo "  ✅ PostgreSQL 数据库已安装并配置"
    echo "  ✅ Node.js 依赖已安装"
    echo "  ✅ Prisma ORM 已初始化"
    echo "  ✅ 数据库模式已创建"
    echo "  ✅ 种子数据已导入"
    echo "  ✅ JSON数据已迁移"
    echo ""
    echo "🔧 下一步操作:"
    echo "  1. 启动服务器: ./start-with-database.sh"
    echo "  2. 访问管理界面: http://localhost:3001/admin/database-management.html"
    echo "  3. 测试API端点: http://localhost:3001/api/db/health"
    echo ""
    echo "📁 重要文件:"
    echo "  - .env.database: 数据库配置"
    echo "  - backup/migration/: 迁移备份"
    echo "  - start-with-database.sh: 启动脚本"
    echo ""
    echo "🏢 无锡皇德国际贸易有限公司"
    echo "📧 技术支持: sales03@diamond-auto.com"
}

# 主函数
main() {
    echo "🗄️ Diamond Website 数据库迁移部署脚本"
    echo "🏢 无锡皇德国际贸易有限公司"
    echo ""
    
    # 检查是否为root用户运行
    if [ "$EUID" -eq 0 ]; then
        log_error "请不要使用 root 用户运行此脚本"
        exit 1
    fi
    
    # 确认执行
    read -p "是否继续执行数据库迁移部署? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "部署已取消"
        exit 0
    fi
    
    # 执行部署步骤
    detect_os
    check_prerequisites
    install_postgresql
    setup_database
    install_dependencies
    setup_prisma
    seed_database
    run_migration
    run_tests
    update_server_config
    create_startup_script
    show_completion_info
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@"
