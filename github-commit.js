#!/usr/bin/env node

/**
 * 🚀 GitHub API 提交工具
 * 用于通过GitHub API提交代码更改
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// GitHub配置
const GITHUB_CONFIG = {
    owner: 'tianyiswl',
    repo: 'diamond-website-2025',
    branch: 'master',
    // 注意：实际使用时需要设置GitHub Personal Access Token
    // token: 'your_github_token_here'
};

// 需要提交的文件列表
const FILES_TO_COMMIT = [
    {
        path: 'server.js',
        description: 'JWT时区验证和Cookie优化'
    },
    {
        path: 'admin/admin.js',
        description: '前端认证检查优化'
    },
    {
        path: 'admin/login.html',
        description: '登录验证逻辑增强'
    },
    {
        path: 'fix-overseas-login.js',
        description: '综合诊断工具'
    },
    {
        path: 'test-overseas-login.js',
        description: '登录功能测试脚本'
    },
    {
        path: 'OVERSEAS-LOGIN-FIX.md',
        description: '详细部署和故障排查指南'
    }
];

// 提交信息
const COMMIT_MESSAGE = `🌍 修复国外服务器登录问题 - v1.1.0

🔍 问题描述:
- 修复在国外服务器部署时登录后立即被弹出的问题
- 解决JWT时区验证、Cookie兼容性、前端竞态条件问题

🛠️ 主要修复:
- JWT时间容差从5分钟扩展到30分钟，支持大时区差异
- 优化Cookie设置，动态适应国外服务器环境
- 增强前端认证检查，添加环境检测和递增重试
- 新增综合诊断工具和测试脚本

📁 修改文件:
- server.js: JWT和Cookie优化
- admin/admin.js: 前端认证优化
- admin/login.html: 登录验证增强
- 新增: fix-overseas-login.js (诊断工具)
- 新增: test-overseas-login.js (测试脚本)
- 新增: OVERSEAS-LOGIN-FIX.md (部署指南)

🎯 预期效果:
- 国外服务器登录成功率 > 95%
- 支持全球各时区部署
- 完整的故障排查工具链

版本: v1.1.0
日期: 2025-07-15
测试: 本地验证通过，JWT验证正常`;

console.log('🚀 GitHub API 提交工具');
console.log('====================');

console.log('\n📋 准备提交的文件:');
FILES_TO_COMMIT.forEach((file, index) => {
    const exists = fs.existsSync(file.path);
    console.log(`${index + 1}. ${file.path} - ${exists ? '✅' : '❌'} ${file.description}`);
});

console.log('\n📝 提交信息:');
console.log(COMMIT_MESSAGE);

console.log('\n⚠️  注意事项:');
console.log('1. 此脚本需要GitHub Personal Access Token才能工作');
console.log('2. 建议使用GitHub Desktop或VS Code进行提交');
console.log('3. 或者通过GitHub网页界面手动上传文件');

console.log('\n💡 推荐的提交方式:');
console.log('1. GitHub Desktop: https://desktop.github.com/');
console.log('2. VS Code内置Git功能');
console.log('3. GitHub网页界面上传');

console.log('\n🔗 仓库地址:');
console.log('https://github.com/tianyiswl/diamond-website-2025');

// 检查文件是否存在
function checkFiles() {
    console.log('\n🔍 文件检查结果:');
    let allFilesExist = true;
    
    FILES_TO_COMMIT.forEach(file => {
        const exists = fs.existsSync(file.path);
        if (!exists) {
            allFilesExist = false;
            console.log(`❌ 文件不存在: ${file.path}`);
        } else {
            const stats = fs.statSync(file.path);
            console.log(`✅ ${file.path} (${Math.round(stats.size / 1024)}KB)`);
        }
    });
    
    return allFilesExist;
}

// 生成文件清单
function generateFileManifest() {
    console.log('\n📦 生成文件清单...');
    
    const manifest = {
        timestamp: new Date().toISOString(),
        commit_message: COMMIT_MESSAGE,
        files: []
    };
    
    FILES_TO_COMMIT.forEach(file => {
        if (fs.existsSync(file.path)) {
            const stats = fs.statSync(file.path);
            manifest.files.push({
                path: file.path,
                description: file.description,
                size: stats.size,
                modified: stats.mtime.toISOString()
            });
        }
    });
    
    fs.writeFileSync('commit-manifest.json', JSON.stringify(manifest, null, 2));
    console.log('✅ 文件清单已保存到: commit-manifest.json');
    
    return manifest;
}

// 主函数
function main() {
    try {
        const filesExist = checkFiles();
        
        if (filesExist) {
            const manifest = generateFileManifest();
            console.log(`\n✅ 准备完成！共 ${manifest.files.length} 个文件待提交`);
        } else {
            console.log('\n❌ 部分文件不存在，请检查文件路径');
        }
        
        console.log('\n🎯 下一步操作:');
        console.log('1. 使用GitHub Desktop添加本地仓库');
        console.log('2. 查看所有更改的文件');
        console.log('3. 输入提交信息（可复制上面的COMMIT_MESSAGE）');
        console.log('4. 提交并推送到远程仓库');
        
    } catch (error) {
        console.error('💥 执行过程中出现错误:', error.message);
    }
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = {
    GITHUB_CONFIG,
    FILES_TO_COMMIT,
    COMMIT_MESSAGE,
    checkFiles,
    generateFileManifest
};
