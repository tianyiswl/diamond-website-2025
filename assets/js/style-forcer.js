
// 🎯 样式强制加载器
(function() {
    console.log('🎯 强制加载样式修复...');
    
    // 强制应用图标样式
    function forceIconStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .bi-speedometer2::before { content: "📊" !important; }
            .bi-box-seam::before { content: "📦" !important; }
            .bi-plus-circle::before { content: "➕" !important; }
            .bi-tags::before { content: "🏷️" !important; }
            .bi-clock-history::before { content: "📝" !important; }
            .bi-chat-dots::before { content: "💬" !important; }
            .bi-building::before { content: "🏢" !important; }
            .bi-people::before { content: "👥" !important; }
            .bi-shield-lock::before { content: "🔒" !important; }
            .bi-box-arrow-right::before { content: "🚪" !important; }
            .bi-key::before { content: "🔑" !important; }
            .bi-eye::before { content: "👁" !important; }
            .bi-eye-slash::before { content: "🙈" !important; }
            .bi-cursor::before { content: "👆" !important; }
            .bi-graph-up::before { content: "📈" !important; }
            .bi-fire::before { content: "🔥" !important; }
            .bi-arrow-clockwise::before { content: "🔄" !important; }
            
            .bi::before,
            [class^="bi-"]::before,
            [class*=" bi-"]::before {
                display: inline-block !important;
                font-style: normal !important;
                font-weight: normal !important;
                margin-right: 0.25rem !important;
                font-size: 1.2em !important;
            }
        `;
        document.head.appendChild(style);
        console.log('✅ 强制样式已应用');
    }
    
    // 页面加载后立即应用
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forceIconStyles);
    } else {
        forceIconStyles();
    }
    
    // 额外保险，延迟再次应用
    setTimeout(forceIconStyles, 1000);
    
})();
