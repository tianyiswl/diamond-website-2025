# 🪟 Windows PostgreSQL 数据库设置脚本
# 无锡皇德国际贸易有限公司 - Diamond Website

Write-Host "🪟 Windows PostgreSQL 数据库设置" -ForegroundColor Blue
Write-Host "🏢 无锡皇德国际贸易有限公司" -ForegroundColor Green
Write-Host ""

# 检查PostgreSQL是否安装
function Test-PostgreSQL {
    try {
        $version = & psql --version 2>$null
        if ($version) {
            Write-Host "✅ PostgreSQL 已安装: $version" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "❌ PostgreSQL 未安装或不在PATH中" -ForegroundColor Red
        Write-Host "请确保PostgreSQL已安装并添加到系统PATH" -ForegroundColor Yellow
        return $false
    }
}

# 创建数据库设置SQL脚本
function Create-DatabaseScript {
    $sqlScript = @"
-- Diamond Website 数据库设置脚本
-- 无锡皇德国际贸易有限公司

-- 创建数据库
CREATE DATABASE diamond_website;

-- 创建用户
CREATE USER diamond_user WITH PASSWORD 'diamond_secure_2025';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE diamond_website TO diamond_user;
ALTER USER diamond_user CREATEDB;

-- 显示结果
\l
\du

-- 退出
\q
"@

    $sqlScript | Out-File -FilePath "setup-database.sql" -Encoding UTF8
    Write-Host "✅ 已创建数据库设置脚本: setup-database.sql" -ForegroundColor Green
}

# 更新.env文件
function Update-EnvFile {
    $envPath = ".env"
    
    if (Test-Path $envPath) {
        Write-Host "📝 更新 .env 文件..." -ForegroundColor Blue
        
        # 读取现有内容
        $content = Get-Content $envPath -Raw
        
        # 更新数据库连接字符串
        $newDatabaseUrl = 'DATABASE_URL="postgresql://diamond_user:diamond_secure_2025@localhost:5432/diamond_website?schema=public"'
        
        if ($content -match 'DATABASE_URL=') {
            $content = $content -replace 'DATABASE_URL=.*', $newDatabaseUrl
        } else {
            $content += "`n$newDatabaseUrl"
        }
        
        # 确保其他数据库配置存在
        $dbConfigs = @(
            'DB_HOST=localhost',
            'DB_PORT=5432',
            'DB_NAME=diamond_website',
            'DB_USER=diamond_user',
            'DB_PASSWORD=diamond_secure_2025',
            'DB_SCHEMA=public'
        )
        
        foreach ($config in $dbConfigs) {
            $key = $config.Split('=')[0]
            if ($content -notmatch "$key=") {
                $content += "`n$config"
            }
        }
        
        # 写回文件
        $content | Out-File -FilePath $envPath -Encoding UTF8
        Write-Host "✅ .env 文件已更新" -ForegroundColor Green
    } else {
        Write-Host "❌ .env 文件不存在" -ForegroundColor Red
    }
}

# 主执行流程
function Main {
    Write-Host "🔍 检查PostgreSQL安装..." -ForegroundColor Blue
    
    if (-not (Test-PostgreSQL)) {
        Write-Host ""
        Write-Host "📋 PostgreSQL安装指南:" -ForegroundColor Yellow
        Write-Host "1. 访问 https://www.postgresql.org/download/windows/"
        Write-Host "2. 下载并安装PostgreSQL"
        Write-Host "3. 安装时记住设置的postgres用户密码"
        Write-Host "4. 确保将PostgreSQL bin目录添加到系统PATH"
        Write-Host ""
        Write-Host "常见安装路径:"
        Write-Host "  C:\Program Files\PostgreSQL\15\bin"
        Write-Host "  C:\Program Files\PostgreSQL\14\bin"
        return
    }
    
    Write-Host ""
    Write-Host "🔧 创建数据库设置脚本..." -ForegroundColor Blue
    Create-DatabaseScript
    
    Write-Host ""
    Write-Host "📝 更新环境配置..." -ForegroundColor Blue
    Update-EnvFile
    
    Write-Host ""
    Write-Host "📋 下一步操作:" -ForegroundColor Yellow
    Write-Host "1. 运行以下命令创建数据库（需要输入postgres用户密码）:"
    Write-Host "   psql -U postgres -h localhost -f setup-database.sql" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. 或者手动执行:"
    Write-Host "   psql -U postgres -h localhost" -ForegroundColor Cyan
    Write-Host "   然后在psql中执行 setup-database.sql 中的SQL命令"
    Write-Host ""
    Write-Host "3. 创建数据库后，运行:"
    Write-Host "   node scripts/test-db-connection.js" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "💡 提示: 如果忘记了postgres密码，可以通过pgAdmin重置"
}

# 运行主函数
Main
