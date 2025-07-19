// 🚀 JSON存储优化方案实现
// 适用于100-500个产品的性能优化

const fs = require("fs");
const path = require("path");

/**
 * 🧠 智能产品缓存管理器
 * 解决频繁文件读取的性能问题
 */
class ProductCacheManager {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
    this.maxCacheSize = 100; // 最大缓存条目数
    this.stats = {
      hits: 0,
      misses: 0,
      reloads: 0,
    };
  }

  /**
   * 获取产品数据（带缓存）
   */
  getProducts() {
    const cacheKey = "all_products";
    const cached = this.cache.get(cacheKey);

    // 检查缓存是否有效
    if (cached && this.isCacheValid(cached)) {
      this.stats.hits++;
      return cached.data;
    }

    // 重新加载数据
    this.stats.misses++;
    const products = this.loadProductsFromFile();

    this.cache.set(cacheKey, {
      data: products,
      timestamp: Date.now(),
      fileStats: fs.statSync("./data/products.json"),
    });

    this.stats.reloads++;
    this.cleanupCache();

    return products;
  }

  /**
   * 获取单个产品（带缓存）
   */
  getProductById(id) {
    const cacheKey = `product_${id}`;
    const cached = this.cache.get(cacheKey);

    if (cached && this.isCacheValid(cached)) {
      this.stats.hits++;
      return cached.data;
    }

    // 从所有产品中查找
    const products = this.getProducts();
    const product = products.find((p) => p.id === id);

    if (product) {
      this.cache.set(cacheKey, {
        data: product,
        timestamp: Date.now(),
      });
    }

    return product;
  }

  /**
   * 检查缓存是否有效
   */
  isCacheValid(cached) {
    const now = Date.now();
    const isTimeValid = now - cached.timestamp < this.cacheTimeout;

    // 检查文件是否被修改
    if (cached.fileStats) {
      try {
        const currentStats = fs.statSync("./data/products.json");
        const isFileUnchanged = currentStats.mtime <= cached.fileStats.mtime;
        return isTimeValid && isFileUnchanged;
      } catch (error) {
        return false;
      }
    }

    return isTimeValid;
  }

  /**
   * 从文件加载产品数据
   */
  loadProductsFromFile() {
    try {
      const data = fs.readFileSync("./data/products.json", "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("加载产品数据失败:", error);
      return [];
    }
  }

  /**
   * 清理过期缓存
   */
  cleanupCache() {
    if (this.cache.size <= this.maxCacheSize) return;

    const now = Date.now();
    const toDelete = [];

    for (const [key, value] of this.cache) {
      if (now - value.timestamp > this.cacheTimeout) {
        toDelete.push(key);
      }
    }

    toDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * 清空缓存
   */
  clearCache() {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, reloads: 0 };
  }

  /**
   * 获取缓存统计
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate:
        total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) + "%" : "0%",
      cacheSize: this.cache.size,
    };
  }
}

/**
 * 🔍 高性能产品搜索引擎
 * 支持多字段索引和快速搜索
 */
class ProductSearchEngine {
  constructor(products) {
    this.products = products;
    this.indexes = {
      name: new Map(),
      sku: new Map(),
      oe: new Map(),
      brand: new Map(),
      category: new Map(),
    };
    this.buildIndexes();
  }

  /**
   * 构建搜索索引
   */
  buildIndexes() {
    this.products.forEach((product, index) => {
      // 名称索引（分词）
      if (product.name) {
        const words = this.tokenize(product.name);
        words.forEach((word) => {
          this.addToIndex("name", word, index);
        });
      }

      // SKU索引（精确匹配）
      if (product.sku) {
        this.addToIndex("sku", product.sku.toLowerCase(), index);
      }

      // OE号码索引
      if (product.oe_number) {
        const oeNumbers = product.oe_number.split(/[,\s]+/);
        oeNumbers.forEach((oe) => {
          if (oe.trim()) {
            this.addToIndex("oe", oe.trim().toLowerCase(), index);
          }
        });
      }

      // 品牌索引
      if (product.brand) {
        this.addToIndex("brand", product.brand.toLowerCase(), index);
      }

      // 分类索引
      if (product.category) {
        this.addToIndex("category", product.category.toLowerCase(), index);
      }
    });
  }

  /**
   * 添加到索引
   */
  addToIndex(indexName, key, productIndex) {
    if (!this.indexes[indexName].has(key)) {
      this.indexes[indexName].set(key, []);
    }
    this.indexes[indexName].get(key).push(productIndex);
  }

  /**
   * 文本分词
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 1);
  }

  /**
   * 执行搜索
   */
  search(query, options = {}) {
    const {
      category = "",
      limit = 50,
      offset = 0,
      sortBy = "relevance",
    } = options;

    if (!query || !query.trim()) {
      return this.getAllProducts(category, limit, offset);
    }

    const queryLower = query.toLowerCase().trim();
    const results = new Map(); // productIndex -> score

    // 1. 精确匹配（最高权重）
    this.exactMatch(queryLower, results, 100);

    // 2. 前缀匹配（高权重）
    this.prefixMatch(queryLower, results, 80);

    // 3. 包含匹配（中等权重）
    this.containsMatch(queryLower, results, 60);

    // 4. 分词匹配（低权重）
    this.tokenMatch(queryLower, results, 40);

    // 转换为产品数组并排序
    let searchResults = Array.from(results.entries())
      .map(([index, score]) => ({
        product: this.products[index],
        score,
      }))
      .sort((a, b) => b.score - a.score);

    // 分类过滤
    if (category && category !== "all") {
      searchResults = searchResults.filter(
        (item) => item.product.category === category,
      );
    }

    // 分页
    const paginatedResults = searchResults.slice(offset, offset + limit);

    return {
      products: paginatedResults.map((item) => item.product),
      total: searchResults.length,
      hasMore: searchResults.length > offset + limit,
    };
  }

  /**
   * 精确匹配
   */
  exactMatch(query, results, score) {
    // SKU精确匹配
    if (this.indexes.sku.has(query)) {
      this.indexes.sku.get(query).forEach((index) => {
        results.set(index, (results.get(index) || 0) + score);
      });
    }

    // OE号码精确匹配
    if (this.indexes.oe.has(query)) {
      this.indexes.oe.get(query).forEach((index) => {
        results.set(index, (results.get(index) || 0) + score);
      });
    }
  }

  /**
   * 前缀匹配
   */
  prefixMatch(query, results, score) {
    ["name", "brand"].forEach((indexName) => {
      for (const [key, indices] of this.indexes[indexName]) {
        if (key.startsWith(query)) {
          indices.forEach((index) => {
            results.set(index, (results.get(index) || 0) + score);
          });
        }
      }
    });
  }

  /**
   * 包含匹配
   */
  containsMatch(query, results, score) {
    ["name", "brand"].forEach((indexName) => {
      for (const [key, indices] of this.indexes[indexName]) {
        if (key.includes(query) && !key.startsWith(query)) {
          indices.forEach((index) => {
            results.set(index, (results.get(index) || 0) + score);
          });
        }
      }
    });
  }

  /**
   * 分词匹配
   */
  tokenMatch(query, results, score) {
    const queryTokens = this.tokenize(query);

    queryTokens.forEach((token) => {
      if (this.indexes.name.has(token)) {
        this.indexes.name.get(token).forEach((index) => {
          results.set(
            index,
            (results.get(index) || 0) + score / queryTokens.length,
          );
        });
      }
    });
  }

  /**
   * 获取所有产品（带分类过滤）
   */
  getAllProducts(category, limit, offset) {
    let products = this.products.filter((p) => p.status === "active");

    if (category && category !== "all") {
      products = products.filter((p) => p.category === category);
    }

    return {
      products: products.slice(offset, offset + limit),
      total: products.length,
      hasMore: products.length > offset + limit,
    };
  }
}

/**
 * 📊 产品数据分析器
 * 提供性能监控和数据统计
 */
class ProductAnalyzer {
  constructor(products) {
    this.products = products;
  }

  /**
   * 分析数据规模和性能
   */
  analyzePerformance() {
    const productCount = this.products.length;
    const jsonString = JSON.stringify(this.products);
    const fileSize = Buffer.byteLength(jsonString, "utf8");

    // 估算内存占用（JSON解析后约为文件大小的2-3倍）
    const estimatedMemory = fileSize * 2.5;

    // 性能等级评估
    let performanceLevel = "excellent";
    let recommendations = [];

    if (productCount > 1000) {
      performanceLevel = "poor";
      recommendations.push("立即迁移到数据库");
      recommendations.push("实施分页加载");
    } else if (productCount > 500) {
      performanceLevel = "fair";
      recommendations.push("考虑迁移到SQLite");
      recommendations.push("实施缓存策略");
    } else if (productCount > 100) {
      performanceLevel = "good";
      recommendations.push("实施索引优化");
      recommendations.push("添加缓存机制");
    } else {
      recommendations.push("当前性能良好");
    }

    return {
      productCount,
      fileSize: this.formatBytes(fileSize),
      estimatedMemory: this.formatBytes(estimatedMemory),
      performanceLevel,
      recommendations,
      loadTimeEstimate: this.estimateLoadTime(fileSize),
      searchTimeEstimate: this.estimateSearchTime(productCount),
    };
  }

  /**
   * 估算加载时间
   */
  estimateLoadTime(fileSize) {
    // 基于文件大小估算加载时间（毫秒）
    const baseTime = 10; // 基础时间
    const sizeTime = fileSize / 1024 / 10; // 每10KB约1ms
    return Math.round(baseTime + sizeTime);
  }

  /**
   * 估算搜索时间
   */
  estimateSearchTime(productCount) {
    // 基于产品数量估算搜索时间（毫秒）
    if (productCount < 100) return "< 10ms";
    if (productCount < 500) return "10-50ms";
    if (productCount < 1000) return "50-200ms";
    return "> 200ms";
  }

  /**
   * 格式化字节数
   */
  formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * 生成优化建议
   */
  generateOptimizationPlan() {
    const analysis = this.analyzePerformance();
    const plan = {
      immediate: [],
      shortTerm: [],
      longTerm: [],
    };

    if (analysis.productCount < 100) {
      plan.immediate.push("实施内存缓存");
      plan.shortTerm.push("优化搜索算法");
      plan.longTerm.push("监控数据增长");
    } else if (analysis.productCount < 500) {
      plan.immediate.push("实施缓存和索引");
      plan.shortTerm.push("考虑SQLite迁移");
      plan.longTerm.push("准备数据库升级");
    } else {
      plan.immediate.push("立即实施缓存");
      plan.shortTerm.push("迁移到SQLite");
      plan.longTerm.push("升级到PostgreSQL");
    }

    return plan;
  }
}

// 导出优化组件
module.exports = {
  ProductCacheManager,
  ProductSearchEngine,
  ProductAnalyzer,
};

// 使用示例
if (require.main === module) {
  // 创建缓存管理器
  const cacheManager = new ProductCacheManager();

  // 加载产品数据
  const products = cacheManager.getProducts();
  console.log(`加载了 ${products.length} 个产品`);

  // 创建搜索引擎
  const searchEngine = new ProductSearchEngine(products);

  // 执行搜索测试
  const searchResults = searchEngine.search("turbo", { limit: 10 });
  console.log(`搜索结果: ${searchResults.products.length} 个产品`);

  // 性能分析
  const analyzer = new ProductAnalyzer(products);
  const analysis = analyzer.analyzePerformance();
  console.log("性能分析:", analysis);

  // 缓存统计
  console.log("缓存统计:", cacheManager.getStats());
}
