#!/bin/bash
# 完整部署和修复脚本 - 解决管理后台问题

echo "🚀 开始部署和修复管理后台问题..."

# 1. 设置时区
echo "📅 设置服务器时区..."
sudo timedatectl set-timezone Asia/Shanghai
export TZ=Asia/Shanghai

# 2. 安装依赖
echo "📦 安装/更新依赖..."
npm install --production

# 3. 重启服务
echo "🔄 重启服务..."
if systemctl is-active --quiet diamond-website; then
    sudo systemctl restart diamond-website
    echo "✅ diamond-website服务已重启"
elif command -v pm2 &> /dev/null; then
    pm2 restart all
    echo "✅ PM2进程已重启"
else
    echo "🚀 直接启动服务..."
    nohup node server.js > server.log 2>&1 &
    echo "✅ 服务已启动"
fi

echo "⏳ 等待服务启动..."
sleep 5

# 4. 验证服务状态
echo "🔍 验证服务状态..."
if curl -s http://localhost:3000/api/auth/check > /dev/null; then
    echo "✅ 服务运行正常"
else
    echo "⚠️ 服务可能未正常启动，请检查日志"
fi

# 5. 显示时区信息
echo ""
echo "📊 当前服务器时区信息:"
timedatectl status

echo ""
echo "🎉 部署和修复完成！"
echo ""
echo "📝 接下来请："
echo "1. 清除浏览器缓存和Cookie"
echo "2. 重新访问管理后台"
echo "3. 如果问题仍然存在，请查看服务日志"