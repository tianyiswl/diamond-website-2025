// 🌍 国际化管理器 - 多语言支持系统

class I18nManager {
    constructor() {
        this.currentLanguage = 'zh-CN'; // 默认中文
        this.supportedLanguages = ['zh-CN', 'en-US'];
        this.translations = {};
        this.fallbackLanguage = 'zh-CN';
        this.initialized = false;
        this.initPromise = null; // 防止重复初始化

        // 语言配置
        this.languageConfig = {
            'zh-CN': {
                name: '中文',
                nativeName: '中文',
                dir: 'ltr',
                code: 'zh-CN'
            },
            'en-US': {
                name: 'English',
                nativeName: 'English',
                dir: 'ltr',
                code: 'en-US'
            }
        };

        // 不在构造函数中自动初始化，等待DOMContentLoaded
    }

    // 初始化国际化系统
    async init() {
        // 防止重复初始化
        if (this.initialized) {
            console.log('🌍 国际化管理器已经初始化，跳过重复初始化');
            return this.initPromise;
        }

        if (this.initPromise) {
            console.log('🌍 国际化管理器正在初始化中，等待完成...');
            return this.initPromise;
        }

        this.initPromise = this._doInit();
        return this.initPromise;
    }

    // 实际的初始化逻辑
    async _doInit() {
        console.log('🌍 初始化国际化管理器...');

        // 检测用户语言偏好
        this.detectLanguage();

        // 加载语言包
        await this.loadLanguages();

        // 标记为已初始化
        this.initialized = true;

        console.log(`🌍 国际化管理器初始化完成，当前语言: ${this.currentLanguage}`);

        // 🔥 关键修复：初始化完成后立即应用翻译（特别是针对用户之前选择的语言）
        this.updatePageContent();

        // 触发语言加载完成事件
        this.dispatchEvent('i18n:loaded');

        return true;
    }

    // 检测用户语言偏好
    detectLanguage() {
        console.log('🌍 开始检测用户语言偏好...');
        
        // 1. 从URL参数检测
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        if (urlLang && this.isSupported(urlLang)) {
            console.log(`✅ 从URL参数检测到语言: ${urlLang}`);
            this.currentLanguage = urlLang;
            localStorage.setItem('preferred-language', urlLang);
            return;
        }

        // 2. 从localStorage检测
        const savedLang = localStorage.getItem('preferred-language');
        if (savedLang && this.isSupported(savedLang)) {
            console.log(`✅ 从本地存储检测到语言: ${savedLang}`);
            this.currentLanguage = savedLang;
            return;
        }

        // 3. 从浏览器语言检测
        const browserLang = navigator.language || navigator.userLanguage;
        console.log(`🔍 浏览器语言: ${browserLang}`);
        const matchedLang = this.findBestMatch(browserLang);
        if (matchedLang) {
            console.log(`✅ 匹配到浏览器语言: ${matchedLang}`);
            this.currentLanguage = matchedLang;
            return;
        }

        // 4. 使用默认语言（中文）
        console.log(`🔧 使用默认语言: ${this.fallbackLanguage}`);
        this.currentLanguage = this.fallbackLanguage;
        
        // 🔥 强制保存到localStorage，确保下次访问时优先使用中文
        localStorage.setItem('preferred-language', this.fallbackLanguage);
    }

    // 检查语言是否支持
    isSupported(lang) {
        return this.supportedLanguages.includes(lang);
    }

    // 找到最佳匹配的语言
    findBestMatch(browserLang) {
        // 精确匹配
        if (this.isSupported(browserLang)) {
            return browserLang;
        }

        // 语言代码匹配 (en-US -> en)
        const langCode = browserLang.split('-')[0];
        const matches = this.supportedLanguages.filter(lang => 
            lang.startsWith(langCode + '-')
        );
        
        return matches.length > 0 ? matches[0] : null;
    }

    // 加载所有语言包
    async loadLanguages() {
        console.log('📦 加载语言包...');
        
        const loadPromises = this.supportedLanguages.map(lang => 
            this.loadLanguage(lang)
        );
        
        await Promise.all(loadPromises);
        console.log('✅ 所有语言包加载完成');
    }

    // 加载单个语言包
    async loadLanguage(lang) {
        try {
            const response = await fetch(`/data/i18n/${lang}.json`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const translations = await response.json();
            this.translations[lang] = translations;
            
            console.log(`✅ 语言包 ${lang} 加载成功`);
            return translations;
            
        } catch (error) {
            console.error(`❌ 语言包 ${lang} 加载失败:`, error);
            
            // 如果是当前语言，回退到默认语言
            if (lang === this.currentLanguage && lang !== this.fallbackLanguage) {
                console.log(`🔄 回退到默认语言: ${this.fallbackLanguage}`);
                this.currentLanguage = this.fallbackLanguage;
            }
        }
    }

    // 获取翻译文本
    t(key, params = {}) {
        if (!this.initialized) {
            return key; // 未初始化时返回key
        }

        const translation = this.getTranslation(key, this.currentLanguage) || 
                          this.getTranslation(key, this.fallbackLanguage) || 
                          key;

        // 参数替换
        return this.replaceParams(translation, params);
    }

    // 从语言包中获取翻译
    getTranslation(key, lang) {
        const translations = this.translations[lang];
        if (!translations) return null;

        // 支持嵌套键：'common.loading'
        const keys = key.split('.');
        let value = translations;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return null;
            }
        }

        return typeof value === 'string' ? value : null;
    }

    // 替换参数占位符
    replaceParams(text, params) {
        if (!text || typeof text !== 'string') return text;
        
        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return params.hasOwnProperty(key) ? params[key] : match;
        });
    }

    // 切换语言
    async switchLanguage(lang) {
        if (!this.isSupported(lang)) {
            console.error(`❌ 不支持的语言: ${lang}`);
            this.showSwitchFeedback('不支持的语言', 'error');
            return false;
        }

        if (lang === this.currentLanguage) {
            console.log(`🌍 已经是当前语言: ${lang}`);
            return true;
        }

        console.log(`🌍 切换语言: ${this.currentLanguage} → ${lang}`);

        // 🎨 显示切换中的视觉反馈
        this.showSwitchFeedback('正在切换语言...', 'loading');

        try {
            const oldLanguage = this.currentLanguage;
            this.currentLanguage = lang;

            // 保存语言偏好
            localStorage.setItem('preferred-language', lang);

            // 确保语言包已加载
            if (!this.translations[lang]) {
                await this.loadLanguage(lang);
            }

            // 触发语言切换事件
            this.dispatchEvent('i18n:changed', {
                oldLanguage,
                newLanguage: lang
            });

            // 更新页面内容
            this.updatePageContent();

            // 🎨 显示成功反馈
            const langName = this.languageConfig[lang]?.nativeName || lang;
            this.showSwitchFeedback(`已切换到${langName}`, 'success');

            return true;
        } catch (error) {
            console.error('❌ 语言切换失败:', error);
            this.showSwitchFeedback('语言切换失败', 'error');
            return false;
        }
    }

    // 更新页面内容
    updatePageContent() {
        console.log('🔄 更新页面内容...');

        // 更新HTML lang属性
        document.documentElement.lang = this.getLanguageCode();

        // 更新所有带有data-i18n属性的元素
        this.updateI18nElements();

        // 更新动态内容
        this.updateDynamicContent();

        // 🌍 更新语言选择器状态
        this.updateLanguageSwitchers();

        console.log('✅ 页面内容更新完成');
    }

    // 获取语言代码（去掉地区）
    getLanguageCode() {
        return this.currentLanguage.split('-')[0];
    }

    // 更新带有data-i18n属性的元素
    updateI18nElements() {
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const params = this.parseElementParams(el);
            
            // 获取翻译内容
            const translation = this.t(key, params);
            
            // 更新元素内容
            const attr = el.getAttribute('data-i18n-attr');
            if (attr) {
                el.setAttribute(attr, translation);
            } else {
                el.textContent = translation;
            }
        });
    }

    // 解析元素参数
    parseElementParams(el) {
        const paramsAttr = el.getAttribute('data-i18n-params');
        if (!paramsAttr) return {};

        try {
            return JSON.parse(paramsAttr);
        } catch (error) {
            console.error('❌ 解析i18n参数失败:', paramsAttr, error);
            return {};
        }
    }

    // 更新动态内容（轮播图、产品等）
    updateDynamicContent() {
        // 更新轮播图
        if (window.carouselManager) {
            this.updateCarousel();
        }

        // 更新产品卡片
        if (window.productCardComponent) {
            this.updateProductCards();
        }

        // 更新公司信息（地址等）
        if (window.companyService) {
            window.companyService.updatePageElements();
        }

        // 🌍 重新处理组件的多语言
        this.processAllComponents();
        
        // 🔥 特别处理产品详情页面的技术规格表格
        this.updateProductSpecsTable();
    }
    
    /**
     * 🔥 特别处理产品详情页面的技术规格表格翻译
     */
    updateProductSpecsTable() {
        try {
            // 查找产品详情页面的技术规格表格
            const specsTable = document.querySelector('.product-specs-table');
            if (specsTable) {
                console.log('🔍 发现产品技术规格表格，开始更新翻译...');
                
                // 处理表格中的翻译元素
                const i18nElements = specsTable.querySelectorAll('[data-i18n]');
                i18nElements.forEach(el => {
                    const key = el.getAttribute('data-i18n');
                    const translation = this.t(key);
                    
                    if (translation && translation !== key) {
                        el.textContent = translation;
                        console.log(`✅ 更新技术规格标签: ${key} → ${translation}`);
                    }
                });
            }
        } catch (error) {
            console.error('❌ 更新产品技术规格表格失败:', error);
        }
    }
    
    /**
     * 🌍 重新处理所有组件的多语言
     */
    processAllComponents() {
        try {
            // 处理页头组件
            const headerContainer = document.getElementById('header-container');
            if (headerContainer) {
                this.processI18nContainer(headerContainer);
            }
            
            // 处理页脚组件
            const footerContainer = document.getElementById('footer-container');
            if (footerContainer) {
                this.processI18nContainer(footerContainer);
            }
            
            // 处理产品卡片容器
            const productContainers = document.querySelectorAll('.product-container, .product-grid, .product-list, #productContainer');
            productContainers.forEach(container => {
                this.processI18nContainer(container);
            });
            
            console.log('🌍 所有组件多语言处理完成');
        } catch (error) {
            console.error('❌ 处理组件多语言失败:', error);
        }
    }
    
    /**
     * 🌍 处理指定容器内的多语言元素
     */
    processI18nContainer(container) {
        const elements = container.querySelectorAll('[data-i18n]');
        
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const params = this.parseElementParams(el);
            
            // 获取翻译内容
            const translation = this.t(key, params);
            
            // 更新元素内容
            const attr = el.getAttribute('data-i18n-attr');
            if (attr) {
                el.setAttribute(attr, translation);
            } else {
                el.textContent = translation;
            }
        });
    }
    
    /**
     * 🌍 处理新添加的元素（供组件管理器调用）
     */
    processElements(container) {
        if (container && this.initialized) {
            this.processI18nContainer(container);
        }
    }

    // 更新轮播图
    updateCarousel() {
        try {
            const slides = this.t('hero.slides');
            if (Array.isArray(slides)) {
                // 更新轮播图配置
                if (window.carouselConfig) {
                    window.carouselConfig.slides.forEach((slide, index) => {
                        if (slides[index]) {
                            slide.title = slides[index].title;
                            slide.desc = slides[index].description;
                        }
                    });
                }

                // 重新初始化轮播图
                if (window.carouselManager && window.carouselManager.updateSlides) {
                    window.carouselManager.updateSlides();
                }
            }
        } catch (error) {
            console.error('❌ 更新轮播图失败:', error);
        }
    }

    // 更新产品卡片
    updateProductCards() {
        try {
            // 触发产品卡片重新渲染
            const event = new CustomEvent('i18n:update-products');
            document.dispatchEvent(event);
        } catch (error) {
            console.error('❌ 更新产品卡片失败:', error);
        }
    }

    // 获取当前语言信息
    getCurrentLanguage() {
        return {
            code: this.currentLanguage,
            config: this.languageConfig[this.currentLanguage]
        };
    }

    // 获取所有支持的语言
    getSupportedLanguages() {
        return this.supportedLanguages.map(lang => ({
            code: lang,
            config: this.languageConfig[lang]
        }));
    }

    // 创建语言切换器
    createLanguageSwitcher(container) {
        const switcher = document.createElement('div');
        switcher.className = 'language-switcher';
        
        const select = document.createElement('select');
        select.className = 'language-select';
        
        this.supportedLanguages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang;
            option.textContent = this.languageConfig[lang].nativeName;
            option.selected = lang === this.currentLanguage;
            select.appendChild(option);
        });
        
        select.addEventListener('change', (e) => {
            this.switchLanguage(e.target.value);
        });
        
        switcher.appendChild(select);
        
        if (typeof container === 'string') {
            const containerEl = document.querySelector(container);
            if (containerEl) {
                containerEl.appendChild(switcher);
            }
        } else if (container) {
            container.appendChild(switcher);
        }
        
        return switcher;
    }

    // 🌍 更新所有语言选择器的状态
    updateLanguageSwitchers() {
        // 更新所有语言选择器的选中状态
        const languageSelects = document.querySelectorAll('.language-select');
        languageSelects.forEach(select => {
            if (select.value !== this.currentLanguage) {
                select.value = this.currentLanguage;
                console.log(`🔄 更新语言选择器状态: ${this.currentLanguage}`);
            }
        });
    }

    // 触发自定义事件
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            detail: { ...detail, i18n: this }
        });
        document.dispatchEvent(event);
    }

    // 获取浏览器偏好语言列表
    getBrowserLanguages() {
        return navigator.languages || [navigator.language || 'en-US'];
    }

    // 获取RTL语言支持
    isRTL() {
        const config = this.languageConfig[this.currentLanguage];
        return config && config.dir === 'rtl';
    }

    // 🎨 显示语言切换反馈
    showSwitchFeedback(message, type = 'info') {
        // 移除现有的反馈元素
        const existingFeedback = document.querySelector('.i18n-switch-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        // 创建反馈元素
        const feedback = document.createElement('div');
        feedback.className = `i18n-switch-feedback i18n-feedback-${type}`;
        feedback.innerHTML = `
            <div class="feedback-content">
                ${type === 'loading' ? '<i class="fas fa-spinner fa-spin"></i>' : ''}
                ${type === 'success' ? '<i class="fas fa-check"></i>' : ''}
                ${type === 'error' ? '<i class="fas fa-exclamation-triangle"></i>' : ''}
                <span>${message}</span>
            </div>
        `;

        // 添加样式
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

        document.body.appendChild(feedback);

        // 显示动画
        setTimeout(() => {
            feedback.style.opacity = '1';
            feedback.style.transform = 'translateX(0)';
        }, 10);

        // 自动隐藏（除了loading状态）
        if (type !== 'loading') {
            setTimeout(() => {
                feedback.style.opacity = '0';
                feedback.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (feedback.parentNode) {
                        feedback.remove();
                    }
                }, 300);
            }, 2000);
        }
    }
}

// 导出供Node.js使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18nManager;
}

// 创建全局实例并自动初始化
if (typeof window !== 'undefined') {
    window.I18nManager = I18nManager;
    window.i18n = new I18nManager();
    // 🔧 修复：添加兼容性别名，解决组件管理器中的引用问题
    window.i18nManager = window.i18n;

    // 自动初始化 - 修复：检查DOM状态并立即初始化
    const initI18n = async () => {
        console.log('🌍 开始自动初始化i18n系统...');
        try {
            await window.i18n.init();
            console.log('✅ i18n系统自动初始化完成');
        } catch (error) {
            console.error('❌ i18n系统初始化失败:', error);
        }
    };

    // 检查DOM是否已经加载完成
    if (document.readyState === 'loading') {
        // DOM还在加载中，等待DOMContentLoaded
        document.addEventListener('DOMContentLoaded', initI18n);
    } else {
        // DOM已经加载完成，立即初始化
        initI18n();
    }
}