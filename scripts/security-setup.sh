#!/bin/bash

# 🔒 Diamond Website CMS - 安全配置脚本
# 配置防火墙、SELinux和基本安全加固

set -e

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

# 检查root权限
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用root权限运行此脚本"
        exit 1
    fi
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙规则..."
    
    # 启动并启用firewalld
    systemctl enable firewalld
    systemctl start firewalld
    
    # 设置默认区域
    firewall-cmd --set-default-zone=public
    
    # 允许SSH（确保不会断开连接）
    firewall-cmd --permanent --add-service=ssh
    
    # 允许HTTP和HTTPS
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    
    # 允许应用端口
    firewall-cmd --permanent --add-port=3000/tcp
    
    # 限制SSH访问（可选，根据需要调整）
    # firewall-cmd --permanent --add-rich-rule="rule family='ipv4' source address='YOUR_IP_ADDRESS' service name='ssh' accept"
    
    # 防止DDoS攻击
    firewall-cmd --permanent --add-rich-rule="rule family='ipv4' source address='0.0.0.0/0' port protocol='tcp' port='80' accept limit value='25/m'"
    firewall-cmd --permanent --add-rich-rule="rule family='ipv4' source address='0.0.0.0/0' port protocol='tcp' port='443' accept limit value='25/m'"
    
    # 重新加载防火墙规则
    firewall-cmd --reload
    
    # 显示当前规则
    firewall-cmd --list-all
    
    log_success "防火墙配置完成"
}

# 配置SELinux
configure_selinux() {
    log_info "配置SELinux..."
    
    # 检查SELinux状态
    if command -v getenforce &> /dev/null; then
        SELINUX_STATUS=$(getenforce)
        log_info "当前SELinux状态: $SELINUX_STATUS"
        
        if [ "$SELINUX_STATUS" = "Enforcing" ]; then
            # 为Node.js应用配置SELinux策略
            setsebool -P httpd_can_network_connect 1
            setsebool -P httpd_can_network_relay 1
            
            # 设置文件上下文
            semanage fcontext -a -t httpd_exec_t "/opt/diamond-website/server.js" 2>/dev/null || true
            semanage fcontext -a -t httpd_exec_t "/usr/bin/node" 2>/dev/null || true
            restorecon -R /opt/diamond-website/ 2>/dev/null || true
            
            log_success "SELinux配置完成"
        else
            log_warning "SELinux未启用，建议启用以提高安全性"
        fi
    else
        log_warning "SELinux工具未安装"
    fi
}

# 系统安全加固
system_hardening() {
    log_info "执行系统安全加固..."
    
    # 更新系统
    dnf update -y
    
    # 安装安全工具
    dnf install -y fail2ban aide rkhunter chkrootkit
    
    # 配置fail2ban
    cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/diamond-website-error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/diamond-website-error.log
maxretry = 10
EOF

    # 启动fail2ban
    systemctl enable fail2ban
    systemctl start fail2ban
    
    # 配置SSH安全
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
    
    # SSH安全配置
    sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
    sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
    sed -i 's/#MaxAuthTries 6/MaxAuthTries 3/' /etc/ssh/sshd_config
    
    # 重启SSH服务
    systemctl restart sshd
    
    # 设置文件权限
    chmod 600 /etc/ssh/sshd_config
    chmod 700 /root/.ssh 2>/dev/null || true
    chmod 600 /root/.ssh/authorized_keys 2>/dev/null || true
    
    # 禁用不必要的服务
    systemctl disable cups 2>/dev/null || true
    systemctl disable avahi-daemon 2>/dev/null || true
    
    log_success "系统安全加固完成"
}

# 配置日志审计
configure_logging() {
    log_info "配置日志审计..."
    
    # 安装rsyslog
    dnf install -y rsyslog logrotate
    
    # 配置应用日志
    cat > /etc/rsyslog.d/diamond-website.conf << EOF
# Diamond Website CMS日志配置
:programname, isequal, "diamond-website" /var/log/diamond-website/app.log
& stop
EOF

    # 创建日志目录
    mkdir -p /var/log/diamond-website
    chown diamond:diamond /var/log/diamond-website
    
    # 配置日志轮转
    cat > /etc/logrotate.d/diamond-website << EOF
/var/log/diamond-website/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 diamond diamond
    postrotate
        systemctl reload diamond-website
    endscript
}

/var/log/nginx/diamond-website-*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 nginx nginx
    postrotate
        systemctl reload nginx
    endscript
}
EOF

    # 重启rsyslog
    systemctl restart rsyslog
    
    log_success "日志审计配置完成"
}

# 设置自动更新
configure_auto_updates() {
    log_info "配置自动安全更新..."
    
    # 安装dnf-automatic
    dnf install -y dnf-automatic
    
    # 配置自动更新
    sed -i 's/apply_updates = no/apply_updates = yes/' /etc/dnf/automatic.conf
    sed -i 's/upgrade_type = default/upgrade_type = security/' /etc/dnf/automatic.conf
    
    # 启用自动更新服务
    systemctl enable dnf-automatic.timer
    systemctl start dnf-automatic.timer
    
    log_success "自动安全更新配置完成"
}

# 创建安全监控脚本
create_monitoring_script() {
    log_info "创建安全监控脚本..."
    
    cat > /opt/diamond-website/scripts/security-monitor.sh << 'EOF'
#!/bin/bash

# 安全监控脚本
LOG_FILE="/var/log/diamond-website/security-monitor.log"

# 检查失败登录尝试
FAILED_LOGINS=$(journalctl --since "1 hour ago" | grep "Failed password" | wc -l)
if [ $FAILED_LOGINS -gt 10 ]; then
    echo "$(date): 警告 - 检测到 $FAILED_LOGINS 次失败登录尝试" >> $LOG_FILE
fi

# 检查磁盘使用率
DISK_USAGE=$(df / | awk 'NR==2{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$(date): 警告 - 磁盘使用率达到 $DISK_USAGE%" >> $LOG_FILE
fi

# 检查内存使用率
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEMORY_USAGE -gt 90 ]; then
    echo "$(date): 警告 - 内存使用率达到 $MEMORY_USAGE%" >> $LOG_FILE
fi

# 检查服务状态
if ! systemctl is-active --quiet diamond-website; then
    echo "$(date): 错误 - Diamond Website服务未运行" >> $LOG_FILE
fi

if ! systemctl is-active --quiet nginx; then
    echo "$(date): 错误 - Nginx服务未运行" >> $LOG_FILE
fi
EOF

    chmod +x /opt/diamond-website/scripts/security-monitor.sh
    chown diamond:diamond /opt/diamond-website/scripts/security-monitor.sh
    
    # 添加到crontab
    (crontab -l 2>/dev/null; echo "*/15 * * * * /opt/diamond-website/scripts/security-monitor.sh") | crontab -
    
    log_success "安全监控脚本创建完成"
}

# 显示安全配置信息
show_security_info() {
    echo
    echo "🔒 安全配置完成！"
    echo "================================================"
    echo "✅ 防火墙: 已启用并配置规则"
    echo "✅ SELinux: 已配置应用策略"
    echo "✅ Fail2ban: 已启用入侵防护"
    echo "✅ SSH: 已加固配置"
    echo "✅ 日志审计: 已配置轮转和监控"
    echo "✅ 自动更新: 已启用安全更新"
    echo "✅ 监控脚本: 已部署安全监控"
    echo
    echo "🔧 安全管理命令:"
    echo "   查看防火墙状态: firewall-cmd --list-all"
    echo "   查看fail2ban状态: fail2ban-client status"
    echo "   查看安全日志: tail -f /var/log/diamond-website/security-monitor.log"
    echo "   手动安全扫描: rkhunter --check"
    echo
    echo "⚠️  安全建议:"
    echo "   1. 定期更新系统和应用"
    echo "   2. 监控安全日志"
    echo "   3. 使用强密码和密钥认证"
    echo "   4. 定期备份重要数据"
    echo "   5. 限制不必要的网络访问"
    echo "================================================"
}

# 主函数
main() {
    echo "🔒 开始配置系统安全..."
    echo "================================================"
    
    check_root
    configure_firewall
    configure_selinux
    system_hardening
    configure_logging
    configure_auto_updates
    create_monitoring_script
    show_security_info
}

# 执行主函数
main "$@"
