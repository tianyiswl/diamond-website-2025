const jwt = require('jsonwebtoken');
const fs = require('fs');

console.log('🔍 开始诊断登录后被弹出问题...\n');

// 读取配置
function loadAdminConfig() {
    try {
        const configPath = './data/admin-config.json';
        if (fs.existsSync(configPath)) {
            const configData = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configData);
        }
    } catch (error) {
        console.error('❌ 配置加载失败:', error.message);
    }
    return null;
}

// 模拟JWT生成和验证过程
function simulateJWTFlow() {
    console.log('1️⃣ 模拟JWT令牌生成和验证流程...\n');
    
    const config = loadAdminConfig();
    if (!config) {
        console.log('❌ 无法加载配置，停止测试');
        return;
    }
    
    console.log('📋 当前配置信息:');
    console.log('- JWT密钥长度:', config.security?.jwt_secret?.length || '未设置');
    console.log('- 管理员数量:', config.admins?.length || 0);
    
    // 模拟登录时的JWT生成
    const now = Math.floor(Date.now() / 1000);
    const expirationTime = 2 * 60 * 60; // 2小时
    
    const tokenPayload = {
        userId: 1,
        username: 'admin',
        role: 'admin',
        iat: now,
        exp: now + expirationTime
    };
    
    console.log('\n🔐 生成JWT令牌:');
    console.log('- 当前时间戳:', now);
    console.log('- 生成时间:', new Date(now * 1000).toISOString());
    console.log('- 过期时间戳:', tokenPayload.exp);
    console.log('- 过期时间:', new Date(tokenPayload.exp * 1000).toISOString());
    console.log('- 有效期:', expirationTime / 3600, '小时');
    
    try {
        const token = jwt.sign(tokenPayload, config.security.jwt_secret);
        console.log('✅ JWT令牌生成成功，长度:', token.length);
        
        // 立即验证
        console.log('\n🔍 立即验证JWT令牌:');
        const decoded = jwt.verify(token, config.security.jwt_secret);
        console.log('✅ 立即验证成功');
        console.log('- 解码用户:', decoded.username);
        console.log('- 解码时间:', new Date(decoded.iat * 1000).toISOString());
        console.log('- 解码过期:', new Date(decoded.exp * 1000).toISOString());
        
        // 模拟TIME_TOLERANCE验证
        console.log('\n⏰ 模拟TIME_TOLERANCE验证逻辑:');
        const verifyTime = Math.floor(Date.now() / 1000);
        const TIME_TOLERANCE = 300; // 5分钟容差
        
        console.log('- 验证时间戳:', verifyTime);
        console.log('- 令牌过期时间戳:', decoded.exp);
        console.log('- 时间差:', verifyTime - decoded.exp, '秒');
        console.log('- 容差范围:', TIME_TOLERANCE, '秒');
        
        if (decoded.exp && (decoded.exp + TIME_TOLERANCE) < verifyTime) {
            console.log('❌ 令牌真正过期');
        } else if (decoded.exp && decoded.exp < verifyTime) {
            console.log('⚠️  令牌在容差范围内，允许通过');
        } else {
            console.log('✅ 令牌有效');
        }
        
        // 模拟5秒后验证
        console.log('\n⏰ 模拟5秒后验证:');
        setTimeout(() => {
            try {
                const verifyTime2 = Math.floor(Date.now() / 1000);
                console.log('- 5秒后验证时间戳:', verifyTime2);
                console.log('- 时间差:', verifyTime2 - decoded.exp, '秒');
                
                if (decoded.exp && (decoded.exp + TIME_TOLERANCE) < verifyTime2) {
                    console.log('❌ 5秒后令牌真正过期');
                } else if (decoded.exp && decoded.exp < verifyTime2) {
                    console.log('⚠️  5秒后令牌在容差范围内，允许通过');
                } else {
                    console.log('✅ 5秒后令牌仍然有效');
                }
                
                const decoded2 = jwt.verify(token, config.security.jwt_secret);
                console.log('✅ 5秒后JWT验证成功');
                
            } catch (error) {
                console.log('❌ 5秒后JWT验证失败:', error.message);
            }
        }, 5000);
        
    } catch (error) {
        console.log('❌ JWT令牌生成失败:', error.message);
    }
}

// 检查系统时间和时区
function checkSystemTime() {
    console.log('\n2️⃣ 检查系统时间和时区...\n');
    
    console.log('🌍 系统时间信息:');
    console.log('- process.env.TZ:', process.env.TZ || 'undefined');
    console.log('- 当前时间:', new Date().toString());
    console.log('- UTC时间:', new Date().toISOString());
    console.log('- 上海时间:', new Date().toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'}));
    console.log('- 时区偏移:', new Date().getTimezoneOffset(), '分钟');
    console.log('- Intl时区:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    
    console.log('\n🕐 时间戳信息:');
    const now = Date.now();
    const nowSeconds = Math.floor(now / 1000);
    console.log('- 当前毫秒时间戳:', now);
    console.log('- 当前秒时间戳:', nowSeconds);
    console.log('- 时间戳转换验证:', new Date(nowSeconds * 1000).toISOString());
}

// 检查可能的问题原因
function checkPossibleIssues() {
    console.log('\n3️⃣ 检查可能的问题原因...\n');
    
    console.log('🔍 可能的问题原因分析:');
    console.log('1. Cookie设置问题:');
    console.log('   - httpOnly: true (正确)');
    console.log('   - secure: false (适合HTTP)');
    console.log('   - sameSite: lax (适中安全性)');
    console.log('   - path: / (全域有效)');
    
    console.log('\n2. 前端认证检查频率:');
    console.log('   - 页面加载时立即检查');
    console.log('   - 可能存在重复检查');
    console.log('   - 网络延迟导致的竞态条件');
    
    console.log('\n3. 服务器端验证逻辑:');
    console.log('   - JWT密钥一致性');
    console.log('   - 时区时间同步');
    console.log('   - TIME_TOLERANCE容差机制');
    
    console.log('\n4. 浏览器环境:');
    console.log('   - Cookie存储和发送');
    console.log('   - 跨域请求处理');
    console.log('   - 缓存策略影响');
}

// 运行诊断
console.log('🚀 开始全面诊断...\n');
simulateJWTFlow();
checkSystemTime();
checkPossibleIssues();

console.log('\n📋 诊断建议:');
console.log('1. 运行 node debug-auth-flow.js 测试完整认证流程');
console.log('2. 检查浏览器开发者工具的Network和Application标签');
console.log('3. 查看服务器日志中的认证相关输出');
console.log('4. 确认服务器时区设置是否正确');
