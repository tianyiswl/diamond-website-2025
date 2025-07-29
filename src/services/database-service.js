/**
 * 🗄️ 数据库服务层
 * 无锡皇德国际贸易有限公司 - Diamond Website 数据库服务
 * 
 * 提供统一的数据库访问接口，支持：
 * 1. Prisma ORM 数据库操作
 * 2. 缓存管理
 * 3. 数据验证
 * 4. 错误处理
 */

const { PrismaClient } = require('@prisma/client');
const BaseService = require('./baseService');

// 初始化Prisma客户端（单例模式）
let prismaInstance = null;

function getPrismaClient() {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty'
    });
  }
  return prismaInstance;
}

/**
 * 📦 产品数据库服务
 */
class ProductDatabaseService extends BaseService {
  constructor() {
    super();
    this.prisma = getPrismaClient();
  }

  /**
   * 获取所有产品（支持分页和筛选）
   */
  async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        category = '',
        status = 'active',
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeImages = true,
        includeCategory = true
      } = options;

      const skip = (page - 1) * limit;
      const take = Math.min(limit, 100); // 限制最大100条

      // 构建查询条件
      const where = {
        status: status || 'active'
      };

      // 搜索条件
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { oeNumber: { contains: search, mode: 'insensitive' } },
          { compatibility: { contains: search, mode: 'insensitive' } }
        ];
      }

      // 分类筛选
      if (category && category !== 'all') {
        where.categoryId = category;
      }

      // 构建包含关系
      const include = {};
      if (includeImages) {
        include.images = {
          orderBy: { order: 'asc' }
        };
      }
      if (includeCategory) {
        include.category = true;
      }

      // 执行查询
      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          include,
          skip,
          take,
          orderBy: { [sortBy]: sortOrder }
        }),
        this.prisma.product.count({ where })
      ]);

      // 计算分页信息
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return this.success({
        data: products,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev
        }
      });

    } catch (error) {
      console.error('获取产品列表失败:', error);
      return this.error(['获取产品列表失败'], '数据库查询错误');
    }
  }

  /**
   * 根据ID获取单个产品
   */
  async findById(id) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: {
          images: {
            orderBy: { order: 'asc' }
          },
          category: true,
          analytics: {
            orderBy: { date: 'desc' },
            take: 30 // 最近30天的分析数据
          }
        }
      });

      if (!product) {
        return this.error(['产品不存在'], '产品未找到');
      }

      // 更新浏览次数
      await this.updateProductViews(id);

      return this.success(product);

    } catch (error) {
      console.error('获取产品详情失败:', error);
      return this.error(['获取产品详情失败'], '数据库查询错误');
    }
  }

  /**
   * 创建新产品
   */
  async create(productData) {
    try {
      // 验证必填字段
      const validation = this.validateRequired(productData, ['name', 'categoryId']);
      if (!validation.isValid) {
        return this.error(validation.errors, '数据验证失败');
      }

      // 生成SKU（如果未提供）- 使用标准格式
      if (!productData.sku) {
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2); // 取年份后两位
        const month = (now.getMonth() + 1).toString().padStart(2, "0"); // 月份补零
        const day = now.getDate().toString().padStart(2, "0"); // 日期补零
        const hour = now.getHours().toString().padStart(2, "0"); // 小时补零
        const minute = now.getMinutes().toString().padStart(2, "0"); // 分钟补零
        const second = now.getSeconds().toString().padStart(2, "0"); // 秒补零

        productData.sku = `HD-${year}${month}${day}${hour}${minute}${second}`;
      }

      // 检查SKU是否已存在
      const existingProduct = await this.prisma.product.findUnique({
        where: { sku: productData.sku }
      });

      if (existingProduct) {
        return this.error(['SKU已存在'], 'SKU重复');
      }

      // 创建产品
      const product = await this.prisma.product.create({
        data: {
          ...productData,
          price: parseFloat(productData.price) || 0,
          stock: parseInt(productData.stock) || 0,
          warranty: parseInt(productData.warranty) || 12,
          isNew: Boolean(productData.isNew),
          isHot: Boolean(productData.isHot),
          isRecommend: Boolean(productData.isRecommend)
        },
        include: {
          images: true,
          category: true
        }
      });

      this.logOperation('create_product', `创建产品: ${product.name}`, { productId: product.id });
      return this.success(product, '产品创建成功');

    } catch (error) {
      console.error('创建产品失败:', error);
      return this.error(['创建产品失败'], '数据库操作错误');
    }
  }

  /**
   * 为产品添加图片记录
   */
  async addProductImage(imageData) {
    try {
      const image = await this.prisma.productImage.create({
        data: {
          productId: imageData.productId,
          url: imageData.url,
          alt: imageData.alt || '',
          order: imageData.order || 0,
          isPrimary: imageData.isPrimary || false
        }
      });

      this.logOperation('add_product_image', `添加产品图片: ${imageData.url}`, {
        productId: imageData.productId,
        imageId: image.id
      });

      return this.success(image, '图片添加成功');

    } catch (error) {
      console.error('添加产品图片失败:', error);
      return this.error(['添加产品图片失败'], '数据库操作错误');
    }
  }

  /**
   * 更新产品
   */
  async update(id, productData) {
    try {
      // 检查产品是否存在
      const existingProduct = await this.prisma.product.findUnique({
        where: { id }
      });

      if (!existingProduct) {
        return this.error(['产品不存在'], '产品未找到');
      }

      // 如果更新SKU，检查是否重复
      if (productData.sku && productData.sku !== existingProduct.sku) {
        const duplicateProduct = await this.prisma.product.findUnique({
          where: { sku: productData.sku }
        });

        if (duplicateProduct) {
          return this.error(['SKU已存在'], 'SKU重复');
        }
      }

      // 更新产品
      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          ...productData,
          price: productData.price ? parseFloat(productData.price) : undefined,
          stock: productData.stock ? parseInt(productData.stock) : undefined,
          warranty: productData.warranty ? parseInt(productData.warranty) : undefined,
          isNew: productData.isNew !== undefined ? Boolean(productData.isNew) : undefined,
          isHot: productData.isHot !== undefined ? Boolean(productData.isHot) : undefined,
          isRecommend: productData.isRecommend !== undefined ? Boolean(productData.isRecommend) : undefined
        },
        include: {
          images: true,
          category: true
        }
      });

      this.logOperation('update_product', `更新产品: ${updatedProduct.name}`, { productId: id });
      return this.success(updatedProduct, '产品更新成功');

    } catch (error) {
      console.error('更新产品失败:', error);
      return this.error(['更新产品失败'], '数据库操作错误');
    }
  }

  /**
   * 删除产品
   */
  async delete(id) {
    try {
      // 检查产品是否存在
      const existingProduct = await this.prisma.product.findUnique({
        where: { id },
        include: { images: true }
      });

      if (!existingProduct) {
        return this.error(['产品不存在'], '产品未找到');
      }

      // 删除产品（级联删除图片和分析数据）
      await this.prisma.product.delete({
        where: { id }
      });

      this.logOperation('delete_product', `删除产品: ${existingProduct.name}`, { productId: id });
      return this.success(null, '产品删除成功');

    } catch (error) {
      console.error('删除产品失败:', error);
      return this.error(['删除产品失败'], '数据库操作错误');
    }
  }

  /**
   * 更新产品浏览次数
   */
  async updateProductViews(productId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await this.prisma.productAnalytics.upsert({
        where: {
          productId_date: {
            productId,
            date: today
          }
        },
        update: {
          views: { increment: 1 }
        },
        create: {
          productId,
          date: today,
          views: 1
        }
      });
    } catch (error) {
      console.error('更新产品浏览次数失败:', error);
      // 不抛出错误，避免影响主要功能
    }
  }

  /**
   * 批量操作产品
   */
  async batchUpdate(ids, updateData) {
    try {
      const result = await this.prisma.product.updateMany({
        where: {
          id: { in: ids }
        },
        data: updateData
      });

      this.logOperation('batch_update_products', `批量更新产品: ${ids.length}个`, { ids, updateData });
      return this.success({ count: result.count }, `成功更新${result.count}个产品`);

    } catch (error) {
      console.error('批量更新产品失败:', error);
      return this.error(['批量更新产品失败'], '数据库操作错误');
    }
  }

  /**
   * 获取产品统计信息
   */
  async getStats() {
    try {
      const [
        totalProducts,
        activeProducts,
        newProducts,
        hotProducts,
        categoryCounts
      ] = await Promise.all([
        this.prisma.product.count(),
        this.prisma.product.count({ where: { status: 'active' } }),
        this.prisma.product.count({ where: { isNew: true } }),
        this.prisma.product.count({ where: { isHot: true } }),
        this.prisma.product.groupBy({
          by: ['categoryId'],
          _count: { id: true },
          where: { status: 'active' }
        })
      ]);

      return this.success({
        totalProducts,
        activeProducts,
        newProducts,
        hotProducts,
        categoryCounts
      });

    } catch (error) {
      console.error('获取产品统计失败:', error);
      return this.error(['获取产品统计失败'], '数据库查询错误');
    }
  }
}

/**
 * 📂 分类数据库服务
 */
class CategoryDatabaseService extends BaseService {
  constructor() {
    super();
    this.prisma = getPrismaClient();
  }

  /**
   * 获取所有分类
   */
  async findAll(includeProductCount = true) {
    try {
      const include = includeProductCount ? {
        _count: {
          select: { products: { where: { status: 'active' } } }
        }
      } : {};

      const categories = await this.prisma.category.findMany({
        where: { status: 'active' },
        orderBy: { order: 'asc' },
        include
      });

      return this.success(categories);
    } catch (error) {
      console.error('获取分类列表失败:', error);
      return this.error(['获取分类列表失败'], '数据库查询错误');
    }
  }
}

/**
 * 🏢 公司信息数据库服务
 */
class CompanyDatabaseService extends BaseService {
  constructor() {
    super();
    this.prisma = getPrismaClient();
  }

  /**
   * 获取公司信息
   */
  async getCompanyInfo() {
    try {
      const company = await this.prisma.company.findFirst();

      if (!company) {
        return this.error(['公司信息不存在'], '数据未找到');
      }

      return this.success(company);
    } catch (error) {
      console.error('获取公司信息失败:', error);
      return this.error(['获取公司信息失败'], '数据库查询错误');
    }
  }
}

/**
 * 🎠 轮播图数据库服务
 */
class CarouselDatabaseService extends BaseService {
  constructor() {
    super();
    this.prisma = getPrismaClient();
  }

  /**
   * 获取轮播图
   */
  async findAll() {
    try {
      const slides = await this.prisma.carouselSlide.findMany({
        where: { status: 'active' },
        orderBy: { order: 'asc' }
      });

      return this.success({ slides });
    } catch (error) {
      console.error('获取轮播图失败:', error);
      return this.error(['获取轮播图失败'], '数据库查询错误');
    }
  }
}

/**
 * 📞 询价数据库服务
 */
class InquiryDatabaseService extends BaseService {
  constructor() {
    super();
    this.prisma = getPrismaClient();
  }

  /**
   * 创建询价
   */
  async create(inquiryData) {
    try {
      const validation = this.validateRequired(inquiryData, ['customerName', 'email', 'message']);
      if (!validation.isValid) {
        return this.error(validation.errors, '数据验证失败');
      }

      const inquiry = await this.prisma.inquiry.create({
        data: {
          ...inquiryData,
          quantity: inquiryData.quantity ? parseInt(inquiryData.quantity) : null
        },
        include: {
          product: true
        }
      });

      // 更新产品询价统计
      if (inquiry.productId) {
        await this.updateProductInquiries(inquiry.productId);
      }

      return this.success(inquiry, '询价提交成功');
    } catch (error) {
      console.error('创建询价失败:', error);
      return this.error(['创建询价失败'], '数据库操作错误');
    }
  }

  /**
   * 更新产品询价次数
   */
  async updateProductInquiries(productId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await this.prisma.productAnalytics.upsert({
        where: {
          productId_date: {
            productId,
            date: today
          }
        },
        update: {
          inquiries: { increment: 1 }
        },
        create: {
          productId,
          date: today,
          inquiries: 1
        }
      });
    } catch (error) {
      console.error('更新产品询价次数失败:', error);
    }
  }
}

module.exports = {
  ProductDatabaseService,
  CategoryDatabaseService,
  CompanyDatabaseService,
  CarouselDatabaseService,
  InquiryDatabaseService,
  getPrismaClient
};
