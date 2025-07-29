// 🛡️ 权限验证中间件模块
// 处理用户权限验证和访问控制

const dao = require('../dao');

/**
 * 权限检查中间件工厂函数
 * @param {string} permission - 需要的权限
 * @returns {Function} 中间件函数
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    try {
      // 检查用户是否已认证
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '用户未认证',
          code: 'NOT_AUTHENTICATED'
        });
      }

      // 获取管理员配置
      const adminDao = dao.getAdminDao();
      const adminConfig = adminDao.getConfig();
      
      if (!adminConfig) {
        return res.status(500).json({
          success: false,
          message: '系统配置错误',
          code: 'CONFIG_ERROR'
        });
      }

      // 获取当前用户的完整信息
      const currentAdmin = adminDao.findByUsername(req.user.username);
      if (!currentAdmin) {
        return res.status(401).json({
          success: false,
          message: '用户不存在',
          code: 'USER_NOT_FOUND'
        });
      }

      // 检查权限
      if (!hasPermission(currentAdmin, permission)) {
        console.log('❌ 权限不足:', {
          username: req.user.username,
          requiredPermission: permission,
          userPermissions: currentAdmin.permissions,
          url: req.url,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          message: '没有权限执行此操作',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredPermission: permission
        });
      }

      console.log('✅ 权限验证通过:', {
        username: req.user.username,
        permission: permission,
        url: req.url,
        method: req.method
      });

      next();
    } catch (error) {
      console.error('❌ 权限验证中间件异常:', error);
      return res.status(500).json({
        success: false,
        message: '权限验证过程中发生错误',
        code: 'PERMISSION_ERROR'
      });
    }
  };
};

/**
 * 角色检查中间件工厂函数
 * @param {string|Array} roles - 允许的角色（字符串或数组）
 * @returns {Function} 中间件函数
 */
const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '用户未认证',
          code: 'NOT_AUTHENTICATED'
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        console.log('❌ 角色权限不足:', {
          username: req.user.username,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          url: req.url,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          message: '角色权限不足',
          code: 'INSUFFICIENT_ROLE',
          requiredRoles: allowedRoles
        });
      }

      console.log('✅ 角色验证通过:', {
        username: req.user.username,
        role: req.user.role,
        url: req.url
      });

      next();
    } catch (error) {
      console.error('❌ 角色验证中间件异常:', error);
      return res.status(500).json({
        success: false,
        message: '角色验证过程中发生错误',
        code: 'ROLE_ERROR'
      });
    }
  };
};

/**
 * 超级管理员权限检查中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const requireSuperAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (req.user.role !== 'super_admin') {
      console.log('❌ 需要超级管理员权限:', {
        username: req.user.username,
        userRole: req.user.role,
        url: req.url,
        method: req.method
      });

      return res.status(403).json({
        success: false,
        message: '需要超级管理员权限',
        code: 'SUPER_ADMIN_REQUIRED'
      });
    }

    console.log('✅ 超级管理员验证通过:', {
      username: req.user.username,
      url: req.url
    });

    next();
  } catch (error) {
    console.error('❌ 超级管理员验证中间件异常:', error);
    return res.status(500).json({
      success: false,
      message: '权限验证过程中发生错误',
      code: 'PERMISSION_ERROR'
    });
  }
};

/**
 * 检查管理员权限
 * @param {Object} admin - 管理员对象
 * @param {string} permission - 权限名称
 * @returns {boolean} 是否有权限
 */
const hasPermission = (admin, permission) => {
  if (!admin || !admin.permissions) {
    return false;
  }

  // 超级管理员拥有所有权限
  if (admin.role === 'super_admin' || admin.permissions.includes('*')) {
    return true;
  }

  // 检查具体权限
  return admin.permissions.includes(permission);
};

/**
 * 检查是否为超级管理员
 * @param {Object} admin - 管理员对象
 * @returns {boolean} 是否为超级管理员
 */
const isSuperAdmin = (admin) => {
  return admin && admin.role === 'super_admin';
};

/**
 * 获取用户权限列表
 * @param {Object} req - 请求对象
 * @returns {Array} 权限列表
 */
const getUserPermissions = (req) => {
  if (!req.user) {
    return [];
  }

  const adminDao = dao.getAdminDao();
  const admin = adminDao.findByUsername(req.user.username);
  
  if (!admin) {
    return [];
  }

  return admin.permissions || [];
};

/**
 * 权限检查工具函数（用于在路由中手动检查）
 * @param {Object} req - 请求对象
 * @param {string} permission - 权限名称
 * @returns {boolean} 是否有权限
 */
const checkPermission = (req, permission) => {
  if (!req.user) {
    return false;
  }

  const adminDao = dao.getAdminDao();
  const admin = adminDao.findByUsername(req.user.username);
  
  if (!admin) {
    return false;
  }

  return hasPermission(admin, permission);
};

/**
 * 资源所有者检查中间件工厂函数
 * @param {Function} getResourceOwner - 获取资源所有者的函数
 * @returns {Function} 中间件函数
 */
const requireResourceOwner = (getResourceOwner) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '用户未认证',
          code: 'NOT_AUTHENTICATED'
        });
      }

      // 超级管理员可以访问所有资源
      if (req.user.role === 'super_admin') {
        return next();
      }

      // 获取资源所有者
      const resourceOwner = await getResourceOwner(req);
      
      if (!resourceOwner) {
        return res.status(404).json({
          success: false,
          message: '资源不存在',
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      // 检查是否为资源所有者
      if (resourceOwner !== req.user.username && resourceOwner !== req.user.id) {
        console.log('❌ 非资源所有者访问:', {
          username: req.user.username,
          resourceOwner: resourceOwner,
          url: req.url,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          message: '只能访问自己的资源',
          code: 'NOT_RESOURCE_OWNER'
        });
      }

      next();
    } catch (error) {
      console.error('❌ 资源所有者验证中间件异常:', error);
      return res.status(500).json({
        success: false,
        message: '权限验证过程中发生错误',
        code: 'PERMISSION_ERROR'
      });
    }
  };
};

module.exports = {
  requirePermission,
  requireRole,
  requireSuperAdmin,
  requireResourceOwner,
  hasPermission,
  isSuperAdmin,
  getUserPermissions,
  checkPermission
};
