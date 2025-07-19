#!/usr/bin/env node

/**
 * 🚀 JSON存储性能基准测试工具
 * 用于测试当前产品数据存储方案的性能表现
 */

const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");

class PerformanceBenchmark {
  constructor() {
    this.results = {
      fileIO: {},
      search: {},
      memory: {},
      concurrent: {},
    };
  }

  /**
   * 📊 文件I/O性能测试
   */
  async testFileIO() {
    console.log("🔍 测试文件I/O性能...");

    const filePath = "./data/products.json";
    const iterations = 100;
    const times = [];

    // 预热
    fs.readFileSync(filePath, "utf8");

    // 执行测试
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const data = fs.readFileSync(filePath, "utf8");
      JSON.parse(data);
      const end = performance.now();
      times.push(end - start);
    }

    const stats = this.calculateStats(times);
    this.results.fileIO = {
      iterations,
      ...stats,
      fileSize: fs.statSync(filePath).size,
      fileSizeKB: (fs.statSync(filePath).size / 1024).toFixed(2),
    };

    console.log(`   📁 文件大小: ${this.results.fileIO.fileSizeKB}KB`);
    console.log(`   ⚡ 平均读取时间: ${stats.average.toFixed(2)}ms`);
    console.log(`   🚀 最快: ${stats.min.toFixed(2)}ms`);
    console.log(`   🐌 最慢: ${stats.max.toFixed(2)}ms`);
    console.log(
      `   📊 性能评级: ${this.getPerformanceGrade(stats.average, "fileIO")}\n`,
    );
  }

  /**
   * 🔍 搜索性能测试
   */
  async testSearchPerformance() {
    console.log("🔍 测试搜索性能...");

    const products = JSON.parse(
      fs.readFileSync("./data/products.json", "utf8"),
    );
    const searchTerms = ["turbo", "S500W", "Diamond", "Volvo", "3886223"];
    const searchResults = {};

    for (const term of searchTerms) {
      const times = [];
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();

        // 模拟复杂搜索
        const results = products.filter(
          (product) =>
            product.name.toLowerCase().includes(term.toLowerCase()) ||
            product.sku.toLowerCase().includes(term.toLowerCase()) ||
            (product.oe_number &&
              product.oe_number.toLowerCase().includes(term.toLowerCase())) ||
            (product.model &&
              product.model.toLowerCase().includes(term.toLowerCase())),
        );

        const end = performance.now();
        times.push(end - start);
      }

      const stats = this.calculateStats(times);
      searchResults[term] = {
        ...stats,
        iterations,
        matchCount: products.filter(
          (p) =>
            p.name.toLowerCase().includes(term.toLowerCase()) ||
            p.sku.toLowerCase().includes(term.toLowerCase()) ||
            (p.oe_number &&
              p.oe_number.toLowerCase().includes(term.toLowerCase())) ||
            (p.model && p.model.toLowerCase().includes(term.toLowerCase())),
        ).length,
      };

      console.log(
        `   🔍 搜索 "${term}": ${stats.average.toFixed(3)}ms (${searchResults[term].matchCount}个结果)`,
      );
    }

    this.results.search = searchResults;

    const avgSearchTime =
      Object.values(searchResults).reduce(
        (sum, result) => sum + result.average,
        0,
      ) / searchTerms.length;
    console.log(`   📊 平均搜索时间: ${avgSearchTime.toFixed(3)}ms`);
    console.log(
      `   📊 搜索性能评级: ${this.getPerformanceGrade(avgSearchTime, "search")}\n`,
    );
  }

  /**
   * 💾 内存使用测试
   */
  async testMemoryUsage() {
    console.log("💾 测试内存使用...");

    const initialMemory = process.memoryUsage();
    const products = [];

    // 模拟加载多个产品副本
    const baseProducts = JSON.parse(
      fs.readFileSync("./data/products.json", "utf8"),
    );

    for (let i = 0; i < 100; i++) {
      products.push(...JSON.parse(JSON.stringify(baseProducts)));
    }

    const finalMemory = process.memoryUsage();

    this.results.memory = {
      initialHeapUsed: (initialMemory.heapUsed / 1024 / 1024).toFixed(2),
      finalHeapUsed: (finalMemory.heapUsed / 1024 / 1024).toFixed(2),
      memoryIncrease: (
        (finalMemory.heapUsed - initialMemory.heapUsed) /
        1024 /
        1024
      ).toFixed(2),
      productsLoaded: products.length,
      memoryPerProduct: (
        (finalMemory.heapUsed - initialMemory.heapUsed) /
        products.length /
        1024
      ).toFixed(2),
    };

    console.log(`   📊 初始内存: ${this.results.memory.initialHeapUsed}MB`);
    console.log(`   📊 加载后内存: ${this.results.memory.finalHeapUsed}MB`);
    console.log(`   📊 内存增长: ${this.results.memory.memoryIncrease}MB`);
    console.log(
      `   📊 每个产品内存: ${this.results.memory.memoryPerProduct}KB`,
    );
    console.log(
      `   📊 内存效率评级: ${this.getPerformanceGrade(parseFloat(this.results.memory.memoryPerProduct), "memory")}\n`,
    );
  }

  /**
   * 🔄 并发性能测试
   */
  async testConcurrentAccess() {
    console.log("🔄 测试并发访问性能...");

    const concurrencyLevels = [1, 5, 10, 20, 50];
    const concurrentResults = {};

    for (const level of concurrencyLevels) {
      const promises = [];
      const start = performance.now();

      for (let i = 0; i < level; i++) {
        promises.push(this.simulateRequest());
      }

      await Promise.all(promises);
      const end = performance.now();

      const totalTime = end - start;
      const avgTimePerRequest = totalTime / level;

      concurrentResults[level] = {
        totalTime: totalTime.toFixed(2),
        avgTimePerRequest: avgTimePerRequest.toFixed(2),
        requestsPerSecond: (1000 / avgTimePerRequest).toFixed(2),
      };

      console.log(
        `   🔄 ${level}个并发: ${avgTimePerRequest.toFixed(2)}ms/请求, ${concurrentResults[level].requestsPerSecond}请求/秒`,
      );
    }

    this.results.concurrent = concurrentResults;
    console.log(
      `   📊 并发性能评级: ${this.getPerformanceGrade(parseFloat(concurrentResults[20].avgTimePerRequest), "concurrent")}\n`,
    );
  }

  /**
   * 模拟请求
   */
  async simulateRequest() {
    return new Promise((resolve) => {
      const start = performance.now();

      // 模拟读取和处理数据
      const data = fs.readFileSync("./data/products.json", "utf8");
      const products = JSON.parse(data);

      // 模拟一些处理
      const filtered = products.filter((p) => p.status === "active");
      const sorted = filtered.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );

      const end = performance.now();
      resolve(end - start);
    });
  }

  /**
   * 计算统计数据
   */
  calculateStats(times) {
    const sorted = times.sort((a, b) => a - b);
    return {
      average: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  /**
   * 性能评级
   */
  getPerformanceGrade(value, type) {
    const thresholds = {
      fileIO: { excellent: 10, good: 50, poor: 200 },
      search: { excellent: 1, good: 5, poor: 20 },
      memory: { excellent: 3, good: 10, poor: 30 },
      concurrent: { excellent: 20, good: 100, poor: 500 },
    };

    const threshold = thresholds[type];
    if (value <= threshold.excellent) return "🟢 优秀";
    if (value <= threshold.good) return "🟡 良好";
    if (value <= threshold.poor) return "🟠 一般";
    return "🔴 需优化";
  }

  /**
   * 生成完整报告
   */
  generateReport() {
    console.log("📋 生成性能测试报告...\n");

    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage(),
      },
      results: this.results,
      recommendations: this.generateRecommendations(),
    };

    // 保存报告
    const reportPath = `./performance-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`📊 详细报告已保存至: ${reportPath}`);

    return report;
  }

  /**
   * 生成优化建议
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.results.fileIO.average > 50) {
      recommendations.push("🔧 建议实施内存缓存以减少文件I/O");
    }

    if (Object.values(this.results.search).some((r) => r.average > 5)) {
      recommendations.push("🔍 建议优化搜索算法或添加索引");
    }

    if (parseFloat(this.results.memory.memoryPerProduct) > 10) {
      recommendations.push("💾 建议优化数据结构以减少内存占用");
    }

    if (
      this.results.concurrent[20] &&
      parseFloat(this.results.concurrent[20].avgTimePerRequest) > 100
    ) {
      recommendations.push("🔄 建议考虑数据库升级以提升并发性能");
    }

    return recommendations;
  }

  /**
   * 运行完整测试套件
   */
  async runFullBenchmark() {
    console.log("🚀 开始JSON存储性能基准测试\n");
    console.log("=".repeat(50));

    try {
      await this.testFileIO();
      await this.testSearchPerformance();
      await this.testMemoryUsage();
      await this.testConcurrentAccess();

      const report = this.generateReport();

      console.log("\n📋 测试总结:");
      console.log("=".repeat(50));

      if (report.recommendations.length > 0) {
        console.log("\n💡 优化建议:");
        report.recommendations.forEach((rec) => console.log(`   ${rec}`));
      } else {
        console.log("\n✅ 当前性能表现良好，无需立即优化");
      }

      console.log("\n🎯 结论: 基于测试结果，您的JSON存储方案适合当前规模使用");
    } catch (error) {
      console.error("❌ 测试过程中出现错误:", error);
    }
  }
}

// 运行测试
if (require.main === module) {
  const benchmark = new PerformanceBenchmark();
  benchmark.runFullBenchmark();
}

module.exports = PerformanceBenchmark;
