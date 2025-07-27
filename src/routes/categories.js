// 📂 分类路由模块
// 处理产品分类管理相关的API路由

const express = require('express');
const router = express.Router();
const middleware = require('../middleware');
const dao = require('../dao');

/**
 * 获取所有分类
 * GET /api/categories
 */
router.get('/',
  middleware.authenticateToken,
  middleware.requirePermission('categories.read'),
  middleware.logOperation('categories_list', '获取分类列表'),
  (req, res) => {
    try {
      const categoryDao = dao.getCategoryDao();
      const categories = categoryDao.findAll(req.query);

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('❌ 获取分类列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取分类列表失败',
        code: 'GET_CATEGORIES_ERROR'
      });
    }
  }
);

/**
 * 获取活跃分类（用于前端显示）
 * GET /api/categories/active
 */
router.get('/active',
  middleware.optionalAuth,
  (req, res) => {
    try {
      const categoryDao = dao.getCategoryDao();
      const categories = categoryDao.getActiveCategories();

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('❌ 获取活跃分类失败:', error);
      res.status(500).json({
        success: false,
        message: '获取分类失败',
        code: 'GET_ACTIVE_CATEGORIES_ERROR'
      });
    }
  }
);

/**
 * 获取单个分类详情
 * GET /api/categories/:id
 */
router.get('/:id',
  middleware.authenticateToken,
  middleware.requirePermission('categories.read'),
  (req, res) => {
    try {
      const categoryDao = dao.getCategoryDao();
      const category = categoryDao.findById(req.params.id);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: '分类不存在',
          code: 'CATEGORY_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      console.error('❌ 获取分类详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取分类详情失败',
        code: 'GET_CATEGORY_ERROR'
      });
    }
  }
);

/**
 * 创建新分类
 * POST /api/categories
 */
router.post('/',
  middleware.authenticateToken,
  middleware.requirePermission('categories.create'),
  middleware.logOperation('category_create', '创建分类'),
  middleware.asyncErrorHandler(async (req, res) => {
    try {
      const categoryDao = dao.getCategoryDao();
      const result = await categoryDao.create(req.body);

      if (!result.success) {
        return res.status(400).json(result);
      }

      console.log('✅ 分类创建成功:', result.data.name);
      res.status(201).json(result);
    } catch (error) {
      console.error('❌ 创建分类失败:', error);
      res.status(500).json({
        success: false,
        message: '创建分类失败',
        code: 'CREATE_CATEGORY_ERROR'
      });
    }
  })
);

/**
 * 更新分类
 * PUT /api/categories/:id
 */
router.put('/:id',
  middleware.authenticateToken,
  middleware.requirePermission('categories.update'),
  middleware.logOperation('category_update', '更新分类'),
  middleware.asyncErrorHandler(async (req, res) => {
    try {
      const categoryDao = dao.getCategoryDao();
      const result = await categoryDao.update(req.params.id, req.body);

      if (!result.success) {
        return res.status(400).json(result);
      }

      console.log('✅ 分类更新成功:', result.data.name);
      res.json(result);
    } catch (error) {
      console.error('❌ 更新分类失败:', error);
      res.status(500).json({
        success: false,
        message: '更新分类失败',
        code: 'UPDATE_CATEGORY_ERROR'
      });
    }
  })
);

/**
 * 删除分类
 * DELETE /api/categories/:id
 */
router.delete('/:id',
  middleware.authenticateToken,
  middleware.requirePermission('categories.delete'),
  middleware.logOperation('category_delete', '删除分类'),
  middleware.asyncErrorHandler(async (req, res) => {
    try {
      const categoryDao = dao.getCategoryDao();
      const result = await categoryDao.delete(req.params.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      console.log('✅ 分类删除成功:', result.data.name);
      res.json(result);
    } catch (error) {
      console.error('❌ 删除分类失败:', error);
      res.status(500).json({
        success: false,
        message: '删除分类失败',
        code: 'DELETE_CATEGORY_ERROR'
      });
    }
  })
);

/**
 * 获取分类统计信息
 * GET /api/categories/stats/summary
 */
router.get('/stats/summary',
  middleware.authenticateToken,
  middleware.requirePermission('categories.read'),
  (req, res) => {
    try {
      const categoryDao = dao.getCategoryDao();
      const stats = categoryDao.getCategoryStats();

      if (!stats) {
        return res.status(500).json({
          success: false,
          message: '获取分类统计失败',
          code: 'GET_STATS_ERROR'
        });
      }

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ 获取分类统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取分类统计失败',
        code: 'GET_STATS_ERROR'
      });
    }
  }
);

/**
 * 获取分类下的产品数量
 * GET /api/categories/:id/products/count
 */
router.get('/:id/products/count',
  middleware.authenticateToken,
  middleware.requirePermission('categories.read'),
  (req, res) => {
    try {
      const categoryDao = dao.getCategoryDao();
      const category = categoryDao.findById(req.params.id);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: '分类不存在',
          code: 'CATEGORY_NOT_FOUND'
        });
      }

      // 获取该分类下的产品数量
      const productDao = dao.getProductDao();
      const products = productDao.read();
      const productCount = products.filter(p => p.category === category.name).length;

      res.json({
        success: true,
        data: {
          categoryId: category.id,
          categoryName: category.name,
          productCount: productCount
        }
      });
    } catch (error) {
      console.error('❌ 获取分类产品数量失败:', error);
      res.status(500).json({
        success: false,
        message: '获取分类产品数量失败',
        code: 'GET_CATEGORY_PRODUCT_COUNT_ERROR'
      });
    }
  }
);

/**
 * 批量更新分类排序
 * POST /api/categories/reorder
 */
router.post('/reorder',
  middleware.authenticateToken,
  middleware.requirePermission('categories.update'),
  middleware.logOperation('categories_reorder', '重新排序分类'),
  middleware.asyncErrorHandler(async (req, res) => {
    try {
      const { categoryOrders } = req.body;

      if (!Array.isArray(categoryOrders)) {
        return res.status(400).json({
          success: false,
          message: '分类排序数据格式错误',
          code: 'INVALID_ORDER_DATA'
        });
      }

      const categoryDao = dao.getCategoryDao();
      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const { id, order } of categoryOrders) {
        try {
          const result = await categoryDao.update(id, { order: parseInt(order) });
          
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
          
          results.push({
            categoryId: id,
            success: result.success,
            message: result.success ? '排序更新成功' : result.errors.join(', ')
          });
        } catch (error) {
          errorCount++;
          results.push({
            categoryId: id,
            success: false,
            message: error.message
          });
        }
      }

      console.log(`📊 分类排序更新完成: 成功${successCount}个, 失败${errorCount}个`);

      res.json({
        success: true,
        message: `分类排序更新完成: 成功${successCount}个, 失败${errorCount}个`,
        data: {
          totalCount: categoryOrders.length,
          successCount,
          errorCount,
          results
        }
      });
    } catch (error) {
      console.error('❌ 分类排序更新失败:', error);
      res.status(500).json({
        success: false,
        message: '分类排序更新失败',
        code: 'REORDER_CATEGORIES_ERROR'
      });
    }
  })
);

module.exports = router;
