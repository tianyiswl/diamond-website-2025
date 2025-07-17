@echo off
echo ========================================
echo Git自动化解决方案 - 简化安装脚本
echo ========================================
echo.

echo 正在检查环境...
git --version >nul 2>&1
if errorlevel 1 (
    echo 错误: Git未安装，请先安装Git
    pause
    exit /b 1
)

echo Git已安装 ✓

echo.
echo 正在安装Git钩子...
if exist ".githooks\install-hooks.sh" (
    echo 请在Git Bash中运行以下命令:
    echo.
    echo   bash .githooks/install-hooks.sh
    echo.
) else (
    echo 错误: 钩子安装脚本不存在
)

echo.
echo 正在配置Git环境...
if exist "git-scripts\setup-git-config.sh" (
    echo 请在Git Bash中运行以下命令:
    echo.
    echo   bash git-scripts/setup-git-config.sh --all
    echo.
) else (
    echo 错误: Git配置脚本不存在
)

echo.
echo ========================================
echo 手动安装步骤:
echo ========================================
echo.
echo 1. 右键点击项目文件夹，选择 "Git Bash Here"
echo.
echo 2. 在Git Bash中运行:
echo    chmod +x install-git-automation.sh
echo    ./install-git-automation.sh
echo.
echo 3. 或者分步执行:
echo    bash .githooks/install-hooks.sh
echo    bash git-scripts/setup-git-config.sh --all
echo.
echo ========================================
echo 安装完成后可以使用:
echo ========================================
echo.
echo   bash git-scripts/quick-commit.sh --help
echo   bash git-scripts/branch-manager.sh --help
echo   bash git-scripts/auto-backup.sh --help
echo.

pause
