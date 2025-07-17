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
