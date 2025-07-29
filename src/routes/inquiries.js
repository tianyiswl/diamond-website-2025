// 💬 询价路由模块
// 处理客户询价管理相关的API路由

const express = require('express');
const router = express.Router();
const middleware = require('../middleware');
const dao = require('../dao');

/**
 * 获取所有询价（管理员接口）
 * GET /api/inquiries
 */
router.get('/',
  middleware.authenticateToken,
  middleware.requirePermission('inquiries.read'),
  middleware.logOperation('inquiries_list', '获取询价列表'),
  (req, res) => {
    try {
      const inquiryDao = dao.getInquiryDao();
      const result = inquiryDao.findAll(req.query);

      res.json(result);
    } catch (error) {
      console.error('❌ 获取询价列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取询价列表失败',
        code: 'GET_INQUIRIES_ERROR'
      });
    }
  }
);

/**
 * 获取单个询价详情
 * GET /api/inquiries/:id
 */
router.get('/:id',
  middleware.authenticateToken,
  middleware.requirePermission('inquiries.read'),
  (req, res) => {
    try {
      const inquiryDao = dao.getInquiryDao();
      const inquiry = inquiryDao.findById(req.params.id);

      if (!inquiry) {
        return res.status(404).json({
          success: false,
          message: '询价记录不存在',
          code: 'INQUIRY_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: inquiry
      });
    } catch (error) {
      console.error('❌ 获取询价详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取询价详情失败',
        code: 'GET_INQUIRY_ERROR'
      });
    }
  }
);

/**
 * 创建新询价（公开接口，无需认证）
 * POST /api/inquiries
 */
router.post('/',
  middleware.asyncErrorHandler(async (req, res) => {
    try {
      // 添加客户端信息
      const inquiryData = {
        ...req.body,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
        referer: req.headers.referer
      };

      const inquiryDao = dao.getInquiryDao();
      const result = await inquiryDao.create(inquiryData);

      if (!result.success) {
        return res.status(400).json(result);
      }

      console.log('✅ 询价创建成功:', result.data.name, result.data.email);

      // 记录访问统计
      const analyticsDao = dao.getAnalyticsDao();
      analyticsDao.recordVisit({
        type: 'inquiry',
        source: 'website',
        referer: req.headers.referer,
        country: 'CN' // 可以根据IP获取地理位置
      });

      res.status(201).json({
        success: true,
        message: '询价提交成功，我们会尽快与您联系',
        data: {
          id: result.data.id,
          name: result.data.name,
          email: result.data.email,
          createdAt: result.data.createdAt
        }
      });
    } catch (error) {
      console.error('❌ 创建询价失败:', error);
      res.status(500).json({
        success: false,
        message: '询价提交失败，请稍后重试',
        code: 'CREATE_INQUIRY_ERROR'
      });
    }
  })
);

/**
 * 更新询价状态
 * PUT /api/inquiries/:id/status
 */
router.put('/:id/status',
  middleware.authenticateToken,
  middleware.requirePermission('inquiries.update'),
  middleware.logOperation('inquiry_status_update', '更新询价状态'),
  middleware.asyncErrorHandler(async (req, res) => {
    try {
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: '状态不能为空',
          code: 'MISSING_STATUS'
        });
      }

      const inquiryDao = dao.getInquiryDao();
      const result = await inquiryDao.updateStatus(req.params.id, status, notes);

      if (!result.success) {
        return res.status(400).json(result);
      }

      console.log('✅ 询价状态更新成功:', req.params.id, status);
      res.json(result);
    } catch (error) {
      console.error('❌ 更新询价状态失败:', error);
      res.status(500).json({
        success: false,
        message: '更新询价状态失败',
        code: 'UPDATE_INQUIRY_STATUS_ERROR'
      });
    }
  })
);

/**
 * 删除询价
 * DELETE /api/inquiries/:id
 */
router.delete('/:id',
  middleware.authenticateToken,
  middleware.requirePermission('inquiries.delete'),
  middleware.logOperation('inquiry_delete', '删除询价'),
  middleware.asyncErrorHandler(async (req, res) => {
    try {
      const inquiryDao = dao.getInquiryDao();
      const result = await inquiryDao.delete(req.params.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      console.log('✅ 询价删除成功:', req.params.id);
      res.json(result);
    } catch (error) {
      console.error('❌ 删除询价失败:', error);
      res.status(500).json({
        success: false,
        message: '删除询价失败',
        code: 'DELETE_INQUIRY_ERROR'
      });
    }
  })
);

/**
 * 获取询价统计信息
 * GET /api/inquiries/stats/summary
 */
router.get('/stats/summary',
  middleware.authenticateToken,
  middleware.requirePermission('inquiries.read'),
  (req, res) => {
    try {
      const inquiryDao = dao.getInquiryDao();
      const stats = inquiryDao.getInquiryStats();

      if (!stats) {
        return res.status(500).json({
          success: false,
          message: '获取询价统计失败',
          code: 'GET_STATS_ERROR'
        });
      }

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ 获取询价统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取询价统计失败',
        code: 'GET_STATS_ERROR'
      });
    }
  }
);

/**
 * 批量操作询价
 * POST /api/inquiries/batch
 */
router.post('/batch',
  middleware.authenticateToken,
  middleware.requirePermission('inquiries.update'),
  middleware.logOperation('inquiries_batch', '批量操作询价'),
  middleware.asyncErrorHandler(async (req, res) => {
    try {
      const { action, inquiryIds, data } = req.body;

      if (!action || !inquiryIds || !Array.isArray(inquiryIds)) {
        return res.status(400).json({
          success: false,
          message: '批量操作参数不完整',
          code: 'INVALID_BATCH_PARAMS'
        });
      }

      const inquiryDao = dao.getInquiryDao();
      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const inquiryId of inquiryIds) {
        try {
          let result;
          
          switch (action) {
            case 'updateStatus':
              if (!data.status) {
                throw new Error('状态不能为空');
              }
              result = await inquiryDao.updateStatus(inquiryId, data.status, data.notes);
              break;
            case 'delete':
              if (!middleware.permission.checkPermission(req, 'inquiries.delete')) {
                throw new Error('没有删除权限');
              }
              result = await inquiryDao.delete(inquiryId);
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
            inquiryId,
            success: result.success,
            message: result.success ? '操作成功' : result.errors.join(', ')
          });
        } catch (error) {
          errorCount++;
          results.push({
            inquiryId,
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
          totalCount: inquiryIds.length,
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
 * 导出询价数据
 * GET /api/inquiries/export
 */
router.get('/export',
  middleware.authenticateToken,
  middleware.requirePermission('inquiries.read'),
  middleware.logOperation('inquiries_export', '导出询价数据'),
  (req, res) => {
    try {
      const inquiryDao = dao.getInquiryDao();
      const exportData = inquiryDao.exportData(req.query);

      res.json({
        success: true,
        data: exportData,
        count: exportData.length
      });
    } catch (error) {
      console.error('❌ 导出询价数据失败:', error);
      res.status(500).json({
        success: false,
        message: '导出询价数据失败',
        code: 'EXPORT_INQUIRIES_ERROR'
      });
    }
  }
);

/**
 * 清空所有询价数据
 * DELETE /api/inquiries/all
 */
router.delete('/all',
  middleware.authenticateToken,
  middleware.requireSuperAdmin,
  middleware.logOperation('inquiries_clear_all', '清空所有询价数据'),
  middleware.asyncErrorHandler(async (req, res) => {
    try {
      const inquiryDao = dao.getInquiryDao();
      const result = await inquiryDao.clearAll();

      if (!result.success) {
        return res.status(500).json(result);
      }

      console.log('🧹 所有询价数据已清空');
      res.json(result);
    } catch (error) {
      console.error('❌ 清空询价数据失败:', error);
      res.status(500).json({
        success: false,
        message: '清空询价数据失败',
        code: 'CLEAR_INQUIRIES_ERROR'
      });
    }
  })
);

module.exports = router;
