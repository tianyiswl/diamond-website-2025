// 🤖 Diamond Website 自动化图片优化系统
// 监控新上传的图片并自动执行WebP转换和压缩优化

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const chokidar = require('chokidar');

console.log('🤖 Diamond Website 自动化图片优化系统');
console.log('=====================================');

class AutoImageOptimizationSystem {
  constructor() {
    this.uploadsDir = './uploads/products';
    this.webpDir = './assets/images-webp/products';
    this.optimizedDir = './uploads/products/optimized';
    this.watcher = null;
    this.processingQueue = new Set();
    
    this.config = {
      webp: {
        quality: 85,
        effort: 4,
        lossless: false
      },
      compression: {
        maxWidth: 1200,
        maxHeight: 900,
        quality: 85,
        progressive: true
      },
      autoStart: true,
      logLevel: 'info'
    };
    
    this.stats = {
      processed: 0,
      errors: 0,
      totalSaved: 0,
      startTime: Date.now()
    };
  }
  
  /**
   * 启动自动化监控系统
   */
  start() {
    console.log('🚀 启动自动化图片优化监控...');
    
    // 确保目录存在
    this.ensureDirectories();
    
    // 启动文件监控
    this.startFileWatcher();
    
    // 处理现有未优化的图片
    if (this.config.autoStart) {
      this.processExistingImages();
    }
    
    console.log('✅ 自动化优化系统已启动');
    console.log(`📁 监控目录: ${this.uploadsDir}`);
    console.log(`🖼️ WebP输出: ${this.webpDir}`);
    console.log('');
  }
  
  /**
   * 确保必要目录存在
   */
  ensureDirectories() {
    const dirs = [this.uploadsDir, this.webpDir, this.optimizedDir];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 创建目录: ${dir}`);
      }
    });
  }
  
  /**
   * 启动文件监控器
   */
  startFileWatcher() {
    this.watcher = chokidar.watch(this.uploadsDir, {
      ignored: /optimized|\.webp$/,
      persistent: true,
      ignoreInitial: true
    });
    
    this.watcher
      .on('add', (filePath) => this.handleNewFile(filePath))
      .on('change', (filePath) => this.handleFileChange(filePath))
      .on('error', (error) => console.error('❌ 文件监控错误:', error));
    
    console.log('👁️ 文件监控器已启动');
  }
  
  /**
   * 处理新上传的文件
   */
  async handleNewFile(filePath) {
    const fileName = path.basename(filePath);
    
    if (this.isImageFile(fileName) && !this.processingQueue.has(filePath)) {
      console.log(`📸 检测到新图片: ${fileName}`);
      await this.processImage(filePath);
    }
  }
  
  /**
   * 处理文件变更
   */
  async handleFileChange(filePath) {
    const fileName = path.basename(filePath);
    
    if (this.isImageFile(fileName)) {
      console.log(`🔄 检测到图片更新: ${fileName}`);
      await this.processImage(filePath);
    }
  }
  
  /**
   * 检查是否为图片文件
   */
  isImageFile(fileName) {
    return /\.(jpg|jpeg|png|gif)$/i.test(fileName);
  }
  
  /**
   * 处理现有未优化的图片
   */
  async processExistingImages() {
    console.log('🔍 检查现有未优化图片...');
    
    try {
      const files = fs.readdirSync(this.uploadsDir);
      const imageFiles = files.filter(file => this.isImageFile(file));
      
      for (const file of imageFiles) {
        const filePath = path.join(this.uploadsDir, file);
        const webpPath = path.join(this.webpDir, file.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp'));
        
        // 如果WebP文件不存在，则处理
        if (!fs.existsSync(webpPath)) {
          console.log(`🔄 处理现有图片: ${file}`);
          await this.processImage(filePath);
        }
      }
      
      console.log('✅ 现有图片处理完成');
    } catch (error) {
      console.error('❌ 处理现有图片失败:', error.message);
    }
  }
  
  /**
   * 处理单个图片文件
   */
  async processImage(filePath) {
    const fileName = path.basename(filePath);
    
    if (this.processingQueue.has(filePath)) {
      return; // 避免重复处理
    }
    
    this.processingQueue.add(filePath);
    
    try {
      console.log(`⚡ 开始处理: ${fileName}`);
      const startTime = Date.now();
      
      // 获取原始文件信息
      const originalStats = fs.statSync(filePath);
      const originalSize = originalStats.size;
      
      // 1. 压缩优化原图
      const optimizedPath = await this.compressImage(filePath);
      
      // 2. 生成WebP版本
      const webpPath = await this.generateWebP(filePath);
      
      // 3. 记录处理结果
      const processTime = Date.now() - startTime;
      const optimizedSize = fs.existsSync(optimizedPath) ? fs.statSync(optimizedPath).size : originalSize;
      const webpSize = fs.existsSync(webpPath) ? fs.statSync(webpPath).size : 0;
      
      const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
      const webpRatio = webpSize > 0 ? ((originalSize - webpSize) / originalSize * 100).toFixed(1) : 0;
      
      this.stats.processed++;
      this.stats.totalSaved += (originalSize - Math.min(optimizedSize, webpSize));
      
      console.log(`✅ 处理完成: ${fileName}`);
      console.log(`   原始大小: ${(originalSize/1024).toFixed(1)}KB`);
      console.log(`   压缩后: ${(optimizedSize/1024).toFixed(1)}KB (节省${compressionRatio}%)`);
      console.log(`   WebP: ${(webpSize/1024).toFixed(1)}KB (节省${webpRatio}%)`);
      console.log(`   处理时间: ${processTime}ms`);
      console.log('');
      
      // 记录到日志文件
      this.logProcessing(fileName, {
        originalSize,
        optimizedSize,
        webpSize,
        compressionRatio,
        webpRatio,
        processTime
      });
      
    } catch (error) {
      console.error(`❌ 处理失败: ${fileName}`, error.message);
      this.stats.errors++;
    } finally {
      this.processingQueue.delete(filePath);
    }
  }
  
  /**
   * 压缩图片
   */
  async compressImage(inputPath) {
    const fileName = path.basename(inputPath);
    const outputPath = path.join(this.optimizedDir, fileName);
    
    await sharp(inputPath)
      .resize(this.config.compression.maxWidth, this.config.compression.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: this.config.compression.quality,
        progressive: this.config.compression.progressive
      })
      .toFile(outputPath);
    
    return outputPath;
  }
  
  /**
   * 生成WebP版本
   */
  async generateWebP(inputPath) {
    const fileName = path.basename(inputPath);
    const webpFileName = fileName.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
    const outputPath = path.join(this.webpDir, webpFileName);
    
    await sharp(inputPath)
      .webp(this.config.webp)
      .toFile(outputPath);
    
    return outputPath;
  }
  
  /**
   * 记录处理日志
   */
  logProcessing(fileName, stats) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      fileName: fileName,
      stats: stats
    };
    
    const logPath = './data/image-optimization-log.json';
    let logs = [];
    
    if (fs.existsSync(logPath)) {
      try {
        logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
      } catch (e) {
        logs = [];
      }
    }
    
    logs.push(logEntry);
    
    // 保留最近500条记录
    if (logs.length > 500) {
      logs = logs.slice(-500);
    }
    
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
  }
  
  /**
   * 获取系统统计信息
   */
  getStats() {
    const runTime = Date.now() - this.stats.startTime;
    return {
      ...this.stats,
      runTime: runTime,
      runTimeFormatted: this.formatTime(runTime),
      totalSavedMB: (this.stats.totalSaved / (1024 * 1024)).toFixed(2),
      averageProcessTime: this.stats.processed > 0 ? (runTime / this.stats.processed).toFixed(0) + 'ms' : '0ms'
    };
  }
  
  /**
   * 格式化时间
   */
  formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}小时${minutes % 60}分钟`;
    if (minutes > 0) return `${minutes}分钟${seconds % 60}秒`;
    return `${seconds}秒`;
  }
  
  /**
   * 停止监控系统
   */
  stop() {
    if (this.watcher) {
      this.watcher.close();
      console.log('🛑 自动化优化系统已停止');
    }
  }
  
  /**
   * 显示系统状态
   */
  showStatus() {
    const stats = this.getStats();
    console.log('\n📊 自动化优化系统状态');
    console.log('========================');
    console.log(`运行时间: ${stats.runTimeFormatted}`);
    console.log(`处理图片: ${stats.processed} 个`);
    console.log(`处理错误: ${stats.errors} 个`);
    console.log(`节省空间: ${stats.totalSavedMB} MB`);
    console.log(`平均处理时间: ${stats.averageProcessTime}`);
    console.log(`队列中: ${this.processingQueue.size} 个`);
  }
}

// 手动处理命令
async function manualProcess(imagePath) {
  console.log('🔧 手动处理模式');
  const optimizer = new AutoImageOptimizationSystem();
  optimizer.ensureDirectories();
  
  if (fs.existsSync(imagePath)) {
    await optimizer.processImage(imagePath);
    console.log('✅ 手动处理完成');
  } else {
    console.error('❌ 文件不存在:', imagePath);
  }
}

// 批量处理命令
async function batchProcess() {
  console.log('📦 批量处理模式');
  const optimizer = new AutoImageOptimizationSystem();
  optimizer.ensureDirectories();
  await optimizer.processExistingImages();
  console.log('✅ 批量处理完成');
}

// 导出模块
module.exports = {
  AutoImageOptimizationSystem,
  manualProcess,
  batchProcess
};

// 如果直接运行此脚本
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'manual' && args[1]) {
    // 手动处理单个文件
    manualProcess(args[1]);
  } else if (args[0] === 'batch') {
    // 批量处理
    batchProcess();
  } else if (args[0] === 'start') {
    // 启动自动监控
    const optimizer = new AutoImageOptimizationSystem();
    optimizer.start();
    
    // 每30秒显示状态
    setInterval(() => {
      optimizer.showStatus();
    }, 30000);
    
    // 优雅退出
    process.on('SIGINT', () => {
      console.log('\n🛑 正在停止自动化优化系统...');
      optimizer.stop();
      optimizer.showStatus();
      process.exit(0);
    });
  } else {
    console.log('📖 使用方法:');
    console.log('  node auto-image-optimization-system.js start    # 启动自动监控');
    console.log('  node auto-image-optimization-system.js batch   # 批量处理现有图片');
    console.log('  node auto-image-optimization-system.js manual <文件路径>  # 手动处理单个文件');
  }
}
