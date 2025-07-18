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
"C:\Program Files\Git\bin\git.exe" commit -m "fix: 修复Git推送冲突前的本地更改提交 - 修复产品页面重复脚本引用问题 - 清理项目中的临时和测试文件 - 优化脚本加载顺序和页面性能 - 添加Git文件大小管理工具 - 准备与远程仓库合并"

echo.
echo 提交完成！
echo.
echo 查看最新提交信息：
"C:\Program Files\Git\bin\git.exe" log --oneline -1

echo.
echo 查看当前状态：
"C:\Program Files\Git\bin\git.exe" status

pause
