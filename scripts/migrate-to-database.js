#!/usr/bin/env node

/**
 * 🚀 Diamond Website 数据库迁移脚本
 * 无锡皇德国际贸易有限公司 - 从JSON文件迁移到PostgreSQL数据库
 * 
 * 功能：
 * 1. 读取现有JSON数据文件
 * 2. 验证数据完整性
 * 3. 转换数据格式
 * 4. 导入到PostgreSQL数据库
 * 5. 验证迁移结果
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.database' });

// 初始化Prisma客户端
const prisma = new PrismaClient();

/**
 * 🔧 数据迁移管理器
 */
class DatabaseMigrator {
  constructor() {
    this.dataPath = './data';
    this.backupPath = './backup/migration';
    this.migrationLog = [];
    this.errors = [];
  }

  /**
   * 📝 记录迁移日志
   */
  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, type, message };
    this.migrationLog.push(logEntry);
    
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  /**
   * 📂 创建备份目录
   */
  async createBackupDirectory() {
    try {
      if (!fs.existsSync(this.backupPath)) {
        fs.mkdirSync(this.backupPath, { recursive: true });
      }
      this.log('备份目录创建成功');
    } catch (error) {
      this.log(`创建备份目录失败: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 📖 读取JSON数据文件
   */
  readJsonFile(fileName) {
    try {
      const filePath = path.join(this.dataPath, fileName);
      if (!fs.existsSync(filePath)) {
        this.log(`文件不存在: ${fileName}`, 'warning');
        return null;
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      this.log(`成功读取文件: ${fileName}`);
      return data;
    } catch (error) {
      this.log(`读取文件失败 ${fileName}: ${error.message}`, 'error');
      this.errors.push(`读取文件失败: ${fileName}`);
      return null;
    }
  }

  /**
   * 💾 备份原始数据
   */
  async backupOriginalData() {
    this.log('开始备份原始数据...');
    
    const files = ['products.json', 'categories.json', 'company.json', 'carousel.json', 'inquiries.json'];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    for (const file of files) {
      try {
        const sourcePath = path.join(this.dataPath, file);
        if (fs.existsSync(sourcePath)) {
          const backupFileName = `${file}.backup-${timestamp}`;
          const backupFilePath = path.join(this.backupPath, backupFileName);
          fs.copyFileSync(sourcePath, backupFilePath);
          this.log(`备份文件: ${file} -> ${backupFileName}`);
        }
      } catch (error) {
        this.log(`备份文件失败 ${file}: ${error.message}`, 'error');
      }
    }
  }

  /**
   * 🏢 迁移公司信息
   */
  async migrateCompanyData() {
    this.log('开始迁移公司信息...');
    
    const companyData = this.readJsonFile('company.json');
    if (!companyData) return;

    try {
      // 清除现有公司信息
      await prisma.company.deleteMany();

      // 插入新的公司信息
      const company = await prisma.company.create({
        data: {
          name: companyData.name || '无锡皇德国际贸易有限公司',
          shortName: companyData.shortName || '皇德国际',
          description: companyData.description || '专业的涡轮增压器和共轨喷油器配件供应商',
          established: companyData.established || '2010',
          experience: companyData.experience || '15年',
          logo: companyData.logo || 'assets/images/logo/diamond-logo.png',
          phone: companyData.contact?.phone || '+86 133 7622 3199',
          email: companyData.contact?.email || 'sales03@diamond-auto.com',
          whatsapp: companyData.contact?.whatsapp || '+86 136 5615 7230',
          address: companyData.contact?.address || '无锡市锡山区东港镇黄土塘村工业园区创业路107号',
          website: companyData.contact?.website || 'https://www.diamond-auto.com',
          facebook: companyData.social?.facebook,
          instagram: companyData.social?.instagram,
          weekdaysHours: companyData.businessHours?.weekdays || '周一至周五 8:00-18:00',
          weekendHours: companyData.businessHours?.weekend || '周六 9:00-17:00'
        }
      });

      this.log(`公司信息迁移成功: ${company.name}`);
    } catch (error) {
      this.log(`公司信息迁移失败: ${error.message}`, 'error');
      this.errors.push('公司信息迁移失败');
    }
  }

  /**
   * 🎠 迁移轮播图数据
   */
  async migrateCarouselData() {
    this.log('开始迁移轮播图数据...');
    
    const carouselData = this.readJsonFile('carousel.json');
    if (!carouselData || !carouselData.slides) return;

    try {
      // 清除现有轮播图
      await prisma.carouselSlide.deleteMany();

      // 插入轮播图数据
      for (const slide of carouselData.slides) {
        await prisma.carouselSlide.create({
          data: {
            title: slide.title,
            description: slide.description,
            image: slide.image,
            buttonText: slide.buttonText,
            buttonLink: slide.buttonLink,
            alt: slide.alt,
            order: slide.id || 0,
            status: 'active'
          }
        });
      }

      this.log(`轮播图迁移成功: ${carouselData.slides.length} 张图片`);
    } catch (error) {
      this.log(`轮播图迁移失败: ${error.message}`, 'error');
      this.errors.push('轮播图迁移失败');
    }
  }

  /**
   * 📂 迁移分类数据
   */
  async migrateCategoryData() {
    this.log('开始迁移分类数据...');
    
    const categoriesData = this.readJsonFile('categories.json');
    if (!categoriesData || !Array.isArray(categoriesData)) return;

    try {
      // 清除现有分类
      await prisma.category.deleteMany();

      // 插入分类数据
      const categoryMap = new Map(); // 用于存储旧ID到新ID的映射
      
      for (const category of categoriesData) {
        const newCategory = await prisma.category.create({
          data: {
            name: category.name,
            description: category.description || '',
            order: category.order || 0,
            status: category.status || 'active'
          }
        });
        
        // 保存ID映射关系
        categoryMap.set(category.id, newCategory.id);
        this.log(`分类迁移: ${category.name} (${category.id} -> ${newCategory.id})`);
      }

      this.log(`分类迁移成功: ${categoriesData.length} 个分类`);
      return categoryMap;
    } catch (error) {
      this.log(`分类迁移失败: ${error.message}`, 'error');
      this.errors.push('分类迁移失败');
      return new Map();
    }
  }

  /**
   * 📦 迁移产品数据
   */
  async migrateProductData(categoryMap) {
    this.log('开始迁移产品数据...');
    
    const productsData = this.readJsonFile('products.json');
    if (!productsData || !Array.isArray(productsData)) return;

    try {
      // 清除现有产品和图片
      await prisma.productImage.deleteMany();
      await prisma.product.deleteMany();

      const productMap = new Map(); // 用于存储旧ID到新ID的映射

      for (const product of productsData) {
        // 获取对应的分类ID
        const categoryId = categoryMap.get(product.category);
        if (!categoryId) {
          this.log(`产品 ${product.name} 的分类 ${product.category} 不存在，跳过`, 'warning');
          continue;
        }

        // 创建产品
        const newProduct = await prisma.product.create({
          data: {
            sku: product.sku || `HD-${Date.now()}`,
            name: product.name,
            model: product.model || '',
            brand: product.brand || 'Diamond-Auto',
            description: product.description || '',
            price: parseFloat(product.price) || 0,
            stock: parseInt(product.stock) || 0,
            status: product.status || 'active',
            oeNumber: product.oe_number || '',
            compatibility: product.compatibility || '',
            warranty: parseInt(product.warranty) || 12,
            notes: product.notes || '',
            metaDescription: product.meta_description || '',
            metaKeywords: product.meta_keywords || '',
            features: product.features || '',
            badges: product.badges || '',
            isNew: product.isNew === 'true' || product.isNew === true,
            isHot: product.isHot === 'true' || product.isHot === true,
            isRecommend: product.isRecommend === 'true' || product.isRecommend === true,
            categoryId: categoryId
          }
        });

        // 保存ID映射关系
        productMap.set(product.id, newProduct.id);

        // 处理产品图片
        const images = product.images || [product.image].filter(Boolean);
        for (let i = 0; i < images.length; i++) {
          const imageUrl = images[i];
          if (imageUrl) {
            await prisma.productImage.create({
              data: {
                url: imageUrl,
                alt: `${product.name} - 图片 ${i + 1}`,
                order: i,
                isPrimary: i === 0, // 第一张图片设为主图
                productId: newProduct.id
              }
            });
          }
        }

        this.log(`产品迁移: ${product.name} (${product.id} -> ${newProduct.id})`);
      }

      this.log(`产品迁移成功: ${productsData.length} 个产品`);
      return productMap;
    } catch (error) {
      this.log(`产品迁移失败: ${error.message}`, 'error');
      this.errors.push('产品迁移失败');
      return new Map();
    }
  }

  /**
   * 📞 迁移询价数据
   */
  async migrateInquiryData(productMap) {
    this.log('开始迁移询价数据...');
    
    const inquiriesData = this.readJsonFile('inquiries.json');
    if (!inquiriesData || !Array.isArray(inquiriesData)) return;

    try {
      // 清除现有询价
      await prisma.inquiry.deleteMany();

      for (const inquiry of inquiriesData) {
        // 查找对应的产品ID
        const productId = inquiry.productId ? productMap.get(inquiry.productId) : null;

        await prisma.inquiry.create({
          data: {
            customerName: inquiry.customerName || inquiry.name || '未知客户',
            email: inquiry.email || '',
            phone: inquiry.phone || '',
            company: inquiry.company || '',
            country: inquiry.country || '',
            message: inquiry.message || inquiry.inquiry || '',
            quantity: inquiry.quantity ? parseInt(inquiry.quantity) : null,
            status: inquiry.status || 'pending',
            priority: inquiry.priority || 'normal',
            source: inquiry.source || 'website',
            productId: productId,
            createdAt: inquiry.createdAt ? new Date(inquiry.createdAt) : new Date(),
            updatedAt: inquiry.updatedAt ? new Date(inquiry.updatedAt) : new Date()
          }
        });
      }

      this.log(`询价迁移成功: ${inquiriesData.length} 条询价`);
    } catch (error) {
      this.log(`询价迁移失败: ${error.message}`, 'error');
      this.errors.push('询价迁移失败');
    }
  }

  /**
   * ✅ 验证迁移结果
   */
  async validateMigration() {
    this.log('开始验证迁移结果...');
    
    try {
      const counts = {
        companies: await prisma.company.count(),
        categories: await prisma.category.count(),
        products: await prisma.product.count(),
        productImages: await prisma.productImage.count(),
        carouselSlides: await prisma.carouselSlide.count(),
        inquiries: await prisma.inquiry.count()
      };

      this.log('迁移结果统计:');
      Object.entries(counts).forEach(([table, count]) => {
        this.log(`  ${table}: ${count} 条记录`);
      });

      // 验证数据完整性
      const productsWithoutCategory = await prisma.product.count({
        where: {
          OR: [
            { categoryId: null },
            { categoryId: "" }
          ]
        }
      });
      
      if (productsWithoutCategory > 0) {
        this.log(`发现 ${productsWithoutCategory} 个产品没有分类`, 'warning');
      }

      const productsWithoutImages = await prisma.product.count({
        where: { images: { none: {} } }
      });
      
      if (productsWithoutImages > 0) {
        this.log(`发现 ${productsWithoutImages} 个产品没有图片`, 'warning');
      }

      this.log('迁移验证完成');
      return counts;
    } catch (error) {
      this.log(`迁移验证失败: ${error.message}`, 'error');
      this.errors.push('迁移验证失败');
      return null;
    }
  }

  /**
   * 📊 生成迁移报告
   */
  async generateMigrationReport(counts) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(this.backupPath, `migration-report-${timestamp}.json`);
    
    const report = {
      timestamp: new Date().toISOString(),
      success: this.errors.length === 0,
      errors: this.errors,
      counts: counts,
      log: this.migrationLog
    };

    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      this.log(`迁移报告已生成: ${reportPath}`);
    } catch (error) {
      this.log(`生成迁移报告失败: ${error.message}`, 'error');
    }

    return report;
  }

  /**
   * 🚀 执行完整迁移流程
   */
  async migrate() {
    try {
      this.log('🚀 开始数据库迁移流程...');
      
      // 1. 创建备份目录
      await this.createBackupDirectory();
      
      // 2. 备份原始数据
      await this.backupOriginalData();
      
      // 3. 连接数据库
      await prisma.$connect();
      this.log('数据库连接成功');
      
      // 4. 迁移数据
      await this.migrateCompanyData();
      await this.migrateCarouselData();
      const categoryMap = await this.migrateCategoryData();
      const productMap = await this.migrateProductData(categoryMap);
      await this.migrateInquiryData(productMap);
      
      // 5. 验证迁移结果
      const counts = await this.validateMigration();
      
      // 6. 生成迁移报告
      const report = await this.generateMigrationReport(counts);
      
      if (this.errors.length === 0) {
        this.log('🎉 数据库迁移完成！所有数据已成功迁移到PostgreSQL数据库');
      } else {
        this.log(`⚠️ 数据库迁移完成，但有 ${this.errors.length} 个错误`, 'warning');
      }
      
      return report;
      
    } catch (error) {
      this.log(`迁移流程失败: ${error.message}`, 'error');
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

// 主执行函数
async function main() {
  const migrator = new DatabaseMigrator();
  
  try {
    const report = await migrator.migrate();
    
    if (report.success) {
      console.log('\n✅ 迁移成功完成！');
      process.exit(0);
    } else {
      console.log('\n⚠️ 迁移完成但有错误，请检查日志');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { DatabaseMigrator };
