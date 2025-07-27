#!/bin/bash

# 🔍 检查服务器操作系统脚本
# 无锡皇德国际贸易有限公司

SERVER_IP="167.88.43.193"
SERVER_USER="root"

echo "🔍 检查服务器操作系统和环境"
echo "服务器: $SERVER_IP"
echo "=========================================="

ssh $SERVER_USER@$SERVER_IP << 'EOF'
#!/bin/bash

echo "🖥️ 系统信息:"
echo "主机名: $(hostname)"
echo "内核: $(uname -r)"
echo "架构: $(uname -m)"
echo ""

echo "📋 操作系统详情:"
if [ -f /etc/os-release ]; then
    cat /etc/os-release
elif [ -f /etc/redhat-release ]; then
    echo "RedHat系列: $(cat /etc/redhat-release)"
elif [ -f /etc/debian_version ]; then
    echo "Debian系列: $(cat /etc/debian_version)"
else
    echo "未知操作系统"
fi
echo ""

echo "📦 包管理器检测:"
if command -v yum &> /dev/null; then
    echo "✅ yum (RedHat/CentOS)"
    yum --version | head -1
elif command -v dnf &> /dev/null; then
    echo "✅ dnf (Fedora/Rocky/AlmaLinux)"
    dnf --version | head -1
elif command -v apt &> /dev/null; then
    echo "✅ apt (Debian/Ubuntu)"
    apt --version | head -1
elif command -v zypper &> /dev/null; then
    echo "✅ zypper (openSUSE)"
    zypper --version | head -1
else
    echo "❌ 未检测到支持的包管理器"
fi
echo ""

echo "🔍 已安装软件检查:"
echo -n "Node.js: "
node --version 2>/dev/null || echo "未安装"

echo -n "npm: "
npm --version 2>/dev/null || echo "未安装"

echo -n "PM2: "
pm2 --version 2>/dev/null || echo "未安装"

echo -n "PostgreSQL: "
psql --version 2>/dev/null || echo "未安装"

echo -n "Git: "
git --version 2>/dev/null || echo "未安装"

echo -n "curl: "
curl --version 2>/dev/null | head -1 || echo "未安装"

echo -n "wget: "
wget --version 2>/dev/null | head -1 || echo "未安装"
echo ""

echo "🔥 防火墙状态:"
if command -v firewall-cmd &> /dev/null; then
    echo "防火墙类型: firewalld"
    systemctl is-active firewalld 2>/dev/null || echo "firewalld 未运行"
elif command -v ufw &> /dev/null; then
    echo "防火墙类型: ufw"
    ufw status 2>/dev/null || echo "ufw 未配置"
elif command -v iptables &> /dev/null; then
    echo "防火墙类型: iptables"
    iptables -L 2>/dev/null | head -5 || echo "iptables 无法访问"
else
    echo "未检测到防火墙"
fi
echo ""

echo "💾 磁盘空间:"
df -h | head -5
echo ""

echo "🧠 内存信息:"
free -h
echo ""

echo "🌐 网络配置:"
ip addr show | grep -E "inet.*global" | head -3
echo ""

echo "📁 目录检查:"
echo "/var/www/ 目录:"
ls -la /var/www/ 2>/dev/null || echo "目录不存在"
echo ""

echo "🔧 系统服务:"
echo "PostgreSQL: $(systemctl is-active postgresql 2>/dev/null || echo '未安装/未启动')"
echo "Nginx: $(systemctl is-active nginx 2>/dev/null || echo '未安装/未启动')"
echo "Apache: $(systemctl is-active httpd 2>/dev/null || systemctl is-active apache2 2>/dev/null || echo '未安装/未启动')"
EOF

echo ""
echo "✅ 服务器检查完成"
echo ""
echo "💡 根据检查结果，我将为您提供适合的部署方案"
