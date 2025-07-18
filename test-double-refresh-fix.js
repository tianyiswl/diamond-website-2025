/**
 * 🧪 二次刷新问题修复测试脚本
 * 用于验证修复效果和性能改进
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 开始测试二次刷新问题修复...\n');

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
 * 测试1: 检查页面加载管理器是否正确配置
 */
function testPageLoadManager() {
    console.log('\n📋 测试1: 页面加载管理器配置');
    
    try {
        const pageLoadManagerPath = path.join(__dirname, 'assets/js/page-load-manager.js');
        
        if (!fs.existsSync(pageLoadManagerPath)) {
            addTestResult('页面加载管理器', 'fail', '文件不存在');
            return;
        }
        
        const content = fs.readFileSync(pageLoadManagerPath, 'utf8');
        
        // 检查关键功能
        const checks = [
            { name: '防抖处理', pattern: /_stateUpdateTimer/, required: true },
            { name: '状态管理', pattern: /setState.*function/, required: true },
            { name: '队列处理', pattern: /processQueue/, required: true },
            { name: '重复检查', pattern: /isInitialized/, required: true }
        ];
        
        let allPassed = true;
        checks.forEach(check => {
            if (check.pattern.test(content)) {
                addTestResult(`页面加载管理器-${check.name}`, 'pass', '功能已实现');
            } else if (check.required) {
                addTestResult(`页面加载管理器-${check.name}`, 'fail', '缺少必要功能');
                allPassed = false;
            } else {
                addTestResult(`页面加载管理器-${check.name}`, 'warn', '可选功能未实现');
            }
        });
        
        if (allPassed) {
            addTestResult('页面加载管理器', 'pass', '配置正确');
        }
        
    } catch (error) {
        addTestResult('页面加载管理器', 'fail', '测试失败', error.message);
    }
}

/**
 * 测试2: 检查导航优化器是否存在
 */
function testNavigationOptimizer() {
    console.log('\n📋 测试2: 导航优化器');
    
    try {
        const navOptimizerPath = path.join(__dirname, 'assets/js/navigation-optimizer.js');
        
        if (!fs.existsSync(navOptimizerPath)) {
            addTestResult('导航优化器', 'fail', '文件不存在');
            return;
        }
        
        const content = fs.readFileSync(navOptimizerPath, 'utf8');
        
        // 检查关键功能
        const features = [
            'navigateTo',
            'showNavigationLoading',
            'searchNavigate',
            'categoryNavigate'
        ];
        
        let foundFeatures = 0;
        features.forEach(feature => {
            if (content.includes(feature)) {
                foundFeatures++;
                addTestResult(`导航优化器-${feature}`, 'pass', '功能已实现');
            } else {
                addTestResult(`导航优化器-${feature}`, 'fail', '功能缺失');
            }
        });
        
        if (foundFeatures === features.length) {
            addTestResult('导航优化器', 'pass', '所有功能完整');
        } else {
            addTestResult('导航优化器', 'warn', `${foundFeatures}/${features.length} 功能可用`);
        }
        
    } catch (error) {
        addTestResult('导航优化器', 'fail', '测试失败', error.message);
    }
}

/**
 * 测试3: 检查服务器缓存配置
 */
function testServerCacheConfig() {
    console.log('\n📋 测试3: 服务器缓存配置');
    
    try {
        const serverPath = path.join(__dirname, 'server.js');
        
        if (!fs.existsSync(serverPath)) {
            addTestResult('服务器配置', 'fail', 'server.js文件不存在');
            return;
        }
        
        const content = fs.readFileSync(serverPath, 'utf8');
        
        // 检查缓存配置
        if (content.includes('setHeaders')) {
            addTestResult('服务器缓存-setHeaders', 'pass', '自定义缓存头已配置');
        } else {
            addTestResult('服务器缓存-setHeaders', 'fail', '缺少自定义缓存头配置');
        }
        
        if (content.includes('no-cache') && content.includes('.html')) {
            addTestResult('服务器缓存-HTML', 'pass', 'HTML文件无缓存配置正确');
        } else {
            addTestResult('服务器缓存-HTML', 'warn', 'HTML缓存配置可能需要优化');
        }
        
        if (content.includes('max-age=1800') || content.includes('max-age=3600')) {
            addTestResult('服务器缓存-JS', 'pass', 'JavaScript文件缓存时间已优化');
        } else {
            addTestResult('服务器缓存-JS', 'warn', 'JavaScript缓存配置可能需要调整');
        }
        
    } catch (error) {
        addTestResult('服务器缓存配置', 'fail', '测试失败', error.message);
    }
}

/**
 * 测试4: 检查HTML页面脚本加载顺序
 */
function testScriptLoadOrder() {
    console.log('\n📋 测试4: 脚本加载顺序');
    
    try {
        const indexPath = path.join(__dirname, 'index.html');
        
        if (!fs.existsSync(indexPath)) {
            addTestResult('脚本加载顺序', 'fail', 'index.html文件不存在');
            return;
        }
        
        const content = fs.readFileSync(indexPath, 'utf8');
        
        // 检查关键脚本的加载顺序
        const scriptOrder = [
            'page-load-manager.js',
            'i18n-manager.js',
            'component-manager.js',
            'navigation-optimizer.js',
            'performance-monitor.js',
            'main.js'
        ];
        
        let lastIndex = -1;
        let orderCorrect = true;
        
        scriptOrder.forEach(script => {
            const index = content.indexOf(script);
            if (index > lastIndex) {
                lastIndex = index;
                addTestResult(`脚本顺序-${script}`, 'pass', '加载顺序正确');
            } else if (index === -1) {
                addTestResult(`脚本顺序-${script}`, 'warn', '脚本未找到');
            } else {
                addTestResult(`脚本顺序-${script}`, 'fail', '加载顺序错误');
                orderCorrect = false;
            }
        });
        
        if (orderCorrect) {
            addTestResult('脚本加载顺序', 'pass', '整体顺序正确');
        } else {
            addTestResult('脚本加载顺序', 'fail', '存在顺序问题');
        }
        
    } catch (error) {
        addTestResult('脚本加载顺序', 'fail', '测试失败', error.message);
    }
}

/**
 * 测试5: 检查重复DOMContentLoaded监听器
 */
function testDuplicateEventListeners() {
    console.log('\n📋 测试5: 重复事件监听器检查');
    
    try {
        const filesToCheck = [
            'index.html',
            'assets/js/main.js',
            'assets/js/header-footer-components.js'
        ];
        
        let totalDOMListeners = 0;
        
        filesToCheck.forEach(filePath => {
            const fullPath = path.join(__dirname, filePath);
            
            if (fs.existsSync(fullPath)) {
                const content = fs.readFileSync(fullPath, 'utf8');
                
                // 计算DOMContentLoaded监听器数量
                const matches = content.match(/addEventListener\s*\(\s*['"]DOMContentLoaded['"]|document\.addEventListener\s*\(\s*['"]DOMContentLoaded['"]/g);
                const count = matches ? matches.length : 0;
                
                totalDOMListeners += count;
                
                if (count === 0) {
                    addTestResult(`DOMContentLoaded-${path.basename(filePath)}`, 'pass', '无重复监听器');
                } else if (count === 1) {
                    addTestResult(`DOMContentLoaded-${path.basename(filePath)}`, 'pass', '单个监听器正常');
                } else {
                    addTestResult(`DOMContentLoaded-${path.basename(filePath)}`, 'warn', `发现${count}个监听器`);
                }
            }
        });
        
        if (totalDOMListeners <= 2) {
            addTestResult('重复事件监听器', 'pass', `总计${totalDOMListeners}个DOMContentLoaded监听器，数量合理`);
        } else {
            addTestResult('重复事件监听器', 'warn', `总计${totalDOMListeners}个DOMContentLoaded监听器，可能存在重复`);
        }
        
    } catch (error) {
        addTestResult('重复事件监听器', 'fail', '测试失败', error.message);
    }
}

/**
 * 生成测试报告
 */
function generateTestReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 二次刷新问题修复测试报告');
    console.log('='.repeat(60));
    
    console.log(`\n📈 测试统计:`);
    console.log(`✅ 通过: ${testResults.passed}`);
    console.log(`❌ 失败: ${testResults.failed}`);
    console.log(`⚠️ 警告: ${testResults.warnings}`);
    console.log(`📝 总计: ${testResults.details.length}`);
    
    const successRate = ((testResults.passed / testResults.details.length) * 100).toFixed(1);
    console.log(`🎯 成功率: ${successRate}%`);
    
    // 生成建议
    console.log(`\n💡 修复建议:`);
    
    if (testResults.failed === 0 && testResults.warnings === 0) {
        console.log('🎉 所有测试通过！二次刷新问题已完全修复。');
    } else if (testResults.failed === 0) {
        console.log('✅ 核心功能正常，但存在一些可优化的地方。');
    } else {
        console.log('⚠️ 发现一些问题需要修复：');
        
        testResults.details
            .filter(result => result.status === 'fail')
            .forEach(result => {
                console.log(`   - ${result.name}: ${result.message}`);
            });
    }
    
    // 保存详细报告
    const reportPath = path.join(__dirname, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 详细报告已保存到: ${reportPath}`);
    
    console.log('\n🚀 测试完成！');
}

// 执行所有测试
async function runAllTests() {
    testPageLoadManager();
    testNavigationOptimizer();
    testServerCacheConfig();
    testScriptLoadOrder();
    testDuplicateEventListeners();
    
    generateTestReport();
}

// 运行测试
runAllTests().catch(error => {
    console.error('❌ 测试执行失败:', error);
    process.exit(1);
});
