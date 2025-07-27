// 🎯 快速验证修复结果
const http = require('http');

console.log('🎯 快速验证修复结果...\n');

let testCount = 0;
let passCount = 0;

function test(name, condition, details) {
  testCount++;
  if (condition) {
    passCount++;
    console.log(`✅ ${name} - ${details}`);
  } else {
    console.log(`❌ ${name} - ${details}`);
  }
}

async function quickTest() {
  // 测试管理后台301修复
  try {
    const response = await fetch('http://localhost:3001/admin');
    test('管理后台/admin路径', response.status === 200, `状态码: ${response.status}`);
  } catch (error) {
    test('管理后台/admin路径', false, error.message);
  }

  // 测试询价数据读取修复
  try {
    const { InquiryDao } = require('./src/dao');
    const inquiryDao = new InquiryDao();
    const inquiries = inquiryDao.getAllInquiries();
    test('询价数据读取', Array.isArray(inquiries) && inquiries.length > 0, 
         `读取到 ${inquiries.length} 条记录`);
  } catch (error) {
    test('询价数据读取', false, error.message);
  }

  // 测试CSS文件
  try {
    const response = await fetch('http://localhost:3001/assets/css/style.css');
    test('CSS样式文件', response.status === 200, `状态码: ${response.status}`);
  } catch (error) {
    test('CSS样式文件', false, error.message);
  }

  // 测试公开API
  try {
    const response = await fetch('http://localhost:3001/api/products/public');
    test('公开产品API', response.status === 200, `状态码: ${response.status}`);
  } catch (error) {
    test('公开产品API', false, error.message);
  }

  console.log(`\n📊 测试结果: ${passCount}/${testCount} (${((passCount/testCount)*100).toFixed(2)}%)`);
  
  if (passCount === testCount) {
    console.log('🎉 所有修复都成功了！');
  } else {
    console.log('⚠️ 还有一些问题需要解决');
  }
}

quickTest().catch(console.error);
