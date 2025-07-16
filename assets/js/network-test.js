
// 🌐 网络速度测试
(function() {
    console.log('🌐 开始网络速度测试...');
    
    const testUrls = [
        '../assets/css/bootstrap.min.css',
        '../assets/css/bootstrap-icons.css',
        '../assets/js/bootstrap.bundle.min.js',
        '../assets/js/echarts.min.js'
    ];
    
    let loadedCount = 0;
    const startTime = performance.now();
    
    testUrls.forEach((url, index) => {
        const startTime = performance.now();
        
        fetch(url, { cache: 'no-cache' })
            .then(response => {
                const endTime = performance.now();
                const loadTime = endTime - startTime;
                
                if (response.ok) {
                    console.log(`✅ ${url}: ${loadTime.toFixed(2)}ms`);
                } else {
                    console.log(`❌ ${url}: HTTP ${response.status}`);
                }
                
                loadedCount++;
                if (loadedCount === testUrls.length) {
                    const totalTime = performance.now() - startTime;
                    console.log(`🎉 所有资源测试完成，总耗时: ${totalTime.toFixed(2)}ms`);
                }
            })
            .catch(error => {
                console.log(`💥 ${url}: ${error.message}`);
                loadedCount++;
            });
    });
})();
