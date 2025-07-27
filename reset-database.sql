-- Diamond Website 数据库重置脚本
-- 无锡皇德国际贸易有限公司
-- 警告：此脚本将删除现有数据库和用户！

-- 断开所有连接到diamond_website数据库的连接
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'diamond_website' AND pid <> pg_backend_pid();

-- 删除现有数据库
DROP DATABASE IF EXISTS diamond_website;

-- 删除现有用户
DROP USER IF EXISTS diamond_user;

-- 创建新的数据库
CREATE DATABASE diamond_website;

-- 创建新用户
CREATE USER diamond_user WITH PASSWORD 'diamond_secure_2025';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE diamond_website TO diamond_user;
ALTER USER diamond_user CREATEDB;

-- 显示结果
\echo '✅ 数据库重置完成！'
\echo '📋 创建的资源：'
\l
\echo '👤 用户列表：'
\du

-- 退出
\q
