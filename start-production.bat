@echo off
REM 钻石网站CMS生产环境启动脚本 (Windows版本)
echo 🚀 启动钻石网站CMS生产环境...

REM 设置环境变量
set NODE_ENV=production
set TZ=Asia/Shanghai
set PORT=3000

REM 检查Node.js是否安装
echo 📋 检查Node.js安装...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js未安装或不在PATH中
    pause
    exit /b 1
)

for /f "tokens=1 delims=v" %%i in ('node -v') do set node_version=%%i
echo ✅ Node.js版本: %node_version%

REM 检查必要目录
echo 📁 检查必要目录...
if not exist "data" (
    echo ❌ 缺少必要目录: data
    pause
    exit /b 1
)
if not exist "uploads" (
    echo ❌ 缺少必要目录: uploads
    pause
    exit /b 1
)
if not exist "assets" (
    echo ❌ 缺少必要目录: assets
    pause
    exit /b 1
)
if not exist "admin" (
    echo ❌ 缺少必要目录: admin
    pause
    exit /b 1
)
if not exist "pages" (
    echo ❌ 缺少必要目录: pages
    pause
    exit /b 1
)
echo ✅ 所有必要目录检查通过

REM 检查package.json
if not exist "package.json" (
    echo ❌ 缺少package.json文件
    pause
    exit /b 1
)
echo ✅ package.json文件存在

REM 安装依赖
echo 📦 检查并安装依赖...
if not exist "node_modules" (
    echo 📦 安装依赖包...
    npm install --production
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
) else (
    echo ✅ 依赖包已存在
)

REM 启动服务器
echo.
echo 🚀 启动服务器...
echo 环境: %NODE_ENV%
echo 时区: %TZ%
echo 端口: %PORT%
echo.
echo 📱 网站首页: http://localhost:%PORT%
echo 🛠️  管理后台: http://localhost:%PORT%/admin
echo.

REM 启动Node.js服务
node server.js

pause