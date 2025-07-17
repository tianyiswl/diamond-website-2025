@echo off
REM 🚀 钻石网站服务重启脚本 (Windows版本)
REM 确保服务在正确的端口(3001)上运行

echo 🔄 重启钻石网站服务...

REM 设置环境变量
set NODE_ENV=production
set PORT=3001
set TZ=Asia/Shanghai

REM 停止现有的Node.js进程
echo 📋 停止现有的Node.js进程...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

REM 检查端口占用并释放
echo 🔍 检查端口占用情况...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    echo ⚠️  终止3000端口进程: %%a
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do (
    echo ⚠️  终止3001端口进程: %%a
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 >nul

REM 启动服务
echo 🚀 启动服务在端口3001...
echo 环境: %NODE_ENV%
echo 端口: %PORT%
echo 时区: %TZ%
echo.

REM 启动Node.js服务
start "Diamond Website" node server.js

REM 等待服务启动
echo ⏳ 等待服务启动...
timeout /t 5 >nul

REM 检查服务是否启动成功
echo 🔍 检查服务状态...
netstat -an | findstr :3001 >nul
if %errorlevel% equ 0 (
    echo ✅ 服务在3001端口启动成功
) else (
    echo ❌ 服务启动失败，请检查日志
    pause
    exit /b 1
)

REM 测试服务响应
echo 🧪 测试服务响应...
curl -s http://localhost:3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 服务响应正常
) else (
    echo ⚠️  服务可能还在启动中，请稍后测试
)

echo.
echo 🎉 服务重启完成！
echo.
echo 📊 服务信息:
echo    - 应用端口: 3001
echo    - 域名: diamond-autopart.com
echo    - 本地测试: http://localhost:3001
echo    - 在线访问: https://diamond-autopart.com
echo.
echo 🔍 检查命令:
echo    - 查看进程: tasklist ^| findstr node
echo    - 查看端口: netstat -an ^| findstr :3001
echo    - 测试访问: curl http://localhost:3001
echo.

pause
