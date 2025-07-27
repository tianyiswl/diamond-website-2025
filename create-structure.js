// 创建模块化目录结构的脚本
const fs = require('fs');
const path = require('path');

// 需要创建的目录结构
const directories = [
  'src',
  'src/config',
  'src/middleware', 
  'src/routes',
  'src/services',
  'src/dao',
  'src/utils'
];

console.log('🚀 开始创建模块化目录结构...');

directories.forEach(dir => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ 创建目录: ${dir}`);
    } else {
      console.log(`📁 目录已存在: ${dir}`);
    }
  } catch (error) {
    console.error(`❌ 创建目录失败 ${dir}:`, error.message);
  }
});

// 创建基础的index.js文件
const indexFiles = [
  'src/config/index.js',
  'src/middleware/index.js', 
  'src/routes/index.js',
  'src/utils/index.js'
];

indexFiles.forEach(file => {
  try {
    if (!fs.existsSync(file)) {
      const dirName = path.dirname(file).split('/').pop();
      const content = `// ${dirName} 模块导出文件\n// 由模块化重构自动生成\n\nmodule.exports = {\n  // TODO: 添加模块导出\n};\n`;
      fs.writeFileSync(file, content);
      console.log(`✅ 创建文件: ${file}`);
    }
  } catch (error) {
    console.error(`❌ 创建文件失败 ${file}:`, error.message);
  }
});

console.log('🎉 目录结构创建完成！');
