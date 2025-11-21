# API 接口文档

CI-PAE系统提供RESTful API接口，支持扶贫数据的查询、分析和智能处理。

## 📋 目录

- [基本信息](#基本信息)
- [认证机制](#认证机制)
- [通用响应格式](#通用响应格式)
- [错误处理](#错误处理)
- [接口列表](#接口列表)
- [请求示例](#请求示例)
- [SDK使用](#sdk使用)

## 🌐 基本信息

- **基础URL**: `http://localhost:3001/api` (开发环境)
- **基础URL**: `https://your-domain.com/api` (生产环境)
- **数据格式**: JSON
- **字符编码**: UTF-8
- **HTTP版本**: 1.1

## 🔐 认证机制

### Token认证

系统使用JWT Token进行身份认证，除了公开接口外，所有请求都需要在请求头中包含Token：

```http
Authorization: Bearer YOUR_TOKEN_HERE
```

### 获取Token

通过用户登录接口获取Token：

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

响应示例：
```json
{
  "ok": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "your_username",
      "role": "user"
    }
  }
}
```

## 📤 通用响应格式

### 成功响应

```json
{
  "ok": true,
  "data": {
    // 响应数据
  }
}
```

### 错误响应

```json
{
  "ok": false,
  "error": "错误信息描述"
}
```

### HTTP状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或Token无效 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 🚨 错误处理

### 错误代码说明

| 错误类型 | 错误信息 | HTTP状态码 | 解决方案 |
|---------|----------|-----------|----------|
| `INVALID_TOKEN` | 无效的Token | 401 | 重新登录获取新Token |
| `TOKEN_EXPIRED` | Token已过期 | 401 | 重新登录获取新Token |
| `INVALID_CREDENTIALS` | 用户名或密码错误 | 401 | 检查用户名密码 |
| `USER_EXISTS` | 用户名已存在 | 400 | 使用其他用户名 |
| `DATABASE_ERROR` | 数据库连接错误 | 500 | 联系系统管理员 |
| `VALIDATION_ERROR` | 参数验证失败 | 400 | 检查请求参数 |

## 📚 接口列表

### 1. 认证相关接口

#### 1.1 用户登录

用户登录获取访问Token。

```http
POST /api/auth/login
```

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**请求示例：**
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "123456"
}
```

**响应示例：**
```json
{
  "ok": true,
  "data": {
    "token": "dXNlcklkOjE1MjQ0NzY4MDAwMDA6dXNlcm5hbWU6YWRtaW4=",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
}
```

#### 1.2 用户注册

新用户注册账号。

```http
POST /api/auth/register
```

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 (3-20字符) |
| password | string | 是 | 密码 (6-20字符) |

**请求示例：**
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123"
}
```

#### 1.3 用户登出

用户登出，使当前Token失效。

```http
POST /api/auth/logout
Authorization: Bearer YOUR_TOKEN
```

### 2. 数据统计接口

#### 2.1 获取数据概览

获取系统的数据统计概览信息。

```http
GET /api/data/summary
Authorization: Bearer YOUR_TOKEN
```

**查询参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| period | string | 否 | 统计周期，默认"2015-2020" |

**请求示例：**
```http
GET /api/data/summary?period=2020-2024
Authorization: Bearer YOUR_TOKEN
```

**响应示例：**
```json
{
  "ok": true,
  "data": {
    "totalCount": 12345,
    "counties": 12,
    "period": "2020-2024",
    "lastUpdate": "2024-01-15T10:30:00Z"
  }
}
```

### 3. 地理区域接口

#### 3.1 获取城市列表

获取内蒙古自治区的城市列表。

```http
GET /api/analysis/cities
```

**响应示例：**
```json
{
  "ok": true,
  "data": [
    "乌兰察布市",
    "兴安盟",
    "呼伦贝尔市",
    "呼和浩特市",
    "赤峰市",
    "通辽市",
    "锡林郭勒盟"
  ]
}
```

#### 3.2 获取县区列表

获取指定城市的县区列表，如果不指定城市则返回所有县区。

```http
GET /api/analysis/counties?city=呼和浩特市
```

**查询参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| city | string | 否 | 城市名称 |

**响应示例：**
```json
{
  "ok": true,
  "data": [
    {
      "county_id": 1,
      "county_name": "新城区"
    },
    {
      "county_id": 2,
      "county_name": "回民区"
    },
    {
      "county_id": 3,
      "county_name": "玉泉区"
    }
  ]
}
```

#### 3.3 获取所有县区

获取内蒙古自治区的所有县区列表。

```http
GET /api/analysis/all-counties
```

### 4. 数据分析接口

#### 4.1 获取指标树

获取可用于分析的数据指标树结构。

```http
GET /api/analysis/indicators/tree
```

**响应示例：**
```json
{
  "ok": true,
  "data": [
    {
      "title": "经济指标",
      "key": "economic",
      "children": [
        {
          "title": "地区生产总值",
          "key": "gdp",
          "meta": {
            "unit": "亿元",
            "table": "economic_indicators"
          }
        },
        {
          "title": "一般公共预算收入",
          "key": "public_budget_income",
          "meta": {
            "unit": "万元",
            "table": "economic_indicators"
          }
        }
      ]
    },
    {
      "title": "农业指标",
      "key": "agriculture",
      "children": [
        {
          "title": "耕地面积",
          "key": "arable_land",
          "meta": {
            "unit": "公顷",
            "table": "agriculture_indicators"
          }
        }
      ]
    }
  ]
}
```

#### 4.2 获取分析数据

根据指定条件获取分析数据。

```http
POST /api/analysis/data
Authorization: Bearer YOUR_TOKEN
```

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| city | string | 是 | 城市名称 |
| countyId | number | 是 | 县区ID |
| startYear | number | 是 | 开始年份 |
| endYear | number | 是 | 结束年份 |
| indicators | string | 是 | 指标键值，逗号分隔 |

**请求示例：**
```http
POST /api/analysis/data
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "city": "呼和浩特市",
  "countyId": 1,
  "startYear": 2019,
  "endYear": 2023,
  "indicators": "gdp,public_budget_income,disp_income_total"
}
```

**响应示例：**
```json
{
  "ok": true,
  "data": {
    "metadata": {
      "city": "呼和浩特市",
      "countyName": "新城区",
      "countyId": 1,
      "years": [2019, 2020, 2021, 2022, 2023]
    },
    "indicators": {
      "gdp": {
        "name": "地区生产总值",
        "unit": "亿元",
        "data": [120.5, 125.8, 132.1, 138.7, 145.2]
      },
      "public_budget_income": {
        "name": "一般公共预算收入",
        "unit": "万元",
        "data": [8500, 9200, 10100, 11200, 12500]
      },
      "disp_income_total": {
        "name": "全体居民人均可支配收入",
        "unit": "元",
        "data": [32000, 34500, 37200, 40100, 43200]
      }
    }
  }
}
```

#### 4.3 导出CSV数据

将分析数据导出为CSV文件。

```http
GET /api/analysis/export/csv?city=呼和浩特市&countyId=1&startYear=2019&endYear=2023&indicators=gdp,public_budget_income
Authorization: Bearer YOUR_TOKEN
```

**响应：**
返回CSV文件的二进制数据，可直接下载。

### 5. 智能查询接口

#### 5.1 自然语言查询

使用自然语言查询扶贫相关数据和信息。

```http
POST /api/nlp/query
Authorization: Bearer YOUR_TOKEN
```

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| query | string | 是 | 自然语言查询文本 |
| context | object | 否 | 查询上下文信息 |

**请求示例：**
```http
POST /api/nlp/query
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "query": "呼和浩特市2023年的GDP是多少？",
  "context": {
    "region": "呼和浩特市",
    "year": 2023
  }
}
```

**响应示例：**
```json
{
  "ok": true,
  "data": {
    "answer": "呼和浩特市2023年的地区生产总值(GDP)为145.2亿元。",
    "confidence": 0.95,
    "dataSource": "economic_indicators",
    "relatedData": {
      "gdp": 145.2,
      "unit": "亿元",
      "year": 2023,
      "region": "呼和浩特市"
    },
    "suggestions": [
      "呼伦贝尔市的GDP如何？",
      "呼和浩特市历年GDP变化趋势",
      "内蒙古各市GDP对比"
    ]
  }
}
```

### 6. 政策管理接口

#### 6.1 获取政策类型

获取所有政策类型列表。

```http
GET /api/analysis/policy-types
```

**响应示例：**
```json
{
  "ok": true,
  "data": [
    "产业扶贫",
    "教育扶贫",
    "健康扶贫",
    "就业扶贫",
    "金融扶贫",
    "社会保障扶贫"
  ]
}
```

#### 6.2 获取政策列表

根据条件获取政策列表。

```http
GET /api/policies?city=呼和浩特市&type=产业扶贫&page=1&limit=10
```

**查询参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| city | string | 否 | 城市名称 |
| type | string | 否 | 政策类型 |
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认10 |

### 7. 仪表盘接口

#### 7.1 获取仪表盘数据

获取仪表盘展示的核心数据。

```http
GET /api/dashboard/overview
Authorization: Bearer YOUR_TOKEN
```

**响应示例：**
```json
{
  "ok": true,
  "data": {
    "summary": {
      "totalCounties": 12,
      "totalPolicies": 156,
      "dataUpdateDate": "2024-01-15"
    },
    "topRegions": [
      {
        "name": "呼和浩特市",
        "gdp": 145.2,
        "growth": 5.2
      },
      {
        "name": "包头市",
        "gdp": 98.7,
        "growth": 4.8
      }
    ],
    "recentPolicies": [
      {
        "id": 1,
        "title": "关于进一步加强产业扶贫工作的实施意见",
        "type": "产业扶贫",
        "publishDate": "2024-01-10"
      }
    ]
  }
}
```

## 💻 SDK使用

### JavaScript SDK

```javascript
// 安装SDK
// npm install ci-pae-sdk

import { CIAPI } from 'ci-pae-sdk';

// 初始化客户端
const client = new CIAPI({
  baseURL: 'http://localhost:3001/api',
  token: 'YOUR_TOKEN_HERE'
});

// 获取城市列表
const cities = await client.analysis.getCities();
console.log('城市列表:', cities);

// 获取分析数据
const analysisData = await client.analysis.getData({
  city: '呼和浩特市',
  countyId: 1,
  startYear: 2019,
  endYear: 2023,
  indicators: 'gdp,public_budget_income'
});

// 自然语言查询
const nlpResult = await client.nlp.query({
  query: '呼和浩特市2023年的GDP是多少？'
});
```

### Python SDK

```python
# 安装SDK
# pip install ci-pae-sdk

from ci_pae_sdk import CIAPI

# 初始化客户端
client = CIAPI(
    base_url='http://localhost:3001/api',
    token='YOUR_TOKEN_HERE'
)

# 获取城市列表
cities = client.analysis.get_cities()
print('城市列表:', cities)

# 获取分析数据
analysis_data = client.analysis.get_data(
    city='呼和浩特市',
    county_id=1,
    start_year=2019,
    end_year=2023,
    indicators='gdp,public_budget_income'
)

# 自然语言查询
nlp_result = client.nlp.query(
    query='呼和浩特市2023年的GDP是多少？'
)
```

## 🔄 版本管理

### API版本控制

- **v1.0**: 当前稳定版本
- **v2.0**: 开发中版本（暂未发布）

在请求头中指定版本：

```http
Accept: application/vnd.ci-pae.v1+json
```

### 版本变更日志

**v1.1 (计划中):**
- 新增批量数据导出接口
- 优化NLP查询性能
- 添加数据缓存机制

## 📞 技术支持

- **API文档**: [https://docs.ci-pae.com/api](https://docs.ci-pae.com/api)
- **问题反馈**: [GitHub Issues](https://github.com/lowl6/CI_PAE/issues)
- **技术支持**: api-support@ci-pae.com

---

**最后更新**: 2024年1月XX日
**当前版本**: v1.0.0