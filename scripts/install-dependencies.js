#!/usr/bin/env node

/**
 * 📦 依赖安装脚本
 * 无锡皇德国际贸易有限公司 - Diamond Website 数据库迁移依赖安装
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('📦 开始安装数据库迁移依赖...\n');

/**
 * 执行命令并显示输出
 */
function runCommand(command, description) {
  console.log(`🔧 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} 完成\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} 失败:`, error.message);
    return false;
  }
}

/**
 * 更新package.json添加数据库依赖
 */
function updatePackageJson() {
  console.log('📝 更新 package.json...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // 添加数据库相关依赖
    const newDependencies = {
      '@prisma/client': '^5.7.1',
      'pg': '^8.11.3',
      'dotenv': '^16.3.1'
    };
    
    const newDevDependencies = {
      'prisma': '^5.7.1',
      '@types/pg': '^8.10.9'
    };
    
    // 合并依赖
    packageJson.dependencies = { ...packageJson.dependencies, ...newDependencies };
    packageJson.devDependencies = { ...packageJson.devDependencies, ...newDevDependencies };
    
    // 添加数据库相关脚本
    const newScripts = {
      'db:generate': 'prisma generate',
      'db:push': 'prisma db push',
      'db:migrate': 'prisma migrate dev',
      'db:migrate:deploy': 'prisma migrate deploy',
      'db:migrate:reset': 'prisma migrate reset',
      'db:studio': 'prisma studio',
      'db:seed': 'node prisma/seed.js',
      'db:backup': 'node scripts/backup-database.js',
      'db:restore': 'node scripts/restore-database.js',
      'migrate:run': 'node scripts/migrate-to-database.js',
      'migrate:test': 'node scripts/test-migration.js'
    };
    
    packageJson.scripts = { ...packageJson.scripts, ...newScripts };
    
    // 备份原始package.json
    fs.writeFileSync('package.json.backup', JSON.stringify(packageJson, null, 2));
    
    // 写入更新的package.json
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    
    console.log('✅ package.json 更新完成');
    return true;
  } catch (error) {
    console.error('❌ 更新 package.json 失败:', error.message);
    return false;
  }
}

/**
 * 创建环境配置文件
 */
function createEnvFile() {
  console.log('⚙️ 创建环境配置文件...');
  
  if (fs.existsSync('.env')) {
    console.log('⏭️ .env 文件已存在，跳过创建');
    return true;
  }
  
  const envContent = `# 🗄️ Diamond Website 数据库配置
# 无锡皇德国际贸易有限公司

# 数据库连接 (请根据实际情况修改)
DATABASE_URL="postgresql://diamond_user:diamond_password@localhost:5432/diamond_website?schema=public"

# 应用配置
NODE_ENV=development
PORT=3001

# JWT密钥 (生产环境请更换)
JWT_SECRET=diamond-website-secret-key-2025

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=diamond_website
DB_USER=diamond_user
DB_PASSWORD=diamond_password
DB_SCHEMA=public

# 连接池配置
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_ACQUIRE_TIMEOUT=30000
DB_POOL_IDLE_TIMEOUT=10000

# 迁移配置
MIGRATION_BACKUP_ENABLED=true
MIGRATION_BACKUP_PATH=./backup/migration
MIGRATION_LOG_LEVEL=info
`;
  
  try {
    fs.writeFileSync('.env', envContent);
    console.log('✅ .env 文件创建完成');
    console.log('⚠️ 请根据实际情况修改数据库连接信息');
    return true;
  } catch (error) {
    console.error('❌ 创建 .env 文件失败:', error.message);
    return false;
  }
}

/**
 * 创建必要目录
 */
function createDirectories() {
  console.log('📁 创建必要目录...');
  
  const directories = [
    'backup',
    'backup/migration',
    'prisma',
    'src/services',
    'src/routes'
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ 创建目录: ${dir}`);
    } else {
      console.log(`⏭️ 目录已存在: ${dir}`);
    }
  });
  
  return true;
}

/**
 * 主安装流程
 */
async function main() {
  console.log('🚀 Diamond Website 数据库迁移依赖安装');
  console.log('🏢 无锡皇德国际贸易有限公司\n');
  
  let success = true;
  
  // 1. 更新package.json
  if (!updatePackageJson()) {
    success = false;
  }
  
  // 2. 创建目录
  if (!createDirectories()) {
    success = false;
  }
  
  // 3. 创建环境配置
  if (!createEnvFile()) {
    success = false;
  }
  
  // 4. 安装npm依赖
  if (!runCommand('npm install', '安装npm依赖')) {
    success = false;
  }
  
  if (success) {
    console.log('🎉 依赖安装完成！\n');
    console.log('📋 下一步操作:');
    console.log('1. 配置PostgreSQL数据库');
    console.log('2. 修改 .env 文件中的数据库连接信息');
    console.log('3. 运行: npm run db:generate');
    console.log('4. 运行: npm run db:push');
    console.log('5. 运行: npm run migrate:run');
    console.log('\n或者使用一键部署脚本:');
    console.log('   chmod +x scripts/setup-database.sh');
    console.log('   ./scripts/setup-database.sh');
  } else {
    console.log('❌ 依赖安装过程中出现错误，请检查并重试');
    process.exit(1);
  }
}

main();
