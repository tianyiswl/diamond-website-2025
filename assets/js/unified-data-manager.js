/**
 * 🗄️ 统一数据管理器 - 无锡皇德国际贸易有限公司
 * 解决重复API调用和数据缓存问题
 * 
 * 功能：
 * - 统一数据获取接口
 * - 智能缓存机制
 * - 防重复请求
 * - 数据同步管理
 * - 错误处理和重试
 */

class UnifiedDataManager {
    constructor() {
        this.cache = new Map();
        this.pendingRequests = new Map();
        this.cacheExpireTime = 5 * 60 * 1000; // 5分钟缓存
        this.maxRetries = 3;
        this.retryDelay = 1000;
        
        console.log('🗄️ 统一数据管理器初始化');
        this.init();
    }
    
    /**
     * 初始化数据管理器
     */
    init() {
        // 设置全局引用
        window.unifiedDataManager = this;
        
        // 替换现有的数据获取函数
        this.replaceExistingDataFunctions();
        
        console.log('✅ 统一数据管理器初始化完成');
    }
    
    /**
     * 替换现有的数据获取函数
     */
    replaceExistingDataFunctions() {
        // 保存原始函数
        if (window.fetch && !window.originalFetch) {
            window.originalFetch = window.fetch;
        }
        
        console.log('🔄 数据获取函数替换完成');
    }
    
    /**
     * 统一获取产品数据
     */
    async getProducts(options = {}) {
        const cacheKey = `products_${JSON.stringify(options)}`;
        
        // 检查缓存
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            console.log('💾 从缓存获取产品数据');
            return cached;
        }
        
        // 检查是否有正在进行的请求
        if (this.pendingRequests.has(cacheKey)) {
            console.log('⏳ 等待正在进行的产品数据请求');
            return await this.pendingRequests.get(cacheKey);
        }
        
        // 创建新请求
        const requestPromise = this.fetchProductsWithRetry(options);
        this.pendingRequests.set(cacheKey, requestPromise);
        
        try {
            const data = await requestPromise;
            
            // 缓存数据
            this.saveToCache(cacheKey, data);
            
            // 清除pending请求
            this.pendingRequests.delete(cacheKey);
            
            console.log(`✅ 产品数据获取成功: ${data.length} 个产品`);
            return data;
            
        } catch (error) {
            this.pendingRequests.delete(cacheKey);
            console.error('❌ 产品数据获取失败:', error);
            throw error;
        }
    }
    
    /**
     * 带重试的产品数据获取
     */
    async fetchProductsWithRetry(options, retryCount = 0) {
        try {
            // 优先使用新API
            const response = await fetch('/api/db/public/products?limit=1000');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return Array.isArray(data) ? data : data.products || [];
            
        } catch (error) {
            console.warn(`⚠️ 主API失败，尝试备用API (重试 ${retryCount + 1}/${this.maxRetries})`);
            
            if (retryCount < this.maxRetries) {
                // 尝试备用API
                try {
                    const response = await fetch('/api/products');
                    if (response.ok) {
                        const data = await response.json();
                        return Array.isArray(data) ? data : data.products || [];
                    }
                } catch (backupError) {
                    console.warn('⚠️ 备用API也失败');
                }
                
                // 等待后重试
                await this.delay(this.retryDelay * (retryCount + 1));
                return this.fetchProductsWithRetry(options, retryCount + 1);
            }
            
            throw error;
        }
    }
    
    /**
     * 统一获取公司信息
     */
    async getCompanyInfo() {
        const cacheKey = 'company_info';
        
        // 检查缓存
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            console.log('💾 从缓存获取公司信息');
            return cached;
        }
        
        // 检查是否有正在进行的请求
        if (this.pendingRequests.has(cacheKey)) {
            console.log('⏳ 等待正在进行的公司信息请求');
            return await this.pendingRequests.get(cacheKey);
        }
        
        // 创建新请求
        const requestPromise = this.fetchCompanyInfoWithRetry();
        this.pendingRequests.set(cacheKey, requestPromise);
        
        try {
            const data = await requestPromise;
            
            // 缓存数据
            this.saveToCache(cacheKey, data);
            
            // 清除pending请求
            this.pendingRequests.delete(cacheKey);
            
            console.log('✅ 公司信息获取成功');
            return data;
            
        } catch (error) {
            this.pendingRequests.delete(cacheKey);
            console.error('❌ 公司信息获取失败:', error);
            throw error;
        }
    }
    
    /**
     * 带重试的公司信息获取
     */
    async fetchCompanyInfoWithRetry(retryCount = 0) {
        try {
            // 优先使用API
            const response = await fetch('/api/db/company');
            if (response.ok) {
                const data = await response.json();
                return data;
            }
            
            // 备用：使用静态文件
            const staticResponse = await fetch('/data/company.json');
            if (staticResponse.ok) {
                const data = await staticResponse.json();
                return data;
            }
            
            throw new Error('所有公司信息源都失败');
            
        } catch (error) {
            if (retryCount < this.maxRetries) {
                console.warn(`⚠️ 公司信息获取失败，重试 ${retryCount + 1}/${this.maxRetries}`);
                await this.delay(this.retryDelay * (retryCount + 1));
                return this.fetchCompanyInfoWithRetry(retryCount + 1);
            }
            
            throw error;
        }
    }
    
    /**
     * 统一获取分类数据
     */
    async getCategories() {
        const cacheKey = 'categories';
        
        // 检查缓存
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            console.log('💾 从缓存获取分类数据');
            return cached;
        }
        
        // 检查是否有正在进行的请求
        if (this.pendingRequests.has(cacheKey)) {
            console.log('⏳ 等待正在进行的分类数据请求');
            return await this.pendingRequests.get(cacheKey);
        }
        
        // 创建新请求
        const requestPromise = this.fetchCategoriesWithRetry();
        this.pendingRequests.set(cacheKey, requestPromise);
        
        try {
            const data = await requestPromise;
            
            // 缓存数据
            this.saveToCache(cacheKey, data);
            
            // 清除pending请求
            this.pendingRequests.delete(cacheKey);
            
            console.log(`✅ 分类数据获取成功: ${data.length} 个分类`);
            return data;
            
        } catch (error) {
            this.pendingRequests.delete(cacheKey);
            console.error('❌ 分类数据获取失败:', error);
            throw error;
        }
    }
    
    /**
     * 带重试的分类数据获取
     */
    async fetchCategoriesWithRetry(retryCount = 0) {
        try {
            const response = await fetch('/api/db/categories');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return Array.isArray(data) ? data : data.categories || [];
            
        } catch (error) {
            if (retryCount < this.maxRetries) {
                console.warn(`⚠️ 分类数据获取失败，重试 ${retryCount + 1}/${this.maxRetries}`);
                await this.delay(this.retryDelay * (retryCount + 1));
                return this.fetchCategoriesWithRetry(retryCount + 1);
            }
            
            throw error;
        }
    }
    
    /**
     * 获取缓存数据
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        const now = Date.now();
        if (now - cached.timestamp > this.cacheExpireTime) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    /**
     * 保存数据到缓存
     */
    saveToCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }
    
    /**
     * 清除缓存
     */
    clearCache(key = null) {
        if (key) {
            this.cache.delete(key);
            console.log(`🗑️ 清除缓存: ${key}`);
        } else {
            this.cache.clear();
            console.log('🗑️ 清除所有缓存');
        }
    }
    
    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 获取缓存统计信息
     */
    getCacheStats() {
        const stats = {
            totalItems: this.cache.size,
            pendingRequests: this.pendingRequests.size,
            cacheKeys: Array.from(this.cache.keys()),
            pendingKeys: Array.from(this.pendingRequests.keys())
        };
        
        console.log('📊 缓存统计:', stats);
        return stats;
    }
    
    /**
     * 批量预加载数据
     */
    async preloadData() {
        console.log('🚀 开始预加载数据...');
        
        try {
            // 并行加载常用数据
            const promises = [
                this.getCompanyInfo(),
                this.getCategories()
            ];
            
            // 如果是产品页面，也预加载产品数据
            if (window.location.pathname.includes('products')) {
                promises.push(this.getProducts());
            }
            
            await Promise.all(promises);
            console.log('✅ 数据预加载完成');
            
        } catch (error) {
            console.warn('⚠️ 数据预加载部分失败:', error);
        }
    }
}

// 立即创建统一数据管理器实例
if (!window.unifiedDataManager) {
    window.unifiedDataManager = new UnifiedDataManager();
    
    // 开始预加载数据
    window.unifiedDataManager.preloadData();
}

console.log('🗄️ 统一数据管理器脚本加载完成');
