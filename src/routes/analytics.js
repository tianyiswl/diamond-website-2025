// 📊 分析路由模块
// 处理数据分析和统计相关的API路由

const express = require('express');
const router = express.Router();
const middleware = require('../middleware');
const dao = require('../dao');

/**
 * 获取今日统计数据
 * GET /api/analytics/today
 */
router.get('/today',
  middleware.authenticateToken,
  middleware.requirePermission('analytics.read'),
  (req, res) => {
    try {
      const analyticsDao = dao.getAnalyticsDao();
      const todayStats = analyticsDao.getTodayStats();

      res.json({
        success: true,
        data: todayStats || {
          page_views: 0,
          unique_visitors: 0,
          product_clicks: 0,
          inquiries: 0,
          conversion_rate: 0
        }
      });
    } catch (error) {
      console.error('❌ 获取今日统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取今日统计失败',
        code: 'GET_TODAY_STATS_ERROR'
      });
    }
  }
);

/**
 * 获取历史数据
 * GET /api/analytics/historical
 */
router.get('/historical',
  middleware.authenticateToken,
  middleware.requirePermission('analytics.read'),
  (req, res) => {
    try {
      const { period, value } = req.query;

      if (!period || !value) {
        return res.status(400).json({
          success: false,
          message: '缺少查询参数',
          code: 'MISSING_PARAMS'
        });
      }

      const analyticsDao = dao.getAnalyticsDao();
      const historicalData = analyticsDao.getHistoricalData(period, value);

      res.json({
        success: true,
        data: historicalData
      });
    } catch (error) {
      console.error('❌ 获取历史数据失败:', error);
      res.status(500).json({
        success: false,
        message: '获取历史数据失败',
        code: 'GET_HISTORICAL_DATA_ERROR'
      });
    }
  }
);

/**
 * 获取产品分析数据
 * GET /api/analytics/products
 */
router.get('/products',
  middleware.authenticateToken,
  middleware.requirePermission('analytics.read'),
  (req, res) => {
    try {
      const analyticsDao = dao.getAnalyticsDao();
      const productAnalytics = analyticsDao.getProductAnalytics();

      res.json({
        success: true,
        data: productAnalytics
      });
    } catch (error) {
      console.error('❌ 获取产品分析数据失败:', error);
      res.status(500).json({
        success: false,
        message: '获取产品分析数据失败',
        code: 'GET_PRODUCT_ANALYTICS_ERROR'
      });
    }
  }
);

/**
 * 获取可用的年份列表
 * GET /api/analytics/years
 */
router.get('/years',
  middleware.authenticateToken,
  middleware.requirePermission('analytics.read'),
  (req, res) => {
    try {
      const analyticsDao = dao.getAnalyticsDao();
      const years = analyticsDao.getAvailableYears();

      res.json({
        success: true,
        data: years
      });
    } catch (error) {
      console.error('❌ 获取可用年份失败:', error);
      res.status(500).json({
        success: false,
        message: '获取可用年份失败',
        code: 'GET_YEARS_ERROR'
      });
    }
  }
);

/**
 * 获取指定年份的月份列表
 * GET /api/analytics/months/:year
 */
router.get('/months/:year',
  middleware.authenticateToken,
  middleware.requirePermission('analytics.read'),
  (req, res) => {
    try {
      const analyticsDao = dao.getAnalyticsDao();
      const months = analyticsDao.getAvailableMonths(req.params.year);

      res.json({
        success: true,
        data: months
      });
    } catch (error) {
      console.error('❌ 获取可用月份失败:', error);
      res.status(500).json({
        success: false,
        message: '获取可用月份失败',
        code: 'GET_MONTHS_ERROR'
      });
    }
  }
);

/**
 * 获取指定月份的日期列表
 * GET /api/analytics/days/:yearMonth
 */
router.get('/days/:yearMonth',
  middleware.authenticateToken,
  middleware.requirePermission('analytics.read'),
  (req, res) => {
    try {
      const analyticsDao = dao.getAnalyticsDao();
      const days = analyticsDao.getAvailableDays(req.params.yearMonth);

      res.json({
        success: true,
        data: days
      });
    } catch (error) {
      console.error('❌ 获取可用日期失败:', error);
      res.status(500).json({
        success: false,
        message: '获取可用日期失败',
        code: 'GET_DAYS_ERROR'
      });
    }
  }
);

/**
 * 记录访问数据（公开接口）
 * POST /api/analytics/visit
 */
router.post('/visit',
  middleware.asyncErrorHandler(async (req, res) => {
    try {
      const { type, productId, productName } = req.body;

      if (!type) {
        return res.status(400).json({
          success: false,
          message: '访问类型不能为空',
          code: 'MISSING_TYPE'
        });
      }

      const visitData = {
        type,
        productId,
        productName,
        referer: req.headers.referer,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
        country: 'CN' // 可以根据IP获取地理位置
      };

      const analyticsDao = dao.getAnalyticsDao();
      const success = analyticsDao.recordVisit(visitData);

      if (success) {
        res.json({
          success: true,
          message: '访问记录成功'
        });
      } else {
        res.status(500).json({
          success: false,
          message: '访问记录失败',
          code: 'RECORD_VISIT_ERROR'
        });
      }
    } catch (error) {
      console.error('❌ 记录访问数据失败:', error);
      res.status(500).json({
        success: false,
        message: '记录访问数据失败',
        code: 'RECORD_VISIT_ERROR'
      });
    }
  })
);

/**
 * 获取综合统计数据
 * GET /api/analytics/dashboard
 */
router.get('/dashboard',
  middleware.authenticateToken,
  middleware.requirePermission('analytics.read'),
  (req, res) => {
    try {
      const analyticsDao = dao.getAnalyticsDao();
      const productDao = dao.getProductDao();
      const categoryDao = dao.getCategoryDao();
      const inquiryDao = dao.getInquiryDao();

      // 获取各种统计数据
      const todayStats = analyticsDao.getTodayStats();
      const productStats = productDao.getProductStats();
      const categoryStats = categoryDao.getCategoryStats();
      const inquiryStats = inquiryDao.getInquiryStats();
      const productAnalytics = analyticsDao.getProductAnalytics();

      const dashboardData = {
        today: todayStats || {
          page_views: 0,
          unique_visitors: 0,
          product_clicks: 0,
          inquiries: 0,
          conversion_rate: 0
        },
        products: productStats || {
          total: 0,
          active: 0,
          categories: {},
          brands: {}
        },
        categories: categoryStats || {
          total: 0,
          active: 0,
          categoryProductCounts: {}
        },
        inquiries: inquiryStats || {
          total: 0,
          pending: 0,
          processing: 0,
          completed: 0,
          sources: {}
        },
        topProducts: productAnalytics ? productAnalytics.slice(0, 10) : []
      };

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error('❌ 获取仪表板数据失败:', error);
      res.status(500).json({
        success: false,
        message: '获取仪表板数据失败',
        code: 'GET_DASHBOARD_ERROR'
      });
    }
  }
);

/**
 * 获取指定日期的统计数据
 * GET /api/analytics/date/:date
 */
router.get('/date/:date',
  middleware.authenticateToken,
  middleware.requirePermission('analytics.read'),
  (req, res) => {
    try {
      const analyticsDao = dao.getAnalyticsDao();
      const stats = analyticsDao.getStatsByDate(req.params.date);

      if (!stats) {
        return res.status(404).json({
          success: false,
          message: '指定日期没有统计数据',
          code: 'NO_DATA_FOR_DATE'
        });
      }

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ 获取指定日期统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取指定日期统计失败',
        code: 'GET_DATE_STATS_ERROR'
      });
    }
  }
);

module.exports = router;
