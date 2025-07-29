/**
 * 🏢 统一公司信息服务
 * 整合原本分散在多个文件中的loadCompanyInfo函数
 *
 * 原始位置：
 * - main.js - loadCompanyInfo() (从/data/company.json加载，有完整的错误处理和默认值)
 * - product-card-component.js - loadCompanyInfo() (从/api/company-info加载，简单实现)
 * - header-footer-components.js - loadCompanyInfo() (从/data/company.json加载，简单实现)
 */

class CompanyService {
  constructor() {
    this.companyInfo = null;
    this.isLoaded = false;
    this.loadPromise = null; // 防止重复加载

    // 默认公司信息（作为后备）
    this.defaultInfo = {
      name: "无锡皇德国际贸易有限公司",
      description: "专业涡轮增压器和共轨喷油器配件供应商",
      contact: {
        address: "无锡市锡山区东港镇黄土塘村工业园区创业路107号",
        postalCode: "214196",
        phone: "+86 133 7622 3199",
        whatsapp: "+86 136 5615 7230",
        email: "sales03@diamond-auto.com",
      },
    };
  }

  /**
   * 加载公司信息（统一方法）
   * @returns {Promise<Object>} 公司信息对象
   */
  async loadCompanyInfo() {
    // 如果已经在加载中，返回现有的Promise
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // 如果已经加载过，直接返回
    if (this.isLoaded && this.companyInfo) {
      return this.companyInfo;
    }

    // 开始加载
    this.loadPromise = this._fetchCompanyInfo();

    try {
      this.companyInfo = await this.loadPromise;
      this.isLoaded = true;
      console.log("✅ 公司信息加载成功");
      return this.companyInfo;
    } catch (error) {
      console.error("❌ 加载公司信息失败:", error);
      // 使用默认信息
      this.companyInfo = this.defaultInfo;
      this.isLoaded = true;
      return this.companyInfo;
    } finally {
      this.loadPromise = null;
    }
  }

  /**
   * 实际获取公司信息的方法
   * @private
   */
  async _fetchCompanyInfo() {
    try {
      // 🗄️ 使用数据库API获取公司信息
      const response = await fetch("/api/db/company");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      // 如果数据库API失败，尝试备用JSON文件
      try {
        console.warn("数据库API失败，尝试备用JSON文件:", error.message);
        const backupResponse = await fetch("/data/company.json");
        if (backupResponse.ok) {
          return await backupResponse.json();
        }
      } catch (backupError) {
        console.warn("备用JSON文件也失败:", backupError);
      }

      // 如果所有API都失败，抛出原始错误
      throw error;
    }
  }

  /**
   * 获取公司信息（同步方法，如果未加载则返回默认值）
   * @returns {Object} 公司信息对象
   */
  getCompanyInfo() {
    return this.companyInfo || this.defaultInfo;
  }

  /**
   * 获取联系信息
   * @returns {Object} 联系信息对象
   */
  getContactInfo() {
    const info = this.getCompanyInfo();
    return info.contact || this.defaultInfo.contact;
  }

  /**
   * 更新页面中的公司信息元素（兼容原main.js的实现）
   * @param {Object} options - 更新选项
   */
  updatePageElements(options = {}) {
    const contactInfo = this.getContactInfo();

    // 更新地址信息 - 支持多语言
    this._updateElement("company-address", (element) => {
      const address = this._getLocalizedAddress();
      const formattedAddress = this._formatAddressForDisplay(address);
      element.innerHTML = formattedAddress;
    });

    // 隐藏邮编信息 - 根据用户反馈不再显示邮编
    this._updateElement("company-postal-code", (element) => {
      element.style.display = "none";
    });

    // 更新电话信息
    this._updateElement("company-phone", (element) => {
      element.textContent = contactInfo.phone;
    });

    this._updateElement("company-phone-link", (element) => {
      element.href = `tel:${contactInfo.phone.replace(/\s+/g, "")}`;
    });

    // 更新WhatsApp信息
    this._updateElement("company-whatsapp", (element) => {
      element.textContent = contactInfo.whatsapp || contactInfo.phone;
    });

    this._updateElement("company-whatsapp-link", (element) => {
      const whatsappNumber = (
        contactInfo.whatsapp || contactInfo.phone
      ).replace(/\s+/g, "");
      element.href = `https://wa.me/${whatsappNumber.replace("+", "")}`;
    });

    // 更新邮箱信息
    this._updateElement("company-email", (element) => {
      element.textContent = contactInfo.email;
    });

    this._updateElement("company-email-link", (element) => {
      element.href = `mailto:${contactInfo.email}`;
    });
  }

  /**
   * 获取本地化的地址信息
   * @private
   * @returns {string} 本地化的地址
   */
  _getLocalizedAddress() {
    const contactInfo = this.getContactInfo();

    // 检查是否有i18n管理器并获取当前语言
    if (window.i18nManager && window.i18nManager.getCurrentLanguage) {
      const currentLangInfo = window.i18nManager.getCurrentLanguage();
      const currentLang = currentLangInfo.code || currentLangInfo; // 兼容新旧版本

      if (currentLang === "en-US") {
        // 英文地址
        return (
          window.i18nManager.t("contact.address_full") ||
          "No. 107, Chuangye Road, Industrial Park, Huangtutang Village, Donggang Town, Xishan District, Wuxi City"
        );
      }
    }

    // 默认中文地址
    const addressParts = contactInfo.address.split("邮编:");
    return addressParts[0].trim();
  }

  /**
   * 获取本地化的邮编标签
   * @private
   * @returns {string} 本地化的邮编标签
   */
  _getLocalizedPostalLabel() {
    // 检查是否有i18n管理器并获取当前语言
    if (window.i18nManager && window.i18nManager.getCurrentLanguage) {
      const currentLangInfo = window.i18nManager.getCurrentLanguage();
      const currentLang = currentLangInfo.code || currentLangInfo; // 兼容新旧版本

      if (currentLang === "en-US") {
        return "Postal Code";
      }
    }

    // 默认中文标签
    return "邮编";
  }

  /**
   * 格式化地址用于显示
   * @private
   * @param {string} address - 原始地址
   * @returns {string} 格式化后的地址HTML
   */
  _formatAddressForDisplay(address) {
    if (!address) return "";

    // 检查当前语言
    const currentLangInfo = window.i18nManager?.getCurrentLanguage();
    const currentLang = currentLangInfo?.code || currentLangInfo || "zh-CN";

    if (currentLang === "en-US") {
      // 英文地址格式化：按指定格式显示
      // 预期格式：
      // No. 107 Chuangye Road,
      // Industrial Park Donggang Town,
      // Xishan District Wuxi City

      const parts = address.split(",").map((part) => part.trim());

      if (parts.length >= 3) {
        // 标准3行格式
        const line1 = parts[0] + ","; // No. 107 Chuangye Road,
        const line2 = parts[1] + ","; // Industrial Park Donggang Town,
        const line3 = parts[2]; // Xishan District Wuxi City
        return `${line1}<br>${line2}<br>${line3}`;
      } else if (parts.length === 2) {
        // 2行格式
        const line1 = parts[0] + ",";
        const line2 = parts[1];
        return `${line1}<br>${line2}`;
      } else {
        // 单行格式
        return parts[0];
      }
    } else {
      // 中文地址格式化：按空格分行，但保持合理的分组
      return address.replace(/\s+/g, "<br>");
    }
  }

  /**
   * 安全更新DOM元素的辅助方法
   * @private
   * @param {string} elementId - 元素ID
   * @param {Function} updateFn - 更新函数
   */
  _updateElement(elementId, updateFn) {
    const element = document.getElementById(elementId);
    if (element && updateFn) {
      try {
        updateFn(element);
      } catch (error) {
        console.warn(`更新元素 ${elementId} 时出错:`, error);
      }
    }
  }

  /**
   * 获取WhatsApp号码（用于产品卡片组件）
   * @returns {string} 清理后的WhatsApp号码
   */
  getWhatsAppNumber() {
    const contactInfo = this.getContactInfo();
    const whatsapp =
      contactInfo.whatsapp || contactInfo.phone || "+86 13656157230";
    return whatsapp.replace(/\D/g, ""); // 移除所有非数字字符
  }

  /**
   * 获取公司名称
   * @returns {string} 公司名称
   */
  getCompanyName() {
    const info = this.getCompanyInfo();
    return info.name || this.defaultInfo.name;
  }

  /**
   * 获取公司描述
   * @returns {string} 公司描述
   */
  getCompanyDescription() {
    const info = this.getCompanyInfo();
    return info.description || this.defaultInfo.description;
  }

  /**
   * 重置服务状态（用于测试或重新加载）
   */
  reset() {
    this.companyInfo = null;
    this.isLoaded = false;
    this.loadPromise = null;
  }
}

// 创建全局单例实例
window.companyService = window.companyService || new CompanyService();

// 导出服务（支持模块化和全局使用）
if (typeof module !== "undefined" && module.exports) {
  module.exports = CompanyService;
}
