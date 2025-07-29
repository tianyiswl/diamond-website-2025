// 📊 分析数据访问层
// 专门处理网站访问统计和分析数据

const BaseDao = require('./baseDao');
const utils = require('../utils');

class AnalyticsDao extends BaseDao {
  constructor() {
    super('analytics.json', { daily_stats: {}, product_analytics: {} });
  }

  /**
   * 记录访问数据
   * @param {Object} data - 访问数据
   * @returns {boolean} 是否成功
   */
  recordVisit(data) {
    try {
      const analytics = this.read();
      const today = utils.getLocalDateString();

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
          hourly_data: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            views: 0,
            clicks: 0
          })),
          geo_stats: {}
        };
      }

      const todayStats = analytics.daily_stats[today];
      const currentHour = utils.getLocalHour();

      // 更新统计数据
      if (data.type === 'page_view') {
        todayStats.page_views++;
        todayStats.hourly_data[currentHour].views++;
      }

      if (data.type === 'product_click') {
        todayStats.product_clicks++;
        todayStats.hourly_data[currentHour].clicks++;
        
        // 更新产品点击统计
        if (data.productId) {
          this.recordProductClick(data.productId, data.productName);
        }
      }

      if (data.type === 'inquiry') {
        todayStats.inquiries++;
      }

      // 更新流量来源
      if (data.source) {
        const source = this.categorizeTrafficSource(data.referer);
        todayStats.traffic_sources[source]++;
      }

      // 更新地理位置统计
      if (data.country) {
        todayStats.geo_stats[data.country] = (todayStats.geo_stats[data.country] || 0) + 1;
      }

      // 计算转化率
      if (todayStats.page_views > 0) {
        todayStats.conversion_rate = ((todayStats.inquiries / todayStats.page_views) * 100).toFixed(2);
      }

      return this.write(analytics);
    } catch (error) {
      console.error('记录访问数据失败:', error);
      return false;
    }
  }

  /**
   * 记录产品点击
   * @param {string} productId - 产品ID
   * @param {string} productName - 产品名称
   * @returns {boolean} 是否成功
   */
  recordProductClick(productId, productName) {
    try {
      const analytics = this.read();
      
      if (!analytics.product_analytics) {
        analytics.product_analytics = {};
      }

      if (!analytics.product_analytics[productId]) {
        analytics.product_analytics[productId] = {
          id: productId,
          name: productName,
          clicks: 0,
          views: 0,
          inquiries: 0,
          lastClicked: null
        };
      }

      analytics.product_analytics[productId].clicks++;
      analytics.product_analytics[productId].lastClicked = utils.getISOString();

      return this.write(analytics);
    } catch (error) {
      console.error('记录产品点击失败:', error);
      return false;
    }
  }

  /**
   * 获取今日统计数据
   * @returns {Object|null} 今日统计数据
   */
  getTodayStats() {
    try {
      const data = this.read();
      const today = new Date().toISOString().split('T')[0];
      
      // 如果没有今日数据，返回默认值
      if (!data || !data[today]) {
        return {
          page_views: 0,
          unique_visitors: 0,
          product_clicks: 0,
          inquiries: 0,
          conversion_rate: '0.00'
        };
      }
      
      return data[today];
    } catch (error) {
      console.error('获取今日统计失败:', error);
      return {
        page_views: 0,
        unique_visitors: 0,
        product_clicks: 0,
        inquiries: 0,
        conversion_rate: '0.00'
      };
    }
  }

  /**
   * 获取指定日期的统计数据
   * @param {string} date - 日期字符串 (YYYY-MM-DD)
   * @returns {Object|null} 统计数据
   */
  getStatsByDate(date) {
    try {
      const analytics = this.read();
      return analytics.daily_stats[date] || null;
    } catch (error) {
      console.error('获取指定日期统计失败:', error);
      return null;
    }
  }

  /**
   * 获取历史数据
   * @param {string} period - 时间周期 (year/month/day)
   * @param {string} value - 时间值
   * @returns {Object} 历史数据
   */
  getHistoricalData(period, value) {
    try {
      const analytics = this.read();
      const dailyStats = analytics.daily_stats || {};

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

      // 根据查询类型过滤数据
      const filteredDates = Object.keys(dailyStats)
        .filter(date => {
          if (period === 'year') {
            return date.startsWith(value);
          } else if (period === 'month') {
            return date.startsWith(value);
          } else if (period === 'day') {
            return date === value;
          }
          return false;
        })
        .sort();

      // 汇总数据
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
      });

      // 计算平均转化率
      if (result.summary.total_views > 0) {
        result.summary.avg_conversion_rate = 
          ((result.summary.total_inquiries / result.summary.total_views) * 100).toFixed(2);
      }

      return result;
    } catch (error) {
      console.error('获取历史数据失败:', error);
      return null;
    }
  }

  /**
   * 获取产品分析数据
   * @returns {Array} 产品分析数据
   */
  getProductAnalytics() {
    try {
      const analytics = this.read();
      const productAnalytics = analytics.product_analytics || {};
      
      return Object.values(productAnalytics)
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 20); // 返回前20个热门产品
    } catch (error) {
      console.error('获取产品分析数据失败:', error);
      return [];
    }
  }

  /**
   * 分类流量来源
   * @param {string} referer - 来源URL
   * @returns {string} 流量来源类型
   */
  categorizeTrafficSource(referer) {
    if (!referer) return 'direct';
    
    const url = referer.toLowerCase();
    
    if (url.includes('google') || url.includes('baidu') || url.includes('bing')) {
      return 'search';
    }
    
    if (url.includes('facebook') || url.includes('twitter') || url.includes('weibo')) {
      return 'social';
    }
    
    return 'referral';
  }

  /**
   * 获取可用的年份列表
   * @returns {Array} 年份列表
   */
  getAvailableYears() {
    try {
      const analytics = this.read();
      const dates = Object.keys(analytics.daily_stats || {});
      const years = [...new Set(dates.map(date => date.substring(0, 4)))];
      return years.sort().reverse();
    } catch (error) {
      console.error('获取可用年份失败:', error);
      return [];
    }
  }

  /**
   * 获取指定年份的月份列表
   * @param {string} year - 年份
   * @returns {Array} 月份列表
   */
  getAvailableMonths(year) {
    try {
      const analytics = this.read();
      const dates = Object.keys(analytics.daily_stats || {});
      const months = [...new Set(
        dates
          .filter(date => date.startsWith(year))
          .map(date => date.substring(0, 7))
      )];
      return months.sort().reverse();
    } catch (error) {
      console.error('获取可用月份失败:', error);
      return [];
    }
  }

  /**
   * 获取指定月份的日期列表
   * @param {string} yearMonth - 年月 (YYYY-MM)
   * @returns {Array} 日期列表
   */
  getAvailableDays(yearMonth) {
    try {
      const analytics = this.read();
      const dates = Object.keys(analytics.daily_stats || {});
      const days = dates
        .filter(date => date.startsWith(yearMonth))
        .sort()
        .reverse();
      return days;
    } catch (error) {
      console.error('获取可用日期失败:', error);
      return [];
    }
  }
}

module.exports = AnalyticsDao;
