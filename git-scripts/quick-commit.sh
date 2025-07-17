#!/bin/bash
# ===================================
# Git自动化解决方案 - 一键提交脚本
# 自动添加、提交、推送的智能脚本
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
    echo "使用方法:"
    echo "  $0 [选项] [提交信息]"
    echo ""
    echo "选项:"
    echo "  -a, --all          添加所有文件（包括新文件）"
    echo "  -p, --push         提交后自动推送"
    echo "  -f, --force        强制推送（谨慎使用）"
    echo "  -n, --no-verify    跳过Git钩子验证"
    echo "  -d, --dry-run      预览操作，不实际执行"
    echo "  -t, --type TYPE    指定提交类型 (feat|fix|docs|style|refactor|test|chore)"
    echo "  -s, --scope SCOPE  指定提交范围"
    echo "  -h, --help         显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 \"修复登录bug\""
    echo "  $0 -t feat -s auth \"添加用户认证功能\""
    echo "  $0 -a -p \"完成产品页面开发\""
    echo "  $0 -d \"预览提交操作\""
}

# 默认参数
ADD_ALL=false
AUTO_PUSH=false
FORCE_PUSH=false
NO_VERIFY=false
DRY_RUN=false
COMMIT_TYPE=""
COMMIT_SCOPE=""
COMMIT_MSG=""

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -a|--all)
            ADD_ALL=true
            shift
            ;;
        -p|--push)
            AUTO_PUSH=true
            shift
            ;;
        -f|--force)
            FORCE_PUSH=true
            shift
            ;;
        -n|--no-verify)
            NO_VERIFY=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -t|--type)
            COMMIT_TYPE="$2"
            shift 2
            ;;
        -s|--scope)
            COMMIT_SCOPE="$2"
            shift 2
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
            COMMIT_MSG="$1"
            shift
            ;;
    esac
done

print_message $BLUE "🚀 Git一键提交脚本启动..."

# 检查是否在Git仓库中
if [ ! -d ".git" ]; then
    print_message $RED "❌ 当前目录不是Git仓库"
    exit 1
fi

# 获取当前分支
current_branch=$(git rev-parse --abbrev-ref HEAD)
print_message $BLUE "📍 当前分支: $current_branch"

# 检查工作区状态
print_message $BLUE "🔍 检查工作区状态..."

# 获取状态信息
untracked_files=$(git ls-files --others --exclude-standard | wc -l)
modified_files=$(git diff --name-only | wc -l)
staged_files=$(git diff --cached --name-only | wc -l)

print_message $BLUE "📊 工作区状态:"
echo "   - 未跟踪文件: $untracked_files 个"
echo "   - 已修改文件: $modified_files 个"
echo "   - 已暂存文件: $staged_files 个"

# 检查是否有变更
total_changes=$((untracked_files + modified_files + staged_files))
if [ $total_changes -eq 0 ]; then
    print_message $YELLOW "⚠️  没有检测到任何变更"
    print_message $BLUE "💡 工作区是干净的，无需提交"
    exit 0
fi

# 显示详细的文件状态
if [ $untracked_files -gt 0 ]; then
    print_message $YELLOW "📄 未跟踪的文件:"
    git ls-files --others --exclude-standard | head -10 | sed 's/^/   - /'
    if [ $untracked_files -gt 10 ]; then
        echo "   ... 还有 $((untracked_files - 10)) 个文件"
    fi
fi

if [ $modified_files -gt 0 ]; then
    print_message $YELLOW "📝 已修改的文件:"
    git diff --name-only | head -10 | sed 's/^/   - /'
    if [ $modified_files -gt 10 ]; then
        echo "   ... 还有 $((modified_files - 10)) 个文件"
    fi
fi

if [ $staged_files -gt 0 ]; then
    print_message $GREEN "✅ 已暂存的文件:"
    git diff --cached --name-only | head -10 | sed 's/^/   - /'
    if [ $staged_files -gt 10 ]; then
        echo "   ... 还有 $((staged_files - 10)) 个文件"
    fi
fi

# 预览模式
if [ "$DRY_RUN" = true ]; then
    print_message $BLUE "🔍 预览模式 - 将要执行的操作:"
    
    if [ "$ADD_ALL" = true ]; then
        echo "   1. git add -A  (添加所有文件)"
    elif [ $staged_files -eq 0 ]; then
        echo "   1. git add .   (添加已修改的文件)"
    else
        echo "   1. 使用已暂存的文件"
    fi
    
    echo "   2. git commit -m \"[提交信息]\""
    
    if [ "$AUTO_PUSH" = true ]; then
        if [ "$FORCE_PUSH" = true ]; then
            echo "   3. git push --force-with-lease origin $current_branch"
        else
            echo "   3. git push origin $current_branch"
        fi
    fi
    
    print_message $YELLOW "💡 使用 --dry-run 参数仅预览，不会实际执行"
    exit 0
fi

# 添加文件到暂存区
if [ $staged_files -eq 0 ] || [ "$ADD_ALL" = true ]; then
    print_message $BLUE "📁 添加文件到暂存区..."
    
    if [ "$ADD_ALL" = true ]; then
        git add -A
        print_message $GREEN "✅ 已添加所有文件"
    else
        git add .
        print_message $GREEN "✅ 已添加修改的文件"
    fi
    
    # 重新获取暂存文件数量
    staged_files=$(git diff --cached --name-only | wc -l)
fi

# 检查是否有文件被暂存
if [ $staged_files -eq 0 ]; then
    print_message $YELLOW "⚠️  没有文件被暂存，无法提交"
    exit 1
fi

# 构建提交信息
if [ -z "$COMMIT_MSG" ]; then
    print_message $BLUE "📝 请输入提交信息:"
    read -r COMMIT_MSG
    
    if [ -z "$COMMIT_MSG" ]; then
        print_message $RED "❌ 提交信息不能为空"
        exit 1
    fi
fi

# 格式化提交信息
formatted_msg="$COMMIT_MSG"

if [ -n "$COMMIT_TYPE" ]; then
    if [ -n "$COMMIT_SCOPE" ]; then
        formatted_msg="$COMMIT_TYPE($COMMIT_SCOPE): $COMMIT_MSG"
    else
        formatted_msg="$COMMIT_TYPE: $COMMIT_MSG"
    fi
fi

print_message $BLUE "📝 提交信息: $formatted_msg"

# 执行提交
print_message $BLUE "💾 执行提交..."

commit_options=""
if [ "$NO_VERIFY" = true ]; then
    commit_options="--no-verify"
    print_message $YELLOW "⚠️  跳过Git钩子验证"
fi

if git commit $commit_options -m "$formatted_msg"; then
    commit_hash=$(git rev-parse --short HEAD)
    print_message $GREEN "✅ 提交成功: $commit_hash"
    print_message $BLUE "📊 提交统计:"
    git show --stat --oneline HEAD | head -10
else
    print_message $RED "❌ 提交失败"
    exit 1
fi

# 自动推送
if [ "$AUTO_PUSH" = true ]; then
    print_message $BLUE "🚀 准备推送到远程仓库..."
    
    # 检查远程分支是否存在
    if git ls-remote --heads origin "$current_branch" | grep -q "$current_branch"; then
        print_message $BLUE "📡 远程分支存在，准备推送..."
    else
        print_message $YELLOW "⚠️  远程分支不存在，将创建新分支"
    fi
    
    # 执行推送
    push_options=""
    if [ "$FORCE_PUSH" = true ]; then
        push_options="--force-with-lease"
        print_message $YELLOW "⚠️  使用强制推送（--force-with-lease）"
    fi
    
    if git push $push_options origin "$current_branch"; then
        print_message $GREEN "✅ 推送成功"
        
        # 显示远程仓库信息
        remote_url=$(git remote get-url origin)
        print_message $BLUE "📡 远程仓库: $remote_url"
    else
        print_message $RED "❌ 推送失败"
        print_message $YELLOW "💡 可能需要先拉取远程更新: git pull origin $current_branch"
        exit 1
    fi
fi

# 显示操作总结
print_message $GREEN "🎉 操作完成！"
print_message $BLUE "📋 操作总结:"
echo "   - 分支: $current_branch"
echo "   - 提交: $commit_hash"
echo "   - 文件: $staged_files 个"
echo "   - 信息: $formatted_msg"

if [ "$AUTO_PUSH" = true ]; then
    echo "   - 推送: ✅ 已推送到远程"
else
    echo "   - 推送: ⏸️  未推送（使用 -p 参数自动推送）"
fi

print_message $BLUE "🔗 相关命令:"
echo "   - 查看提交历史: git log --oneline -10"
echo "   - 查看文件变更: git show HEAD"
echo "   - 推送到远程: git push origin $current_branch"

exit 0
