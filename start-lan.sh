#!/bin/bash

# CI-PAE 局域网部署启动脚本
# 版本: 1.0.0
# 描述: 快速启动局域网开发环境

echo "=== CI-PAE 局域网部署启动脚本 ==="
echo "版本: v1.0.0"
echo "本机IP: 10.47.179.167"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查防火墙状态
echo -e "${BLUE}1. 检查防火墙状态...${NC}"
if command -v ufw >/dev/null 2>&1; then
    sudo ufw status
elif command -v firewall-cmd >/dev/null 2>&1; then
    sudo firewall-cmd --list-all
else
    echo -e "${YELLOW}未检测到防火墙管理工具${NC}"
fi

echo ""
echo -e "${BLUE}2. 如果防火墙阻止了端口，请运行：${NC}"
echo -e "   ${YELLOW}sudo ufw allow 3001  # 后端端口${NC}"
echo -e "   ${YELLOW}sudo ufw allow 5174  # 前端端口${NC}"

echo ""
echo -e "${BLUE}3. 启动服务：${NC}"
echo -e "   ${GREEN}启动后端:${NC} cd backend && npm run dev"
echo -e "   ${GREEN}启动前端:${NC} cd frontend && npm run dev -- --host 0.0.0.0 --mode lan"

echo ""
echo -e "${BLUE}4. 访问地址：${NC}"
echo -e "   ${GREEN}本机访问:${NC} http://localhost:5174"
echo -e "   ${GREEN}局域网访问:${NC} http://10.47.179.167:5174"
echo -e "   ${GREEN}后端API:${NC} http://10.47.179.167:3001"

echo ""
echo -e "${BLUE}5. 测试API：${NC}"
echo -e "   ${YELLOW}curl http://10.47.179.167:3001/api/data/summary${NC}"

echo ""
echo -e "${GREEN}=== 快速启动命令 ===${NC}"
echo "后端:"
echo "  cd backend && npm run dev"
echo ""
echo "前端:"
echo "  cd frontend && npm run dev -- --host 0.0.0.0 --mode lan"

echo ""
echo -e "${GREEN}=== 故障排除 ===${NC}"
echo "如果遇到问题，请参考文档:"
echo "  - 部署指南: ./docs/DEPLOYMENT.md"
echo "  - 开发指南: ./docs/DEVELOPMENT.md"
echo "  - 问题反馈: https://github.com/lowl6/CI_PAE/issues"
