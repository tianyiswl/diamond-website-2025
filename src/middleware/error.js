// ⚠️ 错误处理中间件模块
// 统一处理应用程序错误和异常

const config = require('../config');
const utils = require('../utils');

/**
 * 全局错误处理中间件
 * @param {Error} error - 错误对象
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const globalErrorHandler = (error, req, res, next) => {
  // 如果响应已经发送，交给默认错误处理器
  if (res.headersSent) {
    return next(error);
  }

  const errorId = utils.generateUUID();
  const timestamp = utils.getISOString();

  // 记录错误详情
  const errorDetails = {
    id: errorId,
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    url: req.url,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    user: req.user ? req.user.username : 'anonymous',
    timestamp: timestamp,
    requestId: req.requestId
  };

  console.error(`❌ [${errorId}] 全局错误处理:`, errorDetails);

  // 根据错误类型返回不同的响应
  let statusCode = 500;
  let message = '服务器内部错误';
  let code = 'INTERNAL_ERROR';

  // 处理特定类型的错误
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = '数据验证失败';
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'UnauthorizedError' || error.message.includes('unauthorized')) {
    statusCode = 401;
    message = '未授权访问';
    code = 'UNAUTHORIZED';
  } else if (error.name === 'ForbiddenError' || error.message.includes('forbidden')) {
    statusCode = 403;
    message = '禁止访问';
    code = 'FORBIDDEN';
  } else if (error.name === 'NotFoundError' || error.message.includes('not found')) {
    statusCode = 404;
    message = '资源不存在';
    code = 'NOT_FOUND';
  } else if (error.name === 'ConflictError' || error.message.includes('conflict')) {
    statusCode = 409;
    message = '资源冲突';
    code = 'CONFLICT';
  } else if (error.name === 'TooManyRequestsError') {
    statusCode = 429;
    message = '请求过于频繁';
    code = 'TOO_MANY_REQUESTS';
  }

  // 构建错误响应
  const errorResponse = {
    success: false,
    message: message,
    code: code,
    errorId: errorId,
    timestamp: timestamp
  };

  // 在开发环境中包含更多错误信息
  if (config.server.environment === 'development') {
    errorResponse.details = {
      originalMessage: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method
    };
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 错误处理中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`路径 ${req.url} 不存在`);
  error.name = 'NotFoundError';
  error.statusCode = 404;
  
  console.log(`❌ 404错误: ${req.method} ${req.url}`, {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    referer: req.headers.referer
  });

  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API接口不存在',
      code: 'API_NOT_FOUND',
      path: req.path,
      method: req.method
    });
  } else {
    return res.status(404).json({
      success: false,
      message: '页面不存在',
      code: 'PAGE_NOT_FOUND',
      path: req.path
    });
  }
};

/**
 * 异步错误捕获包装器
 * @param {Function} fn - 异步函数
 * @returns {Function} 包装后的函数
 */
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 验证错误处理器
 * @param {Array} errors - 验证错误数组
 * @param {Object} res - 响应对象
 */
const handleValidationErrors = (errors, res) => {
  const errorResponse = {
    success: false,
    message: '数据验证失败',
    code: 'VALIDATION_ERROR',
    errors: errors,
    timestamp: utils.getISOString()
  };

  res.status(400).json(errorResponse);
};

/**
 * 数据库错误处理器
 * @param {Error} error - 数据库错误
 * @param {Object} res - 响应对象
 */
const handleDatabaseError = (error, res) => {
  console.error('❌ 数据库错误:', error);

  let message = '数据操作失败';
  let code = 'DATABASE_ERROR';

  // 处理特定的数据库错误
  if (error.message.includes('duplicate') || error.message.includes('unique')) {
    message = '数据已存在，不能重复创建';
    code = 'DUPLICATE_DATA';
  } else if (error.message.includes('foreign key') || error.message.includes('constraint')) {
    message = '数据关联约束错误';
    code = 'CONSTRAINT_ERROR';
  } else if (error.message.includes('not found')) {
    message = '数据不存在';
    code = 'DATA_NOT_FOUND';
  }

  const errorResponse = {
    success: false,
    message: message,
    code: code,
    timestamp: utils.getISOString()
  };

  res.status(500).json(errorResponse);
};

/**
 * 文件操作错误处理器
 * @param {Error} error - 文件错误
 * @param {Object} res - 响应对象
 */
const handleFileError = (error, res) => {
  console.error('❌ 文件操作错误:', error);

  let message = '文件操作失败';
  let code = 'FILE_ERROR';
  let statusCode = 500;

  if (error.code === 'ENOENT') {
    message = '文件不存在';
    code = 'FILE_NOT_FOUND';
    statusCode = 404;
  } else if (error.code === 'EACCES') {
    message = '文件访问权限不足';
    code = 'FILE_ACCESS_DENIED';
    statusCode = 403;
  } else if (error.code === 'ENOSPC') {
    message = '磁盘空间不足';
    code = 'DISK_FULL';
  } else if (error.message.includes('file too large')) {
    message = '文件大小超出限制';
    code = 'FILE_TOO_LARGE';
    statusCode = 413;
  }

  const errorResponse = {
    success: false,
    message: message,
    code: code,
    timestamp: utils.getISOString()
  };

  res.status(statusCode).json(errorResponse);
};

/**
 * 创建自定义错误类
 * @param {string} name - 错误名称
 * @param {number} statusCode - HTTP状态码
 * @returns {Function} 错误类构造函数
 */
const createCustomError = (name, statusCode = 500) => {
  return class extends Error {
    constructor(message, code = null) {
      super(message);
      this.name = name;
      this.statusCode = statusCode;
      this.code = code;
      Error.captureStackTrace(this, this.constructor);
    }
  };
};

// 预定义的自定义错误类
const ValidationError = createCustomError('ValidationError', 400);
const UnauthorizedError = createCustomError('UnauthorizedError', 401);
const ForbiddenError = createCustomError('ForbiddenError', 403);
const NotFoundError = createCustomError('NotFoundError', 404);
const ConflictError = createCustomError('ConflictError', 409);
const TooManyRequestsError = createCustomError('TooManyRequestsError', 429);

/**
 * 进程异常处理器
 */
const setupProcessErrorHandlers = () => {
  // 捕获未处理的Promise拒绝
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 未处理的Promise拒绝:', reason);
    console.error('Promise:', promise);
    
    // 记录错误但不退出进程
    const errorLog = {
      type: 'unhandledRejection',
      reason: reason.toString(),
      stack: reason.stack,
      timestamp: utils.getISOString()
    };
    
    try {
      const errorLogs = utils.readJsonFile('./data/error-logs.json', []);
      errorLogs.unshift(errorLog);
      utils.writeJsonFile('./data/error-logs.json', errorLogs.slice(0, 500));
    } catch (logError) {
      console.error('❌ 记录未处理Promise拒绝失败:', logError);
    }
  });

  // 捕获未捕获的异常
  process.on('uncaughtException', (error) => {
    console.error('❌ 未捕获的异常:', error);
    
    const errorLog = {
      type: 'uncaughtException',
      message: error.message,
      stack: error.stack,
      timestamp: utils.getISOString()
    };
    
    try {
      const errorLogs = utils.readJsonFile('./data/error-logs.json', []);
      errorLogs.unshift(errorLog);
      utils.writeJsonFile('./data/error-logs.json', errorLogs.slice(0, 500));
    } catch (logError) {
      console.error('❌ 记录未捕获异常失败:', logError);
    }
    
    // 优雅退出
    console.log('🔄 服务器将在1秒后重启...');
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
};

module.exports = {
  globalErrorHandler,
  notFoundHandler,
  asyncErrorHandler,
  handleValidationErrors,
  handleDatabaseError,
  handleFileError,
  createCustomError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
  setupProcessErrorHandlers
};
