# 🌏 时区问题解决方案

## 问题描述

在国外服务器部署时，可能会遇到后台登录后立即弹出的问题。这通常是由于服务器时区与JWT令牌时间验证不一致导致的。

## 🔍 问题原因

1. **JWT令牌时间验证**：JWT使用UTC时间戳进行过期验证
2. **服务器时区差异**：国外服务器可能使用不同时区（如UTC、EST等）
3. **时间同步问题**：服务器时间可能与标准时间不同步
4. **客户端-服务器时间差**：浏览器和服务器时间可能存在差异

## 🛠️ 解决方案

### 方案一：设置系统时区（推荐）

#### 1. 手动设置系统时区

```bash
# 设置系统时区为上海
sudo timedatectl set-timezone Asia/Shanghai

# 启用NTP时间同步
sudo timedatectl set-ntp true

# 验证设置
timedatectl status
```

#### 2. 使用自动化脚本

```bash
# 运行时区设置脚本
sudo bash scripts/set-timezone-shanghai.sh
```

#### 3. 验证时区设置

```bash
# 检查系统时区
date
timedatectl status

# 检查Node.js时区
node test-timezone.js
```

### 方案二：应用程序级别设置

#### 1. 环境变量设置

在启动应用前设置环境变量：

```bash
# Linux/macOS
export TZ=Asia/Shanghai
npm start

# 或者直接运行
TZ=Asia/Shanghai node server.js
```

#### 2. PM2部署

```bash
# 使用PM2启动时设置时区
TZ=Asia/Shanghai pm2 start server.js --name diamond-website

# 或者在ecosystem.config.js中设置
module.exports = {
  apps: [{
    name: 'diamond-website',
    script: 'server.js',
    env: {
      TZ: 'Asia/Shanghai'
    }
  }]
}
```

#### 3. Systemd服务

在systemd服务文件中添加环境变量：

```ini
[Service]
Environment=TZ=Asia/Shanghai
Environment=NODE_TZ=Asia/Shanghai
```

### 方案三：Docker部署

```dockerfile
# 在Dockerfile中设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
```

## 🚀 一键部署

### 使用部署脚本

```bash
# 克隆项目
git clone https://github.com/tianyiswl/diamond-website-2025.git
cd diamond-website-2025

# 运行一键部署脚本（已包含时区设置）
sudo bash scripts/deploy.sh
```

### 手动部署步骤

```bash
# 1. 设置时区
sudo bash scripts/set-timezone-shanghai.sh

# 2. 安装依赖
npm install

# 3. 启动服务
npm run start:linux
```

## 🔧 验证修复效果

### 1. 检查服务器时区

```bash
# 系统时区
timedatectl status

# Node.js时区
node -e "console.log('TZ:', process.env.TZ); console.log('Time:', new Date().toString());"
```

### 2. 测试登录功能

1. 访问 `http://your-domain.com/admin/login.html`
2. 使用管理员账号登录
3. 检查是否能正常进入后台，不再弹出

### 3. 查看服务器日志

```bash
# 查看应用日志
journalctl -u diamond-website -f

# 或者PM2日志
pm2 logs diamond-website
```

应该能看到类似的时区信息：

```
🌏 服务器时区信息:
   系统时区: Asia/Shanghai
   当前时间: Tue Jul 15 2025 22:34:09 GMT+0800 (中国标准时间)
   UTC时间: Tue, 15 Jul 2025 14:34:09 GMT
   上海时间: 2025/7/15 22:34:09
```

## 📋 故障排除

### 问题1：时区设置不生效

**解决方法：**
```bash
# 重启系统服务
sudo systemctl restart diamond-website

# 或者重启PM2
pm2 restart diamond-website
```

### 问题2：仍然出现登录问题

**检查步骤：**
1. 确认服务器时间是否正确
2. 检查JWT令牌生成日志
3. 验证浏览器时间是否正确
4. 清除浏览器缓存和Cookie

### 问题3：Docker容器时区问题

**解决方法：**
```bash
# 运行容器时挂载时区文件
docker run -v /etc/localtime:/etc/localtime:ro -e TZ=Asia/Shanghai your-image
```

## 🎯 最佳实践

1. **统一时区**：确保所有服务器使用相同时区
2. **NTP同步**：启用NTP时间同步服务
3. **监控时间**：定期检查服务器时间准确性
4. **文档记录**：记录时区设置和变更

## 📞 技术支持

如果仍然遇到问题，请提供以下信息：

1. 服务器操作系统和版本
2. `timedatectl status` 输出
3. `node test-timezone.js` 输出
4. 应用程序日志
5. 浏览器控制台错误信息

---

**注意**：时区设置需要root权限，建议在服务器维护窗口期间进行操作。
