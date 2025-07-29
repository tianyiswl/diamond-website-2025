// 检查图片文件大小的脚本
const fs = require('fs');
const path = require('path');

console.log('📊 Diamond Website 图片文件分析');
console.log('================================');

try {
  const uploadsDir = './uploads/products';
  if (!fs.existsSync(uploadsDir)) {
    console.log('❌ uploads/products 目录不存在');
    process.exit(1);
  }
  
  const files = fs.readdirSync(uploadsDir);
  const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
  
  if (imageFiles.length === 0) {
    console.log('❌ 未找到图片文件');
    process.exit(1);
  }
  
  let totalSize = 0;
  console.log('图片文件详情:');
  
  imageFiles.forEach(file => {
    const filePath = path.join(uploadsDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`  ${file}: ${sizeKB} KB (${sizeMB} MB)`);
    totalSize += stats.size;
  });
  
  const totalMB = (totalSize / (1024 * 1024)).toFixed(2);
  const avgMB = (totalMB / imageFiles.length).toFixed(2);
  
  console.log('================================');
  console.log(`总计: ${imageFiles.length} 个文件, ${totalMB} MB`);
  console.log(`平均大小: ${avgMB} MB/图片`);
  
  // 分析压缩潜力
  const avgSizeKB = totalSize / imageFiles.length / 1024;
  if (avgSizeKB > 500) {
    console.log('⚠️ 图片文件较大，建议压缩优化');
  } else if (avgSizeKB > 200) {
    console.log('💡 图片大小适中，可考虑轻度优化');
  } else {
    console.log('✅ 图片大小已经较为合理');
  }
  
} catch (error) {
  console.error('❌ 分析失败:', error.message);
}
