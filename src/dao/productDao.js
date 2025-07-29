// 📦 产品数据访问层
// 专门处理产品相关的数据操作

const BaseDao = require('./baseDao');
const utils = require('../utils');

class ProductDao extends BaseDao {
  constructor() {
    super('products.json', []);
  }

  /**
   * 获取所有产品
   * @param {Object} options - 查询选项
   * @returns {Array} 产品列表
   */
  findAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      category = '',
      status = '',
      sortBy = 'id',
      sortOrder = 'desc'
    } = options;

    let products = this.read();

    // 搜索筛选
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(product =>
        (product.name && product.name.toLowerCase().includes(searchLower)) ||
        (product.model && product.model.toLowerCase().includes(searchLower)) ||
        (product.sku && product.sku.toLowerCase().includes(searchLower)) ||
        (product.description && product.description.toLowerCase().includes(searchLower)) ||
        (product.brand && product.brand.toLowerCase().includes(searchLower)) ||
        (product.oe_number && product.oe_number.toLowerCase().includes(searchLower)) ||
        (product.compatibility && product.compatibility.toLowerCase().includes(searchLower)) ||
        (product.notes && product.notes.toLowerCase().includes(searchLower)) ||
        (product.features && product.features.toLowerCase().includes(searchLower))
      );
    }

    // 分类筛选
    if (category) {
      products = products.filter(product => product.category === category);
    }

    // 状态筛选
    if (status) {
      products = products.filter(product => product.status === status);
    }

    // 排序
    products.sort((a, b) => {
      let valueA, valueB;

      switch (sortBy) {
        case 'name':
          valueA = (a.name || '').toLowerCase();
          valueB = (b.name || '').toLowerCase();
          break;
        case 'price':
          valueA = parseFloat(a.price) || 0;
          valueB = parseFloat(b.price) || 0;
          break;
        case 'stock':
          valueA = parseInt(a.stock) || 0;
          valueB = parseInt(b.stock) || 0;
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

    // 分页
    const total = products.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = products.slice(startIndex, endIndex);

    return {
      data: paginatedProducts,
      pagination: {
        current: page,
        total: totalPages,
        limit: limit,
        totalItems: total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
      },
      filters: {
        search,
        category,
        status,
        sortBy,
        sortOrder
      }
    };
  }

  /**
   * 根据ID查找产品
   * @param {string} id - 产品ID
   * @returns {Object|null} 产品对象或null
   */
  findById(id) {
    const products = this.read();
    return products.find(product => product.id === id) || null;
  }

  /**
   * 根据SKU查找产品
   * @param {string} sku - 产品SKU
   * @returns {Object|null} 产品对象或null
   */
  findBySku(sku) {
    const products = this.read();
    return products.find(product => product.sku === sku) || null;
  }

  /**
   * 创建新产品
   * @param {Object} productData - 产品数据
   * @returns {Object} 创建结果
   */
  create(productData) {
    try {
      // 验证产品数据
      const validation = utils.validateProduct(productData);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      const products = this.read();
      
      // 生成新ID
      const maxId = products.length > 0 ? 
        Math.max(...products.map(p => parseInt(p.id) || 0)) : 0;
      const newId = (maxId + 1).toString();

      // 创建产品对象
      const newProduct = {
        id: newId,
        sku: productData.sku || utils.generateSKU(),
        name: utils.sanitizeString(productData.name),
        category: utils.sanitizeString(productData.category),
        brand: utils.sanitizeString(productData.brand || ''),
        model: utils.sanitizeString(productData.model || ''),
        price: productData.price || '',
        stock: productData.stock || '',
        description: utils.sanitizeString(productData.description || ''),
        oe_number: utils.sanitizeString(productData.oe_number || ''),
        compatibility: utils.sanitizeString(productData.compatibility || ''),
        features: utils.sanitizeString(productData.features || ''),
        notes: utils.sanitizeString(productData.notes || ''),
        images: productData.images || [],
        status: productData.status || 'active',
        createdAt: utils.getISOString(),
        updatedAt: utils.getISOString()
      };

      // 添加到产品列表
      products.push(newProduct);

      // 保存数据
      if (this.write(products)) {
        return {
          success: true,
          data: newProduct
        };
      } else {
        return {
          success: false,
          errors: ['保存产品数据失败']
        };
      }
    } catch (error) {
      console.error('创建产品失败:', error);
      return {
        success: false,
        errors: ['创建产品时发生错误']
      };
    }
  }

  /**
   * 更新产品
   * @param {string} id - 产品ID
   * @param {Object} updateData - 更新数据
   * @returns {Object} 更新结果
   */
  update(id, updateData) {
    try {
      const products = this.read();
      const productIndex = products.findIndex(p => p.id === id);

      if (productIndex === -1) {
        return {
          success: false,
          errors: ['产品不存在']
        };
      }

      // 验证更新数据
      const mergedData = { ...products[productIndex], ...updateData };
      const validation = utils.validateProduct(mergedData);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // 更新产品
      const updatedProduct = {
        ...products[productIndex],
        ...updateData,
        updatedAt: utils.getISOString()
      };

      // 清理字符串字段
      ['name', 'category', 'brand', 'model', 'description', 'oe_number', 
       'compatibility', 'features', 'notes'].forEach(field => {
        if (updatedProduct[field]) {
          updatedProduct[field] = utils.sanitizeString(updatedProduct[field]);
        }
      });

      products[productIndex] = updatedProduct;

      // 保存数据
      if (this.write(products)) {
        return {
          success: true,
          data: updatedProduct
        };
      } else {
        return {
          success: false,
          errors: ['保存产品数据失败']
        };
      }
    } catch (error) {
      console.error('更新产品失败:', error);
      return {
        success: false,
        errors: ['更新产品时发生错误']
      };
    }
  }

  /**
   * 删除产品
   * @param {string} id - 产品ID
   * @returns {Object} 删除结果
   */
  delete(id) {
    try {
      const products = this.read();
      const productIndex = products.findIndex(p => p.id === id);

      if (productIndex === -1) {
        return {
          success: false,
          errors: ['产品不存在']
        };
      }

      const deletedProduct = products[productIndex];
      products.splice(productIndex, 1);

      // 保存数据
      if (this.write(products)) {
        return {
          success: true,
          data: deletedProduct
        };
      } else {
        return {
          success: false,
          errors: ['保存产品数据失败']
        };
      }
    } catch (error) {
      console.error('删除产品失败:', error);
      return {
        success: false,
        errors: ['删除产品时发生错误']
      };
    }
  }

  /**
   * 获取产品统计信息
   * @returns {Object} 统计信息
   */
  getProductStats() {
    try {
      const products = this.read();
      
      const stats = {
        total: products.length,
        active: products.filter(p => p.status === 'active').length,
        inactive: products.filter(p => p.status === 'inactive').length,
        categories: {},
        brands: {},
        avgPrice: 0,
        totalStock: 0
      };

      let totalPrice = 0;
      let priceCount = 0;

      products.forEach(product => {
        // 分类统计
        if (product.category) {
          stats.categories[product.category] = (stats.categories[product.category] || 0) + 1;
        }

        // 品牌统计
        if (product.brand) {
          stats.brands[product.brand] = (stats.brands[product.brand] || 0) + 1;
        }

        // 价格统计
        const price = parseFloat(product.price);
        if (!isNaN(price)) {
          totalPrice += price;
          priceCount++;
        }

        // 库存统计
        const stock = parseInt(product.stock);
        if (!isNaN(stock)) {
          stats.totalStock += stock;
        }
      });

      stats.avgPrice = priceCount > 0 ? (totalPrice / priceCount).toFixed(2) : 0;

      return stats;
    } catch (error) {
      console.error('获取产品统计失败:', error);
      return null;
    }
  }
}

module.exports = ProductDao;
