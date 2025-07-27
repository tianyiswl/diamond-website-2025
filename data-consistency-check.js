// 🔍 Diamond Website 数据一致性检查脚本
// 检查产品JSON数据中的图片路径与实际文件的匹配情况

const fs = require('fs');
const path = require('path');

console.log('🔍 Diamond Website 数据一致性检查');
console.log('=====================================');
console.log(`检查时间: ${new Date().toLocaleString('zh-CN')}`);
console.log('');

/**
 * 检查数据一致性
 */
function checkDataConsistency() {
  try {
    // 1. 读取产品数据
    console.log('📖 正在读取产品数据...');
    const productsPath = './data/products.json';
    if (!fs.existsSync(productsPath)) {
      console.error('❌ 产品数据文件不存在:', productsPath);
      return false;
    }
    
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    console.log(`✅ 成功读取 ${products.length} 个产品数据`);
    
    // 2. 检查uploads目录
    console.log('📁 正在检查uploads目录...');
    const uploadsDir = './uploads/products';
    if (!fs.existsSync(uploadsDir)) {
      console.error('❌ uploads目录不存在:', uploadsDir);
      return false;
    }
    
    const actualFiles = fs.readdirSync(uploadsDir);
    const imageFiles = actualFiles.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
    console.log(`✅ 发现 ${imageFiles.length} 个实际图片文件`);
    console.log('实际文件列表:');
    imageFiles.forEach(file => {
      const stats = fs.statSync(path.join(uploadsDir, file));
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`  - ${file} (${sizeKB} KB)`);
    });
    console.log('');
    
    // 3. 数据一致性分析
    console.log('🔍 开始数据一致性分析...');
    console.log('=====================================');
    
    let totalReferences = 0;
    let validReferences = 0;
    let invalidReferences = 0;
    const issues = [];
    
    products.forEach((product, index) => {
      console.log(`\n📦 产品 ${index + 1}: ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   SKU: ${product.sku}`);
      
      // 检查主图片
      if (product.image) {
        totalReferences++;
        const imagePath = product.image;
        const filename = path.basename(imagePath);
        const exists = imageFiles.includes(filename);
        
        console.log(`   主图片: ${filename} ${exists ? '✅ 存在' : '❌ 缺失'}`);
        
        if (exists) {
          validReferences++;
        } else {
          invalidReferences++;
          issues.push({
            productId: product.id,
            productName: product.name,
            type: '主图片',
            path: imagePath,
            filename: filename,
            issue: '文件不存在'
          });
        }
      }
      
      // 检查图片数组
      if (product.images && Array.isArray(product.images)) {
        console.log(`   图片数组: ${product.images.length} 个引用`);
        
        product.images.forEach((imagePath, imgIndex) => {
          totalReferences++;
          const filename = path.basename(imagePath);
          const exists = imageFiles.includes(filename);
          
          console.log(`     ${imgIndex + 1}. ${filename} ${exists ? '✅ 存在' : '❌ 缺失'}`);
          
          if (exists) {
            validReferences++;
          } else {
            invalidReferences++;
            issues.push({
              productId: product.id,
              productName: product.name,
              type: `图片数组[${imgIndex}]`,
              path: imagePath,
              filename: filename,
              issue: '文件不存在'
            });
          }
        });
      }
    });
    
    // 4. 检查孤立文件（存在但未被引用的文件）
    console.log('\n🔍 检查孤立文件...');
    const referencedFiles = new Set();
    products.forEach(product => {
      if (product.image) {
        referencedFiles.add(path.basename(product.image));
      }
      if (product.images) {
        product.images.forEach(imagePath => {
          referencedFiles.add(path.basename(imagePath));
        });
      }
    });
    
    const orphanedFiles = imageFiles.filter(file => !referencedFiles.has(file));
    if (orphanedFiles.length > 0) {
      console.log(`⚠️ 发现 ${orphanedFiles.length} 个孤立文件（存在但未被引用）:`);
      orphanedFiles.forEach(file => {
        console.log(`   - ${file}`);
        issues.push({
          type: '孤立文件',
          filename: file,
          issue: '文件存在但未被产品数据引用'
        });
      });
    } else {
      console.log('✅ 未发现孤立文件');
    }
    
    // 5. 生成检查报告
    console.log('\n📊 数据一致性检查报告');
    console.log('=====================================');
    console.log(`总产品数量: ${products.length}`);
    console.log(`实际图片文件: ${imageFiles.length} 个`);
    console.log(`图片引用总数: ${totalReferences} 个`);
    console.log(`有效引用: ${validReferences} 个`);
    console.log(`无效引用: ${invalidReferences} 个`);
    console.log(`孤立文件: ${orphanedFiles.length} 个`);
    console.log(`一致性率: ${((validReferences / totalReferences) * 100).toFixed(1)}%`);
    
    // 6. 问题详情
    if (issues.length > 0) {
      console.log(`\n❌ 发现 ${issues.length} 个问题:`);
      issues.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.type}`);
        if (issue.productName) {
          console.log(`   产品: ${issue.productName} (ID: ${issue.productId})`);
        }
        console.log(`   文件: ${issue.filename}`);
        console.log(`   问题: ${issue.issue}`);
        if (issue.path) {
          console.log(`   路径: ${issue.path}`);
        }
      });
    } else {
      console.log('\n✅ 未发现数据一致性问题');
    }
    
    // 7. 保存检查报告
    const report = {
      checkTime: new Date().toISOString(),
      summary: {
        totalProducts: products.length,
        actualFiles: imageFiles.length,
        totalReferences: totalReferences,
        validReferences: validReferences,
        invalidReferences: invalidReferences,
        orphanedFiles: orphanedFiles.length,
        consistencyRate: ((validReferences / totalReferences) * 100).toFixed(1)
      },
      issues: issues,
      actualFiles: imageFiles,
      orphanedFiles: orphanedFiles
    };
    
    fs.writeFileSync('./data-consistency-report.json', JSON.stringify(report, null, 2));
    console.log('\n💾 检查报告已保存到: data-consistency-report.json');
    
    // 8. 返回检查结果
    const isConsistent = issues.length === 0;
    console.log(`\n🎯 检查结果: ${isConsistent ? '✅ 数据一致' : '❌ 存在不一致'}`);
    
    return {
      isConsistent,
      report,
      needsFix: !isConsistent
    };
    
  } catch (error) {
    console.error('❌ 数据一致性检查失败:', error.message);
    return false;
  }
}

// 执行检查
const result = checkDataConsistency();

if (result && result.needsFix) {
  console.log('\n🔧 建议执行数据修复脚本: node fix-data-consistency.js');
} else if (result && result.isConsistent) {
  console.log('\n🎉 数据一致性检查通过，无需修复！');
}

console.log('\n检查完成。');
