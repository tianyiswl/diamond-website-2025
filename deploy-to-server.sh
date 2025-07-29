#!/bin/bash

# 🚀 钻石网站自动化部署脚本
# 无锡皇德国际贸易有限公司 - 服务器部署自动化工具
# 使用方法: ./deploy-to-server.sh [production|staging]

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
ENVIRONMENT=${1:-production}
PROJECT_NAME="diamond-website"
LOCAL_PROJECT_DIR="."
REMOTE_USER="root"
REMOTE_HOST="167.88.43.193"
REMOTE_PROJECT_DIR="/var/www/diamond-website"
BACKUP_DIR="/var/backups/diamond-website"
PM2_APP_NAME="diamond-website"

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

# 检查必要工具
check_requirements() {
    log_info "检查部署环境..."
    
    # 检查本地工具
    if ! command -v rsync &> /dev/null; then
        log_error "rsync 未安装，请先安装: sudo apt install rsync"
        exit 1
    fi
    
    if ! command -v ssh &> /dev/null; then
        log_error "ssh 未安装，请先安装 OpenSSH 客户端"
        exit 1
    fi
    
    # 检查项目文件
    if [ ! -f "package.json" ]; then
        log_error "当前目录不是有效的 Node.js 项目"
        exit 1
    fi
    
    if [ ! -f "server.js" ]; then
        log_error "未找到 server.js 文件"
        exit 1
    fi
    
    log_success "环境检查通过"
}

# 预部署检查
pre_deploy_check() {
    log_info "执行预部署检查..."
    
    # 检查语法
    log_info "检查 JavaScript 语法..."
    node -c server.js || {
        log_error "server.js 语法错误"
        exit 1
    }
    
    # 检查依赖
    log_info "检查依赖包..."
    npm audit --audit-level=high || {
        log_warning "发现高风险依赖，建议修复后再部署"
        read -p "是否继续部署？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    }
    
    log_success "预部署检查完成"
}

# 创建服务器备份
create_backup() {
    log_info "创建服务器备份..."
    
    BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/${PROJECT_NAME}-backup-$BACKUP_DATE"
    
    ssh $REMOTE_USER@$REMOTE_HOST "
        # 创建备份目录
        sudo mkdir -p $BACKUP_DIR
        
        # 停止应用
        pm2 stop $PM2_APP_NAME || true
        
        # 创建备份
        if [ -d '$REMOTE_PROJECT_DIR' ]; then
            sudo cp -r $REMOTE_PROJECT_DIR $BACKUP_PATH
            echo '✅ 备份创建成功: $BACKUP_PATH'
        else
            echo '⚠️  目标目录不存在，跳过备份'
        fi
    " || {
        log_error "备份创建失败"
        exit 1
    }
    
    log_success "备份创建完成: $BACKUP_PATH"
}

# 上传项目文件
upload_files() {
    log_info "上传项目文件到服务器..."
    
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

    # 使用 rsync 同步文件
    rsync -avz --delete \
        --exclude-from=/tmp/rsync-exclude \
        --progress \
        $LOCAL_PROJECT_DIR/ \
        $REMOTE_USER@$REMOTE_HOST:$REMOTE_PROJECT_DIR/ || {
        log_error "文件上传失败"
        exit 1
    }
    
    # 清理临时文件
    rm -f /tmp/rsync-exclude
    
    log_success "文件上传完成"
}

# 服务器端部署
deploy_on_server() {
    log_info "在服务器上执行部署..."
    
    ssh $REMOTE_USER@$REMOTE_HOST "
        set -e
        cd $REMOTE_PROJECT_DIR
        
        echo '📦 安装依赖包...'
        npm install --production
        
        echo '🔧 安装数据库依赖...'
        npm install @prisma/client prisma pg dotenv
        
        echo '🗃️ 生成 Prisma 客户端...'
        npx prisma generate
        
        echo '🔍 检查环境变量...'
        if [ ! -f '.env' ]; then
            echo '⚠️  .env 文件不存在，请手动创建'
            cp .env.example .env || echo '请手动配置环境变量'
        fi
        
        echo '🗄️ 推送数据库模式...'
        npx prisma db push || echo '⚠️  数据库推送失败，请检查数据库连接'
        
        echo '📊 运行数据迁移...'
        npm run migrate:run || echo '⚠️  数据迁移失败，请检查'
        
        echo '🧪 测试应用启动...'
        timeout 10s npm start || echo '⚠️  应用测试启动失败'
        
        echo '🚀 启动生产服务...'
        pm2 start ecosystem.config.js --env production || pm2 restart $PM2_APP_NAME
        
        echo '💾 保存 PM2 配置...'
        pm2 save
        
        echo '✅ 部署完成！'
    " || {
        log_error "服务器部署失败"
        return 1
    }
    
    log_success "服务器部署完成"
}

# 部署验证
verify_deployment() {
    log_info "验证部署结果..."
    
    # 等待服务启动
    sleep 5
    
    ssh $REMOTE_USER@$REMOTE_HOST "
        echo '🔍 检查 PM2 状态...'
        pm2 status $PM2_APP_NAME
        
        echo '🏥 检查应用健康状态...'
        curl -f http://localhost:3001/api/health || echo '⚠️  健康检查失败'
        
        echo '📊 检查应用状态...'
        curl -f http://localhost:3001/api/status || echo '⚠️  状态检查失败'
        
        echo '📝 检查最近日志...'
        pm2 logs $PM2_APP_NAME --lines 10 --nostream
    " || {
        log_warning "部署验证出现问题，请检查日志"
        return 1
    }
    
    log_success "部署验证通过"
}

# 回滚函数
rollback() {
    log_warning "开始回滚到上一个版本..."
    
    ssh $REMOTE_USER@$REMOTE_HOST "
        # 停止当前服务
        pm2 stop $PM2_APP_NAME || true
        
        # 查找最新备份
        LATEST_BACKUP=\$(ls -t $BACKUP_DIR/${PROJECT_NAME}-backup-* 2>/dev/null | head -1)
        
        if [ -n \"\$LATEST_BACKUP\" ]; then
            echo \"恢复备份: \$LATEST_BACKUP\"
            sudo rm -rf $REMOTE_PROJECT_DIR
            sudo cp -r \$LATEST_BACKUP $REMOTE_PROJECT_DIR
            sudo chown -R $REMOTE_USER:$REMOTE_USER $REMOTE_PROJECT_DIR
            
            # 重启服务
            cd $REMOTE_PROJECT_DIR
            pm2 start ecosystem.config.js --env production
            
            echo '✅ 回滚完成'
        else
            echo '❌ 未找到备份文件'
            exit 1
        fi
    " || {
        log_error "回滚失败"
        exit 1
    }
    
    log_success "回滚完成"
}

# 主部署流程
main() {
    echo "🚀 开始部署 $PROJECT_NAME 到 $ENVIRONMENT 环境"
    echo "目标服务器: $REMOTE_USER@$REMOTE_HOST"
    echo "项目目录: $REMOTE_PROJECT_DIR"
    echo ""
    
    # 确认部署
    read -p "确认开始部署？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "部署已取消"
        exit 0
    fi
    
    # 执行部署步骤
    check_requirements
    pre_deploy_check
    create_backup
    upload_files
    
    if deploy_on_server; then
        if verify_deployment; then
            log_success "🎉 部署成功完成！"
            echo ""
            echo "访问地址:"
            echo "  🏠 前台网站: http://$REMOTE_HOST:3001"
            echo "  🛠️ 管理后台: http://$REMOTE_HOST:3001/admin"
            echo "  📊 健康检查: http://$REMOTE_HOST:3001/api/health"
        else
            log_warning "部署完成但验证失败，请手动检查"
        fi
    else
        log_error "部署失败"
        read -p "是否执行回滚？(y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rollback
        fi
        exit 1
    fi
}

# 脚本入口
if [ "$1" = "--rollback" ]; then
    rollback
    exit 0
fi

main
