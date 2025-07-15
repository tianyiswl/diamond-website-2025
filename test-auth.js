#!/usr/bin/env node

/**
 * 🔧 认证问题测试脚本
 * 用于诊断服务器环境下的登录问题
 */

const http = require('http');
const https = require('https');
const querystring = require('querystring');

const SERVER_URL = 'http://localhost:3001';
const TEST_USER = {
    username: 'admin',
    password: 'admin123456'
};

console.log('🚀 开始认证测试...\n');

// 测试登录
function testLogin() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            username: TEST_USER.username,
            password: TEST_USER.password,
            rememberMe: false
        });

        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('📝 登录响应状态:', res.statusCode);
                console.log('🍪 响应头 Set-Cookie:', res.headers['set-cookie']);
                
                try {
                    const result = JSON.parse(data);
                    console.log('📄 响应内容:', result);
                    
                    if (res.statusCode === 200 && result.success) {
                        // 提取cookie
                        const cookies = res.headers['set-cookie'];
                        let authToken = null;
                        
                        if (cookies) {
                            cookies.forEach(cookie => {
                                if (cookie.startsWith('auth_token=')) {
                                    authToken = cookie.split(';')[0];
                                }
                            });
                        }
                        
                        resolve({ success: true, authToken, result });
                    } else {
                        resolve({ success: false, error: result.message });
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

// 测试认证检查
function testAuthCheck(authToken) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/auth/check',
            method: 'GET',
            headers: {
                'Cookie': authToken
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('🔍 认证检查状态:', res.statusCode);
                
                try {
                    const result = JSON.parse(data);
                    console.log('👤 用户信息:', result);
                    resolve({ success: res.statusCode === 200, result });
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

// 主测试流程
async function runTests() {
    try {
        console.log('1️⃣ 测试登录...');
        const loginResult = await testLogin();
        
        if (!loginResult.success) {
            console.log('❌ 登录失败:', loginResult.error);
            return;
        }
        
        console.log('✅ 登录成功!\n');
        
        if (!loginResult.authToken) {
            console.log('❌ 未获取到认证令牌');
            return;
        }
        
        console.log('2️⃣ 测试认证检查...');
        const authResult = await testAuthCheck(loginResult.authToken);
        
        if (authResult.success) {
            console.log('✅ 认证检查成功!');
            console.log('🎉 所有测试通过，认证系统工作正常');
        } else {
            console.log('❌ 认证检查失败');
            console.log('🔧 建议检查cookie设置和JWT配置');
        }
        
    } catch (error) {
        console.error('💥 测试过程中出现错误:', error);
    }
}

// 运行测试
runTests();
