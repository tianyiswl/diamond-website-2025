// 🔐 安全配置模块
// 管理认证、授权、加密等安全相关配置

const securityConfig = {
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'diamond-website-secret-key-2025',
    expiresIn: '24h',
    algorithm: 'HS256',
    issuer: 'diamond-website',
    audience: 'diamond-admin'
  },

  // 密码策略
  password: {
    minLength: 6,
    maxLength: 128,
    requireUppercase: false,
    requireLowercase: false,
    requireNumbers: false,
    requireSpecialChars: false,
    bcryptRounds: 12
  },

  // 登录安全
  login: {
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15分钟
    sessionTimeout: 24 * 60 * 60 * 1000, // 24小时
    rememberMeDuration: 30 * 24 * 60 * 60 * 1000, // 30天
    timeTolerance: 30 * 60 // 30分钟时区容差
  },

  // CORS配置
  cors: {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
  },

  // 请求限制
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 每个IP最多100个请求
    message: '请求过于频繁，请稍后再试',
    standardHeaders: true,
    legacyHeaders: false
  },

  // 文件上传安全
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    scanForVirus: false, // 病毒扫描（可选）
    quarantinePath: './uploads/quarantine'
  },

  // 数据验证
  validation: {
    maxStringLength: 1000,
    maxArrayLength: 100,
    maxObjectDepth: 10,
    sanitizeHtml: true,
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br']
  },

  // 日志安全
  logging: {
    logLevel: process.env.LOG_LEVEL || 'info',
    maskSensitiveData: true,
    sensitiveFields: ['password', 'token', 'secret', 'key'],
    maxLogSize: 10 * 1024 * 1024, // 10MB
    logRotation: true
  },

  // 系统安全
  system: {
    hideServerInfo: true,
    disablePoweredBy: true,
    enableHelmet: true,
    enableHsts: true,
    enableXssProtection: true,
    enableNoSniff: true
  }
};

// 验证密码强度
const validatePasswordStrength = (password) => {
  const config = securityConfig.password;
  const errors = [];

  if (password.length < config.minLength) {
    errors.push(`密码长度至少${config.minLength}位`);
  }

  if (password.length > config.maxLength) {
    errors.push(`密码长度不能超过${config.maxLength}位`);
  }

  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母');
  }

  if (config.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母');
  }

  if (config.requireNumbers && !/\d/.test(password)) {
    errors.push('密码必须包含数字');
  }

  if (config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码必须包含特殊字符');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// 检查文件类型是否安全
const isFileTypeAllowed = (filename, mimetype) => {
  const config = securityConfig.upload;
  
  // 检查MIME类型
  if (!config.allowedMimeTypes.includes(mimetype)) {
    return false;
  }

  // 检查文件扩展名
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  if (!config.allowedExtensions.includes(ext)) {
    return false;
  }

  return true;
};

// 清理敏感数据（用于日志）
const sanitizeForLogging = (data) => {
  if (!securityConfig.logging.maskSensitiveData) {
    return data;
  }

  const sanitized = JSON.parse(JSON.stringify(data));
  const sensitiveFields = securityConfig.logging.sensitiveFields;

  const maskValue = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        maskValue(obj[key]);
      } else if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        obj[key] = '***';
      }
    }
  };

  if (typeof sanitized === 'object') {
    maskValue(sanitized);
  }

  return sanitized;
};

module.exports = {
  config: securityConfig,
  validatePasswordStrength,
  isFileTypeAllowed,
  sanitizeForLogging
};
