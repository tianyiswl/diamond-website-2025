# 简单的文件大小检查脚本
Write-Host "🔍 检查Git仓库中的文件大小..." -ForegroundColor Cyan

# 检查大于1MB的文件
Write-Host "`n⚠️ 检查大于1MB的文件:" -ForegroundColor Yellow

$largeFiles = @()
git ls-files | ForEach-Object {
    if (Test-Path $_) {
        $file = Get-Item $_
        if ($file.Length -gt 1MB) {
            $largeFiles += [PSCustomObject]@{
                Name = $file.Name
                SizeMB = [math]::Round($file.Length / 1MB, 2)
                Path = $_
            }
        }
    }
}

if ($largeFiles.Count -gt 0) {
    $largeFiles | Sort-Object SizeMB -Descending | Format-Table -AutoSize
    Write-Host "发现 $($largeFiles.Count) 个大于1MB的文件" -ForegroundColor Yellow
} else {
    Write-Host "✅ 未发现超过1MB的大文件" -ForegroundColor Green
}

# 显示前10个最大文件
Write-Host "`n📊 前10个最大文件:" -ForegroundColor Cyan

$allFiles = @()
git ls-files | ForEach-Object {
    if (Test-Path $_) {
        $file = Get-Item $_
        $allFiles += [PSCustomObject]@{
            Name = $file.Name
            SizeMB = [math]::Round($file.Length / 1MB, 2)
            Path = $_
        }
    }
}

$allFiles | Sort-Object SizeMB -Descending | Select-Object -First 10 | Format-Table -AutoSize

# 总体统计
$totalSize = ($allFiles | Measure-Object SizeMB -Sum).Sum
Write-Host "`n📈 仓库统计:" -ForegroundColor Cyan
Write-Host "总文件数: $($allFiles.Count)"
Write-Host "总大小: $([math]::Round($totalSize, 2)) MB"
if ($allFiles.Count -gt 0) {
    Write-Host "平均文件大小: $([math]::Round($totalSize / $allFiles.Count, 2)) MB"
}

Write-Host "`n✅ 检查完成！" -ForegroundColor Green
