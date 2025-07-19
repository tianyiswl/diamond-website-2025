// 🚀 SQLite数据库迁移方案
// 从JSON文件存储迁移到SQLite数据库

const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

/**
 * 🔄 数据库迁移管理器
 */
class DatabaseMigrator {
  constructor(dbPath = "./data/products.db") {
    this.dbPath = dbPath;
    this.db = null;
  }

  /**
   * 初始化数据库连接
   */
  async initDatabase() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error("数据库连接失败:", err);
          reject(err);
        } else {
          console.log("✅ SQLite数据库连接成功");
          resolve();
        }
      });
    });
  }

  /**
   * 创建数据库表结构
   */
  async createTables() {
    const createProductsTable = `
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        sku TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        model TEXT,
        category TEXT DEFAULT 'others',
        brand TEXT DEFAULT 'Diamond-Auto',
        description TEXT,
        image TEXT,
        images TEXT, -- JSON数组字符串
        price REAL DEFAULT 0,
        status TEXT DEFAULT 'active',
        stock INTEGER DEFAULT 0,
        oe_number TEXT,
        compatibility TEXT,
        warranty TEXT DEFAULT '12',
        notes TEXT,
        meta_description TEXT,
        meta_keywords TEXT,
        badges TEXT,
        features TEXT,
        is_new BOOLEAN DEFAULT 0,
        is_hot BOOLEAN DEFAULT 0,
        is_recommend BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createCategoriesTable = `
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        name_en TEXT,
        description TEXT,
        icon TEXT,
        sort_order INTEGER DEFAULT 0,
        count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createInquiriesTable = `
      CREATE TABLE IF NOT EXISTS inquiries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        quantity TEXT,
        message TEXT NOT NULL,
        product_info TEXT, -- JSON字符串
        source TEXT DEFAULT 'unknown',
        source_details TEXT,
        status TEXT DEFAULT 'pending',
        ip TEXT,
        logs TEXT, -- JSON数组字符串
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(createProductsTable, (err) => {
          if (err) reject(err);
        });

        this.db.run(createCategoriesTable, (err) => {
          if (err) reject(err);
        });

        this.db.run(createInquiriesTable, (err) => {
          if (err) reject(err);
          else {
            console.log("✅ 数据库表创建成功");
            resolve();
          }
        });
      });
    });
  }

  /**
   * 创建索引
   */
  async createIndexes() {
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)",
      "CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)",
      "CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)",
      "CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand)",
      "CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)",
      "CREATE INDEX IF NOT EXISTS idx_products_oe_number ON products(oe_number)",
      "CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at)",
      "CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status)",
      "CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at)",
      "CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status)",
    ];

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        indexes.forEach((indexSql, i) => {
          this.db.run(indexSql, (err) => {
            if (err) {
              console.error(`创建索引失败 ${i + 1}:`, err);
              reject(err);
            } else if (i === indexes.length - 1) {
              console.log("✅ 数据库索引创建成功");
              resolve();
            }
          });
        });
      });
    });
  }

  /**
   * 迁移产品数据
   */
  async migrateProducts() {
    try {
      // 读取JSON数据
      const productsData = JSON.parse(
        fs.readFileSync("./data/products.json", "utf8"),
      );
      console.log(`📦 准备迁移 ${productsData.length} 个产品`);

      const insertSql = `
        INSERT OR REPLACE INTO products (
          id, sku, name, model, category, brand, description, image, images,
          price, status, stock, oe_number, compatibility, warranty, notes,
          meta_description, meta_keywords, badges, features,
          is_new, is_hot, is_recommend, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      return new Promise((resolve, reject) => {
        this.db.serialize(() => {
          const stmt = this.db.prepare(insertSql);

          let completed = 0;
          productsData.forEach((product) => {
            stmt.run(
              [
                product.id,
                product.sku,
                product.name,
                product.model || "",
                product.category || "others",
                product.brand || "Diamond-Auto",
                product.description || "",
                product.image || "",
                JSON.stringify(product.images || []),
                parseFloat(product.price) || 0,
                product.status || "active",
                parseInt(product.stock) || 0,
                product.oe_number || "",
                product.compatibility || "",
                product.warranty || "12",
                product.notes || "",
                product.meta_description || "",
                product.meta_keywords || "",
                product.badges || "",
                product.features || "",
                product.isNew ? 1 : 0,
                product.isHot ? 1 : 0,
                product.isRecommend ? 1 : 0,
                product.createdAt || new Date().toISOString(),
                product.updatedAt || new Date().toISOString(),
              ],
              function (err) {
                if (err) {
                  console.error("插入产品数据失败:", err);
                  reject(err);
                } else {
                  completed++;
                  if (completed === productsData.length) {
                    stmt.finalize();
                    console.log(`✅ 成功迁移 ${completed} 个产品`);
                    resolve();
                  }
                }
              },
            );
          });
        });
      });
    } catch (error) {
      console.error("读取产品数据失败:", error);
      throw error;
    }
  }

  /**
   * 迁移分类数据
   */
  async migrateCategories() {
    try {
      const categoriesData = JSON.parse(
        fs.readFileSync("./data/categories.json", "utf8"),
      );
      console.log(`📂 准备迁移 ${categoriesData.length} 个分类`);

      const insertSql = `
        INSERT OR REPLACE INTO categories (
          id, name, name_en, description, icon, sort_order, count, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      return new Promise((resolve, reject) => {
        this.db.serialize(() => {
          const stmt = this.db.prepare(insertSql);

          let completed = 0;
          categoriesData.forEach((category) => {
            stmt.run(
              [
                category.id,
                category.name,
                category.name_en || "",
                category.description || "",
                category.icon || "",
                category.sortOrder || 0,
                category.count || 0,
                category.status || "active",
                category.createdAt || new Date().toISOString(),
              ],
              function (err) {
                if (err) {
                  console.error("插入分类数据失败:", err);
                  reject(err);
                } else {
                  completed++;
                  if (completed === categoriesData.length) {
                    stmt.finalize();
                    console.log(`✅ 成功迁移 ${completed} 个分类`);
                    resolve();
                  }
                }
              },
            );
          });
        });
      });
    } catch (error) {
      console.error("读取分类数据失败:", error);
      throw error;
    }
  }

  /**
   * 迁移询价数据
   */
  async migrateInquiries() {
    try {
      const inquiriesData = JSON.parse(
        fs.readFileSync("./data/inquiries.json", "utf8"),
      );
      console.log(`📝 准备迁移 ${inquiriesData.length} 个询价记录`);

      const insertSql = `
        INSERT OR REPLACE INTO inquiries (
          id, name, email, phone, quantity, message, product_info,
          source, source_details, status, ip, logs, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      return new Promise((resolve, reject) => {
        this.db.serialize(() => {
          const stmt = this.db.prepare(insertSql);

          let completed = 0;
          inquiriesData.forEach((inquiry) => {
            stmt.run(
              [
                inquiry.id,
                inquiry.name,
                inquiry.email,
                inquiry.phone || "",
                inquiry.quantity || "",
                inquiry.message,
                JSON.stringify(inquiry.productInfo || null),
                inquiry.source || "unknown",
                inquiry.sourceDetails || "",
                inquiry.status || "pending",
                inquiry.ip || "",
                JSON.stringify(inquiry.logs || []),
                inquiry.createdAt || new Date().toISOString(),
                inquiry.updatedAt || new Date().toISOString(),
              ],
              function (err) {
                if (err) {
                  console.error("插入询价数据失败:", err);
                  reject(err);
                } else {
                  completed++;
                  if (completed === inquiriesData.length) {
                    stmt.finalize();
                    console.log(`✅ 成功迁移 ${completed} 个询价记录`);
                    resolve();
                  }
                }
              },
            );
          });
        });
      });
    } catch (error) {
      console.error("读取询价数据失败:", error);
      throw error;
    }
  }

  /**
   * 验证迁移结果
   */
  async validateMigration() {
    return new Promise((resolve, reject) => {
      const queries = [
        "SELECT COUNT(*) as count FROM products",
        "SELECT COUNT(*) as count FROM categories",
        "SELECT COUNT(*) as count FROM inquiries",
      ];

      const results = {};
      let completed = 0;

      queries.forEach((query, index) => {
        this.db.get(query, (err, row) => {
          if (err) {
            reject(err);
          } else {
            const tableName = ["products", "categories", "inquiries"][index];
            results[tableName] = row.count;
            completed++;

            if (completed === queries.length) {
              console.log("📊 迁移验证结果:");
              console.log(`   产品数量: ${results.products}`);
              console.log(`   分类数量: ${results.categories}`);
              console.log(`   询价数量: ${results.inquiries}`);
              resolve(results);
            }
          }
        });
      });
    });
  }

  /**
   * 执行完整迁移
   */
  async migrate() {
    try {
      console.log("🚀 开始数据库迁移...");

      await this.initDatabase();
      await this.createTables();
      await this.createIndexes();
      await this.migrateProducts();
      await this.migrateCategories();
      await this.migrateInquiries();
      await this.validateMigration();

      console.log("🎉 数据库迁移完成！");

      // 备份原始JSON文件
      this.backupJsonFiles();
    } catch (error) {
      console.error("❌ 迁移失败:", error);
      throw error;
    }
  }

  /**
   * 备份原始JSON文件
   */
  backupJsonFiles() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = `./data/json-backup-${timestamp}`;

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const filesToBackup = [
      "products.json",
      "categories.json",
      "inquiries.json",
      "admin-config.json",
      "company.json",
    ];

    filesToBackup.forEach((file) => {
      const sourcePath = `./data/${file}`;
      const backupPath = `${backupDir}/${file}`;

      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, backupPath);
        console.log(`📦 已备份: ${file}`);
      }
    });

    console.log(`✅ JSON文件已备份到: ${backupDir}`);
  }

  /**
   * 关闭数据库连接
   */
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error("关闭数据库失败:", err);
        } else {
          console.log("✅ 数据库连接已关闭");
        }
      });
    }
  }
}

/**
 * 🔧 SQLite数据访问层
 */
class SQLiteProductService {
  constructor(dbPath = "./data/products.db") {
    this.dbPath = dbPath;
    this.db = new sqlite3.Database(dbPath);
  }

  /**
   * 获取产品列表（支持分页和搜索）
   */
  async getProducts(options = {}) {
    const {
      page = 1,
      limit = 20,
      search = "",
      category = "",
      status = "active",
      sortBy = "created_at",
      sortOrder = "DESC",
    } = options;

    const offset = (page - 1) * limit;
    let whereClause = "WHERE status = ?";
    let params = [status];

    // 搜索条件
    if (search) {
      whereClause += ` AND (
        name LIKE ? OR 
        sku LIKE ? OR 
        oe_number LIKE ? OR 
        description LIKE ?
      )`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    // 分类过滤
    if (category && category !== "all") {
      whereClause += " AND category = ?";
      params.push(category);
    }

    const countSql = `SELECT COUNT(*) as total FROM products ${whereClause}`;
    const dataSql = `
      SELECT * FROM products 
      ${whereClause} 
      ORDER BY ${sortBy} ${sortOrder} 
      LIMIT ? OFFSET ?
    `;

    return new Promise((resolve, reject) => {
      // 先获取总数
      this.db.get(countSql, params, (err, countRow) => {
        if (err) {
          reject(err);
          return;
        }

        // 再获取数据
        this.db.all(dataSql, [...params, limit, offset], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            // 解析JSON字段
            const products = rows.map((row) => ({
              ...row,
              images: JSON.parse(row.images || "[]"),
              is_new: Boolean(row.is_new),
              is_hot: Boolean(row.is_hot),
              is_recommend: Boolean(row.is_recommend),
            }));

            resolve({
              data: products,
              pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: Math.ceil(countRow.total / limit),
                totalItems: countRow.total,
              },
            });
          }
        });
      });
    });
  }

  /**
   * 获取单个产品
   */
  async getProductById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        "SELECT * FROM products WHERE id = ? AND status = ?",
        [id, "active"],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (row) {
            // 解析JSON字段
            const product = {
              ...row,
              images: JSON.parse(row.images || "[]"),
              is_new: Boolean(row.is_new),
              is_hot: Boolean(row.is_hot),
              is_recommend: Boolean(row.is_recommend),
            };
            resolve(product);
          } else {
            resolve(null);
          }
        },
      );
    });
  }

  /**
   * 关闭数据库连接
   */
  close() {
    this.db.close();
  }
}

// 导出模块
module.exports = {
  DatabaseMigrator,
  SQLiteProductService,
};

// 如果直接运行此文件，执行迁移
if (require.main === module) {
  const migrator = new DatabaseMigrator();

  migrator
    .migrate()
    .then(() => {
      console.log("🎉 迁移成功完成！");
      migrator.close();
    })
    .catch((error) => {
      console.error("❌ 迁移失败:", error);
      migrator.close();
      process.exit(1);
    });
}
