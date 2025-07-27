/**
 * 🌱 Prisma 种子数据脚本
 * 无锡皇德国际贸易有限公司 - Diamond Website 初始化数据
 * 
 * 用于在空数据库中创建基础数据，包括：
 * 1. 默认管理员账户
 * 2. 基础产品分类
 * 3. 公司信息
 * 4. 系统配置
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

/**
 * 🔐 创建默认管理员账户
 */
async function createDefaultAdmin() {
  console.log('🔐 创建默认管理员账户...');
  
  try {
    // 检查是否已存在管理员
    const existingAdmin = await prisma.admin.findUnique({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      console.log('⏭️ 管理员账户已存在，跳过创建');
      return;
    }

    // 创建默认管理员
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = await prisma.admin.create({
      data: {
        username: 'admin',
        email: 'admin@diamond-auto.com',
        password: hashedPassword,
        name: '系统管理员',
        role: 'super_admin',
        permissions: [
          'products.read',
          'products.write',
          'products.delete',
          'categories.read',
          'categories.write',
          'categories.delete',
          'inquiries.read',
          'inquiries.write',
          'inquiries.delete',
          'analytics.read',
          'system.read',
          'system.write'
        ],
        isActive: true
      }
    });

    console.log(`✅ 默认管理员创建成功: ${admin.username}`);
  } catch (error) {
    console.error('❌ 创建管理员失败:', error.message);
  }
}

/**
 * 📂 创建基础产品分类
 */
async function createDefaultCategories() {
  console.log('📂 创建基础产品分类...');
  
  const categories = [
    {
      name: '涡轮增压器',
      description: '各种型号的涡轮增压器及配件',
      order: 1
    },
    {
      name: '执行器',
      description: '涡轮增压器执行器系列产品',
      order: 2
    },
    {
      name: '共轨喷油器',
      description: '高压共轨喷油器及相关配件',
      order: 3
    },
    {
      name: '涡轮配件',
      description: '涡轮增压器相关配件及维修件',
      order: 4
    },
    {
      name: '其他',
      description: '其他零部件产品',
      order: 5
    }
  ];

  try {
    for (const categoryData of categories) {
      // 检查分类是否已存在
      const existing = await prisma.category.findFirst({
        where: { name: categoryData.name }
      });

      if (!existing) {
        const category = await prisma.category.create({
          data: categoryData
        });
        console.log(`✅ 分类创建成功: ${category.name}`);
      } else {
        console.log(`⏭️ 分类已存在: ${categoryData.name}`);
      }
    }
  } catch (error) {
    console.error('❌ 创建分类失败:', error.message);
  }
}

/**
 * 🏢 创建默认公司信息
 */
async function createDefaultCompany() {
  console.log('🏢 创建默认公司信息...');
  
  try {
    // 检查是否已存在公司信息
    const existingCompany = await prisma.company.findFirst();
    
    if (existingCompany) {
      console.log('⏭️ 公司信息已存在，跳过创建');
      return;
    }

    const company = await prisma.company.create({
      data: {
        name: '无锡皇德国际贸易有限公司',
        shortName: '皇德国际',
        description: '专业的涡轮增压器和共轨喷油器配件供应商',
        established: '2010',
        experience: '15年',
        logo: 'assets/images/logo/diamond-logo.png',
        phone: '+86 133 7622 3199',
        email: 'sales03@diamond-auto.com',
        whatsapp: '+86 136 5615 7230',
        address: '无锡市锡山区东港镇黄土塘村工业园区创业路107号',
        website: 'https://www.diamond-auto.com',
        facebook: 'https://www.facebook.com/ariel.diamond.883219',
        instagram: 'https://www.instagram.com/diamondautopart01/',
        weekdaysHours: '周一至周五 8:00-18:00',
        weekendHours: '周六 9:00-17:00'
      }
    });

    console.log(`✅ 公司信息创建成功: ${company.name}`);
  } catch (error) {
    console.error('❌ 创建公司信息失败:', error.message);
  }
}

/**
 * 🎠 创建默认轮播图
 */
async function createDefaultCarousel() {
  console.log('🎠 创建默认轮播图...');
  
  const slides = [
    {
      title: '专业涡轮增压器配件',
      description: '15年行业经验，为全球客户提供高品质的涡轮增压器配件和解决方案',
      image: 'assets/images/carousel/img1.jpg',
      buttonText: '了解产品',
      buttonLink: '#products',
      alt: '涡轮增压器',
      order: 1
    },
    {
      title: '精密执行器系统',
      description: '精密制造，严格质控，确保每一个部件都符合国际标准',
      image: 'assets/images/carousel/img2.jpg',
      buttonText: '联系我们',
      buttonLink: '#contact',
      alt: '执行器',
      order: 2
    },
    {
      title: '先进柴油喷射技术',
      description: '遍布世界各地的合作伙伴，为您提供快速可靠的供应服务',
      image: 'assets/images/carousel/img3.jpg',
      buttonText: '成为合作伙伴',
      buttonLink: '#contact',
      alt: '柴油喷射系统',
      order: 3
    },
    {
      title: '技术创新引领',
      description: '持续的技术创新和产品研发，为客户创造更大价值',
      image: 'assets/images/carousel/img4.jpg',
      buttonText: '创新产品',
      buttonLink: '#products',
      alt: '涡轮配件',
      order: 4
    }
  ];

  try {
    // 清除现有轮播图
    await prisma.carouselSlide.deleteMany();

    for (const slideData of slides) {
      const slide = await prisma.carouselSlide.create({
        data: slideData
      });
      console.log(`✅ 轮播图创建成功: ${slide.title}`);
    }
  } catch (error) {
    console.error('❌ 创建轮播图失败:', error.message);
  }
}

/**
 * ⚙️ 创建系统配置
 */
async function createSystemConfig() {
  console.log('⚙️ 创建系统配置...');
  
  const configs = [
    {
      key: 'site_title',
      value: '无锡皇德国际贸易有限公司 - 专业涡轮增压器配件供应商',
      type: 'string',
      category: 'seo',
      description: '网站标题',
      isPublic: true
    },
    {
      key: 'site_description',
      value: '专业提供涡轮增压器、共轨喷油器、执行器等汽车配件，15年行业经验，品质保证',
      type: 'string',
      category: 'seo',
      description: '网站描述',
      isPublic: true
    },
    {
      key: 'site_keywords',
      value: '涡轮增压器,共轨喷油器,执行器,汽车配件,Diamond-Auto,无锡皇德',
      type: 'string',
      category: 'seo',
      description: '网站关键词',
      isPublic: true
    },
    {
      key: 'products_per_page',
      value: '20',
      type: 'number',
      category: 'display',
      description: '每页显示产品数量',
      isPublic: true
    },
    {
      key: 'enable_analytics',
      value: 'true',
      type: 'boolean',
      category: 'analytics',
      description: '启用分析功能',
      isPublic: false
    },
    {
      key: 'maintenance_mode',
      value: 'false',
      type: 'boolean',
      category: 'system',
      description: '维护模式',
      isPublic: false
    }
  ];

  try {
    for (const configData of configs) {
      // 检查配置是否已存在
      const existing = await prisma.systemConfig.findUnique({
        where: { key: configData.key }
      });

      if (!existing) {
        const config = await prisma.systemConfig.create({
          data: configData
        });
        console.log(`✅ 系统配置创建成功: ${config.key}`);
      } else {
        console.log(`⏭️ 系统配置已存在: ${configData.key}`);
      }
    }
  } catch (error) {
    console.error('❌ 创建系统配置失败:', error.message);
  }
}

/**
 * 🚀 主种子函数
 */
async function main() {
  console.log('🌱 开始初始化数据库种子数据...');
  
  try {
    await createDefaultAdmin();
    await createDefaultCategories();
    await createDefaultCompany();
    await createDefaultCarousel();
    await createSystemConfig();
    
    console.log('🎉 种子数据初始化完成！');
  } catch (error) {
    console.error('❌ 种子数据初始化失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 执行种子函数
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
