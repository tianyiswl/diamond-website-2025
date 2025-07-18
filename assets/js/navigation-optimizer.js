/**
 * 🚀 页面导航优化器
 * 解决页面跳转时的二次刷新问题
 *
 * 功能：
 * - 优化页面跳转体验
 * - 预加载关键资源
 * - 平滑过渡效果
 * - 防止重复跳转
 */

(function () {
  "use strict";

  // 导航状态管理
  const NavigationOptimizer = {
    // 跳转状态
    isNavigating: false,

    // 预加载缓存
    preloadCache: new Set(),

    // 跳转历史
    navigationHistory: [],

    /**
     * 优化的页面跳转函数
     */
    navigateTo: function (url, options = {}) {
      // 防止重复跳转
      if (this.isNavigating) {
        console.log("⚠️ 正在跳转中，忽略重复请求");
        return;
      }

      // 检查是否是相同页面
      if (window.location.href === url) {
        console.log("⚠️ 目标页面与当前页面相同，忽略跳转");
        return;
      }

      console.log("🚀 开始优化页面跳转:", url);
      this.isNavigating = true;

      // 显示跳转加载状态
      this.showNavigationLoading(options.loadingText || "页面跳转中...");

      // 预加载目标页面资源
      if (options.preload !== false) {
        this.preloadPageResources(url);
      }

      // 延迟跳转，确保加载状态显示
      setTimeout(() => {
        try {
          // 记录跳转历史
          this.navigationHistory.push({
            from: window.location.href,
            to: url,
            timestamp: Date.now(),
          });

          // 执行跳转
          window.location.href = url;
        } catch (error) {
          console.error("❌ 页面跳转失败:", error);
          this.hideNavigationLoading();
          this.isNavigating = false;
        }
      }, options.delay || 100);
    },

    /**
     * 显示跳转加载状态
     */
    showNavigationLoading: function (text) {
      // 移除已存在的加载提示
      this.hideNavigationLoading();

      const loadingOverlay = document.createElement("div");
      loadingOverlay.id = "navigation-loading-overlay";
      loadingOverlay.innerHTML = `
                <div class="navigation-loading-content">
                    <div class="navigation-spinner"></div>
                    <div class="navigation-loading-text">${text}</div>
                </div>
            `;

      // 添加样式
      loadingOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100vh;
                background: rgba(0, 46, 95, 0.95);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 99999;
                backdrop-filter: blur(5px);
            `;

      const style = document.createElement("style");
      style.textContent = `
                .navigation-loading-content {
                    text-align: center;
                    color: white;
                }
                .navigation-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(255,255,255,0.3);
                    border-top: 3px solid white;
                    border-radius: 50%;
                    animation: navigation-spin 1s linear infinite;
                    margin: 0 auto 15px;
                }
                .navigation-loading-text {
                    font-size: 16px;
                    font-weight: 500;
                }
                @keyframes navigation-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;

      document.head.appendChild(style);
      document.body.appendChild(loadingOverlay);
    },

    /**
     * 隐藏跳转加载状态
     */
    hideNavigationLoading: function () {
      const overlay = document.getElementById("navigation-loading-overlay");
      if (overlay) {
        overlay.remove();
      }
    },

    /**
     * 预加载页面资源
     */
    preloadPageResources: function (url) {
      if (this.preloadCache.has(url)) {
        return;
      }

      try {
        // 预加载页面HTML
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = url;
        document.head.appendChild(link);

        this.preloadCache.add(url);
        console.log("📦 预加载页面资源:", url);
      } catch (error) {
        console.warn("⚠️ 预加载失败:", error);
      }
    },

    /**
     * 智能搜索跳转
     */
    searchNavigate: function (searchTerm) {
      if (!searchTerm || !searchTerm.trim()) {
        console.warn("⚠️ 搜索词为空");
        return;
      }

      const currentPath = window.location.pathname;
      let targetUrl;

      // 智能判断跳转路径
      if (
        currentPath === "/" ||
        currentPath.endsWith("index.html") ||
        currentPath === "/diamond-website-new/" ||
        currentPath === "/diamond-website-new/index.html"
      ) {
        targetUrl = `pages/products.html?search=${encodeURIComponent(searchTerm.trim())}`;
      } else if (currentPath.includes("/pages/")) {
        targetUrl = `products.html?search=${encodeURIComponent(searchTerm.trim())}`;
      } else {
        targetUrl = `pages/products.html?search=${encodeURIComponent(searchTerm.trim())}`;
      }

      console.log("🔍 搜索跳转:", searchTerm, "->", targetUrl);
      this.navigateTo(targetUrl, {
        loadingText: `搜索"${searchTerm}"中...`,
        preload: true,
      });
    },

    /**
     * 分类导航
     */
    categoryNavigate: function (category) {
      const targetUrl = `pages/products.html?category=${encodeURIComponent(category)}`;
      console.log("📂 分类跳转:", category, "->", targetUrl);
      this.navigateTo(targetUrl, {
        loadingText: `加载${category}产品中...`,
        preload: true,
      });
    },

    /**
     * 获取导航历史
     */
    getNavigationHistory: function () {
      return this.navigationHistory;
    },

    /**
     * 清理导航历史
     */
    clearNavigationHistory: function () {
      this.navigationHistory = [];
      console.log("🗑️ 导航历史已清理");
    },
  };

  // 暴露到全局
  window.NavigationOptimizer = NavigationOptimizer;

  // 页面卸载时清理状态
  window.addEventListener("beforeunload", function () {
    NavigationOptimizer.hideNavigationLoading();
  });

  // 页面加载完成时重置状态（不影响页面加载屏幕）
  window.addEventListener("load", function () {
    NavigationOptimizer.isNavigating = false;
    // 只隐藏导航加载屏幕，不影响页面加载屏幕
    const navLoading = document.getElementById("navigation-loading-overlay");
    if (navLoading) {
      NavigationOptimizer.hideNavigationLoading();
    }
  });

  console.log("🚀 页面导航优化器已加载");
})();

// 兼容性函数 - 替换原有的跳转方法
window.navigateToProducts = function (category) {
  if (window.NavigationOptimizer) {
    window.NavigationOptimizer.categoryNavigate(category);
  } else {
    // 备用方案
    window.location.href = `pages/products.html?category=${category}`;
  }
};

// 优化搜索跳转
window.optimizedSearchNavigate = function (searchTerm) {
  if (window.NavigationOptimizer) {
    window.NavigationOptimizer.searchNavigate(searchTerm);
  } else {
    // 备用方案
    const currentPath = window.location.pathname;
    let targetUrl;

    if (currentPath === "/" || currentPath.endsWith("index.html")) {
      targetUrl = `pages/products.html?search=${encodeURIComponent(searchTerm)}`;
    } else if (currentPath.includes("/pages/")) {
      targetUrl = `products.html?search=${encodeURIComponent(searchTerm)}`;
    } else {
      targetUrl = `pages/products.html?search=${encodeURIComponent(searchTerm)}`;
    }

    window.location.href = targetUrl;
  }
};
