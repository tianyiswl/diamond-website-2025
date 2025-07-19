#!/bin/bash

# 🛡️ 生产环境数据保护脚本
# 在代码更新前执行，确保数据安全

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量
PROJECT_DIR="/opt/diamond-website"  # 根据实际路径修改
BACKUP_DIR="/backup/diamond-website"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')

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

# 创建备份目录
create_backup_dir() {
    log_info "创建备份目录..."
    mkdir -p $BACKUP_DIR/pre-deploy
    chmod 755 $BACKUP_DIR
    log_success "备份目录创建完成"
}

# 备份生产数据
backup_production_data() {
    log_info "开始备份生产数据..."
    
    BACKUP_PATH="$BACKUP_DIR/pre-deploy/production-backup-$TIMESTAMP"
    mkdir -p $BACKUP_PATH
    
    # 备份数据文件
    if [ -d "$PROJECT_DIR/data" ]; then
        log_info "备份数据文件..."
        cp -r $PROJECT_DIR/data $BACKUP_PATH/
        log_success "数据文件备份完成"
    else
        log_warning "数据目录不存在: $PROJECT_DIR/data"
    fi
    
    # 备份上传文件
    if [ -d "$PROJECT_DIR/uploads" ]; then
        log_info "备份上传文件..."
        cp -r $PROJECT_DIR/uploads $BACKUP_PATH/
        log_success "上传文件备份完成"
    else
        log_warning "上传目录不存在: $PROJECT_DIR/uploads"
    fi
    
    # 备份配置文件
    log_info "备份配置文件..."
    mkdir -p $BACKUP_PATH/config
    [ -f "$PROJECT_DIR/package.json" ] && cp $PROJECT_DIR/package.json $BACKUP_PATH/config/
    [ -f "/etc/systemd/system/diamond-website.service" ] && cp /etc/systemd/system/diamond-website.service $BACKUP_PATH/config/
    [ -f "/etc/nginx/conf.d/diamond-website.conf" ] && cp /etc/nginx/conf.d/diamond-website.conf $BACKUP_PATH/config/
    
    # 创建备份信息文件
    cat > $BACKUP_PATH/backup-info.txt << EOF
备份时间: $(date)
备份类型: 代码更新前数据保护备份
服务器: $(hostname)
项目路径: $PROJECT_DIR
备份路径: $BACKUP_PATH
Git提交: $(cd $PROJECT_DIR && git rev-parse HEAD 2>/dev/null || echo "Unknown")
EOF
    
    # 压缩备份
    log_info "压缩备份文件..."
    cd $BACKUP_DIR/pre-deploy
    tar -czf "production-backup-$TIMESTAMP.tar.gz" "production-backup-$TIMESTAMP"
    rm -rf "production-backup-$TIMESTAMP"
    
    # 计算校验和
    md5sum "production-backup-$TIMESTAMP.tar.gz" > "production-backup-$TIMESTAMP.tar.gz.md5"
    
    log_success "生产数据备份完成: production-backup-$TIMESTAMP.tar.gz"
    echo "备份文件位置: $BACKUP_DIR/pre-deploy/production-backup-$TIMESTAMP.tar.gz"
}

# 检查.gitignore配置
check_gitignore() {
    log_info "检查.gitignore配置..."
    
    GITIGNORE_FILE="$PROJECT_DIR/.gitignore"
    
    if [ ! -f "$GITIGNORE_FILE" ]; then
        log_warning ".gitignore文件不存在，创建中..."
        cat > $GITIGNORE_FILE << EOF
# 数据文件 - 不要提交到Git
data/
uploads/

# 日志文件
*.log
logs/

# 临时文件
tmp/
temp/

# 环境配置
.env
.env.local

# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 系统文件
.DS_Store
Thumbs.db

# 备份文件
*.backup
*.bak
EOF
        log_success ".gitignore文件已创建"
    else
        # 检查关键目录是否被忽略
        if ! grep -q "^data/" "$GITIGNORE_FILE"; then
            echo "data/" >> $GITIGNORE_FILE
            log_info "已添加data/到.gitignore"
        fi
        
        if ! grep -q "^uploads/" "$GITIGNORE_FILE"; then
            echo "uploads/" >> $GITIGNORE_FILE
            log_info "已添加uploads/到.gitignore"
        fi
        
        log_success ".gitignore配置检查完成"
    fi
}

# 验证数据完整性
verify_data_integrity() {
    log_info "验证数据完整性..."
    
    # 检查关键数据文件
    CRITICAL_FILES=(
        "$PROJECT_DIR/data/admin-config.json"
        "$PROJECT_DIR/data/products.json"
        "$PROJECT_DIR/data/categories.json"
    )
    
    for file in "${CRITICAL_FILES[@]}"; do
        if [ -f "$file" ]; then
            # 验证JSON格式
            if python3 -m json.tool "$file" > /dev/null 2>&1; then
                log_success "✅ $file - JSON格式正确"
            else
                log_error "❌ $file - JSON格式错误"
                exit 1
            fi
        else
            log_warning "⚠️  $file - 文件不存在"
        fi
    done
    
    log_success "数据完整性验证通过"
}

# 显示保护状态
show_protection_status() {
    echo
    echo "🛡️ 生产数据保护完成！"
    echo "================================================"
    echo "✅ 数据备份: $BACKUP_DIR/pre-deploy/production-backup-$TIMESTAMP.tar.gz"
    echo "✅ .gitignore: 已配置忽略数据目录"
    echo "✅ 数据完整性: 验证通过"
    echo
    echo "🔒 受保护的数据:"
    echo "   • 管理员账户信息 (data/admin-config.json)"
    echo "   • 产品数据 (data/products.json)"
    echo "   • 产品分类 (data/categories.json)"
    echo "   • 客户询价记录 (data/inquiries.json)"
    echo "   • 上传的产品图片 (uploads/products/)"
    echo "   • 网站统计数据 (data/analytics.json)"
    echo
    echo "🚀 现在可以安全地执行Git代码更新！"
    echo "================================================"
}

# 主函数
main() {
    echo "🛡️ 开始生产环境数据保护..."
    echo "================================================"
    
    create_backup_dir
    backup_production_data
    check_gitignore
    verify_data_integrity
    show_protection_status
}

# 执行主函数
main "$@"
