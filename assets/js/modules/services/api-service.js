/**
 * 🌐 统一API服务类
 * 
 * 功能：
 * - 统一所有API调用
 * - 错误处理和重试机制
 * - 请求拦截和响应处理
 * - 缓存管理
 * 
 * 作者：AI助手
 * 创建时间：2025-06-30
 */

class ApiService {
    constructor() {
        this.baseURL = '';
        this.timeout = 10000; // 10秒超时
        this.cache = new Map();
        this.retryCount = 3;
        
        // 请求拦截器
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        
        console.log('📡 ApiService 初始化完成');
    }

    /**
     * 添加请求拦截器
     * @param {Function} interceptor 拦截器函数
     */
    addRequestInterceptor(interceptor) {
        this.requestInterceptors.push(interceptor);
    }

    /**
     * 添加响应拦截器
     * @param {Function} interceptor 拦截器函数
     */
    addResponseInterceptor(interceptor) {
        this.responseInterceptors.push(interceptor);
    }

    /**
     * 生成缓存键
     * @param {string} url 
     * @param {object} options 
     * @returns {string}
     */
    getCacheKey(url, options = {}) {
        const method = options.method || 'GET';
        const body = options.body || '';
        return `${method}:${url}:${body}`;
    }

    /**
     * 检查缓存
     * @param {string} cacheKey 
     * @param {number} maxAge 缓存最大年龄（毫秒）
     * @returns {any|null}
     */
    getFromCache(cacheKey, maxAge = 5 * 60 * 1000) {
        const cached = this.cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < maxAge) {
            console.log(`📦 从缓存加载: ${cacheKey}`);
            return cached.data;
        }
        return null;
    }

    /**
     * 设置缓存
     * @param {string} cacheKey 
     * @param {any} data 
     */
    setCache(cacheKey, data) {
        this.cache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
        });
    }

    /**
     * 清除缓存
     * @param {string} pattern 缓存键模式（可选）
     */
    clearCache(pattern = null) {
        if (pattern) {
            for (const key of this.cache.keys()) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
        console.log('🗑️ 缓存已清除');
    }

    /**
     * 基础请求方法
     * @param {string} url 
     * @param {object} options 
     * @returns {Promise}
     */
    async request(url, options = {}) {
        // 应用请求拦截器
        for (const interceptor of this.requestInterceptors) {
            options = await interceptor(options) || options;
        }

        const fullURL = this.baseURL + url;
        const cacheKey = this.getCacheKey(fullURL, options);

        // 检查缓存（仅对GET请求）
        if (!options.method || options.method === 'GET') {
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return cached;
            }
        }

        // 设置默认选项
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            timeout: this.timeout,
            ...options
        };

        let lastError;
        
        // 重试机制
        for (let attempt = 1; attempt <= this.retryCount; attempt++) {
            try {
                console.log(`📡 API请求 (尝试 ${attempt}/${this.retryCount}): ${defaultOptions.method} ${fullURL}`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);
                
                const response = await fetch(fullURL, {
                    ...defaultOptions,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);

                // 应用响应拦截器
                let processedResponse = response;
                for (const interceptor of this.responseInterceptors) {
                    processedResponse = await interceptor(processedResponse) || processedResponse;
                }

                if (!processedResponse.ok) {
                    throw new Error(`HTTP ${processedResponse.status}: ${processedResponse.statusText}`);
                }

                const data = await processedResponse.json();
                
                // 缓存成功的GET请求
                if (!options.method || options.method === 'GET') {
                    this.setCache(cacheKey, data);
                }

                console.log(`✅ API请求成功: ${fullURL}`);
                return data;

            } catch (error) {
                lastError = error;
                console.warn(`⚠️ API请求失败 (尝试 ${attempt}/${this.retryCount}): ${error.message}`);
                
                // 如果不是最后一次尝试，等待后重试
                if (attempt < this.retryCount) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }

        console.error(`❌ API请求最终失败: ${fullURL}`, lastError);
        throw lastError;
    }

    /**
     * GET请求
     * @param {string} url 
     * @param {object} options 
     * @returns {Promise}
     */
    async get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' });
    }

    /**
     * POST请求
     * @param {string} url 
     * @param {any} data 
     * @param {object} options 
     * @returns {Promise}
     */
    async post(url, data = null, options = {}) {
        return this.request(url, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined
        });
    }

    /**
     * PUT请求
     * @param {string} url 
     * @param {any} data 
     * @param {object} options 
     * @returns {Promise}
     */
    async put(url, data = null, options = {}) {
        return this.request(url, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined
        });
    }

    /**
     * DELETE请求
     * @param {string} url 
     * @param {object} options 
     * @returns {Promise}
     */
    async delete(url, options = {}) {
        return this.request(url, { ...options, method: 'DELETE' });
    }

    /**
     * 上传文件
     * @param {string} url 
     * @param {FormData} formData 
     * @param {object} options 
     * @returns {Promise}
     */
    async upload(url, formData, options = {}) {
        const uploadOptions = {
            ...options,
            method: 'POST',
            body: formData,
            headers: {
                // 不设置Content-Type，让浏览器自动设置multipart/form-data
                ...options.headers
            }
        };
        
        // 移除Content-Type，让浏览器自动设置
        delete uploadOptions.headers['Content-Type'];
        
        return this.request(url, uploadOptions);
    }

    /**
     * 批量请求
     * @param {Array} requests 请求数组
     * @returns {Promise<Array>}
     */
    async batch(requests) {
        console.log(`📦 批量请求: ${requests.length} 个请求`);
        
        try {
            const results = await Promise.allSettled(
                requests.map(req => this.request(req.url, req.options))
            );
            
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.length - successful;
            
            console.log(`📊 批量请求完成: ${successful} 成功, ${failed} 失败`);
            
            return results.map(result => ({
                success: result.status === 'fulfilled',
                data: result.status === 'fulfilled' ? result.value : null,
                error: result.status === 'rejected' ? result.reason : null
            }));
            
        } catch (error) {
            console.error('❌ 批量请求失败:', error);
            throw error;
        }
    }

    /**
     * 获取网络状态
     * @returns {object}
     */
    getNetworkStatus() {
        return {
            online: navigator.onLine,
            connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection,
            cacheSize: this.cache.size
        };
    }

    /**
     * 健康检查
     * @returns {Promise<boolean>}
     */
    async healthCheck() {
        try {
            const start = performance.now();
            await this.get('/api/health');
            const duration = performance.now() - start;
            
            console.log(`💚 健康检查通过 (${duration.toFixed(0)}ms)`);
            return true;
        } catch (error) {
            console.error('💔 健康检查失败:', error);
            return false;
        }
    }
}

// 创建全局实例
window.apiService = new ApiService();

// 添加默认拦截器
window.apiService.addRequestInterceptor((options) => {
    // 添加时间戳防止缓存
    if (options.method === 'GET') {
        const url = new URL(options.url || '', window.location.origin);
        url.searchParams.set('_t', Date.now());
        options.url = url.pathname + url.search;
    }
    return options;
});

window.apiService.addResponseInterceptor((response) => {
    // 记录响应时间
    console.log(`⏱️ 响应时间: ${response.headers.get('x-response-time') || 'unknown'}`);
    return response;
});

// 监听网络状态变化
window.addEventListener('online', () => {
    console.log('🌐 网络已连接');
    window.apiService.clearCache(); // 清除缓存以获取最新数据
});

window.addEventListener('offline', () => {
    console.log('📴 网络已断开');
});

console.log('🚀 ApiService 模块加载完成');

// 导出（如果支持模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
} 