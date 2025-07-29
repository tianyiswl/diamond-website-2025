# 🌐 Diamond Website API 文档

## 📋 概述

Diamond Website 提供完整的 RESTful API，支持产品管理、分类管理、询价处理、数据分析等功能。

### 🔗 基础信息

- **Base URL**: `http://localhost:3000/api`
- **API版本**: `v2.0`
- **认证方式**: JWT Token
- **数据格式**: JSON
- **字符编码**: UTF-8

### 📊 响应格式

所有API响应都遵循统一的格式：

```json
{
  "success": true,
  "message": "操作成功",
  "data": {},
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

错误响应格式：

```json
{
  "success": false,
  "message": "操作失败",
  "errors": ["错误信息1", "错误信息2"],
  "code": "ERROR_CODE",
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

## 🔐 认证接口

### 管理员登录

**POST** `/api/auth/login`

登录获取访问令牌。

**请求参数:**
```json
{
  "username": "admin",
  "password": "password123",
  "rememberMe": false
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "username": "admin",
    "name": "管理员",
    "role": "admin",
    "permissions": ["products.read", "products.create"],
    "lastLogin": "2025-01-20T10:00:00.000Z"
  }
}
```

### 检查认证状态

**GET** `/api/auth/check`

检查当前认证状态。

**Headers:**
```
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "success": true,
  "message": "认证有效",
  "data": {
    "username": "admin",
    "role": "admin",
    "permissions": ["products.read"]
  }
}
```

### 管理员登出

**POST** `/api/auth/logout`

登出并清除认证信息。

**响应示例:**
```json
{
  "success": true,
  "message": "登出成功"
}
```

### 修改密码

**POST** `/api/auth/change-password`

修改当前用户密码。

**请求参数:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

## 📦 产品管理接口

### 获取产品列表

**GET** `/api/products`

获取产品列表，支持分页和筛选。

**查询参数:**
- `page` (number): 页码，默认1
- `limit` (number): 每页数量，默认20
- `search` (string): 搜索关键词
- `category` (string): 分类筛选
- `status` (string): 状态筛选
- `sortBy` (string): 排序字段
- `sortOrder` (string): 排序方向 (asc/desc)

**响应示例:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "1",
        "name": "钻石切割工具",
        "category": "切割工具",
        "price": "299.00",
        "stock": "50",
        "status": "active",
        "createdAt": "2025-01-20T10:00:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "total": 10,
      "limit": 20,
      "totalItems": 200,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 获取产品详情

**GET** `/api/products/:id`

获取指定产品的详细信息。

**响应示例:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "钻石切割工具",
    "category": "切割工具",
    "brand": "Diamond Pro",
    "model": "DP-2025",
    "price": "299.00",
    "stock": "50",
    "description": "专业钻石切割工具",
    "images": ["image1.jpg", "image2.jpg"],
    "status": "active",
    "createdAt": "2025-01-20T10:00:00.000Z",
    "categoryInfo": {
      "id": "1",
      "name": "切割工具",
      "description": "各种切割工具"
    }
  }
}
```

### 创建产品

**POST** `/api/products`

创建新产品。

**请求参数:**
```json
{
  "name": "新产品名称",
  "category": "产品分类",
  "brand": "品牌名称",
  "model": "型号",
  "price": "199.00",
  "stock": "100",
  "description": "产品描述",
  "oe_number": "OE编号",
  "compatibility": "兼容性说明",
  "features": "产品特性",
  "notes": "备注信息",
  "images": ["image1.jpg"],
  "status": "active"
}
```

### 更新产品

**PUT** `/api/products/:id`

更新指定产品信息。

**请求参数:** 同创建产品，所有字段可选

### 删除产品

**DELETE** `/api/products/:id`

删除指定产品。

### 获取产品统计

**GET** `/api/products/stats/summary`

获取产品统计信息。

**响应示例:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "active": 140,
    "inactive": 10,
    "categories": {
      "切割工具": 50,
      "抛光工具": 30
    },
    "brands": {
      "Diamond Pro": 80,
      "Tool Master": 70
    },
    "avgPrice": "245.50",
    "totalStock": 5000
  }
}
```

### 批量操作产品

**POST** `/api/products/batch`

批量操作产品。

**请求参数:**
```json
{
  "action": "update",
  "productIds": ["1", "2", "3"],
  "data": {
    "status": "inactive"
  }
}
```

## 📂 分类管理接口

### 获取分类列表

**GET** `/api/categories`

获取所有分类列表。

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "切割工具",
      "description": "各种切割工具",
      "icon": "cut-icon",
      "color": "#FF5722",
      "order": 1,
      "status": "active",
      "productCount": 25,
      "createdAt": "2025-01-20T10:00:00.000Z"
    }
  ]
}
```

### 获取活跃分类

**GET** `/api/categories/active`

获取状态为活跃的分类列表（公开接口）。

### 创建分类

**POST** `/api/categories`

创建新分类。

**请求参数:**
```json
{
  "name": "新分类",
  "description": "分类描述",
  "icon": "icon-name",
  "color": "#2196F3",
  "order": 10,
  "status": "active"
}
```

### 更新分类

**PUT** `/api/categories/:id`

更新指定分类信息。

### 删除分类

**DELETE** `/api/categories/:id`

删除指定分类（需确保没有产品使用此分类）。

## 💬 询价管理接口

### 获取询价列表

**GET** `/api/inquiries`

获取询价列表（管理员接口）。

**查询参数:**
- `page` (number): 页码
- `limit` (number): 每页数量
- `status` (string): 状态筛选

**响应示例:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid-123",
        "name": "张三",
        "email": "zhang@example.com",
        "phone": "13800138000",
        "company": "ABC公司",
        "message": "询价内容",
        "productName": "钻石切割工具",
        "status": "pending",
        "source": "website",
        "createdAt": "2025-01-20T10:00:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "total": 5,
      "totalItems": 100
    }
  }
}
```

### 创建询价

**POST** `/api/inquiries`

创建新询价（公开接口，无需认证）。

**请求参数:**
```json
{
  "name": "客户姓名",
  "email": "customer@example.com",
  "phone": "13800138000",
  "company": "客户公司",
  "message": "询价内容，至少10个字符",
  "productId": "产品ID（可选）",
  "source": "website"
}
```

### 更新询价状态

**PUT** `/api/inquiries/:id/status`

更新询价处理状态。

**请求参数:**
```json
{
  "status": "completed",
  "notes": "处理备注"
}
```

**状态值:**
- `pending`: 待处理
- `processing`: 处理中
- `completed`: 已完成
- `cancelled`: 已取消

### 删除询价

**DELETE** `/api/inquiries/:id`

删除指定询价记录。

### 批量操作询价

**POST** `/api/inquiries/batch`

批量操作询价。

**请求参数:**
```json
{
  "action": "updateStatus",
  "inquiryIds": ["id1", "id2"],
  "data": {
    "status": "completed",
    "notes": "批量处理完成"
  }
}
```

## 📊 数据分析接口

### 获取今日统计

**GET** `/api/analytics/today`

获取今日访问统计数据。

**响应示例:**
```json
{
  "success": true,
  "data": {
    "page_views": 1250,
    "unique_visitors": 320,
    "product_clicks": 180,
    "inquiries": 15,
    "conversion_rate": "1.20"
  }
}
```

### 获取历史数据

**GET** `/api/analytics/historical`

获取历史统计数据。

**查询参数:**
- `period` (string): 时间周期 (year/month/day)
- `value` (string): 时间值 (2025/2025-01/2025-01-20)

### 获取产品分析

**GET** `/api/analytics/products`

获取产品点击分析数据。

### 获取仪表板数据

**GET** `/api/analytics/dashboard`

获取管理后台仪表板综合数据。

### 记录访问

**POST** `/api/analytics/visit`

记录访问数据（公开接口）。

**请求参数:**
```json
{
  "type": "page_view",
  "productId": "产品ID（可选）",
  "productName": "产品名称（可选）"
}
```

## 👤 管理员管理接口

### 获取管理员列表

**GET** `/api/admins`

获取所有管理员列表（仅超级管理员）。

### 创建管理员

**POST** `/api/admins`

创建新管理员账户（仅超级管理员）。

**请求参数:**
```json
{
  "username": "newadmin",
  "password": "password123",
  "email": "admin@example.com",
  "name": "管理员姓名",
  "role": "admin"
}
```

### 获取当前用户信息

**GET** `/api/admins/me/profile`

获取当前登录用户的个人信息。

### 更新个人信息

**PUT** `/api/admins/me/profile`

更新当前用户的个人信息。

**请求参数:**
```json
{
  "email": "newemail@example.com",
  "name": "新姓名"
}
```

## 🔧 系统接口

### 健康检查

**GET** `/health`

获取系统健康状态（无需认证）。

**响应示例:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T10:30:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": 52428800,
    "heapUsed": 25165824
  },
  "services": {
    "overall": "healthy"
  }
}
```

### API信息

**GET** `/api`

获取API基本信息（无需认证）。

### API文档

**GET** `/api/docs`

获取API文档信息（无需认证）。

## 🚨 错误代码

| 错误代码 | HTTP状态码 | 描述 |
|---------|-----------|------|
| `NO_TOKEN` | 401 | 未提供认证令牌 |
| `INVALID_TOKEN` | 401 | 无效的认证令牌 |
| `TOKEN_EXPIRED` | 401 | 认证令牌已过期 |
| `INSUFFICIENT_PERMISSIONS` | 403 | 权限不足 |
| `VALIDATION_ERROR` | 400 | 数据验证失败 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `DUPLICATE_DATA` | 409 | 数据重复 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |

## 📝 使用示例

### JavaScript/Node.js

```javascript
// 登录获取令牌
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'password123'
  })
});

// 使用令牌访问API
const productsResponse = await fetch('/api/products', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

### cURL

```bash
# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'

# 获取产品列表
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN"

# 创建产品
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"新产品","category":"测试分类"}'
```

## 📞 技术支持

如有API使用问题，请联系技术支持：

- 📧 邮箱: api-support@diamond-website.com
- 📖 文档: 查看完整API文档
- 🐛 问题反馈: GitHub Issues

---

**📚 更多信息请参考完整的开发文档。**
