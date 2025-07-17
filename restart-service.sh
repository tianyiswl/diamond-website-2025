#!/bin/bash

# 🚀 钻石网站服务重启脚本
# 确保服务在正确的端口(3001)上运行

echo "🔄 重启钻石网站服务..."

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    log_error "请使用root权限运行此脚本"
    echo "使用方法: sudo $0"
    exit 1
fi

# 停止现有的Node.js进程
log_info "停止现有的Node.js进程..."
pkill -f "node.*server.js" || true
sleep 2

# 检查3000端口进程并终止
if netstat -tuln | grep ":3000 " > /dev/null; then
    log_warning "发现3000端口仍有进程，正在终止..."
    fuser -k 3000/tcp || true
    sleep 1
fi

# 检查3001端口进程并终止
if netstat -tuln | grep ":3001 " > /dev/null; then
    log_warning "发现3001端口有进程，正在终止..."
    fuser -k 3001/tcp || true
    sleep 1
fi

# 重新加载systemd配置
log_info "重新加载systemd配置..."
systemctl daemon-reload

# 重启服务
log_info "重启diamond-website服务..."
systemctl restart diamond-website

# 等待服务启动
log_info "等待服务启动..."
sleep 5

# 检查服务状态
if systemctl is-active --quiet diamond-website; then
    log_success "服务启动成功"
else
    log_error "服务启动失败"
    systemctl status diamond-website
    exit 1
fi

# 检查端口监听
log_info "检查端口监听状态..."
if netstat -tuln | grep ":3001 " > /dev/null; then
    log_success "服务正在3001端口监听"
else
    log_error "服务未在3001端口监听"
    netstat -tuln | grep ":300"
    exit 1
fi

# 测试服务响应
log_info "测试服务响应..."
if curl -s http://localhost:3001 > /dev/null; then
    log_success "服务响应正常"
else
    log_error "服务响应异常"
    exit 1
fi

# 重启Nginx（如果存在）
if systemctl is-active --quiet nginx; then
    log_info "重启Nginx服务..."
    systemctl reload nginx
    log_success "Nginx重启完成"
fi

echo ""
log_success "🎉 服务重启完成！"
echo ""
echo "📊 服务状态:"
echo "   - 应用端口: 3001"
echo "   - 域名: diamond-autopart.com"
echo "   - 本地测试: http://localhost:3001"
echo "   - 在线访问: https://diamond-autopart.com"
echo ""
echo "🔍 检查命令:"
echo "   - 查看状态: systemctl status diamond-website"
echo "   - 查看日志: journalctl -u diamond-website -f"
echo "   - 查看端口: netstat -tuln | grep 3001"
