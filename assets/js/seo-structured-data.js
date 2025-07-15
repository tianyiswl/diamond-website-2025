// 🔍 SEO结构化数据管理器 - 提升搜索排名

class StructuredDataManager {
    constructor() {
        this.structuredData = {};
        this.currentLanguage = 'zh-CN';
        this.companyData = null;
        this.productsData = null;
        this.initialized = false;
        
        this.init();
    }

    // 初始化结构化数据系统
    async init() {
        console.log('🔍 初始化SEO结构化数据管理器...');
        
        try {
            // 加载公司数据
            await this.loadCompanyData();
            
            // 加载产品数据
            await this.loadProductsData();
            
            // 监听语言切换
            this.setupLanguageListener();
            
            // 生成并插入结构化数据
            this.generateAllStructuredData();
            
            this.initialized = true;
            console.log('✅ SEO结构化数据管理器初始化完成');
            
        } catch (error) {
            console.error('❌ 结构化数据初始化失败:', error);
        }
    }

    // 加载公司数据
    async loadCompanyData() {
        try {
            const response = await fetch('/data/company.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.companyData = await response.json();
            console.log('✅ 公司数据加载成功');
            
        } catch (error) {
            console.error('❌ 公司数据加载失败:', error);
            // 使用默认数据
            this.companyData = this.getDefaultCompanyData();
        }
    }

    // 加载产品数据
    async loadProductsData() {
        try {
            const response = await fetch('/api/products');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const result = await response.json();
            this.productsData = result.data || result;
            console.log(`✅ 产品数据加载成功: ${this.productsData.length}个产品`);
            
        } catch (error) {
            console.error('❌ 产品数据加载失败:', error);
            this.productsData = [];
        }
    }

    // 监听语言切换事件
    setupLanguageListener() {
        document.addEventListener('i18n:changed', (e) => {
            this.currentLanguage = e.detail.newLanguage;
            console.log(`🔍 语言切换，更新结构化数据: ${this.currentLanguage}`);
            this.generateAllStructuredData();
        });
    }

    // 生成所有结构化数据
    generateAllStructuredData() {
        console.log('🔍 生成结构化数据...');
        
        // 清除现有的结构化数据
        this.removeExistingStructuredData();
        
        // 生成各种类型的结构化数据
        this.generateOrganizationData();
        this.generateWebsiteData();
        this.generateProductsData();
        this.generateContactData();
        this.generateBreadcrumbData();
        this.generateFAQData();
        
        console.log('✅ 结构化数据生成完成');
    }

    // 生成组织/公司结构化数据
    generateOrganizationData() {
        const t = window.t || ((key) => key);
        const company = this.companyData || {};
        
        const organizationData = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": this.currentLanguage === 'en-US' 
                ? "Wuxi Huangde International Trading Co., Ltd."
                : "无锡皇德国际贸易有限公司",
            "alternateName": "Diamond Auto Parts",
            "url": window.location.origin,
            "logo": `${window.location.origin}/assets/images/logo/diamond-logo.png`,
            "description": t('site.description'),
            "foundingDate": "2008",
            "numberOfEmployees": "10-50",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": company.address || "江苏省无锡市",
                "addressLocality": "无锡市",
                "addressRegion": "江苏省", 
                "postalCode": company.postalCode || "214000",
                "addressCountry": "CN"
            },
            "contactPoint": [
                {
                    "@type": "ContactPoint",
                    "telephone": company.phone || "+86-xxx-xxxx-xxxx",
                    "contactType": "sales",
                    "availableLanguage": ["Chinese", "English"]
                },
                {
                    "@type": "ContactPoint",
                    "email": company.email || "info@example.com",
                    "contactType": "customer service",
                    "availableLanguage": ["Chinese", "English"]
                }
            ],
            "sameAs": [
                company.whatsapp ? `https://wa.me/${company.whatsapp}` : null
            ].filter(Boolean),
            "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": t('products.section_title'),
                "itemListElement": this.getProductCategories().map((category, index) => ({
                    "@type": "OfferCatalog",
                    "name": t(`categories.${category}`),
                    "position": index + 1
                }))
            },
            "areaServed": {
                "@type": "Country",
                "name": "Worldwide"
            },
            "knowsAbout": [
                "Turbocharger",
                "Common Rail Injector", 
                "Automotive Parts",
                "Diesel Engine Components",
                "Auto Parts Trading"
            ]
        };

        this.insertStructuredData('organization', organizationData);
    }

    // 生成网站结构化数据
    generateWebsiteData() {
        const t = window.t || ((key) => key);
        
        const websiteData = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": t('site.title'),
            "url": window.location.origin,
            "description": t('site.description'),
            "publisher": {
                "@type": "Organization",
                "name": this.currentLanguage === 'en-US' 
                    ? "Wuxi Huangde International Trading Co., Ltd."
                    : "无锡皇德国际贸易有限公司"
            },
            "potentialAction": {
                "@type": "SearchAction",
                "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": `${window.location.origin}/pages/products.html?search={search_term_string}`
                },
                "query-input": "required name=search_term_string"
            },
            "mainEntity": {
                "@type": "ItemList",
                "itemListElement": [
                    {
                        "@type": "SiteNavigationElement",
                        "position": 1,
                        "name": t('nav.home'),
                        "url": `${window.location.origin}/`
                    },
                    {
                        "@type": "SiteNavigationElement", 
                        "position": 2,
                        "name": t('nav.products'),
                        "url": `${window.location.origin}/pages/products.html`
                    },
                    {
                        "@type": "SiteNavigationElement",
                        "position": 3,
                        "name": t('nav.about'),
                        "url": `${window.location.origin}/#company`
                    },
                    {
                        "@type": "SiteNavigationElement",
                        "position": 4,
                        "name": t('nav.contact'),
                        "url": `${window.location.origin}/#contact`
                    }
                ]
            }
        };

        this.insertStructuredData('website', websiteData);
    }

    // 生成产品结构化数据
    generateProductsData() {
        if (!this.productsData || this.productsData.length === 0) return;

        const t = window.t || ((key) => key);
        const activeProducts = this.productsData.filter(p => p.status === 'active').slice(0, 10);
        
        const productsData = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": t('products.section_title'),
            "description": t('products.section_subtitle'),
            "numberOfItems": activeProducts.length,
            "itemListElement": activeProducts.map((product, index) => ({
                "@type": "Product",
                "position": index + 1,
                "name": product.name,
                "sku": product.sku,
                "description": product.description || t('products.loading'),
                "category": t(`categories.${product.category}`),
                "brand": product.brand || "Diamond Auto",
                "manufacturer": {
                    "@type": "Organization",
                    "name": this.currentLanguage === 'en-US' 
                        ? "Wuxi Huangde International Trading Co., Ltd."
                        : "无锡皇德国际贸易有限公司"
                },
                "offers": {
                    "@type": "Offer",
                    "availability": "https://schema.org/InStock",
                    "priceCurrency": "USD",
                    "seller": {
                        "@type": "Organization",
                        "name": this.currentLanguage === 'en-US' 
                            ? "Wuxi Huangde International Trading Co., Ltd."
                            : "无锡皇德国际贸易有限公司"
                    }
                },
                "additionalProperty": [
                    {
                        "@type": "PropertyValue",
                        "name": "OE Number",
                        "value": product.oeNumber || "Available on request"
                    },
                    {
                        "@type": "PropertyValue",
                        "name": "Application",
                        "value": product.applications || "Automotive"
                    }
                ]
            }))
        };

        this.insertStructuredData('products', productsData);
    }

    // 生成联系信息结构化数据
    generateContactData() {
        const company = this.companyData || {};
        const t = window.t || ((key) => key);
        
        const contactData = {
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": t('contact.section_title'),
            "description": t('contact.section_subtitle'),
            "mainEntity": {
                "@type": "Organization",
                "name": this.currentLanguage === 'en-US' 
                    ? "Wuxi Huangde International Trading Co., Ltd."
                    : "无锡皇德国际贸易有限公司",
                "contactPoint": {
                    "@type": "ContactPoint",
                    "telephone": company.phone || "+86-xxx-xxxx-xxxx",
                    "email": company.email || "info@example.com",
                    "contactType": "customer service",
                    "availableLanguage": ["Chinese", "English"],
                    "hoursAvailable": {
                        "@type": "OpeningHoursSpecification",
                        "dayOfWeek": [
                            "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"
                        ],
                        "opens": "09:00",
                        "closes": "18:00"
                    }
                }
            }
        };

        this.insertStructuredData('contact', contactData);
    }

    // 生成面包屑导航结构化数据
    generateBreadcrumbData() {
        const t = window.t || ((key) => key);
        const currentPage = this.getCurrentPageInfo();
        
        const breadcrumbData = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": t('nav.home'),
                    "item": window.location.origin
                }
            ]
        };
        
        // 根据当前页面添加额外的面包屑
        if (currentPage.type !== 'home') {
            breadcrumbData.itemListElement.push({
                "@type": "ListItem",
                "position": 2,
                "name": currentPage.title,
                "item": window.location.href
            });
        }

        this.insertStructuredData('breadcrumb', breadcrumbData);
    }

    // 生成FAQ结构化数据
    generateFAQData() {
        const t = window.t || ((key) => key);
        
        const faqData = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": this.currentLanguage === 'en-US' 
                        ? "What products do you supply?"
                        : "你们供应什么产品？",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": this.currentLanguage === 'en-US'
                            ? "We specialize in turbocharger parts, common rail injectors, actuators, and other automotive components with over 15 years of experience."
                            : "我们专业供应涡轮增压器配件、共轨喷油器、执行器等汽车部件，拥有超过15年的行业经验。"
                    }
                },
                {
                    "@type": "Question",
                    "name": this.currentLanguage === 'en-US'
                        ? "Do you ship worldwide?"
                        : "你们全球发货吗？",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": this.currentLanguage === 'en-US'
                            ? "Yes, we have a global supply network and can ship to customers worldwide."
                            : "是的，我们拥有全球供应网络，可以向全世界的客户发货。"
                    }
                },
                {
                    "@type": "Question", 
                    "name": this.currentLanguage === 'en-US'
                        ? "How can I get a quote?"
                        : "如何获取报价？",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": this.currentLanguage === 'en-US'
                            ? "You can submit an inquiry through our contact form, call us, or contact us via WhatsApp for a quick quote."
                            : "您可以通过联系表单提交询价，或者通过电话、WhatsApp联系我们获取快速报价。"
                    }
                }
            ]
        };

        this.insertStructuredData('faq', faqData);
    }

    // 获取产品分类列表
    getProductCategories() {
        if (!this.productsData) return [];
        
        const categories = [...new Set(this.productsData.map(p => p.category))];
        return categories.filter(Boolean);
    }

    // 获取当前页面信息
    getCurrentPageInfo() {
        const path = window.location.pathname;
        const t = window.t || ((key) => key);
        
        if (path.includes('products.html')) {
            return { type: 'products', title: t('nav.products') };
        } else if (path.includes('contact.html')) {
            return { type: 'contact', title: t('nav.contact') };
        } else {
            return { type: 'home', title: t('nav.home') };
        }
    }

    // 插入结构化数据到页面
    insertStructuredData(type, data) {
        try {
            // 移除已存在的同类型数据
            const existingScript = document.querySelector(`script[data-structured-data="${type}"]`);
            if (existingScript) {
                existingScript.remove();
            }
            
            // 创建新的脚本标签
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.setAttribute('data-structured-data', type);
            script.textContent = JSON.stringify(data, null, 2);
            
            // 插入到head中
            document.head.appendChild(script);
            
            console.log(`✅ ${type} 结构化数据已插入`);
            
        } catch (error) {
            console.error(`❌ 插入 ${type} 结构化数据失败:`, error);
        }
    }

    // 移除现有的结构化数据
    removeExistingStructuredData() {
        const existingScripts = document.querySelectorAll('script[data-structured-data]');
        existingScripts.forEach(script => script.remove());
    }

    // 获取默认公司数据
    getDefaultCompanyData() {
        return {
            name: "无锡皇德国际贸易有限公司",
            nameEn: "Wuxi Huangde International Trading Co., Ltd.",
            address: "江苏省无锡市",
            postalCode: "214000",
            phone: "+86-xxx-xxxx-xxxx",
            email: "info@example.com",
            whatsapp: "86xxxxxxxxxx"
        };
    }

    // 验证结构化数据
    validateStructuredData() {
        const scripts = document.querySelectorAll('script[data-structured-data]');
        const results = {};
        
        scripts.forEach(script => {
            const type = script.getAttribute('data-structured-data');
            try {
                const data = JSON.parse(script.textContent);
                results[type] = {
                    valid: true,
                    data: data,
                    size: script.textContent.length
                };
            } catch (error) {
                results[type] = {
                    valid: false,
                    error: error.message
                };
            }
        });
        
        return results;
    }

    // 生成结构化数据报告
    generateReport() {
        const validation = this.validateStructuredData();
        
        console.log('📊 SEO结构化数据报告:');
        console.table(validation);
        
        return {
            timestamp: new Date().toISOString(),
            language: this.currentLanguage,
            totalSchemas: Object.keys(validation).length,
            validSchemas: Object.values(validation).filter(v => v.valid).length,
            details: validation
        };
    }
}

// 创建全局实例
window.seoManager = new StructuredDataManager();

// 提供调试方法
window.validateSEO = () => window.seoManager?.validateStructuredData();
window.seoReport = () => window.seoManager?.generateReport();

// 导出供Node.js使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StructuredDataManager;
} 