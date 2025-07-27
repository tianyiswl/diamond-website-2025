// 🛠️ 工具函数模块导出文件
// 统一导出所有工具函数，方便使用

const dateUtils = require('./dateUtils');
const fileUtils = require('./fileUtils');
const validationUtils = require('./validationUtils');
const cryptoUtils = require('./cryptoUtils');

module.exports = {
  // 时间处理工具
  ...dateUtils,

  // 文件操作工具
  ...fileUtils,

  // 数据验证工具
  ...validationUtils,

  // 加密工具
  ...cryptoUtils,

  // 分组导出（可选，便于按类别使用）
  date: dateUtils,
  file: fileUtils,
  validation: validationUtils,
  crypto: cryptoUtils
};
