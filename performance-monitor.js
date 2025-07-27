/**
 * 📊 搜索修复脚本性能监控器
 * 用于测量和分析修复脚本对页面性能的实际影响
 */

(function() {
    'use strict';
    
    const PERFORMANCE_MONITOR = {
        startTime: performance.now(),
        metrics: {},
        enabled: true
    };
    
    /**
     * 记录性能指标
     */
    function recordMetric(name, value, unit = 'ms') {
        if (!PERFORMANCE_MONITOR.enabled) return;
        
        PERFORMANCE_MONITOR.metrics[name] = {
            value: value,
            unit: unit,
            timestamp: performance.now()
        };
    }
    
    /**
     * 测量脚本加载性能
     */
    function measureScriptLoading() {
        const scripts = Array.from(document.scripts);
        const searchFixScripts = scripts.filter(script => 
            script.src.includes('search') || 
            script.src.includes('fix') ||
            script.src.includes('diagnosis')
        );
        
        recordMetric('searchFixScriptsCount', searchFixScripts.length, 'count');
        
        // 计算脚本总大小（估算）
        let totalSize = 0;
        searchFixScripts.forEach(script => {
            if (script.src.includes('lightweight-search-fix')) totalSize += 3; // 3KB
            if (script.src.includes('search-enter-key-fix')) totalSize += 11; // 11KB
            if (script.src.includes('advanced-search-fix')) totalSize += 18; // 18KB
            if (script.src.includes('deep-search-diagnosis')) totalSize += 17; // 17KB
        });
        
        recordMetric('searchFixScriptsSize', totalSize, 'KB');
    }
    
    /**
     * 测量页面加载性能
     */
    function measurePagePerformance() {
        if (!window.performance || !window.performance.timing) return;
        
        const timing = window.performance.timing;
        const navigation = window.performance.navigation;
        
        // 基础性能指标
        const metrics = {
            // 页面加载时间
            pageLoadTime: timing.loadEventEnd - timing.navigationStart,
            
            // DOM内容加载时间
            domContentLoadedTime: timing.domContentLoadedEventEnd - timing.navigationStart,
            
            // 首次内容绘制时间
            firstContentfulPaint: 0,
            
            // DNS查询时间
            dnsLookupTime: timing.domainLookupEnd - timing.domainLookupStart,
            
            // TCP连接时间
            tcpConnectTime: timing.connectEnd - timing.connectStart,
            
            // 请求响应时间
            requestResponseTime: timing.responseEnd - timing.requestStart,
            
            // DOM处理时间
            domProcessingTime: timing.domComplete - timing.domLoading
        };
        
        // 记录所有指标
        Object.keys(metrics).forEach(key => {
            recordMetric(key, metrics[key]);
        });
        
        // 获取首次内容绘制时间
        if (window.performance.getEntriesByType) {
            const paintEntries = window.performance.getEntriesByType('paint');
            const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
            if (fcp) {
                recordMetric('firstContentfulPaint', fcp.startTime);
            }
        }
        
        // 记录导航类型
        recordMetric('navigationType', navigation.type, 'type');
    }
    
    /**
     * 测量内存使用情况
     */
    function measureMemoryUsage() {
        if (!window.performance.memory) return;
        
        const memory = window.performance.memory;
        
        recordMetric('usedJSHeapSize', Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100, 'MB');
        recordMetric('totalJSHeapSize', Math.round(memory.totalJSHeapSize / 1024 / 1024 * 100) / 100, 'MB');
        recordMetric('jsHeapSizeLimit', Math.round(memory.jsHeapSizeLimit / 1024 / 1024 * 100) / 100, 'MB');
    }
    
    /**
     * 测量搜索功能响应时间
     */
    function measureSearchResponseTime() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;
        
        let responseStartTime = 0;
        
        // 监听搜索相关事件
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                responseStartTime = performance.now();
            }
        });
        
        // 监听搜索结果显示
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            const observer = new MutationObserver(function(mutations) {
                if (responseStartTime > 0) {
                    const responseTime = performance.now() - responseStartTime;
                    recordMetric('searchResponseTime', Math.round(responseTime * 100) / 100);
                    responseStartTime = 0;
                }
            });
            
            observer.observe(searchResults, {
                childList: true,
                attributes: true,
                subtree: true
            });
        }
    }
    
    /**
     * 测量网络资源加载
     */
    function measureNetworkResources() {
        if (!window.performance.getEntriesByType) return;
        
        const resources = window.performance.getEntriesByType('resource');
        const searchFixResources = resources.filter(resource => 
            resource.name.includes('search') || 
            resource.name.includes('fix') ||
            resource.name.includes('diagnosis')
        );
        
        let totalTransferSize = 0;
        let totalDuration = 0;
        
        searchFixResources.forEach(resource => {
            totalTransferSize += resource.transferSize || 0;
            totalDuration += resource.duration || 0;
        });
        
        recordMetric('searchFixResourcesCount', searchFixResources.length, 'count');
        recordMetric('searchFixTransferSize', Math.round(totalTransferSize / 1024 * 100) / 100, 'KB');
        recordMetric('searchFixLoadDuration', Math.round(totalDuration * 100) / 100);
    }
    
    /**
     * 生成性能报告
     */
    function generatePerformanceReport() {
        const report = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            monitoringDuration: performance.now() - PERFORMANCE_MONITOR.startTime,
            metrics: PERFORMANCE_MONITOR.metrics,
            analysis: {}
        };
        
        // 性能分析
        const metrics = PERFORMANCE_MONITOR.metrics;
        
        // 页面加载性能分析
        if (metrics.pageLoadTime) {
            report.analysis.pageLoadPerformance = {
                rating: metrics.pageLoadTime.value < 2000 ? 'excellent' : 
                       metrics.pageLoadTime.value < 4000 ? 'good' : 
                       metrics.pageLoadTime.value < 6000 ? 'fair' : 'poor',
                recommendation: metrics.pageLoadTime.value > 4000 ? 
                    '页面加载时间较长，建议优化资源加载' : '页面加载性能良好'
            };
        }
        
        // 搜索修复脚本影响分析
        if (metrics.searchFixScriptsSize) {
            const size = metrics.searchFixScriptsSize.value;
            report.analysis.searchFixImpact = {
                sizeImpact: size < 5 ? 'minimal' : size < 15 ? 'moderate' : 'significant',
                recommendation: size > 15 ? 
                    '建议使用轻量级修复方案减少文件大小' : '修复脚本大小在可接受范围内'
            };
        }
        
        // 内存使用分析
        if (metrics.usedJSHeapSize) {
            const memoryUsage = metrics.usedJSHeapSize.value;
            report.analysis.memoryUsage = {
                rating: memoryUsage < 50 ? 'excellent' : 
                       memoryUsage < 100 ? 'good' : 
                       memoryUsage < 200 ? 'fair' : 'poor',
                recommendation: memoryUsage > 100 ? 
                    '内存使用较高，建议优化脚本' : '内存使用正常'
            };
        }
        
        // 搜索响应时间分析
        if (metrics.searchResponseTime) {
            const responseTime = metrics.searchResponseTime.value;
            report.analysis.searchPerformance = {
                rating: responseTime < 100 ? 'excellent' : 
                       responseTime < 300 ? 'good' : 
                       responseTime < 500 ? 'fair' : 'poor',
                recommendation: responseTime > 300 ? 
                    '搜索响应时间较慢，需要优化' : '搜索响应性能良好'
            };
        }
        
        return report;
    }
    
    /**
     * 输出性能报告
     */
    function outputPerformanceReport() {
        const report = generatePerformanceReport();
        
        console.log('\n📊 === 搜索修复脚本性能报告 ===');
        console.log('报告时间:', report.timestamp);
        console.log('监控时长:', Math.round(report.monitoringDuration), 'ms');
        
        console.log('\n📈 === 关键性能指标 ===');
        Object.keys(report.metrics).forEach(key => {
            const metric = report.metrics[key];
            console.log(`${key}: ${metric.value} ${metric.unit}`);
        });
        
        console.log('\n🔍 === 性能分析 ===');
        Object.keys(report.analysis).forEach(key => {
            const analysis = report.analysis[key];
            console.log(`${key}:`, analysis);
        });
        
        // 保存到全局变量
        window.performanceReport = report;
        console.log('\n💾 完整报告已保存到: window.performanceReport');
        
        return report;
    }
    
    /**
     * 初始化性能监控
     */
    function initPerformanceMonitoring() {
        console.log('📊 性能监控器已启动');
        
        // 立即测量脚本加载情况
        measureScriptLoading();
        
        // 页面加载完成后测量性能
        if (document.readyState === 'complete') {
            setTimeout(() => {
                measurePagePerformance();
                measureMemoryUsage();
                measureNetworkResources();
                measureSearchResponseTime();
            }, 1000);
        } else {
            window.addEventListener('load', function() {
                setTimeout(() => {
                    measurePagePerformance();
                    measureMemoryUsage();
                    measureNetworkResources();
                    measureSearchResponseTime();
                }, 1000);
            });
        }
        
        // 定期更新内存使用情况（大幅延长间隔，避免闪烁）
        setInterval(measureMemoryUsage, 30000);

        // 大幅延长报告生成时间，避免闪烁
        setTimeout(outputPerformanceReport, 30000);
        
        // 页面卸载前生成最终报告
        window.addEventListener('beforeunload', function() {
            outputPerformanceReport();
        });
    }
    
    // 导出到全局
    window.performanceMonitor = {
        generateReport: generatePerformanceReport,
        outputReport: outputPerformanceReport,
        recordMetric: recordMetric,
        metrics: PERFORMANCE_MONITOR.metrics,
        enabled: PERFORMANCE_MONITOR.enabled
    };
    
    // 自动初始化
    initPerformanceMonitoring();
    
})();
