/**
 * 🏷️ 分类管理器 - 统一管理所有页面的分类数据
 * 这个文件确保所有分类相关的显示都从统一的数据源获取
 * 当后台管理系统完成后，只需要修改API接口即可
 */

class CategoryManager {
    constructor() {
        this.categories = [];
        this.brands = [];
        this.isLoaded = false;
    }

    /**
     * 加载分类数据
     */
    async loadCategories() {
        try {
            // 🗄️ 使用数据库API加载分类数据
            const response = await fetch('/api/db/categories');
            if (!response.ok) {
                throw new Error('Failed to load categories');
            }
            
            const data = await response.json();
            this.categories = Array.isArray(data) ? data : (data.categories || []);
            this.brands = data.brands || [];
            this.isLoaded = true;
            
            console.log('✅ 分类数据加载成功:', this.categories.length, '个分类');
            return true;
        } catch (error) {
            console.error('❌ 加载分类数据失败:', error);
            
            // 备用数据，确保页面基本功能正常 - 支持多语言翻译
            const getCategoryName = (categoryId) => {
                const categoryKey = `categories.${categoryId}`;
                const i18n = window.i18nManager || window.i18n;

                if (i18n && i18n.t) {
                    const translatedName = i18n.t(categoryKey);
                    if (translatedName && translatedName !== categoryKey) {
                        return translatedName;
                    }
                }

                // 回退到硬编码映射（兼容性保证）
                const fallbackMap = {
                    'all': '全部产品',
                    'turbocharger': '涡轮增压器',
                    'actuator': '执行器',
                    'injector': '共轨喷油器',
                    'turbo-parts': '涡轮配件',
                    'others': '其他'
                };
                const fallbackName = fallbackMap[categoryId] || categoryId;
                if (fallbackName === categoryId) {
                    console.log(`⚠️ 分类翻译失败，使用原ID: ${categoryId}`);
                }
                return fallbackName;
            };

            this.categories = [
                { id: 'all', name: getCategoryName('all'), slug: 'all' },
                { id: 'turbocharger', name: getCategoryName('turbocharger'), slug: 'turbocharger' },
                { id: 'actuator', name: getCategoryName('actuator'), slug: 'actuator' },
                { id: 'injector', name: getCategoryName('injector'), slug: 'injector' },
                { id: 'turbo-parts', name: getCategoryName('turbo-parts'), slug: 'turbo-parts' },
                { id: 'others', name: getCategoryName('others'), slug: 'others' }
            ];
            this.brands = [
                { id: 'all', name: getCategoryName('all'), slug: 'all' }
            ];
            this.isLoaded = true;
            return false;
        }
    }

    /**
     * 获取所有分类
     */
    getCategories(filter = {}) {
        let result = [...this.categories];
        
        if (filter.showInNav !== undefined) {
            result = result.filter(cat => cat.showInNav === filter.showInNav);
        }
        
        if (filter.showInTags !== undefined) {
            result = result.filter(cat => cat.showInTags === filter.showInTags);
        }
        
        if (filter.showInCarousel !== undefined) {
            result = result.filter(cat => cat.showInCarousel === filter.showInCarousel);
        }
        
        return result.sort((a, b) => (a.order || 999) - (b.order || 999));
    }

    /**
     * 获取单个分类
     */
    getCategory(id) {
        return this.categories.find(cat => cat.id === id || cat.slug === id);
    }

    /**
     * 获取所有品牌
     */
    getBrands() {
        return [...this.brands];
    }

    /**
     * 渲染导航菜单中的分类下拉
     */
    renderNavCategories(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const navCategories = this.getCategories({ showInNav: true });
        
        container.innerHTML = navCategories.map(category => `
            <li><a href="pages/products.html?category=${category.slug}">${category.name}</a></li>
        `).join('');
    }

    /**
     * 渲染产品页面的分类标签
     */
    renderProductTags(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const tagCategories = this.getCategories({ showInTags: true });
        
        container.innerHTML = tagCategories.map(category => `
            <button class="tag-btn ${category.id === 'all' ? 'active' : ''}" 
                    data-category="${category.id}" 
                    onclick="filterProductsByTag('${category.id}')">
                ${category.name}
            </button>
        `).join('');
    }

    /**
     * 渲染分类下拉选择器
     */
    renderCategorySelect(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;

        const categories = this.getCategories({ showInTags: true });
        
        select.innerHTML = categories.map(category => `
            <option value="${category.id}">${category.name}</option>
        `).join('');
    }

    /**
     * 渲染品牌下拉选择器
     */
    renderBrandSelect(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;

        select.innerHTML = this.brands.map(brand => `
            <option value="${brand.id}">${brand.name}</option>
        `).join('');
    }

    /**
     * 渲染轮播图
     */
    renderCarousel(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const carouselCategories = this.getCategories({ showInCarousel: true });
        
        container.innerHTML = carouselCategories.map((category, index) => `
            <div class="carousel-slide ${index === 0 ? 'active' : ''}">
                <img src="${category.carouselImage}" alt="${category.name}" class="slide-image" 
                     onerror="this.src='https://via.placeholder.com/1200x500/${category.color.replace('#', '')}/ffffff?text=${encodeURIComponent(category.name)}'">
                <div class="slide-overlay">
                    <div class="slide-content">
                        <h2>${category.name}</h2>
                        <p>${category.description}</p>
                        <a href="pages/products.html?category=${category.slug}" class="btn-primary">了解更多</a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * 渲染页脚分类链接
     */
    renderFooterCategories(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const footerCategories = this.getCategories({ showInNav: true }).slice(1); // 排除"全部产品"
        
        container.innerHTML = footerCategories.map(category => `
            <li><a href="pages/products.html?category=${category.slug}">${category.name}</a></li>
        `).join('');
    }

    /**
     * 确保分类数据已加载
     */
    async ensureLoaded() {
        if (!this.isLoaded) {
            await this.loadCategories();
        }
        return this.isLoaded;
    }
}

// 创建全局分类管理器实例
window.categoryManager = new CategoryManager();

/**
 * 🔄 页面初始化时自动加载分类数据
 * 这确保了所有页面都能获取到最新的分类信息
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 开始加载分类数据...');
    
    try {
        await window.categoryManager.loadCategories();
        
        // 触发自定义事件，通知其他脚本分类数据已加载完成
        const event = new CustomEvent('categoriesLoaded', {
            detail: {
                categories: window.categoryManager.categories,
                brands: window.categoryManager.brands
            }
        });
        document.dispatchEvent(event);
        
        console.log('✅ 分类数据加载完成，已触发 categoriesLoaded 事件');
        
    } catch (error) {
        console.error('❌ 分类数据加载失败:', error);
    }
});

/**
 * 🔧 工具函数：等待分类数据加载完成
 */
window.waitForCategories = function() {
    return new Promise((resolve) => {
        if (window.categoryManager.isLoaded) {
            resolve(window.categoryManager);
        } else {
            document.addEventListener('categoriesLoaded', () => {
                resolve(window.categoryManager);
            }, { once: true });
        }
    });
}; 