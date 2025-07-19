#!/bin/bash

# 🚀 钻石网站生产服务器自动化配置脚本
# 适用于 Ubuntu 20.04+ / CentOS 8+ / AlmaLinux 9+
# 作者: 无锡皇德国际贸易有限公司
# 版本: 1.0.0

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
APP_NAME="diamond-website"
APP_USER="diamond"
APP_DIR="/opt/diamond-website"
DOMAIN="your-domain.com"
NODE_VERSION="18"

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

# 检查系统
check_system() {
    log_info "检查系统环境..."
    
    if [[ $EUID -ne 0 ]]; then
        log_error "请使用root权限运行此脚本"
        exit 1
    fi
    
    # 检测操作系统
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
        log_info "检测到系统: $OS $VER"
    else
        log_error "无法检测操作系统"
        exit 1
    fi
}

# 更新系统
update_system() {
    log_info "更新系统包..."
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        apt update && apt upgrade -y
        apt install -y curl wget git unzip htop nginx certbot python3-certbot-nginx
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"AlmaLinux"* ]] || [[ "$OS" == *"Rocky"* ]]; then
        dnf update -y
        dnf install -y curl wget git unzip htop nginx certbot python3-certbot-nginx
    fi
}

# 安装Node.js
install_nodejs() {
    log_info "安装Node.js $NODE_VERSION..."
    
    # 使用NodeSource仓库
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        apt install -y nodejs
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"AlmaLinux"* ]] || [[ "$OS" == *"Rocky"* ]]; then
        dnf install -y nodejs npm
    fi
    
    # 验证安装
    node_version=$(node --version)
    npm_version=$(npm --version)
    log_info "Node.js版本: $node_version"
    log_info "NPM版本: $npm_version"
}

# 安装PM2
install_pm2() {
    log_info "安装PM2进程管理器..."
    npm install -g pm2
    pm2 startup
    log_info "PM2安装完成"
}

# 创建应用用户
create_app_user() {
    log_info "创建应用用户: $APP_USER"
    
    if ! id "$APP_USER" &>/dev/null; then
        useradd -r -s /bin/bash -d $APP_DIR $APP_USER
        log_info "用户 $APP_USER 创建成功"
    else
        log_warn "用户 $APP_USER 已存在"
    fi
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙..."
    
    if command -v ufw &> /dev/null; then
        # Ubuntu/Debian
        ufw --force enable
        ufw allow ssh
        ufw allow 80
        ufw allow 443
        ufw status
    elif command -v firewall-cmd &> /dev/null; then
        # CentOS/AlmaLinux
        systemctl enable firewalld
        systemctl start firewalld
        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --reload
    fi
    
    log_info "防火墙配置完成"
}

# 配置Nginx
configure_nginx() {
    log_info "配置Nginx..."
    
    # 备份原配置
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
    
    # 创建站点配置
    cat > /etc/nginx/sites-available/$APP_NAME << EOF
# Diamond Website CMS - Nginx配置
upstream diamond_backend {
    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# HTTP重定向到HTTPS
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

# HTTPS服务器
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL配置（证书路径稍后配置）
    # ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    
    # 日志
    access_log /var/log/nginx/diamond-website-access.log;
    error_log /var/log/nginx/diamond-website-error.log;
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri @backend;
    }
    
    # API接口
    location /api/ {
        proxy_pass http://diamond_backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # 主要代理
    location / {
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
    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    
    # 测试配置
    nginx -t
    
    # 启动Nginx
    systemctl enable nginx
    systemctl start nginx
    
    log_info "Nginx配置完成"
}

# 创建监控脚本
create_monitoring() {
    log_info "创建监控脚本..."
    
    cat > /usr/local/bin/diamond-monitor.sh << 'EOF'
#!/bin/bash

# 钻石网站监控脚本
APP_NAME="diamond-website"
LOG_FILE="/var/log/diamond-monitor.log"

# 检查应用状态
check_app() {
    if pm2 list | grep -q "$APP_NAME.*online"; then
        echo "$(date): 应用运行正常" >> $LOG_FILE
        return 0
    else
        echo "$(date): 应用异常，尝试重启" >> $LOG_FILE
        pm2 restart $APP_NAME
        return 1
    fi
}

# 检查磁盘空间
check_disk() {
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 80 ]; then
        echo "$(date): 磁盘空间不足: ${DISK_USAGE}%" >> $LOG_FILE
    fi
}

# 检查内存使用
check_memory() {
    MEM_USAGE=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
    if (( $(echo "$MEM_USAGE > 80" | bc -l) )); then
        echo "$(date): 内存使用过高: ${MEM_USAGE}%" >> $LOG_FILE
    fi
}

# 执行检查
check_app
check_disk
check_memory
EOF
    
    chmod +x /usr/local/bin/diamond-monitor.sh
    
    # 添加到crontab
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/diamond-monitor.sh") | crontab -
    
    log_info "监控脚本创建完成"
}

# 主函数
main() {
    log_info "开始配置钻石网站生产服务器..."
    
    check_system
    update_system
    install_nodejs
    install_pm2
    create_app_user
    configure_firewall
    configure_nginx
    create_monitoring
    
    log_info "服务器配置完成！"
    log_info "下一步操作："
    log_info "1. 修改域名配置: 编辑 /etc/nginx/sites-available/$APP_NAME"
    log_info "2. 部署应用代码到: $APP_DIR"
    log_info "3. 配置SSL证书: certbot --nginx -d $DOMAIN"
    log_info "4. 启动应用: pm2 start server.js --name $APP_NAME"
}

# 执行主函数
main "$@"
