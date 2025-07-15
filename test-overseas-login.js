#!/usr/bin/env node

/**
 * 🧪 国外服务器登录测试脚本
 * 用于测试修复后的登录功能
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// 测试配置
const config = {
    host: 'localhost',
    port: 3000,
    username: 'admin',
    password: 'admin123456'
};

console.log('🧪 国外服务器登录测试');
console.log('====================');

// HTTP请求封装
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: responseData
                });
            });
        });
        
        req.on('error', reject);
        req.on('timeout', () => reject(new Error('请求超时')));
        
        if (data) {
            req.write(data);
        }
        
        req.end();
    });
}

// 1. 测试登录
async function testLogin() {
    console.log('\n1️⃣ 测试登录API');
    console.log('================');
    
    const loginData = JSON.stringify({
        username: config.username,
        password: config.password,
        rememberMe: false
    });
    
    const options = {
        hostname: config.host,
        port: config.port,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(loginData),
            'User-Agent': 'OverseasLoginTest/1.0'
        },
        timeout: 10000
    };
    
    try {
        const response = await makeRequest(options, loginData);
        console.log('📡 登录响应状态:', response.statusCode);
        
        if (response.statusCode === 200) {
            const result = JSON.parse(response.data);
            console.log('✅ 登录成功:', result.message);
            console.log('👤 用户信息:', result.user);
            
            // 提取Cookie
            const cookies = response.headers['set-cookie'];
            let authToken = null;
            
            if (cookies) {
                cookies.forEach(cookie => {
                    if (cookie.startsWith('auth_token=')) {
                        authToken = cookie.split(';')[0];
                        console.log('🍪 获取到认证Cookie:', authToken.substring(0, 50) + '...');
                    }
                });
            }
            
            return { success: true, authToken, cookies: cookies ? cookies.join('; ') : '' };
        } else {
            const result = JSON.parse(response.data);
            console.log('❌ 登录失败:', result.message);
            return { success: false, error: result.message };
        }
    } catch (error) {
        console.log('💥 登录请求失败:', error.message);
        return { success: false, error: error.message };
    }
}

// 2. 测试认证检查（多次）
async function testAuthCheck(cookies, testCount = 5) {
    console.log('\n2️⃣ 测试认证检查API');
    console.log('====================');
    
    const options = {
        hostname: config.host,
        port: config.port,
        path: '/api/auth/check',
        method: 'GET',
        headers: {
            'Cookie': cookies,
            'User-Agent': 'OverseasLoginTest/1.0'
        },
        timeout: 10000
    };
    
    const results = [];
    
    for (let i = 0; i < testCount; i++) {
        const delay = i * 2000; // 每次间隔2秒
        
        if (delay > 0) {
            console.log(`⏳ 等待 ${delay/1000} 秒...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        try {
            console.log(`🔍 第 ${i + 1} 次认证检查...`);
            const response = await makeRequest(options);
            
            const result = {
                attempt: i + 1,
                statusCode: response.statusCode,
                success: response.statusCode === 200,
                timestamp: new Date().toISOString()
            };
            
            if (response.statusCode === 200) {
                const data = JSON.parse(response.data);
                console.log(`  ✅ 认证成功: ${data.user?.username}`);
                result.user = data.user;
            } else {
                console.log(`  ❌ 认证失败: ${response.statusCode}`);
                result.error = response.data;
            }
            
            results.push(result);
            
        } catch (error) {
            console.log(`  💥 请求失败: ${error.message}`);
            results.push({
                attempt: i + 1,
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    return results;
}

// 3. 测试管理后台访问
async function testAdminAccess(cookies) {
    console.log('\n3️⃣ 测试管理后台访问');
    console.log('====================');
    
    const options = {
        hostname: config.host,
        port: config.port,
        path: '/admin',
        method: 'GET',
        headers: {
            'Cookie': cookies,
            'User-Agent': 'OverseasLoginTest/1.0'
        },
        timeout: 10000
    };
    
    try {
        const response = await makeRequest(options);
        console.log('📡 管理后台访问状态:', response.statusCode);
        
        if (response.statusCode === 200) {
            console.log('✅ 管理后台访问成功');
            return { success: true };
        } else if (response.statusCode === 302) {
            const location = response.headers.location;
            console.log('🔄 重定向到:', location);
            
            if (location && location.includes('login')) {
                console.log('❌ 被重定向到登录页，认证可能失效');
                return { success: false, redirected: true };
            } else {
                console.log('✅ 正常重定向');
                return { success: true, redirected: true };
            }
        } else {
            console.log('❌ 管理后台访问失败');
            return { success: false };
        }
    } catch (error) {
        console.log('💥 管理后台访问请求失败:', error.message);
        return { success: false, error: error.message };
    }
}

// 4. 生成测试报告
function generateReport(loginResult, authResults, adminResult) {
    console.log('\n📊 测试报告');
    console.log('============');
    
    console.log('\n🔐 登录测试:');
    console.log(`  状态: ${loginResult.success ? '✅ 成功' : '❌ 失败'}`);
    if (!loginResult.success) {
        console.log(`  错误: ${loginResult.error}`);
    }
    
    console.log('\n🔍 认证检查测试:');
    const successCount = authResults.filter(r => r.success).length;
    const totalCount = authResults.length;
    console.log(`  成功率: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
    
    authResults.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`  第${result.attempt}次: ${status} ${result.timestamp}`);
    });
    
    console.log('\n🏠 管理后台访问:');
    console.log(`  状态: ${adminResult.success ? '✅ 成功' : '❌ 失败'}`);
    if (adminResult.redirected) {
        console.log('  备注: 发生重定向');
    }
    
    // 问题诊断
    console.log('\n🔧 问题诊断:');
    if (!loginResult.success) {
        console.log('  ❌ 登录失败 - 检查用户名密码和服务器状态');
    } else if (successCount < totalCount) {
        console.log('  ⚠️  认证不稳定 - 可能存在时区或Cookie问题');
        console.log('  💡 建议: 检查服务器时区设置和JWT配置');
    } else if (!adminResult.success) {
        console.log('  ❌ 管理后台访问失败 - 检查路由和权限设置');
    } else {
        console.log('  ✅ 所有测试通过，登录功能正常');
    }
}

// 主测试流程
async function runTests() {
    try {
        console.log('🚀 开始测试...');
        
        // 1. 登录测试
        const loginResult = await testLogin();
        if (!loginResult.success) {
            console.log('❌ 登录失败，终止测试');
            return;
        }
        
        // 2. 认证检查测试
        const authResults = await testAuthCheck(loginResult.cookies);
        
        // 3. 管理后台访问测试
        const adminResult = await testAdminAccess(loginResult.cookies);
        
        // 4. 生成报告
        generateReport(loginResult, authResults, adminResult);
        
        console.log('\n🎉 测试完成！');
        
    } catch (error) {
        console.error('💥 测试过程中出现错误:', error);
    }
}

// 运行测试
if (require.main === module) {
    runTests();
}

module.exports = {
    testLogin,
    testAuthCheck,
    testAdminAccess,
    generateReport,
    runTests
};
