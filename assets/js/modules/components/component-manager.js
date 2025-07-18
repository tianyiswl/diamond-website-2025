/**
 * 统一组件管理器 - 整合页头页脚组件功能
 * 整合了原来分散在components.js和header-footer-components.js中的功能
 * 提供动态数据加载、多页面支持、表单处理等完整功能
 */
class ComponentManager {
    constructor() {
        this.categories = [];
        this.companyInfo = null;
        this.isLoaded = false;
        this.cache = new Map(); // 缓存机制
        
        // 初始化时自动加载数据
        this.init();
    }

    /**
     * 初始化组件管理器
     * @param {boolean} isHomePage - 是否为首页
     */
    async init(isHomePage = false) {
        try {
            console.log('🔄 正在初始化组件管理器...');
            
            // 并行加载数据以提升性能
            const [categoriesLoaded, companyLoaded] = await Promise.all([
                this.loadCategories(),
                this.loadCompanyInfo()
            ]);

            if (categoriesLoaded && companyLoaded) {
                console.log('✅ 组件管理器初始化完成');
            } else {
                console.warn('⚠️ 部分数据加载失败，使用默认配置');
            }

            // 🔧 自动渲染页头和页尾组件
            await this.autoRenderComponents(isHomePage);

            // 初始化页面特定功能
            this.initPageSpecificFeatures();

            // 🌍 监听语言切换事件，更新动态内容
            this.bindLanguageChangeListener();

            return true;
        } catch (error) {
            console.error('❌ 组件管理器初始化失败:', error);
            this.useDefaultData();
            return false;
        }
    }

    /**
     * 自动渲染页头和页尾组件
     * @param {boolean} isHomePage - 是否为首页
     */
    async autoRenderComponents(isHomePage = false) {
        try {
            // 渲染页头
            const headerContainer = document.getElementById('header-container');
            if (headerContainer) {
                await this.renderComponent('header', 'header-container', isHomePage);
            }

            // 渲染页尾
            const footerContainer = document.getElementById('footer-container');
            if (footerContainer) {
                await this.renderComponent('footer', 'footer-container', isHomePage);
            }

            console.log('✅ 页头页尾组件自动渲染完成');
        } catch (error) {
            console.error('❌ 自动渲染组件失败:', error);
        }
    }

    /**
     * 从后台API加载分类数据
     */
    async loadCategories() {
        try {
            // 检查缓存
            if (this.cache.has('categories')) {
                this.categories = this.cache.get('categories');
                this.isLoaded = true;
                console.log('📋 使用缓存的分类数据');
                return true;
            }

            const response = await fetch('/api/public/categories');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const categories = await response.json();
            
            // 确保数据格式正确
            if (Array.isArray(categories)) {
                // 添加"全部产品"选项
                this.categories = [
                    { id: 'all', name: '全部产品', count: 0 },
                    ...categories
                ];
                
                // 缓存数据
                this.cache.set('categories', this.categories);
                this.isLoaded = true;
                console.log('✅ 分类数据加载成功:', this.categories.length, '个分类');
                return true;
            } else {
                throw new Error('分类数据格式错误');
            }
        } catch (error) {
            console.error('❌ 加载分类数据失败:', error);
            this.useDefaultCategories();
            return false;
        }
    }

    /**
     * 加载公司信息
     */
    async loadCompanyInfo() {
        try {
            // 检查缓存
            if (this.cache.has('companyInfo')) {
                this.companyInfo = this.cache.get('companyInfo');
                console.log('🏢 使用缓存的公司信息');
                return true;
            }

            const response = await fetch('/data/company.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            this.companyInfo = await response.json();
            
            // 缓存数据
            this.cache.set('companyInfo', this.companyInfo);
            console.log('✅ 公司信息加载成功');
            return true;
        } catch (error) {
            console.error('❌ 加载公司信息失败:', error);
            this.useDefaultCompanyInfo();
            return false;
        }
    }

    /**
     * 使用默认分类数据 - 支持多语言翻译
     */
    useDefaultCategories() {
        // 使用翻译系统获取分类名称
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
            return fallbackMap[categoryId] || categoryId;
        };

        this.categories = [
            { id: 'all', name: getCategoryName('all'), count: 0 },
            { id: 'turbocharger', name: getCategoryName('turbocharger'), count: 0 },
            { id: 'actuator', name: getCategoryName('actuator'), count: 0 },
            { id: 'injector', name: getCategoryName('injector'), count: 0 },
            { id: 'turbo-parts', name: getCategoryName('turbo-parts'), count: 0 },
            { id: 'others', name: getCategoryName('others'), count: 0 }
        ];
        this.isLoaded = true;
        console.log('📋 使用默认分类数据（支持多语言）');
    }

    /**
     * 使用默认公司信息
     */
    useDefaultCompanyInfo() {
        this.companyInfo = {
            name: '无锡皇德国际贸易有限公司',
            description: '专业涡轮增压器和共轨喷油器配件供应商',
            phone: '+86-510-8888-8888',
            email: 'info@diamond-company.com',
            address: '江苏省无锡市'
        };
        console.log('🏢 使用默认公司信息');
    }

    /**
     * 使用默认数据
     */
    useDefaultData() {
        this.useDefaultCategories();
        this.useDefaultCompanyInfo();
    }

    /**
     * 生成页头下拉菜单的分类HTML
     * @param {boolean} isHomePage - 是否为首页
     */
    generateCategoryDropdown(isHomePage = false) {
        const baseUrl = isHomePage ? 'pages/' : '';
        
        if (!this.isLoaded || this.categories.length === 0) {
            return this.getDefaultCategoryDropdown(baseUrl);
        }

        return this.categories.map(category => {
            const href = category.id === 'all' ?
                `${baseUrl}products.html` :
                `${baseUrl}products.html?category=${category.id}`;
            // 🌍 添加多语种支持
            const i18nKey = `categories.${category.id}`;
            return `<a href="${href}" class="dropdown-item" data-category="${category.id}" data-i18n="${i18nKey}">${category.name}</a>`;
        }).join('');
    }

    /**
     * 获取默认分类下拉菜单
     */
    getDefaultCategoryDropdown(baseUrl) {
        return `
            <a href="${baseUrl}products.html" class="dropdown-item" data-category="all" data-i18n="categories.all">全部产品</a>
            <a href="${baseUrl}products.html?category=turbocharger" class="dropdown-item" data-category="turbocharger" data-i18n="categories.turbocharger">涡轮增压器</a>
            <a href="${baseUrl}products.html?category=actuator" class="dropdown-item" data-category="actuator" data-i18n="categories.actuator">执行器</a>
            <a href="${baseUrl}products.html?category=injector" class="dropdown-item" data-category="injector" data-i18n="categories.injector">共轨喷油器</a>
            <a href="${baseUrl}products.html?category=turbo-parts" class="dropdown-item" data-category="turbo-parts" data-i18n="categories.turbo-parts">涡轮配件</a>
        `;
    }

    /**
     * 生成页脚产品分类链接HTML
     * @param {boolean} isHomePage - 是否为首页
     */
    generateFooterCategoryLinks(isHomePage = false) {
        const baseUrl = isHomePage ? 'pages/' : '';
        
        if (!this.isLoaded || this.categories.length === 0) {
            return this.getDefaultFooterLinks(baseUrl);
        }

        return this.categories
            .filter(category => category.id !== 'all') // 排除"全部产品"
            .map(category => {
                // 🌍 添加多语种支持
                const i18nKey = `categories.${category.id}`;
                return `<li><a href="${baseUrl}products.html?category=${category.id}" data-i18n="${i18nKey}">${category.name}</a></li>`;
            }).join('');
    }

    /**
     * 获取默认页脚链接
     */
    getDefaultFooterLinks(baseUrl) {
        return `
            <li><a href="${baseUrl}products.html?category=turbocharger" data-i18n="categories.turbocharger">涡轮增压器</a></li>
            <li><a href="${baseUrl}products.html?category=actuator" data-i18n="categories.actuator">执行器</a></li>
            <li><a href="${baseUrl}products.html?category=injector" data-i18n="categories.injector">共轨喷油器</a></li>
            <li><a href="${baseUrl}products.html?category=turbo-parts" data-i18n="categories.turbo-parts">涡轮配件</a></li>
        `;
    }

    /**
     * 生成主页产品标签HTML
     * @param {boolean} isHomePage - 是否为首页
     */
    generateProductTags(isHomePage = true) {
        const baseUrl = isHomePage ? 'pages/' : '';
        
        if (!this.isLoaded || this.categories.length === 0) {
            return this.getDefaultProductTags(baseUrl);
        }

        return this.categories.map((category, index) => {
            const activeClass = index === 0 ? 'active' : '';
            const href = category.id === 'all' ?
                `${baseUrl}products.html` :
                `${baseUrl}products.html?category=${category.id}`;
            // 🌍 添加多语种支持
            const i18nKey = `categories.${category.id}`;
            return `<a href="${href}" class="tag-btn ${activeClass}" data-category="${category.id}" data-i18n="${i18nKey}">${category.name}</a>`;
        }).join('');
    }

    /**
     * 获取默认产品标签
     */
    getDefaultProductTags(baseUrl) {
        // 🌍 使用国际化系统获取标签名称
        const getTagName = (key) => {
            if (window.i18n && window.i18n.initialized) {
                return window.i18n.t(`categories.${key}`) || key;
            }
            // 回退到默认中文
            const fallback = {
                'all': '全部产品',
                'turbocharger': '涡轮增压器',
                'actuator': '执行器',
                'injector': '共轨喷油器',
                'turbo-parts': '涡轮配件'
            };
            return fallback[key] || key;
        };

        const defaultCategories = [
            { id: 'all', name: getTagName('all') },
            { id: 'turbocharger', name: getTagName('turbocharger') },
            { id: 'actuator', name: getTagName('actuator') },
            { id: 'injector', name: getTagName('injector') },
            { id: 'turbo-parts', name: getTagName('turbo-parts') }
        ];

        return defaultCategories.map((category, index) => {
            const activeClass = index === 0 ? 'active' : '';
            const href = category.id === 'all' ?
                `${baseUrl}products.html` :
                `${baseUrl}products.html?category=${category.id}`;
            return `<a href="${href}" class="tag-btn ${activeClass}" data-category="${category.id}" data-i18n="categories.${category.id}">${category.name}</a>`;
        }).join('');
    }

    /**
     * 获取公司名称
     */
    getCompanyName() {
        // 🌍 使用国际化系统获取公司名称
        if (window.i18n && window.i18n.initialized) {
            const translatedName = window.i18n.t('company.name');
            if (translatedName && translatedName !== 'company.name') {
                return translatedName;
            }
        }
        return this.companyInfo?.name || '无锡皇德国际贸易有限公司';
    }

    /**
     * 获取公司描述
     */
    getCompanyDescription() {
        // 🌍 使用国际化系统获取公司描述
        if (window.i18n && window.i18n.initialized) {
            const translatedDesc = window.i18n.t('company.description');
            if (translatedDesc && translatedDesc !== 'company.description') {
                return translatedDesc;
            }
        }
        return this.companyInfo?.description || '专业涡轮增压器和共轨喷油器配件供应商';
    }

    /**
     * 生成社交媒体图标HTML
     * @param {boolean} isHomePage - 是否为首页
     */
    generateSocialMediaIcons(isHomePage = false) {
        const social = this.companyInfo?.social || {};

        return `
            <div class="social-media-icons">
                <a href="${social.facebook || 'https://www.facebook.com/ariel.diamond.883219'}" target="_blank" class="social-icon facebook" data-i18n="social.facebook" data-i18n-attr="title" title="关注我们的Facebook">
                    <i class="fab fa-facebook-f"></i>
                </a>
                <a href="${social.instagram || 'https://www.instagram.com/diamond_auto_parts'}" target="_blank" class="social-icon instagram" data-i18n="social.instagram" data-i18n-attr="title" title="关注我们的Instagram">
                    <i class="fab fa-instagram"></i>
                </a>
                <a href="${social.whatsapp || 'https://wa.me/8613656157230'}" target="_blank" class="social-icon whatsapp" data-i18n="social.whatsapp" data-i18n-attr="title" title="WhatsApp联系我们">
                    <i class="fab fa-whatsapp"></i>
                </a>
            </div>
        `;
    }

    /**
     * 🔧 统一页头HTML生成方法（减少代码重复）
     */
    generateHeaderHTML(isHomePage = false) {
        const categoryDropdown = this.generateCategoryDropdown(isHomePage);
        const productTags = this.generateProductTags(isHomePage);
        const socialMediaIcons = this.generateSocialMediaIcons(isHomePage);

        // 根据页面类型设置路径和样式
        const logoPath = isHomePage ? 'assets/images/logo/diamond-logo.png' : '../assets/images/logo/diamond-logo.png';
        const brandHref = isHomePage ? '#home' : '../index.html';
        const homeHref = isHomePage ? '#home' : '../index.html';
        const homeClass = isHomePage ? 'nav-link active' : 'nav-link';
        const productsHref = isHomePage ? 'pages/products.html' : 'products.html';
        const contactHref = isHomePage ? '#contact' : '../index.html#contact';

        return `
            <!-- 页面加载动画 -->
            <div id="loading" class="loading-screen">
                <div class="loading-content">
                    <div class="loading-logo">
                        <img src="${logoPath}" alt="${this.getCompanyName()}" class="loading-logo-img">
                    </div>
                    <h2 class="loading-company-name" data-i18n="company.name">${this.getCompanyName()}</h2>
                    <p class="loading-subtitle" data-i18n="company.description">${this.getCompanyDescription()}</p>
                    <div class="spinner"></div>
                    <p class="loading-text" data-i18n="common.loading">正在加载中...</p>
                </div>
            </div>

            <!-- 顶部导航 -->
            <header class="header">
                <div class="nav-container">
                    <div class="nav-brand">
                        <a href="${brandHref}" style="display: flex; align-items: center; gap: 15px; text-decoration: none; color: inherit;">
                            <img src="${logoPath}" alt="${this.getCompanyName()}" class="logo" onerror="this.style.display='none'">
                            <span class="company-name" data-i18n="company.name">${this.getCompanyName()}</span>
                        </a>
                    </div>

                    <!-- 搜索框 -->
                    <div class="search-container">
                        <input type="text" id="searchInput" class="search-input" data-i18n="search.placeholder" data-i18n-attr="placeholder" placeholder="搜索产品型号、品牌..." />
                        <button class="search-btn" onclick="performSearch()">
                            <i class="fas fa-search"></i>
                        </button>
                        <div id="searchResults" class="search-results"></div>
                    </div>

                    <nav class="nav-menu">
                        <ul>
                            <li><a href="${homeHref}" class="${homeClass}" data-i18n="nav.home">首页</a></li>
                            <li class="nav-dropdown">
                                <a href="${productsHref}" class="nav-link" data-i18n="nav.products">产品展示 <i class="fas fa-chevron-down"></i></a>
                                <div class="dropdown-menu">
                                    ${categoryDropdown}
                                </div>
                            </li>
                            <li><a href="${contactHref}" class="nav-link" data-i18n="nav.contact">联系我们</a></li>
                        </ul>
                    </nav>

                    <!-- 🌍 语言切换器 -->
                    <div class="language-switcher">
                        <select class="language-select" id="headerLanguageSelect">
                            <option value="zh-CN">中文</option>
                            <option value="en-US">English</option>
                        </select>
                    </div>

                    <!-- 移动端菜单按钮 -->
                    <button class="mobile-menu-btn" onclick="toggleMobileMenu()">
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>

                <!-- 产品标签栏 -->
                <div class="product-tags-bar">
                    <div class="container">
                        <div class="product-tags-container">
                            <div class="product-tags" id="productTagsContainer">
                                ${productTags}
                            </div>
                            ${socialMediaIcons}
                        </div>
                    </div>
                </div>
            </header>
        `;
    }

    /**
     * 获取页头HTML（子页面版本）
     */
    getHeaderHTML() {
        return this.generateHeaderHTML(false);
    }

    /**
     * 获取首页专用页头HTML
     */
    getHomeHeaderHTML() {
        return this.generateHeaderHTML(true);
    }

    /**
     * 🔧 统一页脚HTML生成方法（减少代码重复）
     */
    generateFooterHTML(isHomePage = false) {
        const footerCategoryLinks = this.generateFooterCategoryLinks(isHomePage);
        const baseUrl = isHomePage ? 'pages/' : '';  // 修复：子页面间使用相对路径
        const homeUrl = isHomePage ? '#home' : '../index.html';
        const contactUrl = isHomePage ? '#contact' : '../index.html#contact';

        return `
            <!-- 🔗 页脚组件 -->
            <footer class="footer">
                <div class="footer-top">
                    <div class="container">
                        <div class="footer-grid">
                            <div class="footer-section">
                                <h4 data-i18n="footer.navigation">快速导航</h4>
                                <ul>
                                    <li><a href="${homeUrl}" data-i18n="nav.home">首页</a></li>
                                    <li><a href="${baseUrl}products.html" data-i18n="nav.products">产品展示</a></li>
                                    <li><a href="${contactUrl}" data-i18n="nav.contact">联系我们</a></li>
                                    <li><a href="${baseUrl}privacy.html" data-i18n="footer.links.privacy">隐私政策</a></li>
                                    <li><a href="${baseUrl}terms.html" data-i18n="footer.links.terms">使用条款</a></li>
                                </ul>
                            </div>

                            <div class="footer-section">
                                <h4 data-i18n="footer.products">主要产品</h4>
                                <ul ${isHomePage ? 'id="footerCategoryLinks"' : ''}>
                                    ${footerCategoryLinks}
                                </ul>
                            </div>

                            <div class="footer-section footer-contact">
                                <h4 data-i18n="nav.contact">联系我们</h4>
                                <div class="contact-info">
                                    <div class="contact-details">
                                        <p><strong data-i18n="contact.info.phone">电话:</strong> <a href="tel:${this.companyInfo?.contact?.phone || '+86 182 1757 6072'}">${this.companyInfo?.contact?.phone || '+86 182 1757 6072'}</a></p>
                                        <p><strong data-i18n="contact.info.wechat">微信:</strong> ${this.companyInfo?.contact?.whatsapp || '+86 182 1757 6072'}</p>
                                        <p><strong data-i18n="contact.info.whatsapp">WhatsApp:</strong> <a href="${this.companyInfo?.social?.whatsapp || 'https://wa.me/8618217576072'}">${this.companyInfo?.contact?.whatsapp || '+86 182 1757 6072'}</a></p>
                                        <p><strong data-i18n="contact.info.email">邮箱:</strong> <a href="mailto:${this.companyInfo?.contact?.email || 'ciki@diamond-auto.com'}">${this.companyInfo?.contact?.email || 'ciki@diamond-auto.com'}</a></p>
                                    </div>
                                </div>
                            </div>

                            <div class="footer-section footer-newsletter">
                                <h4 data-i18n="footer.quick_inquiry">快速询价</h4>
                                <form class="inquiry-form" id="footerInquiryForm" method="POST" action="javascript:void(0)" onsubmit="return false;">
                                    <input type="text" id="footerName" name="name" data-i18n="contact.fields.name" data-i18n-attr="placeholder" placeholder="您的姓名 *" required
                                           pattern="^[a-zA-Z\u4e00-\u9fa5\s\-\.]{2,30}$"
                                           data-error="请输入2-30个字符的有效姓名，支持中英文、空格、连字符">
                                    <input type="email" id="footerEmail" name="email" data-i18n="contact.fields.email" data-i18n-attr="placeholder" placeholder="邮箱地址 *" required
                                           pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                                           data-error="请输入有效的邮箱地址">
                                    <input type="tel" id="footerPhone" name="phone" data-i18n="contact.fields.phone" data-i18n-attr="placeholder" placeholder="联系电话"
                                           pattern="^1[3-9]\d{9}$|^(\+\d{1,4})?[\s-]?\d{1,4}[\s-]?\d{4,10}$"
                                           data-error="请输入有效的电话号码">
                                    <button type="submit" class="btn-submit">
                                        <i class="fas fa-paper-plane"></i>
                                        <span data-i18n="footer.submit">快速询价</span>
                                    </button>
                                </form>
                                <div id="footerFormFeedback" class="form-feedback"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="footer-bottom">
                    <div class="container">
                        <div class="footer-bottom-content">
                            <div class="copyright">
                                © ${new Date().getFullYear()} <span data-i18n="footer.company">无锡皇德国际贸易有限公司</span> <span data-i18n="footer.copyright">版权所有</span>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            <!-- 📱 返回顶部按钮 -->
            <button id="backToTop" class="back-to-top" title="返回顶部"></button>

            <!-- 📞 悬浮联系按钮 -->
            <div class="floating-contact">
                <a href="${this.companyInfo?.social?.whatsapp || 'https://wa.me/8618217576072'}" class="floating-whatsapp" target="_blank" title="WhatsApp咨询">
                    <i class="fab fa-whatsapp"></i>
                </a>
                <a href="tel:${this.companyInfo?.contact?.phone || '+86 182 1757 6072'}" class="floating-phone" title="拨打电话">
                    <i class="fa fa-phone"></i>
                </a>
            </div>
        `;
    }

    /**
     * 获取页脚HTML（子页面版本）
     */
    getFooterHTML() {
        return this.generateFooterHTML(false);
    }

    /**
     * 获取首页专用页脚HTML
     */
    getHomeFooterHTML() {
        return this.generateFooterHTML(true);
    }

    /**
     * 渲染组件到指定容器
     * @param {string} componentName - 组件名称 ('header', 'footer')
     * @param {string} containerId - 容器ID
     * @param {boolean} isHomePage - 是否为首页
     */
    async renderComponent(componentName, containerId, isHomePage = false) {
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`❌ 找不到容器: ${containerId}`);
                return false;
            }

            let html = '';
            switch (componentName) {
                case 'header':
                    html = isHomePage ? this.getHomeHeaderHTML() : this.getHeaderHTML();
                    break;
                case 'footer':
                    html = isHomePage ? this.getHomeFooterHTML() : this.getFooterHTML();
                    break;
                default:
                    console.error(`❌ 未知组件: ${componentName}`);
                    return false;
            }

            container.innerHTML = html;
            
            // 渲染后初始化功能
            if (componentName === 'footer') {
                this.initFooterInquiryForm();
            }
            
            // 🌍 触发多语言处理
            if (window.i18n && window.i18n.processElements) {
                window.i18n.processElements(container);
            } else if (window.i18nManager && window.i18nManager.processElements) {
                // 兼容性支持
                window.i18nManager.processElements(container);
            }
            
            console.log(`✅ ${componentName} 组件渲染完成`);
            return true;
        } catch (error) {
            console.error(`❌ 渲染 ${componentName} 组件失败:`, error);
            return false;
        }
    }

    /**
     * 更新分类相关内容
     * @param {boolean} isHomePage - 是否为首页
     */
    async updateCategoryContent(isHomePage = false) {
        try {
            // 重新加载分类数据
            await this.loadCategories();
            
            // 更新页头下拉菜单
            const dropdownMenu = document.querySelector('.dropdown-menu');
            if (dropdownMenu) {
                dropdownMenu.innerHTML = this.generateCategoryDropdown(isHomePage);
            }
            
            // 更新产品标签
            const productTagsContainer = document.getElementById('productTagsContainer');
            if (productTagsContainer) {
                productTagsContainer.innerHTML = this.generateProductTags(isHomePage);
            }
            
            console.log('✅ 分类内容更新完成');
            return true;
        } catch (error) {
            console.error('❌ 更新分类内容失败:', error);
            return false;
        }
    }

    /**
     * 初始化页面特定功能
     */
    initPageSpecificFeatures() {
        // 隐藏加载屏幕
        this.hideLoadingScreen();

        // 初始化页脚表单
        this.initFooterInquiryForm();

        // 🌍 初始化语言选择器
        this.initLanguageSwitcher();

        // 🔝 初始化返回顶部按钮
        this.initBackToTopButton();

        // 如果是首页，初始化首页特定功能
        if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
            this.initHomePageFeatures();
        }
    }

    /**
     * 初始化页脚询价表单
     */
    initFooterInquiryForm() {
        const form = document.getElementById('footerInquiryForm');
        if (form) {
            // 检查是否已经绑定过事件，防止重复绑定
            if (!form.hasAttribute('data-event-bound')) {
                // 移除旧的事件监听器
                form.removeEventListener('submit', this.handleFooterFormSubmit);
                // 添加新的事件监听器
                form.addEventListener('submit', this.handleFooterFormSubmit.bind(this));
                form.setAttribute('data-event-bound', 'true');
                console.log('✅ 页脚询价表单初始化完成');
            } else {
                console.log('⚠️  页脚询价表单事件已经绑定过，跳过重复绑定');
            }
        } else {
            console.warn('⚠️  未找到页脚询价表单');
        }
    }

    /**
     * 手动初始化页脚表单（备用方法）
     */
    manualInitFooterForm() {
        setTimeout(() => {
            this.initFooterInquiryForm();
        }, 1000);
    }

    /**
     * 🔝 初始化返回顶部按钮
     */
    initBackToTopButton() {
        const backToTopBtn = document.getElementById('backToTop');

        if (backToTopBtn) {
            // 滚动事件监听器
            const scrollHandler = () => {
                if (window.pageYOffset > 300) {
                    backToTopBtn.classList.add('visible');
                } else {
                    backToTopBtn.classList.remove('visible');
                }
            };

            // 点击事件监听器
            const clickHandler = () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            };

            // 移除旧的事件监听器（避免重复绑定）
            window.removeEventListener('scroll', scrollHandler);
            backToTopBtn.removeEventListener('click', clickHandler);

            // 添加新的事件监听器
            window.addEventListener('scroll', scrollHandler);
            backToTopBtn.addEventListener('click', clickHandler);

            console.log('✅ 返回顶部按钮已初始化');
        } else {
            console.warn('⚠️ 未找到返回顶部按钮，将在1秒后重试');
            setTimeout(() => {
                this.initBackToTopButton();
            }, 1000);
        }
    }

    /**
     * 页脚表单提交处理
     * @param {Event} event - 提交事件
     */
    async handleFooterFormSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitBtn = form.querySelector('.btn-submit');
        const originalText = submitBtn.innerHTML;
        
        try {
            // 验证表单
            if (!this.validateFooterForm(form)) {
                return;
            }
            
            // 显示加载状态
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 发送中...';
            submitBtn.disabled = true;
            
            // 收集表单数据
            const formData = new FormData(form);
            const inquiryData = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone') || '',
                message: `页尾快速询价 - 姓名：${formData.get('name')}，电话：${formData.get('phone') || '未提供'}`, // 自动生成消息
                source: 'footer_form',
                timestamp: new Date().toISOString()
            };
            
            // 发送到后台
            const response = await fetch('/api/inquiries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(inquiryData)
            });
            
            if (response.ok) {
                // 成功提交
                this.showFooterMessage('📧 询价信息发送成功！我们将在24小时内回复您。', 'success');
                form.reset();

                // 页脚快速询价完成后不需要任何后续动作
                console.log('📋 页尾快速询价完成，无需跳转WhatsApp');
            } else {
                throw new Error('服务器响应错误');
            }
            
        } catch (error) {
            console.error('❌ 提交询价失败:', error);
            this.showFooterMessage('发送失败，请稍后重试或直接联系我们。', 'error');
        } finally {
            // 恢复按钮状态
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    /**
     * 验证页脚表单
     * @param {HTMLFormElement} form - 表单元素
     */
    validateFooterForm(form) {
        let isValid = true;
        
        // 清除之前的错误样式
        form.querySelectorAll('input, textarea').forEach(field => {
            field.classList.remove('error');
            field.style.borderColor = '';
        });
        
        // 验证姓名
        const name = form.querySelector('[name="name"]');
        if (!name.value.trim()) {
            this.showFieldError(name, '请输入您的姓名');
            isValid = false;
        } else if (name.value.trim().length < 2) {
            this.showFieldError(name, '姓名至少需要2个字符');
            isValid = false;
        }
        
        // 验证邮箱
        const email = form.querySelector('[name="email"]');
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.value.trim()) {
            this.showFieldError(email, '请输入邮箱地址');
            isValid = false;
        } else if (!emailPattern.test(email.value)) {
            this.showFieldError(email, '请输入有效的邮箱地址');
            isValid = false;
        }
        
        // 验证电话（可选）
        const phone = form.querySelector('[name="phone"]');
        if (phone && phone.value.trim()) {
            const phonePattern = /^[\d\s\-\+\(\)]+$/;
            if (!phonePattern.test(phone.value)) {
                this.showFieldError(phone, '请输入有效的电话号码');
                isValid = false;
            }
        }
        
        return isValid;
    }

    /**
     * 显示字段错误信息
     * @param {HTMLElement} field - 字段元素
     * @param {string} message - 错误信息
     */
    showFieldError(field, message) {
        // 添加错误样式
        field.classList.add('error');
        field.style.borderColor = '#dc3545';
        
        // 显示提示信息
        field.title = message;
        
        // 使用内置的HTML5验证消息
        field.setCustomValidity(message);
        field.reportValidity();
    }

    /**
     * 清除字段错误信息
     * @param {HTMLElement} field - 字段元素
     */
    clearFieldError(field) {
        field.classList.remove('error');
        field.style.borderColor = '';
        field.title = '';
        field.setCustomValidity('');
    }

    /**
     * 显示页脚消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 ('success', 'error', 'info')
     */
    showFooterMessage(message, type = 'info') {
        // 首先尝试使用页脚模板中的反馈容器
        const feedbackDiv = document.getElementById('footerFormFeedback');
        if (feedbackDiv) {
            // 使用页脚模板的反馈容器，添加更明确的样式
            const alertClass = type === 'success' ? 'alert-success' : type === 'error' ? 'alert-danger' : 'alert-info';
            feedbackDiv.innerHTML = `
                <div class="alert ${alertClass}" style="
                    margin-top: 15px;
                    padding: 12px 16px;
                    border-radius: 8px;
                    background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
                    color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
                    border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
                    font-size: 14px;
                    line-height: 1.4;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    animation: slideInDown 0.3s ease;
                ">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}" style="font-size: 16px;"></i>
                    <span>${message}</span>
                </div>
            `;

            // 确保容器可见
            feedbackDiv.style.display = 'block';
            feedbackDiv.style.visibility = 'visible';
            feedbackDiv.style.opacity = '1';

            // 添加CSS动画（如果不存在）
            if (!document.querySelector('#footer-message-animations')) {
                const style = document.createElement('style');
                style.id = 'footer-message-animations';
                style.textContent = `
                    @keyframes slideInDown {
                        from { opacity: 0; transform: translateY(-20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `;
                document.head.appendChild(style);
            }

            // 3秒后自动隐藏
            setTimeout(() => {
                feedbackDiv.style.opacity = '0';
                setTimeout(() => {
                    feedbackDiv.style.display = 'none';
                    feedbackDiv.innerHTML = '';
                    feedbackDiv.style.opacity = '1';
                }, 300);
            }, 3000);

            console.log(`✅ 页脚消息显示成功: ${message}`);
        } else {
            // 备用方案：创建临时消息元素
            console.warn('⚠️  未找到footerFormFeedback容器，使用备用方案');
            const messageEl = document.createElement('div');
            messageEl.className = `footer-message footer-message-${type}`;
            messageEl.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
                padding: 15px 20px;
                border-radius: 8px;
                background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
                color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
                border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                font-family: 'Microsoft YaHei', sans-serif;
            `;
            messageEl.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                ${message}
            `;

            document.body.appendChild(messageEl);

            // 3秒后自动移除
            setTimeout(() => {
                messageEl.remove();
            }, 3000);
        }
    }

    /**
     * 发送WhatsApp询价信息
     * @param {Object} formData - 表单数据
     */
    sendFooterWhatsAppInquiry(formData) {
        try {
            // 页脚快速询价发送成功后不自动跳转WhatsApp
            // 只记录询价信息，不弹出确认对话框
            console.log('📋 页尾快速询价信息已记录（component-manager），不自动跳转WhatsApp');

            const message = `
新的询价信息：
姓名：${formData.name}
邮箱：${formData.email}
电话：${formData.phone || '未提供'}
询价内容：${formData.message}
时间：${new Date().toLocaleString('zh-CN')}
来源：页脚表单
            `.trim();

            // 只记录消息内容，不跳转
            console.log('📱 WhatsApp消息内容（仅记录）:', message);

        } catch (error) {
            console.error('❌ 处理WhatsApp消息时出错:', error);
        }
    }

    /**
     * 隐藏加载屏幕
     */
    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 300);
            }
        }, 500);
    }

    /**
     * 初始化首页特定功能
     */
    initHomePageFeatures() {
        console.log('🏠 初始化首页特定功能');
        // 这里可以添加首页特有的功能初始化
        // 例如：轮播图、产品过滤等
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ 缓存已清除');
    }

    /**
     * 获取缓存信息
     */
    getCacheInfo() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }

    /**
     * 🌍 初始化语言选择器
     */
    initLanguageSwitcher() {
        // 等待DOM更新后再绑定事件
        setTimeout(() => {
            const languageSelect = document.getElementById('headerLanguageSelect');
            if (languageSelect) {
                // 检查是否已经绑定过事件，防止重复绑定
                if (!languageSelect.hasAttribute('data-event-bound')) {
                    // 设置当前语言
                    if (window.i18n && window.i18n.currentLanguage) {
                        languageSelect.value = window.i18n.currentLanguage;
                    }

                    // 绑定语言切换事件
                    languageSelect.addEventListener('change', (e) => {
                        const selectedLang = e.target.value;
                        console.log(`🌍 用户选择语言: ${selectedLang}`);

                        if (window.i18n && typeof window.i18n.switchLanguage === 'function') {
                            window.i18n.switchLanguage(selectedLang);
                        } else {
                            console.warn('⚠️  i18n管理器未找到，尝试页面跳转');
                            // 备用方案：通过URL参数切换语言
                            const url = new URL(window.location);
                            url.searchParams.set('lang', selectedLang);
                            window.location.href = url.toString();
                        }
                    });

                    languageSelect.setAttribute('data-event-bound', 'true');
                    console.log('✅ 语言选择器事件绑定成功');
                } else {
                    console.log('⚠️  语言选择器事件已经绑定过，跳过重复绑定');
                }
            } else {
                console.warn('⚠️  未找到语言选择器元素');
            }
        }, 100);
    }

    /**
     * 🌍 绑定语言切换监听器
     */
    bindLanguageChangeListener() {
        document.addEventListener('i18n:changed', (event) => {
            console.log('🌍 检测到语言切换，更新动态内容...');
            this.updateDynamicI18nContent();
        });
    }

    /**
     * 🌍 更新动态生成的多语言内容
     */
    updateDynamicI18nContent() {
        try {
            // 检测当前页面类型
            const isHomePage = window.location.pathname === '/' ||
                              window.location.pathname.endsWith('index.html') ||
                              window.location.pathname === '/diamond-website-new/' ||
                              window.location.pathname === '/diamond-website-new/index.html';

            // 更新页头下拉菜单
            const dropdownMenu = document.querySelector('.dropdown-menu');
            if (dropdownMenu) {
                dropdownMenu.innerHTML = this.generateCategoryDropdown(isHomePage);
                // 重新处理新生成内容的多语言
                if (window.i18n && window.i18n.processElements) {
                    window.i18n.processElements(dropdownMenu);
                }
            }

            // 更新产品标签
            const productTagsContainer = document.getElementById('productTagsContainer');
            if (productTagsContainer) {
                productTagsContainer.innerHTML = this.generateProductTags(isHomePage);
                // 重新处理新生成内容的多语言
                if (window.i18n && window.i18n.processElements) {
                    window.i18n.processElements(productTagsContainer);
                }
            }

            // 更新页脚分类链接
            const footerCategoryLinks = document.getElementById('footerCategoryLinks');
            if (footerCategoryLinks) {
                footerCategoryLinks.innerHTML = this.generateFooterCategoryLinks(isHomePage);
                // 重新处理新生成内容的多语言
                if (window.i18n && window.i18n.processElements) {
                    window.i18n.processElements(footerCategoryLinks);
                }
            }

            console.log('✅ 动态内容多语言更新完成');
        } catch (error) {
            console.error('❌ 更新动态多语言内容失败:', error);
        }
    }
}

// 导出组件管理器类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentManager;
} else if (typeof window !== 'undefined') {
    window.ComponentManager = ComponentManager;
    
    // 创建全局组件管理器实例
    window.componentManager = new ComponentManager();
    
    // 🚫 已移除重复的DOMContentLoaded监听器
    // 现在使用统一的页面加载管理器处理组件初始化

    // 使用统一页面加载管理器初始化组件
    if (window.PageLoadManager) {
        window.PageLoadManager.addToQueue('component-manager-init', async function() {
            const isHomePage = window.location.pathname === '/' ||
                              window.location.pathname.endsWith('index.html') ||
                              window.location.pathname === '/diamond-website-new/' ||
                              window.location.pathname === '/diamond-website-new/index.html';

            console.log('🚀 统一组件管理器 - 开始初始化...');

            if (window.componentManager) {
                await window.componentManager.init(isHomePage);

                // 触发分类加载完成事件
                const event = new CustomEvent('categoriesLoaded', {
                    detail: {
                        categories: window.componentManager.categories,
                        isHomePage: isHomePage
                    }
                });
                document.dispatchEvent(event);

                console.log('✅ 统一组件管理器 - 初始化完成');
                window.PageLoadManager.setState('componentsLoaded', true);
            }
        }, ['domReady']);
    } else {
        // 备用方案：延迟执行直到页面加载管理器可用
        setTimeout(function() {
            if (window.PageLoadManager) {
                window.PageLoadManager.initComponentManager();
            } else {
                console.warn('⚠️ 页面加载管理器未找到，使用传统初始化方式');
                // 传统的DOMContentLoaded方式作为最后备用
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', async function() {
                        const isHomePage = window.location.pathname === '/' ||
                                          window.location.pathname.endsWith('index.html');

                        if (window.componentManager) {
                            await window.componentManager.init(isHomePage);
                        }
                    });
                }
            }
        }, 100);
    }
}