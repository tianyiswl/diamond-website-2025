#!/bin/bash
# ===================================
# Git自动化解决方案 - 分支管理脚本
# 智能分支创建、切换、合并、删除
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
    echo "Git分支管理脚本"
    echo ""
    echo "使用方法:"
    echo "  $0 <命令> [选项] [参数]"
    echo ""
    echo "命令:"
    echo "  create <分支名>     创建新分支"
    echo "  switch <分支名>     切换到指定分支"
    echo "  merge <分支名>      合并指定分支到当前分支"
    echo "  delete <分支名>     删除指定分支"
    echo "  list               列出所有分支"
    echo "  status             显示分支状态"
    echo "  clean              清理已合并的分支"
    echo "  sync               同步远程分支"
    echo ""
    echo "选项:"
    echo "  -f, --force        强制执行操作"
    echo "  -r, --remote       包含远程分支"
    echo "  -p, --push         创建分支后推送到远程"
    echo "  -d, --dry-run      预览操作，不实际执行"
    echo "  -h, --help         显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 create feature/user-auth"
    echo "  $0 switch develop"
    echo "  $0 merge feature/user-auth"
    echo "  $0 delete feature/old-feature -f"
    echo "  $0 clean"
}

# 默认参数
FORCE=false
INCLUDE_REMOTE=false
AUTO_PUSH=false
DRY_RUN=false

# 解析命令行参数
COMMAND=""
BRANCH_NAME=""

while [[ $# -gt 0 ]]; do
    case $1 in
        create|switch|merge|delete|list|status|clean|sync)
            COMMAND="$1"
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -r|--remote)
            INCLUDE_REMOTE=true
            shift
            ;;
        -p|--push)
            AUTO_PUSH=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
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
            if [ -z "$BRANCH_NAME" ]; then
                BRANCH_NAME="$1"
            fi
            shift
            ;;
    esac
done

# 检查命令
if [ -z "$COMMAND" ]; then
    print_message $RED "❌ 请指定命令"
    show_usage
    exit 1
fi

print_message $BLUE "🌿 Git分支管理器启动..."

# 检查是否在Git仓库中
if [ ! -d ".git" ]; then
    print_message $RED "❌ 当前目录不是Git仓库"
    exit 1
fi

# 获取当前分支
current_branch=$(git rev-parse --abbrev-ref HEAD)
print_message $BLUE "📍 当前分支: $current_branch"

# 分支名称验证函数
validate_branch_name() {
    local name="$1"
    
    if [ -z "$name" ]; then
        print_message $RED "❌ 分支名称不能为空"
        return 1
    fi
    
    # 检查分支名称格式
    if ! echo "$name" | grep -qE '^[a-zA-Z0-9/_-]+$'; then
        print_message $RED "❌ 分支名称包含无效字符"
        print_message $YELLOW "💡 只允许字母、数字、下划线、斜杠和连字符"
        return 1
    fi
    
    return 0
}

# 检查分支是否存在
branch_exists() {
    local name="$1"
    local check_remote="$2"
    
    # 检查本地分支
    if git show-ref --verify --quiet "refs/heads/$name"; then
        return 0
    fi
    
    # 检查远程分支
    if [ "$check_remote" = true ]; then
        if git show-ref --verify --quiet "refs/remotes/origin/$name"; then
            return 0
        fi
    fi
    
    return 1
}

# 创建分支
create_branch() {
    local name="$1"
    
    print_message $BLUE "🌱 创建分支: $name"
    
    if ! validate_branch_name "$name"; then
        exit 1
    fi
    
    if branch_exists "$name" false; then
        print_message $RED "❌ 分支已存在: $name"
        exit 1
    fi
    
    # 检查工作区是否干净
    if ! git diff-index --quiet HEAD --; then
        print_message $YELLOW "⚠️  工作区有未提交的更改"
        
        if [ "$FORCE" = false ]; then
            read -p "是否继续创建分支? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_message $YELLOW "操作已取消"
                exit 0
            fi
        fi
    fi
    
    if [ "$DRY_RUN" = true ]; then
        print_message $BLUE "🔍 预览: git checkout -b $name"
        return 0
    fi
    
    # 创建并切换到新分支
    if git checkout -b "$name"; then
        print_message $GREEN "✅ 分支创建成功: $name"
        
        # 自动推送到远程
        if [ "$AUTO_PUSH" = true ]; then
            print_message $BLUE "🚀 推送分支到远程..."
            if git push -u origin "$name"; then
                print_message $GREEN "✅ 分支已推送到远程"
            else
                print_message $YELLOW "⚠️  推送失败，但分支创建成功"
            fi
        fi
    else
        print_message $RED "❌ 分支创建失败"
        exit 1
    fi
}

# 切换分支
switch_branch() {
    local name="$1"
    
    print_message $BLUE "🔄 切换到分支: $name"
    
    if ! validate_branch_name "$name"; then
        exit 1
    fi
    
    if [ "$name" = "$current_branch" ]; then
        print_message $YELLOW "⚠️  已经在分支 $name 上"
        return 0
    fi
    
    # 检查分支是否存在
    if ! branch_exists "$name" true; then
        print_message $YELLOW "⚠️  本地分支不存在: $name"
        
        # 检查远程分支
        if git show-ref --verify --quiet "refs/remotes/origin/$name"; then
            print_message $BLUE "📡 发现远程分支，创建本地跟踪分支"
            
            if [ "$DRY_RUN" = true ]; then
                print_message $BLUE "🔍 预览: git checkout -b $name origin/$name"
                return 0
            fi
            
            if git checkout -b "$name" "origin/$name"; then
                print_message $GREEN "✅ 已创建本地跟踪分支: $name"
            else
                print_message $RED "❌ 创建跟踪分支失败"
                exit 1
            fi
        else
            print_message $RED "❌ 分支不存在: $name"
            print_message $YELLOW "💡 使用 'create' 命令创建新分支"
            exit 1
        fi
    else
        # 检查工作区是否干净
        if ! git diff-index --quiet HEAD --; then
            print_message $YELLOW "⚠️  工作区有未提交的更改"
            
            if [ "$FORCE" = false ]; then
                read -p "是否暂存更改并切换分支? (y/N): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    git stash push -m "自动暂存 - 切换到 $name"
                    print_message $GREEN "✅ 更改已暂存"
                else
                    print_message $YELLOW "操作已取消"
                    exit 0
                fi
            fi
        fi
        
        if [ "$DRY_RUN" = true ]; then
            print_message $BLUE "🔍 预览: git checkout $name"
            return 0
        fi
        
        if git checkout "$name"; then
            print_message $GREEN "✅ 已切换到分支: $name"
        else
            print_message $RED "❌ 分支切换失败"
            exit 1
        fi
    fi
}

# 合并分支
merge_branch() {
    local name="$1"
    
    print_message $BLUE "🔀 合并分支: $name -> $current_branch"
    
    if ! validate_branch_name "$name"; then
        exit 1
    fi
    
    if [ "$name" = "$current_branch" ]; then
        print_message $RED "❌ 不能合并分支到自身"
        exit 1
    fi
    
    if ! branch_exists "$name" false; then
        print_message $RED "❌ 分支不存在: $name"
        exit 1
    fi
    
    # 检查工作区是否干净
    if ! git diff-index --quiet HEAD --; then
        print_message $RED "❌ 工作区有未提交的更改，请先提交或暂存"
        exit 1
    fi
    
    if [ "$DRY_RUN" = true ]; then
        print_message $BLUE "🔍 预览: git merge $name"
        return 0
    fi
    
    # 执行合并
    if git merge "$name" --no-ff; then
        print_message $GREEN "✅ 分支合并成功"
        
        # 显示合并统计
        print_message $BLUE "📊 合并统计:"
        git show --stat --oneline HEAD | head -5
    else
        print_message $RED "❌ 分支合并失败"
        print_message $YELLOW "💡 请解决冲突后手动完成合并"
        exit 1
    fi
}

# 删除分支
delete_branch() {
    local name="$1"
    
    print_message $BLUE "🗑️  删除分支: $name"
    
    if ! validate_branch_name "$name"; then
        exit 1
    fi
    
    if [ "$name" = "$current_branch" ]; then
        print_message $RED "❌ 不能删除当前分支"
        exit 1
    fi
    
    # 保护主要分支
    protected_branches=("main" "master" "develop" "production" "release")
    for protected in "${protected_branches[@]}"; do
        if [ "$name" = "$protected" ]; then
            print_message $RED "❌ 不能删除保护分支: $name"
            exit 1
        fi
    done
    
    if ! branch_exists "$name" false; then
        print_message $RED "❌ 分支不存在: $name"
        exit 1
    fi
    
    # 检查分支是否已合并
    if ! git merge-base --is-ancestor "$name" HEAD; then
        print_message $YELLOW "⚠️  分支未完全合并到当前分支"
        
        if [ "$FORCE" = false ]; then
            read -p "确认删除未合并的分支? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_message $YELLOW "操作已取消"
                exit 0
            fi
        fi
    fi
    
    if [ "$DRY_RUN" = true ]; then
        print_message $BLUE "🔍 预览: git branch -d $name"
        return 0
    fi
    
    # 删除本地分支
    delete_option="-d"
    if [ "$FORCE" = true ]; then
        delete_option="-D"
    fi
    
    if git branch $delete_option "$name"; then
        print_message $GREEN "✅ 本地分支已删除: $name"
        
        # 删除远程分支
        if git show-ref --verify --quiet "refs/remotes/origin/$name"; then
            read -p "是否同时删除远程分支? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                if git push origin --delete "$name"; then
                    print_message $GREEN "✅ 远程分支已删除: $name"
                else
                    print_message $YELLOW "⚠️  远程分支删除失败"
                fi
            fi
        fi
    else
        print_message $RED "❌ 分支删除失败"
        exit 1
    fi
}

# 列出分支
list_branches() {
    print_message $BLUE "📋 分支列表:"
    
    if [ "$INCLUDE_REMOTE" = true ]; then
        git branch -a --sort=-committerdate | head -20
    else
        git branch --sort=-committerdate | head -20
    fi
    
    echo ""
    print_message $BLUE "📊 分支统计:"
    local_count=$(git branch | wc -l)
    remote_count=$(git branch -r | wc -l)
    echo "   - 本地分支: $local_count 个"
    echo "   - 远程分支: $remote_count 个"
}

# 显示分支状态
show_status() {
    print_message $BLUE "📊 分支状态报告:"
    
    echo ""
    print_message $BLUE "📍 当前分支: $current_branch"
    
    # 检查与远程的同步状态
    if git show-ref --verify --quiet "refs/remotes/origin/$current_branch"; then
        ahead=$(git rev-list --count "origin/$current_branch..HEAD" 2>/dev/null || echo "0")
        behind=$(git rev-list --count "HEAD..origin/$current_branch" 2>/dev/null || echo "0")
        
        echo "   - 领先远程: $ahead 个提交"
        echo "   - 落后远程: $behind 个提交"
        
        if [ "$ahead" -gt 0 ]; then
            print_message $YELLOW "   ⚠️  有未推送的提交"
        fi
        
        if [ "$behind" -gt 0 ]; then
            print_message $YELLOW "   ⚠️  需要拉取远程更新"
        fi
        
        if [ "$ahead" -eq 0 ] && [ "$behind" -eq 0 ]; then
            print_message $GREEN "   ✅ 与远程同步"
        fi
    else
        print_message $YELLOW "   ⚠️  远程分支不存在"
    fi
    
    # 工作区状态
    echo ""
    print_message $BLUE "📁 工作区状态:"
    
    untracked=$(git ls-files --others --exclude-standard | wc -l)
    modified=$(git diff --name-only | wc -l)
    staged=$(git diff --cached --name-only | wc -l)
    
    echo "   - 未跟踪文件: $untracked 个"
    echo "   - 已修改文件: $modified 个"
    echo "   - 已暂存文件: $staged 个"
    
    if [ $((untracked + modified + staged)) -eq 0 ]; then
        print_message $GREEN "   ✅ 工作区干净"
    fi
}

# 清理已合并的分支
clean_branches() {
    print_message $BLUE "🧹 清理已合并的分支..."
    
    # 获取已合并的分支
    merged_branches=$(git branch --merged | grep -v "^\*" | grep -v "main\|master\|develop" | tr -d ' ')
    
    if [ -z "$merged_branches" ]; then
        print_message $GREEN "✅ 没有需要清理的分支"
        return 0
    fi
    
    print_message $BLUE "📋 发现已合并的分支:"
    echo "$merged_branches" | sed 's/^/   - /'
    
    if [ "$DRY_RUN" = true ]; then
        print_message $BLUE "🔍 预览模式 - 将删除上述分支"
        return 0
    fi
    
    read -p "确认删除这些分支? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_message $YELLOW "操作已取消"
        return 0
    fi
    
    # 删除已合并的分支
    deleted_count=0
    while IFS= read -r branch; do
        if [ -n "$branch" ]; then
            if git branch -d "$branch" 2>/dev/null; then
                print_message $GREEN "✅ 已删除: $branch"
                deleted_count=$((deleted_count + 1))
            else
                print_message $YELLOW "⚠️  跳过: $branch"
            fi
        fi
    done <<< "$merged_branches"
    
    print_message $GREEN "🎉 清理完成，删除了 $deleted_count 个分支"
}

# 同步远程分支
sync_branches() {
    print_message $BLUE "🔄 同步远程分支..."
    
    if [ "$DRY_RUN" = true ]; then
        print_message $BLUE "🔍 预览: git fetch --prune origin"
        return 0
    fi
    
    # 获取远程更新
    if git fetch --prune origin; then
        print_message $GREEN "✅ 远程分支同步完成"
        
        # 显示新的远程分支
        print_message $BLUE "📡 远程分支状态:"
        git branch -r --sort=-committerdate | head -10
    else
        print_message $RED "❌ 同步失败"
        exit 1
    fi
}

# 执行命令
case $COMMAND in
    create)
        if [ -z "$BRANCH_NAME" ]; then
            print_message $RED "❌ 请指定分支名称"
            exit 1
        fi
        create_branch "$BRANCH_NAME"
        ;;
    switch)
        if [ -z "$BRANCH_NAME" ]; then
            print_message $RED "❌ 请指定分支名称"
            exit 1
        fi
        switch_branch "$BRANCH_NAME"
        ;;
    merge)
        if [ -z "$BRANCH_NAME" ]; then
            print_message $RED "❌ 请指定要合并的分支名称"
            exit 1
        fi
        merge_branch "$BRANCH_NAME"
        ;;
    delete)
        if [ -z "$BRANCH_NAME" ]; then
            print_message $RED "❌ 请指定要删除的分支名称"
            exit 1
        fi
        delete_branch "$BRANCH_NAME"
        ;;
    list)
        list_branches
        ;;
    status)
        show_status
        ;;
    clean)
        clean_branches
        ;;
    sync)
        sync_branches
        ;;
    *)
        print_message $RED "❌ 未知命令: $COMMAND"
        show_usage
        exit 1
        ;;
esac

print_message $GREEN "🎉 操作完成！"

exit 0
