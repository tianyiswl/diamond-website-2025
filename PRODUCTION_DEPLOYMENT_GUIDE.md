# 🚀 生产环境安全部署指南

## 📋 概述

本指南确保您在生产环境中安全地进行代码更新，**完全保护现有的产品数据和管理员账户信息**。

## 🛡️ 数据安全保证

### ✅ **您的数据是安全的！**

您的项目使用基于文件的数据存储，生产数据存储在以下位置：

- `data/admin-config.json` - 管理员账户信息
- `data/products.json` - 产品数据
- `data/categories.json` - 产品分类
- `data/inquiries.json` - 客户询价记录
- `uploads/products/` - 产品图片

**这些文件通常不会被Git跟踪，因此代码更新不会覆盖它们。**

## 🚀 安全部署流程

### 第一步：数据保护（必须执行）

```bash
# 上传并执行数据保护脚本
chmod +x production-data-protection.sh
sudo ./production-data-protection.sh
```

**此脚本会：**

- ✅ 备份所有生产数据
- ✅ 配置.gitignore保护数据文件
- ✅ 验证数据完整性
- ✅ 创建恢复点

### 第二步：安全代码部署

```bash
# 执行安全部署脚本
chmod +x safe-deploy.sh
sudo ./safe-deploy.sh
```

**此脚本会：**

- ✅ 自动备份当前数据
- ✅ 停止服务
- ✅ 更新代码
- ✅ 保护数据文件
- ✅ 更新依赖
- ✅ 重启服务
- ✅ 验证部署结果

### 第三步：验证部署结果

```bash
# 检查系统状态
chmod +x emergency-data-recovery.sh
./emergency-data-recovery.sh status
```

## 🆘 紧急恢复方案

如果出现任何问题，可以立即恢复：

```bash
# 查看所有备份
./emergency-data-recovery.sh list

# 自动恢复最新备份
./emergency-data-recovery.sh auto

# 恢复指定备份
./emergency-data-recovery.sh restore backup-filename.tar.gz
```

## 📁 文件结构说明

```
/opt/diamond-website/          # 项目根目录
├── data/                      # 🔒 数据文件（受保护）
│   ├── admin-config.json      # 管理员账户
│   ├── products.json          # 产品数据
│   ├── categories.json        # 产品分类
│   └── inquiries.json         # 客户询价
├── uploads/                   # 🔒 上传文件（受保护）
│   └── products/              # 产品图片
├── server.js                  # 🔄 应用代码（会更新）
├── package.json               # 🔄 依赖配置（会更新）
└── .gitignore                 # 🛡️ Git忽略配置

/backup/diamond-website/       # 备份目录
├── pre-deploy/                # 部署前备份
├── daily/                     # 每日自动备份
└── logs/                      # 备份日志
```

## ⚙️ 自动化配置

### 设置自动备份（推荐）

```bash
# 安装自动备份系统
sudo chmod +x scripts/backup-setup.sh
sudo ./scripts/backup-setup.sh
```

**自动备份计划：**

- 📅 每日凌晨2点：数据备份
- 📅 每周日凌晨3点：系统配置备份
- 📅 每日凌晨4点：清理过期备份

### 监控服务状态

```bash
# 查看服务状态
systemctl status diamond-website

# 查看实时日志
journalctl -u diamond-website -f

# 重启服务
systemctl restart diamond-website
```

## 🔧 常用管理命令

### 备份管理

```bash
# 创建手动备份
./scripts/backup/backup-manager.sh create

# 列出所有备份
./scripts/backup/backup-manager.sh list

# 验证备份完整性
./scripts/backup/backup-manager.sh verify backup-file.tar.gz
```

### 服务管理

```bash
# 启动服务
systemctl start diamond-website

# 停止服务
systemctl stop diamond-website

# 重启服务
systemctl restart diamond-website

# 查看服务状态
systemctl status diamond-website
```

### 数据管理

```bash
# 验证数据完整性
./emergency-data-recovery.sh verify

# 查看系统状态
./emergency-data-recovery.sh status
```

## 🚨 故障排除

### 问题1：服务启动失败

```bash
# 查看详细错误信息
systemctl status diamond-website
journalctl -u diamond-website --no-pager -n 50

# 检查端口占用
netstat -tlnp | grep 3000

# 手动启动测试
cd /opt/diamond-website
node server.js
```

### 问题2：数据文件丢失

```bash
# 立即恢复最新备份
./emergency-data-recovery.sh auto

# 或恢复指定备份
./emergency-data-recovery.sh restore backup-filename.tar.gz
```

### 问题3：权限问题

```bash
# 修复文件权限
sudo chown -R diamond:diamond /opt/diamond-website
sudo chmod -R 755 /opt/diamond-website
```

## 📊 最佳实践

### 1. 部署前检查清单

- [ ] 执行数据保护脚本
- [ ] 确认备份创建成功
- [ ] 检查服务当前状态
- [ ] 确认磁盘空间充足

### 2. 部署后验证清单

- [ ] 服务正常启动
- [ ] 端口正常监听
- [ ] 数据文件完整
- [ ] 管理后台可访问
- [ ] 产品数据显示正常

### 3. 定期维护任务

- [ ] 每周检查备份状态
- [ ] 每月测试恢复流程
- [ ] 每季度清理旧备份
- [ ] 定期更新系统补丁

## 🔐 安全建议

1. **定期更改管理员密码**
2. **启用HTTPS加密传输**
3. **配置防火墙规则**
4. **监控异常访问**
5. **定期备份到远程存储**

## 📞 技术支持

如果遇到问题，请按以下顺序排查：

1. **查看系统状态**: `./emergency-data-recovery.sh status`
2. **检查服务日志**: `journalctl -u diamond-website -f`
3. **验证数据完整性**: `./emergency-data-recovery.sh verify`
4. **如有必要，执行数据恢复**: `./emergency-data-recovery.sh auto`

---

## 🎯 总结

通过使用本指南提供的脚本和流程，您可以：

✅ **100%保护生产数据** - 管理员账户和产品信息绝不丢失
✅ **安全更新代码** - 自动化部署流程，降低人为错误
✅ **快速故障恢复** - 一键恢复到任意备份点
✅ **持续监控保护** - 自动备份和完整性检查

**您的生产数据是安全的！** 🛡️
