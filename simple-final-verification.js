// 🎯 简化的最终系统验证
console.log('🎯 Diamond Website 系统验证');
console.log('='.repeat(50));

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    console.log(`🧪 ${name}...`);
    const result = fn();
    if (result) {
      console.log(`✅ ${name} - 通过`);
      passedTests++;
    } else {
      console.log(`❌ ${name} - 失败`);
    }
  } catch (error) {
    console.log(`❌ ${name} - 错误: ${error.message}`);
  }
}

console.log('\n📋 1. 核心模块验证');
console.log('-'.repeat(30));

test('Utils模块', () => {
  const utils = require('./src/utils');
  return utils && typeof utils.generateUUID === 'function';
});

test('Config模块', () => {
  const config = require('./src/config');
  return config && typeof config.getDataFilePath === 'function';
});

test('DAO模块', () => {
  const dao = require('./src/dao');
  return dao && typeof dao.getInquiryDao === 'function';
});

test('Services模块', () => {
  const services = require('./src/services');
  return services && typeof services.getInquiryService === 'function';
});

console.log('\n📊 2. 功能验证');
console.log('-'.repeat(30));

test('UUID生成', () => {
  const utils = require('./src/utils');
  const uuid = utils.generateUUID();
  return uuid && uuid.length === 36;
});

test('时间处理', () => {
  const utils = require('./src/utils');
  const timestamp = utils.getISOString();
  return timestamp && timestamp.includes('T');
});

test('数据验证', () => {
  const utils = require('./src/utils');
  return utils.isValidEmail('test@example.com') === true;
});

test('文件读取', () => {
  const utils = require('./src/utils');
  const data = utils.readJsonFile('./data/inquiries.json', []);
  return Array.isArray(data);
});

console.log('\n🏗️ 3. 业务逻辑验证');
console.log('-'.repeat(30));

test('DAO实例创建', () => {
  const dao = require('./src/dao');
  const inquiryDao = dao.getInquiryDao();
  return inquiryDao && typeof inquiryDao.read === 'function';
});

test('Service实例创建', () => {
  const services = require('./src/services');
  const inquiryService = services.getInquiryService();
  return inquiryService && typeof inquiryService.createInquiry === 'function';
});

test('数据读取功能', () => {
  const dao = require('./src/dao');
  const inquiryDao = dao.getInquiryDao();
  const data = inquiryDao.read();
  return Array.isArray(data);
});

console.log('\n' + '='.repeat(50));
console.log('📊 验证结果汇总');
console.log('='.repeat(50));
console.log(`总测试数: ${totalTests}`);
console.log(`通过测试: ${passedTests} ✅`);
console.log(`失败测试: ${totalTests - passedTests} ❌`);
console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(2)}%`);

const successRate = (passedTests / totalTests) * 100;

console.log('\n' + '='.repeat(50));
if (successRate === 100) {
  console.log('🎉 系统验证完全通过！');
  console.log('✨ Diamond Website模块化重构成功');
  console.log('🚀 系统已准备好投入使用');
} else if (successRate >= 80) {
  console.log('✅ 系统验证基本通过！');
  console.log('⚠️ 核心功能正常，存在少量问题');
  console.log('🔧 建议优化后投入使用');
} else {
  console.log('❌ 系统验证未通过');
  console.log('🔧 需要修复关键问题');
}

console.log('='.repeat(50));
console.log('验证时间:', new Date().toLocaleString('zh-CN'));
console.log('='.repeat(50));
