#!/bin/bash
# ===================================
# Git自动化解决方案 - Git配置优化脚本
# 设置Git别名、全局配置和项目级别配置
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

# 显示使用说明
show_usage() {
    echo "Git配置优化脚本"
    echo ""
    echo "使用方法:"
    echo "  $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -g, --global       配置全局Git设置"
    echo "  -l, --local        配置项目级别设置"
    echo "  -a, --aliases      设置Git别名"
    echo "  -u, --user         配置用户信息"
    echo "  -s, --show         显示当前配置"
    echo "  -r, --reset        重置为默认配置"
    echo "  --all              执行所有配置"
    echo "  -h, --help         显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 --all           # 执行完整配置"
    echo "  $0 -g -a           # 配置全局设置和别名"
    echo "  $0 -u              # 配置用户信息"
    echo "  $0 -s              # 显示当前配置"
}

# 默认参数
SETUP_GLOBAL=false
SETUP_LOCAL=false
SETUP_ALIASES=false
SETUP_USER=false
SHOW_CONFIG=false
RESET_CONFIG=false
SETUP_ALL=false

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -g|--global)
            SETUP_GLOBAL=true
            shift
            ;;
        -l|--local)
            SETUP_LOCAL=true
            shift
            ;;
        -a|--aliases)
            SETUP_ALIASES=true
            shift
            ;;
        -u|--user)
            SETUP_USER=true
            shift
            ;;
        -s|--show)
            SHOW_CONFIG=true
            shift
            ;;
        -r|--reset)
            RESET_CONFIG=true
            shift
            ;;
        --all)
            SETUP_ALL=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        -*)
            print_message $RED "❌ 未知选项: $1"
            show_usage
            exit 1
            ;;
        *)
            print_message $RED "❌ 未知参数: $1"
            show_usage
            exit 1
            ;;
    esac
done

print_message $BLUE "⚙️  Git配置优化脚本启动..."

# 检查Git是否安装
if ! command -v git >/dev/null 2>&1; then
    print_message $RED "❌ Git未安装，请先安装Git"
    exit 1
fi

print_message $BLUE "📋 当前Git版本: $(git --version)"

# 显示当前配置
show_current_config() {
    print_message $BLUE "📊 当前Git配置:"
    
    echo ""
    print_message $BLUE "👤 用户信息:"
    echo "   姓名: $(git config user.name 2>/dev/null || echo "未设置")"
    echo "   邮箱: $(git config user.email 2>/dev/null || echo "未设置")"
    
    echo ""
    print_message $BLUE "🌐 全局配置:"
    echo "   编辑器: $(git config core.editor 2>/dev/null || echo "默认")"
    echo "   换行符: $(git config core.autocrlf 2>/dev/null || echo "默认")"
    echo "   文件权限: $(git config core.filemode 2>/dev/null || echo "默认")"
    echo "   默认分支: $(git config init.defaultBranch 2>/dev/null || echo "默认")"
    
    echo ""
    print_message $BLUE "🔧 别名配置:"
    git config --get-regexp alias 2>/dev/null | sed 's/alias\./   /' || echo "   无别名配置"
    
    if [ -d ".git" ]; then
        echo ""
        print_message $BLUE "📁 项目配置:"
        echo "   钩子路径: $(git config core.hooksPath 2>/dev/null || echo "默认")"
        echo "   忽略文件: $(git config core.excludesfile 2>/dev/null || echo "默认")"
    fi
}

# 配置用户信息
setup_user_config() {
    print_message $BLUE "👤 配置用户信息..."
    
    current_name=$(git config user.name 2>/dev/null || echo "")
    current_email=$(git config user.email 2>/dev/null || echo "")
    
    if [ -n "$current_name" ] && [ -n "$current_email" ]; then
        print_message $GREEN "✅ 当前用户信息:"
        echo "   姓名: $current_name"
        echo "   邮箱: $current_email"
        
        read -p "是否要更新用户信息? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 0
        fi
    fi
    
    # 输入用户名
    while true; do
        read -p "请输入您的姓名: " user_name
        if [ -n "$user_name" ]; then
            break
        fi
        print_message $YELLOW "⚠️  姓名不能为空"
    done
    
    # 输入邮箱
    while true; do
        read -p "请输入您的邮箱: " user_email
        if [[ "$user_email" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
            break
        fi
        print_message $YELLOW "⚠️  请输入有效的邮箱地址"
    done
    
    # 设置用户信息
    git config --global user.name "$user_name"
    git config --global user.email "$user_email"
    
    print_message $GREEN "✅ 用户信息配置完成"
    echo "   姓名: $user_name"
    echo "   邮箱: $user_email"
}

# 配置全局设置
setup_global_config() {
    print_message $BLUE "🌐 配置全局Git设置..."
    
    # 基础配置
    print_message $BLUE "📝 设置基础配置..."
    
    # 设置默认编辑器
    if command -v code >/dev/null 2>&1; then
        git config --global core.editor "code --wait"
        print_message $GREEN "✅ 编辑器设置为: VS Code"
    elif command -v vim >/dev/null 2>&1; then
        git config --global core.editor "vim"
        print_message $GREEN "✅ 编辑器设置为: Vim"
    else
        print_message $YELLOW "⚠️  未找到合适的编辑器，使用默认设置"
    fi
    
    # 换行符处理
    case "$(uname -s)" in
        MINGW*|CYGWIN*|MSYS*)
            git config --global core.autocrlf true
            print_message $GREEN "✅ Windows环境: 自动转换换行符"
            ;;
        *)
            git config --global core.autocrlf input
            print_message $GREEN "✅ Unix/Linux环境: 输入时转换换行符"
            ;;
    esac
    
    # 其他基础配置
    git config --global core.filemode false
    git config --global init.defaultBranch main
    git config --global pull.rebase false
    git config --global push.default simple
    git config --global merge.tool vimdiff
    
    print_message $GREEN "✅ 基础配置完成"
    
    # 高级配置
    print_message $BLUE "🔧 设置高级配置..."
    
    # 性能优化
    git config --global core.preloadindex true
    git config --global core.fscache true
    git config --global gc.auto 256
    
    # 安全配置
    git config --global transfer.fsckobjects true
    git config --global fetch.fsckobjects true
    git config --global receive.fsckObjects true
    
    # 颜色配置
    git config --global color.ui auto
    git config --global color.branch auto
    git config --global color.diff auto
    git config --global color.status auto
    
    # 差异和合并配置
    git config --global diff.algorithm patience
    git config --global merge.conflictstyle diff3
    
    print_message $GREEN "✅ 高级配置完成"
}

# 配置项目级别设置
setup_local_config() {
    print_message $BLUE "📁 配置项目级别设置..."
    
    if [ ! -d ".git" ]; then
        print_message $YELLOW "⚠️  当前目录不是Git仓库，跳过项目配置"
        return 0
    fi
    
    # 设置钩子路径
    git config core.hooksPath .githooks
    print_message $GREEN "✅ 钩子路径设置为: .githooks"
    
    # 设置忽略文件
    if [ -f ".gitignore" ]; then
        git config core.excludesfile .gitignore
        print_message $GREEN "✅ 忽略文件设置为: .gitignore"
    fi
    
    # 项目特定配置
    git config core.autocrlf false
    git config core.safecrlf false
    
    # 设置提交模板
    if [ -f ".gitmessage-template" ]; then
        git config commit.template .gitmessage-template
        print_message $GREEN "✅ 提交模板设置为: .gitmessage-template"
    fi
    
    print_message $GREEN "✅ 项目配置完成"
}

# 设置Git别名
setup_git_aliases() {
    print_message $BLUE "🔧 设置Git别名..."
    
    # 基础别名
    print_message $BLUE "📝 设置基础别名..."
    
    git config --global alias.st status
    git config --global alias.co checkout
    git config --global alias.br branch
    git config --global alias.ci commit
    git config --global alias.df diff
    git config --global alias.lg log
    
    # 高级别名
    print_message $BLUE "🚀 设置高级别名..."
    
    # 美化的日志
    git config --global alias.lol "log --oneline --graph --decorate --all"
    git config --global alias.lola "log --oneline --graph --decorate --all --abbrev-commit"
    git config --global alias.hist "log --pretty=format:'%h %ad | %s%d [%an]' --graph --date=short"
    
    # 状态和差异
    git config --global alias.s "status -s"
    git config --global alias.d "diff --color-words"
    git config --global alias.dc "diff --cached"
    
    # 分支操作
    git config --global alias.bra "branch -a"
    git config --global alias.brd "branch -d"
    git config --global alias.brD "branch -D"
    
    # 提交操作
    git config --global alias.cm "commit -m"
    git config --global alias.ca "commit -am"
    git config --global alias.amend "commit --amend"
    
    # 推送和拉取
    git config --global alias.ps "push"
    git config --global alias.pl "pull"
    git config --global alias.pso "push origin"
    git config --global alias.plo "pull origin"
    
    # 重置和清理
    git config --global alias.unstage "reset HEAD --"
    git config --global alias.last "log -1 HEAD"
    git config --global alias.visual "!gitk"
    
    # 高级操作
    git config --global alias.alias "config --get-regexp alias"
    git config --global alias.remotes "remote -v"
    git config --global alias.tags "tag -l"
    
    # 自动化脚本别名
    git config --global alias.quick "!bash git-scripts/quick-commit.sh"
    git config --global alias.branch-mgr "!bash git-scripts/branch-manager.sh"
    git config --global alias.backup "!bash git-scripts/auto-backup.sh"
    
    print_message $GREEN "✅ Git别名设置完成"
    
    # 显示设置的别名
    print_message $BLUE "📋 已设置的别名:"
    git config --get-regexp alias | sed 's/alias\./   /'
}

# 重置配置
reset_git_config() {
    print_message $BLUE "🔄 重置Git配置..."
    
    read -p "确认要重置所有Git配置吗? 这将删除所有自定义设置 (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_message $YELLOW "操作已取消"
        return 0
    fi
    
    # 备份当前配置
    backup_file="git-config-backup-$(date +%Y%m%d-%H%M%S).txt"
    git config --list > "$backup_file" 2>/dev/null || true
    print_message $GREEN "✅ 当前配置已备份到: $backup_file"
    
    # 重置全局配置
    print_message $BLUE "🔄 重置全局配置..."
    
    # 删除所有别名
    git config --global --remove-section alias 2>/dev/null || true
    
    # 重置核心配置
    git config --global --unset core.editor 2>/dev/null || true
    git config --global --unset core.autocrlf 2>/dev/null || true
    git config --global --unset init.defaultBranch 2>/dev/null || true
    
    # 重置项目配置
    if [ -d ".git" ]; then
        print_message $BLUE "🔄 重置项目配置..."
        git config --unset core.hooksPath 2>/dev/null || true
        git config --unset commit.template 2>/dev/null || true
    fi
    
    print_message $GREEN "✅ Git配置重置完成"
}

# 创建配置文件
create_config_files() {
    print_message $BLUE "📝 创建配置文件..."
    
    # 创建全局gitignore
    global_gitignore="$HOME/.gitignore_global"
    if [ ! -f "$global_gitignore" ]; then
        cat > "$global_gitignore" << 'EOF'
# 全局Git忽略文件

# 操作系统生成的文件
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
desktop.ini

# 编辑器和IDE
.vscode/
.idea/
*.swp
*.swo
*~

# 临时文件
*.tmp
*.temp
.tmp/

# 日志文件
*.log

# 备份文件
*.bak
*.backup
*.old
EOF
        
        git config --global core.excludesfile "$global_gitignore"
        print_message $GREEN "✅ 全局gitignore已创建: $global_gitignore"
    fi
    
    # 创建提交模板
    if [ -d ".git" ] && [ ! -f ".gitmessage-template" ]; then
        cat > .gitmessage-template << 'EOF'
# 提交类型: 简短描述 (不超过50字符)
#
# 详细说明 (可选，每行不超过72字符)
# - 解释为什么做这个改动
# - 说明改动的影响
# - 提及相关的issue或ticket
#
# 提交类型说明:
# feat:     新功能
# fix:      修复bug
# docs:     文档更新
# style:    代码格式化
# refactor: 重构代码
# test:     添加或修改测试
# chore:    构建过程或辅助工具的变动
EOF
        
        git config commit.template .gitmessage-template
        print_message $GREEN "✅ 提交模板已创建: .gitmessage-template"
    fi
}

# 执行配置
if [ "$SETUP_ALL" = true ]; then
    SETUP_USER=true
    SETUP_GLOBAL=true
    SETUP_LOCAL=true
    SETUP_ALIASES=true
fi

if [ "$SHOW_CONFIG" = true ]; then
    show_current_config
    exit 0
fi

if [ "$RESET_CONFIG" = true ]; then
    reset_git_config
    exit 0
fi

# 检查是否有任何配置选项
if [ "$SETUP_USER" = false ] && [ "$SETUP_GLOBAL" = false ] && [ "$SETUP_LOCAL" = false ] && [ "$SETUP_ALIASES" = false ]; then
    print_message $YELLOW "⚠️  没有指定配置选项"
    show_usage
    exit 1
fi

# 执行配置
if [ "$SETUP_USER" = true ]; then
    setup_user_config
fi

if [ "$SETUP_GLOBAL" = true ]; then
    setup_global_config
fi

if [ "$SETUP_LOCAL" = true ]; then
    setup_local_config
fi

if [ "$SETUP_ALIASES" = true ]; then
    setup_git_aliases
fi

# 创建配置文件
create_config_files

print_message $GREEN "🎉 Git配置优化完成！"
print_message $BLUE "🔗 相关命令:"
echo "   - 查看配置: git config --list"
echo "   - 查看别名: git alias"
echo "   - 显示配置: $0 -s"

exit 0
