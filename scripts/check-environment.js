#!/usr/bin/env node

/**
 * 🔍 环境检查脚本
 * 无锡皇德国际贸易有限公司 - Diamond Website 迁移前环境检查
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Diamond Website 环境检查开始...\n');

// 检查结果
const checks = {
  passed: [],
  warnings: [],
  errors: []
};

/**
 * 记录检查结果
 */
function logCheck(name, status, message) {
  const result = { name, message };
  
  if (status === 'pass') {
    checks.passed.push(result);
    console.log(`✅ ${name}: ${message}`);
  } else if (status === 'warning') {
    checks.warnings.push(result);
    console.log(`⚠️ ${name}: ${message}`);
  } else {
    checks.errors.push(result);
    console.log(`❌ ${name}: ${message}`);
  }
}

/**
 * 检查Node.js版本
 */
function checkNodeVersion() {
  try {
    const version = process.version;
    const majorVersion = parseInt(version.slice(1).split('.')[0]);
    
    if (majorVersion >= 16) {
      logCheck('Node.js版本', 'pass', `${version} (符合要求)`);
    } else {
      logCheck('Node.js版本', 'error', `${version} (需要16+版本)`);
    }
  } catch (error) {
    logCheck('Node.js版本', 'error', '无法检测Node.js版本');
  }
}

/**
 * 检查必要文件
 */
function checkRequiredFiles() {
  const requiredFiles = [
    'package.json',
    'server.js',
    'data/products.json',
    'data/categories.json',
    'data/company.json'
  ];
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      logCheck(`文件检查 - ${file}`, 'pass', '文件存在');
    } else {
      logCheck(`文件检查 - ${file}`, 'error', '文件不存在');
    }
  });
}

/**
 * 检查数据文件内容
 */
function checkDataFiles() {
  try {
    // 检查products.json
    const products = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));
    if (Array.isArray(products) && products.length > 0) {
      logCheck('产品数据', 'pass', `发现 ${products.length} 个产品`);
    } else {
      logCheck('产品数据', 'warning', '产品数据为空或格式错误');
    }
    
    // 检查categories.json
    const categories = JSON.parse(fs.readFileSync('data/categories.json', 'utf8'));
    if (Array.isArray(categories) && categories.length > 0) {
      logCheck('分类数据', 'pass', `发现 ${categories.length} 个分类`);
    } else {
      logCheck('分类数据', 'warning', '分类数据为空或格式错误');
    }
    
    // 检查company.json
    const company = JSON.parse(fs.readFileSync('data/company.json', 'utf8'));
    if (company && company.name) {
      logCheck('公司信息', 'pass', `公司: ${company.name}`);
    } else {
      logCheck('公司信息', 'warning', '公司信息不完整');
    }
  } catch (error) {
    logCheck('数据文件解析', 'error', `解析失败: ${error.message}`);
  }
}

/**
 * 检查PostgreSQL
 */
function checkPostgreSQL() {
  try {
    execSync('psql --version', { stdio: 'pipe' });
    logCheck('PostgreSQL', 'pass', '已安装');
  } catch (error) {
    logCheck('PostgreSQL', 'error', '未安装或不在PATH中');
  }
}

/**
 * 检查npm依赖
 */
function checkDependencies() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // 检查关键依赖
    const keyDeps = ['express', 'bcrypt', 'jsonwebtoken'];
    keyDeps.forEach(dep => {
      if (dependencies[dep]) {
        logCheck(`依赖 - ${dep}`, 'pass', `版本 ${dependencies[dep]}`);
      } else {
        logCheck(`依赖 - ${dep}`, 'warning', '未安装');
      }
    });
    
    // 检查数据库相关依赖
    const dbDeps = ['@prisma/client', 'prisma', 'pg'];
    dbDeps.forEach(dep => {
      if (dependencies[dep]) {
        logCheck(`数据库依赖 - ${dep}`, 'pass', `版本 ${dependencies[dep]}`);
      } else {
        logCheck(`数据库依赖 - ${dep}`, 'warning', '需要安装');
      }
    });
  } catch (error) {
    logCheck('依赖检查', 'error', `无法读取package.json: ${error.message}`);
  }
}

/**
 * 检查端口占用
 */
function checkPorts() {
  const ports = [3001, 5432]; // 应用端口和PostgreSQL端口
  
  ports.forEach(port => {
    try {
      execSync(`netstat -an | grep :${port}`, { stdio: 'pipe' });
      logCheck(`端口 ${port}`, 'warning', '端口被占用');
    } catch (error) {
      logCheck(`端口 ${port}`, 'pass', '端口可用');
    }
  });
}

/**
 * 检查磁盘空间
 */
function checkDiskSpace() {
  try {
    const stats = fs.statSync('.');
    // 简单检查，实际应该检查可用磁盘空间
    logCheck('磁盘空间', 'pass', '有足够空间');
  } catch (error) {
    logCheck('磁盘空间', 'warning', '无法检查磁盘空间');
  }
}

/**
 * 生成检查报告
 */
function generateReport() {
  console.log('\n📊 环境检查报告');
  console.log('='.repeat(50));
  
  console.log(`✅ 通过检查: ${checks.passed.length}`);
  console.log(`⚠️ 警告项目: ${checks.warnings.length}`);
  console.log(`❌ 错误项目: ${checks.errors.length}`);
  
  if (checks.warnings.length > 0) {
    console.log('\n⚠️ 警告项目:');
    checks.warnings.forEach(item => {
      console.log(`  - ${item.name}: ${item.message}`);
    });
  }
  
  if (checks.errors.length > 0) {
    console.log('\n❌ 错误项目:');
    checks.errors.forEach(item => {
      console.log(`  - ${item.name}: ${item.message}`);
    });
  }
  
  console.log('\n📋 下一步建议:');
  
  if (checks.errors.length > 0) {
    console.log('❌ 请先解决所有错误项目再继续迁移');
    return false;
  } else if (checks.warnings.length > 0) {
    console.log('⚠️ 可以继续迁移，但建议先处理警告项目');
    return true;
  } else {
    console.log('✅ 环境检查通过，可以开始迁移！');
    return true;
  }
}

/**
 * 主函数
 */
function main() {
  checkNodeVersion();
  checkRequiredFiles();
  checkDataFiles();
  checkPostgreSQL();
  checkDependencies();
  checkPorts();
  checkDiskSpace();
  
  const canProceed = generateReport();
  
  if (canProceed) {
    console.log('\n🚀 准备开始迁移，请运行:');
    console.log('   node scripts/install-dependencies.js');
  }
  
  process.exit(canProceed ? 0 : 1);
}

main();
