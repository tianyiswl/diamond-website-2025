// 👤 管理员数据访问层
// 专门处理管理员账户相关的数据操作

const BaseDao = require('./baseDao');
const utils = require('../utils');

class AdminDao extends BaseDao {
  constructor() {
    super('admin-config.json', {
      version: '1.0',
      security: {
        jwt_secret: 'diamond-website-secret-key-2025',
        bcrypt_rounds: 12,
        password_min_length: 6,
        session_timeout: 24 * 60 * 60 * 1000,
        max_login_attempts: 5,
        lockout_duration: 15 * 60 * 1000
      },
      admins: {}
    });
  }

  /**
   * 获取管理员配置
   * @returns {Object|null} 管理员配置
   */
  getConfig() {
    return this.read();
  }

  /**
   * 保存管理员配置
   * @param {Object} config - 配置对象
   * @returns {boolean} 是否成功
   */
  saveConfig(config) {
    return this.write(config);
  }

  /**
   * 获取所有管理员
   * @returns {Array} 管理员列表
   */
  findAll() {
    try {
      const config = this.getConfig();
      if (config && config.admins) {
        return Object.values(config.admins);
      }
      // 兼容旧版本配置
      if (config && config.admin) {
        return [config.admin];
      }
      return [];
    } catch (error) {
      console.error('获取管理员列表失败:', error);
      return [];
    }
  }

  /**
   * 根据用户名查找管理员
   * @param {string} username - 用户名
   * @returns {Object|null} 管理员对象或null
   */
  findByUsername(username) {
    try {
      const config = this.getConfig();
      if (!config) return null;

      if (config.admins) {
        // 在所有管理员中查找匹配的用户名
        for (const adminId in config.admins) {
          const admin = config.admins[adminId];
          if (admin.username === username) {
            return { ...admin, id: adminId };
          }
        }
      }

      // 兼容旧版本配置
      if (config.admin && config.admin.username === username) {
        return config.admin;
      }

      return null;
    } catch (error) {
      console.error('查找管理员失败:', error);
      return null;
    }
  }

  /**
   * 根据ID查找管理员
   * @param {string} adminId - 管理员ID
   * @returns {Object|null} 管理员对象或null
   */
  findById(adminId) {
    try {
      const config = this.getConfig();
      if (config && config.admins && config.admins[adminId]) {
        return { ...config.admins[adminId], id: adminId };
      }
      return null;
    } catch (error) {
      console.error('查找管理员失败:', error);
      return null;
    }
  }

  /**
   * 创建新管理员
   * @param {Object} adminData - 管理员数据
   * @returns {Object} 创建结果
   */
  async create(adminData) {
    try {
      const config = this.getConfig();
      if (!config) {
        return {
          success: false,
          errors: ['系统配置加载失败']
        };
      }

      // 检查用户名是否已存在
      const existingAdmin = this.findByUsername(adminData.username);
      if (existingAdmin) {
        return {
          success: false,
          errors: ['用户名已存在']
        };
      }

      // 验证密码强度
      const passwordValidation = utils.validatePasswordStrength(adminData.password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          errors: passwordValidation.errors
        };
      }

      // 生成管理员ID
      const adminId = utils.generateUUID();

      // 加密密码
      const hashedPassword = await utils.hashPassword(adminData.password, config.security.bcrypt_rounds);

      // 创建管理员对象
      const newAdmin = {
        username: adminData.username,
        email: adminData.email || '',
        name: adminData.name || adminData.username,
        role: adminData.role || 'admin',
        password: hashedPassword,
        permissions: this.getDefaultPermissions(adminData.role),
        status: 'active',
        login_attempts: 0,
        locked_until: null,
        last_login: null,
        last_password_change: utils.getISOString(),
        created_at: utils.getISOString(),
        updated_at: utils.getISOString()
      };

      // 确保admins对象存在
      if (!config.admins) {
        config.admins = {};
      }

      // 添加新管理员
      config.admins[adminId] = newAdmin;

      // 保存配置
      if (this.saveConfig(config)) {
        return {
          success: true,
          data: { ...newAdmin, id: adminId }
        };
      } else {
        return {
          success: false,
          errors: ['保存管理员配置失败']
        };
      }
    } catch (error) {
      console.error('创建管理员失败:', error);
      return {
        success: false,
        errors: ['创建管理员时发生错误']
      };
    }
  }

  /**
   * 更新管理员信息
   * @param {string} adminId - 管理员ID
   * @param {Object} updateData - 更新数据
   * @returns {Object} 更新结果
   */
  async update(adminId, updateData) {
    try {
      const config = this.getConfig();
      if (!config || !config.admins || !config.admins[adminId]) {
        return {
          success: false,
          errors: ['管理员不存在']
        };
      }

      // 如果更新用户名，检查是否与其他管理员重复
      if (updateData.username && updateData.username !== config.admins[adminId].username) {
        const existingAdmin = this.findByUsername(updateData.username);
        if (existingAdmin && existingAdmin.id !== adminId) {
          return {
            success: false,
            errors: ['用户名已存在']
          };
        }
      }

      // 如果更新密码，需要加密
      if (updateData.password) {
        const passwordValidation = utils.validatePasswordStrength(updateData.password);
        if (!passwordValidation.isValid) {
          return {
            success: false,
            errors: passwordValidation.errors
          };
        }
        updateData.password = await utils.hashPassword(updateData.password, config.security.bcrypt_rounds);
        updateData.last_password_change = utils.getISOString();
      }

      // 更新管理员信息
      const updatedAdmin = {
        ...config.admins[adminId],
        ...updateData,
        updated_at: utils.getISOString()
      };

      config.admins[adminId] = updatedAdmin;

      // 保存配置
      if (this.saveConfig(config)) {
        return {
          success: true,
          data: { ...updatedAdmin, id: adminId }
        };
      } else {
        return {
          success: false,
          errors: ['保存管理员配置失败']
        };
      }
    } catch (error) {
      console.error('更新管理员失败:', error);
      return {
        success: false,
        errors: ['更新管理员时发生错误']
      };
    }
  }

  /**
   * 删除管理员
   * @param {string} adminId - 管理员ID
   * @returns {Object} 删除结果
   */
  delete(adminId) {
    try {
      const config = this.getConfig();
      if (!config || !config.admins || !config.admins[adminId]) {
        return {
          success: false,
          errors: ['管理员不存在']
        };
      }

      // 检查是否为最后一个管理员
      const adminCount = Object.keys(config.admins).length;
      if (adminCount <= 1) {
        return {
          success: false,
          errors: ['不能删除最后一个管理员账户']
        };
      }

      const deletedAdmin = config.admins[adminId];
      delete config.admins[adminId];

      // 保存配置
      if (this.saveConfig(config)) {
        return {
          success: true,
          data: { ...deletedAdmin, id: adminId }
        };
      } else {
        return {
          success: false,
          errors: ['保存管理员配置失败']
        };
      }
    } catch (error) {
      console.error('删除管理员失败:', error);
      return {
        success: false,
        errors: ['删除管理员时发生错误']
      };
    }
  }

  /**
   * 检查管理员权限
   * @param {Object} admin - 管理员对象
   * @param {string} permission - 权限名称
   * @returns {boolean} 是否有权限
   */
  hasPermission(admin, permission) {
    if (!admin || !admin.permissions) {
      return false;
    }
    return admin.permissions.includes(permission) || admin.permissions.includes('*');
  }

  /**
   * 检查是否为超级管理员
   * @param {Object} admin - 管理员对象
   * @returns {boolean} 是否为超级管理员
   */
  isSuperAdmin(admin) {
    return admin && admin.role === 'super_admin';
  }

  /**
   * 获取默认权限
   * @param {string} role - 角色
   * @returns {Array} 权限列表
   */
  getDefaultPermissions(role) {
    const permissions = {
      super_admin: ['*'], // 所有权限
      admin: [
        'products.read', 'products.create', 'products.update', 'products.delete',
        'categories.read', 'categories.create', 'categories.update', 'categories.delete',
        'inquiries.read', 'inquiries.update',
        'analytics.read',
        'upload.create'
      ],
      editor: [
        'products.read', 'products.create', 'products.update',
        'categories.read', 'categories.create', 'categories.update',
        'inquiries.read', 'inquiries.update',
        'upload.create'
      ],
      viewer: [
        'products.read',
        'categories.read',
        'inquiries.read',
        'analytics.read'
      ]
    };

    return permissions[role] || permissions.viewer;
  }
}

module.exports = AdminDao;
