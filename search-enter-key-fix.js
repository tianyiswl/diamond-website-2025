/**
 * 🔧 搜索回车键功能修复脚本
 * 解决回车键搜索无响应但点击搜索按钮正常的问题
 */

(function() {
  'use strict';
  
  console.log('🔧 搜索回车键修复脚本开始执行...');
  
  // 修复配置
  const FIX_CONFIG = {
    searchInputId: 'searchInput',
    searchButtonSelector: '.search-btn',
    searchResultsId: 'searchResults',
    debugMode: true
  };
  
  /**
   * 调试日志函数
   */
  function debugLog(message, type = 'info') {
    if (!FIX_CONFIG.debugMode) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}] 🔧 搜索修复:`;
    
    switch(type) {
      case 'success':
        console.log(`${prefix} ✅ ${message}`);
        break;
      case 'error':
        console.error(`${prefix} ❌ ${message}`);
        break;
      case 'warning':
        console.warn(`${prefix} ⚠️ ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }
  
  /**
   * 清理所有现有的搜索事件监听器
   */
  function cleanupExistingListeners() {
    debugLog('开始清理现有的搜索事件监听器...');
    
    const searchInput = document.getElementById(FIX_CONFIG.searchInputId);
    const searchBtn = document.querySelector(FIX_CONFIG.searchButtonSelector);
    
    if (!searchInput) {
      debugLog('搜索框元素不存在，无法清理', 'error');
      return false;
    }
    
    // 移除所有可能的事件监听器标记
    searchInput.removeAttribute('data-main-search-bound');
    searchInput.removeAttribute('data-search-bound');
    searchInput.removeAttribute('data-search-fix-bound');
    
    // 克隆元素来移除所有事件监听器
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    
    debugLog('搜索框事件监听器已清理', 'success');
    
    // 清理搜索按钮的事件监听器
    if (searchBtn) {
      const newSearchBtn = searchBtn.cloneNode(true);
      searchBtn.parentNode.replaceChild(newSearchBtn, searchBtn);
      debugLog('搜索按钮事件监听器已清理', 'success');
    }
    
    // 清理全局事件处理函数
    if (window.searchInputKeyHandler) {
      delete window.searchInputKeyHandler;
      debugLog('全局回车键处理函数已清理', 'success');
    }
    
    if (window.searchButtonClickHandler) {
      delete window.searchButtonClickHandler;
      debugLog('全局按钮点击处理函数已清理', 'success');
    }
    
    return true;
  }
  
  /**
   * 统一的搜索执行函数
   */
  function executeSearch(source = 'unknown') {
    debugLog(`搜索被触发 - 来源: ${source}`);
    
    const searchInput = document.getElementById(FIX_CONFIG.searchInputId);
    if (!searchInput) {
      debugLog('搜索框不存在', 'error');
      return;
    }
    
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) {
      debugLog('搜索词为空', 'warning');
      return;
    }
    
    debugLog(`执行搜索 - 关键词: "${searchTerm}"`);
    
    // 检查当前页面类型
    const isHomePage = 
      window.location.pathname === '/' ||
      window.location.pathname.includes('index.html') ||
      document.getElementById('products-showcase');
    
    if (isHomePage) {
      // 主页：执行实时搜索
      debugLog('主页实时搜索模式');
      performHomePageSearch(searchTerm);
    } else {
      // 其他页面：跳转搜索
      debugLog('跳转搜索模式');
      performJumpSearch(searchTerm);
    }
  }
  
  /**
   * 主页实时搜索
   */
  function performHomePageSearch(searchTerm) {
    debugLog(`主页搜索 - 关键词: "${searchTerm}"`);
    
    // 调用原有的搜索逻辑
    if (typeof window.performSearch === 'function') {
      try {
        window.performSearch();
        debugLog('调用window.performSearch成功', 'success');
      } catch (error) {
        debugLog(`调用window.performSearch失败: ${error.message}`, 'error');
        fallbackSearch(searchTerm);
      }
    } else {
      debugLog('window.performSearch不存在，使用备用搜索', 'warning');
      fallbackSearch(searchTerm);
    }
  }
  
  /**
   * 跳转搜索
   */
  function performJumpSearch(searchTerm) {
    debugLog(`跳转搜索 - 关键词: "${searchTerm}"`);
    
    // 智能判断跳转路径
    let targetUrl;
    const currentPath = window.location.pathname;
    
    if (currentPath === '/' || currentPath.includes('index.html')) {
      targetUrl = `pages/products.html?search=${encodeURIComponent(searchTerm)}`;
    } else if (currentPath.includes('/pages/')) {
      targetUrl = `products.html?search=${encodeURIComponent(searchTerm)}`;
    } else {
      targetUrl = `pages/products.html?search=${encodeURIComponent(searchTerm)}`;
    }
    
    debugLog(`跳转目标: ${targetUrl}`);
    window.location.href = targetUrl;
  }
  
  /**
   * 备用搜索功能
   */
  function fallbackSearch(searchTerm) {
    debugLog(`备用搜索 - 关键词: "${searchTerm}"`);
    
    const searchResults = document.getElementById(FIX_CONFIG.searchResultsId);
    if (searchResults) {
      searchResults.innerHTML = `
        <div class="search-result-item">
          <div class="search-result-title">搜索: "${searchTerm}"</div>
          <div class="search-result-description">正在处理您的搜索请求...</div>
        </div>
      `;
      searchResults.style.display = 'block';
      debugLog('显示备用搜索结果', 'success');
    }
  }
  
  /**
   * 绑定新的事件监听器
   */
  function bindNewEventListeners() {
    debugLog('开始绑定新的事件监听器...');
    
    const searchInput = document.getElementById(FIX_CONFIG.searchInputId);
    const searchBtn = document.querySelector(FIX_CONFIG.searchButtonSelector);
    
    if (!searchInput) {
      debugLog('搜索框不存在，无法绑定事件', 'error');
      return false;
    }
    
    // 绑定回车键事件
    const keyPressHandler = function(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        debugLog('回车键被按下');
        executeSearch('enter-key');
      }
    };
    
    searchInput.addEventListener('keypress', keyPressHandler);
    debugLog('回车键事件监听器已绑定', 'success');
    
    // 绑定搜索按钮点击事件
    if (searchBtn) {
      const clickHandler = function(event) {
        event.preventDefault();
        debugLog('搜索按钮被点击');
        executeSearch('search-button');
      };
      
      searchBtn.addEventListener('click', clickHandler);
      debugLog('搜索按钮点击事件监听器已绑定', 'success');
      
      // 移除原有的onclick属性
      searchBtn.removeAttribute('onclick');
      debugLog('搜索按钮原有onclick属性已移除');
    }
    
    // 标记已绑定，防止重复绑定
    searchInput.setAttribute('data-search-fix-bound', 'true');
    
    // 保存事件处理函数到全局，便于调试
    window.searchFixKeyHandler = keyPressHandler;
    window.searchFixClickHandler = searchBtn ? clickHandler : null;
    
    return true;
  }
  
  /**
   * 测试搜索功能
   */
  function testSearchFunctionality() {
    debugLog('开始测试搜索功能...');
    
    const testKeywords = ['3798462', 'turbo', 'test'];
    let testIndex = 0;
    
    function runNextTest() {
      if (testIndex >= testKeywords.length) {
        debugLog('所有测试完成', 'success');
        return;
      }
      
      const keyword = testKeywords[testIndex];
      debugLog(`测试关键词: "${keyword}"`);
      
      const searchInput = document.getElementById(FIX_CONFIG.searchInputId);
      if (searchInput) {
        searchInput.value = keyword;
        
        // 模拟回车键
        const enterEvent = new KeyboardEvent('keypress', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true
        });
        
        searchInput.dispatchEvent(enterEvent);
        debugLog(`已发送回车键事件 - 关键词: "${keyword}"`);
      }
      
      testIndex++;
      setTimeout(runNextTest, 2000);
    }
    
    setTimeout(runNextTest, 1000);
  }
  
  /**
   * 主修复函数
   */
  function fixSearchEnterKey() {
    debugLog('开始修复搜索回车键功能...');
    
    // 等待DOM完全加载
    if (document.readyState !== 'complete') {
      debugLog('等待DOM加载完成...');
      window.addEventListener('load', fixSearchEnterKey);
      return;
    }
    
    // 等待搜索框元素出现
    const searchInput = document.getElementById(FIX_CONFIG.searchInputId);
    if (!searchInput) {
      debugLog('搜索框尚未创建，1秒后重试...');
      setTimeout(fixSearchEnterKey, 1000);
      return;
    }
    
    // 检查是否已经修复过
    if (searchInput.hasAttribute('data-search-fix-bound')) {
      debugLog('搜索功能已经修复过，跳过重复修复', 'warning');
      return;
    }
    
    try {
      // 1. 清理现有监听器
      const cleanupSuccess = cleanupExistingListeners();
      if (!cleanupSuccess) {
        debugLog('清理现有监听器失败', 'error');
        return;
      }
      
      // 2. 绑定新的监听器
      const bindSuccess = bindNewEventListeners();
      if (!bindSuccess) {
        debugLog('绑定新监听器失败', 'error');
        return;
      }
      
      debugLog('搜索回车键功能修复完成', 'success');
      
      // 3. 可选：运行测试
      if (FIX_CONFIG.debugMode) {
        setTimeout(() => {
          debugLog('开始功能测试...');
          testSearchFunctionality();
        }, 2000);
      }
      
    } catch (error) {
      debugLog(`修复过程中发生错误: ${error.message}`, 'error');
    }
  }
  
  /**
   * 手动修复函数（供控制台调用）
   */
  function manualFix() {
    debugLog('手动修复被调用');
    fixSearchEnterKey();
  }
  
  /**
   * 手动测试函数（供控制台调用）
   */
  function manualTest(keyword = '3798462') {
    debugLog(`手动测试被调用 - 关键词: "${keyword}"`);
    
    const searchInput = document.getElementById(FIX_CONFIG.searchInputId);
    if (searchInput) {
      searchInput.value = keyword;
      executeSearch('manual-test');
    } else {
      debugLog('搜索框不存在', 'error');
    }
  }
  
  // 导出到全局供调试使用
  window.searchEnterKeyFix = {
    fix: manualFix,
    test: manualTest,
    executeSearch: executeSearch,
    debugLog: debugLog
  };
  
  // 自动执行修复
  debugLog('搜索回车键修复脚本已加载');
  fixSearchEnterKey();
  
  // 提供使用说明
  console.log('🔧 搜索修复脚本已加载，可用命令:');
  console.log('  - searchEnterKeyFix.fix() - 手动执行修复');
  console.log('  - searchEnterKeyFix.test("3798462") - 测试特定关键词');
  console.log('  - searchEnterKeyFix.executeSearch("test") - 直接执行搜索');
  
})();
