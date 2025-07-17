# 🚀 Git自动化解决方案完整指南

## 📋 目录

- [🌟 概述](#-概述)
- [⚡ 快速开始](#-快速开始)
- [🔧 组件说明](#-组件说明)
- [📖 使用指南](#-使用指南)
- [🛠️ 高级配置](#️-高级配置)
- [❓ 常见问题](#-常见问题)
- [🔗 相关资源](#-相关资源)

## 🌟 概述

这是一套为 **diamond-website-2025** 项目量身定制的Git自动化解决方案，包含：

### ✨ 核心功能

- 🔍 **智能代码检查** - 自动语法检查、格式化、安全扫描
- 🎯 **规范化提交** - 提交信息验证、自动格式化
- 🌿 **分支管理** - 智能分支创建、合并、清理
- 💾 **自动备份** - 定时备份、远程同步
- 🚀 **CI/CD集成** - GitHub Actions自动化流水线
- ⚙️ **配置优化** - Git别名、全局配置优化

### 🎯 适用场景

- Node.js/Express项目开发
- 团队协作开发
- 代码质量管控
- 自动化部署流程

## ⚡ 快速开始

### 1️⃣ 安装Git钩子

```bash
# 安装所有Git钩子
chmod +x .githooks/install-hooks.sh
./.githooks/install-hooks.sh

# 测试钩子是否正常工作
./.githooks/test-hooks.sh
```

### 2️⃣ 配置Git环境

```bash
# 完整配置（推荐）
chmod +x git-scripts/setup-git-config.sh
./git-scripts/setup-git-config.sh --all

# 或者分步配置
./git-scripts/setup-git-config.sh -u  # 配置用户信息
./git-scripts/setup-git-config.sh -a  # 设置别名
```

### 3️⃣ 开始使用

```bash
# 一键提交
chmod +x git-scripts/quick-commit.sh
./git-scripts/quick-commit.sh -a -p "添加新功能"

# 分支管理
chmod +x git-scripts/branch-manager.sh
./git-scripts/branch-manager.sh create feature/new-feature

# 自动备份
chmod +x git-scripts/auto-backup.sh
./git-scripts/auto-backup.sh -c -r
```

## 🔧 组件说明

### 📁 目录结构

```
diamond-website-2025/
├── .githooks/              # Git钩子文件
│   ├── pre-commit         # 提交前检查
│   ├── pre-push           # 推送前验证
│   ├── commit-msg         # 提交信息验证
│   ├── install-hooks.sh   # 钩子安装脚本
│   └── test-hooks.sh      # 钩子测试脚本
├── git-scripts/           # 自动化脚本
│   ├── quick-commit.sh    # 一键提交脚本
│   ├── branch-manager.sh  # 分支管理脚本
│   ├── auto-backup.sh     # 自动备份脚本
│   └── setup-git-config.sh # Git配置脚本
├── .github/workflows/     # GitHub Actions
│   ├── ci-cd.yml         # CI/CD流水线
│   └── release.yml       # 自动发布流程
└── .gitignore            # 优化的忽略文件
```

### 🎯 Git钩子功能

#### pre-commit (提交前检查)

- ✅ JavaScript语法检查
- ✅ JSON格式验证
- ✅ 代码格式化 (Prettier)
- ✅ 敏感信息扫描
- ✅ 文件大小检查
- ✅ 基础测试运行

#### pre-push (推送前验证)

- ✅ 提交历史检查
- ✅ 提交信息质量验证
- ✅ 完整测试套件运行
- ✅ 依赖安全检查
- ✅ 分支保护验证
- ✅ 推送备份创建

#### commit-msg (提交信息规范)

- ✅ 提交信息长度检查
- ✅ Conventional Commits格式验证
- ✅ 禁用词汇检查
- ✅ Issue引用检测
- ✅ 自动格式化选项

## 📖 使用指南

### 🚀 一键提交脚本

#### 基础用法

```bash
# 简单提交
./git-scripts/quick-commit.sh "修复登录bug"

# 添加所有文件并推送
./git-scripts/quick-commit.sh -a -p "完成用户认证功能"

# 指定提交类型和范围
./git-scripts/quick-commit.sh -t feat -s auth "添加用户登录功能"
```

#### 高级选项

```bash
# 预览操作（不实际执行）
./git-scripts/quick-commit.sh -d "预览提交"

# 跳过Git钩子验证
./git-scripts/quick-commit.sh -n "紧急修复"

# 强制推送（谨慎使用）
./git-scripts/quick-commit.sh -f -p "强制更新"
```

### 🌿 分支管理脚本

#### 分支操作

```bash
# 创建新分支
./git-scripts/branch-manager.sh create feature/user-profile

# 切换分支
./git-scripts/branch-manager.sh switch develop

# 合并分支
./git-scripts/branch-manager.sh merge feature/user-profile

# 删除分支
./git-scripts/branch-manager.sh delete feature/old-feature
```

#### 分支维护

```bash
# 列出所有分支
./git-scripts/branch-manager.sh list

# 显示分支状态
./git-scripts/branch-manager.sh status

# 清理已合并的分支
./git-scripts/branch-manager.sh clean

# 同步远程分支
./git-scripts/branch-manager.sh sync
```

### 💾 自动备份脚本

#### 备份操作

```bash
# 创建基本备份
./git-scripts/auto-backup.sh

# 压缩备份并推送到远程
./git-scripts/auto-backup.sh -c -r

# 备份到指定目录
./git-scripts/auto-backup.sh -d /backup/git

# 列出现有备份
./git-scripts/auto-backup.sh -l
```

#### 备份管理

```bash
# 清理旧备份（7天前）
./git-scripts/auto-backup.sh -C

# 从备份恢复
./git-scripts/auto-backup.sh -R backup-file.tar.gz

# 设置定时备份
./git-scripts/auto-backup.sh -s
```

### ⚙️ Git配置优化

#### 完整配置

```bash
# 执行所有配置
./git-scripts/setup-git-config.sh --all

# 查看当前配置
./git-scripts/setup-git-config.sh -s
```

#### 分步配置

```bash
# 配置用户信息
./git-scripts/setup-git-config.sh -u

# 设置全局配置
./git-scripts/setup-git-config.sh -g

# 配置项目设置
./git-scripts/setup-git-config.sh -l

# 设置Git别名
./git-scripts/setup-git-config.sh -a
```

## 🛠️ 高级配置

### 🎨 自定义Git别名

安装后可使用以下别名：

#### 基础别名

```bash
git st          # git status
git co          # git checkout
git br          # git branch
git ci          # git commit
git df          # git diff
```

#### 高级别名

```bash
git lol         # 美化的日志图形
git s           # 简短状态
git d           # 彩色差异
git cm          # 提交消息
git unstage     # 取消暂存
```

#### 自动化别名

```bash
git quick       # 一键提交脚本
git branch-mgr  # 分支管理脚本
git backup      # 自动备份脚本
```

### 🔧 钩子配置

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
TEST_RUN=true

# 文件大小限制 (字节)
MAX_FILE_SIZE=5242880

# 提交信息配置
MIN_COMMIT_MSG_LENGTH=10
MAX_COMMIT_MSG_LENGTH=72
REQUIRE_CONVENTIONAL_COMMITS=false
```

### 🚀 CI/CD配置

#### GitHub Actions触发条件

- **推送到主分支** - 触发完整CI/CD流程
- **Pull Request** - 运行代码检查和测试
- **版本标签** - 触发自动发布流程
- **定时任务** - 每日安全扫描

#### 环境变量配置

在GitHub仓库设置中配置以下secrets：

- `GITHUB_TOKEN` - 自动生成，用于发布
- `DEPLOY_KEY` - 部署密钥（如需要）
- `SLACK_WEBHOOK` - 通知webhook（可选）

## ❓ 常见问题

### Q: 钩子不执行怎么办？

A: 检查钩子文件权限和路径配置

```bash
# 检查权限
ls -la .githooks/

# 重新安装钩子
./.githooks/install-hooks.sh

# 检查钩子路径
git config core.hooksPath
```

### Q: 提交被钩子阻止怎么办？

A: 根据错误信息修复问题，或临时跳过钩子

```bash
# 跳过pre-commit钩子
git commit --no-verify -m "紧急修复"

# 查看钩子日志
cat .pre-commit.log
```

### Q: 如何自定义提交信息格式？

A: 编辑 `.gitmessage-template` 文件

```bash
# 使用模板
git config commit.template .gitmessage-template

# 编辑模板
code .gitmessage-template
```

### Q: 备份文件太大怎么办？

A: 使用压缩选项或清理不必要的文件

```bash
# 压缩备份
./git-scripts/auto-backup.sh -c

# 清理旧备份
./git-scripts/auto-backup.sh -C
```

### Q: 如何卸载所有配置？

A: 使用重置和卸载脚本

```bash
# 卸载钩子
./.githooks/uninstall-hooks.sh

# 重置Git配置
./git-scripts/setup-git-config.sh -r
```

## 🔗 相关资源

### 📚 文档链接

- [Git官方文档](https://git-scm.com/doc)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Actions文档](https://docs.github.com/en/actions)

### 🛠️ 工具推荐

- [Prettier](https://prettier.io/) - 代码格式化
- [ESLint](https://eslint.org/) - JavaScript代码检查
- [Husky](https://typicode.github.io/husky/) - Git钩子管理

### 📞 支持和反馈

- 项目Issues: 在GitHub仓库提交问题
- 功能建议: 通过Pull Request贡献代码
- 使用交流: 项目讨论区

---

## 🎉 结语

这套Git自动化解决方案将大大提升您的开发效率和代码质量。通过自动化的检查、格式化和部署流程，让您专注于核心业务逻辑的开发。

**记住：好的工具是高效开发的基础！** 🚀

---

_最后更新: 2025-01-17_
_版本: 1.0.0_
