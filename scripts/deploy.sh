#!/bin/bash

# 🚀 Diamond Website CMS - AlmaLinux 10 一键部署脚本
# 自动安装依赖、配置环境、启动服务

set -e

# 配置变量
PROJECT_NAME="diamond-website"
PROJECT_DIR="/opt/diamond-website"
SERVICE_USER="diamond"
DOMAIN="your-domain.com"  # 请修改为您的域名
PORT=3000

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
        log_error "请使用root权限运行此脚本"
        log_info "使用命令: sudo $0"
        exit 1
    fi
}

# 设置系统时区
setup_timezone() {
    log_info "设置系统时区为Asia/Shanghai..."

    # 设置系统时区
    timedatectl set-timezone Asia/Shanghai

    # 启用NTP时间同步
    timedatectl set-ntp true

    # 验证时区设置
    current_timezone=$(timedatectl show --property=Timezone --value)
    if [ "$current_timezone" = "Asia/Shanghai" ]; then
        log_success "时区设置成功: $current_timezone"
        log_info "当前时间: $(date)"
    else
        log_error "时区设置失败"
        exit 1
    fi
}

# 更新系统
update_system() {
    log_info "更新系统软件包..."
    dnf update -y
    log_success "系统更新完成"
}

# 安装基础软件包
install_base_packages() {
    log_info "安装基础软件包..."
    
    dnf install -y \
        git \
        curl \
        wget \
        unzip \
        firewalld \
        nginx \
        certbot \
        python3-certbot-nginx \
        logrotate \
        htop \
        vim
    
    log_success "基础软件包安装完成"
}

# 安装Node.js
install_nodejs() {
    log_info "安装Node.js..."
    
    # 安装NodeSource仓库
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    
    # 安装Node.js
    dnf install -y nodejs
    
    # 验证安装
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    log_success "Node.js安装完成: $NODE_VERSION"
    log_success "npm版本: $NPM_VERSION"
}

# 创建服务用户
create_service_user() {
    log_info "创建服务用户..."
    
    if ! id "$SERVICE_USER" &>/dev/null; then
        useradd -r -s /bin/false -d $PROJECT_DIR $SERVICE_USER
        log_success "用户 $SERVICE_USER 创建成功"
    else
        log_info "用户 $SERVICE_USER 已存在"
    fi
}

# 克隆项目
clone_project() {
    log_info "克隆项目代码..."
    
    # 创建项目目录
    mkdir -p $PROJECT_DIR
    
    # 克隆代码
    if [ -d "$PROJECT_DIR/.git" ]; then
        log_info "项目已存在，更新代码..."
        cd $PROJECT_DIR
        git pull origin master
    else
        git clone https://github.com/tianyiswl/diamond-website-2025.git $PROJECT_DIR
    fi
    
    # 设置目录权限
    chown -R $SERVICE_USER:$SERVICE_USER $PROJECT_DIR
    
    log_success "项目代码部署完成"
}

# 安装项目依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    cd $PROJECT_DIR
    
    # 使用服务用户身份安装依赖
    sudo -u $SERVICE_USER npm install --production
    
    log_success "项目依赖安装完成"
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙..."
    
    # 启动防火墙
    systemctl enable firewalld
    systemctl start firewalld
    
    # 开放必要端口
    firewall-cmd --permanent --add-port=$PORT/tcp
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    
    log_success "防火墙配置完成"
}

# 创建systemd服务
create_systemd_service() {
    log_info "创建systemd服务..."
    
    cat > /etc/systemd/system/$PROJECT_NAME.service << EOF
[Unit]
Description=Diamond Website CMS
Documentation=https://github.com/tianyiswl/diamond-website-2025
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=$PORT

# 安全设置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$PROJECT_DIR

# 日志设置
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$PROJECT_NAME

[Install]
WantedBy=multi-user.target
EOF

    # 重新加载systemd配置
    systemctl daemon-reload
    systemctl enable $PROJECT_NAME
    
    log_success "systemd服务创建完成"
}

# 配置Nginx
configure_nginx() {
    log_info "配置Nginx反向代理..."
    
    # 备份默认配置
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
    
    # 创建站点配置
    cat > /etc/nginx/conf.d/$PROJECT_NAME.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # 重定向到HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL配置（证书路径需要在获取证书后更新）
    # ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # 反向代理配置
    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:$PORT;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

    # 测试Nginx配置
    nginx -t
    
    # 启动Nginx
    systemctl enable nginx
    systemctl start nginx
    
    log_success "Nginx配置完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    # 启动应用服务
    systemctl start $PROJECT_NAME
    
    # 检查服务状态
    if systemctl is-active --quiet $PROJECT_NAME; then
        log_success "✅ $PROJECT_NAME 服务启动成功"
    else
        log_error "❌ $PROJECT_NAME 服务启动失败"
        systemctl status $PROJECT_NAME
        exit 1
    fi
    
    # 重启Nginx
    systemctl restart nginx
    
    log_success "所有服务启动完成"
}

# 显示部署信息
show_deployment_info() {
    echo
    echo "🎉 部署完成！"
    echo "================================================"
    echo "📱 网站地址: http://$DOMAIN"
    echo "🛠️  管理后台: http://$DOMAIN/admin"
    echo "🔐 登录页面: http://$DOMAIN/admin/login.html"
    echo
    echo "🔑 默认管理员账号:"
    echo "   用户名: admin"
    echo "   密码: admin123"
    echo
    echo "📋 服务管理命令:"
    echo "   启动服务: systemctl start $PROJECT_NAME"
    echo "   停止服务: systemctl stop $PROJECT_NAME"
    echo "   重启服务: systemctl restart $PROJECT_NAME"
    echo "   查看状态: systemctl status $PROJECT_NAME"
    echo "   查看日志: journalctl -u $PROJECT_NAME -f"
    echo
    echo "🔧 配置文件位置:"
    echo "   项目目录: $PROJECT_DIR"
    echo "   服务配置: /etc/systemd/system/$PROJECT_NAME.service"
    echo "   Nginx配置: /etc/nginx/conf.d/$PROJECT_NAME.conf"
    echo
    echo "⚠️  重要提醒:"
    echo "   1. 请修改默认管理员密码"
    echo "   2. 配置SSL证书以启用HTTPS"
    echo "   3. 定期备份数据和配置"
    echo "================================================"
}

# 主函数
main() {
    echo "🚀 开始部署Diamond Website CMS到AlmaLinux 10..."
    echo "================================================"
    
    check_root
    setup_timezone
    update_system
    install_base_packages
    install_nodejs
    create_service_user
    clone_project
    install_dependencies
    configure_firewall
    create_systemd_service
    configure_nginx
    start_services
    show_deployment_info
}

# 执行主函数
main "$@"
