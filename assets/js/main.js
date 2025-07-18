// 🚀 现代化JavaScript - 轮播图和交互功能

// 轮播图配置和状态管理
const carouselConfig = {
  slides: [
    {
      category: "turbocharger",
      title: "涡轮增压器",
      desc: "各类涡轮增压器总成，适用于汽车、卡车、工程机械等",
      image: "assets/images/carousel/img1.jpg",
      placeholder:
        "https://via.placeholder.com/1200x500/007bff/ffffff?text=涡轮增压器",
    },
    {
      category: "actuator",
      title: "执行器",
      desc: "涡轮增压器执行器，控制涡轮增压器的工作状态",
      image: "assets/images/carousel/img2.jpg",
      placeholder:
        "https://via.placeholder.com/1200x500/28a745/ffffff?text=执行器",
    },
    {
      category: "injector",
      title: "共轨喷油器",
      desc: "共轨喷油器、喷油嘴、高压油泵等柴油喷射系统部件",
      image: "assets/images/carousel/img3.jpg",
      placeholder:
        "https://via.placeholder.com/1200x500/17a2b8/ffffff?text=共轨喷油器",
    },
    {
      category: "turbo-parts",
      title: "涡轮配件",
      desc: "涡轮增压器相关配件，包括密封圈、轴承、叶轮等精密部件",
      image: "assets/images/carousel/img4.jpg",
      placeholder:
        "https://via.placeholder.com/1200x500/ffc107/333333?text=涡轮配件",
    },
  ],
  autoPlayInterval: 5000,
  currentSlide: 0,
};

class CarouselManager {
  constructor(config) {
    this.config = config;
    this.slides = config.slides;
    this.currentSlide = config.currentSlide;
    this.totalSlides = config.slides.length;
    this.autoPlayInterval = null;

    // DOM元素
    this.container = document.querySelector(".carousel-container");
    this.indicatorsContainer = document.querySelector(".carousel-indicators");

    // 初始化
    this.init();
  }

  init() {
    // 清空现有内容
    this.container.innerHTML = "";
    this.indicatorsContainer.innerHTML = "";

    // 创建初始幻灯片
    this.createSlide(this.currentSlide);

    // 创建指示器
    this.createIndicators();

    // 添加控制按钮
    this.createControls();

    // 启动自动播放
    this.startAutoPlay();

    // 绑定事件
    this.bindEvents();
  }

  createSlide(index) {
    const slide = this.slides[index];
    const slideElement = document.createElement("div");
    slideElement.className = "carousel-slide active";
    slideElement.onclick = () => this.navigateToProducts(slide.category);

    slideElement.innerHTML = `
            <img src="${slide.image}" alt="${slide.title}" class="slide-image" 
                 onerror="this.src='${slide.placeholder}'">
            <div class="slide-overlay">
                <div class="slide-content">
                    <h2>${slide.title}</h2>
                    <p>${slide.desc}</p>
                    <a href="pages/products.html?category=${slide.category}" 
                       class="btn-primary" 
                       onclick="event.stopPropagation();">了解更多</a>
                </div>
            </div>
        `;

    // 移除现有幻灯片
    const currentSlide = this.container.querySelector(".carousel-slide");
    if (currentSlide) {
      currentSlide.classList.remove("active");
      setTimeout(() => currentSlide.remove(), 300); // 等待过渡动画完成
    }

    // 添加新幻灯片
    this.container.appendChild(slideElement);
    setTimeout(() => slideElement.classList.add("active"), 50);
  }

  createIndicators() {
    this.slides.forEach((_, index) => {
      const indicator = document.createElement("button");
      indicator.className = `indicator ${index === this.currentSlide ? "active" : ""}`;
      indicator.onclick = () => this.goToSlide(index);
      this.indicatorsContainer.appendChild(indicator);
    });
  }

  createControls() {
    const prevBtn = document.createElement("button");
    prevBtn.className = "carousel-btn carousel-btn-prev";
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.onclick = () => this.changeSlide(-1);

    const nextBtn = document.createElement("button");
    nextBtn.className = "carousel-btn carousel-btn-next";
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.onclick = () => this.changeSlide(1);

    this.container.appendChild(prevBtn);
    this.container.appendChild(nextBtn);
  }

  changeSlide(direction) {
    this.currentSlide =
      (this.currentSlide + direction + this.totalSlides) % this.totalSlides;
    this.updateCarousel();
  }

  goToSlide(index) {
    if (index === this.currentSlide) return;
    this.currentSlide = index;
    this.updateCarousel();
  }

  updateCarousel() {
    // 更新幻灯片
    this.createSlide(this.currentSlide);

    // 更新指示器
    const indicators = this.indicatorsContainer.querySelectorAll(".indicator");
    indicators.forEach((indicator, index) => {
      indicator.classList.toggle("active", index === this.currentSlide);
    });
  }

  startAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
    this.autoPlayInterval = setInterval(() => {
      this.changeSlide(1);
    }, this.config.autoPlayInterval);
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  navigateToProducts(category) {
    window.location.href = `pages/products.html?category=${category}`;
  }

  bindEvents() {
    // 鼠标悬停时暂停自动播放
    this.container.addEventListener("mouseenter", () => this.stopAutoPlay());
    this.container.addEventListener("mouseleave", () => this.startAutoPlay());

    // 触摸事件支持
    let touchStartX = 0;
    let touchEndX = 0;

    this.container.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.touches[0].clientX;
        this.stopAutoPlay();
      },
      { passive: true },
    );

    this.container.addEventListener(
      "touchmove",
      (e) => {
        touchEndX = e.touches[0].clientX;
      },
      { passive: true },
    );

    this.container.addEventListener("touchend", () => {
      const difference = touchStartX - touchEndX;
      if (Math.abs(difference) > 50) {
        // 最小滑动距离
        this.changeSlide(difference > 0 ? 1 : -1);
      }
      this.startAutoPlay();
    });
  }
}

// 🔧 使用统一页面加载管理器初始化轮播图（防重复执行）
if (window.PageLoadManager) {
  window.PageLoadManager.addToQueue(
    "carousel-manager-init",
    function () {
      const carousel = new CarouselManager(carouselConfig);

      // 将实例存储在window对象上，以便其他代码可以访问
      window.carouselManager = carousel;

      console.log("✅ 轮播图管理器初始化完成");
    },
    ["domReady"],
  );

  // 🔧 加载公司信息（使用页面加载管理器）
  window.PageLoadManager.addToQueue(
    "company-info-init",
    function () {
      loadCompanyInfo();
      console.log("✅ 公司信息加载完成");
    },
    ["domReady"],
  );

  // 🔧 初始化联系表单（使用页面加载管理器）
  window.PageLoadManager.addToQueue(
    "contact-forms-init",
    function () {
      initContactForms();
      console.log("✅ 联系表单初始化完成");
    },
    ["domReady"],
  );
} else {
  // 备用方案：如果页面加载管理器未就绪，延迟执行
  setTimeout(() => {
    if (window.PageLoadManager) {
      window.PageLoadManager.addToQueue(
        "carousel-manager-init",
        function () {
          const carousel = new CarouselManager(carouselConfig);
          window.carouselManager = carousel;
          console.log("✅ 轮播图管理器初始化完成");
        },
        ["domReady"],
      );

      window.PageLoadManager.addToQueue(
        "company-info-init",
        function () {
          loadCompanyInfo();
          console.log("✅ 公司信息加载完成");
        },
        ["domReady"],
      );

      window.PageLoadManager.addToQueue(
        "contact-forms-init",
        function () {
          initContactForms();
          console.log("✅ 联系表单初始化完成");
        },
        ["domReady"],
      );
    } else {
      // 最后备用方案
      document.addEventListener("DOMContentLoaded", () => {
        const carousel = new CarouselManager(carouselConfig);
        window.carouselManager = carousel;
        loadCompanyInfo();
        initContactForms();
        console.log("✅ 主要功能初始化完成（备用方案）");
      });
    }
  }, 100);
}

// 平滑滚动导航
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// 返回顶部按钮 - 延迟初始化
function initBackToTopButton() {
  const backToTopBtn = document.getElementById("backToTop");

  if (backToTopBtn) {
    window.addEventListener("scroll", () => {
      if (window.pageYOffset > 300) {
        backToTopBtn.classList.add("visible");
      } else {
        backToTopBtn.classList.remove("visible");
      }
    });

    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });

    console.log("✅ 主页返回顶部按钮已初始化");
  } else {
    console.warn("⚠️ 主页未找到返回顶部按钮，将在1秒后重试");
    setTimeout(initBackToTopButton, 1000);
  }
}

// 返回顶部按钮由组件管理器统一处理

// 导航链接高亮
const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll("section[id]");

window.addEventListener("scroll", () => {
  let current = "";
  sections.forEach((section) => {
    const sectionTop = section.offsetTop - 100;
    if (window.pageYOffset >= sectionTop) {
      current = section.getAttribute("id");
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove("active");
    if (link.getAttribute("href") === `#${current}`) {
      link.classList.add("active");
    }
  });
});

// 🚫 已移除重复的加载动画隐藏逻辑
// 现在由页面加载管理器统一处理加载屏幕的隐藏

// 🔧 使用统一页面加载管理器处理加载动画隐藏（优化版本）
if (window.PageLoadManager) {
  window.PageLoadManager.addToQueue(
    "loading-animation-hide",
    function () {
      // 延迟隐藏加载屏幕，确保用户看到完整的加载过程
      setTimeout(() => {
        if (
          window.componentManager &&
          typeof window.componentManager.hideLoadingScreen === "function"
        ) {
          window.componentManager.hideLoadingScreen();
        } else {
          // 备用隐藏方法
          const loading = document.getElementById("loading");
          if (loading && !loading.classList.contains("hidden")) {
            loading.classList.add("hidden");
            setTimeout(() => {
              loading.style.display = "none";
            }, 500);
          }
        }

        // 初始化轮播图点击事件
        if (typeof updateCarouselClickEvents === "function") {
          setTimeout(updateCarouselClickEvents, 100);
        }

        console.log("✅ 加载动画隐藏处理完成");
      }, 800); // 增加延迟时间，确保用户看到加载过程
    },
    ["domReady", "componentsLoaded"],
  ); // 等待组件加载完成
} else {
  // 备用方案：延迟执行
  setTimeout(() => {
    if (window.PageLoadManager) {
      // 重新尝试使用页面加载管理器
      window.PageLoadManager.addToQueue(
        "loading-animation-hide",
        function () {
          setTimeout(() => {
            if (
              window.componentManager &&
              typeof window.componentManager.hideLoadingScreen === "function"
            ) {
              window.componentManager.hideLoadingScreen();
            } else {
              const loading = document.getElementById("loading");
              if (loading && !loading.classList.contains("hidden")) {
                loading.classList.add("hidden");
                setTimeout(() => {
                  loading.style.display = "none";
                }, 500);
              }
            }

            if (typeof updateCarouselClickEvents === "function") {
              setTimeout(updateCarouselClickEvents, 100);
            }

            console.log("✅ 加载动画隐藏处理完成（延迟方案）");
          }, 800);
        },
        ["domReady", "componentsLoaded"],
      );
    } else {
      console.warn("⚠️ 页面加载管理器未找到，使用最后备用方案");
      // 最后备用方案
      document.addEventListener("DOMContentLoaded", () => {
        setTimeout(() => {
          const loading = document.getElementById("loading");
          if (loading && !loading.classList.contains("hidden")) {
            loading.classList.add("hidden");
            setTimeout(() => {
              loading.style.display = "none";
            }, 500);
          }

          if (typeof updateCarouselClickEvents === "function") {
            setTimeout(updateCarouselClickEvents, 100);
          }

          console.log("✅ 加载动画隐藏处理完成（最后备用方案）");
        }, 1000);
      });
    }
  }, 200);
}

// 监听分类数据加载完成事件（主页）
document.addEventListener("categoriesLoaded", function (event) {
  const { categories, isHomePage } = event.detail;

  if (isHomePage) {
    console.log("✅ 主页接收到分类数据:", categories.length, "个分类");

    // 触发产品展示更新
    if (typeof loadProductShowcase === "function") {
      setTimeout(loadProductShowcase, 500); // 延迟500ms让组件完全加载
    }
  }
});

// 🚫 已移除重复的DOMContentLoaded监听器
// 现在使用统一的页面加载管理器处理产品展示初始化

// 产品卡片动画
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.animation = "fadeInUp 0.6s ease forwards";
    }
  });
}, observerOptions);

document.querySelectorAll(".product-card").forEach((card) => {
  observer.observe(card);
});

// 添加淡入动画CSS
const style = document.createElement("style");
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// 🔍 搜索功能
let productsData = null;

// 加载产品数据
async function loadProductsData() {
  try {
    // 🌐 使用公开API接口获取所有产品数据（不分页）
    const response = await fetch("/api/public/products?limit=1000"); // 使用公开接口
    if (!response.ok) {
      throw new Error("加载产品数据失败");
    }
    const data = await response.json();

    // 从分页响应中提取产品数组
    let products = data.data || data.products || data || [];
    console.log("✅ 主页产品数据加载成功:", products.length, "个产品");

    // 🎯 使用统一的产品排序工具类
    products = ProductSortUtils.getSearchProducts(products);

    // 存储产品数据供搜索使用
    productsData = {
      categories: [],
      products: products,
    };

    console.log("📦 产品数据已存储，供搜索功能使用");
  } catch (error) {
    console.error("加载产品数据失败:", error);
    showNotification("加载产品数据失败，请稍后重试", "error");
  }
}

// 搜索功能
function performSearch() {
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");
  const query = searchInput.value.trim().toLowerCase();

  if (query.length === 0) {
    if (searchResults) {
      searchResults.style.display = "none";
    }
    return;
  }

  // 检查当前页面是否有产品数据
  const isHomePage =
    window.location.pathname === "/" ||
    window.location.pathname.includes("index.html") ||
    document.getElementById("products-showcase");

  // 如果不是主页，直接跳转到产品页面搜索
  if (!isHomePage) {
    console.log("🔍 非主页搜索，直接跳转到产品页面");

    // 手动构建跳转URL
    const currentPath = window.location.pathname;
    let targetUrl;

    if (currentPath.includes("/pages/")) {
      targetUrl = `products.html?search=${encodeURIComponent(query)}`;
    } else {
      targetUrl = `pages/products.html?search=${encodeURIComponent(query)}`;
    }

    console.log("🎯 main.js搜索跳转目标:", targetUrl);
    window.location.href = targetUrl;
    return;
  }

  // 主页的实时搜索功能
  const products =
    productsData?.data || productsData?.products || productsData || [];

  if (!productsData || products.length === 0) {
    if (searchResults) {
      searchResults.innerHTML =
        '<div class="search-result-item">数据加载中...</div>';
      searchResults.style.display = "block";
    }
    return;
  }

  const results = [];

  // 搜索产品 - 扩展搜索范围包含OE号码、适配信息和其他事项
  products.forEach((product) => {
    const nameMatch =
      product.name && product.name.toLowerCase().includes(query);
    const brandMatch =
      product.brand && product.brand.toLowerCase().includes(query);
    const modelMatch =
      product.model && product.model.toLowerCase().includes(query);
    const descMatch =
      product.description && product.description.toLowerCase().includes(query);
    const skuMatch = product.sku && product.sku.toLowerCase().includes(query);
    const oeMatch =
      product.oe_number && product.oe_number.toLowerCase().includes(query);
    const compatibilityMatch =
      product.compatibility &&
      product.compatibility.toLowerCase().includes(query);
    const notesMatch =
      product.notes && product.notes.toLowerCase().includes(query);
    const featuresMatch =
      product.features && product.features.toLowerCase().includes(query);

    if (
      nameMatch ||
      brandMatch ||
      modelMatch ||
      descMatch ||
      skuMatch ||
      oeMatch ||
      compatibilityMatch ||
      notesMatch ||
      featuresMatch
    ) {
      // 使用翻译系统获取分类名称
      const getCategoryDisplayName = (category) => {
        const categoryKey = `categories.${category}`;
        const translatedName = getTranslation(categoryKey);

        // 如果翻译成功且不等于原键，返回翻译结果
        if (translatedName && translatedName !== categoryKey) {
          return translatedName;
        }

        // 回退到硬编码映射（兼容性保证）
        const categoryMap = {
          turbocharger: "涡轮增压器",
          actuator: "执行器",
          injector: "共轨喷油器",
          "turbo-parts": "涡轮配件",
          others: "其他",
        };
        return (
          categoryMap[category] || getTranslation("categories.others") || "产品"
        );
      };

      results.push({
        type: "product",
        name: product.name,
        description: product.description || product.brand || "",
        category: getCategoryDisplayName(product.category),
        productId: product.id,
      });
    }
  });

  displaySearchResults(results);
}

// 显示搜索结果
function displaySearchResults(results) {
  const searchResults = document.getElementById("searchResults");

  if (results.length === 0) {
    searchResults.innerHTML =
      '<div class="search-result-item">未找到相关产品</div>';
  } else {
    searchResults.innerHTML = results
      .map(
        (result) => `
            <div class="search-result-item" onclick="selectSearchResult('${result.type}', '${result.name}', '${result.productId || ""}')">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-cube" style="color: #007bff; width: 20px;"></i>
                    <div>
                        <strong>${result.name}</strong>
                        ${result.category ? `<br><small style="color: #666;">${result.category}</small>` : ""}
                        <br><small style="color: #999;">${result.description}</small>
                    </div>
                </div>
            </div>
        `,
      )
      .join("");
  }

  searchResults.style.display = "block";
}

// 选择搜索结果
function selectSearchResult(type, name, productId = "") {
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");

  searchInput.value = name;
  searchResults.style.display = "none";

  if (type === "product" && productId) {
    // 如果是产品，跳转到产品详情页
    window.location.href = `pages/product-detail.html?id=${productId}`;
  } else {
    // 否则跳转到产品区域
    const productsSection = document.getElementById("products");
    if (productsSection) {
      productsSection.scrollIntoView({
        behavior: "smooth",
      });
    }
  }
}

// 🔧 使用统一页面加载管理器处理搜索功能初始化（防重复执行）
if (window.PageLoadManager) {
  window.PageLoadManager.addToQueue(
    "search-functionality-init",
    function () {
      initSearchFunctionality();
      console.log("✅ 搜索功能初始化完成");
    },
    ["domReady", "componentsLoaded"],
  );
} else {
  // 备用方案：如果页面加载管理器未就绪，延迟执行
  setTimeout(() => {
    if (window.PageLoadManager) {
      window.PageLoadManager.addToQueue(
        "search-functionality-init",
        function () {
          initSearchFunctionality();
          console.log("✅ 搜索功能初始化完成");
        },
        ["domReady", "componentsLoaded"],
      );
    } else {
      // 最后备用方案
      document.addEventListener("DOMContentLoaded", () => {
        setTimeout(initSearchFunctionality, 1000); // 延迟1秒确保组件已加载
        console.log("✅ 搜索功能初始化完成（备用方案）");
      });
    }
  }, 100);
}

// 🔧 搜索功能初始化函数（统一管理，防重复绑定）
function initSearchFunctionality() {
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");

  // 检查是否为主页
  const isHomePage =
    window.location.pathname === "/" ||
    window.location.pathname.includes("index.html") ||
    document.getElementById("products-showcase");

  if (searchInput) {
    // 检查是否已经绑定过事件，避免重复绑定
    if (searchInput.hasAttribute("data-main-search-bound")) {
      console.log("⚠️ main.js - 搜索功能已绑定，跳过重复绑定");
      return;
    }

    if (isHomePage) {
      // 主页：启用实时搜索
      console.log("🏠 主页搜索功能已启用（实时搜索）");
      searchInput.addEventListener("input", debounce(performSearch, 300));

      // 点击外部关闭搜索结果
      if (searchResults) {
        document.addEventListener("click", (e) => {
          if (
            !searchInput.contains(e.target) &&
            !searchResults.contains(e.target)
          ) {
            searchResults.style.display = "none";
          }
        });
      }
    } else {
      // 非主页：只启用回车搜索（跳转式）
      console.log("📄 非主页搜索功能已启用（跳转式搜索）");
    }

    // 回车键搜索（所有页面都支持）
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        console.log("🔍 main.js - 回车键搜索触发");
        performSearch();
      }
    });

    // 标记已绑定，防止重复绑定
    searchInput.setAttribute("data-main-search-bound", "true");
    console.log("✅ main.js - 搜索事件绑定成功");

    // 智能加载产品数据
    const isProductPage = window.location.pathname.includes("products.html");

    // 只在主页加载产品数据（产品页面有自己的加载逻辑）
    if (isHomePage) {
      console.log("🏠 检测到主页，加载产品数据用于搜索功能");
      loadProductsData();
    } else if (isProductPage) {
      console.log(
        "📦 检测到产品页面，跳过main.js的产品数据加载（产品页面有独立的加载逻辑）",
      );
    } else {
      console.log("📄 当前页面不需要产品数据，跳过加载");
    }
  } else {
    // 搜索输入框不存在，可能组件管理器还没有渲染完成，延迟重试
    console.log("⏳ 搜索输入框尚未创建，2秒后重试初始化...");
    setTimeout(() => {
      const retrySearchInput = document.getElementById("searchInput");
      if (
        retrySearchInput &&
        !retrySearchInput.hasAttribute("data-main-search-bound")
      ) {
        console.log("🔄 重试搜索功能初始化...");
        initSearchFunctionality(); // 递归调用自身
      }
    }, 2000);
  }
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

// 🏷️ 产品过滤功能
function filterProducts(category) {
  // 更新标签按钮状态
  document.querySelectorAll(".tag-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document
    .querySelector(`[data-category="${category}"]`)
    .classList.add("active");

  // 产品过滤逻辑（这里可以根据实际需求扩展）
  const productCards = document.querySelectorAll(".product-card");

  productCards.forEach((card) => {
    if (category === "all") {
      card.style.display = "block";
      card.style.animation = "fadeInUp 0.6s ease forwards";
    } else {
      // 根据产品卡片的数据属性或类名进行过滤
      const cardCategory =
        card.getAttribute("data-category") ||
        card.querySelector("h3").textContent.toLowerCase();

      if (
        cardCategory.includes(category) ||
        (category === "turbocharger" && cardCategory.includes("涡轮")) ||
        (category === "actuator" && cardCategory.includes("执行")) ||
        (category === "diesel-injection" && cardCategory.includes("柴油")) ||
        (category === "turbo-parts" && cardCategory.includes("配件"))
      ) {
        card.style.display = "block";
        card.style.animation = "fadeInUp 0.6s ease forwards";
      } else {
        card.style.display = "none";
      }
    }
  });

  // 平滑滚动到产品区域
  document.getElementById("products").scrollIntoView({
    behavior: "smooth",
  });
}

// 📱 移动端菜单功能
function toggleMobileMenu() {
  const navMenu = document.querySelector(".nav-menu");
  const mobileBtn = document.querySelector(".mobile-menu-btn");

  navMenu.classList.toggle("active");

  // 动画效果
  const spans = mobileBtn.querySelectorAll("span");
  if (navMenu.classList.contains("active")) {
    spans[0].style.transform = "rotate(45deg) translate(5px, 5px)";
    spans[1].style.opacity = "0";
    spans[2].style.transform = "rotate(-45deg) translate(7px, -6px)";
  } else {
    spans[0].style.transform = "none";
    spans[1].style.opacity = "1";
    spans[2].style.transform = "none";
  }
}

// 点击导航链接时关闭移动端菜单
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    const navMenu = document.querySelector(".nav-menu");
    const mobileBtn = document.querySelector(".mobile-menu-btn");

    if (navMenu.classList.contains("active")) {
      toggleMobileMenu();
    }
  });
});

// 🔽 下拉菜单功能增强
document.querySelectorAll(".dropdown-item").forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const category = item.getAttribute("data-category");
    if (category) {
      filterProducts(category);
    }
  });
});

/**
 * 🏠 主页产品展示加载函数
 * 从API加载产品数据并显示在主页的产品展示区域
 */
async function loadProductShowcase() {
  console.log("🚀 开始从API加载主页产品展示数据...");

  try {
    // 🌐 使用公开API接口获取产品数据
    const response = await fetch("/api/public/products?limit=1000");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const products = data.data || data.products || data || [];
    console.log(`✅ API产品数据加载成功: ${products.length}个产品`);

    if (!Array.isArray(products) || products.length === 0) {
      throw new Error("没有可用的产品数据");
    }

    // 🎯 安全检查ProductSortUtils是否已加载
    if (typeof window.ProductSortUtils === "undefined") {
      console.warn("⚠️ ProductSortUtils未加载，使用简单排序");
      // 使用简单的排序逻辑作为后备
      const activeProducts = products.filter((p) => p.status === "active");
      const sortedProducts = activeProducts.slice(0, 9);

      // 使用统一的产品卡组件渲染
      if (window.productCardComponent) {
        window.productCardComponent.renderToShowcase(sortedProducts, {
          showDescription: false,
          imagePath: "",
        });
      } else {
        // 兜底显示
        const showcase = document.getElementById("products-showcase");
        if (showcase) {
          showcase.innerHTML = `
                        <div class="loading-text" style="color: #28a745;">
                            <i class="fas fa-check-circle"></i> 
                            产品展示功能正在初始化，请稍候...
                        </div>
                    `;
          // 延迟重试
          setTimeout(() => loadProductShowcase(), 500);
        }
      }
      return;
    }

    // 🎯 使用统一的产品排序工具类获取主页展示产品
    const sortedProducts = window.ProductSortUtils.getHomePageProducts(
      products,
      9,
    );

    // 调试排序结果
    window.ProductSortUtils.debugSortResult(sortedProducts);

    // 使用统一的产品卡组件渲染
    if (window.productCardComponent) {
      window.productCardComponent.renderToShowcase(sortedProducts, {
        showDescription: false,
        imagePath: "",
      });
    } else {
      // 兼容性处理 - 如果组件还未初始化
      setTimeout(() => loadProductShowcase(), 100);
    }
  } catch (error) {
    console.error("❌ 加载产品数据失败:", error);
    const showcase = document.getElementById("products-showcase");
    if (showcase) {
      showcase.innerHTML = `
                <div class="loading-text" style="color: #dc3545;">
                    <i class="fas fa-exclamation-triangle"></i> 
                    产品加载失败: ${error.message}
                    <br><small>请检查网络连接并刷新页面重试</small>
                </div>
            `;
    }
  }
}

// 注意：产品卡片渲染功能已迁移到 product-card-component.js 统一管理

// 记录产品点击统计
async function recordProductClick(productId) {
  try {
    await fetch("/api/analytics/product-click", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId }),
    });
  } catch (error) {
    console.log("统计记录失败，但不影响用户体验");
  }
}

// 查看产品详情功能
function viewProductDetails(productId) {
  // 记录产品点击
  recordProductClick(productId);

  const productInfo = {
    GT1749V: {
      name: "GT1749V 涡轮增压器总成",
      brand: "Garrett",
      model: "GT1749V-724930",
      description: "适用于大众、奥迪1.9L TDI发动机，原厂品质，性能稳定",
      features: ["原厂品质", "性能稳定", "质保1年"],
      applications: ["大众 1.9L TDI", "奥迪 1.9L TDI", "斯柯达 1.9L TDI"],
      specifications: {
        压比: "1.9:1",
        最大功率: "110KW",
        工作温度: "-40°C ~ +900°C",
        材质: "铸铁+钢材",
      },
    },
    GT2256V: {
      name: "GT2256V 涡轮增压器",
      brand: "Garrett",
      model: "GT2256V-704361",
      description: "适用于宝马X5 3.0L柴油发动机，高性能涡轮增压器",
      features: ["高性能", "耐用性强", "OEM标准"],
      applications: ["宝马 X5 3.0L", "宝马 X3 3.0L", "宝马 530d"],
      specifications: {
        压比: "2.3:1",
        最大功率: "160KW",
        工作温度: "-40°C ~ +950°C",
        材质: "铸铁+钛合金",
      },
    },
    actuator: {
      name: "涡轮增压器电子执行器",
      brand: "Garrett",
      model: "ACT-GT1749V-E",
      description: "电子执行器，控制涡轮增压器的工作状态",
      features: ["电子控制", "精准调节", "快速响应"],
      applications: ["GT1749V", "GT2256V", "GT2260V"],
      specifications: {
        电压: "12V DC",
        工作电流: "0.5-2.0A",
        响应时间: "<50ms",
        工作温度: "-40°C ~ +125°C",
      },
    },
    injector: {
      name: "共轨喷油器总成",
      brand: "Bosch",
      model: "0445120123",
      description: "博世共轨喷油器，适用于多种柴油发动机",
      features: ["精密喷射", "燃油效率高", "环保标准"],
      applications: ["奔驰", "宝马", "奥迪", "大众"],
      specifications: {
        喷射压力: "1800-2000 bar",
        流量: "1200 cm³/30s",
        喷孔数量: "8个",
        工作温度: "-40°C ~ +150°C",
      },
    },
    wheel: {
      name: "涡轮叶轮总成",
      brand: "Diamond-Auto",
      model: "WHEEL-GT1749V",
      description: "GT1749V专用涡轮叶轮总成，精密加工，动平衡校准",
      features: ["精密加工", "动平衡", "钛合金材质"],
      applications: ["GT1749V重建", "性能升级", "维修更换"],
      specifications: {
        材质: "钛合金",
        叶片数: "11片",
        动平衡精度: "0.5g",
        表面处理: "阳极氧化",
      },
    },
    "seal-kit": {
      name: "密封圈套装",
      brand: "Diamond-Auto",
      model: "SEAL-KIT-001",
      description: "高品质密封圈套装，适用于各类涡轮增压器维修",
      features: ["耐高温", "耐油性", "全套配件"],
      applications: ["涡轮维修", "预防性维护", "密封更换"],
      specifications: {
        耐温范围: "-40°C ~ +250°C",
        材质: "FKM橡胶",
        硬度: "70-80 Shore A",
        套装数量: "12件",
      },
    },
  };

  const product = productInfo[productId];
  if (!product) {
    alert("产品信息未找到");
    return;
  }

  // 创建模态框显示产品详情
  showProductModal(product);
}

// 显示产品详情模态框
function showProductModal(product) {
  // 创建模态框HTML
  const modalHTML = `
        <div class="product-modal-overlay" onclick="closeProductModal()">
            <div class="product-modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>${product.name}</h2>
                    <button class="modal-close" onclick="closeProductModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-content">
                    <div class="product-basic-info">
                        <div class="info-row">
                            <span class="label">品牌:</span>
                            <span class="value">${product.brand}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">型号:</span>
                            <span class="value">${product.model}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">描述:</span>
                            <span class="value">${product.description}</span>
                        </div>
                    </div>
                    
                    <div class="product-features-section">
                        <h3>产品特点</h3>
                        <div class="features-list">
                            ${product.features.map((feature) => `<span class="feature-tag">${feature}</span>`).join("")}
                        </div>
                    </div>
                    
                    <div class="product-applications-section">
                        <h3>适用范围</h3>
                        <ul class="applications-list">
                            ${product.applications.map((app) => `<li>${app}</li>`).join("")}
                        </ul>
                    </div>
                    
                    <div class="product-specifications-section">
                        <h3>技术规格</h3>
                        <div class="specifications-grid">
                            ${Object.entries(product.specifications)
                              .map(
                                ([key, value]) => `
                                <div class="spec-item">
                                    <span class="spec-label">${key}:</span>
                                    <span class="spec-value">${value}</span>
                                </div>
                            `,
                              )
                              .join("")}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-modal-inquire" onclick="inquireProductFromModal('${product.name}')">
                        <i class="fab fa-whatsapp"></i> 立即询价
                    </button>
                    <button class="btn-modal-close" onclick="closeProductModal()">关闭</button>
                </div>
            </div>
        </div>
    `;

  // 添加到页面
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // 防止页面滚动
  document.body.style.overflow = "hidden";
}

// 关闭产品详情模态框
function closeProductModal() {
  const modal = document.querySelector(".product-modal-overlay");
  if (modal) {
    modal.remove();
    document.body.style.overflow = "auto";
  }
}

// 从模态框发起询价
function inquireProductFromModal(productName) {
  closeProductModal();
  inquireProduct(productName);
}

function inquireProduct(productName) {
  // 从公司信息中获取WhatsApp号码
  const whatsappNumber =
    window.companyInfo?.contact?.whatsapp?.replace(/\D/g, "") ||
    "8613656157230";
  // WhatsApp询价功能
  const message = `您好，我对以下产品感兴趣：${productName}，请提供详细信息和报价。谢谢！`;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, "_blank");
}

// 更新产品过滤功能以支持新的产品展示
function filterProducts(category) {
  // 更新标签按钮状态
  document.querySelectorAll(".tag-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  const activeBtn = document.querySelector(`[data-category="${category}"]`);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }

  // 过滤新的产品展示卡片
  const productCards = document.querySelectorAll(".product-showcase-card");

  productCards.forEach((card) => {
    if (category === "all") {
      card.style.display = "block";
      card.style.animation = "fadeInUp 0.6s ease forwards";
    } else {
      const cardCategory = card.getAttribute("data-category");

      if (cardCategory === category) {
        card.style.display = "block";
        card.style.animation = "fadeInUp 0.6s ease forwards";
      } else {
        card.style.display = "none";
      }
    }
  });

  // 平滑滚动到产品区域
  document.getElementById("products").scrollIntoView({
    behavior: "smooth",
  });
}

// 立即调用产品展示函数
setTimeout(loadProductShowcase, 1000);

console.log("🎉 无锡皇德国际贸易有限公司网站加载完成！");
console.log("✅ 轮播图功能正常");
console.log("✅ 响应式设计已启用");
console.log("✅ 交互动画已激活");
console.log("🔍 搜索功能已启用");
console.log("🏷️ 产品过滤功能已启用");
console.log("📱 移动端菜单功能已启用");
console.log("🏪 产品展示功能已启用");

// 🔧 联系表单功能已在主初始化队列中处理，移除重复的DOMContentLoaded监听器
// 联系表单初始化现在由统一页面加载管理器在 'contact-forms-init' 队列项中处理

// 初始化联系表单功能
function initContactForms() {
  console.log("🔧 初始化联系表单功能...");

  // 获取所有表单
  const inquiryForms = document.querySelectorAll(".inquiry-form");

  if (inquiryForms.length === 0) {
    console.log("⚠️ 未找到询价表单");
    return;
  }

  console.log(`📝 找到 ${inquiryForms.length} 个询价表单，开始初始化...`);

  inquiryForms.forEach((form, index) => {
    console.log(`🔧 初始化表单 ${index + 1}:`, form.id || form.className);

    // 防止重复绑定事件
    if (form.dataset.initialized === "true") {
      console.log("⚠️ 表单已经初始化过，跳过");
      return;
    }

    // 添加表单提交事件监听
    form.addEventListener("submit", handleFormSubmit);

    // 添加实时验证
    const inputs = form.querySelectorAll("input[required], textarea[required]");
    inputs.forEach((input) => {
      input.addEventListener("blur", validateInput);
      input.addEventListener("input", clearValidationError);
    });

    // 标记表单已初始化
    form.dataset.initialized = "true";
    console.log(`✅ 表单 ${index + 1} 初始化完成`);
  });

  console.log("✅ 所有联系表单初始化完成");
}

// 处理表单提交
function handleFormSubmit(event) {
  event.preventDefault();
  console.log("📝 表单提交事件触发");

  const form = event.target;
  const submitBtn = form.querySelector(".btn-submit");

  if (!submitBtn) {
    console.error("❌ 未找到提交按钮");
    return;
  }

  const originalText = submitBtn.innerHTML;

  // 验证表单
  if (!validateForm(form)) {
    showNotification("请填写所有必填字段！", "error");
    return;
  }

  // 显示提交状态
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';
  submitBtn.disabled = true;

  // 获取表单数据
  const formData = {
    name: document.getElementById("inquiryName").value,
    email: document.getElementById("inquiryEmail").value,
    phone: document.getElementById("inquiryPhone").value,
    company: document.getElementById("inquiryCompany").value,
    message: document.getElementById("inquiryMessage").value,
    source: "contact_form", // 联系表单来源
    sourceDetails: {
      page: window.location.pathname,
      referrer: document.referrer || "direct",
      timestamp: new Date().toISOString(),
    },
  };

  console.log("📤 准备提交表单数据:", formData);

  // 提交到后台API
  fetch("/api/inquiries", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  })
    .then((response) => {
      console.log("📡 收到服务器响应:", response.status);
      return response.json();
    })
    .then((data) => {
      console.log("📨 服务器响应数据:", data);

      if (data.success) {
        showNotification(
          "📧 询价信息发送成功！我们将在24小时内回复您。",
          "success",
        );
        form.reset();
      } else {
        throw new Error(data.message || "表单提交失败");
      }
    })
    .catch((error) => {
      console.error("❌ 表单提交错误:", error);
      showNotification("❌ 发送失败，请稍后重试或直接联系我们。", "error");
      // 提供备用联系方式
      setTimeout(() => {
        showAlternativeContact();
      }, 2000);
    })
    .finally(() => {
      // 恢复按钮状态
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      console.log("🔄 表单按钮状态已恢复");
    });
}

// 验证单个输入字段
function validateInput(event) {
  const input = event.target;
  const value = input.value.trim();

  // 清除之前的错误样式
  clearValidationError(event);

  let isValid = true;
  let errorMessage = "";

  // 检查必填字段
  if (input.hasAttribute("required") && !value) {
    isValid = false;
    errorMessage = "此字段为必填项";
  }

  // 邮箱格式验证
  if (input.type === "email" && value && !isValidEmail(value)) {
    isValid = false;
    errorMessage = "请输入有效的邮箱地址";
  }

  // 电话格式验证
  if (input.type === "tel" && value && !isValidPhone(value)) {
    isValid = false;
    errorMessage = "请输入有效的电话号码";
  }

  // textarea最小长度验证
  if (input.tagName.toLowerCase() === "textarea" && value) {
    const minLength = input.getAttribute("minlength");
    if (minLength && value.length < parseInt(minLength)) {
      isValid = false;
      errorMessage = `需求描述至少${minLength}个字符`;
    }
  }

  if (!isValid) {
    showInputError(input, errorMessage);
  }

  return isValid;
}

// 验证整个表单
function validateForm(form) {
  const requiredFields = form.querySelectorAll(
    "input[required], textarea[required]",
  );
  let isValid = true;

  requiredFields.forEach((field) => {
    if (!validateInput({ target: field })) {
      isValid = false;
    }
  });

  return isValid;
}

// 显示输入错误
function showInputError(input, message) {
  input.style.borderColor = "#dc3545";
  input.style.boxShadow = "0 0 0 0.2rem rgba(220, 53, 69, 0.25)";

  // 移除之前的错误信息
  const existingError = input.parentNode.querySelector(".error-message");
  if (existingError) {
    existingError.remove();
  }

  // 添加错误信息
  const errorElement = document.createElement("div");
  errorElement.className = "error-message";
  errorElement.style.cssText =
    "color: #dc3545; font-size: 12px; margin-top: 5px;";
  errorElement.textContent = message;
  input.parentNode.appendChild(errorElement);
}

// 清除验证错误
function clearValidationError(event) {
  const input = event.target;
  input.style.borderColor = "";
  input.style.boxShadow = "";

  const errorMessage = input.parentNode.querySelector(".error-message");
  if (errorMessage) {
    errorMessage.remove();
  }
}

// 邮箱格式验证
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 电话格式验证
function isValidPhone(phone) {
  const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
  return phoneRegex.test(phone);
}

// 发送WhatsApp询价
function sendWhatsAppInquiry(formData) {
  const { name, email, phone, company, message } = formData;
  const whatsappNumber =
    window.companyInfo?.contact?.whatsapp?.replace(/\D/g, "") ||
    "8613656157230";

  let whatsappMessage = `🏢 无锡皇德国际贸易有限公司 - 网站询价\n\n`;
  whatsappMessage += `👤 姓名: ${name}\n`;
  whatsappMessage += `📧 邮箱: ${email}\n`;
  if (phone) whatsappMessage += `📱 电话: ${phone}\n`;
  if (company) whatsappMessage += `🏢 公司: ${company}\n`;
  whatsappMessage += `💬 需求: ${message}\n\n`;
  whatsappMessage += `📅 时间: ${new Date().toLocaleString("zh-CN")}\n`;
  whatsappMessage += `🌐 来源: 官方网站首页`;

  setTimeout(() => {
    if (confirm("是否同时通过WhatsApp发送询价信息？这样能更快得到回复。")) {
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
      window.open(whatsappUrl, "_blank");
    }
  }, 1500);
}

// 显示通知消息
function showNotification(message, type = "info") {
  // 移除现有通知
  const existingNotification = document.querySelector(".notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  // 创建通知元素
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

  // 添加CSS动画样式（如果不存在）
  if (!document.querySelector("#notification-animations")) {
    const style = document.createElement("style");
    style.id = "notification-animations";
    style.textContent = `
            @keyframes slideInRight {
                from { opacity: 0; transform: translateX(100%); }
                to { opacity: 1; transform: translateX(0); }
            }
            @keyframes slideOutRight {
                from { opacity: 1; transform: translateX(0); }
                to { opacity: 0; transform: translateX(100%); }
            }
        `;
    document.head.appendChild(style);
  }

  // 添加样式
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease;
        font-family: 'Microsoft YaHei', sans-serif;
    `;

  // 根据类型设置颜色
  if (type === "success") {
    notification.style.background = "linear-gradient(135deg, #28a745, #20c997)";
    notification.style.color = "white";
  } else if (type === "error") {
    notification.style.background = "linear-gradient(135deg, #dc3545, #fd7e14)";
    notification.style.color = "white";
  } else {
    notification.style.background = "linear-gradient(135deg, #007bff, #6f42c1)";
    notification.style.color = "white";
  }

  document.body.appendChild(notification);

  // 5秒后自动关闭
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

// 显示备用联系方式
function showAlternativeContact() {
  const whatsappNumber =
    window.companyInfo?.contact?.whatsapp?.replace(/\D/g, "") ||
    "8613656157230";
  const phone =
    window.companyInfo?.contact?.phone?.replace(/\D/g, "") || "8613656157230";
  const email =
    window.companyInfo?.contact?.email || "sales03@diamond-auto.com";

  const alternatives = `
        <div style="text-align: center; padding: 20px;">
            <h4>📞 其他联系方式</h4>
            <div style="margin: 15px 0;">
                <a href="tel:+86${phone}" style="display: inline-block; margin: 5px 10px; padding: 10px 15px; background: #28a745; color: white; text-decoration: none; border-radius: 5px;">
                    <i class="fas fa-phone"></i> 直接通话
                </a>
                <a href="https://wa.me/${whatsappNumber}" target="_blank" style="display: inline-block; margin: 5px 10px; padding: 10px 15px; background: #25d366; color: white; text-decoration: none; border-radius: 5px;">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </a>
            </div>
            <div style="margin: 15px 0;">
                <a href="mailto:${email}" style="display: inline-block; margin: 5px 10px; padding: 10px 15px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                    <i class="fas fa-envelope"></i> 发送邮件
                </a>
            </div>
        </div>
    `;

  showNotification(alternatives, "info");
}

// 添加滑入滑出动画CSS
const notificationStyle = document.createElement("style");
notificationStyle.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        font-size: 14px;
        padding: 5px;
        border-radius: 3px;
        transition: background-color 0.2s;
    }
    
    .notification-close:hover {
        background-color: rgba(255,255,255,0.2);
    }
`;
document.head.appendChild(notificationStyle);

console.log("📝 联系表单增强功能已加载！");

// 🚫 移除重复的表单处理代码 - 已在上面的initContactForms中统一处理
// 表单验证和反馈功能现在由统一的handleFormSubmit函数处理

// 🆕 使用统一公司信息服务的加载函数
async function loadCompanyInfo() {
  console.log("🔧 开始加载公司信息并更新首页联系信息...");

  try {
    // 等待company-service完全初始化
    if (!window.companyService) {
      console.warn("⚠️ companyService未找到，等待初始化...");
      // 等待一下再重试
      setTimeout(loadCompanyInfo, 100);
      return;
    }

    // 使用新的统一服务
    console.log("📞 正在加载联系信息...");
    await window.companyService.loadCompanyInfo();

    // 获取加载的数据用于调试
    const companyData = window.companyService.getCompanyInfo();
    const contactData = window.companyService.getContactInfo();

    console.log("🏢 获取到公司数据:", companyData);
    console.log("📞 获取到联系信息:", contactData);

    // 使用服务的方法更新页面元素
    window.companyService.updatePageElements();

    console.log("✅ 公司信息已通过统一服务加载并更新页面");

    // 额外验证更新是否成功
    const addressElement = document.getElementById("company-address");
    const phoneElement = document.getElementById("company-phone");
    if (addressElement && phoneElement) {
      console.log("✅ 验证联系信息更新:");
      console.log("地址:", addressElement.textContent);
      console.log("电话:", phoneElement.textContent);
    }
  } catch (error) {
    console.error("❌ 加载公司信息失败:", error);

    // 即使出错，统一服务也会使用默认值
    if (window.companyService) {
      console.log("🔄 使用默认信息更新页面...");
      window.companyService.updatePageElements();
    } else {
      console.error("❌ companyService服务不可用，无法更新联系信息");
    }
  }
}

// 初始化所有功能
function initializeAllFeatures() {
  console.log("🚀 初始化所有功能...");

  // 初始化轮播图（如果函数存在）
  if (typeof window.initializeCarousel === "function") {
    window.initializeCarousel();
  }

  // 🆕 加载公司信息并更新联系信息
  loadCompanyInfo();

  // 🚫 移除重复的表单事件绑定 - 已在上面的DOMContentLoaded中处理

  // 🔝 返回顶部按钮由组件管理器统一处理，无需重复初始化

  console.log("✅ 所有功能初始化完成");
}

// 🚫 已移除重复的DOMContentLoaded监听器
// 现在使用统一的页面加载管理器处理所有初始化

// 使用统一页面加载管理器初始化功能
if (window.PageLoadManager) {
  // 🚀 简化依赖关系：产品展示只依赖DOM就绪
  window.PageLoadManager.addToQueue(
    "main-homepage-products",
    function () {
      console.log("🏠 main.js - 开始初始化主页产品展示");
      window.PageLoadManager.initHomepageProducts();
    },
    ["domReady"],
  );

  // 添加其他功能初始化到队列
  window.PageLoadManager.addToQueue(
    "main-features",
    function () {
      initializeAllFeatures();
    },
    ["domReady"],
  );
} else {
  // 备用方案：如果页面加载管理器未加载，延迟执行
  setTimeout(function () {
    if (window.PageLoadManager) {
      window.PageLoadManager.addToQueue(
        "main-homepage-products",
        function () {
          console.log("🏠 main.js - 延迟初始化主页产品展示");
          window.PageLoadManager.initHomepageProducts();
        },
        ["domReady"],
      );

      window.PageLoadManager.addToQueue(
        "main-features",
        function () {
          initializeAllFeatures();
        },
        ["domReady"],
      );
    } else {
      console.warn("⚠️ 页面加载管理器未找到，使用传统初始化方式");
      initializeAllFeatures();

      // 传统方式加载产品展示
      const showcase = document.getElementById("products-showcase");
      if (showcase) {
        console.log("🏠 main.js - 传统方式加载产品展示");
        loadProductShowcase();
      }
    }
  }, 100);
}
