/**
 * 🔍 LOGO白色框修复验证脚本
 * 自动检测和验证加载动画LOGO的样式修复效果
 */

console.log('🔍 开始验证LOGO白色框修复效果...');

// 验证函数
function verifyLogoFix() {
    const results = {
        cssLoaded: false,
        logoFound: false,
        stylesCorrect: false,
        whiteBoxRemoved: true,
        issues: []
    };
    
    // 1. 检查CSS文件是否加载
    const stylesheets = Array.from(document.styleSheets);
    results.cssLoaded = stylesheets.some(sheet => 
        sheet.href && sheet.href.includes('loading-screen-fix.css')
    );
    
    console.log(`🎨 CSS文件加载: ${results.cssLoaded ? '✅' : '❌'}`);
    
    // 2. 查找LOGO元素
    const logoSelectors = [
        '.loading-logo-img',
        '.global-loading-screen .loading-logo-img',
        'img.loading-logo-img'
    ];
    
    let logoElement = null;
    for (const selector of logoSelectors) {
        logoElement = document.querySelector(selector);
        if (logoElement) {
            results.logoFound = true;
            console.log(`🖼️ 找到LOGO元素: ${selector}`);
            break;
        }
    }
    
    if (!logoElement) {
        console.log('ℹ️ 当前页面未找到加载动画LOGO元素（可能已隐藏）');
        return results;
    }
    
    // 3. 检查样式
    const computedStyle = window.getComputedStyle(logoElement);
    const borderRadius = computedStyle.getPropertyValue('border-radius');
    const boxShadow = computedStyle.getPropertyValue('box-shadow');
    const backgroundColor = computedStyle.getPropertyValue('background-color');
    const border = computedStyle.getPropertyValue('border');
    
    console.log('🎯 LOGO样式检查:');
    console.log(`  border-radius: ${borderRadius}`);
    console.log(`  box-shadow: ${boxShadow}`);
    console.log(`  background-color: ${backgroundColor}`);
    console.log(`  border: ${border}`);
    
    // 4. 验证是否移除了白色框
    const hasWhiteBox = 
        (borderRadius !== '0px' && borderRadius !== 'none' && borderRadius !== '') ||
        (boxShadow !== 'none' && boxShadow !== '') ||
        (backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent' && backgroundColor !== '');
    
    results.whiteBoxRemoved = !hasWhiteBox;
    results.stylesCorrect = borderRadius === '0px' && boxShadow === 'none';
    
    // 5. 输出结果
    console.log('\n🎯 ===== LOGO白色框修复验证结果 =====');
    console.log(`📊 CSS文件加载: ${results.cssLoaded ? '✅' : '❌'}`);
    console.log(`🖼️ LOGO元素发现: ${results.logoFound ? '✅' : 'ℹ️ 未显示'}`);
    console.log(`🎯 样式应用正确: ${results.stylesCorrect ? '✅' : '❌'}`);
    console.log(`🚫 白色框已移除: ${results.whiteBoxRemoved ? '✅' : '❌'}`);
    
    const overallSuccess = results.cssLoaded && results.whiteBoxRemoved;
    console.log(`\n🎉 总体状态: ${overallSuccess ? '✅ 修复成功！' : '❌ 需要进一步处理'}`);
    
    if (overallSuccess) {
        console.log('🎊 恭喜！LOGO白色框问题已成功修复！');
        console.log('📋 建议进行以下最终测试:');
        console.log('  1. 刷新页面多次，确认效果稳定');
        console.log('  2. 在不同浏览器中测试');
        console.log('  3. 检查移动端显示效果');
        console.log('  4. 对比所有页面的一致性');
    }
    
    console.log('=====================================\n');
    
    return results;
}

// 页面加载完成后自动验证
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', verifyLogoFix);
} else {
    verifyLogoFix();
}

// 也在window load事件后再次验证
window.addEventListener('load', () => {
    setTimeout(verifyLogoFix, 1000);
});

// 暴露到全局，方便手动调用
window.verifyLogoFix = verifyLogoFix;

console.log('✅ LOGO白色框修复验证脚本已加载');
console.log('💡 可以调用 verifyLogoFix() 手动触发验证');
