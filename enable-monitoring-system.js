// 📊 Diamond Website 性能监控系统启用脚本
// 启用和配置所有监控组件

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

console.log('📊 Diamond Website 性能监控系统启用');
console.log('=====================================');
console.log(`启用时间: ${new Date().toLocaleString('zh-CN')}`);
console.log('');

/**
 * 启用性能监控系统
 */
async function enableMonitoringSystem() {
  try {
    const monitoringResults = {
      serverMonitoring: false,
      frontendMonitoring: false,
      apiMonitoring: false,
      performanceBenchmark: false,
      monitoringDashboard: false
    };
    
    // 1. 检查监控脚本文件
    console.log('📁 检查监控脚本文件...');
    const monitoringFiles = [
      'server-resource-monitor.sh',
      'assets/js/performance-monitor.js',
      'performance-benchmark.js'
    ];
    
    let filesExist = 0;
    monitoringFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`  ✅ ${file} 存在`);
        filesExist++;
      } else {
        console.log(`  ❌ ${file} 不存在`);
      }
    });
    
    console.log(`监控文件检查: ${filesExist}/${monitoringFiles.length} 个文件存在`);
    
    // 2. 集成前端性能监控到主页面
    console.log('\n🔧 集成前端性能监控...');
    
    // 检查index.html是否已包含性能监控
    const indexPath = './index.html';
    if (fs.existsSync(indexPath)) {
      let indexContent = fs.readFileSync(indexPath, 'utf8');
      
      if (!indexContent.includes('performance-monitor.js')) {
        console.log('  添加性能监控脚本到index.html...');
        
        // 在</body>前添加性能监控脚本
        const monitoringScript = `
    <!-- 🚀 性能监控系统 -->
    <script src="assets/js/performance-monitor.js"></script>
    <script>
      // 启用性能监控
      window.addEventListener('load', function() {
        console.log('📊 性能监控系统已启用');
        
        // 收集页面性能指标
        setTimeout(function() {
          const perfData = {
            loadTime: performance.now(),
            domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
            pageLoad: performance.timing.loadEventEnd - performance.timing.navigationStart,
            firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
            resources: performance.getEntriesByType('resource').length
          };
          
          console.log('📈 页面性能指标:', perfData);
          
          // 发送性能数据到服务器（如果API可用）
          if (typeof fetch !== 'undefined') {
            fetch('/api/performance/report', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(perfData)
            }).catch(err => console.log('性能数据上报失败:', err.message));
          }
        }, 1000);
      });
    </script>`;
        
        indexContent = indexContent.replace('</body>', monitoringScript + '\n</body>');
        fs.writeFileSync(indexPath, indexContent);
        console.log('  ✅ 前端性能监控已集成到index.html');
        monitoringResults.frontendMonitoring = true;
      } else {
        console.log('  ✅ 前端性能监控已存在于index.html');
        monitoringResults.frontendMonitoring = true;
      }
    } else {
      console.log('  ⚠️ index.html不存在，跳过前端监控集成');
    }
    
    // 3. 添加性能报告API到server.js
    console.log('\n🔧 添加性能报告API...');
    
    const serverPath = './server.js';
    if (fs.existsSync(serverPath)) {
      let serverContent = fs.readFileSync(serverPath, 'utf8');
      
      if (!serverContent.includes('/api/performance/report')) {
        console.log('  添加性能报告API到server.js...');
        
        const performanceAPI = `
// 📊 性能监控API
app.post('/api/performance/report', (req, res) => {
  try {
    const perfData = req.body;
    const timestamp = new Date().toISOString();
    
    // 记录性能数据
    const logEntry = {
      timestamp: timestamp,
      type: 'performance',
      data: perfData,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    };
    
    console.log('📈 性能数据收集:', {
      loadTime: perfData.loadTime?.toFixed(2) + 'ms',
      domContentLoaded: perfData.domContentLoaded + 'ms',
      pageLoad: perfData.pageLoad + 'ms',
      resources: perfData.resources
    });
    
    // 保存到性能日志文件
    const perfLogPath = './data/performance-logs.json';
    let perfLogs = [];
    
    if (fs.existsSync(perfLogPath)) {
      try {
        perfLogs = JSON.parse(fs.readFileSync(perfLogPath, 'utf8'));
      } catch (e) {
        perfLogs = [];
      }
    }
    
    perfLogs.push(logEntry);
    
    // 保留最近1000条记录
    if (perfLogs.length > 1000) {
      perfLogs = perfLogs.slice(-1000);
    }
    
    fs.writeFileSync(perfLogPath, JSON.stringify(perfLogs, null, 2));
    
    res.json({ success: true, message: '性能数据已记录' });
  } catch (error) {
    console.error('性能数据处理失败:', error);
    res.status(500).json({ success: false, error: '性能数据处理失败' });
  }
});

// 获取性能统计API
app.get('/api/performance/stats', (req, res) => {
  try {
    const perfLogPath = './data/performance-logs.json';
    
    if (!fs.existsSync(perfLogPath)) {
      return res.json({
        success: true,
        data: {
          totalRecords: 0,
          avgLoadTime: 0,
          avgPageLoad: 0,
          recentRecords: []
        }
      });
    }
    
    const perfLogs = JSON.parse(fs.readFileSync(perfLogPath, 'utf8'));
    const recentLogs = perfLogs.slice(-100); // 最近100条
    
    // 计算平均值
    const avgLoadTime = recentLogs.reduce((sum, log) => sum + (log.data.loadTime || 0), 0) / recentLogs.length;
    const avgPageLoad = recentLogs.reduce((sum, log) => sum + (log.data.pageLoad || 0), 0) / recentLogs.length;
    
    res.json({
      success: true,
      data: {
        totalRecords: perfLogs.length,
        avgLoadTime: avgLoadTime.toFixed(2),
        avgPageLoad: avgPageLoad.toFixed(2),
        recentRecords: recentLogs.slice(-10) // 最近10条
      }
    });
  } catch (error) {
    console.error('获取性能统计失败:', error);
    res.status(500).json({ success: false, error: '获取性能统计失败' });
  }
});
`;
        
        // 在缓存API后添加性能API
        const cacheAPIPattern = /app\.post\('\/api\/cache\/clear'/;
        if (cacheAPIPattern.test(serverContent)) {
          serverContent = serverContent.replace(
            /(\}\);[\s\n]*\/\/ 健康检查端点)/,
            `});${performanceAPI}\n// 健康检查端点`
          );
        } else {
          // 如果找不到缓存API，在文件末尾添加
          serverContent += performanceAPI;
        }
        
        fs.writeFileSync(serverPath, serverContent);
        console.log('  ✅ 性能报告API已添加到server.js');
        monitoringResults.apiMonitoring = true;
      } else {
        console.log('  ✅ 性能报告API已存在于server.js');
        monitoringResults.apiMonitoring = true;
      }
    } else {
      console.log('  ❌ server.js不存在，无法添加性能API');
    }
    
    // 4. 创建监控仪表板页面
    console.log('\n🔧 创建监控仪表板...');
    
    const dashboardPath = './admin/monitoring.html';
    if (!fs.existsSync(dashboardPath)) {
      const dashboardHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>性能监控仪表板 - Diamond Website</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .metric { text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #2196F3; }
        .metric-label { color: #666; margin-top: 5px; }
        .status-good { color: #4CAF50; }
        .status-warning { color: #FF9800; }
        .status-error { color: #F44336; }
        .refresh-btn { background: #2196F3; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        .refresh-btn:hover { background: #1976D2; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Diamond Website 性能监控仪表板</h1>
        
        <div class="card">
            <h2>实时性能指标</h2>
            <button class="refresh-btn" onclick="refreshMetrics()">🔄 刷新数据</button>
            <div class="metrics" id="metrics">
                <div class="metric">
                    <div class="metric-value" id="avgLoadTime">--</div>
                    <div class="metric-label">平均加载时间 (ms)</div>
                </div>
                <div class="metric">
                    <div class="metric-value" id="avgPageLoad">--</div>
                    <div class="metric-label">平均页面加载 (ms)</div>
                </div>
                <div class="metric">
                    <div class="metric-value" id="totalRecords">--</div>
                    <div class="metric-label">监控记录总数</div>
                </div>
                <div class="metric">
                    <div class="metric-value" id="cacheHitRate">--</div>
                    <div class="metric-label">缓存命中率</div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h2>最近性能记录</h2>
            <div id="recentRecords">加载中...</div>
        </div>
    </div>
    
    <script>
        async function refreshMetrics() {
            try {
                // 获取性能统计
                const perfResponse = await fetch('/api/performance/stats');
                const perfData = await perfResponse.json();
                
                if (perfData.success) {
                    document.getElementById('avgLoadTime').textContent = perfData.data.avgLoadTime;
                    document.getElementById('avgPageLoad').textContent = perfData.data.avgPageLoad;
                    document.getElementById('totalRecords').textContent = perfData.data.totalRecords;
                    
                    // 显示最近记录
                    const recordsDiv = document.getElementById('recentRecords');
                    if (perfData.data.recentRecords.length > 0) {
                        recordsDiv.innerHTML = perfData.data.recentRecords.map(record => 
                            \`<div style="margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 4px;">
                                <strong>\${new Date(record.timestamp).toLocaleString()}</strong><br>
                                加载时间: \${record.data.loadTime?.toFixed(2) || 0}ms, 
                                页面加载: \${record.data.pageLoad || 0}ms, 
                                资源数: \${record.data.resources || 0}
                            </div>\`
                        ).join('');
                    } else {
                        recordsDiv.innerHTML = '<p>暂无性能记录</p>';
                    }
                }
                
                // 获取缓存统计
                const cacheResponse = await fetch('/api/cache/stats');
                const cacheData = await cacheResponse.json();
                
                if (cacheData.success) {
                    document.getElementById('cacheHitRate').textContent = cacheData.data.overall.overallHitRate;
                }
                
            } catch (error) {
                console.error('刷新监控数据失败:', error);
            }
        }
        
        // 页面加载时刷新数据
        window.addEventListener('load', refreshMetrics);
        
        // 每30秒自动刷新
        setInterval(refreshMetrics, 30000);
    </script>
</body>
</html>`;
      
      fs.writeFileSync(dashboardPath, dashboardHTML);
      console.log('  ✅ 监控仪表板已创建: admin/monitoring.html');
      monitoringResults.monitoringDashboard = true;
    } else {
      console.log('  ✅ 监控仪表板已存在');
      monitoringResults.monitoringDashboard = true;
    }
    
    // 5. 运行性能基准测试
    console.log('\n🧪 运行性能基准测试...');
    
    try {
      const benchmarkResult = await runPerformanceBenchmark();
      if (benchmarkResult.success) {
        console.log('  ✅ 性能基准测试完成');
        monitoringResults.performanceBenchmark = true;
      } else {
        console.log('  ⚠️ 性能基准测试部分完成');
      }
    } catch (error) {
      console.log('  ❌ 性能基准测试失败:', error.message);
    }
    
    // 6. 生成监控启用报告
    console.log('\n📊 监控系统启用报告');
    console.log('=====================================');
    
    const enabledCount = Object.values(monitoringResults).filter(Boolean).length;
    const totalCount = Object.keys(monitoringResults).length;
    
    console.log(`启用成功: ${enabledCount}/${totalCount} 个监控组件`);
    console.log('详细状态:');
    console.log(`  服务器监控: ${monitoringResults.serverMonitoring ? '✅' : '❌'} (脚本存在)`);
    console.log(`  前端监控: ${monitoringResults.frontendMonitoring ? '✅' : '❌'} (已集成)`);
    console.log(`  API监控: ${monitoringResults.apiMonitoring ? '✅' : '❌'} (已添加)`);
    console.log(`  性能基准: ${monitoringResults.performanceBenchmark ? '✅' : '❌'} (已测试)`);
    console.log(`  监控仪表板: ${monitoringResults.monitoringDashboard ? '✅' : '❌'} (已创建)`);
    
    // 服务器监控脚本存在即认为可用
    monitoringResults.serverMonitoring = fs.existsSync('server-resource-monitor.sh');
    
    const finalEnabledCount = Object.values(monitoringResults).filter(Boolean).length;
    const successRate = ((finalEnabledCount / totalCount) * 100).toFixed(1);
    
    console.log(`\n总体启用率: ${successRate}%`);
    
    // 保存启用报告
    const enableReport = {
      enableTime: new Date().toISOString(),
      results: monitoringResults,
      enabledCount: finalEnabledCount,
      totalCount: totalCount,
      successRate: successRate + '%',
      nextSteps: [
        '访问 /admin/monitoring.html 查看监控仪表板',
        '检查 /api/performance/stats 获取性能统计',
        '查看 /api/cache/stats 获取缓存状态',
        '运行 ./server-resource-monitor.sh monitor 启动服务器监控'
      ]
    };
    
    fs.writeFileSync('./monitoring-enable-report.json', JSON.stringify(enableReport, null, 2));
    console.log('\n💾 启用报告已保存到: monitoring-enable-report.json');
    
    // 返回结果
    const isSuccess = finalEnabledCount >= 4; // 至少4个组件启用才算成功
    console.log(`\n🎉 监控系统启用${isSuccess ? '成功' : '部分成功'}！`);
    
    if (isSuccess) {
      console.log('✅ 性能监控系统已全面启用');
      console.log('🚀 可以开始收集和分析性能数据');
    } else {
      console.log('⚠️ 部分监控组件需要手动配置');
    }
    
    return {
      success: isSuccess,
      report: enableReport,
      enabledCount: finalEnabledCount,
      totalCount: totalCount
    };
    
  } catch (error) {
    console.error('❌ 监控系统启用失败:', error.message);
    console.error(error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

// 运行性能基准测试
async function runPerformanceBenchmark() {
  return new Promise((resolve) => {
    const benchmark = spawn('node', ['performance-benchmark.js'], {
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    let output = '';
    benchmark.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    benchmark.on('close', (code) => {
      if (code === 0) {
        console.log('  性能基准测试输出:', output.split('\n').slice(-3).join(' '));
        resolve({ success: true, output });
      } else {
        resolve({ success: false, error: `基准测试退出码: ${code}` });
      }
    });
    
    benchmark.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
    
    // 10秒超时
    setTimeout(() => {
      benchmark.kill();
      resolve({ success: false, error: '基准测试超时' });
    }, 10000);
  });
}

// 执行监控系统启用
console.log('开始执行性能监控系统启用...\n');
enableMonitoringSystem().then(result => {
  if (result.success) {
    console.log('\n✅ 性能监控系统启用完成！');
    console.log('🔧 建议重启服务器以应用所有更改');
  } else {
    console.log('\n❌ 性能监控系统启用失败');
    if (result.error) {
      console.log('错误信息:', result.error);
    }
  }
  
  console.log('\n启用完成。');
}).catch(error => {
  console.error('❌ 执行过程中发生错误:', error.message);
});
