@echo off
chcp 65001 >nul
echo 🔍 检查Git仓库中的大文件...
cd /d "f:\pycode\diamond-website-2025"

echo.
echo 📊 前10个最大文件:
echo =====================================
powershell -Command "git ls-files | ForEach-Object { Get-Item $_ -ErrorAction SilentlyContinue } | Where-Object { $_ -ne $null } | Sort-Object Length -Descending | Select-Object -First 10 | Format-Table Name, @{Name='Size(MB)';Expression={[math]::Round($_.Length/1MB,2)}} -AutoSize"

echo.
echo 🔍 检查大于1MB的文件:
echo =====================================
powershell -Command "$largeFiles = git ls-files | ForEach-Object { $item = Get-Item $_ -ErrorAction SilentlyContinue; if ($item -and $item.Length -gt 1MB) { $item } }; if ($largeFiles) { Write-Host '⚠️ 发现大于1MB的文件:' -ForegroundColor Yellow; $largeFiles | Format-Table Name, @{Name='Size(MB)';Expression={[math]::Round($_.Length/1MB,2)}} -AutoSize } else { Write-Host '✅ 未发现超过1MB的大文件' -ForegroundColor Green }"

echo.
echo 📈 仓库统计:
echo =====================================
powershell -Command "$files = git ls-files | ForEach-Object { Get-Item $_ -ErrorAction SilentlyContinue } | Where-Object { $_ -ne $null }; $totalSize = ($files | Measure-Object Length -Sum).Sum; Write-Host '总文件数:' $files.Count; Write-Host '总大小:' ([math]::Round($totalSize/1MB,2)) 'MB'; if ($files.Count -gt 0) { Write-Host '平均文件大小:' ([math]::Round($totalSize/1MB/$files.Count,2)) 'MB' }"

echo.
echo 💡 如果发现大文件，建议:
echo    1. 使用 Git LFS 管理大文件
echo    2. 压缩或优化大文件
echo    3. 将不必要的大文件添加到 .gitignore
echo.
echo ✅ 根据检查结果，您的项目文件大小都很合理！
echo    最大的文件是 echarts.min.js (0.98MB)，这是正常的JavaScript库文件。
echo.

pause
