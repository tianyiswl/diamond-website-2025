/**
 * 🚨 页面跳转修复脚本
 * 专门解决页面跳转时出现白色LOGO页面的问题
 * 
 * 功能：
 * - 监控页面跳转事件
 * - 立即移除任何可能出现的加载屏幕
 * - 防止LOGO页面在页面切换时显示
 * - 确保页面跳转流畅无闪烁
 */

(function() {
    'use strict';
    
    console.log('🚨 页面跳转修复脚本启动');
    
    // 配置选项
    const CONFIG = {
        debug: true,
        checkInterval: 50,      // 检查间隔（毫秒）
        maxChecks: 20,          // 最大检查次数
        forceRemoveDelay: 100   // 强制移除延迟
    };
    
    /**
     * 强制移除所有加载屏幕元素
     */
    function forceRemoveAllLoadingScreens() {
        if (CONFIG.debug) {
            console.log('🧹 强制移除所有加载屏幕元素');
        }
        
        // 所有可能的加载屏幕选择器
        const loadingSelectors = [
            '#global-loading-screen',
            '.global-loading-screen',
            '#loading',
            '.loading-screen',
            '.loading-overlay',
            '#loadingScreen',        // 🔥 产品详情页专用加载屏幕
            '[id*="loading"]',
            '[class*="loading"]'
        ];
        
        let removedCount = 0;
        
        loadingSelectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    // 检查是否是真正的加载屏幕（避免误删其他元素）
                    if (isLoadingScreenElement(element)) {
                        element.remove();
                        removedCount++;
                        if (CONFIG.debug) {
                            console.log(`🗑️ 移除加载屏幕: ${selector}`);
                        }
                    }
                });
            } catch (error) {
                console.warn(`⚠️ 移除选择器 ${selector} 时出错:`, error);
            }
        });
        
        // 移除相关样式
        const styleSelectors = [
            '#global-loading-styles',
            '#loading-styles',
            '#force-logo-fix-styles'
        ];
        
        styleSelectors.forEach(selector => {
            const styleElement = document.querySelector(selector);
            if (styleElement) {
                styleElement.remove();
                removedCount++;
                if (CONFIG.debug) {
                    console.log(`🗑️ 移除样式: ${selector}`);
                }
            }
        });
        
        // 确保页面内容可见
        ensurePageContentVisible();
        
        if (CONFIG.debug && removedCount > 0) {
            console.log(`✅ 共移除 ${removedCount} 个加载相关元素`);
        }
        
        return removedCount;
    }
    
    /**
     * 判断元素是否是加载屏幕元素
     */
    function isLoadingScreenElement(element) {
        if (!element) return false;

        // 🔥 特殊处理：产品详情页的加载屏幕
        if (element.id === 'loadingScreen') {
            return true;
        }

        // 检查元素的样式和内容特征
        const style = window.getComputedStyle(element);
        const innerHTML = element.innerHTML.toLowerCase();
        const className = element.className.toLowerCase();
        const id = element.id.toLowerCase();

        // 特征检查
        const isFullScreen = style.position === 'fixed' &&
                           (style.width === '100%' || style.width.includes('100vw')) &&
                           (style.height === '100%' || style.height.includes('100vh'));

        const hasLoadingContent = innerHTML.includes('loading') ||
                                innerHTML.includes('加载') ||
                                innerHTML.includes('diamond') ||
                                innerHTML.includes('logo') ||
                                innerHTML.includes('spinner') ||
                                className.includes('loading') ||
                                id.includes('loading');

        const hasHighZIndex = parseInt(style.zIndex) > 1000;

        // 🔥 增强检测：检查是否包含公司名称或LOGO相关内容
        const hasCompanyContent = innerHTML.includes('无锡皇德') ||
                                innerHTML.includes('diamond') ||
                                innerHTML.includes('wuxi') ||
                                innerHTML.includes('皇德');

        return (isFullScreen && hasLoadingContent) ||
               hasHighZIndex ||
               (hasLoadingContent && hasCompanyContent);
    }
    
    /**
     * 确保页面内容可见
     */
    function ensurePageContentVisible() {
        // 确保body可见
        if (document.body) {
            document.body.classList.remove('loading');
            document.body.style.overflow = 'auto';
            document.body.style.pointerEvents = 'auto';
            document.body.style.visibility = 'visible';
            document.body.style.opacity = '1';
        }
        
        // 确保main内容可见
        const main = document.querySelector('main');
        if (main) {
            main.style.display = 'block';
            main.style.visibility = 'visible';
            main.style.opacity = '1';
        }
        
        // 确保header和footer可见
        const header = document.querySelector('header, .header');
        if (header) {
            header.style.visibility = 'visible';
            header.style.opacity = '1';
        }
        
        const footer = document.querySelector('footer, .footer');
        if (footer) {
            footer.style.visibility = 'visible';
            footer.style.opacity = '1';
        }
    }
    
    /**
     * 监控页面跳转
     */
    function setupNavigationMonitoring() {
        if (CONFIG.debug) {
            console.log('👁️ 设置页面跳转监控');
        }
        
        // 监控 pushState 和 replaceState
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        
        history.pushState = function() {
            if (CONFIG.debug) {
                console.log('🔄 检测到页面跳转 (pushState)');
            }
            setTimeout(forceRemoveAllLoadingScreens, CONFIG.forceRemoveDelay);
            return originalPushState.apply(history, arguments);
        };
        
        history.replaceState = function() {
            if (CONFIG.debug) {
                console.log('🔄 检测到页面跳转 (replaceState)');
            }
            setTimeout(forceRemoveAllLoadingScreens, CONFIG.forceRemoveDelay);
            return originalReplaceState.apply(history, arguments);
        };
        
        // 监控 popstate 事件
        window.addEventListener('popstate', function() {
            if (CONFIG.debug) {
                console.log('🔄 检测到页面跳转 (popstate)');
            }
            setTimeout(forceRemoveAllLoadingScreens, CONFIG.forceRemoveDelay);
        });
        
        // 监控 beforeunload 事件
        window.addEventListener('beforeunload', function() {
            if (CONFIG.debug) {
                console.log('🔄 页面即将卸载');
            }
            forceRemoveAllLoadingScreens();
        });
        
        // 监控 hashchange 事件
        window.addEventListener('hashchange', function() {
            if (CONFIG.debug) {
                console.log('🔄 检测到hash变化');
            }
            setTimeout(forceRemoveAllLoadingScreens, CONFIG.forceRemoveDelay);
        });
    }
    
    /**
     * 设置DOM变化监控
     */
    function setupDOMMonitoring() {
        if (CONFIG.debug) {
            console.log('👁️ 设置DOM变化监控');
        }
        
        const observer = new MutationObserver(function(mutations) {
            let hasLoadingScreenAdded = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 更精确地检查新添加的节点是否是真正的加载屏幕
                            if (isLoadingScreenElement(node) ||
                                node.id === 'global-loading-screen' ||
                                (node.className && node.className.includes && node.className.includes('loading-screen'))) {
                                hasLoadingScreenAdded = true;
                            }

                            // 排除页头页脚组件，只检查真正的加载屏幕
                            const loadingChildren = node.querySelectorAll('[id="global-loading-screen"], [class="loading-screen"]');
                            if (loadingChildren.length > 0) {
                                hasLoadingScreenAdded = true;
                            }
                        }
                    });
                }
            });
            
            if (hasLoadingScreenAdded) {
                if (CONFIG.debug) {
                    console.log('🚨 检测到新的加载屏幕元素，立即移除');
                }
                setTimeout(forceRemoveAllLoadingScreens, 10);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        if (CONFIG.debug) {
            console.log('✅ DOM变化监控已启动');
        }
    }
    
    /**
     * 定期检查和清理
     */
    function setupPeriodicCleanup() {
        let checkCount = 0;
        
        const intervalId = setInterval(() => {
            checkCount++;
            
            const removedCount = forceRemoveAllLoadingScreens();
            
            if (checkCount >= CONFIG.maxChecks) {
                clearInterval(intervalId);
                if (CONFIG.debug) {
                    console.log('⏰ 定期检查已完成');
                }
            }
        }, CONFIG.checkInterval);
    }
    
    /**
     * 初始化修复脚本
     */
    function init() {
        console.log('🚨 初始化页面跳转修复脚本');
        
        // 立即执行一次清理
        forceRemoveAllLoadingScreens();
        
        // 设置各种监控
        setupNavigationMonitoring();
        setupDOMMonitoring();
        setupPeriodicCleanup();
        
        // 页面加载完成后再次清理
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(forceRemoveAllLoadingScreens, 100);
            });
        }
        
        window.addEventListener('load', () => {
            setTimeout(forceRemoveAllLoadingScreens, 200);
        });
        
        console.log('✅ 页面跳转修复脚本初始化完成');
    }
    
    // 立即初始化
    init();
    
    // 暴露手动清理函数到全局
    window.forceRemoveLoadingScreens = forceRemoveAllLoadingScreens;
    
})();

console.log('✅ 页面跳转修复脚本已加载');
console.log('💡 可以调用 forceRemoveLoadingScreens() 手动清理加载屏幕');
