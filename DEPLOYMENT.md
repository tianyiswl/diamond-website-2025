# 🚀 Diamond Website CMS - AlmaLinux 10 完整部署指南

> **专业级企业部署方案** | 一键自动化部署 | 生产环境就绪
> 包含安全加固、监控系统、备份恢复的完整解决方案

[![部署状态](https://img.shields.io/badge/部署状态-生产就绪-brightgreen)](#deployment-status)
[![安全等级](https://img.shields.io/badge/安全等级-企业级-blue)](#security-features)
[![监控覆盖](https://img.shields.io/badge/监控覆盖-100%25-orange)](#monitoring-system)
[![备份策略](https://img.shields.io/badge/备份策略-自动化-purple)](#backup-system)

---

## 🎯 一键部署（推荐）

### 🚀 超级快速部署
```bash
# 1. 克隆项目
git clone https://github.com/tianyiswl/diamond-website-2025.git
cd diamond-website-2025

# 2. 检查环境
chmod +x scripts/check-environment.sh
sudo ./scripts/check-environment.sh

# 3. 一键部署（包含所有配置）
chmod +x scripts/deploy.sh
sudo ./scripts/deploy.sh

# 4. 配置安全系统
chmod +x scripts/security-setup.sh
sudo ./scripts/security-setup.sh

# 5. 设置监控系统
chmod +x scripts/monitoring-setup.sh
sudo ./scripts/monitoring-setup.sh

# 6. 配置备份系统
chmod +x scripts/backup-setup.sh
sudo ./scripts/backup-setup.sh
```

### 🌐 访问地址
- **网站首页**: https://your-domain.com
- **管理后台**: https://your-domain.com/admin
- **登录页面**: https://your-domain.com/admin/login.html
- **监控仪表板**: `/opt/diamond-website/monitoring/scripts/dashboard.sh`

---

## 📋 系统要求

### 🖥️ 硬件要求
| 组件 | 最低配置 | 推荐配置 | 企业配置 |
|------|----------|----------|----------|
| **CPU** | 1核心 | 2核心 | 4核心+ |
| **内存** | 2GB | 4GB | 8GB+ |
| **存储** | 10GB | 50GB | 100GB+ |
| **网络** | 10Mbps | 100Mbps | 1Gbps+ |

### 🐧 软件要求
- **操作系统**: AlmaLinux 10 (推荐)
- **Node.js**: 18.0+ (自动安装)
- **数据库**: 文件系统存储 (无需额外数据库)
- **Web服务器**: Nginx (自动配置)
- **SSL证书**: Let's Encrypt (可选配置)

---

## 🏗️ 部署架构

### 📁 完整项目结构
```
diamond-website-2025/
├── 🚀 scripts/                    # 部署脚本
│   ├── check-environment.sh       # 环境检查
│   ├── deploy.sh                  # 一键部署
│   ├── security-setup.sh          # 安全配置
│   ├── monitoring-setup.sh        # 监控配置
│   └── backup-setup.sh            # 备份配置
├── ⚙️ config/                     # 配置文件
│   ├── diamond-website.service    # systemd服务
│   └── nginx-diamond-website.conf # Nginx配置
├── 📄 server.js                   # 主服务器
├── 📦 package.json                # 项目配置
├── 🏠 index.html                  # 网站首页
├── 🛠️ admin/                      # 管理后台
├── 🎨 assets/                     # 静态资源
├── 📊 data/                       # 数据文件
├── 📑 pages/                      # 页面文件
├── 📁 uploads/                    # 上传文件
└── 📖 DEPLOYMENT.md               # 部署指南
```

### 🔧 服务架构图
```
Internet → Nginx (80/443) → Node.js App (3000) → File System
    ↓
Firewall → Fail2ban → SELinux → Monitoring → Backup
```

---

## 🔒 安全特性

### 🛡️ 多层安全防护
- **防火墙**: firewalld + 自定义规则
- **入侵防护**: fail2ban + 实时监控
- **访问控制**: SELinux + 权限隔离
- **SSL加密**: HTTPS + 安全头
- **系统加固**: SSH安全 + 自动更新

### 🔐 安全配置清单
- ✅ 防火墙规则配置
- ✅ SSH密钥认证
- ✅ 禁用root登录
- ✅ fail2ban入侵防护
- ✅ SELinux策略配置
- ✅ SSL证书自动续期
- ✅ 安全头配置
- ✅ 定期安全扫描

---

## 📊 监控系统

### 📈 全方位监控
- **系统监控**: CPU、内存、磁盘、网络
- **应用监控**: 响应时间、错误率、性能指标
- **日志监控**: 访问日志、错误日志、安全日志
- **报警系统**: 邮件通知、阈值监控

### 🔧 监控工具
```bash
# 查看监控仪表板
sudo -u diamond /opt/diamond-website/monitoring/scripts/dashboard.sh

# 查看系统性能
htop
iotop
nload

# 查看应用日志
journalctl -u diamond-website -f

# 查看访问统计
tail -f /var/log/nginx/diamond-website-access.log
```

---

## 💾 备份系统

### 🔄 自动化备份策略
- **数据备份**: 每日凌晨2点
- **系统备份**: 每周日凌晨3点
- **备份保留**: 数据30天，系统90天
- **完整性验证**: MD5校验和

### 📦 备份管理
```bash
# 备份管理工具
/opt/diamond-website/scripts/backup/backup-manager.sh

# 常用命令
backup-manager.sh list          # 列出备份
backup-manager.sh create        # 创建备份
backup-manager.sh restore FILE  # 恢复备份
backup-manager.sh verify FILE   # 验证备份
```

---

## 🚀 高级配置

### 🌐 SSL证书配置
```bash
# 安装Let's Encrypt证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

### ⚡ 性能优化
```bash
# 启用HTTP/2
# 已在Nginx配置中启用

# 配置缓存
# 静态文件缓存已配置

# 启用Gzip压缩
# 已在Nginx配置中启用
```

### 📧 邮件通知配置
```bash
# 配置邮件服务（可选）
sudo dnf install postfix mailx -y
sudo systemctl enable postfix
sudo systemctl start postfix

# 修改监控脚本中的邮箱地址
sudo nano /opt/diamond-website/monitoring/scripts/alert-handler.sh
```

---

## 🔧 运维管理

### 📋 日常维护命令
```bash
# 服务管理
sudo systemctl status diamond-website    # 查看状态
sudo systemctl restart diamond-website   # 重启服务
sudo systemctl stop diamond-website      # 停止服务
sudo systemctl start diamond-website     # 启动服务

# 日志查看
sudo journalctl -u diamond-website -f    # 实时日志
sudo tail -f /var/log/nginx/diamond-website-access.log  # 访问日志
sudo tail -f /var/log/diamond-website/alerts/system-alerts.log  # 系统警报

# 性能监控
sudo htop                                 # 系统资源
sudo iotop                               # 磁盘IO
sudo nload                               # 网络流量
```

### 🔄 更新部署
```bash
# 更新应用代码
cd /opt/diamond-website
sudo -u diamond git pull origin master
sudo -u diamond npm install --production
sudo systemctl restart diamond-website

# 更新系统
sudo dnf update -y
sudo reboot  # 如需要
```

---

## 🐛 故障排除

### ❌ 常见问题解决

#### 服务无法启动
```bash
# 检查服务状态
sudo systemctl status diamond-website

# 查看详细日志
sudo journalctl -u diamond-website --no-pager

# 检查端口占用
sudo netstat -tuln | grep 3000

# 检查文件权限
sudo ls -la /opt/diamond-website/
```

#### 网站无法访问
```bash
# 检查Nginx状态
sudo systemctl status nginx

# 检查Nginx配置
sudo nginx -t

# 检查防火墙
sudo firewall-cmd --list-all

# 检查SELinux
sudo getenforce
sudo sealert -a /var/log/audit/audit.log
```

#### 性能问题
```bash
# 检查系统资源
free -h
df -h
top

# 检查应用性能
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/

# 查看错误日志
sudo tail -f /var/log/nginx/diamond-website-error.log
```

---

## 📞 技术支持

### 🏢 联系信息
- **公司**: 无锡皇德国际贸易有限公司
- **技术支持**: 7×24小时
- **邮箱**: ciki@diamond-auto.com
- **电话**: +86 18217576072

### 📚 相关资源
- **项目仓库**: https://github.com/tianyiswl/diamond-website-2025
- **在线文档**: 部署后访问 `/admin` 查看
- **监控面板**: `/opt/diamond-website/monitoring/scripts/dashboard.sh`

---

## 🎉 部署完成检查清单

### ✅ 基础部署
- [ ] 系统环境检查通过
- [ ] 应用服务正常运行
- [ ] Nginx反向代理配置
- [ ] 防火墙规则设置
- [ ] SSL证书配置（可选）

### ✅ 安全配置
- [ ] fail2ban入侵防护
- [ ] SELinux策略配置
- [ ] SSH安全加固
- [ ] 自动安全更新
- [ ] 安全监控脚本

### ✅ 监控系统
- [ ] 系统性能监控
- [ ] 应用状态监控
- [ ] 日志轮转配置
- [ ] 报警机制设置
- [ ] 监控仪表板

### ✅ 备份系统
- [ ] 自动备份任务
- [ ] 备份完整性验证
- [ ] 恢复流程测试
- [ ] 备份清理策略

---

**🔷 © 2025 无锡皇德国际贸易有限公司**
**专业涡轮增压器供应商 | 企业级部署解决方案**

[![部署成功](https://img.shields.io/badge/部署成功-生产就绪-brightgreen)](https://your-domain.com)
[![安全防护](https://img.shields.io/badge/安全防护-企业级-blue)](#security-features)
[![监控覆盖](https://img.shields.io/badge/监控覆盖-100%25-orange)](#monitoring-system)
[![技术支持](https://img.shields.io/badge/技术支持-7x24-red)](#技术支持)
