# 📋 钻石网站部署检查清单
## 无锡皇德国际贸易有限公司 - 数据库迁移版本部署

### 🎯 部署目标
将完成数据库迁移的项目覆盖服务器上的旧版本，实现从JSON文件存储到PostgreSQL数据库的升级。

---

## 📝 部署前准备

### ✅ 本地环境检查
- [ ] 项目代码已完成数据库迁移
- [ ] 所有功能测试通过
- [ ] Prisma模型和迁移文件完整
- [ ] 环境变量配置正确
- [ ] 依赖包版本兼容

### ✅ 服务器环境检查
- [ ] 服务器可正常访问（SSH连接）
- [ ] Node.js >= 16.0.0 已安装
- [ ] PostgreSQL >= 12.0 已安装并运行
- [ ] PM2 进程管理器已安装
- [ ] Nginx 已配置（可选）
- [ ] 防火墙规则已设置

### ✅ 数据库准备
- [ ] PostgreSQL 服务正常运行
- [ ] 数据库用户已创建：`diamond_user`
- [ ] 数据库已创建：`diamond_website`
- [ ] 用户权限配置正确
- [ ] 数据库连接测试通过

---

## 🚀 部署执行步骤

### 第一步：备份现有系统
```bash
# 1. 停止现有服务
pm2 stop diamond-website

# 2. 创建完整备份
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
sudo cp -r /opt/diamond-website /opt/backups/diamond-website-backup-$BACKUP_DATE

# 3. 备份数据库（如果有）
pg_dump -h localhost -U diamond_user diamond_website > /opt/backups/db-backup-$BACKUP_DATE.sql
```
**检查点：** 
- [ ] 应用已停止
- [ ] 文件备份完成
- [ ] 数据库备份完成（如果适用）

### 第二步：上传新项目文件
```bash
# 方法1：使用自动化脚本（推荐）
chmod +x deploy-to-server.sh
./deploy-to-server.sh production

# 方法2：手动上传
rsync -avz --exclude node_modules --exclude .git ./ user@server:/opt/diamond-website/
```
**检查点：**
- [ ] 所有文件上传完成
- [ ] 文件权限正确
- [ ] 目录结构完整

### 第三步：安装依赖和配置
```bash
# 在服务器上执行
cd /opt/diamond-website

# 1. 安装生产依赖
npm install --production

# 2. 安装数据库依赖
npm install @prisma/client prisma pg dotenv

# 3. 生成Prisma客户端
npx prisma generate
```
**检查点：**
- [ ] 依赖安装无错误
- [ ] Prisma客户端生成成功
- [ ] 无版本冲突警告

### 第四步：配置环境变量
```bash
# 编辑环境变量文件
nano /opt/diamond-website/.env
```

**必须配置的关键变量：**
```env
# 数据库配置
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

# 安全配置
JWT_SECRET=your-super-secure-jwt-secret-here
```
**检查点：**
- [ ] 数据库连接信息正确
- [ ] 域名配置正确
- [ ] JWT密钥已设置
- [ ] 所有必需变量已配置

### 第五步：数据库迁移
```bash
# 1. 推送数据库模式
npx prisma db push

# 2. 验证数据库连接
npx prisma db seed

# 3. 运行数据迁移（从JSON到数据库）
npm run migrate:run

# 4. 验证迁移结果
npm run migrate:test
```
**检查点：**
- [ ] 数据库模式创建成功
- [ ] 数据迁移无错误
- [ ] 数据完整性验证通过
- [ ] 测试数据正常

### 第六步：启动应用
```bash
# 1. 测试启动
npm start

# 2. 如果测试成功，使用PM2启动
pm2 start ecosystem.config.js --env production

# 3. 保存PM2配置
pm2 save

# 4. 设置开机自启
pm2 startup
```
**检查点：**
- [ ] 应用启动无错误
- [ ] PM2进程运行正常
- [ ] 端口监听正常
- [ ] 开机自启配置完成

---

## 🔍 部署验证

### ✅ 功能验证
```bash
# 1. 健康检查
curl http://localhost:3001/api/health

# 2. 应用状态检查
curl http://localhost:3001/api/status

# 3. 产品API测试
curl http://localhost:3001/api/products

# 4. 管理后台访问
curl http://localhost:3001/admin
```
**验证清单：**
- [ ] 健康检查返回正常
- [ ] API响应正常
- [ ] 数据库查询正常
- [ ] 管理后台可访问

### ✅ 性能验证
```bash
# 1. 检查PM2状态
pm2 status

# 2. 检查内存使用
pm2 monit

# 3. 检查日志
pm2 logs diamond-website --lines 50
```
**性能指标：**
- [ ] 内存使用正常（< 500MB）
- [ ] CPU使用正常（< 50%）
- [ ] 响应时间正常（< 2秒）
- [ ] 无错误日志

### ✅ 安全验证
```bash
# 1. 检查防火墙状态
sudo ufw status

# 2. 检查SSL证书（如果配置）
curl -I https://your-domain.com

# 3. 检查文件权限
ls -la /opt/diamond-website
```
**安全检查：**
- [ ] 防火墙规则正确
- [ ] SSL证书有效（如果配置）
- [ ] 文件权限安全
- [ ] 敏感信息未暴露

---

## 🆘 故障排除

### 常见问题及解决方案

#### 1. 数据库连接失败
```bash
# 检查PostgreSQL状态
sudo systemctl status postgresql

# 检查数据库连接
psql -h localhost -U diamond_user -d diamond_website

# 重启PostgreSQL
sudo systemctl restart postgresql
```

#### 2. 应用启动失败
```bash
# 检查语法错误
node -c server.js

# 检查依赖问题
npm audit

# 查看详细错误
npm start
```

#### 3. 端口占用问题
```bash
# 查看端口占用
netstat -tulpn | grep :3001

# 杀死占用进程
sudo kill -9 PID
```

#### 4. 权限问题
```bash
# 修复文件权限
sudo chown -R diamond:diamond /opt/diamond-website
chmod -R 755 /opt/diamond-website
```

### 🔄 紧急回滚方案
如果部署失败，执行以下回滚步骤：

```bash
# 1. 停止新服务
pm2 stop diamond-website

# 2. 恢复备份
sudo rm -rf /opt/diamond-website
sudo cp -r /opt/backups/diamond-website-backup-$BACKUP_DATE /opt/diamond-website

# 3. 恢复数据库（如果需要）
psql -h localhost -U diamond_user -d diamond_website < /opt/backups/db-backup-$BACKUP_DATE.sql

# 4. 重启旧服务
cd /opt/diamond-website
pm2 start ecosystem.config.js --env production
```

---

## 📊 部署后监控

### 日常监控检查
- [ ] 应用运行状态：`pm2 status`
- [ ] 系统资源使用：`htop`
- [ ] 磁盘空间：`df -h`
- [ ] 日志文件：`pm2 logs diamond-website`
- [ ] 数据库状态：`sudo systemctl status postgresql`

### 定期维护任务
- [ ] 数据库备份（每日）
- [ ] 日志清理（每周）
- [ ] 系统更新（每月）
- [ ] 安全检查（每月）
- [ ] 性能优化（每季度）

---

## ✅ 部署完成确认

### 最终检查清单
- [ ] 所有服务正常运行
- [ ] 网站可正常访问
- [ ] 管理后台功能正常
- [ ] 数据库迁移完成
- [ ] 备份策略已设置
- [ ] 监控系统已配置
- [ ] 文档已更新
- [ ] 团队已通知

### 🎉 部署成功！

**访问地址：**
- 🏠 前台网站: https://your-domain.com
- 🛠️ 管理后台: https://your-domain.com/admin
- 📊 健康检查: https://your-domain.com/api/health

**管理命令：**
- 查看状态: `pm2 status`
- 查看日志: `pm2 logs diamond-website`
- 重启应用: `pm2 restart diamond-website`
- 停止应用: `pm2 stop diamond-website`

---

**📞 技术支持**
如遇问题，请查看日志文件或联系技术团队。
