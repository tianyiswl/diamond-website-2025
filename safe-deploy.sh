#!/bin/bash

# 🚀 安全代码部署脚本
# 确保生产数据不丢失的Git代码更新流程

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量
PROJECT_DIR="/opt/diamond-website"  # 根据实际路径修改
SERVICE_NAME="diamond-website"
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

# 检查环境
check_environment() {
    log_info "检查部署环境..."
    
    # 检查项目目录
    if [ ! -d "$PROJECT_DIR" ]; then
        log_error "项目目录不存在: $PROJECT_DIR"
        exit 1
    fi
    
    # 检查Git仓库
    if [ ! -d "$PROJECT_DIR/.git" ]; then
        log_error "不是Git仓库: $PROJECT_DIR"
        exit 1
    fi
    
    # 检查服务状态
    if ! systemctl is-active --quiet $SERVICE_NAME; then
        log_warning "服务未运行: $SERVICE_NAME"
    fi
    
    log_success "环境检查通过"
}

# 预部署数据保护
pre_deploy_protection() {
    log_info "执行预部署数据保护..."
    
    # 执行数据保护脚本
    if [ -f "./production-data-protection.sh" ]; then
        chmod +x ./production-data-protection.sh
        ./production-data-protection.sh
    else
        log_warning "数据保护脚本不存在，手动备份数据..."
        
        # 手动备份关键数据
        MANUAL_BACKUP="$BACKUP_DIR/manual-backup-$TIMESTAMP"
        mkdir -p $MANUAL_BACKUP
        
        [ -d "$PROJECT_DIR/data" ] && cp -r $PROJECT_DIR/data $MANUAL_BACKUP/
        [ -d "$PROJECT_DIR/uploads" ] && cp -r $PROJECT_DIR/uploads $MANUAL_BACKUP/
        
        log_success "手动数据备份完成: $MANUAL_BACKUP"
    fi
}

# 停止服务
stop_service() {
    log_info "停止应用服务..."
    
    if systemctl is-active --quiet $SERVICE_NAME; then
        systemctl stop $SERVICE_NAME
        log_success "服务已停止: $SERVICE_NAME"
    else
        log_info "服务未运行，跳过停止步骤"
    fi
}

# 更新代码
update_code() {
    log_info "更新代码..."
    
    cd $PROJECT_DIR
    
    # 保存当前提交ID
    CURRENT_COMMIT=$(git rev-parse HEAD)
    log_info "当前提交: $CURRENT_COMMIT"
    
    # 拉取最新代码
    log_info "拉取最新代码..."
    git fetch origin
    
    # 检查是否有更新
    LATEST_COMMIT=$(git rev-parse origin/main 2>/dev/null || git rev-parse origin/master)
    
    if [ "$CURRENT_COMMIT" = "$LATEST_COMMIT" ]; then
        log_info "代码已是最新版本，无需更新"
        return 0
    fi
    
    log_info "发现新版本: $LATEST_COMMIT"
    
    # 合并代码（保护本地数据）
    log_info "合并代码更新..."
    git merge origin/main 2>/dev/null || git merge origin/master
    
    log_success "代码更新完成"
}

# 恢复数据文件
restore_data_files() {
    log_info "确保数据文件完整性..."
    
    # 检查并恢复数据目录
    if [ ! -d "$PROJECT_DIR/data" ]; then
        log_warning "数据目录丢失，从备份恢复..."
        
        # 查找最新备份
        LATEST_BACKUP=$(ls -t $BACKUP_DIR/pre-deploy/production-backup-*.tar.gz 2>/dev/null | head -1)
        
        if [ -n "$LATEST_BACKUP" ]; then
            log_info "从备份恢复数据: $LATEST_BACKUP"
            
            TEMP_DIR="/tmp/restore-$TIMESTAMP"
            mkdir -p $TEMP_DIR
            cd $TEMP_DIR
            
            tar -xzf "$LATEST_BACKUP"
            EXTRACT_DIR=$(find . -name "production-backup-*" -type d | head -1)
            
            if [ -d "$EXTRACT_DIR/data" ]; then
                cp -r $EXTRACT_DIR/data $PROJECT_DIR/
                log_success "数据目录已恢复"
            fi
            
            if [ -d "$EXTRACT_DIR/uploads" ]; then
                cp -r $EXTRACT_DIR/uploads $PROJECT_DIR/
                log_success "上传目录已恢复"
            fi
            
            rm -rf $TEMP_DIR
        else
            log_error "未找到数据备份文件"
            exit 1
        fi
    else
        log_success "数据目录完整"
    fi
}

# 更新依赖
update_dependencies() {
    log_info "检查并更新依赖..."
    
    cd $PROJECT_DIR
    
    # 检查package.json是否有变化
    if git diff HEAD~1 HEAD --name-only | grep -q "package.json"; then
        log_info "package.json有更新，重新安装依赖..."
        npm install --production
        log_success "依赖更新完成"
    else
        log_info "依赖无变化，跳过更新"
    fi
}

# 设置文件权限
set_permissions() {
    log_info "设置文件权限..."
    
    # 设置项目目录权限
    chown -R diamond:diamond $PROJECT_DIR 2>/dev/null || true
    
    # 确保数据目录权限
    [ -d "$PROJECT_DIR/data" ] && chmod 755 $PROJECT_DIR/data
    [ -d "$PROJECT_DIR/uploads" ] && chmod 755 $PROJECT_DIR/uploads
    
    log_success "文件权限设置完成"
}

# 启动服务
start_service() {
    log_info "启动应用服务..."
    
    systemctl start $SERVICE_NAME
    
    # 等待服务启动
    sleep 5
    
    # 检查服务状态
    if systemctl is-active --quiet $SERVICE_NAME; then
        log_success "✅ 服务启动成功: $SERVICE_NAME"
    else
        log_error "❌ 服务启动失败"
        
        # 显示服务状态和日志
        systemctl status $SERVICE_NAME
        journalctl -u $SERVICE_NAME --no-pager -n 20
        
        exit 1
    fi
}

# 验证部署
verify_deployment() {
    log_info "验证部署结果..."
    
    # 检查服务端口
    PORT=$(grep -o 'PORT.*[0-9]\+' $PROJECT_DIR/server.js | grep -o '[0-9]\+' | head -1)
    PORT=${PORT:-3000}
    
    log_info "检查服务端口: $PORT"
    
    # 等待服务完全启动
    sleep 10
    
    # 检查端口是否监听
    if netstat -tlnp | grep -q ":$PORT "; then
        log_success "✅ 服务端口正常监听: $PORT"
    else
        log_error "❌ 服务端口未监听: $PORT"
        exit 1
    fi
    
    # 检查HTTP响应
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT | grep -q "200\|302"; then
        log_success "✅ HTTP服务响应正常"
    else
        log_warning "⚠️  HTTP服务响应异常，请检查"
    fi
    
    # 检查关键数据文件
    CRITICAL_FILES=(
        "$PROJECT_DIR/data/admin-config.json"
        "$PROJECT_DIR/data/products.json"
    )
    
    for file in "${CRITICAL_FILES[@]}"; do
        if [ -f "$file" ]; then
            log_success "✅ 数据文件存在: $(basename $file)"
        else
            log_error "❌ 数据文件丢失: $(basename $file)"
            exit 1
        fi
    done
}

# 显示部署结果
show_deployment_result() {
    echo
    echo "🎉 代码部署完成！"
    echo "================================================"
    echo "✅ 代码更新: 成功"
    echo "✅ 数据保护: 完整"
    echo "✅ 服务状态: 正常运行"
    echo "✅ 依赖更新: 完成"
    echo
    echo "📊 部署信息:"
    echo "   时间: $(date)"
    echo "   提交: $(cd $PROJECT_DIR && git rev-parse HEAD)"
    echo "   服务: $SERVICE_NAME"
    echo "   端口: $(grep -o 'PORT.*[0-9]\+' $PROJECT_DIR/server.js | grep -o '[0-9]\+' | head -1 || echo '3000')"
    echo
    echo "🔧 管理命令:"
    echo "   查看状态: systemctl status $SERVICE_NAME"
    echo "   查看日志: journalctl -u $SERVICE_NAME -f"
    echo "   重启服务: systemctl restart $SERVICE_NAME"
    echo
    echo "🛡️ 数据备份位置:"
    echo "   $BACKUP_DIR/pre-deploy/"
    echo "================================================"
}

# 主函数
main() {
    echo "🚀 开始安全代码部署..."
    echo "================================================"
    
    check_environment
    pre_deploy_protection
    stop_service
    update_code
    restore_data_files
    update_dependencies
    set_permissions
    start_service
    verify_deployment
    show_deployment_result
}

# 执行主函数
main "$@"
