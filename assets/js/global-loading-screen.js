/**
 * 🚫 全局加载屏幕已禁用
 * 此文件已被清空以移除加载动画功能
 */

// 创建空的GlobalLoadingScreen对象，防止其他脚本报错
window.GlobalLoadingScreen = {
    states: {
        domReady: true,
        i18nReady: true,
        componentsReady: true,
        contentReady: true,
        allReady: true
    },
    setState: function() {},
    hideLoadingScreen: function() {},
    forceHideLoadingScreen: function() {},
    init: function() {}
};

console.log('✅ 全局加载屏幕已禁用 - 占位对象已创建');
