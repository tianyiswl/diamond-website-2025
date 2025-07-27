// 📝 日志记录中间件模块
// 处理操作日志记录和访问日志

const config = require('../config');
const utils = require('../utils');
const dao = require('../dao');

/**
 * 操作日志记录中间件
 * @param {string} action - 操作类型
 * @param {string} description - 操作描述
 * @returns {Function} 中间件函数
 */
const logOperation = (action, description) => {
  return (req, res, next) => {
    // 保存原始的 res.json 方法
    const originalJson = res.json;
    
    // 重写 res.json 方法以在响应后记录日志
    res.json = function(data) {
      // 调用原始方法
      const result = originalJson.call(this, data);
      
      // 异步记录日志，不阻塞响应
      setImmediate(() => {
        try {
          addOperationLog(action, description, req, res, data);
        } catch (error) {
          console.error('❌ 记录操作日志失败:', error);
        }
      });
      
      return result;
    };
    
    next();
  };
};

/**
 * 访问日志记录中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const logAccess = (req, res, next) => {
  const startTime = Date.now();
  
  // 记录请求开始
  const requestId = utils.generateUUID();
  req.requestId = requestId;
  
  console.log(`🌐 [${requestId}] ${req.method} ${req.url} - 开始处理`, {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    referer: req.headers.referer,
    timestamp: utils.getLocalTimestamp()
  });

  // 保存原始的 res.end 方法
  const originalEnd = res.end;
  
  // 重写 res.end 方法以记录响应日志
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    // 记录响应完成
    console.log(`🏁 [${requestId}] ${req.method} ${req.url} - 处理完成`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length') || 0,
      user: req.user ? req.user.username : 'anonymous'
    });

    // 记录慢请求
    if (duration > config.monitoring.slowQueryThreshold) {
      console.warn(`🐌 [${requestId}] 慢请求警告: ${req.method} ${req.url} - ${duration}ms`);
    }

    // 调用原始方法
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * 错误日志记录中间件
 * @param {Error} error - 错误对象
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const logError = (error, req, res, next) => {
  const errorId = utils.generateUUID();
  
  // 记录详细错误信息
  const errorLog = {
    id: errorId,
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    user: req.user ? req.user.username : 'anonymous',
    timestamp: utils.getISOString(),
    requestId: req.requestId
  };

  console.error(`❌ [${errorId}] 请求处理错误:`, errorLog);

  // 记录到日志文件（如果需要）
  try {
    addErrorLog(errorLog);
  } catch (logError) {
    console.error('❌ 记录错误日志失败:', logError);
  }

  // 返回用户友好的错误响应
  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      code: 'INTERNAL_ERROR',
      errorId: errorId
    });
  }
};

/**
 * 添加操作日志
 * @param {string} action - 操作类型
 * @param {string} description - 操作描述
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {*} responseData - 响应数据
 */
const addOperationLog = (action, description, req, res, responseData) => {
  try {
    // 读取现有日志
    const logs = utils.readJsonFile('./data/logs.json', []);
    
    // 创建日志条目
    const logEntry = {
      id: utils.generateUUID(),
      action: action,
      description: description,
      user: req.user ? req.user.username : 'anonymous',
      userId: req.user ? req.user.id : null,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      url: req.url,
      method: req.method,
      statusCode: res.statusCode,
      success: res.statusCode < 400,
      timestamp: utils.getISOString(),
      requestId: req.requestId,
      // 清理敏感数据后的请求和响应信息
      requestData: config.sanitizeForLogging(req.body || {}),
      responseData: config.sanitizeForLogging(responseData || {})
    };

    // 添加到日志数组开头（最新的在前面）
    logs.unshift(logEntry);

    // 限制日志数量，保留最近1000条
    if (logs.length > 1000) {
      logs.splice(1000);
    }

    // 保存日志
    utils.writeJsonFile('./data/logs.json', logs);

    console.log(`📝 操作日志已记录: ${action} - ${description}`, {
      user: logEntry.user,
      success: logEntry.success,
      timestamp: logEntry.timestamp
    });
  } catch (error) {
    console.error('❌ 添加操作日志失败:', error);
  }
};

/**
 * 添加错误日志
 * @param {Object} errorLog - 错误日志对象
 */
const addErrorLog = (errorLog) => {
  try {
    // 读取现有错误日志
    const errorLogs = utils.readJsonFile('./data/error-logs.json', []);
    
    // 添加到错误日志数组开头
    errorLogs.unshift(errorLog);

    // 限制错误日志数量，保留最近500条
    if (errorLogs.length > 500) {
      errorLogs.splice(500);
    }

    // 保存错误日志
    utils.writeJsonFile('./data/error-logs.json', errorLogs);
  } catch (error) {
    console.error('❌ 保存错误日志失败:', error);
  }
};

/**
 * 获取操作日志
 * @param {Object} options - 查询选项
 * @returns {Array} 日志列表
 */
const getOperationLogs = (options = {}) => {
  try {
    const {
      action = '',
      user = '',
      limit = 50,
      startDate = null,
      endDate = null
    } = options;

    let logs = utils.readJsonFile('./data/logs.json', []);

    // 按操作类型筛选
    if (action && action !== 'all') {
      logs = logs.filter(log => log.action === action);
    }

    // 按用户筛选
    if (user) {
      logs = logs.filter(log => log.user === user);
    }

    // 按日期范围筛选
    if (startDate) {
      const start = new Date(startDate);
      logs = logs.filter(log => new Date(log.timestamp) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      logs = logs.filter(log => new Date(log.timestamp) <= end);
    }

    // 限制返回数量
    return logs.slice(0, parseInt(limit));
  } catch (error) {
    console.error('❌ 获取操作日志失败:', error);
    return [];
  }
};

/**
 * 获取错误日志
 * @param {Object} options - 查询选项
 * @returns {Array} 错误日志列表
 */
const getErrorLogs = (options = {}) => {
  try {
    const { limit = 50 } = options;
    const errorLogs = utils.readJsonFile('./data/error-logs.json', []);
    return errorLogs.slice(0, parseInt(limit));
  } catch (error) {
    console.error('❌ 获取错误日志失败:', error);
    return [];
  }
};

/**
 * 清空操作日志
 * @returns {boolean} 是否成功
 */
const clearOperationLogs = () => {
  try {
    utils.writeJsonFile('./data/logs.json', []);
    console.log('🧹 操作日志已清空');
    return true;
  } catch (error) {
    console.error('❌ 清空操作日志失败:', error);
    return false;
  }
};

/**
 * 清空错误日志
 * @returns {boolean} 是否成功
 */
const clearErrorLogs = () => {
  try {
    utils.writeJsonFile('./data/error-logs.json', []);
    console.log('🧹 错误日志已清空');
    return true;
  } catch (error) {
    console.error('❌ 清空错误日志失败:', error);
    return false;
  }
};

module.exports = {
  logOperation,
  logAccess,
  logError,
  addOperationLog,
  addErrorLog,
  getOperationLogs,
  getErrorLogs,
  clearOperationLogs,
  clearErrorLogs
};
