# 🚀 钻石网站完整部署流程指南

## 📋 部署前准备检查清单

### ✅ **服务器信息确认**

- [ ] 服务器IP地址: `_____________`
- [ ] SSH登录用户: `root` 或 `_____________`
- [ ] SSH端口: `22` 或 `_____________`
- [ ] 域名: `_____________`
- [ ] 管理员邮箱: `_____________`

### ✅ **本地环境准备**

- [ ] 确认本地项目路径: `f:\pycode\diamond-website-2025`
- [ ] 检查项目文件完整性
- [ ] 准备SSH客户端工具（PuTTY、Xshell、或WSL）
- [ ] 准备文件传输工具（WinSCP、FileZilla、或SCP命令）

---

## 🎯 第一阶段：服务器环境准备

### 步骤1：连接服务器并检查环境

```bash
# 1.1 SSH连接服务器
ssh root@your-server-ip

# 1.2 检查系统信息
cat /etc/os-release
free -h
df -h
uname -a

# 1.3 检查是否已安装基础软件
which nginx
which node
which pm2
systemctl status nginx
```

**验证标准**：

- ✅ 能够成功SSH连接
- ✅ 系统为Ubuntu 20.04+/CentOS 8+/AlmaLinux 9+
- ✅ 可用内存 ≥ 2GB
- ✅ 可用磁盘空间 ≥ 10GB

### 步骤2：上传部署脚本

```bash
# 2.1 在服务器创建临时目录
mkdir -p /tmp/diamond-deploy
cd /tmp/diamond-deploy

# 2.2 创建部署脚本（方式一：直接在服务器创建）
cat > quick-deploy-optimized.sh << 'EOF'
# 这里粘贴完整的部署脚本内容
EOF

# 2.3 或者从本地上传（方式二：使用SCP）
# 在本地Windows命令行执行：
# scp quick-deploy-optimized.sh root@your-server-ip:/tmp/diamond-deploy/
```

### 步骤3：修改脚本配置参数

```bash
# 3.1 编辑脚本中的配置变量
nano quick-deploy-optimized.sh

# 需要修改的变量：
# DOMAIN="your-domain.com"          → 改为实际域名
# EMAIL="admin@your-domain.com"     → 改为实际邮箱

# 3.2 设置执行权限
chmod +x quick-deploy-optimized.sh
```

### 步骤4：执行环境配置脚本

```bash
# 4.1 执行部署脚本
./quick-deploy-optimized.sh

# 4.2 验证安装结果
node --version          # 应显示 v18.x.x
npm --version           # 应显示 9.x.x
pm2 --version          # 应显示版本号
nginx -v               # 应显示版本号
systemctl status nginx # 应显示 active (running)
```

**验证标准**：

- ✅ Node.js 18.x 安装成功
- ✅ PM2 安装成功
- ✅ Nginx 安装并运行
- ✅ 防火墙配置完成
- ✅ 监控脚本配置完成

---

## 📦 第二阶段：代码部署

### 步骤5：准备应用目录

```bash
# 5.1 创建应用目录
mkdir -p /opt/diamond-website
cd /opt/diamond-website

# 5.2 设置目录权限
chown -R www-data:www-data /opt/diamond-website
chmod -R 755 /opt/diamond-website

# 5.3 创建必要的子目录
mkdir -p data uploads/products logs backups
```

### 步骤6：上传项目代码

#### 方式一：使用Git（推荐）

```bash
# 6.1 如果项目已推送到Git仓库
git clone https://github.com/your-username/diamond-website-2025.git .

# 6.2 或者初始化Git仓库（如果本地还未推送）
# 在本地执行：
# cd f:\pycode\diamond-website-2025
# git init
# git add .
# git commit -m "Initial commit"
# git remote add origin https://github.com/your-username/diamond-website-2025.git
# git push -u origin main
```

#### 方式二：使用SCP上传（Windows环境）

```powershell
# 在本地Windows PowerShell中执行：
cd f:\pycode\diamond-website-2025

# 压缩项目文件（排除不必要的文件）
Compress-Archive -Path * -DestinationPath diamond-website.zip -Force

# 上传到服务器
scp diamond-website.zip root@your-server-ip:/opt/diamond-website/

# 在服务器上解压
unzip diamond-website.zip
rm diamond-website.zip
```

#### 方式三：使用WinSCP/FileZilla（图形界面）

```
1. 打开WinSCP或FileZilla
2. 连接到服务器（IP、用户名、密码）
3. 本地目录：f:\pycode\diamond-website-2025
4. 远程目录：/opt/diamond-website
5. 上传所有文件（排除node_modules目录）
```

### 步骤7：安装项目依赖

```bash
# 7.1 进入项目目录
cd /opt/diamond-website

# 7.2 安装生产依赖
npm install --production

# 7.3 验证依赖安装
ls node_modules/
npm list --depth=0
```

### 步骤8：配置环境变量

```bash
# 8.1 创建生产环境配置
cp .env.production .env

# 8.2 编辑环境配置
nano .env

# 需要修改的关键配置：
# NODE_ENV=production
# PORT=3001
# DOMAIN=your-actual-domain.com
# BASE_URL=https://your-actual-domain.com
# JWT_SECRET=your-secure-jwt-secret
```

**验证标准**：

- ✅ 所有项目文件上传完成
- ✅ node_modules 安装成功
- ✅ .env 文件配置正确
- ✅ 目录权限设置正确

---

## 🔧 第三阶段：服务配置

### 步骤9：配置Nginx站点

```bash
# 9.1 编辑Nginx站点配置
nano /etc/nginx/sites-available/diamond-website

# 9.2 确认域名配置正确
# 将所有 "your-domain.com" 替换为实际域名

# 9.3 测试Nginx配置
nginx -t

# 9.4 重新加载Nginx
systemctl reload nginx
```

### 步骤10：检查当前SSL证书状态

```bash
# 10.1 检查是否已有SSL证书
ls -la /etc/letsencrypt/live/

# 10.2 如果已有证书，检查有效期
openssl x509 -enddate -noout -in /etc/letsencrypt/live/your-domain.com/fullchain.pem

# 10.3 检查证书详细信息
certbot certificates

# 10.4 测试域名解析
nslookup your-domain.com
ping your-domain.com
```

### 步骤11：SSL证书配置

#### 情况A：首次配置SSL证书

```bash
# 11.1 申请新证书
certbot --nginx -d your-domain.com -d www.your-domain.com

# 11.2 设置自动续期
certbot renew --dry-run
```

#### 情况B：已有有效证书

```bash
# 11.1 更新Nginx配置以启用SSL
nano /etc/nginx/sites-available/diamond-website

# 取消注释SSL配置行：
# ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

# 11.2 重新加载Nginx
nginx -t && systemctl reload nginx
```

#### 情况C：证书即将过期

```bash
# 11.1 手动续期证书
certbot renew

# 11.2 重启Nginx
systemctl restart nginx
```

**验证标准**：

- ✅ SSL证书配置成功
- ✅ HTTPS访问正常
- ✅ HTTP自动重定向到HTTPS
- ✅ 证书有效期 > 30天

---

## 🚀 第四阶段：应用启动

### 步骤12：启动应用服务

```bash
# 12.1 进入项目目录
cd /opt/diamond-website

# 12.2 测试应用启动
node server.js

# 如果启动成功，按 Ctrl+C 停止，然后用PM2启动

# 12.3 使用PM2启动应用
pm2 start server.js --name diamond-website

# 12.4 设置开机自启
pm2 save
pm2 startup

# 12.5 查看应用状态
pm2 status
pm2 logs diamond-website
```

### 步骤13：验证服务运行

```bash
# 13.1 检查端口监听
netstat -tlnp | grep :3001
ss -tlnp | grep :3001

# 13.2 测试本地访问
curl http://localhost:3001
curl http://localhost:3001/api/status

# 13.3 检查Nginx代理
curl -I http://your-domain.com
curl -I https://your-domain.com
```

**验证标准**：

- ✅ 应用在3001端口正常运行
- ✅ PM2显示应用状态为online
- ✅ 本地curl测试返回正常
- ✅ 通过域名可以访问网站

---

## 🔍 第五阶段：功能验证

### 步骤14：完整功能测试

```bash
# 14.1 测试网站首页
curl -s https://your-domain.com | grep -i "钻石\|diamond"

# 14.2 测试API接口
curl https://your-domain.com/api/products
curl https://your-domain.com/api/categories
curl https://your-domain.com/api/status

# 14.3 测试管理后台
curl -I https://your-domain.com/admin/

# 14.4 测试静态资源
curl -I https://your-domain.com/assets/css/style.css
```

### 步骤15：性能和监控验证

```bash
# 15.1 运行性能监控
/usr/local/bin/diamond-monitor monitor

# 15.2 生成性能报告
/usr/local/bin/diamond-monitor report

# 15.3 检查日志
tail -f /var/log/nginx/diamond-website-access.log
tail -f /var/log/diamond-monitor/monitor.log
pm2 logs diamond-website --lines 50
```

### 步骤16：数据迁移验证

```bash
# 16.1 检查数据文件
ls -la /opt/diamond-website/data/
cat /opt/diamond-website/data/products.json | jq length

# 16.2 检查上传文件
ls -la /opt/diamond-website/uploads/products/

# 16.3 测试文件上传功能（通过浏览器测试）
# 访问 https://your-domain.com/admin/
# 登录并测试产品添加功能
```

**验证标准**：

- ✅ 网站首页正常显示
- ✅ 产品列表正常加载
- ✅ 管理后台可以访问
- ✅ 静态资源加载正常
- ✅ 数据文件完整
- ✅ 监控系统正常工作

---

## 🛡️ 第六阶段：安全和备份

### 步骤17：安全配置检查

```bash
# 17.1 检查防火墙状态
ufw status
# 或
firewall-cmd --list-all

# 17.2 检查SSL安全评级
curl -s "https://api.ssllabs.com/api/v3/analyze?host=your-domain.com" | jq .

# 17.3 检查安全头
curl -I https://your-domain.com | grep -E "(Strict-Transport|X-Frame|X-Content)"
```

### 步骤18：设置备份策略

```bash
# 18.1 创建备份脚本
cat > /usr/local/bin/diamond-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/opt/diamond-website"

mkdir -p $BACKUP_DIR

# 备份数据和上传文件
tar -czf $BACKUP_DIR/diamond-data-$DATE.tar.gz -C $APP_DIR data uploads

# 保留最近7天的备份
find $BACKUP_DIR -name "diamond-data-*.tar.gz" -mtime +7 -delete

echo "备份完成: diamond-data-$DATE.tar.gz"
EOF

chmod +x /usr/local/bin/diamond-backup.sh

# 18.2 设置定时备份
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/diamond-backup.sh") | crontab -

# 18.3 执行首次备份
/usr/local/bin/diamond-backup.sh
```

---

## ✅ 部署完成检查清单

### 🎯 **最终验证项目**

- [ ] 网站首页正常访问：`https://your-domain.com`
- [ ] 管理后台正常访问：`https://your-domain.com/admin`
- [ ] SSL证书有效且评级良好
- [ ] 产品列表正常显示
- [ ] 图片资源正常加载
- [ ] 搜索功能正常工作
- [ ] 联系表单正常提交
- [ ] 多语言切换正常
- [ ] 移动端显示正常
- [ ] 页面加载速度 < 3秒

### 🔧 **系统状态检查**

- [ ] PM2应用状态：online
- [ ] Nginx服务状态：active
- [ ] 系统资源使用正常（CPU < 50%, 内存 < 70%）
- [ ] 监控系统正常工作
- [ ] 备份任务配置完成
- [ ] 日志记录正常

### 📞 **应急联系信息**

```
服务器IP: _______________
SSH端口: _______________
域名: _______________
SSL证书到期时间: _______________
管理员邮箱: _______________
```

---

## 🚨 故障排除指南

### 常见问题及解决方案

#### 问题1：应用无法启动

```bash
# 检查端口占用
netstat -tlnp | grep :3001
# 检查应用日志
pm2 logs diamond-website
# 检查配置文件
node -c server.js
```

#### 问题2：Nginx配置错误

```bash
# 测试配置
nginx -t
# 查看错误日志
tail -f /var/log/nginx/error.log
# 重新加载配置
systemctl reload nginx
```

#### 问题3：SSL证书问题

```bash
# 检查证书状态
certbot certificates
# 重新申请证书
certbot --nginx -d your-domain.com --force-renewal
```

#### 问题4：域名解析问题

```bash
# 检查DNS解析
nslookup your-domain.com
dig your-domain.com
# 检查域名绑定
ping your-domain.com
```

---

---

## 🚀 **快速部署命令总结**

### Windows环境（本地操作）

```powershell
# 1. 上传代码到服务器
.\upload-code.ps1 -ServerIP "your-server-ip" -Username "root" -Method "scp"

# 2. 或者使用Git方式
.\upload-code.ps1 -ServerIP "your-server-ip" -Username "root" -Method "git"
```

### Linux服务器操作

```bash
# 1. 下载并配置部署脚本
wget https://raw.githubusercontent.com/your-repo/deployment-config.sh
nano deployment-config.sh  # 修改域名和邮箱

# 2. 执行优化部署
chmod +x quick-deploy-optimized.sh
sudo ./quick-deploy-optimized.sh

# 3. 配置SSL证书
chmod +x ssl-certificate-manager.sh
sudo ./ssl-certificate-manager.sh request

# 4. 启动应用
cd /opt/diamond-website
pm2 start server.js --name diamond-website
pm2 save

# 5. 验证部署
curl https://your-domain.com
pm2 status
```

---

## 📋 **部署检查清单（打印版）**

### ✅ **部署前准备**

- [ ] 服务器信息确认（IP、用户名、密码）
- [ ] 域名DNS解析配置
- [ ] 本地项目代码完整性检查
- [ ] SSH连接测试成功

### ✅ **环境配置阶段**

- [ ] 执行 `quick-deploy-optimized.sh` 成功
- [ ] Node.js 18.x 安装完成
- [ ] PM2 进程管理器安装完成
- [ ] Nginx 安装并运行
- [ ] 防火墙配置完成

### ✅ **代码部署阶段**

- [ ] 项目代码上传到 `/opt/diamond-website`
- [ ] `npm install --production` 执行成功
- [ ] `.env` 环境变量配置正确
- [ ] 文件权限设置正确

### ✅ **SSL证书配置**

- [ ] 域名解析检查通过
- [ ] SSL证书申请成功
- [ ] Nginx SSL配置启用
- [ ] HTTPS访问测试成功

### ✅ **应用启动验证**

- [ ] PM2启动应用成功
- [ ] 应用状态显示 `online`
- [ ] 端口3001监听正常
- [ ] 网站首页访问正常

### ✅ **功能测试验证**

- [ ] 产品列表页面正常
- [ ] 管理后台可访问
- [ ] 静态资源加载正常
- [ ] 搜索功能正常
- [ ] 多语言切换正常

### ✅ **性能和监控**

- [ ] 监控脚本配置完成
- [ ] 备份任务设置完成
- [ ] 页面加载速度 < 3秒
- [ ] 系统资源使用正常

---

## 🔧 **关键文件位置速查**

```
服务器文件结构:
/opt/diamond-website/          # 应用主目录
├── server.js                  # 主服务文件
├── package.json               # 项目配置
├── .env                       # 环境变量
├── data/                      # 数据文件
├── uploads/                   # 上传文件
├── assets/                    # 静态资源
└── node_modules/              # 依赖包

/etc/nginx/sites-available/diamond-website    # Nginx配置
/etc/letsencrypt/live/your-domain.com/        # SSL证书
/var/log/nginx/diamond-website-*.log          # Nginx日志
/var/log/diamond-monitor/                     # 监控日志
/usr/local/bin/diamond-monitor                # 监控脚本
```

---

## 📞 **技术支持联系方式**

```
项目信息:
  项目名称: 钻石网站CMS
  技术栈: Node.js + Express + JSON存储
  部署环境: Ubuntu/CentOS + Nginx + PM2

常用命令:
  查看应用状态: pm2 status
  查看应用日志: pm2 logs diamond-website
  重启应用: pm2 restart diamond-website
  查看Nginx状态: systemctl status nginx
  重新加载Nginx: systemctl reload nginx
  查看SSL证书: ./ssl-certificate-manager.sh status
  运行监控检查: /usr/local/bin/diamond-monitor monitor

故障排除:
  1. 应用无法启动 → 检查 pm2 logs
  2. 网站无法访问 → 检查 nginx 配置和状态
  3. SSL证书问题 → 运行 ssl-certificate-manager.sh
  4. 性能问题 → 查看监控报告
```

**🎉 恭喜！您的钻石网站已成功部署并优化完成！**
