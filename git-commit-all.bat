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
"C:\Program Files\Git\bin\git.exe" commit -m "feat: 添加Git自动化解决方案和相关配置文件 - 安装完整的Git自动化工具集 - 添加一键提交、分支管理、自动备份脚本 - 配置Git钩子（pre-commit, pre-push, commit-msg） - 添加Git别名和快捷命令 - 创建详细的使用指南和文档 - 优化项目结构和配置文件 - 修复敏感信息检测的误报问题"

echo.
echo 提交完成！
echo.
echo 查看最新提交信息：
"C:\Program Files\Git\bin\git.exe" log --oneline -1

echo.
echo 查看当前状态：
"C:\Program Files\Git\bin\git.exe" status

pause
