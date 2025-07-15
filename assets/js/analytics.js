// 📊 网站数据统计和分析系统
class WebsiteAnalytics {
    constructor() {
        this.session = {
            id: this.generateSessionId(),
            startTime: Date.now(),
            pageViews: 0,
            productClicks: 0,
            inquiries: 0
        };
        
        // 防重复统计
        this.clickedProducts = new Set(); // 记录已点击的产品
        this.lastClickTime = 0; // 防止短时间内重复点击
        this.visitedPages = new Set(); // 记录已访问的页面
        
        // 用户标识（用于独立用户统计）
        this.userFingerprint = this.generateUserFingerprint();
        
        this.init();
    }
    
    // 生成会话ID
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // 生成用户指纹（用于识别独立用户）
    generateUserFingerprint() {
        try {
            // 获取或创建用户标识
            let userId = localStorage.getItem('user_id');
            if (!userId) {
                userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('user_id', userId);
            }
            
            // 创建更详细的指纹信息
            const fingerprint = {
                user_id: userId,
                screen: `${screen.width}x${screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: navigator.language,
                platform: navigator.platform,
                // 不包含user_agent避免隐私问题
                created: localStorage.getItem('user_created') || new Date().toISOString()
            };
            
            if (!localStorage.getItem('user_created')) {
                localStorage.setItem('user_created', fingerprint.created);
            }
            
            return fingerprint;
        } catch (error) {
            console.error('生成用户指纹失败:', error);
            return {
                user_id: 'anonymous_' + Date.now(),
                screen: 'unknown',
                timezone: 'unknown',
                language: 'unknown',
                platform: 'unknown',
                created: new Date().toISOString()
            };
        }
    }
    
    // 初始化分析系统
    async init() {
        // 获取访问者IP地理位置信息
        await this.getVisitorGeoInfo();
        
        // 设置事件监听器
        this.setupEventListeners();
        
        // 追踪页面访问
        this.trackPageView();
        
        // 启动会话计时器
        this.startSessionTimer();
        
        console.log('📊 分析系统初始化完成');
    }
    
    // 获取访问者地理位置信息
    async getVisitorGeoInfo() {
        try {
            // 使用ipapi.co的免费API获取IP信息
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            
            this.geoInfo = {
                ip: data.ip,
                country: data.country_name,
                region: data.region,
                city: data.city,
                latitude: data.latitude,
                longitude: data.longitude
            };
            
            console.log('📍 获取访问者地理位置成功:', this.geoInfo);
        } catch (error) {
            console.error('获取访问者地理位置失败:', error);
            this.geoInfo = {
                ip: 'unknown',
                country: 'unknown',
                region: 'unknown',
                city: 'unknown'
            };
        }
    }
    
    // 追踪页面访问
    trackPageView() {
        const currentPage = window.location.pathname;
        
        // 防止同一页面重复统计（单页应用场景）
        if (this.visitedPages.has(currentPage)) {
            console.log('📊 页面已访问过，跳过重复统计:', currentPage);
            return;
        }
        
        this.visitedPages.add(currentPage);
        this.session.pageViews++;
        
        // 获取并分类来源
        let source = 'direct';
        const referrer = document.referrer;
        
        if (referrer) {
            // 搜索引擎来源
            if (referrer.match(/google\.|bing\.|baidu\.|sogou\.|so\.|sm\./i)) {
                source = 'search';
            }
            // 社交媒体来源
            else if (referrer.match(/facebook\.|twitter\.|linkedin\.|instagram\.|weibo\.|douyin\.|tiktok\./i)) {
                source = 'social';
            }
            // 其他网站引荐
            else {
                source = 'referral';
            }
        }
        
        // 检查是否是新用户（今天第一次访问）
        const today = new Date().toISOString().split('T')[0];
        const lastVisitKey = 'last_visit_' + today;
        const isNewVisitor = !localStorage.getItem(lastVisitKey);
        
        if (isNewVisitor) {
            localStorage.setItem(lastVisitKey, Date.now().toString());
        }
        
        const data = {
            type: 'page_view',
            session_id: this.session.id,
            user_fingerprint: this.userFingerprint,
            is_new_visitor: isNewVisitor,
            page: currentPage,
            title: document.title,
            timestamp: Date.now(),
            referrer: referrer,
            source: source,
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            // 添加地理位置信息
            geo_info: this.geoInfo
        };
        
        this.sendAnalytics(data);
        console.log('📊 页面访问:', {
            page: data.page, 
            source: source, 
            country: this.geoInfo.country,
            isNew: isNewVisitor,
            userId: this.userFingerprint.user_id
        });
    }
    
    // 追踪产品点击
    trackProductClick(productId, productName, category = '') {
        const currentTime = Date.now();
        
        // 防止短时间内重复点击同一产品（1秒内）
        if (currentTime - this.lastClickTime < 1000 && this.clickedProducts.has(productId)) {
            console.log('🎯 产品点击重复，跳过统计:', productName);
            return;
        }
        
        // 防止同一session内重复点击相同产品
        const sessionClickKey = `${this.session.id}_${productId}`;
        if (this.clickedProducts.has(sessionClickKey)) {
            console.log('🎯 产品在当前会话已点击过，跳过重复统计:', productName);
            return;
        }
        
        this.clickedProducts.add(productId);
        this.clickedProducts.add(sessionClickKey);
        this.lastClickTime = currentTime;
        this.session.productClicks++;

        console.log('✅ 产品点击统计成功:', {
            productId,
            productName,
            category,
            sessionClicks: this.session.productClicks,
            totalClickedProducts: this.clickedProducts.size
        });

        const data = {
            type: 'product_click',
            session_id: this.session.id,
            user_fingerprint: this.userFingerprint,
            product_id: productId,
            product_name: productName,
            category: category,
            timestamp: currentTime,
            page: window.location.pathname,
            referrer: document.referrer
        };

        this.sendAnalytics(data);
        console.log('🎯 产品点击:', {
            product: productName,
            category: category,
            userId: this.userFingerprint.user_id
        });
    }
    
    // 追踪咨询行为
    trackInquiry(type, productId = '', productName = '', method = '') {
        this.session.inquiries++;
        
        const data = {
            type: 'inquiry',
            session_id: this.session.id,
            inquiry_type: type, // 'whatsapp', 'contact_form', 'phone', 'email'
            product_id: productId,
            product_name: productName,
            method: method,
            page: window.location.pathname,
            timestamp: Date.now()
        };
        
        this.sendAnalytics(data);
        console.log('💬 咨询行为:', type, productName);
    }
    
    // 追踪搜索行为
    trackSearch(query, resultsCount = 0) {
        const data = {
            type: 'search',
            session_id: this.session.id,
            query: query,
            results_count: resultsCount,
            page: window.location.pathname,
            timestamp: Date.now()
        };
        
        this.sendAnalytics(data);
    }
    
    // 追踪用户交互事件
    trackInteraction(action, element, value = '') {
        const data = {
            type: 'interaction',
            session_id: this.session.id,
            action: action, // 'click', 'scroll', 'hover', 'form_submit'
            element: element,
            value: value,
            page: window.location.pathname,
            timestamp: Date.now()
        };
        
        this.sendAnalytics(data);
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 监听产品点击
        document.addEventListener('click', (event) => {
            // 查找最近的产品卡片链接 - 扩展支持推荐产品
            const productLink = event.target.closest('.product-image-link, .product-btn.btn-detail, .product-link, a[href*="product-detail.html"], .related-product-card[href*="product-detail.html"]');
            if (!productLink) return;

            // 从URL中提取产品ID
            const href = productLink.getAttribute('href');
            if (!href || !href.includes('product-detail.html')) return;

            const urlParams = href.split('?')[1];
            if (!urlParams) return;

            const productId = new URLSearchParams(urlParams).get('id');
            if (!productId) return;

            // 获取产品名称和分类 - 支持多种卡片结构
            let productCard = productLink.closest('.product-showcase-card, .product-card, .related-product-card') || productLink;
            let productName = '未知产品';
            let category = '';

            if (productCard) {
                // 尝试多种选择器获取产品名称 - 增加推荐产品的标题选择器
                const nameElement = productCard.querySelector('.product-name, .product-title, .related-product-title, h3');
                if (nameElement) {
                    productName = nameElement.textContent.trim();
                }

                // 获取分类信息
                category = productCard.dataset.category || '';

                // 如果没有分类，尝试从页面URL或其他地方获取
                if (!category && window.location.pathname.includes('product-detail')) {
                    category = 'related'; // 标记为相关产品点击
                }

                // 如果是推荐产品卡片，明确标记分类
                if (productCard.classList.contains('related-product-card')) {
                    category = 'related';
                }
            } else {
                // 如果找不到产品卡片，尝试从链接本身获取信息
                const img = productLink.querySelector('img');
                if (img && img.alt) {
                    productName = img.alt;
                }
            }

            console.log('🎯 产品点击统计:', { productId, productName, category, href, cardType: productCard?.className });

            // 记录点击
            this.trackProductClick(productId, productName, category);
        });
        
        // 监听咨询按钮点击
        document.addEventListener('click', (e) => {
            const inquiryBtn = e.target.closest('.inquiry-btn, [href*="wa.me"], [href*="tel:"], [href*="mailto:"]');
            if (inquiryBtn) {
                const method = this.determineInquiryMethod(inquiryBtn);
                const productInfo = this.getProductInfoFromContext(inquiryBtn);
                this.trackInquiry(method, productInfo.id, productInfo.name, method);
            }
        });
        
        // 监听表单提交
        document.addEventListener('submit', (e) => {
            if (e.target.matches('.inquiry-form, .contact-form')) {
                this.trackInquiry('contact_form', '', '', 'form_submit');
            }
        });
        
        // 监听页面离开
        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd();
        });
        
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackInteraction('page_blur', 'window');
            } else {
                this.trackInteraction('page_focus', 'window');
            }
        });
    }
    
    // 提取产品名称
    extractProductName(element) {
        const img = element.querySelector('img');
        if (img) return img.alt || '';
        
        const title = element.querySelector('h3, .product-title');
        if (title) return title.textContent.trim();
        
        return element.textContent.trim();
    }
    
    // 提取产品ID
    extractProductId(element) {
        const href = element.getAttribute('href');
        const match = href.match(/[?&]id=([^&]+)/);
        return match ? match[1] : '';
    }
    
    // 确定咨询方法
    determineInquiryMethod(element) {
        const href = element.getAttribute('href') || '';
        
        if (href.includes('wa.me')) return 'whatsapp';
        if (href.includes('tel:')) return 'phone';
        if (href.includes('mailto:')) return 'email';
        if (element.closest('form')) return 'contact_form';
        
        return 'unknown';
    }
    
    // 从上下文获取产品信息
    getProductInfoFromContext(element) {
        const productCard = element.closest('.product-card, .related-product-card');
        if (productCard) {
            const title = productCard.querySelector('h3, .product-title');
            const model = productCard.querySelector('.product-model');
            return {
                name: title ? title.textContent.trim() : '',
                id: model ? model.textContent.trim() : ''
            };
        }
        return { name: '', id: '' };
    }
    
    // 开始会话计时器
    startSessionTimer() {
        this.sessionTimer = setInterval(() => {
            // 每30秒发送一次心跳
            this.sendHeartbeat();
        }, 30000);
    }
    
    // 发送心跳信号
    sendHeartbeat() {
        const data = {
            type: 'heartbeat',
            session_id: this.session.id,
            duration: Date.now() - this.session.startTime,
            page_views: this.session.pageViews,
            product_clicks: this.session.productClicks,
            inquiries: this.session.inquiries,
            timestamp: Date.now()
        };
        
        this.sendAnalytics(data);
    }
    
    // 追踪会话结束
    trackSessionEnd() {
        const duration = Date.now() - this.session.startTime;
        
        const data = {
            type: 'session_end',
            session_id: this.session.id,
            duration: duration,
            page_views: this.session.pageViews,
            product_clicks: this.session.productClicks,
            inquiries: this.session.inquiries,
            timestamp: Date.now()
        };
        
        // 使用 sendBeacon 确保数据在页面卸载时也能发送
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/analytics', JSON.stringify(data));
        } else {
            this.sendAnalytics(data);
        }
        
        clearInterval(this.sessionTimer);
    }
    
    // 发送分析数据到服务器
    async sendAnalytics(data) {
        try {
            await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('分析数据发送失败:', error);
            // 失败时存储到本地，稍后重试
            this.storeLocalAnalytics(data);
        }
    }
    
    // 本地存储分析数据
    storeLocalAnalytics(data) {
        try {
            const key = 'website_analytics';
            const stored = localStorage.getItem(key);
            const analytics = stored ? JSON.parse(stored) : [];
            
            analytics.push(data);
            
            // 只保留最近的100条记录
            if (analytics.length > 100) {
                analytics.splice(0, analytics.length - 100);
            }
            
            localStorage.setItem(key, JSON.stringify(analytics));
        } catch (error) {
            console.error('本地存储分析数据失败:', error);
        }
    }
    
    // 获取本地分析数据
    getLocalAnalytics() {
        try {
            const stored = localStorage.getItem('website_analytics');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('读取本地分析数据失败:', error);
            return [];
        }
    }
    
    // 清除本地分析数据
    clearLocalAnalytics() {
        localStorage.removeItem('website_analytics');
    }
    
    // 获取会话统计
    getSessionStats() {
        return {
            ...this.session,
            duration: Date.now() - this.session.startTime
        };
    }
}

// 初始化分析系统
let analytics;
document.addEventListener('DOMContentLoaded', () => {
    analytics = new WebsiteAnalytics();
    
    // 将分析系统挂载到全局对象，方便其他脚本使用
    window.analytics = analytics;
});

// 导出分析函数供其他脚本使用
window.trackProductClick = (productId, productName, category) => {
    if (window.analytics) {
        window.analytics.trackProductClick(productId, productName, category);
    }
};

window.trackInquiry = (type, productId, productName, method) => {
    if (window.analytics) {
        window.analytics.trackInquiry(type, productId, productName, method);
    }
};

window.trackSearch = (query, resultsCount) => {
    if (window.analytics) {
        window.analytics.trackSearch(query, resultsCount);
    }
}; 