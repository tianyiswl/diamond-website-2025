// 🔍 语法错误诊断脚本
// 逐步检查模块加载问题

console.log('🔍 开始语法诊断...');

try {
  console.log('1. 测试基础模块加载...');
  
  // 测试config模块
  console.log('  - 加载config模块...');
  const config = require('./src/config');
  console.log('  ✅ config模块加载成功');
  
  // 测试utils模块
  console.log('  - 加载utils模块...');
  const utils = require('./src/utils');
  console.log('  ✅ utils模块加载成功');
  
  // 测试dao模块
  console.log('  - 加载dao模块...');
  const dao = require('./src/dao');
  console.log('  ✅ dao模块加载成功');
  
  // 测试services模块
  console.log('  - 加载services模块...');
  const services = require('./src/services');
  console.log('  ✅ services模块加载成功');
  
  console.log('\n2. 测试询价相关模块...');
  
  // 测试询价DAO
  console.log('  - 获取询价DAO...');
  const inquiryDao = dao.getInquiryDao();
  console.log('  ✅ 询价DAO获取成功');
  
  // 测试询价服务
  console.log('  - 获取询价服务...');
  const inquiryService = services.getInquiryService();
  console.log('  ✅ 询价服务获取成功');
  
  console.log('\n🎉 所有模块加载成功！');
  
} catch (error) {
  console.error('\n❌ 模块加载失败:');
  console.error('错误类型:', error.name);
  console.error('错误信息:', error.message);
  console.error('错误位置:', error.stack);
  
  // 尝试更详细的错误分析
  if (error.message.includes('Unexpected token')) {
    console.error('\n🔍 语法错误分析:');
    console.error('这通常是由以下原因造成的:');
    console.error('1. JavaScript语法错误');
    console.error('2. 文件编码问题');
    console.error('3. 模块导入/导出错误');
    console.error('4. 缺少分号或括号不匹配');
  }
}
