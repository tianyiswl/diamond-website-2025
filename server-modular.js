// 🚀 Diamond Website 模块化服务器
// 重构后的模块化架构，提升代码可维护性和可扩展性

const express = require('express');
const compression = require('compression');

// 导入模块化组件
const config = require('./src/config');
const middleware = require('./src/middleware');
const routes = require('./src/routes');
const services = require('./src/services');
const dao = require('./src/dao');

// 创建Express应用
const app = express();

/**
 * 初始化应用程序
 */
async function initializeApp() {
  console.log('🚀 启动 Diamond Website 服务器...');
  console.log('=' .repeat(50));

  try {
    // 1. 初始化数据层
    console.log('📊 初始化数据访问层...');
    const dataInitResult = dao.initializeAllData();
    if (!dataInitResult.success) {
      console.error('❌ 数据初始化失败:', dataInitResult.errors);
      throw new Error('数据初始化失败');
    }
    console.log('✅ 数据访问层初始化完成');

    // 2. 初始化服务层
    console.log('🏗️ 初始化业务服务层...');
    const serviceInitResult = services.initializeServices();
    if (!serviceInitResult.success) {
      console.error('❌ 服务层初始化失败:', serviceInitResult.error);
      throw new Error('服务层初始化失败');
    }
    console.log('✅ 业务服务层初始化完成');

    // 3. 初始化缓存系统
    console.log('🚀 初始化缓存系统...');
    const cacheInitResult = config.initializeCache();
    if (!cacheInitResult) {
      console.warn('⚠️ 缓存系统初始化失败，将继续运行但性能可能受影响');
    } else {
      console.log('✅ 缓存系统初始化完成');
    }

    // 4. 配置中间件
    console.log('🛠️ 配置应用中间件...');
    middleware.setupAllMiddleware(app);

    // 5. 配置路由
    console.log('🌐 配置应用路由...');
    routes.setupRoutes(app);

    // 6. 配置错误处理中间件（必须在路由之后）
    middleware.setupErrorMiddleware(app);

    console.log('✅ 应用初始化完成');
    return true;
  } catch (error) {
    console.error('❌ 应用初始化失败:', error);
    return false;
  }
}

/**
 * 启动服务器
 */
async function startServer() {
  try {
    // 初始化应用
    const initSuccess = await initializeApp();
    if (!initSuccess) {
      console.error('❌ 应用初始化失败，服务器启动中止');
      process.exit(1);
    }

    // 尝试启动服务器
    let port = config.server.port;
    let server = null;
    let attempts = 0;
    const maxAttempts = config.server.maxPortRetry || 10;

    while (attempts < maxAttempts) {
      try {
        server = await new Promise((resolve, reject) => {
          const srv = app.listen(port, config.server.host, () => {
            resolve(srv);
          });
          
          srv.on('error', (error) => {
            reject(error);
          });
        });
        
        break; // 成功启动，跳出循环
      } catch (error) {
        if (error.code === 'EADDRINUSE') {
          console.log(`⚠️ 端口 ${port} 被占用，尝试端口 ${port + 1}`);
          port++;
          attempts++;
        } else {
          throw error;
        }
      }
    }

    if (!server) {
      throw new Error(`无法找到可用端口，已尝试 ${maxAttempts} 次`);
    }

    // 服务器启动成功
    console.log('\n🎉 服务器启动成功！');
    console.log('=' .repeat(50));
    console.log(`🌐 服务器地址: http://${config.server.host}:${port}`);
    console.log(`📱 本地访问: http://localhost:${port}`);
    console.log(`🔧 环境模式: ${config.server.environment}`);
    console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
    console.log(`🕒 时区设置: ${config.server.timezone}`);
    
    // 显示可用的API端点
    console.log('\n📋 可用的API端点:');
    console.log('  🔐 认证: /api/auth');
    console.log('  📦 产品: /api/products');
    console.log('  📂 分类: /api/categories');
    console.log('  💬 询价: /api/inquiries');
    console.log('  📊 分析: /api/analytics');
    console.log('  👤 管理员: /api/admins');
    console.log('  📖 文档: /api/docs');

    // 显示系统状态
    console.log('\n📊 系统状态:');
    const healthCheck = services.getServicesHealth();
    console.log(`  🏥 服务健康: ${healthCheck.overall}`);
    
    const stats = dao.getAllStats();
    if (stats) {
      console.log(`  📁 数据文件: ${stats.summary.totalFiles} 个`);
      console.log(`  💾 数据大小: ${(stats.summary.totalSize / 1024).toFixed(2)} KB`);
    }

    console.log('\n✨ Diamond Website 服务器运行中...');
    console.log('按 Ctrl+C 停止服务器');

    // 优雅关闭处理
    const gracefulShutdown = (signal) => {
      console.log(`\n📴 收到 ${signal} 信号，开始优雅关闭...`);
      
      server.close(() => {
        console.log('🔌 HTTP 服务器已关闭');
        
        // 清理缓存
        try {
          config.clearAllCache();
          dao.clearAllCache();
          console.log('🧹 缓存已清理');
        } catch (error) {
          console.error('❌ 清理缓存失败:', error);
        }
        
        console.log('👋 服务器已安全关闭');
        process.exit(0);
      });
      
      // 强制关闭超时
      setTimeout(() => {
        console.error('⏰ 强制关闭超时，立即退出');
        process.exit(1);
      }, 10000);
    };

    // 注册信号处理器
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

/**
 * 健康检查端点
 */
app.get('/health', (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      environment: config.server.environment,
      services: services.getServicesHealth(),
      data: dao.getAllStats()
    };

    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 根路径重定向
 */
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

// 如果直接运行此文件，启动服务器
if (require.main === module) {
  startServer().catch(error => {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  });
}

// 导出应用和启动函数（用于测试）
module.exports = {
  app,
  startServer,
  initializeApp
};
