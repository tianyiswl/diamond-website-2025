# 🚀 AlmaLinux 10 部署指南

## 📋 系统要求
- AlmaLinux 10
- Node.js 18+ 
- npm 9+

## 🔧 快速部署步骤

### 1. 安装Node.js
```bash
# 安装Node.js和npm
sudo dnf install nodejs npm -y

# 验证安装
node --version
npm --version
```

### 2. 部署应用
```bash
# 上传项目文件到服务器
# 进入项目目录
cd /path/to/diamond-website-new

# 安装依赖
npm install

# 启动应用
npm start
```

### 3. 配置系统服务（可选）
```bash
# 创建systemd服务文件
sudo nano /etc/systemd/system/diamond-website.service
```

服务文件内容：
```ini
[Unit]
Description=Diamond Website CMS
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/diamond-website-new
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
sudo systemctl daemon-reload
sudo systemctl enable diamond-website
sudo systemctl start diamond-website
sudo systemctl status diamond-website
```

### 4. 配置防火墙
```bash
# 开放端口3000
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### 5. 配置Nginx反向代理（推荐）
```bash
# 安装Nginx
sudo dnf install nginx -y

# 创建配置文件
sudo nano /etc/nginx/conf.d/diamond-website.conf
```

Nginx配置：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启动Nginx：
```bash
sudo systemctl enable nginx
sudo systemctl start nginx
```

## 📁 项目结构
```
diamond-website-new/
├── server.js              # 主服务器文件
├── package.json           # 项目配置
├── index.html             # 网站首页
├── admin/                 # 管理后台
├── assets/                # 静态资源
├── data/                  # 数据文件
├── pages/                 # 页面文件
└── uploads/               # 上传文件
```

## 🔐 默认管理员账号
- 用户名: admin
- 密码: admin123
- 登录地址: http://your-domain.com/admin/login.html

## 📞 技术支持
如有问题，请联系技术支持团队。
