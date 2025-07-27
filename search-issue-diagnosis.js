/**
 * 🔍 搜索功能问题诊断脚本
 * 用于诊断回车键搜索功能失效的问题
 */

// 诊断配置
const DIAGNOSIS_CONFIG = {
  testKeywords: ['3798462', 'turbo', 'injector', 'test123'],
  baseUrl: 'http://localhost:3001'
};

/**
 * 检查搜索框元素状态
 */
function checkSearchInputElement() {
  console.log('🔍 检查搜索框元素状态...');
  
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.querySelector('.search-btn');
  const searchResults = document.getElementById('searchResults');
  
  console.log('搜索框元素:', searchInput);
  console.log('搜索按钮:', searchBtn);
  console.log('搜索结果容器:', searchResults);
  
  if (searchInput) {
    console.log('搜索框属性:');
    console.log('  - ID:', searchInput.id);
    console.log('  - 类名:', searchInput.className);
    console.log('  - 当前值:', searchInput.value);
    console.log('  - 是否可见:', searchInput.offsetParent !== null);
    console.log('  - 是否禁用:', searchInput.disabled);
    console.log('  - data-main-search-bound:', searchInput.hasAttribute('data-main-search-bound'));
    console.log('  - data-search-bound:', searchInput.hasAttribute('data-search-bound'));
  }
  
  return { searchInput, searchBtn, searchResults };
}

/**
 * 检查事件监听器绑定情况
 */
function checkEventListeners() {
  console.log('🎯 检查事件监听器绑定情况...');
  
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) {
    console.log('❌ 搜索框不存在，无法检查事件监听器');
    return;
  }
  
  // 检查全局搜索函数
  console.log('全局搜索函数:');
  console.log('  - window.performSearch:', typeof window.performSearch);
  console.log('  - window.searchInputKeyHandler:', typeof window.searchInputKeyHandler);
  console.log('  - window.searchButtonClickHandler:', typeof window.searchButtonClickHandler);
  
  // 检查事件监听器数量（通过克隆元素的方式）
  const originalInput = searchInput;
  const clonedInput = searchInput.cloneNode(true);
  
  // 如果克隆的元素和原元素的事件行为不同，说明原元素有事件监听器
  console.log('事件监听器检查:');
  console.log('  - 原始元素:', originalInput);
  console.log('  - 克隆元素:', clonedInput);
}

/**
 * 检查搜索功能冲突
 */
function checkSearchFunctionConflicts() {
  console.log('⚠️ 检查搜索功能冲突...');
  
  // 检查是否有多个performSearch函数定义
  const performSearchSources = [];
  
  if (window.performSearch) {
    performSearchSources.push('window.performSearch');
  }
  
  // 检查是否在不同作用域中定义了performSearch
  try {
    if (typeof performSearch !== 'undefined') {
      performSearchSources.push('global performSearch');
    }
  } catch (e) {
    // performSearch未在全局作用域定义
  }
  
  console.log('发现的performSearch函数:', performSearchSources);
  
  // 检查搜索相关的JavaScript文件加载情况
  const scripts = Array.from(document.scripts);
  const searchRelatedScripts = scripts.filter(script => 
    script.src.includes('main.js') || 
    script.src.includes('search') ||
    script.src.includes('header-footer')
  );
  
  console.log('搜索相关脚本文件:');
  searchRelatedScripts.forEach(script => {
    console.log('  -', script.src || 'inline script');
  });
}

/**
 * 模拟回车键事件
 */
function simulateEnterKeyPress(keyword) {
  console.log(`🎯 模拟回车键事件 - 关键词: "${keyword}"`);
  
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) {
    console.log('❌ 搜索框不存在');
    return false;
  }
  
  // 设置搜索词
  searchInput.value = keyword;
  searchInput.focus();
  
  // 创建回车键事件
  const enterEvent = new KeyboardEvent('keypress', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true
  });
  
  console.log('发送回车键事件...');
  const result = searchInput.dispatchEvent(enterEvent);
  console.log('事件分发结果:', result);
  
  // 等待一段时间检查结果
  setTimeout(() => {
    checkSearchResults(keyword);
  }, 1000);
  
  return result;
}

/**
 * 模拟搜索按钮点击
 */
function simulateSearchButtonClick(keyword) {
  console.log(`🖱️ 模拟搜索按钮点击 - 关键词: "${keyword}"`);
  
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.querySelector('.search-btn');
  
  if (!searchInput || !searchBtn) {
    console.log('❌ 搜索框或搜索按钮不存在');
    return false;
  }
  
  // 设置搜索词
  searchInput.value = keyword;
  
  // 创建点击事件
  const clickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true
  });
  
  console.log('发送点击事件...');
  const result = searchBtn.dispatchEvent(clickEvent);
  console.log('事件分发结果:', result);
  
  // 等待一段时间检查结果
  setTimeout(() => {
    checkSearchResults(keyword);
  }, 1000);
  
  return result;
}

/**
 * 检查搜索结果
 */
function checkSearchResults(keyword) {
  console.log(`📊 检查搜索结果 - 关键词: "${keyword}"`);
  
  const searchResults = document.getElementById('searchResults');
  if (!searchResults) {
    console.log('❌ 搜索结果容器不存在');
    return;
  }
  
  const isVisible = searchResults.style.display !== 'none' && 
                   searchResults.offsetParent !== null;
  const hasContent = searchResults.innerHTML.trim() !== '';
  
  console.log('搜索结果状态:');
  console.log('  - 容器可见:', isVisible);
  console.log('  - 有内容:', hasContent);
  console.log('  - 内容长度:', searchResults.innerHTML.length);
  
  if (hasContent) {
    const resultItems = searchResults.querySelectorAll('.search-result-item');
    console.log('  - 结果项数量:', resultItems.length);
  }
}

/**
 * 检查控制台错误
 */
function checkConsoleErrors() {
  console.log('🐛 检查控制台错误...');
  
  // 重写console.error来捕获错误
  const originalError = console.error;
  const errors = [];
  
  console.error = function(...args) {
    errors.push(args.join(' '));
    originalError.apply(console, args);
  };
  
  // 监听未捕获的错误
  window.addEventListener('error', (event) => {
    errors.push(`未捕获错误: ${event.message} at ${event.filename}:${event.lineno}`);
  });
  
  setTimeout(() => {
    console.log('收集到的错误:', errors);
    console.error = originalError; // 恢复原始console.error
  }, 5000);
}

/**
 * 运行完整诊断
 */
function runFullDiagnosis() {
  console.log('🚀 开始搜索功能完整诊断...');
  console.log('=' .repeat(60));
  
  // 1. 检查基础元素
  const elements = checkSearchInputElement();
  
  // 2. 检查事件监听器
  checkEventListeners();
  
  // 3. 检查功能冲突
  checkSearchFunctionConflicts();
  
  // 4. 检查控制台错误
  checkConsoleErrors();
  
  // 5. 测试回车键功能
  console.log('\n🧪 测试回车键功能...');
  DIAGNOSIS_CONFIG.testKeywords.forEach((keyword, index) => {
    setTimeout(() => {
      simulateEnterKeyPress(keyword);
    }, index * 3000);
  });
  
  // 6. 测试搜索按钮功能
  console.log('\n🧪 测试搜索按钮功能...');
  setTimeout(() => {
    DIAGNOSIS_CONFIG.testKeywords.forEach((keyword, index) => {
      setTimeout(() => {
        simulateSearchButtonClick(keyword);
      }, index * 3000);
    });
  }, DIAGNOSIS_CONFIG.testKeywords.length * 3000 + 2000);
  
  console.log('\n📋 诊断完成，请查看上述输出结果');
  console.log('💡 如果发现问题，请运行修复脚本');
}

/**
 * 手动测试特定关键词
 */
function testSpecificKeyword(keyword) {
  console.log(`🎯 手动测试关键词: "${keyword}"`);
  
  console.log('\n1. 测试回车键:');
  simulateEnterKeyPress(keyword);
  
  setTimeout(() => {
    console.log('\n2. 测试搜索按钮:');
    simulateSearchButtonClick(keyword);
  }, 2000);
}

// 导出函数供控制台使用
window.searchDiagnosis = {
  runFullDiagnosis,
  testSpecificKeyword,
  checkSearchInputElement,
  checkEventListeners,
  checkSearchFunctionConflicts,
  simulateEnterKeyPress,
  simulateSearchButtonClick,
  checkSearchResults
};

// 如果在浏览器环境中，自动运行诊断
if (typeof window !== 'undefined' && window.document) {
  console.log('🔍 搜索功能诊断脚本已加载');
  console.log('💡 使用方法:');
  console.log('  - searchDiagnosis.runFullDiagnosis() - 运行完整诊断');
  console.log('  - searchDiagnosis.testSpecificKeyword("3798462") - 测试特定关键词');
  console.log('  - searchDiagnosis.checkSearchInputElement() - 检查搜索框元素');
}

// Node.js环境导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runFullDiagnosis,
    testSpecificKeyword,
    checkSearchInputElement,
    checkEventListeners,
    checkSearchFunctionConflicts,
    simulateEnterKeyPress,
    simulateSearchButtonClick,
    checkSearchResults
  };
}
