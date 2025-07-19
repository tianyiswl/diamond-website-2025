# 🔄 钻石网站生产环境安全更新指南

## 📋 更新前准备检查

### ✅ **环境状态确认**

```bash
# 1. 检查当前服务状态
pm2 status
systemctl status nginx
curl -I https://your-domain.com

# 2. 检查系统资源
free -h
df -h
top -bn1 | head -20

# 3. 记录当前版本信息
cd /opt/diamond-website
git log --oneline -5
npm list --depth=0
```

### ✅ **备份当前环境**

```bash
# 1. 创建完整备份
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p /opt/backups/pre-update-$BACKUP_DATE

# 2. 备份应用代码
cp -r /opt/diamond-website /opt/backups/pre-update-$BACKUP_DATE/

# 3. 备份数据文件
tar -czf /opt/backups/pre-update-$BACKUP_DATE/data-backup.tar.gz \
    /opt/diamond-website/data \
    /opt/diamond-website/uploads

# 4. 备份Nginx配置
cp /etc/nginx/sites-available/diamond-website \
   /opt/backups/pre-update-$BACKUP_DATE/nginx-config.backup

# 5. 记录当前Git提交
cd /opt/diamond-website
git rev-parse HEAD > /opt/backups/pre-update-$BACKUP_DATE/git-commit.txt

echo "✅ 备份完成: /opt/backups/pre-update-$BACKUP_DATE"
```

---

## 🚀 安全更新流程

### 第一步：本地代码准备

```bash
# 在本地Windows环境执行
cd f:\pycode\diamond-website-2025

# 1. 确保所有更改已提交
git status
git add .
git commit -m "feat: 添加智能缓存系统和性能优化 - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

# 2. 推送到远程仓库
git push origin main

# 3. 创建更新标签（便于回滚）
git tag -a v1.1.0 -m "智能缓存和性能优化版本"
git push origin v1.1.0
```

### 第二步：服务器端更新准备

```bash
# 1. 进入应用目录
cd /opt/diamond-website

# 2. 检查Git状态
git status
git remote -v

# 3. 获取最新代码信息（不更新）
git fetch origin

# 4. 查看即将更新的内容
git log HEAD..origin/main --oneline
git diff HEAD..origin/main --stat
```

### 第三步：执行零停机更新

```bash
#!/bin/bash
# 零停机更新脚本

echo "🔄 开始零停机更新..."

# 1. 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 2. 检查package.json是否有变化
if git diff HEAD~1 HEAD --name-only | grep -q "package.json"; then
    echo "📦 检测到依赖变化，更新依赖包..."
    npm install --production
else
    echo "📦 依赖包无变化，跳过安装"
fi

# 3. 检查配置文件
echo "🔧 检查配置文件..."
if [ ! -f ".env" ]; then
    echo "⚠️ 创建环境配置文件..."
    cp .env.production .env
fi

# 4. 语法检查
echo "🔍 执行语法检查..."
if ! node -c server.js; then
    echo "❌ 语法检查失败，停止更新"
    exit 1
fi

# 5. 重启应用（PM2会自动处理零停机）
echo "🔄 重启应用服务..."
pm2 reload diamond-website --update-env

# 6. 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 7. 健康检查
echo "🏥 执行健康检查..."
if curl -f http://localhost:3001/api/status > /dev/null 2>&1; then
    echo "✅ 应用更新成功"
else
    echo "❌ 应用启动失败，准备回滚..."
    pm2 restart diamond-website
    exit 1
fi

echo "🎉 更新完成！"
```

### 第四步：验证更新结果

```bash
# 1. 检查应用状态
pm2 status
pm2 logs diamond-website --lines 20

# 2. 检查新功能
curl http://localhost:3001/api/status
curl -I https://your-domain.com

# 3. 验证缓存功能
curl -w "@curl-format.txt" https://your-domain.com/api/products
# 第二次请求应该更快
curl -w "@curl-format.txt" https://your-domain.com/api/products

# 4. 检查内存使用
pm2 show diamond-website | grep memory

# 5. 验证关键功能
curl https://your-domain.com/api/categories
curl https://your-domain.com/admin/
```

---

## 📊 性能对比验证

### 创建性能测试脚本

```bash
# 创建性能对比脚本
cat > /tmp/performance-test.sh << 'EOF'
#!/bin/bash

echo "🚀 性能测试开始..."

# 测试首页加载时间
echo "测试首页性能..."
for i in {1..5}; do
    curl -w "第${i}次: %{time_total}s\n" -o /dev/null -s https://your-domain.com
done

# 测试API响应时间
echo "测试API性能..."
for i in {1..5}; do
    curl -w "第${i}次: %{time_total}s\n" -o /dev/null -s https://your-domain.com/api/products
done

# 测试缓存效果
echo "测试缓存性能..."
echo "首次请求（无缓存）:"
curl -w "时间: %{time_total}s\n" -o /dev/null -s https://your-domain.com/api/products
echo "第二次请求（有缓存）:"
curl -w "时间: %{time_total}s\n" -o /dev/null -s https://your-domain.com/api/products

echo "✅ 性能测试完成"
EOF

chmod +x /tmp/performance-test.sh
/tmp/performance-test.sh
```

---

## 🔙 快速回滚方案

### 方案一：Git回滚（推荐）

```bash
#!/bin/bash
# 快速回滚脚本

echo "🔙 开始回滚操作..."

# 1. 记录当前状态
CURRENT_COMMIT=$(git rev-parse HEAD)
echo "当前提交: $CURRENT_COMMIT"

# 2. 回滚到上一个版本
PREVIOUS_COMMIT=$(git rev-parse HEAD~1)
echo "回滚到: $PREVIOUS_COMMIT"

git reset --hard $PREVIOUS_COMMIT

# 3. 恢复依赖（如果需要）
npm install --production

# 4. 重启应用
pm2 reload diamond-website

# 5. 验证回滚
sleep 5
if curl -f http://localhost:3001/api/status > /dev/null 2>&1; then
    echo "✅ 回滚成功"
else
    echo "❌ 回滚失败，需要手动处理"
fi
```

### 方案二：备份恢复

```bash
#!/bin/bash
# 从备份恢复

BACKUP_DIR="/opt/backups/pre-update-$(date +%Y%m%d)_*"
LATEST_BACKUP=$(ls -td $BACKUP_DIR 2>/dev/null | head -1)

if [ -n "$LATEST_BACKUP" ]; then
    echo "🔙 从备份恢复: $LATEST_BACKUP"

    # 停止应用
    pm2 stop diamond-website

    # 恢复代码
    rm -rf /opt/diamond-website
    cp -r $LATEST_BACKUP/diamond-website /opt/

    # 恢复数据
    cd /opt/diamond-website
    tar -xzf $LATEST_BACKUP/data-backup.tar.gz --strip-components=3

    # 重启应用
    pm2 start diamond-website

    echo "✅ 备份恢复完成"
else
    echo "❌ 未找到备份文件"
fi
```

---

## 🛠️ 一键更新脚本

### 创建自动化更新脚本

```bash
cat > /usr/local/bin/diamond-update.sh << 'EOF'
#!/bin/bash

# 🔄 钻石网站一键安全更新脚本
# 包含备份、更新、验证、回滚功能

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="/opt/diamond-website"
BACKUP_DIR="/opt/backups"
APP_NAME="diamond-website"

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# 创建备份
create_backup() {
    log_step "创建更新前备份..."

    local backup_date=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/pre-update-$backup_date"

    mkdir -p "$backup_path"

    # 备份代码
    cp -r "$APP_DIR" "$backup_path/"

    # 备份数据
    tar -czf "$backup_path/data-backup.tar.gz" \
        "$APP_DIR/data" "$APP_DIR/uploads" 2>/dev/null || true

    # 记录Git提交
    cd "$APP_DIR"
    git rev-parse HEAD > "$backup_path/git-commit.txt"

    echo "$backup_path" > /tmp/diamond-last-backup
    log_info "备份完成: $backup_path"
}

# 执行更新
perform_update() {
    log_step "执行代码更新..."

    cd "$APP_DIR"

    # 检查Git状态
    if ! git status > /dev/null 2>&1; then
        log_error "不是Git仓库，无法更新"
        return 1
    fi

    # 拉取最新代码
    git fetch origin
    local changes=$(git log HEAD..origin/main --oneline | wc -l)

    if [ "$changes" -eq 0 ]; then
        log_info "代码已是最新版本"
        return 0
    fi

    log_info "发现 $changes 个新提交，开始更新..."

    # 更新代码
    git pull origin main

    # 检查依赖变化
    if git diff HEAD~$changes HEAD --name-only | grep -q "package.json"; then
        log_step "更新依赖包..."
        npm install --production
    fi

    # 语法检查
    if ! node -c server.js; then
        log_error "语法检查失败"
        return 1
    fi

    log_info "代码更新完成"
}

# 重启服务
restart_service() {
    log_step "重启应用服务..."

    # 使用PM2的零停机重启
    pm2 reload "$APP_NAME" --update-env

    # 等待启动
    sleep 5

    # 健康检查
    if curl -f http://localhost:3001/api/status > /dev/null 2>&1; then
        log_info "服务重启成功"
        return 0
    else
        log_error "服务启动失败"
        return 1
    fi
}

# 验证更新
verify_update() {
    log_step "验证更新结果..."

    # 检查PM2状态
    if ! pm2 show "$APP_NAME" | grep -q "online"; then
        log_error "应用未正常运行"
        return 1
    fi

    # 检查HTTP响应
    if ! curl -f https://your-domain.com > /dev/null 2>&1; then
        log_error "网站无法访问"
        return 1
    fi

    # 检查API
    if ! curl -f https://your-domain.com/api/products > /dev/null 2>&1; then
        log_error "API无法访问"
        return 1
    fi

    log_info "更新验证通过"
}

# 回滚操作
rollback() {
    log_warn "执行回滚操作..."

    local backup_path=$(cat /tmp/diamond-last-backup 2>/dev/null)

    if [ -z "$backup_path" ] || [ ! -d "$backup_path" ]; then
        log_error "未找到备份，尝试Git回滚..."
        cd "$APP_DIR"
        git reset --hard HEAD~1
        pm2 reload "$APP_NAME"
        return $?
    fi

    # 从备份恢复
    pm2 stop "$APP_NAME"
    rm -rf "$APP_DIR"
    cp -r "$backup_path/diamond-website" /opt/
    pm2 start "$APP_NAME"

    log_info "回滚完成"
}

# 主函数
main() {
    echo "🔄 钻石网站安全更新工具"
    echo "=========================="

    case "${1:-update}" in
        "update")
            create_backup
            if perform_update && restart_service && verify_update; then
                log_info "🎉 更新成功完成！"
            else
                log_error "更新失败，执行回滚..."
                rollback
            fi
            ;;
        "rollback")
            rollback
            ;;
        "backup")
            create_backup
            ;;
        "verify")
            verify_update
            ;;
        *)
            echo "用法: $0 [update|rollback|backup|verify]"
            ;;
    esac
}

main "$@"
EOF

chmod +x /usr/local/bin/diamond-update.sh
```

---

## 🎯 **简化更新流程总结**

### **日常更新（推荐流程）**

```bash
# 1. 一键安全更新
sudo /usr/local/bin/diamond-update.sh update

# 2. 如果更新失败，一键回滚
sudo /usr/local/bin/diamond-update.sh rollback
```

### **手动更新流程**

```bash
# 1. 创建备份
sudo /usr/local/bin/diamond-update.sh backup

# 2. 更新代码
cd /opt/diamond-website
git pull origin main
npm install --production  # 仅在package.json变化时执行

# 3. 零停机重启
pm2 reload diamond-website --update-env

# 4. 验证更新
curl https://your-domain.com
pm2 status
```

### **关键优势**

- ✅ **零停机更新**：PM2自动处理服务切换
- ✅ **自动备份**：更新前自动创建完整备份
- ✅ **快速回滚**：出现问题可立即恢复
- ✅ **健康检查**：自动验证更新结果
- ✅ **增量更新**：只更新变化的部分

这个方案专门针对您已部署的生产环境，无需重新执行完整部署脚本，确保服务连续性和数据安全。
