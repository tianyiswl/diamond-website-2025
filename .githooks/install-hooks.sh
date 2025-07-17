#!/bin/bash
# ===================================
# Git自动化解决方案 - 钩子安装脚本
# 自动安装和配置Git钩子
# ===================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}$message${NC}"
}

print_message $BLUE "🚀 开始安装Git钩子..."

# 检查是否在Git仓库中
if [ ! -d ".git" ]; then
    print_message $RED "❌ 当前目录不是Git仓库"
    print_message $YELLOW "💡 请在Git仓库根目录运行此脚本"
    exit 1
fi

# 创建钩子目录
HOOKS_DIR=".git/hooks"
CUSTOM_HOOKS_DIR=".githooks"

print_message $BLUE "📁 检查钩子目录..."

if [ ! -d "$HOOKS_DIR" ]; then
    print_message $RED "❌ Git钩子目录不存在: $HOOKS_DIR"
    exit 1
fi

if [ ! -d "$CUSTOM_HOOKS_DIR" ]; then
    print_message $RED "❌ 自定义钩子目录不存在: $CUSTOM_HOOKS_DIR"
    print_message $YELLOW "💡 请确保 $CUSTOM_HOOKS_DIR 目录存在并包含钩子文件"
    exit 1
fi

# 钩子文件列表
HOOK_FILES=("pre-commit" "pre-push" "commit-msg")

print_message $BLUE "🔧 安装钩子文件..."

# 备份现有钩子
backup_dir=".git/hooks-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$backup_dir"

for hook in "${HOOK_FILES[@]}"; do
    source_file="$CUSTOM_HOOKS_DIR/$hook"
    target_file="$HOOKS_DIR/$hook"
    
    print_message $BLUE "📋 处理钩子: $hook"
    
    # 检查源文件是否存在
    if [ ! -f "$source_file" ]; then
        print_message $YELLOW "⚠️  源文件不存在: $source_file"
        continue
    fi
    
    # 备份现有钩子
    if [ -f "$target_file" ]; then
        print_message $YELLOW "💾 备份现有钩子: $target_file"
        cp "$target_file" "$backup_dir/$hook.backup"
    fi
    
    # 复制新钩子
    cp "$source_file" "$target_file"
    
    # 设置执行权限
    chmod +x "$target_file"
    
    print_message $GREEN "✅ 已安装: $hook"
done

print_message $BLUE "⚙️  配置Git钩子路径..."

# 设置Git钩子路径（可选，使用自定义目录）
git config core.hooksPath "$CUSTOM_HOOKS_DIR"

print_message $GREEN "✅ Git钩子路径已设置为: $CUSTOM_HOOKS_DIR"

# 验证钩子安装
print_message $BLUE "🔍 验证钩子安装..."

for hook in "${HOOK_FILES[@]}"; do
    target_file="$HOOKS_DIR/$hook"
    
    if [ -f "$target_file" ] && [ -x "$target_file" ]; then
        print_message $GREEN "✅ $hook: 已安装且可执行"
    else
        print_message $RED "❌ $hook: 安装失败或不可执行"
    fi
done

# 创建钩子配置文件
print_message $BLUE "📝 创建钩子配置文件..."

cat > .git-hooks-config << 'EOF'
# Git钩子配置文件
# 安装时间: $(date '+%Y-%m-%d %H:%M:%S')

# 钩子状态
PRE_COMMIT_ENABLED=true
PRE_PUSH_ENABLED=true
COMMIT_MSG_ENABLED=true

# 检查配置
SYNTAX_CHECK=true
FORMAT_CHECK=true
SECURITY_CHECK=true
TEST_RUN=true

# 文件大小限制 (字节)
MAX_FILE_SIZE=5242880

# 提交信息配置
MIN_COMMIT_MSG_LENGTH=10
MAX_COMMIT_MSG_LENGTH=72
REQUIRE_CONVENTIONAL_COMMITS=false

# 分支保护
PROTECTED_BRANCHES="main,master,production,release"

# 自动格式化
AUTO_FORMAT=true
AUTO_FIX=false

# 日志配置
LOG_LEVEL=INFO
LOG_RETENTION_DAYS=30
EOF

print_message $GREEN "✅ 配置文件已创建: .git-hooks-config"

# 创建钩子测试脚本
print_message $BLUE "🧪 创建钩子测试脚本..."

cat > .githooks/test-hooks.sh << 'EOF'
#!/bin/bash
# Git钩子测试脚本

echo "🧪 测试Git钩子..."

# 测试pre-commit钩子
echo "📝 测试 pre-commit 钩子..."
if [ -f ".githooks/pre-commit" ]; then
    echo "创建测试文件..."
    echo "console.log('test');" > test-file.js
    git add test-file.js
    
    if .githooks/pre-commit; then
        echo "✅ pre-commit 钩子测试通过"
    else
        echo "❌ pre-commit 钩子测试失败"
    fi
    
    git reset HEAD test-file.js
    rm -f test-file.js
fi

# 测试commit-msg钩子
echo "📝 测试 commit-msg 钩子..."
if [ -f ".githooks/commit-msg" ]; then
    echo "feat: 测试提交信息" > test-commit-msg
    
    if .githooks/commit-msg test-commit-msg; then
        echo "✅ commit-msg 钩子测试通过"
    else
        echo "❌ commit-msg 钩子测试失败"
    fi
    
    rm -f test-commit-msg
fi

echo "🎉 钩子测试完成"
EOF

chmod +x .githooks/test-hooks.sh

print_message $GREEN "✅ 测试脚本已创建: .githooks/test-hooks.sh"

# 创建卸载脚本
print_message $BLUE "🗑️  创建卸载脚本..."

cat > .githooks/uninstall-hooks.sh << 'EOF'
#!/bin/bash
# Git钩子卸载脚本

echo "🗑️  开始卸载Git钩子..."

HOOKS_DIR=".git/hooks"
HOOK_FILES=("pre-commit" "pre-push" "commit-msg")

for hook in "${HOOK_FILES[@]}"; do
    target_file="$HOOKS_DIR/$hook"
    
    if [ -f "$target_file" ]; then
        echo "删除钩子: $hook"
        rm "$target_file"
    fi
done

# 恢复Git钩子路径
git config --unset core.hooksPath 2>/dev/null || true

# 删除配置文件
rm -f .git-hooks-config

echo "✅ Git钩子已卸载"
EOF

chmod +x .githooks/uninstall-hooks.sh

print_message $GREEN "✅ 卸载脚本已创建: .githooks/uninstall-hooks.sh"

# 显示安装总结
print_message $GREEN "🎉 Git钩子安装完成！"
print_message $BLUE "📋 安装总结:"
echo "   - 已安装钩子: ${#HOOK_FILES[@]} 个"
echo "   - 备份目录: $backup_dir"
echo "   - 配置文件: .git-hooks-config"
echo "   - 测试脚本: .githooks/test-hooks.sh"
echo "   - 卸载脚本: .githooks/uninstall-hooks.sh"

print_message $BLUE "🚀 使用说明:"
echo "   - 运行测试: ./githooks/test-hooks.sh"
echo "   - 卸载钩子: ./githooks/uninstall-hooks.sh"
echo "   - 查看配置: cat .git-hooks-config"

print_message $YELLOW "💡 提示:"
echo "   - 钩子将在下次提交时自动运行"
echo "   - 可以通过修改 .git-hooks-config 调整配置"
echo "   - 如遇问题，请查看日志文件"

exit 0
EOF

chmod +x .githooks/install-hooks.sh

print_message $GREEN "✅ 钩子安装脚本已创建"
