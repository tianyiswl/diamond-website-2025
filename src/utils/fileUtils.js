// 📁 文件操作工具模块
// 提供文件和目录操作的通用功能

const fs = require('fs');
const path = require('path');

/**
 * 确保目录存在，如果不存在则创建
 * @param {string} dirPath - 目录路径
 * @returns {boolean} 是否成功
 */
const ensureDirectoryExists = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ 创建目录: ${dirPath}`);
    }
    return true;
  } catch (error) {
    console.error(`❌ 创建目录失败 ${dirPath}:`, error.message);
    return false;
  }
};

/**
 * 读取JSON文件
 * @param {string} filePath - 文件路径
 * @param {*} defaultValue - 默认值（文件不存在时返回）
 * @returns {*} 解析后的JSON对象或默认值
 */
const readJsonFile = (filePath, defaultValue = null) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ 文件不存在: ${filePath}`);
      return defaultValue;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`❌ 读取JSON文件失败: ${filePath}`, error.message);
    return defaultValue;
  }
};

/**
 * 写入JSON文件
 * @param {string} filePath - 文件路径
 * @param {*} data - 要写入的数据
 * @param {boolean} createDir - 是否自动创建目录
 * @returns {boolean} 是否成功
 */
const writeJsonFile = (filePath, data, createDir = true) => {
  try {
    // 确保目录存在
    if (createDir) {
      const dir = path.dirname(filePath);
      ensureDirectoryExists(dir);
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`❌ 写入JSON文件失败 ${filePath}:`, error.message);
    return false;
  }
};

/**
 * 备份文件
 * @param {string} filePath - 原文件路径
 * @param {string} backupDir - 备份目录
 * @returns {string|null} 备份文件路径或null（失败时）
 */
const backupFile = (filePath, backupDir = './backup') => {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ 源文件不存在: ${filePath}`);
      return null;
    }
    
    ensureDirectoryExists(backupDir);
    
    const fileName = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `${fileName}.backup-${timestamp}`);
    
    fs.copyFileSync(filePath, backupPath);
    console.log(`📋 文件备份成功: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error(`❌ 文件备份失败 ${filePath}:`, error.message);
    return null;
  }
};

/**
 * 获取文件大小（字节）
 * @param {string} filePath - 文件路径
 * @returns {number} 文件大小或-1（失败时）
 */
const getFileSize = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    console.error(`❌ 获取文件大小失败 ${filePath}:`, error.message);
    return -1;
  }
};

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化的文件大小
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 检查文件是否存在
 * @param {string} filePath - 文件路径
 * @returns {boolean} 文件是否存在
 */
const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

/**
 * 删除文件
 * @param {string} filePath - 文件路径
 * @returns {boolean} 是否成功
 */
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ 文件删除成功: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ 文件删除失败 ${filePath}:`, error.message);
    return false;
  }
};

/**
 * 获取目录下的所有文件
 * @param {string} dirPath - 目录路径
 * @param {string[]} extensions - 文件扩展名过滤（可选）
 * @returns {string[]} 文件路径数组
 */
const getFilesInDirectory = (dirPath, extensions = []) => {
  try {
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    
    const files = fs.readdirSync(dirPath);
    let result = files.map(file => path.join(dirPath, file));
    
    // 过滤文件（排除目录）
    result = result.filter(filePath => fs.statSync(filePath).isFile());
    
    // 按扩展名过滤
    if (extensions.length > 0) {
      result = result.filter(filePath => {
        const ext = path.extname(filePath).toLowerCase();
        return extensions.includes(ext);
      });
    }
    
    return result;
  } catch (error) {
    console.error(`❌ 获取目录文件失败 ${dirPath}:`, error.message);
    return [];
  }
};

/**
 * 清理旧的备份文件
 * @param {string} backupDir - 备份目录
 * @param {number} maxBackups - 最大保留备份数
 * @returns {number} 删除的文件数
 */
const cleanupOldBackups = (backupDir, maxBackups = 10) => {
  try {
    if (!fs.existsSync(backupDir)) {
      return 0;
    }
    
    const files = fs.readdirSync(backupDir)
      .filter(file => file.includes('.backup-'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        mtime: fs.statSync(path.join(backupDir, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime); // 按修改时间降序排列
    
    let deletedCount = 0;
    if (files.length > maxBackups) {
      const filesToDelete = files.slice(maxBackups);
      filesToDelete.forEach(file => {
        if (deleteFile(file.path)) {
          deletedCount++;
        }
      });
    }
    
    return deletedCount;
  } catch (error) {
    console.error(`❌ 清理备份文件失败 ${backupDir}:`, error.message);
    return 0;
  }
};

module.exports = {
  ensureDirectoryExists,
  readJsonFile,
  writeJsonFile,
  backupFile,
  getFileSize,
  formatFileSize,
  fileExists,
  deleteFile,
  getFilesInDirectory,
  cleanupOldBackups
};
