// 📊 基础数据访问层
// 提供统一的数据访问接口，支持JSON文件存储和缓存

const config = require('../config');
const utils = require('../utils');

class BaseDao {
  constructor(fileName, defaultData = []) {
    this.fileName = fileName;
    this.filePath = config.getDataFilePath(fileName);
    this.defaultData = defaultData;
    this.cache = new Map();
    this.cacheTimeout = config.cache.ttl;
  }

  /**
   * 读取数据
   * @param {boolean} useCache - 是否使用缓存
   * @returns {*} 数据
   */
  read(useCache = true) {
    try {
      // 检查缓存
      if (useCache && this.cache.has('data')) {
        const cached = this.cache.get('data');
        // 验证缓存数据有效性
        if (cached && cached.data !== undefined && cached.data !== null &&
            Date.now() - cached.timestamp < this.cacheTimeout) {
          console.log(`🎯 缓存命中: ${this.fileName}`);
          return cached.data;
        }
        // 缓存数据无效，清除缓存
        console.log(`🧹 清除无效缓存: ${this.fileName}`);
        this.cache.delete('data');
      }

      // 从文件读取
      console.log(`💾 从文件读取: ${this.fileName}`);

      // 使用绝对路径确保路径解析正确
      const absolutePath = require('path').resolve(this.filePath);
      console.log(`📁 绝对路径: ${absolutePath}`);

      // 检查文件是否存在
      if (!require('fs').existsSync(absolutePath)) {
        console.warn(`⚠️ 文件不存在，返回默认数据: ${absolutePath}`);
        return this.defaultData;
      }

      const data = utils.readJsonFile(absolutePath, this.defaultData);

      // 验证读取的数据
      if (data === undefined || data === null) {
        console.warn(`⚠️ 读取数据为空，返回默认数据: ${this.fileName}`);
        return this.defaultData;
      }

      // 更新缓存
      if (useCache) {
        this.cache.set('data', {
          data: JSON.parse(JSON.stringify(data)), // 深拷贝
          timestamp: Date.now()
        });
        console.log(`💾 数据已缓存: ${this.fileName}`);
      }

      return data;
    } catch (error) {
      console.error(`❌ 读取数据失败 ${this.fileName}:`, error.message);
      console.error(`❌ 错误堆栈:`, error.stack);
      // 抛出错误而不是返回默认数据，让调用者知道出现了问题
      throw new Error(`数据读取失败: ${this.fileName} - ${error.message}`);
    }
  }

  /**
   * 写入数据
   * @param {*} data - 要写入的数据
   * @param {boolean} backup - 是否备份
   * @returns {boolean} 是否成功
   */
  write(data, backup = true) {
    try {
      // 备份原文件
      if (backup && utils.fileExists(this.filePath)) {
        utils.backupFile(this.filePath);
      }

      // 写入文件
      const success = utils.writeJsonFile(this.filePath, data);
      
      if (success) {
        // 清除缓存
        this.cache.delete('data');
        console.log(`✅ 数据写入成功: ${this.fileName}`);
      }

      return success;
    } catch (error) {
      console.error(`❌ 写入数据失败 ${this.fileName}:`, error.message);
      return false;
    }
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
    console.log(`🧹 缓存已清除: ${this.fileName}`);
  }

  /**
   * 获取缓存统计
   * @returns {Object} 缓存统计信息
   */
  getCacheStats() {
    return {
      fileName: this.fileName,
      cacheSize: this.cache.size,
      hasCachedData: this.cache.has('data'),
      lastCacheTime: this.cache.has('data') ? 
        new Date(this.cache.get('data').timestamp).toISOString() : null
    };
  }

  /**
   * 检查文件是否存在
   * @returns {boolean} 文件是否存在
   */
  exists() {
    return utils.fileExists(this.filePath);
  }

  /**
   * 获取文件大小
   * @returns {number} 文件大小（字节）
   */
  getFileSize() {
    return utils.getFileSize(this.filePath);
  }

  /**
   * 初始化数据文件
   * @returns {boolean} 是否成功
   */
  initialize() {
    try {
      if (!this.exists()) {
        console.log(`🔧 初始化数据文件: ${this.fileName}`);
        return this.write(this.defaultData, false);
      }
      return true;
    } catch (error) {
      console.error(`❌ 初始化数据文件失败 ${this.fileName}:`, error.message);
      return false;
    }
  }

  /**
   * 验证数据完整性
   * @returns {Object} 验证结果
   */
  validate() {
    try {
      const data = this.read(false); // 不使用缓存，直接从文件读取
      
      const result = {
        isValid: true,
        errors: [],
        warnings: [],
        dataType: Array.isArray(data) ? 'array' : typeof data,
        itemCount: Array.isArray(data) ? data.length : Object.keys(data).length
      };

      // 基础验证
      if (data === null || data === undefined) {
        result.isValid = false;
        result.errors.push('数据为空');
      }

      // 文件大小检查
      const fileSize = this.getFileSize();
      if (fileSize > 10 * 1024 * 1024) { // 10MB
        result.warnings.push('文件大小超过10MB，可能影响性能');
      }

      return result;
    } catch (error) {
      return {
        isValid: false,
        errors: [`数据验证失败: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * 数据统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    try {
      const data = this.read();
      const fileSize = this.getFileSize();
      
      return {
        fileName: this.fileName,
        filePath: this.filePath,
        fileSize: fileSize,
        fileSizeFormatted: utils.formatFileSize(fileSize),
        dataType: Array.isArray(data) ? 'array' : typeof data,
        itemCount: Array.isArray(data) ? data.length : Object.keys(data).length,
        exists: this.exists(),
        lastModified: utils.fileExists(this.filePath) ? 
          require('fs').statSync(this.filePath).mtime.toISOString() : null,
        cacheStats: this.getCacheStats()
      };
    } catch (error) {
      console.error(`❌ 获取统计信息失败 ${this.fileName}:`, error.message);
      return null;
    }
  }
}

module.exports = BaseDao;
