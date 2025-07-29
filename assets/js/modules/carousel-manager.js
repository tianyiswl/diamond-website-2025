/**
 * 🎠 轮播图管理模块
 * 从main.js中提取的轮播图功能
 * 提供完整的轮播图管理和交互功能
 */

// 轮播图配置和状态管理
const carouselConfig = {
    slides: [
        {
            category: 'turbocharger',
            title: '涡轮增压器',
            desc: '各类涡轮增压器总成，适用于汽车、卡车、工程机械等',
            image: 'assets/images/carousel/img1.jpg',
            placeholder: 'https://via.placeholder.com/1200x500/007bff/ffffff?text=涡轮增压器'
        },
        {
            category: 'actuator',
            title: '执行器',
            desc: '涡轮增压器执行器，控制涡轮增压器的工作状态',
            image: 'assets/images/carousel/img2.jpg',
            placeholder: 'https://via.placeholder.com/1200x500/28a745/ffffff?text=执行器'
        },
        {
            category: 'injector',
            title: '共轨喷油器',
            desc: '共轨喷油器、喷油嘴、高压油泵等柴油喷射系统部件',
            image: 'assets/images/carousel/img3.jpg',
            placeholder: 'https://via.placeholder.com/1200x500/17a2b8/ffffff?text=共轨喷油器'
        },
        {
            category: 'turbo-parts',
            title: '涡轮配件',
            desc: '涡轮增压器相关配件，包括密封圈、轴承、叶轮等精密部件',
            image: 'assets/images/carousel/img4.jpg',
            placeholder: 'https://via.placeholder.com/1200x500/ffc107/333333?text=涡轮配件'
        }
    ],
    autoPlayInterval: 8000, // 增加到8秒，减少切换频率
    currentSlide: 0
};

class CarouselManager {
    constructor(config) {
        this.config = config;
        this.slides = config.slides;
        this.currentSlide = config.currentSlide;
        this.totalSlides = config.slides.length;
        this.autoPlayInterval = null;
        this.isTransitioning = false; // 防止切换过程中的重复操作
        this.slideElements = []; // 缓存幻灯片元素
        this.preloadedImages = new Map(); // 图片预加载缓存

        // DOM元素
        this.container = document.querySelector('.carousel-container');
        this.indicatorsContainer = document.querySelector('.carousel-indicators');

        // 初始化
        this.init();
    }
    
    async init() {
        if (!this.container || !this.indicatorsContainer) {
            console.warn('⚠️ 轮播图容器未找到，跳过初始化');
            return;
        }

        // 清空现有内容
        this.container.innerHTML = '';
        this.indicatorsContainer.innerHTML = '';

        // 预加载所有图片
        await this.preloadImages();

        // 创建所有幻灯片（预创建，避免切换时重新创建）
        this.createAllSlides();

        // 显示当前幻灯片
        this.showSlide(this.currentSlide);

        // 创建指示器
        this.createIndicators();

        // 添加控制按钮
        this.createControls();

        // 启动自动播放
        this.startAutoPlay();

        // 绑定事件
        this.bindEvents();

        console.log('🎠 轮播图管理器初始化完成');
    }
    
    // 预加载所有图片
    async preloadImages() {
        console.log('🖼️ 开始预加载轮播图图片...');
        const loadPromises = this.slides.map(slide => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    this.preloadedImages.set(slide.image, img);
                    resolve();
                };
                img.onerror = () => {
                    // 如果主图片加载失败，预加载占位图
                    const placeholderImg = new Image();
                    placeholderImg.onload = () => {
                        this.preloadedImages.set(slide.image, placeholderImg);
                        resolve();
                    };
                    placeholderImg.onerror = () => resolve(); // 即使占位图失败也继续
                    placeholderImg.src = slide.placeholder;
                };
                img.src = slide.image;
            });
        });

        await Promise.all(loadPromises);
        console.log('✅ 轮播图图片预加载完成');
    }

    // 创建所有幻灯片（预创建，避免切换时重新创建DOM）
    createAllSlides() {
        this.slideElements = [];

        this.slides.forEach((slide, index) => {
            const slideElement = document.createElement('div');
            slideElement.className = 'carousel-slide';
            slideElement.style.opacity = '0';
            slideElement.style.transition = 'opacity 0.8s ease-in-out';
            slideElement.onclick = () => this.navigateToProducts(slide.category);

            // 获取轮播图内容
            const slideData = this.getSlideData(index);

            // 使用预加载的图片或占位图
            const imgSrc = this.preloadedImages.has(slide.image) ? slide.image : slide.placeholder;

            slideElement.innerHTML = `
                <img src="${imgSrc}" alt="${slideData.title}" class="slide-image"
                     style="opacity: 1; transition: opacity 0.3s ease;">
                <div class="slide-overlay">
                    <div class="slide-content">
                        <h2>${slideData.title}</h2>
                        <p>${slideData.description}</p>
                        <a href="pages/products.html?category=${slide.category}"
                           class="btn-primary"
                           onclick="event.stopPropagation();">${slideData.button}</a>
                    </div>
                </div>
            `;

            this.container.appendChild(slideElement);
            this.slideElements.push(slideElement);
        });
    }

    // 显示指定的幻灯片（平滑切换）
    showSlide(index) {
        if (this.slideElements.length === 0 || this.isTransitioning) return;

        this.isTransitioning = true;

        this.slideElements.forEach((slide, i) => {
            if (i === index) {
                slide.classList.add('active');
                slide.style.opacity = '1';
                slide.style.zIndex = '2';
            } else {
                slide.classList.remove('active');
                slide.style.opacity = '0';
                slide.style.zIndex = '1';
            }
        });

        // 切换完成后重置状态
        setTimeout(() => {
            this.isTransitioning = false;
        }, 800); // 与CSS过渡时间一致
    }

    // 获取轮播图数据（静态中文版本）
    getSlideData(index) {
        return {
            title: this.slides[index].title,
            description: this.slides[index].desc,
            button: '了解更多'
        };
    }
    
    createIndicators() {
        this.slides.forEach((_, index) => {
            const indicator = document.createElement('button');
            indicator.className = `indicator ${index === this.currentSlide ? 'active' : ''}`;
            indicator.onclick = () => this.goToSlide(index);
            this.indicatorsContainer.appendChild(indicator);
        });
    }
    
    createControls() {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'carousel-btn carousel-btn-prev';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.onclick = () => this.changeSlide(-1);
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'carousel-btn carousel-btn-next';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.onclick = () => this.changeSlide(1);
        
        this.container.appendChild(prevBtn);
        this.container.appendChild(nextBtn);
    }
    
    changeSlide(direction) {
        if (this.isTransitioning) return; // 防止切换过程中的重复操作

        this.currentSlide = (this.currentSlide + direction + this.totalSlides) % this.totalSlides;
        this.updateCarousel();
    }

    goToSlide(index) {
        if (index === this.currentSlide || this.isTransitioning) return;
        this.currentSlide = index;
        this.updateCarousel();
    }

    updateCarousel() {
        // 使用平滑的showSlide方法
        this.showSlide(this.currentSlide);

        // 更新指示器
        const indicators = this.indicatorsContainer.querySelectorAll('.indicator');
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentSlide);
        });
    }


    
    startAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
        }
        this.autoPlayInterval = setInterval(() => {
            this.changeSlide(1);
        }, this.config.autoPlayInterval);
    }
    
    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }
    
    navigateToProducts(category) {
        window.location.href = `pages/products.html?category=${category}`;
    }
    
    bindEvents() {
        // 鼠标悬停时暂停自动播放
        this.container.addEventListener('mouseenter', () => this.stopAutoPlay());
        this.container.addEventListener('mouseleave', () => this.startAutoPlay());
        
        // 触摸事件支持
        let touchStartX = 0;
        let touchEndX = 0;
        
        this.container.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            this.stopAutoPlay();
        }, { passive: true });
        
        this.container.addEventListener('touchmove', (e) => {
            touchEndX = e.touches[0].clientX;
        }, { passive: true });
        
        this.container.addEventListener('touchend', () => {
            const difference = touchStartX - touchEndX;
            if (Math.abs(difference) > 50) { // 最小滑动距离
                this.changeSlide(difference > 0 ? 1 : -1);
            }
            this.startAutoPlay();
        });
    }
    
    // 销毁轮播图
    destroy() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
        
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        if (this.indicatorsContainer) {
            this.indicatorsContainer.innerHTML = '';
        }
        
        console.log('🎠 轮播图管理器已销毁');
    }
}

// 全局函数用于兼容性
window.initializeCarousel = function() {
    if (typeof window.carouselManager !== 'undefined') {
        window.carouselManager.destroy();
    }
    
    window.carouselManager = new CarouselManager(carouselConfig);
    return window.carouselManager;
};

// 自动初始化（如果在首页）
document.addEventListener('DOMContentLoaded', function() {
    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        window.initializeCarousel();
    }
});

console.log('🎠 轮播图管理模块已加载'); 