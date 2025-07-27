/**
 * 🗄️ 数据库API路由
 * 无锡皇德国际贸易有限公司 - Diamond Website 数据库API
 * 
 * 提供基于Prisma的新API端点，替换原有的JSON文件读取方式
 */

const express = require('express');
const router = express.Router();
const {
  ProductDatabaseService,
  CategoryDatabaseService,
  CompanyDatabaseService,
  CarouselDatabaseService,
  InquiryDatabaseService
} = require('../services/database-service');

// 初始化服务实例
const productService = new ProductDatabaseService();
const categoryService = new CategoryDatabaseService();
const companyService = new CompanyDatabaseService();
const carouselService = new CarouselDatabaseService();
const inquiryService = new InquiryDatabaseService();

/**
 * 🌐 公开产品API - 替换 /api/public/products
 * GET /api/db/public/products
 */
router.get('/public/products', async (req, res) => {
  try {
    console.log('🌐 数据库产品API调用:', req.query);
    
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      search: req.query.search || '',
      category: req.query.category || '',
      status: req.query.status || 'active',
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
      includeImages: true,
      includeCategory: true
    };

    const result = await productService.findAll(options);
    
    if (result.success) {
      // 兼容原有API格式
      res.json({
        success: true,
        data: result.data.data,
        pagination: result.data.pagination,
        total: result.data.pagination.total
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message || '获取产品数据失败',
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('❌ 数据库产品API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * 🔍 单个产品API - 替换 /api/public/products/:id
 * GET /api/db/public/products/:id
 */
router.get('/public/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 获取产品详情: ${id}`);
    
    const result = await productService.findById(id);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(404).json({
        success: false,
        message: result.message || '产品不存在',
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('❌ 获取产品详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * 📂 分类API - 替换 /data/categories.json
 * GET /api/db/categories
 */
router.get('/categories', async (req, res) => {
  try {
    console.log('📂 数据库分类API调用');
    
    const includeProductCount = req.query.includeCount !== 'false';
    const result = await categoryService.findAll(includeProductCount);
    
    if (result.success) {
      // 转换格式以兼容前端
      const categories = result.data.map(category => ({
        ...category,
        count: category._count?.products || 0
      }));
      
      res.json(categories);
    } else {
      res.status(500).json({
        success: false,
        message: result.message || '获取分类数据失败',
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('❌ 数据库分类API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * 🏢 公司信息API - 替换 /data/company.json
 * GET /api/db/company
 */
router.get('/company', async (req, res) => {
  try {
    console.log('🏢 数据库公司信息API调用');
    
    const result = await companyService.getCompanyInfo();
    
    if (result.success) {
      // 转换格式以兼容前端
      const company = {
        ...result.data,
        contact: {
          phone: result.data.phone,
          email: result.data.email,
          whatsapp: result.data.whatsapp,
          address: result.data.address,
          website: result.data.website
        },
        social: {
          facebook: result.data.facebook,
          instagram: result.data.instagram,
          whatsapp: `https://wa.me/${result.data.whatsapp?.replace(/[^0-9]/g, '')}`,
          email: `mailto:${result.data.email}`
        },
        businessHours: {
          weekdays: result.data.weekdaysHours,
          weekend: result.data.weekendHours
        }
      };
      
      res.json(company);
    } else {
      res.status(500).json({
        success: false,
        message: result.message || '获取公司信息失败',
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('❌ 数据库公司信息API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * 🎠 轮播图API - 替换 /data/carousel.json
 * GET /api/db/carousel
 */
router.get('/carousel', async (req, res) => {
  try {
    console.log('🎠 数据库轮播图API调用');
    
    const result = await carouselService.findAll();
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({
        success: false,
        message: result.message || '获取轮播图数据失败',
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('❌ 数据库轮播图API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * 📞 创建询价API - 增强版
 * POST /api/db/inquiries
 */
router.post('/inquiries', async (req, res) => {
  try {
    console.log('📞 数据库询价API调用:', req.body);
    
    const result = await inquiryService.create(req.body);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || '询价提交失败',
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('❌ 数据库询价API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * 📊 产品统计API
 * GET /api/db/stats/products
 */
router.get('/stats/products', async (req, res) => {
  try {
    console.log('📊 产品统计API调用');
    
    const result = await productService.getStats();
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message || '获取统计数据失败',
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('❌ 产品统计API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * 🔧 健康检查API
 * GET /api/db/health
 */
router.get('/health', async (req, res) => {
  try {
    const { getPrismaClient } = require('../services/database-service');
    const prisma = getPrismaClient();
    
    // 测试数据库连接
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      success: true,
      message: '数据库连接正常',
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL + Prisma'
    });
  } catch (error) {
    console.error('❌ 数据库健康检查失败:', error);
    res.status(500).json({
      success: false,
      message: '数据库连接失败',
      error: error.message
    });
  }
});

module.exports = router;
