#!/bin/bash

# 🖥️ 钻石网站服务器资源监控脚本
# 实时监控CPU、内存、磁盘、网络等关键指标
# 适用于200-300产品规模的性能监控

# 配置变量
APP_NAME="diamond-website"
LOG_DIR="/var/log/diamond-monitor"
ALERT_EMAIL="admin@your-domain.com"
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=80
ALERT_THRESHOLD_DISK=85
ALERT_THRESHOLD_LOAD=2.0

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 创建日志目录
mkdir -p $LOG_DIR

# 获取当前时间戳
get_timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# 日志函数
log_info() {
    echo -e "${GREEN}[$(get_timestamp)]${NC} $1" | tee -a $LOG_DIR/monitor.log
}

log_warn() {
    echo -e "${YELLOW}[$(get_timestamp)]${NC} $1" | tee -a $LOG_DIR/monitor.log
}

log_error() {
    echo -e "${RED}[$(get_timestamp)]${NC} $1" | tee -a $LOG_DIR/monitor.log
}

# 发送告警邮件
send_alert() {
    local subject="$1"
    local message="$2"
    
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "$subject" $ALERT_EMAIL
    fi
    
    log_error "ALERT: $subject - $message"
}

# 检查CPU使用率
check_cpu() {
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    local cpu_percent=$(echo $cpu_usage | cut -d'%' -f1)
    
    echo "CPU使用率: ${cpu_percent}%"
    
    if (( $(echo "$cpu_percent > $ALERT_THRESHOLD_CPU" | bc -l) )); then
        send_alert "CPU使用率过高" "当前CPU使用率: ${cpu_percent}%，超过阈值 ${ALERT_THRESHOLD_CPU}%"
    fi
    
    # 记录到日志
    echo "$(get_timestamp),CPU,$cpu_percent" >> $LOG_DIR/cpu.log
}

# 检查内存使用率
check_memory() {
    local mem_info=$(free | awk 'NR==2{printf "%.2f %.2f %.2f", $3*100/$2, $3/1024/1024, $2/1024/1024}')
    local mem_percent=$(echo $mem_info | awk '{print $1}')
    local mem_used=$(echo $mem_info | awk '{print $2}')
    local mem_total=$(echo $mem_info | awk '{print $3}')
    
    echo "内存使用率: ${mem_percent}% (${mem_used}GB/${mem_total}GB)"
    
    if (( $(echo "$mem_percent > $ALERT_THRESHOLD_MEMORY" | bc -l) )); then
        send_alert "内存使用率过高" "当前内存使用率: ${mem_percent}%，超过阈值 ${ALERT_THRESHOLD_MEMORY}%"
    fi
    
    # 记录到日志
    echo "$(get_timestamp),MEMORY,$mem_percent,$mem_used,$mem_total" >> $LOG_DIR/memory.log
}

# 检查磁盘使用率
check_disk() {
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    local disk_used=$(df -h / | awk 'NR==2 {print $3}')
    local disk_total=$(df -h / | awk 'NR==2 {print $2}')
    
    echo "磁盘使用率: ${disk_usage}% (${disk_used}/${disk_total})"
    
    if [ $disk_usage -gt $ALERT_THRESHOLD_DISK ]; then
        send_alert "磁盘空间不足" "当前磁盘使用率: ${disk_usage}%，超过阈值 ${ALERT_THRESHOLD_DISK}%"
    fi
    
    # 记录到日志
    echo "$(get_timestamp),DISK,$disk_usage,$disk_used,$disk_total" >> $LOG_DIR/disk.log
}

# 检查系统负载
check_load() {
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    
    echo "系统负载: $load_avg"
    
    if (( $(echo "$load_avg > $ALERT_THRESHOLD_LOAD" | bc -l) )); then
        send_alert "系统负载过高" "当前系统负载: $load_avg，超过阈值 $ALERT_THRESHOLD_LOAD"
    fi
    
    # 记录到日志
    echo "$(get_timestamp),LOAD,$load_avg" >> $LOG_DIR/load.log
}

# 检查网络连接
check_network() {
    local connections=$(netstat -an | grep :80 | wc -l)
    local established=$(netstat -an | grep :80 | grep ESTABLISHED | wc -l)
    
    echo "网络连接: 总连接数 $connections, 已建立 $established"
    
    # 记录到日志
    echo "$(get_timestamp),NETWORK,$connections,$established" >> $LOG_DIR/network.log
}

# 检查应用进程
check_application() {
    if pm2 list | grep -q "$APP_NAME.*online"; then
        local app_status="运行中"
        local app_memory=$(pm2 show $APP_NAME | grep "memory usage" | awk '{print $4}')
        local app_cpu=$(pm2 show $APP_NAME | grep "cpu usage" | awk '{print $4}')
        
        echo "应用状态: $app_status (内存: $app_memory, CPU: $app_cpu)"
        
        # 记录到日志
        echo "$(get_timestamp),APP,online,$app_memory,$app_cpu" >> $LOG_DIR/app.log
    else
        send_alert "应用进程异常" "$APP_NAME 进程未运行，尝试自动重启"
        pm2 restart $APP_NAME
        
        # 记录到日志
        echo "$(get_timestamp),APP,offline,0,0" >> $LOG_DIR/app.log
    fi
}

# 检查Nginx状态
check_nginx() {
    if systemctl is-active --quiet nginx; then
        echo "Nginx状态: 运行中"
        
        # 检查Nginx访问日志
        local access_count=$(tail -n 100 /var/log/nginx/diamond-website-access.log 2>/dev/null | wc -l)
        echo "最近100条访问记录: $access_count"
        
        # 记录到日志
        echo "$(get_timestamp),NGINX,active,$access_count" >> $LOG_DIR/nginx.log
    else
        send_alert "Nginx服务异常" "Nginx服务未运行，尝试自动重启"
        systemctl restart nginx
        
        # 记录到日志
        echo "$(get_timestamp),NGINX,inactive,0" >> $LOG_DIR/nginx.log
    fi
}

# 检查SSL证书
check_ssl() {
    local domain="your-domain.com"
    local cert_file="/etc/letsencrypt/live/$domain/fullchain.pem"
    
    if [ -f "$cert_file" ]; then
        local expiry_date=$(openssl x509 -enddate -noout -in "$cert_file" | cut -d= -f2)
        local expiry_timestamp=$(date -d "$expiry_date" +%s)
        local current_timestamp=$(date +%s)
        local days_left=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        echo "SSL证书: 还有 $days_left 天过期"
        
        if [ $days_left -lt 30 ]; then
            send_alert "SSL证书即将过期" "SSL证书将在 $days_left 天后过期，请及时续期"
        fi
        
        # 记录到日志
        echo "$(get_timestamp),SSL,$days_left" >> $LOG_DIR/ssl.log
    else
        echo "SSL证书: 未找到证书文件"
        echo "$(get_timestamp),SSL,not_found" >> $LOG_DIR/ssl.log
    fi
}

# 生成性能报告
generate_report() {
    local report_file="$LOG_DIR/performance_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > $report_file << EOF
# 钻石网站性能监控报告
生成时间: $(get_timestamp)

## 系统资源使用情况
$(check_cpu)
$(check_memory)
$(check_disk)
$(check_load)

## 网络和应用状态
$(check_network)
$(check_application)
$(check_nginx)

## 安全状态
$(check_ssl)

## 最近24小时趋势
CPU平均使用率: $(tail -n 1440 $LOG_DIR/cpu.log 2>/dev/null | awk -F',' '{sum+=$3; count++} END {if(count>0) printf "%.2f%%", sum/count; else print "无数据"}')
内存平均使用率: $(tail -n 1440 $LOG_DIR/memory.log 2>/dev/null | awk -F',' '{sum+=$3; count++} END {if(count>0) printf "%.2f%%", sum/count; else print "无数据"}')
磁盘使用率: $(tail -n 1 $LOG_DIR/disk.log 2>/dev/null | awk -F',' '{print $3"%"}' || echo "无数据")

## 建议
EOF

    # 添加性能建议
    local cpu_avg=$(tail -n 1440 $LOG_DIR/cpu.log 2>/dev/null | awk -F',' '{sum+=$3; count++} END {if(count>0) print sum/count; else print 0}')
    local mem_avg=$(tail -n 1440 $LOG_DIR/memory.log 2>/dev/null | awk -F',' '{sum+=$3; count++} END {if(count>0) print sum/count; else print 0}')
    
    if (( $(echo "$cpu_avg > 60" | bc -l) )); then
        echo "- CPU使用率较高，建议考虑升级CPU或优化应用代码" >> $report_file
    fi
    
    if (( $(echo "$mem_avg > 60" | bc -l) )); then
        echo "- 内存使用率较高，建议增加内存或优化缓存策略" >> $report_file
    fi
    
    echo "性能报告已生成: $report_file"
}

# 清理旧日志
cleanup_logs() {
    # 保留30天的日志
    find $LOG_DIR -name "*.log" -mtime +30 -delete
    find $LOG_DIR -name "performance_report_*.txt" -mtime +7 -delete
    
    echo "日志清理完成"
}

# 主监控函数
main_monitor() {
    echo "=========================================="
    echo "钻石网站服务器监控 - $(get_timestamp)"
    echo "=========================================="
    
    check_cpu
    check_memory
    check_disk
    check_load
    check_network
    check_application
    check_nginx
    check_ssl
    
    echo "=========================================="
    echo "监控完成"
    echo "=========================================="
}

# 显示帮助信息
show_help() {
    echo "钻石网站服务器监控脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  monitor     执行完整监控检查"
    echo "  report      生成性能报告"
    echo "  cleanup     清理旧日志文件"
    echo "  help        显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 monitor    # 执行监控"
    echo "  $0 report     # 生成报告"
    echo "  $0 cleanup    # 清理日志"
}

# 主程序
case "${1:-monitor}" in
    "monitor")
        main_monitor
        ;;
    "report")
        generate_report
        ;;
    "cleanup")
        cleanup_logs
        ;;
    "help")
        show_help
        ;;
    *)
        echo "未知选项: $1"
        show_help
        exit 1
        ;;
esac
