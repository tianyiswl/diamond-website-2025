/**
 * 🚨 双重刷新修复脚本
 * 专门解决页面跳转时出现双重刷新的问题
 * 
 * 功能：
 * - 防止重复的页面初始化
 * - 统一管理页面跳转事件
 * - 避免多个脚本冲突
 * - 确保页面跳转流畅
 */

(function() {
    'use strict';
    
    console.log('🚨 双重刷新修复脚本启动');
    
    // 全局执行状态管理
    window.PageExecutionState = window.PageExecutionState || {
        domContentLoaded: false,
        pageLoadManagerInitialized: false,
        componentManagerInitialized: false,
        renderCoordinatorInitialized: false,
        i18nInitialized: false,
        
        // 防重复执行标记（临时禁用以排查问题）
        preventDuplicateExecution: false,
        
        // 执行计数器
        executionCounts: {
            domContentLoaded: 0,
            pageInit: 0,
            componentInit: 0
        }
    };
    
    const state = window.PageExecutionState;
    
    /**
     * 检查是否应该执行初始化
     */
    function shouldExecuteInitialization(type) {
        if (!state.preventDuplicateExecution) {
            return true;
        }
        
        switch (type) {
            case 'domContentLoaded':
                if (state.domContentLoaded) {
                    console.log('⚠️ DOM已加载，跳过重复执行');
                    return false;
                }
                state.domContentLoaded = true;
                state.executionCounts.domContentLoaded++;
                return true;
                
            case 'pageLoadManager':
                if (state.pageLoadManagerInitialized) {
                    console.log('⚠️ 页面加载管理器已初始化，跳过重复执行');
                    return false;
                }
                state.pageLoadManagerInitialized = true;
                return true;
                
            case 'componentManager':
                if (state.componentManagerInitialized) {
                    console.log('⚠️ 组件管理器已初始化，跳过重复执行');
                    return false;
                }
                state.componentManagerInitialized = true;
                state.executionCounts.componentInit++;
                return true;
                
            case 'renderCoordinator':
                if (state.renderCoordinatorInitialized) {
                    console.log('⚠️ 渲染协调器已初始化，跳过重复执行');
                    return false;
                }
                state.renderCoordinatorInitialized = true;
                return true;
                
            case 'i18n':
                if (state.i18nInitialized) {
                    console.log('⚠️ 国际化系统已初始化，跳过重复执行');
                    return false;
                }
                state.i18nInitialized = true;
                return true;
                
            default:
                return true;
        }
    }
    
    /**
     * 包装DOMContentLoaded事件监听器
     */
    function wrapDOMContentLoadedListeners() {
        const originalAddEventListener = document.addEventListener;
        
        document.addEventListener = function(type, listener, options) {
            if (type === 'DOMContentLoaded') {
                console.log('🔍 检测到DOMContentLoaded监听器注册');
                
                // 包装监听器，添加重复执行检查
                const wrappedListener = function(event) {
                    if (shouldExecuteInitialization('domContentLoaded')) {
                        console.log('✅ 执行DOMContentLoaded监听器');
                        return listener.call(this, event);
                    } else {
                        console.log('⚠️ 跳过重复的DOMContentLoaded执行');
                    }
                };
                
                return originalAddEventListener.call(this, type, wrappedListener, options);
            }
            
            return originalAddEventListener.call(this, type, listener, options);
        };
    }
    
    /**
     * 包装页面加载管理器
     */
    function wrapPageLoadManager() {
        // 监控PageLoadManager的创建
        let originalPageLoadManager = window.PageLoadManager;
        
        Object.defineProperty(window, 'PageLoadManager', {
            get: function() {
                return originalPageLoadManager;
            },
            set: function(value) {
                if (value && value.init && !state.pageLoadManagerInitialized) {
                    console.log('🔍 检测到PageLoadManager设置');
                    
                    // 包装init方法
                    const originalInit = value.init;
                    value.init = function() {
                        if (shouldExecuteInitialization('pageLoadManager')) {
                            console.log('✅ 执行PageLoadManager初始化');
                            return originalInit.apply(this, arguments);
                        } else {
                            console.log('⚠️ 跳过重复的PageLoadManager初始化');
                        }
                    };
                }
                originalPageLoadManager = value;
            },
            configurable: true
        });
    }
    
    /**
     * 包装组件管理器
     */
    function wrapComponentManager() {
        // 监控componentManager的创建
        let originalComponentManager = window.componentManager;
        
        Object.defineProperty(window, 'componentManager', {
            get: function() {
                return originalComponentManager;
            },
            set: function(value) {
                if (value && value.init && !state.componentManagerInitialized) {
                    console.log('🔍 检测到componentManager设置');
                    
                    // 包装init方法
                    const originalInit = value.init;
                    value.init = function() {
                        if (shouldExecuteInitialization('componentManager')) {
                            console.log('✅ 执行componentManager初始化');
                            return originalInit.apply(this, arguments);
                        } else {
                            console.log('⚠️ 跳过重复的componentManager初始化');
                        }
                    };
                }
                originalComponentManager = value;
            },
            configurable: true
        });
    }
    
    /**
     * 包装渲染协调器
     */
    function wrapRenderCoordinator() {
        // 监控PageRenderCoordinator的创建
        let originalRenderCoordinator = window.PageRenderCoordinator;
        
        Object.defineProperty(window, 'PageRenderCoordinator', {
            get: function() {
                return originalRenderCoordinator;
            },
            set: function(value) {
                if (value && value.init && !state.renderCoordinatorInitialized) {
                    console.log('🔍 检测到PageRenderCoordinator设置');
                    
                    // 包装init方法
                    const originalInit = value.init;
                    value.init = function() {
                        if (shouldExecuteInitialization('renderCoordinator')) {
                            console.log('✅ 执行PageRenderCoordinator初始化');
                            return originalInit.apply(this, arguments);
                        } else {
                            console.log('⚠️ 跳过重复的PageRenderCoordinator初始化');
                        }
                    };
                }
                originalRenderCoordinator = value;
            },
            configurable: true
        });
    }
    
    /**
     * 监控页面跳转，重置状态
     */
    function setupNavigationMonitoring() {
        // 监控页面跳转，重置执行状态
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        
        function resetExecutionState() {
            console.log('🔄 页面跳转，重置执行状态');
            state.domContentLoaded = false;
            state.pageLoadManagerInitialized = false;
            state.componentManagerInitialized = false;
            state.renderCoordinatorInitialized = false;
            state.i18nInitialized = false;
        }
        
        history.pushState = function() {
            resetExecutionState();
            return originalPushState.apply(history, arguments);
        };
        
        history.replaceState = function() {
            resetExecutionState();
            return originalReplaceState.apply(history, arguments);
        };
        
        window.addEventListener('popstate', resetExecutionState);
        window.addEventListener('beforeunload', resetExecutionState);
    }
    
    /**
     * 显示执行统计
     */
    function showExecutionStats() {
        console.log('📊 页面执行统计:');
        console.log('  - DOMContentLoaded执行次数:', state.executionCounts.domContentLoaded);
        console.log('  - 页面初始化执行次数:', state.executionCounts.pageInit);
        console.log('  - 组件初始化执行次数:', state.executionCounts.componentInit);
        
        if (state.executionCounts.domContentLoaded > 1 || 
            state.executionCounts.pageInit > 1 || 
            state.executionCounts.componentInit > 1) {
            console.warn('⚠️ 检测到重复执行，双重刷新修复脚本正在工作');
        } else {
            console.log('✅ 未检测到重复执行');
        }
    }
    
    /**
     * 初始化修复脚本
     */
    function init() {
        console.log('🚨 初始化双重刷新修复脚本');
        
        // 包装各种管理器和事件监听器
        wrapDOMContentLoadedListeners();
        wrapPageLoadManager();
        wrapComponentManager();
        wrapRenderCoordinator();
        
        // 设置页面跳转监控
        setupNavigationMonitoring();
        
        // 定期显示统计信息
        setTimeout(showExecutionStats, 3000);
        
        console.log('✅ 双重刷新修复脚本初始化完成');
    }
    
    // 立即初始化
    init();
    
    // 暴露状态查询函数到全局
    window.getPageExecutionState = function() {
        return state;
    };
    
    window.showPageExecutionStats = showExecutionStats;
    
})();

console.log('✅ 双重刷新修复脚本已加载');
console.log('💡 可以调用 showPageExecutionStats() 查看执行统计');
