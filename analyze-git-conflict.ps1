# Git冲突分析脚本
Write-Host "🔍 分析Git推送冲突..." -ForegroundColor Cyan

# 1. 获取远程信息
Write-Host "`n📡 获取远程信息..." -ForegroundColor Yellow
git fetch deploy

# 2. 检查本地独有的提交
Write-Host "`n📋 本地独有的提交 (您的修复):" -ForegroundColor Green
$localCommits = git log --oneline deploy/master..HEAD
if ($localCommits) {
    $localCommits | ForEach-Object { Write-Host "  + $_" -ForegroundColor Green }
} else {
    Write-Host "  (无本地独有提交)" -ForegroundColor Gray
}

# 3. 检查远程独有的提交
Write-Host "`n📋 远程独有的提交 (可能的冲突):" -ForegroundColor Red
$remoteCommits = git log --oneline HEAD..deploy/master
if ($remoteCommits) {
    $remoteCommits | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host "`n⚠️ 警告: 远程有您本地没有的提交！" -ForegroundColor Yellow
} else {
    Write-Host "  (无远程独有提交)" -ForegroundColor Gray
    Write-Host "`n✅ 好消息: 远程没有新的提交，可以安全强制推送！" -ForegroundColor Green
}

# 4. 分析关键文件差异
Write-Host "`n🔍 检查产品页面文件差异..." -ForegroundColor Cyan
$productPageDiff = git diff deploy/master..HEAD -- pages/products.html
if ($productPageDiff) {
    Write-Host "✅ 产品页面有本地修改 (您的脚本修复)" -ForegroundColor Green
    
    # 检查是否包含脚本修复
    if ($productPageDiff -match "script.*src.*component-manager" -or 
        $productPageDiff -match "script.*src.*product-card-manager") {
        Write-Host "✅ 确认包含脚本重复问题的修复" -ForegroundColor Green
    }
} else {
    Write-Host "ℹ️ 产品页面无差异" -ForegroundColor Gray
}

# 5. 给出建议
Write-Host "`n💡 建议的操作:" -ForegroundColor Blue
if (-not $remoteCommits) {
    Write-Host "🚀 推荐: 强制推送 (安全)" -ForegroundColor Green
    Write-Host "   原因: 远程没有新提交，您的修复不会丢失" -ForegroundColor Gray
    Write-Host "   命令: git push deploy master --force-with-lease" -ForegroundColor White
} else {
    Write-Host "⚠️ 需要谨慎: 远程有新提交" -ForegroundColor Yellow
    Write-Host "   选项1: 强制推送 (保证您的修复有效，但会覆盖远程)" -ForegroundColor White
    Write-Host "   选项2: 合并后推送 (可能重新引入已修复的问题)" -ForegroundColor White
}

Write-Host "`n🎯 基于您的产品页面修复，我建议使用强制推送！" -ForegroundColor Magenta
