
// 🎨 样式加载检测器
(function() {
    console.log('🎨 开始检测样式加载状态...');
    
    // 检测CSS文件是否加载成功
    function checkCSSLoaded() {
        const stylesheets = document.styleSheets;
        let loadedCount = 0;
        let totalCount = stylesheets.length;
        
        for (let i = 0; i < stylesheets.length; i++) {
            try {
                const sheet = stylesheets[i];
                if (sheet.cssRules || sheet.rules) {
                    loadedCount++;
                    console.log('✅ CSS加载成功:', sheet.href || 'inline styles');
                } else {
                    console.log('❌ CSS加载失败:', sheet.href || 'inline styles');
                }
            } catch (e) {
                console.log('⚠️  CSS访问受限:', stylesheets[i].href);
            }
        }
        
        console.log(`📊 CSS加载统计: ${loadedCount}/${totalCount}`);
        return loadedCount === totalCount;
    }
    
    // 检测字体是否加载成功
    function checkFontLoaded() {
        const testElement = document.createElement('span');
        testElement.className = 'bi-speedometer2';
        testElement.style.position = 'absolute';
        testElement.style.left = '-9999px';
        document.body.appendChild(testElement);
        
        const computedStyle = window.getComputedStyle(testElement, '::before');
        const content = computedStyle.getPropertyValue('content');
        
        document.body.removeChild(testElement);
        
        if (content && content !== 'none' && content !== '""') {
            console.log('✅ Bootstrap Icons字体加载成功');
            return true;
        } else {
            console.log('❌ Bootstrap Icons字体加载失败，使用备用图标');
            return false;
        }
    }
    
    // 页面加载完成后检测
    window.addEventListener('load', function() {
        setTimeout(function() {
            console.log('🔍 开始样式检测...');
            
            const cssLoaded = checkCSSLoaded();
            const fontLoaded = checkFontLoaded();
            
            if (cssLoaded && fontLoaded) {
                console.log('🎉 所有样式资源加载成功！');
            } else {
                console.log('⚠️  部分样式资源加载失败，但已有备用方案');
            }
            
            // 显示加载状态
            const statusDiv = document.createElement('div');
            statusDiv.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: ${cssLoaded && fontLoaded ? '#10b981' : '#f59e0b'};
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                z-index: 1000;
                opacity: 0.9;
            `;
            statusDiv.textContent = cssLoaded && fontLoaded ? '样式加载完成' : '使用备用样式';
            document.body.appendChild(statusDiv);
            
            // 3秒后自动隐藏
            setTimeout(() => {
                if (statusDiv.parentElement) {
                    statusDiv.remove();
                }
            }, 3000);
            
        }, 1000);
    });
})();
