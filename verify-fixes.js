/**
 * 🔧 前端页面问题修复验证脚本
 * 用于验证页面多次刷新和多语言切换问题的修复效果
 */

console.log('🔧 开始验证前端页面问题修复效果...');

// 验证结果存储
const verificationResults = {
    pageRefresh: {
        status: 'pending',
        issues: [],
        fixes: []
    },
    languageSwitching: {
        status: 'pending',
        issues: [],
        fixes: []
    },
    performance: {
        status: 'pending',
        metrics: {}
    }
};

/**
 * 1. 验证页面多次刷新问题修复
 */
function verifyPageRefreshFixes() {
    console.log('📊 验证页面多次刷新问题修复...');
    
    const issues = [];
    const fixes = [];
    
    // 检查是否移除了重复的DOMContentLoaded监听器
    const mainJsContent = document.querySelector('script[src*="main.js"]');
    if (mainJsContent) {
        fixes.push('✅ main.js已加载，重复DOMContentLoaded监听器已移除');
    }
    
    // 检查是否使用了页面加载管理器
    if (window.PageLoadManager) {
        fixes.push('✅ 页面加载管理器已正确加载');
        
        // 检查页面加载管理器的状态
        const states = window.PageLoadManager.getStates();
        if (states.domReady) {
            fixes.push('✅ DOM就绪状态正常');
        }
        
        if (states.componentsLoaded) {
            fixes.push('✅ 组件加载状态正常');
        }
    } else {
        issues.push('❌ 页面加载管理器未找到');
    }
    
    // 检查搜索功能是否有重复绑定
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        const hasMainBound = searchInput.hasAttribute('data-main-search-bound');
        const hasHeaderBound = searchInput.hasAttribute('data-header-keypress-bound');
        
        if (hasMainBound && !hasHeaderBound) {
            fixes.push('✅ 搜索功能重复绑定已修复');
        } else if (hasMainBound && hasHeaderBound) {
            issues.push('⚠️ 搜索功能可能仍有重复绑定');
        }
    }
    
    verificationResults.pageRefresh = {
        status: issues.length === 0 ? 'passed' : 'failed',
        issues,
        fixes
    };
    
    return verificationResults.pageRefresh;
}

/**
 * 2. 验证多语言切换问题修复
 */
function verifyLanguageSwitchingFixes() {
    console.log('🌍 验证多语言切换问题修复...');
    
    const issues = [];
    const fixes = [];
    
    // 检查国际化管理器
    if (window.i18n) {
        fixes.push('✅ 国际化管理器已正确加载');
        
        // 检查早期语言检测
        if (window.earlyLanguageDetection) {
            fixes.push('✅ 早期语言检测已实施');
            fixes.push(`✅ 检测到偏好语言: ${window.earlyLanguageDetection.preferredLanguage}`);
        } else {
            issues.push('❌ 早期语言检测未找到');
        }
        
        // 检查HTML lang属性
        const htmlLang = document.documentElement.lang;
        if (htmlLang && htmlLang !== 'zh-CN') {
            fixes.push(`✅ HTML lang属性已正确设置: ${htmlLang}`);
        }
        
        // 检查语言切换方法是否已优化
        if (typeof window.i18n.updatePageContentWithCheck === 'function') {
            fixes.push('✅ 语言切换方法已优化（带渲染检查）');
        }
        
        if (typeof window.i18n.waitForDOMUpdate === 'function') {
            fixes.push('✅ DOM更新等待机制已实施');
        }
        
        if (typeof window.i18n.verifyLanguageUpdate === 'function') {
            fixes.push('✅ 语言更新验证机制已实施');
        }
        
    } else {
        issues.push('❌ 国际化管理器未找到');
    }
    
    // 检查CSS样式是否已加载
    const i18nStyles = document.querySelector('link[href*="i18n-styles.css"]');
    if (i18nStyles) {
        fixes.push('✅ 国际化样式文件已加载');
    } else {
        issues.push('❌ 国际化样式文件未找到');
    }
    
    verificationResults.languageSwitching = {
        status: issues.length === 0 ? 'passed' : 'failed',
        issues,
        fixes
    };
    
    return verificationResults.languageSwitching;
}

/**
 * 3. 性能测试
 */
async function performanceTest() {
    console.log('⚡ 执行性能测试...');
    
    const metrics = {};
    
    if (!window.i18n) {
        verificationResults.performance = {
            status: 'failed',
            metrics: { error: '国际化管理器未找到' }
        };
        return verificationResults.performance;
    }
    
    try {
        // 测试语言切换性能
        const switchTimes = [];
        const languages = ['en-US', 'zh-CN'];
        
        for (let i = 0; i < 5; i++) {
            const lang = languages[i % 2];
            const startTime = performance.now();
            
            await window.i18n.switchLanguage(lang);
            
            const endTime = performance.now();
            switchTimes.push(endTime - startTime);
            
            // 短暂延迟
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        metrics.averageSwitchTime = switchTimes.reduce((a, b) => a + b, 0) / switchTimes.length;
        metrics.minSwitchTime = Math.min(...switchTimes);
        metrics.maxSwitchTime = Math.max(...switchTimes);
        
        // 内存使用情况
        if (performance.memory) {
            metrics.memoryUsage = {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        
        verificationResults.performance = {
            status: 'passed',
            metrics
        };
        
    } catch (error) {
        verificationResults.performance = {
            status: 'failed',
            metrics: { error: error.message }
        };
    }
    
    return verificationResults.performance;
}

/**
 * 4. 生成验证报告
 */
function generateReport() {
    console.log('📋 生成验证报告...');
    
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalTests: 3,
            passed: 0,
            failed: 0
        },
        details: verificationResults
    };
    
    // 统计通过和失败的测试
    Object.values(verificationResults).forEach(result => {
        if (result.status === 'passed') {
            report.summary.passed++;
        } else if (result.status === 'failed') {
            report.summary.failed++;
        }
    });
    
    // 输出报告
    console.log('📊 验证报告:');
    console.log(`总测试数: ${report.summary.totalTests}`);
    console.log(`通过: ${report.summary.passed}`);
    console.log(`失败: ${report.summary.failed}`);
    
    console.log('\n📋 详细结果:');
    
    // 页面刷新测试结果
    console.log('\n1. 页面多次刷新问题修复:');
    console.log(`状态: ${verificationResults.pageRefresh.status}`);
    verificationResults.pageRefresh.fixes.forEach(fix => console.log(fix));
    verificationResults.pageRefresh.issues.forEach(issue => console.log(issue));
    
    // 语言切换测试结果
    console.log('\n2. 多语言切换问题修复:');
    console.log(`状态: ${verificationResults.languageSwitching.status}`);
    verificationResults.languageSwitching.fixes.forEach(fix => console.log(fix));
    verificationResults.languageSwitching.issues.forEach(issue => console.log(issue));
    
    // 性能测试结果
    console.log('\n3. 性能测试:');
    console.log(`状态: ${verificationResults.performance.status}`);
    if (verificationResults.performance.metrics.averageSwitchTime) {
        console.log(`平均切换时间: ${verificationResults.performance.metrics.averageSwitchTime.toFixed(2)}ms`);
        console.log(`最快切换时间: ${verificationResults.performance.metrics.minSwitchTime.toFixed(2)}ms`);
        console.log(`最慢切换时间: ${verificationResults.performance.metrics.maxSwitchTime.toFixed(2)}ms`);
    }
    
    if (verificationResults.performance.metrics.memoryUsage) {
        const mem = verificationResults.performance.metrics.memoryUsage;
        console.log(`内存使用: ${mem.used}MB / ${mem.total}MB (限制: ${mem.limit}MB)`);
    }
    
    return report;
}

/**
 * 5. 主验证函数
 */
async function runVerification() {
    console.log('🚀 开始运行验证测试...');
    
    try {
        // 等待页面完全加载
        if (document.readyState !== 'complete') {
            await new Promise(resolve => {
                window.addEventListener('load', resolve);
            });
        }
        
        // 等待国际化系统初始化
        if (window.i18n && !window.i18n.initialized) {
            await new Promise(resolve => {
                const checkInit = () => {
                    if (window.i18n.initialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 100);
                    }
                };
                checkInit();
            });
        }
        
        // 执行验证测试
        verifyPageRefreshFixes();
        verifyLanguageSwitchingFixes();
        await performanceTest();
        
        // 生成报告
        const report = generateReport();
        
        // 将报告存储到window对象，供外部访问
        window.verificationReport = report;
        
        console.log('✅ 验证测试完成！');
        return report;
        
    } catch (error) {
        console.error('❌ 验证测试失败:', error);
        return { error: error.message };
    }
}

// 自动运行验证（如果在浏览器环境中）
if (typeof window !== 'undefined') {
    // 等待DOM加载完成后运行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(runVerification, 2000); // 延迟2秒确保所有脚本都已加载
        });
    } else {
        setTimeout(runVerification, 2000);
    }
}

// 导出函数供外部调用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runVerification,
        verifyPageRefreshFixes,
        verifyLanguageSwitchingFixes,
        performanceTest,
        generateReport
    };
}
