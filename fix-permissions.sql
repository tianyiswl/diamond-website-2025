-- Diamond Website 权限修复脚本
-- 无锡皇德国际贸易有限公司

-- 连接到diamond_website数据库
\c diamond_website

-- 授予diamond_user对public模式的完整权限
GRANT ALL ON SCHEMA public TO diamond_user;

-- 授予对现有表的权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO diamond_user;

-- 授予对现有序列的权限
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO diamond_user;

-- 授予对现有函数的权限
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO diamond_user;

-- 设置默认权限，确保新创建的对象也有权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO diamond_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO diamond_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO diamond_user;

-- 确保diamond_user可以创建表
ALTER USER diamond_user CREATEDB;

-- 显示模式权限
\echo '📋 模式权限信息:'
\dn+

-- 显示用户权限
\echo '👤 用户权限信息:'
\du

\echo '✅ 权限修复完成！'
\echo '🚀 现在可以运行: npm run db:push'

-- 退出
\q
