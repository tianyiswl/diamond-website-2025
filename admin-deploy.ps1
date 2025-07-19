# 🔧 管理员级别的直接部署脚本
param(
    [switch]$GitConfig,      # 调整Git配置方案
    [switch]$DirectDeploy,   # 直接文件部署方案
    [switch]$QuickFix,       # 快速修复方案
    [switch]$Help
)

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    $colors = @{"Red" = "Red"; "Green" = "Green"; "Yellow" = "Yellow"; "Blue" = "Cyan"; "White" = "White"}
    Write-Host $Message -ForegroundColor $colors[$Color]
}

function Show-Help {
    Write-ColorOutput "🔧 管理员级别部署脚本" "Blue"
    Write-ColorOutput "========================" "Blue"
    Write-Host ""
    Write-ColorOutput "用法:" "Yellow"
    Write-Host "  .\admin-deploy.ps1 [选项]"
    Write-Host ""
    Write-ColorOutput "选项:" "Yellow"
    Write-Host "  -GitConfig      调整服务器Git配置，允许强制推送"
    Write-Host "  -DirectDeploy   绕过Git，直接部署文件"
    Write-Host "  -QuickFix       快速修复关键文件"
    Write-Host "  -Help           显示此帮助"
    Write-Host ""
    Write-ColorOutput "示例:" "Yellow"
    Write-Host "  .\admin-deploy.ps1 -GitConfig"
    Write-Host "  .\admin-deploy.ps1 -DirectDeploy"
}

function Adjust-GitConfig {
    Write-ColorOutput "🔧 方案1: 调整服务器Git配置" "Blue"
    Write-ColorOutput "================================" "Blue"
    
    Write-ColorOutput "`n📋 执行步骤:" "Yellow"
    Write-Host "1. SSH登录到服务器并执行以下命令:"
    Write-Host ""
    
    $gitCommands = @"
# 进入Git仓库
cd /var/git/diamond-website.git

# 备份当前配置
git config --list > /tmp/git-config-backup.txt

# 临时禁用分支保护
git config receive.denyNonFastForwards false
git config receive.denyCurrentBranch ignore

echo "✅ Git配置已调整，可以接受强制推送"
"@
    
    Write-Host $gitCommands -ForegroundColor White
    
    Write-ColorOutput "`n2. 在本地执行推送:" "Yellow"
    Write-Host "git push deploy master --force" -ForegroundColor White
    
    Write-ColorOutput "`n3. 推送成功后，恢复保护设置:" "Yellow"
    $restoreCommands = @"
# 恢复安全配置
git config receive.denyNonFastForwards true
git config receive.denyCurrentBranch refuse

echo "✅ 分支保护已恢复"
"@
    Write-Host $restoreCommands -ForegroundColor White
    
    Write-ColorOutput "`n💡 这是最安全和标准的方法！" "Green"
}

function Direct-Deploy {
    Write-ColorOutput "🚀 方案2: 直接文件部署" "Blue"
    Write-ColorOutput "========================" "Blue"
    
    # 定义需要部署的关键文件
    $criticalFiles = @(
        "pages/products.html",
        "assets/js/main.js",
        "assets/js/modules/components/component-manager.js", 
        "assets/js/page-load-manager.js",
        "assets/js/search-fix.js",
        "server.js",
        "index.html"
    )
    
    Write-ColorOutput "`n📦 准备部署包..." "Yellow"
    
    # 创建部署目录
    $deployDir = ".\admin-deploy-package"
    if (Test-Path $deployDir) {
        Remove-Item $deployDir -Recurse -Force
    }
    New-Item -ItemType Directory -Force -Path $deployDir | Out-Null
    
    $copiedFiles = @()
    foreach ($file in $criticalFiles) {
        if (Test-Path $file) {
            $destPath = Join-Path $deployDir $file
            $destDir = Split-Path $destPath -Parent
            New-Item -ItemType Directory -Force -Path $destDir | Out-Null
            Copy-Item $file $destPath -Force
            $copiedFiles += $file
            Write-Host "✅ 已打包: $file" -ForegroundColor Green
        } else {
            Write-Host "⚠️ 文件不存在: $file" -ForegroundColor Yellow
        }
    }
    
    if ($copiedFiles.Count -gt 0) {
        # 创建压缩包
        $zipFile = "diamond-admin-fixes-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
        Compress-Archive -Path "$deployDir\*" -DestinationPath $zipFile -Force
        
        Write-ColorOutput "`n✅ 部署包已创建: $zipFile" "Green"
        Write-ColorOutput "包含 $($copiedFiles.Count) 个关键修复文件" "Green"
        
        Write-ColorOutput "`n📋 服务器部署步骤:" "Yellow"
        $deployCommands = @"
# 1. 上传部署包
scp $zipFile diamond-deploy:/tmp/

# 2. 在服务器上执行部署
ssh diamond-deploy << 'EOF'
# 创建备份
cp -r /opt/diamond-website /opt/diamond-website-backup-`$(date +%Y%m%d-%H%M%S)

# 停止服务
systemctl stop diamond-website

# 解压并应用修复
cd /tmp
unzip -o $zipFile -d diamond-fixes/
cp -r diamond-fixes/* /opt/diamond-website/

# 设置权限
chown -R diamond:diamond /opt/diamond-website
chmod -R 755 /opt/diamond-website

# 重启服务
systemctl start diamond-website

echo "✅ 部署完成！"
EOF
"@
        Write-Host $deployCommands -ForegroundColor White
        
    } else {
        Write-ColorOutput "❌ 没有找到需要部署的文件" "Red"
    }
}

function Quick-Fix {
    Write-ColorOutput "⚡ 方案3: 快速修复关键问题" "Blue"
    Write-ColorOutput "========================" "Blue"
    
    Write-ColorOutput "`n🎯 针对产品页面脚本重复问题的快速修复" "Yellow"
    
    # 检查产品页面文件
    if (Test-Path "pages/products.html") {
        Write-ColorOutput "`n📋 分析产品页面修复内容..." "Blue"
        
        $content = Get-Content "pages/products.html" -Raw
        $scriptCount = ($content | Select-String '<script.*src.*component-manager' -AllMatches).Matches.Count
        
        if ($scriptCount -le 1) {
            Write-ColorOutput "✅ 产品页面脚本重复问题已修复" "Green"
            Write-Host "   - component-manager脚本引用: $scriptCount 次"
        } else {
            Write-ColorOutput "⚠️ 检测到脚本重复引用: $scriptCount 次" "Yellow"
        }
        
        # 创建单文件快速修复
        $quickFixFile = "products-page-fix.html"
        Copy-Item "pages/products.html" $quickFixFile
        
        Write-ColorOutput "`n🚀 快速部署命令:" "Yellow"
        $quickCommands = @"
# 直接替换产品页面文件
scp $quickFixFile diamond-deploy:/opt/diamond-website/pages/products.html

# 重启服务
ssh diamond-deploy "systemctl restart diamond-website"

echo "✅ 产品页面修复已部署！"
"@
        Write-Host $quickCommands -ForegroundColor White
        
    } else {
        Write-ColorOutput "❌ 未找到产品页面文件" "Red"
    }
}

function Show-CurrentStatus {
    Write-ColorOutput "📊 当前项目状态" "Blue"
    Write-ColorOutput "=================" "Blue"
    
    Write-ColorOutput "`n📋 Git状态:" "Yellow"
    git status --short
    
    Write-ColorOutput "`n📝 最近提交:" "Yellow"
    git log --oneline -3
    
    Write-ColorOutput "`n🔍 关键文件检查:" "Yellow"
    $keyFiles = @("pages/products.html", "server.js", "assets/js/main.js")
    foreach ($file in $keyFiles) {
        if (Test-Path $file) {
            $size = (Get-Item $file).Length
            Write-Host "✅ $file ($size bytes)" -ForegroundColor Green
        } else {
            Write-Host "❌ $file (缺失)" -ForegroundColor Red
        }
    }
}

# 主逻辑
if ($Help) {
    Show-Help
    exit
}

Write-ColorOutput "🔧 管理员级别部署解决方案" "Blue"
Write-ColorOutput "============================" "Blue"

Show-CurrentStatus

if ($GitConfig) {
    Adjust-GitConfig
    exit
}

if ($DirectDeploy) {
    Direct-Deploy
    exit
}

if ($QuickFix) {
    Quick-Fix
    exit
}

# 默认显示所有方案
Write-ColorOutput "`n🎯 可用的管理员解决方案:" "Blue"
Write-Host ""
Write-ColorOutput "方案1: Git配置调整 (推荐)" "Green"
Write-Host "  - 临时禁用分支保护"
Write-Host "  - 允许强制推送"
Write-Host "  - 推送后恢复保护"
Write-Host "  - 命令: .\admin-deploy.ps1 -GitConfig"
Write-Host ""

Write-ColorOutput "方案2: 直接文件部署" "Yellow"
Write-Host "  - 绕过Git系统"
Write-Host "  - 直接上传修复文件"
Write-Host "  - 适合紧急修复"
Write-Host "  - 命令: .\admin-deploy.ps1 -DirectDeploy"
Write-Host ""

Write-ColorOutput "方案3: 快速修复" "Blue"
Write-Host "  - 针对关键问题"
Write-Host "  - 单文件快速部署"
Write-Host "  - 最小影响"
Write-Host "  - 命令: .\admin-deploy.ps1 -QuickFix"

Write-ColorOutput "`n💡 建议: 使用方案1 (Git配置调整) 最为安全和标准" "Green"
