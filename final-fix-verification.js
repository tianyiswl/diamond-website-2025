// 🔧 最终修复验证测试
const http = require('http');
const fs = require('fs');

console.log('🔧 开始最终修复验证测试...\n');

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function addTest(category, name, result, details = '') {
  testResults.total++;
  const test = {
    category,
    name,
    result: result ? 'PASS' : 'FAIL',
    details
  };
  testResults.tests.push(test);
  
  if (result) {
    testResults.passed++;
    console.log(`✅ [${category}] ${name}`);
    if (details) console.log(`   详情: ${details}`);
  } else {
    testResults.failed++;
    console.log(`❌ [${category}] ${name}`);
    console.log(`   问题: ${details}`);
  }
}

// 测试HTTP端点
function testEndpoint(url, expectedStatus = 200) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (err) => {
      resolve({ error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'timeout' });
    });

    req.end();
  });
}

async function runFinalVerification() {
  console.log('🔐 1. 管理后台登录功能验证');
  console.log('='.repeat(50));

  // 验证密码配置
  try {
    const bcrypt = require('bcrypt');
    const config = JSON.parse(fs.readFileSync('./data/admin-config.json', 'utf8'));
    const adminUser = Object.values(config.admins).find(admin => admin.username === 'admin');
    
    if (adminUser) {
      const isMatch = await bcrypt.compare('huangde0710', adminUser.password);
      addTest('登录验证', '管理员密码配置', isMatch, 
             `用户名: admin, 密码: huangde0710, 哈希验证: ${isMatch ? '通过' : '失败'}`);
    } else {
      addTest('登录验证', '管理员密码配置', false, '未找到admin用户');
    }
  } catch (error) {
    addTest('登录验证', '管理员密码配置', false, error.message);
  }

  // 测试登录页面
  try {
    const loginResult = await testEndpoint('http://localhost:3001/admin/login.html');
    addTest('登录验证', '登录页面访问', loginResult.statusCode === 200, 
           `状态码: ${loginResult.statusCode}, 内容长度: ${loginResult.data?.length || 0}`);
  } catch (error) {
    addTest('登录验证', '登录页面访问', false, error.message);
  }

  console.log('\n🔧 2. 管理后台301重定向修复验证');
  console.log('='.repeat(50));

  // 测试 /admin 路径
  try {
    const adminResult = await testEndpoint('http://localhost:3001/admin');
    const isFixed = adminResult.statusCode === 200;
    addTest('重定向修复', '/admin路径直接访问', isFixed, 
           `状态码: ${adminResult.statusCode} (期望200，避免301重定向)`);
  } catch (error) {
    addTest('重定向修复', '/admin路径直接访问', false, error.message);
  }

  // 测试 /admin/ 路径
  try {
    const adminSlashResult = await testEndpoint('http://localhost:3001/admin/');
    const isFixed = adminSlashResult.statusCode === 200;
    addTest('重定向修复', '/admin/路径访问', isFixed, 
           `状态码: ${adminSlashResult.statusCode}`);
  } catch (error) {
    addTest('重定向修复', '/admin/路径访问', false, error.message);
  }

  console.log('\n📊 3. 询价数据读取修复验证');
  console.log('='.repeat(50));

  // 直接文件读取
  try {
    const rawData = fs.readFileSync('./data/inquiries.json', 'utf8');
    const directData = JSON.parse(rawData);
    addTest('数据读取', '直接文件读取', Array.isArray(directData) && directData.length > 0, 
           `数据条数: ${directData.length}`);
  } catch (error) {
    addTest('数据读取', '直接文件读取', false, error.message);
  }

  // DAO读取
  try {
    const { InquiryDao } = require('./src/dao');
    const inquiryDao = new InquiryDao();
    const inquiries = inquiryDao.findAll();
    addTest('数据读取', 'DAO方式读取', Array.isArray(inquiries) && inquiries.length > 0, 
           `DAO读取条数: ${inquiries.length}`);
  } catch (error) {
    addTest('数据读取', 'DAO方式读取', false, error.message);
  }

  console.log('\n🔗 4. 用户管理API端点验证');
  console.log('='.repeat(50));

  // 测试新添加的用户管理API（需要认证，应该返回401）
  try {
    const usersResult = await testEndpoint('http://localhost:3001/api/admin/users');
    const isWorking = usersResult.statusCode === 401; // 期望401因为没有认证
    addTest('API端点', '用户管理API', isWorking, 
           `状态码: ${usersResult.statusCode} (期望401未授权)`);
  } catch (error) {
    addTest('API端点', '用户管理API', false, error.message);
  }

  // 测试原有的管理员API
  try {
    const adminsResult = await testEndpoint('http://localhost:3001/api/admins');
    const isWorking = adminsResult.statusCode === 401;
    addTest('API端点', '管理员API', isWorking, 
           `状态码: ${adminsResult.statusCode} (期望401未授权)`);
  } catch (error) {
    addTest('API端点', '管理员API', false, error.message);
  }

  console.log('\n✅ 5. 其他修复项目验证');
  console.log('='.repeat(50));

  // CSS文件
  try {
    const cssResult = await testEndpoint('http://localhost:3001/assets/css/style.css');
    addTest('其他修复', 'CSS样式文件', cssResult.statusCode === 200, 
           `状态码: ${cssResult.statusCode}`);
  } catch (error) {
    addTest('其他修复', 'CSS样式文件', false, error.message);
  }

  // 公开API
  const publicApis = [
    { path: '/api/products/public', name: '公开产品API' },
    { path: '/api/categories/public', name: '公开分类API' },
    { path: '/api/company/info', name: '公司信息API' }
  ];

  for (const api of publicApis) {
    try {
      const result = await testEndpoint(`http://localhost:3001${api.path}`);
      const isWorking = result.statusCode === 200;
      addTest('其他修复', api.name, isWorking, 
             `状态码: ${result.statusCode}`);
    } catch (error) {
      addTest('其他修复', api.name, false, error.message);
    }
  }

  // 输出最终结果
  console.log('\n📊 最终修复验证结果');
  console.log('='.repeat(50));
  console.log(`总测试项目: ${testResults.total}`);
  console.log(`修复成功: ${testResults.passed} ✅`);
  console.log(`仍有问题: ${testResults.failed} ❌`);
  console.log(`修复成功率: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);

  // 按分类统计
  const categories = {};
  testResults.tests.forEach(test => {
    if (!categories[test.category]) {
      categories[test.category] = { total: 0, passed: 0 };
    }
    categories[test.category].total++;
    if (test.result === 'PASS') {
      categories[test.category].passed++;
    }
  });

  console.log('\n📋 分类修复结果:');
  Object.entries(categories).forEach(([category, stats]) => {
    const rate = ((stats.passed / stats.total) * 100).toFixed(2);
    console.log(`${category}: ${stats.passed}/${stats.total} (${rate}%)`);
  });

  // 显示仍有问题的项目
  const stillBroken = testResults.tests.filter(test => test.result === 'FAIL');
  if (stillBroken.length > 0) {
    console.log('\n❌ 仍需关注的问题:');
    stillBroken.forEach((test, index) => {
      console.log(`${index + 1}. [${test.category}] ${test.name} - ${test.details}`);
    });
  }

  // 保存最终验证报告
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / testResults.total) * 100).toFixed(2) + '%'
    },
    categories,
    tests: testResults.tests,
    overallStatus: testResults.failed === 0 ? 'PERFECT' : testResults.failed <= 2 ? 'EXCELLENT' : 'GOOD'
  };

  fs.writeFileSync('./final-fix-verification-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 最终修复验证报告已保存到: final-fix-verification-report.json');
  
  // 评估是否达到95%目标
  const successRate = (testResults.passed / testResults.total) * 100;
  if (successRate >= 95) {
    console.log('\n🎉 恭喜！修复成功率达到95%以上目标！');
  } else {
    console.log(`\n⚠️  修复成功率${successRate.toFixed(2)}%，距离95%目标还需努力`);
  }
  
  console.log('\n🎯 最终修复验证完成！');
}

runFinalVerification().catch(console.error);
