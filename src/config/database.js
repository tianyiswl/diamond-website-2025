// 📊 数据库配置模块
// 管理数据存储相关配置，支持JSON文件存储和未来的数据库迁移

const path = require('path');

const databaseConfig = {
  // 当前使用JSON文件存储
  type: 'json',
  
  // JSON文件配置
  json: {
    dataPath: './data',
    files: {
      products: 'products.json',
      categories: 'categories.json',
      analytics: 'analytics.json',
      inquiries: 'inquiries.json',
      logs: 'logs.json',
      adminConfig: 'admin-config.json',
      company: 'company.json',
      carousel: 'carousel.json'
    },
    backup: {
      enabled: true,
      path: './backup',
      maxBackups: 10,
      autoBackup: true,
      backupInterval: 24 * 60 * 60 * 1000 // 24小时
    }
  },

  // 未来数据库配置（预留）
  mysql: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'diamond_website',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    charset: 'utf8mb4',
    timezone: '+08:00',
    pool: {
      min: 2,
      max: 10,
      acquire: 30000,
      idle: 10000
    }
  },

  // 缓存数据库配置（预留）
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: process.env.REDIS_DB || 0,
    keyPrefix: 'diamond:',
    ttl: 300 // 5分钟默认TTL
  }
};

// 获取数据文件完整路径
const getDataFilePath = (fileName) => {
  return path.join(databaseConfig.json.dataPath, fileName);
};

// 获取备份文件路径
const getBackupPath = (fileName) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(databaseConfig.json.backup.path, `${fileName}.backup-${timestamp}`);
};

// 检查数据文件是否存在
const checkDataFileExists = (fileName) => {
  const fs = require('fs');
  return fs.existsSync(getDataFilePath(fileName));
};

module.exports = {
  config: databaseConfig,
  getDataFilePath,
  getBackupPath,
  checkDataFileExists
};
