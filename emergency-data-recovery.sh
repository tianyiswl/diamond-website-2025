#!/bin/bash

# 🆘 紧急数据恢复脚本
# 当数据意外丢失时使用此脚本快速恢复

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

# 显示使用说明
show_usage() {
    echo "🆘 紧急数据恢复工具"
    echo "使用方法: $0 [选项]"
    echo
    echo "选项:"
    echo "  list                    列出所有可用备份"
    echo "  auto                    自动恢复最新备份"
    echo "  restore <backup-file>   恢复指定备份文件"
    echo "  verify                  验证当前数据完整性"
    echo "  status                  显示系统状态"
    echo
    echo "示例:"
    echo "  $0 list"
    echo "  $0 auto"
    echo "  $0 restore production-backup-20250718_120000.tar.gz"
    echo
}

# 列出所有备份
list_backups() {
    echo "📋 可用的备份文件:"
    echo "================================================"
    
    if [ -d "$BACKUP_DIR/pre-deploy" ]; then
        echo "🔄 代码部署前备份:"
        ls -lht $BACKUP_DIR/pre-deploy/*.tar.gz 2>/dev/null | while read line; do
            echo "   $line"
        done || echo "   无备份文件"
        echo
    fi
    
    if [ -d "$BACKUP_DIR/daily" ]; then
        echo "📅 每日自动备份:"
        ls -lht $BACKUP_DIR/daily/*.tar.gz 2>/dev/null | head -10 | while read line; do
            echo "   $line"
        done || echo "   无备份文件"
        echo
    fi
    
    echo "💡 使用 '$0 restore <文件名>' 恢复指定备份"
}

# 自动恢复最新备份
auto_restore() {
    log_info "自动查找并恢复最新备份..."
    
    # 查找最新的备份文件
    LATEST_BACKUP=""
    
    # 优先使用代码部署前的备份
    if [ -d "$BACKUP_DIR/pre-deploy" ]; then
        LATEST_BACKUP=$(ls -t $BACKUP_DIR/pre-deploy/production-backup-*.tar.gz 2>/dev/null | head -1)
    fi
    
    # 如果没有部署前备份，使用每日备份
    if [ -z "$LATEST_BACKUP" ] && [ -d "$BACKUP_DIR/daily" ]; then
        LATEST_BACKUP=$(ls -t $BACKUP_DIR/daily/backup-*.tar.gz 2>/dev/null | head -1)
    fi
    
    if [ -z "$LATEST_BACKUP" ]; then
        log_error "未找到任何备份文件"
        exit 1
    fi
    
    log_info "找到最新备份: $(basename $LATEST_BACKUP)"
    restore_backup "$LATEST_BACKUP"
}

# 恢复指定备份
restore_backup() {
    local backup_file="$1"
    
    # 如果只提供了文件名，尝试在备份目录中查找
    if [ ! -f "$backup_file" ]; then
        # 在pre-deploy目录中查找
        if [ -f "$BACKUP_DIR/pre-deploy/$backup_file" ]; then
            backup_file="$BACKUP_DIR/pre-deploy/$backup_file"
        # 在daily目录中查找
        elif [ -f "$BACKUP_DIR/daily/$backup_file" ]; then
            backup_file="$BACKUP_DIR/daily/$backup_file"
        else
            log_error "备份文件不存在: $backup_file"
            exit 1
        fi
    fi
    
    log_info "开始恢复备份: $(basename $backup_file)"
    
    # 验证备份文件完整性
    verify_backup_integrity "$backup_file"
    
    # 停止服务
    log_info "停止应用服务..."
    if systemctl is-active --quiet $SERVICE_NAME; then
        systemctl stop $SERVICE_NAME
        log_success "服务已停止"
    fi
    
    # 备份当前数据（以防恢复失败）
    log_info "备份当前数据..."
    CURRENT_BACKUP="/tmp/current-backup-$(date +%Y%m%d_%H%M%S)"
    mkdir -p $CURRENT_BACKUP
    [ -d "$PROJECT_DIR/data" ] && cp -r $PROJECT_DIR/data $CURRENT_BACKUP/ 2>/dev/null || true
    [ -d "$PROJECT_DIR/uploads" ] && cp -r $PROJECT_DIR/uploads $CURRENT_BACKUP/ 2>/dev/null || true
    log_success "当前数据已备份到: $CURRENT_BACKUP"
    
    # 解压备份文件
    log_info "解压备份文件..."
    TEMP_DIR="/tmp/restore-temp-$(date +%Y%m%d_%H%M%S)"
    mkdir -p $TEMP_DIR
    cd $TEMP_DIR
    
    tar -xzf "$backup_file"
    EXTRACT_DIR=$(find . -name "*backup-*" -type d | head -1)
    
    if [ -z "$EXTRACT_DIR" ]; then
        log_error "备份文件格式错误"
        rm -rf $TEMP_DIR
        exit 1
    fi
    
    # 恢复数据文件
    log_info "恢复数据文件..."
    if [ -d "$EXTRACT_DIR/data" ]; then
        rm -rf $PROJECT_DIR/data
        cp -r $EXTRACT_DIR/data $PROJECT_DIR/
        chown -R diamond:diamond $PROJECT_DIR/data 2>/dev/null || true
        log_success "数据文件恢复完成"
    else
        log_warning "备份中未找到数据文件"
    fi
    
    # 恢复上传文件
    log_info "恢复上传文件..."
    if [ -d "$EXTRACT_DIR/uploads" ]; then
        rm -rf $PROJECT_DIR/uploads
        cp -r $EXTRACT_DIR/uploads $PROJECT_DIR/
        chown -R diamond:diamond $PROJECT_DIR/uploads 2>/dev/null || true
        log_success "上传文件恢复完成"
    else
        log_warning "备份中未找到上传文件"
    fi
    
    # 清理临时文件
    rm -rf $TEMP_DIR
    
    # 启动服务
    log_info "启动应用服务..."
    systemctl start $SERVICE_NAME
    
    # 等待服务启动
    sleep 5
    
    # 验证服务状态
    if systemctl is-active --quiet $SERVICE_NAME; then
        log_success "✅ 服务启动成功，数据恢复完成"
        log_info "当前数据备份保存在: $CURRENT_BACKUP"
        
        # 验证数据完整性
        verify_data_integrity
        
    else
        log_error "❌ 服务启动失败，正在回滚..."
        
        # 回滚到恢复前的状态
        [ -d "$CURRENT_BACKUP/data" ] && cp -r $CURRENT_BACKUP/data $PROJECT_DIR/ 2>/dev/null || true
        [ -d "$CURRENT_BACKUP/uploads" ] && cp -r $CURRENT_BACKUP/uploads $PROJECT_DIR/ 2>/dev/null || true
        chown -R diamond:diamond $PROJECT_DIR/data $PROJECT_DIR/uploads 2>/dev/null || true
        
        systemctl start $SERVICE_NAME
        log_error "已回滚到恢复前状态"
        exit 1
    fi
}

# 验证备份文件完整性
verify_backup_integrity() {
    local backup_file="$1"
    local md5_file="${backup_file}.md5"
    
    if [ -f "$md5_file" ]; then
        log_info "验证备份文件完整性..."
        cd $(dirname "$backup_file")
        if md5sum -c "$(basename $md5_file)" >/dev/null 2>&1; then
            log_success "✅ 备份文件完整性验证通过"
        else
            log_error "❌ 备份文件完整性验证失败"
            exit 1
        fi
    else
        log_warning "⚠️  未找到MD5校验文件，跳过完整性验证"
    fi
}

# 验证数据完整性
verify_data_integrity() {
    log_info "验证数据完整性..."
    
    local errors=0
    
    # 检查关键数据文件
    CRITICAL_FILES=(
        "$PROJECT_DIR/data/admin-config.json"
        "$PROJECT_DIR/data/products.json"
        "$PROJECT_DIR/data/categories.json"
    )
    
    for file in "${CRITICAL_FILES[@]}"; do
        if [ -f "$file" ]; then
            # 验证JSON格式
            if python3 -m json.tool "$file" >/dev/null 2>&1; then
                log_success "✅ $(basename $file) - 格式正确"
            else
                log_error "❌ $(basename $file) - JSON格式错误"
                ((errors++))
            fi
        else
            log_error "❌ $(basename $file) - 文件不存在"
            ((errors++))
        fi
    done
    
    if [ $errors -eq 0 ]; then
        log_success "✅ 数据完整性验证通过"
    else
        log_error "❌ 发现 $errors 个数据完整性问题"
        return 1
    fi
}

# 显示系统状态
show_status() {
    echo "📊 系统状态报告"
    echo "================================================"
    
    # 服务状态
    echo "🔧 服务状态:"
    if systemctl is-active --quiet $SERVICE_NAME; then
        echo "   ✅ $SERVICE_NAME: 运行中"
    else
        echo "   ❌ $SERVICE_NAME: 已停止"
    fi
    
    # 数据文件状态
    echo
    echo "📁 数据文件状态:"
    CRITICAL_FILES=(
        "$PROJECT_DIR/data/admin-config.json"
        "$PROJECT_DIR/data/products.json"
        "$PROJECT_DIR/data/categories.json"
        "$PROJECT_DIR/data/inquiries.json"
    )
    
    for file in "${CRITICAL_FILES[@]}"; do
        if [ -f "$file" ]; then
            size=$(du -h "$file" | cut -f1)
            echo "   ✅ $(basename $file): $size"
        else
            echo "   ❌ $(basename $file): 不存在"
        fi
    done
    
    # 上传文件状态
    echo
    echo "📷 上传文件状态:"
    if [ -d "$PROJECT_DIR/uploads/products" ]; then
        count=$(find $PROJECT_DIR/uploads/products -type f | wc -l)
        size=$(du -sh $PROJECT_DIR/uploads/products 2>/dev/null | cut -f1 || echo "0")
        echo "   ✅ 产品图片: $count 个文件, $size"
    else
        echo "   ❌ 上传目录不存在"
    fi
    
    # 备份状态
    echo
    echo "💾 备份状态:"
    if [ -d "$BACKUP_DIR" ]; then
        pre_deploy_count=$(ls $BACKUP_DIR/pre-deploy/*.tar.gz 2>/dev/null | wc -l || echo "0")
        daily_count=$(ls $BACKUP_DIR/daily/*.tar.gz 2>/dev/null | wc -l || echo "0")
        echo "   📋 部署前备份: $pre_deploy_count 个"
        echo "   📅 每日备份: $daily_count 个"
    else
        echo "   ❌ 备份目录不存在"
    fi
    
    echo "================================================"
}

# 主函数
main() {
    case "$1" in
        list)
            list_backups
            ;;
        auto)
            auto_restore
            ;;
        restore)
            if [ -z "$2" ]; then
                log_error "请指定要恢复的备份文件"
                show_usage
                exit 1
            fi
            restore_backup "$2"
            ;;
        verify)
            verify_data_integrity
            ;;
        status)
            show_status
            ;;
        *)
            show_usage
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
