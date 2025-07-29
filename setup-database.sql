-- Diamond Website 数据库设置脚本
-- 无锡皇德国际贸易有限公司

-- 创建数据库
CREATE DATABASE diamond_website;

-- 创建用户
CREATE USER diamond_user WITH PASSWORD 'diamond_secure_2025';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE diamond_website TO diamond_user;
ALTER USER diamond_user CREATEDB;

-- 显示创建的数据库
\l

-- 显示用户
\du

-- 退出
\q
