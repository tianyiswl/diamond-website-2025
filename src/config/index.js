// 🔧 Diamond Website 配置管理模块
// 统一管理所有配置项，支持环境变量和默认值

// 🌏 设置服务器时区为上海时区 - 解决JWT令牌时间验证问题
process.env.TZ = "Asia/Shanghai";

// 导入子配置模块
const databaseConfig = require('./database');
const cacheConfig = require('./cache');
const securityConfig = require('./security');

// 主配置对象
const config = {
  // 🌐 服务器配置
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || '0.0.0.0',
    maxPortRetry: 10,
    environment: process.env.NODE_ENV || 'production',
    timezone: 'Asia/Shanghai'
  },

  // 📊 数据配置 - 从database模块导入
  database: databaseConfig.config,

  // 🚀 缓存配置 - 从cache模块导入
  cache: cacheConfig.config,

  // 🔐 安全配置 - 从security模块导入
  security: securityConfig.config,

  // 📁 文件上传配置
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: /jpeg|jpg|png|gif|webp/,
    uploadPath: './uploads/products',
    tempPath: './uploads/temp'
  },

  // 📈 性能监控配置
  monitoring: {
    enabled: true,
    slowQueryThreshold: 200, // 毫秒
    memoryWarningThreshold: 0.8, // 80%
    diskWarningThreshold: 0.9 // 90%
  },

  // 🌐 静态文件配置
  static: {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
    etag: true,
    lastModified: true,
    compression: true
  }
};

// 导出配置和工具函数
module.exports = {
  ...config,

  // 数据库工具函数
  getDataFilePath: databaseConfig.getDataFilePath,
  getBackupPath: databaseConfig.getBackupPath,
  checkDataFileExists: databaseConfig.checkDataFileExists,

  // 缓存工具函数
  initializeCache: cacheConfig.initializeCache,
  getCacheManagers: cacheConfig.getCacheManagers,
  clearAllCache: cacheConfig.clearAllCache,
  getCacheStats: cacheConfig.getCacheStats,

  // 安全工具函数
  validatePasswordStrength: securityConfig.validatePasswordStrength,
  isFileTypeAllowed: securityConfig.isFileTypeAllowed,
  sanitizeForLogging: securityConfig.sanitizeForLogging
};
