@echo off
REM ===================================
REM Git自动化解决方案 - Windows安装脚本
REM 一键安装和配置所有Git自动化功能
REM ===================================

setlocal enabledelayedexpansion

REM 设置颜色代码
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "PURPLE=[95m"
set "CYAN=[96m"
set "NC=[0m"

REM 显示欢迎信息
echo.
echo %PURPLE%    ╔══════════════════════════════════════════════════════════════╗%NC%
echo %PURPLE%    ║                                                              ║%NC%
echo %PURPLE%    ║               🚀 Git自动化解决方案安装器                      ║%NC%
echo %PURPLE%    ║                                                              ║%NC%
echo %PURPLE%    ║              为 diamond-website-2025 项目定制                ║%NC%
echo %PURPLE%    ║                                                              ║%NC%
echo %PURPLE%    ╚══════════════════════════════════════════════════════════════╝%NC%
echo.

echo %BLUE%✨ 功能特性:%NC%
echo    🔍 智能代码检查和格式化
echo    📝 规范化提交信息验证
echo    🌿 智能分支管理
echo    💾 自动备份和同步
echo    🚀 CI/CD自动化流水线
echo    ⚙️ Git配置优化
echo.

echo %YELLOW%⚠️ 注意事项:%NC%
echo    • 请确保您在项目根目录运行此脚本
echo    • 安装过程中可能需要输入用户信息
echo    • 建议在安装前备份现有Git配置
echo.

pause

REM 检查环境
echo.
echo %CYAN%===================================%NC%
echo %CYAN%🔍 环境检查%NC%
echo %CYAN%===================================%NC%
echo.

REM 检查是否在Git仓库中
if not exist ".git" (
    echo %RED%❌ 当前目录不是Git仓库%NC%
    echo %YELLOW%💡 请在Git仓库根目录运行此脚本%NC%
    pause
    exit /b 1
)

echo %GREEN%✅ Git仓库检查通过%NC%

REM 检查Git版本
git --version >nul 2>&1
if errorlevel 1 (
    echo %RED%❌ Git未安装%NC%
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('git --version') do set git_version=%%i
echo %GREEN%✅ Git版本: !git_version!%NC%

REM 检查Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%⚠️ Node.js未安装，部分功能可能受限%NC%
) else (
    for /f "tokens=*" %%i in ('node --version') do set node_version=%%i
    echo %GREEN%✅ Node.js版本: !node_version!%NC%
)

REM 检查npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%⚠️ npm未安装，代码检查功能可能受限%NC%
) else (
    for /f "tokens=*" %%i in ('npm --version') do set npm_version=%%i
    echo %GREEN%✅ npm版本: !npm_version!%NC%
)

echo %BLUE%📊 环境检查完成%NC%

REM 安装Git钩子
echo.
echo %CYAN%===================================%NC%
echo %CYAN%🎣 安装Git钩子%NC%
echo %CYAN%===================================%NC%
echo.

if exist ".githooks\install-hooks.sh" (
    echo %BLUE%🔧 正在安装Git钩子...%NC%
    
    REM 在Windows上运行bash脚本
    bash .githooks/install-hooks.sh
    if errorlevel 1 (
        echo %RED%❌ Git钩子安装失败%NC%
        pause
        exit /b 1
    )
    
    echo %GREEN%✅ Git钩子安装成功%NC%
    
    REM 测试钩子
    echo %BLUE%🧪 测试Git钩子...%NC%
    bash .githooks/test-hooks.sh
    if errorlevel 1 (
        echo %YELLOW%⚠️ Git钩子测试有警告，但可以继续使用%NC%
    ) else (
        echo %GREEN%✅ Git钩子测试通过%NC%
    )
) else (
    echo %YELLOW%⚠️ Git钩子安装脚本不存在%NC%
)

REM 配置Git环境
echo.
echo %CYAN%===================================%NC%
echo %CYAN%⚙️ 配置Git环境%NC%
echo %CYAN%===================================%NC%
echo.

if exist "git-scripts\setup-git-config.sh" (
    echo %BLUE%🔧 正在配置Git环境...%NC%
    
    REM 询问是否要配置用户信息
    set /p user_config="是否要配置Git用户信息? (Y/n): "
    if /i not "!user_config!"=="n" (
        bash git-scripts/setup-git-config.sh -u
    )
    
    REM 配置全局设置
    echo %BLUE%🌐 配置全局设置...%NC%
    bash git-scripts/setup-git-config.sh -g
    
    REM 配置项目设置
    echo %BLUE%📁 配置项目设置...%NC%
    bash git-scripts/setup-git-config.sh -l
    
    REM 设置Git别名
    echo %BLUE%🔧 设置Git别名...%NC%
    bash git-scripts/setup-git-config.sh -a
    
    echo %GREEN%✅ Git环境配置完成%NC%
) else (
    echo %YELLOW%⚠️ Git配置脚本不存在%NC%
)

REM 安装开发依赖
echo.
echo %CYAN%===================================%NC%
echo %CYAN%📦 安装开发依赖%NC%
echo %CYAN%===================================%NC%
echo.

if exist "package.json" (
    npm --version >nul 2>&1
    if not errorlevel 1 (
        echo %BLUE%📦 检查开发依赖...%NC%
        
        REM 检查是否需要安装prettier
        npm list prettier >nul 2>&1
        if errorlevel 1 (
            set /p install_prettier="是否安装Prettier代码格式化工具? (Y/n): "
            if /i not "!install_prettier!"=="n" (
                npm install --save-dev prettier
                echo %GREEN%✅ Prettier安装完成%NC%
            )
        )
        
        REM 检查是否需要安装eslint
        npm list eslint >nul 2>&1
        if errorlevel 1 (
            set /p install_eslint="是否安装ESLint代码检查工具? (Y/n): "
            if /i not "!install_eslint!"=="n" (
                npm install --save-dev eslint
                echo %GREEN%✅ ESLint安装完成%NC%
            )
        )
        
        echo %GREEN%✅ 开发依赖检查完成%NC%
    ) else (
        echo %YELLOW%⚠️ npm未安装，跳过开发依赖安装%NC%
    )
) else (
    echo %YELLOW%⚠️ package.json不存在，跳过开发依赖安装%NC%
)

REM 创建配置文件
echo.
echo %CYAN%===================================%NC%
echo %CYAN%📝 创建配置文件%NC%
echo %CYAN%===================================%NC%
echo.

REM 创建Prettier配置
if not exist ".prettierrc" (
    (
        echo {
        echo   "semi": true,
        echo   "trailingComma": "es5",
        echo   "singleQuote": true,
        echo   "printWidth": 80,
        echo   "tabWidth": 2,
        echo   "useTabs": false
        echo }
    ) > .prettierrc
    echo %GREEN%✅ Prettier配置文件已创建%NC%
)

REM 创建ESLint配置
if not exist ".eslintrc.js" (
    npm --version >nul 2>&1
    if not errorlevel 1 (
        (
            echo module.exports = {
            echo   env: {
            echo     browser: true,
            echo     es2021: true,
            echo     node: true,
            echo   },
            echo   extends: ['eslint:recommended'],
            echo   parserOptions: {
            echo     ecmaVersion: 12,
            echo     sourceType: 'module',
            echo   },
            echo   rules: {
            echo     'no-console': 'warn',
            echo     'no-unused-vars': 'warn',
            echo     'prefer-const': 'error',
            echo   },
            echo };
        ) > .eslintrc.js
        echo %GREEN%✅ ESLint配置文件已创建%NC%
    )
)

echo %BLUE%📊 配置文件创建完成%NC%

REM 显示安装结果
echo.
echo %CYAN%===================================%NC%
echo %CYAN%🎉 安装完成%NC%
echo %CYAN%===================================%NC%
echo.

echo %GREEN%✅ Git自动化解决方案安装成功！%NC%
echo.

echo %BLUE%📋 已安装的功能:%NC%
echo    🎣 Git钩子 (pre-commit, pre-push, commit-msg)
echo    🚀 一键提交脚本
echo    🌿 分支管理脚本
echo    💾 自动备份脚本
echo    ⚙️ Git配置优化
echo    🔧 开发工具配置
echo.

echo %BLUE%🚀 快速开始:%NC%
echo    # 一键提交
echo    bash git-scripts/quick-commit.sh -a -p "你的提交信息"
echo.
echo    # 创建新分支
echo    bash git-scripts/branch-manager.sh create feature/new-feature
echo.
echo    # 创建备份
echo    bash git-scripts/auto-backup.sh -c -r
echo.
echo    # 查看Git配置
echo    bash git-scripts/setup-git-config.sh -s
echo.

echo %BLUE%📚 文档和帮助:%NC%
echo    📖 完整指南: type GIT_AUTOMATION_GUIDE.md
echo    🔧 钩子配置: type .git-hooks-config
echo    ❓ 脚本帮助: bash git-scripts/[脚本名] --help
echo.

echo %YELLOW%💡 建议下一步:%NC%
echo    1. 阅读完整使用指南: GIT_AUTOMATION_GUIDE.md
echo    2. 测试一次提交流程验证功能
echo    3. 根据团队需求调整钩子配置
echo    4. 设置定时备份任务
echo.

echo %PURPLE%🎊 享受高效的Git工作流程！%NC%
echo.

pause
exit /b 0
