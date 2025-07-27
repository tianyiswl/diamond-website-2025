/**
 * 🚀 高级搜索功能修复脚本
 * 基于深度分析的多层次修复方案
 */

(function() {
    'use strict';
    
    console.log('🚀 高级搜索修复脚本开始执行...');
    
    const ADVANCED_FIX = {
        attempts: 0,
        maxAttempts: 5,
        fixInterval: null,
        debugMode: true,
        strategies: []
    };
    
    /**
     * 增强调试日志
     */
    function debugLog(message, level = 'info', data = null) {
        if (!ADVANCED_FIX.debugMode) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${timestamp}] 🚀 高级修复:`;
        
        switch(level) {
            case 'success':
                console.log(`${prefix} ✅ ${message}`, data || '');
                break;
            case 'error':
                console.error(`${prefix} ❌ ${message}`, data || '');
                break;
            case 'warn':
                console.warn(`${prefix} ⚠️ ${message}`, data || '');
                break;
            default:
                console.log(`${prefix} ${message}`, data || '');
        }
    }
    
    /**
     * 策略1: 暴力清理所有事件监听器
     */
    function strategy1_BruteForceCleanup() {
        debugLog('执行策略1: 暴力清理所有事件监听器');
        
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) {
            debugLog('策略1失败: 搜索框不存在', 'error');
            return false;
        }
        
        try {
            // 完全替换元素来清除所有事件监听器
            const newInput = searchInput.cloneNode(true);
            
            // 保存重要属性
            const importantAttrs = {
                id: searchInput.id,
                className: searchInput.className,
                placeholder: searchInput.placeholder,
                type: searchInput.type,
                value: searchInput.value
            };
            
            // 设置属性
            Object.keys(importantAttrs).forEach(attr => {
                if (importantAttrs[attr]) {
                    newInput[attr] = importantAttrs[attr];
                }
            });
            
            // 替换元素
            searchInput.parentNode.replaceChild(newInput, searchInput);
            
            debugLog('策略1成功: 搜索框已完全替换', 'success');
            return true;
            
        } catch (error) {
            debugLog('策略1失败', 'error', error.message);
            return false;
        }
    }
    
    /**
     * 策略2: 直接DOM操作绑定
     */
    function strategy2_DirectDOMBinding() {
        debugLog('执行策略2: 直接DOM操作绑定');
        
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) {
            debugLog('策略2失败: 搜索框不存在', 'error');
            return false;
        }
        
        try {
            // 使用onkeypress属性直接绑定
            searchInput.onkeypress = function(event) {
                debugLog('策略2: 检测到按键', 'info', {
                    key: event.key,
                    keyCode: event.keyCode,
                    which: event.which
                });
                
                if (event.key === 'Enter' || event.keyCode === 13 || event.which === 13) {
                    event.preventDefault();
                    debugLog('策略2: 回车键被捕获，执行搜索', 'success');
                    executeUnifiedSearch('strategy2-enter');
                    return false;
                }
            };
            
            // 同时绑定keydown作为备用
            searchInput.onkeydown = function(event) {
                if (event.key === 'Enter' || event.keyCode === 13 || event.which === 13) {
                    event.preventDefault();
                    debugLog('策略2: keydown回车键被捕获', 'success');
                    executeUnifiedSearch('strategy2-keydown');
                    return false;
                }
            };
            
            debugLog('策略2成功: 直接DOM属性绑定完成', 'success');
            return true;
            
        } catch (error) {
            debugLog('策略2失败', 'error', error.message);
            return false;
        }
    }
    
    /**
     * 策略3: 事件委托到父元素
     */
    function strategy3_EventDelegation() {
        debugLog('执行策略3: 事件委托到父元素');
        
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) {
            debugLog('策略3失败: 搜索框不存在', 'error');
            return false;
        }
        
        try {
            const parentElement = searchInput.parentElement || document.body;
            
            // 在父元素上监听事件
            const delegatedHandler = function(event) {
                if (event.target.id === 'searchInput' && 
                    (event.key === 'Enter' || event.keyCode === 13)) {
                    event.preventDefault();
                    event.stopPropagation();
                    debugLog('策略3: 通过事件委托捕获回车键', 'success');
                    executeUnifiedSearch('strategy3-delegation');
                    return false;
                }
            };
            
            parentElement.addEventListener('keypress', delegatedHandler, true);
            parentElement.addEventListener('keydown', delegatedHandler, true);
            
            debugLog('策略3成功: 事件委托已设置', 'success');
            return true;
            
        } catch (error) {
            debugLog('策略3失败', 'error', error.message);
            return false;
        }
    }
    
    /**
     * 策略4: 全局键盘监听
     */
    function strategy4_GlobalKeyboardListener() {
        debugLog('执行策略4: 全局键盘监听');
        
        try {
            const globalHandler = function(event) {
                const activeElement = document.activeElement;
                
                if (activeElement && activeElement.id === 'searchInput' && 
                    (event.key === 'Enter' || event.keyCode === 13)) {
                    event.preventDefault();
                    event.stopPropagation();
                    debugLog('策略4: 全局监听捕获回车键', 'success');
                    executeUnifiedSearch('strategy4-global');
                    return false;
                }
            };
            
            document.addEventListener('keypress', globalHandler, true);
            document.addEventListener('keydown', globalHandler, true);
            window.addEventListener('keypress', globalHandler, true);
            window.addEventListener('keydown', globalHandler, true);
            
            debugLog('策略4成功: 全局键盘监听已设置', 'success');
            return true;
            
        } catch (error) {
            debugLog('策略4失败', 'error', error.message);
            return false;
        }
    }
    
    /**
     * 策略5: 轮询检测和强制绑定
     */
    function strategy5_PollingAndForceBinding() {
        debugLog('执行策略5: 轮询检测和强制绑定');
        
        let pollCount = 0;
        const maxPolls = 20;
        
        const pollInterval = setInterval(() => {
            pollCount++;
            
            const searchInput = document.getElementById('searchInput');
            if (!searchInput) {
                if (pollCount >= maxPolls) {
                    clearInterval(pollInterval);
                    debugLog('策略5失败: 轮询超时，搜索框未找到', 'error');
                }
                return;
            }
            
            // 强制绑定多种事件
            const forceHandler = function(event) {
                if (event.key === 'Enter' || event.keyCode === 13) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    debugLog('策略5: 强制绑定捕获回车键', 'success');
                    executeUnifiedSearch('strategy5-force');
                    return false;
                }
            };
            
            try {
                // 移除可能的现有监听器
                searchInput.removeEventListener('keypress', forceHandler);
                searchInput.removeEventListener('keydown', forceHandler);
                
                // 重新绑定
                searchInput.addEventListener('keypress', forceHandler, true);
                searchInput.addEventListener('keydown', forceHandler, true);
                
                // 标记已处理
                searchInput.setAttribute('data-advanced-fix-bound', 'true');
                
                clearInterval(pollInterval);
                debugLog('策略5成功: 强制绑定完成', 'success');
                
            } catch (error) {
                debugLog('策略5绑定失败', 'error', error.message);
            }
            
        }, 200);
        
        return true;
    }
    
    /**
     * 统一搜索执行函数
     */
    function executeUnifiedSearch(source) {
        debugLog(`统一搜索被触发 - 来源: ${source}`);
        
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) {
            debugLog('统一搜索失败: 搜索框不存在', 'error');
            return;
        }
        
        const searchTerm = searchInput.value.trim();
        if (!searchTerm) {
            debugLog('统一搜索跳过: 搜索词为空', 'warn');
            return;
        }
        
        debugLog(`执行搜索 - 关键词: "${searchTerm}"`);
        
        try {
            // 尝试多种搜索方法
            const searchMethods = [
                () => {
                    if (window.performSearch) {
                        window.performSearch();
                        return true;
                    }
                    return false;
                },
                () => {
                    if (window.searchEnterKeyFix && window.searchEnterKeyFix.executeSearch) {
                        window.searchEnterKeyFix.executeSearch(source);
                        return true;
                    }
                    return false;
                },
                () => {
                    // 直接操作搜索结果
                    const searchResults = document.getElementById('searchResults');
                    if (searchResults) {
                        searchResults.innerHTML = `
                            <div class="search-result-item">
                                <div class="search-result-title">搜索: "${searchTerm}"</div>
                                <div class="search-result-description">高级修复脚本执行的搜索 (${source})</div>
                            </div>
                        `;
                        searchResults.style.display = 'block';
                        return true;
                    }
                    return false;
                },
                () => {
                    // 跳转搜索
                    const currentPath = window.location.pathname;
                    let targetUrl;
                    
                    if (currentPath === '/' || currentPath.includes('index.html')) {
                        targetUrl = `pages/products.html?search=${encodeURIComponent(searchTerm)}`;
                    } else {
                        targetUrl = `products.html?search=${encodeURIComponent(searchTerm)}`;
                    }
                    
                    debugLog(`跳转搜索: ${targetUrl}`);
                    window.location.href = targetUrl;
                    return true;
                }
            ];
            
            for (let i = 0; i < searchMethods.length; i++) {
                try {
                    if (searchMethods[i]()) {
                        debugLog(`搜索方法 ${i + 1} 执行成功`, 'success');
                        return;
                    }
                } catch (error) {
                    debugLog(`搜索方法 ${i + 1} 失败`, 'warn', error.message);
                }
            }
            
            debugLog('所有搜索方法都失败', 'error');
            
        } catch (error) {
            debugLog('统一搜索执行失败', 'error', error.message);
        }
    }
    
    /**
     * 主修复函数
     */
    function runAdvancedFix() {
        debugLog('开始高级搜索修复...');
        
        ADVANCED_FIX.attempts++;
        
        if (ADVANCED_FIX.attempts > ADVANCED_FIX.maxAttempts) {
            debugLog('达到最大修复尝试次数，停止修复', 'error');
            return;
        }
        
        // 按顺序执行修复策略
        const strategies = [
            { name: '暴力清理', func: strategy1_BruteForceCleanup },
            { name: '直接DOM绑定', func: strategy2_DirectDOMBinding },
            { name: '事件委托', func: strategy3_EventDelegation },
            { name: '全局监听', func: strategy4_GlobalKeyboardListener },
            { name: '轮询强制绑定', func: strategy5_PollingAndForceBinding }
        ];
        
        strategies.forEach((strategy, index) => {
            setTimeout(() => {
                debugLog(`执行修复策略 ${index + 1}: ${strategy.name}`);
                try {
                    const success = strategy.func();
                    ADVANCED_FIX.strategies.push({
                        name: strategy.name,
                        success: success,
                        timestamp: Date.now()
                    });
                } catch (error) {
                    debugLog(`策略 ${strategy.name} 执行异常`, 'error', error.message);
                    ADVANCED_FIX.strategies.push({
                        name: strategy.name,
                        success: false,
                        error: error.message,
                        timestamp: Date.now()
                    });
                }
            }, index * 500);
        });
        
        // 设置测试验证
        setTimeout(() => {
            testAdvancedFix();
        }, strategies.length * 500 + 1000);
    }
    
    /**
     * 测试高级修复效果
     */
    function testAdvancedFix() {
        debugLog('开始测试高级修复效果...');
        
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) {
            debugLog('测试失败: 搜索框不存在', 'error');
            return;
        }
        
        // 设置测试关键词
        const testKeyword = '3798462';
        searchInput.value = testKeyword;
        searchInput.focus();
        
        debugLog(`设置测试关键词: "${testKeyword}"`);
        
        // 模拟回车键
        const enterEvent = new KeyboardEvent('keypress', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
        });
        
        debugLog('发送测试回车键事件...');
        const result = searchInput.dispatchEvent(enterEvent);
        debugLog(`测试事件分发结果: ${result}`, result ? 'success' : 'warn');
        
        // 生成修复报告
        setTimeout(() => {
            generateAdvancedFixReport();
        }, 2000);
    }
    
    /**
     * 生成高级修复报告
     */
    function generateAdvancedFixReport() {
        const report = {
            timestamp: new Date().toISOString(),
            attempts: ADVANCED_FIX.attempts,
            strategies: ADVANCED_FIX.strategies,
            success: ADVANCED_FIX.strategies.some(s => s.success),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        window.advancedFixReport = report;
        
        debugLog('📊 高级修复报告已生成', 'success');
        debugLog('💡 查看报告: window.advancedFixReport');
        
        console.log('\n🚀 === 高级修复执行报告 ===');
        console.log('修复尝试次数:', report.attempts);
        console.log('策略执行结果:');
        report.strategies.forEach((strategy, index) => {
            console.log(`  ${index + 1}. ${strategy.name}: ${strategy.success ? '✅ 成功' : '❌ 失败'}`);
            if (strategy.error) {
                console.log(`     错误: ${strategy.error}`);
            }
        });
        console.log('总体状态:', report.success ? '✅ 至少一个策略成功' : '❌ 所有策略失败');
        
        if (!report.success) {
            debugLog('所有修复策略都失败，可能需要手动干预', 'error');
            console.log('\n🔧 === 手动修复建议 ===');
            console.log('1. 检查浏览器控制台是否有JavaScript错误');
            console.log('2. 确认main.js和相关脚本是否正确加载');
            console.log('3. 尝试禁用浏览器扩展后重新测试');
            console.log('4. 检查是否有其他脚本干扰事件处理');
        }
    }
    
    /**
     * 手动修复函数
     */
    function manualFix() {
        debugLog('手动修复被调用');
        runAdvancedFix();
    }
    
    /**
     * 手动测试函数
     */
    function manualTest(keyword = '3798462') {
        debugLog(`手动测试被调用 - 关键词: "${keyword}"`);
        executeUnifiedSearch('manual-test');
    }
    
    // 导出到全局
    window.advancedSearchFix = {
        fix: manualFix,
        test: manualTest,
        executeSearch: executeUnifiedSearch,
        strategies: ADVANCED_FIX.strategies,
        report: () => window.advancedFixReport
    };
    
    // 自动执行修复
    if (document.readyState === 'complete') {
        setTimeout(runAdvancedFix, 1000);
    } else {
        window.addEventListener('load', () => {
            setTimeout(runAdvancedFix, 1000);
        });
    }
    
    console.log('🚀 高级搜索修复脚本已加载');
    console.log('💡 手动修复: advancedSearchFix.fix()');
    console.log('🧪 手动测试: advancedSearchFix.test("3798462")');
    
})();
