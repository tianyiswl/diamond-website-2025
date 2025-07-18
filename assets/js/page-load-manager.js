/**
 * 🚀 统一页面加载管理器
 * 解决页面多次刷新问题的核心解决方案
 * 
 * 功能：
 * - 防止重复的DOMContentLoaded事件执行
 * - 统一管理组件初始化顺序
 * - 提供加载状态检查机制
 * - 确保产品展示功能正常工作
 */

(function() {
    'use strict';
    
    // 全局加载状态管理
    window.PageLoadManager = {
        // 加载状态标记
        states: {
            domReady: false,
            componentsLoaded: false,
            productsLoaded: false,
            i18nReady: false,
            allReady: false
        },
        
        // 初始化队列
        initQueue: [],
        
        // 已执行的初始化函数
        executedInits: new Set(),
        
        /**
         * 检查是否已经初始化过
         */
        isInitialized: function(key) {
            return this.executedInits.has(key);
        },
        
        /**
         * 标记为已初始化
         */
        markInitialized: function(key) {
            this.executedInits.add(key);
            console.log(`✅ 标记已初始化: ${key}`);
        },
        
        /**
         * 安全执行初始化函数（防重复）
         */
        safeInit: function(key, initFunction) {
            if (this.isInitialized(key)) {
                console.log(`⚠️ 跳过重复初始化: ${key}`);
                return false;
            }
            
            try {
                console.log(`🚀 开始初始化: ${key}`);
                initFunction();
                this.markInitialized(key);
                return true;
            } catch (error) {
                console.error(`❌ 初始化失败: ${key}`, error);
                return false;
            }
        },
        
        /**
         * 添加到初始化队列
         */
        addToQueue: function(key, initFunction, dependencies = []) {
            this.initQueue.push({
                key,
                initFunction,
                dependencies,
                executed: false
            });
        },
        
        /**
         * 检查依赖是否满足
         */
        checkDependencies: function(dependencies) {
            return dependencies.every(dep => this.states[dep] || this.isInitialized(dep));
        },
        
        /**
         * 执行队列中的初始化函数
         */
        processQueue: function() {
            let processed = false;
            
            this.initQueue.forEach(item => {
                if (!item.executed && this.checkDependencies(item.dependencies)) {
                    if (this.safeInit(item.key, item.initFunction)) {
                        item.executed = true;
                        processed = true;
                    }
                }
            });
            
            // 如果有处理过的项目，递归检查是否有新的可执行项目
            if (processed) {
                setTimeout(() => this.processQueue(), 50);
            }
        },
        
        /**
         * 设置状态并触发队列处理
         */
        setState: function(key, value) {
            if (this.states[key] !== value) {
                this.states[key] = value;
                console.log(`📊 状态更新: ${key} = ${value}`);

                // 防抖处理，避免频繁触发
                clearTimeout(this._stateUpdateTimer);
                this._stateUpdateTimer = setTimeout(() => {
                    // 检查是否所有状态都已就绪
                    if (Object.values(this.states).every(state => state)) {
                        this.states.allReady = true;
                        console.log('🎉 所有组件加载完成！');
                    }

                    this.processQueue();
                }, 50); // 50ms防抖
            }
        },
        
        /**
         * 等待特定状态就绪
         */
        waitFor: function(stateKey, callback, timeout = 10000) {
            if (this.states[stateKey]) {
                callback();
                return;
            }
            
            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                if (this.states[stateKey]) {
                    clearInterval(checkInterval);
                    callback();
                } else if (Date.now() - startTime > timeout) {
                    clearInterval(checkInterval);
                    console.warn(`⚠️ 等待状态超时: ${stateKey}`);
                    callback(); // 即使超时也执行回调
                }
            }, 100);
        },
        
        /**
         * 初始化主页产品展示（增强版本）
         */
        initHomepageProducts: function() {
            const key = 'homepage-products';

            this.safeInit(key, async function() {
                const showcase = document.getElementById('products-showcase');
                if (!showcase) {
                    console.log('🔍 未找到产品展示容器，跳过主页产品加载');
                    return;
                }

                console.log('🏠 开始加载主页产品展示...');

                // 显示加载状态
                showcase.innerHTML = `
                    <div class="loading-text" style="text-align: center; padding: 40px; color: #6c757d;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 10px;"></i>
                        <br>正在加载最新产品...
                    </div>
                `;

                try {
                    console.log('🌐 调用API: /api/public/products?limit=1000');
                    const response = await fetch('/api/public/products?limit=1000');

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const result = await response.json();
                    console.log('📦 API响应:', result);

                    const products = result.data || result;

                    if (!Array.isArray(products)) {
                        throw new Error(`API返回数据格式错误: ${typeof products}`);
                    }

                    if (products.length === 0) {
                        throw new Error('没有可用的产品数据');
                    }

                    console.log(`📊 获取到 ${products.length} 个产品`);

                    const activeProducts = products.filter(p => p.status === 'active');
                    const displayProducts = activeProducts.slice(0, 9);

                    console.log(`🎯 筛选出 ${displayProducts.length} 个活跃产品用于展示`);

                    // 保存到全局变量
                    window.featuredProducts = displayProducts;

                    // 等待产品卡组件加载
                    const renderProducts = () => {
                        if (window.productCardComponent && typeof window.productCardComponent.renderToShowcase === 'function') {
                            console.log('🎨 使用产品卡组件渲染');
                            window.productCardComponent.renderToShowcase(displayProducts, {
                                showDescription: false,
                                imagePath: ''
                            });
                            console.log('✅ 主页产品展示渲染完成');
                            window.PageLoadManager.setState('productsLoaded', true);
                        } else {
                            console.warn('⚠️ productCardComponent未就绪，使用简单渲染');
                            // 简单渲染作为备用方案
                            const html = displayProducts.map(product => `
                                <div class="product-card" style="
                                    border: 1px solid #ddd;
                                    padding: 15px;
                                    margin: 10px;
                                    border-radius: 8px;
                                    display: inline-block;
                                    background: white;
                                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                    max-width: 200px;
                                    vertical-align: top;
                                ">
                                    <h4 style="margin: 0 0 10px 0; color: #333; font-size: 14px;">${product.name}</h4>
                                    <p style="margin: 5px 0; font-size: 12px; color: #666;">SKU: ${product.sku}</p>
                                    ${product.features ? product.features.map(feature =>
                                        `<span class="feature-tag" style="
                                            background: linear-gradient(135deg, #00DC82 0%, #00b76c 100%);
                                            color: white;
                                            padding: 4px 8px;
                                            border-radius: 12px;
                                            font-size: 10px;
                                            margin: 2px;
                                            display: inline-block;
                                        ">${feature}</span>`
                                    ).join('') : ''}
                                </div>
                            `).join('');

                            showcase.innerHTML = html;
                            console.log('✅ 简单产品展示渲染完成');
                            window.PageLoadManager.setState('productsLoaded', true);
                        }
                    };

                    // 立即尝试渲染
                    renderProducts();

                    // 如果组件未就绪，延迟重试
                    if (!window.productCardComponent) {
                        console.log('⏳ 等待产品卡组件加载...');
                        setTimeout(renderProducts, 1000);
                        setTimeout(renderProducts, 2000);
                    }

                } catch (error) {
                    console.error('❌ 加载产品数据失败:', error);
                    showcase.innerHTML = `
                        <div class="loading-text" style="color: #dc3545; text-align: center; padding: 40px;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px;"></i>
                            <br>产品加载失败: ${error.message}
                            <br><small style="color: #6c757d;">请检查网络连接并刷新页面重试</small>
                            <br><button onclick="window.PageLoadManager.initHomepageProducts()"
                                style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                重试加载
                            </button>
                        </div>
                    `;
                }
            });
        },
        
        /**
         * 初始化组件管理器（防重复版本）
         */
        initComponentManager: function() {
            const key = 'component-manager';
            
            this.safeInit(key, async function() {
                if (window.componentManager) {
                    const isHomePage = window.location.pathname === '/' || 
                                      window.location.pathname.endsWith('index.html');
                    
                    await window.componentManager.init(isHomePage);
                    console.log('✅ 组件管理器初始化完成');
                    
                    window.PageLoadManager.setState('componentsLoaded', true);
                } else {
                    console.warn('⚠️ componentManager未找到');
                }
            });
        },
        
        /**
         * 初始化搜索功能（防重复版本）
         */
        initSearchFeatures: function() {
            const key = 'search-features';
            
            this.safeInit(key, function() {
                // 只绑定一次搜索事件
                const searchInput = document.getElementById('searchInput');
                if (searchInput && !searchInput.hasAttribute('data-search-bound')) {
                    // 标记已绑定，防止重复
                    searchInput.setAttribute('data-search-bound', 'true');
                    
                    searchInput.addEventListener('keypress', function(e) {
                        if (e.key === 'Enter') {
                            console.log('🔍 搜索功能触发');
                            if (typeof performSearch === 'function') {
                                performSearch();
                            }
                        }
                    });
                    
                    console.log('✅ 搜索功能初始化完成');
                }
            });
        }
    };
    
    // 统一的DOMContentLoaded处理器 - 增强版
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 统一页面加载管理器 - DOMContentLoaded');

            // 延迟设置状态，确保所有同步脚本执行完毕
            setTimeout(() => {
                window.PageLoadManager.setState('domReady', true);
            }, 10);
        });
    } else {
        // 如果DOM已经加载完成，立即设置状态
        setTimeout(() => {
            window.PageLoadManager.setState('domReady', true);
        }, 10);
    }

    // 添加页面可见性变化监听，优化性能
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            console.log('📱 页面变为可见状态');
            // 页面重新可见时，检查是否需要重新初始化
            if (!window.PageLoadManager.states.allReady) {
                console.log('🔄 页面可见时检测到未完成的初始化，重新处理队列');
                window.PageLoadManager.processQueue();
            }
        }
    });
    
    console.log('📦 统一页面加载管理器已就绪');
})();
