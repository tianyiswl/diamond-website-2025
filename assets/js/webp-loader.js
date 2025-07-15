// WebP图片支持检测和加载
class WebPImageLoader {
    constructor() {
        this.webpSupported = null;
        this.webpImageMap = new Map(); // 缓存WebP图片映射
        this.init();
    }

    // 检测浏览器WebP支持
    async detectWebPSupport() {
        if (this.webpSupported !== null) {
            return this.webpSupported;
        }

        return new Promise((resolve) => {
            const webp = new Image();
            webp.onload = webp.onerror = () => {
                this.webpSupported = (webp.height === 2);
                resolve(this.webpSupported);
            };
            webp.src = "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA";
        });
    }

    // 获取WebP版本的图片路径
    getWebPPath(originalPath) {
        // 如果是原始路径，转换为WebP路径
        if (originalPath.includes('/assets/images/') && !originalPath.includes('/assets/images-webp/')) {
            return originalPath
                .replace('/assets/images/', '/assets/images-webp/')
                .replace(/\.(jpg|jpeg|png)$/i, '.webp');
        }
        return originalPath;
    }

    // 智能加载图片（WebP优先，回退到原格式）
    async loadImage(originalPath, imgElement) {
        const webpSupported = await this.detectWebPSupport();
        
        if (webpSupported) {
            const webpPath = this.getWebPPath(originalPath);
            
            // 检查WebP文件是否存在
            return new Promise((resolve) => {
                const testImg = new Image();
                testImg.onload = () => {
                    imgElement.src = webpPath;
                    imgElement.setAttribute('data-format', 'webp');
                    resolve(true);
                };
                testImg.onerror = () => {
                    // WebP不存在，使用原格式
                    imgElement.src = originalPath;
                    imgElement.setAttribute('data-format', 'original');
                    resolve(false);
                };
                testImg.src = webpPath;
            });
        } else {
            // 浏览器不支持WebP，使用原格式
            imgElement.src = originalPath;
            imgElement.setAttribute('data-format', 'original');
            return false;
        }
    }

    // 批量处理页面中的所有图片
    async processAllImages() {
        const images = document.querySelectorAll('img[data-src], img[src]');
        const promises = [];

        images.forEach(img => {
            const originalSrc = img.getAttribute('data-src') || img.src;
            if (originalSrc && !img.hasAttribute('data-webp-processed')) {
                img.setAttribute('data-webp-processed', 'true');
                promises.push(this.loadImage(originalSrc, img));
            }
        });

        await Promise.all(promises);
        console.log(`✅ 已处理 ${images.length} 张图片的WebP优化`);
    }

    // 初始化
    async init() {
        await this.detectWebPSupport();
        console.log(`🎨 浏览器WebP支持: ${this.webpSupported ? '✅ 支持' : '❌ 不支持'}`);
        
        // 页面加载完成后处理图片
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.processAllImages());
        } else {
            await this.processAllImages();
        }
    }
}

// 全局WebP加载器实例
window.webpLoader = new WebPImageLoader();