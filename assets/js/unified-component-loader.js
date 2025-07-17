/**
 * 🔧 统一组件加载器
 * 替代原来分散在多个文件中的ComponentManager类
 * 确保所有页面都使用统一的组件管理系统
 */

// 检查是否已经加载了统一的ComponentManager
if (typeof window.componentManager === 'undefined') {
    console.log('🔄 初始化统一组件管理系统...');
    
    // 动态加载必要的服务
    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    // 确保CompanyService已加载
    const initializeServices = async () => {
        try {
            // 加载CompanyService（如果未加载）
            if (typeof CompanyService === 'undefined') {
                await loadScript('assets/js/modules/services/company-service.js');
            }
            
            // 初始化CompanyService（如果未初始化）
            if (!window.companyService) {
                window.companyService = new CompanyService();
                console.log('✅ CompanyService已初始化');
            }
            
            // 加载统一的ComponentManager（如果未加载）
            if (typeof ComponentManager === 'undefined') {
                await loadScript('assets/js/modules/components/component-manager.js');
            }
            
            // 初始化统一的ComponentManager
            if (!window.componentManager) {
                window.componentManager = new ComponentManager();
                console.log('✅ 统一ComponentManager已初始化');
            }
            
            return true;
        } catch (error) {
            console.error('❌ 服务初始化失败:', error);
            return false;
        }
    };

    // 🚫 已移除重复的DOMContentLoaded监听器
    // 现在使用统一的页面加载管理器处理组件加载

    // 使用统一页面加载管理器初始化服务
    if (window.PageLoadManager) {
        window.PageLoadManager.addToQueue('unified-component-loader', async function() {
            const success = await initializeServices();
            if (success) {
                console.log('🎉 统一组件系统初始化完成！');
            } else {
                console.warn('⚠️ 统一组件系统初始化失败，将使用备用方案');
            }
        }, ['domReady']);
    } else {
        // 备用方案：延迟执行
        setTimeout(async function() {
            if (window.PageLoadManager) {
                window.PageLoadManager.addToQueue('unified-component-loader', async function() {
                    const success = await initializeServices();
                    if (success) {
                        console.log('🎉 统一组件系统初始化完成！');
                    } else {
                        console.warn('⚠️ 统一组件系统初始化失败，将使用备用方案');
                    }
                }, ['domReady']);
            } else {
                console.warn('⚠️ 页面加载管理器未找到，直接初始化服务');
                await initializeServices();
            }
        }, 50);
    }
    
} else {
    console.log('✅ 统一组件管理系统已存在');
}

/**
 * 🔧 兼容性函数 - 确保旧代码仍能工作
 */

// 为了兼容性，提供全局函数
window.initializeComponentManager = async (isHomePage = false) => {
    if (window.componentManager) {
        return await window.componentManager.init(isHomePage);
    } else {
        console.warn('⚠️ ComponentManager未初始化');
        return false;
    }
};

// 渲染组件的兼容性函数
window.renderComponent = async (componentName, containerId, isHomePage = false) => {
    if (window.componentManager) {
        return await window.componentManager.renderComponent(componentName, containerId, isHomePage);
    } else {
        console.warn('⚠️ ComponentManager未初始化，无法渲染组件');
        return false;
    }
};

// 更新分类内容的兼容性函数
window.updateCategoryContent = async (isHomePage = false) => {
    if (window.componentManager) {
        return await window.componentManager.updateCategoryContent(isHomePage);
    } else {
        console.warn('⚠️ ComponentManager未初始化，无法更新分类内容');
        return false;
    }
};

console.log('📦 统一组件加载器已就绪'); 