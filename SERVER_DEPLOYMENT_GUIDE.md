# 🚀 钻石网站服务器部署指南
## 无锡皇德国际贸易有限公司 - 数据库迁移版本部署

### 📋 部署前准备清单

#### 1. 服务器环境要求
- **Node.js**: >= 16.0.0
- **PostgreSQL**: >= 12.0
- **PM2**: 进程管理器
- **Nginx**: 反向代理（可选）
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+

#### 2. 数据库准备
```bash
# 安装PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# 启动PostgreSQL服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库用户和数据库
sudo -u postgres psql
CREATE USER diamond_user WITH PASSWORD 'diamond_secure_2025';
CREATE DATABASE diamond_website OWNER diamond_user;
GRANT ALL PRIVILEGES ON DATABASE diamond_website TO diamond_user;
\q
```

### 🔄 部署步骤

#### 步骤1: 备份现有项目
```bash
# 进入服务器项目目录
cd /opt/diamond-website  # 或您的项目路径

# 停止现有服务
pm2 stop diamond-website

# 创建备份
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
sudo cp -r /opt/diamond-website /opt/backups/diamond-website-backup-$BACKUP_DATE
echo "✅ 备份完成: /opt/backups/diamond-website-backup-$BACKUP_DATE"
```

#### 步骤2: 上传新项目文件
```bash
# 方法1: 使用Git（推荐）
cd /opt/diamond-website
git pull origin main
# 或者如果是新仓库
# git clone https://github.com/your-repo/diamond-website-2025.git /opt/diamond-website-new
# mv /opt/diamond-website-new/* /opt/diamond-website/

# 方法2: 使用SCP上传
# 在本地执行：
# scp -r ./diamond-website-2025/* user@server:/opt/diamond-website/

# 方法3: 使用FTP/SFTP工具上传所有文件
```

#### 步骤3: 安装依赖
```bash
cd /opt/diamond-website

# 安装生产依赖
npm install --production

# 安装数据库相关依赖
npm install @prisma/client prisma pg dotenv

# 生成Prisma客户端
npx prisma generate
```

#### 步骤4: 配置环境变量
```bash
# 复制环境变量文件
cp .env.example .env

# 编辑环境变量（重要！）
nano .env
```

**关键环境变量配置：**
```env
# 数据库配置 - 必须修改
DATABASE_URL="postgresql://diamond_user:diamond_secure_2025@localhost:5432/diamond_website?schema=public"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=diamond_website
DB_USER=diamond_user
DB_PASSWORD=diamond_secure_2025

# 应用配置
NODE_ENV=production
PORT=3001
DOMAIN=your-domain.com
BASE_URL=https://your-domain.com

# 安全配置 - 必须修改
JWT_SECRET=your-super-secure-jwt-secret-here
```

#### 步骤5: 数据库迁移
```bash
# 推送数据库模式到PostgreSQL
npx prisma db push

# 或者使用迁移（如果有迁移文件）
npx prisma migrate deploy

# 验证数据库连接
npx prisma db seed
```

#### 步骤6: 数据迁移（从JSON到数据库）
```bash
# 运行数据迁移脚本
npm run migrate:run

# 验证迁移结果
npm run migrate:test
```

#### 步骤7: 启动服务
```bash
# 测试启动
npm start

# 如果测试成功，使用PM2启动
pm2 start ecosystem.config.js --env production

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
```

### 🔍 部署验证

#### 1. 健康检查
```bash
# 检查应用状态
curl http://localhost:3001/api/health

# 检查数据库连接
curl http://localhost:3001/api/status

# 检查PM2状态
pm2 status
```

#### 2. 功能测试
```bash
# 测试产品API
curl http://localhost:3001/api/products

# 测试管理后台
curl http://localhost:3001/admin

# 检查日志
pm2 logs diamond-website
```

### 🛠️ 故障排除

#### 常见问题解决

**1. 数据库连接失败**
```bash
# 检查PostgreSQL状态
sudo systemctl status postgresql

# 检查数据库连接
psql -h localhost -U diamond_user -d diamond_website

# 检查防火墙
sudo ufw status
```

**2. 端口占用问题**
```bash
# 查看端口占用
netstat -tulpn | grep :3001

# 杀死占用进程
sudo kill -9 PID
```

**3. 权限问题**
```bash
# 设置正确的文件权限
sudo chown -R $USER:$USER /opt/diamond-website
chmod -R 755 /opt/diamond-website
```

### 📊 监控和维护

#### 1. 日志监控
```bash
# 查看应用日志
pm2 logs diamond-website --lines 100

# 查看错误日志
tail -f /opt/diamond-website/logs/error.log
```

#### 2. 性能监控
```bash
# PM2监控
pm2 monit

# 系统资源监控
htop
```

#### 3. 数据库维护
```bash
# 数据库备份
pg_dump -h localhost -U diamond_user diamond_website > backup_$(date +%Y%m%d).sql

# 数据库优化
psql -h localhost -U diamond_user -d diamond_website -c "VACUUM ANALYZE;"
```

### 🔒 安全配置

#### 1. 防火墙设置
```bash
# 开放必要端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 3001  # 应用端口（如果直接访问）
sudo ufw enable
```

#### 2. SSL证书配置（使用Let's Encrypt）
```bash
# 安装Certbot
sudo apt install certbot

# 获取SSL证书
sudo certbot certonly --standalone -d your-domain.com

# 配置自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

### 📝 部署完成检查清单

- [ ] 数据库连接正常
- [ ] 应用启动成功
- [ ] PM2进程运行正常
- [ ] API接口响应正常
- [ ] 管理后台可访问
- [ ] 数据迁移完成
- [ ] 日志记录正常
- [ ] 监控配置完成
- [ ] 备份策略设置
- [ ] 安全配置完成

### 🆘 紧急回滚方案

如果部署出现问题，可以快速回滚：

```bash
# 停止新服务
pm2 stop diamond-website

# 恢复备份
sudo rm -rf /opt/diamond-website
sudo cp -r /opt/backups/diamond-website-backup-$BACKUP_DATE /opt/diamond-website

# 重启旧服务
cd /opt/diamond-website
pm2 start ecosystem.config.js --env production
```

---

**🎉 部署完成！**

访问您的网站：
- 🏠 前台网站: https://your-domain.com
- 🛠️ 管理后台: https://your-domain.com/admin
- 📊 健康检查: https://your-domain.com/api/health

如有问题，请查看日志文件或联系技术支持。
