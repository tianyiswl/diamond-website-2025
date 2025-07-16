# 🚀 管理后台时区问题修复指南

## 问题描述
管理后台登录后立即弹出，通常是由于服务器时区与JWT令牌时间不匹配导致的。

## 快速修复步骤

### 方法1：使用自动修复脚本（推荐）
```bash
# 上传以下文件到服务器后执行
chmod +x deploy-and-fix.sh
sudo ./deploy-and-fix.sh
```

### 方法2：仅修复时区问题
```bash
# 上传quick-timezone-fix.sh到服务器后执行
chmod +x quick-timezone-fix.sh
sudo ./quick-timezone-fix.sh
```

### 方法3：手动修复
```bash
# 1. 设置服务器时区
sudo timedatectl set-timezone Asia/Shanghai

# 2. 设置环境变量
export TZ=Asia/Shanghai

# 3. 重启应用
sudo systemctl restart diamond-website
# 或者
pm2 restart all
```

## 文件上传清单

需要上传到服务器的文件：
- `deploy-and-fix.sh` - 完整部署和修复脚本
- `quick-timezone-fix.sh` - 快速时区修复脚本
- `.env.hostinger` - 已添加时区配置的环境文件
- `admin/admin.js` - 优化后的管理后台文件（如果有修改）

## 验证修复结果

```bash
# 检查时区
timedatectl status

# 检查服务状态
systemctl status diamond-website

# 测试登录API
curl -s http://localhost:3000/api/auth/check
```

## 注意事项

1. **时区一致性**：确保服务器时区设置为 Asia/Shanghai
2. **服务重启**：修改时区后必须重启应用服务
3. **浏览器缓存**：清除浏览器缓存和Cookie后重新登录
4. **JWT密钥**：如果问题仍然存在，检查JWT密钥配置
5. **NTP同步**：建议启用NTP时间同步

## 常见问题

### Q: 执行脚本时提示权限不足
A: 使用 `sudo` 命令执行脚本，或者先修改权限：
```bash
chmod +x script-name.sh
sudo ./script-name.sh
```

### Q: 服务重启失败
A: 检查服务名称和状态：
```bash
systemctl list-units --type=service | grep diamond
ps aux | grep node
```

### Q: 时区设置后仍然有问题
A: 检查以下几点：
1. 环境变量是否正确设置
2. 应用是否读取了正确的环境文件
3. JWT密钥是否一致
4. 服务器时间是否准确

## 联系支持

如果问题仍然存在，请提供以下信息：
- 服务器时区设置 (`timedatectl status`)
- 应用日志 (`tail -f server.log`)
- 浏览器控制台错误信息
- 网络请求详情（F12开发者工具）

## 预防措施

为避免类似问题再次发生：
1. 在部署脚本中包含时区设置
2. 使用统一的时区配置
3. 定期检查服务器时间同步
4. 监控JWT令牌验证失败率