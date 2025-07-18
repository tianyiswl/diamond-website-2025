/**
 * 🔍 搜索功能修复模块
 * 解决搜索框回车键无效的问题
 */

(function () {
  "use strict";

  console.log("🔧 搜索修复模块开始加载...");

  // 等待DOM完全加载
  function waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === "complete") {
        resolve();
      } else {
        window.addEventListener("load", resolve);
      }
    });
  }

  // 等待搜索框元素出现
  function waitForSearchInput() {
    return new Promise((resolve) => {
      const checkForElement = () => {
        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
          console.log("✅ 找到搜索框元素:", searchInput);
          resolve(searchInput);
        } else {
          console.log("⏳ 搜索框元素未找到，0.1秒后重试...");
          setTimeout(checkForElement, 100);
        }
      };
      checkForElement();
    });
  }

  // 执行搜索跳转
  function performSearchJump() {
    const searchInput = document.getElementById("searchInput");
    if (!searchInput || !searchInput.value.trim()) {
      console.log("❌ 搜索框为空或不存在");
      return;
    }

    const searchTerm = searchInput.value.trim();
    console.log("🔍 执行搜索跳转，搜索词:", searchTerm);

    // 智能判断跳转路径
    let targetUrl;
    const currentPath = window.location.pathname;

    if (
      currentPath === "/" ||
      currentPath.endsWith("index.html") ||
      currentPath === "/diamond-website-new/" ||
      currentPath === "/diamond-website-new/index.html"
    ) {
      // 首页：跳转到 pages/products.html
      targetUrl = `pages/products.html?search=${encodeURIComponent(searchTerm)}`;
    } else if (currentPath.includes("/pages/")) {
      // 在pages目录下的页面：跳转到 products.html
      targetUrl = `products.html?search=${encodeURIComponent(searchTerm)}`;
    } else {
      // 其他情况：使用相对路径
      targetUrl = `pages/products.html?search=${encodeURIComponent(searchTerm)}`;
    }

    console.log("🎯 搜索跳转目标:", targetUrl);
    window.location.href = targetUrl;
  }

  // 绑定搜索事件
  async function bindSearchEvents() {
    try {
      console.log("🔧 开始绑定搜索事件...");

      // 等待DOM和搜索框元素
      await waitForDOM();
      const searchInput = await waitForSearchInput();

      console.log("🎯 为搜索输入框绑定回车键事件...");

      // 移除可能存在的旧事件监听器
      if (window.searchInputKeyHandler) {
        searchInput.removeEventListener(
          "keypress",
          window.searchInputKeyHandler,
        );
        console.log("🧹 已移除旧的回车键事件监听器");
      }

      // 创建新的回车键事件处理函数
      window.searchInputKeyHandler = function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          console.log("🔍 搜索修复模块 - 搜索输入框回车键触发");
          performSearchJump();
        }
      };

      // 绑定回车键事件到搜索输入框
      searchInput.addEventListener("keypress", window.searchInputKeyHandler);
      console.log("✅ 搜索输入框回车键事件绑定成功");

      // 确保搜索按钮也能工作（覆盖原有的onclick）
      const searchBtn = document.querySelector(".search-btn");
      if (searchBtn) {
        // 移除原有的onclick属性
        searchBtn.removeAttribute("onclick");

        // 移除可能存在的旧事件监听器
        if (window.searchButtonClickHandler) {
          searchBtn.removeEventListener(
            "click",
            window.searchButtonClickHandler,
          );
        }

        // 创建新的点击事件处理函数
        window.searchButtonClickHandler = function (e) {
          e.preventDefault();
          console.log("🔍 搜索修复模块 - 搜索按钮点击");
          performSearchJump();
        };

        searchBtn.addEventListener("click", window.searchButtonClickHandler);
        console.log("✅ 搜索按钮点击事件绑定成功");
      }

      // 创建全局搜索函数（保持兼容性）
      window.performSearch = performSearchJump;

      console.log("✅ 搜索修复模块 - 所有事件绑定完成");
    } catch (error) {
      console.error("❌ 搜索事件绑定失败:", error);
    }
  }

  // 初始化搜索修复功能
  function initSearchFix() {
    console.log("🚀 初始化搜索修复功能...");

    // 立即尝试绑定
    bindSearchEvents();

    // 不使用 MutationObserver，避免无限循环
    // 只在页面加载时绑定一次事件即可

    console.log("✅ 搜索修复模块初始化完成");
  }

  // 🚫 已移除重复的DOMContentLoaded监听器
  // 现在使用统一的页面加载管理器处理搜索功能初始化

  // 使用统一页面加载管理器初始化搜索功能
  if (window.PageLoadManager) {
    window.PageLoadManager.addToQueue(
      "search-fix",
      function () {
        initSearchFix();
      },
      ["domReady", "componentsLoaded"],
    );
  } else {
    // 备用方案：延迟执行
    setTimeout(function () {
      if (window.PageLoadManager) {
        window.PageLoadManager.addToQueue(
          "search-fix",
          function () {
            initSearchFix();
          },
          ["domReady", "componentsLoaded"],
        );
      } else {
        console.warn("⚠️ 页面加载管理器未找到，直接初始化搜索功能");
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", initSearchFix);
        } else {
          initSearchFix();
        }
      }
    }, 100);
  }
})();
