// 🖼️ Diamond Website WebP图片生成脚本
// 为现有图片创建WebP版本，提升加载性能

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

console.log('🖼️ Diamond Website WebP图片生成');
console.log('=====================================');
console.log(`生成时间: ${new Date().toLocaleString('zh-CN')}`);
console.log('');

/**
 * 生成WebP图片
 */
async function generateWebPImages() {
  try {
    // 1. 检查源图片目录
    console.log('📁 检查源图片目录...');
    const uploadsDir = './uploads/products';
    if (!fs.existsSync(uploadsDir)) {
      console.error('❌ 源图片目录不存在:', uploadsDir);
      return { success: false, error: '源图片目录不存在' };
    }
    
    const files = fs.readdirSync(uploadsDir);
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));
    
    if (imageFiles.length === 0) {
      console.log('⚠️ 未找到需要转换的图片文件');
      return { success: true, message: '无需转换的图片', converted: 0 };
    }
    
    console.log(`✅ 发现 ${imageFiles.length} 个图片文件需要转换`);
    imageFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });
    
    // 2. 创建WebP目录结构
    console.log('\n📁 创建WebP目录结构...');
    const webpDir = './assets/images-webp/products';
    if (!fs.existsSync('./assets')) {
      fs.mkdirSync('./assets');
      console.log('✅ 创建 assets 目录');
    }
    if (!fs.existsSync('./assets/images-webp')) {
      fs.mkdirSync('./assets/images-webp');
      console.log('✅ 创建 images-webp 目录');
    }
    if (!fs.existsSync(webpDir)) {
      fs.mkdirSync(webpDir, { recursive: true });
      console.log('✅ 创建 products WebP 目录');
    }
    
    // 3. 批量转换图片
    console.log('\n🔄 开始批量转换图片...');
    const conversionResults = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const inputPath = path.join(uploadsDir, file);
      const outputFileName = file.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
      const outputPath = path.join(webpDir, outputFileName);
      
      try {
        console.log(`\n📸 转换 ${i + 1}/${imageFiles.length}: ${file}`);
        
        // 获取原图片信息
        const originalStats = fs.statSync(inputPath);
        const originalSizeKB = (originalStats.size / 1024).toFixed(1);
        
        const metadata = await sharp(inputPath).metadata();
        console.log(`  原图信息: ${metadata.width}x${metadata.height}, ${originalSizeKB}KB`);
        
        // 转换为WebP
        const startTime = Date.now();
        await sharp(inputPath)
          .webp({ 
            quality: 85,           // 高质量
            effort: 4,             // 平衡压缩效果和速度
            lossless: false        // 有损压缩，更小文件
          })
          .toFile(outputPath);
        
        const conversionTime = Date.now() - startTime;
        
        // 检查转换结果
        const webpStats = fs.statSync(outputPath);
        const webpSizeKB = (webpStats.size / 1024).toFixed(1);
        const compressionRatio = ((originalStats.size - webpStats.size) / originalStats.size * 100).toFixed(1);
        
        console.log(`  ✅ WebP生成: ${webpSizeKB}KB (节省 ${compressionRatio}%, 用时 ${conversionTime}ms)`);
        
        conversionResults.push({
          originalFile: file,
          webpFile: outputFileName,
          originalSize: originalStats.size,
          webpSize: webpStats.size,
          compressionRatio: parseFloat(compressionRatio),
          conversionTime: conversionTime,
          success: true
        });
        
        successCount++;
        
      } catch (error) {
        console.error(`  ❌ 转换失败: ${error.message}`);
        conversionResults.push({
          originalFile: file,
          error: error.message,
          success: false
        });
        errorCount++;
      }
    }
    
    // 4. 生成统计报告
    console.log('\n📊 转换统计报告');
    console.log('=====================================');
    console.log(`总文件数: ${imageFiles.length}`);
    console.log(`成功转换: ${successCount}`);
    console.log(`转换失败: ${errorCount}`);
    console.log(`成功率: ${((successCount / imageFiles.length) * 100).toFixed(1)}%`);
    
    if (successCount > 0) {
      const totalOriginalSize = conversionResults
        .filter(r => r.success)
        .reduce((sum, r) => sum + r.originalSize, 0);
      const totalWebpSize = conversionResults
        .filter(r => r.success)
        .reduce((sum, r) => sum + r.webpSize, 0);
      const overallCompression = ((totalOriginalSize - totalWebpSize) / totalOriginalSize * 100).toFixed(1);
      const avgConversionTime = conversionResults
        .filter(r => r.success)
        .reduce((sum, r) => sum + r.conversionTime, 0) / successCount;
      
      console.log(`总原始大小: ${(totalOriginalSize / 1024).toFixed(1)}KB`);
      console.log(`总WebP大小: ${(totalWebpSize / 1024).toFixed(1)}KB`);
      console.log(`总体压缩率: ${overallCompression}%`);
      console.log(`平均转换时间: ${avgConversionTime.toFixed(0)}ms`);
    }
    
    // 5. 显示转换详情
    if (successCount > 0) {
      console.log('\n📋 转换详情:');
      conversionResults.filter(r => r.success).forEach((result, index) => {
        console.log(`${index + 1}. ${result.originalFile} -> ${result.webpFile}`);
        console.log(`   压缩: ${(result.originalSize/1024).toFixed(1)}KB -> ${(result.webpSize/1024).toFixed(1)}KB (${result.compressionRatio}%)`);
      });
    }
    
    if (errorCount > 0) {
      console.log('\n❌ 转换失败的文件:');
      conversionResults.filter(r => !r.success).forEach((result, index) => {
        console.log(`${index + 1}. ${result.originalFile}: ${result.error}`);
      });
    }
    
    // 6. 保存转换报告
    const report = {
      conversionTime: new Date().toISOString(),
      sourceDirectory: uploadsDir,
      targetDirectory: webpDir,
      totalFiles: imageFiles.length,
      successCount: successCount,
      errorCount: errorCount,
      successRate: ((successCount / imageFiles.length) * 100).toFixed(1) + '%',
      results: conversionResults
    };
    
    if (successCount > 0) {
      const totalOriginalSize = conversionResults
        .filter(r => r.success)
        .reduce((sum, r) => sum + r.originalSize, 0);
      const totalWebpSize = conversionResults
        .filter(r => r.success)
        .reduce((sum, r) => sum + r.webpSize, 0);
      
      report.totalOriginalSize = totalOriginalSize;
      report.totalWebpSize = totalWebpSize;
      report.overallCompressionRatio = ((totalOriginalSize - totalWebpSize) / totalOriginalSize * 100).toFixed(1) + '%';
    }
    
    fs.writeFileSync('./webp-conversion-report.json', JSON.stringify(report, null, 2));
    console.log('\n💾 转换报告已保存到: webp-conversion-report.json');
    
    // 7. 返回结果
    console.log(`\n🎉 WebP图片生成${successCount === imageFiles.length ? '完全' : '部分'}成功！`);
    
    if (successCount === imageFiles.length) {
      console.log('✅ 所有图片都已成功转换为WebP格式');
      console.log('🔧 下一步: 更新WebP加载器配置');
    } else if (successCount > 0) {
      console.log(`⚠️ ${successCount}/${imageFiles.length} 个图片转换成功`);
      console.log('🔧 建议检查失败的文件并重试');
    } else {
      console.log('❌ 没有图片转换成功，请检查错误信息');
    }
    
    return {
      success: successCount > 0,
      report: report,
      successCount: successCount,
      totalCount: imageFiles.length
    };
    
  } catch (error) {
    console.error('❌ WebP图片生成失败:', error.message);
    console.error(error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

// 执行WebP图片生成
console.log('开始执行WebP图片生成...\n');
generateWebPImages().then(result => {
  if (result.success) {
    console.log('\n✅ WebP图片生成任务完成！');
    if (result.successCount === result.totalCount) {
      console.log('🚀 建议运行WebP加载器配置更新');
    }
  } else {
    console.log('\n❌ WebP图片生成任务失败');
    if (result.error) {
      console.log('错误信息:', result.error);
    }
  }
  
  console.log('\n生成完成。');
}).catch(error => {
  console.error('❌ 执行过程中发生错误:', error.message);
});
