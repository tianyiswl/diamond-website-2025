#!/bin/bash

# 📊 Diamond Website CMS - 监控和日志配置脚本
# 设置性能监控、日志管理和报警机制

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量
PROJECT_DIR="/opt/diamond-website"
LOG_DIR="/var/log/diamond-website"
MONITOR_DIR="$PROJECT_DIR/monitoring"

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

# 创建监控目录结构
create_monitoring_structure() {
    log_info "创建监控目录结构..."
    
    mkdir -p $MONITOR_DIR/{scripts,logs,alerts,reports}
    mkdir -p $LOG_DIR/{app,nginx,system,security}
    
    chown -R diamond:diamond $MONITOR_DIR
    chown -R diamond:diamond $LOG_DIR
    
    log_success "监控目录结构创建完成"
}

# 安装监控工具
install_monitoring_tools() {
    log_info "安装监控工具..."
    
    dnf install -y \
        htop \
        iotop \
        nethogs \
        nload \
        sysstat \
        lsof \
        strace \
        tcpdump \
        mailx \
        cronie
    
    # 启用sysstat服务
    systemctl enable sysstat
    systemctl start sysstat
    
    log_success "监控工具安装完成"
}

# 创建系统监控脚本
create_system_monitor() {
    log_info "创建系统监控脚本..."
    
    cat > $MONITOR_DIR/scripts/system-monitor.sh << 'EOF'
#!/bin/bash

# 系统监控脚本
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE="/var/log/diamond-website/system/system-monitor.log"
ALERT_FILE="/var/log/diamond-website/alerts/system-alerts.log"

# 创建日志目录
mkdir -p $(dirname $LOG_FILE)
mkdir -p $(dirname $ALERT_FILE)

# 获取系统信息
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
DISK_USAGE=$(df / | awk 'NR==2{print $5}' | sed 's/%//')
LOAD_AVERAGE=$(uptime | awk -F'load average:' '{print $2}')

# 记录系统状态
echo "$TIMESTAMP - CPU: ${CPU_USAGE}%, Memory: ${MEMORY_USAGE}%, Disk: ${DISK_USAGE}%, Load: $LOAD_AVERAGE" >> $LOG_FILE

# 检查阈值并发送警报
if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
    echo "$TIMESTAMP - ALERT: High CPU usage: ${CPU_USAGE}%" >> $ALERT_FILE
fi

if (( $(echo "$MEMORY_USAGE > 85" | bc -l) )); then
    echo "$TIMESTAMP - ALERT: High memory usage: ${MEMORY_USAGE}%" >> $ALERT_FILE
fi

if [ $DISK_USAGE -gt 85 ]; then
    echo "$TIMESTAMP - ALERT: High disk usage: ${DISK_USAGE}%" >> $ALERT_FILE
fi

# 检查服务状态
if ! systemctl is-active --quiet diamond-website; then
    echo "$TIMESTAMP - ALERT: Diamond Website service is down" >> $ALERT_FILE
fi

if ! systemctl is-active --quiet nginx; then
    echo "$TIMESTAMP - ALERT: Nginx service is down" >> $ALERT_FILE
fi
EOF

    chmod +x $MONITOR_DIR/scripts/system-monitor.sh
    chown diamond:diamond $MONITOR_DIR/scripts/system-monitor.sh
    
    log_success "系统监控脚本创建完成"
}

# 创建应用监控脚本
create_app_monitor() {
    log_info "创建应用监控脚本..."
    
    cat > $MONITOR_DIR/scripts/app-monitor.sh << 'EOF'
#!/bin/bash

# 应用监控脚本
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE="/var/log/diamond-website/app/app-monitor.log"
ALERT_FILE="/var/log/diamond-website/alerts/app-alerts.log"

# 创建日志目录
mkdir -p $(dirname $LOG_FILE)
mkdir -p $(dirname $ALERT_FILE)

# 检查应用响应
APP_PORT=3000
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:$APP_PORT/ || echo "999")

# 检查进程状态
PID=$(pgrep -f "node server.js" | head -1)
if [ -n "$PID" ]; then
    CPU_USAGE=$(ps -p $PID -o %cpu --no-headers | tr -d ' ')
    MEMORY_USAGE=$(ps -p $PID -o %mem --no-headers | tr -d ' ')
    MEMORY_RSS=$(ps -p $PID -o rss --no-headers | tr -d ' ')
    
    echo "$TIMESTAMP - PID: $PID, CPU: ${CPU_USAGE}%, Memory: ${MEMORY_USAGE}%, RSS: ${MEMORY_RSS}KB, Response: ${RESPONSE_TIME}s" >> $LOG_FILE
    
    # 检查响应时间
    if (( $(echo "$RESPONSE_TIME > 5" | bc -l) )); then
        echo "$TIMESTAMP - ALERT: Slow response time: ${RESPONSE_TIME}s" >> $ALERT_FILE
    fi
    
    # 检查内存使用
    if (( $(echo "$MEMORY_USAGE > 50" | bc -l) )); then
        echo "$TIMESTAMP - ALERT: High app memory usage: ${MEMORY_USAGE}%" >> $ALERT_FILE
    fi
else
    echo "$TIMESTAMP - ALERT: Application process not found" >> $ALERT_FILE
fi

# 检查端口监听
if ! netstat -tuln | grep ":$APP_PORT " > /dev/null; then
    echo "$TIMESTAMP - ALERT: Application not listening on port $APP_PORT" >> $ALERT_FILE
fi
EOF

    chmod +x $MONITOR_DIR/scripts/app-monitor.sh
    chown diamond:diamond $MONITOR_DIR/scripts/app-monitor.sh
    
    log_success "应用监控脚本创建完成"
}

# 创建日志分析脚本
create_log_analyzer() {
    log_info "创建日志分析脚本..."
    
    cat > $MONITOR_DIR/scripts/log-analyzer.sh << 'EOF'
#!/bin/bash

# 日志分析脚本
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
REPORT_FILE="/var/log/diamond-website/reports/daily-report-$(date +%Y%m%d).log"

# 创建报告目录
mkdir -p $(dirname $REPORT_FILE)

echo "=== Diamond Website CMS Daily Report - $(date) ===" > $REPORT_FILE
echo >> $REPORT_FILE

# Nginx访问统计
if [ -f /var/log/nginx/diamond-website-access.log ]; then
    echo "=== Nginx Access Statistics ===" >> $REPORT_FILE
    echo "Total requests today: $(grep "$(date +%d/%b/%Y)" /var/log/nginx/diamond-website-access.log | wc -l)" >> $REPORT_FILE
    echo "Top 10 IP addresses:" >> $REPORT_FILE
    grep "$(date +%d/%b/%Y)" /var/log/nginx/diamond-website-access.log | awk '{print $1}' | sort | uniq -c | sort -nr | head -10 >> $REPORT_FILE
    echo >> $REPORT_FILE
fi

# 错误日志统计
if [ -f /var/log/nginx/diamond-website-error.log ]; then
    echo "=== Error Statistics ===" >> $REPORT_FILE
    echo "Nginx errors today: $(grep "$(date +%Y/%m/%d)" /var/log/nginx/diamond-website-error.log | wc -l)" >> $REPORT_FILE
    echo >> $REPORT_FILE
fi

# 系统资源统计
echo "=== System Resource Usage ===" >> $REPORT_FILE
echo "Average CPU usage: $(sar -u 1 1 | tail -1 | awk '{print 100-$8}')%" >> $REPORT_FILE
echo "Current memory usage: $(free | awk 'NR==2{printf "%.1f%%", $3*100/$2}')" >> $REPORT_FILE
echo "Current disk usage: $(df / | awk 'NR==2{print $5}')" >> $REPORT_FILE
echo >> $REPORT_FILE

# 应用状态
echo "=== Application Status ===" >> $REPORT_FILE
if systemctl is-active --quiet diamond-website; then
    echo "Diamond Website: Running" >> $REPORT_FILE
else
    echo "Diamond Website: Stopped" >> $REPORT_FILE
fi

if systemctl is-active --quiet nginx; then
    echo "Nginx: Running" >> $REPORT_FILE
else
    echo "Nginx: Stopped" >> $REPORT_FILE
fi
echo >> $REPORT_FILE

# 安全事件
echo "=== Security Events ===" >> $REPORT_FILE
if [ -f /var/log/diamond-website/security/security-monitor.log ]; then
    echo "Security alerts today: $(grep "$(date +%Y-%m-%d)" /var/log/diamond-website/security/security-monitor.log | wc -l)" >> $REPORT_FILE
fi

echo "=== End of Report ===" >> $REPORT_FILE
EOF

    chmod +x $MONITOR_DIR/scripts/log-analyzer.sh
    chown diamond:diamond $MONITOR_DIR/scripts/log-analyzer.sh
    
    log_success "日志分析脚本创建完成"
}

# 配置日志轮转
configure_log_rotation() {
    log_info "配置日志轮转..."
    
    cat > /etc/logrotate.d/diamond-website-monitoring << EOF
/var/log/diamond-website/*/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 diamond diamond
    sharedscripts
    postrotate
        systemctl reload diamond-website 2>/dev/null || true
    endscript
}

/var/log/diamond-website/reports/*.log {
    weekly
    missingok
    rotate 12
    compress
    delaycompress
    notifempty
    create 644 diamond diamond
}
EOF

    log_success "日志轮转配置完成"
}

# 创建报警脚本
create_alert_system() {
    log_info "创建报警系统..."
    
    cat > $MONITOR_DIR/scripts/alert-handler.sh << 'EOF'
#!/bin/bash

# 报警处理脚本
ALERT_LOG="/var/log/diamond-website/alerts"
EMAIL="admin@your-domain.com"  # 请修改为实际邮箱

# 检查是否有新的警报
for alert_file in $ALERT_LOG/*.log; do
    if [ -f "$alert_file" ]; then
        # 检查最近5分钟的警报
        recent_alerts=$(find "$alert_file" -mmin -5 -exec grep "$(date '+%Y-%m-%d %H:%M')" {} \; 2>/dev/null)
        
        if [ -n "$recent_alerts" ]; then
            # 发送邮件警报（需要配置邮件服务）
            echo "Diamond Website CMS Alert - $(date)" | mail -s "System Alert" $EMAIL 2>/dev/null || true
            
            # 记录警报处理
            echo "$(date) - Alert processed and notification sent" >> /var/log/diamond-website/alerts/alert-handler.log
        fi
    fi
done
EOF

    chmod +x $MONITOR_DIR/scripts/alert-handler.sh
    chown diamond:diamond $MONITOR_DIR/scripts/alert-handler.sh
    
    log_success "报警系统创建完成"
}

# 设置定时任务
setup_cron_jobs() {
    log_info "设置定时任务..."
    
    # 为diamond用户设置crontab
    sudo -u diamond crontab -l 2>/dev/null > /tmp/diamond_cron || true
    
    # 添加监控任务
    cat >> /tmp/diamond_cron << EOF
# Diamond Website CMS监控任务
*/5 * * * * $MONITOR_DIR/scripts/system-monitor.sh
*/2 * * * * $MONITOR_DIR/scripts/app-monitor.sh
*/10 * * * * $MONITOR_DIR/scripts/alert-handler.sh
0 1 * * * $MONITOR_DIR/scripts/log-analyzer.sh
EOF

    # 安装crontab
    sudo -u diamond crontab /tmp/diamond_cron
    rm /tmp/diamond_cron
    
    log_success "定时任务设置完成"
}

# 创建监控仪表板
create_dashboard() {
    log_info "创建监控仪表板..."
    
    cat > $MONITOR_DIR/scripts/dashboard.sh << 'EOF'
#!/bin/bash

# 简单的监控仪表板
clear
echo "=========================================="
echo "  Diamond Website CMS - 监控仪表板"
echo "=========================================="
echo

# 系统信息
echo "🖥️  系统状态:"
echo "   CPU使用率: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')%"
echo "   内存使用率: $(free | awk 'NR==2{printf "%.1f%%", $3*100/$2}')"
echo "   磁盘使用率: $(df / | awk 'NR==2{print $5}')"
echo "   系统负载: $(uptime | awk -F'load average:' '{print $2}')"
echo

# 服务状态
echo "🔧 服务状态:"
if systemctl is-active --quiet diamond-website; then
    echo "   ✅ Diamond Website: 运行中"
else
    echo "   ❌ Diamond Website: 已停止"
fi

if systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx: 运行中"
else
    echo "   ❌ Nginx: 已停止"
fi
echo

# 网络连接
echo "🌐 网络连接:"
echo "   端口3000: $(netstat -tuln | grep ":3000 " > /dev/null && echo "监听中" || echo "未监听")"
echo "   端口80: $(netstat -tuln | grep ":80 " > /dev/null && echo "监听中" || echo "未监听")"
echo "   端口443: $(netstat -tuln | grep ":443 " > /dev/null && echo "监听中" || echo "未监听")"
echo

# 最近的警报
echo "⚠️  最近警报:"
if [ -f /var/log/diamond-website/alerts/system-alerts.log ]; then
    tail -5 /var/log/diamond-website/alerts/system-alerts.log 2>/dev/null || echo "   无警报"
else
    echo "   无警报"
fi

echo "=========================================="
echo "刷新时间: $(date)"
echo "按Ctrl+C退出"
EOF

    chmod +x $MONITOR_DIR/scripts/dashboard.sh
    chown diamond:diamond $MONITOR_DIR/scripts/dashboard.sh
    
    log_success "监控仪表板创建完成"
}

# 显示监控配置信息
show_monitoring_info() {
    echo
    echo "📊 监控系统配置完成！"
    echo "================================================"
    echo "✅ 系统监控: 每5分钟检查一次"
    echo "✅ 应用监控: 每2分钟检查一次"
    echo "✅ 日志分析: 每日生成报告"
    echo "✅ 报警系统: 每10分钟检查警报"
    echo "✅ 日志轮转: 自动管理日志文件"
    echo
    echo "📁 监控文件位置:"
    echo "   监控脚本: $MONITOR_DIR/scripts/"
    echo "   系统日志: $LOG_DIR/system/"
    echo "   应用日志: $LOG_DIR/app/"
    echo "   警报日志: $LOG_DIR/alerts/"
    echo "   分析报告: $LOG_DIR/reports/"
    echo
    echo "🔧 监控管理命令:"
    echo "   查看仪表板: $MONITOR_DIR/scripts/dashboard.sh"
    echo "   手动系统检查: $MONITOR_DIR/scripts/system-monitor.sh"
    echo "   手动应用检查: $MONITOR_DIR/scripts/app-monitor.sh"
    echo "   生成日报: $MONITOR_DIR/scripts/log-analyzer.sh"
    echo "   查看警报: tail -f $LOG_DIR/alerts/system-alerts.log"
    echo
    echo "📈 监控数据查看:"
    echo "   系统性能: sar -u 1 10"
    echo "   内存使用: free -h"
    echo "   磁盘IO: iotop"
    echo "   网络流量: nload"
    echo "   进程监控: htop"
    echo "================================================"
}

# 主函数
main() {
    echo "📊 开始配置监控和日志系统..."
    echo "================================================"
    
    check_root
    create_monitoring_structure
    install_monitoring_tools
    create_system_monitor
    create_app_monitor
    create_log_analyzer
    configure_log_rotation
    create_alert_system
    setup_cron_jobs
    create_dashboard
    show_monitoring_info
}

# 执行主函数
main "$@"
