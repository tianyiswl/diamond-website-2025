# 🚀 PowerShell自动提交脚本
# 用于自动提交国外服务器登录修复到Git

Write-Host "🚀 开始自动提交国外服务器登录修复..." -ForegroundColor Green
Write-Host ""

# 设置工作目录
$projectPath = "F:\pycode\diamond-website-new"
Set-Location $projectPath

Write-Host "📍 当前工作目录: $projectPath" -ForegroundColor Yellow

# 检查Git状态
Write-Host "📋 检查Git状态..." -ForegroundColor Cyan
try {
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "📁 发现以下文件有更改:" -ForegroundColor Yellow
        git status --short
    } else {
        Write-Host "✅ 工作目录干净，没有待提交的更改" -ForegroundColor Green
        exit 0
    }
} catch {
    Write-Host "❌ Git命令执行失败，请检查Git是否正确安装" -ForegroundColor Red
    Write-Host "💡 建议安装Git for Windows: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# 添加所有更改到暂存区
Write-Host "📦 添加所有更改到暂存区..." -ForegroundColor Cyan
try {
    git add .
    Write-Host "✅ 文件添加成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 添加文件失败: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 创建提交
$commitMessage = @"
🌍 修复国外服务器登录问题 - v1.1.0

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
测试: 本地验证通过，JWT验证正常
"@

Write-Host "📝 创建提交..." -ForegroundColor Cyan
try {
    git commit -m $commitMessage
    Write-Host "✅ 提交创建成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 提交创建失败: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 推送到远程仓库
Write-Host "🔄 推送到远程仓库..." -ForegroundColor Cyan
try {
    git push origin master
    Write-Host "✅ 推送成功！" -ForegroundColor Green
} catch {
    Write-Host "❌ 推送失败: $_" -ForegroundColor Red
    Write-Host "💡 可能的解决方案:" -ForegroundColor Yellow
    Write-Host "   1. 检查网络连接" -ForegroundColor White
    Write-Host "   2. 验证GitHub访问权限" -ForegroundColor White
    Write-Host "   3. 尝试先拉取最新更改: git pull origin master" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "🎉 提交完成！所有更改已成功推送到GitHub" -ForegroundColor Green
Write-Host ""

# 显示提交摘要
Write-Host "📊 提交摘要:" -ForegroundColor Cyan
Write-Host "- 修复了国外服务器登录问题" -ForegroundColor White
Write-Host "- 优化了JWT时区验证逻辑" -ForegroundColor White
Write-Host "- 增强了Cookie兼容性" -ForegroundColor White
Write-Host "- 添加了诊断和测试工具" -ForegroundColor White
Write-Host "- 提供了完整的部署指南" -ForegroundColor White
Write-Host ""

Write-Host "🔗 GitHub仓库: https://github.com/tianyiswl/diamond-website-2025" -ForegroundColor Blue
Write-Host ""

# 显示当前Git状态
Write-Host "📋 当前Git状态:" -ForegroundColor Cyan
git status --short

Write-Host ""
Write-Host "🏁 脚本执行完成" -ForegroundColor Green

# 暂停以便查看结果
Read-Host "按任意键继续..."
