# 🚀 直接文件部署脚本 - 绕过Git推送问题
param(
    [switch]$Execute,
    [switch]$Help
)

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    $colors = @{"Red" = "Red"; "Green" = "Green"; "Yellow" = "Yellow"; "Blue" = "Cyan"; "White" = "White"}
    Write-Host $Message -ForegroundColor $colors[$Color]
}

function Show-Help {
    Write-ColorOutput "🚀 直接文件部署脚本" "Blue"
    Write-ColorOutput "===================" "Blue"
    Write-Host ""
    Write-ColorOutput "用法:" "Yellow"
    Write-Host "  .\direct-deploy.ps1 [选项]"
    Write-Host ""
    Write-ColorOutput "选项:" "Yellow"
    Write-Host "  -Execute    执行部署"
    Write-Host "  -Help       显示帮助"
    Write-Host ""
    Write-ColorOutput "说明:" "Yellow"
    Write-Host "  此脚本绕过Git推送问题，直接将修复文件部署到服务器"
}

function Prepare-DeployPackage {
    Write-ColorOutput "📦 准备部署包..." "Blue"
    
    # 定义关键修复文件
    $criticalFiles = @(
        "pages/products.html",                              # 产品页面脚本修复
        "assets/js/main.js",                               # 主JS文件
        "assets/js/modules/components/component-manager.js", # 组件管理器
        "assets/js/page-load-manager.js",                   # 页面加载管理器
        "assets/js/search-fix.js",                          # 搜索修复
        "server.js",                                        # 服务器文件
        "index.html"                                        # 主页
    )
    
    # 创建部署目录
    $deployDir = ".\direct-deploy-package"
    if (Test-Path $deployDir) {
        Remove-Item $deployDir -Recurse -Force
    }
    New-Item -ItemType Directory -Force -Path $deployDir | Out-Null
    
    $copiedFiles = @()
    $missingFiles = @()
    
    foreach ($file in $criticalFiles) {
        if (Test-Path $file) {
            $destPath = Join-Path $deployDir $file
            $destDir = Split-Path $destPath -Parent
            New-Item -ItemType Directory -Force -Path $destDir | Out-Null
            Copy-Item $file $destPath -Force
            $copiedFiles += $file
            Write-ColorOutput "✅ 已打包: $file" "Green"
        } else {
            $missingFiles += $file
            Write-ColorOutput "⚠️ 文件不存在: $file" "Yellow"
        }
    }
    
    if ($copiedFiles.Count -gt 0) {
        # 创建部署信息文件
        $deployInfo = @"
# Diamond Website 直接部署包
部署时间: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
包含文件: $($copiedFiles.Count) 个
修复内容:
- 产品页面脚本重复问题修复
- 页面加载管理器优化
- 搜索功能修复
- 服务器端改进

文件列表:
$($copiedFiles | ForEach-Object { "- $_" } | Out-String)
"@
        $deployInfo | Out-File -FilePath "$deployDir\DEPLOY_INFO.txt" -Encoding UTF8
        
        # 创建压缩包
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $zipFile = "diamond-direct-deploy-$timestamp.zip"
        Compress-Archive -Path "$deployDir\*" -DestinationPath $zipFile -Force
        
        Write-ColorOutput "`n✅ 部署包已创建: $zipFile" "Green"
        Write-ColorOutput "包含 $($copiedFiles.Count) 个关键修复文件" "Green"
        
        return $zipFile
    } else {
        Write-ColorOutput "❌ 没有找到可部署的文件" "Red"
        return $null
    }
}

function Generate-DeployCommands {
    param([string]$ZipFile)
    
    Write-ColorOutput "`n📋 服务器部署命令:" "Blue"
    Write-ColorOutput "==================" "Blue"
    
    $commands = @"
# 1. 上传部署包到服务器
scp $ZipFile diamond-deploy:/tmp/

# 2. 在服务器上执行部署
ssh diamond-deploy << 'DEPLOY_EOF'
#!/bin/bash
set -e

echo "🚀 开始直接文件部署..."

# 创建时间戳备份
BACKUP_DIR="/opt/diamond-website-backup-`$(date +%Y%m%d-%H%M%S)"
echo "📦 创建备份: `$BACKUP_DIR"
cp -r /opt/diamond-website "`$BACKUP_DIR"

# 停止服务
echo "⏹️ 停止服务..."
systemctl stop diamond-website 2>/dev/null || pm2 stop diamond-website 2>/dev/null || true

# 解压部署包
echo "📦 解压部署包..."
cd /tmp
unzip -o $ZipFile -d diamond-deploy/

# 应用文件
echo "🔄 应用文件..."
cp -r diamond-deploy/* /opt/diamond-website/

# 修复权限
echo "🔧 修复权限..."
chown -R diamond:diamond /opt/diamond-website 2>/dev/null || chown -R www-data:www-data /opt/diamond-website 2>/dev/null || true
chmod -R 755 /opt/diamond-website

# 重启服务
echo "🚀 重启服务..."
systemctl start diamond-website 2>/dev/null || pm2 restart diamond-website 2>/dev/null || true

# 等待服务启动
sleep 5

# 验证服务状态
if systemctl is-active diamond-website >/dev/null 2>&1; then
    echo "✅ systemctl服务运行正常"
elif pm2 list | grep -q diamond-website; then
    echo "✅ PM2服务运行正常"
else
    echo "⚠️ 请手动检查服务状态"
fi

# 测试网站响应
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3002 | grep -q "200"; then
    echo "✅ 网站响应正常"
else
    echo "⚠️ 网站响应异常，请检查"
fi

echo "✅ 直接部署完成！"
echo "🔍 请验证以下内容："
echo "   1. 访问产品页面: http://your-domain/pages/products.html"
echo "   2. 检查脚本重复问题是否修复"
echo "   3. 验证搜索功能正常"

# 清理临时文件
rm -rf /tmp/diamond-deploy /tmp/$ZipFile

DEPLOY_EOF

echo "✅ 部署脚本执行完成！"
"@
    
    Write-Host $commands -ForegroundColor White
    
    # 将命令保存到文件
    $commands | Out-File -FilePath "deploy-commands.txt" -Encoding UTF8
    Write-ColorOutput "`n💾 部署命令已保存到: deploy-commands.txt" "Green"
}

function Execute-Deploy {
    Write-ColorOutput "🚀 执行直接部署..." "Blue"
    
    $zipFile = Prepare-DeployPackage
    if ($zipFile) {
        Generate-DeployCommands $zipFile
        
        Write-ColorOutput "`n🎯 下一步操作:" "Yellow"
        Write-Host "1. 复制上面的命令并在终端中执行"
        Write-Host "2. 或者运行: Get-Content deploy-commands.txt | Invoke-Expression"
        Write-Host "3. 验证部署结果"
        
        return $true
    } else {
        return $false
    }
}

# 主逻辑
if ($Help) {
    Show-Help
    exit
}

Write-ColorOutput "🚀 Diamond Website 直接部署工具" "Blue"
Write-ColorOutput "================================" "Blue"

if ($Execute) {
    if (Execute-Deploy) {
        Write-ColorOutput "`n🎉 部署包准备完成！请执行生成的命令。" "Green"
    } else {
        Write-ColorOutput "`n❌ 部署包准备失败。" "Red"
    }
} else {
    Write-ColorOutput "`n💡 使用说明:" "Yellow"
    Write-Host "此工具将创建包含所有重要修复的部署包，绕过Git推送问题。"
    Write-Host ""
    Write-Host "执行部署: .\direct-deploy.ps1 -Execute"
    Write-Host "查看帮助: .\direct-deploy.ps1 -Help"
}
