
/**
 * 🔍 页面性能监控器
 * 监控页面加载性能，诊断二次刷新问题
 */

(function() {
    'use strict';

    const PerformanceMonitor = {
        // 性能数据
        metrics: {
            pageLoadStart: performance.now(),
            domContentLoaded: null,
            windowLoaded: null,
            resourceLoadTimes: [],
            initializationEvents: [],
            duplicateEvents: []
        },

        // 初始化计数器
        initCounters: new Map(),

        /**
         * 开始监控
         */
        startMonitoring: function() {
            console.log('🔍 性能监控器启动');

            // 监控DOM加载完成
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.metrics.domContentLoaded = performance.now();
                    console.log(`📊 DOM加载完成: ${(this.metrics.domContentLoaded - this.metrics.pageLoadStart).toFixed(2)}ms`);
                });
            } else {
                this.metrics.domContentLoaded = performance.now();
            }

            // 监控窗口加载完成
            if (document.readyState !== 'complete') {
                window.addEventListener('load', () => {
                    this.metrics.windowLoaded = performance.now();
                    console.log(`📊 窗口加载完成: ${(this.metrics.windowLoaded - this.metrics.pageLoadStart).toFixed(2)}ms`);

                    // 延迟生成报告
                    setTimeout(() => {
                        this.generateReport();
                    }, 1000);
                });
            } else {
                this.metrics.windowLoaded = performance.now();
                setTimeout(() => {
                    this.generateReport();
                }, 1000);
            }

            // 监控资源加载
            this.monitorResourceLoading();

            // 监控初始化事件
            this.monitorInitializationEvents();
        },

        /**
         * 监控资源加载
         */
        monitorResourceLoading: function() {
            if ('PerformanceObserver' in window) {
                try {
                    const observer = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (entry.initiatorType === 'script' || entry.initiatorType === 'link') {
                                this.metrics.resourceLoadTimes.push({
                                    name: entry.name,
                                    type: entry.initiatorType,
                                    duration: entry.duration,
                                    startTime: entry.startTime
                                });
                            }
                        }
                    });
                    observer.observe({ entryTypes: ['resource'] });
                } catch (error) {
                    console.warn('⚠️ 资源加载监控不支持:', error);
                }
            }
        },

        /**
         * 监控初始化事件
         */
        monitorInitializationEvents: function() {
            // 重写console.log来捕获初始化日志
            const originalLog = console.log;
            console.log = (...args) => {
                const message = args.join(' ');

                // 检测初始化相关的日志
                if (message.includes('初始化') || message.includes('开始') || message.includes('加载')) {
                    this.recordInitializationEvent(message);
                }

                // 检测重复初始化
                if (message.includes('跳过重复') || message.includes('已经初始化')) {
                    this.recordDuplicateEvent(message);
                }

                originalLog.apply(console, args);
            };
        },

        /**
         * 记录初始化事件
         */
        recordInitializationEvent: function(message) {
            const timestamp = performance.now();
            this.metrics.initializationEvents.push({
                message,
                timestamp,
                relativeTime: timestamp - this.metrics.pageLoadStart
            });

            // 统计初始化次数
            const key = this.extractInitKey(message);
            if (key) {
                const count = this.initCounters.get(key) || 0;
                this.initCounters.set(key, count + 1);

                if (count > 0) {
                    console.warn(`⚠️ 检测到重复初始化: ${key} (第${count + 1}次)`);
                }
            }
        },

        /**
         * 记录重复事件
         */
        recordDuplicateEvent: function(message) {
            this.metrics.duplicateEvents.push({
                message,
                timestamp: performance.now()
            });
        },

        /**
         * 提取初始化键名
         */
        extractInitKey: function(message) {
            const patterns = [
                /初始化(.+?)(?:开始|完成)/,
                /开始初始化(.+)/,
                /(.+?)初始化/,
                /加载(.+?)(?:开始|完成)/
            ];

            for (const pattern of patterns) {
                const match = message.match(pattern);
                if (match) {
                    return match[1].trim();
                }
            }

            return null;
        },

        /**
         * 生成性能报告
         */
        generateReport: function() {
            const report = {
                总体性能: {
                    页面加载时间: `${(this.metrics.windowLoaded - this.metrics.pageLoadStart).toFixed(2)}ms`,
                    DOM加载时间: `${(this.metrics.domContentLoaded - this.metrics.pageLoadStart).toFixed(2)}ms`
                },
                资源加载: {
                    总资源数: this.metrics.resourceLoadTimes.length,
                    平均加载时间: this.calculateAverageLoadTime(),
                    最慢资源: this.getSlowestResource()
                },
                初始化分析: {
                    初始化事件数: this.metrics.initializationEvents.length,
                    重复事件数: this.metrics.duplicateEvents.length,
                    重复初始化统计: Object.fromEntries(
                        Array.from(this.initCounters.entries()).filter(([key, count]) => count > 1)
                    )
                }
            };

            console.group('📊 页面性能报告');
            console.table(report.总体性能);
            console.table(report.资源加载);
            console.table(report.初始化分析);

            if (this.metrics.duplicateEvents.length > 0) {
                console.warn('⚠️ 检测到重复事件:', this.metrics.duplicateEvents);
            }

            if (Object.keys(report.初始化分析.重复初始化统计).length > 0) {
                console.warn('⚠️ 检测到重复初始化:', report.初始化分析.重复初始化统计);
            }

            console.groupEnd();

            // 保存报告到全局变量
            window.performanceReport = report;

            // 提供优化建议
            this.provideOptimizationSuggestions(report);
        },

        /**
         * 计算平均加载时间
         */
        calculateAverageLoadTime: function() {
            if (this.metrics.resourceLoadTimes.length === 0) return '0ms';

            const total = this.metrics.resourceLoadTimes.reduce((sum, resource) => sum + resource.duration, 0);
            return `${(total / this.metrics.resourceLoadTimes.length).toFixed(2)}ms`;
        },

        /**
         * 获取最慢的资源
         */
        getSlowestResource: function() {
            if (this.metrics.resourceLoadTimes.length === 0) return '无';

            const slowest = this.metrics.resourceLoadTimes.reduce((prev, current) =>
                prev.duration > current.duration ? prev : current
            );

            return `${slowest.name.split('/').pop()} (${slowest.duration.toFixed(2)}ms)`;
        },

        /**
         * 提供优化建议
         */
        provideOptimizationSuggestions: function(report) {
            const suggestions = [];

            // 检查页面加载时间
            const loadTime = this.metrics.windowLoaded - this.metrics.pageLoadStart;
            if (loadTime > 3000) {
                suggestions.push('🐌 页面加载时间超过3秒，建议优化资源加载');
            }

            // 检查重复初始化
            if (Object.keys(report.初始化分析.重复初始化统计).length > 0) {
                suggestions.push('🔄 检测到重复初始化，这可能是导致二次刷新的原因');
            }

            // 检查资源数量
            if (this.metrics.resourceLoadTimes.length > 20) {
                suggestions.push('📦 资源文件较多，建议合并或延迟加载');
            }

            if (suggestions.length > 0) {
                console.group('💡 优化建议');
                suggestions.forEach(suggestion => console.log(suggestion));
                console.groupEnd();
            } else {
                console.log('✅ 页面性能良好，无需优化');
            }
        },

        /**
         * 获取性能数据
         */
        getMetrics: function() {
            return this.metrics;
        }
    };

    // 暴露到全局
    window.PerformanceMonitor = PerformanceMonitor;

    // 自动开始监控
    PerformanceMonitor.startMonitoring();

    console.log('🔍 页面性能监控器已启动');
})();

// 提供便捷的性能检查函数
window.checkPerformance = function() {
    if (window.PerformanceMonitor) {
        window.PerformanceMonitor.generateReport();
    } else {
        console.warn('⚠️ 性能监控器未加载');
    }
};

// 检查是否存在二次刷新问题
window.checkDoubleRefresh = function() {
    if (window.PerformanceMonitor) {
        const duplicates = window.PerformanceMonitor.getMetrics().duplicateEvents;
        const repeatedInits = Array.from(window.PerformanceMonitor.initCounters.entries())
            .filter(([key, count]) => count > 1);

        if (duplicates.length > 0 || repeatedInits.length > 0) {
            console.warn('⚠️ 检测到可能的二次刷新问题:');
            console.log('重复事件:', duplicates);
            console.log('重复初始化:', repeatedInits);
            return true;
        } else {
            console.log('✅ 未检测到二次刷新问题');
            return false;
        }
    }
    return false;
};
