// 🚀 管理后台性能监控
(function () {
  const startTime = performance.now();
  let resourcesLoaded = 0;
  let totalResources = 0;

  // 监控资源加载
  function monitorResources() {
    const resources = performance.getEntriesByType("resource");
    totalResources = resources.length;

    resources.forEach((resource) => {
      if (resource.responseEnd > 0) {
        resourcesLoaded++;
      }
    });

    console.log(`📊 资源加载进度: ${resourcesLoaded}/${totalResources}`);

    if (resourcesLoaded === totalResources) {
      const loadTime = performance.now() - startTime;
      console.log(`✅ 页面加载完成，耗时: ${loadTime.toFixed(2)}ms`);
    }
  }

  // 页面加载完成后监控
  window.addEventListener("load", () => {
    setTimeout(monitorResources, 1000);
  });

  // 监控网络状态
  if ("connection" in navigator) {
    const connection = navigator.connection;
    console.log(`🌐 网络类型: ${connection.effectiveType}`);
    console.log(`📶 网络速度: ${connection.downlink}Mbps`);
  }
})();
