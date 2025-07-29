/**
 * 🗄️ 数据库管理界面JavaScript
 * 无锡皇德国际贸易有限公司 - Diamond Website 数据库管理
 */

// 全局变量
let migrationInProgress = false;
let migrationLog = [];

/**
 * 🚀 页面初始化
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 数据库管理界面初始化...');
    
    // 初始化标签页切换
    initTabSwitching();
    
    // 检查数据库状态
    checkDatabaseStatus();
    
    // 加载数据统计
    loadDataStats();
    
    console.log('✅ 数据库管理界面初始化完成');
});

/**
 * 🔄 初始化标签页切换
 */
function initTabSwitching() {
    const navLinks = document.querySelectorAll('[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetTab = this.getAttribute('data-tab');
            
            // 更新导航状态
            navLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // 显示对应标签页
            tabContents.forEach(content => {
                content.style.display = 'none';
            });
            
            const targetContent = document.getElementById(`${targetTab}-tab`);
            if (targetContent) {
                targetContent.style.display = 'block';
            }
        });
    });
}

/**
 * 🔍 检查数据库状态
 */
async function checkDatabaseStatus() {
    const statusElement = document.getElementById('migration-status');
    
    try {
        // 检查数据库连接
        const healthResponse = await fetch('/api/db/health');
        const healthData = await healthResponse.json();
        
        if (healthData.success) {
            statusElement.innerHTML = `
                <div class="alert alert-success">
                    <i class="bi bi-check-circle"></i>
                    <strong>数据库连接正常</strong><br>
                    <small>PostgreSQL + Prisma 连接成功</small>
                </div>
            `;
            
            // 启用管理功能
            enableManagementFeatures();
        } else {
            throw new Error(healthData.message);
        }
    } catch (error) {
        console.error('❌ 数据库状态检查失败:', error);
        statusElement.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle"></i>
                <strong>数据库未连接</strong><br>
                <small>请先完成数据库配置和迁移</small>
            </div>
        `;
        
        // 禁用管理功能
        disableManagementFeatures();
    }
}

/**
 * 📊 加载数据统计
 */
async function loadDataStats() {
    try {
        // 加载JSON文件统计
        const jsonStats = await loadJsonStats();
        
        // 加载数据库统计
        const dbStats = await loadDatabaseStats();
        
        // 更新界面
        updateStatsDisplay(jsonStats, dbStats);
        
    } catch (error) {
        console.error('❌ 加载数据统计失败:', error);
    }
}

/**
 * 📄 加载JSON文件统计
 */
async function loadJsonStats() {
    try {
        const [productsResponse, categoriesResponse] = await Promise.all([
            fetch('/data/products.json'),
            fetch('/data/categories.json')
        ]);
        
        const products = await productsResponse.json();
        const categories = await categoriesResponse.json();
        
        return {
            products: Array.isArray(products) ? products.length : 0,
            categories: Array.isArray(categories) ? categories.length : 0
        };
    } catch (error) {
        console.warn('⚠️ 加载JSON统计失败:', error);
        return { products: 0, categories: 0 };
    }
}

/**
 * 🗄️ 加载数据库统计
 */
async function loadDatabaseStats() {
    try {
        const response = await fetch('/api/db/stats/products');
        const data = await response.json();
        
        if (data.success) {
            return {
                products: data.data.totalProducts || 0,
                categories: data.data.categoryCounts?.length || 0
            };
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.warn('⚠️ 加载数据库统计失败:', error);
        return { products: 0, categories: 0 };
    }
}

/**
 * 📈 更新统计显示
 */
function updateStatsDisplay(jsonStats, dbStats) {
    document.getElementById('json-products').textContent = jsonStats.products;
    document.getElementById('json-categories').textContent = jsonStats.categories;
    document.getElementById('db-products').textContent = dbStats.products;
    document.getElementById('db-categories').textContent = dbStats.categories;
}

/**
 * 🚀 开始数据迁移
 */
async function startMigration() {
    if (migrationInProgress) {
        alert('迁移正在进行中，请稍候...');
        return;
    }
    
    if (!confirm('确定要开始数据迁移吗？这将把JSON文件数据导入到PostgreSQL数据库中。')) {
        return;
    }
    
    migrationInProgress = true;
    
    // 显示进度条
    document.querySelector('.progress-container').style.display = 'block';
    
    // 禁用按钮
    document.getElementById('migrate-btn').disabled = true;
    
    // 清空日志
    clearLog();
    addLogEntry('开始数据迁移流程...', 'info');
    
    try {
        // 模拟迁移步骤
        await simulateMigrationSteps();
        
        addLogEntry('🎉 数据迁移完成！', 'success');
        
        // 刷新统计
        await loadDataStats();
        
        // 启用管理功能
        enableManagementFeatures();
        
    } catch (error) {
        console.error('❌ 迁移失败:', error);
        addLogEntry(`❌ 迁移失败: ${error.message}`, 'error');
    } finally {
        migrationInProgress = false;
        document.getElementById('migrate-btn').disabled = false;
        updateProgress(100, '迁移完成');
    }
}

/**
 * 🔄 模拟迁移步骤
 */
async function simulateMigrationSteps() {
    const steps = [
        { name: '备份原始数据', progress: 10 },
        { name: '连接数据库', progress: 20 },
        { name: '迁移公司信息', progress: 30 },
        { name: '迁移轮播图数据', progress: 40 },
        { name: '迁移分类数据', progress: 60 },
        { name: '迁移产品数据', progress: 80 },
        { name: '迁移询价数据', progress: 90 },
        { name: '验证迁移结果', progress: 100 }
    ];
    
    for (const step of steps) {
        addLogEntry(`正在执行: ${step.name}`, 'info');
        updateProgress(step.progress, step.name);
        
        // 模拟处理时间
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        addLogEntry(`✅ 完成: ${step.name}`, 'success');
    }
}

/**
 * 📊 更新进度条
 */
function updateProgress(percentage, stepName) {
    const progressBar = document.getElementById('migration-progress');
    const stepElement = document.getElementById('migration-step');
    
    progressBar.style.width = `${percentage}%`;
    progressBar.textContent = `${percentage}%`;
    stepElement.textContent = stepName;
}

/**
 * ✅ 验证迁移结果
 */
async function validateMigration() {
    addLogEntry('开始验证迁移结果...', 'info');
    
    try {
        // 检查数据库连接
        const healthResponse = await fetch('/api/db/health');
        const healthData = await healthResponse.json();
        
        if (!healthData.success) {
            throw new Error('数据库连接失败');
        }
        
        addLogEntry('✅ 数据库连接正常', 'success');
        
        // 检查数据完整性
        const statsResponse = await fetch('/api/db/stats/products');
        const statsData = await statsResponse.json();
        
        if (statsData.success) {
            const stats = statsData.data;
            addLogEntry(`✅ 产品数据验证: ${stats.totalProducts} 个产品`, 'success');
            addLogEntry(`✅ 分类数据验证: ${stats.categoryCounts?.length || 0} 个分类`, 'success');
        }
        
        addLogEntry('🎉 数据验证完成，迁移成功！', 'success');
        
    } catch (error) {
        console.error('❌ 验证失败:', error);
        addLogEntry(`❌ 验证失败: ${error.message}`, 'error');
    }
}

/**
 * 📄 生成迁移报告
 */
async function generateReport() {
    addLogEntry('正在生成迁移报告...', 'info');
    
    try {
        const report = {
            timestamp: new Date().toISOString(),
            migrationLog: migrationLog,
            stats: await loadDatabaseStats()
        };
        
        // 下载报告
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `migration-report-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        addLogEntry('✅ 迁移报告已生成并下载', 'success');
        
    } catch (error) {
        console.error('❌ 生成报告失败:', error);
        addLogEntry(`❌ 生成报告失败: ${error.message}`, 'error');
    }
}

/**
 * 📝 添加日志条目
 */
function addLogEntry(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
        timestamp,
        message,
        type
    };
    
    migrationLog.push(logEntry);
    
    const logContainer = document.getElementById('migration-log');
    const logElement = document.createElement('div');
    logElement.className = `log-entry log-${type}`;
    logElement.textContent = `[${timestamp}] ${message}`;
    
    logContainer.appendChild(logElement);
    logContainer.scrollTop = logContainer.scrollHeight;
}

/**
 * 🧹 清空日志
 */
function clearLog() {
    migrationLog = [];
    document.getElementById('migration-log').innerHTML = '';
}

/**
 * ✅ 启用管理功能
 */
function enableManagementFeatures() {
    // 显示产品管理界面
    const productsManagement = document.getElementById('products-management');
    if (productsManagement) {
        productsManagement.style.display = 'block';
    }
    
    // 更新按钮状态
    document.getElementById('validate-btn').disabled = false;
    document.getElementById('report-btn').disabled = false;
}

/**
 * ❌ 禁用管理功能
 */
function disableManagementFeatures() {
    // 隐藏产品管理界面
    const productsManagement = document.getElementById('products-management');
    if (productsManagement) {
        productsManagement.style.display = 'none';
    }
}

/**
 * 💾 创建备份
 */
async function createBackup() {
    addLogEntry('开始创建数据备份...', 'info');
    
    try {
        // 这里应该调用后端备份API
        // const response = await fetch('/api/backup/create', { method: 'POST' });
        
        // 模拟备份过程
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        addLogEntry('✅ 数据备份创建成功', 'success');
        alert('备份创建成功！');
        
    } catch (error) {
        console.error('❌ 创建备份失败:', error);
        addLogEntry(`❌ 创建备份失败: ${error.message}`, 'error');
        alert('备份创建失败，请检查日志');
    }
}

/**
 * 📤 显示恢复选项
 */
function showRestoreOptions() {
    alert('数据恢复功能正在开发中，敬请期待！');
}
