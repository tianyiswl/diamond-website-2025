/**
 * 🚨 快速修复加载卡住问题
 * 这个脚本会立即检查并修复加载屏幕卡住的问题
 */

(function () {
  "use strict";

  console.log("🚨 快速修复脚本启动");

  // 立即检查是否有加载屏幕
  const loadingScreen = document.getElementById("global-loading-screen");
  if (loadingScreen) {
    console.log("🔍 发现加载屏幕，开始修复...");

    // 方法1: 如果GlobalLoadingScreen存在，尝试正常隐藏
    if (window.GlobalLoadingScreen) {
      console.log("🔧 尝试通过GlobalLoadingScreen隐藏");

      // 强制设置所有状态为true
      window.GlobalLoadingScreen.states.domReady = true;
      window.GlobalLoadingScreen.states.i18nReady = true;
      window.GlobalLoadingScreen.states.componentsReady = true;
      window.GlobalLoadingScreen.states.contentReady = true;
      window.GlobalLoadingScreen.states.allReady = true;

      // 尝试正常隐藏
      try {
        window.GlobalLoadingScreen.hideLoadingScreen();
        console.log("✅ 通过GlobalLoadingScreen成功隐藏");
        return;
      } catch (error) {
        console.error("❌ GlobalLoadingScreen隐藏失败:", error);
      }
    }

    // 方法2: 直接移除加载屏幕元素
    console.log("🔧 直接移除加载屏幕元素");
    try {
      // 添加淡出动画
      loadingScreen.style.transition = "all 0.5s ease";
      loadingScreen.style.opacity = "0";

      setTimeout(() => {
        if (loadingScreen.parentNode) {
          loadingScreen.remove();
          console.log("✅ 加载屏幕已直接移除");
        }

        // 移除相关样式
        const styles = document.getElementById("global-loading-styles");
        if (styles) {
          styles.remove();
          console.log("✅ 加载屏幕样式已移除");
        }
      }, 500);
    } catch (error) {
      console.error("❌ 直接移除失败:", error);

      // 方法3: 强制隐藏（最后手段）
      console.log("🚨 使用强制隐藏方法");
      loadingScreen.style.display = "none";
    }
  } else {
    console.log("✅ 没有发现加载屏幕，页面正常");
  }

  // 确保页面内容可见
  setTimeout(() => {
    const body = document.body;
    const main = document.querySelector("main");

    if (body) {
      body.style.overflow = "auto";
      body.style.pointerEvents = "auto";
    }

    if (main) {
      main.style.display = "block";
      main.style.visibility = "visible";
      main.style.opacity = "1";
    }

    console.log("✅ 页面内容已确保可见");
  }, 1000);

  console.log("🚨 快速修复脚本完成");
})();

// 如果页面在3秒后仍有加载屏幕，自动执行修复
setTimeout(() => {
  const loadingScreen = document.getElementById("global-loading-screen");
  if (loadingScreen) {
    console.warn("⚠️ 3秒后仍有加载屏幕，执行紧急修复");
    loadingScreen.style.display = "none";

    // 移除样式
    const styles = document.getElementById("global-loading-styles");
    if (styles) {
      styles.remove();
    }
  }
}, 3000);
