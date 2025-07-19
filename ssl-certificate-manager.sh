#!/bin/bash

# 🔒 SSL证书管理脚本
# 检查、配置和管理钻石网站的SSL证书

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# 配置变量（从deployment-config.sh加载）
DOMAIN="${DOMAIN:-your-domain.com}"
WWW_DOMAIN="${WWW_DOMAIN:-www.your-domain.com}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@your-domain.com}"
SSL_RENEWAL_DAYS="${SSL_RENEWAL_DAYS:-30}"

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 显示横幅
show_banner() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    🔒 SSL证书管理工具                        ║"
    echo "║                                                              ║"
    echo "║  • 检查证书状态                                              ║"
    echo "║  • 自动申请证书                                              ║"
    echo "║  • 证书续期管理                                              ║"
    echo "║  • 安全配置优化                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 检查域名解析
check_dns_resolution() {
    log_step "检查域名解析..."
    
    local domains=("$DOMAIN" "$WWW_DOMAIN")
    local dns_ok=true
    
    for domain in "${domains[@]}"; do
        echo "检查域名: $domain"
        
        # 检查A记录
        local ip=$(dig +short A "$domain" | head -n1)
        if [[ -n "$ip" && "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            log_info "  A记录: $ip"
        else
            log_error "  A记录解析失败"
            dns_ok=false
        fi
        
        # 检查是否指向本服务器
        local server_ip=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null)
        if [[ "$ip" == "$server_ip" ]]; then
            log_info "  域名正确指向本服务器"
        else
            log_warn "  域名未指向本服务器 (服务器IP: $server_ip)"
        fi
        
        echo ""
    done
    
    if [[ "$dns_ok" == "true" ]]; then
        log_info "域名解析检查通过"
        return 0
    else
        log_error "域名解析检查失败"
        return 1
    fi
}

# 检查现有证书
check_existing_certificate() {
    log_step "检查现有SSL证书..."
    
    local cert_dir="/etc/letsencrypt/live/$DOMAIN"
    local cert_file="$cert_dir/fullchain.pem"
    
    if [[ ! -f "$cert_file" ]]; then
        log_warn "未找到SSL证书文件"
        return 1
    fi
    
    # 检查证书详细信息
    log_info "证书文件: $cert_file"
    
    # 获取证书信息
    local cert_info=$(openssl x509 -in "$cert_file" -text -noout 2>/dev/null)
    
    if [[ $? -ne 0 ]]; then
        log_error "证书文件损坏或无法读取"
        return 1
    fi
    
    # 提取证书信息
    local subject=$(echo "$cert_info" | grep "Subject:" | sed 's/.*CN = //')
    local issuer=$(echo "$cert_info" | grep "Issuer:" | sed 's/.*CN = //')
    local not_before=$(openssl x509 -in "$cert_file" -noout -startdate | cut -d= -f2)
    local not_after=$(openssl x509 -in "$cert_file" -noout -enddate | cut -d= -f2)
    
    # 计算剩余天数
    local expiry_timestamp=$(date -d "$not_after" +%s 2>/dev/null)
    local current_timestamp=$(date +%s)
    local days_left=$(( (expiry_timestamp - current_timestamp) / 86400 ))
    
    echo "证书信息:"
    echo "  主题: $subject"
    echo "  颁发者: $issuer"
    echo "  生效时间: $not_before"
    echo "  过期时间: $not_after"
    echo "  剩余天数: $days_left 天"
    
    # 检查SAN (Subject Alternative Names)
    local san=$(echo "$cert_info" | grep -A1 "Subject Alternative Name" | tail -n1 | sed 's/.*DNS://' | tr ',' '\n' | sed 's/^ *//')
    if [[ -n "$san" ]]; then
        echo "  包含域名:"
        echo "$san" | while read -r domain; do
            echo "    - $domain"
        done
    fi
    
    # 判断证书状态
    if [[ $days_left -lt 0 ]]; then
        log_error "证书已过期"
        return 2
    elif [[ $days_left -lt $SSL_RENEWAL_DAYS ]]; then
        log_warn "证书即将过期 ($days_left 天)"
        return 3
    else
        log_info "证书状态正常"
        return 0
    fi
}

# 检查证书在Nginx中的配置
check_nginx_ssl_config() {
    log_step "检查Nginx SSL配置..."
    
    local nginx_config="/etc/nginx/sites-available/diamond-website"
    
    if [[ ! -f "$nginx_config" ]]; then
        log_error "Nginx配置文件不存在: $nginx_config"
        return 1
    fi
    
    # 检查SSL配置行
    local ssl_cert_line=$(grep "ssl_certificate " "$nginx_config" | grep -v "#")
    local ssl_key_line=$(grep "ssl_certificate_key " "$nginx_config" | grep -v "#")
    
    if [[ -z "$ssl_cert_line" || -z "$ssl_key_line" ]]; then
        log_warn "Nginx中SSL配置被注释或缺失"
        return 1
    fi
    
    # 提取证书路径
    local cert_path=$(echo "$ssl_cert_line" | awk '{print $2}' | sed 's/;//')
    local key_path=$(echo "$ssl_key_line" | awk '{print $2}' | sed 's/;//')
    
    echo "Nginx SSL配置:"
    echo "  证书文件: $cert_path"
    echo "  私钥文件: $key_path"
    
    # 检查文件是否存在
    if [[ -f "$cert_path" && -f "$key_path" ]]; then
        log_info "SSL文件存在且配置正确"
        
        # 测试Nginx配置
        if nginx -t 2>/dev/null; then
            log_info "Nginx配置语法正确"
            return 0
        else
            log_error "Nginx配置语法错误"
            return 1
        fi
    else
        log_error "SSL文件不存在"
        return 1
    fi
}

# 申请新的SSL证书
request_new_certificate() {
    log_step "申请新的SSL证书..."
    
    # 检查certbot是否安装
    if ! command -v certbot &> /dev/null; then
        log_error "certbot未安装，正在安装..."
        
        if command -v apt &> /dev/null; then
            apt update && apt install -y certbot python3-certbot-nginx
        elif command -v dnf &> /dev/null; then
            dnf install -y certbot python3-certbot-nginx
        else
            log_error "无法自动安装certbot，请手动安装"
            return 1
        fi
    fi
    
    # 停止Nginx以释放80端口（如果使用standalone模式）
    local nginx_was_running=false
    if systemctl is-active --quiet nginx; then
        nginx_was_running=true
        log_info "临时停止Nginx服务..."
        systemctl stop nginx
    fi
    
    # 申请证书
    log_info "正在申请SSL证书..."
    
    local certbot_command="certbot certonly --standalone --non-interactive --agree-tos --email $ADMIN_EMAIL -d $DOMAIN -d $WWW_DOMAIN"
    
    if $certbot_command; then
        log_info "SSL证书申请成功"
        
        # 重新启动Nginx
        if [[ "$nginx_was_running" == "true" ]]; then
            log_info "重新启动Nginx服务..."
            systemctl start nginx
        fi
        
        return 0
    else
        log_error "SSL证书申请失败"
        
        # 重新启动Nginx
        if [[ "$nginx_was_running" == "true" ]]; then
            systemctl start nginx
        fi
        
        return 1
    fi
}

# 使用Nginx插件申请证书
request_certificate_nginx() {
    log_step "使用Nginx插件申请SSL证书..."
    
    # 确保Nginx配置正确
    if ! nginx -t; then
        log_error "Nginx配置有误，请先修复"
        return 1
    fi
    
    # 使用nginx插件申请证书
    local certbot_command="certbot --nginx --non-interactive --agree-tos --email $ADMIN_EMAIL -d $DOMAIN -d $WWW_DOMAIN"
    
    if $certbot_command; then
        log_info "SSL证书申请并配置成功"
        
        # 重新加载Nginx
        systemctl reload nginx
        
        return 0
    else
        log_error "SSL证书申请失败"
        return 1
    fi
}

# 续期证书
renew_certificate() {
    log_step "续期SSL证书..."
    
    if certbot renew --dry-run; then
        log_info "证书续期测试成功"
        
        if certbot renew; then
            log_info "证书续期成功"
            systemctl reload nginx
            return 0
        else
            log_error "证书续期失败"
            return 1
        fi
    else
        log_error "证书续期测试失败"
        return 1
    fi
}

# 启用Nginx中的SSL配置
enable_nginx_ssl() {
    log_step "启用Nginx SSL配置..."
    
    local nginx_config="/etc/nginx/sites-available/diamond-website"
    
    # 取消注释SSL配置行
    sed -i 's/# *ssl_certificate /ssl_certificate /' "$nginx_config"
    sed -i 's/# *ssl_certificate_key /ssl_certificate_key /' "$nginx_config"
    
    # 测试配置
    if nginx -t; then
        log_info "Nginx SSL配置已启用"
        systemctl reload nginx
        return 0
    else
        log_error "Nginx配置错误"
        return 1
    fi
}

# 测试SSL连接
test_ssl_connection() {
    log_step "测试SSL连接..."
    
    local domains=("$DOMAIN" "$WWW_DOMAIN")
    
    for domain in "${domains[@]}"; do
        echo "测试域名: $domain"
        
        # 测试HTTPS连接
        local response=$(curl -s -I "https://$domain" --connect-timeout 10 2>/dev/null)
        
        if [[ $? -eq 0 ]]; then
            local status_code=$(echo "$response" | head -n1 | awk '{print $2}')
            log_info "  HTTPS连接成功 (状态码: $status_code)"
        else
            log_error "  HTTPS连接失败"
        fi
        
        # 测试SSL证书
        local ssl_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
        
        if [[ $? -eq 0 ]]; then
            log_info "  SSL证书验证成功"
        else
            log_error "  SSL证书验证失败"
        fi
        
        echo ""
    done
}

# 设置自动续期
setup_auto_renewal() {
    log_step "设置SSL证书自动续期..."
    
    # 检查是否已有续期任务
    if crontab -l 2>/dev/null | grep -q "certbot renew"; then
        log_info "自动续期任务已存在"
        return 0
    fi
    
    # 添加续期任务到crontab
    (crontab -l 2>/dev/null; echo "0 2 * * 0 certbot renew --quiet && systemctl reload nginx") | crontab -
    
    log_info "自动续期任务已设置 (每周日凌晨2点执行)"
    
    # 创建续期后的钩子脚本
    cat > /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh << 'EOF'
#!/bin/bash
systemctl reload nginx
echo "$(date): SSL证书续期后重新加载Nginx" >> /var/log/ssl-renewal.log
EOF
    
    chmod +x /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh
    
    log_info "续期后钩子脚本已创建"
}

# 显示帮助信息
show_help() {
    echo "SSL证书管理工具"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  check       检查现有证书状态"
    echo "  request     申请新的SSL证书"
    echo "  renew       续期现有证书"
    echo "  test        测试SSL连接"
    echo "  auto        设置自动续期"
    echo "  status      显示完整状态报告"
    echo "  help        显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 check     # 检查证书状态"
    echo "  $0 request   # 申请新证书"
    echo "  $0 renew     # 续期证书"
}

# 显示完整状态报告
show_status_report() {
    show_banner
    
    echo "🔍 SSL证书状态报告"
    echo "===================="
    echo ""
    
    # 域名信息
    echo "📋 配置信息:"
    echo "  主域名: $DOMAIN"
    echo "  WWW域名: $WWW_DOMAIN"
    echo "  管理员邮箱: $ADMIN_EMAIL"
    echo ""
    
    # DNS检查
    check_dns_resolution
    echo ""
    
    # 证书检查
    local cert_status
    check_existing_certificate
    cert_status=$?
    echo ""
    
    # Nginx配置检查
    check_nginx_ssl_config
    echo ""
    
    # SSL连接测试
    test_ssl_connection
    
    # 总结
    echo "📊 状态总结:"
    case $cert_status in
        0) echo "  ✅ SSL证书状态正常" ;;
        1) echo "  ❌ 未找到SSL证书" ;;
        2) echo "  ❌ SSL证书已过期" ;;
        3) echo "  ⚠️  SSL证书即将过期" ;;
    esac
}

# 主函数
main() {
    # 加载配置文件（如果存在）
    if [[ -f "deployment-config.sh" ]]; then
        source deployment-config.sh
    fi
    
    case "${1:-status}" in
        "check")
            check_existing_certificate
            ;;
        "request")
            if check_dns_resolution; then
                request_certificate_nginx || request_new_certificate
                enable_nginx_ssl
                setup_auto_renewal
            fi
            ;;
        "renew")
            renew_certificate
            ;;
        "test")
            test_ssl_connection
            ;;
        "auto")
            setup_auto_renewal
            ;;
        "status")
            show_status_report
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
}

# 执行主函数
main "$@"
