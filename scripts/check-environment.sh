#!/bin/bash

# 🔍 AlmaLinux 10 环境检查脚本
# 用于检查服务器是否满足Diamond Website CMS部署要求

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 检查系统版本
check_system() {
    log_info "检查系统版本..."
    
    if [ -f /etc/almalinux-release ]; then
        VERSION=$(cat /etc/almalinux-release)
        log_success "系统版本: $VERSION"
        
        # 检查是否为AlmaLinux 10
        if [[ $VERSION == *"AlmaLinux release 10"* ]]; then
            log_success "✅ AlmaLinux 10 检查通过"
        else
            log_warning "⚠️  建议使用AlmaLinux 10，当前版本可能存在兼容性问题"
        fi
    else
        log_error "❌ 不是AlmaLinux系统"
        exit 1
    fi
}

# 检查系统资源
check_resources() {
    log_info "检查系统资源..."
    
    # 检查内存
    MEMORY_GB=$(free -g | awk '/^Mem:/{print $2}')
    if [ $MEMORY_GB -ge 2 ]; then
        log_success "✅ 内存: ${MEMORY_GB}GB (推荐2GB+)"
    else
        log_warning "⚠️  内存不足: ${MEMORY_GB}GB (推荐2GB+)"
    fi
    
    # 检查磁盘空间
    DISK_GB=$(df -BG / | awk 'NR==2{print $4}' | sed 's/G//')
    if [ $DISK_GB -ge 10 ]; then
        log_success "✅ 磁盘空间: ${DISK_GB}GB 可用 (推荐10GB+)"
    else
        log_warning "⚠️  磁盘空间不足: ${DISK_GB}GB (推荐10GB+)"
    fi
    
    # 检查CPU核心数
    CPU_CORES=$(nproc)
    log_success "✅ CPU核心数: $CPU_CORES"
}

# 检查网络连接
check_network() {
    log_info "检查网络连接..."
    
    if ping -c 1 google.com &> /dev/null; then
        log_success "✅ 网络连接正常"
    else
        log_error "❌ 网络连接失败"
        exit 1
    fi
    
    # 检查GitHub连接
    if ping -c 1 github.com &> /dev/null; then
        log_success "✅ GitHub连接正常"
    else
        log_warning "⚠️  GitHub连接可能有问题"
    fi
}

# 检查必需的软件包
check_packages() {
    log_info "检查必需的软件包..."
    
    # 检查Git
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version)
        log_success "✅ Git已安装: $GIT_VERSION"
    else
        log_warning "⚠️  Git未安装，将在部署时安装"
    fi
    
    # 检查Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_success "✅ Node.js已安装: $NODE_VERSION"
        
        # 检查版本是否满足要求
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ $NODE_MAJOR -ge 18 ]; then
            log_success "✅ Node.js版本满足要求 (需要18+)"
        else
            log_warning "⚠️  Node.js版本过低: $NODE_VERSION (需要18+)"
        fi
    else
        log_warning "⚠️  Node.js未安装，将在部署时安装"
    fi
    
    # 检查npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        log_success "✅ npm已安装: $NPM_VERSION"
    else
        log_warning "⚠️  npm未安装，将在部署时安装"
    fi
}

# 检查端口占用
check_ports() {
    log_info "检查端口占用情况..."
    
    PORTS=(3000 80 443)
    for PORT in "${PORTS[@]}"; do
        if netstat -tuln | grep ":$PORT " &> /dev/null; then
            log_warning "⚠️  端口 $PORT 已被占用"
        else
            log_success "✅ 端口 $PORT 可用"
        fi
    done
}

# 检查防火墙状态
check_firewall() {
    log_info "检查防火墙状态..."
    
    if systemctl is-active --quiet firewalld; then
        log_success "✅ firewalld 正在运行"
    else
        log_warning "⚠️  firewalld 未运行，建议启用"
    fi
}

# 检查SELinux状态
check_selinux() {
    log_info "检查SELinux状态..."
    
    if command -v getenforce &> /dev/null; then
        SELINUX_STATUS=$(getenforce)
        log_success "✅ SELinux状态: $SELINUX_STATUS"
    else
        log_warning "⚠️  SELinux工具未安装"
    fi
}

# 主函数
main() {
    echo "🔍 开始检查AlmaLinux 10服务器环境..."
    echo "================================================"
    
    check_system
    echo
    
    check_resources
    echo
    
    check_network
    echo
    
    check_packages
    echo
    
    check_ports
    echo
    
    check_firewall
    echo
    
    check_selinux
    echo
    
    echo "================================================"
    log_success "🎉 环境检查完成！"
    echo
    log_info "💡 如果有警告项目，建议在部署前解决"
    log_info "🚀 准备就绪后，请运行部署脚本: ./scripts/deploy.sh"
}

# 执行主函数
main
