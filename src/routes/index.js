// 🌐 路由模块统一导出文件
// 配置和管理所有API路由

const express = require('express');
const authRoutes = require('./auth');
const productRoutes = require('./products');
const categoryRoutes = require('./categories');
const inquiryRoutes = require('./inquiries');
const analyticsRoutes = require('./analytics');
const adminRoutes = require('./admin');

/**
 * 配置所有API路由
 * @param {Object} app - Express应用实例
 */
const setupRoutes = (app) => {
  console.log('🌐 开始配置API路由...');

  // API路由前缀
  const apiPrefix = '/api';

  // 认证相关路由
  app.use(`${apiPrefix}/auth`, authRoutes);
  console.log('✅ 认证路由配置完成: /api/auth');

  // 产品管理路由
  app.use(`${apiPrefix}/products`, productRoutes);
  console.log('✅ 产品路由配置完成: /api/products');

  // 分类管理路由
  app.use(`${apiPrefix}/categories`, categoryRoutes);
  console.log('✅ 分类路由配置完成: /api/categories');

  // 询价管理路由
  app.use(`${apiPrefix}/inquiries`, inquiryRoutes);
  console.log('✅ 询价路由配置完成: /api/inquiries');

  // 数据分析路由
  app.use(`${apiPrefix}/analytics`, analyticsRoutes);
  console.log('✅ 分析路由配置完成: /api/analytics');

  // 管理员管理路由
  app.use(`${apiPrefix}/admins`, adminRoutes);
  console.log('✅ 管理员路由配置完成: /api/admins');

  // API根路径信息
  app.get(`${apiPrefix}`, (req, res) => {
    res.json({
      success: true,
      message: 'Diamond Website API',
      version: '2.0.0',
      endpoints: {
        auth: `${apiPrefix}/auth`,
        products: `${apiPrefix}/products`,
        categories: `${apiPrefix}/categories`,
        inquiries: `${apiPrefix}/inquiries`,
        analytics: `${apiPrefix}/analytics`,
        admins: `${apiPrefix}/admins`
      },
      documentation: '/api/docs',
      timestamp: new Date().toISOString()
    });
  });

  // API文档路由（简单版本）
  app.get(`${apiPrefix}/docs`, (req, res) => {
    res.json({
      success: true,
      message: 'Diamond Website API Documentation',
      version: '2.0.0',
      routes: {
        auth: {
          'POST /api/auth/login': '管理员登录',
          'GET /api/auth/check': '检查认证状态',
          'POST /api/auth/logout': '管理员登出',
          'POST /api/auth/change-password': '修改密码',
          'POST /api/auth/refresh': '刷新令牌'
        },
        products: {
          'GET /api/products': '获取产品列表',
          'GET /api/products/:id': '获取产品详情',
          'POST /api/products': '创建产品',
          'PUT /api/products/:id': '更新产品',
          'DELETE /api/products/:id': '删除产品',
          'GET /api/products/stats/summary': '获取产品统计',
          'POST /api/products/batch': '批量操作产品'
        },
        categories: {
          'GET /api/categories': '获取分类列表',
          'GET /api/categories/active': '获取活跃分类',
          'GET /api/categories/:id': '获取分类详情',
          'POST /api/categories': '创建分类',
          'PUT /api/categories/:id': '更新分类',
          'DELETE /api/categories/:id': '删除分类'
        },
        inquiries: {
          'GET /api/inquiries': '获取询价列表',
          'GET /api/inquiries/:id': '获取询价详情',
          'POST /api/inquiries': '创建询价（公开接口）',
          'PUT /api/inquiries/:id/status': '更新询价状态',
          'DELETE /api/inquiries/:id': '删除询价',
          'POST /api/inquiries/batch': '批量操作询价'
        },
        analytics: {
          'GET /api/analytics/today': '获取今日统计',
          'GET /api/analytics/historical': '获取历史数据',
          'GET /api/analytics/products': '获取产品分析',
          'GET /api/analytics/dashboard': '获取仪表板数据',
          'POST /api/analytics/visit': '记录访问（公开接口）'
        },
        admins: {
          'GET /api/admins': '获取管理员列表',
          'GET /api/admins/:id': '获取管理员详情',
          'POST /api/admins': '创建管理员',
          'PUT /api/admins/:id': '更新管理员',
          'DELETE /api/admins/:id': '删除管理员',
          'GET /api/admins/me/profile': '获取当前用户信息',
          'PUT /api/admins/me/profile': '更新当前用户信息'
        }
      }
    });
  });

  console.log('🎉 所有API路由配置完成');
};

module.exports = {
  setupRoutes,

  // 导出各个路由模块（可选）
  authRoutes,
  productRoutes,
  categoryRoutes,
  inquiryRoutes,
  analyticsRoutes,
  adminRoutes
};
