# 钻石网站CMS部署指南

## 项目简介
无锡皇德国际贸易有限公司专业产品管理系统，包含前端展示网站和后台管理系统。

## 环境要求
- Node.js >= 14.0.0
- npm >= 6.0.0
- 操作系统: Windows/Linux/macOS

## 快速部署

### Windows环境
1. 双击运行 `start-production.bat`
2. 等待自动检查和启动
3. 访问 http://localhost:3000

### Linux/macOS环境
```bash
chmod +x start-production.sh
./start-production.sh
```

## 手动部署步骤

### 1. 环境检查
确保已安装Node.js和npm：
```bash
node -v  # 应该 >= 14.0.0
npm -v   # 应该 >= 6.0.0
```

### 2. 安装依赖
```bash
npm install --production
```

### 3. 配置环境变量
项目会自动设置以下环境变量：
- `NODE_ENV=production`
- `TZ=Asia/Shanghai`
- `PORT=3000`

### 4. 启动服务
```bash
npm start
# 或者
node server.js
```

## 访问地址
- 🏠 网站首页: http://localhost:3000
- 🛠️ 管理后台: http://localhost:3000/admin
- 🔐 管理登录: http://localhost:3000/admin/login.html

## 默认管理员账号
- 用户名: admin
- 密码: admin123
- 首次登录后请及时修改密码

## 生产环境部署

### 使用PM2 (推荐)
```bash
# 安装PM2
npm install -g pm2

# 启动服务
pm2 start server.js --name diamond-website --env production

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
```

### 使用系统服务 (Linux)
```bash
# 复制服务文件
sudo cp config/diamond-website.service /etc/systemd/system/

# 启用服务
sudo systemctl enable diamond-website
sudo systemctl start diamond-website

# 查看状态
sudo systemctl status diamond-website
```

## 目录结构
```
diamond-website-cms/
├── admin/              # 管理后台
├── assets/             # 静态资源
├── config/             # 配置文件
├── data/               # 数据文件
├── pages/              # 页面文件
├── scripts/            # 脚本文件
├── uploads/            # 上传文件
├── server.js           # 主服务器文件
├── package.json        # 项目配置
└── start-production.*  # 启动脚本
```

## 功能特性
- ✅ 产品管理系统
- ✅ 多语言支持 (中文/英文)
- ✅ 响应式设计
- ✅ 管理员权限控制
- ✅ 数据分析统计
- ✅ 文件上传管理
- ✅ SEO优化
- ✅ 安全防护

## 维护操作

### 数据备份
```bash
# 备份数据目录
tar -czf backup-$(date +%Y%m%d).tar.gz data/ uploads/

# 或使用脚本
./scripts/backup-setup.sh
```

### 查看日志
```bash
# PM2日志
pm2 logs diamond-website

# 系统服务日志
sudo journalctl -u diamond-website -f
```

### 重启服务
```bash
# PM2重启
pm2 restart diamond-website

# 系统服务重启
sudo systemctl restart diamond-website
```

### 更新部署
```bash
# 停止服务
pm2 stop diamond-website

# 更新代码
git pull origin main

# 安装新依赖
npm install --production

# 重启服务
pm2 start diamond-website
```

## 故障排除

### 端口被占用
如果3000端口被占用，服务器会自动寻找可用端口。

### 权限问题
确保data和uploads目录有写入权限：
```bash
chmod -R 755 data/ uploads/
```

### 内存不足
建议服务器内存至少512MB，推荐1GB以上。

## 技术支持
如遇到部署问题，请检查：
1. Node.js版本是否符合要求
2. 网络连接是否正常
3. 防火墙设置是否正确
4. 磁盘空间是否充足

## 安全建议
1. 及时修改默认管理员密码
2. 定期备份数据
3. 保持系统更新
4. 配置防火墙规则
5. 使用HTTPS (生产环境)