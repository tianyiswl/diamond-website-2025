# 🤖 Diamond Website 自动化图片优化操作指南

## 📋 概述

自动化图片优化系统可以监控新上传的图片并自动执行WebP转换和压缩优化，无需手动干预。

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install chokidar --save
```

### 2. 启动自动监控系统
```bash
# 启动自动监控（推荐用于生产环境）
node auto-image-optimization-system.js start
```

### 3. 手动处理选项
```bash
# 批量处理现有图片
node auto-image-optimization-system.js batch

# 手动处理单个文件
node auto-image-optimization-system.js manual ./uploads/products/new-image.jpg
```

## 📁 目录结构

```
uploads/products/           # 原始图片上传目录
├── image1.jpg             # 原始图片
├── image2.png             # 原始图片
└── optimized/             # 压缩后的图片
    ├── image1.jpg         # 压缩优化版本
    └── image2.png         # 压缩优化版本

assets/images-webp/products/  # WebP图片目录
├── image1.webp            # WebP版本
└── image2.webp            # WebP版本

data/
└── image-optimization-log.json  # 处理日志
```

## ⚙️ 配置参数

系统默认配置：
- **WebP质量**: 85%
- **压缩质量**: 85%
- **最大尺寸**: 1200x900像素
- **渐进式JPEG**: 启用

## 🔧 生产环境部署

### 1. 集成到服务器启动脚本
```bash
# 在server.js中添加
const { AutoImageOptimizationSystem } = require('./auto-image-optimization-system');

// 启动自动优化系统
const imageOptimizer = new AutoImageOptimizationSystem();
imageOptimizer.start();
```

### 2. PM2进程管理
```bash
# 创建ecosystem.config.js
module.exports = {
  apps: [{
    name: 'diamond-website',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }, {
    name: 'image-optimizer',
    script: 'auto-image-optimization-system.js',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false
  }]
};

# 启动
pm2 start ecosystem.config.js
```

### 3. 系统服务（Linux）
```bash
# 创建 /etc/systemd/system/diamond-image-optimizer.service
[Unit]
Description=Diamond Website Image Optimizer
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/diamond-website
ExecStart=/usr/bin/node auto-image-optimization-system.js start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# 启用服务
sudo systemctl enable diamond-image-optimizer
sudo systemctl start diamond-image-optimizer
```

## 📊 监控和日志

### 查看实时状态
系统每30秒显示一次状态信息：
- 运行时间
- 处理图片数量
- 错误数量
- 节省空间
- 平均处理时间

### 日志文件
- **位置**: `./data/image-optimization-log.json`
- **内容**: 每个图片的处理记录
- **保留**: 最近500条记录

### API集成
```javascript
// 在server.js中添加状态API
app.get('/api/image-optimizer/stats', (req, res) => {
  const stats = imageOptimizer.getStats();
  res.json(stats);
});
```

## 🔄 工作流程

1. **文件监控**: 监控 `uploads/products/` 目录
2. **自动检测**: 检测新上传或修改的图片文件
3. **压缩优化**: 生成压缩版本到 `optimized/` 目录
4. **WebP转换**: 生成WebP版本到 `assets/images-webp/products/`
5. **日志记录**: 记录处理结果和统计信息

## ⚠️ 注意事项

1. **磁盘空间**: 确保有足够空间存储原图、压缩版和WebP版
2. **权限设置**: 确保Node.js进程有读写相关目录的权限
3. **内存使用**: 大图片处理可能消耗较多内存
4. **并发处理**: 系统会排队处理，避免同时处理过多图片

## 🛠️ 故障排除

### 常见问题

1. **监控不工作**
   ```bash
   # 检查目录权限
   ls -la uploads/products/
   
   # 检查进程状态
   ps aux | grep auto-image-optimization
   ```

2. **WebP生成失败**
   ```bash
   # 检查sharp依赖
   npm list sharp
   
   # 重新安装
   npm install sharp --save
   ```

3. **内存不足**
   ```bash
   # 监控内存使用
   top -p $(pgrep -f auto-image-optimization)
   
   # 调整配置减少并发处理
   ```

## 📞 技术支持

如遇问题，请检查：
1. 系统日志: `./data/image-optimization-log.json`
2. 控制台输出
3. 文件权限设置
4. 依赖包安装状态
