/**
 * 🧹 优化的加载屏幕管理器 - 无锡皇德国际贸易有限公司
 * 解决过度清理加载屏幕的性能问题
 * 
 * 功能：
 * - 防抖机制避免频繁清理
 * - 智能检测加载状态
 * - 统一管理所有加载屏幕
 * - 性能监控和优化
 * - 错误恢复机制
 */

class OptimizedLoadingManager {
    constructor() {
        this.cleanupCount = 0;
        this.lastCleanupTime = 0;
        this.minCleanupInterval = 100; // 最小清理间隔100ms
        this.loadingElements = new Set();
        this.isPageLoaded = false;
        this.cleanupInProgress = false;
        this.debouncedCleanup = null;
        
        console.log('🧹 优化的加载屏幕管理器初始化');
        this.init();
    }
    
    /**
     * 初始化加载管理器
     */
    init() {
        try {
            // 设置全局引用
            window.optimizedLoadingManager = this;
            
            // 创建防抖清理函数
            this.debouncedCleanup = this.debounce(this.performCleanup.bind(this), 50);
            
            // 替换现有的清理函数
            this.replaceExistingCleanupFunctions();
            
            // 监听页面加载状态
            this.monitorPageLoadState();
            
            // 初始扫描加载元素
            this.scanLoadingElements();
            
            console.log('✅ 优化的加载屏幕管理器初始化完成');
            
        } catch (error) {
            console.error('❌ 优化的加载屏幕管理器初始化失败:', error);
        }
    }
    
    /**
     * 替换现有的清理函数
     */
    replaceExistingCleanupFunctions() {
        // 保存原始函数
        if (window.forceRemoveLoadingScreens && !window.originalForceRemoveLoadingScreens) {
            window.originalForceRemoveLoadingScreens = window.forceRemoveLoadingScreens;
        }
        
        // 替换为优化版本
        window.forceRemoveLoadingScreens = () => {
            this.requestCleanup('forceRemoveLoadingScreens');
        };
        
        // 替换其他可能的清理函数
        if (window.removeLoadingScreen) {
            window.originalRemoveLoadingScreen = window.removeLoadingScreen;
            window.removeLoadingScreen = () => {
                this.requestCleanup('removeLoadingScreen');
            };
        }
        
        console.log('🔄 加载屏幕清理函数已被优化版本替换');
    }
    
    /**
     * 请求清理（防抖）
     */
    requestCleanup(source = 'unknown') {
        const now = Date.now();
        
        // 如果页面已完全加载且最近没有清理过，直接执行
        if (this.isPageLoaded && (now - this.lastCleanupTime) > this.minCleanupInterval) {
            this.performCleanup(source);
        } else {
            // 否则使用防抖
            this.debouncedCleanup(source);
        }
    }
    
    /**
     * 执行清理
     */
    performCleanup(source = 'debounced') {
        if (this.cleanupInProgress) {
            return;
        }
        
        const now = Date.now();
        
        // 检查是否需要清理
        if (!this.shouldPerformCleanup(now)) {
            return;
        }
        
        this.cleanupInProgress = true;
        this.cleanupCount++;
        this.lastCleanupTime = now;
        
        try {
            console.log(`🧹 执行加载屏幕清理 (第${this.cleanupCount}次) - 来源: ${source}`);
            
            // 扫描并移除加载元素
            const removedCount = this.removeLoadingElements();
            
            // 调用原始清理函数（如果存在）
            if (window.originalForceRemoveLoadingScreens) {
                try {
                    window.originalForceRemoveLoadingScreens();
                } catch (error) {
                    console.warn('⚠️ 原始清理函数执行失败:', error);
                }
            }
            
            console.log(`✅ 加载屏幕清理完成 - 移除了 ${removedCount} 个元素`);
            
        } catch (error) {
            console.error('❌ 加载屏幕清理失败:', error);
        } finally {
            this.cleanupInProgress = false;
        }
    }
    
    /**
     * 检查是否应该执行清理
     */
    shouldPerformCleanup(now) {
        // 如果清理过于频繁，跳过
        if ((now - this.lastCleanupTime) < this.minCleanupInterval) {
            console.log('⏭️ 跳过过于频繁的清理请求');
            return false;
        }
        
        // 如果没有加载元素，跳过
        if (this.loadingElements.size === 0 && !this.hasLoadingElementsInDOM()) {
            console.log('⏭️ 没有加载元素需要清理');
            return false;
        }
        
        return true;
    }
    
    /**
     * 扫描加载元素
     */
    scanLoadingElements() {
        const loadingSelectors = [
            '#loading',
            '.loading',
            '.loading-screen',
            '.loading-overlay',
            '.spinner',
            '.loader',
            '[data-loading]',
            '.loading-animation'
        ];
        
        this.loadingElements.clear();
        
        loadingSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (this.isLoadingElement(element)) {
                    this.loadingElements.add(element);
                }
            });
        });
        
        console.log(`🔍 扫描到 ${this.loadingElements.size} 个加载元素`);
    }
    
    /**
     * 检查是否为加载元素
     */
    isLoadingElement(element) {
        if (!element || !element.parentNode) {
            return false;
        }
        
        // 检查元素是否可见
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') {
            return false;
        }
        
        // 检查元素内容
        const text = element.textContent.toLowerCase();
        const loadingKeywords = ['loading', '加载', '载入', 'spinner', 'loader'];
        
        return loadingKeywords.some(keyword => 
            text.includes(keyword) || 
            element.className.toLowerCase().includes(keyword) ||
            element.id.toLowerCase().includes(keyword)
        );
    }
    
    /**
     * 移除加载元素
     */
    removeLoadingElements() {
        let removedCount = 0;
        
        // 重新扫描DOM中的加载元素
        this.scanLoadingElements();
        
        // 移除已识别的加载元素
        this.loadingElements.forEach(element => {
            try {
                if (element && element.parentNode) {
                    element.parentNode.removeChild(element);
                    removedCount++;
                    console.log(`🗑️ 移除加载元素: ${element.id || element.className || 'unnamed'}`);
                }
            } catch (error) {
                console.warn('⚠️ 移除加载元素失败:', error);
            }
        });
        
        // 清空已移除的元素
        this.loadingElements.clear();
        
        return removedCount;
    }
    
    /**
     * 检查DOM中是否还有加载元素
     */
    hasLoadingElementsInDOM() {
        const loadingSelectors = [
            '#loading',
            '.loading:not(.loaded)',
            '.loading-screen',
            '.loading-overlay',
            '.spinner',
            '.loader'
        ];
        
        return loadingSelectors.some(selector => {
            const elements = document.querySelectorAll(selector);
            return Array.from(elements).some(element => {
                const style = window.getComputedStyle(element);
                return style.display !== 'none' && style.visibility !== 'hidden';
            });
        });
    }
    
    /**
     * 监听页面加载状态
     */
    monitorPageLoadState() {
        // 监听DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('📄 DOM加载完成');
                this.onDOMReady();
            });
        } else {
            this.onDOMReady();
        }
        
        // 监听页面完全加载
        if (document.readyState !== 'complete') {
            window.addEventListener('load', () => {
                console.log('🎉 页面完全加载完成');
                this.onPageLoaded();
            });
        } else {
            this.onPageLoaded();
        }
        
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.requestCleanup('visibilitychange');
            }
        });
    }
    
    /**
     * DOM准备完成处理
     */
    onDOMReady() {
        console.log('📄 DOM准备完成，执行初始清理');
        this.requestCleanup('DOMReady');
    }
    
    /**
     * 页面加载完成处理
     */
    onPageLoaded() {
        this.isPageLoaded = true;
        console.log('🎉 页面加载完成，执行最终清理');
        
        // 延迟一点时间确保所有脚本都执行完毕
        setTimeout(() => {
            this.performCleanup('pageLoaded');
        }, 500);
    }
    
    /**
     * 防抖函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * 获取清理统计信息
     */
    getCleanupStats() {
        return {
            cleanupCount: this.cleanupCount,
            lastCleanupTime: this.lastCleanupTime,
            isPageLoaded: this.isPageLoaded,
            loadingElementsCount: this.loadingElements.size,
            cleanupInProgress: this.cleanupInProgress
        };
    }
    
    /**
     * 手动触发清理
     */
    manualCleanup() {
        console.log('🔧 手动触发加载屏幕清理');
        this.performCleanup('manual');
    }
    
    /**
     * 重置清理状态
     */
    reset() {
        this.cleanupCount = 0;
        this.lastCleanupTime = 0;
        this.loadingElements.clear();
        this.cleanupInProgress = false;
        console.log('🔄 加载屏幕管理器状态已重置');
    }
}

// 立即创建优化的加载屏幕管理器实例
if (!window.optimizedLoadingManager) {
    window.optimizedLoadingManager = new OptimizedLoadingManager();
}

console.log('🧹 优化的加载屏幕管理器脚本加载完成');
