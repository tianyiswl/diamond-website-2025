// 🔧 完整修复验证测试 - 验证301重定向和DAO读取修复
const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🔧 开始验证完整修复结果...\n');

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

async function runCompleteFixVerification() {
  console.log('🔧 1. 验证管理后台301重定向修复');
  console.log('='.repeat(50));

  // 测试 /admin 路径 - 应该返回200而不是301
  try {
    const adminResult = await testEndpoint('http://localhost:3001/admin');
    const isFixed = adminResult.statusCode === 200;
    addTest('301重定向修复', '/admin路径直接访问', isFixed, 
           `状态码: ${adminResult.statusCode} (期望200，避免301重定向)`);
  } catch (error) {
    addTest('301重定向修复', '/admin路径直接访问', false, error.message);
  }

  // 测试 /admin/ 路径 - 应该返回200
  try {
    const adminSlashResult = await testEndpoint('http://localhost:3001/admin/');
    const isFixed = adminSlashResult.statusCode === 200;
    addTest('301重定向修复', '/admin/路径访问', isFixed, 
           `状态码: ${adminSlashResult.statusCode} (期望200)`);
  } catch (error) {
    addTest('301重定向修复', '/admin/路径访问', false, error.message);
  }

  console.log('\n📊 2. 验证询价数据读取修复');
  console.log('='.repeat(50));

  // 测试直接文件读取
  try {
    const filePath = path.resolve('./data/inquiries.json');
    console.log(`   📁 测试文件: ${filePath}`);
    
    const rawData = fs.readFileSync(filePath, 'utf8');
    const directData = JSON.parse(rawData);
    
    addTest('数据读取修复', '直接文件读取', Array.isArray(directData) && directData.length > 0,
           `读取到 ${directData.length} 条记录`);
  } catch (error) {
    addTest('数据读取修复', '直接文件读取', false, error.message);
  }

  // 测试DAO读取（使用新的getAllInquiries方法）
  try {
    const { InquiryDao } = require('./src/dao');
    const inquiryDao = new InquiryDao();
    
    console.log('   🔍 使用新的getAllInquiries方法...');
    const inquiries = inquiryDao.getAllInquiries();
    
    const isSuccess = Array.isArray(inquiries) && inquiries.length > 0;
    addTest('数据读取修复', 'DAO方式读取（新方法）', isSuccess,
           `读取到 ${inquiries ? inquiries.length : 'undefined'} 条记录`);
  } catch (error) {
    console.error('   ❌ DAO读取详细错误:', error);
    addTest('数据读取修复', 'DAO方式读取（新方法）', false, error.message);
  }

  // 测试数据一致性
  try {
    const filePath = path.resolve('./data/inquiries.json');
    const directData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const { InquiryDao } = require('./src/dao');
    const inquiryDao = new InquiryDao();
    const daoData = inquiryDao.getAllInquiries();
    
    const isConsistent = directData.length === daoData.length;
    addTest('数据读取修复', '数据读取一致性验证', isConsistent,
           `直接读取: ${directData.length}, DAO读取: ${daoData.length}, 一致: ${isConsistent}`);
  } catch (error) {
    addTest('数据读取修复', '数据读取一致性验证', false, error.message);
  }

  console.log('\n📊 完整修复验证结果统计');
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
  } else {
    console.log('\n🎉 所有修复项目都已成功！');
  }

  // 保存修复验证报告
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
    overallStatus: testResults.failed === 0 ? 'ALL_FIXED' : testResults.failed <= 1 ? 'MOSTLY_FIXED' : 'NEEDS_MORE_WORK'
  };

  fs.writeFileSync('./complete-fix-verification-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 完整修复验证报告已保存到: complete-fix-verification-report.json');
  console.log('\n🎯 完整修复验证测试完成！');
  
  return report;
}

runCompleteFixVerification().catch(console.error);
