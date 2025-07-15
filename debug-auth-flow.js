const http = require('http');
const https = require('https');
const querystring = require('querystring');

console.log('🔍 开始全面认证流程诊断...\n');

// 配置
const BASE_URL = 'http://localhost:3000';
const LOGIN_DATA = {
    username: 'admin',
    password: 'admin123'
};

// 存储cookies
let cookies = '';

function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const protocol = options.protocol === 'https:' ? https : http;
        
        const req = protocol.request(options, (res) => {
            let data = '';
            
            // 收集Set-Cookie头
            if (res.headers['set-cookie']) {
                console.log('📥 收到Set-Cookie:', res.headers['set-cookie']);
                cookies = res.headers['set-cookie'].join('; ');
            }
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data,
                    cookies: cookies
                });
            });
        });
        
        req.on('error', (err) => {
            reject(err);
        });
        
        if (postData) {
            req.write(postData);
        }
        
        req.end();
    });
}

async function testAuthFlow() {
    try {
        console.log('1️⃣ 测试登录API...');
        
        const loginOptions = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };
        
        const loginResponse = await makeRequest(loginOptions, JSON.stringify(LOGIN_DATA));
        console.log('📡 登录响应状态:', loginResponse.statusCode);
        console.log('📡 登录响应头:', JSON.stringify(loginResponse.headers, null, 2));
        console.log('📡 登录响应体:', loginResponse.data);
        console.log('🍪 当前Cookies:', cookies);
        
        if (loginResponse.statusCode !== 200) {
            console.log('❌ 登录失败，停止测试');
            return;
        }
        
        console.log('\n2️⃣ 立即测试认证检查...');
        
        const checkOptions = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/check',
            method: 'GET',
            headers: {
                'Cookie': cookies,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };
        
        const checkResponse = await makeRequest(checkOptions);
        console.log('📡 认证检查状态:', checkResponse.statusCode);
        console.log('📡 认证检查响应:', checkResponse.data);
        
        console.log('\n3️⃣ 等待5秒后再次检查...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const checkResponse2 = await makeRequest(checkOptions);
        console.log('📡 5秒后认证状态:', checkResponse2.statusCode);
        console.log('📡 5秒后认证响应:', checkResponse2.data);
        
        console.log('\n4️⃣ 等待10秒后再次检查...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const checkResponse3 = await makeRequest(checkOptions);
        console.log('📡 10秒后认证状态:', checkResponse3.statusCode);
        console.log('📡 10秒后认证响应:', checkResponse3.data);
        
        console.log('\n5️⃣ 测试管理后台访问...');
        
        const adminOptions = {
            hostname: 'localhost',
            port: 3000,
            path: '/admin',
            method: 'GET',
            headers: {
                'Cookie': cookies,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };
        
        const adminResponse = await makeRequest(adminOptions);
        console.log('📡 管理后台访问状态:', adminResponse.statusCode);
        console.log('📡 管理后台重定向:', adminResponse.headers.location || '无重定向');
        
    } catch (error) {
        console.error('❌ 测试过程中出错:', error.message);
    }
}

// 运行测试
testAuthFlow();
