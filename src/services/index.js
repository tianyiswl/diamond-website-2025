// 🏗️ 服务层统一导出文件
// 提供所有业务逻辑服务的单例实例

const BaseService = require('./baseService');
const ProductService = require('./productService');
const CategoryService = require('./categoryService');
const InquiryService = require('./inquiryService');

// 创建单例实例
let productService = null;
let categoryService = null;
let inquiryService = null;

/**
 * 获取产品服务实例
 * @returns {ProductService} 产品服务实例
 */
const getProductService = () => {
  if (!productService) {
    productService = new ProductService();
  }
  return productService;
};

/**
 * 获取分类服务实例
 * @returns {CategoryService} 分类服务实例
 */
const getCategoryService = () => {
  if (!categoryService) {
    categoryService = new CategoryService();
  }
  return categoryService;
};

/**
 * 获取询价服务实例
 * @returns {InquiryService} 询价服务实例
 */
const getInquiryService = () => {
  if (!inquiryService) {
    inquiryService = new InquiryService();
  }
  return inquiryService;
};

/**
 * 初始化所有服务
 * @returns {Object} 初始化结果
 */
const initializeServices = () => {
  console.log('🏗️ 初始化业务服务层...');
  
  try {
    // 预创建所有服务实例
    const services = {
      product: getProductService(),
      category: getCategoryService(),
      inquiry: getInquiryService()
    };

    console.log('✅ 业务服务层初始化完成');
    
    return {
      success: true,
      services: Object.keys(services),
      message: '所有业务服务初始化成功'
    };
  } catch (error) {
    console.error('❌ 业务服务层初始化失败:', error);
    return {
      success: false,
      error: error.message,
      message: '业务服务初始化失败'
    };
  }
};

/**
 * 获取所有服务的健康状态
 * @returns {Object} 健康状态信息
 */
const getServicesHealth = () => {
  console.log('🔍 检查服务健康状态...');
  
  const health = {
    timestamp: new Date().toISOString(),
    services: {},
    overall: 'healthy'
  };

  try {
    // 检查各个服务
    const services = [
      { name: 'product', service: getProductService() },
      { name: 'category', service: getCategoryService() },
      { name: 'inquiry', service: getInquiryService() }
    ];

    services.forEach(({ name, service }) => {
      try {
        // 简单的健康检查 - 确保服务实例存在且有必要的方法
        const hasRequiredMethods = [
          'success', 'error', 'validateRequired', 'sanitizeData'
        ].every(method => typeof service[method] === 'function');

        health.services[name] = {
          status: hasRequiredMethods ? 'healthy' : 'unhealthy',
          instance: !!service,
          methods: hasRequiredMethods
        };

        if (!hasRequiredMethods) {
          health.overall = 'degraded';
        }
      } catch (error) {
        health.services[name] = {
          status: 'error',
          error: error.message
        };
        health.overall = 'unhealthy';
      }
    });

    console.log(`✅ 服务健康检查完成，状态: ${health.overall}`);
    return health;
  } catch (error) {
    console.error('❌ 服务健康检查失败:', error);
    return {
      timestamp: new Date().toISOString(),
      overall: 'error',
      error: error.message
    };
  }
};

/**
 * 清理所有服务实例（用于测试或重启）
 */
const clearServiceInstances = () => {
  console.log('🧹 清理服务实例...');
  
  productService = null;
  categoryService = null;
  inquiryService = null;
  
  console.log('✅ 服务实例已清理');
};

/**
 * 获取服务统计信息
 * @returns {Object} 服务统计信息
 */
const getServicesStats = async () => {
  console.log('📊 获取服务统计信息...');
  
  try {
    const stats = {
      timestamp: new Date().toISOString(),
      services: {}
    };

    // 获取各个服务的统计信息
    try {
      const productStats = await getProductService().getProductStats();
      stats.services.product = productStats.success ? productStats.data : null;
    } catch (error) {
      stats.services.product = { error: error.message };
    }

    try {
      const categoryStats = await getCategoryService().getCategoryStats();
      stats.services.category = categoryStats.success ? categoryStats.data : null;
    } catch (error) {
      stats.services.category = { error: error.message };
    }

    try {
      const inquiryStats = await getInquiryService().getInquiryStats();
      stats.services.inquiry = inquiryStats.success ? inquiryStats.data : null;
    } catch (error) {
      stats.services.inquiry = { error: error.message };
    }

    console.log('✅ 服务统计信息获取完成');
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('❌ 获取服务统计信息失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 服务层中间件 - 统一错误处理
 * @param {Function} serviceMethod - 服务方法
 * @returns {Function} 包装后的中间件函数
 */
const serviceMiddleware = (serviceMethod) => {
  return async (req, res, next) => {
    try {
      const result = await serviceMethod(req, res);
      
      if (result && typeof result === 'object' && 'success' in result) {
        // 标准服务响应格式
        if (result.success) {
          res.json(result);
        } else {
          res.status(400).json(result);
        }
      } else {
        // 非标准响应，继续传递
        next();
      }
    } catch (error) {
      console.error('❌ 服务层中间件错误:', error);
      res.status(500).json({
        success: false,
        message: '服务处理失败',
        errors: [error.message],
        timestamp: new Date().toISOString()
      });
    }
  };
};

module.exports = {
  // 服务类导出
  BaseService,
  ProductService,
  CategoryService,
  InquiryService,
  
  // 单例实例获取函数
  getProductService,
  getCategoryService,
  getInquiryService,
  
  // 服务管理函数
  initializeServices,
  getServicesHealth,
  clearServiceInstances,
  getServicesStats,
  
  // 中间件
  serviceMiddleware
};
