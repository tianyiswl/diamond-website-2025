# ⚡ 钻石网站快速更新命令手册

## 🎯 **一键更新流程（推荐）**

### Windows本地操作

```powershell
# 进入项目目录
cd f:\pycode\diamond-website-2025

# 一键推送到生产环境（包含服务器更新）
.\push-to-production.ps1 -ServerIP "your-server-ip" -Username "root"

# 或者仅推送代码（不触发服务器更新）
.\push-to-production.ps1
```

### 服务器端操作

```bash
# 一键安全更新（包含备份、更新、验证）
sudo /usr/local/bin/diamond-update.sh update

# 验证更新结果
sudo ./verify-deployment.sh

# 如果有问题，一键回滚
sudo /usr/local/bin/diamond-update.sh rollback
```

---

## 🔧 **手动更新流程**

### 第一步：本地代码推送

```powershell
# Windows PowerShell
cd f:\pycode\diamond-website-2025

# 提交本地更改
git add .
git commit -m "feat: 智能缓存和性能优化更新"
git push origin main

# 创建版本标签
git tag -a v1.1.0 -m "智能缓存优化版本"
git push origin v1.1.0
```

### 第二步：服务器端更新

```bash
# SSH连接到服务器
ssh root@your-server-ip

# 进入应用目录
cd /opt/diamond-website

# 创建备份
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
cp -r /opt/diamond-website /opt/backups/backup-$BACKUP_DATE

# 拉取最新代码
git pull origin main

# 更新依赖（仅在package.json变化时需要）
npm install --production

# 零停机重启
pm2 reload diamond-website --update-env

# 验证更新
pm2 status
curl http://localhost:3001/api/status
```

---

## 📊 **验证和测试命令**

### 基础状态检查

```bash
# 检查应用状态
pm2 status
pm2 logs diamond-website --lines 20

# 检查服务状态
systemctl status nginx
curl -I https://your-domain.com

# 检查端口监听
netstat -tlnp | grep -E ":3001|:80|:443"
```

### 性能测试

```bash
# 测试API响应时间
time curl -s http://localhost:3001/api/products > /dev/null

# 测试缓存效果（多次执行对比）
curl -w "响应时间: %{time_total}s\n" -o /dev/null -s http://localhost:3001/api/products

# 完整验证脚本
./verify-deployment.sh
```

### 缓存功能验证

```bash
# 第一次请求（建立缓存）
curl -w "首次: %{time_total}s\n" -o /dev/null -s http://localhost:3001/api/products

# 第二次请求（缓存命中）
curl -w "缓存: %{time_total}s\n" -o /dev/null -s http://localhost:3001/api/products

# 查看内存使用
pm2 show diamond-website | grep memory
```

---

## 🚨 **故障排除命令**

### 应用问题排查

```bash
# 查看详细日志
pm2 logs diamond-website --lines 50

# 检查语法错误
cd /opt/diamond-website
node -c server.js

# 重启应用
pm2 restart diamond-website

# 强制重新加载
pm2 delete diamond-website
pm2 start server.js --name diamond-website
```

### Nginx问题排查

```bash
# 检查Nginx配置
nginx -t

# 查看Nginx日志
tail -f /var/log/nginx/diamond-website-error.log
tail -f /var/log/nginx/diamond-website-access.log

# 重新加载Nginx
systemctl reload nginx

# 重启Nginx
systemctl restart nginx
```

### 系统资源检查

```bash
# 检查系统资源
free -h
df -h
top -bn1 | head -20

# 检查网络连接
netstat -an | grep :80 | wc -l
ss -tlnp | grep :3001
```

---

## 🔙 **回滚操作**

### 快速回滚

```bash
# 使用自动化脚本回滚
sudo /usr/local/bin/diamond-update.sh rollback

# 手动Git回滚
cd /opt/diamond-website
git log --oneline -5  # 查看提交历史
git reset --hard HEAD~1  # 回滚到上一个版本
pm2 reload diamond-website
```

### 从备份恢复

```bash
# 查看可用备份
ls -la /opt/backups/

# 从备份恢复
BACKUP_DIR="/opt/backups/backup-20241219_143000"  # 替换为实际备份目录
pm2 stop diamond-website
rm -rf /opt/diamond-website
cp -r $BACKUP_DIR /opt/diamond-website
pm2 start diamond-website
```

---

## 📋 **更新检查清单**

### ✅ 更新前检查

- [ ] 确认当前服务正常运行
- [ ] 创建完整备份
- [ ] 记录当前Git提交ID
- [ ] 检查系统资源充足

### ✅ 更新过程检查

- [ ] 代码成功推送到Git仓库
- [ ] 服务器成功拉取最新代码
- [ ] 依赖包更新完成（如需要）
- [ ] 应用成功重启

### ✅ 更新后验证

- [ ] PM2显示应用状态为online
- [ ] API接口响应正常
- [ ] 网站首页可以访问
- [ ] 缓存功能正常工作
- [ ] 性能有明显提升

---

## 🔧 **常用管理命令速查**

```bash
# 应用管理
pm2 status                          # 查看所有应用状态
pm2 logs diamond-website            # 查看应用日志
pm2 restart diamond-website         # 重启应用
pm2 reload diamond-website          # 零停机重启
pm2 stop diamond-website            # 停止应用
pm2 start diamond-website           # 启动应用
pm2 delete diamond-website          # 删除应用

# 服务管理
systemctl status nginx              # 查看Nginx状态
systemctl restart nginx             # 重启Nginx
systemctl reload nginx              # 重新加载Nginx配置
nginx -t                            # 测试Nginx配置

# 监控命令
/usr/local/bin/diamond-monitor monitor     # 运行监控检查
/usr/local/bin/diamond-monitor report      # 生成性能报告
./verify-deployment.sh                     # 验证部署状态

# 日志查看
tail -f /var/log/nginx/diamond-website-access.log    # 实时访问日志
tail -f /var/log/nginx/diamond-website-error.log     # 实时错误日志
pm2 logs diamond-website --lines 100                 # 查看应用日志

# 性能测试
curl -w "%{time_total}s\n" -o /dev/null -s http://localhost:3001/api/products
ab -n 100 -c 10 http://localhost:3001/                # Apache Bench测试
```

---

## 💡 **最佳实践建议**

### 🔄 **定期更新流程**

1. **开发阶段**：在本地充分测试新功能
2. **提交代码**：使用有意义的提交消息
3. **创建标签**：为重要版本创建Git标签
4. **备份数据**：更新前自动创建备份
5. **零停机部署**：使用PM2的reload功能
6. **验证结果**：更新后立即验证功能
7. **监控观察**：持续监控系统状态

### 🛡️ **安全注意事项**

- 始终在更新前创建备份
- 使用Git标签管理版本
- 在低峰期执行更新
- 准备好快速回滚方案
- 监控系统资源使用

### 📈 **性能优化提示**

- 定期清理日志文件
- 监控内存使用情况
- 优化数据库查询
- 使用CDN加速静态资源
- 定期更新依赖包

---

## 📞 **紧急联系信息**

```
应急操作:
  立即回滚: sudo /usr/local/bin/diamond-update.sh rollback
  重启所有服务: pm2 restart all && systemctl restart nginx
  查看系统状态: systemctl status nginx && pm2 status

故障排查:
  1. 检查应用日志: pm2 logs diamond-website
  2. 检查Nginx日志: tail -f /var/log/nginx/diamond-website-error.log
  3. 检查系统资源: free -h && df -h
  4. 验证配置文件: nginx -t && node -c /opt/diamond-website/server.js
```

**🎉 使用这些命令，您可以安全、快速地更新钻石网站到最新的优化版本！**
