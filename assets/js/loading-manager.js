
// 🚀 管理后台加载状态管理
(function() {
    // 显示加载遮罩
    function showLoading(message = '加载中...', tip = '请稍候，正在加载资源...') {
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">${message}</div>
                <div class="loading-tip">${tip}</div>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    // 隐藏加载遮罩
    function hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
    
    // 检测网络速度
    function detectNetworkSpeed() {
        const startTime = performance.now();
        const img = new Image();
        img.onload = function() {
            const endTime = performance.now();
            const loadTime = endTime - startTime;
            
            if (loadTime > 3000) {
                showNetworkWarning();
            }
        };
        img.src = '../assets/images/logo/diamond-logo.png?' + Math.random();
    }
    
    // 显示网络慢警告
    function showNetworkWarning() {
        const warning = document.createElement('div');
        warning.className = 'network-slow-warning';
        warning.innerHTML = `
            <strong>网络较慢</strong><br>
            正在优化加载速度，请耐心等待...
            <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; color: #92400e; cursor: pointer;">×</button>
        `;
        document.body.appendChild(warning);
        
        // 5秒后自动隐藏
        setTimeout(() => {
            if (warning.parentElement) {
                warning.remove();
            }
        }, 5000);
    }
    
    // 页面开始加载时显示
    showLoading('管理后台加载中...', '正在加载样式和脚本文件...');
    
    // 页面加载完成后隐藏
    window.addEventListener('load', function() {
        setTimeout(hideLoading, 1000);
    });
    
    // 检测网络速度
    detectNetworkSpeed();
    
    // 暴露全局函数
    window.showLoading = showLoading;
    window.hideLoading = hideLoading;
})();
