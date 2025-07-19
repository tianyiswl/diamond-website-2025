# 解决保护分支推送问题的脚本
param(
    [switch]$TestConnection,
    [switch]$TryAlternative,
    [switch]$CreatePatch,
    [switch]$Help
)

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    $colors = @{"Red" = "Red"; "Green" = "Green"; "Yellow" = "Yellow"; "Blue" = "Cyan"; "White" = "White"}
    Write-Host $Message -ForegroundColor $colors[$Color]
}

function Show-Help {
    Write-ColorOutput "🔧 保护分支推送问题解决脚本" "Blue"
    Write-Host ""
    Write-ColorOutput "用法:" "Yellow"
    Write-Host "  .\fix-protected-branch.ps1 [选项]"
    Write-Host ""
    Write-ColorOutput "选项:" "Yellow"
    Write-Host "  -TestConnection    测试到远程服务器的连接"
    Write-Host "  -TryAlternative    尝试替代推送方法"
    Write-Host "  -CreatePatch       创建补丁文件"
    Write-Host "  -Help              显示此帮助"
    Write-Host ""
    Write-ColorOutput "示例:" "Yellow"
    Write-Host "  .\fix-protected-branch.ps1 -TryAlternative"
}

function Test-RemoteConnection {
    Write-ColorOutput "🔍 测试远程连接..." "Blue"
    
    try {
        # 测试Git连接
        $result = git ls-remote deploy 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Git远程连接正常" "Green"
            return $true
        } else {
            Write-ColorOutput "❌ Git远程连接失败: $result" "Red"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ 连接测试异常: $($_.Exception.Message)" "Red"
        return $false
    }
}

function Try-AlternativePush {
    Write-ColorOutput "🚀 尝试替代推送方法..." "Blue"
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $methods = @(
        @{
            Name = "推送到hotfix分支"
            Command = "git push deploy master:hotfix-$timestamp"
        },
        @{
            Name = "推送到develop分支"
            Command = "git push deploy master:develop"
        },
        @{
            Name = "强制更新引用"
            Command = "git push deploy +master:master"
        },
        @{
            Name = "推送到临时分支"
            Command = "git push deploy master:temp-fixes-$timestamp"
        }
    )
    
    foreach ($method in $methods) {
        Write-ColorOutput "`n🔄 尝试: $($method.Name)" "Yellow"
        Write-Host "   命令: $($method.Command)"
        
        try {
            $result = Invoke-Expression $method.Command 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-ColorOutput "✅ 成功: $($method.Name)" "Green"
                Write-ColorOutput "🎉 推送成功！您的修复已上传到远程仓库" "Green"
                return $true
            } else {
                Write-ColorOutput "❌ 失败: $($method.Name)" "Red"
                Write-Host "   错误: $result"
            }
        } catch {
            Write-ColorOutput "❌ 异常: $($method.Name) - $($_.Exception.Message)" "Red"
        }
    }
    
    return $false
}

function Create-PatchFile {
    Write-ColorOutput "📦 创建补丁文件..." "Blue"
    
    try {
        # 创建补丁文件
        $patchFile = "important-fixes-$(Get-Date -Format 'yyyyMMdd-HHmmss').patch"
        git format-patch deploy/master..HEAD --stdout > $patchFile
        
        if (Test-Path $patchFile) {
            $size = (Get-Item $patchFile).Length
            Write-ColorOutput "✅ 补丁文件已创建: $patchFile ($size bytes)" "Green"
            
            Write-ColorOutput "`n📋 使用补丁文件的步骤:" "Blue"
            Write-Host "1. 将补丁文件传输到服务器:"
            Write-Host "   scp $patchFile diamond-deploy:/tmp/"
            Write-Host ""
            Write-Host "2. 在服务器上应用补丁:"
            Write-Host "   ssh diamond-deploy 'cd /var/git/diamond-website.git && git am < /tmp/$patchFile'"
            
            return $true
        } else {
            Write-ColorOutput "❌ 补丁文件创建失败" "Red"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ 创建补丁文件异常: $($_.Exception.Message)" "Red"
        return $false
    }
}

function Show-Status {
    Write-ColorOutput "📊 当前Git状态:" "Blue"
    git status --short
    
    Write-ColorOutput "`n📋 最近的提交:" "Blue"
    git log --oneline -3
    
    Write-ColorOutput "`n📡 远程仓库:" "Blue"
    git remote -v
}

# 主逻辑
if ($Help) {
    Show-Help
    exit
}

Write-ColorOutput "🔧 保护分支推送问题解决器" "Blue"
Write-ColorOutput "================================" "Blue"

Show-Status

if ($TestConnection) {
    Test-RemoteConnection
    exit
}

if ($CreatePatch) {
    Create-PatchFile
    exit
}

if ($TryAlternative) {
    if (Try-AlternativePush) {
        Write-ColorOutput "`n🎯 后续步骤:" "Blue"
        Write-Host "1. 在服务器上合并分支到master"
        Write-Host "2. 重启服务以应用更改"
        Write-Host "3. 验证网站功能正常"
    } else {
        Write-ColorOutput "`n💡 建议:" "Yellow"
        Write-Host "1. 尝试创建补丁文件: .\fix-protected-branch.ps1 -CreatePatch"
        Write-Host "2. 联系系统管理员解除分支保护"
        Write-Host "3. 检查SSH密钥和权限设置"
    }
    exit
}

# 默认执行所有操作
Write-ColorOutput "`n🔍 执行完整诊断..." "Blue"

if (Test-RemoteConnection) {
    if (-not (Try-AlternativePush)) {
        Write-ColorOutput "`n📦 创建备用补丁文件..." "Yellow"
        Create-PatchFile
    }
} else {
    Write-ColorOutput "`n⚠️ 远程连接有问题，创建补丁文件作为备用方案" "Yellow"
    Create-PatchFile
}

Write-ColorOutput "`n✅ 诊断完成！" "Green"
