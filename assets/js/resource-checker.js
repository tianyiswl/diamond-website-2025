
// 🔍 前端资源加载检测器
(function() {
    console.log('🔍 检测前端资源加载状态...');
    
    // 检测Font Awesome是否加载成功
    function checkFontAwesome() {
        const testElement = document.createElement('i');
        testElement.className = 'fas fa-home';
        testElement.style.position = 'absolute';
        testElement.style.left = '-9999px';
        document.body.appendChild(testElement);
        
        const computedStyle = window.getComputedStyle(testElement, '::before');
        const content = computedStyle.getPropertyValue('content');
        
        document.body.removeChild(testElement);
        
        if (content && content !== 'none' && content !== '""') {
            console.log('✅ Font Awesome 加载成功');
            return true;
        } else {
            console.log('❌ Font Awesome 加载失败');
            return false;
        }
    }
    
    // 检测CSS文件加载
    function checkCSSFiles() {
        const cssFiles = [
            './assets/css/font-awesome.min.css',
            './assets/css/main.css'
        ];
        
        let loadedCount = 0;
        
        cssFiles.forEach(cssFile => {
            const link = document.querySelector(`link[href="${cssFile}"]`);
            if (link) {
                console.log(`✅ CSS文件已引用: ${cssFile}`);
                loadedCount++;
            } else {
                console.log(`❌ CSS文件未引用: ${cssFile}`);
            }
        });
        
        return loadedCount === cssFiles.length;
    }
    
    // 页面加载完成后检测
    window.addEventListener('load', function() {
        setTimeout(function() {
            console.log('🔍 开始资源检测...');
            
            const fontAwesomeOk = checkFontAwesome();
            const cssFilesOk = checkCSSFiles();
            
            if (fontAwesomeOk && cssFilesOk) {
                console.log('🎉 所有前端资源加载成功！');
                
                // 显示成功提示
                const successDiv = document.createElement('div');
                successDiv.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: #10b981;
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    z-index: 1000;
                    opacity: 0.9;
                `;
                successDiv.textContent = '前端资源加载完成';
                document.body.appendChild(successDiv);
                
                setTimeout(() => {
                    if (successDiv.parentElement) {
                        successDiv.remove();
                    }
                }, 3000);
            } else {
                console.log('⚠️  部分前端资源加载失败');
            }
            
        }, 1000);
    });
})();
