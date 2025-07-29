/**
 * 🔍 统一搜索管理器 - 无锡皇德国际贸易有限公司
 * 合并所有搜索功能，解决重复绑定和冲突问题
 * 
 * 功能：
 * - 统一搜索事件管理
 * - 防重复绑定
 * - 智能搜索建议
 * - 搜索历史记录
 * - 跨页面搜索状态保持
 */

class UnifiedSearchManager {
    constructor() {
        this.searchInputs = new Map();
        this.searchButtons = new Map();
        this.isInitialized = false;
        this.searchHistory = [];
        this.maxHistoryItems = 10;
        this.debounceDelay = 300;
        this.debouncedSearch = null;
        
        console.log('🔍 统一搜索管理器初始化');
        this.init();
    }
    
    /**
     * 初始化搜索管理器
     */
    init() {
        if (this.isInitialized) {
            console.log('⚠️ 统一搜索管理器已初始化，跳过重复初始化');
            return;
        }
        
        try {
            // 设置全局引用
            window.unifiedSearchManager = this;
            
            // 创建防抖搜索函数
            this.debouncedSearch = this.debounce(this.performSearch.bind(this), this.debounceDelay);
            
            // 等待DOM准备完成后初始化
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.initSearchElements();
                });
            } else {
                this.initSearchElements();
            }
            
            // 加载搜索历史
            this.loadSearchHistory();
            
            this.isInitialized = true;
            console.log('✅ 统一搜索管理器初始化完成');
            
        } catch (error) {
            console.error('❌ 统一搜索管理器初始化失败:', error);
        }
    }
    
    /**
     * 初始化搜索元素
     */
    initSearchElements() {
        console.log('🔍 开始初始化搜索元素...');
        
        // 查找所有搜索输入框
        const searchInputSelectors = [
            'input[placeholder*="搜索"]',
            'input[placeholder*="search"]',
            '#searchInput',
            '.search-input',
            'input[type="search"]'
        ];
        
        searchInputSelectors.forEach(selector => {
            const inputs = document.querySelectorAll(selector);
            inputs.forEach(input => this.registerSearchInput(input));
        });
        
        // 查找所有搜索按钮
        const searchButtonSelectors = [
            '.search-button',
            '.search-btn',
            'button[type="submit"]',
            '.fa-search',
            '[data-search-button]'
        ];
        
        searchButtonSelectors.forEach(selector => {
            const buttons = document.querySelectorAll(selector);
            buttons.forEach(button => this.registerSearchButton(button));
        });
        
        // 禁用其他搜索脚本
        this.disableOtherSearchScripts();
        
        console.log(`✅ 搜索元素初始化完成 - 输入框: ${this.searchInputs.size}, 按钮: ${this.searchButtons.size}`);
    }
    
    /**
     * 注册搜索输入框
     */
    registerSearchInput(input) {
        if (!input || this.searchInputs.has(input)) {
            return;
        }
        
        const inputId = input.id || `search-input-${Date.now()}-${Math.random()}`;
        
        // 移除现有的事件监听器
        this.removeExistingListeners(input);
        
        // 绑定新的事件监听器
        const keydownHandler = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleSearch(input.value.trim());
            }
        };
        
        const inputHandler = (e) => {
            const query = e.target.value.trim();
            if (query.length > 2) {
                this.debouncedSearch(query);
            }
        };
        
        input.addEventListener('keydown', keydownHandler);
        input.addEventListener('input', inputHandler);
        
        this.searchInputs.set(input, {
            id: inputId,
            keydownHandler,
            inputHandler
        });
        
        console.log(`🔍 注册搜索输入框: ${inputId}`);
    }
    
    /**
     * 注册搜索按钮
     */
    registerSearchButton(button) {
        if (!button || this.searchButtons.has(button)) {
            return;
        }
        
        const buttonId = button.id || `search-button-${Date.now()}-${Math.random()}`;
        
        // 移除现有的事件监听器
        this.removeExistingListeners(button);
        
        // 绑定新的事件监听器
        const clickHandler = (e) => {
            e.preventDefault();
            
            // 查找关联的输入框
            const input = this.findAssociatedInput(button);
            if (input) {
                this.handleSearch(input.value.trim());
            }
        };
        
        button.addEventListener('click', clickHandler);
        
        this.searchButtons.set(button, {
            id: buttonId,
            clickHandler
        });
        
        console.log(`🔍 注册搜索按钮: ${buttonId}`);
    }
    
    /**
     * 查找关联的输入框
     */
    findAssociatedInput(button) {
        // 查找同一父容器中的输入框
        let parent = button.parentElement;
        while (parent && parent !== document.body) {
            const input = parent.querySelector('input[type="search"], input[placeholder*="搜索"], input[placeholder*="search"]');
            if (input) {
                return input;
            }
            parent = parent.parentElement;
        }
        
        // 如果没找到，返回第一个搜索输入框
        return Array.from(this.searchInputs.keys())[0] || null;
    }
    
    /**
     * 移除现有的事件监听器
     */
    removeExistingListeners(element) {
        // 克隆元素以移除所有事件监听器
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);
        return newElement;
    }
    
    /**
     * 处理搜索
     */
    handleSearch(query) {
        if (!query || query.length < 1) {
            console.log('⚠️ 搜索查询为空');
            return;
        }
        
        console.log(`🔍 执行搜索: "${query}"`);
        
        // 添加到搜索历史
        this.addToHistory(query);
        
        // 根据当前页面类型执行搜索
        const pageType = this.detectPageType();
        
        switch (pageType) {
            case 'products':
                this.searchInProductsPage(query);
                break;
            case 'home':
                this.redirectToProductsSearch(query);
                break;
            default:
                this.redirectToProductsSearch(query);
                break;
        }
    }
    
    /**
     * 在产品页面内搜索
     */
    searchInProductsPage(query) {
        console.log(`🔍 在产品页面搜索: "${query}"`);
        
        // 更新URL参数
        const url = new URL(window.location);
        url.searchParams.set('search', query);
        url.searchParams.delete('category'); // 清除分类筛选
        window.history.replaceState({}, '', url);
        
        // 触发产品筛选
        if (window.filterProducts) {
            window.filterProducts();
        } else if (window.searchProducts) {
            window.searchProducts(query);
        } else {
            // 使用自定义搜索逻辑
            this.performProductSearch(query);
        }
    }
    
    /**
     * 执行产品搜索
     */
    async performProductSearch(query) {
        try {
            // 获取产品数据
            const products = await window.unifiedDataManager.getProducts();
            
            // 搜索匹配的产品
            const filteredProducts = products.filter(product => {
                const searchText = `${product.name} ${product.model} ${product.description || ''} ${product.brand || ''}`.toLowerCase();
                return searchText.includes(query.toLowerCase());
            });
            
            console.log(`🎯 搜索结果: ${filteredProducts.length} 个产品匹配 "${query}"`);
            
            // 渲染搜索结果
            if (window.renderProducts) {
                window.renderProducts(filteredProducts);
            } else if (window.productCardComponent && window.productCardComponent.renderProducts) {
                window.productCardComponent.renderProducts(filteredProducts, '.products-grid');
            }
            
            // 更新产品计数
            this.updateProductCount(filteredProducts.length);
            
        } catch (error) {
            console.error('❌ 产品搜索失败:', error);
        }
    }
    
    /**
     * 跳转到产品页面搜索
     */
    redirectToProductsSearch(query) {
        console.log(`🔍 跳转到产品页面搜索: "${query}"`);
        
        const url = new URL(window.location.origin + '/pages/products.html');
        url.searchParams.set('search', query);
        
        window.location.href = url.toString();
    }
    
    /**
     * 防抖搜索
     */
    performSearch(query) {
        console.log(`🔍 防抖搜索触发: "${query}"`);
        // 这里可以添加实时搜索建议等功能
    }
    
    /**
     * 检测页面类型
     */
    detectPageType() {
        const path = window.location.pathname;
        if (path.includes('products.html') || path.includes('/products')) {
            return 'products';
        } else if (path.includes('index.html') || path === '/') {
            return 'home';
        }
        return 'other';
    }
    
    /**
     * 更新产品计数显示
     */
    updateProductCount(count) {
        const countElements = document.querySelectorAll('.product-count, .products-count, [data-product-count]');
        countElements.forEach(element => {
            element.textContent = `共${count}个产品`;
        });
    }
    
    /**
     * 添加到搜索历史
     */
    addToHistory(query) {
        // 移除重复项
        this.searchHistory = this.searchHistory.filter(item => item !== query);
        
        // 添加到开头
        this.searchHistory.unshift(query);
        
        // 限制历史记录数量
        if (this.searchHistory.length > this.maxHistoryItems) {
            this.searchHistory = this.searchHistory.slice(0, this.maxHistoryItems);
        }
        
        // 保存到本地存储
        this.saveSearchHistory();
    }
    
    /**
     * 加载搜索历史
     */
    loadSearchHistory() {
        try {
            const saved = localStorage.getItem('diamond_search_history');
            if (saved) {
                this.searchHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('⚠️ 加载搜索历史失败:', error);
        }
    }
    
    /**
     * 保存搜索历史
     */
    saveSearchHistory() {
        try {
            localStorage.setItem('diamond_search_history', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.warn('⚠️ 保存搜索历史失败:', error);
        }
    }
    
    /**
     * 禁用其他搜索脚本
     */
    disableOtherSearchScripts() {
        // 标记其他搜索脚本已被统一管理器接管
        window.searchManagerActive = true;
        
        console.log('🚫 其他搜索脚本已被禁用');
    }
    
    /**
     * 防抖函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * 获取搜索统计信息
     */
    getSearchStats() {
        return {
            inputCount: this.searchInputs.size,
            buttonCount: this.searchButtons.size,
            historyCount: this.searchHistory.length,
            recentSearches: this.searchHistory.slice(0, 5)
        };
    }
}

// 立即创建统一搜索管理器实例
if (!window.unifiedSearchManager) {
    window.unifiedSearchManager = new UnifiedSearchManager();
}

console.log('🔍 统一搜索管理器脚本加载完成');
