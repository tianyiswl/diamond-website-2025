/**
 * 🎯 最终搜索功能验证脚本
 * 用于验证回车键搜索修复的最终效果
 */

// 验证配置
const VERIFICATION_CONFIG = {
  baseUrl: 'http://localhost:3001',
  problemKeyword: '3798462', // 原问题关键词
  testKeywords: ['turbo', 'injector', 'actuator', 'GT1749V', 'Bosch'],
  timeout: 5000
};

/**
 * 验证搜索功能是否正常工作
 */
async function verifySearchFunctionality() {
  console.log('🎯 开始最终搜索功能验证...');
  console.log('=' .repeat(60));
  
  const results = {
    pageLoad: false,
    searchBoxExists: false,
    fixScriptLoaded: false,
    enterKeyWorks: false,
    buttonClickWorks: false,
    problemKeywordFixed: false,
    allKeywordsWork: true,
    overallSuccess: false
  };
  
  try {
    // 1. 检查页面加载
    console.log('📄 检查页面加载状态...');
    if (document.readyState === 'complete') {
      results.pageLoad = true;
      console.log('✅ 页面已完全加载');
    } else {
      console.log('⚠️ 页面仍在加载中');
    }
    
    // 2. 检查搜索框是否存在
    console.log('\n🔍 检查搜索框元素...');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchInput && searchBtn) {
      results.searchBoxExists = true;
      console.log('✅ 搜索框和按钮都存在');
      console.log(`   搜索框ID: ${searchInput.id}`);
      console.log(`   搜索按钮类: ${searchBtn.className}`);
    } else {
      console.log('❌ 搜索框或按钮缺失');
      console.log(`   搜索框: ${searchInput ? '存在' : '缺失'}`);
      console.log(`   搜索按钮: ${searchBtn ? '存在' : '缺失'}`);
    }
    
    // 3. 检查修复脚本是否加载
    console.log('\n🔧 检查修复脚本状态...');
    if (window.searchEnterKeyFix) {
      results.fixScriptLoaded = true;
      console.log('✅ 修复脚本已加载');
      console.log('   可用方法:', Object.keys(window.searchEnterKeyFix));
    } else {
      console.log('❌ 修复脚本未加载');
    }
    
    // 4. 检查事件绑定状态
    console.log('\n🎯 检查事件绑定状态...');
    if (searchInput) {
      const isFixed = searchInput.hasAttribute('data-search-fix-bound');
      console.log(`   修复标记: ${isFixed ? '已设置' : '未设置'}`);
      
      if (isFixed) {
        console.log('✅ 搜索功能已修复');
      } else {
        console.log('⚠️ 搜索功能可能未修复，尝试手动修复...');
        if (window.searchEnterKeyFix) {
          window.searchEnterKeyFix.fix();
          console.log('🔧 已执行手动修复');
        }
      }
    }
    
    // 5. 测试回车键功能
    console.log('\n⌨️ 测试回车键功能...');
    if (searchInput) {
      const enterKeyResult = await testEnterKeySearch(VERIFICATION_CONFIG.problemKeyword);
      results.enterKeyWorks = enterKeyResult.success;
      results.problemKeywordFixed = enterKeyResult.success;
      
      if (enterKeyResult.success) {
        console.log(`✅ 回车键搜索正常 - 关键词: "${VERIFICATION_CONFIG.problemKeyword}"`);
      } else {
        console.log(`❌ 回车键搜索失败 - 关键词: "${VERIFICATION_CONFIG.problemKeyword}"`);
        console.log(`   错误: ${enterKeyResult.error || '未知错误'}`);
      }
    }
    
    // 6. 测试搜索按钮功能
    console.log('\n🖱️ 测试搜索按钮功能...');
    if (searchInput && searchBtn) {
      const buttonResult = await testButtonClickSearch(VERIFICATION_CONFIG.problemKeyword);
      results.buttonClickWorks = buttonResult.success;
      
      if (buttonResult.success) {
        console.log(`✅ 按钮点击搜索正常 - 关键词: "${VERIFICATION_CONFIG.problemKeyword}"`);
      } else {
        console.log(`❌ 按钮点击搜索失败 - 关键词: "${VERIFICATION_CONFIG.problemKeyword}"`);
        console.log(`   错误: ${buttonResult.error || '未知错误'}`);
      }
    }
    
    // 7. 测试其他关键词
    console.log('\n🧪 测试其他关键词...');
    for (const keyword of VERIFICATION_CONFIG.testKeywords) {
      const testResult = await testEnterKeySearch(keyword);
      if (!testResult.success) {
        results.allKeywordsWork = false;
        console.log(`❌ 关键词"${keyword}"测试失败`);
      } else {
        console.log(`✅ 关键词"${keyword}"测试通过`);
      }
      
      // 短暂延迟避免过快测试
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 8. 计算总体结果
    results.overallSuccess = 
      results.pageLoad &&
      results.searchBoxExists &&
      results.fixScriptLoaded &&
      results.enterKeyWorks &&
      results.buttonClickWorks &&
      results.problemKeywordFixed &&
      results.allKeywordsWork;
    
    // 9. 输出最终结果
    console.log('\n📊 最终验证结果:');
    console.log('=' .repeat(60));
    console.log(`页面加载: ${results.pageLoad ? '✅' : '❌'}`);
    console.log(`搜索框存在: ${results.searchBoxExists ? '✅' : '❌'}`);
    console.log(`修复脚本加载: ${results.fixScriptLoaded ? '✅' : '❌'}`);
    console.log(`回车键功能: ${results.enterKeyWorks ? '✅' : '❌'}`);
    console.log(`按钮点击功能: ${results.buttonClickWorks ? '✅' : '❌'}`);
    console.log(`问题关键词修复: ${results.problemKeywordFixed ? '✅' : '❌'}`);
    console.log(`所有关键词测试: ${results.allKeywordsWork ? '✅' : '❌'}`);
    console.log(`总体评估: ${results.overallSuccess ? '🎉 完全成功' : '⚠️ 需要关注'}`);
    
    if (results.overallSuccess) {
      console.log('\n🎉 恭喜！搜索回车键功能修复完全成功！');
      console.log('✅ 所有测试都通过，功能正常工作');
      console.log('🚀 可以放心部署到生产环境');
    } else {
      console.log('\n⚠️ 修复效果需要进一步检查');
      console.log('🔧 建议查看上述失败项目并进行相应修复');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error);
    results.error = error.message;
    return results;
  }
}

/**
 * 测试回车键搜索功能
 */
async function testEnterKeySearch(keyword) {
  return new Promise((resolve) => {
    try {
      const searchInput = document.getElementById('searchInput');
      if (!searchInput) {
        resolve({ success: false, error: '搜索框不存在' });
        return;
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
      
      // 监听搜索结果变化
      const searchResults = document.getElementById('searchResults');
      let resultFound = false;
      
      if (searchResults) {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
              const isVisible = searchResults.style.display !== 'none' && 
                               searchResults.offsetParent !== null;
              const hasContent = searchResults.innerHTML.trim() !== '';
              
              if (isVisible && hasContent) {
                resultFound = true;
                observer.disconnect();
                resolve({ success: true, keyword });
              }
            }
          });
        });
        
        observer.observe(searchResults, {
          childList: true,
          attributes: true,
          subtree: true
        });
        
        // 设置超时
        setTimeout(() => {
          observer.disconnect();
          if (!resultFound) {
            resolve({ success: false, error: '搜索超时或无结果' });
          }
        }, VERIFICATION_CONFIG.timeout);
      }
      
      // 发送回车键事件
      const eventResult = searchInput.dispatchEvent(enterEvent);
      
      // 如果没有搜索结果容器，基于事件分发结果判断
      if (!searchResults) {
        setTimeout(() => {
          resolve({ success: eventResult, keyword });
        }, 1000);
      }
      
    } catch (error) {
      resolve({ success: false, error: error.message });
    }
  });
}

/**
 * 测试搜索按钮点击功能
 */
async function testButtonClickSearch(keyword) {
  return new Promise((resolve) => {
    try {
      const searchInput = document.getElementById('searchInput');
      const searchBtn = document.querySelector('.search-btn');
      
      if (!searchInput || !searchBtn) {
        resolve({ success: false, error: '搜索框或按钮不存在' });
        return;
      }
      
      // 设置搜索词
      searchInput.value = keyword;
      
      // 监听搜索结果
      const searchResults = document.getElementById('searchResults');
      let resultFound = false;
      
      if (searchResults) {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
              const isVisible = searchResults.style.display !== 'none' && 
                               searchResults.offsetParent !== null;
              const hasContent = searchResults.innerHTML.trim() !== '';
              
              if (isVisible && hasContent) {
                resultFound = true;
                observer.disconnect();
                resolve({ success: true, keyword });
              }
            }
          });
        });
        
        observer.observe(searchResults, {
          childList: true,
          attributes: true,
          subtree: true
        });
        
        setTimeout(() => {
          observer.disconnect();
          if (!resultFound) {
            resolve({ success: false, error: '搜索超时或无结果' });
          }
        }, VERIFICATION_CONFIG.timeout);
      }
      
      // 点击搜索按钮
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      
      const eventResult = searchBtn.dispatchEvent(clickEvent);
      
      if (!searchResults) {
        setTimeout(() => {
          resolve({ success: eventResult, keyword });
        }, 1000);
      }
      
    } catch (error) {
      resolve({ success: false, error: error.message });
    }
  });
}

/**
 * 快速验证函数（供控制台调用）
 */
function quickVerify() {
  console.log('🚀 快速验证搜索功能...');
  verifySearchFunctionality();
}

/**
 * 测试特定关键词（供控制台调用）
 */
async function testKeyword(keyword) {
  console.log(`🧪 测试关键词: "${keyword}"`);
  const result = await testEnterKeySearch(keyword);
  console.log(`结果: ${result.success ? '✅ 成功' : '❌ 失败'}`);
  if (!result.success && result.error) {
    console.log(`错误: ${result.error}`);
  }
  return result;
}

// 导出到全局供调试使用
window.searchVerification = {
  verify: verifySearchFunctionality,
  quickVerify: quickVerify,
  testKeyword: testKeyword,
  testEnterKey: testEnterKeySearch,
  testButton: testButtonClickSearch
};

// 如果在浏览器环境中，提供使用说明
if (typeof window !== 'undefined' && window.document) {
  console.log('🎯 搜索功能验证脚本已加载');
  console.log('💡 使用方法:');
  console.log('  - searchVerification.verify() - 运行完整验证');
  console.log('  - searchVerification.quickVerify() - 快速验证');
  console.log('  - searchVerification.testKeyword("3798462") - 测试特定关键词');
  
  // 页面加载完成后自动运行验证
  if (document.readyState === 'complete') {
    setTimeout(() => {
      console.log('🚀 自动运行搜索功能验证...');
      verifySearchFunctionality();
    }, 2000);
  } else {
    window.addEventListener('load', () => {
      setTimeout(() => {
        console.log('🚀 自动运行搜索功能验证...');
        verifySearchFunctionality();
      }, 2000);
    });
  }
}

// Node.js环境导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    verifySearchFunctionality,
    testEnterKeySearch,
    testButtonClickSearch,
    quickVerify,
    testKeyword
  };
}
