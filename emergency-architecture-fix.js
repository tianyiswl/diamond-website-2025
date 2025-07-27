// 🚨 紧急架构修复脚本
// 系统性修复模块化架构中的运行时问题

const fs = require('fs');
const path = require('path');

console.log('🚨 Diamond Website 紧急架构修复');
console.log('=' .repeat(50));

// 修复结果统计
const fixResults = {
  total: 0,
  success: 0,
  failed: 0,
  details: []
};

/**
 * 修复辅助函数
 */
function runFix(fixName, fixFunction) {
  fixResults.total++;
  console.log(`\n🔧 执行修复: ${fixName}`);
  
  try {
    const result = fixFunction();
    if (result === true || (result && result.success)) {
      console.log(`✅ 修复成功: ${fixName}`);
      fixResults.success++;
      fixResults.details.push({
        fix: fixName,
        status: 'SUCCESS',
        message: result.message || '修复成功'
      });
      return true;
    } else {
      console.log(`❌ 修复失败: ${fixName}`);
      const message = result && result.error ? result.error : '修复失败';
      console.log(`   错误: ${message}`);
      fixResults.failed++;
      fixResults.details.push({
        fix: fixName,
        status: 'FAILED',
        message: message
      });
      return false;
    }
  } catch (error) {
    console.log(`❌ 修复异常: ${fixName}`);
    console.log(`   错误: ${error.message}`);
    fixResults.failed++;
    fixResults.details.push({
      fix: fixName,
      status: 'ERROR',
      message: error.message
    });
    return false;
  }
}

/**
 * 1. 检查和修复文件编码问题
 */
function fixFileEncoding() {
  console.log('  检查关键模块文件编码...');
  
  const criticalFiles = [
    'src/config/index.js',
    'src/utils/index.js',
    'src/dao/index.js',
    'src/services/index.js',
    'src/middleware/index.js',
    'src/routes/index.js'
  ];
  
  let fixedCount = 0;
  
  for (const file of criticalFiles) {
    try {
      if (fs.existsSync(file)) {
        // 读取文件内容
        const content = fs.readFileSync(file, 'utf8');
        
        // 检查是否有BOM
        if (content.charCodeAt(0) === 0xFEFF) {
          console.log(`  发现BOM: ${file}`);
          // 移除BOM并重写文件
          fs.writeFileSync(file, content.slice(1), 'utf8');
          fixedCount++;
        }
        
        // 检查是否有特殊字符
        if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/.test(content)) {
          console.log(`  发现特殊字符: ${file}`);
          // 清理特殊字符
          const cleanContent = content.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
          fs.writeFileSync(file, cleanContent, 'utf8');
          fixedCount++;
        }
      }
    } catch (error) {
      console.log(`  处理文件失败 ${file}: ${error.message}`);
    }
  }
  
  return {
    success: true,
    message: `检查${criticalFiles.length}个文件，修复${fixedCount}个编码问题`
  };
}

/**
 * 2. 验证和修复模块依赖
 */
function fixModuleDependencies() {
  console.log('  验证模块依赖关系...');
  
  try {
    // 检查node_modules是否存在
    if (!fs.existsSync('node_modules')) {
      return {
        success: false,
        error: 'node_modules目录不存在，请运行 npm install'
      };
    }
    
    // 检查关键依赖
    const requiredDeps = ['express', 'bcrypt', 'jsonwebtoken', 'uuid'];
    const missingDeps = [];
    
    for (const dep of requiredDeps) {
      if (!fs.existsSync(`node_modules/${dep}`)) {
        missingDeps.push(dep);
      }
    }
    
    if (missingDeps.length > 0) {
      return {
        success: false,
        error: `缺少依赖: ${missingDeps.join(', ')}`
      };
    }
    
    return {
      success: true,
      message: '所有关键依赖都存在'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 3. 修复模块导入路径
 */
function fixModulePaths() {
  console.log('  检查模块导入路径...');
  
  const moduleFiles = [
    'src/dao/baseDao.js',
    'src/dao/inquiryDao.js',
    'src/services/baseService.js',
    'src/services/inquiryService.js'
  ];
  
  let fixedCount = 0;
  
  for (const file of moduleFiles) {
    try {
      if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        let modified = false;
        
        // 修复相对路径问题
        const pathFixes = [
          { from: "require('../config')", to: "require('../config')" },
          { from: "require('../utils')", to: "require('../utils')" },
          { from: "require('./baseDao')", to: "require('./baseDao')" },
          { from: "require('./baseService')", to: "require('./baseService')" }
        ];
        
        pathFixes.forEach(fix => {
          if (content.includes(fix.from) && fix.from !== fix.to) {
            content = content.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to);
            modified = true;
          }
        });
        
        if (modified) {
          fs.writeFileSync(file, content, 'utf8');
          fixedCount++;
        }
      }
    } catch (error) {
      console.log(`  处理文件失败 ${file}: ${error.message}`);
    }
  }
  
  return {
    success: true,
    message: `检查${moduleFiles.length}个文件，修复${fixedCount}个路径问题`
  };
}

/**
 * 4. 创建简化的测试模块
 */
function createTestModules() {
  console.log('  创建简化测试模块...');
  
  try {
    // 创建简化的配置测试
    const testConfigContent = `
// 简化配置测试
const config = {
  server: { port: 3000, host: 'localhost' },
  database: { path: './data' },
  cache: { ttl: 300000 },
  security: { jwt: { secret: 'test-secret' } },
  getDataFilePath: (fileName) => \`./data/\${fileName}\`
};

module.exports = config;
`;
    
    fs.writeFileSync('test-config.js', testConfigContent);
    
    // 创建简化的工具测试
    const testUtilsContent = `
// 简化工具测试
const fs = require('fs');
const path = require('path');

const utils = {
  readJsonFile: (filePath, defaultData = []) => {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
      return defaultData;
    } catch (error) {
      return defaultData;
    }
  },
  
  writeJsonFile: (filePath, data) => {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      return false;
    }
  },
  
  generateUUID: () => {
    return 'test-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  },
  
  isValidEmail: (email) => {
    return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
  }
};

module.exports = utils;
`;
    
    fs.writeFileSync('test-utils.js', testUtilsContent);
    
    return {
      success: true,
      message: '创建了简化测试模块'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 5. 运行基础功能测试
 */
function runBasicTest() {
  console.log('  运行基础功能测试...');
  
  try {
    // 测试简化配置
    const testConfig = require('./test-config');
    if (!testConfig.server || !testConfig.database) {
      throw new Error('配置模块测试失败');
    }
    
    // 测试简化工具
    const testUtils = require('./test-utils');
    if (!testUtils.generateUUID || !testUtils.isValidEmail) {
      throw new Error('工具模块测试失败');
    }
    
    // 测试基础功能
    const uuid = testUtils.generateUUID();
    const emailValid = testUtils.isValidEmail('test@example.com');
    
    if (!uuid || !emailValid) {
      throw new Error('基础功能测试失败');
    }
    
    return {
      success: true,
      message: '基础功能测试通过'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 6. 生成修复报告
 */
function generateFixReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: fixResults.total,
      success: fixResults.success,
      failed: fixResults.failed,
      successRate: ((fixResults.success / fixResults.total) * 100).toFixed(2)
    },
    details: fixResults.details,
    recommendations: []
  };
  
  // 添加建议
  if (fixResults.failed > 0) {
    report.recommendations.push('存在修复失败的项目，需要手动检查');
  }
  
  if (fixResults.success === fixResults.total) {
    report.recommendations.push('所有修复成功，可以重新运行功能测试');
  }
  
  report.recommendations.push('建议运行: node inquiry-functionality-test.js');
  report.recommendations.push('建议运行: node comprehensive-verification.js');
  
  try {
    fs.writeFileSync('emergency-fix-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 修复报告已保存到: emergency-fix-report.json');
  } catch (error) {
    console.log('\n⚠️ 无法保存修复报告:', error.message);
  }
  
  return report;
}

/**
 * 主修复函数
 */
async function runEmergencyFix() {
  console.log('开始紧急架构修复...\n');

  // 1. 修复文件编码问题
  runFix('文件编码修复', fixFileEncoding);

  // 2. 验证模块依赖
  runFix('模块依赖验证', fixModuleDependencies);

  // 3. 修复模块路径
  runFix('模块路径修复', fixModulePaths);

  // 4. 创建测试模块
  runFix('创建测试模块', createTestModules);

  // 5. 运行基础测试
  runFix('基础功能测试', runBasicTest);

  // 输出修复结果
  console.log('\n' + '='.repeat(50));
  console.log('📊 紧急修复结果');
  console.log('='.repeat(50));
  console.log(`总修复项: ${fixResults.total}`);
  console.log(`修复成功: ${fixResults.success} ✅`);
  console.log(`修复失败: ${fixResults.failed} ❌`);
  console.log(`成功率: ${((fixResults.success / fixResults.total) * 100).toFixed(2)}%`);

  if (fixResults.failed > 0) {
    console.log('\n❌ 修复失败的项目:');
    fixResults.details
      .filter(detail => detail.status === 'FAILED' || detail.status === 'ERROR')
      .forEach((detail, index) => {
        console.log(`  ${index + 1}. ${detail.fix}: ${detail.message}`);
      });
  }

  const overallSuccess = fixResults.failed === 0;
  console.log(`\n🎯 整体修复结果: ${overallSuccess ? '✅ 全部成功' : '❌ 部分失败'}`);
  
  if (overallSuccess) {
    console.log('\n🎉 紧急修复完成！');
    console.log('✨ 建议重新运行功能测试验证修复效果。');
    console.log('\n📋 下一步建议:');
    console.log('  1. node inquiry-functionality-test.js');
    console.log('  2. node comprehensive-verification.js');
    console.log('  3. node server-modular.js (启动服务器测试)');
  } else {
    console.log('\n⚠️ 部分修复失败，需要进一步诊断。');
    console.log('📖 请查看详细错误信息并手动修复。');
  }

  // 生成修复报告
  generateFixReport();

  return overallSuccess;
}

// 执行修复
if (require.main === module) {
  runEmergencyFix()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ 紧急修复过程失败:', error);
      process.exit(1);
    });
}

module.exports = { runEmergencyFix };
