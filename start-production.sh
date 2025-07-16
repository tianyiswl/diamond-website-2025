#!/bin/bash

# 钻石网站CMS生产环境启动脚本
echo "🚀 启动钻石网站CMS生产环境..."

# 设置环境变量
export NODE_ENV=production
export TZ=Asia/Shanghai
export PORT=3000

# 检查Node.js版本
echo "📋 检查Node.js版本..."
node_version=$(node -v | cut -d'v' -f2)
required_version="14.0.0"

if [ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" = "$required_version" ]; then 
    echo "✅ Node.js版本检查通过: $node_version"
else
    echo "❌ Node.js版本过低，需要 >= $required_version，当前版本: $node_version"
    exit 1
fi

# 检查必要目录
echo "📁 检查必要目录..."
directories=("data" "uploads" "assets" "admin" "pages")
for dir in "${directories[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "❌ 缺少必要目录: $dir"
        exit 1
    fi
    echo "✅ 目录检查通过: $dir"
done

# 检查数据文件
echo "📄 检查数据文件..."
data_files=("data/products.json" "data/categories.json" "data/company.json")
for file in "${data_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "⚠️  数据文件不存在，将自动创建: $file"
    else
        echo "✅ 数据文件检查通过: $file"
    fi
done

# 安装依赖
echo "📦 检查并安装依赖..."
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install --production
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
else
    echo "✅ 依赖包已存在"
fi

# 启动服务器
echo "🚀 启动服务器..."
echo "环境: $NODE_ENV"
echo "时区: $TZ"
echo "端口: $PORT"
echo ""

# 使用PM2启动（如果可用）
if command -v pm2 &> /dev/null; then
    echo "🔄 使用PM2启动服务..."
    pm2 start server.js --name diamond-website --env production
    pm2 save
    echo "✅ 服务已通过PM2启动"
    echo "📊 查看状态: pm2 status"
    echo "📋 查看日志: pm2 logs diamond-website"
else
    echo "🔄 直接启动Node.js服务..."
    node server.js
fi