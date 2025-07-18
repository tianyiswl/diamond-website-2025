@echo off
chcp 65001 >nul
echo 开始Git自动化提交流程...
cd /d "f:\pycode\diamond-website-2025"

echo.
echo 第1步：检查Git状态
"C:\Program Files\Git\bin\git.exe" status

echo.
echo 第2步：添加所有文件到暂存区
"C:\Program Files\Git\bin\git.exe" add .

echo.
echo 第3步：创建提交
"C:\Program Files\Git\bin\git.exe" commit -m "fix: 修复产品页面重复脚本引用和清理无关文件 - 删除产品页面中重复的JavaScript脚本引用 - 清理临时文件、测试文件和备份文件 - 优化脚本加载顺序，避免冲突 - 修复页面加载问题，确保正常访问"

echo.
echo 提交完成！
echo.
echo 查看最新提交信息：
"C:\Program Files\Git\bin\git.exe" log --oneline -1

echo.
echo 查看当前状态：
"C:\Program Files\Git\bin\git.exe" status

pause
