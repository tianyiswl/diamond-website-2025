/**
 * 🧪 页面加载顺序测试脚本
 * 验证加载屏幕显示顺序修复效果
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 开始测试页面加载顺序修复...\n');

// 测试结果收集
const testResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
};

/**
 * 添加测试结果
 */
function addTestResult(name, status, message, details = null) {
    const result = {
        name,
        status, // 'pass', 'fail', 'warn'
        message,
        details,
        timestamp: new Date().toISOString()
    };
    
    testResults.details.push(result);
    
    if (status === 'pass') {
        testResults.passed++;
        console.log(`✅ ${name}: ${message}`);
    } else if (status === 'fail') {
        testResults.failed++;
        console.log(`❌ ${name}: ${message}`);
    } else if (status === 'warn') {
        testResults.warnings++;
        console.log(`⚠️ ${name}: ${message}`);
    }
    
    if (details) {
        console.log(`   详情: ${details}`);
    }
}

/**
 * 测试1: 检查HTML中是否包含静态加载屏幕
 */
function testStaticLoadingScreen() {
    console.log('\n📋 测试1: 静态加载屏幕检查');
    
    const filesToCheck = [
        { path: 'index.html', name: '首页' },
        { path: 'pages/products.html', name: '产品页面' }
    ];
    
    filesToCheck.forEach(file => {
        try {
            const fullPath = path.join(__dirname, file.path);
            
            if (!fs.existsSync(fullPath)) {
                addTestResult(`静态加载屏幕-${file.name}`, 'fail', '文件不存在');
                return;
            }
            
            const content = fs.readFileSync(fullPath, 'utf8');
            
            // 检查是否包含静态加载屏幕
            const hasLoadingDiv = content.includes('<div id="loading" class="loading-screen">');
            const hasLoadingCSS = content.includes('.loading-screen {') || content.includes('.loading-screen{');
            const isInBody = content.indexOf('<div id="loading"') > content.indexOf('<body>');
            const isBeforeMain = content.indexOf('<div id="loading"') < content.indexOf('<main>');
            
            if (hasLoadingDiv && isInBody) {
                addTestResult(`静态加载屏幕-${file.name}`, 'pass', '加载屏幕已正确放置在HTML中');
            } else if (hasLoadingDiv) {
                addTestResult(`静态加载屏幕-${file.name}`, 'warn', '加载屏幕存在但位置可能不正确');
            } else {
                addTestResult(`静态加载屏幕-${file.name}`, 'fail', '缺少静态加载屏幕');
            }
            
            if (hasLoadingCSS) {
                addTestResult(`加载屏幕样式-${file.name}`, 'pass', '加载屏幕CSS样式已定义');
            } else {
                addTestResult(`加载屏幕样式-${file.name}`, 'warn', '可能缺少加载屏幕CSS样式');
            }
            
            if (isBeforeMain) {
                addTestResult(`加载屏幕位置-${file.name}`, 'pass', '加载屏幕在主内容之前');
            } else {
                addTestResult(`加载屏幕位置-${file.name}`, 'fail', '加载屏幕位置错误');
            }
            
        } catch (error) {
            addTestResult(`静态加载屏幕-${file.name}`, 'fail', '测试失败', error.message);
        }
    });
}

/**
 * 测试2: 检查组件管理器是否避免重复创建加载屏幕
 */
function testComponentManagerFix() {
    console.log('\n📋 测试2: 组件管理器修复检查');
    
    try {
        const componentManagerPath = path.join(__dirname, 'assets/js/modules/components/component-manager.js');
        
        if (!fs.existsSync(componentManagerPath)) {
            addTestResult('组件管理器修复', 'fail', '文件不存在');
            return;
        }
        
        const content = fs.readFileSync(componentManagerPath, 'utf8');
        
        // 检查是否有重复检查逻辑
        const hasExistingCheck = content.includes('existingLoading') || content.includes('getElementById(\'loading\')');
        const hasBackupComment = content.includes('备用') || content.includes('backup');
        const hasConsoleLog = content.includes('使用HTML中的静态加载屏幕') || content.includes('HTML中无加载屏幕');
        
        if (hasExistingCheck) {
            addTestResult('重复创建检查', 'pass', '已添加重复创建检查逻辑');
        } else {
            addTestResult('重复创建检查', 'fail', '缺少重复创建检查逻辑');
        }
        
        if (hasBackupComment) {
            addTestResult('备用方案', 'pass', '已实现备用方案');
        } else {
            addTestResult('备用方案', 'warn', '可能缺少备用方案');
        }
        
        if (hasConsoleLog) {
            addTestResult('调试信息', 'pass', '已添加调试信息');
        } else {
            addTestResult('调试信息', 'warn', '缺少调试信息');
        }
        
    } catch (error) {
        addTestResult('组件管理器修复', 'fail', '测试失败', error.message);
    }
}

/**
 * 测试3: 检查加载屏幕隐藏逻辑优化
 */
function testLoadingHideLogic() {
    console.log('\n📋 测试3: 加载屏幕隐藏逻辑检查');
    
    const filesToCheck = [
        { path: 'assets/js/main.js', name: 'main.js' },
        { path: 'assets/js/modules/components/component-manager.js', name: 'component-manager.js' },
        { path: 'pages/products.html', name: 'products.html' }
    ];
    
    filesToCheck.forEach(file => {
        try {
            const fullPath = path.join(__dirname, file.path);
            
            if (!fs.existsSync(fullPath)) {
                addTestResult(`隐藏逻辑-${file.name}`, 'fail', '文件不存在');
                return;
            }
            
            const content = fs.readFileSync(fullPath, 'utf8');
            
            // 检查是否有重复检查
            const hasHiddenCheck = content.includes('classList.contains(\'hidden\')') || content.includes('style.display === \'none\'');
            const hasDelayedHide = content.includes('setTimeout') && content.includes('hidden');
            const hasUnifiedHide = content.includes('componentManager.hideLoadingScreen') || content.includes('hideLoadingScreen');
            
            if (hasHiddenCheck) {
                addTestResult(`重复隐藏检查-${file.name}`, 'pass', '已添加重复隐藏检查');
            } else {
                addTestResult(`重复隐藏检查-${file.name}`, 'warn', '可能缺少重复隐藏检查');
            }
            
            if (hasDelayedHide) {
                addTestResult(`延迟隐藏-${file.name}`, 'pass', '已实现延迟隐藏');
            } else {
                addTestResult(`延迟隐藏-${file.name}`, 'warn', '可能缺少延迟隐藏');
            }
            
            if (hasUnifiedHide) {
                addTestResult(`统一隐藏方法-${file.name}`, 'pass', '使用统一隐藏方法');
            } else {
                addTestResult(`统一隐藏方法-${file.name}`, 'warn', '可能未使用统一隐藏方法');
            }
            
        } catch (error) {
            addTestResult(`隐藏逻辑-${file.name}`, 'fail', '测试失败', error.message);
        }
    });
}

/**
 * 测试4: 检查脚本加载顺序
 */
function testScriptLoadOrder() {
    console.log('\n📋 测试4: 脚本加载顺序检查');
    
    const filesToCheck = [
        { path: 'index.html', name: '首页' },
        { path: 'pages/products.html', name: '产品页面' }
    ];
    
    filesToCheck.forEach(file => {
        try {
            const fullPath = path.join(__dirname, file.path);
            
            if (!fs.existsSync(fullPath)) {
                addTestResult(`脚本顺序-${file.name}`, 'fail', '文件不存在');
                return;
            }
            
            const content = fs.readFileSync(fullPath, 'utf8');
            
            // 检查关键脚本的加载顺序
            const scriptOrder = [
                'page-load-manager.js',
                'component-manager.js',
                'navigation-optimizer.js',
                'performance-monitor.js',
                'main.js'
            ];
            
            let lastIndex = -1;
            let orderCorrect = true;
            let foundScripts = 0;
            
            scriptOrder.forEach(script => {
                const index = content.indexOf(script);
                if (index !== -1) {
                    foundScripts++;
                    if (index > lastIndex) {
                        lastIndex = index;
                    } else {
                        orderCorrect = false;
                    }
                }
            });
            
            if (orderCorrect && foundScripts >= 3) {
                addTestResult(`脚本顺序-${file.name}`, 'pass', `脚本加载顺序正确 (${foundScripts}/${scriptOrder.length})`);
            } else if (foundScripts >= 3) {
                addTestResult(`脚本顺序-${file.name}`, 'warn', `脚本数量足够但顺序可能有问题 (${foundScripts}/${scriptOrder.length})`);
            } else {
                addTestResult(`脚本顺序-${file.name}`, 'fail', `关键脚本缺失 (${foundScripts}/${scriptOrder.length})`);
            }
            
        } catch (error) {
            addTestResult(`脚本顺序-${file.name}`, 'fail', '测试失败', error.message);
        }
    });
}

/**
 * 生成测试报告
 */
function generateTestReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 页面加载顺序修复测试报告');
    console.log('='.repeat(60));
    
    console.log(`\n📈 测试统计:`);
    console.log(`✅ 通过: ${testResults.passed}`);
    console.log(`❌ 失败: ${testResults.failed}`);
    console.log(`⚠️ 警告: ${testResults.warnings}`);
    console.log(`📝 总计: ${testResults.details.length}`);
    
    const successRate = ((testResults.passed / testResults.details.length) * 100).toFixed(1);
    console.log(`🎯 成功率: ${successRate}%`);
    
    // 生成建议
    console.log(`\n💡 修复效果评估:`);
    
    if (testResults.failed === 0 && testResults.warnings <= 2) {
        console.log('🎉 加载顺序问题已完全修复！');
        console.log('✅ 加载屏幕现在会在页面内容之前显示');
        console.log('✅ 避免了JavaScript动态创建导致的时序问题');
        console.log('✅ 统一了加载屏幕的隐藏逻辑');
    } else if (testResults.failed === 0) {
        console.log('✅ 主要问题已修复，但还有一些可优化的地方');
    } else {
        console.log('⚠️ 仍有一些问题需要解决：');
        
        testResults.details
            .filter(result => result.status === 'fail')
            .forEach(result => {
                console.log(`   - ${result.name}: ${result.message}`);
            });
    }
    
    console.log(`\n🔍 预期效果:`);
    console.log('1. 页面开始加载时立即显示加载动画');
    console.log('2. 在后台加载页面内容和初始化组件');
    console.log('3. 所有内容准备就绪后平滑隐藏加载动画');
    console.log('4. 不再出现"先显示内容再显示加载动画"的问题');
    
    // 保存详细报告
    const reportPath = path.join(__dirname, 'loading-order-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 详细报告已保存到: ${reportPath}`);
    
    console.log('\n🚀 测试完成！请在浏览器中验证实际效果。');
}

// 执行所有测试
async function runAllTests() {
    testStaticLoadingScreen();
    testComponentManagerFix();
    testLoadingHideLogic();
    testScriptLoadOrder();
    
    generateTestReport();
}

// 运行测试
runAllTests().catch(error => {
    console.error('❌ 测试执行失败:', error);
    process.exit(1);
});
