# 🚀 钻石网站快速部署指南
## 无锡皇德国际贸易有限公司 - 一键部署到服务器

### 📋 部署概述
将完成数据库迁移的项目快速部署到服务器，覆盖之前的版本。

---

## 🎯 快速部署（推荐）

### 方法一：自动化脚本部署

#### 1. 配置服务器信息
编辑 `deploy-to-server.sh` 文件，修改以下配置：
```bash
REMOTE_USER="diamond"           # 服务器用户名
REMOTE_HOST="your-server-ip"    # 服务器IP地址
REMOTE_PROJECT_DIR="/opt/diamond-website"  # 项目目录
```

#### 2. 执行一键部署
```bash
# 给脚本执行权限
chmod +x deploy-to-server.sh

# 开始部署
./deploy-to-server.sh production
```

#### 3. 部署过程
脚本会自动执行：
- ✅ 环境检查
- ✅ 语法验证
- ✅ 创建备份
- ✅ 上传文件
- ✅ 安装依赖
- ✅ 数据库迁移
- ✅ 启动服务
- ✅ 验证部署

---

## 🔧 手动部署步骤

### 第一步：服务器环境准备
如果服务器是全新环境，先运行环境配置脚本：
```bash
# 在服务器上执行
sudo ./setup-server-environment.sh
```

### 第二步：备份现有项目
```bash
# SSH连接到服务器
ssh user@your-server-ip

# 停止现有服务
pm2 stop diamond-website

# 创建备份
sudo cp -r /opt/diamond-website /opt/backups/diamond-website-backup-$(date +%Y%m%d_%H%M%S)
```

### 第三步：上传项目文件
```bash
# 在本地项目目录执行
rsync -avz --exclude node_modules --exclude .git ./ user@server:/opt/diamond-website/
```

### 第四步：服务器端配置
```bash
# SSH到服务器
ssh user@your-server-ip
cd /opt/diamond-website

# 安装依赖
npm install --production
npm install @prisma/client prisma pg dotenv

# 生成Prisma客户端
npx prisma generate

# 配置环境变量
nano .env
```

### 第五步：数据库迁移
```bash
# 推送数据库模式
npx prisma db push

# 运行数据迁移
npm run migrate:run

# 验证迁移
npm run migrate:test
```

### 第六步：启动服务
```bash
# 启动应用
pm2 start ecosystem.config.js --env production

# 保存配置
pm2 save
```

---

## 🔍 部署验证

### 快速检查命令
```bash
# 检查应用状态
pm2 status

# 健康检查
curl http://localhost:3001/api/health

# 查看日志
pm2 logs diamond-website --lines 20
```

### 访问测试
- 🏠 网站首页: `http://your-server-ip:3001`
- 🛠️ 管理后台: `http://your-server-ip:3001/admin`
- 📊 API状态: `http://your-server-ip:3001/api/status`

---

## 🆘 故障处理

### 如果部署失败
```bash
# 执行回滚
./deploy-to-server.sh --rollback

# 或手动回滚
pm2 stop diamond-website
sudo rm -rf /opt/diamond-website
sudo cp -r /opt/backups/diamond-website-backup-* /opt/diamond-website
pm2 start ecosystem.config.js --env production
```

### 常见问题
1. **数据库连接失败**
   ```bash
   sudo systemctl restart postgresql
   psql -h localhost -U diamond_user -d diamond_website
   ```

2. **端口占用**
   ```bash
   netstat -tulpn | grep :3001
   sudo kill -9 PID
   ```

3. **权限问题**
   ```bash
   sudo chown -R diamond:diamond /opt/diamond-website
   ```

---

## 📋 重要配置文件

### 环境变量 (.env)
```env
# 数据库配置
DATABASE_URL="postgresql://diamond_user:diamond_secure_2025@localhost:5432/diamond_website?schema=public"

# 应用配置
NODE_ENV=production
PORT=3001
DOMAIN=your-domain.com

# 安全配置
JWT_SECRET=your-secure-secret-here
```

### PM2配置 (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'diamond-website',
    script: 'server.js',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

---

## 📞 技术支持

### 部署文档
- 📋 详细检查清单: `DEPLOYMENT_CHECKLIST.md`
- 🔧 服务器配置: `SERVER_DEPLOYMENT_GUIDE.md`
- 📖 项目文档: `README.md`

### 管理命令
```bash
# 查看应用状态
pm2 status

# 重启应用
pm2 restart diamond-website

# 查看实时日志
pm2 logs diamond-website --follow

# 查看监控信息
pm2 monit

# 停止应用
pm2 stop diamond-website

# 删除应用
pm2 delete diamond-website
```

### 数据库管理
```bash
# 连接数据库
psql -h localhost -U diamond_user -d diamond_website

# 备份数据库
pg_dump -h localhost -U diamond_user diamond_website > backup.sql

# 恢复数据库
psql -h localhost -U diamond_user -d diamond_website < backup.sql

# 查看Prisma状态
npx prisma studio
```

---

## ✅ 部署成功确认

部署完成后，确认以下项目：
- [ ] 应用正常启动
- [ ] 数据库连接正常
- [ ] API接口响应正常
- [ ] 管理后台可访问
- [ ] 数据迁移完成
- [ ] 日志记录正常

**🎉 恭喜！钻石网站已成功部署到服务器！**

---

**无锡皇德国际贸易有限公司**  
专业的涡轮增压器和共轨喷油器配件供应商  
📞 +86 136 5615 7230  
📧 sales03@diamond-auto.com
