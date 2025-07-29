// 🛠️ 中间件模块统一导出文件
// 提供所有中间件的统一访问接口

const auth = require('./auth');
const permission = require('./permission');
const logging = require('./logging');
const error = require('./error');

// Express基础中间件配置
const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const config = require('../config');

/**
 * 配置基础中间件
 * @param {Object} app - Express应用实例
 */
const setupBasicMiddleware = (app) => {
  console.log('🔧 配置基础中间件...');

  // 启用gzip压缩
  app.use(compression());

  // 解析JSON和URL编码的请求体
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 解析Cookie
  app.use(cookieParser());

  // 静态文件服务配置
  app.use(express.static('.', {
    maxAge: config.static.maxAge,
    etag: config.static.etag,
    lastModified: config.static.lastModified
  }));

  console.log('✅ 基础中间件配置完成');
};

/**
 * 配置日志中间件
 * @param {Object} app - Express应用实例
 */
const setupLoggingMiddleware = (app) => {
  console.log('🔧 配置日志中间件...');

  // 访问日志记录
  app.use(logging.logAccess);

  console.log('✅ 日志中间件配置完成');
};

/**
 * 配置错误处理中间件
 * @param {Object} app - Express应用实例
 */
const setupErrorMiddleware = (app) => {
  console.log('🔧 配置错误处理中间件...');

  // 404错误处理（必须在所有路由之后）
  app.use(error.notFoundHandler);

  // 全局错误处理（必须在最后）
  app.use(error.globalErrorHandler);

  // 设置进程错误处理器
  error.setupProcessErrorHandlers();

  console.log('✅ 错误处理中间件配置完成');
};

/**
 * 配置所有中间件
 * @param {Object} app - Express应用实例
 */
const setupAllMiddleware = (app) => {
  console.log('🚀 开始配置所有中间件...');

  // 基础中间件
  setupBasicMiddleware(app);

  // 日志中间件
  setupLoggingMiddleware(app);

  console.log('✅ 中间件配置完成，错误处理中间件将在路由配置后设置');
};

module.exports = {
  // 中间件模块
  auth,
  permission,
  logging,
  error,

  // 中间件配置函数
  setupBasicMiddleware,
  setupLoggingMiddleware,
  setupErrorMiddleware,
  setupAllMiddleware,

  // 常用中间件直接导出
  authenticateToken: auth.authenticateToken,
  optionalAuth: auth.optionalAuth,
  requirePermission: permission.requirePermission,
  requireRole: permission.requireRole,
  requireSuperAdmin: permission.requireSuperAdmin,
  logOperation: logging.logOperation,
  logAccess: logging.logAccess,
  asyncErrorHandler: error.asyncErrorHandler,

  // 错误类
  ValidationError: error.ValidationError,
  UnauthorizedError: error.UnauthorizedError,
  ForbiddenError: error.ForbiddenError,
  NotFoundError: error.NotFoundError,
  ConflictError: error.ConflictError,
  TooManyRequestsError: error.TooManyRequestsError
};
