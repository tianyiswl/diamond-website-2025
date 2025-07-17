# 🚀 Git自动化解决方案

为 **diamond-website-2025** 项目定制的完整Git工作流自动化系统。

## ⚡ 快速安装

### Windows用户

```cmd
# 运行Windows安装脚本
install-git-automation.bat
```

### Linux/Mac用户

```bash
# 运行Unix安装脚本
chmod +x install-git-automation.sh
./install-git-automation.sh
```

## 🎯 核心功能

- **🔍 智能代码检查** - 自动语法检查、格式化、安全扫描
- **📝 规范化提交** - 提交信息验证、自动格式化
- **🌿 分支管理** - 智能分支创建、合并、清理
- **💾 自动备份** - 定时备份、远程同步
- **🚀 CI/CD集成** - GitHub Actions自动化流水线
- **⚙️ 配置优化** - Git别名、全局配置优化

## 📁 项目结构

```
diamond-website-2025/
├── .githooks/              # Git钩子文件
│   ├── pre-commit         # 提交前检查
│   ├── pre-push           # 推送前验证
│   ├── commit-msg         # 提交信息验证
│   └── install-hooks.sh   # 钩子安装脚本
├── git-scripts/           # 自动化脚本
│   ├── quick-commit.sh    # 一键提交脚本
│   ├── branch-manager.sh  # 分支管理脚本
│   ├── auto-backup.sh     # 自动备份脚本
│   └── setup-git-config.sh # Git配置脚本
├── .github/workflows/     # GitHub Actions
│   ├── ci-cd.yml         # CI/CD流水线
│   └── release.yml       # 自动发布流程
├── install-git-automation.sh   # Unix安装脚本
├── install-git-automation.bat  # Windows安装脚本
├── GIT_AUTOMATION_GUIDE.md     # 完整使用指南
└── .gitignore            # 优化的忽略文件
```

## 🚀 快速使用

### 一键提交

```bash
# 基础提交
./git-scripts/quick-commit.sh "修复登录bug"

# 添加所有文件并推送
./git-scripts/quick-commit.sh -a -p "完成用户认证功能"

# 规范化提交
./git-scripts/quick-commit.sh -t feat -s auth "添加用户登录功能"
```

### 分支管理

```bash
# 创建新分支
./git-scripts/branch-manager.sh create feature/user-profile

# 切换分支
./git-scripts/branch-manager.sh switch develop

# 合并分支
./git-scripts/branch-manager.sh merge feature/user-profile

# 清理已合并的分支
./git-scripts/branch-manager.sh clean
```

### 自动备份

```bash
# 创建压缩备份并推送到远程
./git-scripts/auto-backup.sh -c -r

# 列出现有备份
./git-scripts/auto-backup.sh -l

# 清理旧备份
./git-scripts/auto-backup.sh -C
```

## 🔧 Git别名

安装后可使用以下便捷别名：

```bash
git st          # git status
git co          # git checkout
git br          # git branch
git lol         # 美化的日志图形
git quick       # 一键提交脚本
git branch-mgr  # 分支管理脚本
git backup      # 自动备份脚本
```

## 📚 详细文档

- **📖 完整使用指南**: [GIT_AUTOMATION_GUIDE.md](GIT_AUTOMATION_GUIDE.md)
- **🔧 钩子配置**: `.git-hooks-config`
- **❓ 脚本帮助**: `./git-scripts/[脚本名] --help`

## 🛠️ 自定义配置

### 钩子配置

编辑 `.git-hooks-config` 文件自定义钩子行为：

```bash
# 钩子开关
PRE_COMMIT_ENABLED=true
PRE_PUSH_ENABLED=true
COMMIT_MSG_ENABLED=true

# 检查配置
SYNTAX_CHECK=true
FORMAT_CHECK=true
SECURITY_CHECK=true
```

### CI/CD配置

GitHub Actions配置文件位于 `.github/workflows/`：

- `ci-cd.yml` - 主要CI/CD流水线
- `release.yml` - 自动发布流程

## ❓ 常见问题

### Q: 钩子不执行怎么办？

```bash
# 重新安装钩子
./.githooks/install-hooks.sh

# 检查钩子路径
git config core.hooksPath
```

### Q: 如何跳过钩子验证？

```bash
# 跳过pre-commit钩子
git commit --no-verify -m "紧急修复"
```

### Q: 如何卸载所有配置？

```bash
# 卸载钩子
./.githooks/uninstall-hooks.sh

# 重置Git配置
./git-scripts/setup-git-config.sh -r
```

## 🎉 特性亮点

- ✅ **零配置启动** - 一键安装，立即可用
- ✅ **智能检查** - 自动代码质量检查和格式化
- ✅ **安全保护** - 敏感信息扫描，分支保护
- ✅ **团队协作** - 统一的提交规范和工作流
- ✅ **自动化部署** - CI/CD流水线集成
- ✅ **跨平台支持** - Windows/Linux/Mac兼容

## 📞 支持

- 📖 查看完整指南: `GIT_AUTOMATION_GUIDE.md`
- 🔧 检查配置: `./git-scripts/setup-git-config.sh -s`
- ❓ 获取帮助: `./git-scripts/[脚本名] --help`

---

**让Git工作流变得简单高效！** 🚀

_版本: 1.0.0 | 更新时间: 2025-01-17_
