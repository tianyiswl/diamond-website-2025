#!/bin/bash

# 🌏 设置AlmaLinux服务器时区为上海时区
# 解决JWT令牌时间验证问题

echo "🌏 开始设置服务器时区为上海时区..."

# 检查当前用户权限
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用root权限运行此脚本"
    echo "   使用方法: sudo bash scripts/set-timezone-shanghai.sh"
    exit 1
fi

# 显示当前时区信息
echo ""
echo "📅 当前时区信息:"
echo "   系统时区: $(timedatectl show --property=Timezone --value)"
echo "   当前时间: $(date)"
echo "   UTC时间: $(date -u)"
echo ""

# 设置时区为上海
echo "🔧 设置时区为Asia/Shanghai..."
timedatectl set-timezone Asia/Shanghai

# 验证时区设置
if [ $? -eq 0 ]; then
    echo "✅ 时区设置成功！"
else
    echo "❌ 时区设置失败！"
    exit 1
fi

# 显示新的时区信息
echo ""
echo "📅 新的时区信息:"
echo "   系统时区: $(timedatectl show --property=Timezone --value)"
echo "   当前时间: $(date)"
echo "   UTC时间: $(date -u)"
echo ""

# 检查NTP同步状态
echo "🕐 检查时间同步状态..."
ntp_status=$(timedatectl show --property=NTPSynchronized --value)
if [ "$ntp_status" = "yes" ]; then
    echo "✅ NTP时间同步已启用"
else
    echo "⚠️  NTP时间同步未启用，正在启用..."
    timedatectl set-ntp true
    if [ $? -eq 0 ]; then
        echo "✅ NTP时间同步已启用"
    else
        echo "❌ 启用NTP时间同步失败"
    fi
fi

# 显示完整的时间状态
echo ""
echo "📊 完整时间状态:"
timedatectl status

# 重启相关服务（如果需要）
echo ""
echo "🔄 重启相关服务..."

# 检查是否有systemd服务需要重启
if systemctl is-active --quiet diamond-website; then
    echo "🔄 重启diamond-website服务..."
    systemctl restart diamond-website
    echo "✅ diamond-website服务已重启"
fi

# 检查是否有PM2进程需要重启
if command -v pm2 &> /dev/null; then
    echo "🔄 重启PM2进程..."
    pm2 restart all
    echo "✅ PM2进程已重启"
fi

echo ""
echo "🎉 时区设置完成！"
echo ""
echo "📝 重要提醒:"
echo "   1. 服务器时区已设置为Asia/Shanghai"
echo "   2. 建议重启应用程序以确保时区生效"
echo "   3. 如果使用Docker，需要在容器中也设置相同时区"
echo "   4. 数据库时区也需要相应调整"
echo ""

# 创建时区验证脚本
cat > /tmp/verify-timezone.js << 'EOF'
#!/usr/bin/env node

console.log('🌏 Node.js时区验证:');
console.log('   process.env.TZ:', process.env.TZ);
console.log('   当前时间:', new Date().toString());
console.log('   UTC时间:', new Date().toUTCString());
console.log('   上海时间:', new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
console.log('   时区偏移:', new Date().getTimezoneOffset(), '分钟');
console.log('   Intl时区:', Intl.DateTimeFormat().resolvedOptions().timeZone);

// 测试JWT时间戳
const now = Math.floor(Date.now() / 1000);
console.log('');
console.log('🕐 JWT时间戳测试:');
console.log('   当前时间戳:', now);
console.log('   时间戳对应时间:', new Date(now * 1000).toISOString());
console.log('   1小时后过期:', new Date((now + 3600) * 1000).toISOString());
EOF

echo "🧪 运行时区验证测试..."
node /tmp/verify-timezone.js
rm /tmp/verify-timezone.js

echo ""
echo "✅ 时区设置和验证完成！"
