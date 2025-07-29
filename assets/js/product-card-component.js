/**
 * 🛍️ 统一商品卡组件 - 兼容性版本
 * 
 * ⚠️  注意：此文件已被新的统一产品卡片管理器替代
 * 新文件位置：assets/js/modules/components/product-card-manager.js
 * 
 * 此文件保留用于向后兼容，建议使用新的统一管理器
 * 
 * @deprecated 请使用 ProductCardManager 替代
 * @date 2025/06/28 (兼容性更新)
 */

// 全局产品点击统计函数
window.recordProductClick = async function(productId) {
    try {
        await fetch('/api/analytics/product-click', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId })
        });
    } catch (error) {
        // 静默失败，不影响用户体验
        console.log('产品点击统计记录失败，但不影响用户体验');
    }
};

class ProductCardComponent {
    constructor() {
        this.iconMap = {
            '原厂品质': 'check-circle',
            '德国工艺': 'industry',
            '博格华纳': 'cog',
            '大陆集团': 'building',
            '德尔福': 'tools',
            '电装': 'wrench',
            'SKF轴承': 'cog',
            '皮尔博格': 'cog',
            '钻石品质': 'gem',
            '高性能': 'rocket',
            '精准控制': 'hand-pointer',
            '精密喷射': 'atom',
            '配件齐全': 'box-open',
            '专业工具': 'hammer',
            '高端产品': 'star',
            '现货充足': 'boxes',
            '原厂正品': 'certificate',
            '高精度': 'ruler-combined',
            '长寿命': 'history',
            '性能稳定': 'chart-line',
            '质保1年': 'shield-alt'
        };

        this.badgeMap = {
            'new': '新品',
            'hot': '热门',
            'recommend': '推荐',
            'tech': '技术',
            'parts': '配件',
            'precision': '精工',
            'pro': '专业'
        };

        this.companyInfo = null;
        this.loadCompanyInfo();
        this.setupI18nListeners();
    }

    // 🆕 使用统一公司信息服务加载
    async loadCompanyInfo() {
        try {
            // 使用新的统一服务
            await window.companyService.loadCompanyInfo();
            
            // 获取公司信息数据
            this.companyInfo = window.companyService.getCompanyInfo();
            
            console.log('✅ 公司信息已通过统一服务加载 (ProductCardComponent)');
        } catch (error) {
            console.error('❌ 加载公司信息失败 (ProductCardComponent):', error);
            
            // 即使出错，统一服务也会提供默认值
            this.companyInfo = window.companyService.getCompanyInfo();
        }
    }

    /**
     * 设置国际化事件监听器
     */
    setupI18nListeners() {
        // 监听语言切换事件
        document.addEventListener('i18n:changed', () => {
            this.updateAllProductCards();
        });
    }

    /**
     * 更新所有产品卡片的翻译
     */
    updateAllProductCards() {
        console.log('🔄 更新产品卡片翻译 (ProductCardComponent)...');

        // 更新所有产品卡片中的特性标签
        const featureTags = document.querySelectorAll('.feature-tag[data-i18n]');
        console.log(`找到 ${featureTags.length} 个特性标签 (ProductCardComponent)`);

        featureTags.forEach(tag => {
            const key = tag.getAttribute('data-i18n');
            const i18n = window.i18nManager || window.i18n;
            if (key && i18n && i18n.t) {
                const translation = i18n.t(key);
                console.log(`翻译 ${key} → ${translation} (ProductCardComponent)`);

                // 查找 .feature-text 子元素
                const textSpan = tag.querySelector('.feature-text');
                if (textSpan) {
                    textSpan.textContent = translation;
                } else {
                    // 兼容旧版本：直接更新最后一个文本节点
                    const textNode = tag.childNodes[tag.childNodes.length - 1];
                    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                        textNode.textContent = translation;
                    }
                }
            }
        });

        console.log('✅ 产品卡片翻译更新完成 (ProductCardComponent)');
    }

    /**
     * 生成产品特性标签
     * @param {Object} product - 产品对象
     * @returns {Array} 特性标签数组
     */
    getProductFeatures(product) {
        // 如果产品有预设的特性，进行国际化处理
        if (product.features) {
            const presetFeatures = product.features.split(',').slice(0, 3);
            return presetFeatures.map(feature => {
                const trimmedFeature = feature.trim();
                // 尝试国际化预设特性
                const featureKey = this.getFeatureI18nKey(trimmedFeature);
                if (featureKey) {
                    return this.getI18nText(featureKey, trimmedFeature);
                }
                return trimmedFeature;
            });
        }

        const features = [];

        // 品牌相关特性
        if (product.brand === 'Garrett') features.push(this.getI18nText('product.features.original_quality', '原厂品质'));
        if (product.brand === 'Bosch') features.push(this.getI18nText('product.features.german_craft', '德国工艺'));
        if (product.brand === 'BorgWarner') features.push(this.getI18nText('product.features.borgwarner', '博格华纳'));
        if (product.brand === 'Continental') features.push(this.getI18nText('product.features.continental', '大陆集团'));
        if (product.brand === 'Delphi') features.push(this.getI18nText('product.features.delphi', '德尔福'));
        if (product.brand === 'Denso') features.push(this.getI18nText('product.features.denso', '电装'));
        if (product.brand === 'SKF') features.push(this.getI18nText('product.features.skf_bearing', 'SKF轴承'));
        if (product.brand === 'Pierburg') features.push(this.getI18nText('product.features.pierburg', '皮尔博格'));
        if (product.brand === 'Diamond-Auto') features.push(this.getI18nText('product.features.diamond_quality', '钻石品质'));

        // 分类相关特性
        if (product.category === 'turbocharger') features.push(this.getI18nText('product.features.high_performance', '高性能'));
        if (product.category === 'actuator') features.push(this.getI18nText('product.features.precise_control', '精准控制'));
        if (product.category === 'injector') features.push(this.getI18nText('product.features.precision_injection', '精密喷射'));
        if (product.category === 'turbo-parts') features.push(this.getI18nText('product.features.complete_parts', '配件齐全'));
        if (product.category === 'others') features.push(this.getI18nText('product.features.professional_tools', '专业工具'));

        // 价格和库存相关特性
        if (product.price && parseFloat(product.price) > 1000) features.push(this.getI18nText('product.features.premium_product', '高端产品'));
        if (product.stock > 20) features.push(this.getI18nText('product.features.in_stock', '现货充足'));

        // 默认特性（如果没有其他特性）
        if (features.length === 0) {
            features.push(
                this.getI18nText('product.features.original_genuine', '原厂正品'),
                this.getI18nText('product.features.stable_performance', '性能稳定'),
                this.getI18nText('product.features.one_year_warranty', '质保1年')
            );
        }

        return features.slice(0, 3); // 最多显示3个特性
    }

    /**
     * 获取特性图标
     * @param {string} feature - 特性名称
     * @returns {string} 图标类名
     */
    getFeatureIcon(feature) {
        return this.iconMap[feature] || 'tag';
    }

    /**
     * 生成产品标签
     * @param {Object} product - 产品对象
     * @returns {string} 标签类型
     */
    getProductBadge(product) {
        // 检查是否是新品（30天内）
        if (product.createdAt) {
            const createdDate = new Date(product.createdAt);
            const now = new Date();
            const daysDiff = (now - createdDate) / (1000 * 60 * 60 * 24);
            
            if (daysDiff < 30) return 'new';
        }
        
        // 检查是否是热门（库存充足）
        if (product.stock > 30) return 'hot';
        
        // 品牌和分类相关标签
        if (product.brand === 'Garrett') return 'recommend';
        if (product.category === 'actuator') return 'tech';
        if (product.category === 'turbo-parts') return 'parts';
        if (product.category === 'injector') return 'precision';
        if (product.category === 'others') return 'pro';
        
        return 'recommend'; // 默认推荐标签
    }

    /**
     * 获取标签文本
     * @param {string} badge - 标签类型
     * @returns {string} 标签文本
     */
    getBadgeText(badge) {
        // 🌍 支持多语种的标签文本
        if (window.i18n && window.i18n.initialized) {
            const i18nKey = `product.badges.${badge}`;
            const translation = window.i18n.t(i18nKey);
            if (translation !== i18nKey) {
                return translation;
            }
        }

        // 回退到默认中文
        return this.badgeMap[badge] || '推荐';
    }

    /**
     * 获取特性的国际化键
     * @param {string} feature - 特性名称
     * @returns {string|null} 国际化键
     */
    getFeatureI18nKey(feature) {
        const featureKeyMap = {
            // 后台预设特性标签（与admin.js中的presetFeatures对应）
            '原厂品质': 'product.features.original_quality',
            '钻石品质': 'product.features.diamond_quality',
            '高性能': 'product.features.high_performance',
            '精准控制': 'product.features.precise_control',
            '精密喷射': 'product.features.precision_injection',
            '配件齐全': 'product.features.complete_parts',
            '专业工具': 'product.features.professional_tools',
            '高端产品': 'product.features.premium_product',
            '现货充足': 'product.features.in_stock',
            '原厂正品': 'product.features.original_genuine',
            '高精度': 'product.features.high_precision',
            '长寿命': 'product.features.long_life',

            // 品牌相关特性
            '德国工艺': 'product.features.german_craft',
            '性能稳定': 'product.features.stable_performance',
            '质保1年': 'product.features.one_year_warranty',
            '博格华纳': 'product.features.borgwarner',
            '大陆集团': 'product.features.continental',
            '德尔福': 'product.features.delphi',
            '电装': 'product.features.denso',
            'SKF轴承': 'product.features.skf_bearing',
            '皮尔博格': 'product.features.pierburg',
            '高品质': 'product.features.high_quality',
            '耐用性': 'product.features.durability',
            '可靠性': 'product.features.reliability',
            '节能环保': 'product.features.eco_friendly',
            '快速响应': 'product.features.quick_response',
            '低噪音': 'product.features.low_noise',
            '易安装': 'product.features.easy_install',
            '全球保修': 'product.features.global_warranty',

            // 🌍 英文特性标签（支持双向翻译）
            'Diamond Quality': 'product.features.diamond_quality',
            'High Precision': 'product.features.high_precision',
            'Original Genuine': 'product.features.original_genuine',
            'High Performance': 'product.features.high_performance',
            'Long Life': 'product.features.long_life',
            'German Craft': 'product.features.german_craft',
            'Precise Control': 'product.features.precise_control',
            'Precision Injection': 'product.features.precision_injection',
            'Complete Parts': 'product.features.complete_parts',
            'Professional Tools': 'product.features.professional_tools',
            'Premium Product': 'product.features.premium_product',
            'In Stock': 'product.features.in_stock',
            'Stable Performance': 'product.features.stable_performance',
            'One Year Warranty': 'product.features.one_year_warranty',
            'High Quality': 'product.features.high_quality',
            'Durability': 'product.features.durability',
            'Reliability': 'product.features.reliability',
            'Eco Friendly': 'product.features.eco_friendly',
            'Quick Response': 'product.features.quick_response',
            'Low Noise': 'product.features.low_noise',
            'Easy Install': 'product.features.easy_install',
            'Global Warranty': 'product.features.global_warranty'
        };
        return featureKeyMap[feature] || null;
    }

    /**
     * 🌍 获取国际化文本
     * @param {string} key - 翻译键
     * @param {string} fallback - 回退文本
     * @returns {string} 翻译文本
     */
    getI18nText(key, fallback) {
        if (window.i18nManager && window.i18nManager.initialized) {
            const translation = window.i18nManager.t(key);
            if (translation !== key) {
                return translation;
            }
        }
        return fallback;
    }

    /**
     * 获取分类标识符（用于前端过滤）
     */
    getCategorySlug(product) {
        const categoryMapping = {
            '涡轮增压器': 'turbocharger',
            '执行器': 'actuator',
            '共轨喷油器': 'injector',
            '涡轮配件': 'turbo-parts',
            '其他': 'others'
        };

        const categoryName = product.category?.name || product.category || '其他';
        return categoryMapping[categoryName] || 'others';
    }

    /**
     * 渲染产品卡片
     * @param {Object} product - 产品对象
     * @param {Object} options - 渲染选项
     * @returns {string} HTML字符串
     */
    renderCard(product, options = {}) {
        const {
            showButtons = true,
            showDescription = true,
            imagePath = '',
            detailPath = 'pages/product-detail.html'
        } = options;

        const badge = this.getProductBadge(product);
        const features = this.getProductFeatures(product);
        // 🖼️ 获取产品图片URL - 支持新的images数组格式
        let imageUrl = `${imagePath}assets/images/carousel/img1.jpg`; // 默认图片

        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            // 优先使用主图，如果没有主图则使用第一张
            const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
            if (primaryImage && primaryImage.url) {
                imageUrl = primaryImage.url.startsWith('http') ?
                    primaryImage.url :
                    `${imagePath}${primaryImage.url}`;
            }
        } else if (product.image) {
            // 兼容旧的单图片格式
            imageUrl = product.image.startsWith('http') ?
                product.image :
                `${imagePath}${product.image}`;
        }

        const whatsappNumber = this.companyInfo?.contact?.whatsapp?.replace(/\D/g, '') || '8613656157230';

        return `
            <div class="product-showcase-card" data-category="${product.category}" data-brand="${product.brand || ''}">
                <div class="product-badge ${badge}">${this.getBadgeText(badge)}</div>
                <div class="product-image-container">
                    <a href="${detailPath}?id=${product.id}" class="product-image-link">
                        <img src="${imageUrl}" 
                             alt="${product.name}" 
                             class="product-image"
                             onerror="this.src='${imagePath}assets/images/carousel/img1.jpg'">
                    </a>
                </div>
                <div class="product-info">
                    <div class="product-brand">${product.brand || this.getI18nText('product.default_brand', '皇德国际')}</div>
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-model">${product.model || this.getI18nText('product.no_model', '暂无型号')}</div>
                    ${showDescription ? `<p class="product-description">${product.description || this.getI18nText('product.no_description', '暂无描述')}</p>` : ''}
                    <div class="product-features">
                        ${features.map(feature => {
                            const featureKey = this.getFeatureI18nKey(feature);
                            return `
                                <span class="feature-tag" ${featureKey ? `data-i18n="${featureKey}"` : ''}>
                                    <span class="feature-text">${feature}</span>
                                </span>
                            `;
                        }).join('')}
                    </div>
                    ${showButtons ? `
                        <div class="product-buttons">
                            <a href="${detailPath}?id=${product.id}" class="product-btn btn-detail">
                                <i class="fas fa-search-plus"></i>
                                <span data-i18n="product.view_details">查看详情</span>
                            </a>
                            <a href="https://wa.me/${whatsappNumber}?text=您好，我对${encodeURIComponent(product.name)}感兴趣，请提供详细信息和报价。谢谢！" class="product-btn btn-inquiry" target="_blank">
                                <i class="fab fa-whatsapp"></i>
                                <span data-i18n="product.quick_inquiry">立即询价</span>
                            </a>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * 批量渲染产品列表
     * @param {Array} products - 产品数组
     * @param {string} containerId - 容器ID
     * @param {Object} options - 渲染选项
     */
    renderProductList(products, containerId, options = {}) {
        const container = document.getElementById(containerId) || document.querySelector(containerId);
        if (!container) {
            console.error(`❌ 未找到容器: ${containerId}`);
            return;
        }

        const productCards = products.map(product => this.renderCard(product, options)).join('');
        container.innerHTML = productCards;

        // 🌍 触发多语言处理
        if (window.i18nManager && window.i18nManager.initialized) {
            window.i18nManager.processI18nContainer(container);
        }

        console.log(`✅ 成功渲染 ${products.length} 个产品卡片到 ${containerId}`);
    }

    /**
     * 渲染到网格容器（products.html使用）
     * @param {Array} products - 产品数组
     * @param {Object} options - 渲染选项
     */
    renderToGrid(products, options = {}) {
        const defaultOptions = {
            showButtons: true,
            showDescription: true,
            imagePath: '../',
            detailPath: 'product-detail.html',
            pageSize: this.getPageSize() // 从URL或选择器获取页面大小
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        // 获取当前页码（从URL参数或默认为1）
        const urlParams = new URLSearchParams(window.location.search);
        const currentPage = parseInt(urlParams.get('page')) || 1;
        
        // 计算分页
        const totalProducts = products.length;
        const totalPages = Math.ceil(totalProducts / finalOptions.pageSize);
        const start = (currentPage - 1) * finalOptions.pageSize;
        const end = start + finalOptions.pageSize;
        const pageProducts = products.slice(start, end);
        
        // 渲染当前页的产品
        this.renderProductList(pageProducts, '.products-grid', finalOptions);
        
        // 渲染分页按钮
        this.renderPagination(currentPage, totalPages);
        
        // 设置页面大小选择器的值
        const pageSizeSelect = document.getElementById('pageSize');
        if (pageSizeSelect) {
            pageSizeSelect.value = finalOptions.pageSize;
            
            // 添加改变事件监听器
            pageSizeSelect.addEventListener('change', () => {
                const newPageSize = pageSizeSelect.value;
                const url = new URL(window.location.href);
                url.searchParams.set('pageSize', newPageSize);
                url.searchParams.delete('page'); // 重置页码
                window.location.href = url.toString();
            });
        }
        
        // 设置跳转输入框的最大值
        const pageNumberInput = document.getElementById('pageNumber');
        if (pageNumberInput) {
            pageNumberInput.max = totalPages;
            pageNumberInput.placeholder = `1-${totalPages}`;
        }
        
        // 如果不是第一页，滚动到合适位置
        if (currentPage > 1) {
            window.scrollTo({
                top: document.querySelector('.products-filters').offsetTop - 150,
                behavior: 'smooth'
            });
        }
    }
    
    /**
     * 获取页面大小
     * @returns {number} 页面大小
     */
    getPageSize() {
        // 首先从URL参数获取
        const urlParams = new URLSearchParams(window.location.search);
        const urlPageSize = parseInt(urlParams.get('pageSize'));
        if (urlPageSize && [12, 24, 36, 48].includes(urlPageSize)) {
            return urlPageSize;
        }
        
        // 然后从选择器获取
        const pageSizeSelect = document.getElementById('pageSize');
        if (pageSizeSelect) {
            return parseInt(pageSizeSelect.value) || 12;
        }
        
        // 默认返回12
        return 12;
    }
    
    /**
     * 跳转到指定页面
     */
    jumpToPage() {
        const pageNumberInput = document.getElementById('pageNumber');
        if (!pageNumberInput) return;
        
        const pageNumber = parseInt(pageNumberInput.value);
        const maxPage = parseInt(pageNumberInput.max);
        
        if (pageNumber && pageNumber >= 1 && pageNumber <= maxPage) {
            const url = new URL(window.location.href);
            url.searchParams.set('page', pageNumber);
            window.location.href = url.toString();
        } else {
            // 显示错误提示
            pageNumberInput.style.borderColor = '#dc3545';
            setTimeout(() => {
                pageNumberInput.style.borderColor = '#e9ecef';
            }, 2000);
        }
    }

    /**
     * 渲染分页按钮
     * @param {number} currentPage - 当前页码
     * @param {number} totalPages - 总页数
     */
    renderPagination(currentPage, totalPages) {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;
        
        let buttons = [];
        
        // 添加上一页按钮
        buttons.push(`
            <a href="?page=${currentPage - 1}" 
               class="pagination-button ${currentPage === 1 ? 'disabled' : ''}"
               ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </a>
        `);
        
        // 生成页码按钮
        const addPageButton = (page) => {
            buttons.push(`
                <a href="?page=${page}" 
                   class="pagination-button ${currentPage === page ? 'active' : ''}"
                   ${currentPage === page ? 'aria-current="page"' : ''}>
                    ${page}
                </a>
            `);
        };
        
        // 添加省略号
        const addEllipsis = () => {
            buttons.push('<span class="pagination-ellipsis">...</span>');
        };
        
        // 显示页码逻辑
        if (totalPages <= 7) {
            // 如果总页数小于等于7，显示所有页码
            for (let i = 1; i <= totalPages; i++) {
                addPageButton(i);
            }
        } else {
            // 总是显示第一页
            addPageButton(1);
            
            if (currentPage > 3) {
                addEllipsis();
            }
            
            // 显示当前页附近的页码
            for (let i = Math.max(2, currentPage - 1); 
                 i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                addPageButton(i);
            }
            
            if (currentPage < totalPages - 2) {
                addEllipsis();
            }
            
            // 总是显示最后一页
            addPageButton(totalPages);
        }
        
        // 添加下一页按钮
        buttons.push(`
            <a href="?page=${currentPage + 1}" 
               class="pagination-button ${currentPage === totalPages ? 'disabled' : ''}"
               ${currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </a>
        `);
        
        // 渲染分页按钮
        pagination.innerHTML = buttons.join('');
        
        // 添加点击事件处理
        pagination.querySelectorAll('.pagination-button').forEach(button => {
            button.addEventListener('click', (e) => {
                if (button.classList.contains('disabled')) {
                    e.preventDefault();
                    return;
                }
                
                // 保持其他URL参数不变
                const url = new URL(button.href);
                const currentParams = new URLSearchParams(window.location.search);
                currentParams.forEach((value, key) => {
                    if (key !== 'page') {
                        url.searchParams.set(key, value);
                    }
                });
                
                button.href = url.toString();
            });
        });
    }

    /**
     * 渲染到展示容器（index.html使用）
     * @param {Array} products - 产品数组
     * @param {Object} options - 渲染选项
     */
    renderToShowcase(products, options = {}) {
        const defaultOptions = {
            showButtons: true,
            showDescription: true,
            imagePath: '',
            detailPath: 'pages/product-detail.html'
        };
        
        this.renderProductList(products, '#products-showcase', { ...defaultOptions, ...options });
    }
}

// 全局初始化产品卡组件
document.addEventListener('DOMContentLoaded', function() {
    if (!window.productCardComponent) {
        window.productCardComponent = new ProductCardComponent();
        console.log('✅ 产品卡组件已初始化');
    }
});

// 兼容性函数 - 保持向后兼容
window.getProductFeatures = function(product) {
    return window.productCardComponent.getProductFeatures(product);
};

window.getFeatureIcon = function(feature) {
    return window.productCardComponent.getFeatureIcon(feature);
};

window.getProductBadge = function(product) {
    const badge = window.productCardComponent.getProductBadge(product);
    return `<div class="product-badge ${badge}">${window.productCardComponent.getBadgeText(badge)}</div>`;
};

window.getBadgeText = function(badge) {
    return window.productCardComponent.getBadgeText(badge);
};

console.log('✅ 产品卡组件已加载'); 