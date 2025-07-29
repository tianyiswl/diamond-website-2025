/**
 * 🔬 深度搜索问题诊断工具
 * 用于深入分析搜索回车键功能失效的根本原因
 */

(function() {
    'use strict';
    
    console.log('🔬 深度搜索诊断工具开始执行...');
    
    const DIAGNOSIS = {
        results: {},
        logs: [],
        startTime: Date.now()
    };
    
    /**
     * 增强日志函数
     */
    function log(message, level = 'info', data = null) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            timestamp,
            level,
            message,
            data
        };
        
        DIAGNOSIS.logs.push(logEntry);
        
        const prefix = `[${timestamp}] 🔬`;
        switch(level) {
            case 'error':
                console.error(`${prefix} ❌ ${message}`, data || '');
                break;
            case 'warn':
                console.warn(`${prefix} ⚠️ ${message}`, data || '');
                break;
            case 'success':
                console.log(`${prefix} ✅ ${message}`, data || '');
                break;
            default:
                console.log(`${prefix} ${message}`, data || '');
        }
    }
    
    /**
     * 1. 深度检查DOM元素状态
     */
    function deepCheckDOMElements() {
        log('=== 1. 深度DOM元素检查 ===');
        
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.querySelector('.search-btn');
        const searchResults = document.getElementById('searchResults');
        
        DIAGNOSIS.results.domElements = {
            searchInput: !!searchInput,
            searchBtn: !!searchBtn,
            searchResults: !!searchResults
        };
        
        if (searchInput) {
            const inputDetails = {
                id: searchInput.id,
                className: searchInput.className,
                tagName: searchInput.tagName,
                type: searchInput.type,
                disabled: searchInput.disabled,
                readOnly: searchInput.readOnly,
                style: {
                    display: getComputedStyle(searchInput).display,
                    visibility: getComputedStyle(searchInput).visibility,
                    pointerEvents: getComputedStyle(searchInput).pointerEvents
                },
                attributes: Array.from(searchInput.attributes).map(attr => ({
                    name: attr.name,
                    value: attr.value
                })),
                parentElement: searchInput.parentElement?.tagName,
                eventListeners: getEventListeners ? getEventListeners(searchInput) : 'DevTools required'
            };
            
            log('搜索框详细信息', 'info', inputDetails);
            DIAGNOSIS.results.searchInputDetails = inputDetails;
            
            // 检查是否可以获得焦点
            try {
                searchInput.focus();
                const hasFocus = document.activeElement === searchInput;
                log(`搜索框焦点测试: ${hasFocus ? '✅ 可获得焦点' : '❌ 无法获得焦点'}`);
                DIAGNOSIS.results.canFocus = hasFocus;
            } catch (error) {
                log('搜索框焦点测试失败', 'error', error.message);
                DIAGNOSIS.results.canFocus = false;
            }
        } else {
            log('❌ 搜索框元素不存在', 'error');
        }
        
        if (searchBtn) {
            const btnDetails = {
                className: searchBtn.className,
                tagName: searchBtn.tagName,
                onclick: searchBtn.onclick?.toString() || 'null',
                disabled: searchBtn.disabled,
                style: {
                    display: getComputedStyle(searchBtn).display,
                    visibility: getComputedStyle(searchBtn).visibility,
                    pointerEvents: getComputedStyle(searchBtn).pointerEvents
                }
            };
            
            log('搜索按钮详细信息', 'info', btnDetails);
            DIAGNOSIS.results.searchBtnDetails = btnDetails;
        }
    }
    
    /**
     * 2. 深度检查事件监听器
     */
    function deepCheckEventListeners() {
        log('=== 2. 深度事件监听器检查 ===');
        
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) {
            log('❌ 无法检查事件监听器：搜索框不存在', 'error');
            return;
        }
        
        // 检查各种事件监听器
        const eventTypes = ['keypress', 'keydown', 'keyup', 'input', 'change', 'focus', 'blur'];
        const eventListenerInfo = {};
        
        eventTypes.forEach(eventType => {
            // 尝试添加测试监听器来检查是否有其他监听器
            let listenerCount = 0;
            const testListener = function(e) {
                listenerCount++;
                log(`检测到 ${eventType} 事件`, 'info', {
                    type: e.type,
                    key: e.key,
                    code: e.code,
                    target: e.target.id,
                    currentTarget: e.currentTarget.id,
                    bubbles: e.bubbles,
                    cancelable: e.cancelable,
                    defaultPrevented: e.defaultPrevented,
                    eventPhase: e.eventPhase
                });
            };
            
            searchInput.addEventListener(eventType, testListener, true); // 捕获阶段
            searchInput.addEventListener(eventType, testListener, false); // 冒泡阶段
            
            eventListenerInfo[eventType] = {
                hasListener: true,
                testAdded: true
            };
        });
        
        DIAGNOSIS.results.eventListeners = eventListenerInfo;
        log('事件监听器测试已设置', 'success');
        
        // 检查修复脚本的标记
        const fixMarkers = {
            'data-main-search-bound': searchInput.hasAttribute('data-main-search-bound'),
            'data-search-bound': searchInput.hasAttribute('data-search-bound'),
            'data-search-fix-bound': searchInput.hasAttribute('data-search-fix-bound')
        };
        
        log('修复标记检查', 'info', fixMarkers);
        DIAGNOSIS.results.fixMarkers = fixMarkers;
    }
    
    /**
     * 3. 检查JavaScript执行环境
     */
    function checkJavaScriptEnvironment() {
        log('=== 3. JavaScript执行环境检查 ===');
        
        const environment = {
            // 全局函数检查
            performSearch: typeof window.performSearch,
            searchEnterKeyFix: typeof window.searchEnterKeyFix,
            searchDiagnosis: typeof window.searchDiagnosis,
            
            // 搜索相关对象
            productsData: typeof window.productsData,
            featuredProducts: typeof window.featuredProducts,
            
            // 页面管理器
            pageLoadManager: typeof window.pageLoadManager,
            i18nManager: typeof window.i18nManager,
            
            // 错误捕获
            errors: window.searchDiagnosisErrors || [],
            
            // 脚本加载状态
            scripts: Array.from(document.scripts).map(script => ({
                src: script.src || 'inline',
                loaded: script.readyState || 'unknown'
            }))
        };
        
        log('JavaScript环境状态', 'info', environment);
        DIAGNOSIS.results.jsEnvironment = environment;
        
        // 检查performSearch函数的具体实现
        if (window.performSearch) {
            try {
                const funcStr = window.performSearch.toString();
                log('performSearch函数源码', 'info', funcStr.substring(0, 500) + '...');
                DIAGNOSIS.results.performSearchSource = funcStr;
            } catch (error) {
                log('无法获取performSearch函数源码', 'warn', error.message);
            }
        }
    }
    
    /**
     * 4. 实时事件监控
     */
    function setupRealTimeEventMonitoring() {
        log('=== 4. 设置实时事件监控 ===');
        
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) {
            log('❌ 无法设置事件监控：搜索框不存在', 'error');
            return;
        }
        
        // 监控所有可能的事件
        const allEvents = [
            'keydown', 'keypress', 'keyup', 'input', 'change', 'focus', 'blur',
            'click', 'mousedown', 'mouseup', 'mouseover', 'mouseout'
        ];
        
        allEvents.forEach(eventType => {
            searchInput.addEventListener(eventType, function(e) {
                const eventInfo = {
                    type: e.type,
                    timestamp: Date.now(),
                    key: e.key,
                    code: e.code,
                    keyCode: e.keyCode,
                    which: e.which,
                    target: e.target.id,
                    currentTarget: e.currentTarget.id,
                    bubbles: e.bubbles,
                    cancelable: e.cancelable,
                    defaultPrevented: e.defaultPrevented,
                    eventPhase: e.eventPhase,
                    isTrusted: e.isTrusted
                };
                
                log(`🎯 事件监控: ${eventType}`, 'info', eventInfo);
                
                // 特别关注回车键
                if (e.type === 'keypress' && e.key === 'Enter') {
                    log('🔥 检测到回车键按下！', 'success', eventInfo);
                    
                    // 检查事件是否被阻止
                    setTimeout(() => {
                        if (e.defaultPrevented) {
                            log('⚠️ 回车键事件的默认行为被阻止', 'warn');
                        } else {
                            log('✅ 回车键事件的默认行为未被阻止', 'success');
                        }
                    }, 0);
                }
            }, true); // 使用捕获阶段确保能监控到事件
        });
        
        log('实时事件监控已设置', 'success');
        DIAGNOSIS.results.eventMonitoringActive = true;
    }
    
    /**
     * 5. 手动触发测试
     */
    function manualTriggerTest() {
        log('=== 5. 手动触发测试 ===');
        
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) {
            log('❌ 无法进行手动触发测试：搜索框不存在', 'error');
            return;
        }
        
        // 设置测试值
        const testKeyword = '3798462';
        searchInput.value = testKeyword;
        searchInput.focus();
        
        log(`设置测试关键词: "${testKeyword}"`);
        
        // 创建各种类型的回车键事件
        const eventVariations = [
            {
                name: 'KeyboardEvent - keypress',
                event: new KeyboardEvent('keypress', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true,
                    cancelable: true
                })
            },
            {
                name: 'KeyboardEvent - keydown',
                event: new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true,
                    cancelable: true
                })
            },
            {
                name: 'Event - legacy',
                event: (() => {
                    const evt = document.createEvent('KeyboardEvent');
                    evt.initKeyboardEvent('keypress', true, true, window, false, false, false, false, 13, 13);
                    return evt;
                })()
            }
        ];
        
        eventVariations.forEach((variation, index) => {
            setTimeout(() => {
                log(`测试事件变体: ${variation.name}`);
                try {
                    const result = searchInput.dispatchEvent(variation.event);
                    log(`事件分发结果: ${result}`, result ? 'success' : 'warn');
                } catch (error) {
                    log(`事件分发失败: ${error.message}`, 'error');
                }
            }, index * 1000);
        });
    }
    
    /**
     * 6. 直接函数调用测试
     */
    function directFunctionCallTest() {
        log('=== 6. 直接函数调用测试 ===');
        
        // 测试performSearch函数
        if (window.performSearch) {
            try {
                log('尝试直接调用 window.performSearch()');
                window.performSearch();
                log('✅ window.performSearch() 调用成功', 'success');
            } catch (error) {
                log('❌ window.performSearch() 调用失败', 'error', error.message);
            }
        } else {
            log('❌ window.performSearch 函数不存在', 'error');
        }
        
        // 测试修复脚本函数
        if (window.searchEnterKeyFix) {
            try {
                log('尝试调用修复脚本的executeSearch函数');
                window.searchEnterKeyFix.executeSearch('manual-test');
                log('✅ 修复脚本executeSearch调用成功', 'success');
            } catch (error) {
                log('❌ 修复脚本executeSearch调用失败', 'error', error.message);
            }
        } else {
            log('❌ searchEnterKeyFix 对象不存在', 'error');
        }
    }
    
    /**
     * 7. 生成诊断报告
     */
    function generateDiagnosisReport() {
        log('=== 7. 生成诊断报告 ===');
        
        const report = {
            timestamp: new Date().toISOString(),
            duration: Date.now() - DIAGNOSIS.startTime,
            userAgent: navigator.userAgent,
            url: window.location.href,
            results: DIAGNOSIS.results,
            logs: DIAGNOSIS.logs,
            recommendations: []
        };
        
        // 分析结果并生成建议
        if (!DIAGNOSIS.results.domElements?.searchInput) {
            report.recommendations.push('❌ 关键问题：搜索框元素不存在，需要检查HTML结构');
        }
        
        if (!DIAGNOSIS.results.canFocus) {
            report.recommendations.push('❌ 关键问题：搜索框无法获得焦点，可能被CSS或其他元素阻挡');
        }
        
        if (DIAGNOSIS.results.jsEnvironment?.performSearch === 'undefined') {
            report.recommendations.push('❌ 关键问题：performSearch函数不存在，需要检查main.js加载');
        }
        
        if (!DIAGNOSIS.results.fixMarkers?.['data-search-fix-bound']) {
            report.recommendations.push('⚠️ 修复脚本可能未正确执行，需要手动触发修复');
        }
        
        // 保存到全局变量供查看
        window.searchDiagnosisReport = report;
        
        log('📊 诊断报告已生成', 'success');
        log('💡 查看完整报告: window.searchDiagnosisReport');
        
        // 输出关键发现
        console.log('\n🔬 === 深度诊断关键发现 ===');
        console.log('搜索框存在:', DIAGNOSIS.results.domElements?.searchInput ? '✅' : '❌');
        console.log('可获得焦点:', DIAGNOSIS.results.canFocus ? '✅' : '❌');
        console.log('performSearch函数:', DIAGNOSIS.results.jsEnvironment?.performSearch);
        console.log('修复脚本状态:', DIAGNOSIS.results.jsEnvironment?.searchEnterKeyFix);
        console.log('事件监控激活:', DIAGNOSIS.results.eventMonitoringActive ? '✅' : '❌');
        
        if (report.recommendations.length > 0) {
            console.log('\n🔧 === 修复建议 ===');
            report.recommendations.forEach(rec => console.log(rec));
        }
        
        return report;
    }
    
    /**
     * 主诊断函数
     */
    function runDeepDiagnosis() {
        log('🚀 开始深度搜索问题诊断...');
        
        try {
            deepCheckDOMElements();
            deepCheckEventListeners();
            checkJavaScriptEnvironment();
            setupRealTimeEventMonitoring();
            
            setTimeout(() => {
                manualTriggerTest();
            }, 1000);
            
            setTimeout(() => {
                directFunctionCallTest();
            }, 5000);
            
            setTimeout(() => {
                generateDiagnosisReport();
            }, 8000);
            
        } catch (error) {
            log('诊断过程中发生严重错误', 'error', error);
        }
    }
    
    // 导出到全局
    window.deepSearchDiagnosis = {
        run: runDeepDiagnosis,
        results: DIAGNOSIS.results,
        logs: DIAGNOSIS.logs,
        generateReport: generateDiagnosisReport
    };
    
    // 自动运行诊断
    if (document.readyState === 'complete') {
        setTimeout(runDeepDiagnosis, 1000);
    } else {
        window.addEventListener('load', () => {
            setTimeout(runDeepDiagnosis, 1000);
        });
    }
    
    console.log('🔬 深度搜索诊断工具已加载');
    console.log('💡 手动运行: deepSearchDiagnosis.run()');
    console.log('📊 查看结果: deepSearchDiagnosis.results');
    
})();
