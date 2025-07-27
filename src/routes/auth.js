// 🔐 认证路由模块
// 处理用户登录、登出、密码修改等认证相关功能

const express = require('express');
const router = express.Router();
const middleware = require('../middleware');
const dao = require('../dao');
const utils = require('../utils');

/**
 * 管理员登录
 * POST /api/auth/login
 */
router.post('/login', middleware.asyncErrorHandler(async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    // 输入验证
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空',
        code: 'MISSING_CREDENTIALS'
      });
    }

    console.log('🔍 登录尝试:', {
      username: username,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      rememberMe: !!rememberMe
    });

    // 查找管理员
    const adminDao = dao.getAdminDao();
    const admin = adminDao.findByUsername(username);

    if (!admin) {
      console.log('❌ 用户不存在:', username);
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // 检查账户状态
    if (admin.status !== 'active') {
      console.log('❌ 账户已禁用:', username);
      return res.status(401).json({
        success: false,
        message: '账户已禁用',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // 检查登录尝试次数
    const attemptCheck = middleware.auth.checkLoginAttempts(admin);
    if (!attemptCheck.allowed) {
      console.log('❌ 账户被锁定:', username);
      return res.status(401).json({
        success: false,
        message: attemptCheck.message,
        code: attemptCheck.code
      });
    }

    // 验证密码
    const passwordValid = await utils.verifyPassword(password, admin.password);
    
    if (!passwordValid) {
      console.log('❌ 密码错误:', username);
      
      // 记录失败的登录尝试
      await middleware.auth.recordLoginAttempt(admin, false, req);
      
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误',
        code: 'INVALID_CREDENTIALS',
        remainingAttempts: attemptCheck.remainingAttempts - 1
      });
    }

    // 登录成功，生成JWT令牌
    const token = middleware.auth.generateAuthToken(admin, rememberMe);
    
    // 记录成功的登录尝试
    await middleware.auth.recordLoginAttempt(admin, true, req);

    // 设置Cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 30天或24小时
    };

    res.cookie('auth_token', token, cookieOptions);

    console.log('✅ 登录成功:', {
      username: username,
      role: admin.role,
      rememberMe: !!rememberMe
    });

    // 记录操作日志
    middleware.logging.addOperationLog('login', `管理员登录: ${username}`, req, res, {
      success: true,
      username: username,
      role: admin.role
    });

    res.json({
      success: true,
      message: '登录成功',
      data: {
        username: admin.username,
        name: admin.name,
        role: admin.role,
        permissions: admin.permissions || [],
        lastLogin: admin.last_login
      }
    });
  } catch (error) {
    console.error('❌ 登录处理异常:', error);
    res.status(500).json({
      success: false,
      message: '登录过程中发生错误',
      code: 'LOGIN_ERROR'
    });
  }
}));

/**
 * 检查认证状态
 * GET /api/auth/check
 */
router.get('/check', middleware.authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: '认证有效',
    data: {
      username: req.user.username,
      name: req.user.name,
      role: req.user.role,
      permissions: req.user.permissions
    }
  });
});

/**
 * 管理员登出
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  const username = req.user ? req.user.username : 'unknown';
  
  // 清除认证Cookie
  res.clearCookie('auth_token');
  
  console.log('👋 用户登出:', username);
  
  // 记录操作日志
  middleware.logging.addOperationLog('logout', `管理员登出: ${username}`, req, res, {
    success: true,
    username: username
  });

  res.json({
    success: true,
    message: '登出成功'
  });
});

/**
 * 修改密码
 * POST /api/auth/change-password
 */
router.post('/change-password', middleware.authenticateToken, middleware.asyncErrorHandler(async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // 输入验证
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '所有密码字段都不能为空',
        code: 'MISSING_PASSWORDS'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '新密码和确认密码不匹配',
        code: 'PASSWORD_MISMATCH'
      });
    }

    // 验证新密码强度
    const passwordValidation = utils.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: '新密码不符合要求',
        code: 'WEAK_PASSWORD',
        errors: passwordValidation.errors
      });
    }

    // 获取当前用户信息
    const adminDao = dao.getAdminDao();
    const admin = adminDao.findByUsername(req.user.username);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }

    // 验证当前密码
    const currentPasswordValid = await utils.verifyPassword(currentPassword, admin.password);
    if (!currentPasswordValid) {
      console.log('❌ 当前密码验证失败:', req.user.username);
      return res.status(401).json({
        success: false,
        message: '当前密码错误',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // 检查新密码是否与当前密码相同
    const samePassword = await utils.verifyPassword(newPassword, admin.password);
    if (samePassword) {
      return res.status(400).json({
        success: false,
        message: '新密码不能与当前密码相同',
        code: 'SAME_PASSWORD'
      });
    }

    // 更新密码
    const updateResult = await adminDao.update(admin.id, {
      password: newPassword // adminDao.update会自动处理密码加密
    });

    if (!updateResult.success) {
      return res.status(500).json({
        success: false,
        message: '密码更新失败',
        code: 'PASSWORD_UPDATE_FAILED',
        errors: updateResult.errors
      });
    }

    console.log('✅ 密码修改成功:', req.user.username);

    // 记录操作日志
    middleware.logging.addOperationLog('change_password', `修改密码: ${req.user.username}`, req, res, {
      success: true,
      username: req.user.username
    });

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('❌ 修改密码异常:', error);
    res.status(500).json({
      success: false,
      message: '修改密码过程中发生错误',
      code: 'CHANGE_PASSWORD_ERROR'
    });
  }
}));

/**
 * 刷新令牌
 * POST /api/auth/refresh
 */
router.post('/refresh', middleware.authenticateToken, (req, res) => {
  try {
    // 生成新的令牌
    const adminDao = dao.getAdminDao();
    const admin = adminDao.findByUsername(req.user.username);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }

    const newToken = middleware.auth.generateAuthToken(admin, false);
    
    // 设置新的Cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24小时
    };

    res.cookie('auth_token', newToken, cookieOptions);

    console.log('🔄 令牌刷新成功:', req.user.username);

    res.json({
      success: true,
      message: '令牌刷新成功',
      data: {
        username: admin.username,
        name: admin.name,
        role: admin.role,
        permissions: admin.permissions || []
      }
    });
  } catch (error) {
    console.error('❌ 刷新令牌异常:', error);
    res.status(500).json({
      success: false,
      message: '刷新令牌过程中发生错误',
      code: 'REFRESH_TOKEN_ERROR'
    });
  }
});

module.exports = router;
