// ✅ 数据验证工具模块
// 提供各种数据验证和清理功能

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否有效
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证手机号格式（中国大陆）
 * @param {string} phone - 手机号
 * @returns {boolean} 是否有效
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * 验证URL格式
 * @param {string} url - URL地址
 * @returns {boolean} 是否有效
 */
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 验证字符串长度
 * @param {string} str - 字符串
 * @param {number} minLength - 最小长度
 * @param {number} maxLength - 最大长度
 * @returns {boolean} 是否有效
 */
const isValidLength = (str, minLength = 0, maxLength = Infinity) => {
  if (typeof str !== 'string') return false;
  return str.length >= minLength && str.length <= maxLength;
};

/**
 * 验证数字范围
 * @param {number} num - 数字
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {boolean} 是否有效
 */
const isValidNumber = (num, min = -Infinity, max = Infinity) => {
  return typeof num === 'number' && !isNaN(num) && num >= min && num <= max;
};

/**
 * 清理HTML标签
 * @param {string} str - 输入字符串
 * @returns {string} 清理后的字符串
 */
const stripHtml = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '');
};

/**
 * 转义HTML特殊字符
 * @param {string} str - 输入字符串
 * @returns {string} 转义后的字符串
 */
const escapeHtml = (str) => {
  if (typeof str !== 'string') return '';
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  return str.replace(/[&<>"'/]/g, (match) => htmlEscapes[match]);
};

/**
 * 验证产品数据
 * @param {Object} product - 产品对象
 * @returns {Object} 验证结果 {isValid, errors}
 */
const validateProduct = (product) => {
  const errors = [];
  
  // 必填字段验证
  if (!product.name || !isValidLength(product.name, 1, 200)) {
    errors.push('产品名称必须填写且长度在1-200字符之间');
  }
  
  if (!product.category || !isValidLength(product.category, 1, 100)) {
    errors.push('产品分类必须填写且长度在1-100字符之间');
  }
  
  // 可选字段验证
  if (product.price && !isValidNumber(parseFloat(product.price), 0)) {
    errors.push('产品价格必须是大于等于0的数字');
  }
  
  if (product.stock && !isValidNumber(parseInt(product.stock), 0)) {
    errors.push('库存数量必须是大于等于0的整数');
  }
  
  if (product.description && !isValidLength(product.description, 0, 2000)) {
    errors.push('产品描述长度不能超过2000字符');
  }
  
  if (product.oe_number && !isValidLength(product.oe_number, 0, 100)) {
    errors.push('OE号码长度不能超过100字符');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 验证询价数据
 * @param {Object} inquiry - 询价对象
 * @returns {Object} 验证结果 {isValid, errors}
 */
const validateInquiry = (inquiry) => {
  const errors = [];
  
  // 必填字段验证
  if (!inquiry.name || !isValidLength(inquiry.name, 1, 100)) {
    errors.push('姓名必须填写且长度在1-100字符之间');
  }
  
  if (!inquiry.email || !isValidEmail(inquiry.email)) {
    errors.push('请填写有效的邮箱地址');
  }
  
  if (!inquiry.message || !isValidLength(inquiry.message, 10, 2000)) {
    errors.push('询价内容必须填写且长度在10-2000字符之间');
  }
  
  // 可选字段验证
  if (inquiry.phone && !isValidPhone(inquiry.phone)) {
    errors.push('请填写有效的手机号码');
  }
  
  if (inquiry.company && !isValidLength(inquiry.company, 0, 200)) {
    errors.push('公司名称长度不能超过200字符');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 验证分类数据
 * @param {Object} category - 分类对象
 * @returns {Object} 验证结果 {isValid, errors}
 */
const validateCategory = (category) => {
  const errors = [];
  
  if (!category.name || !isValidLength(category.name, 1, 100)) {
    errors.push('分类名称必须填写且长度在1-100字符之间');
  }
  
  if (category.description && !isValidLength(category.description, 0, 500)) {
    errors.push('分类描述长度不能超过500字符');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 清理和标准化字符串
 * @param {string} str - 输入字符串
 * @returns {string} 清理后的字符串
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  
  return str
    .trim() // 去除首尾空格
    .replace(/\s+/g, ' ') // 多个空格替换为单个空格
    .replace(/[\r\n\t]/g, ' ') // 换行符和制表符替换为空格
    .substring(0, 1000); // 限制最大长度
};

/**
 * 验证文件上传
 * @param {Object} file - 文件对象
 * @param {Object} options - 验证选项
 * @returns {Object} 验证结果 {isValid, errors}
 */
const validateFileUpload = (file, options = {}) => {
  const errors = [];
  const {
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  } = options;
  
  if (!file) {
    errors.push('请选择要上传的文件');
    return { isValid: false, errors };
  }
  
  // 检查文件大小
  if (file.size > maxSize) {
    errors.push(`文件大小不能超过 ${Math.round(maxSize / 1024 / 1024)}MB`);
  }
  
  // 检查文件类型
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push('不支持的文件类型');
  }
  
  // 检查文件扩展名
  const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  if (!allowedExtensions.includes(ext)) {
    errors.push('不支持的文件扩展名');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidUrl,
  isValidLength,
  isValidNumber,
  stripHtml,
  escapeHtml,
  validateProduct,
  validateInquiry,
  validateCategory,
  sanitizeString,
  validateFileUpload
};
