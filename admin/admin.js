// 全局变量
let currentPage = 'dashboard';
let products = [];
let selectedFiles = [];
let selectedImages = [];

// 🏷️ 静态产品分类数据 - 后台管理使用中文显示，支持多种字段映射
const staticCategories = [
    { id: 'all', name: '全部产品', englishName: 'All Products' },
    { id: 'turbocharger', name: '涡轮增压器', englishName: 'Turbocharger' },
    { id: 'actuator', name: '执行器', englishName: 'Actuator' },
    { id: 'injector', name: '共轨喷油器', englishName: 'Common Rail Injector' },
    { id: 'turbo-parts', name: '涡轮配件', englishName: 'Turbo Parts' },
    { id: 'others', name: '其他', englishName: 'Others' }
];

// 🔍 分类查找辅助函数 - 支持多种字段匹配
function findCategoryByProduct(product) {
    if (!product) return null;

    // 优先使用 categoryId 字段（数据库格式）
    if (product.categoryId) {
        return staticCategories.find(c => c.id === product.categoryId);
    }

    // 兼容 category 字段（旧格式）
    if (product.category) {
        // 如果是对象格式（包含关联的分类信息）
        if (typeof product.category === 'object' && product.category.name) {
            return staticCategories.find(c => c.name === product.category.name || c.englishName === product.category.name);
        }

        // 如果是字符串格式
        if (typeof product.category === 'string') {
            return staticCategories.find(c =>
                c.id === product.category ||
                c.name === product.category ||
                c.englishName === product.category
            );
        }
    }

    // 兼容 categoryName 字段（API返回格式）
    if (product.categoryName) {
        return staticCategories.find(c => c.name === product.categoryName || c.englishName === product.categoryName);
    }

    return null;
}

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

// 预设的产品特性 - 精简英文显示
const presetFeatures = [
    'OEM Quality',
    'Diamond Grade',
    'High Power',
    'Precise',
    'Injection',
    'Complete Kit',
    'Pro Tools',
    'Premium',
    'In Stock',
    'Original',
    'High Precision',
    'Durable'
];

// 初始化 - 国外服务器优化版本，避免竞态条件
document.addEventListener('DOMContentLoaded', function() {
    // 🚀 性能优化版本 - 国外服务器专用
    console.log('🌍 管理后台加载中，检测网络环境...');
    // 🌍 检测是否为国外访问，调整延迟时间
    const isLikelyOverseas = detectOverseasAccess();
    const delay = isLikelyOverseas ? 5000 : 1000; // 🚀 增加延迟时间 // 国外服务器使用更长延迟

    console.log('🔍 初始化认证检查，延迟:', delay, 'ms', isLikelyOverseas ? '(国外访问)' : '(国内访问)');

    // 🔧 根据环境调整延迟，确保Cookie完全设置
    setTimeout(() => {
        checkAuthStatus();
    }, delay);
});

// 检测是否为国外访问
function detectOverseasAccess() {
    // 检查时区
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const isAsiaTimezone = timezone.includes('Asia') || timezone.includes('Shanghai') || timezone.includes('Beijing');

    // 检查语言
    const language = navigator.language || navigator.userLanguage;
    const isChineseLanguage = language.includes('zh');

    // 检查时区偏移
    const timezoneOffset = new Date().getTimezoneOffset();
    const isChinaOffset = timezoneOffset === -480; // UTC+8

    const isLikelyOverseas = !isAsiaTimezone || !isChineseLanguage || !isChinaOffset;

    console.log('🌍 访问环境检测:', {
        timezone,
        language,
        timezoneOffset,
        isAsiaTimezone,
        isChineseLanguage,
        isChinaOffset,
        isLikelyOverseas
    });

    return isLikelyOverseas;
}

// 检查认证状态 - 国外服务器优化版本，支持重试和更好的错误处理
async function checkAuthStatus(retryCount = 0) {
    const maxRetries = 5; // 增加重试次数
    const isOverseas = detectOverseasAccess();
    const baseDelay = isOverseas ? 2000 : 1000; // 国外服务器使用更长延迟
    const retryDelay = baseDelay * (retryCount + 1); // 递增延迟

    try {
        console.log(`🔍 开始检查认证状态... (尝试 ${retryCount + 1}/${maxRetries + 1})`);
        console.log(`🌍 环境: ${isOverseas ? '国外' : '国内'}, 延迟: ${retryDelay}ms`);

        // 添加延迟，确保Cookie已经设置完成
        if (retryCount > 0) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }

        const response = await fetch('/api/auth/check', {
            method: 'GET',
            credentials: 'include',
            cache: 'no-cache', // 🔧 禁用缓存，确保获取最新状态
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 认证检查响应:', response.status, response.statusText);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ 认证成功，用户信息:', result.user);

            // 已登录，初始化应用
            initializeApp();
            initFeatureTags();
            setupSEOGenerators();
            return true;
        } else if (response.status === 401 || response.status === 403) {
            console.log('❌ 认证失败，状态码:', response.status);
            // 认证失败，重定向到登录页
            redirectToLogin();
            return false;
        } else {
            // 其他错误，可能是网络问题，尝试重试
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error(`💥 认证检查失败 (尝试 ${retryCount + 1}):`, error);

        // 如果还有重试次数，则重试
        if (retryCount < maxRetries) {
            console.log(`🔄 ${retryDelay}ms 后重试...`);
            return checkAuthStatus(retryCount + 1);
        } else {
            console.error('❌ 认证检查重试次数已用完，重定向到登录页');
            redirectToLogin();
            return false;
        }
    }
}

// 重定向到登录页的统一函数
function redirectToLogin() {
    // 清除可能的本地存储
    try {
        localStorage.removeItem('auth_token');
        sessionStorage.clear();
    } catch (e) {
        console.warn('清除本地存储失败:', e);
    }

    // 延迟重定向，避免过快的跳转
    setTimeout(() => {
        window.location.href = '/admin/login.html';
    }, 100);
}

// 🚀 数据加载状态管理 - 防止重复加载
const loadingStates = {
    inquiries: false,
    products: false,
    stats: false,
    geoStats: false,
    permissions: false
};

// 应用初始化 - 优化版本，避免重复数据加载
async function initializeApp() {
    console.log('🚀 开始应用初始化，防重复加载版本');

    // 设置事件监听器（不涉及数据加载）
    setupEventListeners();
    populateCategoryFilters(); // 填充分类筛选器
    initializeFormDefaults(); // 初始化表单默认值

    // 恢复用户上次访问的页面，如果没有则默认显示控制台
    const lastPage = getLastVisitedPage();
    const isPageRestored = lastPage !== 'dashboard' && localStorage.getItem('lastVisitedPage');

    // 调试信息
    console.log('🔄 页面状态恢复调试信息:');
    console.log('- localStorage中保存的页面:', localStorage.getItem('lastVisitedPage'));
    console.log('- getLastVisitedPage()返回:', lastPage);
    console.log('- 是否为页面恢复:', isPageRestored);
    console.log('- 即将显示页面:', lastPage);

    // 先显示页面，再按需加载数据
    showPage(lastPage);

    // 🎯 根据当前页面按需加载数据，避免不必要的请求
    await loadDataForCurrentPage(lastPage);

    // 如果恢复了非默认页面，显示提示
    if (isPageRestored) {
        setTimeout(() => {
            showToast(`已恢复到上次访问的页面：${getPageDisplayName(lastPage)}`, 'info', 3000);
        }, 1000);
    }
}

// 🎯 按需数据加载函数 - 根据页面只加载必要的数据
async function loadDataForCurrentPage(page) {
    console.log('🎯 按需加载数据，当前页面:', page);

    try {
        // 所有页面都需要的基础数据
        if (!loadingStates.permissions) {
            loadingStates.permissions = true;
            await checkAdminPermissions();
        }

        // 根据页面类型加载特定数据
        switch (page) {
            case 'dashboard':
                // 控制台页面需要统计数据
                await Promise.all([
                    loadDashboardData(),
                    loadBasicStats()
                ]);
                break;

            case 'products':
                // 产品页面需要产品数据
                if (!loadingStates.products) {
                    loadingStates.products = true;
                    await loadProducts();
                }
                break;

            case 'inquiries':
                // 询价页面需要询价数据
                if (!loadingStates.inquiries) {
                    loadingStates.inquiries = true;
                    await loadInquiries();
                }
                break;

            case 'admins':
                // 管理员页面需要管理员数据
                await loadAdmins();
                break;

            default:
                // 其他页面只加载基础统计
                await loadBasicStats();
                break;
        }

        console.log('✅ 页面数据加载完成:', page);

    } catch (error) {
        console.error('❌ 页面数据加载失败:', error);
        showToast('数据加载失败，请刷新页面重试', 'error');
    }
}

// 🔄 基础统计数据加载（轻量级）
async function loadBasicStats() {
    if (loadingStates.stats) return;

    loadingStates.stats = true;
    try {
        // 只加载必要的统计数据，不加载完整列表
        await Promise.all([
            loadInquiriesCount(), // 只获取数量，不加载完整列表
            updateStats() // 基础统计
        ]);
    } catch (error) {
        console.error('基础统计加载失败:', error);
    }
}

// 🏠 控制台专用数据加载
async function loadDashboardData() {
    try {
        await Promise.all([
            updateAnalyticsStats(),
            updateGeoStats()
        ]);
    } catch (error) {
        console.error('控制台数据加载失败:', error);
    }
}

// 保存当前访问的页面到本地存储
function saveLastVisitedPage(page) {
    try {
        localStorage.setItem('lastVisitedPage', page);
        console.log('💾 saveLastVisitedPage() 成功保存:', page);
    } catch (error) {
        console.warn('❌ 保存页面状态失败:', error);
    }
}

// 获取上次访问的页面
function getLastVisitedPage() {
    try {
        const lastPage = localStorage.getItem('lastVisitedPage');
        console.log('📖 getLastVisitedPage() localStorage中的值:', lastPage);

        // 验证页面是否有效
        const validPages = ['dashboard', 'products', 'add-product', 'inquiries', 'admin-management'];
        if (lastPage && validPages.includes(lastPage)) {
            console.log('✅ 页面有效，返回:', lastPage);
            return lastPage;
        } else {
            console.log('❌ 页面无效或不存在，返回默认页面');
        }
    } catch (error) {
        console.warn('❌ 获取页面状态失败:', error);
    }
    // 默认返回控制台
    console.log('🏠 返回默认页面: dashboard');
    return 'dashboard';
}

// 更新页面标题
function updatePageTitle(page) {
    const pageTitles = {
        'dashboard': '控制台 - 无锡皇德国际贸易有限公司后台管理',
        'products': '产品管理 - 无锡皇德国际贸易有限公司后台管理',
        'add-product': '添加产品 - 无锡皇德国际贸易有限公司后台管理',
        'inquiries': '询价管理 - 无锡皇德国际贸易有限公司后台管理',
        'admin-management': '管理员管理 - 无锡皇德国际贸易有限公司后台管理'
    };

    const title = pageTitles[page] || '后台管理 - 无锡皇德国际贸易有限公司';
    document.title = title;
}

// 获取页面显示名称
function getPageDisplayName(page) {
    const pageNames = {
        'dashboard': '控制台',
        'products': '产品管理',
        'add-product': '添加产品',
        'inquiries': '询价管理',
        'admin-management': '管理员管理'
    };
    return pageNames[page] || '未知页面';
}

// 清除保存的页面状态（调试用）
function clearLastVisitedPage() {
    try {
        localStorage.removeItem('lastVisitedPage');
        console.log('页面状态已清除');
        showToast('页面状态已清除，刷新后将回到控制台', 'success');
    } catch (error) {
        console.warn('清除页面状态失败:', error);
    }
}

// 初始化表单默认值
function initializeFormDefaults() {
    // 设置产品价格默认值为99
    const priceInput = document.getElementById('product-price');
    if (priceInput && !priceInput.value) {
        priceInput.value = '99';
    }

    // 初始化字符计数器
    initCharCounters();

    // 初始化进度跟踪
    initProgressTracking();

    // 初始化工具提示
    initTooltips();
}

// 初始化字符计数器
function initCharCounters() {
    const nameInput = document.getElementById('product-name');
    const nameCounter = document.getElementById('name-char-count');

    if (nameInput && nameCounter) {
        nameInput.addEventListener('input', function() {
            const length = this.value.length;
            const maxLength = this.getAttribute('maxlength') || 120;
            nameCounter.textContent = `${length}/${maxLength}`;

            // 更新计数器颜色
            nameCounter.className = 'input-group-text char-counter';
            if (length > maxLength * 0.8) {
                nameCounter.classList.add('warning');
            }
            if (length > maxLength * 0.95) {
                nameCounter.classList.remove('warning');
                nameCounter.classList.add('danger');
            }
        });
    }
}

// 初始化进度跟踪
function initProgressTracking() {
    // 监听所有表单输入变化
    const form = document.getElementById('addProductForm');
    if (form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', updateFormProgress);
            input.addEventListener('change', updateFormProgress);
        });
    }
}

// 初始化工具提示
function initTooltips() {
    // 初始化Bootstrap工具提示
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
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

// 页面切换 - 优化版本，支持按需数据加载
async function showPage(page) {
    // 调试信息
    console.log('📄 showPage() 被调用:');
    console.log('- 目标页面:', page);
    console.log('- 当前页面:', currentPage);

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
        console.log('✅ 页面元素已显示:', page + '-page');
    } else {
        console.warn('❌ 找不到页面元素:', page + '-page');
    }

    // 激活导航
    const targetNav = document.querySelector(`[data-page="${page}"]`);
    if (targetNav) {
        targetNav.classList.add('active');
        console.log('✅ 导航已激活:', `[data-page="${page}"]`);
    } else {
        console.warn('❌ 找不到导航元素:', `[data-page="${page}"]`);
    }

    currentPage = page;

    // 保存当前页面状态到本地存储
    saveLastVisitedPage(page);
    console.log('💾 页面状态已保存到localStorage:', page);

    // 更新页面标题
    updatePageTitle(page);

    // 🎯 优化的页面特定初始化 - 避免重复加载
    await loadDataForPageSwitch(page);
}

// 🔄 页面切换时的数据加载 - 防重复版本
async function loadDataForPageSwitch(page) {
    try {
        console.log('🔄 页面切换数据加载:', page);

        switch (page) {
            case 'products':
                // 只有在产品数据未加载时才加载
                if (!loadingStates.products) {
                    loadingStates.products = true;
                    await loadProductsWithPagination(1, true);
                }
                break;

            case 'add-product':
                // 重新设置产品分类变化监听器
                setupProductCategoryListeners();
                // 确保分类选择器已填充
                populateCategoryFilters();
                break;

            case 'inquiries':
                // 询价页面需要初始化管理功能和加载数据
                if (!loadingStates.inquiries) {
                    loadingStates.inquiries = true;
                    initInquiryManagement(); // 初始化会自动调用 loadInquiries()
                } else {
                    // 如果已经初始化过，只刷新数据
                    console.log('🔄 询价数据已加载，跳过重复加载');
                }
                break;

            case 'admins':
                // 管理员数据每次都需要刷新（安全考虑）
                await loadAdmins();
                break;

            case 'dashboard':
                // 控制台数据需要实时更新
                if (!loadingStates.stats) {
                    await loadDashboardData();
                }
                break;

            default:
                console.log('📄 页面无需特殊数据加载:', page);
                break;
        }
    } catch (error) {
        console.error('❌ 页面切换数据加载失败:', error);
        showToast('页面数据加载失败，请重试', 'error');
    }
}

// 填充分类筛选器 - 使用静态分类数据
function populateCategoryFilters() {
    const filterSelect = document.getElementById('filter-category');
    const formSelect = document.getElementById('product-category');

    if (filterSelect) {
        // 为产品筛选器设置选项（包含"所有分类"选项）
        filterSelect.innerHTML = staticCategories.map(cat =>
            `<option value="${cat.id === 'all' ? '' : cat.id}">${cat.name}</option>`
        ).join('');
    }

    if (formSelect) {
        // 为添加产品表单设置选项（不包含"全部产品"选项）
        formSelect.innerHTML = staticCategories
            .filter(cat => cat.id !== 'all')
            .map(cat => `<option value="${cat.id}">${cat.name}</option>`)
            .join('');

        // 设置默认值为涡轮增压器
        formSelect.value = 'turbocharger';
    }
}

// 填充编辑产品表单的分类选择器
function populateEditCategorySelector() {
    const editSelect = document.getElementById('editProductCategory');
    if (editSelect) {
        editSelect.innerHTML = staticCategories
            .filter(cat => cat.id !== 'all')
            .map(cat => `<option value="${cat.id}">${cat.name}</option>`)
            .join('');
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
        
        const response = await fetch(`/api/admin-db/products?${params}`);
        if (response.ok) {
            const result = await response.json();

            // 🔧 修复分页数据映射 - API字段名与前端期望不一致
            const normalizedPagination = {
                current: result.pagination.page,           // API: page -> 前端: current
                total: result.pagination.totalPages,      // API: totalPages -> 前端: total
                limit: result.pagination.limit,           // ✅ 一致
                totalItems: result.pagination.total,      // API: total -> 前端: totalItems
                hasNext: result.pagination.hasNext,       // ✅ 一致
                hasPrev: result.pagination.hasPrev,       // ✅ 一致
                nextPage: result.pagination.hasNext ? result.pagination.page + 1 : null,
                prevPage: result.pagination.hasPrev ? result.pagination.page - 1 : null
            };

            console.log('🔧 分页数据映射:', {
                原始API数据: result.pagination,
                标准化后: normalizedPagination
            });

            // 更新全局变量
            products = result.data;
            totalPages = normalizedPagination.total;        // 总页数
            totalProducts = normalizedPagination.totalItems; // 总产品数

            // 渲染产品列表
            renderProducts();

            // 渲染分页组件
            renderPagination(normalizedPagination);

            // 更新产品信息显示
            updateProductsInfo(normalizedPagination);

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
            const response = await fetch('/api/admin-db/products?limit=1');
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





// 🔢 加载询价统计数据 - 优化版本，避免重复请求
let inquiriesCountCache = null;
let inquiriesCountCacheTime = 0;
const INQUIRIES_COUNT_CACHE_TTL = 60000; // 1分钟缓存

async function loadInquiriesCount() {
    try {
        // 检查缓存
        const now = Date.now();
        if (inquiriesCountCache && (now - inquiriesCountCacheTime) < INQUIRIES_COUNT_CACHE_TTL) {
            console.log('🎯 使用询价统计缓存数据');
            updateInquiriesCountDisplay(inquiriesCountCache);
            return;
        }

        console.log('📊 加载询价统计数据...');
        const response = await fetch('/api/inquiries');
        if (response.ok) {
            const inquiries = await response.json();

            // 缓存数据
            inquiriesCountCache = inquiries;
            inquiriesCountCacheTime = now;

            updateInquiriesCountDisplay(inquiries);
        }
    } catch (error) {
        console.error('加载询价统计失败:', error);
    }
}

// 更新询价统计显示
function updateInquiriesCountDisplay(inquiries) {
    // 更新待处理询价数量
    const pendingCount = inquiries.filter(inquiry => inquiry.status === 'pending').length;
    const countElement = document.getElementById('pending-inquiries-count');
    if (countElement) {
        countElement.textContent = pendingCount;
    }
}

// 清除询价统计缓存
function clearInquiriesCountCache() {
    inquiriesCountCache = null;
    inquiriesCountCacheTime = 0;
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
            categories: staticCategories
        });
    }).join('');
}

// 原始渲染方式（备用）
function renderProductsLegacy() {
    const container = document.getElementById('products-list');
    if (!container) return;
    
    container.innerHTML = products.map(product => {
        // 🔍 使用新的分类查找函数
        const category = findCategoryByProduct(product);

        // 🐛 调试信息
        if (!category) {
            console.log('🔍 分类查找调试:', {
                productName: product.name,
                categoryId: product.categoryId,
                category: product.category,
                categoryName: product.categoryName,
                availableCategories: staticCategories.map(c => c.id)
            });
        }
        
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
                'new': { class: 'bg-primary', text: 'New' },
                'hot': { class: 'bg-danger', text: 'Hot' },
                'recommend': { class: 'bg-success', text: 'Recommend' }
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
        const response = await fetch(`/api/admin-db/products/${productId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('产品删除成功', 'success');
            // 智能页面处理：先获取最新的产品总数，然后决定跳转到哪一页
            try {
                // 先获取删除后的最新产品总数
                const statsResponse = await fetch('/api/admin-db/products?page=1&limit=1');
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
    
    // 产品标签和标记（从UI界面读取）
    formData.append('isNew', document.getElementById('addIsNew').checked ? 'true' : 'false');
    formData.append('isHot', document.getElementById('addIsHot').checked ? 'true' : 'false');
    formData.append('isRecommend', document.getElementById('addIsRecommend').checked ? 'true' : 'false');
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

// 基本信息变化处理
function onBasicInfoChange() {
    updateFormProgress();
    updatePreview();
    showSmartSuggestions();
}

// 分类变化处理
function onCategoryChange() {
    const category = document.getElementById('product-category').value;
    updateStepProgress(1);
    updatePreview();

    // 显示分类相关建议
    showCategorySuggestions(category);
}

// 品牌变化处理
function onBrandChange() {
    updateStepProgress(1);
    updatePreview();
}

// 价格变化处理
function onPriceChange() {
    updateStepProgress(1);
    updatePreview();
}

// 保修期变化处理
function onWarrantyChange() {
    updateStepProgress(1);
    updatePreview();
}

// 清空基本信息
function clearBasicInfo() {
    if (confirm('确定要清空基本信息吗？')) {
        document.getElementById('product-name').value = '';
        document.getElementById('product-model').value = '';
        document.getElementById('product-category').value = 'turbocharger';
        document.getElementById('product-brand').value = 'Diamond-Auto';
        document.getElementById('product-price').value = '99';
        document.getElementById('product-warranty').value = '12';

        updateFormProgress();
        updatePreview();
        hideSmartSuggestions();
    }
}

// 生成基本信息
function generateBasicInfo() {
    const name = document.getElementById('product-name').value;
    const category = document.getElementById('product-category').value;

    if (!name) {
        alert('请先输入产品名称');
        return;
    }

    // 根据产品名称和分类智能填充信息
    // 这里可以添加更复杂的逻辑
    showSmartSuggestions();
}

// 重置表单
function resetForm() {
    const form = document.getElementById('addProductForm');
    if (form) {
        form.reset();

        // 重置为默认值 - 使用英文显示
        document.getElementById('product-brand').value = 'Diamond-Auto';
        document.getElementById('product-category').value = 'turbocharger';
        document.getElementById('product-warranty').value = '12';
        document.getElementById('product-price').value = '99'; // 默认价格99

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

        // 重置进度和预览
        updateFormProgress();
        updatePreview();
        hideSmartSuggestions();
    }
}

// 更新表单进度
function updateFormProgress() {
    // 手动填写区域字段（基本信息 + 产品详情）
    const manualFields = [
        'product-name', 'product-model', 'product-category', 'product-brand', 'product-price', 'product-warranty', // 基本信息
        'product-oe', 'product-compatibility', 'product-notes', 'product-features' // 产品详情
    ];

    const descriptionFields = ['product-description'];
    const seoFields = ['product-meta-description', 'product-meta-keywords'];

    // 计算手动填写区域完成度
    let manualCompleted = 0;
    manualFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && field.value.trim()) {
            manualCompleted++;
        }
    });

    // 计算图片完成度（包含在手动填写区域）
    let imagesCompleted = 0;
    const imageContainer = document.getElementById('addImageContainer');
    if (imageContainer && imageContainer.children.length > 0) {
        imagesCompleted = 1;
        manualCompleted++; // 图片也算在手动填写区域
    }

    // 计算描述完成度
    let descriptionCompleted = 0;
    descriptionFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && field.value.trim()) {
            descriptionCompleted++;
        }
    });

    // 计算SEO完成度
    let seoCompleted = 0;
    seoFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && field.value.trim()) {
            seoCompleted++;
        }
    });

    // 更新进度显示
    const manualStatus = document.getElementById('manual-fields-status');
    const descriptionStatus = document.getElementById('description-status');
    const seoStatus = document.getElementById('seo-status');
    const overallStatus = document.getElementById('overall-status');

    const totalManualFields = manualFields.length + 1; // +1 for images
    if (manualStatus) manualStatus.textContent = `${manualCompleted}/${totalManualFields}`;
    if (descriptionStatus) descriptionStatus.textContent = `${descriptionCompleted}/${descriptionFields.length}`;
    if (seoStatus) seoStatus.textContent = `${seoCompleted}/${seoFields.length}`;

    // 更新进度条和整体完成度
    const totalFields = totalManualFields + descriptionFields.length + seoFields.length;
    const totalCompleted = manualCompleted + descriptionCompleted + seoCompleted;
    const progressPercent = Math.round((totalCompleted / totalFields) * 100);

    if (overallStatus) overallStatus.textContent = `${progressPercent}%`;

    const progressBar = document.getElementById('form-progress-bar');
    if (progressBar) {
        progressBar.style.width = `${progressPercent}%`;
        progressBar.className = 'progress-bar';
        if (progressPercent >= 100) {
            progressBar.classList.add('bg-success');
        } else if (progressPercent >= 75) {
            progressBar.classList.add('bg-info');
        } else if (progressPercent >= 50) {
            progressBar.classList.add('bg-warning');
        } else {
            progressBar.classList.add('bg-danger');
        }
    }

    // 更新步骤指示器
    updateStepIndicators(manualCompleted, totalManualFields, descriptionCompleted, seoCompleted);
}

// 更新步骤指示器
function updateStepIndicators(manualCompleted, totalManualFields, descriptionCompleted, seoCompleted) {
    const steps = document.querySelectorAll('.step-item');

    steps.forEach((step, index) => {
        step.classList.remove('active', 'completed');

        switch(index) {
            case 0: // 手动填写区域
                if (manualCompleted >= totalManualFields * 0.8) {
                    step.classList.add('completed');
                } else if (manualCompleted > 0) {
                    step.classList.add('active');
                }
                break;
            case 1: // 产品描述
                if (descriptionCompleted >= 1) {
                    step.classList.add('completed');
                } else if (manualCompleted >= totalManualFields * 0.6) {
                    step.classList.add('active');
                }
                break;
            case 2: // SEO优化
                if (seoCompleted >= 1) {
                    step.classList.add('completed');
                } else if (descriptionCompleted >= 1) {
                    step.classList.add('active');
                }
                break;
            case 3: // 完成
                if (manualCompleted >= totalManualFields * 0.8 && descriptionCompleted >= 1) {
                    step.classList.add('completed');
                } else if (seoCompleted >= 1) {
                    step.classList.add('active');
                }
                break;
        }
    });
}

// 更新实时预览
function updatePreview() {
    const previewContent = document.getElementById('product-preview-content');
    if (!previewContent) return;

    const name = document.getElementById('product-name')?.value || '';
    const model = document.getElementById('product-model')?.value || '';
    const category = document.getElementById('product-category')?.value || '';
    const brand = document.getElementById('product-brand')?.value || '';
    const price = document.getElementById('product-price')?.value || '';
    const warranty = document.getElementById('product-warranty')?.value || '';

    if (!name && !model) {
        previewContent.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="bi bi-image fs-1 mb-3"></i>
                <p>填写产品信息后将显示预览</p>
            </div>
        `;
        return;
    }

    const categoryNames = {
        'turbocharger': 'Turbocharger',
        'actuator': 'Actuator',
        'injector': 'Common Rail Injector',
        'turbo-parts': 'Turbo Parts',
        'others': 'Others'
    };

    previewContent.innerHTML = `
        <div class="preview-card">
            <div class="d-flex align-items-center mb-3">
                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                     style="width: 50px; height: 50px;">
                    <i class="bi bi-gear-fill"></i>
                </div>
                <div>
                    <h6 class="mb-1">${name || '产品名称'}</h6>
                    <small class="text-muted">${model || '产品型号'}</small>
                </div>
            </div>
            <div class="row g-2 mb-3">
                <div class="col-6">
                    <small class="text-muted">分类</small>
                    <div class="fw-bold">${categoryNames[category] || category}</div>
                </div>
                <div class="col-6">
                    <small class="text-muted">品牌</small>
                    <div class="fw-bold">${brand}</div>
                </div>
                <div class="col-6">
                    <small class="text-muted">价格</small>
                    <div class="fw-bold text-success">$${price}</div>
                </div>
                <div class="col-6">
                    <small class="text-muted">保修</small>
                    <div class="fw-bold">${warranty} Months</div>
                </div>
            </div>
            <div class="text-center">
                <small class="text-muted">
                    <i class="bi bi-info-circle me-1"></i>
                    实时预览，继续填写更多信息
                </small>
            </div>
        </div>
    `;
}

// 显示智能建议
function showSmartSuggestions() {
    const name = document.getElementById('product-name')?.value || '';
    const category = document.getElementById('product-category')?.value || '';
    const suggestionsDiv = document.getElementById('basic-info-suggestions');
    const suggestionContent = document.getElementById('suggestion-content');

    if (!name || !suggestionsDiv || !suggestionContent) return;

    let suggestions = [];

    // 根据产品名称和分类生成建议
    if (category === 'turbocharger' && name.toLowerCase().includes('turbo')) {
        suggestions.push('建议添加涡轮增压器相关的OEM号码');
        suggestions.push('推荐选择"高性能"和"精准控制"特性');
    }

    if (category === 'injector' && name.toLowerCase().includes('injector')) {
        suggestions.push('建议添加喷油器的适配车型信息');
        suggestions.push('推荐选择"精密喷射"和"高精度"特性');
    }

    if (suggestions.length > 0) {
        suggestionContent.innerHTML = suggestions.map(s =>
            `<div class="mb-1"><i class="bi bi-check-circle text-success me-2"></i>${s}</div>`
        ).join('');
        suggestionsDiv.style.display = 'block';
    }
}

// 隐藏智能建议
function hideSmartSuggestions() {
    const suggestionsDiv = document.getElementById('basic-info-suggestions');
    if (suggestionsDiv) {
        suggestionsDiv.style.display = 'none';
    }
}

// 显示分类建议
function showCategorySuggestions(category) {
    const suggestions = {
        'turbocharger': ['建议重点填写涡轮参数', '推荐上传涡轮本体图片'],
        'actuator': ['建议详细描述执行器功能', '推荐添加安装说明'],
        'injector': ['建议添加喷射压力参数', '推荐说明燃油兼容性'],
        'turbo-parts': ['建议说明配件用途', '推荐添加安装位置图']
    };

    if (suggestions[category]) {
        showSmartSuggestions();
    }
}

// 刷新预览
function refreshPreview() {
    updatePreview();
    showToast('预览已刷新', 'success');
}

// 价格建议
function suggestPrice() {
    const category = document.getElementById('product-category')?.value || '';
    const priceInput = document.getElementById('product-price');

    const suggestedPrices = {
        'turbocharger': 150,
        'actuator': 80,
        'injector': 120,
        'turbo-parts': 50,
        'others': 99
    };

    if (priceInput && suggestedPrices[category]) {
        priceInput.value = suggestedPrices[category];
        updatePreview();
        showToast(`建议价格：$${suggestedPrices[category]}`, 'info');
    }
}

// 清空所有图片
function clearAllImages() {
    if (confirm('确定要清空所有图片吗？')) {
        // 清空图片容器
        const imageContainer = document.getElementById('addImageContainer');
        if (imageContainer) {
            imageContainer.innerHTML = '';
        }

        // 隐藏预览区域
        const previewArea = document.getElementById('addImagePreviews');
        if (previewArea) {
            previewArea.style.display = 'none';
        }

        // 显示上传区域
        const uploadArea = document.getElementById('addUploadArea');
        if (uploadArea) {
            uploadArea.style.display = 'block';
        }

        // 清空文件输入
        const fileInput = document.getElementById('addProductImages');
        if (fileInput) {
            fileInput.value = '';
        }

        // 清除全局变量
        selectedFiles = [];
        selectedImages = [];

        // 更新进度
        updateFormProgress();

        showToast('已清空所有图片', 'success');
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
        
        const response = await fetch('/api/admin-db/products', {
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
        
        const response = await fetch(`/api/admin-db/products/${productId}`, {
            method: 'PUT',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        

        
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
    // 确保编辑表单的分类选择器已填充
    populateEditCategorySelector();

    fetch(`/api/admin-db/products/${productId}`)
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

            // 设置字符计数事件监听器
            setupEditCharCountListeners();

            // 初始更新字符计数
            updateEditCharCount();

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

        })
        .catch(error => {
            console.error('批量编辑失败:', error);
            showToast('批量编辑失败', 'error');
        });
}

// 产品筛选
// 注意：filterProducts 函数已移动到文件末尾的分页功能区域，现在支持分页筛选







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
    
    // 根据分类筛选合适的特性 - 使用英文特性名称
    switch(category) {
        case 'turbocharger':
            // 涡轮增压器专用特性
            candidateFeatures = allAvailableFeatures.filter(f =>
                f !== 'Injection' && f !== 'Complete Kit' && f !== 'Pro Tools' && f !== 'Original'
            );
            weightedFeatures = ['OEM Quality', 'High Power', 'Precise', 'Durable', 'High Precision'].filter(f => candidateFeatures.includes(f));
            break;
        case 'actuator':
            // 执行器专用特性
            candidateFeatures = allAvailableFeatures.filter(f =>
                f !== 'Injection' && f !== 'Complete Kit' && f !== 'Pro Tools' && f !== 'Original'
            );
            weightedFeatures = ['OEM Quality', 'Precise', 'High Precision', 'Durable'].filter(f => candidateFeatures.includes(f));
            break;
        case 'injector':
            // 喷油器专用特性（可以包含精密喷射）
            candidateFeatures = allAvailableFeatures.filter(f =>
                f !== 'Complete Kit' && f !== 'Pro Tools' && f !== 'Original'
            );
            weightedFeatures = ['OEM Quality', 'Injection', 'High Precision', 'Durable'].filter(f => candidateFeatures.includes(f));
            break;
        case 'turbo-parts':
            // 配件专用特性
            candidateFeatures = allAvailableFeatures.filter(f =>
                f !== 'Injection' && f !== 'Original'
            );
            weightedFeatures = ['Complete Kit', 'Pro Tools', 'In Stock', 'OEM Quality'].filter(f => candidateFeatures.includes(f));
            break;
        default:
            // 其他分类，排除特定特性
            candidateFeatures = allAvailableFeatures.filter(f =>
                f !== 'Injection' && f !== 'Complete Kit' && f !== 'Pro Tools' && f !== 'Original'
            );
            weightedFeatures = ['OEM Quality', 'High Power', 'Durable'].filter(f => candidateFeatures.includes(f));
            break;
    }
    
    // 如果是Diamond-Auto品牌，增加钻石品质的权重 - 使用精简英文特性名称
    if (brand === 'Diamond-Auto' && candidateFeatures.includes('Diamond Grade')) {
        weightedFeatures.unshift('Diamond Grade');
    }

    // 如果是高价格产品，增加高端产品的权重 - 使用精简英文特性名称
    if (price && parseFloat(price) > 200 && candidateFeatures.includes('Premium')) {
        weightedFeatures.push('Premium');
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
            // 中文特性到精简英文的映射
            const featureTranslationMap = {
                '原厂品质': 'OEM Quality',
                '钻石品质': 'Diamond Grade',
                '高性能': 'High Power',
                '精准控制': 'Precise',
                '精密喷射': 'Injection',
                '配件齐全': 'Complete Kit',
                '专业工具': 'Pro Tools',
                '高端产品': 'Premium',
                '现货充足': 'In Stock',
                '原厂正品': 'Original',
                '高精度': 'High Precision',
                '长寿命': 'Durable'
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
        // 中文特性到精简英文的映射
        const featureTranslationMap = {
            '原厂品质': 'OEM Quality',
            '钻石品质': 'Diamond Grade',
            '高性能': 'High Power',
            '精准控制': 'Precise',
            '精密喷射': 'Injection',
            '配件齐全': 'Complete Kit',
            '专业工具': 'Pro Tools',
            '高端产品': 'Premium',
            '现货充足': 'In Stock',
            '原厂正品': 'Original',
            '高精度': 'High Precision',
            '长寿命': 'Durable'
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
    
    // 根据分类设置特性选择范围 - 使用英文特性名称
    let excludedFeatures = [];

    switch(category) {
        case 'turbocharger':
            excludedFeatures = ['Injection', 'Complete Kit', 'Pro Tools', 'Original'];
            break;
        case 'actuator':
            excludedFeatures = ['Injection', 'Complete Kit', 'Pro Tools', 'Original'];
            break;
        case 'injector':
            excludedFeatures = ['Complete Kit', 'Pro Tools', 'Original'];
            break;
        case 'turbo-parts':
            excludedFeatures = ['Injection', 'Original'];
            break;
        case 'others':
            excludedFeatures = ['Injection', 'Complete Kit', 'Pro Tools', 'Original'];
            break;
        default:
            excludedFeatures = ['Injection', 'Original'];
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
        // 中文特性到精简英文的映射
        const featureTranslationMap = {
            '原厂品质': 'OEM Quality',
            '钻石品质': 'Diamond Grade',
            '高性能': 'High Power',
            '精准控制': 'Precise',
            '精密喷射': 'Injection',
            '配件齐全': 'Complete Kit',
            '专业工具': 'Pro Tools',
            '高端产品': 'Premium',
            '现货充足': 'In Stock',
            '原厂正品': 'Original',
            '高精度': 'High Precision',
            '长寿命': 'Durable'
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

// 生成默认特性（批量更新专用，使用精简英文特性名称）
function generateDefaultFeatures(category) {
    const defaultFeatures = {
        'turbocharger': ['OEM Quality', 'High Power', 'Durable'],
        'actuator': ['OEM Quality', 'Precise', 'High Precision'],
        'injector': ['OEM Quality', 'Injection', 'High Precision'],
        'turbo-parts': ['OEM Quality', 'Complete Kit', 'In Stock'],
        'others': ['OEM Quality', 'High Power', 'Durable']
    };

    return (defaultFeatures[category] || defaultFeatures['others']).join(',');
}

// ===== 编辑产品页面辅助函数 =====

/**
 * 清空编辑模式下的基本信息
 */
function clearEditBasicInfo() {
    document.getElementById('editProductName').value = '';
    document.getElementById('editProductModel').value = '';
    document.getElementById('editProductCategory').value = 'turbocharger';
    document.getElementById('editProductBrand').value = 'Diamond-Auto';
    document.getElementById('editProductPrice').value = '';
    document.getElementById('editProductWarranty').value = '12';
    updateEditCharCount();
}

/**
 * 智能填充编辑模式下的基本信息
 */
function generateEditBasicInfo() {
    const name = document.getElementById('editProductName').value;
    const category = document.getElementById('editProductCategory').value;

    if (!name) {
        showToast('请先输入产品名称', 'warning');
        return;
    }

    // 根据产品名称和分类智能填充其他信息
    if (name.toLowerCase().includes('turbo') && !document.getElementById('editProductModel').value) {
        document.getElementById('editProductModel').value = 'GT' + Math.floor(Math.random() * 9000 + 1000) + 'V';
    }

    if (!document.getElementById('editProductPrice').value) {
        const suggestedPrice = category === 'turbocharger' ? 299 : category === 'injector' ? 199 : 99;
        document.getElementById('editProductPrice').value = suggestedPrice;
    }
}

/**
 * 清空编辑模式下的详细信息
 */
function clearEditDetailInfo() {
    document.getElementById('editProductOe').value = '';
    document.getElementById('editProductCompatibility').value = '';
}

/**
 * 智能填充编辑模式下的详细信息
 */
function generateEditDetailInfo() {
    const model = document.getElementById('editProductModel').value;
    const category = document.getElementById('editProductCategory').value;

    if (model && !document.getElementById('editProductOe').value) {
        // 生成示例OEM号
        const oemNumbers = [
            model.replace(/[^A-Z0-9]/g, ''),
            '0' + Math.floor(Math.random() * 900000 + 100000),
            'A' + Math.floor(Math.random() * 90000 + 10000) + 'B'
        ];
        document.getElementById('editProductOe').value = oemNumbers.join('\n');
    }

    if (category && !document.getElementById('editProductCompatibility').value) {
        const compatibilityExamples = {
            'turbocharger': 'Audi A4, VW Passat, Skoda Superb\nEngine: 1.9 TDI, 2.0 TDI',
            'actuator': 'BMW 320d, Mercedes C220 CDI\nEngine: M47D20, OM646',
            'injector': 'Ford Focus, Peugeot 307\nEngine: DV6TED4, DW10BTED4',
            'turbo-parts': 'Universal Turbocharger Parts\nCompatible with GT series',
            'others': 'Various Applications\nPlease contact for compatibility'
        };
        document.getElementById('editProductCompatibility').value = compatibilityExamples[category] || compatibilityExamples['others'];
    }
}

/**
 * 清空编辑模式下的描述信息
 */
function clearEditDescriptionInfo() {
    document.getElementById('editProductDescription').value = '';
    clearEditFeatures();
}

/**
 * 智能生成编辑模式下的描述信息
 */
function generateEditDescriptionInfo() {
    generateEditProductDescription();
    generateEditProductFeatures();
}

/**
 * 清空编辑模式下的描述
 */
function clearEditDescription() {
    document.getElementById('editProductDescription').value = '';
}

/**
 * 清空编辑模式下的特性
 */
function clearEditFeatures() {
    const featureTags = document.querySelectorAll('#editFeatureTags .feature-tag');
    featureTags.forEach(tag => {
        tag.classList.remove('btn-primary');
        tag.classList.add('btn-outline-primary');
    });
    document.getElementById('editProductFeatures').value = '';
}

/**
 * 清空编辑模式下的SEO信息
 */
function clearEditSeoInfo() {
    document.getElementById('editProductMetaDescription').value = '';
    document.getElementById('editProductMetaKeywords').value = '';
    document.getElementById('editProductNotes').value = '';
}

/**
 * 智能生成编辑模式下的SEO信息
 */
function generateEditSeoInfo() {
    generateEditSeoContent();
}

/**
 * 清空编辑模式下的高级设置
 */
function clearEditAdvancedInfo() {
    document.getElementById('editProductStock').value = '0';
    document.getElementById('editProductStatus').value = 'active';
    document.getElementById('editIsNew').checked = false;
    document.getElementById('editIsHot').checked = false;
    document.getElementById('editIsRecommend').checked = false;
}

/**
 * 设置编辑模式下的默认高级设置
 */
function setEditDefaultAdvanced() {
    document.getElementById('editProductStock').value = '10';
    document.getElementById('editProductStatus').value = 'active';
    document.getElementById('editIsNew').checked = true;
    document.getElementById('editIsHot').checked = false;
    document.getElementById('editIsRecommend').checked = true;
}

/**
 * 清空编辑模式下的图片
 */
function clearEditImages() {
    document.getElementById('editProductImages').value = '';
    const currentContainer = document.getElementById('currentImageContainer');
    if (currentContainer) {
        currentContainer.innerHTML = '';
    }
    const previewContainer = document.getElementById('editImageContainer');
    if (previewContainer) {
        previewContainer.innerHTML = '';
    }
    const previewDiv = document.getElementById('editImagePreviews');
    if (previewDiv) {
        previewDiv.style.display = 'none';
    }
}

/**
 * 优化编辑模式下的图片
 */
function optimizeEditImages() {
    showToast('图片优化功能开发中...', 'info');
}

/**
 * 更新编辑模式下的字符计数
 */
function updateEditCharCount() {
    const nameInput = document.getElementById('editProductName');
    const charCountElement = document.getElementById('edit-name-char-count');

    if (nameInput && charCountElement) {
        const currentLength = nameInput.value.length;
        const maxLength = nameInput.getAttribute('maxlength') || 120;
        charCountElement.textContent = `${currentLength}/${maxLength}`;

        // 更新样式
        if (currentLength > maxLength * 0.9) {
            charCountElement.classList.add('text-danger');
            charCountElement.classList.remove('text-warning', 'text-muted');
        } else if (currentLength > maxLength * 0.7) {
            charCountElement.classList.add('text-warning');
            charCountElement.classList.remove('text-danger', 'text-muted');
        } else {
            charCountElement.classList.add('text-muted');
            charCountElement.classList.remove('text-danger', 'text-warning');
        }
    }
}

/**
 * 价格建议功能（编辑模式）
 */
function suggestEditPrice() {
    const category = document.getElementById('editProductCategory').value;
    const brand = document.getElementById('editProductBrand').value;

    let suggestedPrice = 99; // 默认价格

    // 根据分类调整价格
    switch(category) {
        case 'turbocharger':
            suggestedPrice = 299;
            break;
        case 'injector':
            suggestedPrice = 199;
            break;
        case 'actuator':
            suggestedPrice = 149;
            break;
        case 'turbo-parts':
            suggestedPrice = 79;
            break;
    }

    // 根据品牌调整价格
    if (brand === 'Diamond-Auto') {
        suggestedPrice *= 0.8; // Diamond-Auto品牌优惠20%
    }

    document.getElementById('editProductPrice').value = suggestedPrice.toFixed(2);
    showToast(`建议价格：$${suggestedPrice.toFixed(2)}`, 'success');
}

/**
 * 设置编辑模式下的字符计数事件监听器
 */
function setupEditCharCountListeners() {
    const nameInput = document.getElementById('editProductName');
    if (nameInput) {
        // 移除之前的事件监听器（如果有）
        nameInput.removeEventListener('input', updateEditCharCount);
        nameInput.removeEventListener('keyup', updateEditCharCount);

        // 添加新的事件监听器
        nameInput.addEventListener('input', updateEditCharCount);
        nameInput.addEventListener('keyup', updateEditCharCount);
    }
}

// ===== 产品标签管理函数 =====

/**
 * 清空添加产品页面的所有标签
 */
function clearProductTags() {
    document.getElementById('addIsNew').checked = false;
    document.getElementById('addIsHot').checked = false;
    document.getElementById('addIsRecommend').checked = false;
}

/**
 * 设置添加产品页面的默认标签
 */
function setDefaultProductTags() {
    document.getElementById('addIsNew').checked = true;
    document.getElementById('addIsHot').checked = false;
    document.getElementById('addIsRecommend').checked = false;
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

// 批量操作相关变量
let selectedInquiryIds = new Set();
let isSelectingAll = false;

// 🔄 加载询价列表 - 优化版本，支持缓存和防重复加载
let inquiriesDataCache = null;
let inquiriesDataCacheTime = 0;
let isLoadingInquiries = false;
const INQUIRIES_DATA_CACHE_TTL = 30000; // 30秒缓存

async function loadInquiries() {
    // 防止重复加载
    if (isLoadingInquiries) {
        console.log('🔄 询价数据正在加载中，跳过重复请求');
        return;
    }

    try {
        // 检查缓存
        const now = Date.now();
        if (inquiriesDataCache && (now - inquiriesDataCacheTime) < INQUIRIES_DATA_CACHE_TTL) {
            console.log('🎯 使用询价数据缓存');
            processInquiriesData(inquiriesDataCache);
            return;
        }

        isLoadingInquiries = true;
        console.log('📊 加载询价数据...');

        // 清除之前的选择状态
        selectedInquiryIds.clear();
        isSelectingAll = false;

        // 隐藏批量操作面板
        const batchPanel = document.getElementById('inquiry-batch-panel');
        if (batchPanel) {
            batchPanel.style.display = 'none';
        }

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

        // 缓存数据
        inquiriesDataCache = inquiries;
        inquiriesDataCacheTime = now;

        // 处理数据
        processInquiriesData(inquiries);

    } catch (error) {
        console.error('加载询价列表失败:', error);
        showToast('加载询价列表失败，请刷新页面重试', 'danger');

        // 显示错误状态
        const tbody = document.getElementById('inquiry-list');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-5">
                        <div class="text-danger">
                            <i class="bi bi-exclamation-triangle fs-1"></i>
                            <div class="mt-2">加载失败，请刷新页面重试</div>
                        </div>
                    </td>
                </tr>
            `;
        }
    } finally {
        isLoadingInquiries = false;
    }
}

// 🔄 处理询价数据 - 提取的公共函数
function processInquiriesData(inquiries) {
    try {
        // 获取筛选条件
        const statusFilter = document.getElementById('inquiry-status-filter')?.value || '';
        const searchFilter = document.getElementById('inquiry-search-filter')?.value.toLowerCase() || '';

        // 过滤询价记录
        filteredInquiries = inquiries.filter(inquiry => {
            let matches = true;

            // 状态筛选
            if (statusFilter && inquiry.status !== statusFilter) {
                matches = false;
            }

            // 时间范围筛选（使用全局时间筛选器）
            if (currentTimeFilter && currentTimeFilter.startDate && currentTimeFilter.endDate) {
                const inquiryDate = new Date(inquiry.createdAt);
                const startDate = new Date(currentTimeFilter.startDate);
                const endDate = new Date(currentTimeFilter.endDate);
                endDate.setHours(23, 59, 59, 999); // 设置为当天结束

                if (inquiryDate < startDate || inquiryDate > endDate) {
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
        console.error('处理询价数据失败:', error);
        showToast('数据处理失败', 'error');
    }
}

// 清除询价数据缓存
function clearInquiriesDataCache() {
    inquiriesDataCache = null;
    inquiriesDataCacheTime = 0;
    console.log('🗑️ 询价数据缓存已清除');
}

// 渲染询价列表
function renderInquiryList(inquiries) {
    const tbody = document.getElementById('inquiry-list');

    if (inquiries.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5">
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
                <div class="form-check">
                    <input class="form-check-input inquiry-checkbox" type="checkbox" value="${inquiry.id}" id="inquiry-${inquiry.id}">
                    <label class="form-check-label" for="inquiry-${inquiry.id}"></label>
                </div>
            </td>
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

    // 设置批量操作事件监听器
    setupInquiryBatchOperations();
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
    document.getElementById('inquiry-search-filter').value = '';

    // 重置时间筛选为今天
    selectTimeShortcut('today');
    updatePageTimeRangeDisplay();

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

// 🔧 初始化询价管理 - 防重复初始化版本
let inquiryManagementInitialized = false;

function initInquiryManagement() {
    // 防止重复初始化
    if (inquiryManagementInitialized) {
        console.log('🔄 询价管理已初始化，跳过重复初始化');
        // 只刷新数据，不重新绑定事件
        if (!loadingStates.inquiries) {
            loadInquiries();
        }
        return;
    }

    console.log('🔧 初始化询价管理...');
    inquiryManagementInitialized = true;

    // 绑定筛选器变化事件
    const statusFilter = document.getElementById('inquiry-status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            currentInquiryPage = 1;
            loadInquiries();
        });
    }

    // 时间筛选现在通过时间筛选组件处理，不需要单独的日期筛选监听器

    const searchFilter = document.getElementById('inquiry-search-filter');
    if (searchFilter) {
        searchFilter.addEventListener('input', debounce(() => {
            currentInquiryPage = 1;
            loadInquiries();
        }, 500));
    }

    // 绑定页面大小变化事件
    const pageSizeSelect = document.getElementById('inquiry-page-size');
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', (e) => {
            inquiryPageSize = parseInt(e.target.value);
            currentInquiryPage = 1;
            loadInquiries();
        });
    }

    // 绑定更新状态按钮事件
    const updateStatusBtn = document.getElementById('update-inquiry-status');
    if (updateStatusBtn) {
        updateStatusBtn.addEventListener('click', updateInquiryStatus);
    }

    // 初始化清空数据功能
    initClearInquiriesModal();

    // 初始化批量操作功能
    initInquiryBatchOperations();

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
                credentials: 'include'
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

// 历史数据查询功能 - 已移除，现在使用全局时间筛选器
/* 已废弃：使用全局时间筛选器替代
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
*/

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

// 页面加载时初始化历史数据功能 - 已移除，现在使用全局时间筛选器
/* 已废弃：使用全局时间筛选器替代
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
*/

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

// ===== 时间筛选组件功能 =====

// 时间筛选相关全局变量
let currentTimeFilter = {
    startDate: null,
    endDate: null,
    range: 'today',
    displayText: '今天'
};

let currentFilterPage = null; // 当前使用时间筛选的页面

// 显示时间筛选模态框
function showTimeFilterModal(page) {
    currentFilterPage = page;

    // 初始化模态框
    const modal = new bootstrap.Modal(document.getElementById('timeFilterModal'));

    // 设置当前选择的时间范围
    updateCurrentTimeRangeDisplay();

    // 设置日期输入框的默认值
    if (currentTimeFilter.startDate && currentTimeFilter.endDate) {
        document.getElementById('startDate').value = currentTimeFilter.startDate;
        document.getElementById('endDate').value = currentTimeFilter.endDate;
    } else {
        // 如果没有自定义日期，根据当前范围设置
        const dates = calculateDateRange(currentTimeFilter.range);
        document.getElementById('startDate').value = dates.startDate;
        document.getElementById('endDate').value = dates.endDate;
    }

    // 高亮当前选中的快捷选项
    highlightActiveShortcut(currentTimeFilter.range);

    modal.show();
}

// 选择快捷时间选项
function selectTimeShortcut(range) {
    const dates = calculateDateRange(range);

    // 更新全局时间筛选状态
    currentTimeFilter.range = range;
    currentTimeFilter.startDate = dates.startDate;
    currentTimeFilter.endDate = dates.endDate;
    currentTimeFilter.displayText = getTimeRangeDisplayText(range, dates);

    // 更新日期输入框
    document.getElementById('startDate').value = dates.startDate;
    document.getElementById('endDate').value = dates.endDate;

    // 高亮选中的按钮
    highlightActiveShortcut(range);

    // 更新当前选择显示
    updateCurrentTimeRangeDisplay();

    // 清除日期范围错误
    hideDateRangeError();
}

// 计算日期范围
function calculateDateRange(range) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const date = today.getDate();
    const day = today.getDay(); // 0=周日, 1=周一, ...

    let startDate, endDate;

    switch (range) {
        case 'today':
            startDate = endDate = formatDateForInput(today);
            break;

        case 'yesterday':
            const yesterday = new Date(year, month, date - 1);
            startDate = endDate = formatDateForInput(yesterday);
            break;

        case 'dayBeforeYesterday':
            const dayBeforeYesterday = new Date(year, month, date - 2);
            startDate = endDate = formatDateForInput(dayBeforeYesterday);
            break;

        case 'thisWeek':
            // 本周（周一到今天）
            const mondayOffset = day === 0 ? -6 : 1 - day; // 如果是周日，往前6天；否则往前到周一
            const monday = new Date(year, month, date + mondayOffset);
            startDate = formatDateForInput(monday);
            endDate = formatDateForInput(today);
            break;

        case 'lastWeek':
            // 上周（上周一到上周日）
            const lastMondayOffset = day === 0 ? -13 : -6 - day;
            const lastSundayOffset = day === 0 ? -7 : -day;
            const lastMonday = new Date(year, month, date + lastMondayOffset);
            const lastSunday = new Date(year, month, date + lastSundayOffset);
            startDate = formatDateForInput(lastMonday);
            endDate = formatDateForInput(lastSunday);
            break;

        case 'thisMonth':
            // 本月（本月1号到今天）
            const firstDayOfMonth = new Date(year, month, 1);
            startDate = formatDateForInput(firstDayOfMonth);
            endDate = formatDateForInput(today);
            break;

        case 'lastMonth':
            // 上月（上月1号到上月最后一天）
            const firstDayOfLastMonth = new Date(year, month - 1, 1);
            const lastDayOfLastMonth = new Date(year, month, 0);
            startDate = formatDateForInput(firstDayOfLastMonth);
            endDate = formatDateForInput(lastDayOfLastMonth);
            break;

        default:
            startDate = endDate = formatDateForInput(today);
    }

    return { startDate, endDate };
}

// 格式化日期为输入框格式 (YYYY-MM-DD)
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 获取时间范围显示文本
function getTimeRangeDisplayText(range, dates) {
    const rangeTexts = {
        'today': '今天',
        'yesterday': '昨天',
        'dayBeforeYesterday': '前天',
        'thisWeek': '本周',
        'lastWeek': '上周',
        'thisMonth': '本月',
        'lastMonth': '上月'
    };

    if (rangeTexts[range]) {
        return rangeTexts[range];
    }

    // 自定义日期范围
    if (dates && dates.startDate && dates.endDate) {
        if (dates.startDate === dates.endDate) {
            return formatDateForDisplay(dates.startDate);
        } else {
            return `${formatDateForDisplay(dates.startDate)} 至 ${formatDateForDisplay(dates.endDate)}`;
        }
    }

    return '自定义';
}

// 格式化日期为显示格式 (MM-DD)
function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}-${day}`;
}

// 高亮激活的快捷选项
function highlightActiveShortcut(activeRange) {
    // 移除所有按钮的激活状态
    document.querySelectorAll('.time-shortcut-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // 激活当前选中的按钮
    const activeBtn = document.querySelector(`[data-range="${activeRange}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// 更新当前时间范围显示
function updateCurrentTimeRangeDisplay() {
    const displayElement = document.getElementById('currentTimeRangeDisplay');
    if (displayElement) {
        displayElement.textContent = currentTimeFilter.displayText;
    }
}

// 验证日期范围
function validateDateRange() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!startDate || !endDate) {
        hideDateRangeError();
        return true;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // 设置为今天的最后一刻

    // 检查开始日期是否晚于结束日期
    if (start > end) {
        showDateRangeError('开始日期不能晚于结束日期');
        return false;
    }

    // 检查日期是否超过今天
    if (start > today || end > today) {
        showDateRangeError('日期不能超过今天');
        return false;
    }

    // 检查日期范围是否过大（超过1年）
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (start < oneYearAgo) {
        showDateRangeError('查询范围不能超过1年');
        return false;
    }

    hideDateRangeError();

    // 更新自定义时间筛选
    currentTimeFilter.range = 'custom';
    currentTimeFilter.startDate = startDate;
    currentTimeFilter.endDate = endDate;
    currentTimeFilter.displayText = getTimeRangeDisplayText('custom', { startDate, endDate });

    // 移除快捷选项的激活状态
    highlightActiveShortcut('');

    // 更新当前选择显示
    updateCurrentTimeRangeDisplay();

    return true;
}

// 显示日期范围错误
function showDateRangeError(message) {
    const errorElement = document.getElementById('dateRangeError');
    const errorTextElement = document.getElementById('dateRangeErrorText');

    if (errorElement && errorTextElement) {
        errorTextElement.textContent = message;
        errorElement.classList.remove('d-none');
    }

    // 禁用应用按钮
    const applyBtn = document.getElementById('applyTimeFilterBtn');
    if (applyBtn) {
        applyBtn.disabled = true;
    }
}

// 隐藏日期范围错误
function hideDateRangeError() {
    const errorElement = document.getElementById('dateRangeError');
    if (errorElement) {
        errorElement.classList.add('d-none');
    }

    // 启用应用按钮
    const applyBtn = document.getElementById('applyTimeFilterBtn');
    if (applyBtn) {
        applyBtn.disabled = false;
    }
}

// 重置时间筛选
function resetTimeFilter() {
    // 重置为今天
    selectTimeShortcut('today');
    showToast('时间筛选已重置为今天', 'info');
}

// 应用时间筛选
function applyTimeFilter() {
    // 验证日期范围
    if (!validateDateRange()) {
        return;
    }

    // 更新对应页面的时间范围显示
    updatePageTimeRangeDisplay();

    // 根据页面类型应用筛选
    switch (currentFilterPage) {
        case 'dashboard':
            applyDashboardTimeFilter();
            break;
        case 'logs':
            applyLogsTimeFilter();
            break;
        case 'inquiries':
            applyInquiriesTimeFilter();
            break;
        default:
            console.warn('未知的筛选页面:', currentFilterPage);
    }

    // 关闭模态框
    const modal = bootstrap.Modal.getInstance(document.getElementById('timeFilterModal'));
    modal.hide();

    showToast(`已应用时间筛选：${currentTimeFilter.displayText}`, 'success');
}

// 更新页面时间范围显示
function updatePageTimeRangeDisplay() {
    const displayElementId = `${currentFilterPage}-time-range-text`;
    const displayElement = document.getElementById(displayElementId);

    if (displayElement) {
        displayElement.textContent = currentTimeFilter.displayText;
    }
}

// 应用控制台时间筛选（已移动到性能优化部分）

// 应用操作记录时间筛选
async function applyLogsTimeFilter() {
    try {
        // 显示加载状态
        showLogsLoading();

        // 加载筛选后的操作记录
        await loadFilteredLogs();

    } catch (error) {
        console.error('应用操作记录时间筛选失败:', error);
        showToast('加载操作记录失败，请重试', 'error');
    } finally {
        hideLogsLoading();
    }
}

// 应用询价管理时间筛选
async function applyInquiriesTimeFilter() {
    try {
        // 重置到第一页
        currentInquiryPage = 1;

        // 重新加载询价数据
        await loadInquiries();

    } catch (error) {
        console.error('应用询价时间筛选失败:', error);
        showToast('加载询价数据失败，请重试', 'error');
    }
}

// 加载控制台历史数据
async function loadDashboardHistoricalData() {
    try {
        // 构建查询参数
        const params = new URLSearchParams({
            startDate: currentTimeFilter.startDate,
            endDate: currentTimeFilter.endDate
        });

        const response = await fetch(`/api/analytics/range?${params}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: 获取历史数据失败`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || '获取历史数据失败');
        }

        return result; // 返回完整的API响应数据

    } catch (error) {
        console.error('加载控制台历史数据失败:', error);
        throw error; // 重新抛出错误，让调用者处理
    }
}

// 使用范围数据更新控制台所有区域
async function updateDashboardWithRangeData(apiResponse) {
    try {
        // 处理API响应数据
        const data = apiResponse.success ? apiResponse : apiResponse.data || apiResponse;

        // 1. 更新顶部访问统计区域
        const summary = {
            page_views: data.total_page_views || 0,
            product_clicks: data.total_product_clicks || 0,
            unique_visitors: data.total_unique_visitors || 0
        };
        await updateDashboardStats(summary);

        // 2. 更新热门产品排行区域
        if (data.merged_top_products && data.merged_top_products.length > 0) {
            // 使用合并后的热门产品数据
            updateTopProductsList(data.merged_top_products);
            updateHotProductsOverviewFromMerged(data.merged_top_products);
        } else if (data.daily_data && data.daily_data.length > 0) {
            // 如果没有合并数据，从每日数据中计算
            updateHotProductsForRange(data.daily_data);
        }

        // 3. 更新访问趋势分析区域
        if (data.daily_data && data.daily_data.length > 0) {
            updateTrendAnalysisForRange(data.daily_data);
        } else {
            // 如果没有每日数据，使用汇总数据更新卡片
            const conversionRate = summary.page_views > 0 ?
                ((summary.product_clicks / summary.page_views) * 100).toFixed(2) : 0;
            updateTrendAnalysisCards(summary.page_views, summary.unique_visitors, summary.product_clicks, conversionRate);
        }

        // 4. 更新访问地理分布区域
        if (data.merged_geographic_distribution) {
            // 使用合并后的地理分布数据
            updateGeographicDistributionFromMerged(data.merged_geographic_distribution);
        } else if (data.daily_data && data.daily_data.length > 0) {
            // 如果没有合并数据，从每日数据中计算
            updateGeographicDistributionForRange(data.daily_data);
        }

        console.log(`已更新控制台所有区域的数据 (${currentTimeFilter.displayText})`);

    } catch (error) {
        console.error('更新控制台范围数据失败:', error);
        showToast('部分数据更新失败', 'warning');
    }
}

// 从合并数据更新热门产品概览
function updateHotProductsOverviewFromMerged(mergedProducts) {
    const totalClicks = mergedProducts.reduce((sum, product) => sum + (product.clicks || 0), 0);
    updateHotProductsOverview(mergedProducts, totalClicks);
}

// 从合并数据更新地理分布
function updateGeographicDistributionFromMerged(mergedLocations) {
    const locationData = Object.entries(mergedLocations)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const totalUsers = locationData.reduce((sum, item) => sum + item.value, 0);

    // 更新地理分布图表和列表
    updateGeographicChart(locationData, totalUsers);
    updateGeographicList(locationData, totalUsers);

    console.log(`已更新地理分布 (合并数据): ${locationData.length}个地区, ${totalUsers}位用户`);
}

// 更新热门产品排行区域（时间范围版本）
function updateHotProductsForRange(dailyData) {
    try {
        // 合并所有天的热门产品数据
        const allProducts = {};
        let totalClicks = 0;

        dailyData.forEach(dayData => {
            if (dayData.top_products && Array.isArray(dayData.top_products)) {
                dayData.top_products.forEach(product => {
                    const productId = product.id || product.name;
                    if (allProducts[productId]) {
                        allProducts[productId].clicks += product.clicks || 0;
                        allProducts[productId].views += product.views || 0;
                    } else {
                        allProducts[productId] = {
                            id: productId,
                            name: product.name || productId,
                            clicks: product.clicks || 0,
                            views: product.views || 0,
                            image: product.image || '/assets/images/default-product.jpg'
                        };
                    }
                    totalClicks += product.clicks || 0;
                });
            }
        });

        // 排序并取前10名
        const topProducts = Object.values(allProducts)
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, 10);

        // 更新热门产品列表
        updateTopProductsList(topProducts);

        // 更新热门产品概览统计
        updateHotProductsOverview(topProducts, totalClicks);

        console.log(`已更新热门产品排行 (${currentTimeFilter.displayText}): ${topProducts.length}个产品`);

    } catch (error) {
        console.error('更新热门产品排行失败:', error);
        // 显示空状态
        updateTopProductsList([]);
    }
}

// 更新热门产品概览统计
function updateHotProductsOverview(topProducts, totalClicks) {
    const overviewContainer = document.getElementById('hot-products-overview');
    if (!overviewContainer) return;

    const topProduct = topProducts[0];
    const productCount = topProducts.length;
    const avgClicks = productCount > 0 ? Math.round(totalClicks / productCount) : 0;

    overviewContainer.innerHTML = `
        <div class="col-md-6">
            <div class="d-flex align-items-center mb-3">
                <div class="icon-circle bg-primary bg-opacity-10 me-3">
                    <i class="bi bi-trophy text-primary"></i>
                </div>
                <div>
                    <h6 class="mb-0">最热门产品</h6>
                    <p class="text-muted mb-0 small">${topProduct ? topProduct.name : '暂无数据'}</p>
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="d-flex align-items-center mb-3">
                <div class="icon-circle bg-success bg-opacity-10 me-3">
                    <i class="bi bi-graph-up text-success"></i>
                </div>
                <div>
                    <h6 class="mb-0">总点击量</h6>
                    <p class="text-muted mb-0 small">${totalClicks.toLocaleString()} 次点击</p>
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="d-flex align-items-center mb-3">
                <div class="icon-circle bg-info bg-opacity-10 me-3">
                    <i class="bi bi-collection text-info"></i>
                </div>
                <div>
                    <h6 class="mb-0">热门产品数</h6>
                    <p class="text-muted mb-0 small">${productCount} 个产品</p>
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="d-flex align-items-center mb-3">
                <div class="icon-circle bg-warning bg-opacity-10 me-3">
                    <i class="bi bi-bar-chart text-warning"></i>
                </div>
                <div>
                    <h6 class="mb-0">平均点击量</h6>
                    <p class="text-muted mb-0 small">${avgClicks} 次/产品</p>
                </div>
            </div>
        </div>
    `;
}

// 更新访问趋势分析区域（时间范围版本）
function updateTrendAnalysisForRange(dailyData) {
    try {
        // 更新24小时趋势图为多日趋势图
        updateRangeCharts(dailyData);

        // 更新趋势分析统计
        updateTrendAnalysisStats(dailyData);

        console.log(`已更新访问趋势分析 (${currentTimeFilter.displayText}): ${dailyData.length}天数据`);

    } catch (error) {
        console.error('更新访问趋势分析失败:', error);
    }
}

// 更新趋势分析统计数据
function updateTrendAnalysisStats(dailyData) {
    if (!dailyData || dailyData.length === 0) {
        // 如果没有数据，清空显示
        updateTrendAnalysisCards(0, 0, 0, 0);
        return;
    }

    // 计算趋势统计
    const totalDays = dailyData.length;
    const totalViews = dailyData.reduce((sum, day) => sum + (day.page_views || 0), 0);
    const totalClicks = dailyData.reduce((sum, day) => sum + (day.product_clicks || 0), 0);
    const totalUniqueVisitors = dailyData.reduce((sum, day) => sum + (day.unique_visitors || 0), 0);
    const totalInquiries = dailyData.reduce((sum, day) => sum + (day.inquiries || 0), 0);

    // 计算平均值
    const avgViewsPerDay = Math.round(totalViews / totalDays);
    const avgClicksPerDay = Math.round(totalClicks / totalDays);
    const avgVisitorsPerDay = Math.round(totalUniqueVisitors / totalDays);

    // 计算转化率（产品点击数 / 页面访问数）
    const conversionRate = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : 0;

    // 计算增长趋势
    const firstDay = dailyData[0];
    const lastDay = dailyData[dailyData.length - 1];
    const viewsGrowth = firstDay.page_views > 0 ?
        ((lastDay.page_views - firstDay.page_views) / firstDay.page_views * 100).toFixed(1) : 0;

    // 更新数据卡片显示
    updateTrendAnalysisCards(totalViews, totalUniqueVisitors, totalClicks, conversionRate);

    // 页面选择器已移除，现在使用全局时间筛选器

    console.log(`趋势分析统计已更新: ${totalDays}天, ${totalViews}访问, ${totalClicks}点击, ${conversionRate}%转化率`);
}

// 更新趋势分析数据卡片
function updateTrendAnalysisCards(pageViews, uniqueVisitors, productClicks, conversionRate) {
    // 更新页面访问量
    const pageViewsEl = document.getElementById('overview-page-views');
    if (pageViewsEl) {
        pageViewsEl.textContent = pageViews.toLocaleString();
    }

    // 更新独立用户数
    const uniqueVisitorsEl = document.getElementById('overview-unique-visitors');
    if (uniqueVisitorsEl) {
        uniqueVisitorsEl.textContent = uniqueVisitors.toLocaleString();
    }

    // 更新产品点击数
    const productClicksEl = document.getElementById('overview-product-clicks');
    if (productClicksEl) {
        productClicksEl.textContent = productClicks.toLocaleString();
    }

    // 更新转化率
    const conversionRateEl = document.getElementById('overview-conversion-rate');
    if (conversionRateEl) {
        conversionRateEl.textContent = `${conversionRate}%`;
    }
}

// 更新范围图表
function updateRangeCharts(dailyData) {
    // 更新24小时趋势图为多日趋势图
    const chartElement = document.getElementById('hourly-chart');
    if (chartElement && window.echarts) {
        const chart = echarts.init(chartElement);

        const dates = dailyData.map(item => formatDateForDisplay(item.date));
        const pageViews = dailyData.map(item => item.page_views || 0);
        const productClicks = dailyData.map(item => item.product_clicks || 0);

        const option = {
            title: {
                text: `${currentTimeFilter.displayText}数据趋势`,
                left: 'center',
                textStyle: { fontSize: 14 }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' }
            },
            legend: {
                data: ['页面访问', '产品点击'],
                top: 30
            },
            xAxis: {
                type: 'category',
                data: dates,
                axisLabel: { rotate: 45 }
            },
            yAxis: {
                type: 'value'
            },
            series: [
                {
                    name: '页面访问',
                    type: 'line',
                    data: pageViews,
                    smooth: true,
                    itemStyle: { color: '#2563eb' }
                },
                {
                    name: '产品点击',
                    type: 'line',
                    data: productClicks,
                    smooth: true,
                    itemStyle: { color: '#dc2626' }
                }
            ]
        };

        chart.setOption(option);
    }
}

// 更新访问地理分布区域（时间范围版本）
function updateGeographicDistributionForRange(dailyData) {
    try {
        // 合并所有天的地理分布数据
        const allLocations = {};
        let totalUsers = 0;

        dailyData.forEach(dayData => {
            if (dayData.geographic_distribution && typeof dayData.geographic_distribution === 'object') {
                Object.entries(dayData.geographic_distribution).forEach(([location, count]) => {
                    if (allLocations[location]) {
                        allLocations[location] += count;
                    } else {
                        allLocations[location] = count;
                    }
                    totalUsers += count;
                });
            }
        });

        // 转换为数组并排序
        const locationData = Object.entries(allLocations)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // 更新地理分布图表
        updateGeographicChart(locationData, totalUsers);

        // 更新地理分布列表
        updateGeographicList(locationData, totalUsers);

        console.log(`已更新访问地理分布 (${currentTimeFilter.displayText}): ${locationData.length}个地区, ${totalUsers}位用户`);

    } catch (error) {
        console.error('更新访问地理分布失败:', error);
        // 显示空状态
        updateGeographicChart([], 0);
    }
}

// 更新地理分布图表
function updateGeographicChart(locationData, totalUsers) {
    const chartElement = document.getElementById('geo-chart');
    if (!chartElement) {
        console.warn('地理分布图表元素未找到: geo-chart');
        return;
    }

    const chart = echarts.init(chartElement);

    if (totalUsers === 0 || locationData.length === 0) {
        // 显示空图表
        const option = {
            title: {
                text: `访问地理分布 (${currentTimeFilter.displayText})`,
                left: 'center',
                top: 20,
                textStyle: { fontSize: 14 }
            },
            graphic: {
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                    text: '暂无地理位置数据',
                    fontSize: 16,
                    fill: '#999'
                }
            }
        };
        chart.setOption(option);
        return;
    }

    // 取前10个地区
    const topLocations = locationData.slice(0, 10);

    const option = {
        title: {
            text: `访问地理分布 (${totalUsers}位用户)`,
            subtext: currentTimeFilter.displayText,
            left: 'center',
            top: 20,
            textStyle: { fontSize: 14 }
        },
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
            orient: 'vertical',
            left: 'left',
            top: 60,
            data: topLocations.map(item => item.name)
        },
        series: [
            {
                name: '访问用户',
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['60%', '60%'],
                avoidLabelOverlap: false,
                label: {
                    show: false,
                    position: 'center'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: '18',
                        fontWeight: 'bold'
                    }
                },
                labelLine: {
                    show: false
                },
                data: topLocations
            }
        ]
    };

    chart.setOption(option);
}

// 更新地理分布列表
function updateGeographicList(locationData, totalUsers) {
    const listElement = document.getElementById('geo-list');
    if (!listElement) {
        console.warn('地理分布列表元素未找到: geo-list');
        return;
    }

    if (totalUsers === 0 || locationData.length === 0) {
        listElement.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="bi bi-globe fa-2x mb-2"></i>
                <p>暂无地理位置数据</p>
                <small>${currentTimeFilter.displayText}期间无访问记录</small>
            </div>
        `;
        return;
    }

    // 取前8个地区显示
    const topLocations = locationData.slice(0, 8);

    listElement.innerHTML = topLocations.map((location, index) => {
        const percentage = ((location.value / totalUsers) * 100).toFixed(1);
        const progressWidth = Math.max(percentage, 5); // 最小宽度5%

        return `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="d-flex align-items-center">
                    <span class="badge bg-primary me-2">${index + 1}</span>
                    <span class="fw-medium">${location.name}</span>
                </div>
                <div class="text-end" style="min-width: 80px;">
                    <div class="fw-bold">${location.value}</div>
                    <div class="progress mt-1" style="height: 4px; width: 60px;">
                        <div class="progress-bar bg-primary" style="width: ${progressWidth}%"></div>
                    </div>
                    <small class="text-muted">${percentage}%</small>
                </div>
            </div>
        `;
    }).join('');

    // 如果有更多地区，显示总计信息
    if (locationData.length > 8) {
        const otherCount = locationData.length - 8;
        const otherUsers = locationData.slice(8).reduce((sum, item) => sum + item.value, 0);

        listElement.innerHTML += `
            <div class="text-center text-muted mt-3 pt-3 border-top">
                <small>还有 ${otherCount} 个地区的 ${otherUsers} 位用户</small>
            </div>
        `;
    }
}

// 加载筛选后的操作记录
async function loadFilteredLogs() {
    try {
        // 构建查询参数
        const params = new URLSearchParams({
            startDate: currentTimeFilter.startDate,
            endDate: currentTimeFilter.endDate
        });

        const response = await fetch(`/api/logs?${params}`);
        if (!response.ok) {
            throw new Error('获取操作记录失败');
        }

        const filteredLogs = await response.json();

        // 更新操作记录显示
        renderFilteredLogs(filteredLogs);

    } catch (error) {
        console.error('加载筛选操作记录失败:', error);
        // 如果API不支持时间筛选，使用客户端筛选
        await loadLogs();
        filterLogsByTimeRange();
    }
}

// 渲染筛选后的操作记录
function renderFilteredLogs(filteredLogs) {
    const container = document.querySelector('#logs-table tbody');
    if (!container) return;

    if (filteredLogs.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    <i class="bi bi-clock-history fs-1 d-block mb-2"></i>
                    ${currentTimeFilter.displayText}暂无操作记录
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = filteredLogs.map(log => {
        const { time, operator, action, sku, change } = formatLogEntry(log);
        return `
            <tr>
                <td class="px-3 py-2">${new Date(log.timestamp).toLocaleString()}</td>
                <td class="px-3 py-2">${operator}</td>
                <td class="px-3 py-2">${action}</td>
                <td class="px-3 py-2">${sku}</td>
                <td class="px-3 py-2">${change}</td>
            </tr>
        `;
    }).join('');
}

// 客户端时间范围筛选操作记录
function filterLogsByTimeRange() {
    if (!logs || logs.length === 0) return;

    const startDate = new Date(currentTimeFilter.startDate);
    const endDate = new Date(currentTimeFilter.endDate);
    endDate.setHours(23, 59, 59, 999); // 设置为当天结束

    const filteredLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= startDate && logDate <= endDate;
    });

    renderFilteredLogs(filteredLogs);
}

// 显示控制台加载状态
function showDashboardLoading() {
    const statsCards = document.querySelectorAll('#dashboard-page .stats-number');
    statsCards.forEach(card => {
        card.innerHTML = '<i class="spinner-border spinner-border-sm"></i>';
    });
}

// 隐藏控制台加载状态
function hideDashboardLoading() {
    // 加载状态会在数据更新时自动隐藏
}

// 显示操作记录加载状态
function showLogsLoading() {
    const container = document.querySelector('#logs-table tbody');
    if (container) {
        container.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">加载中...</span>
                    </div>
                    <div class="mt-2 text-muted">正在加载${currentTimeFilter.displayText}的操作记录...</div>
                </td>
            </tr>
        `;
    }
}

// 隐藏操作记录加载状态
function hideLogsLoading() {
    // 加载状态会在数据更新时自动隐藏
}

// ===== 时间格式验证和错误处理 =====

// 验证日期格式
function isValidDate(dateString) {
    if (!dateString) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
}

// 验证时间范围的合理性
function validateTimeRangeLogic(startDate, endDate) {
    const errors = [];

    // 检查日期格式
    if (!isValidDate(startDate)) {
        errors.push('开始日期格式无效，请使用 YYYY-MM-DD 格式');
    }

    if (!isValidDate(endDate)) {
        errors.push('结束日期格式无效，请使用 YYYY-MM-DD 格式');
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    const oneYearAgo = new Date();

    today.setHours(23, 59, 59, 999);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // 检查开始日期是否晚于结束日期
    if (start > end) {
        errors.push('开始日期不能晚于结束日期');
    }

    // 检查日期是否超过今天
    if (start > today) {
        errors.push('开始日期不能超过今天');
    }

    if (end > today) {
        errors.push('结束日期不能超过今天');
    }

    // 检查日期范围是否过大（超过1年）
    if (start < oneYearAgo) {
        errors.push('查询范围不能超过1年');
    }

    // 检查日期范围是否过大（超过90天）
    const maxDays = 90;
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (daysDiff > maxDays) {
        errors.push(`查询范围不能超过${maxDays}天，当前选择了${daysDiff}天`);
    }

    return { valid: errors.length === 0, errors };
}

// 增强的日期范围验证
function validateDateRange() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!startDate || !endDate) {
        hideDateRangeError();
        return true;
    }

    const validation = validateTimeRangeLogic(startDate, endDate);

    if (!validation.valid) {
        showDateRangeError(validation.errors[0]); // 显示第一个错误
        return false;
    }

    hideDateRangeError();

    // 更新自定义时间筛选
    currentTimeFilter.range = 'custom';
    currentTimeFilter.startDate = startDate;
    currentTimeFilter.endDate = endDate;
    currentTimeFilter.displayText = getTimeRangeDisplayText('custom', { startDate, endDate });

    // 移除快捷选项的激活状态
    highlightActiveShortcut('');

    // 更新当前选择显示
    updateCurrentTimeRangeDisplay();

    return true;
}

// 处理API错误响应
function handleTimeFilterApiError(error, context = '') {
    console.error(`时间筛选API错误 ${context}:`, error);

    let errorMessage = '数据加载失败，请重试';

    if (error.message) {
        if (error.message.includes('网络')) {
            errorMessage = '网络连接失败，请检查网络后重试';
        } else if (error.message.includes('权限')) {
            errorMessage = '没有权限访问该数据';
        } else if (error.message.includes('参数')) {
            errorMessage = '查询参数有误，请重新选择时间范围';
        } else if (error.message.includes('超时')) {
            errorMessage = '请求超时，请稍后重试';
        }
    }

    showToast(errorMessage, 'error');

    // 记录错误到控制台以便调试
    console.error('时间筛选错误详情:', {
        context,
        error: error.message || error,
        timeFilter: currentTimeFilter,
        timestamp: new Date().toISOString()
    });
}

// 防抖函数，避免频繁的API调用
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

// 节流函数，限制API调用频率
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// 带重试机制的API调用
async function apiCallWithRetry(apiCall, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await apiCall();
        } catch (error) {
            console.warn(`API调用失败，第${i + 1}次重试:`, error);

            if (i === maxRetries - 1) {
                throw error; // 最后一次重试失败，抛出错误
            }

            // 等待后重试
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
    }
}

// 显示友好的错误提示
function showFriendlyError(error, context) {
    const friendlyMessages = {
        'network': '网络连接不稳定，请检查网络后重试',
        'timeout': '请求超时，请稍后重试',
        'server': '服务器暂时无法响应，请稍后重试',
        'permission': '您没有权限执行此操作',
        'validation': '输入的数据格式不正确，请检查后重试',
        'notfound': '请求的数据不存在',
        'default': '操作失败，请重试'
    };

    let messageType = 'default';

    if (error.message) {
        const msg = error.message.toLowerCase();
        if (msg.includes('network') || msg.includes('fetch')) {
            messageType = 'network';
        } else if (msg.includes('timeout')) {
            messageType = 'timeout';
        } else if (msg.includes('500') || msg.includes('server')) {
            messageType = 'server';
        } else if (msg.includes('403') || msg.includes('unauthorized')) {
            messageType = 'permission';
        } else if (msg.includes('400') || msg.includes('validation')) {
            messageType = 'validation';
        } else if (msg.includes('404') || msg.includes('not found')) {
            messageType = 'notfound';
        }
    }

    const message = friendlyMessages[messageType];
    showToast(message, 'error');

    // 在开发环境下显示详细错误信息
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.error(`详细错误信息 (${context}):`, error);
    }
}

// ===== 性能优化和用户体验改进 =====

// 时间筛选缓存机制
const timeFilterCache = new Map();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分钟缓存

// 生成缓存键
function generateCacheKey(page, startDate, endDate, additionalParams = {}) {
    const params = { page, startDate, endDate, ...additionalParams };
    return JSON.stringify(params);
}

// 获取缓存数据
function getCachedData(cacheKey) {
    const cached = timeFilterCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
        return cached.data;
    }
    return null;
}

// 设置缓存数据
function setCachedData(cacheKey, data) {
    timeFilterCache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
    });

    // 清理过期缓存
    if (timeFilterCache.size > 50) {
        const now = Date.now();
        for (const [key, value] of timeFilterCache.entries()) {
            if (now - value.timestamp > CACHE_EXPIRY) {
                timeFilterCache.delete(key);
            }
        }
    }
}

// 带缓存的API调用
async function cachedApiCall(cacheKey, apiCall) {
    // 尝试从缓存获取数据
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
        console.log('使用缓存数据:', cacheKey);
        return cachedData;
    }

    // 缓存未命中，调用API
    const data = await apiCall();
    setCachedData(cacheKey, data);
    return data;
}

// 优化的控制台时间筛选应用
async function applyDashboardTimeFilter() {
    try {
        // 显示加载状态
        showDashboardLoading();

        const cacheKey = generateCacheKey('dashboard', currentTimeFilter.startDate, currentTimeFilter.endDate);

        if (currentTimeFilter.range === 'today') {
            // 今天的数据不使用缓存，保持实时性
            await updateAnalyticsStats();
        } else {
            // 历史数据使用缓存
            const data = await cachedApiCall(cacheKey, loadDashboardHistoricalData);
            if (data) {
                await updateDashboardWithRangeData(data);
            }
        }

    } catch (error) {
        handleTimeFilterApiError(error, '控制台时间筛选');
    } finally {
        hideDashboardLoading();
    }
}

// 优化的操作记录时间筛选应用
async function applyLogsTimeFilter() {
    try {
        showLogsLoading();

        const cacheKey = generateCacheKey('logs', currentTimeFilter.startDate, currentTimeFilter.endDate);

        const data = await cachedApiCall(cacheKey, async () => {
            return await loadFilteredLogs();
        });

    } catch (error) {
        handleTimeFilterApiError(error, '操作记录时间筛选');
    } finally {
        hideLogsLoading();
    }
}

// 智能预加载
function preloadTimeRangeData() {
    // 预加载常用的时间范围数据
    const commonRanges = ['yesterday', 'thisWeek', 'lastWeek'];

    commonRanges.forEach(range => {
        setTimeout(() => {
            const dates = calculateDateRange(range);
            const cacheKey = generateCacheKey('dashboard', dates.startDate, dates.endDate);

            if (!getCachedData(cacheKey)) {
                // 静默预加载，不显示加载状态
                loadDashboardHistoricalDataSilent(dates.startDate, dates.endDate)
                    .then(data => setCachedData(cacheKey, data))
                    .catch(error => console.log('预加载失败:', error));
            }
        }, Math.random() * 3000); // 随机延迟避免同时请求
    });
}

// 静默加载历史数据
async function loadDashboardHistoricalDataSilent(startDate, endDate) {
    try {
        const params = new URLSearchParams({ startDate, endDate });
        const response = await fetch(`/api/analytics/range?${params}`);

        if (!response.ok) {
            throw new Error('获取历史数据失败');
        }

        return await response.json();
    } catch (error) {
        console.log('静默加载失败:', error);
        return null;
    }
}

// 键盘快捷键支持
function setupTimeFilterKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // 只在时间筛选模态框打开时响应快捷键
        const modal = document.getElementById('timeFilterModal');
        if (!modal || !modal.classList.contains('show')) {
            return;
        }

        // Ctrl/Cmd + 数字键选择快捷选项
        if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '7') {
            e.preventDefault();
            const shortcuts = ['today', 'yesterday', 'dayBeforeYesterday', 'thisWeek', 'lastWeek', 'thisMonth', 'lastMonth'];
            const index = parseInt(e.key) - 1;
            if (shortcuts[index]) {
                selectTimeShortcut(shortcuts[index]);
            }
        }

        // Enter键应用筛选
        if (e.key === 'Enter') {
            e.preventDefault();
            applyTimeFilter();
        }

        // Escape键关闭模态框
        if (e.key === 'Escape') {
            const modal = bootstrap.Modal.getInstance(document.getElementById('timeFilterModal'));
            if (modal) {
                modal.hide();
            }
        }
    });
}

// 自动保存用户偏好
function saveTimeFilterPreference() {
    const preference = {
        range: currentTimeFilter.range,
        startDate: currentTimeFilter.startDate,
        endDate: currentTimeFilter.endDate,
        displayText: currentTimeFilter.displayText
    };

    try {
        localStorage.setItem('timeFilterPreference', JSON.stringify(preference));
    } catch (error) {
        console.warn('保存时间筛选偏好失败:', error);
    }
}

// 加载用户偏好
function loadTimeFilterPreference() {
    try {
        const saved = localStorage.getItem('timeFilterPreference');
        if (saved) {
            const preference = JSON.parse(saved);

            // 验证偏好数据的有效性
            if (preference.range && preference.displayText) {
                currentTimeFilter = { ...currentTimeFilter, ...preference };
                updatePageTimeRangeDisplay();
                return true;
            }
        }
    } catch (error) {
        console.warn('加载时间筛选偏好失败:', error);
    }

    return false;
}

// 初始化时间筛选功能
function initializeTimeFilter() {
    // 加载用户偏好
    loadTimeFilterPreference();

    // 设置键盘快捷键
    setupTimeFilterKeyboardShortcuts();

    // 预加载常用数据
    setTimeout(preloadTimeRangeData, 2000);

    // 定期清理缓存
    setInterval(() => {
        const now = Date.now();
        for (const [key, value] of timeFilterCache.entries()) {
            if (now - value.timestamp > CACHE_EXPIRY) {
                timeFilterCache.delete(key);
            }
        }
    }, 60000); // 每分钟清理一次
}

// 增强的应用时间筛选函数
function applyTimeFilter() {
    // 验证日期范围
    if (!validateDateRange()) {
        return;
    }

    // 保存用户偏好
    saveTimeFilterPreference();

    // 更新对应页面的时间范围显示
    updatePageTimeRangeDisplay();

    // 根据页面类型应用筛选
    switch (currentFilterPage) {
        case 'dashboard':
            applyDashboardTimeFilter();
            break;
        case 'logs':
            applyLogsTimeFilter();
            break;
        case 'inquiries':
            applyInquiriesTimeFilter();
            break;
        default:
            console.warn('未知的筛选页面:', currentFilterPage);
    }

    // 关闭模态框
    const modal = bootstrap.Modal.getInstance(document.getElementById('timeFilterModal'));
    modal.hide();

    showToast(`已应用时间筛选：${currentTimeFilter.displayText}`, 'success');
}

// 在应用初始化时调用时间筛选初始化
document.addEventListener('DOMContentLoaded', function() {
    // 延迟初始化时间筛选功能，确保其他组件已加载
    setTimeout(initializeTimeFilter, 1000);
});

// ===== 询价批量操作功能 =====

/**
 * 初始化询价批量操作功能
 */
function initInquiryBatchOperations() {
    // 全选/取消全选
    const selectAllCheckbox = document.getElementById('inquiry-select-all');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', handleSelectAll);
    }

    // 清除选择按钮
    const clearSelectionBtn = document.getElementById('inquiry-clear-selection');
    if (clearSelectionBtn) {
        clearSelectionBtn.addEventListener('click', clearInquirySelection);
    }

    // 批量状态更新
    const statusDropdownItems = document.querySelectorAll('#inquiry-batch-status-dropdown + .dropdown-menu .dropdown-item');
    statusDropdownItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const status = e.currentTarget.getAttribute('data-status');
            if (status) {
                handleBatchStatusUpdate(status);
            }
        });
    });

    // 批量删除按钮
    const batchDeleteBtn = document.getElementById('inquiry-batch-delete');
    if (batchDeleteBtn) {
        batchDeleteBtn.addEventListener('click', handleBatchDelete);
    }
}

/**
 * 设置询价批量操作事件监听器（在每次渲染后调用）
 */
function setupInquiryBatchOperations() {
    // 为每个复选框添加事件监听器
    const checkboxes = document.querySelectorAll('.inquiry-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleInquiryCheckboxChange);
    });

    // 更新批量操作面板状态
    updateBatchOperationPanel();
}

/**
 * 处理全选/取消全选
 */
function handleSelectAll() {
    const selectAllCheckbox = document.getElementById('inquiry-select-all');
    const checkboxes = document.querySelectorAll('.inquiry-checkbox');

    isSelectingAll = selectAllCheckbox.checked;

    checkboxes.forEach(checkbox => {
        const row = checkbox.closest('tr');
        checkbox.checked = isSelectingAll;
        if (isSelectingAll) {
            selectedInquiryIds.add(checkbox.value);
            row.classList.add('selected');
        } else {
            selectedInquiryIds.delete(checkbox.value);
            row.classList.remove('selected');
        }
    });

    updateBatchOperationPanel();
}

/**
 * 处理单个询价复选框变化
 */
function handleInquiryCheckboxChange(event) {
    const checkbox = event.target;
    const inquiryId = checkbox.value;
    const row = checkbox.closest('tr');

    if (checkbox.checked) {
        selectedInquiryIds.add(inquiryId);
        row.classList.add('selected');
    } else {
        selectedInquiryIds.delete(inquiryId);
        row.classList.remove('selected');
        // 如果取消选择，同时取消全选状态
        const selectAllCheckbox = document.getElementById('inquiry-select-all');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
        }
        isSelectingAll = false;
    }

    // 检查是否所有可见的复选框都被选中
    const allCheckboxes = document.querySelectorAll('.inquiry-checkbox');
    const checkedCheckboxes = document.querySelectorAll('.inquiry-checkbox:checked');
    const selectAllCheckbox = document.getElementById('inquiry-select-all');

    if (selectAllCheckbox && allCheckboxes.length > 0) {
        selectAllCheckbox.checked = allCheckboxes.length === checkedCheckboxes.length;
        selectAllCheckbox.indeterminate = checkedCheckboxes.length > 0 && checkedCheckboxes.length < allCheckboxes.length;
    }

    updateBatchOperationPanel();
}

/**
 * 清除所有选择
 */
function clearInquirySelection() {
    selectedInquiryIds.clear();
    isSelectingAll = false;

    // 取消所有复选框的选中状态和行高亮
    const checkboxes = document.querySelectorAll('.inquiry-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        const row = checkbox.closest('tr');
        row.classList.remove('selected');
    });

    // 取消全选复选框的状态
    const selectAllCheckbox = document.getElementById('inquiry-select-all');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }

    updateBatchOperationPanel();
}

/**
 * 更新批量操作面板状态
 */
function updateBatchOperationPanel() {
    const panel = document.getElementById('inquiry-batch-panel');
    const countElement = document.getElementById('inquiry-selected-count');

    if (!panel || !countElement) return;

    const selectedCount = selectedInquiryIds.size;

    if (selectedCount > 0) {
        panel.style.display = 'block';
        countElement.textContent = selectedCount;
    } else {
        panel.style.display = 'none';
    }
}

/**
 * 处理批量状态更新
 */
async function handleBatchStatusUpdate(status) {
    if (selectedInquiryIds.size === 0) {
        showToast('请先选择要更新的询价记录', 'warning');
        return;
    }

    const statusText = getStatusText(status);
    const confirmMessage = `确定要将选中的 ${selectedInquiryIds.size} 条询价记录的状态更新为"${statusText}"吗？`;

    if (!confirm(confirmMessage)) {
        return;
    }

    try {
        showToast('正在批量更新状态...', 'info');

        const response = await fetch('/api/inquiries/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                action: 'updateStatus',
                inquiryIds: Array.from(selectedInquiryIds),
                data: {
                    status: status,
                    notes: `批量更新状态为${statusText}`
                }
            })
        });

        const result = await response.json();

        if (result.success) {
            showToast(`成功更新 ${result.data.successCount} 条记录的状态`, 'success');

            // 清除选择并重新加载列表
            clearInquirySelection();
            loadInquiries();
        } else {
            throw new Error(result.message || '批量更新失败');
        }
    } catch (error) {
        console.error('批量更新状态失败:', error);
        showToast('批量更新状态失败：' + error.message, 'danger');
    }
}

/**
 * 处理批量删除
 */
async function handleBatchDelete() {
    if (selectedInquiryIds.size === 0) {
        showToast('请先选择要删除的询价记录', 'warning');
        return;
    }

    const confirmMessage = `⚠️ 危险操作警告！\n\n确定要删除选中的 ${selectedInquiryIds.size} 条询价记录吗？\n\n此操作不可撤销，请谨慎操作！`;

    if (!confirm(confirmMessage)) {
        return;
    }

    // 二次确认
    const secondConfirm = prompt(`请输入 "DELETE" 来确认删除操作：`);
    if (secondConfirm !== 'DELETE') {
        showToast('删除操作已取消', 'info');
        return;
    }

    try {
        showToast('正在批量删除询价记录...', 'info');

        const response = await fetch('/api/inquiries/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                action: 'delete',
                inquiryIds: Array.from(selectedInquiryIds),
                data: {}
            })
        });

        const result = await response.json();

        if (result.success) {
            showToast(`成功删除 ${result.data.successCount} 条询价记录`, 'success');

            // 清除选择并重新加载列表
            clearInquirySelection();
            loadInquiries();
        } else {
            throw new Error(result.message || '批量删除失败');
        }
    } catch (error) {
        console.error('批量删除失败:', error);
        showToast('批量删除失败：' + error.message, 'danger');
    }
}