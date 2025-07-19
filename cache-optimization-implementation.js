/**
 * 🚀 JSON存储缓存优化实现
 * 可直接集成到现有server.js中的高性能缓存方案
 */

const fs = require("fs");
const path = require("path");

/**
 * 🧠 智能产品缓存管理器
 * 解决频繁文件读取的性能问题
 */
class ProductCacheManager {
  constructor(options = {}) {
    this.cache = new Map();
    this.cacheTimeout = options.timeout || 3 * 60 * 1000; // 3分钟缓存
    this.maxCacheSize = options.maxSize || 100; // 最大缓存条目数
    this.stats = {
      hits: 0,
      misses: 0,
      reloads: 0,
      errors: 0,
    };

    // 定期清理过期缓存
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredCache();
    }, 60000); // 每分钟清理一次
  }

  /**
   * 获取产品数据（带智能缓存）
   */
  getProducts() {
    const filePath = "./data/products.json";
    const cacheKey = "products";

    try {
      const cached = this.cache.get(cacheKey);

      // 检查缓存是否有效
      if (cached && this.isCacheValid(cached, filePath)) {
        this.stats.hits++;
        return cached.data;
      }

      // 重新加载数据
      this.stats.misses++;
      const products = this.loadProductsFromFile(filePath);

      // 更新缓存
      this.updateCache(cacheKey, products, filePath);
      this.stats.reloads++;

      return products;
    } catch (error) {
      this.stats.errors++;
      console.error("缓存管理器错误:", error);

      // 降级到直接文件读取
      try {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
      } catch (fallbackError) {
        console.error("文件读取失败:", fallbackError);
        return [];
      }
    }
  }

  /**
   * 检查缓存是否有效
   */
  isCacheValid(cached, filePath) {
    try {
      const stats = fs.statSync(filePath);
      const now = Date.now();

      return (
        cached.mtime >= stats.mtime.getTime() &&
        now - cached.timestamp < this.cacheTimeout
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * 从文件加载产品数据
   */
  loadProductsFromFile(filePath) {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  }

  /**
   * 更新缓存
   */
  updateCache(key, data, filePath) {
    try {
      const stats = fs.statSync(filePath);

      this.cache.set(key, {
        data: data,
        timestamp: Date.now(),
        mtime: stats.mtime.getTime(),
        size: JSON.stringify(data).length,
      });

      // 清理过大的缓存
      this.cleanupCache();
    } catch (error) {
      console.error("更新缓存失败:", error);
    }
  }

  /**
   * 清理过期缓存
   */
  cleanupExpiredCache() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 清理了 ${cleanedCount} 个过期缓存项`);
    }
  }

  /**
   * 清理缓存大小
   */
  cleanupCache() {
    if (this.cache.size > this.maxCacheSize) {
      // 删除最旧的缓存项
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toDelete = entries.slice(0, entries.length - this.maxCacheSize);
      toDelete.forEach(([key]) => this.cache.delete(key));

      console.log(`🧹 清理了 ${toDelete.length} 个缓存项以控制大小`);
    }
  }

  /**
   * 手动刷新缓存
   */
  refreshCache() {
    this.cache.clear();
    this.stats.reloads++;
    console.log("🔄 缓存已手动刷新");
  }

  /**
   * 获取缓存统计
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate =
      total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : "0.00";

    return {
      ...this.stats,
      hitRate: hitRate + "%",
      cacheSize: this.cache.size,
      totalMemoryUsage: this.getTotalMemoryUsage(),
    };
  }

  /**
   * 获取缓存内存使用量
   */
  getTotalMemoryUsage() {
    let totalSize = 0;
    for (const cached of this.cache.values()) {
      totalSize += cached.size || 0;
    }
    return (totalSize / 1024).toFixed(2) + "KB";
  }

  /**
   * 销毁缓存管理器
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

/**
 * 🔍 高性能搜索引擎
 * 支持多字段搜索和智能排序
 */
class ProductSearchEngine {
  constructor(cacheManager) {
    this.cacheManager = cacheManager;
    this.searchCache = new Map();
    this.searchCacheTimeout = 60000; // 1分钟搜索缓存
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
    if (cached && Date.now() - cached.timestamp < this.searchCacheTimeout) {
      return this.paginateResults(cached.results, page, limit);
    }

    // 获取产品数据
    let products = this.cacheManager.getProducts();

    // 应用过滤器
    products = this.applyFilters(products, { query, category, status });

    // 应用排序
    products = this.applySorting(products, sortBy, sortOrder);

    // 缓存搜索结果
    this.searchCache.set(cacheKey, {
      results: products,
      timestamp: Date.now(),
    });

    // 清理搜索缓存
    this.cleanupSearchCache();

    return this.paginateResults(products, page, limit);
  }

  /**
   * 应用过滤器
   */
  applyFilters(products, filters) {
    let filtered = products;

    // 状态过滤
    if (filters.status) {
      filtered = filtered.filter((p) => p.status === filters.status);
    }

    // 分类过滤
    if (filters.category) {
      filtered = filtered.filter((p) => p.category === filters.category);
    }

    // 搜索查询
    if (filters.query) {
      const queryLower = filters.query.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(queryLower) ||
          product.sku.toLowerCase().includes(queryLower) ||
          (product.oe_number &&
            product.oe_number.toLowerCase().includes(queryLower)) ||
          (product.model && product.model.toLowerCase().includes(queryLower)) ||
          (product.description &&
            product.description.toLowerCase().includes(queryLower)) ||
          (product.compatibility &&
            product.compatibility.toLowerCase().includes(queryLower)),
      );
    }

    return filtered;
  }

  /**
   * 应用排序
   */
  applySorting(products, sortBy, sortOrder) {
    return products.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      // 处理日期字段
      if (sortBy === "createdAt" || sortBy === "updatedAt") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      // 处理数字字段
      if (sortBy === "price" || sortBy === "stock") {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }

      if (sortOrder === "desc") {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }
    });
  }

  /**
   * 分页结果
   */
  paginateResults(products, page, limit) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedProducts = products.slice(startIndex, endIndex);

    return {
      data: paginatedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(products.length / limit),
        totalItems: products.length,
        hasNext: endIndex < products.length,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * 清理搜索缓存
   */
  cleanupSearchCache() {
    const now = Date.now();
    for (const [key, cached] of this.searchCache.entries()) {
      if (now - cached.timestamp > this.searchCacheTimeout) {
        this.searchCache.delete(key);
      }
    }
  }

  /**
   * 获取搜索统计
   */
  getSearchStats() {
    return {
      searchCacheSize: this.searchCache.size,
      searchCacheTimeout: this.searchCacheTimeout,
    };
  }
}

/**
 * 🚀 性能监控中间件
 */
class PerformanceMonitor {
  constructor() {
    this.stats = {
      requests: 0,
      totalTime: 0,
      slowQueries: 0,
      errors: 0,
      apiStats: new Map(),
    };
  }

  /**
   * Express中间件
   */
  middleware() {
    return (req, res, next) => {
      const start = Date.now();
      const apiPath = req.path;

      res.on("finish", () => {
        const duration = Date.now() - start;

        // 更新总体统计
        this.stats.requests++;
        this.stats.totalTime += duration;

        // 更新API统计
        if (!this.stats.apiStats.has(apiPath)) {
          this.stats.apiStats.set(apiPath, {
            count: 0,
            totalTime: 0,
            avgTime: 0,
            slowCount: 0,
          });
        }

        const apiStat = this.stats.apiStats.get(apiPath);
        apiStat.count++;
        apiStat.totalTime += duration;
        apiStat.avgTime = apiStat.totalTime / apiStat.count;

        // 记录慢查询
        if (duration > 200) {
          this.stats.slowQueries++;
          apiStat.slowCount++;
          console.warn(`🐌 慢查询警告: ${apiPath} - ${duration}ms`);
        }

        // 记录错误
        if (res.statusCode >= 400) {
          this.stats.errors++;
        }
      });

      next();
    };
  }

  /**
   * 获取性能报告
   */
  getReport() {
    const avgResponseTime =
      this.stats.requests > 0
        ? (this.stats.totalTime / this.stats.requests).toFixed(2)
        : "0.00";

    const slowQueryRate =
      this.stats.requests > 0
        ? ((this.stats.slowQueries / this.stats.requests) * 100).toFixed(2)
        : "0.00";

    const errorRate =
      this.stats.requests > 0
        ? ((this.stats.errors / this.stats.requests) * 100).toFixed(2)
        : "0.00";

    // 获取最慢的API
    const slowestAPIs = Array.from(this.stats.apiStats.entries())
      .sort((a, b) => b[1].avgTime - a[1].avgTime)
      .slice(0, 5)
      .map(([path, stats]) => ({
        path,
        avgTime: stats.avgTime.toFixed(2) + "ms",
        count: stats.count,
        slowCount: stats.slowCount,
      }));

    return {
      avgResponseTime: avgResponseTime + "ms",
      totalRequests: this.stats.requests,
      slowQueryRate: slowQueryRate + "%",
      errorRate: errorRate + "%",
      slowestAPIs,
    };
  }
}

// 导出所有类
module.exports = {
  ProductCacheManager,
  ProductSearchEngine,
  PerformanceMonitor,
};
