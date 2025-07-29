// 调试服务层加载问题
console.log('🔍 调试服务层加载问题...\n');

try {
  console.log('1. 测试utils模块...');
  const utils = require('./src/utils');
  console.log('✅ utils模块加载成功');
  
  console.log('2. 测试dao模块...');
  const dao = require('./src/dao');
  console.log('✅ dao模块加载成功');
  
  console.log('3. 测试BaseService类...');
  const BaseService = require('./src/services/baseService');
  console.log('✅ BaseService类加载成功');
  
  console.log('4. 创建BaseService实例...');
  const baseService = new BaseService(null);
  console.log('✅ BaseService实例创建成功');
  
  console.log('5. 测试InquiryService类...');
  const InquiryService = require('./src/services/inquiryService');
  console.log('✅ InquiryService类加载成功');
  
  console.log('6. 创建InquiryService实例...');
  const inquiryService = new InquiryService();
  console.log('✅ InquiryService实例创建成功');
  
  console.log('7. 测试services模块入口...');
  const services = require('./src/services');
  console.log('✅ services模块入口加载成功');
  
  console.log('\n🎉 所有服务层组件加载成功！');
  
} catch (error) {
  console.log('❌ 服务层加载失败:', error.message);
  console.log('堆栈:', error.stack);
}
