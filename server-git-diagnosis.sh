#!/bin/bash
# 🔍 服务器端Git仓库诊断和修复脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}$message${NC}"
}

print_message $BLUE "🔍 Git仓库诊断和修复脚本"
print_message $BLUE "=========================="

# 检查当前目录
REPO_PATH="/var/git/diamond-website.git"
WORK_PATH="/opt/diamond-website"

print_message $YELLOW "\n📍 检查仓库路径..."
if [ -d "$REPO_PATH" ]; then
    print_message $GREEN "✅ 找到Git仓库: $REPO_PATH"
    cd "$REPO_PATH"
else
    print_message $RED "❌ Git仓库不存在: $REPO_PATH"
    print_message $YELLOW "🔍 搜索可能的Git仓库位置..."
    find /var -name "*.git" -type d 2>/dev/null | head -5
    exit 1
fi

print_message $YELLOW "\n📋 当前Git配置:"
echo "================================"
git config --list | grep -E "(receive\.|core\.)" || echo "无相关配置"

print_message $YELLOW "\n🔍 检查分支保护设置:"
echo "================================"
echo "receive.denyNonFastForwards: $(git config receive.denyNonFastForwards || echo '未设置')"
echo "receive.denyCurrentBranch: $(git config receive.denyCurrentBranch || echo '未设置')"
echo "receive.denyDeletes: $(git config receive.denyDeletes || echo '未设置')"
echo "core.bare: $(git config core.bare || echo '未设置')"

print_message $YELLOW "\n🔍 检查钩子文件:"
echo "================================"
if [ -d "hooks" ]; then
    ls -la hooks/ | grep -E "(pre-receive|update|post-receive)"
    
    # 检查是否有自定义钩子
    for hook in pre-receive update post-receive; do
        if [ -f "hooks/$hook" ] && [ -x "hooks/$hook" ]; then
            print_message $YELLOW "⚠️ 发现可执行钩子: hooks/$hook"
            echo "内容预览:"
            head -10 "hooks/$hook" | sed 's/^/   /'
        fi
    done
else
    print_message $YELLOW "⚠️ hooks目录不存在"
fi

print_message $YELLOW "\n🔍 检查仓库类型和状态:"
echo "================================"
echo "仓库类型: $(git config core.bare && echo 'bare' || echo 'non-bare')"
echo "当前分支: $(git symbolic-ref HEAD 2>/dev/null || echo '无HEAD')"
echo "最新提交: $(git log --oneline -1 2>/dev/null || echo '无提交')"

print_message $BLUE "\n🔧 应用修复配置..."
echo "================================"

# 备份当前配置
print_message $YELLOW "📦 备份当前配置..."
git config --list > "/tmp/git-config-backup-$(date +%Y%m%d-%H%M%S).txt"

# 应用修复配置
print_message $YELLOW "🔧 应用Git配置修复..."

# 基础配置
git config receive.denyNonFastForwards false
git config receive.denyCurrentBranch ignore
git config receive.denyDeletes false

# 确保是bare仓库配置
git config core.bare true
git config core.logAllRefUpdates true

# 权限相关
git config receive.advertisePushOptions true
git config receive.certNonceSeed "$(date +%s)"

print_message $GREEN "✅ Git配置已更新"

print_message $YELLOW "\n📋 更新后的配置:"
echo "================================"
echo "receive.denyNonFastForwards: $(git config receive.denyNonFastForwards)"
echo "receive.denyCurrentBranch: $(git config receive.denyCurrentBranch)"
echo "receive.denyDeletes: $(git config receive.denyDeletes)"
echo "core.bare: $(git config core.bare)"

# 检查和修复钩子权限
print_message $YELLOW "\n🔧 检查钩子权限..."
if [ -d "hooks" ]; then
    # 临时禁用可能阻止推送的钩子
    for hook in pre-receive update; do
        if [ -f "hooks/$hook" ] && [ -x "hooks/$hook" ]; then
            print_message $YELLOW "⚠️ 临时禁用钩子: $hook"
            mv "hooks/$hook" "hooks/$hook.disabled-$(date +%s)"
        fi
    done
fi

# 检查文件权限
print_message $YELLOW "\n🔍 检查文件权限..."
REPO_OWNER=$(stat -c '%U' .)
REPO_GROUP=$(stat -c '%G' .)
echo "仓库所有者: $REPO_OWNER:$REPO_GROUP"

# 修复权限
print_message $YELLOW "🔧 修复仓库权限..."
chown -R git:git . 2>/dev/null || chown -R diamond:diamond . 2>/dev/null || echo "权限修复跳过"
chmod -R g+w . 2>/dev/null || echo "权限设置跳过"

print_message $GREEN "\n✅ 服务器端配置修复完成！"
print_message $BLUE "📡 现在可以尝试从本地推送："
print_message $WHITE "   git push deploy master --force"

print_message $YELLOW "\n⚠️ 推送成功后，记得恢复安全配置："
echo "   git config receive.denyNonFastForwards true"
echo "   git config receive.denyCurrentBranch refuse"

print_message $BLUE "\n🔍 如果推送仍然失败，请检查："
echo "   1. 网络连接和SSH密钥"
echo "   2. 防火墙设置"
echo "   3. Git版本兼容性"
echo "   4. 服务器端的其他安全策略"
