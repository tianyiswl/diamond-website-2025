#!/usr/bin/env node

/**
 * 测试登录流程脚本
 * 用于验证后台登录认证是否正常工作
 */

const http = require('http');
const querystring = require('querystring');

// 测试配置
const config = {
    host: 'localhost',
    port: 3000,
    username: 'admin',
    password: 'admin123'
};

// 存储cookie
let cookies = '';

// HTTP请求封装函数
function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            
            // 收集响应数据
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                // 提取Set-Cookie头
                if (res.headers['set-cookie']) {
                    cookies = res.headers['set-cookie'].join('; ');
                    console.log('🍪 收到Cookie:', cookies);
                }
                
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });
        
        req.on('error', (err) => {
            reject(err);
        });
        
        // 发送POST数据
        if (postData) {
            req.write(postData);
        }
        
        req.end();
    });
}

// 测试登录
async function testLogin() {
    console.log('🚀 开始测试登录流程...\n');
    
    try {
        // 1. 测试登录API
        console.log('1️⃣ 测试登录API...');
        const loginData = JSON.stringify({
            username: config.username,
            password: config.password,
            rememberMe: false
        });
        
        const loginOptions = {
            hostname: config.host,
            port: config.port,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(loginData)
            }
        };
        
        const loginResponse = await makeRequest(loginOptions, loginData);
        console.log('📡 登录响应状态:', loginResponse.statusCode);
        
        if (loginResponse.statusCode === 200) {
            const loginResult = JSON.parse(loginResponse.data);
            console.log('✅ 登录成功:', loginResult.message);
            console.log('👤 用户信息:', loginResult.user);
        } else {
            console.log('❌ 登录失败:', loginResponse.data);
            return;
        }
        
        // 2. 测试认证检查API
        console.log('\n2️⃣ 测试认证检查API...');
        const checkOptions = {
            hostname: config.host,
            port: config.port,
            path: '/api/auth/check',
            method: 'GET',
            headers: {
                'Cookie': cookies
            }
        };
        
        const checkResponse = await makeRequest(checkOptions);
        console.log('📡 认证检查响应状态:', checkResponse.statusCode);
        
        if (checkResponse.statusCode === 200) {
            const checkResult = JSON.parse(checkResponse.data);
            console.log('✅ 认证检查成功:', checkResult.user);
        } else {
            console.log('❌ 认证检查失败:', checkResponse.data);
            return;
        }
        
        // 3. 测试管理后台访问
        console.log('\n3️⃣ 测试管理后台访问...');
        const adminOptions = {
            hostname: config.host,
            port: config.port,
            path: '/admin',
            method: 'GET',
            headers: {
                'Cookie': cookies
            }
        };
        
        const adminResponse = await makeRequest(adminOptions);
        console.log('📡 管理后台访问响应状态:', adminResponse.statusCode);
        console.log('🔄 重定向位置:', adminResponse.headers.location);
        
        if (adminResponse.statusCode === 302 && adminResponse.headers.location === '/admin/index.html') {
            console.log('✅ 管理后台访问正常，正确重定向到index.html');
        } else {
            console.log('❌ 管理后台访问异常');
        }
        
        // 4. 测试登出
        console.log('\n4️⃣ 测试登出API...');
        const logoutOptions = {
            hostname: config.host,
            port: config.port,
            path: '/api/auth/logout',
            method: 'POST',
            headers: {
                'Cookie': cookies
            }
        };
        
        const logoutResponse = await makeRequest(logoutOptions);
        console.log('📡 登出响应状态:', logoutResponse.statusCode);
        
        if (logoutResponse.statusCode === 200) {
            const logoutResult = JSON.parse(logoutResponse.data);
            console.log('✅ 登出成功:', logoutResult.message);
        } else {
            console.log('❌ 登出失败:', logoutResponse.data);
        }
        
        console.log('\n🎉 登录流程测试完成！');
        
    } catch (error) {
        console.error('💥 测试过程中发生错误:', error);
    }
}

// 运行测试
testLogin();
