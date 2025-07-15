/**
 * 🔍 产品页面搜索功能修复模块
 * 解决翻页后搜索框失效和搜索状态丢失的问题
 */

(function() {
    'use strict';
    
    console.log('🔧 产品页面搜索修复模块开始加载...');
    
    // 等待DOM完全加载
    function waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', resolve);
            }
        });
    }
    
    // 等待搜索框元素出现
    function waitForProductSearchInput() {
        return new Promise((resolve) => {
            const checkForElement = () => {
                const productSearch = document.getElementById('productSearch');
                if (productSearch) {
                    console.log('✅ 找到产品搜索框元素:', productSearch);
                    resolve(productSearch);
                } else {
                    console.log('⏳ 产品搜索框元素未找到，0.1秒后重试...');
                    setTimeout(checkForElement, 100);
                }
            };
            checkForElement();
        });
    }
    
    // 获取URL参数
    function getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
    
    // 更新URL参数
    function updateUrlParameter(key, value) {
        const url = new URL(window.location);
        if (value && value.trim()) {
            url.searchParams.set(key, value);
        } else {
            url.searchParams.delete(key);
        }
        // 移除页码参数，因为搜索后应该回到第一页
        if (key === 'search') {
            url.searchParams.delete('page');
        }
        window.history.replaceState({}, '', url);
    }
    
    // 修复分页链接，保持搜索状态
    function fixPaginationLinks() {
        const searchTerm = getUrlParameter('search');
        if (!searchTerm) return;
        
        const paginationLinks = document.querySelectorAll('#pagination a[href*="?page="]');
        paginationLinks.forEach(link => {
            const url = new URL(link.href);
            url.searchParams.set('search', searchTerm);
            link.href = url.toString();
        });
        
        console.log(`✅ 已修复 ${paginationLinks.length} 个分页链接，保持搜索状态: "${searchTerm}"`);
    }
    
    // 搜索产品并更新URL
    function searchProductsWithUrl(searchTerm) {
        console.log('🔍 产品搜索修复模块 - 执行搜索:', searchTerm);
        
        // 更新URL参数
        updateUrlParameter('search', searchTerm);
        
        // 调用原有的搜索函数
        if (typeof window.searchProducts === 'function') {
            window.searchProducts(searchTerm);
        } else {
            console.error('❌ 未找到 searchProducts 函数');
        }
        
        // 延迟修复分页链接，等待分页渲染完成
        setTimeout(fixPaginationLinks, 100);
    }
    
    // 恢复搜索状态
    function restoreSearchState() {
        const searchTerm = getUrlParameter('search');
        if (searchTerm) {
            console.log('🔄 恢复搜索状态:', searchTerm);
            
            // 恢复搜索框的值
            const productSearch = document.getElementById('productSearch');
            if (productSearch) {
                productSearch.value = searchTerm;
                console.log('✅ 搜索框值已恢复:', searchTerm);
            }
            
            // 执行搜索（不更新URL，避免循环）
            if (typeof window.searchProducts === 'function') {
                window.searchProducts(searchTerm);
                console.log('✅ 搜索状态已恢复');
            }
            
            // 修复分页链接
            setTimeout(fixPaginationLinks, 500);
        }
    }
    
    // 绑定搜索事件
    async function bindProductSearchEvents() {
        try {
            console.log('🔧 开始绑定产品搜索事件...');
            
            // 等待DOM和搜索框元素
            await waitForDOM();
            const productSearch = await waitForProductSearchInput();
            
            // 移除可能存在的旧事件监听器
            if (window.productSearchKeypress) {
                productSearch.removeEventListener('keypress', window.productSearchKeypress);
                console.log('🧹 已移除旧的产品搜索回车键事件监听器');
            }
            
            if (window.productSearchInput) {
                productSearch.removeEventListener('input', window.productSearchInput);
                console.log('🧹 已移除旧的产品搜索输入事件监听器');
            }
            
            // 创建新的回车键事件监听器
            window.productSearchKeypress = function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    console.log('🔍 产品搜索修复模块 - 回车键触发');
                    searchProductsWithUrl(productSearch.value);
                }
            };
            
            // 创建新的输入事件监听器（实时搜索）
            let searchTimeout;
            window.productSearchInput = function(e) {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    console.log('🔍 产品搜索修复模块 - 实时搜索触发');
                    searchProductsWithUrl(e.target.value);
                }, 300); // 300ms 防抖
            };
            
            // 绑定新的事件监听器
            productSearch.addEventListener('keypress', window.productSearchKeypress);
            productSearch.addEventListener('input', window.productSearchInput);
            
            console.log('✅ 产品搜索回车键和实时搜索事件绑定成功');
            
            // 恢复搜索状态
            restoreSearchState();
            
            // 监听分页渲染完成事件，修复分页链接
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        const addedNodes = Array.from(mutation.addedNodes);
                        const hasPagination = addedNodes.some(node => 
                            node.nodeType === 1 && 
                            (node.id === 'pagination' || node.querySelector('#pagination'))
                        );
                        
                        if (hasPagination) {
                            console.log('🔄 检测到分页更新，修复分页链接...');
                            setTimeout(fixPaginationLinks, 50);
                        }
                    }
                });
            });
            
            const paginationContainer = document.getElementById('pagination');
            if (paginationContainer) {
                observer.observe(paginationContainer, {
                    childList: true,
                    subtree: true
                });
                console.log('✅ 分页链接监听器已启动');
            }
            
            console.log('✅ 产品搜索修复模块 - 所有事件绑定完成');
            
        } catch (error) {
            console.error('❌ 绑定产品搜索事件时出错:', error);
        }
    }
    
    // 初始化搜索修复功能
    async function initProductSearchFix() {
        try {
            console.log('🚀 初始化产品搜索修复功能...');
            await bindProductSearchEvents();
            console.log('✅ 产品搜索修复模块初始化完成');
        } catch (error) {
            console.error('❌ 产品搜索修复模块初始化失败:', error);
        }
    }
    
    // 启动修复模块
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProductSearchFix);
    } else {
        initProductSearchFix();
    }
    
})(); 