# 🚀 快速启动指南

## 立即在服务器上执行

### 1. 进入项目目录
```bash
cd /root/diamond-website-2025
```

### 2. 重启服务
```bash
pm2 restart diamond-website
```

### 3. 验证修复结果
```bash
chmod +x verify-jwt-fix.sh
./verify-jwt-fix.sh
```

### 4. 测试登录
- 访问：http://167.88.43.193:3000/admin/login.html
- 用户名：admin
- 密码：huangde0710

## 如果验证成功
✅ 恭喜！所有问题已解决，系统可以正常使用了！

## 如果验证失败
❌ 请运行以下命令查看详细日志：
```bash
pm2 logs diamond-website --lines 20
```

然后将日志信息反馈给技术支持。

---
**重要**：执行前请确保清除浏览器缓存和Cookie！