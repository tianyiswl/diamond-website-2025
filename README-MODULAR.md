# 🚀 Diamond Website 模块化重构文档

## 📋 项目概述

Diamond Website 是一个专业的钻石工具产品展示和询价网站。本项目经过全面的模块化重构，提升了代码的可维护性、可扩展性和性能。

### ✨ 重构亮点

- 🏗️ **模块化架构**: 采用分层架构设计，职责清晰分离
- 🔧 **配置管理**: 统一的配置管理系统，支持环境变量
- 🛡️ **安全增强**: JWT认证、权限控制、数据验证
- 📊 **数据访问层**: 统一的数据访问接口，支持缓存
- 🌐 **RESTful API**: 标准化的API设计，完整的错误处理
- 🧪 **测试覆盖**: 完整的单元测试和集成测试
- 📝 **日志系统**: 详细的操作日志和错误追踪

## 🏗️ 架构设计

```
diamond-website/
├── src/                    # 源代码目录
│   ├── config/            # 配置管理模块
│   ├── utils/             # 工具函数模块
│   ├── dao/               # 数据访问层
│   ├── services/          # 业务逻辑层
│   ├── middleware/        # 中间件模块
│   └── routes/            # 路由模块
├── data/                  # 数据存储目录
├── public/                # 静态资源
├── admin/                 # 管理后台
├── tests/                 # 测试文件
└── docs/                  # 文档目录
```

### 🔄 分层架构

1. **表现层 (Presentation Layer)**
   - 路由处理 (`src/routes/`)
   - 中间件 (`src/middleware/`)

2. **业务逻辑层 (Business Logic Layer)**
   - 服务层 (`src/services/`)
   - 业务规则和流程控制

3. **数据访问层 (Data Access Layer)**
   - DAO模式 (`src/dao/`)
   - 数据持久化和缓存

4. **基础设施层 (Infrastructure Layer)**
   - 配置管理 (`src/config/`)
   - 工具函数 (`src/utils/`)

## 🚀 快速开始

### 环境要求

- Node.js >= 14.0.0
- npm >= 6.0.0

### 安装依赖

```bash
npm install
```

### 启动服务器

```bash
# 使用重构后的模块化服务器
node server-modular.js

# 或使用原始服务器（兼容性）
node server.js
```

### 运行测试

```bash
# 集成测试
node integration-test.js

# 性能测试
node performance-test.js

# 单元测试
node test-config.js
node test-utils.js
node test-dao.js
node test-middleware.js
node test-routes.js
node test-services.js
```

## 📚 模块详解

### ⚙️ 配置管理 (`src/config/`)

统一的配置管理系统，支持环境变量和多环境配置。

```javascript
const config = require('./src/config');

// 服务器配置
console.log(config.server.port);

// 数据库配置
console.log(config.database.path);

// 安全配置
console.log(config.security.jwt.secret);
```

**主要功能:**
- 环境变量支持
- 配置验证
- 默认值设置
- 配置热重载

### 🛠️ 工具函数 (`src/utils/`)

提供各种通用的工具函数，包括时间处理、数据验证、加密等。

```javascript
const utils = require('./src/utils');

// 时间工具
const dateString = utils.getLocalDateString();
const timestamp = utils.getLocalTimestamp();

// 验证工具
const isValid = utils.isValidEmail('test@example.com');
const validation = utils.validateProduct(productData);

// 加密工具
const hash = await utils.hashPassword('password');
const token = utils.generateToken(payload, secret);
```

**主要模块:**
- `dateUtils.js` - 时间处理
- `fileUtils.js` - 文件操作
- `validationUtils.js` - 数据验证
- `cryptoUtils.js` - 加密功能

### 📊 数据访问层 (`src/dao/`)

采用DAO模式，提供统一的数据访问接口。

```javascript
const dao = require('./src/dao');

// 获取DAO实例
const productDao = dao.getProductDao();
const categoryDao = dao.getCategoryDao();

// 数据操作
const products = productDao.findAll();
const product = productDao.findById('123');
const result = await productDao.create(productData);
```

**主要特性:**
- 单例模式
- 缓存支持
- 数据验证
- 错误处理
- 备份机制

### 🏗️ 业务逻辑层 (`src/services/`)

封装业务逻辑，提供高级的业务操作接口。

```javascript
const services = require('./src/services');

// 获取服务实例
const productService = services.getProductService();

// 业务操作
const result = await productService.createProduct(productData);
const products = await productService.getProducts(options);
const stats = await productService.getProductStats();
```

**主要特性:**
- 业务规则封装
- 数据验证
- 错误处理
- 统一响应格式
- 批量操作支持

### 🛡️ 中间件 (`src/middleware/`)

提供认证、权限、日志、错误处理等中间件。

```javascript
const middleware = require('./src/middleware');

// 认证中间件
app.use('/api/admin', middleware.authenticateToken);

// 权限中间件
app.use('/api/products', middleware.requirePermission('products.read'));

// 日志中间件
app.use(middleware.logOperation('product_create', '创建产品'));
```

**主要模块:**
- `auth.js` - 认证处理
- `permission.js` - 权限控制
- `logging.js` - 日志记录
- `error.js` - 错误处理

### 🌐 路由模块 (`src/routes/`)

RESTful API路由，支持完整的CRUD操作。

```javascript
const routes = require('./src/routes');

// 配置路由
routes.setupRoutes(app);
```

**API端点:**
- `/api/auth` - 认证相关
- `/api/products` - 产品管理
- `/api/categories` - 分类管理
- `/api/inquiries` - 询价管理
- `/api/analytics` - 数据分析
- `/api/admins` - 管理员管理

## 🔧 配置说明

### 环境变量

```bash
# 服务器配置
PORT=3000
HOST=localhost
NODE_ENV=development

# 数据库配置
DATA_PATH=./data

# 安全配置
JWT_SECRET=your-secret-key
BCRYPT_ROUNDS=12

# 缓存配置
CACHE_TTL=300000
ENABLE_CACHE=true
```

### 配置文件

主要配置文件位于 `src/config/` 目录：

- `index.js` - 主配置文件
- `database.js` - 数据库配置
- `cache.js` - 缓存配置
- `security.js` - 安全配置

## 🧪 测试指南

### 集成测试

```bash
node integration-test.js
```

测试内容：
- 目录结构验证
- 模块加载测试
- 功能完整性测试
- 模块间集成测试
- 性能基准测试

### 性能测试

```bash
node performance-test.js
```

测试指标：
- 模块加载时间
- 内存使用情况
- API响应时间
- 文件系统性能
- 代码质量分析

### 单元测试

每个模块都有对应的测试文件：

```bash
node test-config.js     # 配置模块测试
node test-utils.js      # 工具函数测试
node test-dao.js        # 数据访问层测试
node test-middleware.js # 中间件测试
node test-routes.js     # 路由测试
node test-services.js   # 服务层测试
```

## 📈 性能优化

### 缓存策略

- **内存缓存**: 数据访问层缓存
- **文件缓存**: 静态资源缓存
- **API缓存**: 响应结果缓存

### 性能监控

- 请求响应时间监控
- 内存使用监控
- 错误率监控
- 慢查询检测

## 🔒 安全特性

### 认证授权

- JWT令牌认证
- 基于角色的权限控制
- 会话管理
- 密码强度验证

### 数据安全

- 输入数据验证
- SQL注入防护
- XSS攻击防护
- CSRF保护

### 日志审计

- 操作日志记录
- 错误日志追踪
- 安全事件监控
- 访问日志分析

## 🚀 部署指南

### 生产环境部署

1. **环境准备**
   ```bash
   export NODE_ENV=production
   export PORT=80
   export JWT_SECRET=your-production-secret
   ```

2. **启动服务**
   ```bash
   node server-modular.js
   ```

3. **进程管理**
   ```bash
   # 使用PM2
   pm2 start server-modular.js --name diamond-website
   
   # 使用systemd
   sudo systemctl start diamond-website
   ```

### Docker部署

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server-modular.js"]
```

## 🔄 升级指南

### 从原版本升级

1. **备份数据**
   ```bash
   cp -r data data-backup
   ```

2. **更新代码**
   ```bash
   git pull origin main
   npm install
   ```

3. **运行测试**
   ```bash
   node integration-test.js
   ```

4. **启动新版本**
   ```bash
   node server-modular.js
   ```

## 🤝 贡献指南

### 开发规范

- 遵循模块化设计原则
- 编写完整的测试用例
- 添加详细的代码注释
- 更新相关文档

### 提交规范

```bash
git commit -m "feat: 添加新功能"
git commit -m "fix: 修复bug"
git commit -m "docs: 更新文档"
git commit -m "test: 添加测试"
```

## 📞 技术支持

如有问题或建议，请通过以下方式联系：

- 📧 邮箱: support@diamond-website.com
- 🐛 问题反馈: GitHub Issues
- 📖 文档: `/docs` 目录

## 📄 许可证

本项目采用 MIT 许可证，详见 [LICENSE](LICENSE) 文件。

---

**🎉 感谢使用 Diamond Website 模块化架构！**
