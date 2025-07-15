// 全局变量
let currentPage = 'dashboard';
let products = [];
let categories = [];
let logs = [];
let selectedFiles = [];
let selectedImages = [];

// 分页相关变量
let currentPageNum = 1;
let currentPageSize = 24;
let totalPages = 1;
let totalProducts = 0;
let currentFilters = {
    search: '',
    category: '',
    status: '',
    sortBy: 'id',
    sortOrder: 'desc'
};

// 拖拽处理函数的全局变量
let draggedElement = null;
let draggedIndex = null;

// 预设的产品特性
const presetFeatures = [
    '原厂品质',
    '钻石品质',
    '高性能',
    '精准控制',
    '精密喷射',
    '配件齐全',
    '专业工具',
    '高端产品',
    '现货充足',
    '原厂正品',
    '高精度',
    '长寿命'
];

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
});

// 检查认证状态
async function checkAuthStatus() {
    try {
        console.log('🔍 开始检查认证状态...');

        const response = await fetch('/api/auth/check', {
            method: 'GET',
            credentials: 'include',
            cache: 'no-cache' // 🔧 禁用缓存，确保获取最新状态
        });

        console.log('📡 认证检查响应:', response.status, response.statusText);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ 认证成功，用户信息:', result.user);

            // 已登录，初始化应用
            initializeApp();
            initFeatureTags();
            setupSEOGenerators();
        } else {
            console.log('❌ 认证失败，状态码:', response.status);
            // 未登录，重定向到登录页
            window.location.href = '/admin/login.html';
        }
    } catch (error) {
        console.error('💥 认证检查失败:', error);
        // 网络错误也重定向到登录页
        window.location.href = '/admin/login.html';
    }
}

// 应用初始化
function initializeApp() {
    setupEventListeners();
    loadCategories();
    loadProducts();
    loadLogs();
    loadInquiriesCount(); // 添加询价统计加载
    updateStats();
    updateGeoStats(); // 添加地理位置统计初始化
    checkAdminPermissions(); // 检查管理员权限
    showPage('dashboard');
}

// 设置事件监听器
function setupEventListeners() {
    // 产品名称字符计数
    const productNameInput = document.getElementById('product-name');
    const charCountDisplay = document.getElementById('name-char-count');
    
    if (productNameInput && charCountDisplay) {
        productNameInput.addEventListener('input', function() {
            const currentLength = this.value.length;
            const maxLength = this.getAttribute('maxlength');
            charCountDisplay.textContent = `${currentLength}/${maxLength}`;
            
            // 当接近字符限制时添加警告样式
            if (currentLength >= maxLength - 20) {
                charCountDisplay.classList.add('text-warning');
            } else {
                charCountDisplay.classList.remove('text-warning');
            }
            
            // 达到字符限制时添加危险样式
            if (currentLength >= maxLength) {
                charCountDisplay.classList.add('text-danger');
            } else {
                charCountDisplay.classList.remove('text-danger');
            }
        });
    }

    // 导航点击
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            showPage(page);
        });
    });

    // 文件上传
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('product-images');
    
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = '#2563eb';
            this.style.backgroundColor = '#f0f9ff';
        });
        
        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.borderColor = '#cbd5e1';
            this.style.backgroundColor = '';
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = '#cbd5e1';
            this.style.backgroundColor = '';
            
            const files = e.dataTransfer.files;
            handleFileSelection(files);
        });
        
        fileInput.addEventListener('change', function(e) {
            handleFileSelection(e.target.files);
        });
    }

    // 产品表单提交
    const productForm = document.getElementById('add-product-form');
    if (productForm) {
        productForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitProduct();
        });
    }

    // 添加分类表单提交
    const addCategoryForm = document.getElementById('add-category-form');
    if (addCategoryForm) {
        addCategoryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitCategory();
        });
    }

    // 编辑分类表单提交
    const editCategoryForm = document.getElementById('edit-category-form');
    if (editCategoryForm) {
        editCategoryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateCategory();
        });
    }

    // 搜索和筛选
    const searchInput = document.getElementById('search-products');
    const categoryFilter = document.getElementById('filter-category');
    const statusFilter = document.getElementById('filter-status');
    const logFilter = document.getElementById('log-filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', filterProducts);
    }
    if (logFilter) {
        logFilter.addEventListener('change', filterLogs);
    }

    // 设置产品分类变化监听器
    setupProductCategoryListeners();
}

// 设置产品分类变化监听器
function setupProductCategoryListeners() {
    // 产品分类变化监听器 - 自动重新生成产品描述
    const productCategorySelect = document.getElementById('product-category');
    if (productCategorySelect) {
        // 移除之前的监听器（如果存在）
        productCategorySelect.removeEventListener('change', handleProductCategoryChange);
        // 添加新的监听器
        productCategorySelect.addEventListener('change', handleProductCategoryChange);
    }

    // 编辑模式下的产品分类变化监听器
    const editProductCategorySelect = document.getElementById('editProductCategory');
    if (editProductCategorySelect) {
        // 移除之前的监听器（如果存在）
        editProductCategorySelect.removeEventListener('change', handleEditProductCategoryChange);
        // 添加新的监听器
        editProductCategorySelect.addEventListener('change', handleEditProductCategoryChange);
    }
}

// 处理添加产品页面的分类变化
function handleProductCategoryChange() {
    // 检查是否有产品名称，如果有则自动重新生成描述
    const productName = document.getElementById('product-name').value;
    if (productName && productName.trim()) {
        // 延迟一点执行，确保分类值已更新
        setTimeout(() => {
            generateProductDescription();
            showToast('产品分类已更改，描述已自动更新', 'info');
        }, 100);
    } else {
        // 如果没有产品名称，提示用户先输入产品名称
        showToast('请先输入产品名称，然后选择分类以自动生成描述', 'warning');
    }
}

// 处理编辑产品页面的分类变化
function handleEditProductCategoryChange() {
    // 检查是否有产品名称，如果有则自动重新生成描述
    const productName = document.getElementById('editProductName').value;
    if (productName && productName.trim()) {
        // 延迟一点执行，确保分类值已更新
        setTimeout(() => {
            generateEditProductDescription();
            showToast('产品分类已更改，描述已自动更新', 'info');
        }, 100);
    } else {
        // 如果没有产品名称，提示用户先输入产品名称
        showToast('请先输入产品名称，然后选择分类以自动生成描述', 'warning');
    }
}

// 页面切换
function showPage(page) {
    // 隐藏所有页面
    document.querySelectorAll('.page-content').forEach(el => {
        el.style.display = 'none';
    });
    
    // 移除所有导航激活状态
    document.querySelectorAll('.nav-link').forEach(el => {
        el.classList.remove('active');
    });
    
    // 显示目标页面
    const targetPage = document.getElementById(page + '-page');
    if (targetPage) {
        targetPage.style.display = 'block';
    }
    
    // 激活导航
    const targetNav = document.querySelector(`[data-page="${page}"]`);
    if (targetNav) {
        targetNav.classList.add('active');
    }
    
    currentPage = page;
    
    // 页面特定初始化
    if (page === 'products') {
        // 使用分页加载产品
        loadProductsWithPagination(1, true);
    } else if (page === 'add-product') {
        loadCategoriesForForm();
        // 重新设置产品分类变化监听器
        setupProductCategoryListeners();
    } else if (page === 'categories') {
        // 如果分类数据还没加载，先加载再渲染
        if (categories.length === 0) {
            loadCategories().then(() => renderCategories());
        } else {
            renderCategories();
        }
    } else if (page === 'logs') {
        renderLogs();
    } else if (page === 'inquiries') {
        initInquiryManagement();
    } else if (page === 'admins') {
        loadAdmins();
    }
}

// 加载分类数据
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        if (response.ok) {
            categories = await response.json();
            populateCategoryFilters();
            // 如果当前在分类管理页面，重新渲染分类列表
            if (currentPage === 'categories') {
                renderCategories();
            }
        }
    } catch (error) {
        console.error('加载分类失败:', error);
        showToast('加载分类失败', 'error');
    }
}

// 加载产品数据（分页版本）
async function loadProductsWithPagination(page = 1, resetPage = false) {
    if (resetPage) {
        currentPageNum = 1;
        page = 1;
    } else {
        currentPageNum = page;
    }
    
    try {
        // 显示加载状态
        showProductsLoading();
        
        // 获取筛选参数
        updateFiltersFromUI();
        
        // 构建查询参数
        const params = new URLSearchParams({
            page: currentPageNum,
            limit: currentPageSize,
            search: currentFilters.search,
            category: currentFilters.category,
            status: currentFilters.status,
            sortBy: currentFilters.sortBy,
            sortOrder: currentFilters.sortOrder
        });
        
        const response = await fetch(`/api/products?${params}`);
        if (response.ok) {
            const result = await response.json();
            
            // 更新全局变量
            products = result.data;
            totalPages = result.pagination.total;
            totalProducts = result.pagination.totalItems;
            
            // 渲染产品列表
            renderProducts();
            
            // 渲染分页组件
            renderPagination(result.pagination);
            
            // 更新产品信息显示
            updateProductsInfo(result.pagination);
            
            // 更新统计数据
            updateStats();
            
        } else {
            throw new Error('获取产品数据失败');
        }
    } catch (error) {
        console.error('加载产品失败:', error);
        showToast('加载产品失败，请重试', 'error');
        showProductsError();
    } finally {
        hideProductsLoading();
    }
}

// 兼容性：保留原有的 loadProducts 函数
async function loadProducts() {
    if (currentPage === 'products') {
        await loadProductsWithPagination(1, true);
    } else {
        // 对于非产品页面，仍然使用简单加载（仅用于统计）
        try {
            const response = await fetch('/api/products?limit=1');
            if (response.ok) {
                const result = await response.json();
                totalProducts = result.pagination.totalItems;
                updateStats();
            }
        } catch (error) {
            console.error('加载产品统计失败:', error);
        }
    }
}

// 格式化操作类型显示
function formatActionType(action) {
    const actionMap = {
        'view_product': '查看产品',
        'update_inquiry_status': '更新询价状态',
        'delete_inquiry': '删除询价',
        'create_inquiry': '新建询价',
        'update_product': '更新产品',
        'delete_product': '删除产品',
        'create_product': '新建产品'
    };
    return actionMap[action] || action;
}

// 格式化操作描述
function formatActionDescription(log) {
    let description = '';
    
    switch(log.action) {
        case 'view_product':
            description = `查看产品：${log.details.productName}`;
            break;
        case 'update_inquiry_status':
            description = `询价状态从"${log.details.oldStatus}"更新为"${log.details.newStatus}"`;
            break;
        case 'delete_inquiry':
            description = `删除询价记录：${log.details.inquiry_id}`;
            break;
        case 'create_inquiry':
            description = `新建询价：${log.details.productName}`;
            break;
        case 'update_product':
            description = `更新产品：${log.details.productName}`;
            break;
        case 'delete_product':
            description = `删除产品：${log.details.productName}`;
            break;
        case 'create_product':
            description = `新建产品：${log.details.productName}`;
            break;
        default:
            description = JSON.stringify(log.details);
    }
    
    return description;
}

// 格式化操作记录
function formatLogEntry(log) {
    // 格式化时间
    const date = new Date(log.timestamp);
    const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    // 基本信息
    let operator = log.user || '管理员';
    let action = '';
    let sku = '';
    let change = '';
    
    switch(log.action) {
        case 'view_product':
            action = '查看产品';
            sku = log.details.productId || '-';
            change = '-';
            break;
            
        case 'update_inquiry_status':
            action = '更新询价';
            sku = log.details.inquiryId || '-';
            change = `${log.details.oldStatus} → ${log.details.newStatus}`;
            break;
            
        case 'delete_inquiry':
            action = '删除询价';
            sku = log.details.inquiry_id || '-';
            change = '已删除';
            break;
            
        case 'create_inquiry':
            action = '新询价';
            sku = log.details.productId || '-';
            change = log.details.quantity ? `数量: ${log.details.quantity}` : '-';
            break;
            
        case 'update_product':
            action = '更新产品';
            sku = log.details.sku || '-';
            change = log.details.changes || '-';
            break;
            
        case 'delete_product':
            action = '删除产品';
            sku = log.details.sku || '-';
            change = '已删除';
            break;
            
        default:
            action = log.action;
            sku = '-';
            change = '-';
    }
    
    return { time, operator, action, sku, change };
}

// 加载操作记录
async function loadLogs() {
    try {
        const response = await fetch('/api/logs');
        const logs = await response.json();
        
        const logsTableBody = document.querySelector('#logs-table tbody');
        logsTableBody.innerHTML = '';
        
        logs.forEach(log => {
            const { time, operator, action, sku, change } = formatLogEntry(log);
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td class="px-3 py-2">${time}</td>
                <td class="px-3 py-2">${operator}</td>
                <td class="px-3 py-2">${action}</td>
                <td class="px-3 py-2">${sku}</td>
                <td class="px-3 py-2">${change}</td>
            `;
            
            logsTableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('加载操作记录失败:', error);
        showToast('加载操作记录失败', 'error');
    }
}

// 加载询价统计数据
async function loadInquiriesCount() {
    try {
        const response = await fetch('/api/inquiries');
        if (response.ok) {
            const inquiries = await response.json();
            // 更新待处理询价数量
            const pendingCount = inquiries.filter(inquiry => inquiry.status === 'pending').length;
            const countElement = document.getElementById('pending-inquiries-count');
            if (countElement) {
                countElement.textContent = pendingCount;
            }
        }
    } catch (error) {
        console.error('加载询价统计失败:', error);
    }
}

// 注意：updateStats 函数已移动到文件末尾的分页功能区域，以支持分页统计

// 更新分析数据统计
async function updateAnalyticsStats() {
    try {
        // 加载分析数据
        const response = await fetch('/data/analytics.json');
        const data = await response.json();
        
        // 获取今天的日期
        const today = new Date().toISOString().split('T')[0];
        const todayStats = data.daily_stats[today] || getDefaultDayStats();
        
        // 更新仪表盘数据
        updateDashboardStats(todayStats);
        
        // 更新图表（如果需要）
        await updateAnalyticsCharts(data);
        
    } catch (error) {
        console.error('加载分析数据失败:', error);
        // 显示默认数据
        updateDashboardStats(getDefaultDayStats());
        // 尝试单独更新咨询来源统计
        await updateInquirySourcesChart();
    }
}

// 获取默认日统计数据
function getDefaultDayStats() {
    return {
        page_views: 0,
        unique_visitors: 0,
        product_clicks: 0,
        inquiries: 0,
        conversion_rate: 0,
        bounce_rate: 0,
        avg_session_duration: 0
    };
}

// 统一获取今日询价数量的函数
async function getTodayInquiriesCount() {
    try {
        const response = await fetch('/api/inquiries');
        if (!response.ok) {
            throw new Error('获取询价数据失败');
        }
        const inquiries = await response.json();

        // 获取今天的日期（去掉时间部分）
        const today = new Date().toISOString().split('T')[0];

        // 过滤出今天的询价数量
        const todayInquiries = inquiries.filter(inquiry =>
            inquiry.createdAt.split('T')[0] === today
        ).length;

        return todayInquiries;
    } catch (error) {
        console.error('获取今日询价数量失败:', error);
        return 0;
    }
}

// 更新仪表盘统计
async function updateDashboardStats(stats) {
    // 查找仪表盘统计卡片
    const dashboardCards = document.querySelectorAll('#dashboard-page .stats-number');

    if (dashboardCards.length >= 4) {
        dashboardCards[0].textContent = stats.page_views || 0; // 今日访问
        dashboardCards[1].textContent = stats.product_clicks || 0; // 产品点击

        // 获取当天的询价数量 - 统一使用实际询价数据计算
        try {
            const todayInquiries = await getTodayInquiriesCount();

            // 更新今日询价数量
            dashboardCards[2].textContent = todayInquiries;

            // 计算转化率：今日询价数 / 今日页面访问数 * 100%
            const pageViews = stats.page_views || 0;
            const conversionRate = pageViews > 0 ? (todayInquiries / pageViews * 100) : 0;

            // 更新转化率，保留两位小数
            dashboardCards[3].textContent = conversionRate.toFixed(2) + '%';

        } catch (error) {
            console.error('获取今日询价数量失败:', error);
            dashboardCards[2].textContent = '0';
            dashboardCards[3].textContent = '0.0%';
        }
    }
}

// 更新分析图表
async function updateAnalyticsCharts(data) {
    // 获取今天的数据
    const today = new Date().toISOString().split('T')[0];
    const todayStats = data.daily_stats[today];

    if (!todayStats) return;

    // 更新数据概览卡片
    await updateOverviewCards(todayStats);
    
    // 更新热门产品列表
    updateTopProductsList(todayStats.top_products || []);
    
    // 更新小时趋势图表
    if (todayStats.hourly_data) {
        updateHourlyChart(todayStats.hourly_data);
    }
    
    // 更新流量来源统计图表
    if (todayStats.traffic_sources) {
        updateTrafficSourcesChart(todayStats.traffic_sources);
    }
    
    // 更新咨询来源统计图表（使用真实数据）
    await updateInquirySourcesChart();
}

// 更新数据概览卡片
async function updateOverviewCards(todayStats) {
    // 更新页面访问量
    const pageViewsEl = document.getElementById('overview-page-views');
    if (pageViewsEl) pageViewsEl.textContent = todayStats.page_views || 0;

    // 更新独立用户数
    const uniqueVisitorsEl = document.getElementById('overview-unique-visitors');
    if (uniqueVisitorsEl) uniqueVisitorsEl.textContent = todayStats.unique_visitors || 0;

    // 更新产品点击数
    const productClicksEl = document.getElementById('overview-product-clicks');
    if (productClicksEl) productClicksEl.textContent = todayStats.product_clicks || 0;

    // 更新转化率 - 统一使用实际询价数据计算
    const conversionRateEl = document.getElementById('overview-conversion-rate');
    if (conversionRateEl) {
        try {
            const todayInquiries = await getTodayInquiriesCount();
            const pageViews = todayStats.page_views || 0;
            const conversionRate = pageViews > 0 ? (todayInquiries / pageViews * 100) : 0;
            conversionRateEl.textContent = conversionRate.toFixed(2) + '%';
        } catch (error) {
            console.error('计算转化率失败:', error);
            conversionRateEl.textContent = '0.00%';
        }
    }
}

// 更新热门产品列表
function updateTopProductsList(topProducts) {
    const leftContainer = document.getElementById('hot-products-left');
    const rightContainer = document.getElementById('hot-products-right');
    
    if (!leftContainer || !rightContainer) return;
    
    if (!topProducts || topProducts.length === 0) {
        leftContainer.innerHTML = '<div class="text-center text-muted py-3">暂无数据</div>';
        rightContainer.innerHTML = '<div class="text-center text-muted py-3">暂无数据</div>';
        return;
    }

    // 左侧显示前5个
    let leftHtml = '';
    topProducts.slice(0, 5).forEach((product, index) => {
        const rank = index + 1;
        const rankClass = rank <= 3 ? `top-${rank}` : '';
        
        leftHtml += `
            <div class="hot-product-item">
                <div class="hot-product-rank ${rankClass}">#${rank}</div>
                <div class="hot-product-info">
                    <div class="hot-product-name">${product.name || '未知产品'}</div>
                    <div class="hot-product-model">${product.id || ''}</div>
                </div>
                <div class="hot-product-clicks">${product.clicks}</div>
            </div>
        `;
    });
    
    // 右侧显示6-10个
    let rightHtml = '';
    topProducts.slice(5, 10).forEach((product, index) => {
        const rank = index + 6;
        
        rightHtml += `
            <div class="hot-product-item">
                <div class="hot-product-rank">#${rank}</div>
                <div class="hot-product-info">
                    <div class="hot-product-name">${product.name || '未知产品'}</div>
                    <div class="hot-product-model">${product.id || ''}</div>
                </div>
                <div class="hot-product-clicks">${product.clicks}</div>
            </div>
        `;
    });
    
    leftContainer.innerHTML = leftHtml || '<div class="text-center text-muted py-3">暂无数据</div>';
    rightContainer.innerHTML = rightHtml || '<div class="text-center text-muted py-3">暂无数据</div>';
}

// 获取来源名称
function getSourceName(source) {
    const sourceNames = {
        'whatsapp': 'WhatsApp',
        'contact_form': '联系表单',
        'phone': '电话咨询',
        'email': '邮件咨询',
        'footer_form': '页尾快速询价',
        'product_detail_form': '产品详情页询价',
        'unknown': '其他来源'
    };
    return sourceNames[source] || source;
}

// 渲染产品列表 - 使用统一产品卡片管理器
function renderProducts() {
    const container = document.getElementById('products-list');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center text-muted py-5">
                <i class="bi bi-box fs-1 d-block mb-2"></i>
                还没有产品数据
                <div class="mt-3">
                    <button class="btn btn-primary" onclick="showPage('add-product')">
                        <i class="bi bi-plus-lg me-2"></i>添加第一个产品
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    // 确保统一产品卡片管理器已加载
    if (!window.ProductCardManager) {
        console.error('统一产品卡片管理器未加载，使用原始渲染方式');
        renderProductsLegacy();
        return;
    }
    
    const productCardManager = new ProductCardManager();
    
    container.innerHTML = products.map(product => {
        // 使用统一的管理卡片生成方法
        return productCardManager.createManageCard(product, {
            imagePath: '../',
            categories: categories
        });
    }).join('');
}

// 原始渲染方式（备用）
function renderProductsLegacy() {
    const container = document.getElementById('products-list');
    if (!container) return;
    
    container.innerHTML = products.map(product => {
        const category = categories.find(c => c.id === product.category);
        
        // 处理图片显示 - 兼容新旧数据格式
        let imageUrl = 'https://via.placeholder.com/200x200/e2e8f0/64748b?text=暂无图片';
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            // 新格式：images数组
            imageUrl = product.images[0];
        } else if (product.image && product.image.trim() !== '') {
            // 旧格式：单个image字段
            imageUrl = product.image;
        }
        
        // 处理产品标签
        const tags = product.tags ? product.tags.split(',') : [];
        const tagBadges = tags.map(tag => {
            const tagConfig = {
                'new': { class: 'bg-primary', text: '新品' },
                'hot': { class: 'bg-danger', text: '热门' },
                'recommend': { class: 'bg-success', text: '推荐' }
            };
            const config = tagConfig[tag] || { class: 'bg-secondary', text: tag };
            return `<span class="badge ${config.class} me-1" style="font-size: 10px;">${config.text}</span>`;
        }).join('');
        
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
                    ${product.brand ? `<div class="small text-muted mb-2">品牌: ${product.brand}</div>` : ''}
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="fw-bold text-success">$${parseFloat(product.price || 0).toFixed(2)}</span>
                        <span class="text-muted small">库存: ${product.stock || 0}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="editProduct('${product.id}')">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="deleteProduct('${product.id}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `}).join('');
}

// 渲染分类列表
function renderCategories() {
    const container = document.getElementById('categories-list');
    if (!container) return;
    
    if (categories.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center text-muted py-5">
                <i class="bi bi-tags fs-1 d-block mb-2"></i>
                还没有分类数据
                <div class="mt-3">
                    <button class="btn btn-primary" onclick="showAddCategoryModal()">
                        <i class="bi bi-plus-lg me-2"></i>添加第一个分类
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = categories.map(category => {
        // 优先使用服务器返回的count值，如果没有则计算
        const productCount = category.count !== undefined ? category.count :
                           products.filter(p => p.category === category.id).length;
        return `
        <div class="col-lg-4 col-md-6">
            <div class="category-card">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <h5 class="mb-1">${category.name}</h5>
                        <small class="text-muted">ID: ${category.id}</small>
                    </div>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="editCategory('${category.id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteCategory('${category.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="text-muted mb-3">${category.description || '暂无描述'}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="badge bg-primary">${productCount} 个产品</span>
                    <small class="text-muted">
                        创建于 ${category.createdAt ? new Date(category.createdAt).toLocaleDateString() : '未知'}
                    </small>
                </div>
            </div>
        </div>
    `}).join('');
}

// 渲染操作记录
function renderLogs() {
    const container = document.getElementById('logs-table-body');
    if (!container) return;
    
    if (logs.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="bi bi-clock-history fs-1 d-block mb-2"></i>
                    暂无操作记录
                </td>
            </tr>
        `;
        return;
    }
    
    const filteredLogs = filterLogsByType();
    
    container.innerHTML = filteredLogs.map(log => {
        const actionClass = log.action === 'create' ? 'text-success' : 
                           log.action === 'update' ? 'text-warning' : 
                           log.action === 'delete' ? 'text-danger' : '';
        
        const actionText = log.action === 'create' ? '创建' : 
                          log.action === 'update' ? '更新' : 
                          log.action === 'delete' ? '删除' : log.action;
        
        return `
        <tr>
            <td>${new Date(log.timestamp).toLocaleString()}</td>
            <td><span class="log-user">${log.user || '管理员'}</span></td>
            <td><span class="fw-bold ${actionClass}">${actionText}</span></td>
            <td>${log.target || '产品'}</td>
            <td>${log.description || log.details || '无描述'}</td>
            <td><small class="text-muted">${log.ip || '127.0.0.1'}</small></td>
        </tr>
    `}).join('');
}

// 填充分类选择器
function populateCategoryFilters() {
    const filterSelect = document.getElementById('filter-category');
    const formSelect = document.getElementById('product-category');
    
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="">所有分类</option>' +
            categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
    }
    
    if (formSelect) {
        // 为添加产品表单设置选项和默认值
        formSelect.innerHTML = 
            '<option value="turbocharger" selected>涡轮增压器</option>' +
            '<option value="actuator">执行器</option>' +
            '<option value="injector">共轨喷油器</option>' +
            '<option value="turbo-parts">涡轮配件</option>' +
            '<option value="others">其他</option>';
    }
}

// 为表单加载分类
function loadCategoriesForForm() {
    populateCategoryFilters();
}

// 显示添加分类模态框
function showAddCategoryModal() {
    const modal = new bootstrap.Modal(document.getElementById('addCategoryModal'));
    document.getElementById('add-category-form').reset();
    modal.show();
}

// 显示编辑分类模态框
function editCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    document.getElementById('edit-category-original-id').value = category.id;
    document.getElementById('edit-category-id').value = category.id;
    document.getElementById('edit-category-name').value = category.name;
    document.getElementById('edit-category-description').value = category.description || '';
    
    const modal = new bootstrap.Modal(document.getElementById('editCategoryModal'));
    modal.show();
}

// 提交分类
async function submitCategory() {
    const form = document.getElementById('add-category-form');
    const formData = new FormData(form);
    
    // 验证分类ID格式
    const categoryId = formData.get('id');
    if (!/^[a-z0-9-]+$/.test(categoryId)) {
        showToast('分类ID只能包含小写字母、数字和连字符', 'error');
        return;
    }
    
    // 检查ID是否已存在
    if (categories.find(c => c.id === categoryId)) {
        showToast('分类ID已存在', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: formData.get('id'),
                name: formData.get('name'),
                description: formData.get('description')
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            showToast('分类添加成功！', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('addCategoryModal'));
            modal.hide();
            loadCategories();
            addLog('create', '分类', `分类: ${result.name} (${result.id})`);
        } else {
            const error = await response.json();
            showToast(error.error || '添加分类失败', 'error');
        }
    } catch (error) {
        console.error('提交分类失败:', error);
        showToast('提交失败，请重试', 'error');
    }
}

// 更新分类
async function updateCategory() {
    const form = document.getElementById('edit-category-form');
    const formData = new FormData(form);
    const originalId = document.getElementById('edit-category-original-id').value;
    const newId = formData.get('id');
    
    // 验证分类ID格式
    if (!/^[a-z0-9-]+$/.test(newId)) {
        showToast('分类ID只能包含小写字母、数字和连字符', 'error');
        return;
    }
    
    // 如果ID发生变化，检查新ID是否已存在
    if (newId !== originalId && categories.find(c => c.id === newId)) {
        showToast('新的分类ID已存在', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/categories/${originalId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: newId,
                name: formData.get('name'),
                description: formData.get('description')
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            showToast('分类更新成功！', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('editCategoryModal'));
            modal.hide();
            loadCategories();
            loadProductsWithPagination(currentPageNum); // 重新加载产品以更新分类显示，保持当前页面
            addLog('update', '分类', `分类: ${result.name} (${result.id})`);
        } else {
            const error = await response.json();
            showToast(error.error || '更新分类失败', 'error');
        }
    } catch (error) {
        console.error('更新分类失败:', error);
        showToast('更新失败，请重试', 'error');
    }
}

// 删除分类
async function deleteCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    // 检查是否有产品使用此分类
    const productsUsingCategory = products.filter(p => p.category === categoryId);
    if (productsUsingCategory.length > 0) {
        showToast(`无法删除分类，还有 ${productsUsingCategory.length} 个产品使用此分类`, 'error');
        return;
    }
    
    if (!confirm(`确定要删除分类"${category.name}"吗？此操作无法撤销。`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/categories/${categoryId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('分类删除成功', 'success');
            loadCategories();
            addLog('delete', '分类', `分类: ${category.name} (${category.id})`);
        } else {
            const error = await response.json();
            showToast(error.error || '删除分类失败', 'error');
        }
    } catch (error) {
        console.error('删除分类失败:', error);
        showToast('删除失败，请重试', 'error');
    }
}

// 删除产品
async function deleteProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        showToast('产品未找到', 'error');
        return;
    }
    
    if (!confirm(`确定要删除产品"${product.name}"吗？\n\n此操作将会：\n• 永久删除产品信息\n• 删除相关的产品图片\n• 无法撤销\n\n确定继续吗？`)) {
        return;
    }
    
    showLoadingState();
    
    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('产品删除成功', 'success');
            // 智能页面处理：先获取最新的产品总数，然后决定跳转到哪一页
            try {
                // 先获取删除后的最新产品总数
                const statsResponse = await fetch('/api/products?page=1&limit=1');
                const statsData = await statsResponse.json();
                const totalProductsAfterDelete = statsData.pagination.total;
                
                // 计算删除后的最大页数
                const maxPage = Math.max(1, Math.ceil(totalProductsAfterDelete / currentPageSize));
                // 如果当前页超过了最大页数，跳转到最大页；否则保持当前页
                const targetPage = currentPageNum > maxPage ? maxPage : currentPageNum;
                
                loadProductsWithPagination(targetPage);
            } catch (error) {
                // 如果获取统计失败，直接重新加载当前页
                loadProductsWithPagination(currentPageNum);
            }
            
            addLog('delete', '产品', `产品: ${product.name} (${product.sku || product.id})`);
        } else {
            const error = await response.json();
            showToast(error.error || '删除产品失败', 'error');
        }
    } catch (error) {
        console.error('删除产品失败:', error);
        showToast('删除失败，请重试', 'error');
    } finally {
        hideLoadingState();
    }
}

// 文件选择处理
function handleFileSelection(files) {
    const maxFiles = 6;
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    for (let i = 0; i < Math.min(files.length, maxFiles - selectedFiles.length); i++) {
        const file = files[i];
        
        if (!file.type.startsWith('image/')) {
            showToast('只能上传图片文件', 'error');
            continue;
        }
        
        if (file.size > maxSize) {
            showToast(`文件 ${file.name} 超过5MB限制`, 'error');
            continue;
        }
        
        selectedFiles.push(file);
    }
    
    renderImagePreviews();
}

// 渲染图片预览
function renderImagePreviews() {
    const container = document.getElementById('addImageContainer');
    container.innerHTML = '';
    
    selectedImages.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageCard = document.createElement('div');
            imageCard.className = 'image-preview-card';
            imageCard.draggable = true;
            imageCard.dataset.index = index;
            
            imageCard.innerHTML = `
                <img src="${e.target.result}" alt="预览图片" class="preview-image">
                <div class="image-order-badge">${index + 1}</div>
                <button type="button" class="btn btn-sm btn-danger image-remove-btn" onclick="removeImageAtIndex(${index})">
                    <i class="bi bi-x"></i>
                </button>
                ${index === 0 ? '<div class="main-image-badge">主图</div>' : ''}
            `;
            
            // 添加拖拽事件监听器
            imageCard.addEventListener('dragstart', handleImageDragStart);
            imageCard.addEventListener('dragover', handleImageDragOver);
            imageCard.addEventListener('drop', handleImageDrop);
            imageCard.addEventListener('dragend', handleImageDragEnd);
            imageCard.addEventListener('dragenter', function(e) {
                e.preventDefault();
            });
            
            container.appendChild(imageCard);
        };
        reader.readAsDataURL(file);
    });
    
    // 如果没有图片，隐藏预览区域，显示上传区域
    if (selectedImages.length === 0) {
        document.getElementById('addImagePreviews').style.display = 'none';
        document.getElementById('addUploadArea').style.display = 'block';
    }
}

// 拖拽处理函数 - 重命名避免与文件上传的拖拽函数冲突
function handleImageDragStart(e) {
    draggedElement = e.target.closest('.image-preview-card');
    draggedIndex = parseInt(draggedElement.dataset.index);
    draggedElement.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedIndex);
}

function handleImageDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const draggedOver = e.target.closest('.image-preview-card');
    if (draggedOver && draggedOver !== draggedElement) {
        draggedOver.classList.add('drag-over');
        
        // 移除其他元素的drag-over样式
        document.querySelectorAll('.image-preview-card').forEach(card => {
            if (card !== draggedOver) {
                card.classList.remove('drag-over');
            }
        });
    }
}

function handleImageDrop(e) {
    e.preventDefault();
    
    const dropTarget = e.target.closest('.image-preview-card');
    if (dropTarget && dropTarget !== draggedElement) {
        const dropIndex = parseInt(dropTarget.dataset.index);
        
        // 重新排列图片数组
        const draggedFile = selectedImages[draggedIndex];
        selectedImages.splice(draggedIndex, 1);
        selectedImages.splice(dropIndex, 0, draggedFile);
        
        // 重新渲染
        renderImagePreviews();
        
        showToast(`图片已移动到位置 ${dropIndex + 1}`, 'success');
    }
    
    // 清除所有拖拽样式
    document.querySelectorAll('.image-preview-card').forEach(card => {
        card.classList.remove('drag-over');
    });
}

function handleImageDragEnd(e) {
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
    }
    
    // 清除所有拖拽样式
    document.querySelectorAll('.image-preview-card').forEach(card => {
        card.classList.remove('drag-over');
    });
    
    draggedElement = null;
    draggedIndex = null;
}

// 移除指定索引的图片
function removeImageAtIndex(index) {
    selectedImages.splice(index, 1);
    
    if (selectedImages.length === 0) {
        document.getElementById('addImagePreviews').style.display = 'none';
        document.getElementById('addUploadArea').style.display = 'block';
    } else {
        renderImagePreviews();
    }
}

// 移除添加页面的所有图片
function removeAllAddPageImages() {
    selectedImages = [];
    document.getElementById('addProductImages').value = '';
    document.getElementById('addImagePreviews').style.display = 'none';
    document.getElementById('addUploadArea').style.display = 'block';
}

// 重置添加产品表单
function resetAddProductForm() {
    // 调用统一的重置函数
    resetForm();

    // 重新设置分类变化监听器
    setupProductCategoryListeners();
}

// 获取表单数据
function getFormData() {
    const formData = new FormData();
    
    // 基本信息（匹配后端字段名）
    formData.append('name', document.getElementById('product-name').value);
    formData.append('model', document.getElementById('product-model').value);
    formData.append('brand', document.getElementById('product-brand').value);
    formData.append('oe_number', document.getElementById('product-oe').value);
    formData.append('category', document.getElementById('product-category').value);
    formData.append('warranty', document.getElementById('product-warranty').value);
    formData.append('compatibility', document.getElementById('product-compatibility').value);
    formData.append('description', document.getElementById('product-description').value);
    
    // 价格
    formData.append('price', document.getElementById('product-price').value || '0');
    
    // 自动设置默认值（不在UI中显示）
    formData.append('stock', '10'); // 默认库存为10
    formData.append('status', 'active'); // 默认状态为在售
    
    // 产品特性（后端期望的是字符串格式）
    const featuresValue = document.getElementById('product-features').value;
    formData.append('features', featuresValue);
    
    // 其他事项
    formData.append('notes', document.getElementById('product-notes').value);
    
    // SEO信息
    formData.append('meta_description', document.getElementById('product-meta-description').value);
    formData.append('meta_keywords', document.getElementById('product-meta-keywords').value);
    
    // 产品标签和标记（后端需要这些字段）
    formData.append('isNew', 'true'); // 默认为新品
    formData.append('isHot', 'false'); 
    formData.append('isRecommend', 'false');
    formData.append('badges', ''); // 空的badges字段
    
    // 图片处理 - 使用正确的图片数据源
    if (selectedImages && selectedImages.length > 0) {
        // 使用全局selectedImages数组中的文件
        console.log('使用selectedImages数组中的图片:', selectedImages.length, '张');
        for (let i = 0; i < selectedImages.length; i++) {
            formData.append('images', selectedImages[i]);
        }
    } else {
        // 如果没有通过拖拽添加图片，检查文件输入框
        const imageFiles = document.getElementById('addProductImages').files;
        console.log('使用文件输入框中的图片:', imageFiles.length, '张');
        for (let i = 0; i < imageFiles.length; i++) {
            formData.append('images', imageFiles[i]);
        }
    }
    
    return formData;
}

// 填充产品表单
function fillProductForm(product) {
    // 填充基本信息
    document.getElementById('editProductId').value = product.id;
    const nameInput = document.getElementById('editProductName');
    nameInput.value = product.name;
    
    // 初始化字符计数
    const charCountDisplay = document.getElementById('edit-name-char-count');
    if (charCountDisplay) {
        const currentLength = product.name.length;
        const maxLength = nameInput.getAttribute('maxlength');
        charCountDisplay.textContent = `${currentLength}/${maxLength}`;
        
        // 添加输入事件监听
        nameInput.addEventListener('input', function() {
            const currentLength = this.value.length;
            const maxLength = this.getAttribute('maxlength');
            charCountDisplay.textContent = `${currentLength}/${maxLength}`;
            
            // 当接近字符限制时添加警告样式
            if (currentLength >= maxLength - 20) {
                charCountDisplay.classList.add('text-warning');
            } else {
                charCountDisplay.classList.remove('text-warning');
            }
            
            // 达到字符限制时添加危险样式
            if (currentLength >= maxLength) {
                charCountDisplay.classList.add('text-danger');
            } else {
                charCountDisplay.classList.remove('text-danger');
            }
        });
    }

    document.getElementById('editProductModel').value = product.model;
    document.getElementById('editProductCategory').value = product.category;
    document.getElementById('editProductBrand').value = product.brand;
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductWarranty').value = product.warranty;

    // 注意：库存、状态、标签在添加页面不显示，编辑时可能需要在其他地方处理
    
    // 产品特性和其他事项
    document.getElementById('editProductFeatures').value = product.features || '';
    document.getElementById('editProductNotes').value = product.notes || '';
    
    // SEO信息
    document.getElementById('editProductMetaDescription').value = product.meta_description || '';
    document.getElementById('editProductMetaKeywords').value = product.meta_keywords || '';
    
    // 更新特性标签
    if (product.features) {
        const features = product.features.split(',');
        features.forEach(feature => {
            const btn = document.querySelector(`[data-feature="${feature}"]`);
            if (btn) {
                btn.classList.add('active');
                btn.classList.remove('btn-outline-primary');
                btn.classList.add('btn-primary');
            }
        });
    }
    
    // 显示现有图片
    if (product.images && product.images.length > 0) {
        const imagePreviewsContainer = document.getElementById('current-images');
        if (imagePreviewsContainer) {
            imagePreviewsContainer.innerHTML = '';
            product.images.forEach((imagePath, index) => {
                const imageCard = createImagePreviewCard(imagePath, index);
                imagePreviewsContainer.appendChild(imageCard);
            });
        }
    }
}

// 重置表单
function resetForm() {
    const form = document.getElementById('addProductForm');
    if (form) {
        form.reset();
        
        // 重置为默认值
        document.getElementById('product-brand').value = 'Diamond-Auto';
        document.getElementById('product-category').value = 'turbocharger';
        document.getElementById('product-warranty').value = '12';
        
        // 清除特性标签选择
        document.querySelectorAll('.feature-tag').forEach(btn => {
            btn.classList.remove('active');
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-outline-primary');
        });
        document.getElementById('product-features').value = '';
        
        // 清除图片预览 - 使用正确的ID
        const imagePreviewsContainer = document.getElementById('addImagePreviews');
        const imageContainer = document.getElementById('addImageContainer');
        if (imagePreviewsContainer) {
            imagePreviewsContainer.style.display = 'none';
        }
        if (imageContainer) {
            imageContainer.innerHTML = '';
        }
        
        // 显示上传区域
        const uploadArea = document.getElementById('addUploadArea');
        if (uploadArea) {
            uploadArea.style.display = 'block';
        }
        
        // 清除全局变量
        selectedFiles = [];
        selectedImages = [];
    }
}

// 提交产品表单
async function submitAddProductForm(event) {
    event.preventDefault();
    
    try {
        const formData = getFormData();
        
        // 验证必填字段
        if (!formData.get('name') || !formData.get('name').trim()) {
            showToast('请填写产品名称', 'warning');
            return;
        }
        
        // 显示加载状态
        showLoadingState();
        
        console.log('正在提交产品数据...');
        
        const response = await fetch('/api/products', {
            method: 'POST',
            body: formData
        });
        
        console.log('响应状态:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('服务器响应错误:', errorText);
            throw new Error(`服务器错误 ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('产品创建成功:', result);
        
        // 添加操作日志
        await addLog('create', 'product', `创建新产品: ${formData.get('name')}`);
        
        // 显示成功消息
        showToast('产品添加成功！', 'success');
        
        // 重置表单
        resetForm();
        
        // 刷新产品列表
        loadProducts();
        
    } catch (error) {
        console.error('提交产品表单失败:', error);
        showToast(`添加产品失败: ${error.message}`, 'error');
    } finally {
        hideLoadingState();
    }
}

// 保存编辑的产品
async function saveEditProduct() {
    try {
        const productId = document.getElementById('editProductId').value;
        if (!productId) {
            showToast('产品ID不能为空', 'error');
            return;
        }
        
        const formData = getEditFormData();
        formData.append('id', productId);
        
        // 显示加载状态
        showLoadingState();
        
        const response = await fetch(`/api/products/${productId}`, {
            method: 'PUT',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // 添加操作日志
        await addLog('update', 'product', `更新产品: ${formData.get('name')}`);
        
        // 显示成功消息
        showToast('产品更新成功！', 'success');
        
        // 保持当前页面刷新产品列表
        loadProductsWithPagination(currentPageNum);
        
        // 关闭编辑模态框
        const editModal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
        if (editModal) {
            editModal.hide();
        }
        
    } catch (error) {
        console.error('保存产品失败:', error);
        showToast('更新产品失败，请重试', 'error');
    } finally {
        hideLoadingState();
    }
}

// 获取编辑表单数据
function getEditFormData() {
    const formData = new FormData();
    
    // 基本信息（匹配后端字段名）
    formData.append('name', document.getElementById('editProductName').value);
    formData.append('model', document.getElementById('editProductModel').value);
    formData.append('brand', document.getElementById('editProductBrand').value);
    formData.append('oe_number', document.getElementById('editProductOe').value);
    formData.append('category', document.getElementById('editProductCategory').value);
    formData.append('warranty', document.getElementById('editProductWarranty').value);
    formData.append('compatibility', document.getElementById('editProductCompatibility').value);
    formData.append('description', document.getElementById('editProductDescription').value);
    
    // 价格
    formData.append('price', document.getElementById('editProductPrice').value || '0');
    
    // 库存和状态
    formData.append('stock', document.getElementById('editProductStock').value || '10');
    formData.append('status', document.getElementById('editProductStatus').value);
    
    // 产品特性（后端期望的是字符串格式）
    const featuresValue = document.getElementById('editProductFeatures').value;
    formData.append('features', featuresValue);
    
    // 其他事项
    formData.append('notes', document.getElementById('editProductNotes').value);
    
    // SEO信息
    formData.append('meta_description', document.getElementById('editProductMetaDescription').value);
    formData.append('meta_keywords', document.getElementById('editProductMetaKeywords').value);
    
    // 产品标签和标记
    formData.append('isNew', document.getElementById('editIsNew').checked ? 'true' : 'false');
    formData.append('isHot', document.getElementById('editIsHot').checked ? 'true' : 'false');
    formData.append('isRecommend', document.getElementById('editIsRecommend').checked ? 'true' : 'false');
    formData.append('badges', ''); // 空的badges字段
    
    // 新图片处理
    const imageFiles = document.getElementById('editProductImages').files;
    if (imageFiles && imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
            formData.append('images', imageFiles[i]);
        }
    }
    
    // 当前图片顺序
    if (window.currentImagesOrder && window.currentImagesOrder.length > 0) {
        formData.append('currentImages', JSON.stringify(window.currentImagesOrder));
    }
    
    return formData;
}

// 初始化编辑模态框的特性标签
function initEditFeatureTags() {
    document.querySelectorAll('#editFeatureTags .feature-tag').forEach(btn => {
        // 移除可能存在的事件监听器
        btn.replaceWith(btn.cloneNode(true));
    });
    
    // 重新添加事件监听器
    document.querySelectorAll('#editFeatureTags .feature-tag').forEach(btn => {
        btn.addEventListener('click', function() {
            const feature = this.getAttribute('data-feature');
            toggleEditFeature(this, feature);
        });
    });
}

// 切换编辑模式下的特性选择
function toggleEditFeature(btn, feature) {
    if (btn.classList.contains('active')) {
        // 取消选择
        btn.classList.remove('active', 'btn-primary');
        btn.classList.add('btn-outline-primary');
    } else {
        // 选择
        btn.classList.remove('btn-outline-primary');
        btn.classList.add('active', 'btn-primary');
    }
    
    // 更新隐藏字段
    updateEditFeaturesValue();
}

// 更新编辑模式下的特性值
function updateEditFeaturesValue() {
    const selectedFeatures = [];
    document.querySelectorAll('#editFeatureTags .feature-tag.active').forEach(btn => {
        selectedFeatures.push(btn.getAttribute('data-feature'));
    });
    document.getElementById('editProductFeatures').value = selectedFeatures.join(',');
}

// 编辑产品
function editProduct(productId) {
    fetch(`/api/products/${productId}`)
        .then(response => response.json())
        .then(product => {
            // 填充基本信息
            document.getElementById('editProductId').value = product.id;
            document.getElementById('editProductName').value = product.name || '';
            document.getElementById('editProductModel').value = product.model || '';
            document.getElementById('editProductBrand').value = product.brand || 'Diamond-Auto';
            document.getElementById('editProductCategory').value = product.category || 'turbocharger';
            document.getElementById('editProductPrice').value = product.price || '';
            document.getElementById('editProductWarranty').value = product.warranty || '12';
            document.getElementById('editProductOe').value = product.oe_number || '';
            document.getElementById('editProductCompatibility').value = product.compatibility || '';
            document.getElementById('editProductDescription').value = product.description || '';
            document.getElementById('editProductNotes').value = product.notes || '';
            document.getElementById('editProductStock').value = product.stock || 10;
            document.getElementById('editProductStatus').value = product.status || 'active';
            
            // SEO信息
            document.getElementById('editProductMetaDescription').value = product.meta_description || '';
            document.getElementById('editProductMetaKeywords').value = product.meta_keywords || '';
            
            // 产品标签
            document.getElementById('editIsNew').checked = product.isNew === 'true' || product.isNew === true;
            document.getElementById('editIsHot').checked = product.isHot === 'true' || product.isHot === true;
            document.getElementById('editIsRecommend').checked = product.isRecommend === 'true' || product.isRecommend === true;
            
            // 产品特性
            document.getElementById('editProductFeatures').value = product.features || '';
            
            // 清除所有特性标签的选中状态
            document.querySelectorAll('#editFeatureTags .feature-tag').forEach(tag => {
                tag.classList.remove('active', 'btn-primary');
                tag.classList.add('btn-outline-primary');
            });
            
            // 设置已选择的特性
            if (product.features) {
                const features = product.features.split(',');
                features.forEach(feature => {
                    const featureTag = document.querySelector(`#editFeatureTags .feature-tag[data-feature="${feature.trim()}"]`);
                    if (featureTag) {
                        featureTag.classList.remove('btn-outline-primary');
                        featureTag.classList.add('active', 'btn-primary');
                    }
                });
            }
            
            // 显示当前图片信息 - 支持多图片
            const currentImagesInfo = document.getElementById('currentImagesInfo');
            const currentImageContainer = document.getElementById('currentImageContainer');
            
            // 处理图片显示 - 兼容新旧数据格式
            let images = [];
            if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                images = product.images;
            } else if (product.image && product.image.trim() !== '') {
                images = [product.image];
            }
            
            if (images.length > 0) {
                currentImageContainer.innerHTML = images.map((img, index) => `
                    <div class="current-image-card" style="position: relative; cursor: move;" 
                         data-image="${img}" data-id="current-${index}" draggable="true"
                         ondragstart="handleCurrentImageDragStart(event)" 
                         ondragover="handleCurrentImageDragOver(event)" 
                         ondrop="handleCurrentImageDrop(event)" 
                         ondragend="handleCurrentImageDragEnd(event)"
                         ondragleave="handleCurrentImageDragLeave(event)">
                        <img src="${img}" alt="当前图片 ${index + 1}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
                        <button type="button" class="btn btn-danger btn-sm position-absolute" 
                                style="top: -5px; right: -5px; width: 20px; height: 20px; padding: 0; font-size: 12px;"
                                onclick="removeCurrentImage('${img}', this)">
                            <i class="bi bi-x"></i>
                        </button>
                        <div class="image-order-badge position-absolute" 
                             style="top: -5px; left: -5px; background: #007bff; color: white; border-radius: 50%; width: 20px; height: 20px; font-size: 10px; display: flex; align-items: center; justify-content: center;">
                            ${index + 1}
                        </div>
                        <div class="mt-1 text-center small text-muted">图片 ${index + 1}</div>
                    </div>
                `).join('');
                currentImagesInfo.style.display = 'block';
            } else {
                currentImagesInfo.style.display = 'none';
            }
            
            // 清空新图片预览
            document.getElementById('editImagePreviews').style.display = 'none';
            document.getElementById('editImageContainer').innerHTML = '';
            editSelectedImages = []; // 清空编辑时选择的新图片
            
            // 初始化当前图片顺序
            window.currentImagesOrder = images;
            
            // 初始化特性标签点击事件
            initEditFeatureTags();

            // 设置编辑模式下的分类变化监听器
            setupProductCategoryListeners();

            document.getElementById('productFormTitle').textContent = '编辑产品';

            const modal = new bootstrap.Modal(document.getElementById('productModal'));
            modal.show();
        })
        .catch(error => {
            console.error('加载产品详情失败:', error);
            showToast('加载产品详情失败', 'error');
        });
}

// 初始化特性标签
function initFeatureTags() {
    const container = document.getElementById('features-container');
    if (!container) return;
    
    container.innerHTML = presetFeatures.map(feature => `
        <button type="button" class="btn btn-outline-primary btn-sm feature-tag" data-feature="${feature}" onclick="toggleFeature(this, '${feature}')">${feature}</button>
    `).join('');
}

// 切换特性标签
function toggleFeature(btn, feature) {
    btn.classList.toggle('active');
    btn.classList.toggle('btn-outline-primary');
    btn.classList.toggle('btn-primary');
    
    const input = document.getElementById('product-features');
    let features = input.value ? input.value.split(',').map(f => f.trim()).filter(f => f) : [];
    
    if (btn.classList.contains('active')) {
        if (!features.includes(feature)) {
            features.push(feature);
        }
    } else {
        features = features.filter(f => f !== feature);
    }
    
    input.value = features.join(',');
    
    // 触发SEO自动生成
    generateSEODescription();
}

// 批量操作相关函数
function toggleBatchActions() {
    const selectedCheckboxes = document.querySelectorAll('.product-checkbox:checked');
    const batchActions = document.getElementById('batch-actions');
    const selectAllBtn = document.getElementById('select-all-btn');
    
    if (selectedCheckboxes.length > 0) {
        batchActions.classList.remove('d-none');
        selectAllBtn.innerHTML = '<i class="bi bi-x-square me-1"></i>取消';
    } else {
        batchActions.classList.add('d-none');
        selectAllBtn.innerHTML = '<i class="bi bi-check-all me-1"></i>全选';
    }
    
    // 更新产品卡片选中状态
    updateProductCardSelection();
}

function updateProductCardSelection() {
    const checkboxes = document.querySelectorAll('.product-checkbox');
    checkboxes.forEach(checkbox => {
        const productCard = checkbox.closest('.product-card');
        if (checkbox.checked) {
            productCard.classList.add('selected');
        } else {
            productCard.classList.remove('selected');
        }
    });
}

function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('.product-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = !allChecked;
    });
    
    toggleBatchActions();
}

function clearAllSelections() {
    const checkboxes = document.querySelectorAll('.product-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    toggleBatchActions();
}

function showBatchEditModal() {
    const selectedCheckboxes = document.querySelectorAll('.product-checkbox:checked');
    if (selectedCheckboxes.length === 0) {
        showToast('请先选择要编辑的产品', 'warning');
        return;
    }
    
    document.getElementById('batch-count').textContent = selectedCheckboxes.length;
    
    // 重置表单
    document.getElementById('batchEditForm').reset();
    document.getElementById('batchPriceValue').disabled = true;
    document.getElementById('batchStockValue').disabled = true;
    
    const modal = new bootstrap.Modal(document.getElementById('batchEditModal'));
    modal.show();
}

function togglePriceInput() {
    const action = document.getElementById('batchPriceAction').value;
    const valueInput = document.getElementById('batchPriceValue');
    const prefix = document.getElementById('price-prefix');
    const help = document.getElementById('price-help');
    
    if (action) {
        valueInput.disabled = false;
        switch(action) {
            case 'set':
                prefix.textContent = '$';
                help.textContent = '设置为固定价格';
                break;
            case 'increase':
                prefix.textContent = '+$';
                help.textContent = '在原价基础上增加';
                break;
            case 'decrease':
                prefix.textContent = '-$';
                help.textContent = '在原价基础上减少';
                break;
            case 'multiply':
                prefix.textContent = '×';
                help.textContent = '价格乘以此倍数（如1.1表示涨价10%）';
                break;
        }
    } else {
        valueInput.disabled = true;
        prefix.textContent = '$';
        help.textContent = '选择价格调整方式后输入数值';
    }
}

function toggleStockInput() {
    const action = document.getElementById('batchStockAction').value;
    const valueInput = document.getElementById('batchStockValue');
    const help = document.getElementById('stock-help');
    
    if (action) {
        valueInput.disabled = false;
        switch(action) {
            case 'set':
                help.textContent = '设置为固定库存';
                break;
            case 'increase':
                help.textContent = '在原库存基础上增加';
                break;
            case 'decrease':
                help.textContent = '在原库存基础上减少';
                break;
        }
    } else {
        valueInput.disabled = true;
        help.textContent = '选择库存调整方式后输入数值';
    }
}

function batchDeleteProducts() {
    const selectedCheckboxes = document.querySelectorAll('.product-checkbox:checked');
    if (selectedCheckboxes.length === 0) {
        showToast('请先选择要删除的产品', 'warning');
        return;
    }
    
    if (!confirm(`确定要删除这 ${selectedCheckboxes.length} 个产品吗？此操作不可恢复。`)) {
        return;
    }
    
    const productIds = Array.from(selectedCheckboxes).map(cb => cb.value);
    
    Promise.all(productIds.map(id => 
        fetch(`/api/products/${id}`, { method: 'DELETE' })
            .then(response => response.json())
    ))
    .then(async (results) => {
        showToast(`成功删除 ${productIds.length} 个产品`, 'success');
        // 智能页面处理：批量删除后的页面跳转
        try {
            // 获取删除后的最新产品总数
            const statsResponse = await fetch('/api/products?page=1&limit=1');
            const statsData = await statsResponse.json();
            const totalProductsAfterDelete = statsData.pagination.total;
            
            const maxPage = Math.max(1, Math.ceil(totalProductsAfterDelete / currentPageSize));
            const targetPage = currentPageNum > maxPage ? maxPage : currentPageNum;
            
            loadProductsWithPagination(targetPage);
        } catch (error) {
            // 如果获取统计失败，直接重新加载当前页
            loadProductsWithPagination(currentPageNum);
        }
        
        clearAllSelections();
        productIds.forEach(id => {
            addLog('delete', '产品', `批量删除产品ID: ${id}`);
        });
    })
    .catch(error => {
        console.error('批量删除失败:', error);
        showToast('批量删除失败', 'error');
    });
}

function executeBatchEdit() {
    const selectedCheckboxes = document.querySelectorAll('.product-checkbox:checked');
    if (selectedCheckboxes.length === 0) {
        showToast('请先选择要编辑的产品', 'warning');
        return;
    }
    
    const batchData = {
        category: document.getElementById('batchCategory').value,
        status: document.getElementById('batchStatus').value,
        priceAction: document.getElementById('batchPriceAction').value,
        priceValue: parseFloat(document.getElementById('batchPriceValue').value) || 0,
        stockAction: document.getElementById('batchStockAction').value,
        stockValue: parseInt(document.getElementById('batchStockValue').value) || 0
    };
    
    // 验证输入
    if (batchData.priceAction && !batchData.priceValue) {
        showToast('请输入价格调整数值', 'warning');
        return;
    }
    
    if (batchData.stockAction && batchData.stockAction !== 'set' && !batchData.stockValue) {
        showToast('请输入库存调整数值', 'warning');
        return;
    }
    
    const productIds = Array.from(selectedCheckboxes).map(cb => cb.value);
    
    // 获取当前所有产品数据
    const promises = productIds.map(async (productId) => {
        const product = products.find(p => p.id === productId);
        if (!product) return null;
        
        const updatedProduct = { ...product };
        
        // 应用批量修改
        if (batchData.category) {
            updatedProduct.category = batchData.category;
        }
        
        if (batchData.status) {
            updatedProduct.status = batchData.status;
        }
        
        if (batchData.priceAction) {
            const currentPrice = parseFloat(product.price) || 0;
            switch(batchData.priceAction) {
                case 'set':
                    updatedProduct.price = batchData.priceValue;
                    break;
                case 'increase':
                    updatedProduct.price = currentPrice + batchData.priceValue;
                    break;
                case 'decrease':
                    updatedProduct.price = Math.max(0, currentPrice - batchData.priceValue);
                    break;
                case 'multiply':
                    updatedProduct.price = currentPrice * batchData.priceValue;
                    break;
            }
        }
        
        if (batchData.stockAction) {
            const currentStock = parseInt(product.stock) || 0;
            switch(batchData.stockAction) {
                case 'set':
                    updatedProduct.stock = batchData.stockValue;
                    break;
                case 'increase':
                    updatedProduct.stock = currentStock + batchData.stockValue;
                    break;
                case 'decrease':
                    updatedProduct.stock = Math.max(0, currentStock - batchData.stockValue);
                    break;
            }
        }
        
        // 发送更新请求
        const formData = new FormData();
        Object.keys(updatedProduct).forEach(key => {
            if (updatedProduct[key] !== undefined && updatedProduct[key] !== null) {
                formData.append(key, updatedProduct[key]);
            }
        });
        
        return fetch(`/api/products/${productId}`, {
            method: 'PUT',
            body: formData
        }).then(response => response.json());
    });
    
    Promise.all(promises)
        .then(results => {
            showToast(`成功批量更新 ${productIds.length} 个产品`, 'success');
            loadProductsWithPagination(currentPageNum); // 保持当前页面
            clearAllSelections();
            bootstrap.Modal.getInstance(document.getElementById('batchEditModal')).hide();
            addLog('update', '产品', `批量编辑 ${productIds.length} 个产品`);
        })
        .catch(error => {
            console.error('批量编辑失败:', error);
            showToast('批量编辑失败', 'error');
        });
}

// 产品筛选
// 注意：filterProducts 函数已移动到文件末尾的分页功能区域，现在支持分页筛选

// 操作记录筛选
function filterLogs() {
    renderLogs();
}

// 按类型筛选日志
function filterLogsByType() {
    const filterValue = document.getElementById('log-filter')?.value;
    if (!filterValue) return logs;
    
    return logs.filter(log => log.action === filterValue);
}

// 添加操作记录
async function addLog(action, target, description) {
    const logEntry = {
        action: action,
        target: target,
        description: description,
        details: description // 保持与服务器端兼容
    };
    
    try {
        const response = await fetch('/api/logs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(logEntry)
        });
        
        if (response.ok) {
            loadLogs(); // 重新加载日志
        }
    } catch (error) {
        console.error('添加操作记录失败:', error);
    }
}

// 清空操作记录
async function clearLogs() {
    if (!confirm('确定要清空所有操作记录吗？此操作无法撤销。')) {
        return;
    }
    
    try {
        const response = await fetch('/api/logs', {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('操作记录已清空', 'success');
            loadLogs();
        } else {
            const error = await response.json();
            showToast(error.error || '清空记录失败', 'error');
        }
    } catch (error) {
        console.error('清空记录失败:', error);
        showToast('清空失败，请重试', 'error');
    }
}

// 显示提示消息
function showToast(message, type = 'info') {
    // 简单的提示实现
    const alertClass = type === 'error' ? 'alert-danger' : 
                      type === 'success' ? 'alert-success' : 'alert-primary';
    
    const toast = document.createElement('div');
    toast.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
    toast.style.cssText = 'top: 20px; right: 20px; z-index: 1050; min-width: 300px;';
    toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
    
    document.body.appendChild(toast);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 3000);
}

// 显示加载状态
function showLoadingState() {
    const submitBtn = document.querySelector('#addProductForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>正在保存...';
    }
}

// 隐藏加载状态
function hideLoadingState() {
    const submitBtn = document.querySelector('#addProductForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-plus-lg me-2"></i>添加产品';
    }
}

// 处理添加页面的多文件选择
function handleAddPageMultipleFileSelection(files) {
    // 将新选择的文件添加到已选择的图片数组中
    for (let i = 0; i < files.length; i++) {
        selectedImages.push(files[i]);
    }
    
    renderImagePreviews();
    
    // 如果有图片，隐藏上传区域，显示预览区域
    if (selectedImages.length > 0) {
        document.getElementById('addUploadArea').style.display = 'none';
        document.getElementById('addImagePreviews').style.display = 'block';
    }
}

// 拖拽文件上传相关函数
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
    
    const uploadArea = event.currentTarget;
    uploadArea.classList.add('drag-over');
}

function handleDragEnter(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const uploadArea = event.currentTarget;
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // 检查是否真的离开了上传区域
    const uploadArea = event.currentTarget;
    const rect = uploadArea.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        uploadArea.classList.remove('drag-over');
    }
}

function handleFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const uploadArea = event.currentTarget;
    uploadArea.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    
    if (files.length > 0) {
        // 过滤只保留图片文件
        const imageFiles = Array.from(files).filter(file => {
            return file.type.startsWith('image/');
        });
        
        if (imageFiles.length > 0) {
            handleAddPageMultipleFileSelection(imageFiles);
            showToast(`成功添加 ${imageFiles.length} 张图片`, 'success');
        } else {
            showToast('请选择图片文件 (JPG, PNG, GIF)', 'error');
        }
        
        if (files.length > imageFiles.length) {
            showToast(`已过滤 ${files.length - imageFiles.length} 个非图片文件`, 'warning');
        }
    }
}

// 编辑产品时的多图片处理函数
let editSelectedImages = [];

function handleEditMultipleFileSelection(files) {
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length === 0) {
        showToast('请选择有效的图片文件', 'warning');
        return;
    }
    
    // 添加到选中图片数组
    validFiles.forEach(file => {
        editSelectedImages.push({
            file: file,
            url: URL.createObjectURL(file),
            id: Date.now() + Math.random()
        });
    });
    
    renderEditImagePreviews();
}

function renderEditImagePreviews() {
    const container = document.getElementById('editImageContainer');
    const previewsSection = document.getElementById('editImagePreviews');
    
    if (editSelectedImages.length === 0) {
        previewsSection.style.display = 'none';
        return;
    }
    
    previewsSection.style.display = 'block';
    
    container.innerHTML = editSelectedImages.map((imageObj, index) => `
        <div class="image-preview-card" data-id="${imageObj.id}" draggable="true" 
             ondragstart="handleEditImageDragStart(event)" 
             ondragover="handleEditImageDragOver(event)" 
             ondrop="handleEditImageDrop(event)" 
             ondragend="handleEditImageDragEnd(event)">
            <div class="position-relative">
                <img src="${imageObj.url}" alt="预览图 ${index + 1}" class="preview-image">
                <button type="button" class="btn btn-danger btn-sm remove-image-btn" 
                        onclick="removeEditImageAtIndex(${index})">
                    <i class="bi bi-x"></i>
                </button>
                <div class="image-order-badge">${index + 1}</div>
            </div>
            <div class="mt-1 text-center small text-muted">图片 ${index + 1}</div>
        </div>
    `).join('');
}

function removeEditImageAtIndex(index) {
    if (editSelectedImages[index]) {
        URL.revokeObjectURL(editSelectedImages[index].url);
        editSelectedImages.splice(index, 1);
        renderEditImagePreviews();
    }
}

function handleEditImageDragStart(e) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.dataset.id);
    e.target.style.opacity = '0.5';
}

function handleEditImageDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const afterElement = getDragAfterElement(e.currentTarget.parentElement, e.clientX);
    const draggedElement = document.querySelector('[style*="opacity: 0.5"]');
    
    if (afterElement == null) {
        e.currentTarget.parentElement.appendChild(draggedElement);
    } else {
        e.currentTarget.parentElement.insertBefore(draggedElement, afterElement);
    }
}

function handleEditImageDrop(e) {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/html');
    
    // 重新排序数组
    const allCards = Array.from(document.querySelectorAll('#editImageContainer .image-preview-card'));
    const newOrder = allCards.map(card => card.dataset.id);
    
    const reorderedImages = newOrder.map(id => 
        editSelectedImages.find(img => img.id.toString() === id)
    ).filter(Boolean);
    
    editSelectedImages = reorderedImages;
    renderEditImagePreviews();
}

function handleEditImageDragEnd(e) {
    e.target.style.opacity = '1';
}

// 拖拽排序辅助函数
function getDragAfterElement(container, x) {
    const draggableElements = [...container.querySelectorAll('.image-preview-card:not([style*="opacity: 0.5"]), .current-image-card:not([style*="opacity: 0.5"]))')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = x - box.left - box.width / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function handleEditDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    const uploadArea = document.getElementById('editUploadArea');
    uploadArea.classList.add('drag-over');
}

function handleEditDragEnter(event) {
    event.preventDefault();
    const uploadArea = document.getElementById('editUploadArea');
    uploadArea.classList.add('drag-over');
}

function handleEditDragLeave(event) {
    event.preventDefault();
    const uploadArea = document.getElementById('editUploadArea');
    if (!uploadArea.contains(event.relatedTarget)) {
        uploadArea.classList.remove('drag-over');
    }
}

function handleEditFileDrop(event) {
    event.preventDefault();
    const files = event.dataTransfer.files;
    handleEditMultipleFileSelection(files);
    
    // 移除拖拽样式
    const uploadArea = document.getElementById('editUploadArea');
    uploadArea.classList.remove('drag-over');
}

// 现有图片拖拽排序函数
function handleCurrentImageDragStart(e) {
    e.dataTransfer.effectAllowed = 'move';
    const card = e.target.closest('.current-image-card');
    e.dataTransfer.setData('text/html', card.dataset.id);
    card.style.opacity = '0.5';
}

function handleCurrentImageDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // 只在当前卡片不是被拖拽的卡片时才添加视觉指示
    const draggedElement = document.querySelector('.current-image-card[style*="opacity: 0.5"]');
    const currentCard = e.currentTarget.closest('.current-image-card');
    
    if (draggedElement && currentCard && draggedElement !== currentCard) {
        // 移除所有之前的拖拽指示
        document.querySelectorAll('.current-image-card').forEach(card => {
            card.classList.remove('drag-over-left', 'drag-over-right');
        });
        
        // 根据鼠标位置添加拖拽指示
        const rect = currentCard.getBoundingClientRect();
        const midPoint = rect.left + rect.width / 2;
        
        if (e.clientX < midPoint) {
            currentCard.classList.add('drag-over-left');
        } else {
            currentCard.classList.add('drag-over-right');
        }
    }
}

function handleCurrentImageDrop(e) {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/html');
    
    // 移除所有拖拽指示样式
    document.querySelectorAll('.current-image-card').forEach(card => {
        card.classList.remove('drag-over-left', 'drag-over-right');
    });
    
    const draggedElement = document.querySelector(`[data-id="${draggedId}"]`);
    const targetCard = e.currentTarget.closest('.current-image-card');
    const container = document.getElementById('currentImageContainer');
    
    if (draggedElement && targetCard && draggedElement !== targetCard) {
        // 确定插入位置
        const rect = targetCard.getBoundingClientRect();
        const midPoint = rect.left + rect.width / 2;
        
        if (e.clientX < midPoint) {
            // 插入到目标卡片前面
            container.insertBefore(draggedElement, targetCard);
        } else {
            // 插入到目标卡片后面
            const nextSibling = targetCard.nextElementSibling;
            if (nextSibling) {
                container.insertBefore(draggedElement, nextSibling);
            } else {
                container.appendChild(draggedElement);
            }
        }
        
        // 重新排序并更新序号
        const allCards = Array.from(container.querySelectorAll('.current-image-card'));
        const newOrder = allCards.map(card => card.dataset.image);
        
        // 更新DOM中的序号显示
        allCards.forEach((card, index) => {
            const orderBadge = card.querySelector('.image-order-badge');
            const textLabel = card.querySelector('.text-muted');
            if (orderBadge) orderBadge.textContent = index + 1;
            if (textLabel) textLabel.textContent = `图片 ${index + 1}`;
            
            // 更新data-id
            card.dataset.id = `current-${index}`;
        });
        
        // 保存新的顺序到全局变量
        window.currentImagesOrder = newOrder;
    }
}

function handleCurrentImageDragEnd(e) {
    const card = e.target.closest('.current-image-card');
    card.style.opacity = '1';
    
    // 清理所有拖拽指示样式
    document.querySelectorAll('.current-image-card').forEach(card => {
        card.classList.remove('drag-over-left', 'drag-over-right');
    });
}

function handleCurrentImageDragLeave(e) {
    // 当鼠标离开当前卡片时，移除拖拽指示
    const currentCard = e.currentTarget.closest('.current-image-card');
    if (currentCard) {
        currentCard.classList.remove('drag-over-left', 'drag-over-right');
    }
}

// 删除当前图片
function removeCurrentImage(imagePath, buttonElement) {
    if (confirm('确定要删除这张图片吗？')) {
        const imageCard = buttonElement.closest('.current-image-card');
        imageCard.remove();
        
        // 重新更新剩余图片的序号
        const allCards = Array.from(document.querySelectorAll('#currentImageContainer .current-image-card'));
        allCards.forEach((card, index) => {
            const orderBadge = card.querySelector('.image-order-badge');
            const textLabel = card.querySelector('.text-muted');
            if (orderBadge) orderBadge.textContent = index + 1;
            if (textLabel) textLabel.textContent = `图片 ${index + 1}`;
            card.dataset.id = `current-${index}`;
        });
        
        // 更新全局顺序变量
        window.currentImagesOrder = allCards.map(card => card.dataset.image);
        
        // 检查是否还有图片，如果没有则隐藏当前图片区域
        const currentImageContainer = document.getElementById('currentImageContainer');
        if (currentImageContainer.children.length === 0) {
            document.getElementById('currentImagesInfo').style.display = 'none';
        }
    }
}

// 阻止全局拖拽事件，防止文件在页面其他地方被拖拽时打开
document.addEventListener('dragover', function(event) {
    event.preventDefault();
});

document.addEventListener('drop', function(event) {
    event.preventDefault();
});

// 自动生成产品描述
function generateProductDescription() {
    // 获取基本信息
    const name = document.getElementById('product-name').value;
    const model = document.getElementById('product-model').value;
    const brand = document.getElementById('product-brand').value;
    const category = document.getElementById('product-category').value;
    const warranty = document.getElementById('product-warranty').value;
    const compatibility = document.getElementById('product-compatibility').value;
    const oeNumber = document.getElementById('product-oe').value;
    
    // 产品分类中文映射
    const categoryMap = {
        'turbocharger': '涡轮增压器',
        'actuator': '执行器',
        'injector': '共轨喷油器',
        'turbo-parts': '涡轮配件',
        'others': '汽车配件'
    };

    // 为每个分类准备多套英文描述模板
    window.globalDescriptionTemplates = {
        'turbocharger': [
            {
                intro: 'This is a high-performance turbocharger manufactured with advanced technology and premium materials, providing powerful output for your engine.',
                features: [
                    '• Precision balancing technology ensures stable high-speed operation',
                    '• High-temperature resistant alloy materials adapt to harsh working environments',
                    '• Optimized impeller design improves boost efficiency',
                    '• Complete cooling system extends service life'
                ],
                advantages: [
                    '✓ Significantly increases engine power and torque output',
                    '✓ Improves fuel economy and reduces emissions',
                    '✓ Quick response with excellent acceleration performance',
                    '✓ Compact structure for easy installation and maintenance'
                ]
            },
            {
                intro: 'Manufactured to OEM technical standards with rigorous quality testing, ensuring every product delivers exceptional power performance for your vehicle.',
                features: [
                    '• OEM quality standards with perfect compatibility',
                    '• Advanced manufacturing processes for reliable quality',
                    '• Precision testing equipment ensures quality assurance',
                    '• Eco-friendly materials for green manufacturing'
                ],
                advantages: [
                    '✓ Direct replacement for OEM parts, no modification required',
                    '✓ Enhances overall engine performance',
                    '✓ Reduces maintenance costs and failure rates',
                    '✓ Extends engine service life'
                ]
            },
            {
                intro: 'Professional turbocharger integrating advanced automotive industry technology, providing ideal power solutions for performance-seeking vehicle owners.',
                features: [
                    '• Aerospace-grade materials with excellent strength',
                    '• CNC precision machining for accurate dimensions',
                    '• Multiple sealing design for reliable leak prevention',
                    '• Intelligent control system for performance optimization'
                ],
                advantages: [
                    '✓ Linear and smooth power output for comfortable driving',
                    '✓ Significantly improved turbo lag phenomenon',
                    '✓ Adapts to various driving conditions',
                    '✓ Excellent noise control with quiet operation'
                ]
            }
        ],
        'actuator': [
            {
                intro: 'Core control component of turbocharger systems, utilizing advanced electronic control technology to precisely regulate boost pressure, ensuring optimal engine performance under various operating conditions.',
                features: [
                    '• High-precision position sensor for accurate control',
                    '• High-temperature resistant design for stable and reliable operation',
                    '• Quick response mechanism for rapid adjustment',
                    '• High protection rating adapts to harsh environments'
                ],
                advantages: [
                    '✓ Precisely controls boost pressure to optimize performance',
                    '✓ Reduces turbo lag and enhances driving experience',
                    '✓ Protects engine from over-boost damage',
                    '✓ Extends turbocharger service life'
                ]
            },
            {
                intro: 'Precision-manufactured actuator integrating modern electronic control technology, providing intelligent pressure regulation for turbocharger systems.',
                features: [
                    '• Intelligent control algorithm with adaptive adjustment',
                    '• Low power consumption design for energy efficiency',
                    '• Modular structure for convenient maintenance',
                    '• All-weather working capability with high reliability'
                ],
                advantages: [
                    '✓ Real-time system status monitoring with fault warning',
                    '✓ Optimizes combustion efficiency and reduces emissions',
                    '✓ Compatible with multiple vehicle models for wide application',
                    '✓ Easy installation with plug-and-play functionality'
                ]
            },
            {
                intro: 'Specifically designed for modern turbocharged engines, achieving intelligent management of boost systems through precise electronic control.',
                features: [
                    '• OEM interface design for perfect compatibility',
                    '• Multiple protection mechanisms for safety and reliability',
                    '• Self-diagnostic function for easy maintenance',
                    '• Temperature compensation technology for stable performance'
                ],
                advantages: [
                    '✓ Eliminates boost pressure fluctuations for smooth power delivery',
                    '✓ Adapts to different altitude and climate conditions',
                    '✓ Reduces mechanical wear and extends service life',
                    '✓ Supports ECU online upgrade optimization'
                ]
            }
        ],
        'injector': [
            {
                intro: 'High-precision common rail injector manufactured with precision technology, ensuring accurate and consistent fuel injection for excellent combustion efficiency in modern diesel engines.',
                features: [
                    '• Ultra-high pressure injection technology for excellent atomization',
                    '• Precision nozzle design for complete combustion',
                    '• Wear-resistant materials for long service life',
                    '• Quick-response solenoid valve for precise control'
                ],
                advantages: [
                    '✓ Significantly improves fuel economy',
                    '✓ Reduces exhaust emissions for environmental compliance',
                    '✓ Reduces engine carbon deposit formation',
                    '✓ Enhances engine power and torque'
                ]
            },
            {
                intro: 'High-performance common rail injector integrating advanced fuel injection technology, providing cleaner and more efficient combustion experience for your diesel engine.',
                features: [
                    '• Multiple injection control for optimized combustion',
                    '• Anti-clogging design for convenient maintenance',
                    '• Temperature adaptive for stable performance',
                    '• Standardized interface for strong compatibility'
                ],
                advantages: [
                    '✓ Smoother engine startup',
                    '✓ Stable and quiet idle operation',
                    '✓ Quick and powerful acceleration response',
                    '✓ Reduces maintenance frequency and costs'
                ]
            },
            {
                intro: 'Professional-grade common rail injector utilizing modern electronic control technology to achieve precise fuel metering and timed injection, meeting strict emission standards.',
                features: [
                    '• Electronic control unit for intelligent adjustment',
                    '• High-strength sealing structure with no leakage',
                    '• Corrosion-resistant materials for strong adaptability',
                    '• Maintenance-free design for convenient use'
                ],
                advantages: [
                    '✓ Complies with latest emission regulation requirements',
                    '✓ Improves combustion efficiency and saves costs',
                    '✓ Reduces engine noise and vibration',
                    '✓ Supports engine ECU optimization upgrades'
                ]
            }
        ],
        'turbo-parts': [
            {
                intro: 'High-quality turbo parts manufactured with premium materials and precision processes, providing professional solutions for turbocharger repair and upgrade.',
                features: [
                    '• OEM specification manufacturing with quality assurance',
                    '• Selected premium materials for reliable performance',
                    '• Strict testing standards for first-class quality',
                    '• Complete matching solutions for convenient installation'
                ],
                advantages: [
                    '✓ Perfect match with original systems',
                    '✓ Restores optimal turbo performance',
                    '✓ Extends overall service life',
                    '✓ Reduces repair and replacement costs'
                ]
            },
            {
                intro: 'Professional turbo parts specifically designed for turbocharger maintenance, ensuring long-term stable system operation.',
                features: [
                    '• Complete series parts supply with rich selection',
                    '• Standardized production process for consistent quality',
                    '• Complete packaging protection for safe transportation',
                    '• Comprehensive technical support with installation guidance'
                ],
                advantages: [
                    '✓ Provides one-stop parts solution',
                    '✓ Reduces downtime for repairs',
                    '✓ Guarantees repair quality and effectiveness',
                    '✓ Enjoys professional technical service support'
                ]
            },
            {
                intro: 'High-quality turbo parts manufactured strictly according to OE standards, providing reliable repair parts for various turbochargers.',
                features: [
                    '• OE standard manufacturing with precise specifications',
                    '• Batch quality tracking for traceable issues',
                    '• Eco-friendly materials application for safety and reliability',
                    '• Multiple specifications available for wide application'
                ],
                advantages: [
                    '✓ Ensures normal turbo system operation',
                    '✓ Prevents failures and reduces risks',
                    '✓ Durable and reliable repair results',
                    '✓ Excellent cost-effectiveness ratio'
                ]
            }
        ],
        'others': [
            {
                intro: 'Professional automotive parts manufactured with advanced technology and premium materials, providing reliable performance assurance for your vehicle.',
                features: [
                    '• Strict quality control for stable performance',
                    '• Durable material selection for long-lasting use',
                    '• User-friendly design for convenient operation',
                    '• Wide compatibility for strong applicability'
                ],
                advantages: [
                    '✓ Enhances overall vehicle performance',
                    '✓ Reduces failure rates and maintenance costs',
                    '✓ Simple and convenient installation and maintenance',
                    '✓ Excellent cost-effectiveness and economic practicality'
                ]
            },
            {
                intro: 'High-quality automotive parts integrating modern automotive industry technology, providing professional and reliable solutions for vehicle owners.',
                features: [
                    '• Modern production equipment with advanced processes',
                    '• Multiple testing procedures for quality assurance',
                    '• Standardized packaging for complete protection',
                    '• Detailed instructions for usage guidance'
                ],
                advantages: [
                    '✓ Direct replacement for OEM parts',
                    '✓ Restores original vehicle performance',
                    '✓ Adapts to various operating environments',
                    '✓ Provides long-term reliable service'
                ]
            },
            {
                intro: 'Professional-grade automotive parts focused on providing high-quality replacement solutions for various vehicle models.',
                features: [
                    '• OEM technical standards for reliable quality',
                    '• Precision manufacturing processes for accurate dimensions',
                    '• Environmentally certified materials for safety and peace of mind',
                    '• Complete after-sales service with comprehensive support'
                ],
                advantages: [
                    '✓ Ensures safe and reliable vehicle operation',
                    '✓ Meets various operating condition requirements',
                    '✓ Simple maintenance with economic costs',
                    '✓ Enjoys professional technical support'
                ]
            }
        ]
    };

    // 随机选择一个模板
    const templates = window.globalDescriptionTemplates[category] || window.globalDescriptionTemplates['others'];
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

    let description = '';

    // 产品介绍
    description += randomTemplate.intro + '\n\n';

    // 产品特性
    description += '【Product Features】\n';
    randomTemplate.features.forEach(feature => {
        description += feature + '\n';
    });
    description += '\n';

    // 产品优势
    description += '【Product Advantages】\n';
    randomTemplate.advantages.forEach(advantage => {
        description += advantage + '\n';
    });
    description += '\n';

    // 适配信息
    if (compatibility) {
        description += '【Application】\n';
        description += `Suitable for: ${compatibility}\n\n`;
    }

    // OEM编号
    if (oeNumber) {
        description += '【OEM Number】\n';
        description += `${oeNumber.replace(/\n/g, ', ')}\n\n`;
    }

    // 服务承诺
    description += '【Service Commitment】\n';
    description += '• Genuine Guarantee: All products are OEM quality\n';
    description += '• Fast Shipping: Sufficient stock, same-day delivery\n';
    description += '• Professional Service: Technical support and installation guidance\n';
    if (warranty) {
        description += `• Quality Warranty: Provides ${warranty} months warranty period\n`;
    }
    description += '• After-sales Support: Complete after-sales service system\n\n';

    // 公司标语
    if (brand === 'Diamond-Auto') {
        description += 'Diamond-Auto - Your automotive parts expert, focusing on quality and service excellence!';
    } else {
        description += 'Wuxi Huangde International Trading Co., Ltd. - Your trusted automotive parts supplier!';
    }

    // 更新产品描述输入框
    const descriptionInput = document.getElementById('product-description');
    if (descriptionInput) {
        descriptionInput.value = description;
    }
    
    showToast('产品描述已自动生成', 'success');
}

// 智能推荐产品特性
function generateProductFeatures() {
    // 获取基本信息
    const name = document.getElementById('product-name').value;
    const model = document.getElementById('product-model').value;
    const brand = document.getElementById('product-brand').value;
    const category = document.getElementById('product-category').value;
    const price = document.getElementById('product-price').value;
    
    // 清除当前选中的特性（使用正确的类名）
    document.querySelectorAll('.feature-tag.active').forEach(tag => {
        tag.classList.remove('active');
        tag.classList.remove('btn-primary');
        tag.classList.add('btn-outline-primary');
    });
    
    // 获取所有可用的特性（从当前页面的特性标签中获取）
    const allAvailableFeatures = Array.from(document.querySelectorAll('.feature-tag')).map(tag => 
        tag.textContent.trim()
    );
    
    // 为每个产品分类定义专属的候选特性池
    let candidateFeatures = [];
    let weightedFeatures = [];
    
    // 根据分类筛选合适的特性
    switch(category) {
        case 'turbocharger':
            // 涡轮增压器专用特性
            candidateFeatures = allAvailableFeatures.filter(f => 
                f !== '精密喷射' && f !== '配件齐全' && f !== '专业工具' && f !== '原厂正品'
            );
            weightedFeatures = ['原厂品质', '高性能', '精准控制', '长寿命', '高精度'].filter(f => candidateFeatures.includes(f));
            break;
        case 'actuator':
            // 执行器专用特性
            candidateFeatures = allAvailableFeatures.filter(f => 
                f !== '精密喷射' && f !== '配件齐全' && f !== '专业工具' && f !== '原厂正品'
            );
            weightedFeatures = ['原厂品质', '精准控制', '高精度', '长寿命'].filter(f => candidateFeatures.includes(f));
            break;
        case 'injector':
            // 喷油器专用特性（可以包含精密喷射）
            candidateFeatures = allAvailableFeatures.filter(f => 
                f !== '配件齐全' && f !== '专业工具' && f !== '原厂正品'
            );
            weightedFeatures = ['原厂品质', '精密喷射', '高精度', '长寿命'].filter(f => candidateFeatures.includes(f));
            break;
        case 'turbo-parts':
            // 配件专用特性
            candidateFeatures = allAvailableFeatures.filter(f => 
                f !== '精密喷射' && f !== '原厂正品'
            );
            weightedFeatures = ['配件齐全', '专业工具', '现货充足', '原厂品质'].filter(f => candidateFeatures.includes(f));
            break;
        default:
            // 其他分类，排除特定特性
            candidateFeatures = allAvailableFeatures.filter(f => 
                f !== '精密喷射' && f !== '配件齐全' && f !== '专业工具' && f !== '原厂正品'
            );
            weightedFeatures = ['原厂品质', '高性能', '长寿命'].filter(f => candidateFeatures.includes(f));
            break;
    }
    
    // 如果是Diamond-Auto品牌，增加钻石品质的权重
    if (brand === 'Diamond-Auto' && candidateFeatures.includes('钻石品质')) {
        weightedFeatures.unshift('钻石品质');
    }
    
    // 如果是高价格产品，增加高端产品的权重
    if (price && parseFloat(price) > 200 && candidateFeatures.includes('高端产品')) {
        weightedFeatures.push('高端产品');
    }
    
    // 构建最终的候选池：优先特性 + 其他特性
    const finalCandidates = [...new Set([...weightedFeatures, ...candidateFeatures])];
    
    // 随机选择3-4个特性
    const targetCount = Math.floor(Math.random() * 2) + 3; // 随机生成3或4
    let selectedFeatures = [];
    
    // 完全随机选择，不强制任何特性
    const shuffledCandidates = [...finalCandidates].sort(() => Math.random() - 0.5);
    selectedFeatures = shuffledCandidates.slice(0, targetCount);
    
    // 在界面上选中推荐的特性
    selectedFeatures.forEach(feature => {
        const featureTag = Array.from(document.querySelectorAll('.feature-tag')).find(
            tag => tag.textContent.trim() === feature
        );
        if (featureTag) {
            // 模拟点击事件，确保样式正确切换
            featureTag.classList.add('active');
            featureTag.classList.remove('btn-outline-primary');
            featureTag.classList.add('btn-primary');
        }
    });
    
    // 更新隐藏的features字段
    document.getElementById('product-features').value = selectedFeatures.join(',');
    
    // 显示推荐提示
    showToast(`已为您随机推荐 ${selectedFeatures.length} 个产品特性：${selectedFeatures.join('、')}`, 'success');
}

// 自动生成SEO描述
function generateSEODescription() {
    // 获取基本信息
    const name = document.getElementById('product-name').value;
    const model = document.getElementById('product-model').value;
    const brand = document.getElementById('product-brand').value;
    const category = document.getElementById('product-category').value;
    const warranty = document.getElementById('product-warranty').value;
    const compatibility = document.getElementById('product-compatibility').value;
    const features = document.getElementById('product-features').value;
    
    // 产品分类英文映射
    const categoryMap = {
        'turbocharger': 'Turbocharger',
        'actuator': 'Actuator',
        'injector': 'Common Rail Injector',
        'turbo-parts': 'Turbo Parts',
        'others': 'Automotive Parts'
    };

    // 构建SEO描述
    let description = '';

    // 基本信息部分
    if (model && brand) {
        description += `${model} - ${brand} OEM ${categoryMap[category] || 'Product'}`;
    } else if (name) {
        description += name;
    }

    // 适配信息
    if (compatibility) {
        description += `, suitable for ${compatibility}`;
    }

    // 产品特性 - 翻译为英文
    if (features) {
        const featureArray = features.split(',').slice(0, 3); // 最多取3个特性
        if (featureArray.length > 0) {
            // 中文特性到英文的映射
            const featureTranslationMap = {
                '原厂品质': 'OEM Quality',
                '钻石品质': 'Diamond Quality',
                '高性能': 'High Performance',
                '精准控制': 'Precise Control',
                '精密喷射': 'Precision Injection',
                '配件齐全': 'Complete Parts',
                '专业工具': 'Professional Tools',
                '高端产品': 'Premium Product',
                '现货充足': 'In Stock',
                '原厂正品': 'Original Genuine',
                '高精度': 'High Precision',
                '长寿命': 'Long Life'
            };

            // 翻译特性标签
            const translatedFeatures = featureArray.map(feature => {
                const trimmedFeature = feature.trim();
                return featureTranslationMap[trimmedFeature] || trimmedFeature;
            });

            description += `. ${translatedFeatures.join(', ')}`;
        }
    }

    // 质保信息
    if (warranty) {
        description += `. Provides ${warranty} months warranty`;
    }

    // 公司标语
    description += '. Wuxi Huangde International Trading Co., Ltd. professionally provides high-quality automotive parts.';

    // 更新SEO描述输入框
    const seoDescriptionInput = document.getElementById('product-meta-description');
    if (seoDescriptionInput) {
        seoDescriptionInput.value = description;
    }

    // 自动生成SEO关键词
    generateSEOKeywords();
}

// 自动生成SEO关键词
function generateSEOKeywords() {
    const name = document.getElementById('product-name').value;
    const model = document.getElementById('product-model').value;
    const brand = document.getElementById('product-brand').value;
    const category = document.getElementById('product-category').value;
    const features = document.getElementById('product-features').value;

    let keywords = [];

    // 添加品牌
    if (brand) keywords.push(brand);

    // 添加型号
    if (model) keywords.push(model);

    // 添加分类
    const categoryMap = {
        'turbocharger': ['turbocharger', 'turbo charger', 'boost system'],
        'actuator': ['actuator', 'turbo actuator', 'boost control'],
        'injector': ['common rail injector', 'fuel injector', 'diesel injector'],
        'turbo-parts': ['turbo parts', 'turbocharger parts', 'turbo components'],
        'others': ['automotive parts', 'engine parts', 'auto components']
    };

    if (category && categoryMap[category]) {
        keywords = keywords.concat(categoryMap[category]);
    }

    // 添加特性 - 翻译为英文
    if (features) {
        // 中文特性到英文的映射
        const featureTranslationMap = {
            '原厂品质': 'OEM Quality',
            '钻石品质': 'Diamond Quality',
            '高性能': 'High Performance',
            '精准控制': 'Precise Control',
            '精密喷射': 'Precision Injection',
            '配件齐全': 'Complete Parts',
            '专业工具': 'Professional Tools',
            '高端产品': 'Premium Product',
            '现货充足': 'In Stock',
            '原厂正品': 'Original Genuine',
            '高精度': 'High Precision',
            '长寿命': 'Long Life'
        };

        // 翻译特性标签
        const translatedFeatures = features.split(',').map(feature => {
            const trimmedFeature = feature.trim();
            return featureTranslationMap[trimmedFeature] || trimmedFeature;
        });

        keywords = keywords.concat(translatedFeatures);
    }

    // 添加固定关键词
    keywords.push('Wuxi Huangde');
    keywords.push('automotive parts');
    keywords.push('OEM parts');

    // 去重并限制数量
    const uniqueKeywords = [...new Set(keywords)].slice(0, 10);

    // 更新SEO关键词输入框
    const seoKeywordsInput = document.getElementById('product-meta-keywords');
    if (seoKeywordsInput) {
        seoKeywordsInput.value = uniqueKeywords.join(',');
    }
}

// 设置自动生成功能的触发器
function setupSEOGenerators() {
    const triggerFields = [
        'product-name',
        'product-model',
        'product-brand',
        'product-category',
        'product-warranty',
        'product-compatibility'
    ];

    // 智能自动生成处理函数
    const handleAutoGeneration = () => {
        // 检查是否有足够的基本信息
        const name = document.getElementById('product-name').value;
        const model = document.getElementById('product-model').value;
        const category = document.getElementById('product-category').value;
        
        // 如果有产品名称或型号，且选择了分类，则开始智能生成
        if ((name || model) && category) {
            // 检查产品特性是否为空，如果为空则自动生成
            const featuresValue = document.getElementById('product-features').value;
            if (!featuresValue || featuresValue.trim() === '') {
                setTimeout(() => {
                    generateProductFeatures();
                    
                    // 等待特性生成完成后再生成描述
                    setTimeout(() => {
                        generateProductDescription();
                        
                        // 最后生成SEO信息
                        setTimeout(() => {
                            generateSEODescription();
                        }, 300);
                    }, 300);
                }, 100);
            } else {
                // 如果特性已存在，只检查描述
                const descriptionValue = document.getElementById('product-description').value;
                if (!descriptionValue || descriptionValue.trim() === '') {
                    setTimeout(() => {
                        generateProductDescription();
                        
                        // 生成描述后再生成SEO
                        setTimeout(() => {
                            generateSEODescription();
                        }, 300);
                    }, 100);
                } else {
                    // 如果特性和描述都有，只生成SEO
                    setTimeout(generateSEODescription, 100);
                }
            }
        }
    };

    // 为基本信息字段添加监听器
    triggerFields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            element.addEventListener('change', handleAutoGeneration);
            element.addEventListener('blur', handleAutoGeneration);
        }
    });

    // 为特性标签添加点击事件（仅生成SEO信息）
    document.querySelectorAll('.feature-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            setTimeout(generateSEODescription, 100); // 延迟执行以确保features值已更新
        });
    });
}

// 添加一键生成所有内容的功能
function generateAllContent() {
    // 检查必要字段是否填写
    const name = document.getElementById('product-name').value;
    const model = document.getElementById('product-model').value;
    
    if (!name && !model) {
        showToast('请先填写产品名称或产品型号', 'warning');
        return;
    }
    
    // 依次生成所有内容
    generateProductFeatures();
    generateAddOENumber();
    generateAddCompatibility();
    generateAddNotes();
    setTimeout(() => {
        generateProductDescription();
        setTimeout(() => {
            generateSEODescription();
            showToast('已为您自动生成所有产品信息！', 'success');
        }, 200);
    }, 200);
}

// 编辑模式下一键生成所有内容
function generateAllEditContent() {
    const name = document.getElementById('editProductName').value;
    const model = document.getElementById('editProductModel').value;
    const category = document.getElementById('editProductCategory').value;
    
    if (!name && !model) {
        showToast('请先填写产品名称或产品型号', 'warning');
        return;
    }
    
    if (!category) {
        showToast('请先选择产品分类', 'warning');
        return;
    }
    
    // 依次生成内容
    generateEditProductFeatures();
    generateEditOENumber();
    generateEditCompatibility(); 
    generateEditNotes();
    setTimeout(() => {
        generateEditProductDescription();
        setTimeout(() => {
            generateEditSEODescription();
            showToast('已为您自动生成所有产品信息！', 'success');
        }, 200);
    }, 200);
}

// 编辑模式下生成产品特性
function generateEditProductFeatures() {
    const category = document.getElementById('editProductCategory').value;
    
    if (!category) {
        showToast('请先选择产品分类', 'warning');
        return;
    }
    
    // 先清除所有选择
    document.querySelectorAll('#editFeatureTags .feature-tag').forEach(tag => {
        tag.classList.remove('active', 'btn-primary');
        tag.classList.add('btn-outline-primary');
    });
    
    // 根据分类设置特性选择范围
    let excludedFeatures = [];
    
    switch(category) {
        case 'turbocharger':
            excludedFeatures = ['精密喷射', '配件齐全', '专业工具', '原厂正品'];
            break;
        case 'actuator':
            excludedFeatures = ['精密喷射', '配件齐全', '专业工具', '原厂正品'];
            break;
        case 'injector':
            excludedFeatures = ['配件齐全', '专业工具', '原厂正品'];
            break;
        case 'turbo-parts':
            excludedFeatures = ['精密喷射', '原厂正品'];
            break;
        case 'others':
            excludedFeatures = ['精密喷射', '配件齐全', '专业工具', '原厂正品'];
            break;
        default:
            excludedFeatures = ['精密喷射', '原厂正品'];
    }
    
    // 获取可用特性
    const allFeatures = Array.from(document.querySelectorAll('#editFeatureTags .feature-tag')).map(tag => 
        tag.getAttribute('data-feature')
    );
    const candidateFeatures = allFeatures.filter(f => !excludedFeatures.includes(f));
    
    // 随机选择3-4个特性
    const numFeatures = Math.floor(Math.random() * 2) + 3; // 3或4个特性
    const shuffled = candidateFeatures.sort(() => 0.5 - Math.random());
    const selectedFeatures = shuffled.slice(0, numFeatures);
    
    // 应用选择
    selectedFeatures.forEach(feature => {
        const featureTag = document.querySelector(`#editFeatureTags .feature-tag[data-feature="${feature}"]`);
        if (featureTag) {
            featureTag.classList.remove('btn-outline-primary');
            featureTag.classList.add('active', 'btn-primary');
        }
    });
    
    // 更新隐藏字段
    updateEditFeaturesValue();
    
    showToast('产品特性生成完成！', 'success');
}

// 编辑模式下生成产品描述
function generateEditProductDescription() {
    const name = document.getElementById('editProductName').value;
    const model = document.getElementById('editProductModel').value;
    const category = document.getElementById('editProductCategory').value;
    const brand = document.getElementById('editProductBrand').value;
    const warranty = document.getElementById('editProductWarranty').value;
    const compatibility = document.getElementById('editProductCompatibility').value;
    const features = document.getElementById('editProductFeatures').value;

    if (!category) {
        showToast('请先选择产品分类', 'warning');
        return;
    }

    // 复用产品描述生成逻辑
    let description = '';

    // 使用全局描述模板（已在前面定义为英文版本）
    const descriptionTemplates = window.globalDescriptionTemplates;
    // 检查全局模板是否存在，如果不存在则使用默认模板
    if (!descriptionTemplates) {
        showToast('模板加载失败，请刷新页面重试', 'error');
        return;
    }







    // 随机选择一个模板
    const templates = descriptionTemplates[category] || descriptionTemplates['others'];
    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    // 构建产品描述
    description += selectedTemplate.intro + '\n\n';
    
    // 产品特性
    description += '【Product Features】\n';
    selectedTemplate.features.forEach(feature => {
        description += feature + '\n';
    });
    description += '\n';

    // 产品优势
    description += '【Product Advantages】\n';
    selectedTemplate.advantages.forEach(advantage => {
        description += advantage + '\n';
    });
    description += '\n';

    // 适配信息
    if (compatibility) {
        description += '【Application】\n';
        description += `Suitable for: ${compatibility}\n\n`;
    }

    // OEM信息（如果有）
    const oeNumber = document.getElementById('editProductOe').value;
    if (oeNumber) {
        description += '【OEM Number】\n';
        description += oeNumber.replace(/\n/g, ', ') + '\n\n';
    }
    
    // 质保信息
    if (warranty) {
        description += '【Quality Assurance】\n';
        description += `• Provides ${warranty} months quality warranty\n`;
        description += '• Strict quality testing ensures product reliability\n';
        description += '• Professional technical support solves usage issues\n\n';
    }

    // 公司服务承诺
    description += '【Service Commitment】\n';
    description += '• OEM quality standards with quality assurance\n';
    description += '• Stock supply with fast shipping\n';
    description += '• Professional technical support and installation guidance\n';
    description += '• Complete after-sales service for customer satisfaction\n\n';

    // 公司标语
    description += 'Diamond-Auto - Your trusted automotive parts supplier!';

    document.getElementById('editProductDescription').value = description;
    showToast('产品描述生成完成！', 'success');
}

// 编辑模式下生成SEO信息
function generateEditSEODescription() {
    const name = document.getElementById('editProductName').value;
    const model = document.getElementById('editProductModel').value;
    const category = document.getElementById('editProductCategory').value;
    const brand = document.getElementById('editProductBrand').value;
    const compatibility = document.getElementById('editProductCompatibility').value;
    const features = document.getElementById('editProductFeatures').value;

    if (!name && !model) {
        showToast('请先填写产品名称或型号', 'warning');
        return;
    }

    // 产品分类英文映射
    const categoryMap = {
        'turbocharger': 'Turbocharger',
        'actuator': 'Actuator',
        'injector': 'Common Rail Injector',
        'turbo-parts': 'Turbo Parts',
        'others': 'Automotive Parts'
    };

    // 生成SEO描述
    const productTitle = name || model;
    const categoryName = categoryMap[category] || 'Automotive Parts';

    let seoDescription = `${productTitle} - Professional ${categoryName}`;
    if (brand && brand !== 'Diamond-Auto') {
        seoDescription += `, ${brand} Brand`;
    }
    seoDescription += ', Diamond-Auto provides OEM quality products';
    if (compatibility) {
        const firstCompatibility = compatibility.split(',')[0].trim();
        seoDescription += `, suitable for ${firstCompatibility}`;
    }
    seoDescription += '. Stock supply, quality assurance, professional service.';

    // 生成关键词
    let keywords = [productTitle, categoryName, 'Diamond-Auto'];
    if (brand && brand !== 'Diamond-Auto') {
        keywords.push(brand);
    }
    if (compatibility) {
        const compatibilityList = compatibility.split(',').map(c => c.trim()).slice(0, 3);
        keywords.push(...compatibilityList);
    }
    if (features) {
        // 中文特性到英文的映射
        const featureTranslationMap = {
            '原厂品质': 'OEM Quality',
            '钻石品质': 'Diamond Quality',
            '高性能': 'High Performance',
            '精准控制': 'Precise Control',
            '精密喷射': 'Precision Injection',
            '配件齐全': 'Complete Parts',
            '专业工具': 'Professional Tools',
            '高端产品': 'Premium Product',
            '现货充足': 'In Stock',
            '原厂正品': 'Original Genuine',
            '高精度': 'High Precision',
            '长寿命': 'Long Life'
        };

        // 翻译特性标签
        const featureList = features.split(',').map(f => {
            const trimmedFeature = f.trim();
            return featureTranslationMap[trimmedFeature] || trimmedFeature;
        }).slice(0, 5);

        keywords.push(...featureList);
    }
    keywords.push('OEM Quality', 'Stock Supply', 'Professional Service');

    document.getElementById('editProductMetaDescription').value = seoDescription;
    document.getElementById('editProductMetaKeywords').value = keywords.join(', ');
    
    showToast('SEO信息生成完成！', 'success');
}

// 批量更新现有产品的缺失字段
async function batchUpdateProductFields() {
    if (!confirm('确定要为所有现有产品批量生成缺失的字段吗？这可能需要一些时间。')) {
        return;
    }
    
    showLoadingState();
    showToast('正在批量更新产品字段，请稍候...', 'info');
    
    try {
        // 获取所有产品
        const response = await fetch('/api/products');
        const products = await response.json();
        
        let updatedCount = 0;
        let totalCount = products.length;
        
        for (const product of products) {
            // 检查是否需要更新 - 不仅检查是否存在，还要检查是否为空
            const needsUpdate = !product.oe_number || product.oe_number.trim() === '' ||
                               !product.compatibility || product.compatibility.trim() === '' ||
                               !product.notes || product.notes.trim() === '' ||
                               !product.meta_description || !product.features || 
                               !product.warranty || !product.brand;
            
            if (needsUpdate) {
                // 构建更新数据
                const updateData = {
                    ...product,
                    brand: product.brand || 'Diamond-Auto',
                    warranty: product.warranty || '12',
                    oe_number: product.oe_number || generateDefaultOENumber(product),
                    compatibility: product.compatibility || generateDefaultCompatibility(product),
                    notes: product.notes || generateDefaultNotes(product),
                    meta_description: product.meta_description || generateDefaultSEO(product),
                    meta_keywords: product.meta_keywords || generateDefaultKeywords(product),
                    features: product.features || generateDefaultFeatures(product.category),
                    isNew: product.isNew || 'false',
                    isHot: product.isHot || 'false',
                    isRecommend: product.isRecommend || 'false'
                };
                
                // 发送更新请求
                const formData = new FormData();
                Object.keys(updateData).forEach(key => {
                    if (updateData[key] !== undefined && updateData[key] !== null) {
                        formData.append(key, updateData[key]);
                    }
                });
                
                const updateResponse = await fetch(`/api/products/${product.id}`, {
                    method: 'PUT',
                    body: formData
                });
                
                if (updateResponse.ok) {
                    updatedCount++;
                }
            }
        }
        
        showToast(`批量更新完成！共更新了 ${updatedCount}/${totalCount} 个产品`, 'success');
        loadProductsWithPagination(currentPageNum); // 重新加载产品列表，保持当前页面
        
    } catch (error) {
        console.error('批量更新失败:', error);
        showToast('批量更新失败，请重试', 'error');
    } finally {
        hideLoadingState();
    }
}

// 生成默认SEO描述
function generateDefaultSEO(product) {
    const categoryMap = {
        'turbocharger': '涡轮增压器',
        'actuator': '执行器', 
        'injector': '共轨喷油器',
        'turbo-parts': '涡轮配件',
        'others': '汽车配件'
    };
    
    const productTitle = product.name || product.model || '产品';
    const categoryName = categoryMap[product.category] || '汽车配件';
    
    return `${productTitle} - 专业${categoryName}，Diamond-Auto提供原厂品质产品。现货供应，质量保证，专业服务。`;
}

// 生成默认关键词
function generateDefaultKeywords(product) {
    const categoryMap = {
        'turbocharger': '涡轮增压器,turbocharger',
        'actuator': '执行器,actuator',
        'injector': '共轨喷油器,injector',
        'turbo-parts': '涡轮配件,turbo parts',
        'others': '汽车配件,auto parts'
    };
    
    let keywords = [product.name || product.model, 'Diamond-Auto'];
    if (categoryMap[product.category]) {
        keywords.push(...categoryMap[product.category].split(','));
    }
    keywords.push('原厂品质', '现货供应');
    
    return keywords.join(', ');
}

// 生成默认特性（批量更新专用，不包含原厂正品）
function generateDefaultFeatures(category) {
    const defaultFeatures = {
        'turbocharger': ['原厂品质', '高性能', '长寿命'],
        'actuator': ['原厂品质', '精准控制', '高精度'],
        'injector': ['原厂品质', '精密喷射', '高精度'],
        'turbo-parts': ['原厂品质', '配件齐全', '现货充足'],
        'others': ['原厂品质', '高性能', '长寿命']
    };
    
    return (defaultFeatures[category] || defaultFeatures['others']).join(',');
}

// 生成默认OEM号
function generateDefaultOENumber(product) {
    const prefix = product.model || product.name || 'HD';
    const categoryCode = {
        'turbocharger': 'TC',
        'actuator': 'ACT', 
        'injector': 'INJ',
        'turbo-parts': 'TP',
        'others': 'OT'
    }[product.category] || 'HD';
    
    return `${prefix}-${categoryCode}-001\n${prefix}-${categoryCode}-002\n${prefix}-${categoryCode}-003`;
}

// 生成默认适配信息
function generateDefaultCompatibility(product) {
    const categoryTemplates = {
        'turbocharger': [
            '大众系列: 1.4T, 1.8T, 2.0T发动机',
            '奥迪系列: A3, A4, A5, Q5等车型',
            '斯柯达系列: 明锐, 速派等车型'
        ],
        'actuator': [
            '适用于GT1749V, GT2256V等涡轮型号',
            '兼容大众奥迪1.9L TDI发动机',
            '支持宝马奔驰3.0L柴油发动机'
        ],
        'injector': [
            '博世0445系列共轨系统',
            '大陆VDO喷油器系统',
            '德尔福DELPHI喷射系统'
        ],
        'turbo-parts': [
            '适用于主流涡轮增压器',
            '兼容Garrett, BorgWarner品牌',
            '支持多种发动机规格'
        ],
        'others': [
            '通用型汽车配件',
            '适用于多种车型',
            '兼容主流发动机'
        ]
    };
    
    const templates = categoryTemplates[product.category] || categoryTemplates['others'];
    return templates.join('\n');
}

// 生成默认备注信息
function generateDefaultNotes(product) {
    const notes = [
        '产品均为原厂品质，质量保证',
        '支持全球发货，现货充足',
        '提供专业技术支持和售后服务'
    ];
    
    if (product.category === 'turbocharger') {
        notes.push('安装前请检查机油清洁度');
        notes.push('建议同时更换机油和机滤');
    } else if (product.category === 'actuator') {
        notes.push('安装时注意真空管路连接');
        notes.push('定期检查执行器工作状态');
    } else if (product.category === 'injector') {
        notes.push('使用前请确保燃油系统清洁');
        notes.push('建议定期清洗喷油器');
    }
    
    return notes.join('\n');
}

// 编辑模式下生成OEM号
function generateEditOENumber() {
    const product = {
        name: document.getElementById('editProductName').value,
        model: document.getElementById('editProductModel').value,
        category: document.getElementById('editProductCategory').value
    };
    
    const oeNumber = generateDefaultOENumber(product);
    document.getElementById('editProductOe').value = oeNumber;
}

// 编辑模式下生成适配信息
function generateEditCompatibility() {
    const product = {
        category: document.getElementById('editProductCategory').value
    };
    
    const compatibility = generateDefaultCompatibility(product);
    document.getElementById('editProductCompatibility').value = compatibility;
}

// 编辑模式下生成备注信息
function generateEditNotes() {
    const product = {
        category: document.getElementById('editProductCategory').value
    };
    
    const notes = generateDefaultNotes(product);
    document.getElementById('editProductNotes').value = notes;
}

// 添加产品页面下生成OEM号
function generateAddOENumber() {
    const product = {
        name: document.getElementById('product-name').value,
        model: document.getElementById('product-model').value,
        category: document.getElementById('product-category').value
    };
    
    const oeNumber = generateDefaultOENumber(product);
    document.getElementById('product-oe').value = oeNumber;
}

// 添加产品页面下生成适配信息
function generateAddCompatibility() {
    const product = {
        category: document.getElementById('product-category').value
    };
    
    const compatibility = generateDefaultCompatibility(product);
    document.getElementById('product-compatibility').value = compatibility;
}

// 添加产品页面下生成备注信息
function generateAddNotes() {
    const product = {
        category: document.getElementById('product-category').value
    };
    
    const notes = generateDefaultNotes(product);
    document.getElementById('product-notes').value = notes;
} 

// 自动分配产品标签
async function autoAssignProductTags() {
    if (!confirm('确定要根据上架时间和点击率自动分配产品标签吗？\n\n规则：\n• 上架不超过1个月 → 新品\n• 点击率前10% → 热门\n• 其余产品 → 推荐')) {
        return;
    }
    
    showLoadingState();
    showToast('正在分析产品数据并分配标签，请稍候...', 'info');
    
    try {
        const response = await fetch('/api/products/auto-assign-tags', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast(`自动标签分配完成！\n共更新 ${result.updatedCount} 个产品\n新品: ${result.stats.new} 个\n热门: ${result.stats.hot} 个\n推荐: ${result.stats.recommend} 个`, 'success');
            loadProductsWithPagination(currentPageNum); // 重新加载产品列表，保持当前页面
        } else {
            throw new Error(result.error || '自动分配标签失败');
        }
        
    } catch (error) {
        console.error('自动分配标签失败:', error);
        showToast('自动分配标签失败，请重试', 'error');
    } finally {
        hideLoadingState();
    }
}

// 显示产品统计信息
async function showProductStats() {
    showLoadingState();
    
    try {
        const response = await fetch('/api/analytics/product-stats');
        const productStats = await response.json();
        
        if (!response.ok) {
            throw new Error('获取产品统计失败');
        }
        
        // 创建统计模态框
        const modalHTML = `
            <div class="modal fade" id="productStatsModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="bi bi-graph-up me-2"></i>产品点击统计
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <h6>统计概览</h6>
                                <div class="row">
                                    <div class="col-md-3">
                                        <div class="card bg-primary text-white">
                                            <div class="card-body text-center">
                                                <h4>${productStats.length}</h4>
                                                <p class="mb-0">总产品数</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="card bg-success text-white">
                                            <div class="card-body text-center">
                                                <h4>${productStats.filter(p => p.isNew === 'true').length}</h4>
                                                <p class="mb-0">新品</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="card bg-danger text-white">
                                            <div class="card-body text-center">
                                                <h4>${productStats.filter(p => p.isHot === 'true').length}</h4>
                                                <p class="mb-0">热门</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="card bg-info text-white">
                                            <div class="card-body text-center">
                                                <h4>${productStats.filter(p => p.isRecommend === 'true').length}</h4>
                                                <p class="mb-0">推荐</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>产品名称</th>
                                            <th>上架时间</th>
                                            <th>总点击数</th>
                                            <th>近期点击</th>
                                            <th>当前标签</th>
                                            <th>状态</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${productStats
                                            .sort((a, b) => b.total_clicks - a.total_clicks)
                                            .map(product => {
                                                const createdDate = new Date(product.createdAt);
                                                const now = new Date();
                                                const daysDiff = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
                                                const isNewProduct = daysDiff <= 30;
                                                
                                                let currentTags = [];
                                                if (product.isNew === 'true') currentTags.push('<span class="badge bg-success">新品</span>');
                                                if (product.isHot === 'true') currentTags.push('<span class="badge bg-danger">热门</span>');
                                                if (product.isRecommend === 'true') currentTags.push('<span class="badge bg-info">推荐</span>');
                                                
                                                return `
                                                    <tr>
                                                        <td>${product.name}</td>
                                                        <td>
                                                            ${createdDate.toLocaleDateString('zh-CN')}
                                                            ${isNewProduct ? '<small class="text-success">(新品期)</small>' : ''}
                                                        </td>
                                                        <td>${product.total_clicks}</td>
                                                        <td>${product.recent_clicks}</td>
                                                        <td>${currentTags.join(' ') || '<span class="badge bg-secondary">无标签</span>'}</td>
                                                        <td>
                                                            ${daysDiff <= 30 ? '<span class="text-success">新品期</span>' : 
                                                              product.total_clicks > 10 ? '<span class="text-danger">高点击</span>' : 
                                                              '<span class="text-muted">普通</span>'}
                                                        </td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-success" onclick="autoAssignProductTags(); document.getElementById('productStatsModal').querySelector('.btn-close').click();">
                                <i class="bi bi-tags me-2"></i>立即自动分配标签
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 移除现有模态框（如果存在）
        const existingModal = document.getElementById('productStatsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // 添加新模态框
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // 显示模态框
        const modal = new bootstrap.Modal(document.getElementById('productStatsModal'));
        modal.show();
        
    } catch (error) {
        console.error('获取产品统计失败:', error);
        showToast('获取产品统计失败，请重试', 'error');
    } finally {
        hideLoadingState();
    }
}

// ===== 分页功能相关函数 =====

// 从UI获取筛选参数
function updateFiltersFromUI() {
    currentFilters.search = document.getElementById('search-products')?.value || '';
    currentFilters.category = document.getElementById('filter-category')?.value || '';
    currentFilters.status = document.getElementById('filter-status')?.value || '';
    
    // 获取排序参数
    const sortBy = document.getElementById('sort-by')?.value || 'id-desc';
    const [field, order] = sortBy.split('-');
    currentFilters.sortBy = field;
    currentFilters.sortOrder = order;
    
    // 获取每页数量
    currentPageSize = parseInt(document.getElementById('page-size')?.value) || 24;
}

// 渲染分页组件
function renderPagination(pagination) {
    const paginationContainer = document.getElementById('pagination-container');
    const paginationList = document.getElementById('pagination');
    
    if (!paginationContainer || !paginationList) return;
    
    if (pagination.total <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'block';
    
    let paginationHTML = '';
    
    // 上一页
    if (pagination.hasPrev) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="goToPage(${pagination.prevPage})" aria-label="上一页">
                    <span aria-hidden="true">&laquo;</span>
                </a>
            </li>
        `;
    } else {
        paginationHTML += `
            <li class="page-item disabled">
                <span class="page-link" aria-label="上一页">
                    <span aria-hidden="true">&laquo;</span>
                </span>
            </li>
        `;
    }
    
    // 页码计算
    const current = pagination.current;
    const total = pagination.total;
    let startPage = Math.max(1, current - 2);
    let endPage = Math.min(total, current + 2);
    
    // 调整显示范围，确保显示5个页码
    if (endPage - startPage < 4) {
        if (startPage === 1) {
            endPage = Math.min(total, startPage + 4);
        } else if (endPage === total) {
            startPage = Math.max(1, endPage - 4);
        }
    }
    
    // 第一页
    if (startPage > 1) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="goToPage(1)">1</a>
            </li>
        `;
        if (startPage > 2) {
            paginationHTML += `
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            `;
        }
    }
    
    // 页码范围
    for (let i = startPage; i <= endPage; i++) {
        if (i === current) {
            paginationHTML += `
                <li class="page-item active">
                    <span class="page-link">${i}</span>
                </li>
            `;
        } else {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="goToPage(${i})">${i}</a>
                </li>
            `;
        }
    }
    
    // 最后一页
    if (endPage < total) {
        if (endPage < total - 1) {
            paginationHTML += `
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            `;
        }
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="goToPage(${total})">${total}</a>
            </li>
        `;
    }
    
    // 下一页
    if (pagination.hasNext) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="goToPage(${pagination.nextPage})" aria-label="下一页">
                    <span aria-hidden="true">&raquo;</span>
                </a>
            </li>
        `;
    } else {
        paginationHTML += `
            <li class="page-item disabled">
                <span class="page-link" aria-label="下一页">
                    <span aria-hidden="true">&raquo;</span>
                </span>
            </li>
        `;
    }
    
    paginationList.innerHTML = paginationHTML;
}

// 跳转到指定页面
function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    loadProductsWithPagination(page);
}

// 更新产品信息显示
function updateProductsInfo(pagination) {
    const infoElement = document.getElementById('products-info');
    if (infoElement) {
        const start = (pagination.current - 1) * pagination.limit + 1;
        const end = Math.min(pagination.current * pagination.limit, pagination.totalItems);
        infoElement.textContent = `显示 ${start}-${end} 个，共 ${pagination.totalItems} 个产品`;
    }
}

// 显示产品加载状态
function showProductsLoading() {
    const loadingElement = document.getElementById('products-loading');
    const listElement = document.getElementById('products-list');
    const paginationElement = document.getElementById('pagination-container');
    
    if (loadingElement) loadingElement.style.display = 'block';
    if (listElement) listElement.style.opacity = '0.5';
    if (paginationElement) paginationElement.style.display = 'none';
}

// 隐藏产品加载状态
function hideProductsLoading() {
    const loadingElement = document.getElementById('products-loading');
    const listElement = document.getElementById('products-list');
    
    if (loadingElement) loadingElement.style.display = 'none';
    if (listElement) listElement.style.opacity = '1';
}

// 显示产品加载错误
function showProductsError() {
    const container = document.getElementById('products-list');
    if (container) {
        container.innerHTML = `
            <div class="col-12 text-center text-muted py-5">
                <i class="bi bi-exclamation-triangle fs-1 d-block mb-2 text-warning"></i>
                <h5>加载产品失败</h5>
                <p class="mb-3">请检查网络连接或稍后再试</p>
                <button class="btn btn-primary" onclick="loadProductsWithPagination(1, true)">
                    <i class="bi bi-arrow-clockwise me-2"></i>重新加载
                </button>
            </div>
        `;
    }
}

// 更新筛选功能以支持分页
function filterProducts() {
    // 重置到第一页并重新加载
    loadProductsWithPagination(1, true);
}

// 重写更新统计数据函数以兼容分页
async function updateStats() {
    // 使用分页数据或全局计数
    const totalProductsCount = totalProducts || products.length;
    const activeProducts = products.filter(p => p.status === 'active').length;
    const totalCategoriesCount = categories.length;
    
    // 修复图片计数：正确处理新旧数据格式
    let totalImages = 0;
    products.forEach(p => {
        if (p.images && Array.isArray(p.images)) {
            // 新格式：images数组
            totalImages += p.images.length;
        } else if (p.image && p.image.trim() !== '') {
            // 旧格式：单个image字段
            totalImages += 1;
        }
    });
    
    document.getElementById('total-products').textContent = totalProductsCount;
    document.getElementById('active-products').textContent = activeProducts;
    document.getElementById('total-categories').textContent = totalCategoriesCount;
    document.getElementById('total-images').textContent = totalImages;
    
    // 更新分析数据统计
    await updateAnalyticsStats();
}

// 添加键盘快捷键支持
document.addEventListener('keydown', function(e) {
    // 只在产品页面生效
    if (currentPage !== 'products') return;
    
    // 防止在输入框中触发
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
    }
    
    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            if (currentPageNum > 1) {
                goToPage(currentPageNum - 1);
            }
            break;
        case 'ArrowRight':
            e.preventDefault();
            if (currentPageNum < totalPages) {
                goToPage(currentPageNum + 1);
            }
            break;
        case 'Home':
            e.preventDefault();
            goToPage(1);
            break;
        case 'End':
            e.preventDefault();
            goToPage(totalPages);
            break;
    }
}); 

// ===== 询价管理相关函数 =====
let currentInquiryId = null;

// 询价管理相关变量
let currentInquiryPage = 1;
let inquiryPageSize = 20;
let totalInquiries = 0;
let filteredInquiries = [];

// 加载询价列表
async function loadInquiries() {
    try {
        // 隐藏加载行
        const loadingRow = document.getElementById('inquiry-loading-row');
        if (loadingRow) {
            loadingRow.style.display = 'none';
        }

        const response = await fetch('/api/inquiries');
        if (!response.ok) {
            throw new Error('获取询价列表失败');
        }
        const inquiries = await response.json();

        // 获取筛选条件
        const statusFilter = document.getElementById('inquiry-status-filter').value;
        const dateFilter = document.getElementById('inquiry-date-filter').value;
        const searchFilter = document.getElementById('inquiry-search-filter').value.toLowerCase();

        // 过滤询价记录
        filteredInquiries = inquiries.filter(inquiry => {
            let matches = true;

            // 状态筛选
            if (statusFilter && inquiry.status !== statusFilter) {
                matches = false;
            }

            // 日期筛选
            if (dateFilter) {
                const filterDate = new Date(dateFilter).toISOString().split('T')[0];
                if (inquiry.createdAt.split('T')[0] !== filterDate) {
                    matches = false;
                }
            }

            // 搜索筛选
            if (searchFilter) {
                const searchText = `${inquiry.name} ${inquiry.email} ${inquiry.phone || ''}`.toLowerCase();
                if (!searchText.includes(searchFilter)) {
                    matches = false;
                }
            }

            return matches;
        });

        totalInquiries = filteredInquiries.length;

        // 更新统计信息
        updateInquiryStats(inquiries);

        // 分页处理
        const startIndex = (currentInquiryPage - 1) * inquiryPageSize;
        const endIndex = startIndex + inquiryPageSize;
        const pageInquiries = filteredInquiries.slice(startIndex, endIndex);

        // 渲染询价列表
        renderInquiryList(pageInquiries);

        // 更新分页信息
        updateInquiryPagination();

    } catch (error) {
        console.error('加载询价列表失败:', error);
        showToast('加载询价列表失败，请刷新页面重试', 'danger');

        // 显示错误状态
        const tbody = document.getElementById('inquiry-list');
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5">
                    <div class="text-danger">
                        <i class="bi bi-exclamation-triangle fs-1"></i>
                        <div class="mt-2">加载失败，请刷新页面重试</div>
                    </div>
                </td>
            </tr>
        `;
    }
}

// 渲染询价列表
function renderInquiryList(inquiries) {
    const tbody = document.getElementById('inquiry-list');

    if (inquiries.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5">
                    <div class="text-muted">
                        <i class="bi bi-inbox fs-1"></i>
                        <div class="mt-2">暂无询价记录</div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';

    inquiries.forEach(inquiry => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <span class="badge bg-light text-dark">#${inquiry.id.slice(-6)}</span>
            </td>
            <td>
                <div class="inquiry-customer-info">
                    <div class="inquiry-customer-name">${inquiry.name}</div>
                    <div class="inquiry-customer-email">
                        <i class="bi bi-envelope me-1"></i>${inquiry.email}
                    </div>
                    ${inquiry.phone ? `<div class="inquiry-customer-phone">
                        <i class="bi bi-telephone me-1"></i>${inquiry.phone}
                    </div>` : ''}
                </div>
            </td>
            <td>
                <div class="inquiry-product-info">
                    <div class="inquiry-product-name">
                        ${inquiry.productInfo ? inquiry.productInfo.name : '未指定产品'}
                    </div>
                    <div class="inquiry-product-model">
                        ${inquiry.productInfo ? (inquiry.productInfo.model || '未指定型号') : ''}
                    </div>
                </div>
            </td>
            <td>
                <div class="inquiry-message-preview" title="${inquiry.message}">
                    ${inquiry.message}
                </div>
            </td>
            <td>
                <span class="badge inquiry-status-badge ${getStatusBadgeClass(inquiry.status)}">
                    ${getStatusText(inquiry.status)}
                </span>
            </td>
            <td>
                <div class="inquiry-date-info">
                    <div class="inquiry-date">${formatDate(inquiry.createdAt)}</div>
                    <div class="inquiry-time">${formatTime(inquiry.createdAt)}</div>
                </div>
            </td>
            <td>
                <div class="inquiry-actions">
                    <button class="btn btn-outline-primary btn-inquiry-detail" onclick="showInquiryDetail('${inquiry.id}')">
                        <i class="bi bi-eye me-1"></i>详情
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 更新询价统计信息
function updateInquiryStats(inquiries) {
    const stats = {
        pending: 0,
        processing: 0,
        completed: 0,
        cancelled: 0
    };

    inquiries.forEach(inquiry => {
        if (stats.hasOwnProperty(inquiry.status)) {
            stats[inquiry.status]++;
        }
    });

    // 更新显示
    document.getElementById('pending-inquiries-display').textContent = stats.pending;
    document.getElementById('processing-inquiries-display').textContent = stats.processing;
    document.getElementById('completed-inquiries-display').textContent = stats.completed;

    // 更新导航栏的待处理数量
    const pendingCountElement = document.getElementById('pending-inquiries-count');
    if (pendingCountElement) {
        pendingCountElement.textContent = stats.pending;
    }

    // 更新总数显示
    document.getElementById('inquiry-total-count').textContent = totalInquiries;
    document.getElementById('inquiry-total-display').textContent = totalInquiries;
}

// 更新分页信息
function updateInquiryPagination() {
    const totalPages = Math.ceil(totalInquiries / inquiryPageSize);
    const startIndex = (currentInquiryPage - 1) * inquiryPageSize + 1;
    const endIndex = Math.min(currentInquiryPage * inquiryPageSize, totalInquiries);

    // 更新显示范围
    document.getElementById('inquiry-display-range').textContent =
        totalInquiries > 0 ? `${startIndex}-${endIndex}` : '0-0';

    // 生成分页按钮
    const pagination = document.getElementById('inquiry-pagination');
    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    // 上一页按钮
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentInquiryPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `
        <a class="page-link" href="#" onclick="changeInquiryPage(${currentInquiryPage - 1})">
            <i class="bi bi-chevron-left"></i>
        </a>
    `;
    pagination.appendChild(prevLi);

    // 页码按钮
    const startPage = Math.max(1, currentInquiryPage - 2);
    const endPage = Math.min(totalPages, currentInquiryPage + 2);

    if (startPage > 1) {
        const firstLi = document.createElement('li');
        firstLi.className = 'page-item';
        firstLi.innerHTML = `<a class="page-link" href="#" onclick="changeInquiryPage(1)">1</a>`;
        pagination.appendChild(firstLi);

        if (startPage > 2) {
            const ellipsisLi = document.createElement('li');
            ellipsisLi.className = 'page-item disabled';
            ellipsisLi.innerHTML = `<span class="page-link">...</span>`;
            pagination.appendChild(ellipsisLi);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentInquiryPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="changeInquiryPage(${i})">${i}</a>`;
        pagination.appendChild(li);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsisLi = document.createElement('li');
            ellipsisLi.className = 'page-item disabled';
            ellipsisLi.innerHTML = `<span class="page-link">...</span>`;
            pagination.appendChild(ellipsisLi);
        }

        const lastLi = document.createElement('li');
        lastLi.className = 'page-item';
        lastLi.innerHTML = `<a class="page-link" href="#" onclick="changeInquiryPage(${totalPages})">${totalPages}</a>`;
        pagination.appendChild(lastLi);
    }

    // 下一页按钮
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentInquiryPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `
        <a class="page-link" href="#" onclick="changeInquiryPage(${currentInquiryPage + 1})">
            <i class="bi bi-chevron-right"></i>
        </a>
    `;
    pagination.appendChild(nextLi);
}

// 切换询价页面
function changeInquiryPage(page) {
    const totalPages = Math.ceil(totalInquiries / inquiryPageSize);
    if (page < 1 || page > totalPages) return;

    currentInquiryPage = page;
    loadInquiries();
}

// 跳转到指定页面
function gotoInquiryPage() {
    const pageInput = document.getElementById('inquiry-goto-page');
    const page = parseInt(pageInput.value);
    const totalPages = Math.ceil(totalInquiries / inquiryPageSize);

    if (page >= 1 && page <= totalPages) {
        changeInquiryPage(page);
        pageInput.value = '';
    } else {
        showToast(`请输入1-${totalPages}之间的页码`, 'warning');
    }
}

// 清除筛选条件
function clearInquiryFilters() {
    document.getElementById('inquiry-status-filter').value = '';
    document.getElementById('inquiry-date-filter').value = '';
    document.getElementById('inquiry-search-filter').value = '';
    currentInquiryPage = 1;
    loadInquiries();
}

// 刷新询价数据
function refreshInquiries() {
    currentInquiryPage = 1;
    loadInquiries();
    showToast('数据已刷新', 'success');
}

// 显示询价详情
async function showInquiryDetail(id) {
    try {
        // 设置当前询价ID
        currentInquiryId = id;
        
        const response = await fetch(`/api/inquiries/${id}`);
        if (!response.ok) {
            throw new Error('获取询价详情失败');
        }
        const inquiry = await response.json();
        
        // 填充详情模态框
        document.getElementById('detail-inquiry-id').textContent = `#${inquiry.id.slice(-6)}`;
        document.getElementById('detail-name').textContent = inquiry.name;

        // 邮箱显示（带复制功能）
        const emailElement = document.getElementById('detail-email');
        emailElement.querySelector('.email-text').textContent = inquiry.email;

        // 电话显示
        const phoneElement = document.getElementById('detail-phone');
        if (inquiry.phone) {
            phoneElement.querySelector('.phone-text').textContent = inquiry.phone;
            phoneElement.style.display = 'block';
        } else {
            phoneElement.innerHTML = '<span class="text-muted">未提供</span>';
        }

        document.getElementById('detail-company').textContent = inquiry.company || '未提供';
        document.getElementById('detail-product-name').textContent = inquiry.productInfo ? inquiry.productInfo.name : '未指定产品';
        document.getElementById('detail-product-model').textContent = inquiry.productInfo ? (inquiry.productInfo.model || '未指定型号') : '未指定';
        document.getElementById('detail-created-at').textContent = formatDateTime(inquiry.createdAt);
        document.getElementById('detail-ip').textContent = inquiry.ip || '未记录';
        document.getElementById('detail-message').textContent = inquiry.message;
        document.getElementById('detail-status').value = inquiry.status;
        
        // 加载处理记录
        const historyDiv = document.getElementById('detail-history');
        historyDiv.innerHTML = '';
        if (inquiry.history && inquiry.history.length > 0) {
            inquiry.history.forEach(record => {
                const div = document.createElement('div');
                div.className = 'mb-2';
                div.innerHTML = `
                    <div class="d-flex justify-content-between">
                        <span class="text-muted small">${formatDateTime(record.timestamp)}</span>
                        <span class="badge ${getStatusBadgeClass(record.status)}">
                            ${getStatusText(record.status)}
                        </span>
                    </div>
                    ${record.note ? `<div class="mt-1">${record.note}</div>` : ''}
                `;
                historyDiv.appendChild(div);
            });
        } else {
            historyDiv.innerHTML = '<div class="text-muted">暂无处理记录</div>';
        }
        
        // 显示模态框
        const modal = new bootstrap.Modal(document.getElementById('inquiryDetailModal'));
        modal.show();
        
    } catch (error) {
        console.error('加载询价详情失败:', error);
        showToast('加载询价详情失败，请重试', 'error');
    }
}

// 更新询价状态
async function updateInquiryStatus() {
    if (!currentInquiryId) return;
    
    const status = document.getElementById('detail-status').value;
    
    try {
        const response = await fetch(`/api/inquiries/${currentInquiryId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) {
            throw new Error('更新状态失败');
        }
        
        showToast('询价状态已更新', 'success');
        loadInquiries(); // 重新加载列表
        loadInquiriesCount(); // 更新导航栏计数
        
        // 关闭模态框
        const modal = bootstrap.Modal.getInstance(document.getElementById('inquiryDetailModal'));
        if (modal) {
            modal.hide();
        }
        
    } catch (error) {
        console.error('更新询价状态失败:', error);
        showToast('更新询价状态失败，请重试', 'error');
    }
}

// 导出询价记录
function exportInquiries() {
    const statusFilter = document.getElementById('inquiry-status-filter').value;
    const dateFilter = document.getElementById('inquiry-date-filter').value;
    
    let url = '/api/inquiries/export';
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    if (dateFilter) params.append('date', dateFilter);
    
    if (params.toString()) {
        url += '?' + params.toString();
    }
    
    window.open(url);
}

// 获取状态文本
function getStatusText(status) {
    const statusMap = {
        'pending': '待处理',
        'processing': '处理中',
        'completed': '已完成',
        'cancelled': '已取消'
    };
    return statusMap[status] || status;
}

// 获取状态徽章样式
function getStatusBadgeClass(status) {
    const classMap = {
        'pending': 'bg-warning',
        'processing': 'bg-info',
        'completed': 'bg-success',
        'cancelled': 'bg-secondary'
    };
    return classMap[status] || 'bg-secondary';
}

// 日期格式化辅助函数
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN');
    } catch (error) {
        return '无效日期';
    }
}

function formatTime(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleTimeString('zh-CN');
    } catch (error) {
        return '无效时间';
    }
}

function formatDateTime(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN');
    } catch (error) {
        return '无效日期时间';
    }
}

// 初始化询价管理
function initInquiryManagement() {
    // 绑定筛选器变化事件
    document.getElementById('inquiry-status-filter').addEventListener('change', () => {
        currentInquiryPage = 1;
        loadInquiries();
    });

    document.getElementById('inquiry-date-filter').addEventListener('change', () => {
        currentInquiryPage = 1;
        loadInquiries();
    });

    document.getElementById('inquiry-search-filter').addEventListener('input', debounce(() => {
        currentInquiryPage = 1;
        loadInquiries();
    }, 500));

    // 绑定页面大小变化事件
    document.getElementById('inquiry-page-size').addEventListener('change', (e) => {
        inquiryPageSize = parseInt(e.target.value);
        currentInquiryPage = 1;
        loadInquiries();
    });

    // 绑定更新状态按钮事件
    const updateStatusBtn = document.getElementById('update-inquiry-status');
    if (updateStatusBtn) {
        updateStatusBtn.addEventListener('click', updateInquiryStatus);
    }

    // 初始化清空数据功能
    initClearInquiriesModal();

    // 初始加载询价列表
    loadInquiries();
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 复制到剪贴板
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('已复制到剪贴板', 'success');
    } catch (err) {
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('已复制到剪贴板', 'success');
        } catch (err) {
            showToast('复制失败', 'error');
        }
        document.body.removeChild(textArea);
    }
}

// 显示清空询价数据确认模态框
function showClearInquiriesModal() {
    const modal = new bootstrap.Modal(document.getElementById('clearInquiriesModal'));
    modal.show();

    // 重置确认复选框
    document.getElementById('confirmClearInquiries').checked = false;
    document.getElementById('confirmClearInquiriesBtn').disabled = true;
}

// 初始化清空询价数据功能
function initClearInquiriesModal() {
    const checkbox = document.getElementById('confirmClearInquiries');
    const confirmBtn = document.getElementById('confirmClearInquiriesBtn');

    // 监听复选框变化
    checkbox.addEventListener('change', function() {
        confirmBtn.disabled = !this.checked;
    });

    // 监听确认按钮点击
    confirmBtn.addEventListener('click', async function() {
        try {
            const response = await fetch('/api/inquiries/clear-all', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('清空数据失败');
            }

            showToast('所有询价数据已清空', 'success');

            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('clearInquiriesModal'));
            modal.hide();

            // 重新加载询价列表
            loadInquiries();

        } catch (error) {
            console.error('清空询价数据失败:', error);
            showToast('清空数据失败，请重试', 'error');
        }
    });
}

// 加载公司信息
async function loadCompanyInfo() {
    try {
        const response = await fetch('../data/company.json');
        const data = await response.json();
        
        // 填充表单数据
        document.getElementById('companyName').value = data.name || '';
        document.getElementById('companyShortName').value = data.shortName || '';
        document.getElementById('companyDescription').value = data.description || '';
        document.getElementById('companyEstablished').value = data.established || '';
        document.getElementById('companyExperience').value = data.experience || '';
        
        // 联系方式
        document.getElementById('companyPhone').value = data.contact?.phone || '';
        document.getElementById('companyEmail').value = data.contact?.email || '';
        document.getElementById('companyWhatsapp').value = data.contact?.whatsapp || '';
        document.getElementById('companyAddress').value = data.contact?.address || '';
        
        // 社交媒体
        document.getElementById('companyFacebook').value = data.social?.facebook || '';
        document.getElementById('companyInstagram').value = data.social?.instagram || '';
        document.getElementById('companySocialWhatsapp').value = data.social?.whatsapp || '';
        document.getElementById('companySocialEmail').value = data.social?.email || '';
        
        // 营业时间
        document.getElementById('companyWeekdays').value = data.businessHours?.weekdays || '';
        document.getElementById('companyWeekend').value = data.businessHours?.weekend || '';
        
        showToast('公司信息加载成功！', 'success');
    } catch (error) {
        console.error('加载公司信息失败:', error);
        showToast('加载公司信息失败，请刷新页面重试', 'error');
    }
}

// 保存公司信息
async function saveCompanyInfo() {
    try {
        // 收集表单数据
        const formData = {
            name: document.getElementById('companyName').value,
            shortName: document.getElementById('companyShortName').value,
            description: document.getElementById('companyDescription').value,
            established: document.getElementById('companyEstablished').value,
            experience: document.getElementById('companyExperience').value,
            logo: "assets/images/logo/diamond-logo.png",
            contact: {
                phone: document.getElementById('companyPhone').value,
                email: document.getElementById('companyEmail').value,
                whatsapp: document.getElementById('companyWhatsapp').value,
                address: document.getElementById('companyAddress').value,
                website: "https://www.diamond-auto.com"
            },
            social: {
                facebook: document.getElementById('companyFacebook').value,
                instagram: document.getElementById('companyInstagram').value,
                whatsapp: document.getElementById('companySocialWhatsapp').value,
                email: document.getElementById('companySocialEmail').value
            },
            businessHours: {
                weekdays: document.getElementById('companyWeekdays').value,
                weekend: document.getElementById('companyWeekend').value
            }
        };

        // 发送到服务器
        const response = await fetch('/api/update-company', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('保存失败');
        }

        showToast('公司信息保存成功！', 'success');
        
        // 刷新页面上的公司信息显示
        document.querySelectorAll('.company-name').forEach(el => {
            el.textContent = formData.name;
        });
        
    } catch (error) {
        console.error('保存公司信息失败:', error);
        showToast('保存失败，请稍后重试', 'error');
    }
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    
    // 监听页面切换
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            
            // 移除所有页面的active类
            document.querySelectorAll('.page-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // 移除所有菜单项的active类
            document.querySelectorAll('.menu-item').forEach(menuItem => {
                menuItem.classList.remove('active');
            });
            
            // 激活选中的页面和菜单项
            document.getElementById(`${page}-page`).classList.add('active');
            this.classList.add('active');
            
            // 如果是公司信息页面，加载公司信息
            if (page === 'company') {
                loadCompanyInfo();
            }
        });
    });
});

// 更新小时数据图表
function updateHourlyChart(hourlyData) {
    const chart = echarts.init(document.getElementById('hourly-chart'));
    
    // 确保生成24小时完整数据
    const hours = Array.from({length: 24}, (_, i) => `${String(i).padStart(2, '0')}:00`);
    const views = Array.from({length: 24}, (_, i) => {
        const hourData = hourlyData.find(d => d.hour === i);
        return hourData ? hourData.views : 0;
    });
    const clicks = Array.from({length: 24}, (_, i) => {
        const hourData = hourlyData.find(d => d.hour === i);
        return hourData ? hourData.clicks : 0;
    });

    // 计算最大值，用于设置Y轴范围
    const maxValue = Math.max(...views, ...clicks);
    const yAxisMax = maxValue > 0 ? Math.ceil(maxValue * 1.2) : 10; // 增加20%的空间，如果没有数据则设置为10

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            borderColor: 'rgba(59, 130, 246, 0.2)',
            borderWidth: 1,
            borderRadius: 12,
            padding: [12, 16],
            textStyle: {
                color: '#1f2937',
                fontSize: 13
            },
            axisPointer: {
                type: 'line',
                lineStyle: {
                    color: 'rgba(59, 130, 246, 0.3)',
                    width: 2,
                    type: 'dashed'
                }
            },
            formatter: function(params) {
                let result = `<div style="font-weight: 600; margin-bottom: 10px; color: #1f2937; font-size: 14px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">${params[0].axisValue}</div>`;
                params.forEach(item => {
                    const color = item.color.colorStops ? item.color.colorStops[0].color : item.color;
                    result += `<div style="margin: 6px 0; display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center;">
                            <span style="display: inline-block; width: 8px; height: 8px; background: ${color}; border-radius: 50%; margin-right: 10px; box-shadow: 0 0 4px ${color}40;"></span>
                            <span style="color: #6b7280; font-size: 12px;">${item.seriesName}</span>
                        </div>
                        <span style="font-weight: 600; color: #1f2937; font-size: 13px;">${item.value}</span>
                    </div>`;
                });
                return result;
            }
        },
        legend: {
            data: ['页面访问', '产品点击'],
            top: 15,
            left: 'center',
            itemGap: 30,
            textStyle: {
                fontSize: 12,
                color: '#4b5563',
                fontWeight: '500'
            },
            icon: 'roundRect',
            itemWidth: 14,
            itemHeight: 8
        },
        grid: {
            left: '6%',
            right: '4%',
            bottom: '12%',
            top: '20%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: hours,
            axisLabel: {
                interval: 1,  // 每隔一个显示标签，减少拥挤
                rotate: 0,
                fontSize: 10,
                color: '#666',
                margin: 10,
                formatter: function(value, index) {
                    // 每隔3小时显示一个标签，让显示更清晰
                    return index % 3 === 0 ? value : '';
                }
            },
            axisLine: {
                lineStyle: {
                    color: '#ddd',
                    width: 1
                }
            },
            axisTick: {
                show: true,
                lineStyle: {
                    color: '#ddd'
                },
                interval: 2,
                length: 4
            },
            splitLine: {
                show: false
            }
        },
        yAxis: {
            type: 'value',
            min: 0,
            max: yAxisMax,
            minInterval: 1,
            splitNumber: 5,
            axisLabel: {
                fontSize: 11,
                color: '#666',
                formatter: function(value) {
                    return value === 0 ? '0' : value.toString();
                }
            },
            axisLine: {
                show: false
            },
            axisTick: {
                show: false
            },
            splitLine: {
                show: true,
                lineStyle: {
                    type: 'dashed',
                    color: '#f0f0f0',
                    width: 1
                }
            }
        },
        series: [
            {
                name: '页面访问',
                type: 'line',
                data: views,
                itemStyle: {
                    color: '#3b82f6',
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    shadowBlur: 4,
                    shadowColor: 'rgba(59, 130, 246, 0.3)'
                },
                lineStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                        { offset: 0, color: '#3b82f6' },
                        { offset: 1, color: '#60a5fa' }
                    ]),
                    width: 3,
                    shadowBlur: 8,
                    shadowColor: 'rgba(59, 130, 246, 0.2)'
                },
                symbol: 'circle',
                symbolSize: 8,
                smooth: true,
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
                        { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
                    ])
                }
            },
            {
                name: '产品点击',
                type: 'bar',
                data: clicks,
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#10b981' },
                        { offset: 0.5, color: '#059669' },
                        { offset: 1, color: '#047857' }
                    ]),
                    borderRadius: [4, 4, 0, 0],
                    shadowBlur: 6,
                    shadowColor: 'rgba(16, 185, 129, 0.3)',
                    shadowOffsetY: 2
                },
                barWidth: '50%',
                emphasis: {
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#34d399' },
                            { offset: 0.5, color: '#10b981' },
                            { offset: 1, color: '#059669' }
                        ])
                    }
                }
            }
        ]
    };

    chart.setOption(option);
    
    // 监听窗口大小变化，调整图表大小
    const resizeHandler = () => {
        chart.resize();
    };
    
    // 移除之前的监听器，避免重复绑定
    window.removeEventListener('resize', resizeHandler);
    window.addEventListener('resize', resizeHandler);
}

// 更新咨询来源统计图表（使用真实数据）
async function updateInquirySourcesChart() {
    try {
        // 获取今天的日期
        const today = new Date().toISOString().split('T')[0];
        
        // 调用咨询来源统计API
        const response = await fetch(`/api/inquiries/sources/stats?startDate=${today}&endDate=${today}`);
        if (!response.ok) {
            throw new Error('获取咨询来源统计失败');
        }
        
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || '获取咨询来源统计失败');
        }
        
        const chartElement = document.getElementById('inquiry-sources-chart');
        if (!chartElement) {
            console.log('找不到咨询来源图表容器');
            return;
        }
        
        const chart = echarts.init(chartElement);
        
        // 颜色配置
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
        
        // 准备图表数据
        const data = result.data.chartData.map((item, index) => ({
            name: item.name,
            value: item.value,
            itemStyle: {
                color: colors[index % colors.length]
            }
        }));
        
        // 图表配置 - 优化视觉效果
        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                borderColor: 'rgba(59, 130, 246, 0.2)',
                borderWidth: 1,
                borderRadius: 12,
                padding: [12, 16],
                textStyle: {
                    color: '#1f2937',
                    fontSize: 13
                },
                formatter: function(params) {
                    if (result.data.total === 0) return '暂无咨询数据';
                    const percent = ((params.value / result.data.total) * 100).toFixed(1);
                    return `<div style="font-weight: 600; margin-bottom: 8px; color: #1f2937;">${params.name}</div>
                            <div style="display: flex; align-items: center; margin: 4px 0;">
                                <span style="display: inline-block; width: 8px; height: 8px; background: ${params.color}; border-radius: 50%; margin-right: 8px; box-shadow: 0 0 4px ${params.color}40;"></span>
                                <span style="color: #6b7280; font-size: 12px;">咨询数：</span>
                                <span style="font-weight: 600; color: #1f2937; margin-left: 4px;">${params.value}</span>
                            </div>
                            <div style="display: flex; align-items: center; margin: 4px 0;">
                                <span style="display: inline-block; width: 8px; height: 8px; background: transparent; margin-right: 8px;"></span>
                                <span style="color: #6b7280; font-size: 12px;">占比：</span>
                                <span style="font-weight: 600; color: #1f2937; margin-left: 4px;">${percent}%</span>
                            </div>`;
                }
            },
            legend: {
                type: 'scroll',
                orient: 'horizontal',
                bottom: 8,
                left: 'center',
                data: data.map(item => item.name),
                textStyle: {
                    fontSize: 11,
                    color: '#4b5563',
                    fontWeight: '500'
                },
                itemWidth: 10,
                itemHeight: 10,
                itemGap: 15
            },
            series: [
                {
                    type: 'pie',
                    radius: ['40%', '75%'],
                    center: ['50%', '42%'],
                    data: data.length > 0 ? data.map(item => ({
                        ...item,
                        itemStyle: {
                            ...item.itemStyle,
                            borderRadius: 8,
                            borderColor: '#ffffff',
                            borderWidth: 2,
                            shadowBlur: 8,
                            shadowColor: `${item.itemStyle.color}30`,
                            shadowOffsetY: 2
                        }
                    })) : [
                        {
                            name: '暂无数据',
                            value: 1,
                            itemStyle: {
                                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                    { offset: 0, color: '#f3f4f6' },
                                    { offset: 1, color: '#e5e7eb' }
                                ])
                            },
                            label: {
                                show: true,
                                position: 'center',
                                formatter: '暂无咨询',
                                fontSize: 12,
                                color: '#9ca3af',
                                fontWeight: '500'
                            }
                        }
                    ],
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 12,
                            shadowOffsetX: 0,
                            shadowOffsetY: 4,
                            shadowColor: 'rgba(0, 0, 0, 0.2)'
                        },
                        label: {
                            fontSize: 14,
                            fontWeight: '600'
                        }
                    },
                    label: {
                        show: data.length > 0,
                        position: 'outside',
                        formatter: function(params) {
                            if (params.value === 0 || result.data.total === 0) return '';
                            const percent = ((params.value / result.data.total) * 100).toFixed(0);
                            return `${percent}%`;
                        },
                        fontSize: 11,
                        fontWeight: '600',
                        color: '#374151'
                    },
                    labelLine: {
                        show: data.length > 0,
                        length: 12,
                        length2: 8,
                        lineStyle: {
                            color: '#d1d5db',
                            width: 1.5
                        }
                    }
                }
            ]
        };
        
        chart.setOption(option);
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            chart.resize();
        });
        
        // 图表更新完成
        
    } catch (error) {
        console.error('❌ 更新咨询来源统计图表失败:', error);
        
        // 显示错误提示
        const chartElement = document.getElementById('inquiry-sources-chart');
        if (chartElement) {
            chartElement.innerHTML = `
                <div class="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                    <i class="bi bi-exclamation-triangle fs-2 mb-2"></i>
                    <div>暂无咨询数据</div>
                    <small>开始使用询价功能后，这里将显示来源统计</small>
                </div>
            `;
        }
    }
}

// 更新流量来源统计图表
function updateTrafficSourcesChart(trafficSources) {
    const chartElement = document.getElementById('traffic-sources-chart');
    if (!chartElement) return;
    
    const chart = echarts.init(chartElement);
    
    // 流量来源名称映射
    const sourceNames = {
        'direct': '直接访问',
        'search': '搜索引擎',
        'social': '社交媒体', 
        'referral': '外部引荐'
    };
    
    // 颜色配置
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
    
    // 准备数据
    const data = Object.entries(trafficSources)
        .map(([source, count], index) => ({
            name: sourceNames[source] || source,
            value: count,
            itemStyle: {
                color: colors[index % colors.length]
            }
        }))
        .filter(item => item.value > 0); // 只显示有数据的来源
    
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
            orient: 'vertical',
            left: 'left',
            top: 'bottom',
            textStyle: {
                fontSize: 12
            }
        },
        series: [
            {
                name: '流量来源',
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['50%', '45%'],
                avoidLabelOverlap: false,
                label: {
                    show: false,
                    position: 'center'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: '14',
                        fontWeight: 'bold'
                    }
                },
                labelLine: {
                    show: false
                },
                data: data.length > 0 ? data : [
                    {
                        name: '暂无数据',
                        value: 1,
                        itemStyle: {
                            color: '#e5e7eb'
                        }
                    }
                ]
            }
        ]
    };
    
    chart.setOption(option);
    
    // 监听窗口大小变化，调整图表大小
    window.addEventListener('resize', () => {
        chart.resize();
    });
}

// 历史数据查询功能
async function loadHistoricalData() {
    const periodSelector = document.getElementById('period-selector');
    const valueSelector = document.getElementById('value-selector');
    const period = periodSelector.value;
    
    if (period === 'today') {
        // 显示今日数据
        valueSelector.style.display = 'none';
        await updateAnalyticsStats();
        return;
    }
    
    // 显示值选择器
    valueSelector.style.display = 'inline-block';
    
    try {
        // 根据周期类型加载可选值
        let apiUrl = '';
        switch (period) {
            case 'year':
                apiUrl = '/api/analytics/years';
                break;
            case 'month':
                const selectedYear = valueSelector.getAttribute('data-selected-year');
                if (selectedYear) {
                    apiUrl = `/api/analytics/months/${selectedYear}`;
                } else {
                    apiUrl = '/api/analytics/years';
                }
                break;
            case 'day':
                const selectedMonth = valueSelector.getAttribute('data-selected-month');
                if (selectedMonth) {
                    apiUrl = `/api/analytics/days/${selectedMonth}`;
                } else {
                    apiUrl = '/api/analytics/years';
                }
                break;
        }
        
        const response = await fetch(apiUrl);
        const result = await response.json();
        
        if (result.success) {
            // 填充选择器选项
            valueSelector.innerHTML = '';
            
            if (period === 'year') {
                result.data.forEach(year => {
                    const option = document.createElement('option');
                    option.value = year;
                    option.textContent = `${year}年`;
                    valueSelector.appendChild(option);
                });
            } else if (period === 'month') {
                result.data.forEach(month => {
                    const option = document.createElement('option');
                    option.value = month;
                    option.textContent = `${month.substring(0, 4)}年${month.substring(5, 7)}月`;
                    valueSelector.appendChild(option);
                });
            } else if (period === 'day') {
                result.data.forEach(day => {
                    const option = document.createElement('option');
                    option.value = day;
                    option.textContent = day;
                    valueSelector.appendChild(option);
                });
            }
            
            // 如果有选项，自动加载第一个的数据
            if (valueSelector.options.length > 0) {
                await loadPeriodData(period, valueSelector.options[0].value);
            }
        }
    } catch (error) {
        console.error('加载历史数据选项失败:', error);
        showToast('加载历史数据失败', 'error');
    }
}

// 加载指定周期的数据
async function loadPeriodData(period, value) {
    try {
        const response = await fetch(`/api/analytics/history/${period}/${value}`);
        const result = await response.json();
        
        if (result.success) {
            // 更新页面显示
            await updateHistoricalDataDisplay(result);
        } else {
            showToast(result.message || '获取历史数据失败', 'error');
        }
    } catch (error) {
        console.error('加载周期数据失败:', error);
        showToast('加载历史数据失败', 'error');
    }
}

// 更新历史数据显示
async function updateHistoricalDataDisplay(result) {
    const { period, value, data, summary } = result;

    // 更新概览卡片
    document.getElementById('overview-page-views').textContent = summary.total_views || 0;
    document.getElementById('overview-unique-visitors').textContent = summary.unique_visitors || 0;
    document.getElementById('overview-product-clicks').textContent = summary.total_clicks || 0;

    // 对于历史数据，如果是今天的单日数据，使用实际询价数据计算转化率
    if (period === 'day' && data.length === 1) {
        const today = new Date().toISOString().split('T')[0];
        const dayData = data[0];
        if (dayData.date === today) {
            // 今天的数据，使用实际询价数据
            try {
                const todayInquiries = await getTodayInquiriesCount();
                const pageViews = dayData.page_views || 0;
                const conversionRate = pageViews > 0 ? (todayInquiries / pageViews * 100) : 0;
                document.getElementById('overview-conversion-rate').textContent = `${conversionRate.toFixed(2)}%`;
            } catch (error) {
                console.error('计算今日转化率失败:', error);
                document.getElementById('overview-conversion-rate').textContent = `${summary.avg_conversion_rate || 0}%`;
            }
        } else {
            // 历史数据，使用原有计算
            document.getElementById('overview-conversion-rate').textContent = `${summary.avg_conversion_rate || 0}%`;
        }
    } else {
        // 多日数据，使用平均转化率
        document.getElementById('overview-conversion-rate').textContent = `${summary.avg_conversion_rate || 0}%`;
    }
    
    // 如果是单日数据，显示24小时趋势图
    if (period === 'day' && data.length === 1) {
        const dayData = data[0];
        updateHourlyChart(dayData.hourly_data || []);
        await updateInquirySourcesChart();
    } else {
        // 多日数据，显示趋势图表
        updatePeriodTrendChart(data, period);
        // 清空24小时图表
        const chartElement = document.getElementById('inquiry-sources-chart');
        if (chartElement) {
            const chart = echarts.init(chartElement);
            chart.clear();
            chart.setOption({
                title: {
                    text: '选择单日数据查看详情',
                    left: 'center',
                    top: 'center',
                    textStyle: {
                        color: '#999',
                        fontSize: 14
                    }
                }
            });
        }
    }
    
    // 更新热门产品
    if (data.length > 0) {
        // 合并所有天的热门产品数据
        const allProducts = {};
        data.forEach(dayData => {
            if (dayData.top_products) {
                dayData.top_products.forEach(product => {
                    if (allProducts[product.id]) {
                        allProducts[product.id].clicks += product.clicks;
                    } else {
                        allProducts[product.id] = { ...product };
                    }
                });
            }
        });
        
        const topProducts = Object.values(allProducts)
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, 10);
        
        updateTopProductsList(topProducts);
    }
}

// 更新周期趋势图表
function updatePeriodTrendChart(data, period) {
    const chartElement = document.getElementById('hourly-chart');
    if (!chartElement) return;
    
    const chart = echarts.init(chartElement);
    
    // 准备数据
    const dates = data.map(item => {
        if (period === 'year') {
            return item.date.substring(5); // MM-DD
        } else if (period === 'month') {
            return item.date.substring(8); // DD
        }
        return item.date;
    });
    
    const views = data.map(item => item.page_views || 0);
    const clicks = data.map(item => item.product_clicks || 0);
    
    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            borderColor: 'rgba(59, 130, 246, 0.2)',
            borderWidth: 1,
            borderRadius: 12,
            padding: [12, 16],
            textStyle: {
                color: '#1f2937',
                fontSize: 13
            },
            formatter: function(params) {
                let result = `<div style="font-weight: 600; margin-bottom: 10px; color: #1f2937; font-size: 14px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">${params[0].axisValue}</div>`;
                params.forEach(item => {
                    result += `<div style="margin: 6px 0; display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center;">
                            <span style="display: inline-block; width: 8px; height: 8px; background: ${item.color}; border-radius: 50%; margin-right: 10px; box-shadow: 0 0 4px ${item.color}40;"></span>
                            <span style="color: #6b7280; font-size: 12px;">${item.seriesName}</span>
                        </div>
                        <span style="font-weight: 600; color: #1f2937; font-size: 13px;">${item.value}</span>
                    </div>`;
                });
                return result;
            }
        },
        legend: {
            data: ['页面访问', '产品点击'],
            top: 15,
            left: 'center',
            itemGap: 30,
            textStyle: {
                fontSize: 12,
                color: '#4b5563',
                fontWeight: '500'
            },
            icon: 'roundRect',
            itemWidth: 14,
            itemHeight: 8
        },
        grid: {
            left: '6%',
            right: '4%',
            bottom: '12%',
            top: '20%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: dates,
            axisLabel: {
                fontSize: 10,
                color: '#666',
                rotate: dates.length > 15 ? 45 : 0
            },
            axisLine: {
                lineStyle: {
                    color: '#ddd',
                    width: 1
                }
            }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                fontSize: 11,
                color: '#666'
            },
            splitLine: {
                lineStyle: {
                    type: 'dashed',
                    color: '#f0f0f0'
                }
            }
        },
        series: [
            {
                name: '页面访问',
                type: 'line',
                data: views,
                itemStyle: {
                    color: '#3b82f6'
                },
                lineStyle: {
                    color: '#3b82f6',
                    width: 3
                },
                symbol: 'circle',
                symbolSize: 6,
                smooth: true
            },
            {
                name: '产品点击',
                type: 'line',
                data: clicks,
                itemStyle: {
                    color: '#10b981'
                },
                lineStyle: {
                    color: '#10b981',
                    width: 3
                },
                symbol: 'circle',
                symbolSize: 6,
                smooth: true
            }
        ]
    };
    
    chart.setOption(option);
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
        chart.resize();
    });
}

// 刷新当前数据
async function refreshCurrentData() {
    const periodSelector = document.getElementById('period-selector');
    const valueSelector = document.getElementById('value-selector');
    
    if (periodSelector.value === 'today') {
        await updateAnalyticsStats();
        showToast('数据已刷新', 'success');
    } else {
        const selectedValue = valueSelector.value;
        if (selectedValue) {
            await loadPeriodData(periodSelector.value, selectedValue);
            showToast('历史数据已刷新', 'success');
        }
    }
}

// 页面加载时初始化历史数据功能
document.addEventListener('DOMContentLoaded', function() {
    // 为周期选择器绑定事件
    const periodSelector = document.getElementById('period-selector');
    const valueSelector = document.getElementById('value-selector');
    
    if (periodSelector) {
        periodSelector.addEventListener('change', loadHistoricalData);
    }
    
    if (valueSelector) {
        valueSelector.addEventListener('change', function() {
            const period = periodSelector.value;
            const value = this.value;
            if (period !== 'today' && value) {
                loadPeriodData(period, value);
            }
        });
    }
});

// 更新地理位置统计
async function updateGeoStats() {
    try {
        const response = await fetch('/api/analytics/geo');
        const geoData = await response.json();
        
        // 检查元素是否存在
        const geoChartElement = document.getElementById('geo-chart');
        const geoListElement = document.getElementById('geo-list');
        
        if (!geoChartElement || !geoListElement) {
            console.log('地理位置统计元素未找到');
            return;
        }
        
        // 初始化图表
        const geoChart = echarts.init(geoChartElement);
        
        // 基于真实用户记录计算地理位置统计
        const userRecords = geoData.user_records || {};
        const geoStats = {};
        let totalUsers = 0;
        
        // 统计每个国家的用户数量
        Object.values(userRecords).forEach(user => {
            if (user.geo_info && user.geo_info.country) {
                const country = user.geo_info.country;
                geoStats[country] = (geoStats[country] || 0) + 1;
                totalUsers++;
            }
        });
        
        // 如果没有真实数据，显示提示信息
        if (totalUsers === 0) {
            geoListElement.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-globe fa-2x mb-2"></i>
                    <p>暂无地理位置数据</p>
                    <small>当有用户访问时，这里会显示地理分布</small>
                </div>
            `;
            
            // 显示空图表
            const option = {
                title: {
                    text: '暂无访问数据',
                    left: 'center',
                    top: 'center',
                    textStyle: {
                        fontSize: 16,
                        color: '#999'
                    }
                }
            };
            geoChart.setOption(option);
            return;
        }
        
        // 计算百分比并准备数据
        const data = Object.entries(geoStats).map(([country, count]) => ({
            name: country,
            value: count,
            percentage: ((count / totalUsers) * 100).toFixed(1)
        }));

        // 饼图配置
        const option = {
            title: {
                text: `访问地理分布 (${totalUsers}位用户)`,
                left: 'center',
                top: 20,
                textStyle: {
                    fontSize: 14
                }
            },
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c}人 ({d}%)'
            },
            legend: {
                orient: 'vertical',
                left: 'left',
                top: 'middle',
                textStyle: {
                    fontSize: 12
                }
            },
            series: [
                {
                    name: '访问来源',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    center: ['60%', '55%'],
                    avoidLabelOverlap: true,
                    itemStyle: {
                        borderRadius: 10,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    label: {
                        show: false
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: '12',
                            fontWeight: 'bold'
                        }
                    },
                    labelLine: {
                        show: false
                    },
                    data: data
                }
            ]
        };

        geoChart.setOption(option);
        
        // 更新地理位置列表
        const sortedData = [...data].sort((a, b) => b.value - a.value);
        geoListElement.innerHTML = sortedData.map((item, index) => `
            <div class="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom">
                <div class="d-flex align-items-center">
                    <span class="badge bg-primary me-2">${index + 1}</span>
                    <span class="text-dark">${item.name}</span>
                </div>
                <div class="text-end">
                    <span class="fw-bold">${item.percentage}%</span>
                    <small class="text-muted d-block">(${item.value}人)</small>
                </div>
            </div>
        `).join('');

        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            if (geoChart) {
                geoChart.resize();
            }
        });
        
    } catch (error) {
        console.error('更新地理统计失败:', error);
        const geoListElement = document.getElementById('geo-list');
        if (geoListElement) {
            geoListElement.innerHTML = `
                <div class="text-center text-danger py-4">
                    <i class="bi bi-exclamation-triangle fa-2x mb-2"></i>
                    <p>加载地理位置数据失败</p>
                    <small>请刷新页面重试</small>
                </div>
            `;
        }
    }
}

// 地理位置统计函数已更新为简化版本

// 登出函数
async function logout() {
    if (confirm('确定要登出吗？')) {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                // 清除本地数据
                localStorage.clear();
                sessionStorage.clear();

                // 重定向到登录页
                window.location.href = '/admin/login.html';
            } else {
                showToast('登出失败，请重试', 'error');
            }
        } catch (error) {
            console.error('登出失败:', error);
            showToast('网络错误，请重试', 'error');
        }
    }
}

// 显示修改密码模态框
function showChangePasswordModal() {
    const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
    modal.show();

    // 清空表单
    document.getElementById('changePasswordForm').reset();
}

// 切换密码可见性
function togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'bi bi-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'bi bi-eye';
    }
}

// 修改密码
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // 验证输入
    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('请填写所有字段', 'warning');
        return;
    }

    if (newPassword.length < 8) {
        showToast('新密码长度至少为8位', 'warning');
        return;
    }

    if (newPassword !== confirmPassword) {
        showToast('新密码和确认密码不匹配', 'warning');
        return;
    }

    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                currentPassword,
                newPassword,
                confirmPassword
            })
        });

        const result = await response.json();

        if (response.ok) {
            showToast('密码修改成功，请重新登录', 'success');

            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
            modal.hide();

            // 延迟后自动登出
            setTimeout(() => {
                logout();
            }, 2000);
        } else {
            showToast(result.message || '密码修改失败', 'error');
        }
    } catch (error) {
        console.error('修改密码失败:', error);
        showToast('网络错误，请重试', 'error');
    }
}

// ==================== 管理员管理功能 ====================

// 全局变量
let admins = [];
let currentEditingAdmin = null;

// 加载管理员列表
async function loadAdmins() {
    try {
        const response = await fetch('/api/admins', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();
            admins = result.data;
            renderAdminsTable();
        } else {
            const error = await response.json();
            showToast(error.message || '加载管理员列表失败', 'error');
        }
    } catch (error) {
        console.error('加载管理员列表失败:', error);
        showToast('网络错误，请重试', 'error');
    }
}

// 渲染管理员表格
function renderAdminsTable() {
    const tbody = document.getElementById('admins-table-body');

    if (admins.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted">暂无管理员数据</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = admins.map(admin => {
        const statusBadge = admin.status === 'active'
            ? '<span class="badge bg-success">启用</span>'
            : '<span class="badge bg-danger">禁用</span>';

        const roleName = getRoleName(admin.role);
        const lastLogin = admin.last_login
            ? new Date(admin.last_login).toLocaleString('zh-CN')
            : '从未登录';
        const createdAt = new Date(admin.created_at).toLocaleString('zh-CN');

        const isLocked = admin.locked_until && new Date(admin.locked_until) > new Date();
        const lockBadge = isLocked ? '<span class="badge bg-warning ms-1">锁定</span>' : '';

        return `
            <tr>
                <td>${admin.name}</td>
                <td>${admin.username}</td>
                <td>${admin.email}</td>
                <td><span class="badge bg-primary">${roleName}</span></td>
                <td>${statusBadge}${lockBadge}</td>
                <td>${lastLogin}</td>
                <td>${createdAt}</td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary" onclick="showEditAdminModal('${admin.id}')" title="编辑">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="showResetPasswordModal('${admin.id}')" title="重置密码">
                            <i class="bi bi-key"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteAdmin('${admin.id}')" title="删除">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// 获取角色中文名称
function getRoleName(role) {
    const roleNames = {
        'super_admin': '超级管理员',
        'admin': '管理员',
        'editor': '编辑员',
        'viewer': '查看员'
    };
    return roleNames[role] || role;
}

// 显示添加管理员模态框
function showAddAdminModal() {
    // 重置表单
    document.getElementById('addAdminForm').reset();
    document.getElementById('addAdminForm').classList.remove('was-validated');

    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('addAdminModal'));
    modal.show();
}

// 添加管理员
async function addAdmin() {
    const form = document.getElementById('addAdminForm');

    // 验证表单
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const username = document.getElementById('adminUsername').value.trim();
    const email = document.getElementById('adminEmail').value.trim();
    const name = document.getElementById('adminName').value.trim();
    const role = document.getElementById('adminRole').value;
    const password = document.getElementById('adminPassword').value;
    const passwordConfirm = document.getElementById('adminPasswordConfirm').value;

    // 验证密码一致性
    if (password !== passwordConfirm) {
        document.getElementById('adminPasswordConfirm').setCustomValidity('两次输入的密码不一致');
        form.classList.add('was-validated');
        return;
    } else {
        document.getElementById('adminPasswordConfirm').setCustomValidity('');
    }

    try {
        const response = await fetch('/api/admins', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                username,
                email,
                name,
                role,
                password
            })
        });

        const result = await response.json();

        if (response.ok) {
            showToast('管理员添加成功', 'success');

            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('addAdminModal'));
            modal.hide();

            // 重新加载管理员列表
            loadAdmins();
        } else {
            showToast(result.message || '添加管理员失败', 'error');
        }
    } catch (error) {
        console.error('添加管理员失败:', error);
        showToast('网络错误，请重试', 'error');
    }
}

// 显示编辑管理员模态框
function showEditAdminModal(adminId) {
    const admin = admins.find(a => a.id === adminId);
    if (!admin) {
        showToast('管理员不存在', 'error');
        return;
    }

    currentEditingAdmin = admin;

    // 填充表单
    document.getElementById('editAdminId').value = admin.id;
    document.getElementById('editAdminUsername').value = admin.username;
    document.getElementById('editAdminEmail').value = admin.email;
    document.getElementById('editAdminName').value = admin.name;
    document.getElementById('editAdminRole').value = admin.role;
    document.getElementById('editAdminStatus').value = admin.status;

    // 重置验证状态
    document.getElementById('editAdminForm').classList.remove('was-validated');

    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('editAdminModal'));
    modal.show();
}

// 更新管理员信息
async function updateAdmin() {
    const form = document.getElementById('editAdminForm');

    // 验证表单
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const adminId = document.getElementById('editAdminId').value;
    const email = document.getElementById('editAdminEmail').value.trim();
    const name = document.getElementById('editAdminName').value.trim();
    const role = document.getElementById('editAdminRole').value;
    const status = document.getElementById('editAdminStatus').value;

    try {
        const response = await fetch(`/api/admins/${adminId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                email,
                name,
                role,
                status
            })
        });

        const result = await response.json();

        if (response.ok) {
            showToast('管理员信息更新成功', 'success');

            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('editAdminModal'));
            modal.hide();

            // 重新加载管理员列表
            loadAdmins();
        } else {
            showToast(result.message || '更新管理员信息失败', 'error');
        }
    } catch (error) {
        console.error('更新管理员信息失败:', error);
        showToast('网络错误，请重试', 'error');
    }
}

// 显示重置密码模态框
function showResetPasswordModal(adminId) {
    const admin = admins.find(a => a.id === adminId);
    if (!admin) {
        showToast('管理员不存在', 'error');
        return;
    }

    // 填充表单
    document.getElementById('resetAdminId').value = admin.id;
    document.getElementById('resetAdminName').value = `${admin.name} (${admin.username})`;

    // 重置表单
    document.getElementById('resetPasswordForm').reset();
    document.getElementById('resetPasswordForm').classList.remove('was-validated');
    document.getElementById('resetAdminId').value = admin.id;
    document.getElementById('resetAdminName').value = `${admin.name} (${admin.username})`;

    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('resetPasswordModal'));
    modal.show();
}

// 重置管理员密码
async function resetAdminPassword() {
    const form = document.getElementById('resetPasswordForm');

    // 验证表单
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const adminId = document.getElementById('resetAdminId').value;
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;

    // 验证密码一致性
    if (password !== confirmPassword) {
        document.getElementById('confirmNewPassword').setCustomValidity('两次输入的密码不一致');
        form.classList.add('was-validated');
        return;
    } else {
        document.getElementById('confirmNewPassword').setCustomValidity('');
    }

    try {
        const response = await fetch(`/api/admins/${adminId}/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                password
            })
        });

        const result = await response.json();

        if (response.ok) {
            showToast('管理员密码重置成功', 'success');

            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('resetPasswordModal'));
            modal.hide();

            // 重新加载管理员列表
            loadAdmins();
        } else {
            showToast(result.message || '重置密码失败', 'error');
        }
    } catch (error) {
        console.error('重置密码失败:', error);
        showToast('网络错误，请重试', 'error');
    }
}

// 删除管理员
async function deleteAdmin(adminId) {
    const admin = admins.find(a => a.id === adminId);
    if (!admin) {
        showToast('管理员不存在', 'error');
        return;
    }

    // 确认删除
    if (!confirm(`确定要删除管理员 "${admin.name} (${admin.username})" 吗？\n\n此操作不可撤销！`)) {
        return;
    }

    try {
        const response = await fetch(`/api/admins/${adminId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const result = await response.json();

        if (response.ok) {
            showToast('管理员删除成功', 'success');

            // 重新加载管理员列表
            loadAdmins();
        } else {
            showToast(result.message || '删除管理员失败', 'error');
        }
    } catch (error) {
        console.error('删除管理员失败:', error);
        showToast('网络错误，请重试', 'error');
    }
}

// 检查管理员权限
async function checkAdminPermissions() {
    try {
        const response = await fetch('/api/auth/check', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();
            const user = result.user;

            // 检查是否有管理员管理权限
            const adminMenuItem = document.getElementById('admin-menu-item');
            if (adminMenuItem) {
                // 只有超级管理员才能看到管理员管理菜单
                if (user.role === 'super_admin') {
                    adminMenuItem.style.display = 'block';
                } else {
                    adminMenuItem.style.display = 'none';
                }
            }

            // 更新侧边栏用户信息显示
            updateUserInfo(user);
        }
    } catch (error) {
        console.error('检查权限失败:', error);
    }
}

// 更新用户信息显示
function updateUserInfo(user) {
    const userNameElement = document.querySelector('.company-info .fw-bold');
    const userRoleElement = document.querySelector('.company-info .small.opacity-75');

    if (userNameElement) {
        userNameElement.textContent = user.username || '管理员';
    }

    if (userRoleElement) {
        const roleName = getRoleName(user.role);
        userRoleElement.textContent = roleName || '管理员';
    }
}

// ==================== 询价数据清空功能 ====================

// 显示清空询价数据模态框
function showClearInquiriesModal() {
    // 重置模态框状态
    document.getElementById('confirmClearInquiries').checked = false;
    document.getElementById('clearConfirmText').value = '';
    document.getElementById('confirmClearBtn').disabled = true;

    // 添加输入验证监听器
    setupClearInquiriesValidation();

    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('clearInquiriesModal'));
    modal.show();
}

// 设置清空询价数据的验证逻辑
function setupClearInquiriesValidation() {
    const checkbox = document.getElementById('confirmClearInquiries');
    const textInput = document.getElementById('clearConfirmText');
    const confirmBtn = document.getElementById('confirmClearBtn');

    function validateForm() {
        const isChecked = checkbox.checked;
        const isTextCorrect = textInput.value.trim().toUpperCase() === 'CLEAR';
        confirmBtn.disabled = !(isChecked && isTextCorrect);
    }

    // 移除之前的监听器（如果存在）
    checkbox.removeEventListener('change', validateForm);
    textInput.removeEventListener('input', validateForm);

    // 添加新的监听器
    checkbox.addEventListener('change', validateForm);
    textInput.addEventListener('input', validateForm);
}

// 清空所有询价数据
async function clearAllInquiries() {
    try {
        // 再次确认
        if (!confirm('最后确认：您确定要清空所有询价数据吗？\n\n此操作将永久删除所有询价记录，无法撤销！')) {
            return;
        }

        // 显示加载状态
        const confirmBtn = document.getElementById('confirmClearBtn');
        const originalText = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>清空中...';
        confirmBtn.disabled = true;

        const response = await fetch('/api/inquiries/clear-all', {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            showToast('所有询价数据已清空', 'success');

            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('clearInquiriesModal'));
            modal.hide();

            // 刷新询价管理页面（如果当前在询价页面）
            if (currentPage === 'inquiries') {
                initInquiryManagement();
            }

            // 更新询价统计
            loadInquiriesCount();

            // 更新仪表盘统计
            updateStats();

        } else {
            const error = await response.json();
            showToast(error.message || '清空询价数据失败', 'error');
        }

    } catch (error) {
        console.error('清空询价数据失败:', error);
        showToast('网络错误，请重试', 'error');
    } finally {
        // 恢复按钮状态
        const confirmBtn = document.getElementById('confirmClearBtn');
        if (confirmBtn) {
            confirmBtn.innerHTML = '<i class="bi bi-trash3 me-2"></i>确认清空';
            confirmBtn.disabled = false;
        }
    }
}