#!/bin/bash

# 🚀 重启服务并测试认证修复
echo "🔧 正在重启Diamond Website服务..."

# 重启PM2服务
pm2 restart diamond-website

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 3

# 检查服务状态
echo "📊 检查服务状态:"
pm2 status diamond-website

# 检查服务是否响应
echo "🌐 测试服务连接:"
curl -I http://localhost:3001 2>/dev/null | head -1

# 查看最新日志
echo "📝 最新日志:"
pm2 logs diamond-website --lines 10

echo ""
echo "✅ 服务重启完成！"
echo "🔗 请访问: http://您的服务器IP:3001/admin"
echo "👤 测试账号: admin / admin123456"
echo ""
echo "🔍 如果仍有问题，请查看PM2日志:"
echo "   pm2 logs diamond-website"
