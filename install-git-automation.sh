#!/bin/bash
# ===================================
# Git自动化解决方案 - 主安装脚本
# 一键安装和配置所有Git自动化功能
# ===================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}$message${NC}"
}

# 打印标题
print_title() {
    echo ""
    print_message $CYAN "=================================="
    print_message $CYAN "$1"
    print_message $CYAN "=================================="
    echo ""
}

# 显示欢迎信息
show_welcome() {
    clear
    print_message $PURPLE "
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║               🚀 Git自动化解决方案安装器                      ║
    ║                                                              ║
    ║              为 diamond-website-2025 项目定制                ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    "
    
    print_message $BLUE "✨ 功能特性:"
    echo "   🔍 智能代码检查和格式化"
    echo "   📝 规范化提交信息验证"
    echo "   🌿 智能分支管理"
    echo "   💾 自动备份和同步"
    echo "   🚀 CI/CD自动化流水线"
    echo "   ⚙️  Git配置优化"
    echo ""
    
    print_message $YELLOW "⚠️  注意事项:"
    echo "   • 请确保您在项目根目录运行此脚本"
    echo "   • 安装过程中可能需要输入用户信息"
    echo "   • 建议在安装前备份现有Git配置"
    echo ""
    
    read -p "按回车键继续安装，或按 Ctrl+C 取消..." -r
    echo ""
}

# 检查环境
check_environment() {
    print_title "🔍 环境检查"
    
    # 检查是否在Git仓库中
    if [ ! -d ".git" ]; then
        print_message $RED "❌ 当前目录不是Git仓库"
        print_message $YELLOW "💡 请在Git仓库根目录运行此脚本"
        exit 1
    fi
    
    print_message $GREEN "✅ Git仓库检查通过"
    
    # 检查Git版本
    if ! command -v git >/dev/null 2>&1; then
        print_message $RED "❌ Git未安装"
        exit 1
    fi
    
    git_version=$(git --version)
    print_message $GREEN "✅ Git版本: $git_version"
    
    # 检查Node.js（可选）
    if command -v node >/dev/null 2>&1; then
        node_version=$(node --version)
        print_message $GREEN "✅ Node.js版本: $node_version"
    else
        print_message $YELLOW "⚠️  Node.js未安装，部分功能可能受限"
    fi
    
    # 检查npm（可选）
    if command -v npm >/dev/null 2>&1; then
        npm_version=$(npm --version)
        print_message $GREEN "✅ npm版本: $npm_version"
    else
        print_message $YELLOW "⚠️  npm未安装，代码检查功能可能受限"
    fi
    
    print_message $BLUE "📊 环境检查完成"
}

# 设置文件权限
setup_permissions() {
    print_title "🔧 设置文件权限"
    
    # Git钩子文件
    if [ -d ".githooks" ]; then
        chmod +x .githooks/*.sh 2>/dev/null || true
        chmod +x .githooks/pre-commit 2>/dev/null || true
        chmod +x .githooks/pre-push 2>/dev/null || true
        chmod +x .githooks/commit-msg 2>/dev/null || true
        print_message $GREEN "✅ Git钩子权限设置完成"
    fi
    
    # 自动化脚本
    if [ -d "git-scripts" ]; then
        chmod +x git-scripts/*.sh 2>/dev/null || true
        print_message $GREEN "✅ 自动化脚本权限设置完成"
    fi
    
    print_message $BLUE "📊 文件权限设置完成"
}

# 安装Git钩子
install_git_hooks() {
    print_title "🎣 安装Git钩子"
    
    if [ -f ".githooks/install-hooks.sh" ]; then
        print_message $BLUE "🔧 正在安装Git钩子..."
        
        if ./.githooks/install-hooks.sh; then
            print_message $GREEN "✅ Git钩子安装成功"
            
            # 测试钩子
            print_message $BLUE "🧪 测试Git钩子..."
            if ./.githooks/test-hooks.sh; then
                print_message $GREEN "✅ Git钩子测试通过"
            else
                print_message $YELLOW "⚠️  Git钩子测试有警告，但可以继续使用"
            fi
        else
            print_message $RED "❌ Git钩子安装失败"
            return 1
        fi
    else
        print_message $YELLOW "⚠️  Git钩子安装脚本不存在"
    fi
}

# 配置Git环境
configure_git() {
    print_title "⚙️ 配置Git环境"
    
    if [ -f "git-scripts/setup-git-config.sh" ]; then
        print_message $BLUE "🔧 正在配置Git环境..."
        
        # 询问是否要配置用户信息
        read -p "是否要配置Git用户信息? (Y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            ./git-scripts/setup-git-config.sh -u
        fi
        
        # 配置全局设置
        print_message $BLUE "🌐 配置全局设置..."
        ./git-scripts/setup-git-config.sh -g
        
        # 配置项目设置
        print_message $BLUE "📁 配置项目设置..."
        ./git-scripts/setup-git-config.sh -l
        
        # 设置Git别名
        print_message $BLUE "🔧 设置Git别名..."
        ./git-scripts/setup-git-config.sh -a
        
        print_message $GREEN "✅ Git环境配置完成"
    else
        print_message $YELLOW "⚠️  Git配置脚本不存在"
    fi
}

# 安装开发依赖
install_dev_dependencies() {
    print_title "📦 安装开发依赖"
    
    if [ -f "package.json" ] && command -v npm >/dev/null 2>&1; then
        print_message $BLUE "📦 检查开发依赖..."
        
        # 检查是否需要安装prettier
        if ! npm list prettier >/dev/null 2>&1; then
            read -p "是否安装Prettier代码格式化工具? (Y/n): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Nn]$ ]]; then
                npm install --save-dev prettier
                print_message $GREEN "✅ Prettier安装完成"
            fi
        fi
        
        # 检查是否需要安装eslint
        if ! npm list eslint >/dev/null 2>&1; then
            read -p "是否安装ESLint代码检查工具? (Y/n): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Nn]$ ]]; then
                npm install --save-dev eslint
                print_message $GREEN "✅ ESLint安装完成"
            fi
        fi
        
        print_message $GREEN "✅ 开发依赖检查完成"
    else
        print_message $YELLOW "⚠️  跳过开发依赖安装（package.json不存在或npm未安装）"
    fi
}

# 创建配置文件
create_config_files() {
    print_title "📝 创建配置文件"
    
    # 创建Prettier配置
    if [ ! -f ".prettierrc" ]; then
        cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
EOF
        print_message $GREEN "✅ Prettier配置文件已创建"
    fi
    
    # 创建ESLint配置
    if [ ! -f ".eslintrc.js" ] && command -v npm >/dev/null 2>&1; then
        cat > .eslintrc.js << 'EOF'
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'warn',
    'prefer-const': 'error',
  },
};
EOF
        print_message $GREEN "✅ ESLint配置文件已创建"
    fi
    
    print_message $BLUE "📊 配置文件创建完成"
}

# 显示安装结果
show_installation_summary() {
    print_title "🎉 安装完成"
    
    print_message $GREEN "✅ Git自动化解决方案安装成功！"
    echo ""
    
    print_message $BLUE "📋 已安装的功能:"
    echo "   🎣 Git钩子 (pre-commit, pre-push, commit-msg)"
    echo "   🚀 一键提交脚本"
    echo "   🌿 分支管理脚本"
    echo "   💾 自动备份脚本"
    echo "   ⚙️  Git配置优化"
    echo "   🔧 开发工具配置"
    echo ""
    
    print_message $BLUE "🚀 快速开始:"
    echo "   # 一键提交"
    echo "   ./git-scripts/quick-commit.sh -a -p \"你的提交信息\""
    echo ""
    echo "   # 创建新分支"
    echo "   ./git-scripts/branch-manager.sh create feature/new-feature"
    echo ""
    echo "   # 创建备份"
    echo "   ./git-scripts/auto-backup.sh -c -r"
    echo ""
    echo "   # 查看Git配置"
    echo "   ./git-scripts/setup-git-config.sh -s"
    echo ""
    
    print_message $BLUE "📚 文档和帮助:"
    echo "   📖 完整指南: cat GIT_AUTOMATION_GUIDE.md"
    echo "   🔧 钩子配置: cat .git-hooks-config"
    echo "   ❓ 脚本帮助: ./git-scripts/[脚本名] --help"
    echo ""
    
    print_message $YELLOW "💡 建议下一步:"
    echo "   1. 阅读完整使用指南: GIT_AUTOMATION_GUIDE.md"
    echo "   2. 测试一次提交流程验证功能"
    echo "   3. 根据团队需求调整钩子配置"
    echo "   4. 设置定时备份任务"
    echo ""
    
    print_message $PURPLE "🎊 享受高效的Git工作流程！"
}

# 错误处理
handle_error() {
    print_message $RED "❌ 安装过程中发生错误"
    print_message $YELLOW "💡 请检查错误信息并重新运行安装脚本"
    print_message $BLUE "🔗 如需帮助，请查看 GIT_AUTOMATION_GUIDE.md"
    exit 1
}

# 设置错误处理
trap 'handle_error' ERR

# 主安装流程
main() {
    show_welcome
    check_environment
    setup_permissions
    install_git_hooks
    configure_git
    install_dev_dependencies
    create_config_files
    show_installation_summary
}

# 执行主流程
main "$@"

exit 0
