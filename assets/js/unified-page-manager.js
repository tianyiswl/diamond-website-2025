/**
 * 🚀 统一页面管理器 - 无锡皇德国际贸易有限公司
 * 解决重复功能和无用加载问题的核心管理器
 * 
 * 功能：
 * - 页面类型检测和按需加载
 * - 数据缓存管理
 * - 防抖机制优化
 * - 统一事件管理
 * - 性能监控和优化
 */

class UnifiedPageManager {
    constructor() {
        this.pageType = this.detectPageType();
        this.loadedModules = new Set();
        this.dataCache = new Map();
        this.eventListeners = new Map();
        this.isInitialized = false;
        this.loadingScreenCleanupCount = 0;
        this.lastCleanupTime = 0;
        
        // 防抖函数缓存
        this.debouncedFunctions = new Map();
        
        console.log(`🎯 统一页面管理器初始化 - 页面类型: ${this.pageType}`);
        
        // 立即初始化核心功能
        this.init();
    }
    
    /**
     * 检测当前页面类型
     */
    detectPageType() {
        const path = window.location.pathname;
        const url = window.location.href;
        
        if (path.includes('products.html') || path.includes('/products')) {
            return 'products';
        } else if (path.includes('product-detail.html') || path.includes('/product-detail')) {
            return 'product-detail';
        } else if (path.includes('index.html') || path === '/' || url.includes('index.html')) {
            return 'home';
        } else if (path.includes('contact.html') || path.includes('/contact')) {
            return 'contact';
        } else if (path.includes('about.html') || path.includes('/about')) {
            return 'about';
        }
        
        return 'unknown';
    }
    
    /**
     * 初始化页面管理器
     */
    async init() {
        if (this.isInitialized) {
            console.log('⚠️ 统一页面管理器已初始化，跳过重复初始化');
            return;
        }
        
        try {
            console.log('🚀 开始初始化统一页面管理器...');
            
            // 1. 设置全局引用
            window.unifiedPageManager = this;
            
            // 2. 初始化防抖函数
            this.initDebouncedFunctions();
            
            // 3. 按页面类型加载必要模块
            await this.loadPageSpecificModules();
            
            // 4. 初始化数据缓存
            this.initDataCache();
            
            // 5. 统一事件管理
            this.initEventManagement();
            
            // 6. 优化加载屏幕清理
            this.optimizeLoadingScreenCleanup();
            
            this.isInitialized = true;
            console.log('✅ 统一页面管理器初始化完成');
            
        } catch (error) {
            console.error('❌ 统一页面管理器初始化失败:', error);
        }
    }
    
    /**
     * 初始化防抖函数
     */
    initDebouncedFunctions() {
        // 加载屏幕清理防抖
        this.debouncedFunctions.set('loadingScreenCleanup', this.debounce(() => {
            this.performLoadingScreenCleanup();
        }, 100));
        
        // 数据保存防抖
        this.debouncedFunctions.set('dataSave', this.debounce((key, data) => {
            this.saveToCache(key, data);
        }, 200));
        
        // 分析数据发送防抖
        this.debouncedFunctions.set('analyticsSubmit', this.debounce((data) => {
            this.submitAnalytics(data);
        }, 1000));
        
        console.log('✅ 防抖函数初始化完成');
    }
    
    /**
     * 按页面类型加载必要模块
     */
    async loadPageSpecificModules() {
        console.log(`📦 开始加载 ${this.pageType} 页面特定模块...`);
        
        switch (this.pageType) {
            case 'home':
                await this.loadHomePageModules();
                break;
            case 'products':
                await this.loadProductsPageModules();
                break;
            case 'product-detail':
                await this.loadProductDetailModules();
                break;
            default:
                await this.loadCommonModules();
                break;
        }
        
        console.log(`✅ ${this.pageType} 页面模块加载完成`);
    }
    
    /**
     * 加载首页模块
     */
    async loadHomePageModules() {
        const modules = [
            'carousel',
            'homepage-products',
            'company-info',
            'contact-forms'
        ];
        
        for (const module of modules) {
            if (!this.loadedModules.has(module)) {
                await this.loadModule(module);
            }
        }
    }
    
    /**
     * 加载产品页面模块
     */
    async loadProductsPageModules() {
        const modules = [
            'product-filter',
            'product-search',
            'product-pagination',
            'company-info'
        ];
        
        for (const module of modules) {
            if (!this.loadedModules.has(module)) {
                await this.loadModule(module);
            }
        }
        
        // 产品页面不需要轮播图
        console.log('🚫 产品页面跳过轮播图模块加载');
    }
    
    /**
     * 加载通用模块
     */
    async loadCommonModules() {
        const modules = [
            'company-info',
            'contact-forms'
        ];
        
        for (const module of modules) {
            if (!this.loadedModules.has(module)) {
                await this.loadModule(module);
            }
        }
    }
    
    /**
     * 加载单个模块
     */
    async loadModule(moduleName) {
        if (this.loadedModules.has(moduleName)) {
            console.log(`⚠️ 模块 ${moduleName} 已加载，跳过重复加载`);
            return;
        }
        
        try {
            console.log(`📦 开始加载模块: ${moduleName}`);
            
            switch (moduleName) {
                case 'carousel':
                    if (this.pageType === 'home') {
                        // 只在首页加载轮播图
                        this.loadedModules.add(moduleName);
                    }
                    break;
                case 'product-filter':
                    // 产品筛选功能
                    this.loadedModules.add(moduleName);
                    break;
                case 'product-search':
                    // 统一搜索功能
                    await this.initUnifiedSearch();
                    this.loadedModules.add(moduleName);
                    break;
                case 'company-info':
                    // 公司信息（单例模式）
                    await this.loadCompanyInfo();
                    this.loadedModules.add(moduleName);
                    break;
                default:
                    this.loadedModules.add(moduleName);
                    break;
            }
            
            console.log(`✅ 模块 ${moduleName} 加载完成`);
            
        } catch (error) {
            console.error(`❌ 模块 ${moduleName} 加载失败:`, error);
        }
    }
    
    /**
     * 初始化数据缓存
     */
    initDataCache() {
        // 设置缓存过期时间（5分钟）
        this.cacheExpireTime = 5 * 60 * 1000;
        
        console.log('💾 数据缓存系统初始化完成');
    }
    
    /**
     * 获取缓存数据
     */
    getFromCache(key) {
        const cached = this.dataCache.get(key);
        if (!cached) return null;
        
        const now = Date.now();
        if (now - cached.timestamp > this.cacheExpireTime) {
            this.dataCache.delete(key);
            return null;
        }
        
        console.log(`💾 从缓存获取数据: ${key}`);
        return cached.data;
    }
    
    /**
     * 保存数据到缓存
     */
    saveToCache(key, data) {
        this.dataCache.set(key, {
            data: data,
            timestamp: Date.now()
        });
        console.log(`💾 数据已缓存: ${key}`);
    }
    
    /**
     * 防抖函数工具
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
     * 优化加载屏幕清理
     */
    optimizeLoadingScreenCleanup() {
        // 替换全局的加载屏幕清理函数
        if (window.forceRemoveLoadingScreens) {
            window.originalForceRemoveLoadingScreens = window.forceRemoveLoadingScreens;
            window.forceRemoveLoadingScreens = () => {
                this.debouncedFunctions.get('loadingScreenCleanup')();
            };
        }
        
        console.log('🧹 加载屏幕清理优化完成');
    }
    
    /**
     * 执行加载屏幕清理
     */
    performLoadingScreenCleanup() {
        const now = Date.now();
        if (now - this.lastCleanupTime < 50) {
            return; // 防止过于频繁的清理
        }
        
        this.loadingScreenCleanupCount++;
        this.lastCleanupTime = now;
        
        if (window.originalForceRemoveLoadingScreens) {
            window.originalForceRemoveLoadingScreens();
        }
        
        console.log(`🧹 执行加载屏幕清理 (第${this.loadingScreenCleanupCount}次)`);
    }
    
    /**
     * 统一事件管理
     */
    initEventManagement() {
        // 防止重复绑定DOMContentLoaded事件
        if (!this.eventListeners.has('DOMContentLoaded')) {
            const handler = () => {
                console.log('📄 统一页面管理器 - DOM准备完成');
                this.onDOMReady();
            };
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', handler);
            } else {
                // DOM已经准备好了
                setTimeout(handler, 0);
            }
            
            this.eventListeners.set('DOMContentLoaded', handler);
        }
        
        console.log('🎯 统一事件管理初始化完成');
    }
    
    /**
     * DOM准备完成后的处理
     */
    onDOMReady() {
        console.log('🎯 统一页面管理器 - 开始DOM准备后处理');
        
        // 这里可以添加DOM准备后需要执行的统一逻辑
        this.optimizeExistingScripts();
    }
    
    /**
     * 优化现有脚本
     */
    optimizeExistingScripts() {
        // 防止轮播图在非首页初始化
        if (this.pageType !== 'home' && window.CarouselManager) {
            console.log('🚫 非首页环境，禁用轮播图初始化');
            // 可以在这里添加禁用逻辑
        }

        // 禁用重复的脚本功能
        this.disableDuplicateScripts();

        // 优化脚本性能
        this.optimizeScriptPerformance();

        console.log('⚡ 现有脚本优化完成');
    }

    /**
     * 初始化统一搜索
     */
    async initUnifiedSearch() {
        // 统一搜索功能已由 UnifiedSearchManager 处理
        console.log('🔍 统一搜索功能由 UnifiedSearchManager 管理');
    }

    /**
     * 加载公司信息（单例模式）
     */
    async loadCompanyInfo() {
        try {
            // 使用统一数据管理器获取公司信息
            if (window.unifiedDataManager) {
                const companyInfo = await window.unifiedDataManager.getCompanyInfo();
                console.log('🏢 公司信息加载完成（统一数据管理器）');
                return companyInfo;
            } else {
                console.warn('⚠️ 统一数据管理器未找到，使用传统方式加载公司信息');
                // 传统方式加载
                const response = await fetch('/api/db/company');
                const data = await response.json();
                return data;
            }
        } catch (error) {
            console.error('❌ 公司信息加载失败:', error);
            throw error;
        }
    }

    /**
     * 禁用重复的脚本功能
     */
    disableDuplicateScripts() {
        // 禁用重复的轮播图初始化
        if (this.pageType !== 'home') {
            window.disableCarouselInit = true;

            // 如果CarouselManager已存在，禁用它
            if (window.CarouselManager) {
                console.log('🚫 非首页环境，禁用轮播图管理器');
                window.CarouselManager.prototype.init = function() {
                    console.log('⏭️ 轮播图初始化已被跳过（非首页）');
                };
            }
        }

        // 禁用重复的搜索脚本
        if (window.unifiedSearchManager) {
            window.searchManagerActive = true;

            // 禁用其他搜索脚本的初始化
            ['searchFix', 'productSearchFix', 'lightweightSearchFix'].forEach(scriptName => {
                window[scriptName + 'Disabled'] = true;
            });
        }

        // 禁用重复的分析脚本
        if (window.unifiedAnalyticsManager) {
            window.analyticsManagerActive = true;
        }

        console.log('🚫 重复脚本功能已禁用');
    }

    /**
     * 优化现有脚本性能
     */
    optimizeScriptPerformance() {
        // 优化DOM查询
        this.cacheCommonElements();

        // 优化事件监听器
        this.optimizeEventListeners();

        // 优化定时器
        this.optimizeTimers();

        console.log('⚡ 脚本性能优化完成');
    }

    /**
     * 缓存常用DOM元素
     */
    cacheCommonElements() {
        this.cachedElements = {
            searchInputs: document.querySelectorAll('input[placeholder*="搜索"]'),
            productGrid: document.querySelector('.products-grid'),
            loadingElements: document.querySelectorAll('.loading, #loading'),
            navigationLinks: document.querySelectorAll('nav a'),
            contactForms: document.querySelectorAll('form')
        };

        console.log('💾 常用DOM元素已缓存');
    }

    /**
     * 优化事件监听器
     */
    optimizeEventListeners() {
        // 使用事件委托减少监听器数量
        if (this.cachedElements.productGrid) {
            this.cachedElements.productGrid.addEventListener('click', (e) => {
                if (e.target.matches('.product-card a, .product-card button')) {
                    this.handleProductInteraction(e);
                }
            });
        }

        console.log('🎯 事件监听器已优化');
    }

    /**
     * 处理产品交互
     */
    handleProductInteraction(event) {
        const target = event.target;
        const productCard = target.closest('.product-card');

        if (productCard) {
            const productName = productCard.querySelector('h3')?.textContent;
            const productId = productCard.dataset.productId;

            // 使用统一分析管理器跟踪
            if (window.unifiedAnalyticsManager) {
                if (target.textContent.includes('查看详情')) {
                    window.unifiedAnalyticsManager.trackProductView(productId, productName);
                } else if (target.textContent.includes('询价')) {
                    window.unifiedAnalyticsManager.trackInteraction('inquiry', 'product', {
                        productId: productId,
                        productName: productName
                    });
                }
            }
        }
    }

    /**
     * 优化定时器
     */
    optimizeTimers() {
        // 清理可能存在的重复定时器
        if (window.performanceCheckInterval) {
            clearInterval(window.performanceCheckInterval);
        }

        // 设置统一的性能检查定时器
        window.performanceCheckInterval = setInterval(() => {
            this.performPerformanceCheck();
        }, 30000); // 30秒检查一次

        console.log('⏰ 定时器已优化');
    }

    /**
     * 执行性能检查
     */
    performPerformanceCheck() {
        const stats = {
            memoryUsage: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            } : null,
            loadingCleanups: window.optimizedLoadingManager?.getCleanupStats().cleanupCount || 0,
            pendingAnalytics: window.unifiedAnalyticsManager?.getAnalyticsStats().pendingCount || 0,
            cachedData: window.unifiedDataManager?.getCacheStats().totalItems || 0
        };

        console.log('📊 性能检查结果:', stats);

        // 如果内存使用过高，执行清理
        if (stats.memoryUsage && stats.memoryUsage.used > 50) {
            console.log('🧹 内存使用过高，执行清理');
            this.performMemoryCleanup();
        }
    }

    /**
     * 执行内存清理
     */
    performMemoryCleanup() {
        // 清理过期缓存
        if (window.unifiedDataManager) {
            window.unifiedDataManager.clearCache();
        }

        // 清理已发送的分析数据
        if (window.unifiedAnalyticsManager) {
            window.unifiedAnalyticsManager.sentData.clear();
        }

        // 强制垃圾回收（如果支持）
        if (window.gc) {
            window.gc();
        }

        console.log('🧹 内存清理完成');
    }
}

// 立即创建统一页面管理器实例
if (!window.unifiedPageManager) {
    window.unifiedPageManager = new UnifiedPageManager();
}

console.log('🚀 统一页面管理器脚本加载完成');
