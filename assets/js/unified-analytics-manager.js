/**
 * 📊 统一分析管理器 - 无锡皇德国际贸易有限公司
 * 解决重复发送分析数据的问题，优化性能
 * 
 * 功能：
 * - 批量发送分析数据
 * - 防重复提交
 * - 智能缓存机制
 * - 离线数据存储
 * - 错误重试机制
 */

class UnifiedAnalyticsManager {
    constructor() {
        this.pendingData = [];
        this.sentData = new Set();
        this.batchSize = 10;
        this.batchInterval = 5000; // 5秒批量发送
        this.maxRetries = 3;
        this.retryDelay = 2000;
        this.isOnline = navigator.onLine;
        this.batchTimer = null;
        this.isInitialized = false;
        
        console.log('📊 统一分析管理器初始化');
        this.init();
    }
    
    /**
     * 初始化分析管理器
     */
    init() {
        if (this.isInitialized) {
            console.log('⚠️ 统一分析管理器已初始化，跳过重复初始化');
            return;
        }
        
        try {
            // 设置全局引用
            window.unifiedAnalyticsManager = this;
            
            // 替换现有的分析函数
            this.replaceExistingAnalyticsFunctions();
            
            // 监听网络状态
            this.monitorNetworkStatus();
            
            // 启动批量发送定时器
            this.startBatchTimer();
            
            // 加载离线数据
            this.loadOfflineData();
            
            // 监听页面卸载
            this.monitorPageUnload();
            
            this.isInitialized = true;
            console.log('✅ 统一分析管理器初始化完成');
            
        } catch (error) {
            console.error('❌ 统一分析管理器初始化失败:', error);
        }
    }
    
    /**
     * 替换现有的分析函数
     */
    replaceExistingAnalyticsFunctions() {
        // 保存原始分析对象
        if (window.analytics && !window.originalAnalytics) {
            window.originalAnalytics = window.analytics;
        }
        
        // 替换分析函数
        if (window.WebsiteAnalytics) {
            const originalSendAnalytics = window.WebsiteAnalytics.prototype.sendAnalytics;
            if (originalSendAnalytics && !window.WebsiteAnalytics.prototype.originalSendAnalytics) {
                window.WebsiteAnalytics.prototype.originalSendAnalytics = originalSendAnalytics;
                
                window.WebsiteAnalytics.prototype.sendAnalytics = function(data) {
                    window.unifiedAnalyticsManager.trackEvent(data);
                };
            }
        }
        
        console.log('🔄 分析函数已被统一管理器接管');
    }
    
    /**
     * 跟踪事件
     */
    trackEvent(data, options = {}) {
        try {
            // 生成数据唯一标识
            const dataId = this.generateDataId(data);
            
            // 检查是否已发送过
            if (this.sentData.has(dataId)) {
                console.log('⏭️ 跳过重复的分析数据');
                return;
            }
            
            // 标准化数据格式
            const standardizedData = this.standardizeData(data);
            
            // 添加到待发送队列
            this.pendingData.push({
                id: dataId,
                data: standardizedData,
                timestamp: Date.now(),
                retries: 0,
                options: options
            });
            
            console.log(`📊 添加分析数据到队列: ${dataId}`);
            
            // 如果队列满了或者是重要事件，立即发送
            if (this.pendingData.length >= this.batchSize || options.immediate) {
                this.sendBatch();
            }
            
        } catch (error) {
            console.error('❌ 跟踪事件失败:', error);
        }
    }
    
    /**
     * 生成数据唯一标识
     */
    generateDataId(data) {
        const key = JSON.stringify({
            page: data.page || window.location.pathname,
            event: data.event || data.type || 'pageview',
            timestamp: Math.floor((data.timestamp || Date.now()) / 1000) // 精确到秒
        });
        
        return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    }
    
    /**
     * 标准化数据格式
     */
    standardizeData(data) {
        return {
            page: data.page || window.location.pathname,
            event: data.event || data.type || 'pageview',
            timestamp: data.timestamp || Date.now(),
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            url: window.location.href,
            ...data
        };
    }
    
    /**
     * 发送批量数据
     */
    async sendBatch() {
        if (this.pendingData.length === 0) {
            return;
        }
        
        if (!this.isOnline) {
            console.log('📴 离线状态，保存数据到本地存储');
            this.saveOfflineData();
            return;
        }
        
        const batch = this.pendingData.splice(0, this.batchSize);
        console.log(`📊 发送批量分析数据: ${batch.length} 条`);
        
        try {
            const response = await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    events: batch.map(item => item.data),
                    batch: true,
                    timestamp: Date.now()
                })
            });
            
            if (response.ok) {
                // 标记为已发送
                batch.forEach(item => {
                    this.sentData.add(item.id);
                });
                
                console.log(`✅ 批量分析数据发送成功: ${batch.length} 条`);
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
        } catch (error) {
            console.warn('⚠️ 批量分析数据发送失败:', error);
            
            // 重试逻辑
            const retryableBatch = batch.filter(item => item.retries < this.maxRetries);
            retryableBatch.forEach(item => {
                item.retries++;
                this.pendingData.unshift(item); // 重新加入队列开头
            });
            
            if (retryableBatch.length > 0) {
                console.log(`🔄 将重试 ${retryableBatch.length} 条数据`);
                setTimeout(() => this.sendBatch(), this.retryDelay);
            }
        }
    }
    
    /**
     * 启动批量发送定时器
     */
    startBatchTimer() {
        if (this.batchTimer) {
            clearInterval(this.batchTimer);
        }
        
        this.batchTimer = setInterval(() => {
            if (this.pendingData.length > 0) {
                this.sendBatch();
            }
        }, this.batchInterval);
        
        console.log(`⏰ 批量发送定时器已启动 (间隔: ${this.batchInterval}ms)`);
    }
    
    /**
     * 监听网络状态
     */
    monitorNetworkStatus() {
        window.addEventListener('online', () => {
            console.log('🌐 网络已连接');
            this.isOnline = true;
            this.loadOfflineData();
            this.sendBatch();
        });
        
        window.addEventListener('offline', () => {
            console.log('📴 网络已断开');
            this.isOnline = false;
        });
    }
    
    /**
     * 监听页面卸载
     */
    monitorPageUnload() {
        window.addEventListener('beforeunload', () => {
            // 页面卸载前发送剩余数据
            if (this.pendingData.length > 0) {
                this.saveOfflineData();
                
                // 尝试使用sendBeacon发送
                if (navigator.sendBeacon && this.isOnline) {
                    const data = JSON.stringify({
                        events: this.pendingData.map(item => item.data),
                        batch: true,
                        final: true,
                        timestamp: Date.now()
                    });
                    
                    navigator.sendBeacon('/api/analytics', data);
                    console.log('📡 使用sendBeacon发送最终数据');
                }
            }
        });
    }
    
    /**
     * 保存离线数据
     */
    saveOfflineData() {
        try {
            const offlineData = {
                pending: this.pendingData,
                timestamp: Date.now()
            };
            
            localStorage.setItem('diamond_analytics_offline', JSON.stringify(offlineData));
            console.log(`💾 离线数据已保存: ${this.pendingData.length} 条`);
            
        } catch (error) {
            console.warn('⚠️ 保存离线数据失败:', error);
        }
    }
    
    /**
     * 加载离线数据
     */
    loadOfflineData() {
        try {
            const saved = localStorage.getItem('diamond_analytics_offline');
            if (saved) {
                const offlineData = JSON.parse(saved);
                
                // 检查数据是否过期（24小时）
                const maxAge = 24 * 60 * 60 * 1000;
                if (Date.now() - offlineData.timestamp < maxAge) {
                    this.pendingData.unshift(...offlineData.pending);
                    console.log(`📥 加载离线数据: ${offlineData.pending.length} 条`);
                }
                
                // 清除已加载的离线数据
                localStorage.removeItem('diamond_analytics_offline');
            }
            
        } catch (error) {
            console.warn('⚠️ 加载离线数据失败:', error);
        }
    }
    
    /**
     * 跟踪页面访问
     */
    trackPageView(page = window.location.pathname) {
        this.trackEvent({
            event: 'pageview',
            page: page,
            title: document.title
        });
    }
    
    /**
     * 跟踪用户交互
     */
    trackInteraction(action, target, data = {}) {
        this.trackEvent({
            event: 'interaction',
            action: action,
            target: target,
            ...data
        });
    }
    
    /**
     * 跟踪搜索
     */
    trackSearch(query, results = 0) {
        this.trackEvent({
            event: 'search',
            query: query,
            results: results
        });
    }
    
    /**
     * 跟踪产品查看
     */
    trackProductView(productId, productName) {
        this.trackEvent({
            event: 'product_view',
            productId: productId,
            productName: productName
        });
    }
    
    /**
     * 获取分析统计信息
     */
    getAnalyticsStats() {
        return {
            pendingCount: this.pendingData.length,
            sentCount: this.sentData.size,
            isOnline: this.isOnline,
            batchSize: this.batchSize,
            batchInterval: this.batchInterval
        };
    }
    
    /**
     * 立即发送所有待发送数据
     */
    flush() {
        console.log('🚀 立即发送所有待发送的分析数据');
        return this.sendBatch();
    }
    
    /**
     * 清除所有数据
     */
    clear() {
        this.pendingData = [];
        this.sentData.clear();
        localStorage.removeItem('diamond_analytics_offline');
        console.log('🗑️ 所有分析数据已清除');
    }
}

// 立即创建统一分析管理器实例
if (!window.unifiedAnalyticsManager) {
    window.unifiedAnalyticsManager = new UnifiedAnalyticsManager();
    
    // 自动跟踪页面访问
    window.unifiedAnalyticsManager.trackPageView();
}

console.log('📊 统一分析管理器脚本加载完成');
