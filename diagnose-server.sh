#!/bin/bash

# 🔍 服务器端口配置诊断脚本
# 专门用于诊断PM2和端口配置问题

echo "🔍 Diamond Website 服务器诊断工具"
echo "=================================="

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

log_section() {
    echo ""
    echo -e "${BLUE}📋 $1${NC}"
    echo "----------------------------------------"
}

# 1. 检查Git状态
log_section "Git 仓库状态"
if [ -d ".git" ]; then
    log_info "当前分支: $(git branch --show-current)"
    log_info "最新提交: $(git log --oneline -1)"
    
    # 检查是否有未提交的更改
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "发现未提交的更改:"
        git status --short
    else
        log_success "工作目录干净，无未提交更改"
    fi
    
    # 检查是否与远程同步
    git fetch origin master 2>/dev/null
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/master)
    
    if [ "$LOCAL" = "$REMOTE" ]; then
        log_success "本地代码与远程仓库同步"
    else
        log_warning "本地代码与远程仓库不同步"
        echo "  本地: $LOCAL"
        echo "  远程: $REMOTE"
    fi
else
    log_error "不是Git仓库"
fi

# 2. 检查关键文件的端口配置
log_section "端口配置检查"

# 检查server.js
if [ -f "server.js" ]; then
    PORT_LINE=$(grep "let PORT = process.env.PORT" server.js)
    log_info "server.js 端口配置: $PORT_LINE"
    
    if echo "$PORT_LINE" | grep -q "3001"; then
        log_success "server.js 默认端口配置正确 (3001)"
    else
        log_error "server.js 默认端口配置错误"
    fi
else
    log_error "server.js 文件不存在"
fi

# 检查.env文件
if [ -f ".env" ]; then
    ENV_PORT=$(grep "^PORT=" .env | cut -d'=' -f2)
    log_info ".env 端口配置: PORT=$ENV_PORT"
    
    if [ "$ENV_PORT" = "3001" ]; then
        log_success ".env 端口配置正确 (3001)"
    else
        log_warning ".env 端口配置: $ENV_PORT"
    fi
else
    log_warning ".env 文件不存在"
fi

# 检查ecosystem.config.js
if [ -f "ecosystem.config.js" ]; then
    log_success "PM2 配置文件存在"
    PM2_PORT=$(grep -A 10 "env:" ecosystem.config.js | grep "PORT:" | head -1 | awk '{print $2}' | tr -d ',')
    log_info "PM2 配置端口: $PM2_PORT"
else
    log_warning "PM2 配置文件不存在"
fi

# 3. 检查当前运行的进程
log_section "进程状态检查"

# 检查PM2进程
if command -v pm2 &> /dev/null; then
    log_info "PM2 进程列表:"
    pm2 list
    
    # 检查diamond-website进程
    if pm2 list | grep -q "diamond-website"; then
        log_success "发现 diamond-website PM2 进程"
        
        # 显示进程详细信息
        log_info "进程详细信息:"
        pm2 show diamond-website
        
        # 显示环境变量
        log_info "进程环境变量:"
        pm2 env diamond-website | grep -E "(PORT|NODE_ENV|TZ)"
        
    else
        log_warning "未发现 diamond-website PM2 进程"
    fi
else
    log_error "PM2 未安装"
fi

# 检查Node.js进程
log_info "Node.js 进程:"
ps aux | grep node | grep -v grep

# 4. 检查端口占用情况
log_section "端口占用检查"

# 检查3000和3001端口
for port in 3000 3001; do
    if netstat -tuln | grep ":$port " > /dev/null; then
        PROCESS=$(lsof -ti:$port 2>/dev/null)
        if [ -n "$PROCESS" ]; then
            PROCESS_INFO=$(ps -p $PROCESS -o pid,ppid,cmd --no-headers 2>/dev/null)
            log_warning "端口 $port 被占用 - PID: $PROCESS"
            echo "  进程信息: $PROCESS_INFO"
        else
            log_warning "端口 $port 被占用但无法获取进程信息"
        fi
    else
        log_info "端口 $port 空闲"
    fi
done

# 5. 检查系统环境变量
log_section "环境变量检查"
log_info "当前用户: $(whoami)"
log_info "工作目录: $(pwd)"
log_info "NODE_ENV: ${NODE_ENV:-未设置}"
log_info "PORT: ${PORT:-未设置}"
log_info "TZ: ${TZ:-未设置}"

# 6. 检查日志文件
log_section "日志文件检查"
if [ -d "logs" ]; then
    log_success "日志目录存在"
    ls -la logs/
    
    # 显示最近的错误日志
    if [ -f "logs/error.log" ]; then
        log_info "最近的错误日志 (最后10行):"
        tail -10 logs/error.log
    fi
else
    log_warning "日志目录不存在"
fi

# 7. 网络连接测试
log_section "网络连接测试"
for port in 3000 3001; do
    if curl -s --connect-timeout 3 http://localhost:$port > /dev/null; then
        log_success "端口 $port 可以访问"
        
        # 获取服务器响应信息
        RESPONSE=$(curl -s http://localhost:$port | head -5)
        echo "  响应预览: ${RESPONSE:0:100}..."
    else
        log_info "端口 $port 无法访问"
    fi
done

# 8. 生成修复建议
log_section "修复建议"

echo "基于诊断结果，建议执行以下操作："
echo ""
echo "1. 🔄 重启PM2进程:"
echo "   pm2 delete diamond-website"
echo "   pm2 start ecosystem.config.js --env production"
echo ""
echo "2. 🔍 检查进程状态:"
echo "   pm2 list"
echo "   pm2 logs diamond-website"
echo ""
echo "3. 🌐 测试端口访问:"
echo "   curl http://localhost:3001"
echo "   netstat -tuln | grep 3001"
echo ""
echo "4. 📊 监控日志:"
echo "   pm2 logs diamond-website --lines 50"
echo ""

echo "🎯 如果问题仍然存在，请运行以下命令获取更多信息："
echo "   ./fix-port-issue.sh"
