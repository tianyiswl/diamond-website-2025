// 📂 分类数据访问层
// 专门处理产品分类相关的数据操作

const BaseDao = require('./baseDao');
const utils = require('../utils');

class CategoryDao extends BaseDao {
  constructor() {
    super('categories.json', []);
  }

  /**
   * 获取所有分类
   * @param {Object} options - 查询选项
   * @returns {Array} 分类列表
   */
  findAll(options = {}) {
    const { sortBy = 'name', sortOrder = 'asc' } = options;
    let categories = this.read();

    // 排序
    categories.sort((a, b) => {
      let valueA, valueB;

      switch (sortBy) {
        case 'name':
          valueA = (a.name || '').toLowerCase();
          valueB = (b.name || '').toLowerCase();
          break;
        case 'createdAt':
          valueA = new Date(a.createdAt || 0);
          valueB = new Date(b.createdAt || 0);
          break;
        case 'id':
        default:
          valueA = parseInt(a.id) || 0;
          valueB = parseInt(b.id) || 0;
          break;
      }

      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return categories;
  }

  /**
   * 根据ID查找分类
   * @param {string} id - 分类ID
   * @returns {Object|null} 分类对象或null
   */
  findById(id) {
    const categories = this.read();
    return categories.find(category => category.id === id) || null;
  }

  /**
   * 根据名称查找分类
   * @param {string} name - 分类名称
   * @returns {Object|null} 分类对象或null
   */
  findByName(name) {
    const categories = this.read();
    return categories.find(category => 
      category.name && category.name.toLowerCase() === name.toLowerCase()
    ) || null;
  }

  /**
   * 创建新分类
   * @param {Object} categoryData - 分类数据
   * @returns {Object} 创建结果
   */
  create(categoryData) {
    try {
      // 验证分类数据
      const validation = utils.validateCategory(categoryData);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      const categories = this.read();
      
      // 检查分类名称是否已存在
      const existingCategory = this.findByName(categoryData.name);
      if (existingCategory) {
        return {
          success: false,
          errors: ['分类名称已存在']
        };
      }

      // 生成新ID
      const maxId = categories.length > 0 ? 
        Math.max(...categories.map(c => parseInt(c.id) || 0)) : 0;
      const newId = (maxId + 1).toString();

      // 创建分类对象
      const newCategory = {
        id: newId,
        name: utils.sanitizeString(categoryData.name),
        description: utils.sanitizeString(categoryData.description || ''),
        icon: categoryData.icon || '',
        color: categoryData.color || '',
        order: categoryData.order || 0,
        status: categoryData.status || 'active',
        createdAt: utils.getISOString(),
        updatedAt: utils.getISOString()
      };

      // 添加到分类列表
      categories.push(newCategory);

      // 保存数据
      if (this.write(categories)) {
        return {
          success: true,
          data: newCategory
        };
      } else {
        return {
          success: false,
          errors: ['保存分类数据失败']
        };
      }
    } catch (error) {
      console.error('创建分类失败:', error);
      return {
        success: false,
        errors: ['创建分类时发生错误']
      };
    }
  }

  /**
   * 更新分类
   * @param {string} id - 分类ID
   * @param {Object} updateData - 更新数据
   * @returns {Object} 更新结果
   */
  update(id, updateData) {
    try {
      const categories = this.read();
      const categoryIndex = categories.findIndex(c => c.id === id);

      if (categoryIndex === -1) {
        return {
          success: false,
          errors: ['分类不存在']
        };
      }

      // 如果更新名称，检查是否与其他分类重复
      if (updateData.name && updateData.name !== categories[categoryIndex].name) {
        const existingCategory = this.findByName(updateData.name);
        if (existingCategory && existingCategory.id !== id) {
          return {
            success: false,
            errors: ['分类名称已存在']
          };
        }
      }

      // 验证更新数据
      const mergedData = { ...categories[categoryIndex], ...updateData };
      const validation = utils.validateCategory(mergedData);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // 更新分类
      const updatedCategory = {
        ...categories[categoryIndex],
        ...updateData,
        updatedAt: utils.getISOString()
      };

      // 清理字符串字段
      if (updatedCategory.name) {
        updatedCategory.name = utils.sanitizeString(updatedCategory.name);
      }
      if (updatedCategory.description) {
        updatedCategory.description = utils.sanitizeString(updatedCategory.description);
      }

      categories[categoryIndex] = updatedCategory;

      // 保存数据
      if (this.write(categories)) {
        return {
          success: true,
          data: updatedCategory
        };
      } else {
        return {
          success: false,
          errors: ['保存分类数据失败']
        };
      }
    } catch (error) {
      console.error('更新分类失败:', error);
      return {
        success: false,
        errors: ['更新分类时发生错误']
      };
    }
  }

  /**
   * 删除分类
   * @param {string} id - 分类ID
   * @returns {Object} 删除结果
   */
  delete(id) {
    try {
      const categories = this.read();
      const categoryIndex = categories.findIndex(c => c.id === id);

      if (categoryIndex === -1) {
        return {
          success: false,
          errors: ['分类不存在']
        };
      }

      // 检查是否有产品使用此分类
      const ProductDao = require('./productDao');
      const productDao = new ProductDao();
      const products = productDao.read();
      const categoryName = categories[categoryIndex].name;
      const productsUsingCategory = products.filter(p => p.category === categoryName);

      if (productsUsingCategory.length > 0) {
        return {
          success: false,
          errors: [`无法删除分类，还有 ${productsUsingCategory.length} 个产品使用此分类`]
        };
      }

      const deletedCategory = categories[categoryIndex];
      categories.splice(categoryIndex, 1);

      // 保存数据
      if (this.write(categories)) {
        return {
          success: true,
          data: deletedCategory
        };
      } else {
        return {
          success: false,
          errors: ['保存分类数据失败']
        };
      }
    } catch (error) {
      console.error('删除分类失败:', error);
      return {
        success: false,
        errors: ['删除分类时发生错误']
      };
    }
  }

  /**
   * 获取分类统计信息
   * @returns {Object} 统计信息
   */
  getCategoryStats() {
    try {
      const categories = this.read();
      
      // 获取产品数据来统计每个分类的产品数量
      const ProductDao = require('./productDao');
      const productDao = new ProductDao();
      const products = productDao.read();

      const stats = {
        total: categories.length,
        active: categories.filter(c => c.status === 'active').length,
        inactive: categories.filter(c => c.status === 'inactive').length,
        categoryProductCounts: {}
      };

      // 统计每个分类的产品数量
      categories.forEach(category => {
        const productCount = products.filter(p => p.category === category.name).length;
        stats.categoryProductCounts[category.name] = productCount;
      });

      return stats;
    } catch (error) {
      console.error('获取分类统计失败:', error);
      return null;
    }
  }

  /**
   * 获取活跃分类列表（用于前端显示）
   * @returns {Array} 活跃分类列表
   */
  getActiveCategories() {
    const categories = this.findAll({ sortBy: 'order', sortOrder: 'asc' });
    return categories.filter(category => category.status === 'active');
  }
}

module.exports = CategoryDao;
