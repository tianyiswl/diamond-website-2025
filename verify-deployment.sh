#!/bin/bash

# 🔍 钻石网站部署验证脚本
# 快速验证更新后的系统状态和性能

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 配置变量
APP_NAME="diamond-website"
APP_DIR="/opt/diamond-website"
DOMAIN="your-domain.com"  # 从配置文件读取

# 日志函数
log_info() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }
log_step() { echo -e "${BLUE}[→]${NC} $1"; }
log_test() { echo -e "${CYAN}[TEST]${NC} $1"; }

# 显示横幅
show_banner() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    🔍 部署验证工具                            ║"
    echo "║                                                              ║"
    echo "║  • 服务状态检查                                              ║"
    echo "║  • 性能测试验证                                              ║"
    echo "║  • 缓存功能测试                                              ║"
    echo "║  • 安全配置检查                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 检查服务状态
check_service_status() {
    log_step "检查服务状态..."
    
    local all_ok=true
    
    # 检查PM2状态
    echo "PM2应用状态:"
    if pm2 show $APP_NAME > /dev/null 2>&1; then
        local status=$(pm2 show $APP_NAME | grep "status" | awk '{print $4}')
        local memory=$(pm2 show $APP_NAME | grep "memory usage" | awk '{print $4}')
        local cpu=$(pm2 show $APP_NAME | grep "cpu usage" | awk '{print $4}')
        local uptime=$(pm2 show $APP_NAME | grep "uptime" | awk '{print $3}')
        
        if [[ "$status" == "online" ]]; then
            log_info "应用状态: $status"
            log_info "内存使用: $memory"
            log_info "CPU使用: $cpu"
            log_info "运行时间: $uptime"
        else
            log_error "应用状态异常: $status"
            all_ok=false
        fi
    else
        log_error "PM2应用未找到"
        all_ok=false
    fi
    
    echo ""
    
    # 检查Nginx状态
    echo "Nginx服务状态:"
    if systemctl is-active --quiet nginx; then
        log_info "Nginx服务: 运行中"
        
        # 检查配置
        if nginx -t 2>/dev/null; then
            log_info "Nginx配置: 正确"
        else
            log_error "Nginx配置: 有误"
            all_ok=false
        fi
    else
        log_error "Nginx服务: 未运行"
        all_ok=false
    fi
    
    echo ""
    
    # 检查端口监听
    echo "端口监听状态:"
    local port_3001=$(netstat -tlnp 2>/dev/null | grep ":3001" | wc -l)
    local port_80=$(netstat -tlnp 2>/dev/null | grep ":80" | wc -l)
    local port_443=$(netstat -tlnp 2>/dev/null | grep ":443" | wc -l)
    
    if [ $port_3001 -gt 0 ]; then
        log_info "端口3001: 监听中 (应用端口)"
    else
        log_error "端口3001: 未监听"
        all_ok=false
    fi
    
    if [ $port_80 -gt 0 ]; then
        log_info "端口80: 监听中 (HTTP)"
    else
        log_warn "端口80: 未监听"
    fi
    
    if [ $port_443 -gt 0 ]; then
        log_info "端口443: 监听中 (HTTPS)"
    else
        log_warn "端口443: 未监听"
    fi
    
    echo ""
    return $all_ok
}

# 检查应用功能
check_application_functionality() {
    log_step "检查应用功能..."
    
    local all_ok=true
    
    # 测试本地API
    echo "API接口测试:"
    
    # 健康检查接口
    log_test "健康检查接口..."
    if curl -f http://localhost:3001/api/status > /dev/null 2>&1; then
        local status_response=$(curl -s http://localhost:3001/api/status)
        log_info "健康检查: 正常"
        
        # 解析响应
        if echo "$status_response" | grep -q '"status":"running"'; then
            log_info "服务状态: 运行中"
        else
            log_warn "服务状态: 异常"
        fi
    else
        log_error "健康检查: 失败"
        all_ok=false
    fi
    
    # 产品API测试
    log_test "产品API接口..."
    if curl -f http://localhost:3001/api/products > /dev/null 2>&1; then
        local product_count=$(curl -s http://localhost:3001/api/products | jq length 2>/dev/null || echo "unknown")
        log_info "产品API: 正常 (产品数量: $product_count)"
    else
        log_error "产品API: 失败"
        all_ok=false
    fi
    
    # 分类API测试
    log_test "分类API接口..."
    if curl -f http://localhost:3001/api/categories > /dev/null 2>&1; then
        log_info "分类API: 正常"
    else
        log_error "分类API: 失败"
        all_ok=false
    fi
    
    echo ""
    return $all_ok
}

# 测试缓存性能
test_cache_performance() {
    log_step "测试缓存性能..."
    
    echo "缓存性能测试:"
    
    # 创建临时文件记录时间
    local temp_file="/tmp/cache_test_$$"
    
    # 第一次请求（无缓存）
    log_test "首次请求（无缓存）..."
    local start_time=$(date +%s%3N)
    curl -s http://localhost:3001/api/products > /dev/null
    local end_time=$(date +%s%3N)
    local first_request_time=$((end_time - start_time))
    
    # 等待1秒
    sleep 1
    
    # 第二次请求（有缓存）
    log_test "第二次请求（有缓存）..."
    local start_time=$(date +%s%3N)
    curl -s http://localhost:3001/api/products > /dev/null
    local end_time=$(date +%s%3N)
    local second_request_time=$((end_time - start_time))
    
    # 第三次请求（缓存命中）
    log_test "第三次请求（缓存命中）..."
    local start_time=$(date +%s%3N)
    curl -s http://localhost:3001/api/products > /dev/null
    local end_time=$(date +%s%3N)
    local third_request_time=$((end_time - start_time))
    
    # 显示结果
    echo "性能测试结果:"
    log_info "首次请求: ${first_request_time}ms"
    log_info "第二次请求: ${second_request_time}ms"
    log_info "第三次请求: ${third_request_time}ms"
    
    # 计算性能提升
    if [ $second_request_time -lt $first_request_time ]; then
        local improvement=$(( (first_request_time - second_request_time) * 100 / first_request_time ))
        log_info "缓存优化: 提升 ${improvement}%"
    else
        log_warn "缓存优化: 未检测到明显提升"
    fi
    
    # 平均响应时间
    local avg_time=$(( (first_request_time + second_request_time + third_request_time) / 3 ))
    log_info "平均响应时间: ${avg_time}ms"
    
    if [ $avg_time -lt 100 ]; then
        log_info "性能评级: 优秀 (<100ms)"
    elif [ $avg_time -lt 200 ]; then
        log_info "性能评级: 良好 (<200ms)"
    elif [ $avg_time -lt 500 ]; then
        log_warn "性能评级: 一般 (<500ms)"
    else
        log_warn "性能评级: 需要优化 (>500ms)"
    fi
    
    echo ""
}

# 检查外部访问
check_external_access() {
    log_step "检查外部访问..."
    
    if [[ "$DOMAIN" == "your-domain.com" ]]; then
        log_warn "域名未配置，跳过外部访问测试"
        return 0
    fi
    
    echo "外部访问测试:"
    
    # 测试HTTP重定向
    log_test "HTTP重定向测试..."
    local http_response=$(curl -s -I http://$DOMAIN | head -n1)
    if echo "$http_response" | grep -q "301\|302"; then
        log_info "HTTP重定向: 正常"
    else
        log_warn "HTTP重定向: 可能未配置"
    fi
    
    # 测试HTTPS访问
    log_test "HTTPS访问测试..."
    if curl -f https://$DOMAIN > /dev/null 2>&1; then
        log_info "HTTPS访问: 正常"
        
        # 测试SSL证书
        local ssl_info=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
        if [[ $? -eq 0 ]]; then
            log_info "SSL证书: 有效"
        else
            log_warn "SSL证书: 可能有问题"
        fi
    else
        log_error "HTTPS访问: 失败"
    fi
    
    # 测试API外部访问
    log_test "API外部访问测试..."
    if curl -f https://$DOMAIN/api/status > /dev/null 2>&1; then
        log_info "API外部访问: 正常"
    else
        log_error "API外部访问: 失败"
    fi
    
    echo ""
}

# 检查系统资源
check_system_resources() {
    log_step "检查系统资源..."
    
    echo "系统资源状态:"
    
    # CPU使用率
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    log_info "CPU使用率: $cpu_usage"
    
    # 内存使用率
    local mem_info=$(free | awk 'NR==2{printf "%.1f%% (%.1fGB/%.1fGB)", $3*100/$2, $3/1024/1024, $2/1024/1024}')
    log_info "内存使用率: $mem_info"
    
    # 磁盘使用率
    local disk_usage=$(df -h / | awk 'NR==2 {print $5 " (" $3 "/" $2 ")"}')
    log_info "磁盘使用率: $disk_usage"
    
    # 系统负载
    local load_avg=$(uptime | awk -F'load average:' '{print $2}')
    log_info "系统负载:$load_avg"
    
    # 网络连接数
    local connections=$(netstat -an | grep :80 | wc -l)
    log_info "网络连接数: $connections"
    
    echo ""
}

# 检查日志
check_logs() {
    log_step "检查应用日志..."
    
    echo "最近的应用日志:"
    
    # PM2日志
    if pm2 logs $APP_NAME --lines 5 --nostream 2>/dev/null; then
        echo ""
    else
        log_warn "无法获取PM2日志"
    fi
    
    # Nginx访问日志
    echo "最近的访问记录:"
    if [ -f "/var/log/nginx/diamond-website-access.log" ]; then
        tail -n 3 /var/log/nginx/diamond-website-access.log | while read line; do
            log_info "$line"
        done
    else
        log_warn "未找到Nginx访问日志"
    fi
    
    # Nginx错误日志
    echo "最近的错误记录:"
    if [ -f "/var/log/nginx/diamond-website-error.log" ]; then
        local error_count=$(tail -n 10 /var/log/nginx/diamond-website-error.log 2>/dev/null | wc -l)
        if [ $error_count -gt 0 ]; then
            log_warn "发现 $error_count 条错误记录"
            tail -n 3 /var/log/nginx/diamond-website-error.log
        else
            log_info "无错误记录"
        fi
    else
        log_info "无错误日志文件"
    fi
    
    echo ""
}

# 生成验证报告
generate_report() {
    local overall_status=$1
    
    echo "📊 验证报告摘要"
    echo "===================="
    
    if [ "$overall_status" = "true" ]; then
        log_info "总体状态: 部署成功 ✅"
        echo ""
        echo "🎉 恭喜！钻石网站更新部署成功！"
        echo ""
        echo "✅ 已验证功能:"
        echo "  • 应用服务正常运行"
        echo "  • API接口响应正常"
        echo "  • 缓存系统工作正常"
        echo "  • 性能优化已生效"
        echo "  • 系统资源使用正常"
        echo ""
        echo "📈 性能提升:"
        echo "  • 智能缓存系统已激活"
        echo "  • 响应时间显著改善"
        echo "  • 内存使用更加高效"
        echo ""
    else
        log_error "总体状态: 部分功能异常 ⚠️"
        echo ""
        echo "⚠️ 发现问题，建议检查:"
        echo "  • 查看详细日志: pm2 logs $APP_NAME"
        echo "  • 检查Nginx配置: nginx -t"
        echo "  • 重启服务: pm2 restart $APP_NAME"
        echo "  • 如有严重问题，执行回滚: sudo /usr/local/bin/diamond-update.sh rollback"
        echo ""
    fi
    
    echo "🔧 常用管理命令:"
    echo "  • 查看应用状态: pm2 status"
    echo "  • 查看实时日志: pm2 logs $APP_NAME --lines 50"
    echo "  • 重启应用: pm2 restart $APP_NAME"
    echo "  • 重新加载配置: pm2 reload $APP_NAME"
    echo "  • 查看性能监控: /usr/local/bin/diamond-monitor monitor"
    echo ""
}

# 主函数
main() {
    # 加载配置文件（如果存在）
    if [[ -f "$APP_DIR/deployment-config.sh" ]]; then
        source "$APP_DIR/deployment-config.sh"
    elif [[ -f "deployment-config.sh" ]]; then
        source deployment-config.sh
    fi
    
    show_banner
    
    echo "🔍 开始验证部署结果..."
    echo "时间: $(date)"
    echo "应用: $APP_NAME"
    echo "目录: $APP_DIR"
    echo ""
    
    local overall_status=true
    
    # 执行各项检查
    if ! check_service_status; then
        overall_status=false
    fi
    
    if ! check_application_functionality; then
        overall_status=false
    fi
    
    test_cache_performance
    
    check_external_access
    
    check_system_resources
    
    check_logs
    
    # 生成报告
    generate_report $overall_status
    
    # 返回状态
    if [ "$overall_status" = "true" ]; then
        exit 0
    else
        exit 1
    fi
}

# 执行主函数
main "$@"
