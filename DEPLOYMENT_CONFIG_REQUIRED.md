# 🔧 自动化部署配置信息清单
## 无锡皇德国际贸易有限公司 - 部署前必需配置

### 📋 已知服务器信息
- **服务器IP**: 167.88.43.193
- **Git仓库**: diamond-deploy:/var/git/diamond-website.git
- **网站目录**: /var/www/diamond-website/

---

## 🔑 必需配置信息

### 1. SSH连接信息
```bash
# 已配置
REMOTE_HOST="167.88.43.193"
REMOTE_USER="diamond-deploy"
REMOTE_PROJECT_DIR="/var/www/diamond-website"

# 需要确认的信息：
```
- [ ] **SSH端口**: 默认22，如果不是请提供
- [ ] **SSH密钥**: 是否已配置免密登录？
- [ ] **sudo权限**: diamond-deploy用户是否有sudo权限？

### 2. 数据库配置信息
```env
# 需要提供的数据库信息：
```
- [ ] **数据库类型**: PostgreSQL 还是其他？
- [ ] **数据库主机**: localhost 还是其他地址？
- [ ] **数据库端口**: 默认5432，如果不是请提供
- [ ] **数据库名称**: 建议 `diamond_website`
- [ ] **数据库用户**: 建议 `diamond_user`
- [ ] **数据库密码**: 请提供安全密码
- [ ] **数据库是否已创建**: 是否需要脚本自动创建？

### 3. 域名和SSL配置
```env
# 需要提供的域名信息：
```
- [ ] **主域名**: 例如 `diamond-auto.com`
- [ ] **WWW域名**: 例如 `www.diamond-auto.com`
- [ ] **SSL证书**: 是否需要自动申请Let's Encrypt证书？
- [ ] **CDN配置**: 是否使用CDN服务？

### 4. 应用配置
```env
# 需要确认的应用配置：
```
- [ ] **应用端口**: 默认3001，是否需要修改？
- [ ] **进程数量**: PM2运行实例数，建议1个
- [ ] **内存限制**: 默认1GB，是否需要调整？
- [ ] **日志级别**: info/debug/error，建议info

### 5. 安全配置
```env
# 需要生成的安全密钥：
```
- [ ] **JWT密钥**: 需要生成强密码（建议64位随机字符串）
- [ ] **Session密钥**: 需要生成强密码
- [ ] **加密盐值**: bcrypt rounds，建议12

---

## 📝 配置文件模板

### 环境变量配置 (.env)
```env
# 应用基本配置
NODE_ENV=production
PORT=3001
APP_NAME=diamond-website
APP_VERSION=1.0.0

# 域名配置 - 请修改
DOMAIN=your-domain.com
BASE_URL=https://your-domain.com

# 数据库配置 - 请修改
DATABASE_URL="postgresql://diamond_user:YOUR_DB_PASSWORD@localhost:5432/diamond_website?schema=public"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=diamond_website
DB_USER=diamond_user
DB_PASSWORD=YOUR_DB_PASSWORD

# 安全配置 - 请修改
JWT_SECRET=YOUR_JWT_SECRET_HERE
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=86400000

# 时区配置
TZ=Asia/Shanghai
NODE_TZ=Asia/Shanghai

# 文件上传配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,webp,pdf

# 缓存配置
CACHE_TTL=3600
STATIC_CACHE_TTL=31536000

# 安全头配置
SECURITY_HEADERS_ENABLED=true
CORS_ORIGIN=https://your-domain.com
CSP_ENABLED=true
```

### SSH配置检查
```bash
# 测试SSH连接
ssh diamond-deploy@167.88.43.193

# 检查sudo权限
sudo whoami

# 检查目录权限
ls -la /var/www/
ls -la /var/www/diamond-website/
```

---

## 🔍 部署前检查命令

### 在本地执行
```bash
# 1. 测试SSH连接
ssh diamond-deploy@167.88.43.193 "echo 'SSH连接成功'"

# 2. 检查服务器环境
ssh diamond-deploy@167.88.43.193 "node --version && npm --version && pm2 --version"

# 3. 检查数据库
ssh diamond-deploy@167.88.43.193 "sudo systemctl status postgresql"

# 4. 检查目录权限
ssh diamond-deploy@167.88.43.193 "ls -la /var/www/diamond-website/"
```

### 在服务器上执行
```bash
# 1. 检查Node.js环境
node --version  # 应该 >= 16.0.0
npm --version   # 应该 >= 8.0.0

# 2. 检查PM2
pm2 --version
pm2 list

# 3. 检查PostgreSQL
sudo systemctl status postgresql
psql --version

# 4. 检查防火墙
sudo ufw status

# 5. 检查Nginx（如果使用）
sudo systemctl status nginx
```

---

## 🚀 快速配置生成器

### 生成安全密钥
```bash
# 生成JWT密钥（64位随机字符串）
openssl rand -hex 32

# 生成Session密钥
openssl rand -base64 32

# 生成数据库密码
openssl rand -base64 16
```

### 创建数据库
```sql
-- 在PostgreSQL中执行
CREATE USER diamond_user WITH PASSWORD 'YOUR_GENERATED_PASSWORD';
CREATE DATABASE diamond_website OWNER diamond_user;
GRANT ALL PRIVILEGES ON DATABASE diamond_website TO diamond_user;
ALTER USER diamond_user CREATEDB;
```

---

## 📋 部署前确认清单

### 服务器环境
- [ ] SSH连接正常
- [ ] diamond-deploy用户有sudo权限
- [ ] Node.js >= 16.0.0 已安装
- [ ] PM2 已安装
- [ ] PostgreSQL 已安装并运行
- [ ] 防火墙已配置（开放22, 80, 443端口）

### 数据库准备
- [ ] PostgreSQL服务运行正常
- [ ] 数据库用户已创建
- [ ] 数据库已创建
- [ ] 用户权限配置正确
- [ ] 连接测试通过

### 域名和SSL
- [ ] 域名已解析到服务器IP
- [ ] SSL证书配置方案已确定
- [ ] Nginx配置已准备（如果使用）

### 安全配置
- [ ] JWT密钥已生成
- [ ] 数据库密码已设置
- [ ] 环境变量文件已准备
- [ ] 文件权限已检查

---

## 🎯 下一步操作

### 1. 提供缺失信息
请提供上述清单中标记的必需信息。

### 2. 测试SSH连接
```bash
ssh diamond-deploy@167.88.43.193
```

### 3. 配置环境变量
根据提供的信息创建完整的 `.env` 文件。

### 4. 执行部署
```bash
./deploy-to-server.sh production
```

---

## 📞 需要您提供的关键信息

### 🔴 必需信息（部署前必须提供）
1. **数据库密码**: PostgreSQL数据库密码
2. **JWT密钥**: 应用安全密钥
3. **域名**: 网站访问域名
4. **SSH密钥**: 是否已配置免密登录

### 🟡 可选信息（有默认值，可后续修改）
1. **应用端口**: 默认3001
2. **SSL配置**: 可后续配置
3. **Nginx配置**: 可使用默认配置

### 🟢 自动配置（脚本会自动处理）
1. **依赖安装**: npm packages
2. **数据库迁移**: Prisma迁移
3. **PM2配置**: 进程管理
4. **备份创建**: 自动备份

请提供上述🔴必需信息，我将为您更新部署脚本并生成完整的配置文件！
