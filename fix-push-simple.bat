@echo off
chcp 65001 >nul
echo 🔧 修复Git推送冲突
cd /d "f:\pycode\diamond-website-2025"

echo 第1步: 提交本地更改
"C:\Program Files\Git\bin\git.exe" add .
"C:\Program Files\Git\bin\git.exe" commit -m "fix: 提交本地更改准备合并"

echo.
echo 第2步: 获取远程更改
"C:\Program Files\Git\bin\git.exe" fetch deploy

echo.
echo 第3步: 合并远程更改
"C:\Program Files\Git\bin\git.exe" merge deploy/master --no-edit

echo.
echo 第4步: 推送到远程
"C:\Program Files\Git\bin\git.exe" push deploy master

echo.
echo ✅ 完成！
pause
