// 📦 产品服务层
// 处理产品相关的业务逻辑

const BaseService = require('./baseService');
const dao = require('../dao');
const utils = require('../utils');

class ProductService extends BaseService {
  constructor() {
    super(dao.getProductDao());
    this.categoryDao = dao.getCategoryDao();
  }

  /**
   * 获取产品列表
   * @param {Object} options - 查询选项
   * @returns {Object} 产品列表响应
   */
  async getProducts(options = {}) {
    try {
      this.logOperation('get_products', '获取产品列表', options);
      
      const result = this.dao.findAll(options);
      
      // 添加分类信息
      if (result.data && result.data.length > 0) {
        const categories = this.categoryDao.findAll();
        const categoryMap = {};
        categories.forEach(cat => {
          categoryMap[cat.name] = cat;
        });

        result.data = result.data.map(product => ({
          ...product,
          categoryInfo: categoryMap[product.category] || null
        }));
      }

      return this.success(result, '获取产品列表成功');
    } catch (error) {
      console.error('❌ 获取产品列表失败:', error);
      return this.error(['获取产品列表失败'], '服务器错误');
    }
  }

  /**
   * 获取单个产品
   * @param {string} id - 产品ID
   * @returns {Object} 产品详情响应
   */
  async getProduct(id) {
    try {
      this.logOperation('get_product', '获取产品详情', { id });
      
      if (!id) {
        return this.error(['产品ID不能为空'], '参数错误');
      }

      const product = this.dao.findById(id);
      
      if (!product) {
        return this.error(['产品不存在'], '产品未找到');
      }

      // 添加分类信息
      const categories = this.categoryDao.findAll();
      const category = categories.find(cat => cat.name === product.category);
      
      const productWithCategory = {
        ...product,
        categoryInfo: category || null
      };

      return this.success(productWithCategory, '获取产品详情成功');
    } catch (error) {
      console.error('❌ 获取产品详情失败:', error);
      return this.error(['获取产品详情失败'], '服务器错误');
    }
  }

  /**
   * 创建产品
   * @param {Object} productData - 产品数据
   * @returns {Object} 创建结果响应
   */
  async createProduct(productData) {
    try {
      this.logOperation('create_product', '创建产品', productData);
      
      // 验证必填字段
      const requiredFields = ['name', 'category'];
      const validation = this.validateRequired(productData, requiredFields);
      
      if (!validation.isValid) {
        return this.error(validation.errors, '数据验证失败');
      }

      // 验证分类是否存在
      const categoryExists = this.categoryDao.findByName(productData.category);
      if (!categoryExists) {
        return this.error(['指定的分类不存在'], '分类验证失败');
      }

      // 检查产品名称是否重复
      const existingProducts = this.dao.read();
      const duplicateName = existingProducts.find(p => 
        p.name.toLowerCase() === productData.name.toLowerCase()
      );
      
      if (duplicateName) {
        return this.error(['产品名称已存在'], '重复数据');
      }

      // 清理和验证数据
      const allowedFields = [
        'name', 'category', 'brand', 'model', 'price', 'stock',
        'description', 'oe_number', 'compatibility', 'features',
        'notes', 'images', 'status', 'sku'
      ];
      
      const cleanData = this.sanitizeData(productData, allowedFields);
      
      // 设置默认值
      cleanData.status = cleanData.status || 'active';
      cleanData.images = cleanData.images || [];
      
      // 生成SKU（如果未提供）
      if (!cleanData.sku) {
        cleanData.sku = utils.generateSKU();
      }

      // 创建产品
      const result = await this.dao.create(cleanData);
      
      if (!result.success) {
        return this.error(result.errors, '创建产品失败');
      }

      return this.success(result.data, '产品创建成功');
    } catch (error) {
      console.error('❌ 创建产品失败:', error);
      return this.error(['创建产品失败'], '服务器错误');
    }
  }

  /**
   * 更新产品
   * @param {string} id - 产品ID
   * @param {Object} updateData - 更新数据
   * @returns {Object} 更新结果响应
   */
  async updateProduct(id, updateData) {
    try {
      this.logOperation('update_product', '更新产品', { id, updateData });
      
      if (!id) {
        return this.error(['产品ID不能为空'], '参数错误');
      }

      // 检查产品是否存在
      const existingProduct = this.dao.findById(id);
      if (!existingProduct) {
        return this.error(['产品不存在'], '产品未找到');
      }

      // 验证分类（如果要更新分类）
      if (updateData.category && updateData.category !== existingProduct.category) {
        const categoryExists = this.categoryDao.findByName(updateData.category);
        if (!categoryExists) {
          return this.error(['指定的分类不存在'], '分类验证失败');
        }
      }

      // 检查产品名称是否重复（如果要更新名称）
      if (updateData.name && updateData.name !== existingProduct.name) {
        const existingProducts = this.dao.read();
        const duplicateName = existingProducts.find(p => 
          p.id !== id && p.name.toLowerCase() === updateData.name.toLowerCase()
        );
        
        if (duplicateName) {
          return this.error(['产品名称已存在'], '重复数据');
        }
      }

      // 清理数据
      const allowedFields = [
        'name', 'category', 'brand', 'model', 'price', 'stock',
        'description', 'oe_number', 'compatibility', 'features',
        'notes', 'images', 'status'
      ];
      
      const cleanData = this.sanitizeData(updateData, allowedFields);

      // 更新产品
      const result = await this.dao.update(id, cleanData);
      
      if (!result.success) {
        return this.error(result.errors, '更新产品失败');
      }

      return this.success(result.data, '产品更新成功');
    } catch (error) {
      console.error('❌ 更新产品失败:', error);
      return this.error(['更新产品失败'], '服务器错误');
    }
  }

  /**
   * 删除产品
   * @param {string} id - 产品ID
   * @returns {Object} 删除结果响应
   */
  async deleteProduct(id) {
    try {
      this.logOperation('delete_product', '删除产品', { id });
      
      if (!id) {
        return this.error(['产品ID不能为空'], '参数错误');
      }

      // 检查产品是否存在
      const existingProduct = this.dao.findById(id);
      if (!existingProduct) {
        return this.error(['产品不存在'], '产品未找到');
      }

      // 删除产品
      const result = await this.dao.delete(id);
      
      if (!result.success) {
        return this.error(result.errors, '删除产品失败');
      }

      return this.success(result.data, '产品删除成功');
    } catch (error) {
      console.error('❌ 删除产品失败:', error);
      return this.error(['删除产品失败'], '服务器错误');
    }
  }

  /**
   * 获取产品统计信息
   * @returns {Object} 统计信息响应
   */
  async getProductStats() {
    try {
      this.logOperation('get_product_stats', '获取产品统计');
      
      const stats = this.dao.getProductStats();
      
      if (!stats) {
        return this.error(['获取统计信息失败'], '服务器错误');
      }

      // 添加额外的统计信息
      const products = this.dao.read();
      const enhancedStats = {
        ...stats,
        recentProducts: products
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5),
        lowStockProducts: products
          .filter(p => {
            const stock = parseInt(p.stock);
            return !isNaN(stock) && stock < 10;
          })
          .length
      };

      return this.success(enhancedStats, '获取产品统计成功');
    } catch (error) {
      console.error('❌ 获取产品统计失败:', error);
      return this.error(['获取产品统计失败'], '服务器错误');
    }
  }

  /**
   * 批量操作产品
   * @param {string} action - 操作类型
   * @param {Array} productIds - 产品ID列表
   * @param {Object} data - 操作数据
   * @returns {Object} 批量操作结果响应
   */
  async batchOperation(action, productIds, data = {}) {
    try {
      this.logOperation('batch_operation', '批量操作产品', { action, productIds, data });
      
      if (!action || !Array.isArray(productIds) || productIds.length === 0) {
        return this.error(['批量操作参数不完整'], '参数错误');
      }

      const operations = {
        update: (id) => this.dao.update(id, data),
        delete: (id) => this.dao.delete(id),
        updateStatus: (id) => this.dao.update(id, { status: data.status })
      };

      const operation = operations[action];
      if (!operation) {
        return this.error([`不支持的批量操作: ${action}`], '操作不支持');
      }

      // 调用父类的批量操作方法，而不是自己的方法
      const result = await super.batchOperation(productIds, operation);
      
      return this.success(result, `批量${action}操作完成`);
    } catch (error) {
      console.error('❌ 批量操作失败:', error);
      return this.error(['批量操作失败'], '服务器错误');
    }
  }

  /**
   * 搜索产品建议
   * @param {string} query - 搜索关键词
   * @param {number} limit - 返回数量限制
   * @returns {Object} 搜索建议响应
   */
  async getSearchSuggestions(query, limit = 10) {
    try {
      this.logOperation('search_suggestions', '获取搜索建议', { query, limit });
      
      if (!query || query.length < 2) {
        return this.success([], '搜索关键词太短');
      }

      const products = this.dao.read();
      const searchFields = ['name', 'model', 'sku', 'brand', 'oe_number'];
      
      const suggestions = this.searchData(products, query, searchFields)
        .slice(0, limit)
        .map(product => ({
          id: product.id,
          name: product.name,
          model: product.model,
          sku: product.sku,
          category: product.category,
          brand: product.brand
        }));

      return this.success(suggestions, '获取搜索建议成功');
    } catch (error) {
      console.error('❌ 获取搜索建议失败:', error);
      return this.error(['获取搜索建议失败'], '服务器错误');
    }
  }
}

module.exports = ProductService;
