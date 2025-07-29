/**
 * 🏢 静态配置文件 - 无锡皇德国际贸易有限公司
 * 包含公司信息、分类数据等静态配置，避免异步加载导致的页面刷新问题
 */

// 🏢 公司信息配置
window.COMPANY_CONFIG = {
  name: "无锡皇德国际贸易有限公司",
  shortName: "皇德国际",
  description: "专业的涡轮增压器和共轨喷油器配件供应商",
  established: "2010",
  experience: "15年",
  logo: "assets/images/logo/diamond-logo.png",
  contact: {
    phone: "+86 133 7622 3199",
    email: "sales03@diamond-auto.com",
    whatsapp: "+86 136 5615 7230",
    address: "无锡市锡山区东港镇 黄土塘村工业园区 创业路107号",
    postalCode: "214196",
    website: "https://www.diamond-auto.com"
  },
  social: {
    facebook: "https://www.facebook.com/ariel.diamond.883219",
    instagram: "https://www.instagram.com/diamondautopart01/",
    whatsapp: "https://wa.me/8613656157230",
    email: "mailto:sales03@diamond-auto.com"
  },
  businessHours: {
    weekdays: "周一至周五 8:00-18:00",
    weekend: "周六 9:00-17:00"
  }
};

// 🏷️ 产品分类配置
window.CATEGORIES_CONFIG = [
  {
    id: "all",
    name: "全部产品",
    description: "查看所有产品分类",
    count: 0
  },
  {
    id: "turbocharger",
    name: "涡轮增压器",
    description: "各种型号的涡轮增压器及配件",
    count: 0
  },
  {
    id: "actuator",
    name: "执行器",
    description: "涡轮增压器执行器系列产品",
    count: 0
  },
  {
    id: "injector",
    name: "共轨喷油器",
    description: "高压共轨喷油器及相关配件",
    count: 0
  },
  {
    id: "turbo-parts",
    name: "涡轮配件",
    description: "涡轮增压器相关配件及维修件",
    count: 0
  },
  {
    id: "others",
    name: "其他",
    description: "其他汽车配件产品",
    count: 0
  }
];

// 🌍 页面文本配置（中文）
window.TEXT_CONFIG = {
  site: {
    title: "无锡皇德国际贸易有限公司 - 专业涡轮增压器和共轨喷油器配件供应商",
    description: "无锡皇德国际贸易有限公司专业供应涡轮增压器配件和共轨喷油器部件，15年行业经验，全球供应网络，品质保证。",
    keywords: "涡轮增压器,共轨喷油器,汽车配件,无锡皇德,Diamond Auto"
  },
  nav: {
    home: "首页",
    products: "产品展示",
    about: "关于我们",
    contact: "联系我们"
  },
  products: {
    section_title: "主要产品",
    section_subtitle: "精心挑选的精品产品，为您提供最新的产品选择",
    loading: "正在加载最新产品...",
    view_all: "查看全部产品",
    view_all_hint: "浏览完整产品目录，包含详细技术规格和应用范围",
    view_details: "查看详情",
    inquire: "立即询价"
  },
  company: {
    features: [
      {
        title: "15年专业经验",
        description: "超过15年行业代理经验，深度了解市场需求"
      },
      {
        title: "全球供应网络",
        description: "与全球顶级制造商建立长期合作关系"
      },
      {
        title: "品质保证",
        description: "每个产品都经过严格质量检测，确保最高标准"
      }
    ],
    intro_title: "「公司简介」",
    intro_main: "无锡皇德国际贸易有限公司是一家专业从事涡轮增压器配件和共轨喷油器部件供应的服务公司。",
    intro_detail_1: "我们的专业团队致力于为全球客户采购和提供高质量的涡轮增压器部件和喷油器部件。",
    intro_detail_2: "为多个行业提供高性能的汽车零部件解决方案。",
    intro_detail_3: "超过15年的代理经验，确保每一个产品都符合最高的质量标准。"
  },
  contact: {
    section_title: "联系我们",
    section_subtitle: "立即联系我们获取专业的产品咨询和报价服务",
    company_name: "无锡皇德国际贸易有限公司",
    map_click_hint: "点击查看完整地图",
    form_title: "发送询价信息",
    form_description: "请填写以下信息，我们将在24小时内回复您",
    info: {
      address: "地址",
      phone: "电话",
      whatsapp: "WhatsApp",
      email: "邮箱"
    },
    actions: {
      call: "立即通话",
      whatsapp: "WhatsApp联系",
      email: "发送邮件"
    },
    fields: {
      name: "您的姓名 *",
      email: "邮箱地址 *",
      phone: "联系电话",
      company: "公司名称",
      message_placeholder: "详细需求 * - 请详细描述您的需求，包括产品型号、数量等"
    },
    submit: "提交询价"
  },
  footer: {
    navigation: "快速导航",
    products: "主要产品",
    links: {
      privacy: "隐私政策",
      terms: "使用条款"
    }
  }
};

// 🔧 静态公司服务类
class StaticCompanyService {
  constructor() {
    this.companyInfo = window.COMPANY_CONFIG;
    this.isLoaded = true;
  }

  // 获取公司信息
  getCompanyInfo() {
    return this.companyInfo;
  }

  // 获取联系信息
  getContactInfo() {
    return this.companyInfo.contact;
  }

  // 更新页面元素
  updatePageElements() {
    const contact = this.companyInfo.contact;
    
    // 更新地址
    const addressElement = document.getElementById("company-address");
    if (addressElement) {
      addressElement.textContent = contact.address;
    }

    // 更新邮编
    const postalElement = document.getElementById("company-postal-code");
    if (postalElement) {
      postalElement.textContent = `邮编: ${contact.postalCode}`;
    }

    // 更新电话
    const phoneElement = document.getElementById("company-phone");
    const phoneLinkElement = document.getElementById("company-phone-link");
    if (phoneElement) {
      phoneElement.textContent = contact.phone;
    }
    if (phoneLinkElement) {
      phoneLinkElement.href = `tel:${contact.phone}`;
    }

    // 更新WhatsApp
    const whatsappElement = document.getElementById("company-whatsapp");
    const whatsappLinkElement = document.getElementById("company-whatsapp-link");
    if (whatsappElement) {
      whatsappElement.textContent = contact.whatsapp;
    }
    if (whatsappLinkElement) {
      whatsappLinkElement.href = `https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}`;
    }

    // 更新邮箱
    const emailElement = document.getElementById("company-email");
    const emailLinkElement = document.getElementById("company-email-link");
    if (emailElement) {
      emailElement.textContent = contact.email;
    }
    if (emailLinkElement) {
      emailLinkElement.href = `mailto:${contact.email}`;
    }

    console.log("✅ 静态公司信息已更新到页面元素");
  }

  // 兼容原有接口
  async loadCompanyInfo() {
    return Promise.resolve(true);
  }
}

// 🔧 静态分类服务类
class StaticCategoryService {
  constructor() {
    this.categories = window.CATEGORIES_CONFIG;
    this.isLoaded = true;
  }

  // 获取分类列表
  getCategories() {
    return this.categories;
  }

  // 获取活跃分类（排除"全部产品"）
  getActiveCategories() {
    return this.categories.filter(cat => cat.id !== "all");
  }

  // 兼容原有接口
  async loadCategories() {
    return Promise.resolve(true);
  }
}

// 创建全局实例
window.companyService = new StaticCompanyService();
window.categoryService = new StaticCategoryService();

console.log("✅ 静态配置已加载 - 无锡皇德国际贸易有限公司");
