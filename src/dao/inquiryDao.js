// 💬 询价数据访问层
// 专门处理客户询价相关的数据操作

const BaseDao = require('./baseDao');
const utils = require('../utils');

class InquiryDao extends BaseDao {
  constructor() {
    super('inquiries.json', []);
  }

  /**
   * 获取所有询价（简单版本，返回数组）
   * @returns {Array} 询价数组
   */
  getAllInquiries() {
    try {
      const inquiries = this.read();
      console.log(`📊 读取到 ${inquiries.length} 条询价记录`);
      return inquiries;
    } catch (error) {
      console.error('获取所有询价失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有询价（分页版本）
   * @param {Object} options - 查询选项
   * @returns {Object} 包含数据和分页信息的对象
   */
  findAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    let inquiries = this.read();

    // 状态筛选
    if (status) {
      inquiries = inquiries.filter(inquiry => inquiry.status === status);
    }

    // 排序
    inquiries.sort((a, b) => {
      let valueA, valueB;

      switch (sortBy) {
        case 'name':
          valueA = (a.name || '').toLowerCase();
          valueB = (b.name || '').toLowerCase();
          break;
        case 'email':
          valueA = (a.email || '').toLowerCase();
          valueB = (b.email || '').toLowerCase();
          break;
        case 'createdAt':
        default:
          valueA = new Date(a.createdAt || 0);
          valueB = new Date(b.createdAt || 0);
          break;
      }

      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // 分页
    const total = inquiries.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedInquiries = inquiries.slice(startIndex, endIndex);

    return {
      data: paginatedInquiries,
      pagination: {
        current: page,
        total: totalPages,
        limit: limit,
        totalItems: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * 根据ID查找询价
   * @param {string} id - 询价ID
   * @returns {Object|null} 询价对象或null
   */
  findById(id) {
    const inquiries = this.read();
    return inquiries.find(inquiry => inquiry.id === id) || null;
  }

  /**
   * 创建新询价
   * @param {Object} inquiryData - 询价数据
   * @returns {Object} 创建结果
   */
  create(inquiryData) {
    try {
      // 验证询价数据
      const validation = utils.validateInquiry(inquiryData);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      const inquiries = this.read();
      
      // 生成新ID
      const newId = utils.generateUUID();

      // 创建询价对象
      const newInquiry = {
        id: newId,
        name: utils.sanitizeString(inquiryData.name),
        email: inquiryData.email.toLowerCase().trim(),
        phone: utils.sanitizeString(inquiryData.phone || ''),
        company: utils.sanitizeString(inquiryData.company || ''),
        message: utils.sanitizeString(inquiryData.message),
        productId: inquiryData.productId || '',
        productName: utils.sanitizeString(inquiryData.productName || ''),
        source: inquiryData.source || 'website',
        status: 'pending',
        priority: inquiryData.priority || 'normal',
        tags: inquiryData.tags || [],
        notes: '',
        createdAt: utils.getISOString(),
        updatedAt: utils.getISOString(),
        respondedAt: null,
        clientInfo: {
          userAgent: inquiryData.userAgent || '',
          ip: inquiryData.ip || '',
          referer: inquiryData.referer || ''
        }
      };

      // 添加到询价列表
      inquiries.unshift(newInquiry); // 新询价放在最前面

      // 保存数据
      if (this.write(inquiries)) {
        return {
          success: true,
          data: newInquiry
        };
      } else {
        return {
          success: false,
          errors: ['保存询价数据失败']
        };
      }
    } catch (error) {
      console.error('创建询价失败:', error);
      return {
        success: false,
        errors: ['创建询价时发生错误']
      };
    }
  }

  /**
   * 更新询价状态
   * @param {string} id - 询价ID
   * @param {string} status - 新状态
   * @param {string} notes - 备注
   * @returns {Object} 更新结果
   */
  updateStatus(id, status, notes = '') {
    try {
      const inquiries = this.read();
      const inquiryIndex = inquiries.findIndex(i => i.id === id);

      if (inquiryIndex === -1) {
        return {
          success: false,
          errors: ['询价记录不存在']
        };
      }

      const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return {
          success: false,
          errors: ['无效的状态值']
        };
      }

      // 更新询价
      const updatedInquiry = {
        ...inquiries[inquiryIndex],
        status: status,
        notes: utils.sanitizeString(notes),
        updatedAt: utils.getISOString()
      };

      // 如果状态变为已处理，记录响应时间
      if (status === 'completed' && inquiries[inquiryIndex].status !== 'completed') {
        updatedInquiry.respondedAt = utils.getISOString();
      }

      inquiries[inquiryIndex] = updatedInquiry;

      // 保存数据
      if (this.write(inquiries)) {
        return {
          success: true,
          data: updatedInquiry
        };
      } else {
        return {
          success: false,
          errors: ['保存询价数据失败']
        };
      }
    } catch (error) {
      console.error('更新询价状态失败:', error);
      return {
        success: false,
        errors: ['更新询价状态时发生错误']
      };
    }
  }

  /**
   * 删除询价
   * @param {string} id - 询价ID
   * @returns {Object} 删除结果
   */
  delete(id) {
    try {
      const inquiries = this.read();
      const inquiryIndex = inquiries.findIndex(i => i.id === id);

      if (inquiryIndex === -1) {
        return {
          success: false,
          errors: ['询价记录不存在']
        };
      }

      const deletedInquiry = inquiries[inquiryIndex];
      inquiries.splice(inquiryIndex, 1);

      // 保存数据
      if (this.write(inquiries)) {
        return {
          success: true,
          data: deletedInquiry
        };
      } else {
        return {
          success: false,
          errors: ['保存询价数据失败']
        };
      }
    } catch (error) {
      console.error('删除询价失败:', error);
      return {
        success: false,
        errors: ['删除询价时发生错误']
      };
    }
  }

  /**
   * 清空所有询价数据
   * @returns {Object} 清空结果
   */
  clearAll() {
    try {
      if (this.write([])) {
        return {
          success: true,
          message: '所有询价数据已清空'
        };
      } else {
        return {
          success: false,
          errors: ['清空询价数据失败']
        };
      }
    } catch (error) {
      console.error('清空询价数据失败:', error);
      return {
        success: false,
        errors: ['清空询价数据时发生错误']
      };
    }
  }

  /**
   * 获取询价统计信息
   * @returns {Object} 统计信息
   */
  getInquiryStats() {
    try {
      const inquiries = this.read();
      
      const stats = {
        total: inquiries.length,
        pending: inquiries.filter(i => i.status === 'pending').length,
        processing: inquiries.filter(i => i.status === 'processing').length,
        completed: inquiries.filter(i => i.status === 'completed').length,
        cancelled: inquiries.filter(i => i.status === 'cancelled').length,
        sources: {},
        recentInquiries: inquiries.slice(0, 10), // 最近10条询价
        avgResponseTime: 0
      };

      // 来源统计
      inquiries.forEach(inquiry => {
        const source = inquiry.source || 'unknown';
        stats.sources[source] = (stats.sources[source] || 0) + 1;
      });

      // 计算平均响应时间（已完成的询价）
      const completedInquiries = inquiries.filter(i => 
        i.status === 'completed' && i.respondedAt && i.createdAt
      );

      if (completedInquiries.length > 0) {
        const totalResponseTime = completedInquiries.reduce((total, inquiry) => {
          const created = new Date(inquiry.createdAt);
          const responded = new Date(inquiry.respondedAt);
          return total + (responded - created);
        }, 0);

        stats.avgResponseTime = Math.round(totalResponseTime / completedInquiries.length / (1000 * 60 * 60)); // 小时
      }

      return stats;
    } catch (error) {
      console.error('获取询价统计失败:', error);
      return null;
    }
  }

  /**
   * 导出询价数据
   * @param {Object} options - 导出选项
   * @returns {Array} 导出数据
   */
  exportData(options = {}) {
    try {
      const { format = 'json', dateRange = null } = options;
      let inquiries = this.read();

      // 日期范围筛选
      if (dateRange && dateRange.start && dateRange.end) {
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        inquiries = inquiries.filter(inquiry => {
          const createdDate = new Date(inquiry.createdAt);
          return createdDate >= startDate && createdDate <= endDate;
        });
      }

      if (format === 'csv') {
        // 转换为CSV格式的数据
        return inquiries.map(inquiry => ({
          ID: inquiry.id,
          姓名: inquiry.name,
          邮箱: inquiry.email,
          电话: inquiry.phone,
          公司: inquiry.company,
          询价内容: inquiry.message,
          产品名称: inquiry.productName,
          状态: this.getStatusText(inquiry.status),
          来源: inquiry.source,
          创建时间: utils.getLocalTimestamp(new Date(inquiry.createdAt)),
          更新时间: utils.getLocalTimestamp(new Date(inquiry.updatedAt))
        }));
      }

      return inquiries;
    } catch (error) {
      console.error('导出询价数据失败:', error);
      return [];
    }
  }

  /**
   * 获取状态文本
   * @param {string} status - 状态值
   * @returns {string} 状态文本
   */
  getStatusText(status) {
    const statusMap = {
      pending: '待处理',
      processing: '处理中',
      completed: '已完成',
      cancelled: '已取消'
    };
    return statusMap[status] || status;
  }
  /**
   * 更新询价记录
   * @param {string} id - 询价ID
   * @param {Object} updateData - 更新数据
   * @returns {Object} 更新结果
   */
  async update(id, updateData) {
    try {
      const inquiries = this.read();
      const index = inquiries.findIndex(inquiry => inquiry.id === id);
      
      if (index === -1) {
        return {
          success: false,
          errors: ['询价记录不存在']
        };
      }
      
      // 更新数据
      inquiries[index] = {
        ...inquiries[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      // 写入文件
      const writeResult = this.write(inquiries);
      if (!writeResult.success) {
        return writeResult;
      }
      
      return {
        success: true,
        message: '询价更新成功',
        data: inquiries[index]
      };
    } catch (error) {
      console.error('更新询价失败:', error);
      return {
        success: false,
        errors: [error.message]
      };
    }
  }


}

module.exports = InquiryDao;
