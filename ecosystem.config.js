// PM2 生态系统配置文件
// 确保应用在正确的端口(3001)上运行

module.exports = {
  apps: [{
    name: 'diamond-website',
    script: 'server.js',
    
    // 环境变量配置
    env: {
      NODE_ENV: 'development',
      PORT: 3001,
      TZ: 'Asia/Shanghai',
      NODE_TZ: 'Asia/Shanghai'
    },
    
    // 生产环境配置
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      TZ: 'Asia/Shanghai',
      NODE_TZ: 'Asia/Shanghai'
    },
    
    // PM2 配置
    instances: 1,
    exec_mode: 'fork',
    
    // 自动重启配置
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    
    // 日志配置
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // 其他配置
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // 健康检查
    health_check_grace_period: 3000,
    
    // 进程管理
    min_uptime: '10s',
    max_restarts: 10,
    
    // 集群配置（如果需要）
    // instances: 'max',
    // exec_mode: 'cluster'
  }],

  // 部署配置（可选）
  deploy: {
    production: {
      user: 'diamond',
      host: 'your-server-ip',
      ref: 'origin/master',
      repo: 'https://github.com/tianyiswl/diamond-website-2025.git',
      path: '/opt/diamond-website',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
