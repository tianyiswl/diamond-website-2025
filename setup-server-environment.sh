#!/bin/bash

# 🔧 钻石网站服务器环境配置脚本
# 无锡皇德国际贸易有限公司 - 服务器环境自动化配置
# 在服务器上运行此脚本来配置完整的运行环境

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量
PROJECT_NAME="diamond-website"
PROJECT_DIR="/opt/diamond-website"
DB_NAME="diamond_website"
DB_USER="diamond_user"
DB_PASSWORD="${DB_PASSWORD:-diamond_secure_2025}"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

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

# 检查是否为root用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用 sudo 运行此脚本"
        exit 1
    fi
}

# 更新系统
update_system() {
    log_info "更新系统包..."
    apt update && apt upgrade -y
    log_success "系统更新完成"
}

# 安装基础工具
install_basic_tools() {
    log_info "安装基础工具..."
    apt install -y curl wget git unzip htop tree vim nano ufw fail2ban
    log_success "基础工具安装完成"
}

# 安装Node.js
install_nodejs() {
    log_info "安装 Node.js..."
    
    # 安装 NodeSource 仓库
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    
    # 验证安装
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    log_success "Node.js 安装完成"
    log_info "Node.js 版本: $NODE_VERSION"
    log_info "npm 版本: $NPM_VERSION"
}

# 安装PM2
install_pm2() {
    log_info "安装 PM2 进程管理器..."
    npm install -g pm2
    
    # 配置PM2开机自启
    pm2 startup systemd
    
    log_success "PM2 安装完成"
}

# 安装PostgreSQL
install_postgresql() {
    log_info "安装 PostgreSQL..."
    
    apt install -y postgresql postgresql-contrib
    
    # 启动并启用PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    log_success "PostgreSQL 安装完成"
}

# 配置PostgreSQL数据库
setup_database() {
    log_info "配置 PostgreSQL 数据库..."
    
    # 创建数据库用户和数据库
    sudo -u postgres psql << EOF
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
\q
EOF

    log_success "数据库配置完成"
    log_info "数据库名: $DB_NAME"
    log_info "用户名: $DB_USER"
    log_info "密码: $DB_PASSWORD"
}

# 安装Nginx
install_nginx() {
    log_info "安装 Nginx..."
    
    apt install -y nginx
    
    # 启动并启用Nginx
    systemctl start nginx
    systemctl enable nginx
    
    log_success "Nginx 安装完成"
}

# 配置Nginx
setup_nginx() {
    log_info "配置 Nginx..."
    
    # 创建Nginx配置文件
    cat > $NGINX_AVAILABLE/$PROJECT_NAME << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL配置（需要配置SSL证书）
    # ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # 代理到Node.js应用
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 健康检查
    location /health {
        access_log off;
        proxy_pass http://localhost:3001/api/health;
    }
}
EOF

    # 启用站点
    ln -sf $NGINX_AVAILABLE/$PROJECT_NAME $NGINX_ENABLED/
    
    # 删除默认站点
    rm -f $NGINX_ENABLED/default
    
    # 测试Nginx配置
    nginx -t
    
    # 重启Nginx
    systemctl reload nginx
    
    log_success "Nginx 配置完成"
    log_warning "请修改配置文件中的域名: $NGINX_AVAILABLE/$PROJECT_NAME"
}

# 配置防火墙
setup_firewall() {
    log_info "配置防火墙..."
    
    # 重置UFW
    ufw --force reset
    
    # 默认策略
    ufw default deny incoming
    ufw default allow outgoing
    
    # 允许SSH
    ufw allow ssh
    
    # 允许HTTP和HTTPS
    ufw allow 'Nginx Full'
    
    # 允许应用端口（如果需要直接访问）
    # ufw allow 3001
    
    # 启用防火墙
    ufw --force enable
    
    log_success "防火墙配置完成"
}

# 创建项目目录和用户
setup_project_structure() {
    log_info "创建项目结构..."
    
    # 创建项目用户
    if ! id "diamond" &>/dev/null; then
        useradd -m -s /bin/bash diamond
        usermod -aG sudo diamond
        log_info "创建用户: diamond"
    fi
    
    # 创建项目目录
    mkdir -p $PROJECT_DIR
    mkdir -p /opt/backups
    mkdir -p /var/log/diamond-website
    
    # 设置权限
    chown -R diamond:diamond $PROJECT_DIR
    chown -R diamond:diamond /opt/backups
    chown -R diamond:diamond /var/log/diamond-website
    
    log_success "项目结构创建完成"
}

# 配置日志轮转
setup_log_rotation() {
    log_info "配置日志轮转..."
    
    cat > /etc/logrotate.d/diamond-website << 'EOF'
/var/log/diamond-website/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 diamond diamond
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

    log_success "日志轮转配置完成"
}

# 安装SSL证书（Let's Encrypt）
install_ssl() {
    log_info "安装 Let's Encrypt SSL 证书工具..."
    
    apt install -y certbot python3-certbot-nginx
    
    log_success "Certbot 安装完成"
    log_warning "请运行以下命令获取SSL证书:"
    log_warning "sudo certbot --nginx -d your-domain.com -d www.your-domain.com"
}

# 创建监控脚本
create_monitoring_script() {
    log_info "创建监控脚本..."
    
    cat > /usr/local/bin/diamond-monitor.sh << 'EOF'
#!/bin/bash

# 钻石网站监控脚本
PROJECT_NAME="diamond-website"
LOG_FILE="/var/log/diamond-website/monitor.log"

# 检查应用状态
check_app() {
    if ! pm2 describe $PROJECT_NAME > /dev/null 2>&1; then
        echo "$(date): 应用未运行，尝试启动..." >> $LOG_FILE
        pm2 start /opt/diamond-website/ecosystem.config.js --env production
    fi
    
    # 检查健康状态
    if ! curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "$(date): 健康检查失败，重启应用..." >> $LOG_FILE
        pm2 restart $PROJECT_NAME
    fi
}

# 检查磁盘空间
check_disk() {
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 90 ]; then
        echo "$(date): 磁盘空间不足: ${DISK_USAGE}%" >> $LOG_FILE
    fi
}

# 清理旧日志
cleanup_logs() {
    find /var/log/diamond-website -name "*.log" -mtime +30 -delete
    find /opt/backups -name "*backup*" -mtime +7 -delete
}

check_app
check_disk
cleanup_logs
EOF

    chmod +x /usr/local/bin/diamond-monitor.sh
    
    # 添加到crontab
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/diamond-monitor.sh") | crontab -
    
    log_success "监控脚本创建完成"
}

# 显示配置信息
show_configuration() {
    log_success "🎉 服务器环境配置完成！"
    echo ""
    echo "📋 配置信息:"
    echo "  项目目录: $PROJECT_DIR"
    echo "  数据库名: $DB_NAME"
    echo "  数据库用户: $DB_USER"
    echo "  数据库密码: $DB_PASSWORD"
    echo ""
    echo "🔧 下一步操作:"
    echo "  1. 修改 Nginx 配置中的域名"
    echo "  2. 获取 SSL 证书: sudo certbot --nginx -d your-domain.com"
    echo "  3. 上传项目文件到: $PROJECT_DIR"
    echo "  4. 配置环境变量文件: $PROJECT_DIR/.env"
    echo "  5. 运行部署脚本"
    echo ""
    echo "🌐 访问地址:"
    echo "  HTTP: http://your-server-ip"
    echo "  HTTPS: https://your-domain.com (配置SSL后)"
    echo ""
    echo "📊 管理命令:"
    echo "  查看应用状态: pm2 status"
    echo "  查看日志: pm2 logs diamond-website"
    echo "  重启应用: pm2 restart diamond-website"
    echo "  查看Nginx状态: systemctl status nginx"
}

# 主函数
main() {
    echo "🚀 开始配置钻石网站服务器环境"
    echo "无锡皇德国际贸易有限公司 - 服务器环境自动化配置"
    echo ""
    
    check_root
    update_system
    install_basic_tools
    install_nodejs
    install_pm2
    install_postgresql
    setup_database
    install_nginx
    setup_nginx
    setup_firewall
    setup_project_structure
    setup_log_rotation
    install_ssl
    create_monitoring_script
    show_configuration
}

# 运行主函数
main
