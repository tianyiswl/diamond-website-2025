/**
 * 🔒 产品展示功能备份文件
 * 备份时间: 2025-07-16
 * 备份原因: 修复页面多次刷新问题前的安全备份
 * 
 * 包含内容:
 * - 主页产品展示逻辑
 * - 产品卡片渲染功能
 * - 产品排序和筛选
 * - 特性标签样式
 */

// ============ 主页产品展示逻辑备份 ============
// 来源: index.html 内联脚本 (第346-562行)

const HOMEPAGE_PRODUCT_DISPLAY_BACKUP = `
// 📦 3. 然后加载产品展示
setTimeout(async function() {
    console.log('🔧 主页内联脚本 - 开始加载产品展示...');
    
    const showcase = document.getElementById('products-showcase');
    if (showcase) {
        console.log('🎯 找到产品展示容器，开始加载产品...');
        
        try {
            // 直接从API加载产品数据
            console.log('🚀 开始从API加载主页产品展示数据...');
            const response = await fetch('/api/public/products?limit=1000');
            
            if (!response.ok) {
                throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
            }
            
            const result = await response.json();
            console.log('🔍 API响应结构:', result);
            
            // 处理API返回的数据格式: {data: [...]}
            const products = result.data || result;
            console.log(\`✅ API产品数据加载成功: \${products.length}个产品\`);
            
            if (!Array.isArray(products) || products.length === 0) {
                throw new Error('没有可用的产品数据');
            }
            
            // 简单排序：过滤活跃产品并取前9个
            const activeProducts = products.filter(p => p.status === 'active');
            const displayProducts = activeProducts.slice(0, 9);

            // 保存到全局变量，供语言切换时重新渲染使用
            window.featuredProducts = displayProducts;

            console.log(\`📦 准备显示 \${displayProducts.length} 个产品\`);

            // 使用产品卡组件渲染
            if (window.productCardComponent) {
                window.productCardComponent.renderToShowcase(displayProducts, {
                    showDescription: false,
                    imagePath: ''
                });
                console.log('✅ 产品展示渲染完成');
            } else {
                console.warn('⚠️ productCardComponent未找到，使用简单渲染');
                // 简单的HTML渲染
                const html = displayProducts.map(product => \`
                    <div class="product-card">
                        <h3>\${product.name}</h3>
                        <p>SKU: \${product.sku}</p>
                    </div>
                \`).join('');
                showcase.innerHTML = html;
            }
            
        } catch (error) {
            console.error('❌ 加载产品数据失败:', error);
            showcase.innerHTML = \`
                <div class="loading-text" style="color: #dc3545;">
                    <i class="fas fa-exclamation-triangle"></i> 
                    产品加载失败: \${error.message}
                    <br><small>请检查网络连接并刷新页面重试</small>
                </div>
            \`;
        }
    } else {
        console.log('🔍 未找到产品展示容器');
    }
}, 200);
`;

// ============ 特性标签样式备份 ============
// 来源: index.html 内联样式 (第28-79行)

const FEATURE_TAG_STYLES_BACKUP = `
/* 覆盖主页产品卡片的特性标签样式 */
.feature-tag {
    background: linear-gradient(135deg, #00DC82 0%, #00b76c 100%) !important;
    color: white !important;
    padding: 6px 14px !important;
    border-radius: 20px !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    box-shadow: 0 2px 8px rgba(0, 220, 130, 0.25) !important;
    letter-spacing: 0.2px !important;
    border: none !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    transition: all 0.3s ease !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    margin: 0 !important;
    cursor: default !important;
    text-align: center !important;
}

.feature-tag:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px rgba(0, 220, 130, 0.3) !important;
    background: linear-gradient(135deg, #00b76c 0%, #009c5a 100%) !important;
}

.feature-tag i {
    color: rgba(255, 255, 255, 0.9) !important;
    font-size: 11px !important;
    margin-right: 2px !important;
}

.feature-tag .feature-text {
    font-weight: 500 !important;
    letter-spacing: 0.1px !important;
}

/* 移动端响应式 */
@media (max-width: 768px) {
    .feature-tag {
        padding: 5px 12px !important;
        font-size: 11px !important;
        border-radius: 18px !important;
    }

    .feature-tag i {
        font-size: 10px !important;
    }
}
`;

// ============ 语言切换事件监听器备份 ============
// 来源: index.html 内联脚本 (第621-652行)

const I18N_CHANGE_LISTENER_BACKUP = `
// 🌍 监听语言切换事件，重新更新联系信息和产品卡片
document.addEventListener('i18n:changed', function(event) {
    console.log('🌍 主页监听到语言切换事件:', event.detail);

    // 重新更新联系信息（包括地址翻译）
    if (window.companyService) {
        console.log('📞 重新更新联系信息...');
        window.companyService.updatePageElements();

        // 验证更新
        setTimeout(() => {
            const addressElement = document.getElementById('company-address');
            if (addressElement) {
                console.log('✅ 地址已更新为:', addressElement.innerHTML);
            }
        }, 100);
    }

    // 重新渲染产品卡片（更新特性标签翻译）
    if (window.productCardComponent && window.featuredProducts) {
        console.log('🏷️ 重新渲染产品卡片...');
        setTimeout(() => {
            window.productCardComponent.renderToShowcase(
                window.featuredProducts,
                {
                    showDescription: false,
                    imagePath: ''
                }
            );
            console.log('✅ 产品卡片已重新渲染');
        }, 200);
    }
});
`;

// ============ 导出备份数据 ============
window.PRODUCT_DISPLAY_BACKUP = {
    homepageProductDisplay: HOMEPAGE_PRODUCT_DISPLAY_BACKUP,
    featureTagStyles: FEATURE_TAG_STYLES_BACKUP,
    i18nChangeListener: I18N_CHANGE_LISTENER_BACKUP,
    backupTime: '2025-07-16',
    backupReason: '修复页面多次刷新问题前的安全备份'
};

console.log('🔒 产品展示功能备份完成');

// ============ 产品卡组件核心方法备份 ============
// 来源: assets/js/product-card-component.js

const PRODUCT_CARD_COMPONENT_BACKUP = {
    iconMap: {
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
    },

    badgeMap: {
        'new': '新品',
        'hot': '热门',
        'recommend': '推荐',
        'tech': '技术',
        'parts': '配件',
        'precision': '精工',
        'pro': '专业'
    }
};

// 更新备份对象
window.PRODUCT_DISPLAY_BACKUP.productCardComponent = PRODUCT_CARD_COMPONENT_BACKUP;
