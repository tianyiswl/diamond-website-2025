# 🗄️ Diamond Website 数据库迁移完整指南

## 📋 概述

本指南为**无锡皇德国际贸易有限公司**的Diamond Website项目提供完整的数据库迁移方案，将现有的JSON文件存储系统迁移到PostgreSQL数据库，使用Prisma ORM进行数据管理。

## 🎯 迁移目标

- ✅ 将JSON文件数据迁移到PostgreSQL数据库
- ✅ 保持前端显示效果完全一致
- ✅ 提供强大的产品管理后台
- ✅ 支持高性能数据查询和分析
- ✅ 确保数据安全和备份机制

## 📊 当前数据架构分析

### 现有数据文件
```
data/
├── products.json      # 4个产品，包含详细规格信息
├── categories.json    # 5个产品分类
├── company.json       # 公司信息
├── carousel.json      # 轮播图配置
├── inquiries.json     # 客户询价记录
├── analytics.json     # 分析数据
└── admin-config.json  # 管理员配置
```

### 前端数据读取方式
- API端点：`/api/public/products` - 获取产品数据
- 直接读取：`/data/company.json` - 公司信息
- 统一管理：CategoryManager - 分类数据
- 智能缓存：提升性能

## 🏗️ 新数据库架构设计

### 核心数据表

#### 📦 产品表 (products)
```sql
- id: 主键ID
- sku: 产品SKU编号
- name: 产品名称
- model: 产品型号
- categoryId: 分类ID (外键)
- description: 详细描述
- price: 价格
- stock: 库存
- oeNumber: OE号码
- compatibility: 兼容性信息
- warranty: 保修期
- isNew/isHot/isRecommend: 产品标记
```

#### 📂 分类表 (categories)
```sql
- id: 主键ID
- name: 分类名称
- description: 分类描述
- order: 显示顺序
- status: 状态
```

#### 🖼️ 产品图片表 (product_images)
```sql
- id: 主键ID
- productId: 产品ID (外键)
- url: 图片路径
- isPrimary: 是否主图
- order: 显示顺序
```

#### 🏢 公司信息表 (company)
```sql
- id: 主键ID
- name: 公司名称
- phone/email/address: 联系信息
- social: 社交媒体链接
```

#### 📞 询价表 (inquiries)
```sql
- id: 主键ID
- customerName: 客户姓名
- email: 客户邮箱
- message: 询价内容
- productId: 关联产品 (可选)
- status: 处理状态
```

## 🚀 迁移实施步骤

### 第一步：环境准备

1. **安装PostgreSQL数据库**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

2. **创建数据库和用户**
```sql
-- 连接到PostgreSQL
sudo -u postgres psql

-- 创建数据库
CREATE DATABASE diamond_website;

-- 创建用户
CREATE USER diamond_user WITH PASSWORD 'diamond_password';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE diamond_website TO diamond_user;
```

3. **安装Node.js依赖**
```bash
# 合并数据库相关依赖到主package.json
npm install @prisma/client prisma pg dotenv
npm install --save-dev @types/pg
```

### 第二步：配置Prisma

1. **配置环境变量**
```bash
# 复制数据库配置
cp .env.database .env

# 编辑数据库连接字符串
DATABASE_URL="postgresql://diamond_user:diamond_password@localhost:5432/diamond_website?schema=public"
```

2. **初始化Prisma**
```bash
# 生成Prisma客户端
npx prisma generate

# 推送数据库模式
npx prisma db push

# 查看数据库（可选）
npx prisma studio
```

### 第三步：执行数据迁移

1. **备份现有数据**
```bash
# 创建备份目录
mkdir -p backup/migration

# 备份JSON文件
cp -r data/ backup/migration/data-backup-$(date +%Y%m%d)
```

2. **运行迁移脚本**
```bash
# 执行数据迁移
node scripts/migrate-to-database.js
```

3. **验证迁移结果**
```bash
# 运行测试验证
node scripts/test-migration.js
```

### 第四步：更新API路由

1. **集成新的数据库API**
```javascript
// 在server.js中添加
const databaseApiRoutes = require('./src/routes/database-api');
app.use('/api/db', databaseApiRoutes);
```

2. **渐进式切换API端点**
```javascript
// 前端可以逐步切换到新API
// 旧API: /api/public/products
// 新API: /api/db/public/products
```

### 第五步：启用管理后台

1. **访问数据库管理界面**
```
http://localhost:3001/admin/database-management.html
```

2. **验证管理功能**
- 查看迁移状态
- 测试产品管理
- 验证数据一致性

## 🧪 测试验证清单

### ✅ 数据完整性验证
- [ ] 产品数量一致 (JSON vs 数据库)
- [ ] 分类数量一致
- [ ] 公司信息完整
- [ ] 图片路径正确
- [ ] 询价数据完整

### ✅ API功能验证
- [ ] `/api/db/public/products` - 产品列表
- [ ] `/api/db/public/products/:id` - 产品详情
- [ ] `/api/db/categories` - 分类列表
- [ ] `/api/db/company` - 公司信息
- [ ] `/api/db/carousel` - 轮播图
- [ ] `/api/db/health` - 健康检查

### ✅ 前端显示验证
- [ ] 首页产品展示正常
- [ ] 产品详情页显示完整
- [ ] 分类筛选功能正常
- [ ] 搜索功能正常
- [ ] 询价功能正常

### ✅ 性能验证
- [ ] 页面加载速度
- [ ] API响应时间
- [ ] 数据库查询性能
- [ ] 缓存机制有效

## 🔧 故障排除

### 常见问题及解决方案

#### 1. 数据库连接失败
```bash
# 检查PostgreSQL服务状态
sudo systemctl status postgresql

# 检查连接配置
psql -h localhost -U diamond_user -d diamond_website

# 检查防火墙设置
sudo ufw allow 5432
```

#### 2. Prisma生成失败
```bash
# 清除Prisma缓存
npx prisma generate --force

# 重置数据库
npx prisma migrate reset
```

#### 3. 迁移数据不完整
```bash
# 检查原始数据文件
ls -la data/

# 重新运行迁移
node scripts/migrate-to-database.js

# 验证数据
node scripts/test-migration.js
```

#### 4. API端点404错误
```bash
# 检查路由配置
grep -r "database-api" src/

# 重启服务器
npm start
```

## 📈 性能优化建议

### 数据库优化
```sql
-- 创建索引
CREATE INDEX idx_products_category ON products(categoryId);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || description));
```

### 缓存策略
```javascript
// Redis缓存配置
const redis = require('redis');
const client = redis.createClient();

// 缓存产品列表
app.get('/api/db/public/products', cache('5 minutes'), handler);
```

## 🔒 安全考虑

### 数据库安全
- 使用强密码
- 限制数据库访问IP
- 定期备份数据
- 启用SSL连接

### API安全
- 输入验证和清理
- SQL注入防护 (Prisma自动处理)
- 访问频率限制
- 错误信息脱敏

## 📋 维护计划

### 日常维护
- [ ] 每日数据备份
- [ ] 监控数据库性能
- [ ] 检查错误日志
- [ ] 更新统计数据

### 定期维护
- [ ] 每周数据库优化
- [ ] 每月性能分析
- [ ] 季度安全审计
- [ ] 年度架构评估

## 🎉 迁移完成后的优势

### 🚀 性能提升
- 数据库查询比JSON文件读取快10-100倍
- 支持复杂查询和聚合操作
- 自动索引优化
- 连接池管理

### 🛠️ 管理便利
- 可视化产品管理界面
- 批量操作支持
- 实时数据更新
- 详细操作日志

### 📊 数据分析
- 产品浏览统计
- 询价趋势分析
- 用户行为追踪
- 业务报表生成

### 🔧 扩展性
- 支持大量产品数据
- 多用户并发访问
- 微服务架构就绪
- 云部署友好

---

**🏢 无锡皇德国际贸易有限公司**  
**📧 技术支持**: sales03@diamond-auto.com  
**📞 联系电话**: +86 136 5615 7230
