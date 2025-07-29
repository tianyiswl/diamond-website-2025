// 🔍 语法错误检查脚本
// 逐个检查模块文件的语法错误

const fs = require('fs');
const path = require('path');

console.log('🔍 开始检查模块语法错误...\n');

// 要检查的模块文件列表 - 分组检查
const moduleGroups = {
  config: [
    'src/config/database.js',
    'src/config/security.js',
    'src/config/cache.js',
    'src/config/index.js'
  ],
  utils: [
    'src/utils/dateUtils.js',
    'src/utils/fileUtils.js',
    'src/utils/validationUtils.js',
    'src/utils/cryptoUtils.js',
    'src/utils/index.js'
  ],
  dao: [
    'src/dao/baseDao.js',
    'src/dao/productDao.js',
    'src/dao/categoryDao.js',
    'src/dao/inquiryDao.js',
    'src/dao/analyticsDao.js',
    'src/dao/adminDao.js',
    'src/dao/index.js'
  ]
};

let totalFiles = 0;
let errorFiles = 0;
const errors = [];

// 检查单个文件的语法
function checkFileSyntax(filePath) {
  totalFiles++;
  
  try {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.log(`❌ 文件不存在: ${filePath}`);
      errorFiles++;
      errors.push({
        file: filePath,
        error: '文件不存在'
      });
      return false;
    }

    // 尝试require文件来检查语法
    console.log(`🔍 检查: ${filePath}`);
    
    // 清除require缓存
    const fullPath = path.resolve(filePath);
    delete require.cache[fullPath];
    
    // 尝试加载模块
    require(fullPath);
    console.log(`✅ 语法正确: ${filePath}`);
    return true;
    
  } catch (error) {
    console.log(`❌ 语法错误: ${filePath}`);
    console.log(`   错误信息: ${error.message}`);
    
    errorFiles++;
    errors.push({
      file: filePath,
      error: error.message,
      stack: error.stack
    });
    return false;
  }
}

// 检查所有文件组
console.log('开始分组检查模块文件...\n');

for (const [groupName, files] of Object.entries(moduleGroups)) {
  console.log(`\n📁 检查 ${groupName.toUpperCase()} 模块组:`);
  console.log('='.repeat(40));

  for (const filePath of files) {
    checkFileSyntax(filePath);
  }
}

// 输出总结
console.log('='.repeat(60));
console.log('📊 语法检查结果总结');
console.log('='.repeat(60));
console.log(`总文件数: ${totalFiles}`);
console.log(`正确文件: ${totalFiles - errorFiles} ✅`);
console.log(`错误文件: ${errorFiles} ❌`);
console.log(`成功率: ${((totalFiles - errorFiles) / totalFiles * 100).toFixed(2)}%`);

if (errorFiles > 0) {
  console.log('\n❌ 发现的语法错误:');
  console.log('-'.repeat(40));
  
  errors.forEach((error, index) => {
    console.log(`${index + 1}. 文件: ${error.file}`);
    console.log(`   错误: ${error.error}`);
    console.log('');
  });
  
  console.log('🔧 建议修复步骤:');
  console.log('1. 检查文件中的语法错误（括号、引号、分号等）');
  console.log('2. 确认所有require的模块路径正确');
  console.log('3. 检查ES6语法是否正确使用');
  console.log('4. 验证JSON格式是否正确');
} else {
  console.log('\n🎉 所有模块文件语法检查通过！');
}

console.log('\n' + '='.repeat(60));
