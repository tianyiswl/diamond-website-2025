/**
 * 统一产品卡片管理器
 * 整合所有产品卡片生成逻辑，提供统一的API
 * 
 * 功能特性：
 * - 多种卡片样式（展示卡片、推荐卡片、管理卡片）
 * - 统一的数据处理和图片处理
 * - 响应式设计和错误处理
 * - 缓存机制和性能优化
 * 
 * @author AI Assistant
 * @version 1.0.0
 * @date 2025/06/28
 */

class ProductCardManager {
    constructor() {
        this.companyInfo = null;
        this.cache = new Map(); // 缓存机制
        this.init();
    }

    /**
     * 初始化产品卡片管理器
     */
    async init() {
        try {
            await this.loadCompanyInfo();
            this.setupI18nListeners();
            console.log('✅ 产品卡片管理器初始化成功');
        } catch (error) {
            console.error('❌ 产品卡片管理器初始化失败:', error);
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
        console.log('🔄 更新产品卡片翻译...');

        // 更新所有产品卡片中的特性标签
        const featureTags = document.querySelectorAll('.feature-tag[data-i18n]');
        console.log(`找到 ${featureTags.length} 个特性标签`);

        featureTags.forEach(tag => {
            const key = tag.getAttribute('data-i18n');
            const i18n = window.i18nManager || window.i18n;
            if (key && i18n && i18n.t) {
                const translation = i18n.t(key);
                console.log(`翻译 ${key} → ${translation}`);

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

        // 更新产品按钮文本
        const detailButtons = document.querySelectorAll('.btn-details[data-i18n]');
        detailButtons.forEach(btn => {
            const key = btn.getAttribute('data-i18n');
            if (key && window.i18n && window.i18n.t) {
                btn.textContent = window.i18n.t(key);
            }
        });

        const inquiryButtons = document.querySelectorAll('.btn-inquiry[data-i18n]');
        inquiryButtons.forEach(btn => {
            const key = btn.getAttribute('data-i18n');
            if (key && window.i18n && window.i18n.t) {
                btn.textContent = window.i18n.t(key);
            }
        });

        console.log('✅ 产品卡片翻译更新完成');
    }

    /**
     * 加载公司信息
     */
    async loadCompanyInfo() {
        try {
            const response = await fetch('/data/company.json');
            this.companyInfo = await response.json();
        } catch (error) {
            console.warn('⚠️  加载公司信息失败，使用默认值');
            this.companyInfo = {
                contact: {
                    whatsapp: '8613656157230'
                }
            };
        }
    }

    /**
     * 获取国际化文本
     * @param {string} key - 国际化键
     * @param {string} defaultText - 默认文本
     * @returns {string} 国际化文本
     */
    getI18nText(key, defaultText) {
        if (window.i18nManager && window.i18nManager.t) {
            return window.i18nManager.t(key, defaultText);
        }
        return defaultText;
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
     * 获取产品特性标签
     * @param {Object} product - 产品对象
     * @returns {Array} 特性标签数组
     */
    getProductFeatures(product) {
        // 如果产品有预设的特性，进行国际化处理
        if (product.features) {
            const presetFeatures = Array.isArray(product.features) ?
                product.features.slice(0, 3) :
                product.features.split(',').slice(0, 3);

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

        // 品牌相关特性 - 使用国际化
        const brandFeatures = {
            'Garrett': this.getI18nText('product.features.original_quality', '原厂品质'),
            'Bosch': this.getI18nText('product.features.german_craft', '德国工艺'),
            'BorgWarner': this.getI18nText('product.features.borgwarner', '博格华纳'),
            'Continental': this.getI18nText('product.features.continental', '大陆集团'),
            'Delphi': this.getI18nText('product.features.delphi', '德尔福'),
            'Denso': this.getI18nText('product.features.denso', '电装'),
            'SKF': this.getI18nText('product.features.skf_bearing', 'SKF轴承'),
            'Pierburg': this.getI18nText('product.features.pierburg', '皮尔博格'),
            'Diamond-Auto': this.getI18nText('product.features.diamond_quality', '钻石品质')
        };

        if (product.brand && brandFeatures[product.brand]) {
            features.push(brandFeatures[product.brand]);
        }

        // 分类相关特性 - 使用国际化
        const categoryFeatures = {
            'turbocharger': this.getI18nText('product.features.high_performance', '高性能'),
            'actuator': this.getI18nText('product.features.precise_control', '精准控制'),
            'injector': this.getI18nText('product.features.precision_injection', '精密喷射'),
            'turbo-parts': this.getI18nText('product.features.complete_parts', '配件齐全'),
            'others': this.getI18nText('product.features.professional_tools', '专业工具')
        };

        if (product.category && categoryFeatures[product.category]) {
            features.push(categoryFeatures[product.category]);
        }

        // 价格和库存相关特性 - 使用国际化
        if (product.price && parseFloat(product.price) > 1000) {
            features.push(this.getI18nText('product.features.premium_product', '高端产品'));
        }
        if (product.stock && product.stock > 20) {
            features.push(this.getI18nText('product.features.in_stock', '现货充足'));
        }

        // 默认特性（如果没有其他特性）- 使用国际化
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
        const iconMap = {
            '原厂品质': 'certificate',
            '原厂正品': 'certificate',
            '德国工艺': 'cog',
            '高性能': 'rocket',
            '精准控制': 'crosshairs',
            '精密喷射': 'tint',
            '配件齐全': 'puzzle-piece',
            '专业工具': 'tools',
            '性能稳定': 'shield-alt',
            '质保1年': 'shield-check',
            '现货充足': 'warehouse',
            '高端产品': 'crown'
        };
        
        return iconMap[feature] || 'check';
    }

    /**
     * 获取产品标签
     * @param {Object} product - 产品对象
     * @returns {string} 标签类名
     */
    getProductBadge(product) {
        if (product.isNew === 'true' || product.isNew === true) {
            return 'new';
        }
        if (product.isHot === 'true' || product.isHot === true) {
            return 'hot';
        }
        if (product.isRecommend === 'true' || product.isRecommend === true) {
            return 'recommend';
        }
        if (product.badge) {
            return product.badge.toLowerCase();
        }
        return '';
    }

    /**
     * 获取标签文本
     * @param {string} badge - 标签类名
     * @returns {string} 标签文本
     */
    getBadgeText(badge) {
        const badgeTexts = {
            'new': '新品',
            'hot': '热门',
            'recommend': '推荐',
            'sale': '促销',
            'limited': '限量'
        };
        
        return badgeTexts[badge] || badge;
    }

    /**
     * 获取产品图片URL
     * @param {Object} product - 产品对象
     * @param {string} imagePath - 图片路径前缀
     * @returns {string} 图片URL
     */
    getProductImageUrl(product, imagePath = '') {
        // 如果有多张图片，使用第一张
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            const imageUrl = product.images[0];
            return imageUrl.startsWith('http') ? imageUrl : `${imagePath}${imageUrl}`;
        }
        
        // 如果有单张图片
        if (product.image) {
            return product.image.startsWith('http') ? product.image : `${imagePath}${product.image}`;
        }
        
        // 默认图片
        return `${imagePath}assets/images/logo/diamond-logo.png`;
    }

    /**
     * 生成展示型产品卡片（首页使用）
     * @param {Object} product - 产品对象
     * @param {Object} options - 渲染选项
     */
    createShowcaseCard(product, options = {}) {
        const { imagePath = '', isHomePage = false, hideButtons = false } = options;

        const productId = product.id || product._id || 'unknown';
        const brand = product.brand || this.getI18nText('product.unknown_brand', '未知品牌');
        const partNumber = product.model || product.part_number || product.partNumber || product.sku || 'N/A';
        const price = product.price || this.getI18nText('product.price_negotiable', '面议');
        const features = this.getProductFeatures(product);
        const badge = this.getProductBadge(product);
        const imageUrl = this.getProductImageUrl(product, imagePath);
        const buttonText = hideButtons ? '' : this.getI18nText('product.quick_inquiry', '立即询价');
        
        const baseUrl = isHomePage ? 'pages/' : '';
        const detailUrl = `${baseUrl}product-detail.html?id=${productId}`;

        return `
            <div class="product-card showcase-card" data-product-id="${productId}">
                ${badge ? `<div class="product-badge ${badge}" data-i18n="product.badges.${badge}">${this.getBadgeText(badge)}</div>` : ''}
                
                <div class="product-image-container">
                        <img src="${imageUrl}" 
                         alt="${product.name || product.title}" 
                             class="product-image"
                         loading="lazy"
                             onerror="this.src='${imagePath}assets/images/logo/diamond-logo.png'">
                </div>
                
                <div class="product-content">
                    <h3 class="product-title">${product.name || product.title}</h3>
                    <div class="product-details">
                        <p class="product-brand">
                            <strong data-i18n="product.brand">品牌:</strong> 
                            <span class="brand-name">${brand}</span>
                        </p>
                        <p class="product-part">
                            <strong data-i18n="product.part_number">零件号:</strong> 
                            <span class="part-number">${partNumber}</span>
                        </p>
                        <p class="product-price">
                            <strong data-i18n="product.price">价格:</strong> 
                            <span class="price-value">${price}</span>
                        </p>
                    </div>
                    
                    <div class="product-features">
                        ${features.map(feature => {
                            const featureKey = this.getFeatureI18nKey(feature);
                            return `
                                <span class="feature-tag" ${featureKey ? `data-i18n="${featureKey}"` : ''}>
                                    <i class="fas fa-${this.getFeatureIcon(feature)}"></i>
                                    <span class="feature-text">${feature}</span>
                                </span>
                            `;
                        }).join('')}
                    </div>
                    
                    ${!hideButtons ? `
                        <div class="product-actions">
                            <a href="${detailUrl}" class="btn btn-primary btn-details" data-i18n="product.view_details">${this.getI18nText('product.view_details', '查看详情')}</a>
                            <button class="btn btn-secondary btn-inquiry"
                                    onclick="quickInquiry('${productId}', '${product.name || product.title}')"
                                    data-i18n="product.quick_inquiry">
                                ${buttonText}
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * 生成推荐型产品卡片（产品页面使用）
     * @param {Object} product - 产品对象
     * @param {Object} options - 渲染选项
     */
    createRecommendCard(product, options = {}) {
        const { imagePath = '', isHomePage = false } = options;

        const productId = product.id || product._id || 'unknown';
        const brand = product.brand || '未知品牌';
        const partNumber = product.model || product.part_number || product.partNumber || product.sku || 'N/A';
        const price = product.price || '面议';
        const features = this.getProductFeatures(product);
        const badge = this.getProductBadge(product);
        const imageUrl = this.getProductImageUrl(product, imagePath);

        const baseUrl = isHomePage ? 'pages/' : '';
        const detailUrl = `${baseUrl}product-detail.html?id=${productId}`;

        return `
            <a href="${detailUrl}" class="related-product-card" data-product-id="${productId}" style="text-decoration: none; color: inherit; display: block;">
                ${badge ? `<div class="product-badge ${badge}" data-i18n="product.badges.${badge}">${this.getBadgeText(badge)}</div>` : ''}

                <div class="related-product-image-wrapper">
                    <img src="${imageUrl}"
                         alt="${product.name || product.title}"
                         class="related-product-image"
                         loading="lazy"
                         onerror="this.src='${imagePath}assets/images/logo/diamond-logo.png'">
                </div>

                <div class="related-product-info">
                    <h4 class="related-product-title">${product.name || product.title}</h4>
                    <p class="related-product-model">${partNumber}</p>
                </div>
            </a>
        `;
    }

    /**
     * 生成管理型产品卡片（管理后台使用）
     * @param {Object} product - 产品对象
     * @param {Object} options - 渲染选项
     * @returns {string} HTML字符串
     */
    createManageCard(product, options = {}) {
        const {
            imagePath = '',
            categories = []
        } = options;

        const imageUrl = this.getProductImageUrl(product, imagePath);
        const category = categories.find(cat => cat.id === product.category);
        
        // 生成标签徽章
        let tagBadges = '';
        if (product.isNew === 'true' || product.isNew === true) {
            tagBadges += '<span class="badge bg-success me-1">新品</span>';
        }
        if (product.isHot === 'true' || product.isHot === true) {
            tagBadges += '<span class="badge bg-danger me-1">热门</span>';
        }
        if (product.isRecommend === 'true' || product.isRecommend === true) {
            tagBadges += '<span class="badge bg-warning me-1">推荐</span>';
        }

        return `
            <div class="col-xl-2 col-lg-3 col-md-4 col-sm-6">
                <div class="product-card">
                    <div class="card-header p-2 d-flex justify-content-between align-items-center">
                        <input type="checkbox" class="form-check-input product-checkbox" 
                               value="${product.id}" onchange="toggleBatchActions()">
                        ${product.sku ? `<small class="text-primary fw-bold position-absolute" style="font-size: 10px; background: #e3f2fd; border-radius: 3px; padding: 1px 6px; white-space: nowrap; left: 50%; transform: translateX(-50%);">
                            ${product.sku}
                        </small>` : ''}
                        <span class="badge ${product.status === 'active' ? 'bg-success' : 'bg-secondary'}">
                            ${product.status === 'active' ? '在售' : '停售'}
                        </span>
                    </div>
                    <div class="product-image-container">
                        <img src="${imageUrl}" 
                             class="product-image" alt="${product.name}"
                             onerror="this.src='https://via.placeholder.com/150x150/e2e8f0/64748b?text=图片加载失败'">
                        ${tagBadges ? `<div class="position-absolute top-0 start-0 p-2">${tagBadges}</div>` : ''}
                    </div>
                    <div class="p-3">
                        <h6 class="mb-2 text-truncate" title="${product.name}">${product.name}</h6>
                        <div class="d-flex justify-content-between align-items-center mb-2 small text-muted">
                            <span class="text-truncate me-1" title="${product.model || '未设置型号'}">${product.model || '未设置型号'}</span>
                            <span class="text-truncate" title="${category ? category.name : '未分类'}">${category ? category.name : '未分类'}</span>
                        </div>
                        <div class="d-flex gap-1">
                            <button class="btn btn-outline-primary btn-sm flex-fill" onclick="editProduct('${product.id}')">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-info btn-sm flex-fill" onclick="duplicateProduct('${product.id}')">
                                <i class="bi bi-files"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm flex-fill" onclick="deleteProduct('${product.id}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染产品列表到指定容器
     * @param {Array} products - 产品数组
     * @param {HTMLElement} container - 容器元素
     * @param {string} cardType - 卡片类型
     * @param {Object} options - 渲染选项
     */
    renderProductList(products, container, cardType = 'showcase', options = {}) {
        if (!products || !Array.isArray(products) || products.length === 0) {
            container.innerHTML = `
                <div class="no-products">
                    <div class="no-products-icon">
                        <i class="fas fa-box-open"></i>
                    </div>
                    <h3 data-i18n="product.no_products">暂无产品</h3>
                    <p data-i18n="product.no_products_desc">当前分类下暂无产品，请稍后再试或联系我们获取更多信息。</p>
                </div>
            `;
            
            // 🌍 触发多语言处理
            if (window.i18nManager) {
                window.i18nManager.processElements(container);
            }
            return;
        }

        const cardHtml = products.map(product => {
        switch (cardType) {
            case 'recommend':
                    return this.createRecommendCard(product, options);
            case 'manage':
                    return this.createManageCard(product, options);
            default:
                    return this.createShowcaseCard(product, options);
        }
        }).join('');

        container.innerHTML = cardHtml;
        
        // 🌍 触发多语言处理
        if (window.i18nManager) {
            window.i18nManager.processElements(container);
        }
        
        console.log(`✅ 渲染了 ${products.length} 个产品卡片`);
    }

    /**
     * 渲染到网格容器（products.html使用）
     * @param {Array} products - 产品数组
     * @param {Object} options - 渲染选项
     */
    renderToGrid(products, options = {}) {
        const defaultOptions = {
            showButtons: true,
            showDescription: false,
            imagePath: '../',
            detailPath: 'product-detail.html',
            pageSize: this.getPageSize()
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
        this.renderProductList(pageProducts, '.products-grid', 'showcase', finalOptions);
        
        // 渲染分页按钮
        this.renderPagination(currentPage, totalPages);
        
        console.log(`✅ 网格渲染完成: 第${currentPage}页，共${totalPages}页，${pageProducts.length}个产品`);
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
     * 渲染分页按钮
     * @param {number} currentPage - 当前页码
     * @param {number} totalPages - 总页数
     */
    renderPagination(currentPage, totalPages) {
        const pagination = document.getElementById('pagination');
        if (!pagination || totalPages <= 1) {
            if (pagination) pagination.style.display = 'none';
            return;
        }
        
        pagination.style.display = 'flex';
        
        let buttons = [];
        
        // 添加上一页按钮
        buttons.push(`
            <a href="?page=${currentPage - 1}"
               class="pagination-button ${currentPage === 1 ? 'disabled' : ''}"
               ${currentPage === 1 ? 'onclick="return false;"' : ''}>
                <i class="fas fa-chevron-left"></i>
                <span data-i18n="pagination.previous">${this.getI18nText('pagination.previous', '上一页')}</span>
            </a>
        `);
        
        // 页码按钮逻辑
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // 调整起始页
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // 添加第一页（如果需要）
        if (startPage > 1) {
            buttons.push(`<a href="?page=1" class="pagination-button">1</a>`);
            if (startPage > 2) {
                buttons.push(`<span class="pagination-ellipsis">...</span>`);
            }
        }
        
        // 添加页码按钮
        for (let i = startPage; i <= endPage; i++) {
            buttons.push(`
                <a href="?page=${i}" 
                   class="pagination-button ${i === currentPage ? 'active' : ''}"
                   ${i === currentPage ? 'onclick="return false;"' : ''}>${i}</a>
            `);
        }
        
        // 添加最后一页（如果需要）
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                buttons.push(`<span class="pagination-ellipsis">...</span>`);
            }
            buttons.push(`<a href="?page=${totalPages}" class="pagination-button">${totalPages}</a>`);
        }
        
        // 添加下一页按钮
        buttons.push(`
            <a href="?page=${currentPage + 1}"
               class="pagination-button ${currentPage === totalPages ? 'disabled' : ''}"
               ${currentPage === totalPages ? 'onclick="return false;"' : ''}>
                <span data-i18n="pagination.next">${this.getI18nText('pagination.next', '下一页')}</span>
                <i class="fas fa-chevron-right"></i>
            </a>
        `);
        
        pagination.innerHTML = buttons.join('');

        // 🌍 触发多语言处理
        if (window.i18nManager) {
            window.i18nManager.processElements(pagination);
        }
    }

    /**
     * 清理缓存
     */
    clearCache() {
        this.cache.clear();
        console.log('✅ 产品卡片缓存已清理');
    }
}

// 创建全局实例
window.ProductCardManager = ProductCardManager;

// 兼容性：保持原有的ProductCardComponent接口
window.ProductCardComponent = ProductCardManager;

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductCardManager;
}

console.log('✅ 统一产品卡片管理器加载完成'); 