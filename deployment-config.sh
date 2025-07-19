#!/bin/bash

# 馃敡 閽荤煶缃戠珯閮ㄧ讲閰嶇疆鏂囦欢
# 璇峰湪鎵ц閮ㄧ讲鑴氭湰鍓嶄慨鏀逛互涓嬮厤缃弬鏁?
# ==================== 鍩虹閰嶇疆 ====================

# 鍩熷悕閰嶇疆锛堝繀椤讳慨鏀癸級
DOMAIN="your-domain.com"                    # 涓诲煙鍚?WWW_DOMAIN="www.your-domain.com"           # WWW鍩熷悕

# 绠＄悊鍛樹俊鎭紙蹇呴』淇敼锛?ADMIN_EMAIL="admin@your-domain.com"        # 绠＄悊鍛橀偖绠憋紙鐢ㄤ簬SSL璇佷功鍜屽憡璀︼級
ADMIN_NAME="閽荤煶缃戠珯绠＄悊鍛?                 # 绠＄悊鍛樺鍚?
# 搴旂敤閰嶇疆
APP_NAME="diamond-website"                 # 搴旂敤鍚嶇О
APP_PORT="3001"                           # 搴旂敤绔彛
NODE_ENV="production"                     # 杩愯鐜

# ==================== 鏈嶅姟鍣ㄩ厤缃?====================

# 搴旂敤鐩綍
APP_DIR="/opt/diamond-website"            # 搴旂敤瀹夎鐩綍
LOG_DIR="/var/log/diamond-monitor"        # 鏃ュ織鐩綍
BACKUP_DIR="/opt/backups"                 # 澶囦唤鐩綍

# 绯荤粺鐢ㄦ埛
APP_USER="www-data"                       # 搴旂敤杩愯鐢ㄦ埛
APP_GROUP="www-data"                      # 搴旂敤杩愯鐢ㄦ埛缁?
# ==================== 瀹夊叏閰嶇疆 ====================

# JWT閰嶇疆
JWT_SECRET=\${JWT_SECRET:-}  # JWT瀵嗛挜锛堝缓璁慨鏀癸級
JWT_EXPIRES="24h"                         # JWT杩囨湡鏃堕棿

# 瀵嗙爜鍔犲瘑
BCRYPT_ROUNDS="12"                        # bcrypt鍔犲瘑杞暟

# 浼氳瘽閰嶇疆
SESSION_TIMEOUT="86400000"                # 浼氳瘽瓒呮椂鏃堕棿锛堟绉掞級

# ==================== 鎬ц兘閰嶇疆 ====================

# 缂撳瓨閰嶇疆
CACHE_TTL="300000"                        # 缂撳瓨TTL锛?鍒嗛挓锛?STATIC_CACHE_TTL="31536000"               # 闈欐€佽祫婧愮紦瀛楾TL锛?骞达級

# 鏂囦欢涓婁紶閰嶇疆
UPLOAD_MAX_SIZE="10485760"                # 鏈€澶т笂浼犳枃浠跺ぇ灏忥紙10MB锛?ALLOWED_FILE_TYPES="jpg,jpeg,png,gif,webp,pdf"  # 鍏佽鐨勬枃浠剁被鍨?
# 闄愭祦閰嶇疆
RATE_LIMIT_WINDOW="900000"                # 闄愭祦绐楀彛鏃堕棿锛?5鍒嗛挓锛?RATE_LIMIT_MAX="100"                      # 涓€鑸姹傞檺鍒?API_RATE_LIMIT_MAX="50"                   # API璇锋眰闄愬埗
ADMIN_RATE_LIMIT_MAX="20"                 # 绠＄悊鍚庡彴璇锋眰闄愬埗

# ==================== 鐩戞帶閰嶇疆 ====================

# 鍛婅闃堝€?ALERT_THRESHOLD_CPU="80"                  # CPU浣跨敤鐜囧憡璀﹂槇鍊硷紙%锛?ALERT_THRESHOLD_MEMORY="80"               # 鍐呭瓨浣跨敤鐜囧憡璀﹂槇鍊硷紙%锛?ALERT_THRESHOLD_DISK="85"                 # 纾佺洏浣跨敤鐜囧憡璀﹂槇鍊硷紙%锛?ALERT_THRESHOLD_LOAD="2.0"                # 绯荤粺璐熻浇鍛婅闃堝€?
# 鐩戞帶闂撮殧
MONITOR_INTERVAL="300"                    # 鐩戞帶妫€鏌ラ棿闅旓紙绉掞級
REPORT_INTERVAL="21600"                   # 鎶ュ憡鐢熸垚闂撮殧锛?灏忔椂锛?
# ==================== 澶囦唤閰嶇疆 ====================

# 澶囦唤绛栫暐
BACKUP_RETENTION_DAYS="7"                 # 澶囦唤淇濈暀澶╂暟
BACKUP_TIME="02:00"                       # 澶囦唤鎵ц鏃堕棿

# 澶囦唤鍐呭
BACKUP_DATA="true"                        # 鏄惁澶囦唤鏁版嵁鏂囦欢
BACKUP_UPLOADS="true"                     # 鏄惁澶囦唤涓婁紶鏂囦欢
BACKUP_LOGS="false"                       # 鏄惁澶囦唤鏃ュ織鏂囦欢

# ==================== SSL閰嶇疆 ====================

# SSL璇佷功閰嶇疆
SSL_EMAIL="$ADMIN_EMAIL"                  # SSL璇佷功鐢宠閭
SSL_RENEWAL_DAYS="30"                     # 璇佷功缁湡鎻愬墠澶╂暟

# ==================== 閭欢閰嶇疆锛堝彲閫夛級====================

# SMTP閰嶇疆锛堝鏋滈渶瑕侀偖浠堕€氱煡鍔熻兘锛?SMTP_HOST="smtp.your-email-provider.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="noreply@your-domain.com"
SMTP_PASSWORD=\${SMTP_PASSWORD:-}
FROM_EMAIL="noreply@your-domain.com"
FROM_NAME="鏃犻敗鐨囧痉鍥介檯璐告槗鏈夐檺鍏徃"

# ==================== 鏁版嵁搴撻厤缃?====================

# 褰撳墠浣跨敤JSON鏂囦欢瀛樺偍锛屽鏋滃皢鏉ラ渶瑕佽縼绉诲埌鏁版嵁搴?DB_TYPE="file"                            # 鏁版嵁搴撶被鍨嬶細file/mysql/postgresql
DB_PASSWORD=\${DB_PASSWORD:-}
# ==================== CDN閰嶇疆锛堝彲閫夛級====================

# CDN閰嶇疆锛堝鏋滀娇鐢–DN鍔犻€燂級
CDN_ENABLED="false"                       # 鏄惁鍚敤CDN
CDN_URL="https://cdn.your-domain.com"     # CDN鍩熷悕
CDN_PROVIDER="cloudflare"                 # CDN鎻愪緵鍟?
# ==================== 绗笁鏂规湇鍔￠厤缃紙鍙€夛級====================

# Google Analytics锛堝鏋滈渶瑕侊級
GOOGLE_ANALYTICS_ID=""                    # GA璺熻釜ID

# Google Maps锛堝鏋滈渶瑕侊級
GOOGLE_MAPS_API_KEY=\${GOOGLE_MAPS_API_KEY:-}                    # Google Maps API瀵嗛挜

# ==================== 寮€鍙戦厤缃?====================

# 璋冭瘯閰嶇疆
DEBUG_MODE="false"                        # 鏄惁鍚敤璋冭瘯妯″紡
LOG_LEVEL="info"                         # 鏃ュ織绾у埆锛歟rror/warn/info/debug

# 鏃跺尯閰嶇疆
TIMEZONE="Asia/Shanghai"                  # 鏈嶅姟鍣ㄦ椂鍖?
# ==================== 楠岃瘉鍑芥暟 ====================

# 楠岃瘉閰嶇疆鏄惁姝ｇ‘
validate_config() {
    local errors=0
    
    echo "馃攳 楠岃瘉閰嶇疆鍙傛暟..."
    
    # 妫€鏌ュ繀濉」
    if [[ "$DOMAIN" == "your-domain.com" ]]; then
        echo "鉂?閿欒: 璇蜂慨鏀?DOMAIN 涓烘偍鐨勫疄闄呭煙鍚?
        errors=$((errors + 1))
    fi
    
    if [[ "$ADMIN_EMAIL" == "admin@your-domain.com" ]]; then
        echo "鉂?閿欒: 璇蜂慨鏀?ADMIN_EMAIL 涓烘偍鐨勫疄闄呴偖绠?
        errors=$((errors + 1))
    fi
    
    if [[ -z "$JWT_SECRET" ]]; then
        echo "鈿狅笍  璀﹀憡: 寤鸿淇敼 JWT_SECRET 涓烘洿瀹夊叏鐨勫瘑閽?
    fi
    
    # 妫€鏌ュ煙鍚嶆牸寮?    if [[ ! "$DOMAIN" =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]; then
        echo "鉂?閿欒: DOMAIN 鏍煎紡涓嶆纭?
        errors=$((errors + 1))
    fi
    
    # 妫€鏌ラ偖绠辨牸寮?    if [[ ! "$ADMIN_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        echo "鉂?閿欒: ADMIN_EMAIL 鏍煎紡涓嶆纭?
        errors=$((errors + 1))
    fi
    
    if [ $errors -eq 0 ]; then
        echo "鉁?閰嶇疆楠岃瘉閫氳繃"
        return 0
    else
        echo "鉂?鍙戠幇 $errors 涓厤缃敊璇紝璇蜂慨姝ｅ悗閲嶈瘯"
        return 1
    fi
}

# 鏄剧ず閰嶇疆鎽樿
show_config_summary() {
    echo ""
    echo "馃搵 閰嶇疆鎽樿锛?
    echo "鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹?
    echo "馃寪 鍩熷悕: $DOMAIN"
    echo "馃摟 绠＄悊鍛橀偖绠? $ADMIN_EMAIL"
    echo "馃搧 搴旂敤鐩綍: $APP_DIR"
    echo "馃敀 JWT瀵嗛挜: ${JWT_SECRET:0:20}..."
    echo "鈿?缂撳瓨TTL: $((CACHE_TTL / 1000))绉?
    echo "馃搳 CPU鍛婅闃堝€? $ALERT_THRESHOLD_CPU%"
    echo "馃捑 澶囦唤淇濈暀: $BACKUP_RETENTION_DAYS澶?
    echo "鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹佲攣鈹?
    echo ""
}

# 鐢熸垚鐜鍙橀噺鏂囦欢
generate_env_file() {
    local env_file="$APP_DIR/.env"
    
    echo "馃摑 鐢熸垚鐜鍙橀噺鏂囦欢: $env_file"
    
    cat > "$env_file" << EOF
# 馃攼 閽荤煶缃戠珯鐢熶骇鐜閰嶇疆
# 鑷姩鐢熸垚浜? $(date)

# 搴旂敤鍩烘湰閰嶇疆
NODE_ENV=$NODE_ENV
PORT=$APP_PORT
APP_NAME=$APP_NAME
APP_VERSION=1.0.0

# 鍩熷悕閰嶇疆
DOMAIN=$DOMAIN
BASE_URL=https://$DOMAIN

# 瀹夊叏閰嶇疆
JWT_SECRET=$JWT_SECRET
BCRYPT_ROUNDS=$BCRYPT_ROUNDS
SESSION_TIMEOUT=$SESSION_TIMEOUT

# 鏁版嵁搴撻厤缃?DB_TYPE=$DB_TYPE
DB_PATH=./data

# 鏂囦欢涓婁紶閰嶇疆
UPLOAD_MAX_SIZE=$UPLOAD_MAX_SIZE
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=$ALLOWED_FILE_TYPES

# 閭欢閰嶇疆
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_SECURE=$SMTP_SECURE
SMTP_USER=$SMTP_USER
SMTP_PASSWORD=\${SMTP_PASSWORD:-}
FROM_EMAIL=$FROM_EMAIL
FROM_NAME=$FROM_NAME

# 鏃ュ織閰嶇疆
LOG_LEVEL=$LOG_LEVEL
LOG_FILE=./logs/app.log
ERROR_LOG_FILE=./logs/error.log

# 缂撳瓨閰嶇疆
CACHE_TTL=$CACHE_TTL
STATIC_CACHE_TTL=$STATIC_CACHE_TTL

# 闄愭祦閰嶇疆
RATE_LIMIT_WINDOW=$RATE_LIMIT_WINDOW
RATE_LIMIT_MAX=$RATE_LIMIT_MAX
API_RATE_LIMIT_MAX=$API_RATE_LIMIT_MAX
ADMIN_RATE_LIMIT_MAX=$ADMIN_RATE_LIMIT_MAX

# 鐩戞帶閰嶇疆
HEALTH_CHECK_ENDPOINT=/api/health
METRICS_ENDPOINT=/api/metrics

# 瀹夊叏澶撮厤缃?SECURITY_HEADERS_ENABLED=true
CORS_ORIGIN=https://$DOMAIN
CSP_ENABLED=true

# 鎬ц兘閰嶇疆
COMPRESSION_ENABLED=true
COMPRESSION_LEVEL=6
STATIC_GZIP_ENABLED=true

# 鏃跺尯閰嶇疆
TZ=$TIMEZONE
NODE_TZ=$TIMEZONE

# 澶囦唤閰嶇疆
BACKUP_ENABLED=true
BACKUP_INTERVAL=86400000
BACKUP_RETENTION_DAYS=$BACKUP_RETENTION_DAYS
BACKUP_PATH=./backups

# CDN閰嶇疆
CDN_ENABLED=$CDN_ENABLED
CDN_URL=$CDN_URL

# 绗笁鏂规湇鍔?GOOGLE_ANALYTICS_ID=$GOOGLE_ANALYTICS_ID
GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY
EOF

    echo "鉁?鐜鍙橀噺鏂囦欢鐢熸垚瀹屾垚"
}

# 濡傛灉鐩存帴鎵ц姝よ剼鏈紝鏄剧ず閰嶇疆淇℃伅
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "馃敡 閽荤煶缃戠珯閮ㄧ讲閰嶇疆"
    echo "===================="
    echo ""
    echo "璇风紪杈戞鏂囦欢涓殑閰嶇疆鍙傛暟锛岀劧鍚庤繍琛岄儴缃茶剼鏈€?
    echo ""
    echo "涓昏闇€瑕佷慨鏀圭殑鍙傛暟锛?
    echo "鈥?DOMAIN: 鎮ㄧ殑鍩熷悕"
    echo "鈥?ADMIN_EMAIL: 绠＄悊鍛橀偖绠?
    echo "鈥?JWT_SECRET: JWT瀵嗛挜"
    echo ""
    echo "淇敼瀹屾垚鍚庯紝杩愯浠ヤ笅鍛戒护楠岃瘉閰嶇疆锛?
    echo "source deployment-config.sh && validate_config"
    echo ""
    echo "鐒跺悗鎵ц閮ㄧ讲鑴氭湰锛?
    echo "./quick-deploy-optimized.sh"
fi
