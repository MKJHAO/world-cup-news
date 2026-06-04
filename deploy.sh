#!/bin/bash
# 世界杯足球资讯APP - 一键部署脚本
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

APP_DIR="$HOME/football"
NODE_VERSION="18"
NODE_PREFIX="/usr/local/lib/nodejs/node-v${NODE_VERSION}.20.0-linux-x64"
PORT=3001

echo "========================================"
echo "  世界杯足球资讯APP - 服务器部署"
echo "========================================"
echo ""

# ====== 1. 检测系统 ======
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    err "无法检测操作系统"
fi
log "检测到系统: $OS ($VERSION_ID)"

# ====== 2. 安装 Node.js ======
install_node() {
    if command -v node &>/dev/null; then
        CURRENT=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$CURRENT" -ge "$NODE_VERSION" ]; then
            log "Node.js 已安装: $(node -v)"
            return
        fi
    fi

    warn "正在安装 Node.js ${NODE_VERSION}..."

    case $OS in
        ubuntu|debian)
            curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
            sudo apt-get install -y nodejs
            ;;
        centos|rhel|fedora)
            curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | sudo bash -
            sudo yum install -y nodejs --nogpgcheck 2>/dev/null || sudo dnf install -y nodejs --nogpgcheck
            ;;
        tencentos|alinux|opencloudos)
            if [ ! -f "${NODE_PREFIX}/bin/node" ]; then
                NODE_TAR="node-v${NODE_VERSION}.20.0-linux-x64.tar.xz"
                wget -q "https://nodejs.org/dist/v${NODE_VERSION}.20.0/$NODE_TAR" -O /tmp/$NODE_TAR
                sudo mkdir -p /usr/local/lib/nodejs
                sudo tar -xJf /tmp/$NODE_TAR -C /usr/local/lib/nodejs
                sudo ln -sf ${NODE_PREFIX}/bin/node /usr/bin/node
                sudo ln -sf ${NODE_PREFIX}/bin/npm /usr/bin/npm
                sudo ln -sf ${NODE_PREFIX}/bin/npx /usr/bin/npx
                rm -f /tmp/$NODE_TAR
            fi
            ;;
        *)
            err "不支持的系统: $OS。请手动安装 Node.js 18+"
            ;;
    esac

    log "Node.js 安装完成: $(node -v)"
    log "npm 版本: $(npm -v)"
}

install_node

# ====== 3. 安装 PM2 ======
export PATH="${NODE_PREFIX}/bin:$PATH"

if [ ! -f "${NODE_PREFIX}/bin/pm2" ]; then
    warn "正在安装 PM2..."
    npm install -g pm2
    log "PM2 安装完成"
else
    log "PM2 已安装"
fi

# ====== 4. 创建目录并解压 ======
mkdir -p "$APP_DIR"

DEPLOY_TAR=""
for f in "$HOME/football-deploy.tar.gz" /tmp/football-deploy.tar.gz ./football-deploy.tar.gz; do
    [ -f "$f" ] && DEPLOY_TAR="$f" && break
done

if [ -z "$DEPLOY_TAR" ]; then
    err "找不到 football-deploy.tar.gz"
fi

log "解压部署包到 $APP_DIR..."
tar -xzf "$DEPLOY_TAR" -C "$APP_DIR"

# ====== 5. 安装依赖 ======
cd "$APP_DIR/server"
log "安装服务端依赖..."
npm install --omit=dev

# ====== 6. 配置防火墙 ======
warn "配置防火墙，开放端口 $PORT..."

if command -v ufw &>/dev/null; then
    sudo ufw allow $PORT/tcp 2>/dev/null || true
    log "ufw 已放行端口 $PORT"
elif command -v firewall-cmd &>/dev/null; then
    sudo firewall-cmd --permanent --add-port=$PORT/tcp 2>/dev/null || true
    sudo firewall-cmd --reload 2>/dev/null || true
    log "firewalld 已放行端口 $PORT"
fi

echo ""
echo "  ⚠️  重要：请登录腾讯云控制台 → 安全组，添加入站规则：TCP ${PORT}"
echo ""

# ====== 7. 启动服务 ======
log "启动服务..."
cd "$APP_DIR/server"

${NODE_PREFIX}/bin/pm2 delete football-server 2>/dev/null || true
${NODE_PREFIX}/bin/pm2 start src/index.js --name football-server --time
${NODE_PREFIX}/bin/pm2 save

# 设置开机自启
${NODE_PREFIX}/bin/pm2 startup systemd -u "$USER" --hp "$HOME" 2>/dev/null || \
${NODE_PREFIX}/bin/pm2 startup upstart -u "$USER" --hp "$HOME" 2>/dev/null || \
warn "无法自动配置开机自启，请手动运行: pm2 startup"

log "服务已启动！"

# ====== 8. 验证 ======
sleep 3
if ${NODE_PREFIX}/bin/pm2 list | grep -q "football-server.*online"; then
    log "服务运行正常"
else
    warn "服务可能未正常启动，查看日志: pm2 logs football-server"
fi

# ====== 9. 输出信息 ======
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")
echo ""
echo "========================================"
echo "  部署完成！"
echo "========================================"
echo ""
echo "  前端页面:  http://${SERVER_IP}:${PORT}"
echo "  API地址:   http://${SERVER_IP}:${PORT}/api"
echo "  健康检查:  http://${SERVER_IP}:${PORT}/api/health"
echo ""
echo "  管理命令:"
echo "    pm2 status"
echo "    pm2 logs football-server"
echo "    pm2 restart football-server"
echo "    pm2 stop football-server"
echo ""
echo "  APK构建 .env 配置:"
echo "    VITE_API_BASE_URL=http://${SERVER_IP}:${PORT}"
echo ""
echo "========================================"
