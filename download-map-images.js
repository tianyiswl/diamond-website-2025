/**
 * 地图图片下载脚本
 * 用于将谷歌静态地图API图片下载到本地，解决国内网络访问问题
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 地图配置
const MAP_CONFIG = {
  latitude: 31.691717,
  longitude: 120.486254,
  zoom: 16,
  size: '600x400',
  apiKey: 'AIzaSyBOti4mM-6x9WDnZIjIeyEU21OpBXqWBgw' // 示例密钥，请替换为有效密钥
};

// 图片保存目录
const IMAGES_DIR = path.join(__dirname, 'assets', 'images');

// 确保目录存在
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// 生成地图URL
function generateMapUrl(language, label) {
  const coords = `${MAP_CONFIG.latitude},${MAP_CONFIG.longitude}`;
  const region = language === 'zh-CN' ? 'CN' : 'US';
  
  return `https://maps.googleapis.com/maps/api/staticmap?` +
    `center=${coords}&` +
    `zoom=${MAP_CONFIG.zoom}&` +
    `size=${MAP_CONFIG.size}&` +
    `markers=color:red%7Clabel:${encodeURIComponent(label)}%7C${coords}&` +
    `key=${MAP_CONFIG.apiKey}&` +
    `language=${language}&` +
    `region=${region}`;
}

// 下载图片函数
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    console.log(`📥 开始下载: ${filename}`);
    console.log(`🔗 URL: ${url}`);
    
    const file = fs.createWriteStream(path.join(IMAGES_DIR, filename));
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ 下载完成: ${filename}`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(path.join(IMAGES_DIR, filename), () => {}); // 删除不完整的文件
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// 主下载函数
async function downloadMapImages() {
  console.log('🗺️ 开始下载地图图片...\n');
  
  try {
    // 下载中文地图
    const zhUrl = generateMapUrl('zh-CN', '皇');
    await downloadImage(zhUrl, 'company-location-map-zh.jpg');
    
    // 下载英文地图
    const enUrl = generateMapUrl('en', 'H');
    await downloadImage(enUrl, 'company-location-map-en.jpg');
    
    console.log('\n🎉 所有地图图片下载完成！');
    console.log(`📁 保存位置: ${IMAGES_DIR}`);
    console.log('\n📋 下载的文件:');
    console.log('  - company-location-map-zh.jpg (中文版)');
    console.log('  - company-location-map-en.jpg (英文版)');
    
    // 检查文件大小
    const zhStats = fs.statSync(path.join(IMAGES_DIR, 'company-location-map-zh.jpg'));
    const enStats = fs.statSync(path.join(IMAGES_DIR, 'company-location-map-en.jpg'));
    
    console.log('\n📊 文件信息:');
    console.log(`  - 中文地图: ${(zhStats.size / 1024).toFixed(2)} KB`);
    console.log(`  - 英文地图: ${(enStats.size / 1024).toFixed(2)} KB`);
    
    console.log('\n🔧 下一步操作:');
    console.log('1. 检查下载的图片质量和内容');
    console.log('2. 运行代码更新脚本更新HTML文件');
    console.log('3. 测试本地化地图功能');
    
  } catch (error) {
    console.error('❌ 下载失败:', error.message);
    console.log('\n🔧 解决方案:');
    console.log('1. 检查网络连接');
    console.log('2. 确认API密钥有效');
    console.log('3. 尝试使用VPN或其他网络环境');
    console.log('4. 手动下载图片并放置到 assets/images/ 目录');
    
    process.exit(1);
  }
}

// 手动下载指导
function showManualDownloadGuide() {
  console.log('\n📖 手动下载指导:');
  console.log('\n如果自动下载失败，请手动下载以下URL的图片:');
  
  const zhUrl = generateMapUrl('zh-CN', '皇');
  const enUrl = generateMapUrl('en', 'H');
  
  console.log('\n🇨🇳 中文地图:');
  console.log(`URL: ${zhUrl}`);
  console.log(`保存为: ${path.join(IMAGES_DIR, 'company-location-map-zh.jpg')}`);
  
  console.log('\n🇺🇸 英文地图:');
  console.log(`URL: ${enUrl}`);
  console.log(`保存为: ${path.join(IMAGES_DIR, 'company-location-map-en.jpg')}`);
  
  console.log('\n💡 提示:');
  console.log('- 在浏览器中打开URL');
  console.log('- 右键保存图片到指定位置');
  console.log('- 确保文件名正确');
  console.log('- 图片尺寸应为600x400像素');
}

// 检查现有图片
function checkExistingImages() {
  const zhPath = path.join(IMAGES_DIR, 'company-location-map-zh.jpg');
  const enPath = path.join(IMAGES_DIR, 'company-location-map-en.jpg');
  
  const zhExists = fs.existsSync(zhPath);
  const enExists = fs.existsSync(enPath);
  
  if (zhExists && enExists) {
    console.log('✅ 发现现有地图图片:');
    console.log(`  - ${zhPath}`);
    console.log(`  - ${enPath}`);
    
    const zhStats = fs.statSync(zhPath);
    const enStats = fs.statSync(enPath);
    
    console.log('\n📊 文件信息:');
    console.log(`  - 中文地图: ${(zhStats.size / 1024).toFixed(2)} KB`);
    console.log(`  - 英文地图: ${(enStats.size / 1024).toFixed(2)} KB`);
    
    return true;
  }
  
  return false;
}

// 主程序
if (require.main === module) {
  console.log('🗺️ 地图图片本地化工具\n');
  
  // 检查是否已有图片
  if (checkExistingImages()) {
    console.log('\n❓ 图片已存在，是否重新下载？');
    console.log('如需重新下载，请删除现有图片后重新运行此脚本。');
  } else {
    // 开始下载
    downloadMapImages().catch(() => {
      showManualDownloadGuide();
    });
  }
}

module.exports = {
  downloadMapImages,
  generateMapUrl,
  MAP_CONFIG
};
