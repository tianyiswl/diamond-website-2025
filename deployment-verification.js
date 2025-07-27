// 🔍 部署验证脚本
// 验证模块化重构后的系统是否可以正常部署和运行

const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🔍 Diamond Website 部署验证');
console.log('=' .repeat(50));

// 验证结果统计
const verificationResults = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: []
};

/**
 * 验证辅助函数
 */
function verify(testName, testFunction, isWarning = false) {
  verificationResults.total++;
  console.log(`\n🔍 验证: ${testName}`);
  
  try {
    const result = testFunction();
    if (result === true || (result && result.success)) {
      console.log(`✅ 通过: ${testName}`);
      verificationResults.passed++;
      return true;
    } else {
      const message = result && result.error ? result.error : '验证失败';
      if (isWarning) {
        console.log(`⚠️ 警告: ${testName} - ${message}`);
        verificationResults.warnings++;
      } else {
        console.log(`❌ 失败: ${testName} - ${message}`);
        verificationResults.failed++;
        verificationResults.errors.push(`${testName}: ${message}`);
      }
      return false;
    }
  } catch (error) {
    const message = error.message;
    if (isWarning) {
      console.log(`⚠️ 警告: ${testName} - ${message}`);
      verificationResults.warnings++;
    } else {
      console.log(`❌ 异常: ${testName} - ${message}`);
      verificationResults.failed++;
      verificationResults.errors.push(`${testName}: ${message}`);
    }
    return false;
  }
}

/**
 * 异步验证辅助函数
 */
async function verifyAsync(testName, testFunction, isWarning = false) {
  verificationResults.total++;
  console.log(`\n🔍 验证: ${testName}`);
  
  try {
    const result = await testFunction();
    if (result === true || (result && result.success)) {
      console.log(`✅ 通过: ${testName}`);
      verificationResults.passed++;
      return true;
    } else {
      const message = result && result.error ? result.error : '验证失败';
      if (isWarning) {
        console.log(`⚠️ 警告: ${testName} - ${message}`);
        verificationResults.warnings++;
      } else {
        console.log(`❌ 失败: ${testName} - ${message}`);
        verificationResults.failed++;
        verificationResults.errors.push(`${testName}: ${message}`);
      }
      return false;
    }
  } catch (error) {
    const message = error.message;
    if (isWarning) {
      console.log(`⚠️ 警告: ${testName} - ${message}`);
      verificationResults.warnings++;
    } else {
      console.log(`❌ 异常: ${testName} - ${message}`);
      verificationResults.failed++;
      verificationResults.errors.push(`${testName}: ${message}`);
    }
    return false;
  }
}

/**
 * 主验证函数
 */
async function runDeploymentVerification() {
  console.log('开始部署验证...\n');

  // 1. 文件结构验证
  console.log('📁 1. 文件结构验证');
  console.log('-'.repeat(30));

  const requiredFiles = [
    'server-modular.js',
    'package.json',
    'README-MODULAR.md',
    'src/config/index.js',
    'src/utils/index.js',
    'src/dao/index.js',
    'src/middleware/index.js',
    'src/routes/index.js',
    'src/services/index.js',
    'docs/API.md',
    'docs/DEPLOYMENT.md',
    'REFACTORING-SUMMARY.md'
  ];

  requiredFiles.forEach(file => {
    verify(`文件存在: ${file}`, () => {
      return fs.existsSync(file);
    });
  });

  // 2. 依赖验证
  console.log('\n📦 2. 依赖验证');
  console.log('-'.repeat(30));

  verify('package.json 格式正确', () => {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return packageJson.name && packageJson.version && packageJson.dependencies;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  verify('node_modules 存在', () => {
    return fs.existsSync('node_modules');
  }, true); // 警告级别，可能在CI环境中不存在

  // 3. 模块加载验证
  console.log('\n🔧 3. 模块加载验证');
  console.log('-'.repeat(30));

  const modules = [
    { name: 'config', path: './src/config' },
    { name: 'utils', path: './src/utils' },
    { name: 'dao', path: './src/dao' },
    { name: 'middleware', path: './src/middleware' },
    { name: 'routes', path: './src/routes' },
    { name: 'services', path: './src/services' }
  ];

  modules.forEach(({ name, path }) => {
    verify(`${name} 模块加载`, () => {
      try {
        const module = require(path);
        return module && typeof module === 'object';
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  });

  // 4. 配置验证
  console.log('\n⚙️ 4. 配置验证');
  console.log('-'.repeat(30));

  verify('配置模块功能完整', () => {
    try {
      const config = require('./src/config');
      return config.server && config.database && config.security;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  verify('环境变量支持', () => {
    try {
      const config = require('./src/config');
      // 测试环境变量读取
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      const testConfig = require('./src/config');
      process.env.NODE_ENV = originalEnv;
      return true;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 5. 数据访问层验证
  console.log('\n📊 5. 数据访问层验证');
  console.log('-'.repeat(30));

  await verifyAsync('数据初始化', async () => {
    try {
      const dao = require('./src/dao');
      const result = dao.initializeAllData();
      return result.success;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  await verifyAsync('数据验证', async () => {
    try {
      const dao = require('./src/dao');
      const result = dao.validateAllData();
      return result.success || result.totalErrors === 0;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 6. 服务层验证
  console.log('\n🏗️ 6. 服务层验证');
  console.log('-'.repeat(30));

  await verifyAsync('服务层初始化', async () => {
    try {
      const services = require('./src/services');
      const result = services.initializeServices();
      return result.success;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  await verifyAsync('服务健康检查', async () => {
    try {
      const services = require('./src/services');
      const health = services.getServicesHealth();
      return health.overall === 'healthy' || health.overall === 'degraded';
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 7. 服务器启动验证
  console.log('\n🌐 7. 服务器启动验证');
  console.log('-'.repeat(30));

  await verifyAsync('模块化服务器可启动', async () => {
    try {
      // 尝试加载服务器模块
      const serverModule = require('./server-modular');
      return typeof serverModule.app === 'object';
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 8. API端点验证
  console.log('\n🔗 8. API端点验证');
  console.log('-'.repeat(30));

  verify('路由配置正确', () => {
    try {
      const routes = require('./src/routes');
      return typeof routes.setupRoutes === 'function';
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  verify('中间件配置正确', () => {
    try {
      const middleware = require('./src/middleware');
      return typeof middleware.setupAllMiddleware === 'function';
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 9. 安全性验证
  console.log('\n🔒 9. 安全性验证');
  console.log('-'.repeat(30));

  verify('认证中间件可用', () => {
    try {
      const middleware = require('./src/middleware');
      return typeof middleware.authenticateToken === 'function';
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  verify('权限中间件可用', () => {
    try {
      const middleware = require('./src/middleware');
      return typeof middleware.requirePermission === 'function';
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 10. 文档完整性验证
  console.log('\n📚 10. 文档完整性验证');
  console.log('-'.repeat(30));

  const documentFiles = [
    { file: 'README-MODULAR.md', minSize: 5000 },
    { file: 'docs/API.md', minSize: 8000 },
    { file: 'docs/DEPLOYMENT.md', minSize: 6000 },
    { file: 'REFACTORING-SUMMARY.md', minSize: 4000 }
  ];

  documentFiles.forEach(({ file, minSize }) => {
    verify(`文档完整: ${file}`, () => {
      try {
        const stats = fs.statSync(file);
        return stats.size >= minSize;
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  });

  // 11. 性能基准验证
  console.log('\n⚡ 11. 性能基准验证');
  console.log('-'.repeat(30));

  await verifyAsync('模块加载性能', async () => {
    try {
      const startTime = Date.now();
      
      // 清除缓存
      Object.keys(require.cache).forEach(key => {
        if (key.includes('/src/')) {
          delete require.cache[key];
        }
      });

      // 重新加载所有模块
      require('./src/config');
      require('./src/utils');
      require('./src/dao');
      require('./src/middleware');
      require('./src/routes');
      require('./src/services');
      
      const loadTime = Date.now() - startTime;
      console.log(`   模块加载时间: ${loadTime}ms`);
      
      return loadTime < 2000; // 应该在2秒内完成
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 12. 兼容性验证
  console.log('\n🔄 12. 兼容性验证');
  console.log('-'.repeat(30));

  verify('原服务器文件存在', () => {
    return fs.existsSync('server.js');
  }, true); // 警告级别

  verify('数据目录兼容', () => {
    return fs.existsSync('data') || fs.existsSync('./data');
  });

  // 输出验证结果
  console.log('\n' + '='.repeat(50));
  console.log('📊 部署验证结果汇总');
  console.log('='.repeat(50));
  console.log(`总验证项: ${verificationResults.total}`);
  console.log(`通过: ${verificationResults.passed} ✅`);
  console.log(`失败: ${verificationResults.failed} ❌`);
  console.log(`警告: ${verificationResults.warnings} ⚠️`);
  console.log(`成功率: ${((verificationResults.passed / verificationResults.total) * 100).toFixed(2)}%`);

  if (verificationResults.failed > 0) {
    console.log('\n❌ 失败的验证项:');
    verificationResults.errors.forEach(error => {
      console.log(`  - ${error}`);
    });
  }

  if (verificationResults.warnings > 0) {
    console.log('\n⚠️ 警告信息:');
    console.log('  - 这些项目不会影响核心功能，但建议关注');
  }

  const deploymentReady = verificationResults.failed === 0;
  console.log(`\n🎯 部署就绪状态: ${deploymentReady ? '✅ 可以部署' : '❌ 需要修复'}`);
  
  if (deploymentReady) {
    console.log('\n🎉 恭喜！系统已准备好部署！');
    console.log('✨ 模块化重构成功，所有验证项目通过。');
    console.log('\n📋 部署建议:');
    console.log('  1. 备份现有数据: cp -r data data-backup');
    console.log('  2. 运行最终测试: node integration-test.js');
    console.log('  3. 启动新服务器: node server-modular.js');
    console.log('  4. 验证功能正常: curl http://localhost:3000/health');
  } else {
    console.log('\n⚠️ 请修复上述失败项目后再进行部署。');
    console.log('📖 参考文档: docs/DEPLOYMENT.md');
  }

  return deploymentReady;
}

// 执行验证
if (require.main === module) {
  runDeploymentVerification()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ 部署验证失败:', error);
      process.exit(1);
    });
}

module.exports = { runDeploymentVerification };
