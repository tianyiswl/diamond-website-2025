#!/usr/bin/env node

/**
 * 🌍 国外服务器登录问题修复工具
 * 专门用于诊断和修复在国外服务器上登录后立即被弹出的问题
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🌍 国外服务器登录问题修复工具');
console.log('=====================================');

// 加载配置
function loadAdminConfig() {
    try {
        const configPath = path.join(__dirname, 'data', 'admin-config.json');
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('❌ 配置加载失败:', error.message);
    }
    return null;
}

// 1. 系统环境检测
function checkSystemEnvironment() {
    console.log('\n1️⃣ 系统环境检测');
    console.log('==================');
    
    const env = {
        nodeVersion: process.version,
        platform: process.platform,
        timezone: process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone,
        currentTime: new Date().toISOString(),
        localTime: new Date().toString(),
        timezoneOffset: new Date().getTimezoneOffset(),
        utcTime: new Date().toUTCString()
    };
    
    console.log('📊 环境信息:');
    Object.entries(env).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
    });
    
    // 检测时区问题
    const isLikelyOverseas = !env.timezone.includes('Asia') && env.timezoneOffset !== -480;
    if (isLikelyOverseas) {
        console.log('⚠️  检测到可能的国外服务器环境');
        console.log('💡 建议设置时区: export TZ=Asia/Shanghai');
    }
    
    return env;
}

// 2. JWT令牌测试
function testJWTTokens() {
    console.log('\n2️⃣ JWT令牌测试');
    console.log('================');
    
    const config = loadAdminConfig();
    if (!config) {
        console.log('❌ 无法加载配置，跳过JWT测试');
        return false;
    }
    
    console.log('🔑 JWT密钥长度:', config.security?.jwt_secret?.length || '未设置');
    
    // 模拟不同时区的令牌生成和验证
    const testScenarios = [
        { name: '正常情况', timeOffset: 0 },
        { name: '国外服务器(UTC)', timeOffset: 8 * 3600 }, // UTC比北京时间慢8小时
        { name: '美国东部时间', timeOffset: 13 * 3600 }, // EST比北京时间慢13小时
        { name: '欧洲时间', timeOffset: 7 * 3600 } // CET比北京时间慢7小时
    ];
    
    testScenarios.forEach(scenario => {
        console.log(`\n🧪 测试场景: ${scenario.name}`);
        
        const now = Math.floor(Date.now() / 1000);
        const adjustedNow = now + scenario.timeOffset;
        const expirationTime = 3600; // 1小时
        
        const tokenPayload = {
            username: 'test',
            iat: adjustedNow,
            exp: adjustedNow + expirationTime
        };
        
        try {
            const token = jwt.sign(tokenPayload, config.security.jwt_secret);
            console.log('  ✅ 令牌生成成功');
            
            // 立即验证
            const decoded = jwt.verify(token, config.security.jwt_secret);
            console.log('  ✅ 立即验证成功');
            
            // 模拟时间容差验证
            const TIME_TOLERANCE = 1800; // 30分钟容差
            const verifyTime = Math.floor(Date.now() / 1000);
            const timeDiff = verifyTime - decoded.exp;
            
            console.log(`  📊 时间差: ${timeDiff}秒`);
            
            if (decoded.exp && (decoded.exp + TIME_TOLERANCE) < verifyTime) {
                console.log('  ❌ 令牌会被判定为过期');
            } else if (decoded.exp && decoded.exp < verifyTime) {
                console.log('  ⚠️  令牌在容差范围内，会被接受');
            } else {
                console.log('  ✅ 令牌完全有效');
            }
            
        } catch (error) {
            console.log('  ❌ 测试失败:', error.message);
        }
    });
    
    return true;
}

// 3. 网络连接测试
async function testNetworkConnection() {
    console.log('\n3️⃣ 网络连接测试');
    console.log('==================');
    
    const testEndpoints = [
        { name: '本地服务器', host: 'localhost', port: 3000 },
        { name: '本地服务器(127.0.0.1)', host: '127.0.0.1', port: 3000 }
    ];
    
    for (const endpoint of testEndpoints) {
        try {
            console.log(`🔍 测试连接: ${endpoint.name}`);
            
            const result = await new Promise((resolve, reject) => {
                const req = http.request({
                    hostname: endpoint.host,
                    port: endpoint.port,
                    path: '/api/status',
                    method: 'GET',
                    timeout: 5000
                }, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            data: data
                        });
                    });
                });
                
                req.on('error', reject);
                req.on('timeout', () => reject(new Error('请求超时')));
                req.end();
            });
            
            console.log(`  ✅ 连接成功，状态码: ${result.statusCode}`);
            
        } catch (error) {
            console.log(`  ❌ 连接失败: ${error.message}`);
        }
    }
}

// 4. Cookie设置测试
function testCookieSettings() {
    console.log('\n4️⃣ Cookie设置测试');
    console.log('==================');
    
    const cookieScenarios = [
        {
            name: '标准设置',
            options: { httpOnly: true, secure: false, sameSite: 'lax', path: '/' }
        },
        {
            name: '国外服务器设置',
            options: { httpOnly: true, secure: true, sameSite: 'none', path: '/' }
        },
        {
            name: '严格设置',
            options: { httpOnly: true, secure: true, sameSite: 'strict', path: '/' }
        }
    ];
    
    cookieScenarios.forEach(scenario => {
        console.log(`\n🍪 测试场景: ${scenario.name}`);
        console.log('  设置:', JSON.stringify(scenario.options, null, 2));
        
        // 模拟不同环境下的兼容性
        const environments = ['Chrome', 'Firefox', 'Safari', 'Edge'];
        environments.forEach(browser => {
            let compatible = true;
            let warnings = [];
            
            if (scenario.options.sameSite === 'none' && !scenario.options.secure) {
                compatible = false;
                warnings.push('sameSite=none 必须配合 secure=true');
            }
            
            if (scenario.options.secure && browser === 'Safari') {
                warnings.push('Safari可能在HTTP环境下拒绝secure cookie');
            }
            
            console.log(`    ${browser}: ${compatible ? '✅' : '❌'} ${warnings.join(', ')}`);
        });
    });
}

// 5. 生成修复建议
function generateFixSuggestions(env) {
    console.log('\n5️⃣ 修复建议');
    console.log('================');
    
    const suggestions = [];
    
    // 时区相关建议
    if (!env.timezone.includes('Asia')) {
        suggestions.push({
            type: '时区设置',
            priority: 'HIGH',
            description: '设置服务器时区为上海时区',
            commands: [
                'export TZ=Asia/Shanghai',
                'sudo timedatectl set-timezone Asia/Shanghai',
                'node -e "console.log(new Date().toString())" # 验证时区'
            ]
        });
    }
    
    // JWT容差建议
    suggestions.push({
        type: 'JWT容差',
        priority: 'HIGH',
        description: '增加JWT令牌时间容差到30分钟',
        note: '已在代码中实现，TIME_TOLERANCE = 1800秒'
    });
    
    // Cookie设置建议
    suggestions.push({
        type: 'Cookie优化',
        priority: 'MEDIUM',
        description: '根据环境动态调整Cookie设置',
        note: '已在代码中实现国外服务器检测和优化'
    });
    
    // 前端优化建议
    suggestions.push({
        type: '前端优化',
        priority: 'MEDIUM',
        description: '增加认证检查延迟和重试次数',
        note: '已优化前端认证逻辑，国外访问使用更长延迟'
    });
    
    suggestions.forEach((suggestion, index) => {
        console.log(`\n${index + 1}. ${suggestion.type} [${suggestion.priority}]`);
        console.log(`   描述: ${suggestion.description}`);
        if (suggestion.commands) {
            console.log('   命令:');
            suggestion.commands.forEach(cmd => console.log(`     ${cmd}`));
        }
        if (suggestion.note) {
            console.log(`   备注: ${suggestion.note}`);
        }
    });
}

// 主函数
async function main() {
    try {
        const env = checkSystemEnvironment();
        testJWTTokens();
        await testNetworkConnection();
        testCookieSettings();
        generateFixSuggestions(env);
        
        console.log('\n🎉 诊断完成！');
        console.log('================');
        console.log('💡 如果问题仍然存在，请：');
        console.log('1. 检查浏览器开发者工具的Network和Application标签');
        console.log('2. 查看服务器日志中的认证相关输出');
        console.log('3. 运行 node test-auth.js 进行实际登录测试');
        console.log('4. 确认服务器防火墙和代理设置');
        
    } catch (error) {
        console.error('💥 诊断过程中出现错误:', error);
    }
}

// 运行诊断
if (require.main === module) {
    main();
}

module.exports = {
    checkSystemEnvironment,
    testJWTTokens,
    testNetworkConnection,
    testCookieSettings,
    generateFixSuggestions
};
