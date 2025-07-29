// 🔍 调试询价数据读取问题
const fs = require('fs');
const path = require('path');

console.log('🔍 开始调试询价数据读取问题...\n');

async function debugInquiryData() {
  console.log('📊 1. 直接文件系统检查');
  console.log('='.repeat(40));
  
  // 1. 检查文件存在性和基本信息
  const filePath = './data/inquiries.json';
  console.log(`📁 文件路径: ${filePath}`);
  console.log(`📁 绝对路径: ${path.resolve(filePath)}`);
  console.log(`📁 文件存在: ${fs.existsSync(filePath) ? '✅ 是' : '❌ 否'}`);
  
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`📁 文件大小: ${stats.size} 字节`);
    console.log(`📁 修改时间: ${stats.mtime}`);
  }
  
  // 2. 直接读取文件内容
  console.log('\n📄 2. 直接读取文件内容');
  console.log('='.repeat(40));
  
  try {
    const rawContent = fs.readFileSync(filePath, 'utf8');
    console.log(`📄 原始内容长度: ${rawContent.length} 字符`);
    console.log(`📄 前100字符: ${rawContent.substring(0, 100)}...`);
    
    // 解析JSON
    const jsonData = JSON.parse(rawContent);
    console.log(`📄 JSON解析成功`);
    console.log(`📄 数据类型: ${Array.isArray(jsonData) ? '数组' : typeof jsonData}`);
    
    if (Array.isArray(jsonData)) {
      console.log(`📄 数组长度: ${jsonData.length}`);
      
      if (jsonData.length > 0) {
        console.log(`📄 第一条记录:`);
        console.log(`   ID: ${jsonData[0].id}`);
        console.log(`   姓名: ${jsonData[0].name}`);
        console.log(`   邮箱: ${jsonData[0].email}`);
        console.log(`   创建时间: ${jsonData[0].createdAt}`);
      }
    }
  } catch (error) {
    console.log(`❌ 文件读取失败: ${error.message}`);
  }
  
  // 3. 使用DAO类读取
  console.log('\n🏗️ 3. 使用DAO类读取');
  console.log('='.repeat(40));
  
  try {
    // 检查DAO文件是否存在
    const daoPath = './src/dao/index.js';
    console.log(`🏗️ DAO入口文件: ${fs.existsSync(daoPath) ? '✅ 存在' : '❌ 不存在'}`);
    
    const inquiryDaoPath = './src/dao/inquiryDao.js';
    console.log(`🏗️ InquiryDao文件: ${fs.existsSync(inquiryDaoPath) ? '✅ 存在' : '❌ 不存在'}`);
    
    // 尝试加载DAO
    const { InquiryDao } = require('./src/dao');
    console.log(`🏗️ InquiryDao加载: ✅ 成功`);
    
    // 创建实例
    const inquiryDao = new InquiryDao();
    console.log(`🏗️ InquiryDao实例化: ✅ 成功`);
    
    // 检查数据路径配置
    console.log(`🏗️ 数据文件路径: ${inquiryDao.filePath}`);
    
    // 使用不同方法读取数据
    console.log('\n📊 4. 使用不同方法读取数据');
    console.log('='.repeat(40));
    
    // 方法1: 直接read方法
    try {
      const data1 = inquiryDao.read();
      console.log(`📊 read()方法: ${Array.isArray(data1) ? `✅ 成功，${data1.length}条记录` : `❌ 失败，返回${typeof data1}`}`);
    } catch (error) {
      console.log(`📊 read()方法: ❌ 异常 - ${error.message}`);
    }
    
    // 方法2: read方法不使用缓存
    try {
      const data2 = inquiryDao.read(false);
      console.log(`📊 read(false)方法: ${Array.isArray(data2) ? `✅ 成功，${data2.length}条记录` : `❌ 失败，返回${typeof data2}`}`);
    } catch (error) {
      console.log(`📊 read(false)方法: ❌ 异常 - ${error.message}`);
    }
    
    // 方法3: findAll方法
    try {
      const data3 = inquiryDao.findAll();
      console.log(`📊 findAll()方法: ${Array.isArray(data3) ? `✅ 成功，${data3.length}条记录` : `❌ 失败，返回${typeof data3}`}`);
      
      if (Array.isArray(data3) && data3.length > 0) {
        console.log(`📊 第一条记录详情:`);
        console.log(`   ID: ${data3[0].id}`);
        console.log(`   姓名: ${data3[0].name}`);
        console.log(`   邮箱: ${data3[0].email}`);
        console.log(`   公司: ${data3[0].company || '未填写'}`);
        console.log(`   创建时间: ${data3[0].createdAt}`);
      }
    } catch (error) {
      console.log(`📊 findAll()方法: ❌ 异常 - ${error.message}`);
    }
    
  } catch (error) {
    console.log(`❌ DAO测试失败: ${error.message}`);
    console.log(`❌ 错误堆栈: ${error.stack}`);
  }
  
  // 5. 检查配置文件
  console.log('\n⚙️ 5. 检查配置文件');
  console.log('='.repeat(40));
  
  try {
    const config = require('./src/config');
    console.log(`⚙️ Config模块加载: ✅ 成功`);
    
    if (config.getDataFilePath) {
      const configPath = config.getDataFilePath('inquiries.json');
      console.log(`⚙️ 配置的文件路径: ${configPath}`);
      console.log(`⚙️ 配置路径存在: ${fs.existsSync(configPath) ? '✅ 是' : '❌ 否'}`);
    }
  } catch (error) {
    console.log(`❌ Config检查失败: ${error.message}`);
  }
  
  // 6. 模拟测试脚本的调用方式
  console.log('\n🧪 6. 模拟测试脚本调用');
  console.log('='.repeat(40));
  
  try {
    // 这是测试脚本中使用的方式
    const { InquiryDao } = require('./src/dao');
    const inquiryDao = new InquiryDao();
    const inquiries = inquiryDao.findAll();
    
    console.log(`🧪 模拟测试结果: ${Array.isArray(inquiries) ? `✅ 成功，${inquiries.length}条记录` : `❌ 失败`}`);
    
    // 如果数据为空，尝试添加测试数据
    if (Array.isArray(inquiries) && inquiries.length === 0) {
      console.log('🧪 数据为空，尝试添加测试数据...');
      
      const testInquiry = {
        name: '测试客户',
        email: 'test@example.com',
        phone: '13800138000',
        company: '测试公司',
        message: '这是一个测试询价消息，用于验证数据读取功能。',
        productId: '',
        productName: '',
        source: 'debug_test'
      };
      
      const created = inquiryDao.create(testInquiry);
      if (created) {
        console.log(`🧪 测试数据添加成功: ${created.id}`);
        
        // 重新读取验证
        const newInquiries = inquiryDao.findAll();
        console.log(`🧪 添加后数据量: ${newInquiries.length}条`);
      } else {
        console.log('🧪 测试数据添加失败');
      }
    }
    
  } catch (error) {
    console.log(`❌ 模拟测试失败: ${error.message}`);
  }
  
  console.log('\n🎯 询价数据调试完成！');
}

debugInquiryData().catch(console.error);
