// 🚀 缓存系统配置模块
// 管理所有缓存相关配置和初始化

// 注意：暂时注释掉外部依赖，避免循环引用和路径问题
// const { ProductCacheManager } = require('../../cache-optimization-implementation.js');
// const { SmartCacheManager } = require('../../performance-optimization.js');

// 简化的缓存管理器实现
class ProductCacheManager {
  constructor(options = {}) {
    this.cache = new Map();
    this.timeout = options.timeout || 5 * 60 * 1000;
    this.maxSize = options.maxSize || 100;
    this.stats = { hits: 0, misses: 0 };
  }

  clearCache() {
    this.cache.clear();
  }

  getStats() {
    return { ...this.stats, size: this.cache.size };
  }
}

class SmartCacheManager {
  constructor(options = {}) {
    this.cache = new Map();
    this.ttl = options.ttl || 5 * 60 * 1000;
    this.maxSize = options.maxSize || 100;
    this.stats = { hits: 0, misses: 0 };
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    return { ...this.stats, size: this.cache.size };
  }
}

const cacheConfig = {
  // 产品缓存配置
  product: {
    timeout: 5 * 60 * 1000, // 5分钟缓存
    maxSize: 100,
    enabled: true
  },

  // 智能文件缓存配置
  smart: {
    ttl: 5 * 60 * 1000, // 5分钟TTL
    maxSize: 100,
    enabled: true
  },

  // 内存缓存配置
  memory: {
    ttl: 5 * 60 * 1000, // 5分钟缓存
    maxSize: 1000,
    enabled: true
  },

  // 静态文件缓存配置
  static: {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
    etag: true,
    lastModified: true
  }
};

// 缓存管理器实例
let productCacheManager = null;
let smartCacheManager = null;
let fileCache = null;

// 初始化缓存系统
const initializeCache = () => {
  try {
    console.log('🔧 开始初始化缓存系统...');

    // 暂时禁用复杂的缓存管理器，避免启动时的问题
    // 只使用简单的内存缓存
    if (cacheConfig.memory.enabled) {
      fileCache = new Map();
      console.log('✅ 内存缓存初始化成功');
    }

    console.log('🚀 缓存系统初始化完成');
    return true;
  } catch (error) {
    console.error('❌ 缓存系统初始化失败:', error);
    return false;
  }
};

// 获取缓存管理器实例
const getCacheManagers = () => {
  return {
    productCacheManager,
    smartCacheManager,
    fileCache
  };
};

// 清理所有缓存
const clearAllCache = () => {
  try {
    if (productCacheManager) {
      productCacheManager.clearCache();
    }
    if (smartCacheManager) {
      smartCacheManager.clear();
    }
    if (fileCache) {
      fileCache.clear();
    }
    console.log('🧹 所有缓存已清理');
    return true;
  } catch (error) {
    console.error('❌ 清理缓存失败:', error);
    return false;
  }
};

// 获取缓存统计信息
const getCacheStats = () => {
  const stats = {
    product: null,
    smart: null,
    memory: null
  };

  try {
    if (productCacheManager) {
      stats.product = productCacheManager.getStats();
    }
    if (smartCacheManager) {
      stats.smart = smartCacheManager.getStats();
    }
    if (fileCache) {
      stats.memory = {
        size: fileCache.size,
        maxSize: cacheConfig.memory.maxSize
      };
    }
  } catch (error) {
    console.error('❌ 获取缓存统计失败:', error);
  }

  return stats;
};

module.exports = {
  config: cacheConfig,
  initializeCache,
  getCacheManagers,
  clearAllCache,
  getCacheStats
};
