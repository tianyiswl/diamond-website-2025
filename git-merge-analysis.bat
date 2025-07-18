@echo off
chcp 65001 >nul
echo 🔍 Git合并安全分析脚本
echo ================================
cd /d "f:\pycode\diamond-website-2025"

echo.
echo 📊 第1步: 分析当前状态
echo --------------------------------
echo 本地分支状态:
"C:\Program Files\Git\bin\git.exe" status --short

echo.
echo 本地最近3次提交:
"C:\Program Files\Git\bin\git.exe" log --oneline -3

echo.
echo 📡 第2步: 获取远程信息
echo --------------------------------
"C:\Program Files\Git\bin\git.exe" fetch deploy

echo.
echo 远程分支最近3次提交:
"C:\Program Files\Git\bin\git.exe" log --oneline deploy/master -3

echo.
echo 🔍 第3步: 分析差异
echo --------------------------------
echo 本地独有的提交 (您的修复):
"C:\Program Files\Git\bin\git.exe" log --oneline deploy/master..HEAD

echo.
echo 远程独有的提交 (可能的冲突):
"C:\Program Files\Git\bin\git.exe" log --oneline HEAD..deploy/master

echo.
echo 📋 第4步: 检查关键文件差异
echo --------------------------------
echo 检查产品页面文件差异:
"C:\Program Files\Git\bin\git.exe" diff deploy/master..HEAD -- pages/products.html | findstr /C:"script src" /C:"component-manager" /C:"product-card-manager"

echo.
echo 🎯 第5步: 安全性评估
echo --------------------------------
echo 正在分析合并安全性...

REM 检查是否有冲突的可能
"C:\Program Files\Git\bin\git.exe" merge-tree $(git merge-base HEAD deploy/master) HEAD deploy/master > merge_preview.txt 2>&1

if exist merge_preview.txt (
    echo 合并预览已生成: merge_preview.txt
    echo.
    echo 预览前10行:
    type merge_preview.txt | more +1 | head -10
) else (
    echo 无法生成合并预览
)

echo.
echo 💡 第6步: 安全建议
echo --------------------------------
echo 基于分析结果的建议:
echo 1. 如果远程独有提交为空 → 可以安全强制推送
echo 2. 如果远程有提交但不涉及您修改的文件 → 可以安全合并
echo 3. 如果远程修改了相同文件 → 需要仔细检查冲突
echo.

pause

echo.
echo 🚀 选择操作方式:
echo ================================
echo 1. 安全合并 (保留所有更改)
echo 2. 强制推送 (覆盖远程，保证本地修复有效)
echo 3. 创建备份分支后强制推送
echo 4. 仅查看详细差异，不执行操作
echo 5. 退出
echo.

set /p choice=请选择操作 (1-5): 

if "%choice%"=="1" goto safe_merge
if "%choice%"=="2" goto force_push
if "%choice%"=="3" goto backup_and_force
if "%choice%"=="4" goto detailed_diff
if "%choice%"=="5" goto exit

:safe_merge
echo.
echo 🔄 执行安全合并...
echo --------------------------------
echo 提交当前更改:
"C:\Program Files\Git\bin\git.exe" add .
"C:\Program Files\Git\bin\git.exe" commit -m "fix: 保存本地修复准备合并"

echo.
echo 执行合并:
"C:\Program Files\Git\bin\git.exe" merge deploy/master --no-edit

if %ERRORLEVEL% EQU 0 (
    echo ✅ 合并成功，推送到远程:
    "C:\Program Files\Git\bin\git.exe" push deploy master
    echo ✅ 推送完成！
) else (
    echo ⚠️ 合并出现冲突，需要手动解决
    echo 冲突文件:
    "C:\Program Files\Git\bin\git.exe" status --short | findstr "UU"
)
goto end

:force_push
echo.
echo ⚠️ 强制推送将覆盖远程更改
set /p confirm=确认要强制推送吗? 这将保证您的修复有效 (y/N): 
if /i not "%confirm%"=="y" goto exit

echo.
echo 🚨 执行强制推送...
"C:\Program Files\Git\bin\git.exe" add .
"C:\Program Files\Git\bin\git.exe" commit -m "fix: 强制推送保证本地修复有效"
"C:\Program Files\Git\bin\git.exe" push deploy master --force-with-lease
echo ✅ 强制推送完成！
goto end

:backup_and_force
echo.
echo 💾 创建备份分支并强制推送...
echo --------------------------------
echo 创建备份分支:
"C:\Program Files\Git\bin\git.exe" branch backup-before-force-push

echo 提交当前更改:
"C:\Program Files\Git\bin\git.exe" add .
"C:\Program Files\Git\bin\git.exe" commit -m "fix: 备份并强制推送本地修复"

echo 强制推送:
"C:\Program Files\Git\bin\git.exe" push deploy master --force-with-lease

echo ✅ 备份分支已创建: backup-before-force-push
echo ✅ 强制推送完成！
goto end

:detailed_diff
echo.
echo 📋 显示详细差异...
echo --------------------------------
echo 产品页面文件的详细差异:
"C:\Program Files\Git\bin\git.exe" diff deploy/master..HEAD -- pages/products.html

echo.
echo 主要JavaScript文件差异:
"C:\Program Files\Git\bin\git.exe" diff deploy/master..HEAD -- assets/js/main.js

echo.
pause
goto exit

:end
echo.
echo 🎉 操作完成！
echo.
echo 📋 验证结果:
"C:\Program Files\Git\bin\git.exe" status
echo.
echo 💡 建议验证:
echo 1. 检查产品页面是否正常: http://localhost:3002/pages/products.html
echo 2. 确认脚本重复问题已修复
echo 3. 验证服务器部署状态

:exit
if exist merge_preview.txt del merge_preview.txt
echo.
pause
