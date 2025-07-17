/**
 * 高级版ComponentManager - 兼容旧代码
 * 实际功能已迁移到 modules/components/component-manager.js
 * 此文件保留用于向后兼容，建议使用新的统一ComponentManager
 */

// 引入统一的ComponentManager（如果可用）
if (typeof window !== 'undefined' && window.ComponentManager) {
    // 使用新的统一ComponentManager
    console.log('🔄 使用统一的ComponentManager（高级版兼容）');
} else {
    console.warn('⚠️ 统一ComponentManager未加载，使用备用高级版本');
}

// 备用ComponentManager类（高级版）
class ComponentManager {
    constructor() {
        this.categories = [];
        this.companyInfo = null;
        this.isLoaded = false;
        console.log('⚠️ 使用备用高级ComponentManager，建议升级到统一版本');
    }

    // 从后台API加载分类数据
    async loadCategories() {
        try {
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
                this.isLoaded = true;
                console.log('✅ 分类数据加载成功:', this.categories.length, '个分类');
                return true;
            } else {
                throw new Error('分类数据格式错误');
            }
        } catch (error) {
            console.error('❌ 加载分类数据失败:', error);
            
            // 使用备用分类数据
            this.categories = [
                { id: 'all', name: '全部产品', count: 0 },
                { id: 'turbocharger', name: '涡轮增压器', count: 0 },
                { id: 'actuator', name: '执行器', count: 0 },
                { id: 'injector', name: '共轨喷油器', count: 0 },
                { id: 'turbo-parts', name: '涡轮配件', count: 0 },
                { id: 'others', name: '其他', count: 0 }
            ];
            this.isLoaded = true;
            return false;
        }
    }

    // 🆕 使用统一公司信息服务加载
    async loadCompanyInfo() {
        try {
            // 使用新的统一服务
            await window.companyService.loadCompanyInfo();
            
            // 获取公司信息数据
            this.companyInfo = window.companyService.getCompanyInfo();
            
            console.log('✅ 公司信息已通过统一服务加载 (ComponentManager)');
            return true;
        } catch (error) {
            console.error('❌ 加载公司信息失败 (ComponentManager):', error);
            
            // 即使出错，统一服务也会提供默认值
            this.companyInfo = window.companyService.getCompanyInfo();
            return false;
        }
    }

    // 生成页头下拉菜单的分类HTML
    generateCategoryDropdown(isHomePage = false) {
        const baseUrl = isHomePage ? 'pages/' : '';
        
        if (!this.isLoaded || this.categories.length === 0) {
            return `
                <a href="${baseUrl}products.html" class="dropdown-item" data-category="all">全部产品</a>
                <a href="${baseUrl}products.html?category=turbocharger" class="dropdown-item" data-category="turbocharger">涡轮增压器</a>
                <a href="${baseUrl}products.html?category=actuator" class="dropdown-item" data-category="actuator">执行器</a>
                <a href="${baseUrl}products.html?category=injector" class="dropdown-item" data-category="injector">共轨喷油器</a>
                <a href="${baseUrl}products.html?category=parts" class="dropdown-item" data-category="parts">配件套件</a>
            `;
        }

        return this.categories.map(category => {
            const href = category.id === 'all' ? `${baseUrl}products.html` : `${baseUrl}products.html?category=${category.id}`;
            return `<a href="${href}" class="dropdown-item" data-category="${category.id}">${category.name}</a>`;
        }).join('');
    }

    // 生成页脚产品分类链接HTML
    generateFooterCategoryLinks(isHomePage = false) {
        const baseUrl = isHomePage ? 'pages/' : '';
        
        if (!this.isLoaded || this.categories.length === 0) {
            return `
                <li><a href="${baseUrl}products.html?category=turbocharger">涡轮增压器</a></li>
                <li><a href="${baseUrl}products.html?category=actuator">执行器</a></li>
                <li><a href="${baseUrl}products.html?category=injector">共轨喷油器</a></li>
                <li><a href="${baseUrl}products.html?category=turbo-parts">涡轮配件</a></li>
            `;
        }

        return this.categories
            .filter(category => category.id !== 'all') // 排除"全部产品"
            .map(category => {
                return `<li><a href="${baseUrl}products.html?category=${category.id}">${category.name}</a></li>`;
            }).join('');
    }

    // 生成主页产品标签HTML
    generateProductTags(isHomePage = true) {
        const baseUrl = isHomePage ? 'pages/' : '';
        
        if (!this.isLoaded || this.categories.length === 0) {
            // 默认分类数据
            const defaultCategories = [
                { id: 'all', name: '全部产品' },
                { id: 'turbocharger', name: '涡轮增压器' },
                { id: 'actuator', name: '执行器' },
                { id: 'injector', name: '共轨喷油器' },
                { id: 'turbo-parts', name: '涡轮配件' }
            ];
            
            return defaultCategories.map((category, index) => {
                const activeClass = index === 0 ? 'active' : '';
                const href = category.id === 'all' ? `${baseUrl}products.html` : `${baseUrl}products.html?category=${category.id}`;
                return `<a href="${href}" class="tag-btn ${activeClass}" data-category="${category.id}">${category.name}</a>`;
            }).join('');
        }

        return this.categories.map((category, index) => {
            const activeClass = index === 0 ? 'active' : '';
            const href = category.id === 'all' ? `${baseUrl}products.html` : `${baseUrl}products.html?category=${category.id}`;
            return `<a href="${href}" class="tag-btn ${activeClass}" data-category="${category.id}">${category.name}</a>`;
        }).join('');
    }

    // 获取页头HTML（子页面版本，也包含产品标签栏）
    getHeaderHTML() {
        const categoryDropdown = this.generateCategoryDropdown(false);
        const productTags = this.generateProductTags(false); // 子页面版本
        
        return `
            <!-- 页面加载动画 -->
            <div id="loading" class="loading-screen">
                <div class="loading-content">
                    <div class="loading-logo">
                        <img src="../assets/images/logo/diamond-logo.png" alt="${this.companyInfo?.name || '无锡皇德国际贸易有限公司'}" class="loading-logo-img">
                    </div>
                    <h2 class="loading-company-name">${this.companyInfo?.name || '无锡皇德国际贸易有限公司'}</h2>
                    <p class="loading-subtitle">${this.companyInfo?.description || '专业涡轮增压器和共轨喷油器配件供应商'}</p>
                    <div class="spinner"></div>
                    <p class="loading-text">正在加载中...</p>
                </div>
            </div>

            <!-- 顶部导航 -->
            <header class="header">
                <div class="nav-container">
                    <div class="nav-brand">
                        <a href="../index.html" style="display: flex; align-items: center; gap: 15px; text-decoration: none; color: inherit;">
                            <img src="../assets/images/logo/diamond-logo.png" alt="${this.companyInfo?.name || '无锡皇德国际贸易有限公司'}" class="logo" onerror="this.style.display='none'">
                            <span class="company-name">${this.companyInfo?.name || '无锡皇德国际贸易有限公司'}</span>
                        </a>
                    </div>
                    
                    <!-- 搜索框 -->
                    <div class="search-container">
                        <input type="text" id="searchInput" class="search-input" placeholder="搜索产品型号、品牌..." />
                        <button class="search-btn" onclick="performSearch()">
                            <i class="fas fa-search"></i>
                        </button>
                        <div id="searchResults" class="search-results"></div>
                    </div>
                    
                    <nav class="nav-menu">
                        <ul>
                            <li><a href="../index.html" class="nav-link" data-i18n="nav.home">首页</a></li>
                            <li class="nav-dropdown">
                                <a href="products.html" class="nav-link" data-i18n="nav.products">产品展示 <i class="fas fa-chevron-down"></i></a>
                                <div class="dropdown-menu">
                                    ${categoryDropdown}
                                </div>
                            </li>
                            <li><a href="../index.html#contact" class="nav-link" data-i18n="nav.contact">联系我们</a></li>
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
                            <div class="social-media-icons">
                                <a href="https://www.facebook.com/ariel.diamond.883219" target="_blank" class="social-icon facebook" data-i18n="social.facebook" data-i18n-attr="title" title="关注我们的Facebook">
                                    <i class="fab fa-facebook"></i>
                                </a>
                                <a href="https://www.instagram.com/diamondautopart01/" target="_blank" class="social-icon instagram" data-i18n="social.instagram" data-i18n-attr="title" title="关注我们的Instagram">
                                    <i class="fab fa-instagram"></i>
                                </a>
                                <a href="https://wa.me/8613656157230" target="_blank" class="social-icon whatsapp" data-i18n="social.whatsapp" data-i18n-attr="title" title="WhatsApp联系我们">
                                    <i class="fab fa-whatsapp"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        `;
    }

    // 获取首页专用页头HTML
    getHomeHeaderHTML() {
        const categoryDropdown = this.generateCategoryDropdown(true);
        const productTags = this.generateProductTags(true); // 首页版本
        
        return `
            <!-- 页面加载动画 -->
            <div id="loading" class="loading-screen">
                <div class="loading-content">
                    <div class="loading-logo">
                        <img src="assets/images/logo/diamond-logo.png" alt="${this.companyInfo?.name || '无锡皇德国际贸易有限公司'}" class="loading-logo-img">
                    </div>
                    <h2 class="loading-company-name">${this.companyInfo?.name || '无锡皇德国际贸易有限公司'}</h2>
                    <p class="loading-subtitle">${this.companyInfo?.description || '专业涡轮增压器和共轨喷油器配件供应商'}</p>
                    <div class="spinner"></div>
                    <p class="loading-text">正在加载中...</p>
                </div>
            </div>

            <!-- 顶部导航 -->
            <header class="header">
                <div class="nav-container">
                    <div class="nav-brand">
                        <a href="index.html" style="display: flex; align-items: center; gap: 15px; text-decoration: none; color: inherit;">
                            <img src="assets/images/logo/diamond-logo.png" alt="${this.companyInfo?.name || '无锡皇德国际贸易有限公司'}" class="logo" onerror="this.style.display='none'">
                            <span class="company-name">${this.companyInfo?.name || '无锡皇德国际贸易有限公司'}</span>
                        </a>
                    </div>
                    
                    <!-- 搜索框 -->
                    <div class="search-container">
                        <input type="text" id="searchInput" class="search-input" placeholder="搜索产品型号、品牌..." />
                        <button class="search-btn" onclick="performSearch()">
                            <i class="fas fa-search"></i>
                        </button>
                        <div id="searchResults" class="search-results"></div>
                    </div>
                    
                    <nav class="nav-menu">
                        <ul>
                            <li><a href="index.html" class="nav-link" data-i18n="nav.home">首页</a></li>
                            <li class="nav-dropdown">
                                <a href="pages/products.html" class="nav-link" data-i18n="nav.products">产品展示 <i class="fas fa-chevron-down"></i></a>
                                <div class="dropdown-menu">
                                    ${categoryDropdown}
                                </div>
                            </li>
                            <li><a href="#contact" class="nav-link" data-i18n="nav.contact">联系我们</a></li>
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
                            <div class="social-media-icons">
                                <a href="https://www.facebook.com/ariel.diamond.883219" target="_blank" class="social-icon facebook" data-i18n="social.facebook" data-i18n-attr="title" title="关注我们的Facebook">
                                    <i class="fab fa-facebook"></i>
                                </a>
                                <a href="https://www.instagram.com/diamondautopart01/" target="_blank" class="social-icon instagram" data-i18n="social.instagram" data-i18n-attr="title" title="关注我们的Instagram">
                                    <i class="fab fa-instagram"></i>
                                </a>
                                <a href="https://wa.me/8613656157230" target="_blank" class="social-icon whatsapp" data-i18n="social.whatsapp" data-i18n-attr="title" title="WhatsApp联系我们">
                                    <i class="fab fa-whatsapp"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        `;
    }

    // 获取普通页面页脚HTML
    getFooterHTML() {
        const categoryLinks = this.generateFooterCategoryLinks(false);
        
        return `
            <!-- 🔗 页脚组件 -->
            <footer class="footer">
                <div class="footer-top">
                    <div class="container">
                        <div class="footer-grid">
                            <div class="footer-section">
                                <h4 data-i18n="footer.navigation">快速导航</h4>
                                <ul>
                                    <li><a href="../index.html" data-i18n="nav.home">首页</a></li>
                                    <li><a href="products.html" data-i18n="nav.products">产品展示</a></li>
                                    <li><a href="../index.html#contact" data-i18n="nav.contact">联系我们</a></li>
                                    <li><a href="privacy.html" data-i18n="footer.links.privacy">隐私政策</a></li>
                                    <li><a href="terms.html" data-i18n="footer.links.terms">使用条款</a></li>
                                </ul>
                            </div>

                            <div class="footer-section">
                                <h4 data-i18n="footer.products">主要产品</h4>
                                <ul id="footerCategoryLinks">
                                    ${categoryLinks}
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
                                © ${new Date().getFullYear()} ${this.companyInfo?.name || '无锡皇德国际贸易有限公司'} <span data-i18n="footer.copyright">版权所有</span>
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

    // 获取首页专用页脚HTML
    getHomeFooterHTML() {
        const categoryLinks = this.generateFooterCategoryLinks(true);
        
        return `
            <!-- 🔗 页脚组件 -->
            <footer class="footer">
                <div class="footer-top">
                    <div class="container">
                        <div class="footer-grid">
                            <div class="footer-section">
                                <h4 data-i18n="footer.navigation">快速导航</h4>
                                <ul>
                                    <li><a href="#home" data-i18n="nav.home">首页</a></li>
                                    <li><a href="#products" data-i18n="nav.products">产品展示</a></li>
                                    <li><a href="#contact" data-i18n="nav.contact">联系我们</a></li>
                                    <li><a href="pages/privacy.html" data-i18n="footer.links.privacy">隐私政策</a></li>
                                    <li><a href="pages/terms.html" data-i18n="footer.links.terms">使用条款</a></li>
                                </ul>
                            </div>

                            <div class="footer-section">
                                <h4 data-i18n="footer.products">主要产品</h4>
                                <ul id="footerCategoryLinks">
                                    ${categoryLinks}
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
                                © ${new Date().getFullYear()} ${this.companyInfo?.name || '无锡皇德国际贸易有限公司'} <span data-i18n="footer.copyright">版权所有</span>
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

    // 渲染组件到指定容器
    renderComponent(componentName, containerId, isHomePage = false) {
        const container = document.getElementById(containerId);
        if (container) {
            if (componentName === 'header') {
                container.innerHTML = isHomePage ? this.getHomeHeaderHTML() : this.getHeaderHTML();
            } else if (componentName === 'footer') {
                container.innerHTML = isHomePage ? this.getHomeFooterHTML() : this.getFooterHTML();
            }
        }
    }

    // 更新分类相关的内容
    async updateCategoryContent(isHomePage = false) {
        // 更新页头下拉菜单
        const dropdownMenu = document.querySelector('.dropdown-menu');
        if (dropdownMenu) {
            dropdownMenu.innerHTML = this.generateCategoryDropdown();
        }

        // 更新页脚分类链接
        const footerCategoryLinks = document.getElementById('footerCategoryLinks');
        if (footerCategoryLinks) {
            footerCategoryLinks.innerHTML = this.generateFooterCategoryLinks(isHomePage);
        }

        // 更新产品标签栏（所有页面都有）
        const productTagsContainer = document.getElementById('productTagsContainer');
        if (productTagsContainer) {
            productTagsContainer.innerHTML = this.generateProductTags(isHomePage);
            console.log('✅ 产品标签栏更新完成');
        }
    }

    // 初始化组件
    async init(isHomePage = false) {
        // 先加载分类数据和公司信息
        await Promise.all([
            this.loadCategories(),
            this.loadCompanyInfo()
        ]);
        
        // 自动渲染页头和页脚
        this.renderComponent('header', 'header-container', isHomePage);
        this.renderComponent('footer', 'footer-container', isHomePage);
        
        // 初始化页面特定功能（包括加载动画处理）
        this.initPageSpecificFeatures();
        
        // 如果是首页，还需要额外的首页特定功能
        if (isHomePage) {
            this.initHomePageFeatures();
        }
    }

    // 初始化页面特定功能
    initPageSpecificFeatures() {
        // 快速隐藏加载动画（组件化页面优化）
        this.hideLoadingScreen();

        // 重新绑定返回顶部按钮
        const backToTopBtn = document.getElementById('backToTop');
        if (backToTopBtn) {
            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            window.addEventListener('scroll', () => {
                if (window.pageYOffset > 300) {
                    backToTopBtn.classList.add('visible');
                } else {
                    backToTopBtn.classList.remove('visible');
                }
            });
        }

        // 移动端菜单功能
        window.toggleMobileMenu = function() {
            const navMenu = document.querySelector('.nav-menu');
            const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
            
            if (navMenu && mobileMenuBtn) {
                navMenu.classList.toggle('active');
                mobileMenuBtn.classList.toggle('active');
            }
        };

        // 搜索功能
        window.performSearch = function() {
            const searchInput = document.getElementById('searchInput');
            if (searchInput && searchInput.value.trim()) {
                console.log('🔍 执行页头搜索，当前页面:', window.location.pathname);
                
                // 智能判断跳转路径
                let targetUrl;
                const currentPath = window.location.pathname;
                
                if (currentPath === '/' || 
                    currentPath.endsWith('index.html') || 
                    currentPath === '/diamond-website-new/' ||
                    currentPath === '/diamond-website-new/index.html') {
                    // 首页：跳转到 pages/products.html
                    targetUrl = `pages/products.html?search=${encodeURIComponent(searchInput.value.trim())}`;
                } else if (currentPath.includes('/pages/')) {
                    // 在pages目录下的页面：跳转到 products.html
                    targetUrl = `products.html?search=${encodeURIComponent(searchInput.value.trim())}`;
                } else {
                    // 其他情况：使用相对路径
                    targetUrl = `pages/products.html?search=${encodeURIComponent(searchInput.value.trim())}`;
                }
                
                console.log('🎯 搜索跳转目标:', targetUrl);
                
                // 跳转到产品页面并带上搜索参数
                window.location.href = targetUrl;
            }
        };

        // 页头搜索框实时搜索功能
        window.performHeaderSearch = function(searchTerm) {
            // 如果在产品页面，直接进行实时搜索
            if (window.location.pathname.includes('products.html') && typeof searchProducts === 'function') {
                searchProducts(searchTerm);
            } else {
                // 如果不在产品页面，跳转到产品页面
                if (searchTerm && searchTerm.trim()) {
                    console.log('🔍 执行实时搜索跳转，当前页面:', window.location.pathname);
                    
                    // 智能判断跳转路径
                    let targetUrl;
                    const currentPath = window.location.pathname;
                    
                    if (currentPath === '/' || 
                        currentPath.endsWith('index.html') || 
                        currentPath === '/diamond-website-new/' ||
                        currentPath === '/diamond-website-new/index.html') {
                        // 首页：跳转到 pages/products.html
                        targetUrl = `pages/products.html?search=${encodeURIComponent(searchTerm.trim())}`;
                    } else if (currentPath.includes('/pages/')) {
                        // 在pages目录下的页面：跳转到 products.html
                        targetUrl = `products.html?search=${encodeURIComponent(searchTerm.trim())}`;
                    } else {
                        // 其他情况：使用相对路径
                        targetUrl = `pages/products.html?search=${encodeURIComponent(searchTerm.trim())}`;
                    }
                    
                    console.log('🎯 实时搜索跳转目标:', targetUrl);
                    window.location.href = targetUrl;
                }
            }
        };

        // 绑定搜索框事件
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            // 回车键搜索 - 检查是否已经绑定过事件
            if (!searchInput.hasAttribute('data-header-keypress-bound')) {
                searchInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        console.log('🔍 header-footer-components.js - 回车键搜索触发');
                        performSearch();
                    }
                });
                searchInput.setAttribute('data-header-keypress-bound', 'true');
                console.log('✅ header-footer-components.js - 回车键事件绑定成功');
            } else {
                console.log('⚠️ header-footer-components.js - 回车键事件已绑定，跳过重复绑定');
            }

            // 实时搜索（输入时）
            searchInput.addEventListener('input', function(e) {
                const searchTerm = e.target.value.trim();
                if (searchTerm.length >= 2) { // 至少输入2个字符才开始搜索
                    performHeaderSearch(searchTerm);
                } else if (searchTerm.length === 0) {
                    // 清空搜索框时，如果在产品页面，显示所有产品
                    if (window.location.pathname.includes('products.html') && typeof searchProducts === 'function') {
                        searchProducts('');
                    }
                }
            });
        }

        // 初始化页尾快速询价表单
        this.initFooterInquiryForm();

        // 🌍 初始化语言选择器
        this.initLanguageSwitcher();
    }

    // 初始化页尾快速询价表单
    initFooterInquiryForm() {
        // 等待DOM更新后再绑定事件
        setTimeout(() => {
            const footerForm = document.getElementById('footerInquiryForm');
            if (footerForm) {
                // 检查是否已经绑定过事件，防止重复绑定
                if (!footerForm.hasAttribute('data-event-bound')) {
                    footerForm.addEventListener('submit', this.handleFooterFormSubmit.bind(this));
                    footerForm.setAttribute('data-event-bound', 'true');
                    console.log('✅ 页尾快速询价表单事件绑定成功');
                } else {
                    console.log('⚠️  页尾快速询价表单事件已经绑定过，跳过重复绑定');
                }
            } else {
                console.warn('⚠️  未找到页尾快速询价表单');
            }
        }, 100);
    }

    // 公共方法：手动初始化页尾表单（供其他页面调用）
    manualInitFooterForm() {
        // 只在事件未绑定时才重新初始化
        const footerForm = document.getElementById('footerInquiryForm');
        if (footerForm && !footerForm.hasAttribute('data-event-bound')) {
            this.initFooterInquiryForm();
        } else {
            console.log('📋 页尾表单事件已存在或表单未找到，无需重复绑定');
        }
    }

    // 处理页尾表单提交
    async handleFooterFormSubmit(event) {
        event.preventDefault();
        event.stopPropagation(); // 防止事件冒泡
        
        const form = event.target;
        const submitBtn = form.querySelector('.btn-submit');
        
        // 防止重复提交
        if (submitBtn.disabled) {
            console.log('🚫 表单正在提交中，请勿重复提交');
            return;
        }
        
        const originalText = submitBtn.innerHTML;
        const feedbackDiv = document.getElementById('footerFormFeedback');
        
        // 验证表单
        if (!this.validateFooterForm(form)) {
            this.showFooterMessage('请填写所有必填字段！', 'error');
            return;
        }
        
        // 显示提交状态
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';
        submitBtn.disabled = true;
        
        // 获取表单数据
        const formData = {
            name: document.getElementById('footerName').value.trim(),
            email: document.getElementById('footerEmail').value.trim(),
            phone: document.getElementById('footerPhone').value.trim(),
            message: '页尾快速询价 - 客户希望获取产品信息和报价',
            source: 'footer_form', // 页尾表单来源
            sourceDetails: {
                page: window.location.pathname,
                referrer: document.referrer || 'direct',
                timestamp: new Date().toISOString()
            }
        };
        
        try {
            console.log('📤 正在提交页尾询价信息:', formData);
            
            // 提交到后台API
            const response = await fetch('/api/inquiries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            if (data.success) {
                console.log('✅ 页尾询价提交成功:', data);
                this.showFooterMessage('📧 询价信息发送成功！我们将在24小时内回复您。', 'success');
                form.reset();

                // 立即恢复按钮状态
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                console.log('🔄 页尾表单按钮状态已恢复');

                // 页尾快速询价完成后不需要任何后续动作
                console.log('📋 页尾快速询价完成，无需跳转WhatsApp');
            } else {
                throw new Error(data.message || '表单提交失败');
            }
        } catch (error) {
            console.error('❌ 页尾表单提交错误:', error);
            this.showFooterMessage('❌ 发送失败，请稍后重试或直接联系我们。', 'error');

            // 错误时也要恢复按钮状态
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            console.log('🔄 页尾表单按钮状态已恢复（错误情况）');
        }
    }

    // 验证页尾表单
    validateFooterForm(form) {
        const nameInput = document.getElementById('footerName');
        const emailInput = document.getElementById('footerEmail');
        
        let isValid = true;
        
        // 验证姓名
        if (!nameInput.value.trim()) {
            this.showFieldError(nameInput, '请输入您的姓名');
            isValid = false;
        } else {
            // 使用与HTML pattern一致的验证规则
            const namePattern = /^[a-zA-Z\u4e00-\u9fa5\s\-\.]{2,30}$/;
            if (!namePattern.test(nameInput.value.trim())) {
                this.showFieldError(nameInput, '请输入2-30个字符的有效姓名，支持中英文、空格、连字符');
                isValid = false;
            } else {
                this.clearFieldError(nameInput);
            }
        }
        
        // 验证邮箱
        if (!emailInput.value.trim()) {
            this.showFieldError(emailInput, '请输入邮箱地址');
            isValid = false;
        } else if (!emailInput.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            this.showFieldError(emailInput, '请输入有效的邮箱地址');
            isValid = false;
        } else {
            this.clearFieldError(emailInput);
        }
        
        return isValid;
    }

    // 显示字段错误
    showFieldError(field, message) {
        const errorDiv = field.parentNode.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
        field.classList.add('error');
    }

    // 清除字段错误
    clearFieldError(field) {
        const errorDiv = field.parentNode.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
        field.classList.remove('error');
    }

    // 显示页尾表单消息
    showFooterMessage(message, type) {
        const feedbackDiv = document.getElementById('footerFormFeedback');
        if (feedbackDiv) {
            feedbackDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
            feedbackDiv.style.display = 'block';

            // 添加动画效果
            feedbackDiv.style.opacity = '0';
            feedbackDiv.style.transform = 'translateY(-10px)';
            feedbackDiv.style.transition = 'all 0.3s ease';

            // 显示动画
            setTimeout(() => {
                feedbackDiv.style.opacity = '1';
                feedbackDiv.style.transform = 'translateY(0)';
            }, 50);

            // 延长显示时间到6秒，并添加淡出效果
            setTimeout(() => {
                feedbackDiv.style.opacity = '0';
                feedbackDiv.style.transform = 'translateY(-10px)';

                // 完全隐藏
                setTimeout(() => {
                    feedbackDiv.style.display = 'none';
                }, 300);
            }, 6000);

            console.log('✅ 页脚消息显示成功:', message);
        } else {
            console.warn('⚠️ 未找到页脚反馈显示区域');
        }
    }

    // 发送页尾WhatsApp询价
    sendFooterWhatsAppInquiry(formData) {
        // 页脚快速询价发送成功后不自动跳转WhatsApp
        // 只记录询价信息，不弹出确认对话框
        console.log('📋 页尾快速询价信息已记录，不自动跳转WhatsApp');

        // 可选：在控制台记录WhatsApp消息内容，供调试使用
        const { name, email, phone } = formData;
        const whatsappNumber = this.companyInfo?.contact?.whatsapp?.replace(/\D/g, '') || '8613656157230';

        let whatsappMessage = `🏢 无锡皇德国际贸易有限公司 - 快速询价\n\n`;
        whatsappMessage += `👤 姓名: ${name}\n`;
        whatsappMessage += `📧 邮箱: ${email}\n`;
        if (phone) whatsappMessage += `📱 电话: ${phone}\n`;
        whatsappMessage += `💬 需求: 希望获取产品目录和报价信息\n\n`;
        whatsappMessage += `📅 时间: ${new Date().toLocaleString('zh-CN')}\n`;
        whatsappMessage += `🌐 来源: 官方网站页尾快速询价`;

        console.log('📱 WhatsApp消息内容（仅记录）:', whatsappMessage);
    }

    // 快速隐藏加载屏幕
    hideLoadingScreen() {
        // 立即隐藏加载屏幕，不等待延迟
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
                // 完全移除元素以避免阻挡点击
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 300); // 等待过渡动画完成
            }
        }, 100); // 只延迟100ms，让用户看到加载效果但不妨碍操作
    }

    // 初始化首页特定功能
    initHomePageFeatures() {
        // 首页产品过滤功能
        window.filterProducts = function(category) {
            console.log('过滤产品分类:', category);
            
            // 更新标签按钮状态
            document.querySelectorAll('.tag-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.category === category) {
                    btn.classList.add('active');
                }
            });

            // 触发产品过滤事件，让产品展示组件响应
            const event = new CustomEvent('categoryFilter', {
                detail: { category: category }
            });
            document.dispatchEvent(event);
        };
    }

    // 🌍 初始化语言选择器
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
}

// 全局组件管理器实例
window.componentManager = new ComponentManager();

// DOM加载完成后自动初始化
document.addEventListener('DOMContentLoaded', async function() {
    // 检查是否是首页
    const isHomePage = window.location.pathname === '/' || 
                      window.location.pathname.endsWith('index.html') || 
                      window.location.pathname === '/diamond-website-new/' ||
                      window.location.pathname === '/diamond-website-new/index.html';
    
    // 初始化组件
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
    }
}); 