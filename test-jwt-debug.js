const jwt = require('jsonwebtoken');

// 使用与server.js相同的密钥
const SECRET_KEY = 'your-secret-key-2024';

console.log('🌏 详细时区检查:');
console.log('系统时区:', process.env.TZ || 'undefined');
console.log('Node.js时区:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('当前时间戳:', Date.now());
console.log('当前时间:', new Date().toString());
console.log('UTC时间:', new Date().toISOString());
console.log('上海时间:', new Date().toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'}));

// 模拟登录时的JWT生成
console.log('\n🔐 模拟登录JWT生成:');
const now = Math.floor(Date.now() / 1000);
const loginPayload = {
    userId: 1,
    username: 'admin',
    iat: now,
    exp: now + (2 * 60 * 60) // 2小时后过期
};

console.log('当前时间戳 (秒):', now);
console.log('生成时间:', new Date(now * 1000).toString());
console.log('过期时间:', new Date(loginPayload.exp * 1000).toString());
console.log('距离过期还有:', Math.floor((loginPayload.exp - now) / 60), '分钟');

const token = jwt.sign(loginPayload, SECRET_KEY);
console.log('生成的JWT令牌长度:', token.length);

// 模拟5秒后的验证（登录后被弹出的时间点）
console.log('\n⏰ 模拟5秒后验证:');
setTimeout(() => {
    const verifyTime = Math.floor(Date.now() / 1000);
    console.log('验证时间戳 (秒):', verifyTime);
    console.log('验证时间:', new Date(verifyTime * 1000).toString());
    console.log('时间差:', verifyTime - now, '秒');
    
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        console.log('✅ JWT验证成功');
        console.log('令牌iat:', decoded.iat, '当前时间:', verifyTime);
        console.log('令牌是否过期:', verifyTime > decoded.exp ? '是' : '否');
        
        // 检查时间偏差
        const timeDiff = verifyTime - decoded.iat;
        console.log('时间偏差:', timeDiff, '秒');
        if (timeDiff > 300) { // 5分钟
            console.log('⚠️  警告: 时间偏差过大，可能导致验证失败');
        }
    } catch (error) {
        console.log('❌ JWT验证失败:', error.message);
        if (error.name === 'TokenExpiredError') {
            console.log('令牌过期时间:', new Date(error.expiredAt).toString());
        }
    }
}, 5000);

// 立即验证一次
console.log('\n🧪 立即验证测试:');
try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log('✅ 立即验证成功');
} catch (error) {
    console.log('❌ 立即验证失败:', error.message);
}
