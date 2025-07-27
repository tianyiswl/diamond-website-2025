// 📂 分类服务层
// 处理产品分类相关的业务逻辑

const BaseService = require('./baseService');
const dao = require('../dao');

class CategoryService extends BaseService {
  constructor() {
    super(dao.getCategoryDao());
    this.productDao = dao.getProductDao();
  }

  /**
   * 获取分类列表
   * @param {Object} options - 查询选项
   * @returns {Object} 分类列表响应
   */
  async getCategories(options = {}) {
    try {
      this.logOperation('get_categories', '获取分类列表', options);
      
      const categories = this.dao.findAll(options);
      
      // 添加产品数量信息
      const products = this.productDao.read();
      const categoriesWithCount = categories.map(category => ({
        ...category,
        productCount: products.filter(p => p.category === category.name).length
      }));

      return this.success(categoriesWithCount, '获取分类列表成功');
    } catch (error) {
      console.error('❌ 获取分类列表失败:', error);
      return this.error(['获取分类列表失败'], '服务器错误');
    }
  }

  /**
   * 获取活跃分类
   * @returns {Object} 活跃分类响应
   */
  async getActiveCategories() {
    try {
      this.logOperation('get_active_categories', '获取活跃分类');
      
      const categories = this.dao.getActiveCategories();
      
      // 添加产品数量信息
      const products = this.productDao.read();
      const categoriesWithCount = categories.map(category => ({
        ...category,
        productCount: products.filter(p => p.category === category.name).length
      }));

      return this.success(categoriesWithCount, '获取活跃分类成功');
    } catch (error) {
      console.error('❌ 获取活跃分类失败:', error);
      return this.error(['获取活跃分类失败'], '服务器错误');
    }
  }

  /**
   * 获取单个分类
   * @param {string} id - 分类ID
   * @returns {Object} 分类详情响应
   */
  async getCategory(id) {
    try {
      this.logOperation('get_category', '获取分类详情', { id });
      
      if (!id) {
        return this.error(['分类ID不能为空'], '参数错误');
      }

      const category = this.dao.findById(id);
      
      if (!category) {
        return this.error(['分类不存在'], '分类未找到');
      }

      // 添加产品数量和产品列表
      const products = this.productDao.read();
      const categoryProducts = products.filter(p => p.category === category.name);
      
      const categoryWithDetails = {
        ...category,
        productCount: categoryProducts.length,
        products: categoryProducts.slice(0, 10) // 只返回前10个产品
      };

      return this.success(categoryWithDetails, '获取分类详情成功');
    } catch (error) {
      console.error('❌ 获取分类详情失败:', error);
      return this.error(['获取分类详情失败'], '服务器错误');
    }
  }

  /**
   * 创建分类
   * @param {Object} categoryData - 分类数据
   * @returns {Object} 创建结果响应
   */
  async createCategory(categoryData) {
    try {
      this.logOperation('create_category', '创建分类', categoryData);
      
      // 验证必填字段
      const requiredFields = ['name'];
      const validation = this.validateRequired(categoryData, requiredFields);
      
      if (!validation.isValid) {
        return this.error(validation.errors, '数据验证失败');
      }

      // 检查分类名称是否重复
      const existingCategory = this.dao.findByName(categoryData.name);
      if (existingCategory) {
        return this.error(['分类名称已存在'], '重复数据');
      }

      // 清理和验证数据
      const allowedFields = ['name', 'description', 'icon', 'color', 'order', 'status'];
      const cleanData = this.sanitizeData(categoryData, allowedFields);
      
      // 设置默认值
      cleanData.status = cleanData.status || 'active';
      cleanData.order = cleanData.order || 0;

      // 创建分类
      const result = await this.dao.create(cleanData);
      
      if (!result.success) {
        return this.error(result.errors, '创建分类失败');
      }

      return this.success(result.data, '分类创建成功');
    } catch (error) {
      console.error('❌ 创建分类失败:', error);
      return this.error(['创建分类失败'], '服务器错误');
    }
  }

  /**
   * 更新分类
   * @param {string} id - 分类ID
   * @param {Object} updateData - 更新数据
   * @returns {Object} 更新结果响应
   */
  async updateCategory(id, updateData) {
    try {
      this.logOperation('update_category', '更新分类', { id, updateData });
      
      if (!id) {
        return this.error(['分类ID不能为空'], '参数错误');
      }

      // 检查分类是否存在
      const existingCategory = this.dao.findById(id);
      if (!existingCategory) {
        return this.error(['分类不存在'], '分类未找到');
      }

      // 检查分类名称是否重复（如果要更新名称）
      if (updateData.name && updateData.name !== existingCategory.name) {
        const duplicateName = this.dao.findByName(updateData.name);
        if (duplicateName && duplicateName.id !== id) {
          return this.error(['分类名称已存在'], '重复数据');
        }
      }

      // 清理数据
      const allowedFields = ['name', 'description', 'icon', 'color', 'order', 'status'];
      const cleanData = this.sanitizeData(updateData, allowedFields);

      // 更新分类
      const result = await this.dao.update(id, cleanData);
      
      if (!result.success) {
        return this.error(result.errors, '更新分类失败');
      }

      // 如果分类名称发生变化，需要更新相关产品
      if (updateData.name && updateData.name !== existingCategory.name) {
        await this.updateProductCategories(existingCategory.name, updateData.name);
      }

      return this.success(result.data, '分类更新成功');
    } catch (error) {
      console.error('❌ 更新分类失败:', error);
      return this.error(['更新分类失败'], '服务器错误');
    }
  }

  /**
   * 删除分类
   * @param {string} id - 分类ID
   * @returns {Object} 删除结果响应
   */
  async deleteCategory(id) {
    try {
      this.logOperation('delete_category', '删除分类', { id });
      
      if (!id) {
        return this.error(['分类ID不能为空'], '参数错误');
      }

      // 检查分类是否存在
      const existingCategory = this.dao.findById(id);
      if (!existingCategory) {
        return this.error(['分类不存在'], '分类未找到');
      }

      // 检查是否有产品使用此分类
      const products = this.productDao.read();
      const productsUsingCategory = products.filter(p => p.category === existingCategory.name);
      
      if (productsUsingCategory.length > 0) {
        return this.error([`无法删除分类，还有 ${productsUsingCategory.length} 个产品使用此分类`], '分类被使用');
      }

      // 删除分类
      const result = await this.dao.delete(id);
      
      if (!result.success) {
        return this.error(result.errors, '删除分类失败');
      }

      return this.success(result.data, '分类删除成功');
    } catch (error) {
      console.error('❌ 删除分类失败:', error);
      return this.error(['删除分类失败'], '服务器错误');
    }
  }

  /**
   * 获取分类统计信息
   * @returns {Object} 统计信息响应
   */
  async getCategoryStats() {
    try {
      this.logOperation('get_category_stats', '获取分类统计');
      
      const stats = this.dao.getCategoryStats();
      
      if (!stats) {
        return this.error(['获取统计信息失败'], '服务器错误');
      }

      // 添加额外的统计信息
      const categories = this.dao.findAll();
      const enhancedStats = {
        ...stats,
        topCategories: Object.entries(stats.categoryProductCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([name, count]) => ({ name, count })),
        emptyCategories: categories.filter(cat => 
          (stats.categoryProductCounts[cat.name] || 0) === 0
        ).length
      };

      return this.success(enhancedStats, '获取分类统计成功');
    } catch (error) {
      console.error('❌ 获取分类统计失败:', error);
      return this.error(['获取分类统计失败'], '服务器错误');
    }
  }

  /**
   * 批量更新分类排序
   * @param {Array} categoryOrders - 分类排序数据
   * @returns {Object} 批量更新结果响应
   */
  async reorderCategories(categoryOrders) {
    try {
      this.logOperation('reorder_categories', '重新排序分类', categoryOrders);
      
      if (!Array.isArray(categoryOrders)) {
        return this.error(['分类排序数据格式错误'], '参数错误');
      }

      const operations = categoryOrders.map(({ id, order }) => 
        () => this.dao.update(id, { order: parseInt(order) })
      );

      const result = await this.batchOperation(categoryOrders, async (item) => {
        return await this.dao.update(item.id, { order: parseInt(item.order) });
      });

      return this.success(result, '分类排序更新完成');
    } catch (error) {
      console.error('❌ 分类排序更新失败:', error);
      return this.error(['分类排序更新失败'], '服务器错误');
    }
  }

  /**
   * 更新产品分类（当分类名称变更时）
   * @param {string} oldName - 旧分类名称
   * @param {string} newName - 新分类名称
   * @returns {Promise<void>}
   */
  async updateProductCategories(oldName, newName) {
    try {
      const products = this.productDao.read();
      const productsToUpdate = products.filter(p => p.category === oldName);
      
      for (const product of productsToUpdate) {
        await this.productDao.update(product.id, { category: newName });
      }
      
      console.log(`✅ 已更新 ${productsToUpdate.length} 个产品的分类名称`);
    } catch (error) {
      console.error('❌ 更新产品分类失败:', error);
    }
  }

  /**
   * 获取分类下的产品数量
   * @param {string} id - 分类ID
   * @returns {Object} 产品数量响应
   */
  async getCategoryProductCount(id) {
    try {
      this.logOperation('get_category_product_count', '获取分类产品数量', { id });
      
      if (!id) {
        return this.error(['分类ID不能为空'], '参数错误');
      }

      const category = this.dao.findById(id);
      if (!category) {
        return this.error(['分类不存在'], '分类未找到');
      }

      const products = this.productDao.read();
      const productCount = products.filter(p => p.category === category.name).length;

      return this.success({
        categoryId: category.id,
        categoryName: category.name,
        productCount: productCount
      }, '获取分类产品数量成功');
    } catch (error) {
      console.error('❌ 获取分类产品数量失败:', error);
      return this.error(['获取分类产品数量失败'], '服务器错误');
    }
  }
}

module.exports = CategoryService;
