#!/bin/bash

# 🚀 钻石网站一键优化部署脚本
# 集成所有性能优化和监控功能
# 适用于200-300产品规模的生产环境

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# 配置变量
APP_NAME="diamond-website"
DOMAIN="your-domain.com"
EMAIL="admin@your-domain.com"

# 显示横幅
show_banner() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    🚀 钻石网站优化部署                        ║"
    echo "║                                                              ║"
    echo "║  • 智能缓存系统                                              ║"
    echo "║  • 性能监控告警                                              ║"
    echo "║  • 自动化运维                                                ║"
    echo "║  • 安全加固配置                                              ║"
    echo "║                                                              ║"
    echo "║  无锡皇德国际贸易有限公司 - 专业汽车零件展示平台              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 日志函数
log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
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

# 检查运行权限
check_permissions() {
    log_step "检查运行权限..."
    
    if [[ $EUID -ne 0 ]]; then
        log_error "请使用root权限运行此脚本"
        echo "使用方法: sudo $0"
        exit 1
    fi
    
    log_success "权限检查通过"
}

# 检查系统环境
check_environment() {
    log_step "检查系统环境..."
    
    # 检查操作系统
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        log_success "检测到系统: $NAME $VERSION_ID"
    else
        log_error "无法检测操作系统"
        exit 1
    fi
    
    # 检查网络连接
    if ping -c 1 google.com &> /dev/null; then
        log_success "网络连接正常"
    else
        log_warning "网络连接可能有问题，继续部署..."
    fi
}

# 安装基础依赖
install_dependencies() {
    log_step "安装基础依赖..."
    
    # 更新包管理器
    if command -v apt &> /dev/null; then
        apt update && apt upgrade -y
        apt install -y curl wget git unzip htop nginx certbot python3-certbot-nginx bc
    elif command -v dnf &> /dev/null; then
        dnf update -y
        dnf install -y curl wget git unzip htop nginx certbot python3-certbot-nginx bc
    fi
    
    log_success "基础依赖安装完成"
}

# 安装Node.js和PM2
install_nodejs() {
    log_step "安装Node.js和PM2..."
    
    # 安装Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    
    if command -v apt &> /dev/null; then
        apt install -y nodejs
    elif command -v dnf &> /dev/null; then
        dnf install -y nodejs npm
    fi
    
    # 安装PM2
    npm install -g pm2
    
    # 验证安装
    node_version=$(node --version)
    npm_version=$(npm --version)
    pm2_version=$(pm2 --version)
    
    log_success "Node.js $node_version, NPM $npm_version, PM2 $pm2_version 安装完成"
}

# 配置应用环境
setup_application() {
    log_step "配置应用环境..."
    
    # 创建应用目录
    mkdir -p /opt/diamond-website
    mkdir -p /var/log/diamond-monitor
    
    # 设置权限
    chown -R www-data:www-data /opt/diamond-website
    chmod -R 755 /opt/diamond-website
    
    log_success "应用环境配置完成"
}

# 配置Nginx优化
configure_nginx() {
    log_step "配置Nginx优化..."
    
    # 备份原配置
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
    
    # 优化Nginx主配置
    cat > /etc/nginx/nginx.conf << 'EOF'
user www-data;
worker_processes auto;
pid /run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
    multi_accept on;
}

http {
    # 基础配置
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;
    
    # MIME类型
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # 限流配置
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=admin:10m rate=1r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=5r/s;
    
    # 包含站点配置
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF
    
    # 创建站点配置
    cat > /etc/nginx/sites-available/diamond-website << EOF
# Diamond Website - 优化配置
upstream diamond_backend {
    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL配置（稍后配置证书）
    # ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri @backend;
    }
    
    # API接口
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://diamond_backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # 管理后台
    location /admin/ {
        limit_req zone=admin burst=10 nodelay;
        proxy_pass http://diamond_backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # 主要代理
    location / {
        limit_req zone=general burst=50 nodelay;
        proxy_pass http://diamond_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location @backend {
        proxy_pass http://diamond_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    
    # 启用站点
    ln -sf /etc/nginx/sites-available/diamond-website /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # 测试配置
    nginx -t
    
    log_success "Nginx配置完成"
}

# 配置监控系统
setup_monitoring() {
    log_step "配置监控系统..."
    
    # 复制监控脚本
    cp server-resource-monitor.sh /usr/local/bin/diamond-monitor
    chmod +x /usr/local/bin/diamond-monitor
    
    # 配置定时任务
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/diamond-monitor monitor") | crontab -
    (crontab -l 2>/dev/null; echo "0 6 * * * /usr/local/bin/diamond-monitor report") | crontab -
    (crontab -l 2>/dev/null; echo "0 2 * * 0 /usr/local/bin/diamond-monitor cleanup") | crontab -
    
    log_success "监控系统配置完成"
}

# 配置防火墙
configure_firewall() {
    log_step "配置防火墙..."
    
    if command -v ufw &> /dev/null; then
        ufw --force enable
        ufw allow ssh
        ufw allow 80
        ufw allow 443
    elif command -v firewall-cmd &> /dev/null; then
        systemctl enable firewalld
        systemctl start firewalld
        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --reload
    fi
    
    log_success "防火墙配置完成"
}

# 启动服务
start_services() {
    log_step "启动服务..."
    
    # 启动Nginx
    systemctl enable nginx
    systemctl start nginx
    
    # 设置PM2开机启动
    pm2 startup
    
    log_success "服务启动完成"
}

# 显示部署结果
show_results() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    🎉 部署完成！                              ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}下一步操作：${NC}"
    echo "1. 修改域名配置："
    echo "   sudo nano /etc/nginx/sites-available/diamond-website"
    echo "   将 'your-domain.com' 替换为您的实际域名"
    echo ""
    echo "2. 部署应用代码到 /opt/diamond-website"
    echo ""
    echo "3. 配置SSL证书："
    echo "   sudo certbot --nginx -d your-domain.com -d www.your-domain.com"
    echo ""
    echo "4. 启动应用："
    echo "   cd /opt/diamond-website"
    echo "   pm2 start server.js --name diamond-website"
    echo "   pm2 save"
    echo ""
    echo -e "${BLUE}监控命令：${NC}"
    echo "• 查看监控状态: /usr/local/bin/diamond-monitor monitor"
    echo "• 生成性能报告: /usr/local/bin/diamond-monitor report"
    echo "• 查看PM2状态: pm2 status"
    echo "• 查看Nginx状态: systemctl status nginx"
    echo ""
    echo -e "${GREEN}🚀 您的钻石网站已准备就绪！${NC}"
}

# 主函数
main() {
    show_banner
    check_permissions
    check_environment
    install_dependencies
    install_nodejs
    setup_application
    configure_nginx
    setup_monitoring
    configure_firewall
    start_services
    show_results
}

# 执行主函数
main "$@"
