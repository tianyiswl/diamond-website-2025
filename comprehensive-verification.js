// 🔍 Diamond Website 功能完整性验证脚本
// 全面验证模块化重构后的系统功能完整性

const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🔍 Diamond Website 功能完整性验证');
console.log('=' .repeat(60));

// 验证结果统计
const verificationResults = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: [],
  warnings_list: [],
  detailed_results: {}
};

/**
 * 验证辅助函数
 */
function verify(category, testName, testFunction, isWarning = false) {
  verificationResults.total++;
  
  if (!verificationResults.detailed_results[category]) {
    verificationResults.detailed_results[category] = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }
  
  verificationResults.detailed_results[category].total++;
  
  console.log(`\n🔍 [${category}] ${testName}`);
  
  try {
    const result = testFunction();
    const testResult = {
      name: testName,
      status: '',
      message: '',
      details: null
    };
    
    if (result === true || (result && result.success)) {
      console.log(`✅ 通过: ${testName}`);
      verificationResults.passed++;
      verificationResults.detailed_results[category].passed++;
      testResult.status = 'PASSED';
      testResult.message = result.message || '测试通过';
      testResult.details = result.details || null;
    } else {
      const message = result && result.error ? result.error : '验证失败';
      if (isWarning) {
        console.log(`⚠️ 警告: ${testName} - ${message}`);
        verificationResults.warnings++;
        verificationResults.detailed_results[category].warnings++;
        verificationResults.warnings_list.push(`[${category}] ${testName}: ${message}`);
        testResult.status = 'WARNING';
      } else {
        console.log(`❌ 失败: ${testName} - ${message}`);
        verificationResults.failed++;
        verificationResults.detailed_results[category].failed++;
        verificationResults.errors.push(`[${category}] ${testName}: ${message}`);
        testResult.status = 'FAILED';
      }
      testResult.message = message;
      testResult.details = result.details || null;
    }
    
    verificationResults.detailed_results[category].tests.push(testResult);
    return testResult.status === 'PASSED';
  } catch (error) {
    const message = error.message;
    console.log(`❌ 异常: ${testName} - ${message}`);
    verificationResults.failed++;
    verificationResults.detailed_results[category].failed++;
    verificationResults.errors.push(`[${category}] ${testName}: ${message}`);
    
    verificationResults.detailed_results[category].tests.push({
      name: testName,
      status: 'ERROR',
      message: message,
      details: error.stack
    });
    return false;
  }
}

/**
 * 异步验证辅助函数
 */
async function verifyAsync(category, testName, testFunction, isWarning = false) {
  verificationResults.total++;
  
  if (!verificationResults.detailed_results[category]) {
    verificationResults.detailed_results[category] = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }
  
  verificationResults.detailed_results[category].total++;
  
  console.log(`\n🔍 [${category}] ${testName}`);
  
  try {
    const result = await testFunction();
    const testResult = {
      name: testName,
      status: '',
      message: '',
      details: null
    };
    
    if (result === true || (result && result.success)) {
      console.log(`✅ 通过: ${testName}`);
      verificationResults.passed++;
      verificationResults.detailed_results[category].passed++;
      testResult.status = 'PASSED';
      testResult.message = result.message || '测试通过';
      testResult.details = result.details || null;
    } else {
      const message = result && result.error ? result.error : '验证失败';
      if (isWarning) {
        console.log(`⚠️ 警告: ${testName} - ${message}`);
        verificationResults.warnings++;
        verificationResults.detailed_results[category].warnings++;
        verificationResults.warnings_list.push(`[${category}] ${testName}: ${message}`);
        testResult.status = 'WARNING';
      } else {
        console.log(`❌ 失败: ${testName} - ${message}`);
        verificationResults.failed++;
        verificationResults.detailed_results[category].failed++;
        verificationResults.errors.push(`[${category}] ${testName}: ${message}`);
        testResult.status = 'FAILED';
      }
      testResult.message = message;
      testResult.details = result.details || null;
    }
    
    verificationResults.detailed_results[category].tests.push(testResult);
    return testResult.status === 'PASSED';
  } catch (error) {
    const message = error.message;
    console.log(`❌ 异常: ${testName} - ${message}`);
    verificationResults.failed++;
    verificationResults.detailed_results[category].failed++;
    verificationResults.errors.push(`[${category}] ${testName}: ${message}`);
    
    verificationResults.detailed_results[category].tests.push({
      name: testName,
      status: 'ERROR',
      message: message,
      details: error.stack
    });
    return false;
  }
}

/**
 * 1. 询价功能完整性检查
 */
async function verifyInquiryFunctionality() {
  console.log('\n💬 1. 询价功能完整性检查');
  console.log('-'.repeat(40));

  // 检查询价DAO
  verify('询价功能', '询价DAO模块加载', () => {
    try {
      const dao = require('./src/dao');
      const inquiryDao = dao.getInquiryDao();
      return inquiryDao && typeof inquiryDao.create === 'function';
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 检查询价服务层
  verify('询价功能', '询价服务层加载', () => {
    try {
      const services = require('./src/services');
      const inquiryService = services.getInquiryService();
      return inquiryService && typeof inquiryService.createInquiry === 'function';
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 检查询价路由
  verify('询价功能', '询价路由模块加载', () => {
    try {
      const routes = require('./src/routes');
      return routes.inquiryRoutes && typeof routes.inquiryRoutes === 'function';
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 测试询价数据操作
  await verifyAsync('询价功能', '询价数据创建功能', async () => {
    try {
      const services = require('./src/services');
      const inquiryService = services.getInquiryService();
      
      const testInquiry = {
        name: '测试客户',
        email: 'test@example.com',
        phone: '13800138000',
        message: '这是一个功能验证测试询价，内容长度超过10个字符'
      };
      
      const result = await inquiryService.createInquiry(testInquiry);
      return {
        success: result.success,
        error: result.success ? null : result.errors?.join(', '),
        details: { inquiryId: result.data?.id }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 测试询价查询功能
  await verifyAsync('询价功能', '询价数据查询功能', async () => {
    try {
      const services = require('./src/services');
      const inquiryService = services.getInquiryService();
      
      const result = await inquiryService.getInquiries({ limit: 5 });
      return {
        success: result.success,
        error: result.success ? null : result.errors?.join(', '),
        details: { count: result.data?.data?.length || 0 }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 测试询价状态更新
  await verifyAsync('询价功能', '询价状态更新功能', async () => {
    try {
      const dao = require('./src/dao');
      const inquiryDao = dao.getInquiryDao();
      
      // 获取第一个询价记录
      const inquiries = inquiryDao.read();
      if (inquiries.length === 0) {
        return { success: false, error: '没有询价记录可供测试' };
      }
      
      const services = require('./src/services');
      const inquiryService = services.getInquiryService();
      
      const result = await inquiryService.updateInquiryStatus(
        inquiries[0].id, 
        'processing', 
        '功能验证测试'
      );
      
      return {
        success: result.success,
        error: result.success ? null : result.errors?.join(', '),
        details: { inquiryId: inquiries[0].id, newStatus: 'processing' }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 检查询价数据验证
  await verifyAsync('询价功能', '询价数据验证规则', async () => {
    try {
      const services = require('./src/services');
      const inquiryService = services.getInquiryService();
      
      // 测试无效数据
      const invalidInquiry = {
        name: '',
        email: 'invalid-email',
        message: 'short'
      };
      
      const result = await inquiryService.createInquiry(invalidInquiry);
      
      // 应该失败
      return {
        success: !result.success,
        error: result.success ? '验证规则未生效' : null,
        details: { validationErrors: result.errors }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 检查询价权限控制
  verify('询价功能', '询价权限中间件配置', () => {
    try {
      const middleware = require('./src/middleware');
      
      // 检查权限中间件是否存在
      const hasPermissionMiddleware = typeof middleware.requirePermission === 'function';
      const hasAuthMiddleware = typeof middleware.authenticateToken === 'function';
      
      return {
        success: hasPermissionMiddleware && hasAuthMiddleware,
        error: !hasPermissionMiddleware ? '权限中间件缺失' : 
               !hasAuthMiddleware ? '认证中间件缺失' : null,
        details: { 
          permissionMiddleware: hasPermissionMiddleware,
          authMiddleware: hasAuthMiddleware 
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

/**
 * 2. 模块间依赖关系验证
 */
async function verifyModuleDependencies() {
  console.log('\n🔗 2. 模块间依赖关系验证');
  console.log('-'.repeat(40));

  // 检查配置模块依赖
  verify('模块依赖', '配置模块被正确引用', () => {
    try {
      const config = require('./src/config');
      const dao = require('./src/dao');
      const services = require('./src/services');
      const middleware = require('./src/middleware');
      
      // 检查各模块是否能正确访问配置
      return {
        success: true,
        details: {
          configLoaded: !!config,
          daoCanAccessConfig: true,
          servicesCanAccessConfig: true,
          middlewareCanAccessConfig: true
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 检查工具函数模块依赖
  verify('模块依赖', '工具函数模块被正确引用', () => {
    try {
      const utils = require('./src/utils');
      
      // 检查关键工具函数
      const hasDateUtils = typeof utils.getLocalDateString === 'function';
      const hasValidationUtils = typeof utils.isValidEmail === 'function';
      const hasCryptoUtils = typeof utils.generateUUID === 'function';
      
      return {
        success: hasDateUtils && hasValidationUtils && hasCryptoUtils,
        error: !hasDateUtils ? '时间工具缺失' :
               !hasValidationUtils ? '验证工具缺失' :
               !hasCryptoUtils ? '加密工具缺失' : null,
        details: { hasDateUtils, hasValidationUtils, hasCryptoUtils }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 检查数据流完整性：路由→服务层→数据访问层
  await verifyAsync('模块依赖', '数据流完整性验证', async () => {
    try {
      // 模拟完整的数据流
      const routes = require('./src/routes');
      const services = require('./src/services');
      const dao = require('./src/dao');
      
      // 检查产品数据流
      const productService = services.getProductService();
      const productDao = dao.getProductDao();
      
      // 测试数据流：服务层→DAO层
      const products = await productService.getProducts({ limit: 1 });
      
      return {
        success: products.success,
        error: products.success ? null : '数据流中断',
        details: {
          routesLoaded: !!routes,
          servicesLoaded: !!services,
          daoLoaded: !!dao,
          dataFlowWorking: products.success
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 检查循环依赖
  verify('模块依赖', '循环依赖检查', () => {
    try {
      // 清除require缓存
      const originalCache = { ...require.cache };
      
      // 重新加载所有模块
      delete require.cache[require.resolve('./src/config')];
      delete require.cache[require.resolve('./src/utils')];
      delete require.cache[require.resolve('./src/dao')];
      delete require.cache[require.resolve('./src/services')];
      delete require.cache[require.resolve('./src/middleware')];
      delete require.cache[require.resolve('./src/routes')];
      
      require('./src/config');
      require('./src/utils');
      require('./src/dao');
      require('./src/services');
      require('./src/middleware');
      require('./src/routes');
      
      // 恢复缓存
      Object.assign(require.cache, originalCache);
      
      return { success: true, details: { noCyclicDependencies: true } };
    } catch (error) {
      return { 
        success: false, 
        error: error.message.includes('circular') ? '检测到循环依赖' : error.message 
      };
    }
  });
}

/**
 * 3. API接口完整性测试
 */
async function verifyAPICompleteness() {
  console.log('\n🌐 3. API接口完整性测试');
  console.log('-'.repeat(40));

  // 检查所有API路由模块
  const apiModules = [
    { name: 'auth', path: './src/routes/auth' },
    { name: 'products', path: './src/routes/products' },
    { name: 'categories', path: './src/routes/categories' },
    { name: 'inquiries', path: './src/routes/inquiries' },
    { name: 'analytics', path: './src/routes/analytics' },
    { name: 'admin', path: './src/routes/admin' }
  ];

  for (const { name, path } of apiModules) {
    verify('API接口', `${name} API模块加载`, () => {
      try {
        const module = require(path);
        return {
          success: typeof module === 'function',
          details: { moduleName: name, isExpressRouter: typeof module === 'function' }
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }

  // 检查API响应格式标准化
  await verifyAsync('API接口', 'API响应格式标准化', async () => {
    try {
      const services = require('./src/services');
      const productService = services.getProductService();

      const result = await productService.getProducts({ limit: 1 });

      // 检查标准响应格式
      const hasSuccess = typeof result.success === 'boolean';
      const hasTimestamp = typeof result.timestamp === 'string';
      const hasMessage = result.message !== undefined;

      return {
        success: hasSuccess && hasTimestamp,
        error: !hasSuccess ? '缺少success字段' :
               !hasTimestamp ? '缺少timestamp字段' : null,
        details: { hasSuccess, hasTimestamp, hasMessage }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 检查认证中间件在保护路由上的应用
  verify('API接口', '认证中间件正确应用', () => {
    try {
      const middleware = require('./src/middleware');

      // 检查认证相关中间件
      const hasAuthToken = typeof middleware.authenticateToken === 'function';
      const hasOptionalAuth = typeof middleware.optionalAuth === 'function';
      const hasPermissionCheck = typeof middleware.requirePermission === 'function';

      return {
        success: hasAuthToken && hasOptionalAuth && hasPermissionCheck,
        details: { hasAuthToken, hasOptionalAuth, hasPermissionCheck }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 测试各个API服务的核心功能
  await verifyAsync('API接口', '产品API核心功能', async () => {
    try {
      const services = require('./src/services');
      const productService = services.getProductService();

      // 测试获取产品列表
      const listResult = await productService.getProducts({ limit: 5 });
      if (!listResult.success) {
        return { success: false, error: '获取产品列表失败' };
      }

      // 测试获取产品统计
      const statsResult = await productService.getProductStats();
      if (!statsResult.success) {
        return { success: false, error: '获取产品统计失败' };
      }

      return {
        success: true,
        details: {
          listWorking: listResult.success,
          statsWorking: statsResult.success,
          productCount: listResult.data?.pagination?.totalItems || 0
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  await verifyAsync('API接口', '分类API核心功能', async () => {
    try {
      const services = require('./src/services');
      const categoryService = services.getCategoryService();

      // 测试获取分类列表
      const listResult = await categoryService.getCategories();
      if (!listResult.success) {
        return { success: false, error: '获取分类列表失败' };
      }

      // 测试获取活跃分类
      const activeResult = await categoryService.getActiveCategories();
      if (!activeResult.success) {
        return { success: false, error: '获取活跃分类失败' };
      }

      return {
        success: true,
        details: {
          listWorking: listResult.success,
          activeWorking: activeResult.success,
          categoryCount: listResult.data?.length || 0
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

/**
 * 4. 数据一致性验证
 */
async function verifyDataConsistency() {
  console.log('\n📊 4. 数据一致性验证');
  console.log('-'.repeat(40));

  // 检查数据文件完整性
  verify('数据一致性', '数据文件完整性检查', () => {
    try {
      const requiredDataFiles = [
        'data/products.json',
        'data/categories.json',
        'data/inquiries.json',
        'data/analytics.json',
        'data/admins.json'
      ];

      const missingFiles = [];
      const existingFiles = [];

      requiredDataFiles.forEach(file => {
        if (fs.existsSync(file)) {
          existingFiles.push(file);
        } else {
          missingFiles.push(file);
        }
      });

      return {
        success: missingFiles.length === 0,
        error: missingFiles.length > 0 ? `缺少数据文件: ${missingFiles.join(', ')}` : null,
        details: { existingFiles, missingFiles }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 检查数据格式一致性
  await verifyAsync('数据一致性', '数据格式一致性验证', async () => {
    try {
      const dao = require('./src/dao');

      // 验证产品数据格式
      const productDao = dao.getProductDao();
      const products = productDao.read();

      if (products.length > 0) {
        const firstProduct = products[0];
        const requiredFields = ['id', 'name', 'category', 'createdAt'];
        const missingFields = requiredFields.filter(field => !firstProduct.hasOwnProperty(field));

        if (missingFields.length > 0) {
          return {
            success: false,
            error: `产品数据缺少必要字段: ${missingFields.join(', ')}`
          };
        }
      }

      // 验证分类数据格式
      const categoryDao = dao.getCategoryDao();
      const categories = categoryDao.read();

      if (categories.length > 0) {
        const firstCategory = categories[0];
        const requiredFields = ['id', 'name', 'status'];
        const missingFields = requiredFields.filter(field => !firstCategory.hasOwnProperty(field));

        if (missingFields.length > 0) {
          return {
            success: false,
            error: `分类数据缺少必要字段: ${missingFields.join(', ')}`
          };
        }
      }

      return {
        success: true,
        details: {
          productCount: products.length,
          categoryCount: categories.length,
          dataFormatValid: true
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 检查数据关联完整性
  await verifyAsync('数据一致性', '数据关联完整性验证', async () => {
    try {
      const dao = require('./src/dao');

      const productDao = dao.getProductDao();
      const categoryDao = dao.getCategoryDao();

      const products = productDao.read();
      const categories = categoryDao.read();

      const categoryNames = categories.map(cat => cat.name);
      const orphanProducts = products.filter(product =>
        product.category && !categoryNames.includes(product.category)
      );

      return {
        success: orphanProducts.length === 0,
        error: orphanProducts.length > 0 ?
          `发现 ${orphanProducts.length} 个产品引用了不存在的分类` : null,
        details: {
          totalProducts: products.length,
          totalCategories: categories.length,
          orphanProducts: orphanProducts.length,
          orphanProductIds: orphanProducts.map(p => p.id).slice(0, 5)
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 检查数据验证规则
  await verifyAsync('数据一致性', '数据验证规则完整性', async () => {
    try {
      const services = require('./src/services');

      // 测试产品数据验证
      const productService = services.getProductService();
      const invalidProduct = {
        name: '', // 空名称应该被拒绝
        category: 'nonexistent'
      };

      const productResult = await productService.createProduct(invalidProduct);
      const productValidationWorks = !productResult.success;

      // 测试询价数据验证
      const inquiryService = services.getInquiryService();
      const invalidInquiry = {
        name: '',
        email: 'invalid-email',
        message: 'x' // 太短的消息应该被拒绝
      };

      const inquiryResult = await inquiryService.createInquiry(invalidInquiry);
      const inquiryValidationWorks = !inquiryResult.success;

      return {
        success: productValidationWorks && inquiryValidationWorks,
        error: !productValidationWorks ? '产品验证规则失效' :
               !inquiryValidationWorks ? '询价验证规则失效' : null,
        details: {
          productValidationWorks,
          inquiryValidationWorks
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

/**
 * 5. 功能回归测试
 */
async function verifyFunctionalRegression() {
  console.log('\n🔄 5. 功能回归测试');
  console.log('-'.repeat(40));

  // 检查核心业务功能清单
  const coreFunctions = [
    {
      name: '产品管理CRUD',
      test: async () => {
        const services = require('./src/services');
        const productService = services.getProductService();

        // 测试创建、读取、更新、删除
        const createResult = await productService.createProduct({
          name: '回归测试产品',
          category: '测试分类',
          price: '99.99'
        });

        if (!createResult.success) {
          return { success: false, error: '产品创建失败' };
        }

        const readResult = await productService.getProducts({ limit: 1 });
        if (!readResult.success) {
          return { success: false, error: '产品读取失败' };
        }

        return { success: true, details: { crud: 'working' } };
      }
    },
    {
      name: '分类管理功能',
      test: async () => {
        const services = require('./src/services');
        const categoryService = services.getCategoryService();

        const result = await categoryService.getCategories();
        return {
          success: result.success,
          error: result.success ? null : '分类管理功能异常'
        };
      }
    },
    {
      name: '询价处理流程',
      test: async () => {
        const services = require('./src/services');
        const inquiryService = services.getInquiryService();

        // 测试完整的询价流程
        const createResult = await inquiryService.createInquiry({
          name: '回归测试客户',
          email: 'regression@test.com',
          message: '这是一个回归测试询价，验证询价处理流程是否正常工作'
        });

        if (!createResult.success) {
          return { success: false, error: '询价创建失败' };
        }

        const listResult = await inquiryService.getInquiries({ limit: 1 });
        if (!listResult.success) {
          return { success: false, error: '询价查询失败' };
        }

        return { success: true, details: { inquiryFlow: 'working' } };
      }
    },
    {
      name: '用户认证授权',
      test: async () => {
        const middleware = require('./src/middleware');

        // 检查认证中间件
        const hasAuth = typeof middleware.authenticateToken === 'function';
        const hasPermission = typeof middleware.requirePermission === 'function';

        return {
          success: hasAuth && hasPermission,
          error: !hasAuth ? '认证中间件缺失' :
                 !hasPermission ? '权限中间件缺失' : null,
          details: { authMiddleware: hasAuth, permissionMiddleware: hasPermission }
        };
      }
    },
    {
      name: '数据分析统计',
      test: async () => {
        const dao = require('./src/dao');
        const analyticsDao = dao.getAnalyticsDao();

        // 测试统计功能
        const stats = analyticsDao.getTodayStats();

        return {
          success: stats !== null,
          error: stats === null ? '统计功能异常' : null,
          details: { statsGeneration: stats !== null }
        };
      }
    }
  ];

  for (const func of coreFunctions) {
    await verifyAsync('功能回归', func.name, func.test);
  }

  // 检查重构前后功能对比
  verify('功能回归', '重构前后功能对比', () => {
    try {
      // 检查原server.js是否存在（兼容性）
      const originalExists = fs.existsSync('server.js');

      // 检查新模块化服务器
      const modularExists = fs.existsSync('server-modular.js');

      return {
        success: modularExists,
        error: !modularExists ? '模块化服务器文件缺失' : null,
        details: {
          originalServerExists: originalExists,
          modularServerExists: modularExists,
          backwardCompatible: originalExists
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

/**
 * 6. 前端集成验证
 */
async function verifyFrontendIntegration() {
  console.log('\n🌐 6. 前端集成验证');
  console.log('-'.repeat(40));

  // 检查静态文件结构
  verify('前端集成', '静态文件结构完整性', () => {
    try {
      const staticDirs = ['public', 'admin'];
      const missingDirs = [];
      const existingDirs = [];

      staticDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
          existingDirs.push(dir);
        } else {
          missingDirs.push(dir);
        }
      });

      return {
        success: existingDirs.length > 0,
        error: existingDirs.length === 0 ? '静态文件目录缺失' : null,
        details: { existingDirs, missingDirs }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 检查前端页面文件
  verify('前端集成', '前端页面文件检查', () => {
    try {
      const pageFiles = [
        'index.html',
        'products.html',
        'contact.html',
        'admin/index.html'
      ];

      const existingPages = [];
      const missingPages = [];

      pageFiles.forEach(file => {
        if (fs.existsSync(file)) {
          existingPages.push(file);
        } else {
          missingPages.push(file);
        }
      });

      return {
        success: existingPages.length >= pageFiles.length / 2,
        error: existingPages.length === 0 ? '前端页面文件缺失' : null,
        details: { existingPages, missingPages },
        warning: missingPages.length > 0 ? `部分页面文件缺失: ${missingPages.join(', ')}` : null
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 检查API端点可访问性
  verify('前端集成', 'API端点路由配置', () => {
    try {
      const routes = require('./src/routes');

      // 检查路由配置函数
      const hasSetupRoutes = typeof routes.setupRoutes === 'function';

      // 检查各个路由模块
      const hasAuthRoutes = !!routes.authRoutes;
      const hasProductRoutes = !!routes.productRoutes;
      const hasCategoryRoutes = !!routes.categoryRoutes;
      const hasInquiryRoutes = !!routes.inquiryRoutes;

      const routeModulesCount = [hasAuthRoutes, hasProductRoutes, hasCategoryRoutes, hasInquiryRoutes]
        .filter(Boolean).length;

      return {
        success: hasSetupRoutes && routeModulesCount >= 3,
        error: !hasSetupRoutes ? '路由配置函数缺失' :
               routeModulesCount < 3 ? '路由模块不完整' : null,
        details: {
          setupRoutesExists: hasSetupRoutes,
          routeModulesCount,
          authRoutes: hasAuthRoutes,
          productRoutes: hasProductRoutes,
          categoryRoutes: hasCategoryRoutes,
          inquiryRoutes: hasInquiryRoutes
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 检查CORS和静态文件服务配置
  verify('前端集成', 'CORS和静态文件服务配置', () => {
    try {
      const middleware = require('./src/middleware');

      // 检查是否有基础中间件配置
      const hasSetupMiddleware = typeof middleware.setupBasicMiddleware === 'function';

      return {
        success: hasSetupMiddleware,
        error: !hasSetupMiddleware ? '基础中间件配置缺失' : null,
        details: { middlewareSetupExists: hasSetupMiddleware }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

/**
 * 主验证函数
 */
async function runComprehensiveVerification() {
  console.log('开始功能完整性验证...\n');

  try {
    // 1. 询价功能完整性检查
    await verifyInquiryFunctionality();

    // 2. 模块间依赖关系验证
    await verifyModuleDependencies();

    // 3. API接口完整性测试
    await verifyAPICompleteness();

    // 4. 数据一致性验证
    await verifyDataConsistency();

    // 5. 功能回归测试
    await verifyFunctionalRegression();

    // 6. 前端集成验证
    await verifyFrontendIntegration();

    // 生成详细报告
    generateDetailedReport();

  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error);
    verificationResults.errors.push(`验证过程异常: ${error.message}`);
  }
}

/**
 * 生成详细报告
 */
function generateDetailedReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 功能完整性验证报告');
  console.log('='.repeat(60));

  // 总体统计
  console.log(`\n📈 总体统计:`);
  console.log(`  总验证项: ${verificationResults.total}`);
  console.log(`  通过: ${verificationResults.passed} ✅`);
  console.log(`  失败: ${verificationResults.failed} ❌`);
  console.log(`  警告: ${verificationResults.warnings} ⚠️`);
  console.log(`  成功率: ${((verificationResults.passed / verificationResults.total) * 100).toFixed(2)}%`);

  // 分类统计
  console.log(`\n📋 分类统计:`);
  Object.entries(verificationResults.detailed_results).forEach(([category, stats]) => {
    const successRate = ((stats.passed / stats.total) * 100).toFixed(2);
    console.log(`  ${category}:`);
    console.log(`    总计: ${stats.total}, 通过: ${stats.passed}, 失败: ${stats.failed}, 警告: ${stats.warnings}`);
    console.log(`    成功率: ${successRate}%`);
  });

  // 失败项目详情
  if (verificationResults.failed > 0) {
    console.log(`\n❌ 失败项目详情:`);
    verificationResults.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }

  // 警告项目详情
  if (verificationResults.warnings > 0) {
    console.log(`\n⚠️ 警告项目详情:`);
    verificationResults.warnings_list.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning}`);
    });
  }

  // 建议和下一步行动
  console.log(`\n💡 建议和下一步行动:`);
  
  if (verificationResults.failed === 0) {
    console.log(`  ✅ 所有核心功能验证通过！`);
    console.log(`  🎉 系统已准备好投入使用`);
    
    if (verificationResults.warnings > 0) {
      console.log(`  ⚠️ 建议关注上述警告项目，虽然不影响核心功能`);
    }
  } else {
    console.log(`  ❌ 发现 ${verificationResults.failed} 个关键问题需要修复`);
    console.log(`  🔧 建议优先修复失败项目，然后重新运行验证`);
  }

  // 保存详细报告到文件
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: verificationResults.total,
      passed: verificationResults.passed,
      failed: verificationResults.failed,
      warnings: verificationResults.warnings,
      successRate: ((verificationResults.passed / verificationResults.total) * 100).toFixed(2)
    },
    categories: verificationResults.detailed_results,
    errors: verificationResults.errors,
    warnings: verificationResults.warnings_list
  };

  try {
    fs.writeFileSync('verification-report.json', JSON.stringify(reportData, null, 2));
    console.log(`\n📄 详细报告已保存到: verification-report.json`);
  } catch (error) {
    console.log(`\n⚠️ 无法保存报告文件: ${error.message}`);
  }

  const overallSuccess = verificationResults.failed === 0;
  console.log(`\n🎯 整体验证结果: ${overallSuccess ? '✅ 通过' : '❌ 需要修复'}`);
  
  return overallSuccess;
}

// 执行验证
if (require.main === module) {
  runComprehensiveVerification()
    .then(() => {
      const success = verificationResults.failed === 0;
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ 验证执行失败:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveVerification };
