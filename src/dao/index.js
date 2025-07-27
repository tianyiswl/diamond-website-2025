// 📊 数据访问层统一导出文件
// 提供所有数据访问对象的单例实例

const BaseDao = require('./baseDao');
const ProductDao = require('./productDao');
const CategoryDao = require('./categoryDao');
const InquiryDao = require('./inquiryDao');
const AnalyticsDao = require('./analyticsDao');
const AdminDao = require('./adminDao');

// 创建单例实例
let productDao = null;
let categoryDao = null;
let inquiryDao = null;
let analyticsDao = null;
let adminDao = null;

/**
 * 获取产品数据访问对象
 * @returns {ProductDao} 产品DAO实例
 */
const getProductDao = () => {
  if (!productDao) {
    productDao = new ProductDao();
  }
  return productDao;
};

/**
 * 获取分类数据访问对象
 * @returns {CategoryDao} 分类DAO实例
 */
const getCategoryDao = () => {
  if (!categoryDao) {
    categoryDao = new CategoryDao();
  }
  return categoryDao;
};

/**
 * 获取询价数据访问对象
 * @returns {InquiryDao} 询价DAO实例
 */
const getInquiryDao = () => {
  if (!inquiryDao) {
    inquiryDao = new InquiryDao();
  }
  return inquiryDao;
};

/**
 * 获取分析数据访问对象
 * @returns {AnalyticsDao} 分析DAO实例
 */
const getAnalyticsDao = () => {
  if (!analyticsDao) {
    analyticsDao = new AnalyticsDao();
  }
  return analyticsDao;
};

/**
 * 获取管理员数据访问对象
 * @returns {AdminDao} 管理员DAO实例
 */
const getAdminDao = () => {
  if (!adminDao) {
    adminDao = new AdminDao();
  }
  return adminDao;
};

/**
 * 初始化所有数据文件
 * @returns {Object} 初始化结果
 */
const initializeAllData = () => {
  console.log('🔧 开始初始化所有数据文件...');
  
  const results = {
    success: true,
    initialized: [],
    errors: []
  };

  try {
    // 初始化各个数据文件
    const daos = [
      { name: 'products', dao: getProductDao() },
      { name: 'categories', dao: getCategoryDao() },
      { name: 'inquiries', dao: getInquiryDao() },
      { name: 'analytics', dao: getAnalyticsDao() },
      { name: 'admin-config', dao: getAdminDao() }
    ];

    daos.forEach(({ name, dao }) => {
      try {
        if (dao.initialize()) {
          results.initialized.push(name);
          console.log(`✅ ${name} 数据文件初始化成功`);
        } else {
          results.errors.push(`${name} 数据文件初始化失败`);
          console.error(`❌ ${name} 数据文件初始化失败`);
        }
      } catch (error) {
        results.errors.push(`${name} 初始化异常: ${error.message}`);
        console.error(`❌ ${name} 初始化异常:`, error);
      }
    });

    if (results.errors.length > 0) {
      results.success = false;
    }

    console.log(`🎉 数据文件初始化完成，成功: ${results.initialized.length}, 失败: ${results.errors.length}`);
    return results;
  } catch (error) {
    console.error('❌ 数据文件初始化过程中发生错误:', error);
    return {
      success: false,
      initialized: results.initialized,
      errors: [...results.errors, `初始化过程异常: ${error.message}`]
    };
  }
};

/**
 * 验证所有数据文件
 * @returns {Object} 验证结果
 */
const validateAllData = () => {
  console.log('🔍 开始验证所有数据文件...');
  
  const results = {
    success: true,
    validations: [],
    totalErrors: 0,
    totalWarnings: 0
  };

  try {
    const daos = [
      { name: 'products', dao: getProductDao() },
      { name: 'categories', dao: getCategoryDao() },
      { name: 'inquiries', dao: getInquiryDao() },
      { name: 'analytics', dao: getAnalyticsDao() },
      { name: 'admin-config', dao: getAdminDao() }
    ];

    daos.forEach(({ name, dao }) => {
      try {
        const validation = dao.validate();
        validation.fileName = name;
        results.validations.push(validation);
        
        if (!validation.isValid) {
          results.success = false;
          results.totalErrors += validation.errors.length;
          console.error(`❌ ${name} 数据验证失败:`, validation.errors);
        } else {
          console.log(`✅ ${name} 数据验证通过`);
        }

        if (validation.warnings && validation.warnings.length > 0) {
          results.totalWarnings += validation.warnings.length;
          console.warn(`⚠️ ${name} 数据验证警告:`, validation.warnings);
        }
      } catch (error) {
        results.success = false;
        results.totalErrors++;
        results.validations.push({
          fileName: name,
          isValid: false,
          errors: [`验证异常: ${error.message}`],
          warnings: []
        });
        console.error(`❌ ${name} 验证异常:`, error);
      }
    });

    console.log(`🎉 数据验证完成，错误: ${results.totalErrors}, 警告: ${results.totalWarnings}`);
    return results;
  } catch (error) {
    console.error('❌ 数据验证过程中发生错误:', error);
    return {
      success: false,
      validations: results.validations,
      totalErrors: results.totalErrors + 1,
      totalWarnings: results.totalWarnings,
      error: error.message
    };
  }
};

/**
 * 获取所有数据统计信息
 * @returns {Object} 统计信息
 */
const getAllStats = () => {
  console.log('📊 获取所有数据统计信息...');
  
  try {
    const stats = {
      products: getProductDao().getStats(),
      categories: getCategoryDao().getStats(),
      inquiries: getInquiryDao().getStats(),
      analytics: getAnalyticsDao().getStats(),
      adminConfig: getAdminDao().getStats(),
      summary: {
        totalFiles: 5,
        totalSize: 0,
        lastUpdated: new Date().toISOString()
      }
    };

    // 计算总大小
    Object.values(stats).forEach(stat => {
      if (stat && stat.fileSize) {
        stats.summary.totalSize += stat.fileSize;
      }
    });

    return stats;
  } catch (error) {
    console.error('❌ 获取统计信息失败:', error);
    return null;
  }
};

/**
 * 清除所有缓存
 * @returns {boolean} 是否成功
 */
const clearAllCache = () => {
  console.log('🧹 清除所有数据访问层缓存...');
  
  try {
    const daos = [
      getProductDao(),
      getCategoryDao(),
      getInquiryDao(),
      getAnalyticsDao(),
      getAdminDao()
    ];

    daos.forEach(dao => {
      if (dao && typeof dao.clearCache === 'function') {
        dao.clearCache();
      }
    });

    console.log('✅ 所有缓存已清除');
    return true;
  } catch (error) {
    console.error('❌ 清除缓存失败:', error);
    return false;
  }
};

module.exports = {
  // DAO类导出
  BaseDao,
  ProductDao,
  CategoryDao,
  InquiryDao,
  AnalyticsDao,
  AdminDao,
  
  // 单例实例获取函数
  getProductDao,
  getCategoryDao,
  getInquiryDao,
  getAnalyticsDao,
  getAdminDao,
  
  // 工具函数
  initializeAllData,
  validateAllData,
  getAllStats,
  clearAllCache
};
