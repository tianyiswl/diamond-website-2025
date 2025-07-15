// 🌏 设置服务器时区为上海时区 - 解决JWT令牌时间验证问题
process.env.TZ = 'Asia/Shanghai';

const express = require('express');
const compression = require('compression');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const net = require('net');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
let PORT = process.env.PORT || 3000;
const MAX_PORT_RETRY = 10; // 最大重试次数

// 🕐 验证时区设置并输出调试信息
console.log('🌏 服务器时区信息:');
console.log('   系统时区:', process.env.TZ);
console.log('   当前时间:', new Date().toString());
console.log('   UTC时间:', new Date().toUTCString());
console.log('   上海时间:', new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
console.log('   时区偏移:', new Date().getTimezoneOffset(), '分钟');
console.log('   Intl时区:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('');

// 检查端口是否可用
function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', () => {
            resolve(false);
        });
        server.once('listening', () => {
            server.close();
            resolve(true);
        });
        server.listen(port);
    });
}

// 查找可用端口
async function findAvailablePort(startPort) {
    for (let port = startPort; port < startPort + MAX_PORT_RETRY; port++) {
        if (await isPortAvailable(port)) {
            return port;
        }
    }
    throw new Error('无法找到可用端口');
}

// 检查管理员配置
function checkAdminConfig() {
    const configPath = './data/admin-config.json';
    if (!fs.existsSync(configPath)) {
        console.log('\n⚠️  未检测到管理员配置文件');
        console.log('🔧 请运行以下命令设置管理员账号:');
        console.log('   node setup-admin.js');
        console.log('\n或者使用默认账号:');
        console.log('   用户名: admin');
        console.log('   密码: admin123');
        return false;
    }
    return true;
}

// 数据校验和修复功能
const validateAndFixAnalyticsData = () => {
    try {
        console.log('🔍 开始校验analytics数据一致性...');

        const analytics = readJsonFile('./data/analytics.json');
        const inquiries = readJsonFile('./data/inquiries.json');

        let hasChanges = false;

        // 检查每一天的数据
        Object.keys(analytics.daily_stats).forEach(date => {
            const dayStats = analytics.daily_stats[date];

            // 计算该日期的实际询价数量
            const actualInquiries = inquiries.filter(inquiry => {
                const inquiryDate = new Date(inquiry.createdAt).toISOString().split('T')[0];
                return inquiryDate === date;
            }).length;

            // 添加调试信息
            if (date === '2025-07-11') {
                console.log(`🔍 调试 ${date}: analytics=${dayStats.inquiries}, actual=${actualInquiries}`);
                console.log(`🔍 页面访问数: ${dayStats.page_views}`);
            }

            // 如果数据不一致，进行修复
            if (dayStats.inquiries !== actualInquiries) {
                console.log(`📊 发现数据不一致 ${date}: analytics=${dayStats.inquiries}, actual=${actualInquiries}`);

                dayStats.inquiries = actualInquiries;

                // 重新计算转化率
                const views = dayStats.page_views || 0;
                if (views > 0) {
                    dayStats.conversion_rate = ((actualInquiries / views) * 100).toFixed(2);
                } else {
                    dayStats.conversion_rate = 0;
                }

                hasChanges = true;
                console.log(`✅ 已修复 ${date} 的数据: inquiries=${actualInquiries}, conversion_rate=${dayStats.conversion_rate}%`);
            }
        });

        // 如果有变更，保存数据
        if (hasChanges) {
            writeJsonFile('./data/analytics.json', analytics);
            console.log('💾 已保存修复后的analytics数据');
        } else {
            console.log('✅ analytics数据一致性检查通过');
        }

    } catch (error) {
        console.error('❌ 数据校验失败:', error);
    }
};

// 启动服务器函数
async function startServer() {
    try {
        // 记录服务器启动时间
        global.serverStartTime = new Date().toISOString();
        console.log('🚀 服务器启动中...', global.serverStartTime);

        // 检查管理员配置
        if (!checkAdminConfig()) {
            console.log('⚠️  管理员配置检查失败，但服务器将继续启动');
        }

        // 执行数据校验和修复
        validateAndFixAnalyticsData();

        // 查找可用端口
        PORT = await findAvailablePort(PORT);
        
        // 创建HTTP服务器
        const server = http.createServer(app);
        
        // 监听端口
        await new Promise((resolve, reject) => {
            server.listen(PORT, () => {
                console.log('\n🚀 钻石网站CMS服务器启动成功！');
                console.log(`📱 网站首页: http://localhost:${PORT}`);
                console.log(`🛠️  管理后台: http://localhost:${PORT}/admin`);
                console.log(`🔐 登录页面: http://localhost:${PORT}/admin/login.html`);
                console.log(`📋 API地址: http://localhost:${PORT}/api`);
                console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                })}`);

                // 显示管理员登录信息
                const configPath = './data/admin-config.json';
                if (fs.existsSync(configPath)) {
                    try {
                        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                        console.log('\n🔑 管理员登录信息:');

                        if (config.admins) {
                            // 新的多管理员结构
                            const adminCount = Object.keys(config.admins).length;
                            console.log(`   管理员数量: ${adminCount}`);

                            // 显示第一个超级管理员的信息
                            const superAdmin = Object.values(config.admins).find(admin => admin.role === 'super_admin');
                            if (superAdmin) {
                                console.log(`   超级管理员: ${superAdmin.username}`);
                                console.log(`   默认密码: admin123 (如未修改)`);
                            }
                        } else if (config.admin) {
                            // 兼容旧的单管理员结构
                            console.log(`   用户名: ${config.admin.username}`);
                            console.log(`   默认密码: admin123 (如未修改)`);
                        }
                    } catch (error) {
                        console.log('\n⚠️  管理员配置文件读取失败:', error.message);
                    }
                } else {
                    console.log('\n⚠️  未设置管理员账号，请运行: node setup-admin.js');
                }
                console.log('');
                resolve();
            });
            
            server.once('error', (err) => {
                reject(err);
            });
        });
        
        return server;
    } catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
}

// 进程退出处理
process.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信号，准备关闭服务器...');
    gracefulShutdown();
});

process.on('SIGINT', () => {
    console.log('收到 SIGINT 信号，准备关闭服务器...');
    gracefulShutdown();
});

process.on('uncaughtException', (err) => {
    console.error('未捕获的异常:', err);
    gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
    gracefulShutdown();
});

// 优雅关闭服务器
function gracefulShutdown() {
    if (global.server) {
        global.server.close(() => {
            console.log('服务器已安全关闭');
            process.exit(0);
        });

        // 如果10秒内没有完成关闭，强制退出
        setTimeout(() => {
            console.error('无法优雅关闭服务器，强制退出');
            process.exit(1);
        }, 10000);
    } else {
        process.exit(0);
    }
}

// 中间件配置
app.use(compression()); // 启用gzip压缩
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 静态文件服务配置，添加缓存控制
app.use(express.static('.', {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0', // 生产环境缓存1天
    etag: true,
    lastModified: true
}));

// 确保必要的目录存在
const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// 获取本地时间的日期字符串
const getLocalDateString = (date = new Date()) => {
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).replace(/\//g, '-');
};

// 获取本地时间的小时
const getLocalHour = (date = new Date()) => {
    return date.getHours();
};

// 数据归档和历史查询功能
const archiveAndQueryData = {
    // 获取历史数据 - 支持年/月/日查询
    getHistoricalData: (period, value) => {
        try {
            const analyticsPath = './data/analytics.json';
            const analytics = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
            
            const result = {
                period,
                value,
                data: [],
                summary: {
                    total_views: 0,
                    total_clicks: 0,
                    total_inquiries: 0,
                    avg_conversion_rate: 0,
                    unique_visitors: 0
                }
            };
            
            const dailyStats = analytics.daily_stats || {};
            
            // 根据查询类型过滤数据
            const filteredDates = Object.keys(dailyStats).filter(date => {
                if (period === 'year') {
                    return date.startsWith(value);
                } else if (period === 'month') {
                    return date.startsWith(value); // format: 2025-06
                } else if (period === 'day') {
                    return date === value; // format: 2025-06-28
                }
                return false;
            }).sort();
            
            // 收集数据和计算汇总
            let totalConversionRate = 0;
            let validConversionDays = 0;
            
            filteredDates.forEach(date => {
                const dayData = dailyStats[date];
                result.data.push({
                    date,
                    ...dayData
                });
                
                result.summary.total_views += dayData.page_views || 0;
                result.summary.total_clicks += dayData.product_clicks || 0;
                result.summary.total_inquiries += dayData.inquiries || 0;
                result.summary.unique_visitors += dayData.unique_visitors || 0;
                
                if (dayData.conversion_rate > 0) {
                    totalConversionRate += dayData.conversion_rate;
                    validConversionDays++;
                }
            });
            
            // 计算平均转化率
            result.summary.avg_conversion_rate = validConversionDays > 0 
                ? (totalConversionRate / validConversionDays).toFixed(2)
                : 0;
            
            return result;
        } catch (error) {
            console.error('获取历史数据失败:', error);
            return null;
        }
    },
    
    // 获取可用的年份列表
    getAvailableYears: () => {
        try {
            const analyticsPath = './data/analytics.json';
            const analytics = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
            const dates = Object.keys(analytics.daily_stats || {});
            const years = [...new Set(dates.map(date => date.substring(0, 4)))];
            return years.sort().reverse();
        } catch (error) {
            return [];
        }
    },
    
    // 获取指定年份的月份列表
    getAvailableMonths: (year) => {
        try {
            const analyticsPath = './data/analytics.json';
            const analytics = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
            const dates = Object.keys(analytics.daily_stats || {});
            const months = [...new Set(dates
                .filter(date => date.startsWith(year))
                .map(date => date.substring(0, 7))
            )];
            return months.sort().reverse();
        } catch (error) {
            return [];
        }
    },
    
    // 获取指定月份的日期列表
    getAvailableDays: (yearMonth) => {
        try {
            const analyticsPath = './data/analytics.json';
            const analytics = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
            const dates = Object.keys(analytics.daily_stats || {});
            const days = dates
                .filter(date => date.startsWith(yearMonth))
                .sort()
                .reverse();
            return days;
        } catch (error) {
            return [];
        }
    }
};

// 修改确保今日数据的函数，使用本地时间
let todayDataCreated = false; // 全局标记，避免重复日志

const ensureTodayData = () => {
    try {
        const analyticsPath = './data/analytics.json';
        const analytics = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
        const today = getLocalDateString(); // 使用本地时间
        
        // 检查是否存在今日数据
        if (!analytics.daily_stats[today]) {
            analytics.daily_stats[today] = {
                page_views: 0,
                unique_visitors: 0,
                daily_unique_users: [], // 存储当日独立用户ID
                product_clicks: 0,
                inquiries: 0,
                conversion_rate: 0,
                bounce_rate: 0,
                avg_session_duration: 0,
                top_products: [],
                traffic_sources: {
                    direct: 0,
                    search: 0,
                    social: 0,
                    referral: 0
                },
                hourly_data: Array.from({length: 24}, (_, i) => ({
                    hour: i,
                    views: 0,
                    clicks: 0
                })),
                geo_stats: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            // 只在第一次创建时输出日志
            if (!todayDataCreated) {
                console.log(`📊 创建新的日期数据: ${today}`);
                todayDataCreated = true;
            }
        }
    } catch (error) {
        console.error('创建今日数据失败:', error);
    }
};

// 初始化目录结构
ensureDirectoryExists('./data');
ensureDirectoryExists('./uploads/products');

// 初始化数据文件
const initializeDataFiles = () => {
    // 初始化产品数据
    const productsPath = './data/products.json';
    if (!fs.existsSync(productsPath)) {
        fs.writeFileSync(productsPath, JSON.stringify([], null, 2));
    }

    // 初始化分类数据
    const categoriesPath = './data/categories.json';
    if (!fs.existsSync(categoriesPath)) {
        const defaultCategories = [
            {
                id: 'turbocharger',
                name: '涡轮增压器',
                description: '各种型号的涡轮增压器及配件',
                count: 0,
                createdAt: new Date().toISOString()
            },
            {
                id: 'actuator',
                name: '执行器',
                description: '涡轮增压器执行器系列产品',
                count: 0,
                createdAt: new Date().toISOString()
            },
            {
                id: 'injector',
                name: '共轨喷油器',
                description: '高压共轨喷油器及相关配件',
                count: 0,
                createdAt: new Date().toISOString()
            },
            {
                id: 'turbo-parts',
                name: '涡轮配件',
                description: '涡轮增压器相关配件及维修件',
                count: 0,
                createdAt: new Date().toISOString()
            },
            {
                id: 'turbo-wheel',
                name: '涡轮轮',
                description: '涡轮增压器轮',
                count: 0,
                createdAt: new Date().toISOString()
            },
            {
                id: 'others',
                name: '其他',
                description: '其他汽车零部件产品',
                count: 0,
                createdAt: new Date().toISOString()
            }
        ];
        fs.writeFileSync(categoriesPath, JSON.stringify(defaultCategories, null, 2));
    }

    // 初始化操作日志
    const logsPath = './data/logs.json';
    if (!fs.existsSync(logsPath)) {
        fs.writeFileSync(logsPath, JSON.stringify([], null, 2));
    }

    // 初始化访问统计数据
    const analyticsPath = './data/analytics.json';
    if (!fs.existsSync(analyticsPath)) {
        const today = getLocalDateString(); // 使用本地时间
        const defaultAnalytics = {
            daily_stats: {
                [today]: {
                    page_views: 0,
                    unique_visitors: 0,
                    product_clicks: 0,
                    inquiries: 0,
                    conversion_rate: 0,
                    bounce_rate: 0,
                    avg_session_duration: 0,
                    top_products: [],
                    traffic_sources: {
                        direct: 0,
                        search: 0,
                        social: 0,
                        referral: 0
                    },
                    hourly_data: Array.from({length: 24}, (_, i) => ({
                        hour: i,
                        views: 0,
                        clicks: 0
                    })),
                    geo_stats: {}
                }
            },
            product_stats: {},
            geo_stats: {}
        };
        fs.writeFileSync(analyticsPath, JSON.stringify(defaultAnalytics, null, 2));
        console.log(`📊 初始化analytics数据`);
    } else {
        // 检查是否需要为今天创建数据（延迟到启动后检查）
        // 文件已存在，无需重复提示
    }
};

// 初始化数据文件
initializeDataFiles();

// 设置定时器，每小时检查一次是否需要创建新的日期数据
setInterval(() => {
    ensureTodayData();
}, 60 * 60 * 1000); // 每小时执行一次

// 设置每日凌晨0点的数据归档任务
const scheduleDataArchive = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // 设置为明天凌晨0点
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
        // 执行数据归档
        archiveDailyData();
        
        // 设置每24小时执行一次
        setInterval(() => {
            archiveDailyData();
        }, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);
    
    console.log(`📅 数据归档任务已安排，将在 ${tomorrow.toLocaleString('zh-CN')} 执行`);
};

// 数据归档函数
const archiveDailyData = () => {
    try {
        const today = getLocalDateString();
        console.log(`📊 执行数据归档: ${today}`);
        
        // 确保今日数据存在
        ensureTodayData();
        
        // 可以在这里添加数据清理逻辑，比如删除过期数据
        // 保留最近365天的数据
        const analyticsPath = './data/analytics.json';
        const analytics = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
        
        const dates = Object.keys(analytics.daily_stats || {});
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 365); // 365天前
        
        let deletedCount = 0;
        dates.forEach(date => {
            const dateObj = new Date(date);
            if (dateObj < cutoffDate) {
                delete analytics.daily_stats[date];
                deletedCount++;
            }
        });
        
        if (deletedCount > 0) {
            fs.writeFileSync(analyticsPath, JSON.stringify(analytics, null, 2));
            console.log(`📊 清理了 ${deletedCount} 天的过期数据`);
        }
        
        console.log(`📊 数据归档完成: ${today}`);
    } catch (error) {
        console.error('数据归档失败:', error);
    }
};

// 启动时立即检查
ensureTodayData();

// 启动数据归档任务
scheduleDataArchive();

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = './uploads/products';
        ensureDirectoryExists(uploadPath);
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB限制
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('只支持图片文件格式！'));
        }
    }
});

// 辅助函数：读取JSON文件
const readJsonFile = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`读取文件失败 ${filePath}:`, error);
        return [];
    }
};

// 辅助函数：写入JSON文件
const writeJsonFile = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`写入文件失败 ${filePath}:`, error);
        return false;
    }
};

// 辅助函数：添加操作日志
const addLog = (action, details, req) => {
    const logs = readJsonFile('./data/logs.json');
    const newLog = {
        id: Date.now().toString(),
        action,
        details,
        timestamp: new Date().toISOString(),
        ip: req.ip || req.connection.remoteAddress || 'unknown'
    };
    
    logs.unshift(newLog);
    
    // 只保留最近1000条记录
    if (logs.length > 1000) {
        logs.splice(1000);
    }
    
    writeJsonFile('./data/logs.json', logs);
};

// 认证相关函数
const loadAdminConfig = () => {
    try {
        const configPath = './data/admin-config.json';
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        return null;
    } catch (error) {
        console.error('加载管理员配置失败:', error);
        return null;
    }
};

const saveAdminConfig = (config) => {
    try {
        const configPath = './data/admin-config.json';
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        console.error('保存管理员配置失败:', error);
        return false;
    }
};

// JWT令牌验证中间件 - 增强版本
const authenticateToken = (req, res, next) => {
    const token = req.cookies.auth_token || req.headers.authorization?.split(' ')[1];

    // 🔧 添加调试日志
    console.log('🔍 认证检查:', {
        hasCookie: !!req.cookies.auth_token,
        hasHeader: !!req.headers.authorization,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
        url: req.url,
        method: req.method
    });

    if (!token) {
        console.log('❌ 未找到认证令牌');
        // 清除可能存在的无效cookie
        res.clearCookie('auth_token');
        return res.status(401).json({
            success: false,
            message: '未提供认证令牌',
            code: 'NO_TOKEN'
        });
    }

    const config = loadAdminConfig();
    if (!config) {
        console.log('❌ 系统配置加载失败');
        return res.status(500).json({
            success: false,
            message: '系统配置错误',
            code: 'CONFIG_ERROR'
        });
    }

    try {
        const decoded = jwt.verify(token, config.security.jwt_secret);

        // 🕐 时区兼容的令牌过期检查
        const now = Math.floor(Date.now() / 1000);
        const tokenExp = decoded.exp;
        const tokenIat = decoded.iat;

        console.log('🕐 令牌时间验证:', {
            serverTime: new Date().toISOString(),
            serverTimezone: process.env.TZ,
            tokenIssued: new Date(tokenIat * 1000).toISOString(),
            tokenExpires: new Date(tokenExp * 1000).toISOString(),
            currentTimestamp: now,
            tokenExpTimestamp: tokenExp,
            isExpired: tokenExp < now,
            timeDiff: now - tokenExp
        });

        // 🕐 增加时间容差，防止时区问题导致的误判 - 国外服务器优化版本
        const TIME_TOLERANCE = 1800; // 30分钟容差，适应国外服务器时区差异

        // 🌍 检测可能的时区问题
        const timeDiff = now - decoded.exp;
        const isLikelyTimezoneIssue = Math.abs(timeDiff) > 3600 && Math.abs(timeDiff) < 86400; // 1小时到24小时之间

        if (isLikelyTimezoneIssue) {
            console.log('🌍 检测到可能的时区问题，时间差:', timeDiff, '秒');
            console.log('🔧 应用扩展时间容差进行修复');
        }

        if (decoded.exp && (decoded.exp + TIME_TOLERANCE) < now) {
            console.log('⚠️  令牌真正过期，时间差:', now - decoded.exp, '秒');
            throw new Error('Token expired');
        } else if (decoded.exp && decoded.exp < now) {
            console.log('⚠️  令牌在容差范围内，允许通过，时间差:', now - decoded.exp, '秒');
        }

        console.log('✅ 令牌验证成功:', decoded.username);
        req.user = decoded;
        next();
    } catch (error) {
        console.log('❌ 令牌验证失败:', error.message);

        // 清除无效的cookie
        res.clearCookie('auth_token');

        let errorCode = 'INVALID_TOKEN';
        let errorMessage = '无效的认证令牌';

        if (error.name === 'TokenExpiredError') {
            errorCode = 'TOKEN_EXPIRED';
            errorMessage = '认证令牌已过期';
        } else if (error.name === 'JsonWebTokenError') {
            errorCode = 'MALFORMED_TOKEN';
            errorMessage = '认证令牌格式错误';
        }

        return res.status(403).json({
            success: false,
            message: errorMessage,
            code: errorCode
        });
    }
};

// 获取管理员信息
const getAdminByUsername = (config, username) => {
    if (config.admins) {
        // 在所有管理员中查找匹配的用户名
        for (const adminId in config.admins) {
            const admin = config.admins[adminId];
            if (admin.username === username) {
                return admin;
            }
        }
    }
    // 兼容旧版本配置
    if (config.admin && config.admin.username === username) {
        return config.admin;
    }
    return null;
};

// 根据ID获取管理员信息
const getAdminById = (config, adminId) => {
    if (config.admins && config.admins[adminId]) {
        return config.admins[adminId];
    }
    return null;
};

// 检查管理员权限
const hasPermission = (admin, permission) => {
    if (!admin || !admin.permissions) {
        return false;
    }
    return admin.permissions.includes(permission);
};

// 检查管理员是否为超级管理员
const isSuperAdmin = (admin) => {
    return admin && admin.role === 'super_admin';
};

// 权限检查中间件
const requirePermission = (permission) => {
    return (req, res, next) => {
        const config = loadAdminConfig();
        if (!config) {
            return res.status(500).json({
                success: false,
                message: '系统配置错误'
            });
        }

        const currentAdmin = getAdminByUsername(config, req.user.username);
        if (!currentAdmin) {
            return res.status(401).json({
                success: false,
                message: '用户不存在'
            });
        }

        if (!hasPermission(currentAdmin, permission)) {
            return res.status(403).json({
                success: false,
                message: '没有权限执行此操作'
            });
        }

        next();
    };
};

// 获取所有管理员
const getAllAdmins = (config) => {
    if (config.admins) {
        return Object.values(config.admins);
    }
    // 兼容旧版本配置
    if (config.admin) {
        return [config.admin];
    }
    return [];
};

// 检查登录尝试次数
const checkLoginAttempts = (admin) => {
    const now = Date.now();

    // 如果账户被锁定且锁定时间未过期
    if (admin.locked_until && now < admin.locked_until) {
        const remainingTime = Math.ceil((admin.locked_until - now) / 60000);
        return {
            locked: true,
            message: `账户已被锁定，请在 ${remainingTime} 分钟后重试`
        };
    }

    // 如果锁定时间已过期，重置登录尝试次数
    if (admin.locked_until && now >= admin.locked_until) {
        admin.login_attempts = 0;
        admin.locked_until = null;
    }

    return { locked: false };
};

// 认证API
// 管理员登录
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password, rememberMe } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名和密码不能为空'
            });
        }

        const config = loadAdminConfig();
        if (!config) {
            return res.status(500).json({
                success: false,
                message: '系统配置错误'
            });
        }

        // 查找管理员
        const admin = getAdminByUsername(config, username);
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        // 检查账户状态
        if (admin.status === 'disabled') {
            return res.status(401).json({
                success: false,
                message: '账户已被禁用，请联系系统管理员'
            });
        }

        // 检查登录尝试次数
        const attemptCheck = checkLoginAttempts(admin);
        if (attemptCheck.locked) {
            return res.status(429).json({
                success: false,
                message: attemptCheck.message
            });
        }

        // 验证密码
        const passwordMatch = await bcrypt.compare(password, admin.password);
        if (!passwordMatch) {
            admin.login_attempts++;

            // 检查是否需要锁定账户
            if (admin.login_attempts >= config.security.max_login_attempts) {
                admin.locked_until = Date.now() + config.security.lockout_duration;
                saveAdminConfig(config);
                return res.status(429).json({
                    success: false,
                    message: `登录失败次数过多，账户已被锁定 ${config.security.lockout_duration / 60000} 分钟`
                });
            }

            saveAdminConfig(config);
            return res.status(401).json({
                success: false,
                message: `用户名或密码错误，还有 ${config.security.max_login_attempts - admin.login_attempts} 次尝试机会`
            });
        }

        // 登录成功，重置登录尝试次数
        admin.login_attempts = 0;
        admin.locked_until = null;
        admin.last_login = new Date().toISOString();
        saveAdminConfig(config);

        // 生成JWT令牌 - 时区兼容版本
        const now = Math.floor(Date.now() / 1000); // UTC时间戳（秒）
        const expirationTime = rememberMe ? 7 * 24 * 60 * 60 : 60 * 60; // 7天或1小时（秒）

        const tokenPayload = {
            username: admin.username,
            email: admin.email,
            role: admin.role,
            loginTime: now,
            iat: now, // 签发时间（UTC）
            exp: now + expirationTime, // 过期时间（UTC）
            timezone: process.env.TZ || 'Asia/Shanghai',
            serverTime: new Date().toISOString(),
            shanghaiTime: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
        };

        console.log('🕐 生成JWT令牌时间信息:', {
            serverTimezone: process.env.TZ,
            currentUTC: new Date().toISOString(),
            currentShanghai: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
            tokenIssued: new Date(now * 1000).toISOString(),
            tokenExpires: new Date((now + expirationTime) * 1000).toISOString(),
            expiresInSeconds: expirationTime,
            rememberMe
        });

        // 🔧 不使用expiresIn选项，手动设置过期时间避免时区问题
        const token = jwt.sign(tokenPayload, config.security.jwt_secret);

        // 设置Cookie - 国外服务器兼容性优化
        const isProduction = process.env.NODE_ENV === 'production';
        const isHTTPS = req.secure || req.headers['x-forwarded-proto'] === 'https';

        const cookieOptions = {
            httpOnly: true,
            secure: isHTTPS, // 🔧 根据实际协议动态设置
            maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000, // 7天或2小时（延长基础时间）
            sameSite: isProduction ? 'strict' : 'lax', // 🔧 生产环境使用strict，开发环境使用lax
            path: '/', // 🔧 确保cookie在整个域下有效
            domain: undefined // 🔧 不设置domain，避免跨域问题
        };

        // 🌍 国外服务器特殊处理
        const userAgent = req.headers['user-agent'] || '';
        const isLikelyOverseas = req.headers['cf-ipcountry'] && req.headers['cf-ipcountry'] !== 'CN';

        if (isLikelyOverseas) {
            console.log('🌍 检测到国外访问，应用特殊Cookie设置');
            cookieOptions.sameSite = 'none'; // 国外服务器使用none以提高兼容性
            cookieOptions.secure = true; // none模式必须使用secure
        }

        res.cookie('auth_token', token, cookieOptions);

        // 🔧 添加调试日志 - 增强版本
        console.log('🍪 Cookie设置成功:', {
            username: admin.username,
            tokenLength: token.length,
            cookieOptions,
            rememberMe,
            isHTTPS,
            isProduction,
            isLikelyOverseas,
            userAgent: userAgent.substring(0, 100) + '...',
            clientIP: req.ip || req.connection.remoteAddress,
            headers: {
                'cf-ipcountry': req.headers['cf-ipcountry'],
                'x-forwarded-proto': req.headers['x-forwarded-proto'],
                'x-forwarded-for': req.headers['x-forwarded-for']
            }
        });

        // 记录登录日志
        addLog('login', `管理员登录: ${admin.username}`, req);

        res.json({
            success: true,
            message: '登录成功',
            user: {
                username: admin.username,
                email: admin.email,
                name: admin.name,
                role: admin.role
            }
        });

    } catch (error) {
        console.error('登录处理失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 检查认证状态
app.get('/api/auth/check', authenticateToken, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

// 管理员登出
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('auth_token');
    addLog('logout', '管理员登出', req);
    res.json({
        success: true,
        message: '登出成功'
    });
});

// 修改密码
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: '所有字段都是必填的'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: '新密码和确认密码不匹配'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: '新密码长度至少为8位'
            });
        }

        const config = loadAdminConfig();
        if (!config) {
            return res.status(500).json({
                success: false,
                message: '系统配置错误'
            });
        }

        const admin = config.admin;

        // 验证当前密码
        const currentPasswordMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!currentPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: '当前密码错误'
            });
        }

        // 加密新密码
        const saltRounds = config.security.bcrypt_rounds || 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // 更新密码
        admin.password = hashedNewPassword;
        admin.last_password_change = new Date().toISOString();

        if (saveAdminConfig(config)) {
            // 记录操作日志
            addLog('change_password', '管理员修改密码', req);

            res.json({
                success: true,
                message: '密码修改成功'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存新密码失败'
            });
        }

    } catch (error) {
        console.error('修改密码失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 访问统计API
// 记录访问数据
app.post('/api/analytics', (req, res) => {
    try {
        const data = req.body;
        const analytics = readJsonFile('./data/analytics.json');
        const today = getLocalDateString(); // 使用本地时间
        
        // 确保daily_stats存在
        if (!analytics.daily_stats) {
            analytics.daily_stats = {};
        }
        
        // 确保今天的数据存在
        if (!analytics.daily_stats[today]) {
            analytics.daily_stats[today] = {
                page_views: 0,
                unique_visitors: 0,
                product_clicks: 0,
                inquiries: 0,
                conversion_rate: 0,
                bounce_rate: 0,
                avg_session_duration: 0,
                top_products: [],
                traffic_sources: {
                    direct: 0,
                    search: 0,
                    social: 0,
                    referral: 0
                },
                hourly_data: Array.from({length: 24}, (_, i) => ({
                    hour: i,
                    views: 0,
                    clicks: 0
                })),
                geo_stats: {} // 地理位置统计
            };
        }
        
        // 更新今日统计
        const todayStats = analytics.daily_stats[today];
        
        if (data.type === 'page_view') {
            todayStats.page_views++;
            
            // 更新独立用户统计 - 改进逻辑
            if (data.user_fingerprint && data.user_fingerprint.user_id) {
                // 确保今日独立用户记录存在
                if (!analytics.daily_unique_users) {
                    analytics.daily_unique_users = {};
                }
                if (!analytics.daily_unique_users[today]) {
                    analytics.daily_unique_users[today] = [];
                }
                
                const userId = data.user_fingerprint.user_id;
                const todayUniqueUsers = analytics.daily_unique_users[today];
                
                // 如果是今天第一次访问的用户
                if (!todayUniqueUsers.includes(userId)) {
                    todayUniqueUsers.push(userId);
                    todayStats.unique_visitors = todayUniqueUsers.length;
                    
                // 仅在开发环境输出详细日志
                if (process.env.NODE_ENV === 'development') {
                        console.log(`📊 今日新独立用户: ${userId}, 总计: ${todayStats.unique_visitors}`);
                    }
                } else {
                    // 确保统计数字正确
                    todayStats.unique_visitors = todayUniqueUsers.length;
                }
            }
            
            // 更新流量来源统计
            if (data.source) {
                todayStats.traffic_sources[data.source] = (todayStats.traffic_sources[data.source] || 0) + 1;
            }
            
            // 更新地理位置统计
            if (data.geo_info && data.geo_info.country && data.geo_info.country !== 'unknown') {
                const country = data.geo_info.country;
                const region = data.geo_info.region;
                
                // 确保geo_stats对象存在
                if (!todayStats.geo_stats) {
                    todayStats.geo_stats = {};
                }
                
                // 更新国家统计
                if (!todayStats.geo_stats[country]) {
                    todayStats.geo_stats[country] = {
                        total: 0,
                        regions: {}
                    };
                }
                todayStats.geo_stats[country].total++;
                
                // 更新地区统计
                if (region && region !== 'unknown') {
                    if (!todayStats.geo_stats[country].regions) {
                        todayStats.geo_stats[country].regions = {};
                    }
                    if (!todayStats.geo_stats[country].regions[region]) {
                        todayStats.geo_stats[country].regions[region] = 0;
                    }
                    todayStats.geo_stats[country].regions[region]++;
                }
            }
            
            // 更新小时统计
            const hour = getLocalHour(); // 使用本地时间
            let hourData = todayStats.hourly_data.find(d => d.hour === hour);
            if (!hourData) {
                hourData = { hour, views: 0, clicks: 0 };
                todayStats.hourly_data.push(hourData);
            }
            hourData.views++;
        }
        
        // 根据不同类型的事件更新统计数据
        switch(data.type) {
            case 'product_click':
                todayStats.product_clicks++;
                
                // 更新小时统计中的点击数据
                const clickHour = getLocalHour(); // 使用本地时间
                let clickHourData = todayStats.hourly_data.find(d => d.hour === clickHour);
                if (!clickHourData) {
                    clickHourData = { hour: clickHour, views: 0, clicks: 0 };
                    todayStats.hourly_data.push(clickHourData);
                }
                clickHourData.clicks++;
                
                // 更新热门产品
                const productIndex = todayStats.top_products
                    .findIndex(p => p.id === data.product_id);
                    
                if (productIndex > -1) {
                    todayStats.top_products[productIndex].clicks++;
                } else {
                    todayStats.top_products.push({
                        id: data.product_id,
                        name: data.product_name,
                        clicks: 1
                    });
                }
                break;
                
            case 'inquiry':
                todayStats.inquiries++;
                break;
        }
        
        // 计算转化率
        const views = todayStats.page_views;
        const inquiries = todayStats.inquiries;
        if (views > 0) {
            todayStats.conversion_rate = 
                ((inquiries / views) * 100).toFixed(2);
        }
        
        // 排序热门产品
        todayStats.top_products.sort((a, b) => b.clicks - a.clicks);
        todayStats.top_products = todayStats.top_products.slice(0, 10);
        
        // 记录详细的用户访问信息（用于独立用户统计）
        if (data.user_fingerprint && data.user_fingerprint.user_id) {
            if (!analytics.user_records) {
                analytics.user_records = {};
            }
            
            const userId = data.user_fingerprint.user_id;
            if (!analytics.user_records[userId]) {
                analytics.user_records[userId] = {
                    first_visit: today,
                    last_visit: today,
                    total_visits: 0,
                    total_page_views: 0,
                    total_product_clicks: 0,
                    fingerprint: data.user_fingerprint,
                    geo_info: data.geo_info || {}
                };
            }
            
            // 更新用户记录
            const userRecord = analytics.user_records[userId];
            userRecord.last_visit = today;
            
            if (data.type === 'page_view') {
                userRecord.total_page_views++;
                if (data.is_new_visitor) {
                    userRecord.total_visits++;
                }
            } else if (data.type === 'product_click') {
                userRecord.total_product_clicks++;
            }
        }
        
        // 保存更新后的分析数据
        writeJsonFile('./data/analytics.json', analytics);
        
        res.json({ success: true });
    } catch (error) {
        console.error('处理分析数据失败:', error);
        res.status(500).json({
            success: false,
            message: '处理分析数据失败'
        });
    }
});

// 获取访问统计数据
app.get('/api/analytics', (req, res) => {
    try {
        const analyticsData = readJsonFile('./data/analytics.json');
        const today = getLocalDateString(); // 使用本地时间
        
        // 如果请求特定日期的数据
        const { date } = req.query;
        if (date) {
            res.json({
                success: true,
                data: analyticsData.daily_stats[date] || null
            });
            return;
        }
        
        // 默认返回今天的数据
        res.json({
            success: true,
            data: analyticsData.daily_stats[today] || null
        });
    } catch (error) {
        console.error('获取访问统计数据失败:', error);
        res.status(500).json({ 
            success: false, 
            error: '获取访问统计数据失败' 
        });
    }
});

// 获取地理位置统计数据
app.get('/api/analytics/geo', (req, res) => {
    try {
        const analyticsData = JSON.parse(fs.readFileSync('data/analytics.json', 'utf8'));
        res.json({
            geo_stats: analyticsData.geo_stats || {},
            user_records: analyticsData.user_records || {}
        });
    } catch (error) {
        console.error('获取地理统计数据失败:', error);
        res.status(500).json({ error: '获取地理统计数据失败' });
    }
});

// 历史数据查询API
app.get('/api/analytics/history/:period/:value', (req, res) => {
    try {
        const { period, value } = req.params;
        
        // 验证参数
        if (!['year', 'month', 'day'].includes(period)) {
            return res.status(400).json({ 
                success: false, 
                message: '无效的查询周期，支持: year, month, day' 
            });
        }
        
        const result = archiveAndQueryData.getHistoricalData(period, value);
        
        if (!result) {
            return res.status(500).json({ 
                success: false, 
                message: '获取历史数据失败' 
            });
        }
        
        res.json({ 
            success: true, 
            ...result 
        });
        
    } catch (error) {
        console.error('获取历史数据失败:', error);
        res.status(500).json({ success: false, message: '获取历史数据失败' });
    }
});

// 获取可用年份列表
app.get('/api/analytics/years', (req, res) => {
    try {
        const years = archiveAndQueryData.getAvailableYears();
        res.json({ 
            success: true, 
            data: years 
        });
    } catch (error) {
        console.error('获取年份列表失败:', error);
        res.status(500).json({ success: false, message: '获取年份列表失败' });
    }
});

// 获取指定年份的月份列表
app.get('/api/analytics/months/:year', (req, res) => {
    try {
        const { year } = req.params;
        const months = archiveAndQueryData.getAvailableMonths(year);
        res.json({ 
            success: true, 
            data: months 
        });
    } catch (error) {
        console.error('获取月份列表失败:', error);
        res.status(500).json({ success: false, message: '获取月份列表失败' });
    }
});

// 获取指定月份的日期列表
app.get('/api/analytics/days/:yearMonth', (req, res) => {
    try {
        const { yearMonth } = req.params;
        const days = archiveAndQueryData.getAvailableDays(yearMonth);
        res.json({ 
            success: true, 
            data: days 
        });
    } catch (error) {
        console.error('获取日期列表失败:', error);
        res.status(500).json({ success: false, message: '获取日期列表失败' });
    }
});

// 获取历史数据选项（通用接口）
app.get('/api/analytics/history/options', (req, res) => {
    try {
        const { period } = req.query;
        let data = [];
        
        switch (period) {
            case 'year':
                data = archiveAndQueryData.getAvailableYears();
                break;
            case 'month':
                // 获取所有可用月份
                const years = archiveAndQueryData.getAvailableYears();
                years.forEach(year => {
                    const months = archiveAndQueryData.getAvailableMonths(year);
                    data.push(...months);
                });
                data = [...new Set(data)].sort().reverse();
                break;
            case 'day':
                // 获取所有可用日期
                const analyticsPath = './data/analytics.json';
                const analytics = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
                data = Object.keys(analytics.daily_stats || {}).sort().reverse();
                break;
            default:
                return res.status(400).json({ 
                    success: false, 
                    message: '无效的查询周期' 
                });
        }
        
        res.json({ 
            success: true, 
            data: data 
        });
    } catch (error) {
        console.error('获取历史数据选项失败:', error);
        res.status(500).json({ success: false, message: '获取历史数据选项失败' });
    }
});

// 历史数据查询（支持查询参数格式）
app.get('/api/analytics/history', (req, res) => {
    try {
        const { period, value } = req.query;
        
        if (!period || !value) {
            return res.status(400).json({ 
                success: false, 
                message: '缺少必要参数: period, value' 
            });
        }
        
        // 验证参数
        if (!['year', 'month', 'day'].includes(period)) {
            return res.status(400).json({ 
                success: false, 
                message: '无效的查询周期，支持: year, month, day' 
            });
        }
        
        const result = archiveAndQueryData.getHistoricalData(period, value);
        
        if (!result) {
            return res.status(500).json({ 
                success: false, 
                message: '获取历史数据失败' 
            });
        }
        
        res.json({ 
            success: true, 
            data: result
        });
        
    } catch (error) {
        console.error('获取历史数据失败:', error);
        res.status(500).json({ success: false, message: '获取历史数据失败' });
    }
});

// 管理员管理API
// 获取所有管理员列表
app.get('/api/admins', authenticateToken, (req, res) => {
    try {
        // 检查权限
        const config = loadAdminConfig();
        const currentAdmin = getAdminByUsername(config, req.user.username);

        if (!hasPermission(currentAdmin, 'admins.read')) {
            return res.status(403).json({
                success: false,
                message: '没有权限查看管理员列表'
            });
        }

        const admins = Object.values(config.admins).map(admin => ({
            id: admin.id,
            username: admin.username,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            status: admin.status,
            created_at: admin.created_at,
            last_login: admin.last_login,
            login_attempts: admin.login_attempts,
            locked_until: admin.locked_until
        }));

        res.json({
            success: true,
            data: admins
        });

    } catch (error) {
        console.error('获取管理员列表失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 添加新管理员
app.post('/api/admins', authenticateToken, async (req, res) => {
    try {
        const { username, email, name, role, password } = req.body;

        // 检查权限
        const config = loadAdminConfig();
        const currentAdmin = getAdminByUsername(config, req.user.username);

        if (!hasPermission(currentAdmin, 'admins.create')) {
            return res.status(403).json({
                success: false,
                message: '没有权限添加管理员'
            });
        }

        // 验证输入
        if (!username || !email || !name || !role || !password) {
            return res.status(400).json({
                success: false,
                message: '所有字段都是必填的'
            });
        }

        // 验证用户名格式
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({
                success: false,
                message: '用户名格式不正确，请使用3-20位字母、数字或下划线'
            });
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: '邮箱格式不正确'
            });
        }

        // 检查用户名是否已存在
        const existingAdmin = getAdminByUsername(config, username);
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: '用户名已存在'
            });
        }

        // 检查邮箱是否已存在
        const emailExists = Object.values(config.admins).some(admin => admin.email === email);
        if (emailExists) {
            return res.status(400).json({
                success: false,
                message: '邮箱已存在'
            });
        }

        // 验证密码长度
        if (password.length < config.security.password_min_length) {
            return res.status(400).json({
                success: false,
                message: `密码长度至少${config.security.password_min_length}位`
            });
        }

        // 验证角色
        const validRoles = ['super_admin', 'admin', 'editor', 'viewer'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: '无效的角色'
            });
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, config.security.bcrypt_rounds);

        // 生成管理员ID
        const { v4: uuidv4 } = require('uuid');
        const adminId = uuidv4().replace(/-/g, '').substring(0, 12);

        // 定义角色权限
        const rolePermissions = {
            super_admin: [
                'products.create', 'products.read', 'products.update', 'products.delete',
                'categories.create', 'categories.read', 'categories.update', 'categories.delete',
                'inquiries.read', 'inquiries.update',
                'analytics.read', 'logs.read', 'settings.update',
                'admins.create', 'admins.read', 'admins.update', 'admins.delete'
            ],
            admin: [
                'products.create', 'products.read', 'products.update', 'products.delete',
                'categories.create', 'categories.read', 'categories.update', 'categories.delete',
                'inquiries.read', 'inquiries.update',
                'analytics.read', 'logs.read', 'settings.update'
            ],
            editor: [
                'products.read', 'products.update',
                'categories.read', 'categories.update',
                'inquiries.read',
                'analytics.read'
            ],
            viewer: [
                'products.read', 'categories.read', 'inquiries.read', 'analytics.read'
            ]
        };

        // 创建新管理员
        const newAdmin = {
            id: adminId,
            username,
            password: hashedPassword,
            email,
            name,
            role,
            status: 'active',
            created_at: new Date().toISOString(),
            created_by: req.user.username,
            last_login: null,
            login_attempts: 0,
            locked_until: null,
            session_timeout: config.security.session_timeout,
            permissions: rolePermissions[role],
            last_password_change: new Date().toISOString()
        };

        // 添加到配置
        config.admins[adminId] = newAdmin;

        if (saveAdminConfig(config)) {
            // 记录操作日志
            addLog('admin_create', `创建管理员: ${username}`, req);

            res.json({
                success: true,
                message: '管理员添加成功',
                data: {
                    id: adminId,
                    username,
                    email,
                    name,
                    role,
                    status: 'active'
                }
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存配置失败'
            });
        }

    } catch (error) {
        console.error('添加管理员失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 更新管理员信息
app.put('/api/admins/:id', authenticateToken, async (req, res) => {
    try {
        const adminId = req.params.id;
        const { email, name, role, status } = req.body;

        // 检查权限
        const config = loadAdminConfig();
        const currentAdmin = getAdminByUsername(config, req.user.username);

        if (!hasPermission(currentAdmin, 'admins.update')) {
            return res.status(403).json({
                success: false,
                message: '没有权限修改管理员信息'
            });
        }

        // 查找要修改的管理员
        const targetAdmin = getAdminById(config, adminId);
        if (!targetAdmin) {
            return res.status(404).json({
                success: false,
                message: '管理员不存在'
            });
        }

        // 验证邮箱格式（如果提供）
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: '邮箱格式不正确'
                });
            }

            // 检查邮箱是否已被其他管理员使用
            const emailExists = Object.values(config.admins).some(admin =>
                admin.id !== adminId && admin.email === email
            );
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: '邮箱已被其他管理员使用'
                });
            }
        }

        // 验证角色（如果提供）
        if (role) {
            const validRoles = ['super_admin', 'admin', 'editor', 'viewer'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: '无效的角色'
                });
            }
        }

        // 验证状态（如果提供）
        if (status && !['active', 'disabled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: '无效的状态'
            });
        }

        // 更新管理员信息
        if (email) config.admins[adminId].email = email;
        if (name) config.admins[adminId].name = name;
        if (role) {
            config.admins[adminId].role = role;
            // 更新权限
            const rolePermissions = {
                super_admin: [
                    'products.create', 'products.read', 'products.update', 'products.delete',
                    'categories.create', 'categories.read', 'categories.update', 'categories.delete',
                    'inquiries.read', 'inquiries.update',
                    'analytics.read', 'logs.read', 'settings.update',
                    'admins.create', 'admins.read', 'admins.update', 'admins.delete'
                ],
                admin: [
                    'products.create', 'products.read', 'products.update', 'products.delete',
                    'categories.create', 'categories.read', 'categories.update', 'categories.delete',
                    'inquiries.read', 'inquiries.update',
                    'analytics.read', 'logs.read', 'settings.update'
                ],
                editor: [
                    'products.read', 'products.update',
                    'categories.read', 'categories.update',
                    'inquiries.read',
                    'analytics.read'
                ],
                viewer: [
                    'products.read', 'categories.read', 'inquiries.read', 'analytics.read'
                ]
            };
            config.admins[adminId].permissions = rolePermissions[role];
        }
        if (status) config.admins[adminId].status = status;

        if (saveAdminConfig(config)) {
            // 记录操作日志
            addLog('admin_update', `修改管理员: ${targetAdmin.username}`, req);

            res.json({
                success: true,
                message: '管理员信息更新成功',
                data: {
                    id: adminId,
                    username: config.admins[adminId].username,
                    email: config.admins[adminId].email,
                    name: config.admins[adminId].name,
                    role: config.admins[adminId].role,
                    status: config.admins[adminId].status
                }
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存配置失败'
            });
        }

    } catch (error) {
        console.error('更新管理员失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 删除管理员
app.delete('/api/admins/:id', authenticateToken, (req, res) => {
    try {
        const adminId = req.params.id;

        // 检查权限
        const config = loadAdminConfig();
        const currentAdmin = getAdminByUsername(config, req.user.username);

        if (!hasPermission(currentAdmin, 'admins.delete')) {
            return res.status(403).json({
                success: false,
                message: '没有权限删除管理员'
            });
        }

        // 查找要删除的管理员
        const targetAdmin = getAdminById(config, adminId);
        if (!targetAdmin) {
            return res.status(404).json({
                success: false,
                message: '管理员不存在'
            });
        }

        // 不能删除自己
        if (targetAdmin.username === req.user.username) {
            return res.status(400).json({
                success: false,
                message: '不能删除自己的账户'
            });
        }

        // 检查是否是最后一个超级管理员
        const superAdmins = Object.values(config.admins).filter(admin => admin.role === 'super_admin');
        if (targetAdmin.role === 'super_admin' && superAdmins.length === 1) {
            return res.status(400).json({
                success: false,
                message: '不能删除最后一个超级管理员'
            });
        }

        // 删除管理员
        delete config.admins[adminId];

        if (saveAdminConfig(config)) {
            // 记录操作日志
            addLog('admin_delete', `删除管理员: ${targetAdmin.username}`, req);

            res.json({
                success: true,
                message: '管理员删除成功'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存配置失败'
            });
        }

    } catch (error) {
        console.error('删除管理员失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 重置管理员密码
app.post('/api/admins/:id/reset-password', authenticateToken, async (req, res) => {
    try {
        const adminId = req.params.id;
        const { password } = req.body;

        // 检查权限
        const config = loadAdminConfig();
        const currentAdmin = getAdminByUsername(config, req.user.username);

        if (!hasPermission(currentAdmin, 'admins.update')) {
            return res.status(403).json({
                success: false,
                message: '没有权限重置管理员密码'
            });
        }

        // 查找要重置密码的管理员
        const targetAdmin = getAdminById(config, adminId);
        if (!targetAdmin) {
            return res.status(404).json({
                success: false,
                message: '管理员不存在'
            });
        }

        // 验证密码
        if (!password || password.length < config.security.password_min_length) {
            return res.status(400).json({
                success: false,
                message: `密码长度至少${config.security.password_min_length}位`
            });
        }

        // 加密新密码
        const hashedPassword = await bcrypt.hash(password, config.security.bcrypt_rounds);

        // 更新密码
        config.admins[adminId].password = hashedPassword;
        config.admins[adminId].last_password_change = new Date().toISOString();
        config.admins[adminId].login_attempts = 0; // 重置登录尝试次数
        config.admins[adminId].locked_until = null; // 解除锁定

        if (saveAdminConfig(config)) {
            // 记录操作日志
            addLog('admin_reset_password', `重置管理员密码: ${targetAdmin.username}`, req);

            res.json({
                success: true,
                message: '管理员密码重置成功'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存配置失败'
            });
        }

    } catch (error) {
        console.error('重置管理员密码失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 产品管理API
// 获取所有产品（支持分页和筛选）
app.get('/api/products', authenticateToken, requirePermission('products.read'), (req, res) => {
    let products = readJsonFile('./data/products.json');
    
    // 获取查询参数
    const {
        page = 1,
        limit = 20,
        search = '',
        category = '',
        status = '',
        sortBy = 'id',
        sortOrder = 'desc'
    } = req.query;
    
    // 转换参数类型
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // 限制每页最多100条
    
    // 搜索筛选 - 扩展搜索范围包含OE号码、适配信息、其他事项和产品特性
    if (search) {
        const searchLower = search.toLowerCase();
        products = products.filter(product =>
            (product.name && product.name.toLowerCase().includes(searchLower)) ||
            (product.model && product.model.toLowerCase().includes(searchLower)) ||
            (product.sku && product.sku.toLowerCase().includes(searchLower)) ||
            (product.description && product.description.toLowerCase().includes(searchLower)) ||
            (product.brand && product.brand.toLowerCase().includes(searchLower)) ||
            (product.oe_number && product.oe_number.toLowerCase().includes(searchLower)) ||
            (product.compatibility && product.compatibility.toLowerCase().includes(searchLower)) ||
            (product.notes && product.notes.toLowerCase().includes(searchLower)) ||
            (product.features && product.features.toLowerCase().includes(searchLower))
        );
    }
    
    // 分类筛选
    if (category) {
        products = products.filter(product => product.category === category);
    }
    
    // 状态筛选
    if (status) {
        products = products.filter(product => product.status === status);
    }
    
    // 排序
    products.sort((a, b) => {
        let valueA, valueB;
        
        switch (sortBy) {
            case 'name':
                valueA = (a.name || '').toLowerCase();
                valueB = (b.name || '').toLowerCase();
                break;
            case 'price':
                valueA = parseFloat(a.price) || 0;
                valueB = parseFloat(b.price) || 0;
                break;
            case 'stock':
                valueA = parseInt(a.stock) || 0;
                valueB = parseInt(b.stock) || 0;
                break;
            case 'createdAt':
                valueA = new Date(a.createdAt || 0);
                valueB = new Date(b.createdAt || 0);
                break;
            case 'id':
            default:
                valueA = parseInt(a.id) || 0;
                valueB = parseInt(b.id) || 0;
                break;
        }
        
        if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });
    
    // 计算分页
    const total = products.length;
    const totalPages = Math.ceil(total / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedProducts = products.slice(startIndex, endIndex);
    
    // 返回分页数据
    res.json({
        data: paginatedProducts,
        pagination: {
            current: pageNum,
            total: totalPages,
            limit: limitNum,
            totalItems: total,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1,
            nextPage: pageNum < totalPages ? pageNum + 1 : null,
            prevPage: pageNum > 1 ? pageNum - 1 : null
        },
        filters: {
            search,
            category,
            status,
            sortBy,
            sortOrder
        }
    });
});

// 🌐 公开产品接口 - 供前端页面使用（无需身份验证）
app.get('/api/public/products', (req, res) => {
    try {
        let products = readJsonFile('./data/products.json');

        // 获取查询参数
        const {
            page = 1,
            limit = 50,
            category,
            search,
            status = 'active'
        } = req.query;

        // 过滤状态（只显示活跃产品）
        products = products.filter(p => p.status === status);

        // 分类过滤
        if (category && category !== 'all') {
            products = products.filter(p => p.category === category);
        }

        // 搜索过滤
        if (search) {
            const searchLower = search.toLowerCase();
            products = products.filter(p =>
                p.name.toLowerCase().includes(searchLower) ||
                p.model.toLowerCase().includes(searchLower) ||
                p.sku.toLowerCase().includes(searchLower) ||
                (p.oe_number && p.oe_number.toLowerCase().includes(searchLower))
            );
        }

        // 分页处理
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;

        const paginatedProducts = limitNum > 0 ? products.slice(startIndex, endIndex) : products;

        res.json({
            data: paginatedProducts,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: products.length,
                pages: limitNum > 0 ? Math.ceil(products.length / limitNum) : 1
            }
        });
    } catch (error) {
        console.error('获取公开产品数据失败:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: '服务器内部错误'
        });
    }
});

// 获取单个产品详情（公开接口）
app.get('/api/public/products/:id', (req, res) => {
    try {
        const productId = req.params.id;
        const products = readJsonFile('./data/products.json');

        const product = products.find(p => p.id === productId && p.status === 'active');

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({
                error: 'Product not found',
                message: '产品未找到'
            });
        }
    } catch (error) {
        console.error('获取产品详情失败:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: '服务器内部错误'
        });
    }
});

// 获取单个产品详情
app.get('/api/products/:id', (req, res) => {
    const productId = req.params.id;
    const products = readJsonFile('./data/products.json');
    
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        return res.status(404).json({
            success: false,
            message: '产品不存在'
        });
    }
    
    // 记录产品访问
    addLog('view_product', {
        productId: product.id,
        productName: product.name
    }, req);
    
    res.json(product);
});

// 生成SKU：HD-年月日时分秒 (例如: HD-250623205425)
const generateSKU = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // 取年份后两位
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 月份补零
    const day = now.getDate().toString().padStart(2, '0'); // 日期补零
    const hour = now.getHours().toString().padStart(2, '0'); // 小时补零
    const minute = now.getMinutes().toString().padStart(2, '0'); // 分钟补零
    const second = now.getSeconds().toString().padStart(2, '0'); // 秒补零
    
    return `HD-${year}${month}${day}${hour}${minute}${second}`;
};

// 创建产品
app.post('/api/products', authenticateToken, requirePermission('products.create'), upload.array('images', 10), (req, res) => {
    const products = readJsonFile('./data/products.json');
    const categories = readJsonFile('./data/categories.json');
    
    // 验证分类是否存在
    if (req.body.category && !categories.find(c => c.id === req.body.category)) {
        return res.status(400).json({ error: '指定的分类不存在' });
    }
    
    // 处理多张图片
    let images = [];
    if (req.files && req.files.length > 0) {
        images = req.files.map(file => `/uploads/products/${file.filename}`);
    }

    const newProduct = {
        id: Date.now().toString(),
        sku: generateSKU(), // 生成唯一SKU
        name: req.body.name,
        model: req.body.model || '',
        category: req.body.category || 'others',
        brand: req.body.brand || 'Diamond-Auto',
        description: req.body.description || '',
        image: images.length > 0 ? images[0] : '', // 第一张图片作为主图
        images: images, // 所有图片
        price: req.body.price || '0',
        status: req.body.status || 'active',
        stock: parseInt(req.body.stock) || 0,
        // 产品详细信息
        oe_number: req.body.oe_number || '',
        compatibility: req.body.compatibility || '',
        warranty: req.body.warranty || '12',
        notes: req.body.notes || '',
        // SEO信息
        meta_description: req.body.meta_description || '',
        meta_keywords: req.body.meta_keywords || '',
        // 产品标签和特性
        badges: req.body.badges || '',  // 产品标签
        features: req.body.features || '',  // 产品特性
        isNew: req.body.isNew === 'true',  // 是否新品
        isHot: req.body.isHot === 'true',  // 是否热门
        isRecommend: req.body.isRecommend === 'true',  // 是否推荐
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    products.push(newProduct);
    writeJsonFile('./data/products.json', products);
    
    // 更新分类产品计数
    const category = categories.find(c => c.id === newProduct.category);
    if (category) {
        category.count = products.filter(p => p.category === category.id).length;
        writeJsonFile('./data/categories.json', categories);
    }
    
    // 记录操作日志
    addLog('create', `创建产品: ${newProduct.sku}`, req);
    
    res.status(201).json(newProduct);
});

// 更新产品
app.put('/api/products/:id', authenticateToken, requirePermission('products.update'), upload.array('images', 10), (req, res) => {
    const products = readJsonFile('./data/products.json');
    const categories = readJsonFile('./data/categories.json');
    const productIndex = products.findIndex(p => p.id === req.params.id);
    
    if (productIndex === -1) {
        return res.status(404).json({ error: '产品未找到' });
    }
    
    // 验证分类是否存在
    if (req.body.category && !categories.find(c => c.id === req.body.category)) {
        return res.status(400).json({ error: '指定的分类不存在' });
    }
    
    const oldProduct = products[productIndex];
    const updatedProduct = {
        ...oldProduct,
        ...req.body,
        updatedAt: new Date().toISOString()
    };
    
    // 处理图片更新
    if (req.files && req.files.length > 0) {
        // 有新图片上传
        const newImages = req.files.map(file => `/uploads/products/${file.filename}`);
        
        // 合并现有图片和新图片
        let existingImages = [];
        if (req.body.existingImages) {
            try {
                existingImages = JSON.parse(req.body.existingImages);
            } catch (e) {
                existingImages = [];
            }
        }
        
        // 合并所有图片
        const allImages = [...existingImages, ...newImages];
        updatedProduct.images = allImages;
        updatedProduct.image = allImages.length > 0 ? allImages[0] : '';
        
    } else if (req.body.existingImages) {
        // 只有现有图片，没有新上传的图片
        try {
            const existingImages = JSON.parse(req.body.existingImages);
            updatedProduct.images = existingImages;
            updatedProduct.image = existingImages.length > 0 ? existingImages[0] : '';
        } catch (e) {
            console.error('解析现有图片数据失败:', e);
        }
    }
    
    // 确保数据格式兼容性
    if (!updatedProduct.images) {
        updatedProduct.images = updatedProduct.image ? [updatedProduct.image] : [];
    }
    
    products[productIndex] = updatedProduct;
    writeJsonFile('./data/products.json', products);
    
    // 如果分类发生变化，更新相关分类的计数
    if (oldProduct.category !== updatedProduct.category) {
        categories.forEach(category => {
            category.count = products.filter(p => p.category === category.id).length;
        });
        writeJsonFile('./data/categories.json', categories);
    }
    
    // 记录操作日志
    addLog('update', `更新产品: ${updatedProduct.sku || updatedProduct.name}`, req);
    
    res.json(updatedProduct);
});

// 删除产品
app.delete('/api/products/:id', authenticateToken, requirePermission('products.delete'), (req, res) => {
    try {
        const products = readJsonFile('./data/products.json');
        const categories = readJsonFile('./data/categories.json');
        
        // 确保数据是数组格式
        if (!Array.isArray(products)) {
            console.error('Products数据格式错误，不是数组');
            return res.status(500).json({ error: '数据格式错误' });
        }
        
        // 兼容字符串和数字类型的ID
        const targetId = req.params.id;
        const productIndex = products.findIndex(p => p.id.toString() === targetId.toString());
        
        if (productIndex === -1) {
            return res.status(404).json({ error: '产品未找到' });
        }
        
        const deletedProduct = products[productIndex];
        products.splice(productIndex, 1);
        writeJsonFile('./data/products.json', products);
        
        // 更新分类产品计数
        if (Array.isArray(categories)) {
            const category = categories.find(c => c && c.id === deletedProduct.category);
            if (category) {
                category.count = products.filter(p => p && p.category === category.id).length;
                writeJsonFile('./data/categories.json', categories);
            }
        }
        
        // 删除产品图片文件（对于新上传的图片）
        if (deletedProduct.image && deletedProduct.image.startsWith('/uploads/')) {
            const imagePath = path.join(__dirname, deletedProduct.image);
            if (fs.existsSync(imagePath)) {
                try {
                    fs.unlinkSync(imagePath);
                } catch (error) {
                    console.error('删除图片文件失败:', error);
                }
            }
        }
        
        // 记录操作日志
        addLog('delete', `删除产品: ${deletedProduct.sku || deletedProduct.name}`, req);
        
        res.json({ message: '产品删除成功' });
    } catch (error) {
        console.error('删除产品失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 分类管理API
// 获取所有分类
app.get('/api/categories', authenticateToken, requirePermission('categories.read'), (req, res) => {
    try {
        const categories = readJsonFile('./data/categories.json');
        const products = readJsonFile('./data/products.json');
        
        // 确保数据是数组格式
        if (!Array.isArray(categories)) {
            console.error('Categories数据格式错误，不是数组');
            return res.json([]);
        }
        
        if (!Array.isArray(products)) {
            console.error('Products数据格式错误，不是数组');
            return res.json(categories);
        }
        
        // 更新分类中的产品计数
        categories.forEach(category => {
            if (category && category.id) {
                category.count = products.filter(p => p && p.category === category.id).length;
            }
        });
        
        res.json(categories);
    } catch (error) {
        console.error('获取分类列表失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 获取单个分类
app.get('/api/categories/:id', authenticateToken, requirePermission('categories.read'), (req, res) => {
    const categories = readJsonFile('./data/categories.json');
    const category = categories.find(c => c.id === req.params.id);
    
    if (!category) {
        return res.status(404).json({ error: '分类未找到' });
    }
    
    res.json(category);
});

// 创建分类
app.post('/api/categories', authenticateToken, requirePermission('categories.create'), (req, res) => {
    const categories = readJsonFile('./data/categories.json');
    
    // 验证分类ID格式
    const idPattern = /^[a-z0-9-]+$/;
    if (!idPattern.test(req.body.id)) {
        return res.status(400).json({ error: '分类ID只能包含小写字母、数字和连字符' });
    }
    
    // 检查ID是否重复
    if (categories.find(c => c.id === req.body.id)) {
        return res.status(400).json({ error: '分类ID已存在' });
    }
    
    const newCategory = {
        id: req.body.id,
        name: req.body.name,
        description: req.body.description || '',
        count: 0,
        createdAt: new Date().toISOString()
    };
    
    categories.push(newCategory);
    writeJsonFile('./data/categories.json', categories);
    
    // 记录操作日志
    addLog('create', `创建分类: ${newCategory.name} (${newCategory.id})`, req);
    
    res.status(201).json(newCategory);
});

// 更新分类
app.put('/api/categories/:id', authenticateToken, requirePermission('categories.update'), (req, res) => {
    const categories = readJsonFile('./data/categories.json');
    const products = readJsonFile('./data/products.json');
    const categoryIndex = categories.findIndex(c => c.id === req.params.id);
    
    if (categoryIndex === -1) {
        return res.status(404).json({ error: '分类未找到' });
    }
    
    const oldCategory = categories[categoryIndex];
    const updatedCategory = {
        ...oldCategory,
        name: req.body.name || oldCategory.name,
        description: req.body.description || oldCategory.description
    };
    
    // 如果ID发生变化
    if (req.body.id && req.body.id !== oldCategory.id) {
        // 验证新ID格式
        const idPattern = /^[a-z0-9-]+$/;
        if (!idPattern.test(req.body.id)) {
            return res.status(400).json({ error: '分类ID只能包含小写字母、数字和连字符' });
        }
        
        // 检查新ID是否重复
        if (categories.find(c => c.id === req.body.id && c.id !== oldCategory.id)) {
            return res.status(400).json({ error: '分类ID已存在' });
        }
        
        // 更新所有相关产品的分类
        products.forEach(product => {
            if (product.category === oldCategory.id) {
                product.category = req.body.id;
            }
        });
        writeJsonFile('./data/products.json', products);
        
        updatedCategory.id = req.body.id;
    }
    
    categories[categoryIndex] = updatedCategory;
    writeJsonFile('./data/categories.json', categories);
    
    // 记录操作日志
    addLog('update', `更新分类: ${updatedCategory.name} (${updatedCategory.id})`, req);
    
    res.json(updatedCategory);
});

// 删除分类
app.delete('/api/categories/:id', authenticateToken, requirePermission('categories.delete'), (req, res) => {
    const categories = readJsonFile('./data/categories.json');
    const products = readJsonFile('./data/products.json');
    const categoryIndex = categories.findIndex(c => c.id === req.params.id);
    
    if (categoryIndex === -1) {
        return res.status(404).json({ error: '分类未找到' });
    }
    
    const category = categories[categoryIndex];
    
    // 检查是否有产品使用此分类
    const relatedProducts = products.filter(p => p.category === category.id);
    if (relatedProducts.length > 0) {
        return res.status(400).json({ 
            error: `无法删除分类，有 ${relatedProducts.length} 个产品正在使用此分类` 
        });
    }
    
    categories.splice(categoryIndex, 1);
    writeJsonFile('./data/categories.json', categories);
    
    // 记录操作日志
    addLog('delete', `删除分类: ${category.name} (${category.id})`, req);
    
    res.json({ message: '分类删除成功' });
});

// 操作日志API
// 获取操作日志
app.get('/api/logs', authenticateToken, (req, res) => {
    const logs = readJsonFile('./data/logs.json');
    const { action, limit = 50 } = req.query;
    
    let filteredLogs = logs;
    
    // 按操作类型筛选
    if (action && action !== 'all') {
        filteredLogs = logs.filter(log => log.action === action);
    }
    
    // 限制返回数量
    filteredLogs = filteredLogs.slice(0, parseInt(limit));
    
    res.json(filteredLogs);
});

// 添加操作日志
app.post('/api/logs', authenticateToken, (req, res) => {
    const logs = readJsonFile('./data/logs.json');
    const newLog = {
        id: Date.now().toString(),
        action: req.body.action,
        target: req.body.target,
        description: req.body.description,
        details: req.body.details || req.body.description,
        timestamp: new Date().toISOString(),
        user: '管理员',
        ip: req.ip || req.connection.remoteAddress || '127.0.0.1'
    };
    
    logs.unshift(newLog);
    
    // 只保留最近1000条记录
    if (logs.length > 1000) {
        logs.splice(1000);
    }
    
    writeJsonFile('./data/logs.json', logs);
    res.json({ message: '日志添加成功' });
});

// 清空操作日志
app.delete('/api/logs', authenticateToken, (req, res) => {
    writeJsonFile('./data/logs.json', []);
    addLog('system', '清空操作日志', req);
    res.json({ message: '日志清空成功' });
});

// 询价API
// 创建新询价
app.post('/api/inquiries', (req, res) => {
    try {
        const { name, email, phone, quantity, message, productInfo, source, sourceDetails } = req.body;
        
        // 验证必需字段
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: '姓名、邮箱和询价内容为必填项'
            });
        }
        
        // 读取现有询价数据
        const inquiries = readJsonFile('./data/inquiries.json');
        
        // 生成新的询价记录
        const newInquiry = {
            id: `INQ${Date.now()}${Math.floor(Math.random() * 1000)}`,
            name: name.trim(),
            email: email.trim(),
            phone: phone ? phone.trim() : '',
            quantity: quantity || '',
            message: message.trim(),
            productInfo: productInfo || null,
            source: source || 'unknown', // 询价来源
            sourceDetails: sourceDetails || null, // 来源详细信息
            status: 'pending',
            createdAt: new Date().toISOString(),
            ip: req.ip || req.connection.remoteAddress || 'unknown',
            logs: [{
                action: '新询价提交',
                timestamp: new Date().toISOString()
            }]
        };
        
        // 添加到询价列表
        inquiries.unshift(newInquiry); // 新的询价放在最前面
        
        // 保存更新的数据
        writeJsonFile('./data/inquiries.json', inquiries);

        // 同步更新analytics.json中的询价统计
        try {
            const analytics = readJsonFile('./data/analytics.json');
            const today = getLocalDateString();

            // 确保今日数据存在
            ensureTodayData();

            // 重新读取可能更新的analytics数据
            const updatedAnalytics = readJsonFile('./data/analytics.json');

            // 更新今日询价统计
            if (updatedAnalytics.daily_stats[today]) {
                updatedAnalytics.daily_stats[today].inquiries++;

                // 重新计算转化率
                const views = updatedAnalytics.daily_stats[today].page_views;
                const inquiries = updatedAnalytics.daily_stats[today].inquiries;
                if (views > 0) {
                    updatedAnalytics.daily_stats[today].conversion_rate =
                        ((inquiries / views) * 100).toFixed(2);
                }

                // 保存更新的analytics数据
                writeJsonFile('./data/analytics.json', updatedAnalytics);
                console.log(`📊 已同步更新analytics询价统计: ${inquiries}`);
            }
        } catch (error) {
            console.error('同步更新analytics失败:', error);
            // 不影响询价提交的成功，只记录错误
        }

        // 记录操作日志
        addLog('new_inquiry', {
            inquiryId: newInquiry.id,
            customerName: newInquiry.name,
            customerEmail: newInquiry.email,
            productInfo: newInquiry.productInfo
        }, req);

        res.json({
            success: true,
            message: '询价提交成功',
            inquiryId: newInquiry.id
        });
        
    } catch (error) {
        console.error('处理询价请求失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理询价请求失败，请稍后重试'
        });
    }
});

// 获取询价列表
app.get('/api/inquiries', authenticateToken, (req, res) => {
    try {
        const inquiries = readJsonFile('./data/inquiries.json');
        res.json(inquiries);
    } catch (error) {
        console.error('获取询价列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取询价列表失败'
        });
    }
});

// 获取单个询价详情
app.get('/api/inquiries/:id', authenticateToken, (req, res) => {
    try {
        const inquiries = readJsonFile('./data/inquiries.json');
        const inquiry = inquiries.find(item => item.id === req.params.id);
        
        if (!inquiry) {
            return res.status(404).json({
                success: false,
                message: '未找到指定的询价记录'
            });
        }
        
        res.json(inquiry);
    } catch (error) {
        console.error('获取询价详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取询价详情失败'
        });
    }
});

// 更新询价状态
app.put('/api/inquiries/:id/status', authenticateToken, (req, res) => {
    try {
        const inquiries = readJsonFile('./data/inquiries.json');
        const inquiryIndex = inquiries.findIndex(item => item.id === req.params.id);
        
        if (inquiryIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '未找到指定的询价记录'
            });
        }
        
        const oldStatus = inquiries[inquiryIndex].status;
        const newStatus = req.body.status;
        
        // 更新状态
        inquiries[inquiryIndex].status = newStatus;
        
        // 添加处理记录
        if (!inquiries[inquiryIndex].logs) {
            inquiries[inquiryIndex].logs = [];
        }
        
        inquiries[inquiryIndex].logs.push({
            action: `状态从"${getStatusText(oldStatus)}"更新为"${getStatusText(newStatus)}"`,
            timestamp: new Date().toISOString()
        });
        
        // 保存更新
        writeJsonFile('./data/inquiries.json', inquiries);
        
        // 记录操作日志
        addLog('update_inquiry_status', {
            inquiryId: req.params.id,
            oldStatus,
            newStatus
        }, req);
        
        res.json({
            success: true,
            message: '询价状态已更新'
        });
    } catch (error) {
        console.error('更新询价状态失败:', error);
        res.status(500).json({
            success: false,
            message: '更新询价状态失败'
        });
    }
});

// 清空所有询价数据
app.delete('/api/inquiries/clear-all', authenticateToken, requirePermission('inquiries.update'), (req, res) => {
    try {
        // 记录操作日志
        addLog('clear_inquiries', '清空所有询价数据', req);

        // 清空询价数据文件
        writeJsonFile('./data/inquiries.json', []);

        console.log('所有询价数据已清空');

        res.json({
            success: true,
            message: '所有询价数据已清空'
        });

    } catch (error) {
        console.error('清空询价数据失败:', error);
        res.status(500).json({
            success: false,
            message: '清空询价数据失败'
        });
    }
});

// 数据校验API
app.post('/api/analytics/validate', authenticateToken, (req, res) => {
    try {
        validateAndFixAnalyticsData();
        res.json({
            success: true,
            message: '数据校验完成'
        });
    } catch (error) {
        console.error('数据校验API失败:', error);
        res.status(500).json({
            success: false,
            message: '数据校验失败'
        });
    }
});

// 获取咨询来源统计
app.get('/api/inquiries/sources/stats', (req, res) => {
    try {
        const inquiries = readJsonFile('./data/inquiries.json');
        
        // 统计各个来源的咨询数量
        const sourcesStats = {
            contact_form: 0,      // 联系表单
            footer_form: 0,       // 页尾表单  
            product_detail_form: 0, // 产品详情页表单
            whatsapp: 0,          // WhatsApp
            phone: 0,             // 电话
            email: 0,             // 邮箱
            unknown: 0            // 未知来源
        };
        
        // 来源名称映射
        const sourceNames = {
            'contact_form': '联系表单',
            'footer_form': '页尾快速询价',
            'product_detail_form': '产品详情页询价',
            'whatsapp': 'WhatsApp咨询',
            'phone': '电话咨询',
            'email': '邮箱咨询',
            'unknown': '其他来源'
        };
        
        // 获取日期范围参数
        const { startDate, endDate } = req.query;
        let filteredInquiries = inquiries;
        
        // 如果指定了日期范围，进行过滤
        if (startDate || endDate) {
            filteredInquiries = inquiries.filter(inquiry => {
                const inquiryDate = getLocalDateString(new Date(inquiry.createdAt)); // 使用本地时间
                if (startDate && inquiryDate < startDate) return false;
                if (endDate && inquiryDate > endDate) return false;
                return true;
            });
        }
        
        // 统计各来源的数量
        filteredInquiries.forEach(inquiry => {
            const source = inquiry.source || 'unknown';
            if (sourcesStats.hasOwnProperty(source)) {
                sourcesStats[source]++;
            } else {
                sourcesStats.unknown++;
            }
        });
        
        // 转换为图表数据格式
        const chartData = Object.entries(sourcesStats).map(([source, count]) => ({
            name: sourceNames[source] || source,
            value: count,
            source: source
        }));
        
        res.json({
            success: true,
            data: {
                stats: sourcesStats,
                chartData: chartData,
                total: filteredInquiries.length,
                period: {
                    startDate: startDate || null,
                    endDate: endDate || null
                }
            }
        });
        
    } catch (error) {
        console.error('获取咨询来源统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取咨询来源统计失败'
        });
    }
});

// 导出询价记录
app.get('/api/inquiries/export', (req, res) => {
    try {
        let inquiries = readJsonFile('./data/inquiries.json');
        
        // 应用筛选
        if (req.query.status) {
            inquiries = inquiries.filter(item => item.status === req.query.status);
        }
        if (req.query.date) {
            const filterDate = req.query.date;
            inquiries = inquiries.filter(item => 
                item.createdAt.split('T')[0] === filterDate
            );
        }
        
        // 生成CSV内容
        const csvRows = [];
        
        // 添加表头
        csvRows.push([
            'ID',
            '提交时间',
            '客户姓名',
            '邮箱',
            '电话',
            '产品名称',
            '产品型号',
            '询价数量',
            '询价内容',
            '状态',
            'IP地址'
        ].join(','));
        
        // 添加数据行
        inquiries.forEach(inquiry => {
            csvRows.push([
                inquiry.id,
                inquiry.createdAt,
                inquiry.name,
                inquiry.email,
                inquiry.phone || '',
                inquiry.productInfo ? inquiry.productInfo.name : '',
                inquiry.productInfo ? (inquiry.productInfo.model || '') : '',
                inquiry.quantity || '',
                `"${inquiry.message.replace(/"/g, '""')}"`,
                getStatusText(inquiry.status),
                inquiry.ip
            ].join(','));
        });
        
        // 设置响应头
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=inquiries-${getLocalDateString()}.csv`);
        
        // 发送CSV内容
        res.send('\ufeff' + csvRows.join('\n')); // 添加BOM以支持中文
        
    } catch (error) {
        console.error('导出询价记录失败:', error);
        res.status(500).json({
            success: false,
            message: '导出询价记录失败'
        });
    }
});

// 获取状态文本
function getStatusText(status) {
    const statusMap = {
        'pending': '待处理',
        'processing': '处理中',
        'completed': '已完成',
        'cancelled': '已取消'
    };
    return statusMap[status] || status;
}

// 自动标签系统API
// 记录产品点击
app.post('/api/analytics/product-click', (req, res) => {
    const { productId } = req.body;
    if (!productId) {
        return res.status(400).json({ error: '产品ID不能为空' });
    }

    const analytics = readJsonFile('./data/analytics.json');
    const today = getLocalDateString(); // 使用本地时间

    // 确保今日数据存在（使用统一的函数）
    ensureTodayData();
    
    // 重新读取可能更新的数据
    const updatedAnalytics = readJsonFile('./data/analytics.json');

    // 今日数据已通过ensureTodayData()确保存在

    // 初始化产品统计
    if (!updatedAnalytics.product_analytics) {
        updatedAnalytics.product_analytics = {};
    }
    if (!updatedAnalytics.product_analytics[productId]) {
        updatedAnalytics.product_analytics[productId] = {
            total_views: 0,
            total_clicks: 0,
            inquiries: 0,
            conversion_rate: 0,
            first_click: new Date().toISOString()
        };
    }

    // 更新点击数据
    updatedAnalytics.daily_stats[today].product_clicks++;
    updatedAnalytics.product_analytics[productId].total_clicks++;
    updatedAnalytics.product_analytics[productId].last_click = new Date().toISOString();

    // 更新今日热门产品排行
    const today_stats = updatedAnalytics.daily_stats[today];
    let topProduct = today_stats.top_products.find(p => p.id === productId);
    if (topProduct) {
        topProduct.clicks++;
    } else {
        const products = readJsonFile('./data/products.json');
        const product = products.find(p => p.id === productId);
        if (product) {
            today_stats.top_products.push({
                id: productId,
                name: product.name,
                clicks: 1
            });
        }
    }

    // 排序热门产品
    today_stats.top_products.sort((a, b) => b.clicks - a.clicks);
    today_stats.top_products = today_stats.top_products.slice(0, 10);

    writeJsonFile('./data/analytics.json', updatedAnalytics);
    res.json({ message: '点击记录成功' });
});

// 获取产品点击统计
app.get('/api/analytics/product-stats', (req, res) => {
    const analytics = readJsonFile('./data/analytics.json');
    const products = readJsonFile('./data/products.json');
    
    // 计算所有产品的统计数据
    const productStats = products.map(product => {
        const stats = analytics.product_analytics[product.id] || {
            total_views: 0,
            total_clicks: 0,
            inquiries: 0,
            conversion_rate: 0
        };
        
        // 计算30天内的点击数
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        let recentClicks = 0;
        Object.keys(analytics.daily_stats).forEach(date => {
            if (new Date(date) >= thirtyDaysAgo) {
                const dayProducts = analytics.daily_stats[date].top_products || [];
                const dayProduct = dayProducts.find(p => p.id === product.id);
                if (dayProduct) {
                    recentClicks += dayProduct.clicks;
                }
            }
        });

        return {
            id: product.id,
            name: product.name,
            createdAt: product.createdAt,
            total_clicks: stats.total_clicks,
            recent_clicks: recentClicks,
            isNew: product.isNew,
            isHot: product.isHot,
            isRecommend: product.isRecommend
        };
    });

    res.json(productStats);
});

// 自动分配产品标签
app.post('/api/products/auto-assign-tags', authenticateToken, requirePermission('products.update'), (req, res) => {
    try {
        const products = readJsonFile('./data/products.json');
        const analytics = readJsonFile('./data/analytics.json');
        
        const now = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        // 计算每个产品的统计数据
        const productStats = products.map(product => {
            const createdDate = new Date(product.createdAt);
            const isNewProduct = createdDate >= oneMonthAgo;
            
            // 计算总点击数
            let totalClicks = 0;
            if (analytics.product_analytics && analytics.product_analytics[product.id]) {
                totalClicks = analytics.product_analytics[product.id].total_clicks || 0;
            }

            return {
                ...product,
                isNewProduct,
                totalClicks,
                createdDate
            };
        });

        // 按点击数排序
        productStats.sort((a, b) => b.totalClicks - a.totalClicks);
        
        // 计算前10%的产品数量
        const hotProductCount = Math.max(1, Math.ceil(productStats.length * 0.1));
        
        let updateCount = 0;
        
        // 分配标签
        productStats.forEach((product, index) => {
            let isNew = 'false';
            let isHot = 'false';
            let isRecommend = 'false';
            
            if (product.isNewProduct) {
                // 上架不超过一个月的标记为新品
                isNew = 'true';
            } else if (index < hotProductCount && product.totalClicks > 0) {
                // 点击率前10%的标记为热门
                isHot = 'true';
            } else {
                // 其余的标记为推荐
                isRecommend = 'true';
            }
            
            // 检查是否需要更新
            if (product.isNew !== isNew || product.isHot !== isHot || product.isRecommend !== isRecommend) {
                // 更新产品标签
                const productIndex = products.findIndex(p => p.id === product.id);
                if (productIndex !== -1) {
                    products[productIndex].isNew = isNew;
                    products[productIndex].isHot = isHot;
                    products[productIndex].isRecommend = isRecommend;
                    products[productIndex].updatedAt = new Date().toISOString();
                    updateCount++;
                }
            }
        });

        // 保存更新后的产品数据
        writeJsonFile('./data/products.json', products);
        
        // 记录操作日志
        addLog('system', `自动分配产品标签，共更新 ${updateCount} 个产品`, req);
        
        res.json({ 
            message: '自动标签分配完成',
            updatedCount,
            totalProducts: products.length,
            newProducts: productStats.filter(p => p.isNewProduct).length,
            hotProducts: hotProductCount,
            stats: {
                new: productStats.filter(p => p.isNewProduct).length,
                hot: hotProductCount,
                recommend: productStats.length - productStats.filter(p => p.isNewProduct).length - hotProductCount
            }
        });
        
    } catch (error) {
        console.error('自动分配标签失败:', error);
        res.status(500).json({ error: '自动分配标签失败' });
    }
});

// 文件上传API
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: '没有文件被上传' });
    }
    
    const filePath = `/uploads/products/${req.file.filename}`;
    
    // 记录操作日志
    addLog('upload', `上传文件: ${req.file.originalname}`, req);
    
    res.json({
        message: '文件上传成功',
        filename: req.file.filename,
        path: filePath,
        size: req.file.size
    });
});

// 获取公司信息
app.get('/api/company', (req, res) => {
    try {
        const companyData = readJsonFile('./data/company.json');
        res.json({ 
            success: true, 
            data: companyData 
        });
    } catch (error) {
        console.error('获取公司信息失败:', error);
        res.status(500).json({ 
            success: false, 
            error: '获取公司信息失败，请稍后重试' 
        });
    }
});

// 更新公司信息
app.post('/api/update-company', authenticateToken, (req, res) => {
    try {
        const companyData = req.body;
        
        // 验证必填字段
        if (!companyData.name || !companyData.contact?.phone || !companyData.contact?.email) {
            return res.status(400).json({ error: '公司名称、联系电话和邮箱为必填项' });
        }
        
        // 写入文件
        fs.writeFileSync('data/company.json', JSON.stringify(companyData, null, 2), 'utf8');
        
        // 返回成功响应
        res.json({ success: true, message: '公司信息更新成功' });
    } catch (error) {
        console.error('更新公司信息失败:', error);
        res.status(500).json({ error: '更新公司信息失败，请稍后重试' });
    }
});

// 错误处理中间件
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: '文件大小超过限制（最大5MB）' });
        }
    }
    
    console.error('服务器错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
});

// 管理后台路由处理
app.get('/admin', (req, res) => {
    // 检查是否有认证令牌
    const token = req.cookies.auth_token;

    // 🔧 添加调试日志
    console.log('🏠 访问管理后台:', {
        hasCookie: !!token,
        userAgent: req.headers['user-agent'],
        referer: req.headers.referer
    });

    if (!token) {
        console.log('❌ 未找到认证令牌，重定向到登录页');
        // 未登录，重定向到登录页
        res.redirect('/admin/login.html');
        return;
    }

    // 验证令牌
    const config = loadAdminConfig();
    if (!config) {
        console.log('❌ 配置加载失败，重定向到登录页');
        res.redirect('/admin/login.html');
        return;
    }

    try {
        const decoded = jwt.verify(token, config.security.jwt_secret);
        console.log('✅ 令牌验证成功，重定向到管理后台:', decoded.username);
        // 令牌有效，重定向到管理后台
        res.redirect('/admin/index.html');
    } catch (error) {
        console.log('❌ 令牌验证失败，重定向到登录页:', error.message);
        // 令牌无效，清除cookie并重定向到登录页
        res.clearCookie('auth_token');
        res.redirect('/admin/login.html');
    }
});

// 管理后台首页路由
app.get('/admin/', (req, res) => {
    res.redirect('/admin');
});

// 首页路由
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Diamond Website CMS - 钻石网站内容管理系统</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
                line-height: 1.6;
                color: #333;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }

            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                backdrop-filter: blur(10px);
            }

            .header {
                background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                color: white;
                padding: 40px;
                text-align: center;
                position: relative;
            }

            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                opacity: 0.3;
            }

            .header h1 {
                font-size: 3em;
                margin-bottom: 10px;
                position: relative;
                z-index: 1;
            }

            .header .subtitle {
                font-size: 1.2em;
                opacity: 0.9;
                position: relative;
                z-index: 1;
            }

            .content {
                padding: 40px;
            }

            .grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 30px;
                margin-bottom: 30px;
            }

            .card {
                background: white;
                border-radius: 15px;
                padding: 25px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                border: 1px solid rgba(0, 0, 0, 0.05);
            }

            .card:hover {
                transform: translateY(-5px);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
            }

            .card h3 {
                color: #2c3e50;
                margin-bottom: 15px;
                font-size: 1.3em;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .card p {
                color: #666;
                margin-bottom: 10px;
            }

            .status-indicator {
                display: inline-block;
                width: 12px;
                height: 12px;
                background: #27ae60;
                border-radius: 50%;
                margin-right: 8px;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }

            .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 20px;
            }

            .info-item {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 10px;
                border-left: 4px solid #3498db;
            }

            .info-item strong {
                color: #2c3e50;
                display: block;
                margin-bottom: 5px;
            }

            .footer {
                background: #f8f9fa;
                padding: 30px;
                text-align: center;
                color: #666;
                border-top: 1px solid #eee;
            }

            .btn {
                display: inline-block;
                padding: 12px 24px;
                background: linear-gradient(135deg, #3498db, #2980b9);
                color: white;
                text-decoration: none;
                border-radius: 25px;
                transition: all 0.3s ease;
                margin: 10px;
                border: none;
                cursor: pointer;
                font-size: 14px;
            }

            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(52, 152, 219, 0.3);
            }

            @media (max-width: 768px) {
                body { padding: 10px; }
                .header { padding: 20px; }
                .header h1 { font-size: 2em; }
                .content { padding: 20px; }
                .grid { grid-template-columns: 1fr; gap: 20px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💎 Diamond Website CMS</h1>
                <p class="subtitle">钻石网站内容管理系统 - 专业版</p>
            </div>

            <div class="content">
                <div class="grid">
                    <div class="card">
                        <h3><span class="status-indicator"></span>系统状态</h3>
                        <p><strong>✅ 运行状态：</strong>正常运行</p>
                        <p><strong>🚀 服务端口：</strong>${PORT}</p>
                        <p><strong>⚡ 响应时间：</strong>< 50ms</p>
                        <p><strong>🔒 安全状态：</strong>已启用</p>
                    </div>

                    <div class="card">
                        <h3>📊 系统信息</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <strong>部署时间</strong>
                                ${new Date().toLocaleString('zh-CN')}
                            </div>
                            <div class="info-item">
                                <strong>Node.js版本</strong>
                                ${process.version}
                            </div>
                            <div class="info-item">
                                <strong>运行环境</strong>
                                ${process.env.NODE_ENV || 'production'}
                            </div>
                            <div class="info-item">
                                <strong>系统平台</strong>
                                ${process.platform}
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <h3>🎯 功能特性</h3>
                        <p>✨ 响应式设计，完美适配各种设备</p>
                        <p>🔧 模块化架构，易于扩展和维护</p>
                        <p>🛡️ 企业级安全防护机制</p>
                        <p>⚡ 高性能缓存和优化</p>
                        <p>📱 移动端友好的用户界面</p>
                    </div>
                </div>

                <div class="card">
                    <h3>🚀 部署成功</h3>
                    <p>Diamond Website CMS已成功部署到AlmaLinux 10系统，所有服务正常运行。</p>
                    <p>系统采用现代化的技术栈，提供稳定可靠的内容管理服务。</p>
                    <div style="margin-top: 20px;">
                        <a href="/api/health" class="btn">📊 系统健康</a>
                        <a href="/admin" class="btn">🛠️ 管理后台</a>
                        <button class="btn" onclick="location.reload()">🔄 刷新页面</button>
                    </div>
                </div>
            </div>

            <div class="footer">
                <p>© 2024 Diamond Website CMS | 专业的内容管理解决方案</p>
                <p>Powered by Node.js & Express | 部署在 AlmaLinux 10</p>
            </div>
        </div>
    </body>
    </html>
    `);
});

// 服务器状态API
app.get('/api/status', (req, res) => {
    const status = {
        server: {
            status: 'running',
            port: PORT,
            uptime: process.uptime(),
            started_at: global.serverStartTime || new Date().toISOString(),
            environment: process.env.NODE_ENV || 'production'
        },
        system: {
            node_version: process.version,
            platform: process.platform,
            memory: process.memoryUsage(),
            cpu_usage: process.cpuUsage()
        },
        database: {
            status: 'connected',
            data_files: {
                products: require('fs').existsSync('./data/products.json'),
                categories: require('fs').existsSync('./data/categories.json'),
                analytics: require('fs').existsSync('./data/analytics.json'),
                inquiries: require('fs').existsSync('./data/inquiries.json')
            }
        },
        features: {
            compression: true,
            static_cache: true,
            analytics: true,
            admin_panel: true,
            file_upload: true
        },
        timestamp: new Date().toISOString()
    };

    res.json({
        success: true,
        data: status
    });
});

// 健康检查端点（简化版本）
app.get('/api/health', (req, res) => {
    const healthCheck = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: require('./package.json').version,
        environment: process.env.NODE_ENV || 'development'
    };

    res.status(200).json(healthCheck);
});

// 监控指标端点（简单版本）
app.get('/api/metrics', (req, res) => {
    const metrics = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: require('./package.json').version,
        environment: process.env.NODE_ENV || 'development',
        // 可以添加更多自定义指标
        requests_total: global.requestCount || 0,
        errors_total: global.errorCount || 0
    };

    res.status(200).json(metrics);
});

// 404处理
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: '接口不存在' });
    } else {
        res.status(404).send('页面不存在');
    }
});

// 启动服务器
async function main() {
    try {
        global.server = await startServer();
    } catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
}

main();