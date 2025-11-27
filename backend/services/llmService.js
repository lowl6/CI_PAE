require('dotenv').config();
const { OpenAI } = require('openai');
const { getPool } = require('../config/db'); // 导入真实数据库连接池

// 初始化客户端 (保持不变)
const client = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
});

// 政策数据常量
const POLICY_DATA = [
  {
    policy_id: 'POL001',
    policy_name: '武川县马铃薯种薯繁育基地建设补贴实施方案',
    policy_type: '农业产业扶持',
    department: '武川县农牧业局',
    issue_date: '2016-03-15',
    implementation_date: '2016-04-01',
    status: '已完成',
    summary: '针对建档立卡贫困户种植高产马铃薯提供种薯补贴和技术指导，旨在提升亩产值。',
    coverage_counties: ['武川县']
  },
  {
    policy_id: 'POL002',
    policy_name: '林西县健康扶贫"兜底保障"工程实施细则',
    policy_type: '医疗保障',
    department: '林西县卫生健康委员会',
    issue_date: '2017-05-20',
    implementation_date: '2017-06-01',
    status: '执行中',
    summary: '为贫困人口购买补充商业医疗保险，将慢性病门诊报销比例提高至90%以上，解决因病致贫问题。',
    coverage_counties: ['林西县']
  },
  {
    policy_id: 'POL003',
    policy_name: '阿尔山市"旅游+扶贫"生态农家乐奖补办法',
    policy_type: '产业发展',
    department: '阿尔山市文化旅游体育局',
    issue_date: '2018-02-10',
    implementation_date: '2018-03-01',
    status: '已完成',
    summary: '鼓励贫困户利用自家房屋改造为特色民宿或农家乐，政府提供装修补贴和经营培训。',
    coverage_counties: ['阿尔山市']
  },
  {
    policy_id: 'POL004',
    policy_name: '扎赉特旗农村牧区饮水安全巩固提升工程方案',
    policy_type: '基础设施建设',
    department: '扎赉特旗水利局',
    issue_date: '2018-04-05',
    implementation_date: '2018-05-01',
    status: '已完成',
    summary: '重点解决偏远嘎查村季节性缺水和水质氟超标问题，建设集中供水站和管网入户。',
    coverage_counties: ['扎赉特旗']
  },
  {
    policy_id: 'POL005',
    policy_name: '科右中旗蒙古族刺绣非遗传承与技能培训计划',
    policy_type: '教育与文化',
    department: '科右中旗文化馆',
    issue_date: '2019-01-15',
    implementation_date: '2019-02-01',
    status: '执行中',
    summary: '设立刺绣扶贫车间，对贫困妇女进行免费刺绣技能培训，并回购成品，实现居家就业。',
    coverage_counties: ['科右中旗']
  },
  {
    policy_id: 'POL006',
    policy_name: '化德县服装加工产业园区招商引资及就业补贴政策',
    policy_type: '工业招商',
    department: '化德县工业和信息化局',
    issue_date: '2017-08-08',
    implementation_date: '2017-09-01',
    status: '执行中',
    summary: '利用京蒙对口帮扶资金建设服装加工园，对吸纳贫困人口就业的企业给予税收优惠和工资补贴。',
    coverage_counties: ['化德县']
  },
  {
    policy_id: 'POL007',
    policy_name: '全区建档立卡贫困劳动力转移就业交通补贴办法',
    policy_type: '社会保障与就业',
    department: '内蒙古自治区人力资源和社会保障厅',
    issue_date: '2019-02-20',
    implementation_date: '2019-03-01',
    status: '已完成',
    summary: '对跨盟市务工的贫困劳动力提供一次性交通补贴，鼓励外出务工增收。',
    coverage_counties: ['全区范围']
  },
  {
    policy_id: 'POL008',
    policy_name: '卓资县特色熏鸡产业发展基金管理办法',
    policy_type: '经济发展',
    department: '卓资县财政局',
    issue_date: '2018-06-10',
    implementation_date: '2018-07-01',
    status: '执行中',
    summary: '设立专项基金支持熏鸡产业链上下游企业，带动贫困户参与养殖和加工环节。',
    coverage_counties: ['卓资县']
  },
  {
    policy_id: 'POL009',
    policy_name: '赤峰市易地扶贫搬迁后续产业扶持指导意见',
    policy_type: '人口与户籍',
    department: '赤峰市乡村振兴局',
    issue_date: '2017-03-12',
    implementation_date: '2017-04-01',
    status: '已完成',
    summary: '针对巴林左旗、巴林右旗等地搬迁人口，在安置点配套建设设施农业产业园，确保搬得出、稳得住。',
    coverage_counties: ['巴林左旗', '巴林右旗']
  },
  {
    policy_id: 'POL010',
    policy_name: '锡林郭勒盟草原生态补奖机制与脱贫攻坚衔接方案',
    policy_type: '生态经济',
    department: '锡林郭勒盟林草局',
    issue_date: '2018-05-05',
    implementation_date: '2018-06-01',
    status: '执行中',
    summary: '在苏尼特右旗等地聘用贫困人口为生态护林员，实现生态保护与脱贫增收双赢。',
    coverage_counties: ['苏尼特右旗']
  },
  {
    policy_id: 'POL011',
    policy_name: '通辽市"互联网+农产品"电商扶贫三年行动计划',
    policy_type: '工业投资贸易',
    department: '通辽市商务局',
    issue_date: '2019-08-20',
    implementation_date: '2019-09-01',
    status: '执行中',
    summary: '支持库伦旗、奈曼旗建设县级电商服务中心，打通杂粮杂豆上行渠道。',
    coverage_counties: ['库伦旗', '奈曼旗']
  }
];

// =================================================================
// 1. 新的"规划"提示词 (使用你的完整 Schema)
// =================================================================
const PLANNER_SYSTEM_PROMPT = `你是一个数据分析规划师。你的任务是分析用户的查询和数据库结构，然后以 JSON 格式输出一个清晰的"查询计划"。

### 政策数据参考:
${JSON.stringify(POLICY_DATA, null, 2)}

### 数据库结构 (Schema):
${"```sql"}
-- 县基础信息表
CREATE TABLE \`counties\` (
  \`county_id\` VARCHAR(50) NOT NULL COMMENT 'CountyID - 县唯一标识',
  \`county_name\` VARCHAR(100) NOT NULL COMMENT 'CountyName - 县名',
  \`city\` VARCHAR(50) DEFAULT NULL COMMENT '所属市',
  \`province\` VARCHAR(50) DEFAULT NULL COMMENT '所属省',
  \`is_poverty_alleviated\` TINYINT(1) DEFAULT 0 COMMENT '是否脱贫',
  \`alleviation_year\` INT DEFAULT NULL COMMENT '脱贫年份'
);

-- 经济指标
CREATE TABLE \`economic_indicators\` (
  \`county_id\` VARCHAR(50) NOT NULL COMMENT '[FK]',
  \`year\` INT NOT NULL COMMENT '年份',
  \`gdp\` DECIMAL(20,4) DEFAULT NULL COMMENT '地区生产总值(亿元)',
  \`public_budget_income\` DECIMAL(20,4) DEFAULT NULL COMMENT '一般公共预算收入(万元)',
  \`disp_income_rural\` DECIMAL(20,4) DEFAULT NULL COMMENT '农村牧区常住居民人均可支配收入(元)'
);

-- 农业指标
CREATE TABLE \`agriculture_indicators\` (
  \`county_id\` VARCHAR(50) NOT NULL COMMENT '[FK]',
  \`year\` INT NOT NULL COMMENT '年份',
  \`arable_land\` DECIMAL(20,4) DEFAULT NULL COMMENT '耕地面积(公顷)',
  \`grain_yield\` DECIMAL(20,4) DEFAULT NULL COMMENT '粮食产量(吨)'
);

-- 访谈数据 (定性)
CREATE TABLE \`interview_data\` (
  \`data_id\` VARCHAR(50) NOT NULL,
  \`content\` LONGTEXT COMMENT '访谈内容',
  \`keywords\` VARCHAR(255) DEFAULT NULL COMMENT '关键词',
  \`experience_summary\` TEXT COMMENT '脱贫经验总结',
  \`event_id\` VARCHAR(50) NOT NULL COMMENT '[FK]'
);

-- 访谈事件 (定性)
CREATE TABLE \`interview_events\` (
  \`event_id\` VARCHAR(50) NOT NULL,
  \`location\` VARCHAR(255) DEFAULT NULL COMMENT '访谈地点',
  \`event_date\` DATE DEFAULT NULL COMMENT '访谈日期',
  \`topic\` VARCHAR(255) DEFAULT NULL COMMENT '访谈主题'
);

-- 受访者 (定性)
CREATE TABLE \`interviewees\` (
  \`interviewee_id\` VARCHAR(50) NOT NULL,
  \`name\` VARCHAR(100) DEFAULT NULL COMMENT '姓名',
  \`identity\` VARCHAR(50) DEFAULT NULL COMMENT '身份',
  \`county_id\` VARCHAR(50) DEFAULT NULL COMMENT '[FK]'
);

-- 调研者 (定性)
CREATE TABLE \`researchers\` (
  \`researcher_id\` VARCHAR(50) NOT NULL,
  \`name\` VARCHAR(100) DEFAULT NULL COMMENT '姓名',
  \`role\` VARCHAR(50) DEFAULT NULL COMMENT '角色'
);

-- 政策表
CREATE TABLE \`policies\` (
  \`policy_id\` VARCHAR(50) NOT NULL,
  \`policy_name\` VARCHAR(255) NOT NULL COMMENT '政策名称',
  \`policy_type\` VARCHAR(50) DEFAULT NULL COMMENT '政策类型',
  \`issue_date\` DATE DEFAULT NULL COMMENT '颁布日期'
);

DROP TABLE IF EXISTS  \`policy_resources \`;
CREATE TABLE  \`policy_resources \` (
   \`resource_id \` VARCHAR(50) NOT NULL COMMENT 'PolicyIndicatorID - 主键',
   \`policy_id \` VARCHAR(50) NOT NULL COMMENT 'PolicyID [FK]',
   \`indicator_name \` VARCHAR(100) DEFAULT NULL COMMENT '指标名称',
   \`category \` VARCHAR(50) DEFAULT NULL COMMENT '指标类别',
   \`description \` TEXT COMMENT '指标描述',
   \`unit \` VARCHAR(50) DEFAULT NULL COMMENT '计量单位',
   \`source \` VARCHAR(100) DEFAULT NULL COMMENT '数据来源',
   \`impact_level \` VARCHAR(50) DEFAULT NULL COMMENT '影响程度',
   \`related_field \` VARCHAR(100) DEFAULT NULL COMMENT '关联领域',
  PRIMARY KEY ( \`resource_id \`),
  INDEX  \`idx_category \` ( \`category \`),
  CONSTRAINT  \`fk_resource_policy \` FOREIGN KEY ( \`policy_id \`) REFERENCES  \`policies \` ( \`policy_id \`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='政策投入资源表';

-- ===============================
-- 访谈调研相关表
-- ===============================

DROP TABLE IF EXISTS  \`interviewees \`;
CREATE TABLE  \`interviewees \` (
   \`interviewee_id \` VARCHAR(50) NOT NULL COMMENT 'IntervieweeID',
   \`name \` VARCHAR(100) DEFAULT NULL COMMENT '姓名',
   \`unit \` VARCHAR(100) DEFAULT NULL COMMENT '单位',
   \`identity \` VARCHAR(50) DEFAULT NULL COMMENT '身份',
   \`county_id \` VARCHAR(50) DEFAULT NULL COMMENT 'CountyID [FK]',
  PRIMARY KEY ( \`interviewee_id \`),
  CONSTRAINT  \`fk_interviewee_county \` FOREIGN KEY ( \`county_id \`) REFERENCES  \`counties \` ( \`county_id \`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='受访者表';

DROP TABLE IF EXISTS  \`interview_events \`;
CREATE TABLE  \`interview_events \` (
   \`event_id \` VARCHAR(50) NOT NULL COMMENT 'EventID',
   \`location \` VARCHAR(255) DEFAULT NULL COMMENT '访谈地点',
   \`event_date \` DATE DEFAULT NULL COMMENT '访谈日期',
   \`topic \` VARCHAR(255) DEFAULT NULL COMMENT '访谈主题',
  PRIMARY KEY ( \`event_id \`),
  INDEX  \`idx_event_date \` ( \`event_date \`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='访谈事件表';

DROP TABLE IF EXISTS  \`interview_data \`;
CREATE TABLE  \`interview_data \` (
   \`data_id \` VARCHAR(50) NOT NULL COMMENT 'DataID',
   \`content \` LONGTEXT COMMENT '访谈内容',
   \`keywords \` VARCHAR(255) DEFAULT NULL COMMENT '关键词',
   \`experience_summary \` TEXT COMMENT '脱贫经验总结',
   \`event_id \` VARCHAR(50) NOT NULL COMMENT 'EventID [FK]',
  PRIMARY KEY ( \`data_id \`),
  CONSTRAINT  \`fk_data_event \` FOREIGN KEY ( \`event_id \`) REFERENCES  \`interview_events \` ( \`event_id \`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='访谈数据表';

DROP TABLE IF EXISTS  \`researchers \`;
CREATE TABLE  \`researchers \` (
   \`researcher_id \` VARCHAR(50) NOT NULL COMMENT 'ResearcherID',
   \`name \` VARCHAR(100) DEFAULT NULL COMMENT '姓名',
   \`unit \` VARCHAR(100) DEFAULT NULL COMMENT '单位',
   \`role \` VARCHAR(50) DEFAULT NULL COMMENT '角色',
  PRIMARY KEY ( \`researcher_id \`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='调研者表';

-- ===============================
-- 关联表（多对多关系）
-- ===============================

DROP TABLE IF EXISTS  \`rel_interviewee_event \`;
CREATE TABLE  \`rel_interviewee_event \` (
   \`interviewee_id \` VARCHAR(50) NOT NULL COMMENT 'IntervieweeID [FK]',
   \`event_id \` VARCHAR(50) NOT NULL COMMENT 'EventID [FK]',
   \`role \` VARCHAR(50) DEFAULT NULL COMMENT '参与角色',
  PRIMARY KEY ( \`interviewee_id \`,  \`event_id \`),
  CONSTRAINT  \`fk_rel_ie_interviewee \` FOREIGN KEY ( \`interviewee_id \`) REFERENCES  \`interviewees \` ( \`interviewee_id \`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT  \`fk_rel_ie_event \` FOREIGN KEY ( \`event_id \`) REFERENCES  \`interview_events \` ( \`event_id \`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='受访者与访谈事件关联表';

DROP TABLE IF EXISTS  \`rel_data_researcher \`;
CREATE TABLE  \`rel_data_researcher \` (
   \`data_id \` VARCHAR(50) NOT NULL COMMENT 'DataID [FK]',
   \`researcher_id \` VARCHAR(50) NOT NULL COMMENT 'ResearcherID [FK]',
   \`collection_role \` VARCHAR(50) DEFAULT NULL COMMENT '收集角色',
  PRIMARY KEY ( \`data_id \`,  \`researcher_id \`),
  CONSTRAINT  \`fk_rel_dr_data \` FOREIGN KEY ( \`data_id \`) REFERENCES  \`interview_data \` ( \`data_id \`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT  \`fk_rel_dr_researcher \` FOREIGN KEY ( \`researcher_id \`) REFERENCES  \`researchers \` ( \`researcher_id \`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='访谈数据与调研者关联表';

DROP TABLE IF EXISTS  \`rel_policy_county \`;
CREATE TABLE  \`rel_policy_county \` (
   \`policy_id \` VARCHAR(50) NOT NULL COMMENT 'PolicyID [FK]',
   \`county_id \` VARCHAR(50) NOT NULL COMMENT 'CountyID [FK]',
  PRIMARY KEY ( \`policy_id \`,  \`county_id \`),
  CONSTRAINT  \`fk_rpc_policy \` FOREIGN KEY ( \`policy_id \`) REFERENCES  \`policies \` ( \`policy_id \`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT  \`fk_rpc_county \` FOREIGN KEY ( \`county_id \`) REFERENCES  \`counties \` ( \`county_id \`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='政策与县关联表';

SET FOREIGN_KEY_CHECKS = 1;
${"```"}

### 任务:
根据用户查询，返回一个 JSON 对象，包含 'analysis' (分析)、'tables_needed' (所需表) 和 'relevant_policies' (相关政策) 三个键。

### 规则:
1.  **分析 (analysis):** 详细说明为了回答问题，你需要哪些数据，以及这些数据在哪些表里。
2.  **所需表 (tables_needed):** 列出所有需要查询的表名。
3.  **相关政策 (relevant_policies):** 根据用户问题，识别相关的政策。返回政策ID、政策名称和相关度说明。如果问题涉及具体县区，返回该县区实施的政策。
4.  **政策效果分析:** 如果用户询问政策效果，应考虑对比政策实施前后的指标变化，或与其他非政策覆盖县进行对比分析。
5.  **定性数据:** 如果用户提到"访谈"、"经验"、"政策"或"原因"，你必须在计划中包含 \`interview_data\`, \`policies\` 等相关定性表。
6.  **权限 (TODO):** (这是一个占位符，未来可以实现) 假设用户是 'admin'，可以访问所有表。

### 示例:
用户查询: "武川县马铃薯种薯补贴政策实施后对当地经济有什么影响？"
你的输出:
{
  "analysis": "我需要查询武川县的 'county_id'，找到相关的马铃薯种薯补贴政策(POL001)，然后对比政策实施前(2016年前)和实施后(2016年后)的经济指标变化，主要包括GDP、农村居民人均可支配收入和农业产量。同时查询相关访谈记录了解政策实施的具体效果和群众反馈。",
  "tables_needed": ["counties", "economic_indicators", "agriculture_indicators", "policies", "rel_policy_county", "interview_data", "interview_events"],
  "relevant_policies": [
    {
      "policy_id": "POL001",
      "policy_name": "武川县马铃薯种薯繁育基地建设补贴实施方案",
      "relevance": "直接针对武川县的马铃薯产业扶持政策，2016年4月实施，符合用户询问的政策内容和地域范围"
    }
  ]
}`;

// =================================================================
// 2. 新的“SQL生成”提示词
// =================================================================
const SQL_GENERATOR_SYSTEM_PROMPT = `你是一名 MySQL 专家和政策数据分析师。你的任务是根据"查询计划"和"数据库结构"，生成一个单一、高效、可执行的 \`SELECT\` 语句来回答用户最初的问题。

### 政策数据参考:
${JSON.stringify(POLICY_DATA, null, 2)}

### 数据库结构:
### 数据库结构 (Schema):
${"```sql"}
-- 县基础信息表
CREATE TABLE \`counties\` (
  \`county_id\` VARCHAR(50) NOT NULL COMMENT 'CountyID - 县唯一标识',
  \`county_name\` VARCHAR(100) NOT NULL COMMENT 'CountyName - 县名',
  \`city\` VARCHAR(50) DEFAULT NULL COMMENT '所属市',
  \`province\` VARCHAR(50) DEFAULT NULL COMMENT '所属省',
  \`is_poverty_alleviated\` TINYINT(1) DEFAULT 0 COMMENT '是否脱贫',
  \`alleviation_year\` INT DEFAULT NULL COMMENT '脱贫年份'
);

-- 经济指标
CREATE TABLE \`economic_indicators\` (
  \`county_id\` VARCHAR(50) NOT NULL COMMENT '[FK]',
  \`year\` INT NOT NULL COMMENT '年份',
  \`gdp\` DECIMAL(20,4) DEFAULT NULL COMMENT '地区生产总值(亿元)',
  \`public_budget_income\` DECIMAL(20,4) DEFAULT NULL COMMENT '一般公共预算收入(万元)',
  \`disp_income_rural\` DECIMAL(20,4) DEFAULT NULL COMMENT '农村牧区常住居民人均可支配收入(元)'
);

-- 农业指标
CREATE TABLE \`agriculture_indicators\` (
  \`county_id\` VARCHAR(50) NOT NULL COMMENT '[FK]',
  \`year\` INT NOT NULL COMMENT '年份',
  \`arable_land\` DECIMAL(20,4) DEFAULT NULL COMMENT '耕地面积(公顷)',
  \`grain_yield\` DECIMAL(20,4) DEFAULT NULL COMMENT '粮食产量(吨)'
);

-- 访谈数据 (定性)
CREATE TABLE \`interview_data\` (
  \`data_id\` VARCHAR(50) NOT NULL,
  \`content\` LONGTEXT COMMENT '访谈内容',
  \`keywords\` VARCHAR(255) DEFAULT NULL COMMENT '关键词',
  \`experience_summary\` TEXT COMMENT '脱贫经验总结',
  \`event_id\` VARCHAR(50) NOT NULL COMMENT '[FK]'
);

-- 访谈事件 (定性)
CREATE TABLE \`interview_events\` (
  \`event_id\` VARCHAR(50) NOT NULL,
  \`location\` VARCHAR(255) DEFAULT NULL COMMENT '访谈地点',
  \`event_date\` DATE DEFAULT NULL COMMENT '访谈日期',
  \`topic\` VARCHAR(255) DEFAULT NULL COMMENT '访谈主题'
);

-- 受访者 (定性)
CREATE TABLE \`interviewees\` (
  \`interviewee_id\` VARCHAR(50) NOT NULL,
  \`name\` VARCHAR(100) DEFAULT NULL COMMENT '姓名',
  \`identity\` VARCHAR(50) DEFAULT NULL COMMENT '身份',
  \`county_id\` VARCHAR(50) DEFAULT NULL COMMENT '[FK]'
);

-- 调研者 (定性)
CREATE TABLE \`researchers\` (
  \`researcher_id\` VARCHAR(50) NOT NULL,
  \`name\` VARCHAR(100) DEFAULT NULL COMMENT '姓名',
  \`role\` VARCHAR(50) DEFAULT NULL COMMENT '角色'
);

-- 政策表
CREATE TABLE \`policies\` (
  \`policy_id\` VARCHAR(50) NOT NULL,
  \`policy_name\` VARCHAR(255) NOT NULL COMMENT '政策名称',
  \`policy_type\` VARCHAR(50) DEFAULT NULL COMMENT '政策类型',
  \`issue_date\` DATE DEFAULT NULL COMMENT '颁布日期'
);

DROP TABLE IF EXISTS  \`policy_resources \`;
CREATE TABLE  \`policy_resources \` (
   \`resource_id \` VARCHAR(50) NOT NULL COMMENT 'PolicyIndicatorID - 主键',
   \`policy_id \` VARCHAR(50) NOT NULL COMMENT 'PolicyID [FK]',
   \`indicator_name \` VARCHAR(100) DEFAULT NULL COMMENT '指标名称',
   \`category \` VARCHAR(50) DEFAULT NULL COMMENT '指标类别',
   \`description \` TEXT COMMENT '指标描述',
   \`unit \` VARCHAR(50) DEFAULT NULL COMMENT '计量单位',
   \`source \` VARCHAR(100) DEFAULT NULL COMMENT '数据来源',
   \`impact_level \` VARCHAR(50) DEFAULT NULL COMMENT '影响程度',
   \`related_field \` VARCHAR(100) DEFAULT NULL COMMENT '关联领域',
  PRIMARY KEY ( \`resource_id \`),
  INDEX  \`idx_category \` ( \`category \`),
  CONSTRAINT  \`fk_resource_policy \` FOREIGN KEY ( \`policy_id \`) REFERENCES  \`policies \` ( \`policy_id \`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='政策投入资源表';

-- ===============================
-- 访谈调研相关表
-- ===============================

DROP TABLE IF EXISTS  \`interviewees \`;
CREATE TABLE  \`interviewees \` (
   \`interviewee_id \` VARCHAR(50) NOT NULL COMMENT 'IntervieweeID',
   \`name \` VARCHAR(100) DEFAULT NULL COMMENT '姓名',
   \`unit \` VARCHAR(100) DEFAULT NULL COMMENT '单位',
   \`identity \` VARCHAR(50) DEFAULT NULL COMMENT '身份',
   \`county_id \` VARCHAR(50) DEFAULT NULL COMMENT 'CountyID [FK]',
  PRIMARY KEY ( \`interviewee_id \`),
  CONSTRAINT  \`fk_interviewee_county \` FOREIGN KEY ( \`county_id \`) REFERENCES  \`counties \` ( \`county_id \`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='受访者表';

DROP TABLE IF EXISTS  \`interview_events \`;
CREATE TABLE  \`interview_events \` (
   \`event_id \` VARCHAR(50) NOT NULL COMMENT 'EventID',
   \`location \` VARCHAR(255) DEFAULT NULL COMMENT '访谈地点',
   \`event_date \` DATE DEFAULT NULL COMMENT '访谈日期',
   \`topic \` VARCHAR(255) DEFAULT NULL COMMENT '访谈主题',
  PRIMARY KEY ( \`event_id \`),
  INDEX  \`idx_event_date \` ( \`event_date \`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='访谈事件表';

DROP TABLE IF EXISTS  \`interview_data \`;
CREATE TABLE  \`interview_data \` (
   \`data_id \` VARCHAR(50) NOT NULL COMMENT 'DataID',
   \`content \` LONGTEXT COMMENT '访谈内容',
   \`keywords \` VARCHAR(255) DEFAULT NULL COMMENT '关键词',
   \`experience_summary \` TEXT COMMENT '脱贫经验总结',
   \`event_id \` VARCHAR(50) NOT NULL COMMENT 'EventID [FK]',
  PRIMARY KEY ( \`data_id \`),
  CONSTRAINT  \`fk_data_event \` FOREIGN KEY ( \`event_id \`) REFERENCES  \`interview_events \` ( \`event_id \`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='访谈数据表';

DROP TABLE IF EXISTS  \`researchers \`;
CREATE TABLE  \`researchers \` (
   \`researcher_id \` VARCHAR(50) NOT NULL COMMENT 'ResearcherID',
   \`name \` VARCHAR(100) DEFAULT NULL COMMENT '姓名',
   \`unit \` VARCHAR(100) DEFAULT NULL COMMENT '单位',
   \`role \` VARCHAR(50) DEFAULT NULL COMMENT '角色',
  PRIMARY KEY ( \`researcher_id \`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='调研者表';

-- ===============================
-- 关联表（多对多关系）
-- ===============================

DROP TABLE IF EXISTS  \`rel_interviewee_event \`;
CREATE TABLE  \`rel_interviewee_event \` (
   \`interviewee_id \` VARCHAR(50) NOT NULL COMMENT 'IntervieweeID [FK]',
   \`event_id \` VARCHAR(50) NOT NULL COMMENT 'EventID [FK]',
   \`role \` VARCHAR(50) DEFAULT NULL COMMENT '参与角色',
  PRIMARY KEY ( \`interviewee_id \`,  \`event_id \`),
  CONSTRAINT  \`fk_rel_ie_interviewee \` FOREIGN KEY ( \`interviewee_id \`) REFERENCES  \`interviewees \` ( \`interviewee_id \`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT  \`fk_rel_ie_event \` FOREIGN KEY ( \`event_id \`) REFERENCES  \`interview_events \` ( \`event_id \`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='受访者与访谈事件关联表';

DROP TABLE IF EXISTS  \`rel_data_researcher \`;
CREATE TABLE  \`rel_data_researcher \` (
   \`data_id \` VARCHAR(50) NOT NULL COMMENT 'DataID [FK]',
   \`researcher_id \` VARCHAR(50) NOT NULL COMMENT 'ResearcherID [FK]',
   \`collection_role \` VARCHAR(50) DEFAULT NULL COMMENT '收集角色',
  PRIMARY KEY ( \`data_id \`,  \`researcher_id \`),
  CONSTRAINT  \`fk_rel_dr_data \` FOREIGN KEY ( \`data_id \`) REFERENCES  \`interview_data \` ( \`data_id \`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT  \`fk_rel_dr_researcher \` FOREIGN KEY ( \`researcher_id \`) REFERENCES  \`researchers \` ( \`researcher_id \`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='访谈数据与调研者关联表';

DROP TABLE IF EXISTS  \`rel_policy_county \`;
CREATE TABLE  \`rel_policy_county \` (
   \`policy_id \` VARCHAR(50) NOT NULL COMMENT 'PolicyID [FK]',
   \`county_id \` VARCHAR(50) NOT NULL COMMENT 'CountyID [FK]',
  PRIMARY KEY ( \`policy_id \`,  \`county_id \`),
  CONSTRAINT  \`fk_rpc_policy \` FOREIGN KEY ( \`policy_id \`) REFERENCES  \`policies \` ( \`policy_id \`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT  \`fk_rpc_county \` FOREIGN KEY ( \`county_id \`) REFERENCES  \`counties \` ( \`county_id \`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='政策与县关联表';

SET FOREIGN_KEY_CHECKS = 1;
${"```"}

### 规则:
1.  **只返回SQL:** 你的回答必须以 \`SELECT\` 开头，不要包含任何解释、Markdown标记 (\`\`\`sql\`)。
2.  **JOIN**: 必须正确使用 \`JOIN\`。所有指标表都通过 \`county_id\` 关联 \`counties\` 表。
3.  **政策查询:** 如果查询涉及政策效果，使用 \`rel_policy_county\` 表关联政策与县，并考虑政策实施时间点进行前后对比分析。
4.  **时间对比:** 对于政策效果分析，应使用 \`CASE WHEN\` 语句对比政策实施前后的指标变化。
5.  **别名**: 必须使用表别名 (如 t1, t2) 来提高可读性。
6.  **省份**: 所有查询 \`counties\` 表时，必须默认加上 \`WHERE t1.province = '内蒙古自治区'\`。
7.  **定性查询**: 如果计划包含 \`interview_data\`，你需要 JOIN \`interview_events\`, \`interviewees\`, \`researchers\` 等表来获取完整的访谈信息 (内容, 主题, 受访者, 调研员, 日期)。
8.  **安全**: 绝对禁止 \`DROP\`, \`DELETE\`, \`UPDATE\`, \`INSERT\`。`;

// =================================================================
// 3. 新的“报告生成”提示词
// =================================================================
const REPORT_GENERATOR_SYSTEM_PROMPT = `你是一名数据分析专家和政策分析师。请根据用户的"原始查询"和 JSON 格式的"查询结果"，生成一份简洁、易懂、专业的分析报告 (使用 Markdown 格式)。

### 政策背景参考:
${JSON.stringify(POLICY_DATA, null, 2)}

### 规则:
1.  **突出重点:** 直接回答用户的问题，特别关注政策效果和影响。
2.  **政策分析:** 如果涉及政策查询，结合政策背景数据进行分析，说明政策目标、实施时间和覆盖范围。
3.  **数据引用:** 引用具体的指标数据来说明政策效果，如GDP增长、收入提升等。
4.  **引用定性数据:** 如果"查询结果"中包含访谈内容 (如 \`content\`, \`experience_summary\`)，你必须在报告中引用这些内容作为政策效果的例证或群众反馈。
5.  **归因:** 当引用访谈时，必须注明"受访者"、"调研员"和"日期"（如果数据中有）。
6.  **对比分析:** 如果可能，提供政策实施前后的对比，或与其他县区的对比。
7.  **格式:** 使用 Markdown (如加粗、列表) 来美化报告，使用表格展示数据。`;

// =================================================================
// 核心服务类
// =================================================================
class LLMService {

    // 统一的 LLM 调用函数
    async callLLM(systemPrompt, userPrompt) {
        console.log("=== 调用 LLM ===");
        console.log("System Prompt (head):", systemPrompt.substring(0, 100) + "...");

        const completion = await client.chat.completions.create({
            model: "qwen3-max", // 或你选择的模型
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ]
        });

        const content = completion.choices[0].message.content.trim();
        console.log("LLM 响应:", content);
        return content;
    }

    // 执行 SQL (保持不变)
    async executeQuery(sql, role) {
        try {
            console.log(`=== 正在执行SQL (Role: ${role}) ===`);
            const userPool = getPool(role);
            console.log("待执行SQL:", sql);
            if (!sql.trim().toLowerCase().startsWith('select')) {
                console.error("SQL 安全检查失败: 非 SELECT 语句");
                throw new Error("无效的查询操作。只允许执行 SELECT 语句。");
            }
            const [rows] = await userPool.query(sql);
            console.log("数据库查询成功, 行数:", rows.length);
            return { data: rows };
        } catch (error) {
            console.error("=== SQL执行失败 ===", error.message);
            return { error: `数据库查询失败: ${error.sqlMessage || error.message}` };
        }
    }

    // =================================================================
    // 新的“三阶段”处理流程
    // =================================================================
    async processQuery(userQuery, role = 'user') {
        let plan = {};
        let sql = "";
        let dbResult = {};
        let report = "";

        try {
            // --- 阶段 1: AI 生成查询计划 ---
            console.log("--- 阶段 1: 生成规划 ---");
            const planRaw = await this.callLLM(PLANNER_SYSTEM_PROMPT, userQuery);
            try {
                // 解析 AI 返回的 JSON 计划
                plan = JSON.parse(planRaw.replace(/```json/g, '').replace(/```/g, ''));
            } catch (e) {
                console.error("解析 Plan JSON 失败:", e.message);
                throw new Error("AI 规划步骤返回了无效的格式。");
            }

            // --- 阶段 2: AI 根据计划生成 SQL ---
            console.log("--- 阶段 2: 生成 SQL ---");
            const sqlPrompt = `原始查询: "${userQuery}"\n\n查询计划: ${JSON.stringify(plan)}`;
            // 注意：这里我们把完整的 Schema (在系统提示词中) 和刚生成的 Plan (在用户提示中) 都发给了 SQL 生成器
            sql = await this.callLLM(SQL_GENERATOR_SYSTEM_PROMPT.replace("(结构同上...)", PLANNER_SYSTEM_PROMPT), sqlPrompt);

            // --- 阶段 3: 执行 SQL ---
            console.log("--- 阶段 3: 执行 SQL ---");
            dbResult = await this.executeQuery(sql, role);

            // 检查 SQL 执行是否出错
            if (dbResult.error) {
                report = `数据库执行出错：\n${dbResult.error}`;
            } else {
                // --- 阶段 4: AI 总结报告 ---
                console.log("--- 阶段 4: 生成报告 ---");
                const reportPrompt = `原始查询: "${userQuery}"\n\n查询结果 (JSON): ${JSON.stringify(dbResult.data)}`;
                report = await this.callLLM(REPORT_GENERATOR_SYSTEM_PROMPT, reportPrompt);
            }

            // --- 阶段 5: 返回所有步骤的结果 ---
            return {
                plan: plan.analysis, // 规划文本
                sql: sql, // SQL 语句
                result: dbResult.data || [], // 表格数据
                report: report // 最终报告
            };

        } catch (error) {
            console.error("processQuery 核心错误:", error.message);
            // 将错误信息打包返回
            return {
                plan: plan.analysis || "规划失败",
                sql: sql || "SQL生成失败",
                result: [],
                report: `查询处理失败：${error.message}`
            };
        }
    }
}

module.exports = new LLMService();