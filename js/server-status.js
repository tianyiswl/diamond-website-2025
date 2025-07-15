/**
 * 服务器状态监控脚本
 * 用于检测服务器启动状态和性能监控
 */

class ServerStatusMonitor {
    constructor() {
        this.isServerReady = false;
        this.retryCount = 0;
        this.maxRetries = 10;
        this.retryInterval = 1000; // 1秒
        this.statusCheckInterval = null;
        
        this.init();
    }

    init() {
        // 页面加载时开始检查服务器状态
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.startStatusCheck());
        } else {
            this.startStatusCheck();
        }
    }

    startStatusCheck() {
        console.log('🔍 开始检查服务器状态...');
        this.showLoadingIndicator();
        this.checkServerStatus();
    }

    async checkServerStatus() {
        try {
            const response = await fetch('/api/status', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });

            if (response.ok) {
                const data = await response.json();
                this.handleServerReady(data);
            } else {
                throw new Error(`服务器响应错误: ${response.status}`);
            }
        } catch (error) {
            console.warn(`服务器状态检查失败 (${this.retryCount + 1}/${this.maxRetries}):`, error.message);
            this.handleServerNotReady();
        }
    }

    handleServerReady(statusData) {
        this.isServerReady = true;
        this.retryCount = 0;
        
        console.log('✅ 服务器已就绪:', statusData);
        this.hideLoadingIndicator();
        
        // 触发自定义事件，通知其他组件服务器已就绪
        document.dispatchEvent(new CustomEvent('serverReady', {
            detail: statusData
        }));

        // 显示服务器信息（可选）
        this.displayServerInfo(statusData);
    }

    handleServerNotReady() {
        this.retryCount++;
        
        if (this.retryCount < this.maxRetries) {
            // 继续重试
            setTimeout(() => this.checkServerStatus(), this.retryInterval);
            this.updateLoadingMessage(`正在启动服务器... (${this.retryCount}/${this.maxRetries})`);
        } else {
            // 达到最大重试次数
            console.error('❌ 服务器启动超时');
            this.showErrorMessage();
        }
    }

    showLoadingIndicator() {
        // 创建加载指示器
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'server-loading-indicator';
        loadingDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                color: white;
                font-family: Arial, sans-serif;
            ">
                <div style="text-align: center;">
                    <div style="
                        width: 50px;
                        height: 50px;
                        border: 3px solid #f3f3f3;
                        border-top: 3px solid #3498db;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 20px;
                    "></div>
                    <div id="loading-message">正在启动服务器...</div>
                    <div style="margin-top: 10px; font-size: 14px; opacity: 0.8;">
                        请稍候，首次启动可能需要几秒钟
                    </div>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        document.body.appendChild(loadingDiv);
    }

    updateLoadingMessage(message) {
        const messageElement = document.getElementById('loading-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }

    hideLoadingIndicator() {
        const loadingDiv = document.getElementById('server-loading-indicator');
        if (loadingDiv) {
            loadingDiv.style.opacity = '0';
            loadingDiv.style.transition = 'opacity 0.5s ease-out';
            setTimeout(() => {
                loadingDiv.remove();
            }, 500);
        }
    }

    showErrorMessage() {
        const loadingDiv = document.getElementById('server-loading-indicator');
        if (loadingDiv) {
            loadingDiv.innerHTML = `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.9);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                    color: white;
                    font-family: Arial, sans-serif;
                ">
                    <div style="text-align: center; max-width: 400px; padding: 20px;">
                        <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                        <h2 style="margin: 0 0 15px 0; color: #e74c3c;">服务器启动超时</h2>
                        <p style="margin: 0 0 20px 0; line-height: 1.5;">
                            服务器可能正在处理大量数据或遇到了问题。<br>
                            请稍后刷新页面重试。
                        </p>
                        <button onclick="location.reload()" style="
                            background: #3498db;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 16px;
                        ">刷新页面</button>
                    </div>
                </div>
            `;
        }
    }

    displayServerInfo(statusData) {
        // 在控制台显示服务器信息
        console.group('🖥️ 服务器状态信息');
        console.log('启动时间:', statusData.data.server.started_at);
        console.log('运行时长:', Math.round(statusData.data.server.uptime), '秒');
        console.log('端口:', statusData.data.server.port);
        console.log('环境:', statusData.data.server.environment);
        console.log('Node.js版本:', statusData.data.system.node_version);
        console.log('平台:', statusData.data.system.platform);
        console.groupEnd();

        // 可选：在页面上显示简单的状态指示器
        this.createStatusIndicator(statusData);
    }

    createStatusIndicator(statusData) {
        // 创建一个小的状态指示器
        const indicator = document.createElement('div');
        indicator.id = 'server-status-indicator';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #2ecc71;
                color: white;
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 12px;
                z-index: 1000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                cursor: pointer;
            " title="服务器状态：正常运行">
                🟢 服务器正常
            </div>
        `;
        
        // 点击显示详细信息
        indicator.addEventListener('click', () => {
            alert(`服务器状态：正常运行\n启动时间：${statusData.data.server.started_at}\n运行时长：${Math.round(statusData.data.server.uptime)}秒`);
        });
        
        document.body.appendChild(indicator);
        
        // 5秒后自动隐藏
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.style.opacity = '0';
                indicator.style.transition = 'opacity 0.5s ease-out';
                setTimeout(() => indicator.remove(), 500);
            }
        }, 5000);
    }
}

// 自动初始化服务器状态监控
if (typeof window !== 'undefined') {
    window.serverStatusMonitor = new ServerStatusMonitor();
    
    // 导出到全局作用域，方便其他脚本使用
    window.ServerStatusMonitor = ServerStatusMonitor;
}
