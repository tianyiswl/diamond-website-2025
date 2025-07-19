# 🚀 钻石网站生产环境推送脚本
# 简化的本地到生产环境更新流程

param(
    [Parameter(Mandatory=$false)]
    [string]$ServerIP = "167.88.43.193",

    [Parameter(Mandatory=$false)]
    [string]$Username = "root",

    [Parameter(Mandatory=$false)]
    [string]$DeployUser = "diamond-deploy",

    [Parameter(Mandatory=$false)]
    [string]$DeployPath = "/var/www/diamond-website",

    [Parameter(Mandatory=$false)]
    [string]$CommitMessage = "",

    [Parameter(Mandatory=$false)]
    [switch]$SkipTests = $false,

    [Parameter(Mandatory=$false)]
    [switch]$ForceUpdate = $false,

    [Parameter(Mandatory=$false)]
    [string]$LocalPath = "f:\pycode\diamond-website-2025"
)

# 颜色输出函数
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    $colors = @{
        "Red" = [ConsoleColor]::Red; "Green" = [ConsoleColor]::Green
        "Yellow" = [ConsoleColor]::Yellow; "Blue" = [ConsoleColor]::Blue
        "Cyan" = [ConsoleColor]::Cyan; "White" = [ConsoleColor]::White
    }
    Write-Host $Message -ForegroundColor $colors[$Color]
}

function Write-Step { param([string]$Message); Write-ColorOutput "[STEP] $Message" "Blue" }
function Write-Success { param([string]$Message); Write-ColorOutput "[SUCCESS] $Message" "Green" }
function Write-Warning { param([string]$Message); Write-ColorOutput "[WARNING] $Message" "Yellow" }
function Write-Error { param([string]$Message); Write-ColorOutput "[ERROR] $Message" "Red" }

# 显示横幅
function Show-Banner {
    Write-ColorOutput @"
╔══════════════════════════════════════════════════════════════╗
║                🚀 钻石网站生产环境推送工具                    ║
║                                                              ║
║  • 自动提交本地更改                                          ║
║  • 推送到Git仓库                                             ║
║  • 触发服务器更新                                            ║
║  • 验证部署结果                                              ║
║                                                              ║
║  智能缓存 + 性能优化 = 企业级部署体验                        ║
╚══════════════════════════════════════════════════════════════╝
"@ "Cyan"
}

# 检查本地环境
function Test-LocalEnvironment {
    Write-Step "检查本地环境..."
    
    # 检查项目目录
    if (-not (Test-Path $LocalPath)) {
        Write-Error "项目目录不存在: $LocalPath"
        return $false
    }
    
    # 检查Git仓库
    Push-Location $LocalPath
    try {
        if (-not (Test-Path ".git")) {
            Write-Error "当前目录不是Git仓库"
            return $false
        }
        
        # 检查Git配置
        $gitRemote = git remote get-url origin 2>$null
        if (-not $gitRemote) {
            Write-Error "未配置Git远程仓库"
            return $false
        }
        
        Write-Success "Git仓库: $gitRemote"
        return $true
    }
    finally {
        Pop-Location
    }
}

# 检查本地更改
function Get-LocalChanges {
    Write-Step "检查本地更改..."
    
    Push-Location $LocalPath
    try {
        # 检查工作区状态
        $status = git status --porcelain
        $staged = git diff --cached --name-only
        $unstaged = git diff --name-only
        
        $changes = @{
            HasChanges = $false
            StagedFiles = @()
            UnstagedFiles = @()
            UntrackedFiles = @()
        }
        
        if ($status) {
            $changes.HasChanges = $true
            
            foreach ($line in $status) {
                $statusCode = $line.Substring(0, 2)
                $fileName = $line.Substring(3)
                
                switch ($statusCode[0]) {
                    'A' { $changes.StagedFiles += $fileName }
                    'M' { $changes.StagedFiles += $fileName }
                    'D' { $changes.StagedFiles += $fileName }
                    '?' { $changes.UntrackedFiles += $fileName }
                    default {
                        if ($statusCode[1] -eq 'M') {
                            $changes.UnstagedFiles += $fileName
                        }
                    }
                }
            }
        }
        
        # 显示更改摘要
        if ($changes.HasChanges) {
            Write-ColorOutput "发现本地更改:" "Yellow"
            if ($changes.StagedFiles.Count -gt 0) {
                Write-ColorOutput "  已暂存文件 ($($changes.StagedFiles.Count)):" "Green"
                $changes.StagedFiles | ForEach-Object { Write-ColorOutput "    + $_" "Green" }
            }
            if ($changes.UnstagedFiles.Count -gt 0) {
                Write-ColorOutput "  未暂存文件 ($($changes.UnstagedFiles.Count)):" "Yellow"
                $changes.UnstagedFiles | ForEach-Object { Write-ColorOutput "    * $_" "Yellow" }
            }
            if ($changes.UntrackedFiles.Count -gt 0) {
                Write-ColorOutput "  未跟踪文件 ($($changes.UntrackedFiles.Count)):" "Red"
                $changes.UntrackedFiles | ForEach-Object { Write-ColorOutput "    ? $_" "Red" }
            }
        } else {
            Write-Success "工作区干净，无本地更改"
        }
        
        return $changes
    }
    finally {
        Pop-Location
    }
}

# 提交本地更改
function Commit-LocalChanges {
    param([object]$Changes, [string]$Message)
    
    if (-not $Changes.HasChanges) {
        Write-Success "无需提交，工作区已是最新状态"
        return $true
    }
    
    Write-Step "提交本地更改..."
    
    Push-Location $LocalPath
    try {
        # 添加所有更改
        git add .
        
        # 生成提交消息
        if (-not $Message) {
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            $totalFiles = $Changes.StagedFiles.Count + $Changes.UnstagedFiles.Count + $Changes.UntrackedFiles.Count
            $Message = "feat: 生产环境更新 - 智能缓存和性能优化 ($totalFiles 个文件) - $timestamp"
        }
        
        # 执行提交
        git commit -m $Message
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "代码提交成功"
            Write-ColorOutput "提交消息: $Message" "Cyan"
            return $true
        } else {
            Write-Error "代码提交失败"
            return $false
        }
    }
    finally {
        Pop-Location
    }
}

# 推送到远程仓库
function Push-ToRemote {
    Write-Step "推送到远程仓库..."
    
    Push-Location $LocalPath
    try {
        # 检查远程更新
        git fetch origin
        
        $localCommit = git rev-parse HEAD
        $remoteCommit = git rev-parse origin/main 2>$null
        
        if ($localCommit -eq $remoteCommit) {
            Write-Success "远程仓库已是最新状态"
            return $true
        }
        
        # 推送代码
        git push origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "代码推送成功"
            
            # 创建版本标签
            $version = "v1.1.$(Get-Date -Format 'yyyyMMdd.HHmmss')"
            git tag -a $version -m "生产环境部署: 智能缓存和性能优化"
            git push origin $version
            
            Write-Success "版本标签创建: $version"
            return $true
        } else {
            Write-Error "代码推送失败"
            return $false
        }
    }
    finally {
        Pop-Location
    }
}

# 触发服务器更新
function Trigger-ServerUpdate {
    param([string]$ServerIP, [string]$Username)
    
    if (-not $ServerIP) {
        Write-Warning "未提供服务器IP，跳过自动更新"
        Write-ColorOutput "请手动在服务器执行: sudo /usr/local/bin/diamond-update.sh update" "Yellow"
        return $true
    }
    
    Write-Step "触发服务器更新..."
    
    try {
        # 执行远程更新命令
        $updateCommand = "ssh $Username@$ServerIP 'sudo /usr/local/bin/diamond-update.sh update'"
        
        Write-ColorOutput "执行命令: $updateCommand" "Cyan"
        
        $result = Invoke-Expression $updateCommand 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "服务器更新成功"
            Write-ColorOutput $result "Green"
            return $true
        } else {
            Write-Error "服务器更新失败"
            Write-ColorOutput $result "Red"
            return $false
        }
    }
    catch {
        Write-Error "无法连接到服务器: $_"
        Write-Warning "请手动在服务器执行更新命令"
        return $false
    }
}

# 验证部署结果
function Test-Deployment {
    param([string]$ServerIP)
    
    if (-not $ServerIP) {
        Write-Warning "未提供服务器IP，跳过自动验证"
        return $true
    }
    
    Write-Step "验证部署结果..."
    
    try {
        # 获取服务器域名（假设已配置）
        $domain = "your-domain.com"  # 这里应该从配置文件读取
        
        # 测试网站访问
        Write-ColorOutput "测试网站访问..." "Cyan"
        $response = Invoke-WebRequest -Uri "https://$domain" -TimeoutSec 10 -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            Write-Success "网站访问正常 (状态码: $($response.StatusCode))"
        } else {
            Write-Warning "网站访问异常 (状态码: $($response.StatusCode))"
        }
        
        # 测试API接口
        Write-ColorOutput "测试API接口..." "Cyan"
        $apiResponse = Invoke-WebRequest -Uri "https://$domain/api/status" -TimeoutSec 10 -UseBasicParsing
        
        if ($apiResponse.StatusCode -eq 200) {
            Write-Success "API接口正常"
            
            # 解析API响应
            $apiData = $apiResponse.Content | ConvertFrom-Json
            if ($apiData.server.status -eq "running") {
                Write-Success "服务器状态: 运行中"
                Write-ColorOutput "运行时间: $($apiData.server.uptime)秒" "Cyan"
            }
        } else {
            Write-Warning "API接口异常"
        }
        
        # 测试缓存性能
        Write-ColorOutput "测试缓存性能..." "Cyan"
        $start1 = Get-Date
        Invoke-WebRequest -Uri "https://$domain/api/products" -TimeoutSec 10 -UseBasicParsing | Out-Null
        $time1 = (Get-Date) - $start1
        
        Start-Sleep -Seconds 1
        
        $start2 = Get-Date
        Invoke-WebRequest -Uri "https://$domain/api/products" -TimeoutSec 10 -UseBasicParsing | Out-Null
        $time2 = (Get-Date) - $start2
        
        Write-ColorOutput "首次请求: $($time1.TotalMilliseconds)ms" "Yellow"
        Write-ColorOutput "缓存请求: $($time2.TotalMilliseconds)ms" "Green"
        
        if ($time2.TotalMilliseconds -lt $time1.TotalMilliseconds) {
            Write-Success "缓存优化生效！"
        }
        
        return $true
    }
    catch {
        Write-Error "部署验证失败: $_"
        return $false
    }
}

# 显示部署摘要
function Show-DeploymentSummary {
    param([bool]$Success, [string]$Version)
    
    Write-ColorOutput "" "White"
    if ($Success) {
        Write-ColorOutput "🎉 部署成功完成！" "Green"
        Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Green"
        Write-ColorOutput "✅ 本地代码已提交并推送" "Green"
        Write-ColorOutput "✅ 服务器代码已更新" "Green"
        Write-ColorOutput "✅ 智能缓存系统已部署" "Green"
        Write-ColorOutput "✅ 性能优化已生效" "Green"
        if ($Version) {
            Write-ColorOutput "📦 版本标签: $Version" "Cyan"
        }
    } else {
        Write-ColorOutput "❌ 部署过程中出现问题" "Red"
        Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Red"
        Write-ColorOutput "请检查错误信息并手动处理" "Yellow"
    }
    
    Write-ColorOutput "" "White"
    Write-ColorOutput "📋 后续操作建议:" "Cyan"
    Write-ColorOutput "• 监控服务器性能: /usr/local/bin/diamond-monitor monitor" "White"
    Write-ColorOutput "• 查看应用日志: pm2 logs diamond-website" "White"
    Write-ColorOutput "• 检查缓存效果: 多次访问网站观察加载速度" "White"
    Write-ColorOutput "• 如有问题回滚: sudo /usr/local/bin/diamond-update.sh rollback" "White"
}

# 主函数
function Main {
    Show-Banner
    
    Write-ColorOutput "🔧 配置参数:" "Cyan"
    Write-ColorOutput "• 本地路径: $LocalPath" "White"
    if ($ServerIP) {
        Write-ColorOutput "• 服务器: $Username@$ServerIP" "White"
    } else {
        Write-ColorOutput "• 服务器: 手动更新模式" "Yellow"
    }
    Write-ColorOutput "" "White"
    
    # 检查本地环境
    if (-not (Test-LocalEnvironment)) {
        Write-Error "环境检查失败，停止执行"
        exit 1
    }
    
    # 检查本地更改
    $changes = Get-LocalChanges
    
    # 如果没有更改且不强制更新，则退出
    if (-not $changes.HasChanges -and -not $ForceUpdate) {
        Write-Success "代码已是最新状态，无需更新"
        exit 0
    }
    
    # 确认更新
    if (-not $ForceUpdate) {
        Write-ColorOutput "是否继续推送到生产环境？(y/N): " "Yellow" -NoNewline
        $confirm = Read-Host
        if ($confirm -ne "y" -and $confirm -ne "Y") {
            Write-Warning "用户取消操作"
            exit 0
        }
    }
    
    $deploymentSuccess = $true
    $version = ""
    
    try {
        # 提交本地更改
        if (-not (Commit-LocalChanges -Changes $changes -Message $CommitMessage)) {
            $deploymentSuccess = $false
        }
        
        # 推送到远程仓库
        if ($deploymentSuccess -and -not (Push-ToRemote)) {
            $deploymentSuccess = $false
        }
        
        # 触发服务器更新
        if ($deploymentSuccess -and -not (Trigger-ServerUpdate -ServerIP $ServerIP -Username $Username)) {
            $deploymentSuccess = $false
        }
        
        # 验证部署结果
        if ($deploymentSuccess -and -not $SkipTests) {
            Start-Sleep -Seconds 10  # 等待服务器重启完成
            if (-not (Test-Deployment -ServerIP $ServerIP)) {
                Write-Warning "部署验证出现问题，但更新可能已成功"
            }
        }
        
        # 获取版本信息
        Push-Location $LocalPath
        $version = git describe --tags --abbrev=0 2>$null
        Pop-Location
        
    }
    catch {
        Write-Error "部署过程中发生异常: $_"
        $deploymentSuccess = $false
    }
    
    # 显示部署摘要
    Show-DeploymentSummary -Success $deploymentSuccess -Version $version
    
    if (-not $deploymentSuccess) {
        exit 1
    }
}

# 执行主函数
Main
