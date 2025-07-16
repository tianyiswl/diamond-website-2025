#!/bin/bash
# 快速时区修复脚本 - 解决管理后台登录问题

echo "🌏 修复服务器时区问题..."

# 设置系统时区
echo "📅 设置系统时区为Asia/Shanghai..."
sudo timedatectl set-timezone Asia/Shanghai

# 设置环境变量
echo "🔧 设置环境变量..."
export TZ=Asia/Shanghai

# 显示当前时区信息
echo "📊 当前时区信息:"
timedatectl status

# 重启应用服务
echo "🔄 重启应用服务..."
if systemctl is-active --quiet diamond-website; then
    sudo systemctl restart diamond-website
    echo "✅ diamond-website服务已重启"
elif command -v pm2 &> /dev/null; then
    pm2 restart all
    echo "✅ PM2进程已重启"
else
    echo "⚠️ 未找到运行中的服务，请手动重启应用"
fi

echo "✅ 时区修复完成！"
echo ""
echo "📝 接下来请："
echo "1. 清除浏览器缓存和Cookie"
echo "2. 重新登录管理后台"
echo "3. 如果问题仍然存在，请检查JWT密钥配置"