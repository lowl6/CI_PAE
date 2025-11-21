#!/bin/bash

echo "=== CI-PAE 分析页面局域网测试脚本 ==="
echo "本机IP: 10.47.179.167"
echo ""

# 测试分析页面的关键API
echo "1. 测试城市列表API..."
cities_response=$(curl -s -X GET "http://10.47.179.167:3001/api/analysis/cities")
if [[ $cities_response == *"乌兰察布市"* ]]; then
    echo "✅ 城市列表API正常"
else
    echo "❌ 城市列表API异常"
fi

echo ""
echo "2. 测试指标树API..."
indicators_response=$(curl -s -X GET "http://10.47.179.167:3001/api/analysis/indicators/tree")
if [[ $indicators_response == *"经济指标"* ]]; then
    echo "✅ 指标树API正常"
else
    echo "❌ 指标树API异常"
fi

echo ""
echo "3. 测试县区列表API..."
counties_response=$(curl -s -X GET "http://10.47.179.167:3001/api/analysis/counties?city=呼和浩特市")
if [[ $counties_response == *"county_id"* ]]; then
    echo "✅ 县区列表API正常"
else
    echo "❌ 县区列表API异常"
fi

echo ""
echo "4. 测试政策类型API..."
policy_response=$(curl -s -X GET "http://10.47.179.167:3001/api/analysis/policy-types")
if [[ $policy_response == *"]"* ]] || [[ $policy_response == *"[]"* ]]; then
    echo "✅ 政策类型API正常"
else
    echo "❌ 政策类型API异常"
fi

echo ""
echo "5. 服务状态检查..."
echo "后端服务状态:"
curl -s "http://10.47.179.167:3001/api/data/summary" >/dev/null && echo "✅ 后端正常运行" || echo "❌ 后端异常"

echo "前端服务状态:"
curl -s "http://10.47.179.167:5174" >/dev/null && echo "✅ 前端正常运行" || echo "❌ 前端异常"

echo ""
echo "=== 局域网设备测试步骤 ==="
echo "在其他设备上执行以下步骤："
echo "1. 访问: http://10.47.179.167:5174"
echo "2. 登录或注册账号"
echo "3. 点击'深度分析'页面"
echo "4. 检查是否能看到城市下拉列表"
echo "5. 检查是否能看到指标树"
echo "6. 选择城市后检查县区是否正常加载"
echo ""
echo "7. 如果还有问题："
echo "   - 清除浏览器缓存"
echo "   - 按F12查看控制台错误"
echo "   - 按F12查看网络请求地址"
echo "   - 确认网络请求指向 10.47.179.167:3001"

echo ""
echo "=== 修复内容总结 ==="
echo "✅ 修复了 account.js 的baseURL配置"
echo "✅ 修复了 analysis.js 的baseURL配置"
echo "✅ 添加了环境变量支持（lan模式）"
echo "✅ 添加了token认证拦截器"
echo "✅ 完善了CORS配置"