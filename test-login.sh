#!/bin/bash

echo "=== CI-PAE 局域网登录测试脚本 ==="
echo "本机IP: 10.47.179.167"
echo ""

# 测试API连接
echo "1. 测试后端API连接..."
curl -X GET "http://10.47.179.167:3001/api/data/summary" \
  -H "Content-Type: application/json" \
  2>/dev/null | head -c 100
echo ""

echo ""
echo "2. 测试登录接口..."
# 测试登录接口（请替换为实际的用户名密码）
curl -X POST "http://10.47.179.167:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  2>/dev/null | jq . 2>/dev/null || echo "登录测试完成"

echo ""
echo "3. 检查服务状态..."
echo "后端服务状态:"
curl -s "http://10.47.179.167:3001/api/data/summary" >/dev/null && echo "✅ 后端正常运行" || echo "❌ 后端异常"

echo "前端服务状态:"
curl -s "http://10.47.179.167:5174" >/dev/null && echo "✅ 前端正常运行" || echo "❌ 前端异常"

echo ""
echo "4. 浏览器测试步骤："
echo "   1) 清除浏览器缓存和cookies"
echo "   2) 在其他设备访问: http://10.47.179.167:5174"
echo "   3) 尝试注册新用户"
echo "   4) 尝试登录"
echo "   5) 按F12查看网络请求是否正常"

echo ""
echo "5. 如果还有问题，请检查："
echo "   - 防火墙是否阻止了3001和5174端口"
echo "   - 浏览器控制台是否有错误信息"
echo "   - 网络请求的地址是否正确"