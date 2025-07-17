#!/bin/bash

# 🔧 自动修复端口配置问题脚本
# 专门解决PM2端口配置不一致的问题

echo "🔧 Diamond Website 端口问题自动修复工具"
echo "========================================"

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

log_step() {
    echo ""
    echo -e "${BLUE}🔄 步骤: $1${NC}"
    echo "----------------------------------------"
}

# 检查是否为root用户或有sudo权限
check_permissions() {
    if [ "$EUID" -eq 0 ]; then
        log_success "以root用户运行"
        return 0
    elif sudo -n true 2>/dev/null; then
        log_success "具有sudo权限"
        return 0
    else
        log_error "需要root权限或sudo权限来执行此脚本"
        echo "请使用: sudo $0"
        exit 1
    fi
}

# 步骤1: 停止所有相关进程
stop_all_processes() {
    log_step "停止所有相关进程"
    
    # 停止PM2进程
    if command -v pm2 &> /dev/null; then
        log_info "停止PM2进程..."
        pm2 delete diamond-website 2>/dev/null || true
        pm2 kill 2>/dev/null || true
        log_success "PM2进程已停止"
    fi
    
    # 停止所有Node.js进程
    log_info "停止所有Node.js进程..."
    pkill -f "node.*server.js" || true
    sleep 2
    
    # 强制终止占用3000和3001端口的进程
    for port in 3000 3001; do
        PID=$(lsof -ti:$port 2>/dev/null)
        if [ -n "$PID" ]; then
            log_warning "强制终止端口 $port 的进程 (PID: $PID)"
            kill -9 $PID 2>/dev/null || true
        fi
    done
    
    sleep 3
    log_success "所有相关进程已停止"
}

# 步骤2: 验证代码更新
verify_code_update() {
    log_step "验证代码更新"
    
    # 拉取最新代码
    log_info "拉取最新代码..."
    git fetch origin master
    git reset --hard origin/master
    
    # 验证server.js端口配置
    if grep -q "let PORT = process.env.PORT || 3001" server.js; then
        log_success "server.js 端口配置正确 (3001)"
    else
        log_error "server.js 端口配置错误，正在修复..."
        sed -i 's/let PORT = process.env.PORT || 3000/let PORT = process.env.PORT || 3001/' server.js
        log_success "server.js 端口配置已修复"
    fi
    
    # 确保.env文件存在且配置正确
    if [ ! -f ".env" ]; then
        log_info "创建.env文件..."
        cat > .env << 'EOF'
NODE_ENV=production
PORT=3001
TZ=Asia/Shanghai
NODE_TZ=Asia/Shanghai
EOF
        log_success ".env文件已创建"
    else
        # 更新现有.env文件的端口配置
        if grep -q "^PORT=" .env; then
            sed -i 's/^PORT=.*/PORT=3001/' .env
        else
            echo "PORT=3001" >> .env
        fi
        log_success ".env文件端口配置已更新"
    fi
}

# 步骤3: 配置PM2
configure_pm2() {
    log_step "配置PM2"
    
    # 确保PM2已安装
    if ! command -v pm2 &> /dev/null; then
        log_info "安装PM2..."
        npm install -g pm2
    fi
    
    # 确保ecosystem.config.js存在
    if [ ! -f "ecosystem.config.js" ]; then
        log_error "ecosystem.config.js 不存在，请确保文件已创建"
        return 1
    fi
    
    # 验证PM2配置文件
    if grep -q "PORT: 3001" ecosystem.config.js; then
        log_success "PM2配置文件端口设置正确"
    else
        log_warning "PM2配置文件可能需要更新"
    fi
    
    # 创建日志目录
    mkdir -p logs
    chown -R $(whoami):$(whoami) logs
    
    log_success "PM2配置完成"
}

# 步骤4: 启动服务
start_service() {
    log_step "启动服务"
    
    # 设置环境变量
    export NODE_ENV=production
    export PORT=3001
    export TZ=Asia/Shanghai
    export NODE_TZ=Asia/Shanghai
    
    log_info "环境变量设置:"
    echo "  NODE_ENV=$NODE_ENV"
    echo "  PORT=$PORT"
    echo "  TZ=$TZ"
    
    # 使用PM2启动服务
    log_info "使用PM2启动服务..."
    pm2 start ecosystem.config.js --env production
    
    # 保存PM2配置
    pm2 save
    
    # 设置PM2开机自启
    pm2 startup
    
    log_success "服务启动完成"
}

# 步骤5: 验证服务状态
verify_service() {
    log_step "验证服务状态"
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 5
    
    # 检查PM2状态
    log_info "PM2进程状态:"
    pm2 list
    
    # 检查端口监听
    if netstat -tuln | grep ":3001 " > /dev/null; then
        log_success "服务正在3001端口监听"
    else
        log_error "服务未在3001端口监听"
        log_info "当前端口监听状态:"
        netstat -tuln | grep ":300"
        return 1
    fi
    
    # 测试HTTP响应
    log_info "测试HTTP响应..."
    if curl -s --connect-timeout 5 http://localhost:3001 > /dev/null; then
        log_success "HTTP服务响应正常"
    else
        log_error "HTTP服务无响应"
        return 1
    fi
    
    # 显示服务日志
    log_info "最近的服务日志:"
    pm2 logs diamond-website --lines 10 --nostream
    
    log_success "服务验证完成"
}

# 步骤6: 更新Nginx配置（如果存在）
update_nginx() {
    log_step "更新Nginx配置"
    
    if systemctl is-active --quiet nginx; then
        log_info "检测到Nginx服务，重新加载配置..."
        
        # 检查Nginx配置文件
        NGINX_CONFIG="/etc/nginx/sites-available/diamond-website"
        if [ -f "$NGINX_CONFIG" ]; then
            # 更新upstream配置
            if grep -q "server 127.0.0.1:3000" "$NGINX_CONFIG"; then
                log_info "更新Nginx upstream配置..."
                sed -i 's/server 127.0.0.1:3000/server 127.0.0.1:3001/' "$NGINX_CONFIG"
                log_success "Nginx配置已更新"
            fi
        fi
        
        # 测试Nginx配置
        if nginx -t; then
            systemctl reload nginx
            log_success "Nginx配置重新加载完成"
        else
            log_error "Nginx配置测试失败"
        fi
    else
        log_info "Nginx服务未运行，跳过配置更新"
    fi
}

# 主执行流程
main() {
    echo "开始自动修复端口配置问题..."
    echo ""
    
    # 检查权限
    check_permissions
    
    # 执行修复步骤
    stop_all_processes
    verify_code_update
    configure_pm2
    start_service
    verify_service
    update_nginx
    
    echo ""
    echo "🎉 修复完成！"
    echo ""
    echo "📊 服务状态:"
    echo "   - 应用端口: 3001"
    echo "   - 域名: diamond-autopart.com"
    echo "   - 本地测试: http://localhost:3001"
    echo "   - 在线访问: https://diamond-autopart.com"
    echo ""
    echo "🔍 监控命令:"
    echo "   - 查看状态: pm2 status"
    echo "   - 查看日志: pm2 logs diamond-website"
    echo "   - 重启服务: pm2 restart diamond-website"
    echo "   - 查看端口: netstat -tuln | grep 3001"
    echo ""
    echo "如果问题仍然存在，请检查防火墙和域名DNS配置。"
}

# 执行主函数
main "$@"
