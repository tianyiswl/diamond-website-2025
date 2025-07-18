@echo off
chcp 65001 >nul
echo 🔧 Git推送冲突修复脚本
echo ================================
cd /d "f:\pycode\diamond-website-2025"

echo.
echo 📊 当前Git状态:
echo --------------------------------
"C:\Program Files\Git\bin\git.exe" status --short

echo.
echo 📡 远程仓库配置:
echo --------------------------------
"C:\Program Files\Git\bin\git.exe" remote -v

echo.
echo 🔍 检查本地和远程分支差异:
echo --------------------------------
echo 本地分支信息:
"C:\Program Files\Git\bin\git.exe" log --oneline -3

echo.
echo 🚀 解决方案选择:
echo ================================
echo 1. 安全合并 (推荐) - 先拉取远程更改，然后合并
echo 2. 强制推送 (危险) - 覆盖远程更改
echo 3. 重置到远程 (危险) - 丢弃本地更改
echo 4. 查看详细差异
echo 5. 退出
echo.

set /p choice=请选择操作 (1-5): 

if "%choice%"=="1" goto safe_merge
if "%choice%"=="2" goto force_push
if "%choice%"=="3" goto reset_remote
if "%choice%"=="4" goto show_diff
if "%choice%"=="5" goto exit
goto invalid_choice

:safe_merge
echo.
echo 🔄 执行安全合并...
echo --------------------------------
echo 第1步: 先提交当前更改
"C:\Program Files\Git\bin\git.exe" add .
"C:\Program Files\Git\bin\git.exe" commit -m "fix: 提交本地更改以准备合并"

echo.
echo 第2步: 获取远程更改
"C:\Program Files\Git\bin\git.exe" fetch deploy

echo.
echo 第3步: 尝试合并
"C:\Program Files\Git\bin\git.exe" pull deploy master --no-rebase

echo.
echo 第4步: 推送合并结果
"C:\Program Files\Git\bin\git.exe" push deploy master

echo.
echo ✅ 安全合并完成！
goto end

:force_push
echo.
echo ⚠️  警告: 强制推送将覆盖远程更改！
set /p confirm=确认要强制推送吗? (y/N): 
if /i not "%confirm%"=="y" goto exit

echo.
echo 🚨 执行强制推送...
echo --------------------------------
"C:\Program Files\Git\bin\git.exe" add .
"C:\Program Files\Git\bin\git.exe" commit -m "fix: 强制推送本地更改"
"C:\Program Files\Git\bin\git.exe" push deploy master --force-with-lease

echo.
echo ✅ 强制推送完成！
goto end

:reset_remote
echo.
echo ⚠️  警告: 这将丢弃所有本地更改！
set /p confirm=确认要重置到远程状态吗? (y/N): 
if /i not "%confirm%"=="y" goto exit

echo.
echo 🔄 重置到远程状态...
echo --------------------------------
"C:\Program Files\Git\bin\git.exe" fetch deploy
"C:\Program Files\Git\bin\git.exe" reset --hard deploy/master

echo.
echo ✅ 重置完成！
goto end

:show_diff
echo.
echo 📋 显示详细差异...
echo --------------------------------
"C:\Program Files\Git\bin\git.exe" fetch deploy
echo.
echo 本地独有的提交:
"C:\Program Files\Git\bin\git.exe" log deploy/master..HEAD --oneline

echo.
echo 远程独有的提交:
"C:\Program Files\Git\bin\git.exe" log HEAD..deploy/master --oneline

echo.
pause
goto safe_merge

:invalid_choice
echo.
echo ❌ 无效选择，请重新运行脚本
goto exit

:end
echo.
echo 🎉 操作完成！
echo.
echo 📋 最终状态:
"C:\Program Files\Git\bin\git.exe" status

:exit
echo.
pause
