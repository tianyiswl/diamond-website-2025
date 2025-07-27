# 🗺️ 本地地图设置指南

## 🎯 目标

将谷歌静态地图API替换为本地图片，确保在任何网络环境下都能稳定显示地图。

## 📥 下载地图图片

### 1. 中文版地图
- **文件名**: `company-location-map-zh.jpg`
- **已完成**: ✅ 您已手动下载

### 2. 英文版地图
- **文件名**: `company-location-map-en.jpg`
- **下载地址**: 
```
https://maps.googleapis.com/maps/api/staticmap?center=31.691717,120.486254&zoom=16&size=600x400&markers=color:red%7Clabel:H%7C31.691717,120.486254&key=AIzaSyBOti4mM-6x9WDnZIjIeyEU21OpBXqWBgw&language=en&region=US
```

## 📁 文件放置位置

请将下载的图片文件放置在以下位置：

```
diamond-website/
├── assets/
│   └── images/
│       ├── company-location-map-zh.jpg  ← 中文版地图
│       └── company-location-map-en.jpg  ← 英文版地图（需下载）
```

## 📋 图片规格要求

- **尺寸**: 600 x 400 像素
- **格式**: JPG
- **质量**: 高清晰度
- **文件大小**: 建议 50-200KB

## ✅ 已完成的代码更新

### 1. HTML文件更新
- ✅ `index.html` - 主页地图图片源更新
- ✅ `manual-deploy/index.html` - 部署版本同步更新

### 2. JavaScript功能更新
- ✅ `updateStaticMapLanguage()` - 本地图片语言切换
- ✅ 调试功能适配本地图片模式
- ✅ 保持点击打开完整地图功能

### 3. 路径配置
- ✅ 主页: `assets/images/company-location-map-{lang}.jpg`
- ✅ 部署版: `../assets/images/company-location-map-{lang}.jpg`

## 🔧 功能特性

### 1. 语言切换
- **中文模式**: 显示 `company-location-map-zh.jpg`
- **英文模式**: 显示 `company-location-map-en.jpg`
- **自动切换**: 跟随网站语言设置

### 2. 交互功能保持
- ✅ 点击地图在新标签页打开谷歌地图
- ✅ 键盘访问支持（Enter/Space键）
- ✅ 悬停提示效果
- ✅ 响应式设计

### 3. 性能优势
- ✅ 无需网络请求API
- ✅ 即时加载，无延迟
- ✅ 离线环境可用
- ✅ 国内网络友好

## 🧪 测试步骤

### 1. 文件检查
```bash
# 检查文件是否存在
ls -la assets/images/company-location-map-*.jpg

# 检查文件大小
du -h assets/images/company-location-map-*.jpg
```

### 2. 功能测试
1. **启动服务器**: `node server.js`
2. **访问主页**: http://localhost:3001
3. **滚动到联系我们部分**
4. **验证地图显示**: 确认图片正常加载
5. **测试语言切换**: 中英文切换时地图图片更新
6. **测试点击功能**: 点击地图打开谷歌地图

### 3. 网络环境测试
- **有网络**: 正常显示本地图片，点击可打开在线地图
- **无网络**: 本地图片正常显示，点击功能可能无法使用
- **网络限制**: 本地图片不受影响，稳定显示

## 🔍 故障排查

### 问题1: 地图图片不显示
**可能原因**:
- 文件路径错误
- 文件名不匹配
- 文件损坏

**解决方案**:
```bash
# 检查文件路径
ls -la assets/images/company-location-map-*.jpg

# 检查文件权限
chmod 644 assets/images/company-location-map-*.jpg
```

### 问题2: 语言切换无效
**可能原因**:
- JavaScript错误
- 文件路径配置错误

**解决方案**:
1. 打开浏览器控制台查看错误
2. 检查 `updateStaticMapLanguage()` 函数
3. 验证文件路径配置

### 问题3: 图片质量问题
**解决方案**:
1. 重新下载高质量图片
2. 确保图片尺寸为600x400像素
3. 使用图片压缩工具优化文件大小

## 📊 性能对比

### 优化前（API方式）
- ❌ 依赖网络连接
- ❌ 加载时间2-3秒
- ❌ 可能被防火墙阻止
- ❌ API配额限制

### 优化后（本地图片）
- ✅ 无需网络连接
- ✅ 加载时间<0.5秒
- ✅ 不受网络限制
- ✅ 无API配额问题

## 🎉 完成确认

完成以下步骤后，本地地图设置即告完成：

- [ ] 下载英文版地图图片
- [ ] 将图片放置到指定目录
- [ ] 启动服务器测试
- [ ] 验证中英文切换功能
- [ ] 确认点击打开地图功能
- [ ] 测试不同网络环境

## 💡 维护建议

1. **定期更新**: 如公司地址变更，需重新下载地图图片
2. **备份文件**: 保留地图图片的备份副本
3. **监控加载**: 定期检查地图图片加载性能
4. **用户反馈**: 收集用户对地图显示的反馈

## 🔗 相关文件

- `index.html` - 主页地图显示
- `manual-deploy/index.html` - 部署版本
- `assets/css/main.css` - 地图样式
- `data/i18n/zh-CN.json` - 中文翻译
- `data/i18n/en-US.json` - 英文翻译

---

**注意**: 请确保下载的地图图片质量清晰，尺寸正确，以获得最佳的用户体验。
