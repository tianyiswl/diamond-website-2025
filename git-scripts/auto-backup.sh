#!/bin/bash
# ===================================
# Git自动化解决方案 - 自动备份脚本
# 智能备份和同步Git仓库
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
    echo "Git自动备份脚本"
    echo ""
    echo "使用方法:"
    echo "  $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -d, --destination DIR  指定备份目录 (默认: ../backups)"
    echo "  -c, --compress         压缩备份文件"
    echo "  -r, --remote           同时备份到远程仓库"
    echo "  -s, --schedule         设置定时备份"
    echo "  -l, --list             列出现有备份"
    echo "  -R, --restore FILE     从备份恢复"
    echo "  -C, --clean            清理旧备份"
    echo "  --dry-run              预览操作，不实际执行"
    echo "  -h, --help             显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                     # 创建基本备份"
    echo "  $0 -c -r               # 压缩备份并推送到远程"
    echo "  $0 -d /backup/git      # 备份到指定目录"
    echo "  $0 -l                  # 列出所有备份"
    echo "  $0 -C                  # 清理7天前的备份"
}

# 默认参数
BACKUP_DIR="../backups"
COMPRESS=false
REMOTE_BACKUP=false
SCHEDULE_BACKUP=false
LIST_BACKUPS=false
RESTORE_FILE=""
CLEAN_OLD=false
DRY_RUN=false

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--destination)
            BACKUP_DIR="$2"
            shift 2
            ;;
        -c|--compress)
            COMPRESS=true
            shift
            ;;
        -r|--remote)
            REMOTE_BACKUP=true
            shift
            ;;
        -s|--schedule)
            SCHEDULE_BACKUP=true
            shift
            ;;
        -l|--list)
            LIST_BACKUPS=true
            shift
            ;;
        -R|--restore)
            RESTORE_FILE="$2"
            shift 2
            ;;
        -C|--clean)
            CLEAN_OLD=true
            shift
            ;;
        --dry-run)
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
            print_message $RED "❌ 未知参数: $1"
            show_usage
            exit 1
            ;;
    esac
done

print_message $BLUE "💾 Git自动备份脚本启动..."

# 检查是否在Git仓库中
if [ ! -d ".git" ]; then
    print_message $RED "❌ 当前目录不是Git仓库"
    exit 1
fi

# 获取仓库信息
repo_name=$(basename "$(pwd)")
current_branch=$(git rev-parse --abbrev-ref HEAD)
commit_hash=$(git rev-parse --short HEAD)
timestamp=$(date '+%Y%m%d-%H%M%S')

print_message $BLUE "📊 仓库信息:"
echo "   - 仓库名称: $repo_name"
echo "   - 当前分支: $current_branch"
echo "   - 最新提交: $commit_hash"
echo "   - 备份时间: $timestamp"

# 创建备份目录
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        if [ "$DRY_RUN" = true ]; then
            print_message $BLUE "🔍 预览: mkdir -p $BACKUP_DIR"
            return 0
        fi
        
        mkdir -p "$BACKUP_DIR"
        print_message $GREEN "✅ 备份目录已创建: $BACKUP_DIR"
    fi
}

# 列出现有备份
list_existing_backups() {
    print_message $BLUE "📋 现有备份列表:"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        print_message $YELLOW "⚠️  备份目录不存在: $BACKUP_DIR"
        return 0
    fi
    
    backup_files=$(find "$BACKUP_DIR" -name "${repo_name}-backup-*" -type f 2>/dev/null | sort -r)
    
    if [ -z "$backup_files" ]; then
        print_message $YELLOW "⚠️  没有找到备份文件"
        return 0
    fi
    
    count=0
    while IFS= read -r file; do
        if [ -n "$file" ]; then
            count=$((count + 1))
            file_size=$(du -h "$file" | cut -f1)
            file_date=$(stat -c %y "$file" 2>/dev/null | cut -d' ' -f1 || stat -f %Sm -t %Y-%m-%d "$file" 2>/dev/null)
            basename_file=$(basename "$file")
            
            echo "   $count. $basename_file ($file_size, $file_date)"
        fi
    done <<< "$backup_files"
    
    print_message $BLUE "📊 备份统计: 共 $count 个备份文件"
}

# 清理旧备份
clean_old_backups() {
    print_message $BLUE "🧹 清理旧备份..."
    
    if [ ! -d "$BACKUP_DIR" ]; then
        print_message $YELLOW "⚠️  备份目录不存在"
        return 0
    fi
    
    # 查找7天前的备份文件
    old_files=$(find "$BACKUP_DIR" -name "${repo_name}-backup-*" -type f -mtime +7 2>/dev/null || true)
    
    if [ -z "$old_files" ]; then
        print_message $GREEN "✅ 没有需要清理的旧备份"
        return 0
    fi
    
    print_message $BLUE "📋 发现旧备份文件:"
    echo "$old_files" | sed 's/^/   - /'
    
    if [ "$DRY_RUN" = true ]; then
        print_message $BLUE "🔍 预览模式 - 将删除上述文件"
        return 0
    fi
    
    read -p "确认删除这些旧备份? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_message $YELLOW "操作已取消"
        return 0
    fi
    
    deleted_count=0
    while IFS= read -r file; do
        if [ -n "$file" ] && [ -f "$file" ]; then
            rm "$file"
            print_message $GREEN "✅ 已删除: $(basename "$file")"
            deleted_count=$((deleted_count + 1))
        fi
    done <<< "$old_files"
    
    print_message $GREEN "🎉 清理完成，删除了 $deleted_count 个旧备份"
}

# 创建备份
create_backup() {
    print_message $BLUE "💾 开始创建备份..."
    
    create_backup_dir
    
    # 检查工作区状态
    if ! git diff-index --quiet HEAD --; then
        print_message $YELLOW "⚠️  工作区有未提交的更改"
        
        # 创建临时提交
        temp_commit=false
        read -p "是否创建临时提交以包含未保存的更改? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if [ "$DRY_RUN" = false ]; then
                git add -A
                git commit -m "临时提交 - 备份前保存 $(date)"
                temp_commit=true
                print_message $GREEN "✅ 临时提交已创建"
            fi
        fi
    fi
    
    # 生成备份文件名
    backup_filename="${repo_name}-backup-${timestamp}-${commit_hash}"
    
    if [ "$COMPRESS" = true ]; then
        backup_file="$BACKUP_DIR/${backup_filename}.tar.gz"
    else
        backup_file="$BACKUP_DIR/${backup_filename}.bundle"
    fi
    
    if [ "$DRY_RUN" = true ]; then
        print_message $BLUE "🔍 预览: 将创建备份文件 $backup_file"
        return 0
    fi
    
    # 创建备份
    if [ "$COMPRESS" = true ]; then
        print_message $BLUE "📦 创建压缩备份..."
        
        # 创建临时目录
        temp_dir=$(mktemp -d)
        temp_repo="$temp_dir/$repo_name"
        
        # 克隆仓库到临时目录
        git clone . "$temp_repo" --quiet
        
        # 创建压缩包
        tar -czf "$backup_file" -C "$temp_dir" "$repo_name"
        
        # 清理临时目录
        rm -rf "$temp_dir"
        
        print_message $GREEN "✅ 压缩备份创建完成"
    else
        print_message $BLUE "📦 创建Git bundle备份..."
        
        # 创建Git bundle
        git bundle create "$backup_file" --all
        
        print_message $GREEN "✅ Git bundle备份创建完成"
    fi
    
    # 显示备份信息
    backup_size=$(du -h "$backup_file" | cut -f1)
    print_message $BLUE "📊 备份信息:"
    echo "   - 文件: $(basename "$backup_file")"
    echo "   - 大小: $backup_size"
    echo "   - 路径: $backup_file"
    
    # 创建备份元数据
    metadata_file="${backup_file}.info"
    {
        echo "备份时间: $(date)"
        echo "仓库名称: $repo_name"
        echo "当前分支: $current_branch"
        echo "提交哈希: $commit_hash"
        echo "备份类型: $([ "$COMPRESS" = true ] && echo "压缩包" || echo "Git bundle")"
        echo "文件大小: $backup_size"
        echo ""
        echo "分支列表:"
        git branch -a
        echo ""
        echo "最近提交:"
        git log --oneline -5
    } > "$metadata_file"
    
    print_message $GREEN "✅ 备份元数据已保存: $(basename "$metadata_file")"
    
    # 如果创建了临时提交，询问是否回滚
    if [ "$temp_commit" = true ]; then
        read -p "是否回滚临时提交? (Y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            git reset --soft HEAD~1
            print_message $GREEN "✅ 临时提交已回滚"
        fi
    fi
}

# 远程备份
remote_backup() {
    print_message $BLUE "📡 执行远程备份..."
    
    # 检查远程仓库
    if ! git remote get-url origin >/dev/null 2>&1; then
        print_message $YELLOW "⚠️  没有配置远程仓库，跳过远程备份"
        return 0
    fi
    
    remote_url=$(git remote get-url origin)
    print_message $BLUE "📡 远程仓库: $remote_url"
    
    if [ "$DRY_RUN" = true ]; then
        print_message $BLUE "🔍 预览: git push --all origin"
        return 0
    fi
    
    # 推送所有分支
    if git push --all origin; then
        print_message $GREEN "✅ 所有分支已推送到远程"
    else
        print_message $YELLOW "⚠️  部分分支推送失败"
    fi
    
    # 推送标签
    if git push --tags origin; then
        print_message $GREEN "✅ 所有标签已推送到远程"
    else
        print_message $YELLOW "⚠️  标签推送失败"
    fi
}

# 从备份恢复
restore_from_backup() {
    local backup_file="$1"
    
    print_message $BLUE "🔄 从备份恢复: $backup_file"
    
    if [ ! -f "$backup_file" ]; then
        print_message $RED "❌ 备份文件不存在: $backup_file"
        exit 1
    fi
    
    # 检查备份文件类型
    if [[ "$backup_file" == *.tar.gz ]]; then
        print_message $BLUE "📦 检测到压缩备份文件"
        
        if [ "$DRY_RUN" = true ]; then
            print_message $BLUE "🔍 预览: 解压并恢复压缩备份"
            return 0
        fi
        
        # 创建临时目录
        temp_dir=$(mktemp -d)
        
        # 解压备份
        tar -xzf "$backup_file" -C "$temp_dir"
        
        # 找到解压的仓库目录
        extracted_repo=$(find "$temp_dir" -type d -name ".git" | head -1 | dirname)
        
        if [ -z "$extracted_repo" ]; then
            print_message $RED "❌ 备份文件中没有找到Git仓库"
            rm -rf "$temp_dir"
            exit 1
        fi
        
        print_message $BLUE "📁 恢复仓库内容..."
        
        # 备份当前仓库
        current_backup="$(pwd).backup-$(date +%Y%m%d-%H%M%S)"
        mv "$(pwd)" "$current_backup"
        
        # 恢复备份的仓库
        mv "$extracted_repo" "$(pwd)"
        
        print_message $GREEN "✅ 从压缩备份恢复完成"
        print_message $BLUE "💾 原仓库已备份到: $current_backup"
        
        # 清理临时目录
        rm -rf "$temp_dir"
        
    elif [[ "$backup_file" == *.bundle ]]; then
        print_message $BLUE "📦 检测到Git bundle备份文件"
        
        if [ "$DRY_RUN" = true ]; then
            print_message $BLUE "🔍 预览: 从Git bundle恢复"
            return 0
        fi
        
        # 验证bundle文件
        if ! git bundle verify "$backup_file"; then
            print_message $RED "❌ 备份文件验证失败"
            exit 1
        fi
        
        print_message $BLUE "📁 从bundle恢复..."
        
        # 创建新的仓库目录
        restore_dir="${repo_name}-restored-$(date +%Y%m%d-%H%M%S)"
        mkdir "$restore_dir"
        cd "$restore_dir"
        
        # 从bundle克隆
        git clone "$backup_file" . --quiet
        
        print_message $GREEN "✅ 从Git bundle恢复完成"
        print_message $BLUE "📁 恢复位置: $(pwd)"
        
    else
        print_message $RED "❌ 不支持的备份文件格式"
        exit 1
    fi
}

# 设置定时备份
setup_scheduled_backup() {
    print_message $BLUE "⏰ 设置定时备份..."
    
    # 创建备份脚本
    script_path="$(pwd)/git-scripts/auto-backup.sh"
    
    # 生成crontab条目
    cron_entry="0 2 * * * cd $(pwd) && $script_path -c -r >> $(pwd)/.backup.log 2>&1"
    
    print_message $BLUE "📋 建议的crontab条目:"
    echo "   $cron_entry"
    
    if [ "$DRY_RUN" = true ]; then
        print_message $BLUE "🔍 预览模式 - 不会实际设置定时任务"
        return 0
    fi
    
    read -p "是否添加到crontab? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # 添加到crontab
        (crontab -l 2>/dev/null; echo "$cron_entry") | crontab -
        print_message $GREEN "✅ 定时备份已设置 (每天凌晨2点)"
        print_message $BLUE "💡 查看定时任务: crontab -l"
        print_message $BLUE "💡 查看备份日志: tail -f .backup.log"
    fi
}

# 执行操作
if [ "$LIST_BACKUPS" = true ]; then
    list_existing_backups
    exit 0
fi

if [ "$CLEAN_OLD" = true ]; then
    clean_old_backups
    exit 0
fi

if [ -n "$RESTORE_FILE" ]; then
    restore_from_backup "$RESTORE_FILE"
    exit 0
fi

if [ "$SCHEDULE_BACKUP" = true ]; then
    setup_scheduled_backup
    exit 0
fi

# 执行备份
create_backup

if [ "$REMOTE_BACKUP" = true ]; then
    remote_backup
fi

print_message $GREEN "🎉 备份操作完成！"
print_message $BLUE "🔗 相关命令:"
echo "   - 列出备份: $0 -l"
echo "   - 清理旧备份: $0 -C"
echo "   - 恢复备份: $0 -R <备份文件>"

exit 0
