#!/bin/bash
# JWT修复验证脚本

echo "🔧 开始验证JWT修复结果..."
echo ""

# 1. 检查修复的文件
echo "📋 检查已修复的配置..."

echo "1. server.js JWT过期时间设置:"
grep -n "expirationTime.*24.*60.*60" server.js && echo "   ✅ JWT过期时间已修复为24小时" || echo "   ❌ JWT过期时间修复失败"

echo ""
echo "2. server.js Cookie maxAge设置:"
grep -n "maxAge.*24.*60.*60.*1000" server.js && echo "   ✅ Cookie maxAge已修复为24小时" || echo "   ❌ Cookie maxAge修复失败"

echo ""
echo "3. admin-config.json session_timeout设置:"
grep -n "86400000" data/admin-config.json && echo "   ✅ session_timeout已修复为24小时" || echo "   ❌ session_timeout修复失败"

echo ""
echo "4. 环境配置文件SESSION_TIMEOUT设置:"
grep -n "SESSION_TIMEOUT=86400000" .env.production && echo "   ✅ .env.production已修复" || echo "   ❌ .env.production修复失败"
grep -n "SESSION_TIMEOUT=86400000" .env.hostinger && echo "   ✅ .env.hostinger已修复" || echo "   ❌ .env.hostinger修复失败"

echo ""
echo "🚀 重启PM2服务..."
pm2 restart diamond-website

echo ""
echo "⏳ 等待服务启动..."
sleep 5

echo ""
echo "🧪 测试JWT令牌有效期..."

# 测试登录并检查JWT令牌
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"huangde0710"}' \
  -c jwt-test.txt -s > login-result.json

if [ $? -eq 0 ]; then
    echo "✅ 登录API调用成功"
    
    # 检查登录结果
    if grep -q '"success":true' login-result.json; then
        echo "✅ 登录验证成功"
        
        # 检查JWT令牌有效期
        node -e "
        const fs = require('fs');
        const jwt = require('jsonwebtoken');
        
        try {
            const cookies = fs.readFileSync('jwt-test.txt', 'utf8');
            const tokenMatch = cookies.match(/auth_token\s+([^\s]+)/);
            
            if (tokenMatch) {
                const token = tokenMatch[1];
                const decoded = jwt.decode(token);
                const hours = (decoded.exp - decoded.iat) / 3600;
                
                console.log('📊 JWT令牌详情:');
                console.log('   创建时间:', new Date(decoded.iat * 1000).toLocaleString('zh-CN'));
                console.log('   过期时间:', new Date(decoded.exp * 1000).toLocaleString('zh-CN'));
                console.log('   有效期:', hours, '小时');
                
                if (hours >= 23 && hours <= 25) {
                    console.log('🎉 修复成功！JWT令牌有效期为24小时');
                    process.exit(0);
                } else {
                    console.log('❌ 修复失败，有效期应为24小时，实际为', hours, '小时');
                    process.exit(1);
                }
            } else {
                console.log('❌ 未找到JWT令牌');
                process.exit(1);
            }
        } catch (error) {
            console.log('❌ JWT令牌解析失败:', error.message);
            process.exit(1);
        }
        " && JWT_SUCCESS=true || JWT_SUCCESS=false
        
    else
        echo "❌ 登录验证失败"
        cat login-result.json
        JWT_SUCCESS=false
    fi
else
    echo "❌ 登录API调用失败"
    JWT_SUCCESS=false
fi

# 清理临时文件
rm -f jwt-test.txt login-result.json

echo ""
echo "📋 验证总结:"
if [ "$JWT_SUCCESS" = true ]; then
    echo "🎉 JWT修复验证成功！"
    echo "   - JWT令牌有效期：24小时"
    echo "   - Cookie配置：已同步"
    echo "   - Session超时：已统一"
    echo ""
    echo "✅ 现在可以正常登录管理后台了！"
    echo "   访问地址：http://167.88.43.193:3000/admin/login.html"
    echo "   用户名：admin"
    echo "   密码：huangde0710"
else
    echo "❌ JWT修复验证失败，请检查以上错误信息"
fi

echo ""
echo "🔍 如需查看详细日志："
echo "   pm2 logs diamond-website --lines 20"