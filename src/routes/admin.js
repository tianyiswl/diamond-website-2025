// 👤 管理员路由模块
// 处理管理员账户管理相关的API路由

const express = require('express');
const router = express.Router();
const middleware = require('../middleware');
const dao = require('../dao');

/**
 * 获取所有管理员
 * GET /api/admins
 */
router.get('/',
  middleware.authenticateToken,
  middleware.requireSuperAdmin,
  middleware.logOperation('admins_list', '获取管理员列表'),
  (req, res) => {
    try {
      const adminDao = dao.getAdminDao();
      const admins = adminDao.findAll();

      // 移除敏感信息
      const safeAdmins = admins.map(admin => ({
        id: admin.id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        status: admin.status,
        permissions: admin.permissions,
        last_login: admin.last_login,
        created_at: admin.created_at,
        updated_at: admin.updated_at
      }));

      res.json({
        success: true,
        data: safeAdmins
      });
    } catch (error) {
      console.error('❌ 获取管理员列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取管理员列表失败',
        code: 'GET_ADMINS_ERROR'
      });
    }
  }
);

/**
 * 获取单个管理员详情
 * GET /api/admins/:id
 */
router.get('/:id',
  middleware.authenticateToken,
  middleware.requireSuperAdmin,
  (req, res) => {
    try {
      const adminDao = dao.getAdminDao();
      const admin = adminDao.findById(req.params.id);

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: '管理员不存在',
          code: 'ADMIN_NOT_FOUND'
        });
      }

      // 移除敏感信息
      const safeAdmin = {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        status: admin.status,
        permissions: admin.permissions,
        last_login: admin.last_login,
        created_at: admin.created_at,
        updated_at: admin.updated_at
      };

      res.json({
        success: true,
        data: safeAdmin
      });
    } catch (error) {
      console.error('❌ 获取管理员详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取管理员详情失败',
        code: 'GET_ADMIN_ERROR'
      });
    }
  }
);

/**
 * 创建新管理员
 * POST /api/admins
 */
router.post('/',
  middleware.authenticateToken,
  middleware.requireSuperAdmin,
  middleware.logOperation('admin_create', '创建管理员'),
  middleware.asyncErrorHandler(async (req, res) => {
    try {
      const adminDao = dao.getAdminDao();
      const result = await adminDao.create(req.body);

      if (!result.success) {
        return res.status(400).json(result);
      }

      console.log('✅ 管理员创建成功:', result.data.username);

      // 移除敏感信息
      const safeAdmin = {
        id: result.data.id,
        username: result.data.username,
        email: result.data.email,
        name: result.data.name,
        role: result.data.role,
        status: result.data.status,
        permissions: result.data.permissions,
        created_at: result.data.created_at
      };

      res.status(201).json({
        success: true,
        message: '管理员创建成功',
        data: safeAdmin
      });
    } catch (error) {
      console.error('❌ 创建管理员失败:', error);
      res.status(500).json({
        success: false,
        message: '创建管理员失败',
        code: 'CREATE_ADMIN_ERROR'
      });
    }
  })
);

/**
 * 更新管理员信息
 * PUT /api/admins/:id
 */
router.put('/:id',
  middleware.authenticateToken,
  middleware.requireSuperAdmin,
  middleware.logOperation('admin_update', '更新管理员'),
  middleware.asyncErrorHandler(async (req, res) => {
    try {
      const adminDao = dao.getAdminDao();
      const result = await adminDao.update(req.params.id, req.body);

      if (!result.success) {
        return res.status(400).json(result);
      }

      console.log('✅ 管理员更新成功:', result.data.username);

      // 移除敏感信息
      const safeAdmin = {
        id: result.data.id,
        username: result.data.username,
        email: result.data.email,
        name: result.data.name,
        role: result.data.role,
        status: result.data.status,
        permissions: result.data.permissions,
        updated_at: result.data.updated_at
      };

      res.json({
        success: true,
        message: '管理员更新成功',
        data: safeAdmin
      });
    } catch (error) {
      console.error('❌ 更新管理员失败:', error);
      res.status(500).json({
        success: false,
        message: '更新管理员失败',
        code: 'UPDATE_ADMIN_ERROR'
      });
    }
  })
);

/**
 * 删除管理员
 * DELETE /api/admins/:id
 */
router.delete('/:id',
  middleware.authenticateToken,
  middleware.requireSuperAdmin,
  middleware.logOperation('admin_delete', '删除管理员'),
  middleware.asyncErrorHandler(async (req, res) => {
    try {
      // 不能删除自己
      if (req.params.id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: '不能删除自己的账户',
          code: 'CANNOT_DELETE_SELF'
        });
      }

      const adminDao = dao.getAdminDao();
      const result = await adminDao.delete(req.params.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      console.log('✅ 管理员删除成功:', result.data.username);
      res.json({
        success: true,
        message: '管理员删除成功',
        data: {
          id: result.data.id,
          username: result.data.username
        }
      });
    } catch (error) {
      console.error('❌ 删除管理员失败:', error);
      res.status(500).json({
        success: false,
        message: '删除管理员失败',
        code: 'DELETE_ADMIN_ERROR'
      });
    }
  })
);

/**
 * 获取当前用户信息
 * GET /api/admins/me
 */
router.get('/me/profile',
  middleware.authenticateToken,
  (req, res) => {
    try {
      const adminDao = dao.getAdminDao();
      const admin = adminDao.findByUsername(req.user.username);

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
          code: 'USER_NOT_FOUND'
        });
      }

      // 返回当前用户信息（移除敏感信息）
      const profile = {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        permissions: admin.permissions,
        last_login: admin.last_login,
        created_at: admin.created_at
      };

      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      console.error('❌ 获取用户信息失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户信息失败',
        code: 'GET_PROFILE_ERROR'
      });
    }
  }
);

/**
 * 更新当前用户信息
 * PUT /api/admins/me/profile
 */
router.put('/me/profile',
  middleware.authenticateToken,
  middleware.logOperation('profile_update', '更新个人信息'),
  middleware.asyncErrorHandler(async (req, res) => {
    try {
      const { email, name } = req.body;
      
      // 只允许更新邮箱和姓名
      const updateData = {};
      if (email !== undefined) updateData.email = email;
      if (name !== undefined) updateData.name = name;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有要更新的数据',
          code: 'NO_UPDATE_DATA'
        });
      }

      const adminDao = dao.getAdminDao();
      const admin = adminDao.findByUsername(req.user.username);

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
          code: 'USER_NOT_FOUND'
        });
      }

      const result = await adminDao.update(admin.id, updateData);

      if (!result.success) {
        return res.status(400).json(result);
      }

      console.log('✅ 个人信息更新成功:', req.user.username);

      // 返回更新后的信息
      const profile = {
        id: result.data.id,
        username: result.data.username,
        email: result.data.email,
        name: result.data.name,
        role: result.data.role,
        permissions: result.data.permissions
      };

      res.json({
        success: true,
        message: '个人信息更新成功',
        data: profile
      });
    } catch (error) {
      console.error('❌ 更新个人信息失败:', error);
      res.status(500).json({
        success: false,
        message: '更新个人信息失败',
        code: 'UPDATE_PROFILE_ERROR'
      });
    }
  })
);

/**
 * 获取角色和权限配置
 * GET /api/admins/roles
 */
router.get('/roles/config',
  middleware.authenticateToken,
  middleware.requireSuperAdmin,
  (req, res) => {
    try {
      const adminDao = dao.getAdminDao();
      
      const rolesConfig = {
        roles: [
          { value: 'super_admin', label: '超级管理员', description: '拥有所有权限' },
          { value: 'admin', label: '管理员', description: '拥有大部分管理权限' },
          { value: 'editor', label: '编辑员', description: '可以编辑内容但不能删除' },
          { value: 'viewer', label: '查看员', description: '只能查看数据' }
        ],
        permissions: [
          { category: '产品管理', permissions: ['products.read', 'products.create', 'products.update', 'products.delete'] },
          { category: '分类管理', permissions: ['categories.read', 'categories.create', 'categories.update', 'categories.delete'] },
          { category: '询价管理', permissions: ['inquiries.read', 'inquiries.update', 'inquiries.delete'] },
          { category: '数据分析', permissions: ['analytics.read'] },
          { category: '文件上传', permissions: ['upload.create'] },
          { category: '管理员管理', permissions: ['admins.read', 'admins.create', 'admins.update', 'admins.delete'] }
        ],
        defaultPermissions: {
          super_admin: ['*'],
          admin: adminDao.getDefaultPermissions('admin'),
          editor: adminDao.getDefaultPermissions('editor'),
          viewer: adminDao.getDefaultPermissions('viewer')
        }
      };

      res.json({
        success: true,
        data: rolesConfig
      });
    } catch (error) {
      console.error('❌ 获取角色配置失败:', error);
      res.status(500).json({
        success: false,
        message: '获取角色配置失败',
        code: 'GET_ROLES_CONFIG_ERROR'
      });
    }
  }
);

module.exports = router;
