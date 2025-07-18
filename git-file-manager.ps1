# 🔧 Git文件大小管理脚本 (Windows PowerShell版本)
# 用于检查、管理和优化Git仓库中的文件大小

param(
    [switch]$CheckLarge,      # 检查大文件
    [switch]$SetLimits,       # 设置Git限制
    [switch]$CleanTemp,       # 清理临时文件
    [switch]$ShowStats,       # 显示仓库统计
    [switch]$Help             # 显示帮助
)

# 颜色输出函数
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    $colors = @{
        "Red" = "Red"
        "Green" = "Green"
        "Yellow" = "Yellow"
        "Blue" = "Cyan"
        "White" = "White"
    }
    
    Write-Host $Message -ForegroundColor $colors[$Color]
}

# 显示标题
function Show-Title {
    param([string]$Title)
    Write-ColorOutput "`n🔧 $Title" "Blue"
    Write-ColorOutput ("=" * 50) "Blue"
}

# 设置Git文件大小限制
function Set-GitLimits {
    Show-Title "设置Git文件大小限制"
    
    try {
        # HTTP缓冲区大小 (500MB)
        git config http.postBuffer 524288000
        Write-ColorOutput "✅ HTTP缓冲区设置为500MB" "Green"
        
        # 包窗口内存 (256MB)
        git config pack.windowMemory 256m
        Write-ColorOutput "✅ 包窗口内存设置为256MB" "Green"
        
        # 包大小限制 (2GB)
        git config pack.packSizeLimit 2g
        Write-ColorOutput "✅ 包大小限制设置为2GB" "Green"
        
        # 显示当前配置
        Write-ColorOutput "`n📋 当前Git配置:" "Blue"
        Write-Host "   HTTP缓冲区: $(git config http.postBuffer) bytes"
        Write-Host "   包窗口内存: $(git config pack.windowMemory)"
        Write-Host "   包大小限制: $(git config pack.packSizeLimit)"
        
    } catch {
        Write-ColorOutput "❌ 设置Git限制失败: $($_.Exception.Message)" "Red"
    }
}

# 检查大文件
function Check-LargeFiles {
    Show-Title "检查仓库中的大文件"
    
    try {
        Write-ColorOutput "🔍 正在扫描Git跟踪的文件..." "Blue"
        
        # 获取所有Git跟踪的文件并按大小排序
        $files = git ls-files | ForEach-Object { 
            $item = Get-Item $_ -ErrorAction SilentlyContinue
            if ($item -and $item.Length -gt 0) {
                [PSCustomObject]@{
                    Name = $item.Name
                    Path = $item.FullName
                    SizeMB = [math]::Round($item.Length / 1MB, 2)
                    SizeBytes = $item.Length
                }
            }
        } | Where-Object { $_ -ne $null } | Sort-Object SizeBytes -Descending
        
        if ($files.Count -eq 0) {
            Write-ColorOutput "⚠️ 未找到任何文件" "Yellow"
            return
        }
        
        # 显示前10个最大文件
        Write-ColorOutput "`n📊 前10个最大文件:" "Blue"
        $files | Select-Object -First 10 | Format-Table Name, SizeMB, Path -AutoSize
        
        # 显示大于1MB的文件
        $largeFiles = $files | Where-Object { $_.SizeMB -gt 1 }
        if ($largeFiles.Count -gt 0) {
            Write-ColorOutput "`n⚠️ 发现 $($largeFiles.Count) 个大于1MB的文件:" "Yellow"
            $largeFiles | Format-Table Name, SizeMB, Path -AutoSize
            
            Write-ColorOutput "💡 建议:" "Blue"
            Write-Host "   1. 考虑使用Git LFS管理这些大文件"
            Write-Host "   2. 检查是否可以压缩或优化这些文件"
            Write-Host "   3. 将不必要的大文件添加到.gitignore"
        } else {
            Write-ColorOutput "✅ 未发现超过1MB的大文件" "Green"
        }
        
        # 显示总体统计
        $totalSize = ($files | Measure-Object SizeBytes -Sum).Sum
        $totalSizeMB = [math]::Round($totalSize / 1MB, 2)
        
        Write-ColorOutput "`n📈 仓库统计:" "Blue"
        Write-Host "   总文件数: $($files.Count)"
        Write-Host "   总大小: $totalSizeMB MB"
        Write-Host "   平均文件大小: $([math]::Round($totalSizeMB / $files.Count, 2)) MB"
        
    } catch {
        Write-ColorOutput "❌ 检查大文件失败: $($_.Exception.Message)" "Red"
    }
}

# 清理临时文件
function Clean-TempFiles {
    Show-Title "清理临时文件"
    
    $tempPatterns = @(
        "*.tmp", "*.temp", "*.log", "*.backup", "*.bak", "*.swp", "*.swo",
        ".DS_Store", "Thumbs.db", "desktop.ini", "*~"
    )
    
    $cleanedFiles = @()
    
    foreach ($pattern in $tempPatterns) {
        try {
            $files = Get-ChildItem -Path . -Recurse -Name $pattern -ErrorAction SilentlyContinue
            foreach ($file in $files) {
                if (Test-Path $file) {
                    $cleanedFiles += $file
                    Remove-Item $file -Force -ErrorAction SilentlyContinue
                }
            }
        } catch {
            Write-ColorOutput "⚠️ 清理 $pattern 时出错: $($_.Exception.Message)" "Yellow"
        }
    }
    
    if ($cleanedFiles.Count -gt 0) {
        Write-ColorOutput "✅ 已清理 $($cleanedFiles.Count) 个临时文件:" "Green"
        $cleanedFiles | ForEach-Object { Write-Host "   - $_" }
    } else {
        Write-ColorOutput "✅ 未发现需要清理的临时文件" "Green"
    }
}

# 显示仓库统计
function Show-RepoStats {
    Show-Title "Git仓库统计信息"
    
    try {
        # 基本信息
        $currentBranch = git rev-parse --abbrev-ref HEAD
        $totalCommits = git rev-list --count HEAD
        $remoteUrl = git remote get-url origin 2>$null
        
        Write-ColorOutput "📊 基本信息:" "Blue"
        Write-Host "   当前分支: $currentBranch"
        Write-Host "   总提交数: $totalCommits"
        if ($remoteUrl) {
            Write-Host "   远程仓库: $remoteUrl"
        }
        
        # 文件统计
        $trackedFiles = (git ls-files).Count
        $untrackedFiles = (git ls-files --others --exclude-standard).Count
        $modifiedFiles = (git diff --name-only).Count
        $stagedFiles = (git diff --cached --name-only).Count
        
        Write-ColorOutput "`n📁 文件状态:" "Blue"
        Write-Host "   已跟踪文件: $trackedFiles"
        Write-Host "   未跟踪文件: $untrackedFiles"
        Write-Host "   已修改文件: $modifiedFiles"
        Write-Host "   已暂存文件: $stagedFiles"
        
        # 仓库大小
        $gitDirSize = if (Test-Path ".git") {
            $size = (Get-ChildItem .git -Recurse -File | Measure-Object Length -Sum).Sum
            [math]::Round($size / 1MB, 2)
        } else { 0 }
        
        Write-ColorOutput "`n💾 存储信息:" "Blue"
        Write-Host "   .git目录大小: $gitDirSize MB"
        
    } catch {
        Write-ColorOutput "❌ 获取仓库统计失败: $($_.Exception.Message)" "Red"
    }
}

# 显示帮助信息
function Show-Help {
    Write-ColorOutput "🔧 Git文件大小管理脚本" "Blue"
    Write-ColorOutput "=" * 50 "Blue"
    
    Write-Host ""
    Write-ColorOutput "用法:" "Yellow"
    Write-Host "   .\git-file-manager.ps1 [选项]"
    
    Write-Host ""
    Write-ColorOutput "选项:" "Yellow"
    Write-Host "   -CheckLarge    检查仓库中的大文件"
    Write-Host "   -SetLimits     设置Git文件大小限制"
    Write-Host "   -CleanTemp     清理临时文件"
    Write-Host "   -ShowStats     显示仓库统计信息"
    Write-Host "   -Help          显示此帮助信息"
    
    Write-Host ""
    Write-ColorOutput "示例:" "Yellow"
    Write-Host "   .\git-file-manager.ps1 -CheckLarge"
    Write-Host "   .\git-file-manager.ps1 -SetLimits"
    Write-Host "   .\git-file-manager.ps1 -CleanTemp"
    Write-Host "   .\git-file-manager.ps1 -ShowStats"
    
    Write-Host ""
    Write-ColorOutput "组合使用:" "Yellow"
    Write-Host "   .\git-file-manager.ps1 -SetLimits -CheckLarge -CleanTemp"
}

# 主函数
function Main {
    if ($Help) {
        Show-Help
        return
    }
    
    if (-not $CheckLarge -and -not $SetLimits -and -not $CleanTemp -and -not $ShowStats) {
        Write-ColorOutput "🚀 执行所有操作..." "Blue"
        Set-GitLimits
        Check-LargeFiles
        Clean-TempFiles
        Show-RepoStats
    } else {
        if ($SetLimits) { Set-GitLimits }
        if ($CheckLarge) { Check-LargeFiles }
        if ($CleanTemp) { Clean-TempFiles }
        if ($ShowStats) { Show-RepoStats }
    }
    
    Write-ColorOutput "`n✅ 操作完成！" "Green"
}

# 执行主函数
Main
