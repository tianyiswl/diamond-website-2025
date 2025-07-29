// 🏗️ 基础服务类
// 提供通用的业务逻辑处理功能

const utils = require('../utils');

class BaseService {
  constructor(dao) {
    this.dao = dao;
  }

  /**
   * 标准化响应格式
   * @param {boolean} success - 是否成功
   * @param {*} data - 数据
   * @param {string} message - 消息
   * @param {Array} errors - 错误列表
   * @returns {Object} 标准化响应
   */
  createResponse(success, data = null, message = '', errors = []) {
    const response = {
      success,
      timestamp: utils.getISOString()
    };

    if (message) {
      response.message = message;
    }

    if (success) {
      if (data !== null) {
        response.data = data;
      }
    } else {
      response.errors = errors;
    }

    return response;
  }

  /**
   * 成功响应
   * @param {*} data - 数据
   * @param {string} message - 消息
   * @returns {Object} 成功响应
   */
  success(data = null, message = '') {
    return this.createResponse(true, data, message);
  }

  /**
   * 失败响应
   * @param {Array|string} errors - 错误信息
   * @param {string} message - 消息
   * @returns {Object} 失败响应
   */
  error(errors, message = '') {
    const errorArray = Array.isArray(errors) ? errors : [errors];
    return this.createResponse(false, null, message, errorArray);
  }

  /**
   * 验证必填字段
   * @param {Object} data - 数据对象
   * @param {Array} requiredFields - 必填字段列表
   * @returns {Object} 验证结果
   */
  validateRequired(data, requiredFields) {
    const errors = [];
    
    requiredFields.forEach(field => {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        errors.push(`${field} 是必填字段`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 清理数据对象
   * @param {Object} data - 原始数据
   * @param {Array} allowedFields - 允许的字段列表
   * @returns {Object} 清理后的数据
   */
  sanitizeData(data, allowedFields) {
    const sanitized = {};
    
    allowedFields.forEach(field => {
      if (data.hasOwnProperty(field)) {
        if (typeof data[field] === 'string') {
          sanitized[field] = utils.sanitizeString(data[field]);
        } else {
          sanitized[field] = data[field];
        }
      }
    });

    return sanitized;
  }

  /**
   * 分页处理
   * @param {Array} data - 数据数组
   * @param {Object} options - 分页选项
   * @returns {Object} 分页结果
   */
  paginate(data, options = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'id',
      sortOrder = 'desc'
    } = options;

    // 排序
    const sortedData = this.sortData(data, sortBy, sortOrder);

    // 分页
    const total = sortedData.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = sortedData.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        limit: parseInt(limit),
        totalItems: total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
      }
    };
  }

  /**
   * 数据排序
   * @param {Array} data - 数据数组
   * @param {string} sortBy - 排序字段
   * @param {string} sortOrder - 排序方向
   * @returns {Array} 排序后的数据
   */
  sortData(data, sortBy, sortOrder) {
    return [...data].sort((a, b) => {
      let valueA = a[sortBy];
      let valueB = b[sortBy];

      // 处理不同数据类型
      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = (valueB || '').toLowerCase();
      } else if (typeof valueA === 'number') {
        valueA = parseFloat(valueA) || 0;
        valueB = parseFloat(valueB) || 0;
      } else if (valueA instanceof Date) {
        valueA = new Date(valueA);
        valueB = new Date(valueB || 0);
      }

      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * 数据搜索
   * @param {Array} data - 数据数组
   * @param {string} query - 搜索关键词
   * @param {Array} searchFields - 搜索字段
   * @returns {Array} 搜索结果
   */
  searchData(data, query, searchFields) {
    if (!query || query.length < 2) {
      return data;
    }

    const searchLower = query.toLowerCase();
    
    return data.filter(item => {
      return searchFields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(searchLower);
      });
    });
  }

  /**
   * 数据筛选
   * @param {Array} data - 数据数组
   * @param {Object} filters - 筛选条件
   * @returns {Array} 筛选结果
   */
  filterData(data, filters) {
    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value || value === 'all') return true;
        return item[key] === value;
      });
    });
  }

  /**
   * 生成统计信息
   * @param {Array} data - 数据数组
   * @param {Array} groupFields - 分组字段
   * @returns {Object} 统计信息
   */
  generateStats(data, groupFields = []) {
    const stats = {
      total: data.length,
      groups: {}
    };

    groupFields.forEach(field => {
      stats.groups[field] = {};
      data.forEach(item => {
        const value = item[field] || 'unknown';
        stats.groups[field][value] = (stats.groups[field][value] || 0) + 1;
      });
    });

    return stats;
  }

  /**
   * 批量操作处理
   * @param {Array} items - 操作项目列表
   * @param {Function} operation - 操作函数
   * @returns {Object} 批量操作结果
   */
  async batchOperation(items, operation) {
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const item of items) {
      try {
        const result = await operation(item);
        
        if (result && result.success) {
          successCount++;
          results.push({
            item,
            success: true,
            data: result.data,
            message: '操作成功'
          });
        } else {
          errorCount++;
          results.push({
            item,
            success: false,
            message: result ? result.message : '操作失败'
          });
        }
      } catch (error) {
        errorCount++;
        results.push({
          item,
          success: false,
          message: error.message
        });
      }
    }

    return {
      success: errorCount === 0,
      totalCount: items.length,
      successCount,
      errorCount,
      results
    };
  }

  /**
   * 数据导出处理
   * @param {Array} data - 数据数组
   * @param {Object} options - 导出选项
   * @returns {Array} 导出数据
   */
  exportData(data, options = {}) {
    const {
      format = 'json',
      fields = null,
      dateRange = null
    } = options;

    let exportData = [...data];

    // 日期范围筛选
    if (dateRange && dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      exportData = exportData.filter(item => {
        const itemDate = new Date(item.createdAt || item.created_at || 0);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    // 字段筛选
    if (fields && Array.isArray(fields)) {
      exportData = exportData.map(item => {
        const filtered = {};
        fields.forEach(field => {
          if (item.hasOwnProperty(field)) {
            filtered[field] = item[field];
          }
        });
        return filtered;
      });
    }

    return exportData;
  }

  /**
   * 记录操作日志
   * @param {string} action - 操作类型
   * @param {string} description - 操作描述
   * @param {Object} data - 相关数据
   */
  logOperation(action, description, data = {}) {
    console.log(`📝 [${this.constructor.name}] ${action}: ${description}`, {
      timestamp: utils.getISOString(),
      data: data // 简化日志记录，避免依赖问题
    });
  }
}

module.exports = BaseService;
