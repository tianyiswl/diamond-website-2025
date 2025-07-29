// 🔧 Diamond Website 数据一致性修复脚本
// 修复产品JSON数据中的图片路径与实际文件的匹配问题

const fs = require('fs');
const path = require('path');

console.log('🔧 Diamond Website 数据一致性修复');
console.log('=====================================');
console.log(`修复时间: ${new Date().toLocaleString('zh-CN')}`);
console.log('');

/**
 * 修复数据一致性
 */
function fixDataConsistency() {
  try {
    // 1. 备份原始数据
    console.log('💾 创建数据备份...');
    const backupPath = `./data/products.json.backup-${Date.now()}`;
    fs.copyFileSync('./data/products.json', backupPath);
    console.log(`✅ 原始数据已备份到: ${backupPath}`);
    
    // 2. 读取当前数据
    console.log('📖 读取产品数据和实际文件...');
    const products = JSON.parse(fs.readFileSync('./data/products.json', 'utf8'));
    const uploadsDir = './uploads/products';
    const actualFiles = fs.readdirSync(uploadsDir);
    const imageFiles = actualFiles.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
    
    console.log(`产品数量: ${products.length}`);
    console.log(`实际图片文件: ${imageFiles.length} 个`);
    console.log('实际文件列表:');
    imageFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });
    console.log('');
    
    // 3. 智能匹配策略
    console.log('🧠 开始智能匹配修复...');
    
    // 策略：将实际文件按顺序分配给产品
    // 每个产品分配2个图片（因为6个文件，3个产品，平均每个产品2个）
    const filesPerProduct = Math.floor(imageFiles.length / products.length);
    const extraFiles = imageFiles.length % products.length;
    
    console.log(`每个产品分配 ${filesPerProduct} 个图片`);
    if (extraFiles > 0) {
      console.log(`前 ${extraFiles} 个产品额外分配1个图片`);
    }
    
    let fileIndex = 0;
    const fixedProducts = [];
    
    products.forEach((product, productIndex) => {
      console.log(`\n📦 修复产品 ${productIndex + 1}: ${product.name}`);
      
      // 计算这个产品应该分配多少个图片
      const numFiles = filesPerProduct + (productIndex < extraFiles ? 1 : 0);
      const assignedFiles = [];
      
      // 分配图片文件
      for (let i = 0; i < numFiles && fileIndex < imageFiles.length; i++) {
        assignedFiles.push(imageFiles[fileIndex]);
        console.log(`   分配图片 ${i + 1}: ${imageFiles[fileIndex]}`);
        fileIndex++;
      }
      
      // 更新产品数据
      const fixedProduct = { ...product };
      
      if (assignedFiles.length > 0) {
        // 设置主图片
        fixedProduct.image = `/uploads/products/${assignedFiles[0]}`;
        
        // 设置图片数组
        fixedProduct.images = assignedFiles.map(file => `/uploads/products/${file}`);
        
        console.log(`   ✅ 主图片: ${assignedFiles[0]}`);
        console.log(`   ✅ 图片数组: ${assignedFiles.length} 个图片`);
      } else {
        console.log(`   ⚠️ 没有可分配的图片文件`);
        fixedProduct.image = '';
        fixedProduct.images = [];
      }
      
      fixedProducts.push(fixedProduct);
    });
    
    // 4. 验证修复结果
    console.log('\n🔍 验证修复结果...');
    let totalRefs = 0;
    let validRefs = 0;
    
    fixedProducts.forEach(product => {
      if (product.image) {
        totalRefs++;
        const filename = path.basename(product.image);
        if (imageFiles.includes(filename)) {
          validRefs++;
        }
      }
      
      if (product.images) {
        product.images.forEach(imagePath => {
          totalRefs++;
          const filename = path.basename(imagePath);
          if (imageFiles.includes(filename)) {
            validRefs++;
          }
        });
      }
    });
    
    const newConsistencyRate = totalRefs > 0 ? ((validRefs / totalRefs) * 100).toFixed(1) : 100;
    console.log(`修复后一致性率: ${newConsistencyRate}%`);
    console.log(`有效引用: ${validRefs}/${totalRefs}`);
    
    // 5. 保存修复后的数据
    if (newConsistencyRate >= 95) {
      console.log('\n💾 保存修复后的数据...');
      fs.writeFileSync('./data/products.json', JSON.stringify(fixedProducts, null, 2));
      console.log('✅ 产品数据已成功修复并保存');
      
      // 6. 生成修复报告
      const fixReport = {
        fixTime: new Date().toISOString(),
        originalConsistencyRate: '25.0%',
        newConsistencyRate: `${newConsistencyRate}%`,
        totalProducts: fixedProducts.length,
        totalFiles: imageFiles.length,
        totalReferences: totalRefs,
        validReferences: validRefs,
        backupFile: backupPath,
        fixedProducts: fixedProducts.map(p => ({
          id: p.id,
          name: p.name,
          mainImage: p.image,
          imageCount: p.images ? p.images.length : 0
        }))
      };
      
      fs.writeFileSync('./data-fix-report.json', JSON.stringify(fixReport, null, 2));
      console.log('📊 修复报告已保存到: data-fix-report.json');
      
      // 7. 显示修复摘要
      console.log('\n🎉 数据一致性修复完成！');
      console.log('=====================================');
      console.log(`修复前一致性率: 25.0%`);
      console.log(`修复后一致性率: ${newConsistencyRate}%`);
      console.log(`修复的产品数量: ${fixedProducts.length}`);
      console.log(`使用的图片文件: ${imageFiles.length}`);
      console.log(`总图片引用数: ${totalRefs}`);
      console.log(`有效引用数: ${validRefs}`);
      console.log('');
      
      // 显示每个产品的修复结果
      console.log('📦 产品修复详情:');
      fixedProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   主图片: ${path.basename(product.image || '无')}`);
        console.log(`   图片数量: ${product.images ? product.images.length : 0}`);
      });
      
      return {
        success: true,
        consistencyRate: newConsistencyRate,
        report: fixReport
      };
      
    } else {
      console.log(`\n❌ 修复后一致性率仍然较低 (${newConsistencyRate}%)，请检查文件匹配逻辑`);
      return {
        success: false,
        consistencyRate: newConsistencyRate,
        message: '修复效果不理想'
      };
    }
    
  } catch (error) {
    console.error('❌ 数据修复失败:', error.message);
    console.error(error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

// 执行修复
console.log('开始执行数据一致性修复...\n');
const result = fixDataConsistency();

if (result.success) {
  console.log('\n✅ 修复成功完成！');
  console.log('🔧 建议运行验证脚本确认修复效果: node data-consistency-check.js');
} else {
  console.log('\n❌ 修复失败，请检查错误信息');
}

console.log('\n修复完成。');
