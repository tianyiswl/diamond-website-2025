#!/bin/bash

echo "🚀 开始提交国外服务器登录修复..."
echo

# 切换到项目目录
cd "$(dirname "$0")"

# 检查Git状态
echo "📋 检查Git状态..."
git status

echo
echo "📦 添加所有更改到暂存区..."
git add .

echo
echo "📝 创建提交..."
git commit -m "🌍 修复国外服务器登录问题 - v1.1.0

🔍 问题描述:
- 修复在国外服务器部署时登录后立即被弹出的问题
- 解决JWT时区验证、Cookie兼容性、前端竞态条件问题

🛠️ 主要修复:
- JWT时间容差从5分钟扩展到30分钟，支持大时区差异
- 优化Cookie设置，动态适应国外服务器环境
- 增强前端认证检查，添加环境检测和递增重试
- 新增综合诊断工具和测试脚本

📁 修改文件:
- server.js: JWT和Cookie优化
- admin/admin.js: 前端认证优化
- admin/login.html: 登录验证增强
- 新增: fix-overseas-login.js (诊断工具)
- 新增: test-overseas-login.js (测试脚本)
- 新增: OVERSEAS-LOGIN-FIX.md (部署指南)

🎯 预期效果:
- 国外服务器登录成功率 > 95%
- 支持全球各时区部署
- 完整的故障排查工具链

版本: v1.1.0
日期: 2025-07-15
测试: 本地验证通过，JWT验证正常"

if [ $? -eq 0 ]; then
    echo
    echo "✅ 提交成功！"
    echo
    echo "🔄 推送到远程仓库..."
    git push origin master
    
    if [ $? -eq 0 ]; then
        echo
        echo "🎉 推送成功！所有更改已同步到GitHub"
        echo
        echo "📊 提交摘要:"
        echo "- 修复了国外服务器登录问题"
        echo "- 优化了JWT时区验证逻辑"
        echo "- 增强了Cookie兼容性"
        echo "- 添加了诊断和测试工具"
        echo "- 提供了完整的部署指南"
        echo
        echo "🔗 GitHub仓库: https://github.com/tianyiswl/diamond-website-2025"
    else
        echo
        echo "❌ 推送失败，请检查网络连接或权限设置"
        echo "💡 您可以稍后手动执行: git push origin master"
    fi
else
    echo
    echo "❌ 提交失败，请检查是否有文件冲突或其他问题"
fi

echo
echo "📋 当前Git状态:"
git status --short

echo
echo "🏁 脚本执行完成"
