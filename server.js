// ��� 钻石网站服务器 - 完整数据库版本
// 无锡皇德国际贸易有限公司
// 集成PostgreSQL + Prisma + 所有修复

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const compression = require('compression');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// 初始化Prisma客户端
const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(compression());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, '.')));

// 文件上传配置
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads', 'products');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件'));
        }
    }
});

// 健康检查端点
app.get('/api/health', async (req, res) => {
    try {
        // 测试数据库连接
        await prisma.$queryRaw`SELECT 1`;
        
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: '2.0.0',
            environment: process.env.NODE_ENV || 'development',
            database: 'PostgreSQL + Prisma',
            company: '无锡皇德国际贸易有限公司'
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// 数据库状态检查
app.get('/api/db-status', async (req, res) => {
    try {
        const result = await prisma.$queryRaw`SELECT version()`;
        const stats = await Promise.all([
            prisma.category.count(),
            prisma.product.count(),
            prisma.inquiry.count()
        ]);
        
        res.json({
            status: 'connected',
            database: 'PostgreSQL',
            version: result[0].version,
            statistics: {
                categories: stats[0],
                products: stats[1],
                inquiries: stats[2]
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 产品分类API
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            where: { status: 'active' },
            orderBy: { order: 'asc' },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });
        
        res.json({
            success: true,
            data: categories,
            count: categories.length
        });
    } catch (error) {
        console.error('获取分类失败:', error);
        res.status(500).json({
            success: false,
            message: '获取分类失败',
            error: error.message
        });
    }
});

// 产品列表API
app.get('/api/products', async (req, res) => {
    try {
        const { category, page = 1, limit = 12, search, sort = 'newest' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        let where = { status: 'active' };
        
        if (category && category !== 'all') {
            where.categoryId = category;
        }
        
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { model: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
                { oeNumber: { contains: search, mode: 'insensitive' } }
            ];
        }
        
        let orderBy = { createdAt: 'desc' };
        if (sort === 'price-asc') orderBy = { price: 'asc' };
        if (sort === 'price-desc') orderBy = { price: 'desc' };
        if (sort === 'name') orderBy = { name: 'asc' };

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    category: true,
                    images: {
                        orderBy: { order: 'asc' },
                        take: 1
                    }
                },
                orderBy,
                skip,
                take: parseInt(limit)
            }),
            prisma.product.count({ where })
        ]);

        res.json({
            success: true,
            data: products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('获取产品失败:', error);
        res.status(500).json({
            success: false,
            message: '获取产品失败',
            error: error.message
        });
    }
});

// 单个产品详情API
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
            include: {
                category: true,
                images: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: '产品不存在'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('获取产品详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取产品详情失败',
            error: error.message
        });
    }
});

// 询价提交API
app.post('/api/inquiries', async (req, res) => {
    try {
        const { name, email, phone, company, subject, message, productInfo } = req.body;

        // 验证必填字段
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: '姓名、邮箱和留言内容为必填项'
            });
        }

        const inquiry = await prisma.inquiry.create({
            data: {
                name: name.trim(),
                email: email.trim(),
                phone: phone?.trim(),
                company: company?.trim(),
                subject: subject?.trim() || '产品询价',
                message: message.trim(),
                productInfo: typeof productInfo === 'object' ? JSON.stringify(productInfo) : productInfo,
                status: 'pending'
            }
        });

        res.json({
            success: true,
            message: '询价提交成功，我们会尽快回复您！',
            data: { id: inquiry.id }
        });
    } catch (error) {
        console.error('提交询价失败:', error);
        res.status(500).json({
            success: false,
            message: '提交询价失败，请稍后重试',
            error: error.message
        });
    }
});

// 文件上传API
app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '没有上传文件'
            });
        }

        const fileUrl = `/uploads/products/${req.file.filename}`;
        
        res.json({
            success: true,
            message: '文件上传成功',
            data: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                url: fileUrl,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error('文件上传失败:', error);
        res.status(500).json({
            success: false,
            message: '文件上传失败',
            error: error.message
        });
    }
});

// 管理后台路由
app.get('/admin*', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// 首页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);
    res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? error.message : '服务器错误'
    });
});

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('正在关闭服务器...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('正在关闭服务器...');
    await prisma.$disconnect();
    process.exit(0);
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`��� 钻石网站服务器启动成功！`);
    console.log(`��� 服务器地址: http://localhost:${PORT}`);
    console.log(`���️ 数据库: PostgreSQL + Prisma`);
    console.log(`��� 无锡皇德国际贸易有限公司`);
    console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
    
    // 测试数据库连接
    prisma.$connect()
        .then(() => console.log('✅ 数据库连接成功'))
        .catch(err => console.error('❌ 数据库连接失败:', err.message));
});

module.exports = app;
