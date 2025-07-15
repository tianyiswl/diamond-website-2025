#!/bin/bash

# 💾 Diamond Website CMS - 备份和恢复配置脚本
# 配置自动备份、数据恢复和灾难恢复方案

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量
PROJECT_DIR="/opt/diamond-website"
BACKUP_DIR="/backup/diamond-website"
REMOTE_BACKUP_DIR="/mnt/remote-backup"  # 可选的远程备份目录
RETENTION_DAYS=30

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

# 检查root权限
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用root权限运行此脚本"
        exit 1
    fi
}

# 创建备份目录结构
create_backup_structure() {
    log_info "创建备份目录结构..."
    
    mkdir -p $BACKUP_DIR/{daily,weekly,monthly,config,logs}
    mkdir -p $PROJECT_DIR/scripts/backup
    
    # 设置权限
    chown -R diamond:diamond $BACKUP_DIR
    chmod 750 $BACKUP_DIR
    
    log_success "备份目录结构创建完成"
}

# 创建数据备份脚本
create_data_backup_script() {
    log_info "创建数据备份脚本..."
    
    cat > $PROJECT_DIR/scripts/backup/backup-data.sh << 'EOF'
#!/bin/bash

# 数据备份脚本
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
PROJECT_DIR="/opt/diamond-website"
BACKUP_DIR="/backup/diamond-website"
LOG_FILE="$BACKUP_DIR/logs/backup-$TIMESTAMP.log"

# 创建日志目录
mkdir -p $(dirname $LOG_FILE)

# 日志函数
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

log_message "开始数据备份..."

# 创建备份目录
DAILY_BACKUP_DIR="$BACKUP_DIR/daily/backup-$TIMESTAMP"
mkdir -p $DAILY_BACKUP_DIR

# 备份应用数据
log_message "备份应用数据文件..."
cp -r $PROJECT_DIR/data $DAILY_BACKUP_DIR/
cp -r $PROJECT_DIR/uploads $DAILY_BACKUP_DIR/

# 备份配置文件
log_message "备份配置文件..."
mkdir -p $DAILY_BACKUP_DIR/config
cp $PROJECT_DIR/package.json $DAILY_BACKUP_DIR/config/
cp $PROJECT_DIR/server.js $DAILY_BACKUP_DIR/config/
cp /etc/systemd/system/diamond-website.service $DAILY_BACKUP_DIR/config/ 2>/dev/null || true
cp /etc/nginx/conf.d/diamond-website.conf $DAILY_BACKUP_DIR/config/ 2>/dev/null || true

# 备份日志文件（最近7天）
log_message "备份日志文件..."
mkdir -p $DAILY_BACKUP_DIR/logs
find /var/log/diamond-website -name "*.log" -mtime -7 -exec cp {} $DAILY_BACKUP_DIR/logs/ \; 2>/dev/null || true

# 创建备份信息文件
cat > $DAILY_BACKUP_DIR/backup-info.txt << EOL
备份时间: $(date)
备份类型: 每日备份
服务器: $(hostname)
系统版本: $(cat /etc/almalinux-release 2>/dev/null || echo "Unknown")
应用版本: $(cd $PROJECT_DIR && git rev-parse HEAD 2>/dev/null || echo "Unknown")
备份大小: $(du -sh $DAILY_BACKUP_DIR | cut -f1)
EOL

# 压缩备份
log_message "压缩备份文件..."
cd $BACKUP_DIR/daily
tar -czf "backup-$TIMESTAMP.tar.gz" "backup-$TIMESTAMP"
rm -rf "backup-$TIMESTAMP"

# 计算校验和
md5sum "backup-$TIMESTAMP.tar.gz" > "backup-$TIMESTAMP.tar.gz.md5"

log_message "数据备份完成: backup-$TIMESTAMP.tar.gz"

# 清理旧备份
log_message "清理旧备份文件..."
find $BACKUP_DIR/daily -name "backup-*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR/daily -name "backup-*.tar.gz.md5" -mtime +30 -delete

log_message "备份任务完成"
EOF

    chmod +x $PROJECT_DIR/scripts/backup/backup-data.sh
    chown diamond:diamond $PROJECT_DIR/scripts/backup/backup-data.sh
    
    log_success "数据备份脚本创建完成"
}

# 创建系统备份脚本
create_system_backup_script() {
    log_info "创建系统备份脚本..."
    
    cat > $PROJECT_DIR/scripts/backup/backup-system.sh << 'EOF'
#!/bin/bash

# 系统配置备份脚本
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_DIR="/backup/diamond-website"
LOG_FILE="$BACKUP_DIR/logs/system-backup-$TIMESTAMP.log"

# 创建日志目录
mkdir -p $(dirname $LOG_FILE)

# 日志函数
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

log_message "开始系统配置备份..."

# 创建系统备份目录
SYSTEM_BACKUP_DIR="$BACKUP_DIR/config/system-$TIMESTAMP"
mkdir -p $SYSTEM_BACKUP_DIR

# 备份系统配置
log_message "备份系统配置文件..."
mkdir -p $SYSTEM_BACKUP_DIR/etc
cp -r /etc/nginx $SYSTEM_BACKUP_DIR/etc/ 2>/dev/null || true
cp -r /etc/systemd/system/diamond-website.* $SYSTEM_BACKUP_DIR/etc/ 2>/dev/null || true
cp /etc/firewalld/zones/public.xml $SYSTEM_BACKUP_DIR/etc/ 2>/dev/null || true
cp /etc/fail2ban/jail.local $SYSTEM_BACKUP_DIR/etc/ 2>/dev/null || true

# 备份crontab
log_message "备份定时任务..."
crontab -u diamond -l > $SYSTEM_BACKUP_DIR/diamond-crontab 2>/dev/null || true
crontab -l > $SYSTEM_BACKUP_DIR/root-crontab 2>/dev/null || true

# 备份用户信息
log_message "备份用户信息..."
getent passwd diamond > $SYSTEM_BACKUP_DIR/user-info.txt 2>/dev/null || true

# 备份已安装的包列表
log_message "备份软件包列表..."
dnf list installed > $SYSTEM_BACKUP_DIR/installed-packages.txt

# 创建系统信息文件
cat > $SYSTEM_BACKUP_DIR/system-info.txt << EOL
系统备份时间: $(date)
主机名: $(hostname)
系统版本: $(cat /etc/almalinux-release 2>/dev/null || echo "Unknown")
内核版本: $(uname -r)
网络配置: $(ip addr show | grep inet)
磁盘使用: $(df -h)
内存信息: $(free -h)
EOL

# 压缩系统备份
log_message "压缩系统备份..."
cd $BACKUP_DIR/config
tar -czf "system-$TIMESTAMP.tar.gz" "system-$TIMESTAMP"
rm -rf "system-$TIMESTAMP"

log_message "系统配置备份完成: system-$TIMESTAMP.tar.gz"

# 清理旧的系统备份
find $BACKUP_DIR/config -name "system-*.tar.gz" -mtime +90 -delete

log_message "系统备份任务完成"
EOF

    chmod +x $PROJECT_DIR/scripts/backup/backup-system.sh
    chown diamond:diamond $PROJECT_DIR/scripts/backup/backup-system.sh
    
    log_success "系统备份脚本创建完成"
}

# 创建恢复脚本
create_restore_script() {
    log_info "创建数据恢复脚本..."
    
    cat > $PROJECT_DIR/scripts/backup/restore-data.sh << 'EOF'
#!/bin/bash

# 数据恢复脚本
if [ $# -ne 1 ]; then
    echo "使用方法: $0 <backup-file.tar.gz>"
    echo "示例: $0 backup-20250715_120000.tar.gz"
    exit 1
fi

BACKUP_FILE="$1"
BACKUP_DIR="/backup/diamond-website"
PROJECT_DIR="/opt/diamond-website"
RESTORE_LOG="/tmp/restore-$(date +%Y%m%d_%H%M%S).log"

# 日志函数
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $RESTORE_LOG
}

# 检查备份文件
if [ ! -f "$BACKUP_DIR/daily/$BACKUP_FILE" ]; then
    log_message "错误: 备份文件不存在: $BACKUP_DIR/daily/$BACKUP_FILE"
    exit 1
fi

log_message "开始数据恢复..."
log_message "备份文件: $BACKUP_FILE"

# 验证备份文件完整性
if [ -f "$BACKUP_DIR/daily/$BACKUP_FILE.md5" ]; then
    log_message "验证备份文件完整性..."
    cd $BACKUP_DIR/daily
    if md5sum -c "$BACKUP_FILE.md5"; then
        log_message "备份文件完整性验证通过"
    else
        log_message "错误: 备份文件完整性验证失败"
        exit 1
    fi
fi

# 停止服务
log_message "停止应用服务..."
systemctl stop diamond-website

# 备份当前数据（以防恢复失败）
log_message "备份当前数据..."
CURRENT_BACKUP="/tmp/current-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p $CURRENT_BACKUP
cp -r $PROJECT_DIR/data $CURRENT_BACKUP/ 2>/dev/null || true
cp -r $PROJECT_DIR/uploads $CURRENT_BACKUP/ 2>/dev/null || true

# 解压备份文件
log_message "解压备份文件..."
TEMP_DIR="/tmp/restore-temp-$(date +%Y%m%d_%H%M%S)"
mkdir -p $TEMP_DIR
cd $TEMP_DIR
tar -xzf "$BACKUP_DIR/daily/$BACKUP_FILE"

# 恢复数据
log_message "恢复应用数据..."
BACKUP_EXTRACT_DIR=$(find $TEMP_DIR -name "backup-*" -type d | head -1)

if [ -d "$BACKUP_EXTRACT_DIR/data" ]; then
    rm -rf $PROJECT_DIR/data
    cp -r $BACKUP_EXTRACT_DIR/data $PROJECT_DIR/
    chown -R diamond:diamond $PROJECT_DIR/data
    log_message "数据文件恢复完成"
fi

if [ -d "$BACKUP_EXTRACT_DIR/uploads" ]; then
    rm -rf $PROJECT_DIR/uploads
    cp -r $BACKUP_EXTRACT_DIR/uploads $PROJECT_DIR/
    chown -R diamond:diamond $PROJECT_DIR/uploads
    log_message "上传文件恢复完成"
fi

# 清理临时文件
rm -rf $TEMP_DIR

# 启动服务
log_message "启动应用服务..."
systemctl start diamond-website

# 检查服务状态
if systemctl is-active --quiet diamond-website; then
    log_message "✅ 服务启动成功，数据恢复完成"
    log_message "当前数据备份保存在: $CURRENT_BACKUP"
else
    log_message "❌ 服务启动失败，正在回滚..."
    # 回滚到之前的数据
    rm -rf $PROJECT_DIR/data $PROJECT_DIR/uploads
    cp -r $CURRENT_BACKUP/data $PROJECT_DIR/ 2>/dev/null || true
    cp -r $CURRENT_BACKUP/uploads $PROJECT_DIR/ 2>/dev/null || true
    chown -R diamond:diamond $PROJECT_DIR/data $PROJECT_DIR/uploads
    systemctl start diamond-website
    log_message "已回滚到恢复前状态"
    exit 1
fi

log_message "数据恢复任务完成"
echo "恢复日志: $RESTORE_LOG"
EOF

    chmod +x $PROJECT_DIR/scripts/backup/restore-data.sh
    chown diamond:diamond $PROJECT_DIR/scripts/backup/restore-data.sh
    
    log_success "数据恢复脚本创建完成"
}

# 创建备份管理脚本
create_backup_manager() {
    log_info "创建备份管理脚本..."
    
    cat > $PROJECT_DIR/scripts/backup/backup-manager.sh << 'EOF'
#!/bin/bash

# 备份管理脚本
BACKUP_DIR="/backup/diamond-website"

show_usage() {
    echo "Diamond Website CMS 备份管理工具"
    echo "使用方法: $0 [选项]"
    echo
    echo "选项:"
    echo "  list          列出所有备份文件"
    echo "  create        创建新的备份"
    echo "  restore FILE  恢复指定的备份文件"
    echo "  clean         清理过期的备份文件"
    echo "  info FILE     显示备份文件信息"
    echo "  verify FILE   验证备份文件完整性"
    echo
}

list_backups() {
    echo "=== 可用的备份文件 ==="
    echo
    echo "每日备份:"
    ls -lh $BACKUP_DIR/daily/*.tar.gz 2>/dev/null | awk '{print $9, $5, $6, $7, $8}' || echo "无备份文件"
    echo
    echo "系统配置备份:"
    ls -lh $BACKUP_DIR/config/*.tar.gz 2>/dev/null | awk '{print $9, $5, $6, $7, $8}' || echo "无备份文件"
}

create_backup() {
    echo "创建新备份..."
    /opt/diamond-website/scripts/backup/backup-data.sh
    echo "备份创建完成"
}

restore_backup() {
    if [ -z "$1" ]; then
        echo "错误: 请指定要恢复的备份文件"
        exit 1
    fi
    
    echo "恢复备份: $1"
    /opt/diamond-website/scripts/backup/restore-data.sh "$1"
}

clean_backups() {
    echo "清理过期备份文件..."
    find $BACKUP_DIR/daily -name "backup-*.tar.gz" -mtime +30 -delete
    find $BACKUP_DIR/daily -name "backup-*.tar.gz.md5" -mtime +30 -delete
    find $BACKUP_DIR/config -name "system-*.tar.gz" -mtime +90 -delete
    echo "清理完成"
}

show_backup_info() {
    if [ -z "$1" ]; then
        echo "错误: 请指定备份文件"
        exit 1
    fi
    
    BACKUP_FILE="$BACKUP_DIR/daily/$1"
    if [ ! -f "$BACKUP_FILE" ]; then
        echo "错误: 备份文件不存在: $BACKUP_FILE"
        exit 1
    fi
    
    echo "=== 备份文件信息 ==="
    echo "文件: $1"
    echo "大小: $(du -sh $BACKUP_FILE | cut -f1)"
    echo "创建时间: $(stat -c %y $BACKUP_FILE)"
    echo
    
    # 显示备份内容
    echo "=== 备份内容 ==="
    tar -tzf "$BACKUP_FILE" | head -20
    if [ $(tar -tzf "$BACKUP_FILE" | wc -l) -gt 20 ]; then
        echo "... (还有更多文件)"
    fi
}

verify_backup() {
    if [ -z "$1" ]; then
        echo "错误: 请指定备份文件"
        exit 1
    fi
    
    BACKUP_FILE="$BACKUP_DIR/daily/$1"
    MD5_FILE="$BACKUP_FILE.md5"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        echo "错误: 备份文件不存在: $BACKUP_FILE"
        exit 1
    fi
    
    if [ -f "$MD5_FILE" ]; then
        echo "验证备份文件完整性..."
        cd $BACKUP_DIR/daily
        if md5sum -c "$1.md5"; then
            echo "✅ 备份文件完整性验证通过"
        else
            echo "❌ 备份文件完整性验证失败"
            exit 1
        fi
    else
        echo "⚠️  未找到MD5校验文件，无法验证完整性"
    fi
}

# 主逻辑
case "$1" in
    list)
        list_backups
        ;;
    create)
        create_backup
        ;;
    restore)
        restore_backup "$2"
        ;;
    clean)
        clean_backups
        ;;
    info)
        show_backup_info "$2"
        ;;
    verify)
        verify_backup "$2"
        ;;
    *)
        show_usage
        exit 1
        ;;
esac
EOF

    chmod +x $PROJECT_DIR/scripts/backup/backup-manager.sh
    chown diamond:diamond $PROJECT_DIR/scripts/backup/backup-manager.sh
    
    log_success "备份管理脚本创建完成"
}

# 设置定时备份任务
setup_backup_cron() {
    log_info "设置定时备份任务..."
    
    # 为diamond用户添加备份任务
    sudo -u diamond crontab -l 2>/dev/null > /tmp/diamond_backup_cron || true
    
    # 添加备份任务
    cat >> /tmp/diamond_backup_cron << EOF
# Diamond Website CMS备份任务
0 2 * * * /opt/diamond-website/scripts/backup/backup-data.sh
0 3 * * 0 /opt/diamond-website/scripts/backup/backup-system.sh
0 4 * * * /opt/diamond-website/scripts/backup/backup-manager.sh clean
EOF

    # 安装crontab
    sudo -u diamond crontab /tmp/diamond_backup_cron
    rm /tmp/diamond_backup_cron
    
    log_success "定时备份任务设置完成"
}

# 显示备份配置信息
show_backup_info() {
    echo
    echo "💾 备份系统配置完成！"
    echo "================================================"
    echo "✅ 数据备份: 每日凌晨2点自动执行"
    echo "✅ 系统备份: 每周日凌晨3点自动执行"
    echo "✅ 清理任务: 每日凌晨4点清理过期备份"
    echo "✅ 备份保留: 数据备份30天，系统备份90天"
    echo
    echo "📁 备份文件位置:"
    echo "   数据备份: $BACKUP_DIR/daily/"
    echo "   系统备份: $BACKUP_DIR/config/"
    echo "   备份日志: $BACKUP_DIR/logs/"
    echo
    echo "🔧 备份管理命令:"
    echo "   备份管理器: $PROJECT_DIR/scripts/backup/backup-manager.sh"
    echo "   列出备份: $PROJECT_DIR/scripts/backup/backup-manager.sh list"
    echo "   创建备份: $PROJECT_DIR/scripts/backup/backup-manager.sh create"
    echo "   恢复数据: $PROJECT_DIR/scripts/backup/backup-manager.sh restore <file>"
    echo "   清理备份: $PROJECT_DIR/scripts/backup/backup-manager.sh clean"
    echo
    echo "📋 备份内容:"
    echo "   • 应用数据文件 (data/)"
    echo "   • 上传文件 (uploads/)"
    echo "   • 配置文件 (package.json, server.js)"
    echo "   • 系统配置 (nginx, systemd, firewall)"
    echo "   • 应用日志 (最近7天)"
    echo
    echo "🔄 恢复流程:"
    echo "   1. 停止应用服务"
    echo "   2. 备份当前数据"
    echo "   3. 恢复指定备份"
    echo "   4. 重启应用服务"
    echo "   5. 验证服务状态"
    echo
    echo "⚠️  重要提醒:"
    echo "   1. 定期测试备份恢复流程"
    echo "   2. 考虑配置远程备份存储"
    echo "   3. 监控备份任务执行状态"
    echo "   4. 保护备份文件访问权限"
    echo "================================================"
}

# 主函数
main() {
    echo "💾 开始配置备份和恢复系统..."
    echo "================================================"
    
    check_root
    create_backup_structure
    create_data_backup_script
    create_system_backup_script
    create_restore_script
    create_backup_manager
    setup_backup_cron
    show_backup_info
}

# 执行主函数
main "$@"
