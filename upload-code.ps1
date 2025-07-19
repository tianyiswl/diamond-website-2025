# 🚀 钻石网站代码上传脚本 (PowerShell)
# 适用于Windows环境，支持多种上传方式

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP,
    
    [Parameter(Mandatory=$true)]
    [string]$Username = "root",
    
    [Parameter(Mandatory=$false)]
    [string]$LocalPath = "f:\pycode\diamond-website-2025",
    
    [Parameter(Mandatory=$false)]
    [string]$RemotePath = "/opt/diamond-website",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("scp", "git", "zip")]
    [string]$Method = "scp",
    
    [Parameter(Mandatory=$false)]
    [string]$SSHKey = "",
    
    [Parameter(Mandatory=$false)]
    [int]$Port = 22
)

# 颜色输出函数
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    $colors = @{
        "Red" = [ConsoleColor]::Red
        "Green" = [ConsoleColor]::Green
        "Yellow" = [ConsoleColor]::Yellow
        "Blue" = [ConsoleColor]::Blue
        "Cyan" = [ConsoleColor]::Cyan
        "White" = [ConsoleColor]::White
    }
    
    Write-Host $Message -ForegroundColor $colors[$Color]
}

function Write-Step {
    param([string]$Message)
    Write-ColorOutput "[STEP] $Message" "Blue"
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "[SUCCESS] $Message" "Green"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "[WARNING] $Message" "Yellow"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "[ERROR] $Message" "Red"
}

# 显示横幅
function Show-Banner {
    Write-ColorOutput @"
╔══════════════════════════════════════════════════════════════╗
║                    🚀 钻石网站代码上传工具                    ║
║                                                              ║
║  支持多种上传方式：                                          ║
║  • SCP 直接上传                                              ║
║  • Git 仓库同步                                              ║
║  • ZIP 压缩上传                                              ║
║                                                              ║
║  无锡皇德国际贸易有限公司 - 专业汽车零件展示平台              ║
╚══════════════════════════════════════════════════════════════╝
"@ "Cyan"
}

# 检查本地环境
function Test-LocalEnvironment {
    Write-Step "检查本地环境..."
    
    # 检查本地项目目录
    if (-not (Test-Path $LocalPath)) {
        Write-Error "本地项目目录不存在: $LocalPath"
        return $false
    }
    
    # 检查关键文件
    $requiredFiles = @("server.js", "package.json", "data", "assets")
    foreach ($file in $requiredFiles) {
        $filePath = Join-Path $LocalPath $file
        if (-not (Test-Path $filePath)) {
            Write-Error "缺少关键文件或目录: $file"
            return $false
        }
    }
    
    Write-Success "本地环境检查通过"
    return $true
}

# 检查SSH连接
function Test-SSHConnection {
    Write-Step "测试SSH连接..."
    
    $sshCommand = if ($SSHKey) {
        "ssh -i `"$SSHKey`" -p $Port -o ConnectTimeout=10 $Username@$ServerIP 'echo SSH连接成功'"
    } else {
        "ssh -p $Port -o ConnectTimeout=10 $Username@$ServerIP 'echo SSH连接成功'"
    }
    
    try {
        $result = Invoke-Expression $sshCommand 2>$null
        if ($result -match "SSH连接成功") {
            Write-Success "SSH连接测试成功"
            return $true
        }
    } catch {
        Write-Error "SSH连接失败: $_"
    }
    
    Write-Warning "SSH连接测试失败，请检查服务器信息和网络连接"
    return $false
}

# 创建排除文件列表
function New-ExcludeList {
    $excludeFile = Join-Path $env:TEMP "diamond-exclude.txt"
    
    $excludePatterns = @(
        "node_modules/"
        ".git/"
        ".vscode/"
        "*.log"
        "*.tmp"
        ".env.local"
        ".env.development"
        "diamond-manual-deploy-*.zip"
        "backup/"
        "logs/"
        "*.bak"
        "*.backup"
        "Thumbs.db"
        ".DS_Store"
    )
    
    $excludePatterns | Out-File -FilePath $excludeFile -Encoding UTF8
    return $excludeFile
}

# 方式1: SCP上传
function Upload-BySCP {
    Write-Step "使用SCP方式上传代码..."
    
    # 创建排除文件列表
    $excludeFile = New-ExcludeList
    
    # 准备SSH命令参数
    $sshArgs = if ($SSHKey) {
        "-i `"$SSHKey`" -P $Port"
    } else {
        "-P $Port"
    }
    
    try {
        # 创建远程目录
        Write-Step "创建远程目录..."
        $createDirCommand = if ($SSHKey) {
            "ssh -i `"$SSHKey`" -p $Port $Username@$ServerIP 'mkdir -p $RemotePath && chown -R www-data:www-data $RemotePath'"
        } else {
            "ssh -p $Port $Username@$ServerIP 'mkdir -p $RemotePath && chown -R www-data:www-data $RemotePath'"
        }
        Invoke-Expression $createDirCommand
        
        # 使用rsync同步文件（如果可用）
        if (Get-Command rsync -ErrorAction SilentlyContinue) {
            Write-Step "使用rsync同步文件..."
            $rsyncCommand = "rsync -avz --progress --exclude-from=`"$excludeFile`" -e `"ssh -p $Port`" `"$LocalPath/`" $Username@$ServerIP:$RemotePath/"
            Invoke-Expression $rsyncCommand
        } else {
            # 使用scp上传（需要先压缩）
            Write-Step "压缩项目文件..."
            $zipFile = Join-Path $env:TEMP "diamond-website-upload.zip"
            
            # 压缩文件，排除不需要的目录
            $compress = @{
                Path = Get-ChildItem $LocalPath | Where-Object { 
                    $_.Name -notin @("node_modules", ".git", "backup", "logs") 
                }
                DestinationPath = $zipFile
                Force = $true
            }
            Compress-Archive @compress
            
            Write-Step "上传压缩文件..."
            $scpCommand = if ($SSHKey) {
                "scp -i `"$SSHKey`" -P $Port `"$zipFile`" $Username@$ServerIP:$RemotePath/"
            } else {
                "scp -P $Port `"$zipFile`" $Username@$ServerIP:$RemotePath/"
            }
            Invoke-Expression $scpCommand
            
            # 在服务器上解压
            Write-Step "在服务器上解压文件..."
            $unzipCommand = if ($SSHKey) {
                "ssh -i `"$SSHKey`" -p $Port $Username@$ServerIP 'cd $RemotePath && unzip -o diamond-website-upload.zip && rm diamond-website-upload.zip'"
            } else {
                "ssh -p $Port $Username@$ServerIP 'cd $RemotePath && unzip -o diamond-website-upload.zip && rm diamond-website-upload.zip'"
            }
            Invoke-Expression $unzipCommand
            
            # 清理本地临时文件
            Remove-Item $zipFile -Force
        }
        
        Write-Success "SCP上传完成"
        return $true
        
    } catch {
        Write-Error "SCP上传失败: $_"
        return $false
    } finally {
        # 清理排除文件
        if (Test-Path $excludeFile) {
            Remove-Item $excludeFile -Force
        }
    }
}

# 方式2: Git上传
function Upload-ByGit {
    Write-Step "使用Git方式上传代码..."
    
    try {
        # 检查是否为Git仓库
        Push-Location $LocalPath
        
        if (-not (Test-Path ".git")) {
            Write-Warning "当前目录不是Git仓库，正在初始化..."
            git init
            git add .
            git commit -m "Initial commit for deployment"
        }
        
        # 检查是否有远程仓库
        $remotes = git remote
        if (-not $remotes) {
            Write-Warning "未配置远程仓库，请先配置Git远程仓库"
            Write-ColorOutput "配置示例:" "Yellow"
            Write-ColorOutput "git remote add origin https://github.com/your-username/diamond-website-2025.git" "Yellow"
            Write-ColorOutput "git push -u origin main" "Yellow"
            return $false
        }
        
        # 推送到远程仓库
        Write-Step "推送代码到远程仓库..."
        git add .
        git commit -m "Deploy update $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        git push
        
        # 在服务器上拉取代码
        Write-Step "在服务器上拉取最新代码..."
        $gitPullCommand = if ($SSHKey) {
            "ssh -i `"$SSHKey`" -p $Port $Username@$ServerIP 'cd $RemotePath && git pull origin main'"
        } else {
            "ssh -p $Port $Username@$ServerIP 'cd $RemotePath && git pull origin main'"
        }
        Invoke-Expression $gitPullCommand
        
        Write-Success "Git上传完成"
        return $true
        
    } catch {
        Write-Error "Git上传失败: $_"
        return $false
    } finally {
        Pop-Location
    }
}

# 方式3: ZIP上传
function Upload-ByZip {
    Write-Step "使用ZIP方式上传代码..."
    
    try {
        # 创建临时ZIP文件
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $zipFile = Join-Path $env:TEMP "diamond-website-$timestamp.zip"
        
        Write-Step "压缩项目文件..."
        
        # 获取需要压缩的文件和目录
        $itemsToCompress = Get-ChildItem $LocalPath | Where-Object { 
            $_.Name -notin @("node_modules", ".git", "backup", "logs", "*.log", "*.tmp") 
        }
        
        Compress-Archive -Path $itemsToCompress.FullName -DestinationPath $zipFile -Force
        
        Write-Step "上传ZIP文件到服务器..."
        $scpCommand = if ($SSHKey) {
            "scp -i `"$SSHKey`" -P $Port `"$zipFile`" $Username@$ServerIP:/tmp/"
        } else {
            "scp -P $Port `"$zipFile`" $Username@$ServerIP:/tmp/"
        }
        Invoke-Expression $scpCommand
        
        # 在服务器上处理ZIP文件
        Write-Step "在服务器上解压和部署..."
        $deployCommand = if ($SSHKey) {
            "ssh -i `"$SSHKey`" -p $Port $Username@$ServerIP"
        } else {
            "ssh -p $Port $Username@$ServerIP"
        }
        
        $serverScript = @"
'mkdir -p $RemotePath
cd $RemotePath
unzip -o /tmp/diamond-website-$timestamp.zip
rm /tmp/diamond-website-$timestamp.zip
chown -R www-data:www-data $RemotePath
chmod -R 755 $RemotePath
echo "ZIP部署完成"'
"@
        
        Invoke-Expression "$deployCommand $serverScript"
        
        # 清理本地临时文件
        Remove-Item $zipFile -Force
        
        Write-Success "ZIP上传完成"
        return $true
        
    } catch {
        Write-Error "ZIP上传失败: $_"
        return $false
    }
}

# 安装依赖
function Install-Dependencies {
    Write-Step "在服务器上安装项目依赖..."
    
    $installCommand = if ($SSHKey) {
        "ssh -i `"$SSHKey`" -p $Port $Username@$ServerIP 'cd $RemotePath && npm install --production'"
    } else {
        "ssh -p $Port $Username@$ServerIP 'cd $RemotePath && npm install --production'"
    }
    
    try {
        Invoke-Expression $installCommand
        Write-Success "依赖安装完成"
        return $true
    } catch {
        Write-Error "依赖安装失败: $_"
        return $false
    }
}

# 验证部署
function Test-Deployment {
    Write-Step "验证部署结果..."
    
    $testCommand = if ($SSHKey) {
        "ssh -i `"$SSHKey`" -p $Port $Username@$ServerIP"
    } else {
        "ssh -p $Port $Username@$ServerIP"
    }
    
    $verifyScript = @"
'cd $RemotePath
echo "=== 文件结构检查 ==="
ls -la
echo ""
echo "=== package.json检查 ==="
if [ -f package.json ]; then echo "✅ package.json存在"; else echo "❌ package.json缺失"; fi
echo "=== server.js检查 ==="
if [ -f server.js ]; then echo "✅ server.js存在"; else echo "❌ server.js缺失"; fi
echo "=== data目录检查 ==="
if [ -d data ]; then echo "✅ data目录存在"; else echo "❌ data目录缺失"; fi
echo "=== node_modules检查 ==="
if [ -d node_modules ]; then echo "✅ node_modules存在"; else echo "❌ node_modules缺失"; fi
echo ""
echo "=== 语法检查 ==="
node -c server.js && echo "✅ server.js语法正确" || echo "❌ server.js语法错误"'
"@
    
    try {
        Invoke-Expression "$testCommand $verifyScript"
        Write-Success "部署验证完成"
        return $true
    } catch {
        Write-Error "部署验证失败: $_"
        return $false
    }
}

# 主函数
function Main {
    Show-Banner
    
    Write-ColorOutput "上传参数:" "Cyan"
    Write-ColorOutput "• 服务器: $Username@$ServerIP:$Port" "White"
    Write-ColorOutput "• 本地路径: $LocalPath" "White"
    Write-ColorOutput "• 远程路径: $RemotePath" "White"
    Write-ColorOutput "• 上传方式: $Method" "White"
    Write-ColorOutput "" "White"
    
    # 检查本地环境
    if (-not (Test-LocalEnvironment)) {
        exit 1
    }
    
    # 测试SSH连接
    if (-not (Test-SSHConnection)) {
        Write-Warning "继续执行可能会失败，是否继续？(y/N)"
        $continue = Read-Host
        if ($continue -ne "y" -and $continue -ne "Y") {
            exit 1
        }
    }
    
    # 根据选择的方式上传
    $uploadSuccess = switch ($Method) {
        "scp" { Upload-BySCP }
        "git" { Upload-ByGit }
        "zip" { Upload-ByZip }
        default { 
            Write-Error "不支持的上传方式: $Method"
            $false
        }
    }
    
    if (-not $uploadSuccess) {
        Write-Error "代码上传失败"
        exit 1
    }
    
    # 安装依赖
    if (-not (Install-Dependencies)) {
        Write-Warning "依赖安装失败，请手动执行: npm install --production"
    }
    
    # 验证部署
    Test-Deployment
    
    Write-ColorOutput "" "White"
    Write-Success "🎉 代码上传完成！"
    Write-ColorOutput "" "White"
    Write-ColorOutput "下一步操作:" "Yellow"
    Write-ColorOutput "1. 配置环境变量: nano $RemotePath/.env" "White"
    Write-ColorOutput "2. 启动应用: pm2 start $RemotePath/server.js --name diamond-website" "White"
    Write-ColorOutput "3. 查看状态: pm2 status" "White"
}

# 执行主函数
Main
