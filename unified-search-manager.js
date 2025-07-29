/**
 * 🎯 统一搜索事件管理器
 * 解决多个脚本重复绑定搜索事件的问题
 * 提供统一、高效的搜索功能管理
 */

(function() {
    'use strict';
    
    console.log('🎯 统一搜索管理器开始加载...');
    
    // 配置选项
    const CONFIG = {
        debug: false,                    // 生产环境关闭调试
        searchInputId: 'searchInput',    // 搜索框ID
        maxRetries: 5,                   // 最大重试次数
        retryDelay: 200,                 // 重试间隔(ms)
        initDelay: 100                   // 初始化延迟(ms)
    };
    
    /**
     * 统一搜索管理器类
     */
    class UnifiedSearchManager {
        constructor() {
            this.isInitialized = false;
            this.searchInput = null;
            this.retryCount = 0;
            this.eventsBound = false;
            this.performSearchFunction = null;
        }
        
        /**
         * 调试日志
         */
        log(message, type = 'info') {
            if (!CONFIG.debug) return;
            
            const prefix = '🎯 统一搜索:';
            switch(type) {
                case 'success':
                    console.log(`${prefix} ✅ ${message}`);
                    break;
                case 'error':
                    console.error(`${prefix} ❌ ${message}`);
                    break;
                case 'warn':
                    console.warn(`${prefix} ⚠️ ${message}`);
                    break;
                default:
                    console.log(`${prefix} ${message}`);
            }
        }
        
        /**
         * 初始化管理器
         */
        async init() {
            if (this.isInitialized) {
                this.log('管理器已初始化，跳过重复初始化', 'warn');
                return;
            }
            
            this.log('开始初始化统一搜索管理器...');
            
            try {
                // 等待搜索框出现
                await this.waitForSearchInput();
                
                // 清理现有事件绑定
                this.cleanupExistingBindings();
                
                // 绑定统一事件
                this.bindUnifiedEvents();
                
                // 设置搜索函数
                this.setupSearchFunction();
                
                this.isInitialized = true;
                this.log('统一搜索管理器初始化完成', 'success');
                
            } catch (error) {
                this.log(`初始化失败: ${error.message}`, 'error');
                
                // 重试机制
                if (this.retryCount < CONFIG.maxRetries) {
                    this.retryCount++;
                    this.log(`${CONFIG.retryDelay}ms后进行第${this.retryCount}次重试...`, 'warn');
                    setTimeout(() => this.init(), CONFIG.retryDelay);
                } else {
                    this.log('达到最大重试次数，初始化失败', 'error');
                }
            }
        }
        
        /**
         * 等待搜索框元素出现
         */
        waitForSearchInput() {
            return new Promise((resolve, reject) => {
                const startTime = Date.now();
                const timeout = 10000; // 10秒超时
                
                const checkForInput = () => {
                    this.searchInput = document.getElementById(CONFIG.searchInputId);
                    
                    if (this.searchInput) {
                        this.log('搜索框元素已找到', 'success');
                        resolve();
                    } else if (Date.now() - startTime > timeout) {
                        reject(new Error('等待搜索框超时'));
                    } else {
                        setTimeout(checkForInput, 100);
                    }
                };
                
                checkForInput();
            });
        }
        
        /**
         * 清理现有的事件绑定
         */
        cleanupExistingBindings() {
            if (!this.searchInput) return;
            
            this.log('清理现有的事件绑定...');
            
            // 移除所有可能的标记
            const markers = [
                'data-main-search-bound',
                'data-search-bound', 
                'data-search-fix-bound',
                'data-lightweight-fix-applied',
                'data-unified-search-bound'
            ];
            
            markers.forEach(marker => {
                if (this.searchInput.hasAttribute(marker)) {
                    this.searchInput.removeAttribute(marker);
                    this.log(`移除标记: ${marker}`);
                }
            });
            
            // 克隆元素来移除所有事件监听器
            const newSearchInput = this.searchInput.cloneNode(true);
            this.searchInput.parentNode.replaceChild(newSearchInput, this.searchInput);
            this.searchInput = newSearchInput;
            
            this.log('现有事件绑定已清理', 'success');
        }
        
        /**
         * 绑定统一事件
         */
        bindUnifiedEvents() {
            if (!this.searchInput || this.eventsBound) return;
            
            this.log('绑定统一搜索事件...');
            
            // 主要的回车键事件监听器
            const keypressHandler = (event) => {
                if (event.key === 'Enter' || event.keyCode === 13 || event.which === 13) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.log('回车键被按下，执行搜索', 'success');
                    this.executeSearch('enter-key');
                    return false;
                }
            };
            
            // 绑定事件 (使用捕获阶段确保优先执行)
            this.searchInput.addEventListener('keypress', keypressHandler, true);
            
            // 备用的keydown事件
            const keydownHandler = (event) => {
                if (event.key === 'Enter' || event.keyCode === 13 || event.which === 13) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.log('keydown回车键被按下，执行搜索', 'success');
                    this.executeSearch('keydown');
                    return false;
                }
            };
            
            this.searchInput.addEventListener('keydown', keydownHandler, true);
            
            // 全局监听作为最后保障
            const globalHandler = (event) => {
                if (event.target && event.target.id === CONFIG.searchInputId && 
                    (event.key === 'Enter' || event.keyCode === 13)) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.log('全局监听捕获回车键', 'success');
                    this.executeSearch('global-listener');
                    return false;
                }
            };
            
            document.addEventListener('keypress', globalHandler, true);
            document.addEventListener('keydown', globalHandler, true);
            
            // 标记已绑定
            this.searchInput.setAttribute('data-unified-search-bound', 'true');
            this.eventsBound = true;
            
            this.log('统一搜索事件绑定完成', 'success');
        }
        
        /**
         * 设置搜索函数
         */
        setupSearchFunction() {
            // 查找可用的搜索函数
            const searchFunctions = [
                () => window.performSearch,
                () => window.performHeaderSearch,
                () => this.searchInput?.closest('form')?.onsubmit
            ];
            
            for (const getFn of searchFunctions) {
                const fn = getFn();
                if (typeof fn === 'function') {
                    this.performSearchFunction = fn;
                    this.log(`找到搜索函数: ${fn.name || 'anonymous'}`, 'success');
                    break;
                }
            }
            
            if (!this.performSearchFunction) {
                this.log('未找到现有搜索函数，使用默认实现', 'warn');
                this.performSearchFunction = this.defaultSearchFunction.bind(this);
            }
        }
        
        /**
         * 执行搜索
         */
        executeSearch(source = 'unified-manager') {
            if (!this.searchInput) {
                this.log('搜索框不存在，无法执行搜索', 'error');
                return;
            }
            
            const searchTerm = this.searchInput.value.trim();
            if (!searchTerm) {
                this.log('搜索词为空，跳过搜索', 'warn');
                return;
            }
            
            this.log(`执行搜索 - 来源: ${source}, 关键词: "${searchTerm}"`);
            
            try {
                if (this.performSearchFunction) {
                    this.performSearchFunction();
                    this.log('搜索执行成功', 'success');
                } else {
                    this.log('搜索函数不可用，使用默认实现', 'warn');
                    this.defaultSearchFunction();
                }
            } catch (error) {
                this.log(`搜索执行失败: ${error.message}`, 'error');
                this.defaultSearchFunction();
            }
        }
        
        /**
         * 默认搜索函数
         */
        defaultSearchFunction() {
            const searchTerm = this.searchInput.value.trim();
            if (!searchTerm) return;
            
            this.log(`使用默认搜索实现 - 关键词: "${searchTerm}"`);
            
            // 智能判断跳转路径
            const currentPath = window.location.pathname;
            let targetUrl;
            
            if (currentPath === '/' || currentPath.includes('index.html')) {
                targetUrl = `pages/products.html?search=${encodeURIComponent(searchTerm)}`;
            } else if (currentPath.includes('/pages/')) {
                targetUrl = `products.html?search=${encodeURIComponent(searchTerm)}`;
            } else {
                targetUrl = `pages/products.html?search=${encodeURIComponent(searchTerm)}`;
            }
            
            this.log(`跳转到: ${targetUrl}`);
            window.location.href = targetUrl;
        }
        
        /**
         * 手动重新初始化
         */
        reinitialize() {
            this.log('手动重新初始化...');
            this.isInitialized = false;
            this.eventsBound = false;
            this.retryCount = 0;
            this.init();
        }
        
        /**
         * 获取状态信息
         */
        getStatus() {
            return {
                isInitialized: this.isInitialized,
                eventsBound: this.eventsBound,
                searchInputExists: !!this.searchInput,
                performSearchFunctionExists: !!this.performSearchFunction,
                retryCount: this.retryCount
            };
        }
    }
    
    // 创建全局实例
    window.unifiedSearchManager = new UnifiedSearchManager();
    
    // 自动初始化
    function autoInit() {
        if (document.readyState === 'complete') {
            setTimeout(() => {
                window.unifiedSearchManager.init();
            }, CONFIG.initDelay);
        } else {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    window.unifiedSearchManager.init();
                }, CONFIG.initDelay);
            });
        }
    }
    
    // DOM内容加载完成后也尝试初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                if (!window.unifiedSearchManager.isInitialized) {
                    window.unifiedSearchManager.init();
                }
            }, CONFIG.initDelay);
        });
    }
    
    // 监听页头组件加载完成事件
    document.addEventListener('headerComponentLoaded', () => {
        setTimeout(() => {
            if (!window.unifiedSearchManager.isInitialized) {
                window.unifiedSearchManager.init();
            }
        }, CONFIG.initDelay);
    });
    
    // 立即尝试初始化
    autoInit();
    
    // 导出调试接口
    if (CONFIG.debug) {
        window.searchManagerDebug = {
            reinit: () => window.unifiedSearchManager.reinitialize(),
            status: () => window.unifiedSearchManager.getStatus(),
            test: (keyword = 'test') => {
                const input = document.getElementById(CONFIG.searchInputId);
                if (input) {
                    input.value = keyword;
                    window.unifiedSearchManager.executeSearch('debug-test');
                }
            }
        };
    }
    
    console.log('🎯 统一搜索管理器已加载');
    
})();
