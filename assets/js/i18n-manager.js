// 🌍 国际化管理器 - 多语言支持系统

class I18nManager {
  constructor() {
    this.currentLanguage = "zh-CN"; // 默认中文
    this.supportedLanguages = ["zh-CN", "en-US"];
    this.translations = {};
    this.fallbackLanguage = "zh-CN";
    this.initialized = false;
    this.initPromise = null; // 防止重复初始化

    // 语言配置
    this.languageConfig = {
      "zh-CN": {
        name: "中文",
        nativeName: "中文",
        dir: "ltr",
        code: "zh-CN",
      },
      "en-US": {
        name: "English",
        nativeName: "English",
        dir: "ltr",
        code: "en-US",
      },
    };

    // 不在构造函数中自动初始化，等待DOMContentLoaded
  }

  // 初始化国际化系统
  async init() {
    // 防止重复初始化
    if (this.initialized) {
      console.log("🌍 国际化管理器已经初始化，跳过重复初始化");
      return this.initPromise;
    }

    if (this.initPromise) {
      console.log("🌍 国际化管理器正在初始化中，等待完成...");
      return this.initPromise;
    }

    this.initPromise = this._doInit();
    return this.initPromise;
  }

  // 实际的初始化逻辑（优化版本，减少闪烁）
  async _doInit() {
    console.log("🌍 初始化国际化管理器...");

    // 🔧 优化：检测用户语言偏好（如果已经预设了语言，跳过检测）
    if (!this.currentLanguage || this.currentLanguage === "zh-CN") {
      this.detectLanguage();
    }

    // 加载语言包
    await this.loadLanguages();

    // 标记为已初始化
    this.initialized = true;

    console.log(`🌍 国际化管理器初始化完成，当前语言: ${this.currentLanguage}`);

    // 🔧 优化：使用带检查的页面内容更新，确保渲染质量
    await this.updatePageContentWithCheck();

    // 🔧 等待DOM更新完成
    await this.waitForDOMUpdate();

    // 触发语言加载完成事件
    this.dispatchEvent("i18n:loaded");

    // 🔧 设置页面加载管理器状态（如果存在）
    if (window.PageLoadManager) {
      window.PageLoadManager.setState("i18nReady", true);
    }

    return true;
  }

  // 检测用户语言偏好
  detectLanguage() {
    console.log("🌍 开始检测用户语言偏好...");

    // 1. 从URL参数检测
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get("lang");
    if (urlLang && this.isSupported(urlLang)) {
      console.log(`✅ 从URL参数检测到语言: ${urlLang}`);
      this.currentLanguage = urlLang;
      localStorage.setItem("preferred-language", urlLang);
      return;
    }

    // 2. 从localStorage检测
    const savedLang = localStorage.getItem("preferred-language");
    if (savedLang && this.isSupported(savedLang)) {
      console.log(`✅ 从本地存储检测到语言: ${savedLang}`);
      this.currentLanguage = savedLang;
      return;
    }

    // 3. 从浏览器语言检测
    const browserLang = navigator.language || navigator.userLanguage;
    console.log(`🔍 浏览器语言: ${browserLang}`);
    const matchedLang = this.findBestMatch(browserLang);
    if (matchedLang) {
      console.log(`✅ 匹配到浏览器语言: ${matchedLang}`);
      this.currentLanguage = matchedLang;
      return;
    }

    // 4. 使用默认语言（中文）
    console.log(`🔧 使用默认语言: ${this.fallbackLanguage}`);
    this.currentLanguage = this.fallbackLanguage;

    // 🔥 强制保存到localStorage，确保下次访问时优先使用中文
    localStorage.setItem("preferred-language", this.fallbackLanguage);
  }

  // 检查语言是否支持
  isSupported(lang) {
    return this.supportedLanguages.includes(lang);
  }

  // 找到最佳匹配的语言
  findBestMatch(browserLang) {
    // 精确匹配
    if (this.isSupported(browserLang)) {
      return browserLang;
    }

    // 语言代码匹配 (en-US -> en)
    const langCode = browserLang.split("-")[0];
    const matches = this.supportedLanguages.filter((lang) =>
      lang.startsWith(langCode + "-"),
    );

    return matches.length > 0 ? matches[0] : null;
  }

  // 加载所有语言包
  async loadLanguages() {
    console.log("📦 加载语言包...");

    const loadPromises = this.supportedLanguages.map((lang) =>
      this.loadLanguage(lang),
    );

    await Promise.all(loadPromises);
    console.log("✅ 所有语言包加载完成");
  }

  // 加载单个语言包
  async loadLanguage(lang) {
    try {
      const response = await fetch(`/data/i18n/${lang}.json`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const translations = await response.json();
      this.translations[lang] = translations;

      console.log(`✅ 语言包 ${lang} 加载成功`);
      return translations;
    } catch (error) {
      console.error(`❌ 语言包 ${lang} 加载失败:`, error);

      // 如果是当前语言，回退到默认语言
      if (lang === this.currentLanguage && lang !== this.fallbackLanguage) {
        console.log(`🔄 回退到默认语言: ${this.fallbackLanguage}`);
        this.currentLanguage = this.fallbackLanguage;
      }
    }
  }

  // 获取翻译文本
  t(key, params = {}) {
    if (!this.initialized) {
      return key; // 未初始化时返回key
    }

    const translation =
      this.getTranslation(key, this.currentLanguage) ||
      this.getTranslation(key, this.fallbackLanguage) ||
      key;

    // 参数替换
    return this.replaceParams(translation, params);
  }

  // 从语言包中获取翻译
  getTranslation(key, lang) {
    const translations = this.translations[lang];
    if (!translations) return null;

    // 支持嵌套键：'common.loading'
    const keys = key.split(".");
    let value = translations;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return null;
      }
    }

    return typeof value === "string" ? value : null;
  }

  // 替换参数占位符
  replaceParams(text, params) {
    if (!text || typeof text !== "string") return text;

    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params.hasOwnProperty(key) ? params[key] : match;
    });
  }

  // 切换语言（优化版本，添加渲染完成检查和更好的时序控制）
  async switchLanguage(lang) {
    if (!this.isSupported(lang)) {
      console.error(`❌ 不支持的语言: ${lang}`);
      this.showSwitchFeedback("不支持的语言", "error");
      return false;
    }

    if (lang === this.currentLanguage) {
      console.log(`🌍 已经是当前语言: ${lang}`);
      return true;
    }

    console.log(`🌍 切换语言: ${this.currentLanguage} → ${lang}`);

    // 🎨 显示切换中的视觉反馈（改进版本）
    this.showSwitchFeedback("正在切换语言...", "loading");

    try {
      const oldLanguage = this.currentLanguage;

      // 🔧 预先设置语言，减少闪烁
      this.currentLanguage = lang;

      // 保存语言偏好
      localStorage.setItem("preferred-language", lang);

      // 确保语言包已加载
      if (!this.translations[lang]) {
        console.log("📦 加载语言包:", lang);
        await this.loadLanguage(lang);
      }

      // 🔧 立即更新页面内容，减少延迟
      await this.updatePageContentWithCheck();

      // 🔧 等待DOM更新完成后再触发事件，确保其他组件能获取到正确的翻译内容
      await this.waitForDOMUpdate();

      // 触发语言切换事件
      this.dispatchEvent("i18n:changed", {
        oldLanguage,
        newLanguage: lang,
      });

      // 🔧 再次验证关键元素是否已正确更新
      await this.verifyLanguageUpdate(lang);

      // 🎨 显示成功反馈
      const langName = this.languageConfig[lang]?.nativeName || lang;
      this.showSwitchFeedback(`已切换到${langName}`, "success");

      console.log(`✅ 语言切换完成: ${oldLanguage} → ${lang}`);
      return true;
    } catch (error) {
      console.error("❌ 语言切换失败:", error);
      this.showSwitchFeedback("语言切换失败", "error");
      return false;
    }
  }

  // 更新页面内容（优化版本，添加渲染状态验证）
  updatePageContent() {
    console.log("🔄 更新页面内容...");

    // 更新HTML lang属性
    document.documentElement.lang = this.getLanguageCode();

    // 更新所有带有data-i18n属性的元素
    this.updateI18nElements();

    // 更新动态内容
    this.updateDynamicContent();

    // 🌍 更新语言选择器状态
    this.updateLanguageSwitchers();

    console.log("✅ 页面内容更新完成");
  }

  // 🔧 带检查的页面内容更新（新增方法）
  async updatePageContentWithCheck() {
    console.log("🔄 更新页面内容（带渲染检查）...");

    // 更新HTML lang属性
    document.documentElement.lang = this.getLanguageCode();

    // 批量更新所有带有data-i18n属性的元素
    const updateCount = this.updateI18nElementsWithCheck();
    console.log(`📝 更新了 ${updateCount} 个国际化元素`);

    // 更新动态内容
    this.updateDynamicContent();

    // 🌍 更新语言选择器状态
    this.updateLanguageSwitchers();

    console.log("✅ 页面内容更新完成（带检查）");
  }

  // 🔧 等待DOM更新完成（新增方法）
  async waitForDOMUpdate() {
    return new Promise((resolve) => {
      // 使用requestAnimationFrame确保DOM更新完成
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
  }

  // 🔧 验证语言更新是否成功（新增方法）
  async verifyLanguageUpdate(expectedLang) {
    console.log("🔍 验证语言更新结果...");

    // 检查HTML lang属性
    const htmlLang = document.documentElement.lang;
    if (htmlLang !== this.getLanguageCode()) {
      console.warn("⚠️ HTML lang属性未正确更新");
    }

    // 检查关键元素是否已更新
    const sampleElements = document.querySelectorAll("[data-i18n]");
    let updatedCount = 0;

    sampleElements.forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const currentText = el.textContent;
      const expectedText = this.t(key);

      if (currentText === expectedText) {
        updatedCount++;
      }
    });

    console.log(
      `✅ 验证完成: ${updatedCount}/${sampleElements.length} 个元素已正确更新`,
    );

    // 如果更新率低于80%，给出警告
    if (
      sampleElements.length > 0 &&
      updatedCount / sampleElements.length < 0.8
    ) {
      console.warn("⚠️ 部分元素可能未正确更新，建议检查");
    }
  }

  // 获取语言代码（去掉地区）
  getLanguageCode() {
    return this.currentLanguage.split("-")[0];
  }

  // 更新带有data-i18n属性的元素
  updateI18nElements() {
    const elements = document.querySelectorAll("[data-i18n]");

    elements.forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const params = this.parseElementParams(el);

      // 获取翻译内容
      const translation = this.t(key, params);

      // 更新元素内容
      const attr = el.getAttribute("data-i18n-attr");
      if (attr) {
        el.setAttribute(attr, translation);
      } else {
        el.textContent = translation;
      }
    });
  }

  // 🔧 带检查的国际化元素更新（新增方法）
  updateI18nElementsWithCheck() {
    const elements = document.querySelectorAll("[data-i18n]");
    let updateCount = 0;

    elements.forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const params = this.parseElementParams(el);

      // 获取翻译内容
      const translation = this.t(key, params);

      // 检查是否需要更新
      const attr = el.getAttribute("data-i18n-attr");
      let needsUpdate = false;

      if (attr) {
        needsUpdate = el.getAttribute(attr) !== translation;
        if (needsUpdate) {
          el.setAttribute(attr, translation);
          updateCount++;
        }
      } else {
        needsUpdate = el.textContent !== translation;
        if (needsUpdate) {
          el.textContent = translation;
          updateCount++;
        }
      }

      // 添加更新标记，便于调试
      if (needsUpdate) {
        el.setAttribute("data-i18n-updated", Date.now());
      }
    });

    return updateCount;
  }

  // 解析元素参数
  parseElementParams(el) {
    const paramsAttr = el.getAttribute("data-i18n-params");
    if (!paramsAttr) return {};

    try {
      return JSON.parse(paramsAttr);
    } catch (error) {
      console.error("❌ 解析i18n参数失败:", paramsAttr, error);
      return {};
    }
  }

  // 更新动态内容（轮播图、产品等）
  updateDynamicContent() {
    // 更新轮播图
    if (window.carouselManager) {
      this.updateCarousel();
    }

    // 更新产品卡片
    if (window.productCardComponent) {
      this.updateProductCards();
    }

    // 更新公司信息（地址等）
    if (window.companyService) {
      window.companyService.updatePageElements();
    }

    // 🌍 重新处理组件的多语言
    this.processAllComponents();

    // 🔥 特别处理产品详情页面的技术规格表格
    this.updateProductSpecsTable();
  }

  /**
   * 🔥 特别处理产品详情页面的技术规格表格翻译
   */
  updateProductSpecsTable() {
    try {
      // 查找产品详情页面的技术规格表格
      const specsTable = document.querySelector(".product-specs-table");
      if (specsTable) {
        console.log("🔍 发现产品技术规格表格，开始更新翻译...");

        // 处理表格中的翻译元素
        const i18nElements = specsTable.querySelectorAll("[data-i18n]");
        i18nElements.forEach((el) => {
          const key = el.getAttribute("data-i18n");
          const translation = this.t(key);

          if (translation && translation !== key) {
            el.textContent = translation;
            console.log(`✅ 更新技术规格标签: ${key} → ${translation}`);
          }
        });
      }
    } catch (error) {
      console.error("❌ 更新产品技术规格表格失败:", error);
    }
  }

  /**
   * 🌍 重新处理所有组件的多语言
   */
  processAllComponents() {
    try {
      // 处理页头组件
      const headerContainer = document.getElementById("header-container");
      if (headerContainer) {
        this.processI18nContainer(headerContainer);
      }

      // 处理页脚组件
      const footerContainer = document.getElementById("footer-container");
      if (footerContainer) {
        this.processI18nContainer(footerContainer);
      }

      // 处理产品卡片容器
      const productContainers = document.querySelectorAll(
        ".product-container, .product-grid, .product-list, #productContainer",
      );
      productContainers.forEach((container) => {
        this.processI18nContainer(container);
      });

      console.log("🌍 所有组件多语言处理完成");
    } catch (error) {
      console.error("❌ 处理组件多语言失败:", error);
    }
  }

  /**
   * 🌍 处理指定容器内的多语言元素
   */
  processI18nContainer(container) {
    const elements = container.querySelectorAll("[data-i18n]");

    elements.forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const params = this.parseElementParams(el);

      // 获取翻译内容
      const translation = this.t(key, params);

      // 更新元素内容
      const attr = el.getAttribute("data-i18n-attr");
      if (attr) {
        el.setAttribute(attr, translation);
      } else {
        el.textContent = translation;
      }
    });
  }

  /**
   * 🌍 处理新添加的元素（供组件管理器调用）
   */
  processElements(container) {
    if (container && this.initialized) {
      this.processI18nContainer(container);
    }
  }

  // 更新轮播图
  updateCarousel() {
    try {
      const slides = this.t("hero.slides");
      if (Array.isArray(slides)) {
        // 更新轮播图配置
        if (window.carouselConfig) {
          window.carouselConfig.slides.forEach((slide, index) => {
            if (slides[index]) {
              slide.title = slides[index].title;
              slide.desc = slides[index].description;
            }
          });
        }

        // 重新初始化轮播图
        if (window.carouselManager && window.carouselManager.updateSlides) {
          window.carouselManager.updateSlides();
        }
      }
    } catch (error) {
      console.error("❌ 更新轮播图失败:", error);
    }
  }

  // 更新产品卡片
  updateProductCards() {
    try {
      // 触发产品卡片重新渲染
      const event = new CustomEvent("i18n:update-products");
      document.dispatchEvent(event);
    } catch (error) {
      console.error("❌ 更新产品卡片失败:", error);
    }
  }

  // 获取当前语言信息
  getCurrentLanguage() {
    return {
      code: this.currentLanguage,
      config: this.languageConfig[this.currentLanguage],
    };
  }

  // 获取所有支持的语言
  getSupportedLanguages() {
    return this.supportedLanguages.map((lang) => ({
      code: lang,
      config: this.languageConfig[lang],
    }));
  }

  // 创建语言切换器
  createLanguageSwitcher(container) {
    const switcher = document.createElement("div");
    switcher.className = "language-switcher";

    const select = document.createElement("select");
    select.className = "language-select";

    this.supportedLanguages.forEach((lang) => {
      const option = document.createElement("option");
      option.value = lang;
      option.textContent = this.languageConfig[lang].nativeName;
      option.selected = lang === this.currentLanguage;
      select.appendChild(option);
    });

    select.addEventListener("change", (e) => {
      this.switchLanguage(e.target.value);
    });

    switcher.appendChild(select);

    if (typeof container === "string") {
      const containerEl = document.querySelector(container);
      if (containerEl) {
        containerEl.appendChild(switcher);
      }
    } else if (container) {
      container.appendChild(switcher);
    }

    return switcher;
  }

  // 🌍 更新所有语言选择器的状态
  updateLanguageSwitchers() {
    // 更新所有语言选择器的选中状态
    const languageSelects = document.querySelectorAll(".language-select");
    languageSelects.forEach((select) => {
      if (select.value !== this.currentLanguage) {
        select.value = this.currentLanguage;
        console.log(`🔄 更新语言选择器状态: ${this.currentLanguage}`);
      }
    });
  }

  // 触发自定义事件
  dispatchEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail: { ...detail, i18n: this },
    });
    document.dispatchEvent(event);
  }

  // 获取浏览器偏好语言列表
  getBrowserLanguages() {
    return navigator.languages || [navigator.language || "en-US"];
  }

  // 获取RTL语言支持
  isRTL() {
    const config = this.languageConfig[this.currentLanguage];
    return config && config.dir === "rtl";
  }

  // 🎨 显示语言切换反馈（改进版本，提供更好的视觉反馈）
  showSwitchFeedback(message, type = "info") {
    // 移除现有的反馈元素
    const existingFeedback = document.querySelector(".i18n-switch-feedback");
    if (existingFeedback) {
      // 如果是从loading状态切换到其他状态，使用平滑过渡
      if (
        existingFeedback.classList.contains("i18n-feedback-loading") &&
        type !== "loading"
      ) {
        existingFeedback.classList.remove("i18n-feedback-loading");
        existingFeedback.classList.add(`i18n-feedback-${type}`);

        const contentEl = existingFeedback.querySelector(".feedback-content");
        if (contentEl) {
          contentEl.innerHTML = `
                        ${type === "success" ? '<i class="fas fa-check"></i>' : ""}
                        ${type === "error" ? '<i class="fas fa-exclamation-triangle"></i>' : ""}
                        <span>${message}</span>
                    `;

          // 更新背景色
          existingFeedback.style.background =
            type === "success"
              ? "#4CAF50"
              : type === "error"
                ? "#f44336"
                : "#2196F3";

          // 自动隐藏
          setTimeout(() => {
            existingFeedback.style.opacity = "0";
            existingFeedback.style.transform = "translateX(100%)";
            setTimeout(() => {
              if (existingFeedback.parentNode) {
                existingFeedback.remove();
              }
            }, 300);
          }, 2000);

          return; // 已更新现有元素，无需创建新元素
        }
      } else {
        existingFeedback.remove();
      }
    }

    // 创建反馈元素
    const feedback = document.createElement("div");
    feedback.className = `i18n-switch-feedback i18n-feedback-${type}`;

    // 添加语言切换进度指示器（仅在loading状态）
    const progressBar =
      type === "loading" ? `<div class="language-switch-progress"></div>` : "";

    feedback.innerHTML = `
            <div class="feedback-content">
                ${type === "loading" ? '<i class="fas fa-spinner fa-spin"></i>' : ""}
                ${type === "success" ? '<i class="fas fa-check"></i>' : ""}
                ${type === "error" ? '<i class="fas fa-exclamation-triangle"></i>' : ""}
                <span>${message}</span>
            </div>
            ${progressBar}
        `;

    // 添加样式
    feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === "success" ? "#4CAF50" : type === "error" ? "#f44336" : "#2196F3"};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            overflow: hidden;
        `;

    document.body.appendChild(feedback);

    // 显示动画
    setTimeout(() => {
      feedback.style.opacity = "1";
      feedback.style.transform = "translateX(0)";

      // 如果是loading状态，添加进度条动画
      if (type === "loading") {
        const progressBar = feedback.querySelector(".language-switch-progress");
        if (progressBar) {
          progressBar.style.cssText = `
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        height: 3px;
                        background: rgba(255,255,255,0.7);
                        width: 0%;
                        transition: width 2s ease-in-out;
                    `;

          // 启动进度条动画
          setTimeout(() => {
            progressBar.style.width = "100%";
          }, 50);
        }
      }
    }, 10);

    // 自动隐藏（除了loading状态）
    if (type !== "loading") {
      setTimeout(() => {
        feedback.style.opacity = "0";
        feedback.style.transform = "translateX(100%)";
        setTimeout(() => {
          if (feedback.parentNode) {
            feedback.remove();
          }
        }, 300);
      }, 2000);
    }

    return feedback;
  }

  // 🔧 显示全局语言切换状态（新增方法）
  showGlobalLanguageStatus(message, type = "info", duration = 3000) {
    // 创建或更新全局状态指示器
    let statusIndicator = document.querySelector(".global-language-status");

    if (!statusIndicator) {
      statusIndicator = document.createElement("div");
      statusIndicator.className = "global-language-status";
      document.body.appendChild(statusIndicator);
    }

    statusIndicator.className = `global-language-status status-${type}`;
    statusIndicator.innerHTML = `
            <div class="status-content">
                ${type === "loading" ? '<div class="status-spinner"></div>' : ""}
                ${type === "success" ? '<i class="fas fa-check-circle"></i>' : ""}
                ${type === "error" ? '<i class="fas fa-exclamation-circle"></i>' : ""}
                <span>${message}</span>
            </div>
        `;

    // 添加样式
    statusIndicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === "success" ? "#4CAF50" : type === "error" ? "#f44336" : "#2196F3"};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.2);
            z-index: 10001;
            font-size: 14px;
            font-weight: 500;
            opacity: 0;
            transform: translateX(-50%) translateY(100%);
            transition: all 0.4s ease;
            text-align: center;
            min-width: 250px;
        `;

    // 显示动画
    setTimeout(() => {
      statusIndicator.style.opacity = "1";
      statusIndicator.style.transform = "translateX(-50%) translateY(0)";
    }, 10);

    // 自动隐藏
    if (type !== "loading") {
      setTimeout(() => {
        statusIndicator.style.opacity = "0";
        statusIndicator.style.transform = "translateX(-50%) translateY(100%)";
        setTimeout(() => {
          if (statusIndicator.parentNode) {
            statusIndicator.remove();
          }
        }, 400);
      }, duration);
    }

    return statusIndicator;
  }

  // 🔧 隐藏全局语言状态（新增方法）
  hideGlobalLanguageStatus() {
    const statusIndicator = document.querySelector(".global-language-status");
    if (statusIndicator) {
      statusIndicator.style.opacity = "0";
      statusIndicator.style.transform = "translateX(-50%) translateY(100%)";
      setTimeout(() => {
        if (statusIndicator.parentNode) {
          statusIndicator.remove();
        }
      }, 400);
    }
  }
}

// 导出供Node.js使用
if (typeof module !== "undefined" && module.exports) {
  module.exports = I18nManager;
}

// 创建全局实例并自动初始化
if (typeof window !== "undefined") {
  window.I18nManager = I18nManager;
  window.i18n = new I18nManager();
  // 🔧 修复：添加兼容性别名，解决组件管理器中的引用问题
  window.i18nManager = window.i18n;

  // 🔧 优化的自动初始化 - 立即应用用户偏好语言，避免闪烁
  const initI18n = async () => {
    console.log("🌍 开始自动初始化i18n系统...");
    try {
      // 🔧 检查是否已经有早期语言检测结果
      if (window.earlyLanguageDetection) {
        console.log("🌍 使用早期语言检测结果:", window.earlyLanguageDetection);
        window.i18n.currentLanguage =
          window.earlyLanguageDetection.preferredLanguage;
      } else {
        // 🔧 预先检查用户语言偏好，避免"先中文后英文"的闪烁
        const preferredLang =
          localStorage.getItem("preferred-language") ||
          navigator.language ||
          navigator.userLanguage ||
          "zh-CN";

        console.log("🌍 检测到用户偏好语言:", preferredLang);

        // 🔧 如果偏好语言不是默认语言，立即设置HTML lang属性
        if (preferredLang !== window.i18n.currentLanguage) {
          console.log("🔧 预设页面语言属性:", preferredLang);
          document.documentElement.lang = preferredLang.split("-")[0];

          // 预设当前语言，减少初始化时的语言切换
          window.i18n.currentLanguage = preferredLang;
        }
      }

      await window.i18n.init();

      // 🔧 通知全局加载屏幕i18n已就绪
      if (window.GlobalLoadingScreen) {
        window.GlobalLoadingScreen.setState("i18nReady", true);
      }

      console.log("✅ i18n系统自动初始化完成");
    } catch (error) {
      console.error("❌ i18n系统初始化失败:", error);

      // 即使失败也要通知加载屏幕
      if (window.GlobalLoadingScreen) {
        window.GlobalLoadingScreen.setState("i18nReady", true);
      }
    }
  };

  // 🔧 优化的DOM检查和初始化
  if (document.readyState === "loading") {
    // DOM还在加载中，等待DOMContentLoaded
    document.addEventListener("DOMContentLoaded", initI18n);
  } else {
    // DOM已经加载完成，立即初始化
    setTimeout(initI18n, 0); // 使用setTimeout确保在下一个事件循环中执行
  }
}
