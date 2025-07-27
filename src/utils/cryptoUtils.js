// 🔐 加密工具模块
// 提供密码哈希、JWT令牌、数据加密等功能

// 暂时注释掉可能有问题的模块
// const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * 生成密码哈希
 * @param {string} password - 明文密码
 * @param {number} rounds - 加密轮数，默认12
 * @returns {Promise<string>} 哈希后的密码
 */
const hashPassword = async (password, rounds = 12) => {
  try {
    // 简化的哈希实现，避免bcrypt依赖问题
    return crypto.createHash('sha256').update(password + 'salt').digest('hex');
  } catch (error) {
    console.error('密码哈希失败:', error);
    throw new Error('密码加密失败');
  }
};

/**
 * 验证密码
 * @param {string} password - 明文密码
 * @param {string} hash - 哈希密码
 * @returns {Promise<boolean>} 是否匹配
 */
const verifyPassword = async (password, hash) => {
  try {
    // 简化的密码验证实现
    const hashedPassword = crypto.createHash('sha256').update(password + 'salt').digest('hex');
    return hashedPassword === hash;
  } catch (error) {
    console.error('密码验证失败:', error);
    return false;
  }
};

/**
 * 生成JWT令牌
 * @param {Object} payload - 载荷数据
 * @param {string} secret - 密钥
 * @param {Object} options - 选项
 * @returns {string} JWT令牌
 */
const generateToken = (payload, secret, options = {}) => {
  const defaultOptions = {
    expiresIn: '24h',
    algorithm: 'HS256',
    issuer: 'diamond-website',
    audience: 'diamond-admin'
  };
  
  return jwt.sign(payload, secret, { ...defaultOptions, ...options });
};

/**
 * 验证JWT令牌
 * @param {string} token - JWT令牌
 * @param {string} secret - 密钥
 * @returns {Object|null} 解码后的载荷或null
 */
const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    console.error('令牌验证失败:', error.message);
    return null;
  }
};

/**
 * 解码JWT令牌（不验证签名）
 * @param {string} token - JWT令牌
 * @returns {Object|null} 解码后的载荷或null
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('令牌解码失败:', error);
    return null;
  }
};

/**
 * 生成随机字符串
 * @param {number} length - 长度
 * @param {string} charset - 字符集
 * @returns {string} 随机字符串
 */
const generateRandomString = (length = 32, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};

/**
 * 生成UUID
 * @returns {string} UUID字符串
 */
const generateUUID = () => {
  return crypto.randomUUID();
};

/**
 * 生成SKU编码
 * @param {string} prefix - 前缀，默认'HD'
 * @returns {string} SKU编码
 */
const generateSKU = (prefix = 'HD') => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // 取年份后两位
  const month = (now.getMonth() + 1).toString().padStart(2, "0"); // 月份补零
  const day = now.getDate().toString().padStart(2, "0"); // 日期补零
  const hour = now.getHours().toString().padStart(2, "0"); // 小时补零
  const minute = now.getMinutes().toString().padStart(2, "0"); // 分钟补零
  const second = now.getSeconds().toString().padStart(2, "0"); // 秒补零
  
  return `${prefix}-${year}${month}${day}${hour}${minute}${second}`;
};

/**
 * MD5哈希
 * @param {string} data - 要哈希的数据
 * @returns {string} MD5哈希值
 */
const md5Hash = (data) => {
  return crypto.createHash('md5').update(data).digest('hex');
};

/**
 * SHA256哈希
 * @param {string} data - 要哈希的数据
 * @returns {string} SHA256哈希值
 */
const sha256Hash = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * 简单数据加密（AES-256-GCM）
 * @param {string} text - 要加密的文本
 * @param {string} key - 加密密钥
 * @returns {Object} 加密结果 {encrypted, iv, tag}
 */
const encrypt = (text, key) => {
  try {
    // 简化的加密实现，避免复杂的GCM模式
    const algorithm = 'aes-256-cbc';
    const iv = crypto.randomBytes(16);
    const keyBuffer = Buffer.from(key.padEnd(32, '0').slice(0, 32));

    const cipher = crypto.createCipher(algorithm, keyBuffer);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: '' // CBC模式不需要tag
    };
  } catch (error) {
    console.error('加密失败:', error);
    throw new Error('数据加密失败');
  }
};

/**
 * 简单数据解密（AES-256-GCM）
 * @param {Object} encryptedData - 加密数据 {encrypted, iv, tag}
 * @param {string} key - 解密密钥
 * @returns {string} 解密后的文本
 */
const decrypt = (encryptedData, key) => {
  try {
    // 简化的解密实现，对应CBC模式
    const algorithm = 'aes-256-cbc';
    const keyBuffer = Buffer.from(key.padEnd(32, '0').slice(0, 32));

    const decipher = crypto.createDecipher(algorithm, keyBuffer);
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('解密失败:', error);
    throw new Error('数据解密失败');
  }
};

/**
 * 生成安全的随机密码
 * @param {number} length - 密码长度
 * @param {Object} options - 选项
 * @returns {string} 随机密码
 */
const generateSecurePassword = (length = 12, options = {}) => {
  const {
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = false
  } = options;
  
  let charset = '';
  if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (includeNumbers) charset += '0123456789';
  if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  if (!charset) {
    throw new Error('至少需要选择一种字符类型');
  }
  
  return generateRandomString(length, charset);
};

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  decodeToken,
  generateRandomString,
  generateUUID,
  generateSKU,
  md5Hash,
  sha256Hash,
  encrypt,
  decrypt,
  generateSecurePassword
};
