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
    autoPlayInterval: 5000,
    currentSlide: 0
};

class CarouselManager {
    constructor(config) {
        this.config = config;
        this.slides = config.slides;
        this.currentSlide = config.currentSlide;
        this.totalSlides = config.slides.length;
        this.autoPlayInterval = null;
        
        // DOM元素
        this.container = document.querySelector('.carousel-container');
        this.indicatorsContainer = document.querySelector('.carousel-indicators');
        
        // 初始化
        this.init();
    }
    
    init() {
        if (!this.container || !this.indicatorsContainer) {
            console.warn('⚠️ 轮播图容器未找到，跳过初始化');
            return;
        }
        
        // 清空现有内容
        this.container.innerHTML = '';
        this.indicatorsContainer.innerHTML = '';
        
        // 创建初始幻灯片
        this.createSlide(this.currentSlide);
        
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
    
    createSlide(index) {
        const slide = this.slides[index];
        const slideElement = document.createElement('div');
        slideElement.className = 'carousel-slide active';
        slideElement.onclick = () => this.navigateToProducts(slide.category);

        // 🌍 使用国际化系统获取轮播图内容
        const slideData = this.getSlideData(index);

        slideElement.innerHTML = `
            <img src="${slide.image}" alt="${slideData.title}" class="slide-image"
                 onerror="this.src='${slide.placeholder}'">
            <div class="slide-overlay">
                <div class="slide-content">
                    <h2 data-i18n="hero.slides.${index}.title">${slideData.title}</h2>
                    <p data-i18n="hero.slides.${index}.description">${slideData.description}</p>
                    <a href="pages/products.html?category=${slide.category}"
                       class="btn-primary"
                       data-i18n="hero.slides.${index}.button"
                       onclick="event.stopPropagation();">${slideData.button}</a>
                </div>
            </div>
        `;
        
        // 移除现有幻灯片
        const currentSlide = this.container.querySelector('.carousel-slide');
        if (currentSlide) {
            currentSlide.classList.remove('active');
            setTimeout(() => currentSlide.remove(), 300); // 等待过渡动画完成
        }
        
        // 添加新幻灯片
        this.container.appendChild(slideElement);

        // 🌍 处理新创建幻灯片的多语言元素
        if (window.i18n && window.i18n.processElements) {
            window.i18n.processElements(slideElement);
        }

        setTimeout(() => slideElement.classList.add('active'), 50);
    }

    // 🌍 获取国际化的轮播图数据
    getSlideData(index) {
        // 如果i18n系统可用，使用翻译
        if (window.i18n && window.i18n.initialized) {
            const slideData = window.i18n.t(`hero.slides.${index}`);
            if (slideData && typeof slideData === 'object') {
                return {
                    title: slideData.title || this.slides[index].title,
                    description: slideData.description || this.slides[index].desc,
                    button: slideData.button || '了解更多'
                };
            }
        }

        // 回退到默认数据
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
        this.currentSlide = (this.currentSlide + direction + this.totalSlides) % this.totalSlides;
        this.updateCarousel();
    }
    
    goToSlide(index) {
        if (index === this.currentSlide) return;
        this.currentSlide = index;
        this.updateCarousel();
    }
    
    updateCarousel() {
        // 更新幻灯片
        this.createSlide(this.currentSlide);

        // 更新指示器
        const indicators = this.indicatorsContainer.querySelectorAll('.indicator');
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentSlide);
        });
    }

    // 🌍 更新轮播图内容（用于语言切换）
    updateSlides() {
        // 重新创建当前幻灯片以应用新的翻译
        this.createSlide(this.currentSlide);
        console.log('🎠 轮播图内容已更新');
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