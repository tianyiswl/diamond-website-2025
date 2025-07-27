// 🚀 钻石网站性能优化和监控系统
// 专为200-300产品规模设计的高性能缓存和监控方案

const fs = require("fs");
const path = require("path");

/**
 * 🧠 智能缓存管理器
 * 针对JSON文件存储优化的高性能缓存系统
 */
class SmartCacheManager {
  constructor(options = {}) {
    this.cache = new Map();
    this.fileStats = new Map();
    this.config = {
      ttl: options.ttl || 5 * 60 * 1000, // 5分钟默认TTL
      maxSize: options.maxSize || 100, // 最大缓存条目数
      checkInterval: options.checkInterval || 60 * 1000, // 1分钟检查间隔
      ...options,
    };

    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      fileReads: 0,
      errors: 0,
      startTime: Date.now(),
    };

    // 启动定期清理
    this.startCleanupTimer();

    console.log("🚀 智能缓存管理器已启动");
  }

  /**
   * 🔧 获取不同文件类型的缓存TTL
   */
  getCacheTTL(filePath) {
    if (filePath.includes('analytics.json')) {
      return 2 * 60 * 1000; // Analytics数据2分钟缓存（更频繁更新）
    }
    if (filePath.includes('company.json') || filePath.includes('categories.json')) {
      return 30 * 60 * 1000; // 配置数据30分钟缓存（变化较少）
    }
    if (filePath.includes('inquiries.json')) {
      return 1 * 60 * 1000; // 询价数据1分钟缓存（需要较新数据）
    }
    return this.config.ttl; // 默认5分钟缓存
  }

  /**
   * 🔧 检查是否应该输出缓存日志
   */
  shouldLogCacheHit(filePath) {
    const isDebugMode = process.env.NODE_ENV === 'development';
    const isAnalyticsFile = filePath.includes('analytics.json');

    // 只在调试模式下且非analytics文件时输出日志
    return isDebugMode && !isAnalyticsFile;
  }

  /**
   * 获取缓存数据 - 优化版本
   */
  get(key) {
    const cached = this.cache.get(key);

    if (!cached) {
      this.stats.misses++;
      return null;
    }

    // 🔧 使用动态TTL检查
    const ttl = this.getCacheTTL(key);
    if (Date.now() - cached.timestamp > ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // 检查文件是否被修改
    if (this.isFileModified(key, cached.fileStats)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;

    // 🔧 智能日志输出
    if (this.shouldLogCacheHit(key)) {
      console.log('🎯 缓存命中:', key);
    }

    return cached.data;
  }

  /**
   * 设置缓存数据
   */
  set(key, data, filePath = null) {
    // 检查缓存大小限制
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const fileStats = filePath ? this.getFileStats(filePath) : null;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      fileStats,
      accessCount: 1,
    });

    if (filePath) {
      this.fileStats.set(key, fileStats);
    }
  }

  /**
   * 检查文件是否被修改
   */
  isFileModified(key, cachedStats) {
    if (!cachedStats) return false;

    try {
      const currentStats = fs.statSync(cachedStats.filePath);
      return currentStats.mtime.getTime() !== cachedStats.mtime;
    } catch (error) {
      return true; // 文件不存在或无法访问，认为已修改
    }
  }

  /**
   * 获取文件统计信息
   */
  getFileStats(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return {
        filePath,
        mtime: stats.mtime.getTime(),
        size: stats.size,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 淘汰最旧的缓存项
   */
  evictOldest() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, value] of this.cache.entries()) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * 启动定期清理定时器
   */
  startCleanupTimer() {
    setInterval(() => {
      this.cleanup();
    }, this.config.checkInterval);
  }

  /**
   * 清理过期缓存
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.config.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => {
      this.cache.delete(key);
      this.stats.evictions++;
    });

    if (keysToDelete.length > 0) {
      console.log(`🧹 清理了 ${keysToDelete.length} 个过期缓存项`);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    const runtime = Date.now() - this.stats.startTime;
    const hitRate =
      (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100;

    return {
      ...this.stats,
      hitRate: hitRate.toFixed(2) + "%",
      cacheSize: this.cache.size,
      runtime: Math.round(runtime / 1000) + "s",
    };
  }

  /**
   * 删除指定缓存项
   * @param {string} key - 缓存键
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    this.fileStats.delete(key);
    if (deleted) {
      console.log(`🗑️ 已删除缓存项: ${key}`);
    }
    return deleted;
  }

  /**
   * 清空缓存
   */
  clear() {
    this.cache.clear();
    this.fileStats.clear();
    console.log("🗑️ 缓存已清空");
  }
}

/**
 * 📊 性能监控器
 * 实时监控应用性能指标
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      responses: 0,
      errors: 0,
      totalResponseTime: 0,
      slowQueries: 0,
      memoryUsage: [],
      cpuUsage: [],
      startTime: Date.now(),
    };

    this.thresholds = {
      slowQueryTime: 100, // 100ms
      highMemoryUsage: 80, // 80%
      highCpuUsage: 80, // 80%
    };

    // 启动系统监控
    this.startSystemMonitoring();

    console.log("📊 性能监控器已启动");
  }

  /**
   * 中间件：记录请求性能
   */
  middleware(req, res, next) {
    const startTime = Date.now();

    // 记录请求
    this.metrics.requests++;

    // 监听响应完成
    res.on("finish", () => {
      const responseTime = Date.now() - startTime;
      this.metrics.responses++;
      this.metrics.totalResponseTime += responseTime;

      // 检查慢查询
      if (responseTime > this.thresholds.slowQueryTime) {
        this.metrics.slowQueries++;
        console.log(`⚠️ 慢查询检测: ${req.path} - ${responseTime}ms`);
      }

      // 记录错误
      if (res.statusCode >= 400) {
        this.metrics.errors++;
      }
    });

    next();
  }

  /**
   * 启动系统监控
   */
  startSystemMonitoring() {
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // 每30秒收集一次
  }

  /**
   * 收集系统指标
   */
  collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // 内存使用率
    const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    this.metrics.memoryUsage.push({
      timestamp: Date.now(),
      usage: memoryUsagePercent,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
    });

    // 保持最近100个数据点
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage.shift();
    }

    // 检查内存使用警告
    if (memoryUsagePercent > this.thresholds.highMemoryUsage) {
      console.log(`⚠️ 高内存使用警告: ${memoryUsagePercent.toFixed(2)}%`);
    }
  }

  /**
   * 获取性能报告
   */
  getReport() {
    const runtime = Date.now() - this.metrics.startTime;
    const avgResponseTime =
      this.metrics.responses > 0
        ? this.metrics.totalResponseTime / this.metrics.responses
        : 0;
    const errorRate =
      this.metrics.requests > 0
        ? (this.metrics.errors / this.metrics.requests) * 100
        : 0;
    const slowQueryRate =
      this.metrics.requests > 0
        ? (this.metrics.slowQueries / this.metrics.requests) * 100
        : 0;

    return {
      runtime: Math.round(runtime / 1000) + "s",
      requests: this.metrics.requests,
      responses: this.metrics.responses,
      avgResponseTime: avgResponseTime.toFixed(2) + "ms",
      errorRate: errorRate.toFixed(2) + "%",
      slowQueryRate: slowQueryRate.toFixed(2) + "%",
      memoryUsage: this.getLatestMemoryUsage(),
      uptime: process.uptime(),
    };
  }

  /**
   * 获取最新内存使用情况
   */
  getLatestMemoryUsage() {
    if (this.metrics.memoryUsage.length === 0) return null;

    const latest =
      this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
    return {
      usage: latest.usage.toFixed(2) + "%",
      heapUsed: Math.round(latest.heapUsed / 1024 / 1024) + "MB",
      heapTotal: Math.round(latest.heapTotal / 1024 / 1024) + "MB",
    };
  }
}

/**
 * 🔍 智能搜索引擎
 * 针对产品数据优化的高性能搜索
 */
class SmartSearchEngine {
  constructor(cacheManager) {
    this.cache = cacheManager;
    this.searchCache = new Map();
    this.searchCacheTTL = 2 * 60 * 1000; // 2分钟搜索缓存

    console.log("🔍 智能搜索引擎已启动");
  }

  /**
   * 智能搜索产品
   */
  search(query, options = {}) {
    const {
      category,
      status = "active",
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 20,
    } = options;

    // 生成搜索缓存键
    const cacheKey = JSON.stringify({
      query,
      category,
      status,
      sortBy,
      sortOrder,
    });

    // 检查搜索缓存
    const cached = this.searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.searchCacheTTL) {
      return this.paginateResults(cached.results, page, limit);
    }

    // 获取产品数据
    let products = this.getProducts();

    // 应用过滤器
    products = this.applyFilters(products, { query, category, status });

    // 应用排序
    products = this.applySorting(products, sortBy, sortOrder);

    // 缓存搜索结果
    this.searchCache.set(cacheKey, {
      results: products,
      timestamp: Date.now(),
    });

    // 清理过期搜索缓存
    this.cleanupSearchCache();

    return this.paginateResults(products, page, limit);
  }

  /**
   * 获取产品数据
   */
  getProducts() {
    const cacheKey = "products";
    let products = this.cache.get(cacheKey);

    if (!products) {
      try {
        const data = fs.readFileSync("./data/products.json", "utf8");
        products = JSON.parse(data);
        this.cache.set(cacheKey, products, "./data/products.json");
      } catch (error) {
        console.error("读取产品数据失败:", error);
        return [];
      }
    }

    return products;
  }

  /**
   * 应用过滤器
   */
  applyFilters(products, filters) {
    return products.filter((product) => {
      // 状态过滤
      if (filters.status && product.status !== filters.status) {
        return false;
      }

      // 分类过滤
      if (filters.category && product.category !== filters.category) {
        return false;
      }

      // 关键词搜索
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const searchFields = [
          product.name,
          product.description,
          product.oe_number,
          product.model,
          product.compatibility,
        ]
          .join(" ")
          .toLowerCase();

        if (!searchFields.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * 应用排序
   */
  applySorting(products, sortBy, sortOrder) {
    return products.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // 处理日期字段
      if (sortBy === "createdAt" || sortBy === "updatedAt") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // 处理数字字段
      if (sortBy === "price" || sortBy === "stock") {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }

      if (sortOrder === "desc") {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });
  }

  /**
   * 分页结果
   */
  paginateResults(products, page, limit) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      data: products.slice(startIndex, endIndex),
      pagination: {
        page,
        limit,
        total: products.length,
        pages: Math.ceil(products.length / limit),
      },
    };
  }

  /**
   * 清理过期搜索缓存
   */
  cleanupSearchCache() {
    const now = Date.now();
    for (const [key, value] of this.searchCache.entries()) {
      if (now - value.timestamp > this.searchCacheTTL) {
        this.searchCache.delete(key);
      }
    }
  }
}

// 导出模块
module.exports = {
  SmartCacheManager,
  PerformanceMonitor,
  SmartSearchEngine,
};
