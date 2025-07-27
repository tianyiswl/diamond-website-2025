// 📅 时间处理工具模块
// 提供统一的时间处理功能，支持时区转换和格式化

/**
 * 获取本地时间的日期字符串
 * @param {Date} date - 日期对象，默认为当前时间
 * @returns {string} 格式化的日期字符串 (YYYY-MM-DD)
 */
const getLocalDateString = (date = new Date()) => {
  return date
    .toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Shanghai"
    })
    .replace(/\//g, "-");
};

/**
 * 获取本地时间的小时
 * @param {Date} date - 日期对象，默认为当前时间
 * @returns {number} 小时数 (0-23)
 */
const getLocalHour = (date = new Date()) => {
  return date.getHours();
};

/**
 * 获取本地时间的完整时间戳字符串
 * @param {Date} date - 日期对象，默认为当前时间
 * @returns {string} 格式化的时间戳 (YYYY-MM-DD HH:mm:ss)
 */
const getLocalTimestamp = (date = new Date()) => {
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai"
  });
};

/**
 * 获取ISO格式的时间字符串
 * @param {Date} date - 日期对象，默认为当前时间
 * @returns {string} ISO格式时间字符串
 */
const getISOString = (date = new Date()) => {
  return date.toISOString();
};

/**
 * 解析日期字符串为Date对象
 * @param {string} dateString - 日期字符串
 * @returns {Date|null} Date对象或null（如果解析失败）
 */
const parseDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    return null;
  }
};

/**
 * 格式化时间差
 * @param {number} milliseconds - 毫秒数
 * @returns {string} 格式化的时间差字符串
 */
const formatDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}天${hours % 24}小时`;
  } else if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`;
  } else {
    return `${seconds}秒`;
  }
};

/**
 * 检查日期是否为今天
 * @param {Date} date - 要检查的日期
 * @returns {boolean} 是否为今天
 */
const isToday = (date) => {
  const today = new Date();
  return getLocalDateString(date) === getLocalDateString(today);
};

/**
 * 获取日期范围内的所有日期
 * @param {Date} startDate - 开始日期
 * @param {Date} endDate - 结束日期
 * @returns {string[]} 日期字符串数组
 */
const getDateRange = (startDate, endDate) => {
  const dates = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    dates.push(getLocalDateString(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
};

/**
 * 获取指定月份的天数
 * @param {number} year - 年份
 * @param {number} month - 月份 (1-12)
 * @returns {number} 天数
 */
const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

/**
 * 计算两个日期之间的天数差
 * @param {Date} date1 - 第一个日期
 * @param {Date} date2 - 第二个日期
 * @returns {number} 天数差
 */
const daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1 - date2) / oneDay));
};

module.exports = {
  getLocalDateString,
  getLocalHour,
  getLocalTimestamp,
  getISOString,
  parseDate,
  formatDuration,
  isToday,
  getDateRange,
  getDaysInMonth,
  daysBetween
};
