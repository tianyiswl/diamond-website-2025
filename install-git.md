# 🔧 Git安装和配置指南

## 问题描述
出现"不是内部或外部命令"错误，说明Git没有正确安装或配置。

## 解决方案

### 方案1：安装Git for Windows

1. **下载Git**：
   - 访问：https://git-scm.com/download/win
   - 下载最新版本的Git for Windows

2. **安装Git**：
   - 运行下载的安装程序
   - 选择"Add Git to PATH"选项
   - 其他选项保持默认即可

3. **验证安装**：
   ```cmd
   git --version
   ```

### 方案2：使用GitHub Desktop（推荐）

1. **下载GitHub Desktop**：
   - 访问：https://desktop.github.com/
   - 下载并安装

2. **登录GitHub账号**：
   - 使用您的GitHub账号登录

3. **添加本地仓库**：
   - File → Add Local Repository
   - 选择项目目录：`F:\pycode\diamond-website-new`

4. **提交更改**：
   - 查看修改的文件列表
   - 输入提交信息：`🌍 修复国外服务器登录问题 - v1.1.0`
   - 点击"Commit to master"
   - 点击"Push origin"推送到远程仓库

### 方案3：使用VS Code内置Git

如果您使用VS Code：

1. **打开项目**：在VS Code中打开项目文件夹
2. **查看更改**：点击左侧的源代码管理图标
3. **暂存更改**：点击"+"号暂存所有更改
4. **提交**：输入提交信息并按Ctrl+Enter
5. **推送**：点击"..."菜单选择"Push"

## 🚀 提交信息模板

```
🌍 修复国外服务器登录问题 - v1.1.0

🔍 问题描述:
- 修复在国外服务器部署时登录后立即被弹出的问题
- 解决JWT时区验证、Cookie兼容性、前端竞态条件问题

🛠️ 主要修复:
- JWT时间容差从5分钟扩展到30分钟，支持大时区差异
- 优化Cookie设置，动态适应国外服务器环境
- 增强前端认证检查，添加环境检测和递增重试
- 新增综合诊断工具和测试脚本

📁 修改文件:
- server.js: JWT和Cookie优化
- admin/admin.js: 前端认证优化
- admin/login.html: 登录验证增强
- 新增: fix-overseas-login.js (诊断工具)
- 新增: test-overseas-login.js (测试脚本)
- 新增: OVERSEAS-LOGIN-FIX.md (部署指南)

🎯 预期效果:
- 国外服务器登录成功率 > 95%
- 支持全球各时区部署
- 完整的故障排查工具链

版本: v1.1.0
日期: 2025-07-15
测试: 本地验证通过，JWT验证正常
```

## 📋 提交后验证

提交成功后，访问GitHub仓库确认：
https://github.com/tianyiswl/diamond-website-2025

## 💡 推荐方案

**最简单的方式**：使用GitHub Desktop
- 图形化界面，操作简单
- 自动处理Git配置
- 可视化查看文件更改
- 内置冲突解决工具

**如果喜欢命令行**：重新安装Git for Windows
- 确保选择"Add to PATH"选项
- 安装后重启命令提示符
- 配置用户信息后即可使用
