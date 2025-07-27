// 🚀 缓存系统集成脚本
// 将现有的缓存优化模块集成到主服务器

const fs = require('fs');
const path = require('path');

console.log('🚀 Diamond Website 缓存系统集成');
console.log('=====================================');
console.log(`集成时间: ${new Date().toLocaleString('zh-CN')}`);
console.log('');

/**
 * 集成缓存系统到server.js
 */
function integrateCacheSystem() {
  try {
    // 1. 备份原始server.js
    console.log('💾 创建server.js备份...');
    const backupPath = `./server.js.backup-cache-${Date.now()}`;
    fs.copyFileSync('./server.js', backupPath);
    console.log(`✅ 原始server.js已备份到: ${backupPath}`);
    
    // 2. 读取server.js内容
    console.log('📖 读取server.js内容...');
    let serverContent = fs.readFileSync('./server.js', 'utf8');
    
    // 3. 检查是否已经集成过缓存系统
    if (serverContent.includes('ProductCacheManager') || serverContent.includes('SmartCacheManager')) {
      console.log('⚠️ 检测到缓存系统可能已经集成，跳过重复集成');
      return {
        success: true,
        message: '缓存系统已存在，无需重复集成',
        alreadyIntegrated: true
      };
    }
    
    // 4. 在文件顶部添加缓存模块引用
    console.log('🔧 添加缓存模块引用...');
    const cacheImports = `
// 🚀 缓存系统模块引用
const { ProductCacheManager } = require('./cache-optimization-implementation.js');
const { SmartCacheManager } = require('./performance-optimization.js');

// 初始化缓存管理器
const productCacheManager = new ProductCacheManager({
  timeout: 5 * 60 * 1000, // 5分钟缓存
  maxSize: 100
});

const smartCacheManager = new SmartCacheManager({
  ttl: 5 * 60 * 1000, // 5分钟TTL
  maxSize: 100
});

console.log('🚀 缓存系统已初始化');
console.log('   - ProductCacheManager: 产品数据缓存');
console.log('   - SmartCacheManager: 智能文件缓存');
`;
    
    // 在require语句后添加缓存导入
    const requirePattern = /const cookieParser = require\("cookie-parser"\);/;
    if (requirePattern.test(serverContent)) {
      serverContent = serverContent.replace(requirePattern, 
        `const cookieParser = require("cookie-parser");${cacheImports}`);
      console.log('✅ 缓存模块引用已添加');
    } else {
      console.log('⚠️ 未找到合适的位置插入缓存模块引用，手动添加到文件开头');
      serverContent = cacheImports + '\n' + serverContent;
    }
    
    // 5. 替换readJsonFile函数为缓存版本
    console.log('🔧 升级readJsonFile函数为缓存版本...');
    
    // 查找现有的readJsonFile函数
    const readJsonFilePattern = /const readJsonFile = \(filePath\) => \{[\s\S]*?\};/;
    const readJsonFileMatch = serverContent.match(readJsonFilePattern);
    
    if (readJsonFileMatch) {
      const enhancedReadJsonFile = `
// 🚀 增强版readJsonFile函数（集成智能缓存）
const readJsonFile = (filePath) => {
  try {
    // 特殊处理产品数据，使用专用缓存管理器
    if (filePath.includes('products.json')) {
      console.log('📦 使用产品缓存管理器读取:', filePath);
      return productCacheManager.getProducts();
    }
    
    // 其他文件使用智能缓存管理器
    const cacheKey = path.resolve(filePath);
    let data = smartCacheManager.get(cacheKey);
    
    if (data === null) {
      // 缓存未命中，从文件读取
      console.log('💾 缓存未命中，从文件读取:', filePath);
      
      if (!fs.existsSync(filePath)) {
        console.warn(\`⚠️ 文件不存在: \${filePath}\`);
        return filePath.includes('products.json') ? [] : 
               filePath.includes('categories.json') ? [] :
               filePath.includes('analytics.json') ? { daily_stats: {}, product_analytics: {} } :
               filePath.includes('inquiries.json') ? [] :
               filePath.includes('logs.json') ? [] :
               filePath.includes('company.json') ? {} : {};
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf8');
      data = JSON.parse(fileContent);
      
      // 存入缓存
      smartCacheManager.set(cacheKey, data);
      console.log('✅ 数据已缓存:', filePath);
    } else {
      console.log('🎯 缓存命中:', filePath);
    }
    
    return data;
  } catch (error) {
    console.error(\`❌ 读取文件失败: \${filePath}\`, error.message);
    
    // 返回默认值避免程序崩溃
    return filePath.includes('products.json') ? [] : 
           filePath.includes('categories.json') ? [] :
           filePath.includes('analytics.json') ? { daily_stats: {}, product_analytics: {} } :
           filePath.includes('inquiries.json') ? [] :
           filePath.includes('logs.json') ? [] :
           filePath.includes('company.json') ? {} : {};
  }
};`;
      
      serverContent = serverContent.replace(readJsonFilePattern, enhancedReadJsonFile);
      console.log('✅ readJsonFile函数已升级为缓存版本');
    } else {
      console.log('⚠️ 未找到现有的readJsonFile函数，将添加新的缓存版本');
      
      // 在文件缓存相关代码后添加新的readJsonFile函数
      const cachePattern = /const CACHE_TTL = 5 \* 60 \* 1000;/;
      if (cachePattern.test(serverContent)) {
        serverContent = serverContent.replace(cachePattern, 
          `const CACHE_TTL = 5 * 60 * 1000; // 保留原有缓存配置作为备用${enhancedReadJsonFile}`);
      }
    }
    
    // 6. 添加缓存状态API
    console.log('🔧 添加缓存状态监控API...');
    const cacheStatsAPI = `
// 🚀 缓存状态监控API
app.get('/api/cache/stats', (req, res) => {
  try {
    const productStats = productCacheManager.getStats();
    const smartStats = smartCacheManager.getStats();
    
    const combinedStats = {
      timestamp: new Date().toISOString(),
      productCache: {
        hits: productStats.hits,
        misses: productStats.misses,
        hitRate: productStats.hits + productStats.misses > 0 ? 
          ((productStats.hits / (productStats.hits + productStats.misses)) * 100).toFixed(2) + '%' : '0%',
        cacheSize: productCacheManager.cache.size,
        errors: productStats.errors
      },
      smartCache: {
        hits: smartStats.hits,
        misses: smartStats.misses,
        hitRate: smartStats.hits + smartStats.misses > 0 ? 
          ((smartStats.hits / (smartStats.hits + smartStats.misses)) * 100).toFixed(2) + '%' : '0%',
        cacheSize: smartCacheManager.cache.size,
        evictions: smartStats.evictions,
        errors: smartStats.errors
      },
      overall: {
        totalHits: productStats.hits + smartStats.hits,
        totalMisses: productStats.misses + smartStats.misses,
        overallHitRate: (() => {
          const totalRequests = productStats.hits + productStats.misses + smartStats.hits + smartStats.misses;
          const totalHits = productStats.hits + smartStats.hits;
          return totalRequests > 0 ? ((totalHits / totalRequests) * 100).toFixed(2) + '%' : '0%';
        })()
      }
    };
    
    res.json({
      success: true,
      data: combinedStats
    });
  } catch (error) {
    console.error('获取缓存统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取缓存统计失败'
    });
  }
});

// 缓存清理API
app.post('/api/cache/clear', (req, res) => {
  try {
    productCacheManager.clearCache();
    smartCacheManager.clear();
    
    console.log('🧹 缓存已手动清理');
    
    res.json({
      success: true,
      message: '缓存已清理'
    });
  } catch (error) {
    console.error('清理缓存失败:', error);
    res.status(500).json({
      success: false,
      error: '清理缓存失败'
    });
  }
});
`;
    
    // 在健康检查API前添加缓存API
    const healthCheckPattern = /\/\/ 健康检查端点/;
    if (healthCheckPattern.test(serverContent)) {
      serverContent = serverContent.replace(healthCheckPattern, 
        `${cacheStatsAPI}\n// 健康检查端点`);
      console.log('✅ 缓存监控API已添加');
    } else {
      // 如果找不到健康检查，在文件末尾添加
      serverContent += cacheStatsAPI;
      console.log('✅ 缓存监控API已添加到文件末尾');
    }
    
    // 7. 保存修改后的server.js
    console.log('💾 保存集成后的server.js...');
    fs.writeFileSync('./server.js', serverContent);
    console.log('✅ server.js已成功更新');
    
    // 8. 生成集成报告
    const integrationReport = {
      integrationTime: new Date().toISOString(),
      backupFile: backupPath,
      changes: [
        '添加了ProductCacheManager和SmartCacheManager引用',
        '升级了readJsonFile函数为缓存版本',
        '添加了缓存状态监控API (/api/cache/stats)',
        '添加了缓存清理API (/api/cache/clear)',
        '集成了智能文件缓存和产品专用缓存'
      ],
      expectedBenefits: [
        '产品数据读取性能提升80%+',
        '文件I/O操作减少90%+',
        '缓存命中率预期>80%',
        'API响应时间减少50%+'
      ]
    };
    
    fs.writeFileSync('./cache-integration-report.json', JSON.stringify(integrationReport, null, 2));
    console.log('📊 集成报告已保存到: cache-integration-report.json');
    
    // 9. 显示集成摘要
    console.log('\n🎉 缓存系统集成完成！');
    console.log('=====================================');
    console.log('集成内容:');
    integrationReport.changes.forEach(change => {
      console.log(`  ✅ ${change}`);
    });
    
    console.log('\n预期效果:');
    integrationReport.expectedBenefits.forEach(benefit => {
      console.log(`  📈 ${benefit}`);
    });
    
    console.log('\n🔧 下一步操作:');
    console.log('  1. 重启服务器: pm2 restart diamond-website');
    console.log('  2. 测试缓存效果: curl http://localhost:3001/api/cache/stats');
    console.log('  3. 验证API响应时间改善');
    
    return {
      success: true,
      report: integrationReport,
      backupFile: backupPath
    };
    
  } catch (error) {
    console.error('❌ 缓存系统集成失败:', error.message);
    console.error(error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

// 执行集成
console.log('开始执行缓存系统集成...\n');
const result = integrateCacheSystem();

if (result.success) {
  if (result.alreadyIntegrated) {
    console.log('\n✅ 缓存系统已存在，无需重复集成');
  } else {
    console.log('\n✅ 缓存系统集成成功完成！');
    console.log('🔧 建议重启服务器以应用更改');
  }
} else {
  console.log('\n❌ 缓存系统集成失败，请检查错误信息');
}

console.log('\n集成完成。');
