/**
 * 🚀 全局加载屏幕管理器
 * 解决页面闪烁问题的核心组件
 *
 * 功能：
 * - 在页面开始时立即显示加载屏幕
 * - 协调所有组件的加载状态
 * - 确保内容完全准备好后才显示
 * - 支持多语言环境下的无闪烁切换
 */

(function () {
  "use strict";

  // 全局加载状态管理器
  window.GlobalLoadingScreen = {
    // 加载状态
    states: {
      domReady: false,
      i18nReady: false,
      componentsReady: false,
      contentReady: false,
      allReady: false,
    },

    // 加载屏幕元素
    loadingElement: null,

    // 初始化标记
    initialized: false,

    // 超时处理
    timeoutId: null,
    maxLoadTime: 8000, // 8秒超时

    /**
     * 立即创建并显示加载屏幕
     */
    createLoadingScreen: function () {
      if (this.loadingElement) return;

      // 创建加载屏幕HTML
      const loadingHTML = `
                <div id="global-loading-screen" class="global-loading-screen">
                    <div class="loading-content">
                        <div class="loading-logo">
                            <img src="assets/images/logo/diamond-logo.png" 
                                 alt="Diamond Logo" 
                                 class="loading-logo-img"
                                 onerror="this.style.display='none'">
                        </div>
                        <div class="loading-company-name">无锡皇德国际贸易有限公司</div>
                        <div class="loading-subtitle">专业涡轮增压器和共轨喷油器配件供应商</div>
                        <div class="loading-spinner">
                            <div class="spinner"></div>
                        </div>
                        <div class="loading-text">正在加载页面内容...</div>
                        <div class="loading-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" id="loading-progress-fill"></div>
                            </div>
                            <div class="progress-text" id="loading-progress-text">0%</div>
                        </div>
                    </div>
                </div>
            `;

      // 创建样式
      const styles = `
                <style id="global-loading-styles">
                .global-loading-screen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100vh;
                    background: linear-gradient(135deg, #002e5f 0%, #001a3a 100%);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 99999;
                    transition: all 0.5s ease;
                }

                .global-loading-screen.fade-out {
                    opacity: 0;
                    visibility: hidden;
                    pointer-events: none;
                }

                .loading-content {
                    text-align: center;
                    color: white;
                    max-width: 400px;
                    padding: 20px;
                }

                .loading-logo {
                    margin-bottom: 20px;
                }

                .loading-logo-img {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                    box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
                }

                .loading-company-name {
                    font-size: 24px;
                    font-weight: 700;
                    margin-bottom: 10px;
                    color: white;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                }

                .loading-subtitle {
                    font-size: 16px;
                    margin-bottom: 30px;
                    opacity: 0.9;
                    line-height: 1.4;
                }

                .loading-spinner {
                    margin: 30px 0;
                }

                .spinner {
                    width: 50px;
                    height: 50px;
                    border: 4px solid rgba(255, 255, 255, 0.3);
                    border-top: 4px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto;
                }

                .loading-text {
                    font-size: 14px;
                    opacity: 0.8;
                    margin-bottom: 20px;
                }

                .loading-progress {
                    margin-top: 20px;
                }

                .progress-bar {
                    width: 100%;
                    height: 4px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 2px;
                    overflow: hidden;
                    margin-bottom: 10px;
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #00dc82 0%, #00b76c 100%);
                    width: 0%;
                    transition: width 0.3s ease;
                    border-radius: 2px;
                }

                .progress-text {
                    font-size: 12px;
                    opacity: 0.7;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }

                /* 移动端适配 */
                @media (max-width: 768px) {
                    .loading-company-name {
                        font-size: 20px;
                    }
                    
                    .loading-subtitle {
                        font-size: 14px;
                    }
                    
                    .loading-logo-img {
                        width: 60px;
                        height: 60px;
                    }
                }
                </style>
            `;

      // 立即插入样式和HTML到页面
      document.head.insertAdjacentHTML("beforeend", styles);
      document.body.insertAdjacentHTML("afterbegin", loadingHTML);

      this.loadingElement = document.getElementById("global-loading-screen");
      console.log("🚀 全局加载屏幕已创建并显示");

      // 设置超时机制，确保页面不会永远卡在加载状态
      this.startTimeout();
    },

    /**
     * 更新加载进度
     */
    updateProgress: function (percentage, text) {
      const progressFill = document.getElementById("loading-progress-fill");
      const progressText = document.getElementById("loading-progress-text");

      if (progressFill) {
        progressFill.style.width = percentage + "%";
      }

      if (progressText) {
        progressText.textContent = Math.round(percentage) + "%";
      }

      // 更新加载文本
      if (text) {
        const loadingText = document.querySelector(".loading-text");
        if (loadingText) {
          loadingText.textContent = text;
        }
      }
    },

    /**
     * 设置加载状态
     */
    setState: function (key, value) {
      if (this.states[key] !== value) {
        this.states[key] = value;
        console.log(`📊 加载状态更新: ${key} = ${value}`);

        // 计算总进度
        this.updateOverallProgress();

        // 检查是否所有关键状态都已就绪（排除allReady避免循环依赖）
        const requiredStates = [
          "domReady",
          "i18nReady",
          "componentsReady",
          "contentReady",
        ];
        const allRequiredReady = requiredStates.every(
          (stateKey) => this.states[stateKey],
        );

        if (allRequiredReady && !this.states.allReady) {
          this.states.allReady = true;
          console.log("🎉 所有加载状态完成，准备隐藏加载屏幕");
          this.hideLoadingScreen();
        }
      }
    },

    /**
     * 更新总体进度
     */
    updateOverallProgress: function () {
      const stateKeys = [
        "domReady",
        "i18nReady",
        "componentsReady",
        "contentReady",
      ];
      const completedStates = stateKeys.filter(
        (key) => this.states[key],
      ).length;
      const totalStates = stateKeys.length;
      const percentage = (completedStates / totalStates) * 100;

      let progressText = "正在加载页面内容...";

      if (this.states.domReady && !this.states.i18nReady) {
        progressText = "正在初始化多语言系统...";
      } else if (this.states.i18nReady && !this.states.componentsReady) {
        progressText = "正在加载页面组件...";
      } else if (this.states.componentsReady && !this.states.contentReady) {
        progressText = "正在准备页面内容...";
      } else if (percentage >= 100) {
        progressText = "加载完成，正在显示页面...";
      }

      this.updateProgress(percentage, progressText);
    },

    /**
     * 开始超时计时
     */
    startTimeout: function () {
      this.timeoutId = setTimeout(() => {
        if (!this.states.allReady) {
          console.warn("⚠️ 加载超时，强制隐藏加载屏幕");
          console.log("📊 当前状态:", this.states);
          this.forceHideLoadingScreen();
        }
      }, this.maxLoadTime);
    },

    /**
     * 强制隐藏加载屏幕（超时或错误情况）
     */
    forceHideLoadingScreen: function () {
      console.log("🚨 强制隐藏加载屏幕");
      this.states.allReady = true;
      this.hideLoadingScreen();
    },

    /**
     * 隐藏加载屏幕
     */
    hideLoadingScreen: function () {
      if (!this.loadingElement) return;

      console.log("🎉 所有内容加载完成，隐藏加载屏幕");

      // 清除超时计时器
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }

      // 确保进度达到100%
      this.updateProgress(100, "加载完成！");

      // 延迟一点时间让用户看到100%
      setTimeout(() => {
        this.loadingElement.classList.add("fade-out");

        // 完全隐藏后移除元素
        setTimeout(() => {
          if (this.loadingElement && this.loadingElement.parentNode) {
            this.loadingElement.remove();
          }

          // 移除样式
          const styles = document.getElementById("global-loading-styles");
          if (styles) {
            styles.remove();
          }

          console.log("✅ 加载屏幕已完全移除");
        }, 500);
      }, 300);
    },

    /**
     * 初始化全局加载管理器
     */
    init: function () {
      if (this.initialized) return;

      console.log("🚀 初始化全局加载屏幕管理器");

      // 立即创建加载屏幕
      this.createLoadingScreen();

      // 监听DOM加载完成
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          this.setState("domReady", true);
        });
      } else {
        this.setState("domReady", true);
      }

      this.initialized = true;
    },
  };

  // 立即初始化（在脚本加载时就执行）
  window.GlobalLoadingScreen.init();

  // 🚨 紧急降级机制：如果15秒后仍有加载屏幕，强制移除
  setTimeout(function () {
    const loadingScreen = document.getElementById("global-loading-screen");
    if (loadingScreen) {
      console.warn("🚨 紧急降级：强制移除加载屏幕");
      loadingScreen.remove();

      // 移除样式
      const styles = document.getElementById("global-loading-styles");
      if (styles) {
        styles.remove();
      }
    }
  }, 15000);

  console.log("📦 全局加载屏幕管理器已就绪");
})();
