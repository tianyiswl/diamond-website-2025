#!/usr/bin/env node

// 🌏 时区测试脚本

console.log('🌏 时区测试结果:');
console.log('================');
console.log('process.env.TZ:', process.env.TZ);
console.log('当前时间:', new Date().toString());
console.log('UTC时间:', new Date().toUTCString());
console.log('上海时间:', new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
console.log('时区偏移:', new Date().getTimezoneOffset(), '分钟');
console.log('Intl时区:', Intl.DateTimeFormat().resolvedOptions().timeZone);

console.log('');
console.log('🕐 JWT时间戳测试:');
console.log('================');
const now = Math.floor(Date.now() / 1000);
const oneHourLater = now + 3600;

console.log('当前时间戳:', now);
console.log('当前时间:', new Date(now * 1000).toISOString());
console.log('1小时后时间戳:', oneHourLater);
console.log('1小时后时间:', new Date(oneHourLater * 1000).toISOString());

console.log('');
console.log('✅ 时区测试完成！');
