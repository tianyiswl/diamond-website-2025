// 🚀 产品详情页核心功能实现

// 📊 获取URL参数
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// 📡 加载产品数据
async function loadProductData() {
    try {
        const productId = getUrlParameter('id');
        if (!productId) {
            throw new Error('未提供产品ID');
        }

        // 🌐 使用数据库公开API接口加载产品数据
        const response = await fetch(`/api/db/public/products/${productId}`);
        if (!response.ok) {
            throw new Error(`加载失败: ${response.status}`);
        }

        const product = await response.json();
        
        if (!product) {
            throw new Error('产品不存在');
        }

        console.log('Loaded product:', product); // 调试日志
        return product;
    } catch (error) {
        console.error('加载产品数据失败:', error);
        showError('加载失败', error.message || '无法加载产品数据，请稍后重试');
        throw error;
    }
}

// 🌍 获取产地文本（固定中文）
function getOriginText() {
    return '中国';
}

// 🌍 获取质保期文本（固定中文）
function getWarrantyText(warrantyMonths = '12') {
    return `${warrantyMonths}个月质保`;
}

// 🎨 渲染产品详情
function renderProductDetail(product) {
    if (!product) {
        showError('产品未找到', '抱歉，您访问的产品不存在或已被删除。');
        return;
    }

    console.log('Rendering product:', product); // 调试日志

    // 🌍 保存当前产品到全局变量，供语言切换时重新渲染使用
    window.currentProduct = product;

    // 📝 更新页面标题和SEO
    updatePageSEO(product);

    // 🖼️ 渲染产品图片
    renderProductImages(product);

    // 📝 渲染产品基本信息
    renderProductInfo(product);

    // 📊 渲染技术规格
    renderProductSpecs(product);

    // 📋 渲染产品描述选项卡
    renderDescriptionTab(product);

    // 📦 渲染包装信息
    renderPackaging(product);

    // 🔄 渲染相关产品
    renderRelatedProducts(product);

    // 💬 初始化询价功能
    initInquireFunction(product);

    // 📊 初始化选项卡切换
    initTabSwitching();

    // 隐藏加载状态，显示内容
    const loadingScreen = document.getElementById('loadingScreen');
    const productDetailContent = document.getElementById('productDetailContent');
    const productDetailGrid = document.getElementById('productDetailGrid');
    const productTabs = document.getElementById('productTabs');

    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
    if (productDetailContent) {
        productDetailContent.style.display = 'none';
    }
    if (productDetailGrid) {
        productDetailGrid.style.display = 'grid';
    }
    if (productTabs) {
        productTabs.style.display = 'block';
    }

    // 🔗 初始化分享功能
    initShareFeatures();
    console.log('✅ 产品详情渲染完成');
}

// 📝 更新页面SEO信息
function updatePageSEO(product) {
    document.getElementById('page-title').textContent = `${product.name} - ${product.model || ''} - 无锡皇德国际贸易有限公司`;
    document.getElementById('page-description').setAttribute('content', 
        `${product.name} - ${product.description || '专业汽车零部件供应商'} - 无锡皇德国际贸易有限公司`);
    document.getElementById('page-keywords').setAttribute('content', 
        `${product.name},${product.model || ''},${product.brand || ''},涡轮增压器,汽车零部件,无锡皇德`);
    // 🍞 更新面包屑导航，包含产品分类信息
    updateBreadcrumbNavigation(product);
}

// 🍞 更新面包屑导航（固定中文）
function updateBreadcrumbNavigation(product) {
    const breadcrumbContainer = document.querySelector('.breadcrumb');

    // 固定中文文本
    const homeText = '首页';
    const productsText = '产品展示';
    const categoryText = getCategoryName(product.category);

    // 获取分类的URL参数（处理对象和字符串格式）
    let categoryParam = product.category;
    if (product.category && typeof product.category === 'object') {
        // 如果是对象，需要转换为URL参数格式
        const categoryMap = {
            '涡轮增压器': 'turbocharger',
            '执行器': 'actuator',
            '共轨喷油器': 'injector',
            '涡轮配件': 'turbo-parts',
            '其他': 'others'
        };
        categoryParam = categoryMap[product.category.name] || 'others';
    }

    const categoryUrl = `products.html?category=${categoryParam}`;

    // 构建面包屑HTML
    breadcrumbContainer.innerHTML = `
        <a href="../index.html">${homeText}</a>
        <span>/</span>
        <a href="products.html">${productsText}</a>
        <span>/</span>
        <a href="${categoryUrl}">${categoryText}</a>
        <span>/</span>
        <span id="productBreadcrumb">${product.name}</span>
    `;
}

// 🖼️ 渲染产品图片
function renderProductImages(product) {
    const mainImage = document.getElementById('productMainImage');
    const thumbnailsContainer = document.getElementById('productThumbnails');

    // 获取产品图片数组 - 支持新的images数组格式
    let images = [];
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        // 新格式：从images数组中提取URL
        images = product.images.map(img => img.url || img);
    } else if (product.image) {
        // 兼容旧格式
        images = [product.image];
    }

    // 如果没有图片，使用默认图片
    if (images.length === 0) {
        images = ['/assets/images/logo/diamond-logo.png'];
    }

    console.log('Product images:', images); // 调试日志

    // 设置主图
    const mainImageUrl = images[0];
    mainImage.src = mainImageUrl;
    mainImage.alt = product.name;
    mainImage.onerror = function() {
        this.src = '/assets/images/logo/diamond-logo.png';
    };

    // 存储图片数组到全局变量，用于图片切换
    window.productImages = images;
    window.currentImageIndex = 0;

    // 添加主图点击事件
    mainImage.onclick = () => openImageModal(mainImage.src);

    // 清空缩略图容器
    thumbnailsContainer.innerHTML = '';

    // 显示缩略图（如果有多张图片）
    if (images.length > 1) {
        images.forEach((imgSrc, index) => {
            const thumbnailWrapper = document.createElement('div');
            thumbnailWrapper.className = `thumbnail-img ${index === 0 ? 'active' : ''}`;
            
            const thumbnail = document.createElement('img');
            thumbnail.src = imgSrc;
            thumbnail.alt = `${product.name} - 图片 ${index + 1}`;
            thumbnail.onerror = function() {
                this.src = '/assets/images/logo/diamond-logo.png';
            };
            
            // 缩略图点击事件只切换主图
            thumbnailWrapper.onclick = () => {
                switchMainImage(imgSrc, thumbnailWrapper);
                window.currentImageIndex = index; // 更新当前图片索引
            };
            thumbnailWrapper.appendChild(thumbnail);
            thumbnailsContainer.appendChild(thumbnailWrapper);
        });
        thumbnailsContainer.style.display = 'grid';
    } else {
        thumbnailsContainer.style.display = 'none';
    }

    // 显示产品标签
    const badge = document.getElementById('productBadge');
    if (badge) {
        // 根据产品属性确定标签
        let badgeText = '';
        let badgeClass = '';
        
        if (product.isNew === 'true' || product.isNew === true) {
            badgeClass = 'new';
            badgeText = 'New';
        } else if (product.isHot === 'true' || product.isHot === true) {
            badgeClass = 'hot';
            badgeText = 'Hot';
        } else if (product.isRecommend === 'true' || product.isRecommend === true) {
            badgeClass = 'recommend';
            badgeText = 'Recommend';
        } else if (product.badge) {
            // 兼容旧的badge字段
            badgeClass = product.badge.toLowerCase();
            const badgeMap = {
                'new': 'New',
                'hot': 'Hot',
                'recommend': 'Recommend',
                'sale': 'Sale'
            };
            badgeText = badgeMap[badgeClass] || 'Recommend';
        }
        
        if (badgeText) {
            badge.textContent = badgeText;
            badge.className = `product-badge ${badgeClass}`;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// 🔄 切换主图
function switchMainImage(imgSrc, clickedThumbnail) {
    const mainImage = document.getElementById('productMainImage');
    mainImage.src = imgSrc;

    // 更新缩略图激活状态
    document.querySelectorAll('.thumbnail-img').forEach(thumb => {
        thumb.classList.remove('active');
    });
    clickedThumbnail.classList.add('active');
}

// 📝 渲染产品基本信息
function renderProductInfo(product) {
    // 设置产品名称 - 修复元素查找问题
    const productTitle = document.querySelector('.product-title');
    if (productTitle) {
        productTitle.textContent = product.name || '未命名产品';
        console.log('✅ 产品标题已更新:', product.name);
    } else {
        console.warn('⚠️  未找到产品标题元素 (.product-title)');
    }
    
    // 设置分类标签
    const categoryBadge = document.getElementById('categoryBadge');
    if (categoryBadge) {
        const categoryText = getCategoryName(product.category);
        categoryBadge.textContent = categoryText;
    }
    
    // 设置产品型号
    const productModel = document.getElementById('productModel');
    if (productModel) {
        productModel.textContent = product.model || product.sku || product.id || '-';
    }
    
    // 设置产品品牌
    const productBrand = document.getElementById('productBrand');
    if (productBrand) {
        productBrand.textContent = product.brand || 'Diamond-Auto';
    }
    
    // 设置产品编码
    const productCode = document.getElementById('productCode');
    if (productCode) {
        productCode.textContent = product.sku || product.id || '-';
    }
    
    // 设置产地 - 使用统一翻译函数
    const productOrigin = document.getElementById('productOrigin');
    if (productOrigin) {
        const originText = getOriginText();
        productOrigin.textContent = originText;
        console.log('✅ 产地信息设置成功:', originText);
    }

    // 设置质保期
    const productWarranty = document.getElementById('productWarranty');
    if (productWarranty) {
        const warrantyText = getWarrantyText(product.warranty || '12');
        productWarranty.textContent = warrantyText;
        console.log('✅ 质保期设置成功:', warrantyText);
    }

    // 🌟 渲染产品特性标签 - 支持翻译
    const featuresContainer = document.getElementById('productFeatures');
    if (featuresContainer) {
        featuresContainer.innerHTML = '';
        const features = getProductFeatures(product);

        if (features && features.length > 0) {
            features.forEach(feature => {
                const featureTag = document.createElement('span');
                featureTag.className = 'feature-tag';

                // 直接使用特性文本（固定中文）
                featureTag.innerHTML = `<span class="feature-text">${feature}</span>`;

                featuresContainer.appendChild(featureTag);
            });
            featuresContainer.style.display = 'flex';
        } else {
            featuresContainer.style.display = 'none';
        }
    }

    // 初始化询价按钮
    const inquiryBtn = document.getElementById('inquiryBtn');
    if (inquiryBtn) {
        inquiryBtn.onclick = () => {
            const whatsappNumber = '8613656157230';
            const message = `您好，我对${product.name}感兴趣，请提供详细信息和报价。谢谢！`;
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        };
    }
}



// 🏷️ 获取产品特性
function getProductFeatures(product) {
    let features = [];

    // 🎯 优先使用数据库中的features字段
    if (product.features && product.features.trim()) {
        // 解析逗号分隔的特性字符串
        features = product.features.split(',')
            .map(feature => feature.trim())
            .filter(feature => feature.length > 0);
        
        console.log('✅ 使用数据库特性:', features);
        return features;
    }
    
    // 🔄 如果没有数据库特性，则生成默认特性
    console.log('⚠️  产品无特性数据，生成默认特性');
    
    // 添加基本特性
    if (product.warranty) {
        features.push(`${product.warranty}个月质保`);
    }
    if (product.brand) {
        features.push(`${product.brand}品牌`);
    }
    if (product.status === 'active') {
        features.push('现货供应');
    }
    
    // 添加产品类型特性
    switch (product.category) {
        case 'turbocharger':
            features.push('涡轮增压');
            features.push('动力提升');
            break;
        case 'actuator':
            features.push('精准控制');
            features.push('快速响应');
            break;
        case 'injector':
            features.push('精密喷射');
            features.push('节能环保');
            break;
        case 'turbo-parts':
            features.push('原厂品质');
            features.push('完美匹配');
            break;
    }
    
    return features;
}

// 📊 渲染技术规格
function renderProductSpecs(product) {
    const specsTab = document.getElementById('specsTab');
    if (!specsTab) return;

    let specs = '';
    
    // 检查specifications字段是否有效
    let hasValidSpecs = false;
    if (product.specifications && 
        product.specifications !== '[object Object]' && 
        typeof product.specifications === 'object' &&
        Object.keys(product.specifications).length > 0) {
        
        specs = Object.entries(product.specifications)
            .map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`)
            .join('');
        hasValidSpecs = true;
    }
    
    if (!hasValidSpecs) {
        // 生成规格表（固定中文）
        specs = `
            <tr><td>分类</td><td>${getCategoryName(product.category)}</td></tr>
            <tr><td>品牌</td><td>${product.brand || 'Diamond-Auto'}</td></tr>
            <tr><td>型号</td><td>${product.model || product.sku || '-'}</td></tr>
        `;

        // 添加OE号码信息（显示全部）
        if (product.oe_number && product.oe_number.trim()) {
            const oeNumbers = product.oe_number.split(/\r?\n/).map(oe => oe.trim()).filter(oe => oe);
            if (oeNumbers.length > 0) {
                specs += `<tr><td>OE号码</td><td>${oeNumbers.join('<br>')}</td></tr>`;
            }
        }

        // 添加适配信息（显示全部）
        if (product.compatibility && product.compatibility.trim()) {
            const compatibilityLines = product.compatibility.split(/\r?\n/).map(line => line.trim()).filter(line => line);
            if (compatibilityLines.length > 0) {
                specs += `<tr><td>适配</td><td>${compatibilityLines.join('<br>')}</td></tr>`;
            }
        }

        // 添加其他事项信息
        if (product.notes && product.notes.trim()) {
            const notesFormatted = product.notes.replace(/\r?\n/g, '<br>');
            specs += `<tr><td>其他事项</td><td>${notesFormatted}</td></tr>`;
        }

        // 添加产地和质保期
        const originText = getOriginText();
        const warrantyText = getWarrantyText(product.warranty || '12');

        specs += `
            <tr><td>产地</td><td>${originText}</td></tr>
            <tr><td>质保期</td><td>${warrantyText}</td></tr>
        `;
    }

    specsTab.innerHTML = `
        <table class="specs-table">
            <tbody>${specs}</tbody>
        </table>
    `;
}

// 🏷️ 获取分类名称（支持对象和字符串格式）
function getCategoryName(category) {
    // 如果是对象，直接返回name属性
    if (category && typeof category === 'object' && category.name) {
        return category.name;
    }

    // 如果是字符串，使用映射表
    const categoryMap = {
        'turbocharger': '涡轮增压器',
        'actuator': '执行器',
        'injector': '共轨喷油器',
        'turbo-parts': '涡轮配件',
        'others': '其他'
    };

    return categoryMap[category] || category || '未分类';
}

// 📋 渲染产品描述选项卡
function renderDescriptionTab(product) {
    const descriptionTab = document.getElementById('descriptionTab');
    if (!descriptionTab) return;

    let descriptionContent = '';
    let description = product.description;
    
    // 如果没有描述，生成默认描述
    if (!description || description.trim() === '') {
        const productName = product.name || '产品';
        const category = product.category || '';
        
        if (category === 'turbocharger') {
            description = `${productName}是一款高性能涡轮增压器，采用先进的制造工艺，确保优异的增压效果和可靠性。适用于多种发动机型号，提供卓越的动力提升和燃油经济性。`;
        } else if (category === 'actuator') {
            description = `${productName}是一款精密执行器，具有快速响应和精确控制的特点。采用高品质材料制造，确保长期稳定运行和精准的控制性能。`;
        } else if (category === 'injector') {
            description = `${productName}是一款高精度共轨喷油器，提供精确的燃油喷射控制。采用先进的喷射技术，确保发动机的高效燃烧和低排放。`;
        } else if (category === 'turbo-parts') {
            description = `${productName}是专业的涡轮增压器配件，具有高品质和可靠性。严格按照原厂规格制造，确保与原装部件的完美匹配和长期使用。`;
        } else {
            description = `${productName}是无锡皇德国际贸易有限公司的优质产品之一，采用高品质材料制造，确保产品的可靠性和耐用性。我们提供专业的技术支持和完善的售后服务。`;
        }
    }
    
    // 处理换行符，将 \r\n 和 \n 转换为 <br> 标签
    const formattedDescription = description
        .replace(/\r\n/g, '<br>')
        .replace(/\n/g, '<br>');
    
    descriptionContent = `
        <div class="product-description-content">
            <h3>产品描述</h3>
            <div class="description-text">
                ${formattedDescription}
            </div>
        </div>
    `;
    
    descriptionTab.innerHTML = descriptionContent;
}

// 📦 渲染包装信息
function renderPackaging(product) {
    const packagingTab = document.getElementById('packagingTab');
    if (!packagingTab) return;

    // 包装信息（固定中文）
    const packagingContent = `
        <h3>包装信息</h3>
        <div class="packaging-info">
            <div class="packaging-item">
                <strong>包装方式</strong>
                <span>专业防震包装，确保产品安全</span>
            </div>
            <div class="packaging-item">
                <strong>发货时间</strong>
                <span>现货1-3天，定制7-15天</span>
            </div>
            <div class="packaging-item">
                <strong>物流方式</strong>
                <span>DHL、FedEx、UPS等国际快递</span>
            </div>
            <div class="packaging-item">
                <strong>质保期</strong>
                <span>${product.warranty || '12'}个月质保</span>
            </div>
        </div>
    `;

    packagingTab.innerHTML = packagingContent;
}

// 💬 初始化询价功能
function initInquireFunction(product) {
    // 设置全局产品变量，供询价表单使用
    window.currentProduct = product;
    
    // 立即询价按钮 (WhatsApp)
    const inquireBtn = document.getElementById('inquireBtn');
    if (inquireBtn) {
        inquireBtn.onclick = () => {
            const whatsappNumber = '8613656157230';
            const message = `您好，我对${product.name}感兴趣，请提供详细信息和报价。谢谢！`;
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        };
    }

    // 邮件询价按钮
    const emailBtn = document.getElementById('emailBtn');
    if (emailBtn) {
        emailBtn.onclick = openInquiryModal;
    }
}

// 🔍 图片放大功能
function openImageModal(imgSrc) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    if (!modal || !modalImage) return;
    
    modalImage.src = imgSrc;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // 添加左右切换按钮（如果有多张图片）
    if (window.productImages && window.productImages.length > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'modal-nav-btn prev-btn';
        prevBtn.innerHTML = '&#10094;';
        prevBtn.onclick = prevImage;

        const nextBtn = document.createElement('button');
        nextBtn.className = 'modal-nav-btn next-btn';
        nextBtn.innerHTML = '&#10095;';
        nextBtn.onclick = nextImage;

        modal.appendChild(prevBtn);
        modal.appendChild(nextBtn);
    }
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (!modal) return;
    
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';

    // 移除导航按钮
    const prevBtn = modal.querySelector('.prev-btn');
    const nextBtn = modal.querySelector('.next-btn');
    if (prevBtn) prevBtn.remove();
    if (nextBtn) nextBtn.remove();
}

// 切换到上一张图片
function prevImage() {
    if (!window.productImages || !window.productImages.length) return;
    
    window.currentImageIndex = (window.currentImageIndex - 1 + window.productImages.length) % window.productImages.length;
    const modalImage = document.getElementById('modalImage');
    if (modalImage) {
        modalImage.src = window.productImages[window.currentImageIndex];
    }
}

// 切换到下一张图片
function nextImage() {
    if (!window.productImages || !window.productImages.length) return;
    
    window.currentImageIndex = (window.currentImageIndex + 1) % window.productImages.length;
    const modalImage = document.getElementById('modalImage');
    if (modalImage) {
        modalImage.src = window.productImages[window.currentImageIndex];
    }
}

// 📊 标签页切换功能
function initTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));
            
            button.classList.add('active');
            const targetPanel = document.getElementById(targetTab + 'Tab');
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
}

// 🎯 错误提示
function showError(title, message) {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }

    const container = document.createElement('div');
    container.className = 'error-container';
    container.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <h2>${title}</h2>
        <p>${message}</p>
        <a href="products.html">
            <i class="fas fa-arrow-left"></i>
            返回产品列表
        </a>
    `;

    document.querySelector('main').appendChild(container);
}

// 💬 通知功能
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#007bff'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 10000;
        font-weight: 600;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 🔍 查找指定ID的产品
function findProductById(products, targetId) {
    // 确保ID是字符串类型进行比较
    targetId = String(targetId);
    
    console.log('Looking for product with ID:', targetId);
    
    const product = products.find(p => {
        const productId = String(p.id);
        const match = productId === targetId;
        if (match) {
            console.log('Found matching product:', p);
        }
        return match;
    });
    
    if (!product) {
        console.log('No product found with ID:', targetId);
    }
    
    return product;
}

// 🚀 初始化产品详情页
async function initProductDetail() {
    try {
        const product = await loadProductData();
        renderProductDetail(product);
    } catch (error) {
        console.error('初始化产品详情页失败:', error);
    }
}

// 获取相关产品
async function getRelatedProducts(currentProduct) {
    try {
        // 🌐 使用数据库API获取所有产品
        const response = await fetch('/api/db/public/products?limit=1000');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        const allProducts = result.data || result.products || result || [];

        // 过滤掉当前产品
        const otherProducts = allProducts.filter(p => p.id !== currentProduct.id);

        // 随机打乱数组
        const shuffledProducts = otherProducts.sort(() => Math.random() - 0.5);

        // 取前12个产品（3组，每组4个）
        return shuffledProducts.slice(0, 12);
    } catch (error) {
        console.error('获取随机推荐产品失败:', error);
        return [];
    }
}

// 渲染相关产品
async function renderRelatedProducts(currentProduct) {
    try {
        const relatedProducts = await getRelatedProducts(currentProduct);
        const relatedProductsContainer = document.getElementById('relatedProducts');
        
        if (!relatedProducts || relatedProducts.length === 0) {
            relatedProductsContainer.style.display = 'none';
            return;
        }

        // 清空容器并添加基础结构
        relatedProductsContainer.innerHTML = `
            <div class="carousel-track"></div>
            <button class="carousel-button prev" aria-label="Previous">
                <i class="fas fa-chevron-left"></i>
            </button>
            <button class="carousel-button next" aria-label="Next">
                <i class="fas fa-chevron-right"></i>
            </button>
            <div class="carousel-indicators"></div>
        `;

        const carouselTrack = relatedProductsContainer.querySelector('.carousel-track');
        const indicators = relatedProductsContainer.querySelector('.carousel-indicators');

        // 将产品分组（每组4个）
        const groups = [];
        for (let i = 0; i < relatedProducts.length; i += 4) {
            groups.push(relatedProducts.slice(i, i + 4));
        }

        // 创建并添加所有产品组
        groups.forEach((group, groupIndex) => {
            const gridDiv = document.createElement('div');
            gridDiv.className = 'products-grid';
            if (groupIndex === 0) {
                gridDiv.classList.add('active');
            }
            
            // 添加产品卡片
            group.forEach(product => {
                gridDiv.appendChild(createProductCard(product));
            });

            carouselTrack.appendChild(gridDiv);

            // 添加指示器
            const indicator = document.createElement('button');
            indicator.className = 'carousel-indicator';
            if (groupIndex === 0) {
                indicator.classList.add('active');
            }
            indicator.onclick = () => showGroup(groupIndex);
            indicators.appendChild(indicator);
        });

        // 添加按钮事件监听
        const prevButton = relatedProductsContainer.querySelector('.carousel-button.prev');
        const nextButton = relatedProductsContainer.querySelector('.carousel-button.next');
        
        // 确保按钮可见性
        if (groups.length > 1) {
            prevButton.style.display = 'flex';
            nextButton.style.display = 'flex';
            prevButton.onclick = prevGroup;
            nextButton.onclick = nextGroup;
            // 启动自动轮播
            startCarousel();
        } else {
            prevButton.style.display = 'none';
            nextButton.style.display = 'none';
        }

        // 显示相关产品容器
        relatedProductsContainer.style.display = 'block';
        
        // 相关产品渲染完成
        console.log('✅ 相关产品渲染完成');
        
    } catch (error) {
        console.error('渲染相关产品失败:', error);
    }
}

// 创建产品卡片 - 使用统一产品卡片管理器
function createProductCard(product) {
    // 确保统一产品卡片管理器已加载
    if (!window.productCardManager) {
        window.productCardManager = new ProductCardManager();
    }
    
    // 使用统一的推荐卡片生成方法，获取HTML字符串
    const cardHtml = window.productCardManager.createRecommendCard(product, {
        imagePath: '../',  // 🔥 修复：正确的图片路径
        detailPath: 'product-detail.html'
    });
    
    // 🔥 修复：创建临时容器来解析HTML字符串为DOM元素
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cardHtml;
    
    // 返回第一个子元素（产品卡片）
    return tempDiv.firstElementChild;
}

// 显示指定组
function showGroup(index) {
    const grids = document.querySelectorAll('.products-grid');
    const indicators = document.querySelectorAll('.carousel-indicator');

    if (!grids.length || !indicators.length) return;

    grids.forEach(grid => grid.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));

    grids[index].classList.add('active');
    indicators[index].classList.add('active');
    currentGroup = index;
}

// 🌍 统一的语言切换处理函数
function handleLanguageChange(event) {
    console.log('🌍 产品详情页监听到语言切换事件:', event.detail);

    if (window.currentProduct) {
        console.log('🔄 重新渲染产品详情页面内容...');

        // 更新面包屑导航
        updateBreadcrumbNavigation(window.currentProduct);

        // 更新分类标签
        const categoryBadge = document.getElementById('categoryBadge');
        if (categoryBadge) {
            const categoryText = getCategoryName(window.currentProduct.category);
            categoryBadge.textContent = categoryText;
        }

        // 更新产地和保修期 - 使用统一翻译函数
        const productOrigin = document.getElementById('productOrigin');
        if (productOrigin) {
            const originText = getOriginText();
            productOrigin.textContent = originText;
        }

        const productWarranty = document.getElementById('productWarranty');
        if (productWarranty) {
            const warrantyText = getWarrantyText(window.currentProduct.warranty || '12');
            productWarranty.textContent = warrantyText;
        }

        // 重新渲染产品特性标签
        const featuresContainer = document.getElementById('productFeatures');
        if (featuresContainer) {
            featuresContainer.innerHTML = '';
            const features = getProductFeatures(window.currentProduct);

            if (features && features.length > 0) {
                features.forEach(feature => {
                    const featureTag = document.createElement('span');
                    featureTag.className = 'feature-tag';

                    // 直接使用特性文本（固定中文）
                    featureTag.innerHTML = `<i class="fas fa-check"></i><span class="feature-text">${feature}</span>`;

                    featuresContainer.appendChild(featureTag);
                });
            }
        }

        // 重新渲染技术规格表格
        renderProductSpecs(window.currentProduct);

        // 重新渲染包装信息
        renderPackaging(window.currentProduct);

        // 重新渲染产品描述
        renderDescriptionTab(window.currentProduct);

        // 重新渲染相关产品卡片
        console.log('🏷️ 重新渲染相关产品卡片...');
        setTimeout(() => {
            renderRelatedProducts(window.currentProduct);
            console.log('✅ 产品详情页面内容已重新渲染');
        }, 200);
    }

}

// 下一组
function nextGroup() {
    const grids = document.querySelectorAll('.products-grid');
    if (!grids.length) return;
    currentGroup = (currentGroup + 1) % grids.length;
    showGroup(currentGroup);
}

// 上一组
function prevGroup() {
    const grids = document.querySelectorAll('.products-grid');
    if (!grids.length) return;
    currentGroup = (currentGroup - 1 + grids.length) % grids.length;
    showGroup(currentGroup);
}

// 启动轮播
let carouselInterval;
let currentGroup = 0;

function startCarousel() {
    // 清除现有的定时器
    if (carouselInterval) {
        clearInterval(carouselInterval);
    }
    
    const carousel = document.querySelector('.carousel-track');
    if (!carousel) return;
    
    const grids = document.querySelectorAll('.products-grid');
    if (grids.length <= 1) return; // 只有一组或没有产品时不启动轮播
    
    // 设置定时器，每5秒切换一次
    carouselInterval = setInterval(nextGroup, 5000);
    
    // 鼠标悬停时暂停轮播
    carousel.addEventListener('mouseenter', () => {
        clearInterval(carouselInterval);
    });
    
    // 鼠标离开时恢复轮播
    carousel.addEventListener('mouseleave', () => {
        carouselInterval = setInterval(nextGroup, 5000);
    });
}

// 🚀 页面加载完成后初始化 - 统一初始化入口
document.addEventListener('DOMContentLoaded', function() {
    initProductDetail();
    initSearch();
    console.log('✅ 产品详情页所有功能初始化完成');
});

// 💬 快速询价功能（全局函数，供产品卡片调用）
function quickInquiry(productId, productName) {
    console.log('💬 快速询价:', productId, productName);
    
    // 构建WhatsApp消息
    const message = `我对以下产品感兴趣，请提供报价信息：

🔧 产品名称：${productName}
🆔 产品ID：${productId}
🌐 产品链接：${window.location.origin}/pages/product-detail.html?id=${productId}

请回复产品的详细报价和技术信息，谢谢！`;
    
    // 获取WhatsApp号码
    const whatsappNumber = '8613656157230'; // 默认WhatsApp号码
    
    // 构建WhatsApp URL
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    
    // 打开WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // 发送分析事件
    if (window.gtag) {
        gtag('event', 'quick_inquiry', {
            event_category: 'engagement',
            event_label: productName,
            value: productId
        });
    }
}

// 🌐 确保函数全局可访问
window.quickInquiry = quickInquiry;

// ⌨️ 键盘快捷键支持
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeImageModal();
    }
});

// 🔍 搜索功能
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    if (searchInput && searchBtn) {
        function performSearch() {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `products.html?search=${encodeURIComponent(query)}`;
            }
        }

        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
}

// 搜索功能已在统一初始化中调用，移除重复监听器


// 🔗 分享功能 - 简化版本
function initShareFeatures() {
    const shareBtn = document.getElementById('shareBtn');
    const shareModal = document.getElementById('shareModal');
    const closeBtn = document.querySelector('.share-modal-close');
    
    if (!shareBtn || !shareModal || !closeBtn) {
        console.warn('⚠️  分享功能初始化失败：找不到必要元素');
        return;
    }

    // 显示分享弹窗
    shareBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        shareModal.classList.add('show');
        console.log('✅ 显示分享模态框');
    });

    // 关闭分享弹窗
    closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        shareModal.classList.remove('show');
        console.log('✅ 关闭分享模态框');
    });

    // 点击遮罩层关闭弹窗
    shareModal.addEventListener('click', (e) => {
        if (e.target === shareModal) {
            shareModal.classList.remove('show');
            console.log('✅ 点击遮罩关闭分享模态框');
        }
    });

    // 处理分享选项点击
    const shareOptions = shareModal.querySelectorAll('.share-option');
    shareOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const platform = option.getAttribute('data-platform');
            const currentUrl = window.location.href;
            const productTitle = document.querySelector('.product-title').textContent;
            const description = `推荐产品：${productTitle}`;

            console.log('🔗 分享到:', platform);

            switch (platform) {
                case 'facebook':
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, 
                        'facebook-share', 'width=580,height=296');
                    break;
                case 'twitter':
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(description)}&url=${encodeURIComponent(currentUrl)}`,
                        'twitter-share', 'width=550,height=235');
                    break;
                case 'linkedin':
                    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
                        'linkedin-share', 'width=600,height=600');
                    break;
                case 'copy':
                    navigator.clipboard.writeText(currentUrl).then(() => {
                        showNotification('链接已复制到剪贴板！', 'success');
                        const originalHtml = option.innerHTML;
                        option.innerHTML = '<i class="fas fa-check"></i>已复制';
                        setTimeout(() => {
                            option.innerHTML = originalHtml;
                        }, 2000);
                    }).catch(err => {
                        console.error('复制失败:', err);
                        showNotification('复制失败，请手动复制链接', 'error');
                    });
                    break;
            }

            // 分享后延迟关闭弹窗
            setTimeout(() => {
                shareModal.classList.remove('show');
            }, 500);
        });
    });
    
    console.log('✅ 分享功能初始化完成');
}

// 更新产品详情页面的信息
function updateProductDetails(product) {
    if (!product) {
        console.error('产品数据为空');
        return;
    }

    console.log('正在更新产品详情:', product);

    try {
        // 更新产品型号
        document.getElementById('productModel').textContent = product.model || '-';
        
        // 更新产品基本属性
        document.getElementById('productBrand').textContent = product.brand || 'Diamond-Auto';
        document.getElementById('productCode').textContent = product.sku || '-';

        // 使用统一翻译函数更新产地
        const productOrigin = document.getElementById('productOrigin');
        if (productOrigin) {
            const originText = getOriginText();
            productOrigin.textContent = originText;
        }

        // 使用统一翻译函数更新保修期
        const productWarranty = document.getElementById('productWarranty');
        if (productWarranty) {
            const warrantyText = getWarrantyText(product.warranty || '12');
            productWarranty.textContent = warrantyText;
        }
        
        // 更新产品特性
        const featuresContainer = document.getElementById('productFeatures');
        featuresContainer.innerHTML = ''; // 清空现有内容
        
        if (product.features && product.features.length > 0) {
            let features = Array.isArray(product.features) ? product.features : product.features.split(',');
            
            features.forEach(feature => {
                if (feature.trim()) {
                    const tag = document.createElement('span');
                    tag.className = 'tag';
                    tag.innerHTML = `<i class="fas fa-check"></i>${feature.trim()}`;
                    featuresContainer.appendChild(tag);
                }
            });
        }

    } catch (error) {
        console.error('更新产品详情时出错:', error);
    }
}

// 获取产品详情数据
async function fetchProductDetails(productId) {
    try {
        const response = await fetch(`/api/db/public/products/${productId}`);
        if (!response.ok) {
            throw new Error('产品数据获取失败');
        }
        const product = await response.json();
        
        // 使用产品数据更新页面
        updateProductDetails(product);
    } catch (error) {
        console.error('获取产品详情失败:', error);
        // 显示错误提示
        alert('获取产品信息失败，请稍后重试');
    }
}

// 📧 询价表单相关功能
function openInquiryModal() {
    const modal = document.getElementById('inquiryModal');
    modal.classList.add('active');

    // 预填当前产品信息
    const currentProduct = window.currentProduct;
    if (currentProduct) {
        fillInquiryMessage(currentProduct);
    }
}

// 填充询价消息（固定中文）
function fillInquiryMessage(product) {
    const messageTextarea = document.getElementById('inquiryMessage');
    if (!messageTextarea) return;

    // 使用固定中文消息
    const defaultMessage = `我对以下产品感兴趣：
产品名称：${product.name}
产品型号：${product.model || '未指定'}
产品编号：${product.sku || product.id || '未指定'}
请提供更多详细信息和报价。`;

    messageTextarea.value = defaultMessage;
}



function closeInquiryModal() {
    const modal = document.getElementById('inquiryModal');
    modal.classList.remove('active');
}

// 询价模态框的语言切换处理已合并到统一的 handleLanguageChange 函数中



// 初始化询价表单事件监听器
function initInquiryFormEvents() {
    const inquiryForm = document.getElementById('inquiryForm');
    if (!inquiryForm) {
        console.error('找不到询价表单元素');
        return;
    }

    // 处理询价表单提交
    inquiryForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = this.querySelector('.submit-btn');
        if (!submitBtn) {
            console.error('找不到提交按钮');
            return;
        }
        
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 发送中...';
        submitBtn.disabled = true;

        try {
            const formData = {
                name: document.getElementById('inquiryName').value,
                email: document.getElementById('inquiryEmail').value,
                phone: document.getElementById('inquiryPhone').value,
                message: document.getElementById('inquiryMessage').value,
                productInfo: window.currentProduct || null,
                source: 'product_detail_form', // 产品详情页表单来源
                sourceDetails: {
                    page: window.location.pathname,
                    productId: window.currentProduct?.id || null,
                    productName: window.currentProduct?.name || null,
                    referrer: document.referrer || 'direct',
                    timestamp: new Date().toISOString()
                }
            };

            const response = await fetch('/api/inquiries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('发送询价信息失败');
            }

            // 显示成功提示
            showToast('询价信息已发送成功', 'success');
            
            // 重置表单
            inquiryForm.reset();
            
            // 关闭询价窗口
            const modal = document.getElementById('inquiryModal');
            modal.classList.remove('active');

        } catch (error) {
            console.error('发送询价信息时出错:', error);
            showToast('发送询价信息失败，请稍后重试', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// 显示提示信息
function showToast(message, type = 'info') {
    // 创建提示元素
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            ${type === 'success' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-circle"></i>'}
            <span>${message}</span>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(toast);
    
    // 添加显示类
    setTimeout(() => toast.classList.add('show'), 100);
    
    // 3秒后自动移除
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
} 
