/**
 * 🎯 统一产品排序工具类
 * 确保整个网站的产品排序逻辑完全一致
 * 解决多处排序逻辑冲突的问题
 */

class ProductSortUtils {
    /**
     * 统一的产品排序函数
     * @param {Array} products - 产品数组
     * @param {Object} options - 排序选项
     * @returns {Array} 排序后的产品数组
     */
    static sortProducts(products, options = {}) {
        const {
            filterActive = true,  // 是否过滤活跃产品
            sortBy = 'default',   // 排序方式: default, price, name, date
            sortOrder = 'desc'    // 排序顺序: asc, desc
        } = options;

        if (!Array.isArray(products)) {
            console.warn('ProductSortUtils: 输入的products不是数组');
            return [];
        }

        let sortedProducts = [...products]; // 创建副本，避免修改原数组

        // 过滤活跃产品
        if (filterActive) {
            sortedProducts = sortedProducts.filter(
                product => product && product.status === 'active'
            );
        }

        // 根据排序方式进行排序
        sortedProducts.sort((a, b) => {
            switch (sortBy) {
                case 'price':
                    return this.compareByPrice(a, b, sortOrder);
                case 'name':
                    return this.compareByName(a, b, sortOrder);
                case 'date':
                    return this.compareByDate(a, b, sortOrder);
                case 'default':
                default:
                    return this.compareByDefault(a, b);
            }
        });

        return sortedProducts;
    }

    /**
     * 默认排序逻辑 - 优先级排序
     * @param {Object} a - 产品A
     * @param {Object} b - 产品B
     * @returns {number} 比较结果
     */
    static compareByDefault(a, b) {
        // 🥇 第一优先级：新品
        const aIsNew = a.isNew === 'true' || a.isNew === true;
        const bIsNew = b.isNew === 'true' || b.isNew === true;
        if (aIsNew !== bIsNew) return bIsNew - aIsNew;

        // 🥈 第二优先级：热门
        const aIsHot = a.isHot === 'true' || a.isHot === true;
        const bIsHot = b.isHot === 'true' || b.isHot === true;
        if (aIsHot !== bIsHot) return bIsHot - aIsHot;

        // 🥉 第三优先级：推荐
        const aIsRecommend = a.isRecommend === 'true' || a.isRecommend === true;
        const bIsRecommend = b.isRecommend === 'true' || b.isRecommend === true;
        if (aIsRecommend !== bIsRecommend) return bIsRecommend - aIsRecommend;

        // 🏆 最后按创建时间排序（最新的在前）
        return this.compareByDate(a, b, 'desc');
    }

    /**
     * 按价格排序
     * @param {Object} a - 产品A
     * @param {Object} b - 产品B
     * @param {string} order - 排序顺序
     * @returns {number} 比较结果
     */
    static compareByPrice(a, b, order = 'desc') {
        const priceA = parseFloat(a.price) || 0;
        const priceB = parseFloat(b.price) || 0;
        
        const result = priceA - priceB;
        return order === 'asc' ? result : -result;
    }

    /**
     * 按名称排序
     * @param {Object} a - 产品A
     * @param {Object} b - 产品B
     * @param {string} order - 排序顺序
     * @returns {number} 比较结果
     */
    static compareByName(a, b, order = 'asc') {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        
        const result = nameA.localeCompare(nameB);
        return order === 'asc' ? result : -result;
    }

    /**
     * 按日期排序
     * @param {Object} a - 产品A
     * @param {Object} b - 产品B
     * @param {string} order - 排序顺序
     * @returns {number} 比较结果
     */
    static compareByDate(a, b, order = 'desc') {
        // 获取时间戳，优先使用createdAt，然后updatedAt，最后使用id
        const timeA = new Date(a.createdAt || a.updatedAt || a.id || 0).getTime();
        const timeB = new Date(b.createdAt || b.updatedAt || b.id || 0).getTime();
        
        const result = timeA - timeB;
        return order === 'asc' ? result : -result;
    }

    /**
     * 获取主页展示产品 - 专用于主页的9个产品
     * @param {Array} products - 所有产品
     * @param {number} limit - 限制数量，默认9个
     * @returns {Array} 主页展示产品
     */
    static getHomePageProducts(products, limit = 9) {
        const sortedProducts = this.sortProducts(products, {
            filterActive: true,
            sortBy: 'default'
        });

        console.log(`📦 主页展示产品排序完成，共${sortedProducts.length}个产品`);
        console.log('📋 排序优先级: 新品 > 热门 > 推荐 > 创建时间');

        return sortedProducts.slice(0, limit);
    }

    /**
     * 获取搜索用产品 - 专用于搜索功能
     * @param {Array} products - 所有产品
     * @returns {Array} 搜索用产品
     */
    static getSearchProducts(products) {
        return this.sortProducts(products, {
            filterActive: true,
            sortBy: 'default'
        });
    }

    /**
     * 调试排序结果
     * @param {Array} products - 产品数组
     */
    static debugSortResult(products) {
        if (!Array.isArray(products)) return;

        console.group('🔍 产品排序调试信息');
        console.log(`总产品数: ${products.length}`);
        
        const newProducts = products.filter(p => p.isNew === 'true' || p.isNew === true);
        const hotProducts = products.filter(p => p.isHot === 'true' || p.isHot === true);
        const recommendProducts = products.filter(p => p.isRecommend === 'true' || p.isRecommend === true);
        
        console.log(`新品数量: ${newProducts.length}`);
        console.log(`热门数量: ${hotProducts.length}`);
        console.log(`推荐数量: ${recommendProducts.length}`);
        
        console.log('前5个产品:');
        products.slice(0, 5).forEach((product, index) => {
            const badges = [];
            if (product.isNew === 'true' || product.isNew === true) badges.push('新品');
            if (product.isHot === 'true' || product.isHot === true) badges.push('热门');
            if (product.isRecommend === 'true' || product.isRecommend === true) badges.push('推荐');
            
            console.log(`${index + 1}. ${product.name} ${badges.length ? `[${badges.join(', ')}]` : ''}`);
        });
        
        console.groupEnd();
    }
}

// 全局注册，确保在其他脚本中可以使用
window.ProductSortUtils = ProductSortUtils;

console.log('✅ 产品排序工具类已加载'); 