/**
 * 🛠️ 后台管理数据库API路由
 * 无锡皇德国际贸易有限公司 - Diamond Website 后台管理数据库API
 * 
 * 提供后台管理系统的数据库操作接口，替换原有的JSON文件操作
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const {
  ProductDatabaseService,
  CategoryDatabaseService,
  InquiryDatabaseService
} = require('../services/database-service');

// 初始化服务实例
const productService = new ProductDatabaseService();
const categoryService = new CategoryDatabaseService();
const inquiryService = new InquiryDatabaseService();

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = './uploads/products';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB限制
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

// 简单的认证中间件（临时使用，实际应该使用JWT）
const authenticateToken = (req, res, next) => {
  // 这里应该验证JWT token，暂时跳过
  next();
};

/**
 * 🛠️ 获取所有产品（后台管理）
 * GET /api/admin-db/products
 */
router.get('/products', authenticateToken, async (req, res) => {
  try {
    console.log('🛠️ 后台产品列表API调用:', req.query);
    
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search || '',
      category: req.query.category || '',
      status: req.query.status || '',
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
      includeImages: true,
      includeCategory: true
    };

    const result = await productService.findAll(options);
    
    if (result.success) {
      // 为每个产品添加分类名称显示
      const productsWithCategoryNames = result.data.data.map(product => ({
        ...product,
        categoryName: product.category ? product.category.name : '未分类',
        categorySlug: product.category ? product.category.name.toLowerCase() : 'uncategorized'
      }));

      res.json({
        success: true,
        data: productsWithCategoryNames,
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
    console.error('❌ 后台产品列表API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * 🛠️ 获取单个产品详情（后台管理）
 * GET /api/admin-db/products/:id
 */
router.get('/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🛠️ 获取产品详情: ${id}`);
    
    const result = await productService.findById(id);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
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
 * 🛠️ 创建新产品（后台管理）
 * POST /api/admin-db/products
 */
router.post('/products', authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    console.log('🛠️ 创建产品API调用:', req.body);
    console.log('🛠️ 上传的文件:', req.files?.length || 0);

    // 详细调试信息
    console.log('🔍 详细调试信息:');
    console.log('  - 原始分类值:', req.body.category);
    console.log('  - 产品名称:', req.body.name);
    console.log('  - 产品型号:', req.body.model);

    // 处理上传的图片
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => `/uploads/products/${file.filename}`);
    }

    // 前端分类名称到数据库ID的映射
    const categoryMapping = {
      'turbocharger': 'cmdkyzruo00051gcjc8o2zzyb',  // 涡轮增压器
      'actuator': 'cmdkyzrup00061gcjol73pi0p',       // 执行器
      'injector': 'cmdkyzruq00071gcjg5wcuvix',       // 共轨喷油器
      'turbo-parts': 'cmdkyzrur00081gcj94bod56i',    // 涡轮配件
      'others': 'cmdkyzrur00091gcjskhchats'          // 其他
    };

    // 获取正确的分类ID
    const categoryId = categoryMapping[req.body.category] || categoryMapping['others'];

    console.log('🔍 分类映射:', {
      前端分类: req.body.category,
      数据库ID: categoryId
    });

    // 生成唯一的SKU编号 - 使用标准格式 HD-YYMMDDHHMMSS
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // 取年份后两位
    const month = (now.getMonth() + 1).toString().padStart(2, "0"); // 月份补零
    const day = now.getDate().toString().padStart(2, "0"); // 日期补零
    const hour = now.getHours().toString().padStart(2, "0"); // 小时补零
    const minute = now.getMinutes().toString().padStart(2, "0"); // 分钟补零
    const second = now.getSeconds().toString().padStart(2, "0"); // 秒补零

    const sku = `HD-${year}${month}${day}${hour}${minute}${second}`;

    // 构建产品数据
    const productData = {
      sku: sku, // 必需的唯一SKU字段
      name: req.body.name,
      model: req.body.model || '',
      categoryId: categoryId, // 使用映射后的分类ID
      brand: req.body.brand || 'Diamond-Auto',
      description: req.body.description || '',
      price: parseFloat(req.body.price) || 0,
      stock: parseInt(req.body.stock) || 0,
      status: req.body.status || 'active',
      oeNumber: req.body.oe_number || '',
      compatibility: req.body.compatibility || '',
      warranty: parseInt(req.body.warranty) || 12,
      notes: req.body.notes || '',
      metaDescription: req.body.meta_description || '',
      metaKeywords: req.body.meta_keywords || '',
      features: req.body.features || '',
      badges: req.body.badges || '',
      isNew: req.body.isNew === 'true',
      isHot: req.body.isHot === 'true',
      isRecommend: req.body.isRecommend === 'true'
    };

    console.log('🔍 产品数据构建完成:', productData);

    // 验证分类ID是否存在
    try {
      const categoryExists = await productService.prisma.category.findUnique({
        where: { id: categoryId }
      });

      if (!categoryExists) {
        console.error('❌ 分类ID不存在:', categoryId);
        return res.status(400).json({
          success: false,
          message: '分类ID不存在',
          errors: [`分类ID ${categoryId} 在数据库中不存在`]
        });
      }

      console.log('✅ 分类验证通过:', categoryExists.name);
    } catch (verifyError) {
      console.error('❌ 分类验证失败:', verifyError);
      return res.status(400).json({
        success: false,
        message: '分类验证失败',
        errors: [verifyError.message]
      });
    }

    // 创建产品
    const result = await productService.create(productData);

    if (result.success) {
      const productId = result.data.id;

      // 如果有图片，添加图片记录到数据库
      if (images.length > 0) {
        try {
          console.log('📸 开始添加图片记录:', images);

          // 为每张图片创建数据库记录
          for (let i = 0; i < images.length; i++) {
            const imageUrl = images[i];
            await productService.addProductImage({
              productId: productId,
              url: imageUrl,
              alt: `${productData.name} - 图片 ${i + 1}`,
              order: i,
              isPrimary: i === 0 // 第一张图片设为主图
            });
          }

          console.log('✅ 图片记录添加成功');
        } catch (imageError) {
          console.error('❌ 添加图片记录失败:', imageError);
          // 图片添加失败不影响产品创建，只记录错误
        }
      }

      res.status(201).json({
        success: true,
        message: '产品创建成功',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || '创建产品失败',
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('❌ 创建产品错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * 🛠️ 更新产品（后台管理）
 * PUT /api/admin-db/products/:id
 */
router.put('/products/:id', authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🛠️ 更新产品: ${id}`, req.body);
    
    // 处理上传的图片
    let newImages = [];
    if (req.files && req.files.length > 0) {
      newImages = req.files.map(file => `/uploads/products/${file.filename}`);
    }

    // 构建更新数据
    const updateData = {
      name: req.body.name,
      model: req.body.model,
      categoryId: req.body.category,
      brand: req.body.brand,
      description: req.body.description,
      price: req.body.price ? parseFloat(req.body.price) : undefined,
      stock: req.body.stock ? parseInt(req.body.stock) : undefined,
      status: req.body.status,
      oeNumber: req.body.oe_number,
      compatibility: req.body.compatibility,
      warranty: req.body.warranty ? parseInt(req.body.warranty) : undefined,
      notes: req.body.notes,
      metaDescription: req.body.meta_description,
      metaKeywords: req.body.meta_keywords,
      features: req.body.features,
      badges: req.body.badges,
      isNew: req.body.isNew === 'true',
      isHot: req.body.isHot === 'true',
      isRecommend: req.body.isRecommend === 'true'
    };

    // 移除undefined值
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const result = await productService.update(id, updateData);
    
    if (result.success) {
      res.json({
        success: true,
        message: '产品更新成功',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || '更新产品失败',
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('❌ 更新产品错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * 🛠️ 删除产品（后台管理）
 * DELETE /api/admin-db/products/:id
 */
router.delete('/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🛠️ 删除产品: ${id}`);
    
    const result = await productService.delete(id);
    
    if (result.success) {
      res.json({
        success: true,
        message: '产品删除成功'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || '删除产品失败',
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('❌ 删除产品错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

/**
 * 🛠️ 获取分类列表（后台管理）
 * GET /api/admin-db/categories
 */
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    console.log('🛠️ 后台分类列表API调用');
    
    const result = await categoryService.findAll(true);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message || '获取分类数据失败',
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('❌ 后台分类列表API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

module.exports = router;
