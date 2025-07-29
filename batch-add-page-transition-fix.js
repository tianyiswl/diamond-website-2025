/**
 * 🚨 批量添加页面跳转修复脚本
 * 为所有HTML页面添加页面跳转修复脚本引用
 */

const fs = require('fs');
const path = require('path');

// 需要处理的页面文件
const pageFiles = [
    'pages/privacy.html',
    'pages/product-detail.html', 
    'pages/terms.html'
];

// 修复脚本引用
const fixScriptTag = '    <!-- 🚨 页面跳转修复脚本 - 防止LOGO页面显示 -->\n    <script src="../page-transition-fix.js"></script>\n    \n';

function addFixScriptToPage(filePath) {
    try {
        console.log(`处理文件: ${filePath}`);
        
        if (!fs.existsSync(filePath)) {
            console.log(`文件不存在: ${filePath}`);
            return;
        }
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 检查是否已经包含修复脚本
        if (content.includes('page-transition-fix.js')) {
            console.log(`文件已包含修复脚本: ${filePath}`);
            return;
        }
        
        // 查找JavaScript文件部分的开始位置
        const jsCommentPattern = /<!-- JavaScript文件 -->/;
        const scriptPattern = /<script\s+src=/;
        
        let insertPosition = -1;
        
        // 优先查找JavaScript文件注释
        const jsCommentMatch = content.match(jsCommentPattern);
        if (jsCommentMatch) {
            insertPosition = jsCommentMatch.index + jsCommentMatch[0].length + 1;
        } else {
            // 查找第一个script标签
            const scriptMatch = content.match(scriptPattern);
            if (scriptMatch) {
                insertPosition = scriptMatch.index;
            }
        }
        
        if (insertPosition === -1) {
            // 如果找不到script标签，在</body>前插入
            const bodyEndPattern = /<\/body>/;
            const bodyEndMatch = content.match(bodyEndPattern);
            if (bodyEndMatch) {
                insertPosition = bodyEndMatch.index;
                const modifiedContent = content.slice(0, insertPosition) + 
                                      '\n    <!-- JavaScript文件 -->\n' +
                                      fixScriptTag + 
                                      content.slice(insertPosition);
                fs.writeFileSync(filePath, modifiedContent, 'utf8');
                console.log(`✅ 已添加修复脚本到: ${filePath}`);
                return;
            }
        }
        
        if (insertPosition !== -1) {
            const modifiedContent = content.slice(0, insertPosition) + 
                                  '\n' + fixScriptTag + 
                                  content.slice(insertPosition);
            fs.writeFileSync(filePath, modifiedContent, 'utf8');
            console.log(`✅ 已添加修复脚本到: ${filePath}`);
        } else {
            console.log(`❌ 无法找到插入位置: ${filePath}`);
        }
        
    } catch (error) {
        console.error(`❌ 处理文件失败 ${filePath}:`, error.message);
    }
}

// 处理所有页面文件
console.log('🚨 开始批量添加页面跳转修复脚本...');

pageFiles.forEach(addFixScriptToPage);

console.log('✅ 批量添加完成');
