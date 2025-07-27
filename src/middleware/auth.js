// 🔐 认证中间件模块
// 处理JWT令牌验证和用户认证

const config = require('../config');
const utils = require('../utils');
const dao = require('../dao');

/**
 * JWT令牌验证中间件 - 优化版本，减少日志输出
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const authenticateToken = (req, res, next) => {
  try {
    // 从Cookie或Authorization头获取令牌
    const token = req.cookies.auth_token ||
                  (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    // 🔧 优化日志记录 - 只在必要时输出详细日志
    const isDebugMode = process.env.NODE_ENV === 'development';
    const shouldLogDetails = isDebugMode || !req.cookies.auth_token;

    if (shouldLogDetails) {
      console.log('🔍 认证检查:', {
        hasCookie: !!req.cookies.auth_token,
        hasHeader: !!req.headers.authorization,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
        url: req.url,
        method: req.method
      });
    }

    if (!token) {
      console.log('❌ 未找到认证令牌');
      // 清除可能存在的无效cookie
      res.clearCookie('auth_token');
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌',
        code: 'NO_TOKEN'
      });
    }

    // 获取管理员配置
    const adminDao = dao.getAdminDao();
    const adminConfig = adminDao.getConfig();
    
    if (!adminConfig) {
      console.log('❌ 系统配置加载失败');
      return res.status(500).json({
        success: false,
        message: '系统配置错误',
        code: 'CONFIG_ERROR'
      });
    }

    // 验证JWT令牌
    const decoded = utils.verifyToken(token, adminConfig.security.jwt_secret);
    
    if (!decoded) {
      console.log('❌ 令牌验证失败');
      res.clearCookie('auth_token');
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌',
        code: 'INVALID_TOKEN'
      });
    }

    // 时区兼容的令牌过期检查
    const now = Math.floor(Date.now() / 1000);
    const timeTolerance = config.security.login.timeTolerance; // 30分钟容差

    if (decoded.exp && decoded.exp + timeTolerance < now) {
      console.log('⚠️ 令牌已过期');
      res.clearCookie('auth_token');
      return res.status(401).json({
        success: false,
        message: '认证令牌已过期',
        code: 'TOKEN_EXPIRED'
      });
    }

    // 验证用户是否存在且状态正常
    const admin = adminDao.findByUsername(decoded.username);
    if (!admin) {
      console.log('❌ 用户不存在:', decoded.username);
      res.clearCookie('auth_token');
      return res.status(401).json({
        success: false,
        message: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }

    if (admin.status !== 'active') {
      console.log('❌ 用户账户已禁用:', decoded.username);
      res.clearCookie('auth_token');
      return res.status(401).json({
        success: false,
        message: '用户账户已禁用',
        code: 'USER_DISABLED'
      });
    }

    // 检查账户是否被锁定
    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      console.log('❌ 用户账户已锁定:', decoded.username);
      return res.status(401).json({
        success: false,
        message: '用户账户已锁定',
        code: 'USER_LOCKED'
      });
    }

    // 将用户信息添加到请求对象
    req.user = {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      permissions: admin.permissions || [],
      lastLogin: admin.last_login
    };

    console.log('✅ 令牌验证成功:', {
      username: decoded.username,
      role: admin.role,
      exp: new Date(decoded.exp * 1000).toISOString()
    });

    next();
  } catch (error) {
    console.error('❌ 认证中间件异常:', error);
    res.clearCookie('auth_token');
    return res.status(500).json({
      success: false,
      message: '认证过程中发生错误',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * 可选认证中间件（不强制要求认证）
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const optionalAuth = (req, res, next) => {
  try {
    const token = req.cookies.auth_token || 
                  (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
      // 没有令牌，继续执行但不设置用户信息
      return next();
    }

    // 有令牌，尝试验证
    const adminDao = dao.getAdminDao();
    const adminConfig = adminDao.getConfig();
    
    if (adminConfig) {
      const decoded = utils.verifyToken(token, adminConfig.security.jwt_secret);
      
      if (decoded) {
        const admin = adminDao.findByUsername(decoded.username);
        if (admin && admin.status === 'active') {
          req.user = {
            id: admin.id,
            username: admin.username,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            permissions: admin.permissions || []
          };
        }
      }
    }

    next();
  } catch (error) {
    console.error('❌ 可选认证中间件异常:', error);
    // 出错时继续执行，不阻断请求
    next();
  }
};

/**
 * 检查登录尝试次数
 * @param {Object} admin - 管理员对象
 * @returns {Object} 检查结果
 */
const checkLoginAttempts = (admin) => {
  const now = Date.now();
  const maxAttempts = config.security.login.maxAttempts;
  const lockoutDuration = config.security.login.lockoutDuration;

  // 如果账户被锁定且锁定时间未过期
  if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
    const remainingTime = Math.ceil((new Date(admin.locked_until) - now) / 1000 / 60);
    return {
      allowed: false,
      message: `账户已锁定，请在 ${remainingTime} 分钟后重试`,
      code: 'ACCOUNT_LOCKED'
    };
  }

  // 如果锁定时间已过期，重置登录尝试次数
  if (admin.locked_until && new Date(admin.locked_until) <= new Date()) {
    admin.login_attempts = 0;
    admin.locked_until = null;
  }

  // 检查登录尝试次数
  if (admin.login_attempts >= maxAttempts) {
    // 锁定账户
    admin.locked_until = new Date(now + lockoutDuration).toISOString();
    const lockoutMinutes = Math.ceil(lockoutDuration / 1000 / 60);
    
    return {
      allowed: false,
      message: `登录尝试次数过多，账户已锁定 ${lockoutMinutes} 分钟`,
      code: 'TOO_MANY_ATTEMPTS'
    };
  }

  return {
    allowed: true,
    remainingAttempts: maxAttempts - admin.login_attempts
  };
};

/**
 * 记录登录尝试
 * @param {Object} admin - 管理员对象
 * @param {boolean} success - 是否成功
 * @param {Object} req - 请求对象
 */
const recordLoginAttempt = async (admin, success, req) => {
  try {
    const adminDao = dao.getAdminDao();
    const config = adminDao.getConfig();
    
    if (!config || !config.admins || !config.admins[admin.id]) {
      return;
    }

    if (success) {
      // 登录成功，重置尝试次数
      config.admins[admin.id].login_attempts = 0;
      config.admins[admin.id].locked_until = null;
      config.admins[admin.id].last_login = utils.getISOString();
    } else {
      // 登录失败，增加尝试次数
      config.admins[admin.id].login_attempts = (config.admins[admin.id].login_attempts || 0) + 1;
    }

    // 保存配置
    adminDao.saveConfig(config);

    // 记录日志
    const logData = {
      action: success ? 'login_success' : 'login_failed',
      username: admin.username,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      timestamp: utils.getISOString()
    };

    console.log(success ? '✅ 登录成功记录:' : '❌ 登录失败记录:', logData);
  } catch (error) {
    console.error('❌ 记录登录尝试失败:', error);
  }
};

/**
 * 生成认证令牌
 * @param {Object} admin - 管理员对象
 * @param {boolean} rememberMe - 是否记住登录
 * @returns {string} JWT令牌
 */
const generateAuthToken = (admin, rememberMe = false) => {
  const adminDao = dao.getAdminDao();
  const adminConfig = adminDao.getConfig();
  
  const payload = {
    username: admin.username,
    role: admin.role,
    iat: Math.floor(Date.now() / 1000)
  };

  const options = {
    expiresIn: rememberMe ? '30d' : '24h',
    algorithm: 'HS256',
    issuer: 'diamond-website',
    audience: 'diamond-admin'
  };

  return utils.generateToken(payload, adminConfig.security.jwt_secret, options);
};

module.exports = {
  authenticateToken,
  optionalAuth,
  checkLoginAttempts,
  recordLoginAttempt,
  generateAuthToken
};
