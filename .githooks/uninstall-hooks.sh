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
