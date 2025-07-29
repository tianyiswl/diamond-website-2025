// 📦 产品路由模块
// 处理产品管理相关的API路由

const express = require('express');
const router = express.Router();
const middleware = require('../middleware');
const dao = require('../dao');

/**
 * 获取所有产品（管理员接口，支持分页和筛选）
 * GET /api/products
 */
router.get('/', 
  middleware.authenticateToken,
  middleware.requirePermission('products.read'),
  middleware.logOperation('products_list', '获取产品列表'),
  (req, res) => {
    try {
      const productDao = dao.getProductDao();
      const result = productDao.findAll(req.query);
      
      res.json(result);
    } catch (error) {
      console.error('❌ 获取产品列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取产品列表失败',
        code: 'GET_PRODUCTS_ERROR'
      });
    }
  }
);

/**
 * 获取单个产品详情
 * GET /api/products/:id
 */
router.get('/:id',
  middleware.authenticateToken,
  middleware.requirePermission('products.read'),
  (req, res) => {
    try {
      const productDao = dao.getProductDao();
      const product = productDao.findById(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: '产品不存在',
          code: 'PRODUCT_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('❌ 获取产品详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取产品详情失败',
        code: 'GET_PRODUCT_ERROR'
      });
    }
  }
);

/**
 * 创建新产品
 * POST /api/products
 */
router.post('/',
  middleware.authenticateToken,
  middleware.requirePermission('products.create'),
  middleware.logOperation('product_create', '创建产品'),
  middleware.asyncErrorHandler(async (req, res) => {
    try {
      const productDao = dao.getProductDao();
      const result = await productDao.create(req.body);

      if (!result.success) {
        return res.status(400).json(result);
      }

      console.log('✅ 产品创建成功:', result.data.name);
      res.status(201).json(result);
    } catch (error) {
      console.error('❌ 创建产品失败:', error);
      res.status(500).json({
        success: false,
        message: '创建产品失败',
        code: 'CREATE_PRODUCT_ERROR'
      });
    }
  })
);

/**
 * 更新产品
 * PUT /api/products/:id
 */
router.put('/:id',
  middleware.authenticateToken,
  middleware.requirePermission('products.update'),
  middleware.logOperation('product_update', '更新产品'),
  middleware.asyncErrorHandler(async (req, res) => {
    try {
      const productDao = dao.getProductDao();
      const result = await productDao.update(req.params.id, req.body);

      if (!result.success) {
        return res.status(400).json(result);
      }

      console.log('✅ 产品更新成功:', result.data.name);
      res.json(result);
    } catch (error) {
      console.error('❌ 更新产品失败:', error);
      res.status(500).json({
        success: false,
        message: '更新产品失败',
        code: 'UPDATE_PRODUCT_ERROR'
      });
    }
  })
);

/**
 * 删除产品
 * DELETE /api/products/:id
 */
router.delete('/:id',
  middleware.authenticateToken,
  middleware.requirePermission('products.delete'),
  middleware.logOperation('product_delete', '删除产品'),
  middleware.asyncErrorHandler(async (req, res) => {
    try {
      const productDao = dao.getProductDao();
      const result = await productDao.delete(req.params.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      console.log('✅ 产品删除成功:', result.data.name);
      res.json(result);
    } catch (error) {
      console.error('❌ 删除产品失败:', error);
      res.status(500).json({
        success: false,
        message: '删除产品失败',
        code: 'DELETE_PRODUCT_ERROR'
      });
    }
  })
);

/**
 * 获取产品统计信息
 * GET /api/products/stats
 */
router.get('/stats/summary',
  middleware.authenticateToken,
  middleware.requirePermission('products.read'),
  (req, res) => {
    try {
      const productDao = dao.getProductDao();
      const stats = productDao.getProductStats();

      if (!stats) {
        return res.status(500).json({
          success: false,
          message: '获取产品统计失败',
          code: 'GET_STATS_ERROR'
        });
      }

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ 获取产品统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取产品统计失败',
        code: 'GET_STATS_ERROR'
      });
    }
  }
);

/**
 * 批量操作产品
 * POST /api/products/batch
 */
router.post('/batch',
  middleware.authenticateToken,
  middleware.requirePermission('products.update'),
  middleware.logOperation('products_batch', '批量操作产品'),
  middleware.asyncErrorHandler(async (req, res) => {
    try {
      const { action, productIds, data } = req.body;

      if (!action || !productIds || !Array.isArray(productIds)) {
        return res.status(400).json({
          success: false,
          message: '批量操作参数不完整',
          code: 'INVALID_BATCH_PARAMS'
        });
      }

      const productDao = dao.getProductDao();
      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const productId of productIds) {
        try {
          let result;
          
          switch (action) {
            case 'update':
              result = await productDao.update(productId, data);
              break;
            case 'delete':
              if (!middleware.permission.checkPermission(req, 'products.delete')) {
                throw new Error('没有删除权限');
              }
              result = await productDao.delete(productId);
              break;
            default:
              throw new Error(`不支持的批量操作: ${action}`);
          }

          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
          
          results.push({
            productId,
            success: result.success,
            message: result.success ? '操作成功' : result.errors.join(', ')
          });
        } catch (error) {
          errorCount++;
          results.push({
            productId,
            success: false,
            message: error.message
          });
        }
      }

      console.log(`📊 批量操作完成: 成功${successCount}个, 失败${errorCount}个`);

      res.json({
        success: true,
        message: `批量操作完成: 成功${successCount}个, 失败${errorCount}个`,
        data: {
          action,
          totalCount: productIds.length,
          successCount,
          errorCount,
          results
        }
      });
    } catch (error) {
      console.error('❌ 批量操作失败:', error);
      res.status(500).json({
        success: false,
        message: '批量操作失败',
        code: 'BATCH_OPERATION_ERROR'
      });
    }
  })
);

/**
 * 产品搜索建议
 * GET /api/products/search/suggestions
 */
router.get('/search/suggestions',
  middleware.authenticateToken,
  middleware.requirePermission('products.read'),
  (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || q.length < 2) {
        return res.json({
          success: true,
          data: []
        });
      }

      const productDao = dao.getProductDao();
      const products = productDao.read();
      const searchLower = q.toLowerCase();

      // 搜索产品名称、型号、SKU等字段
      const suggestions = products
        .filter(product => 
          (product.name && product.name.toLowerCase().includes(searchLower)) ||
          (product.model && product.model.toLowerCase().includes(searchLower)) ||
          (product.sku && product.sku.toLowerCase().includes(searchLower))
        )
        .slice(0, 10) // 限制返回10个建议
        .map(product => ({
          id: product.id,
          name: product.name,
          model: product.model,
          sku: product.sku,
          category: product.category
        }));

      res.json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      console.error('❌ 获取搜索建议失败:', error);
      res.status(500).json({
        success: false,
        message: '获取搜索建议失败',
        code: 'GET_SUGGESTIONS_ERROR'
      });
    }
  }
);

module.exports = router;
