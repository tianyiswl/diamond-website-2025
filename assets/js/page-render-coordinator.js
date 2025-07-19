/**
 * 🎯 页面渲染协调器
 * 统一管理所有组件的加载和渲染顺序，确保无闪烁的用户体验
 *
 * 功能：
 * - 协调多个管理器的初始化顺序
 * - 确保内容在完全准备好后才显示
 * - 处理多语言环境下的渲染时机
 * - 提供统一的错误处理和回退机制
 */

(function () {
  "use strict";

  window.PageRenderCoordinator = {
    // 初始化状态
    initialized: false,

    // 管理器实例
    managers: {
      globalLoading: null,
      i18n: null,
      pageLoad: null,
      component: null,
    },

    // 初始化队列
    initQueue: [],

    // 当前页面类型
    pageType: "unknown",

    /**
     * 初始化协调器
     */
    init: function () {
      if (this.initialized) return;

      console.log("🎯 初始化页面渲染协调器");

      // 检测页面类型
      this.detectPageType();

      // 确保全局加载屏幕已显示
      this.ensureGlobalLoadingScreen();

      // 预设用户语言偏好，避免语言闪烁
      this.presetLanguagePreference();

      // 设置管理器引用
      this.setupManagerReferences();

      // 开始协调初始化流程
      this.startCoordinatedInitialization();

      this.initialized = true;
    },

    /**
     * 检测页面类型
     */
    detectPageType: function () {
      const path = window.location.pathname;

      if (path === "/" || path.endsWith("index.html")) {
        this.pageType = "home";
      } else if (path.includes("products.html")) {
        this.pageType = "products";
      } else if (path.includes("product-detail.html")) {
        this.pageType = "product-detail";
      } else if (path.includes("privacy.html")) {
        this.pageType = "privacy";
      } else if (path.includes("terms.html")) {
        this.pageType = "terms";
      } else {
        this.pageType = "other";
      }

      console.log(`🔍 检测到页面类型: ${this.pageType}`);
    },

    /**
     * 确保全局加载屏幕已显示
     */
    ensureGlobalLoadingScreen: function () {
      if (window.GlobalLoadingScreen) {
        this.managers.globalLoading = window.GlobalLoadingScreen;
        console.log("✅ 全局加载屏幕已就绪");
      } else {
        console.warn("⚠️ 全局加载屏幕未找到");
      }
    },

    /**
     * 预设用户语言偏好，避免语言闪烁
     */
    presetLanguagePreference: function () {
      try {
        // 从localStorage获取用户偏好语言
        const preferredLang =
          localStorage.getItem("preferred-language") ||
          navigator.language ||
          navigator.userLanguage ||
          "zh-CN";

        console.log("🌍 预设用户偏好语言:", preferredLang);

        // 立即设置HTML lang属性
        const langCode = preferredLang.split("-")[0];
        document.documentElement.lang = langCode;

        // 如果是英文，预设一些关键元素的内容，避免闪烁
        if (preferredLang.startsWith("en")) {
          this.presetEnglishContent();
        }

        // 保存到全局变量供其他脚本使用
        window.earlyLanguageDetection = {
          preferredLanguage: preferredLang,
          langCode: langCode,
          timestamp: Date.now(),
        };
      } catch (error) {
        console.error("❌ 预设语言偏好失败:", error);
      }
    },

    /**
     * 预设英文内容，避免中英文闪烁
     */
    presetEnglishContent: function () {
      // 预设页面标题
      const titleElement = document.querySelector("title");
      if (titleElement && titleElement.textContent.includes("无锡皇德")) {
        titleElement.textContent =
          "Wuxi Diamond International Trading Co., Ltd. - Professional Turbocharger and Common Rail Injector Parts Supplier";
      }

      // 预设加载屏幕的英文内容
      setTimeout(() => {
        const loadingCompanyName = document.querySelector(
          ".loading-company-name",
        );
        const loadingSubtitle = document.querySelector(".loading-subtitle");
        const loadingText = document.querySelector(".loading-text");

        if (loadingCompanyName) {
          loadingCompanyName.textContent =
            "Wuxi Diamond International Trading Co., Ltd.";
        }
        if (loadingSubtitle) {
          loadingSubtitle.textContent =
            "Professional Turbocharger and Common Rail Injector Parts Supplier";
        }
        if (loadingText) {
          loadingText.textContent = "Loading page content...";
        }
      }, 50);
    },

    /**
     * 设置管理器引用
     */
    setupManagerReferences: function () {
      // 等待其他管理器加载
      const checkManagers = () => {
        if (window.i18nManager || window.i18n) {
          this.managers.i18n = window.i18nManager || window.i18n;
        }

        if (window.PageLoadManager) {
          this.managers.pageLoad = window.PageLoadManager;
        }

        if (window.componentManager) {
          this.managers.component = window.componentManager;
        }
      };

      // 立即检查一次
      checkManagers();

      // 定期检查直到所有管理器都加载完成
      const checkInterval = setInterval(() => {
        checkManagers();

        // 如果主要管理器都已加载，停止检查
        if (this.managers.i18n && this.managers.pageLoad) {
          clearInterval(checkInterval);
          console.log("✅ 主要管理器引用已设置");
        }
      }, 100);

      // 10秒后强制停止检查
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 10000);
    },

    /**
     * 开始协调初始化流程
     */
    startCoordinatedInitialization: function () {
      console.log("🚀 开始协调初始化流程");

      // 添加总体超时机制
      const overallTimeout = setTimeout(() => {
        console.warn("⚠️ 整体初始化超时，强制完成");
        if (this.managers.globalLoading) {
          this.managers.globalLoading.forceHideLoadingScreen();
        }
      }, 10000); // 10秒总超时

      // 第一阶段：DOM准备
      this.waitForDOM()
        .then(() => {
          console.log("✅ DOM准备完成");
          if (this.managers.globalLoading) {
            this.managers.globalLoading.setState("domReady", true);
          }

          // 第二阶段：国际化系统
          return this.initializeI18n();
        })
        .then(() => {
          console.log("✅ 国际化系统完成");
          if (this.managers.globalLoading) {
            this.managers.globalLoading.setState("i18nReady", true);
          }

          // 第三阶段：组件系统
          return this.initializeComponents();
        })
        .then(() => {
          console.log("✅ 组件系统完成");
          if (this.managers.globalLoading) {
            this.managers.globalLoading.setState("componentsReady", true);
          }

          // 第四阶段：页面内容
          return this.initializePageContent();
        })
        .then(() => {
          console.log("✅ 页面内容完成");
          if (this.managers.globalLoading) {
            this.managers.globalLoading.setState("contentReady", true);
          }

          clearTimeout(overallTimeout);
          console.log("🎉 页面渲染协调完成");
        })
        .catch((error) => {
          console.error("❌ 页面渲染协调失败:", error);
          clearTimeout(overallTimeout);

          // 错误情况下也要隐藏加载屏幕
          if (this.managers.globalLoading) {
            this.managers.globalLoading.forceHideLoadingScreen();
          }
        });
    },

    /**
     * 等待DOM准备完成
     */
    waitForDOM: function () {
      return new Promise((resolve) => {
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", resolve);
        } else {
          resolve();
        }
      });
    },

    /**
     * 初始化国际化系统
     */
    initializeI18n: function () {
      return new Promise(async (resolve) => {
        console.log("🌍 协调器：初始化国际化系统");

        try {
          // 等待i18n管理器加载
          let attempts = 0;
          const maxAttempts = 50; // 5秒超时

          const waitForI18n = () => {
            if (this.managers.i18n && this.managers.i18n.init) {
              return this.managers.i18n.init();
            } else if (attempts < maxAttempts) {
              attempts++;
              return new Promise((resolve) => {
                setTimeout(() => {
                  this.setupManagerReferences();
                  resolve(waitForI18n());
                }, 100);
              });
            } else {
              console.warn("⚠️ i18n管理器加载超时");
              return Promise.resolve();
            }
          };

          await waitForI18n();
          console.log("✅ 国际化系统初始化完成");
          resolve();
        } catch (error) {
          console.error("❌ 国际化系统初始化失败:", error);
          resolve(); // 即使失败也继续
        }
      });
    },

    /**
     * 初始化组件系统
     */
    initializeComponents: function () {
      return new Promise(async (resolve) => {
        console.log("🔧 协调器：初始化组件系统");

        try {
          // 等待组件管理器加载
          let attempts = 0;
          const maxAttempts = 50;

          const waitForComponents = () => {
            if (this.managers.component && this.managers.component.init) {
              const isHomePage = this.pageType === "home";
              return this.managers.component.init(isHomePage);
            } else if (attempts < maxAttempts) {
              attempts++;
              return new Promise((resolve) => {
                setTimeout(() => {
                  this.setupManagerReferences();
                  resolve(waitForComponents());
                }, 100);
              });
            } else {
              console.warn("⚠️ 组件管理器加载超时");
              return Promise.resolve();
            }
          };

          await waitForComponents();
          console.log("✅ 组件系统初始化完成");
          resolve();
        } catch (error) {
          console.error("❌ 组件系统初始化失败:", error);
          resolve(); // 即使失败也继续
        }
      });
    },

    /**
     * 初始化页面内容
     */
    initializePageContent: function () {
      return new Promise(async (resolve) => {
        console.log("📄 协调器：初始化页面内容");

        try {
          // 根据页面类型初始化特定内容
          switch (this.pageType) {
            case "home":
              await this.initializeHomePage();
              break;
            case "products":
              await this.initializeProductsPage();
              break;
            case "product-detail":
              await this.initializeProductDetailPage();
              break;
            default:
              await this.initializeGenericPage();
              break;
          }

          console.log("✅ 页面内容初始化完成");
          resolve();
        } catch (error) {
          console.error("❌ 页面内容初始化失败:", error);
          resolve(); // 即使失败也继续
        }
      });
    },

    /**
     * 初始化主页内容
     */
    initializeHomePage: function () {
      return new Promise((resolve) => {
        console.log("🏠 初始化主页内容");

        // 初始化主页产品展示
        if (
          window.PageLoadManager &&
          window.PageLoadManager.initHomepageProducts
        ) {
          try {
            window.PageLoadManager.initHomepageProducts();
          } catch (error) {
            console.error("❌ 主页产品初始化失败:", error);
          }
        }

        // 等待产品加载完成，但不要等太久
        setTimeout(() => {
          console.log("✅ 主页内容初始化完成");
          resolve();
        }, 2000);
      });
    },

    /**
     * 初始化产品页面内容
     */
    initializeProductsPage: function () {
      return new Promise((resolve) => {
        console.log("📦 初始化产品页面内容");
        // 产品页面特定的初始化逻辑
        // 等待产品组件加载
        setTimeout(() => {
          console.log("✅ 产品页面内容初始化完成");
          resolve();
        }, 1000);
      });
    },

    /**
     * 初始化产品详情页面内容
     */
    initializeProductDetailPage: function () {
      return new Promise((resolve) => {
        console.log("📄 初始化产品详情页面内容");
        // 产品详情页面特定的初始化逻辑
        setTimeout(() => {
          console.log("✅ 产品详情页面内容初始化完成");
          resolve();
        }, 800);
      });
    },

    /**
     * 初始化通用页面内容
     */
    initializeGenericPage: function () {
      return new Promise((resolve) => {
        console.log("📋 初始化通用页面内容");
        // 通用页面的初始化逻辑
        setTimeout(() => {
          console.log("✅ 通用页面内容初始化完成");
          resolve();
        }, 500);
      });
    },
  };

  // 立即初始化协调器
  window.PageRenderCoordinator.init();

  console.log("📦 页面渲染协调器已就绪");
})();
