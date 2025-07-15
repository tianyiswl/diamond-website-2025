/**
 * 🔧 工具函数模块
 * 从main.js中提取的通用工具函数
 * 提供防抖、验证、通知等实用功能
 */

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 邮箱验证
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 电话号码验证
function isValidPhone(phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(phone);
}

// 显示通知
function showNotification(message, type = 'info') {
    // 移除现有通知
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // 通知样式
    const styles = {
        info: { bg: '#d1ecf1', color: '#0c5460', border: '#bee5eb' },
        success: { bg: '#d4edda', color: '#155724', border: '#c3e6cb' },
        warning: { bg: '#fff3cd', color: '#856404', border: '#ffeaa7' },
        error: { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' }
    };
    
    const style = styles[type] || styles.info;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${style.bg};
        color: ${style.color};
        border: 1px solid ${style.border};
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 400px;
        font-size: 14px;
        line-height: 1.4;
        animation: slideInRight 0.3s ease-out;
    `;
    
    // 通知内容
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()" 
                    style="background: none; border: none; color: inherit; cursor: pointer; font-size: 14px; padding: 5px; border-radius: 3px; margin-left: 10px;">
                ✕
            </button>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 自动移除
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// 移动端菜单切换
function toggleMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    
    if (mobileMenu) {
        mobileMenu.classList.toggle('active');
    }
    
    if (menuBtn) {
        menuBtn.classList.toggle('active');
    }
}

// 返回顶部按钮初始化
function initBackToTopButton() {
    // 创建返回顶部按钮
    const backToTopBtn = document.createElement('button');
    backToTopBtn.id = 'backToTop';
    backToTopBtn.className = 'back-to-top-btn';
    backToTopBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    backToTopBtn.setAttribute('aria-label', '返回顶部');
    
    // 按钮样式
    backToTopBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        box-shadow: 0 4px 12px rgba(0,123,255,0.3);
        transition: all 0.3s ease;
        z-index: 1000;
    `;
    
    // 添加到页面
    document.body.appendChild(backToTopBtn);
    
    // 点击事件
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // 滚动显示/隐藏
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                backToTopBtn.style.display = 'none';
            } else {
                backToTopBtn.style.display = 'flex';
            }
        });
    }, observerOptions);
    
    // 观察页面顶部区域
    const topSection = document.querySelector('header') || document.body.firstElementChild;
    if (topSection) {
        observer.observe(topSection);
    }
    
    console.log('🔝 返回顶部按钮已初始化');
}

// WhatsApp询价
function sendWhatsAppInquiry(formData) {
    const whatsappNumber = '8613656157230'; // 默认WhatsApp号码
    
    const message = `您好！我想了解以下产品信息：
    
📧 联系邮箱: ${formData.email || '未提供'}
📱 联系电话: ${formData.phone || '未提供'}
🏢 公司名称: ${formData.company || '未提供'}
💬 询价内容: ${formData.message || '未提供'}
    
请提供详细的产品信息和报价。谢谢！`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
}

// 显示备用联系方式
function showAlternativeContact() {
    const alternatives = `
        <div style="text-align: left;">
            <h4 style="margin-bottom: 15px; color: #2c3e50;">📞 其他联系方式</h4>
            <div style="margin-bottom: 10px;">
                <strong>📧 邮箱:</strong> 
                <a href="mailto:info@diamond-company.com" style="color: #007bff; text-decoration: none;">
                    info@diamond-company.com
                </a>
            </div>
            <div style="margin-bottom: 10px;">
                <strong>📱 电话:</strong> 
                <a href="tel:+8613656157230" style="color: #007bff; text-decoration: none;">
                    +86 136 5615 7230
                </a>
            </div>
            <div style="margin-bottom: 10px;">
                <strong>💬 微信:</strong> 
                <span style="color: #666;">diamond_auto_parts</span>
            </div>
            <div style="margin-bottom: 15px;">
                <strong>🏢 地址:</strong> 
                <span style="color: #666;">江苏省无锡市</span>
            </div>
            <div style="text-align: center;">
                <a href="https://wa.me/8613656157230" target="_blank" 
                   style="display: inline-block; background: #25d366; color: white; padding: 10px 20px; 
                          text-decoration: none; border-radius: 5px; margin: 5px;">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </a>
            </div>
        </div>
    `;
    
    showNotification(alternatives, 'info');
}

// 格式化日期
function formatDate(date) {
    if (!date) return '';
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// 格式化时间
function formatTime(date) {
    if (!date) return '';
    
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 生成随机ID
function generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 导出函数（用于模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        debounce,
        isValidEmail,
        isValidPhone,
        showNotification,
        toggleMobileMenu,
        initBackToTopButton,
        sendWhatsAppInquiry,
        showAlternativeContact,
        formatDate,
        formatTime,
        formatFileSize,
        generateId
    };
}

// 全局函数（用于兼容性）
window.debounce = debounce;
window.isValidEmail = isValidEmail;
window.isValidPhone = isValidPhone;
window.showNotification = showNotification;
window.toggleMobileMenu = toggleMobileMenu;
window.initBackToTopButton = initBackToTopButton;
window.sendWhatsAppInquiry = sendWhatsAppInquiry;
window.showAlternativeContact = showAlternativeContact;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.formatFileSize = formatFileSize;
window.generateId = generateId;

console.log('🔧 工具函数模块已加载'); 