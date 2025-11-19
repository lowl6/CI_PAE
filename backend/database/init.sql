-- CI-PAE 数据库初始化脚本（832工程系统）
-- 创建数据库
CREATE DATABASE IF NOT EXISTS ci_pae DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE ci_pae;

-- 用户认证表
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户认证表';

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ===============================
-- 核心实体表
-- ===============================

DROP TABLE IF EXISTS `counties`;
CREATE TABLE `counties` (
  `county_id` VARCHAR(50) NOT NULL COMMENT 'CountyID - 县唯一标识',
  `county_name` VARCHAR(100) NOT NULL COMMENT 'CountyName - 县名',
  `admin_code` VARCHAR(20) DEFAULT NULL COMMENT '行政区划代码',
  `city` VARCHAR(50) DEFAULT NULL COMMENT '所属市',
  `province` VARCHAR(50) DEFAULT NULL COMMENT '所属省',
  `is_poverty_alleviated` TINYINT(1) DEFAULT 0 COMMENT '是否脱贫 (0:否, 1:是)',
  `alleviation_year` INT DEFAULT NULL COMMENT '脱贫年份',
  PRIMARY KEY (`county_id`),
  INDEX `idx_province` (`province`),
  INDEX `idx_city` (`city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='基础县级信息表';

-- ===============================
-- 经济与社会发展指标表
-- ===============================

DROP TABLE IF EXISTS `economic_indicators`;
CREATE TABLE `economic_indicators` (
  `county_id` VARCHAR(50) NOT NULL COMMENT 'CountyID [FK]',
  `year` INT NOT NULL COMMENT 'Year - 年份',
  `gdp` DECIMAL(20,4) DEFAULT NULL COMMENT '地区生产总值(亿元)',
  `gdp_primary` DECIMAL(20,4) DEFAULT NULL COMMENT '地区生产总值_第一产业(亿元)',
  `gdp_secondary` DECIMAL(20,4) DEFAULT NULL COMMENT '地区生产总值_第二产业(亿元)',
  `gdp_tertiary` DECIMAL(20,4) DEFAULT NULL COMMENT '地区生产总值_第三产业(亿元)',
  `gdp_index` DECIMAL(10,2) DEFAULT NULL COMMENT '地区生产总值指数(%)',
  `public_budget_income` DECIMAL(20,4) DEFAULT NULL COMMENT '一般公共预算收入(万元)',
  `public_budget_income_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '一般公共预算收入_同比增长(%)',
  `public_budget_exp` DECIMAL(20,4) DEFAULT NULL COMMENT '一般公共预算支出(万元)',
  `public_budget_exp_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '一般公共预算支出_同比增长(%)',
  `disp_income_total` DECIMAL(20,4) DEFAULT NULL COMMENT '全体居民人均可支配收入(元)',
  `disp_income_total_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '全体居民人均可支配收入_同比增长(%)',
  `disp_income_urban` DECIMAL(20,4) DEFAULT NULL COMMENT '城镇常住居民人均可支配收入(元)',
  `disp_income_urban_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '城镇常住居民人均可支配收入_同比增长(%)',
  `disp_income_rural` DECIMAL(20,4) DEFAULT NULL COMMENT '农村牧区常住居民人均可支配收入(元)',
  `disp_income_rural_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '农村牧区常住居民人均可支配收入_同比增长(%)',
  PRIMARY KEY (`county_id`, `year`),
  INDEX `idx_year` (`year`),
  CONSTRAINT `fk_econ_county` FOREIGN KEY (`county_id`) REFERENCES `counties` (`county_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='核心经济指标表';

DROP TABLE IF EXISTS `population_indicators`;
CREATE TABLE `population_indicators` (
  `county_id` VARCHAR(50) NOT NULL COMMENT 'CountyID [FK]',
  `year` INT NOT NULL COMMENT 'Year',
  `land_area` DECIMAL(20,4) DEFAULT NULL COMMENT '行政区域土地面积(平方公里)',
  `land_area_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '行政区域土地面积_同比增长(%)',
  `households` INT DEFAULT NULL COMMENT '户籍户数(户)',
  `households_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '户籍户数_同比增长(%)',
  `registered_pop` DECIMAL(20,4) DEFAULT NULL COMMENT '户籍人口(万人)',
  `registered_pop_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '户籍人口_同比增长(%)',
  PRIMARY KEY (`county_id`, `year`),
  CONSTRAINT `fk_pop_county` FOREIGN KEY (`county_id`) REFERENCES `counties` (`county_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='人口与户籍表';

DROP TABLE IF EXISTS `agriculture_indicators`;
CREATE TABLE `agriculture_indicators` (
  `county_id` VARCHAR(50) NOT NULL COMMENT 'CountyID [FK]',
  `year` INT NOT NULL COMMENT 'Year',
  `arable_land` DECIMAL(20,4) DEFAULT NULL COMMENT '耕地面积(公顷)',
  `arable_land_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '耕地面积_同比增长(%)',
  `high_std_farmland` DECIMAL(20,4) DEFAULT NULL COMMENT '高标准农田面积(公顷)',
  `high_std_farmland_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '高标准农田面积_同比增长(%)',
  `sown_area` DECIMAL(20,4) DEFAULT NULL COMMENT '农作物总播种面积(公顷)',
  `sown_area_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '农作物总播种面积_同比增长(%)',
  `grain_yield` DECIMAL(20,4) DEFAULT NULL COMMENT '粮食产量(吨)',
  `grain_yield_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '粮食产量_同比增长(%)',
  `oil_yield` DECIMAL(20,4) DEFAULT NULL COMMENT '油料产量(吨)',
  `oil_yield_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '油料产量_同比增长(%)',
  PRIMARY KEY (`county_id`, `year`),
  CONSTRAINT `fk_agri_county` FOREIGN KEY (`county_id`) REFERENCES `counties` (`county_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='农业指标表';

DROP TABLE IF EXISTS `industry_trade_indicators`;
CREATE TABLE `industry_trade_indicators` (
  `county_id` VARCHAR(50) NOT NULL COMMENT 'CountyID [FK]',
  `year` INT NOT NULL COMMENT 'Year',
  `industrial_enterprises` INT DEFAULT NULL COMMENT '规模以上工业企业单位数(个)',
  `industrial_enterprises_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '规模以上工业企业单位数_同比增长(%)',
  `industrial_added_value_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '规模以上工业增加值_同比增长(%)',
  `fixed_asset_invest_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '固定资产投资_同比增长(%)',
  `real_estate_invest` DECIMAL(20,4) DEFAULT NULL COMMENT '房地产开发投资(万元)',
  `real_estate_invest_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '房地产开发投资_同比增长(%)',
  `retail_sales` DECIMAL(20,4) DEFAULT NULL COMMENT '社会消费品零售总额(万元)',
  `retail_sales_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '社会消费品零售总额_同比增长(%)',
  `export_total_rmb` DECIMAL(20,4) DEFAULT NULL COMMENT '出口总额_人民币(万元)',
  `export_total_rmb_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '出口总额_人民币_同比增长(%)',
  `export_total_usd` DECIMAL(20,4) DEFAULT NULL COMMENT '出口总额_美元(万美元)',
  `export_total_usd_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '出口总额_美元_同比增长(%)',
  PRIMARY KEY (`county_id`, `year`),
  CONSTRAINT `fk_ind_county` FOREIGN KEY (`county_id`) REFERENCES `counties` (`county_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工业投资贸易表';

DROP TABLE IF EXISTS `infrastructure_indicators`;
CREATE TABLE `infrastructure_indicators` (
  `county_id` VARCHAR(50) NOT NULL COMMENT 'CountyID [FK]',
  `year` INT NOT NULL COMMENT 'Year',
  `road_mileage` DECIMAL(20,4) DEFAULT NULL COMMENT '公路里程(公里)',
  `road_mileage_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '公路里程_同比增长(%)',
  `mobile_users` INT DEFAULT NULL COMMENT '移动电话用户(户)',
  `mobile_users_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '移动电话用户_同比增长(%)',
  `broadband_users` INT DEFAULT NULL COMMENT '互联网宽带接入用户(户)',
  `broadband_users_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '互联网宽带接入用户_同比增长(%)',
  PRIMARY KEY (`county_id`, `year`),
  CONSTRAINT `fk_infra_county` FOREIGN KEY (`county_id`) REFERENCES `counties` (`county_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='基础设施表';

DROP TABLE IF EXISTS `edu_culture_indicators`;
CREATE TABLE `edu_culture_indicators` (
  `county_id` VARCHAR(50) NOT NULL COMMENT 'CountyID [FK]',
  `year` INT NOT NULL COMMENT 'Year',
  `primary_schools` INT DEFAULT NULL COMMENT '小学学校数(所)',
  `primary_schools_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '小学学校数_同比增长(%)',
  `middle_schools` INT DEFAULT NULL COMMENT '普通中学学校数(所)',
  `middle_schools_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '普通中学学校数_同比增长(%)',
  `stadiums` INT DEFAULT NULL COMMENT '体育场馆数(个)',
  `stadiums_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '体育场馆数_同比增长(%)',
  `patents_granted` INT DEFAULT NULL COMMENT '全年专利授权(件)',
  `patents_granted_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '全年专利授权_同比增长(%)',
  `theaters` INT DEFAULT NULL COMMENT '剧场影剧院数(个)',
  `theaters_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '剧场影剧院数_同比增长(%)',
  PRIMARY KEY (`county_id`, `year`),
  CONSTRAINT `fk_edu_county` FOREIGN KEY (`county_id`) REFERENCES `counties` (`county_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教育科技文旅表';

DROP TABLE IF EXISTS `medical_social_indicators`;
CREATE TABLE `medical_social_indicators` (
  `county_id` VARCHAR(50) NOT NULL COMMENT 'CountyID [FK]',
  `year` INT NOT NULL COMMENT 'Year',
  `medical_beds` INT DEFAULT NULL COMMENT '医疗卫生机构床位数(张)',
  `medical_beds_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '医疗卫生机构床位数_同比增长(%)',
  `medical_tech_personnel` INT DEFAULT NULL COMMENT '医疗卫生技术人员(人)',
  `medical_tech_personnel_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '医疗卫生技术人员_同比增长(%)',
  `pension_insurance_users` INT DEFAULT NULL COMMENT '城乡居民基本养老保险参保人数(人)',
  `pension_insurance_users_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '城乡居民基本养老保险参保人数_同比增长(%)',
  `medical_insurance_users` INT DEFAULT NULL COMMENT '基本医疗保险参保人数(人)',
  `medical_insurance_users_yoy` DECIMAL(10,2) DEFAULT NULL COMMENT '基本医疗保险参保人数_同比增长(%)',
  PRIMARY KEY (`county_id`, `year`),
  CONSTRAINT `fk_med_county` FOREIGN KEY (`county_id`) REFERENCES `counties` (`county_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='医疗卫生社保表';

-- ===============================
-- 政策相关表
-- ===============================

DROP TABLE IF EXISTS `policies`;
CREATE TABLE `policies` (
  `policy_id` VARCHAR(50) NOT NULL COMMENT 'PolicyID',
  `policy_name` VARCHAR(255) NOT NULL COMMENT '政策名称',
  `policy_type` VARCHAR(50) DEFAULT NULL COMMENT '政策类型',
  `department` VARCHAR(100) DEFAULT NULL COMMENT '颁布部门',
  `issue_date` DATE DEFAULT NULL COMMENT '颁布日期',
  `implementation_date` DATE DEFAULT NULL COMMENT '实施日期',
  `status` VARCHAR(50) DEFAULT NULL COMMENT '政策状态',
  `summary` TEXT COMMENT '政策摘要',
  PRIMARY KEY (`policy_id`),
  INDEX `idx_policy_type` (`policy_type`),
  INDEX `idx_issue_date` (`issue_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='政策表';

DROP TABLE IF EXISTS `policy_resources`;
CREATE TABLE `policy_resources` (
  `resource_id` VARCHAR(50) NOT NULL COMMENT 'PolicyIndicatorID - 主键',
  `policy_id` VARCHAR(50) NOT NULL COMMENT 'PolicyID [FK]',
  `indicator_name` VARCHAR(100) DEFAULT NULL COMMENT '指标名称',
  `category` VARCHAR(50) DEFAULT NULL COMMENT '指标类别',
  `description` TEXT COMMENT '指标描述',
  `unit` VARCHAR(50) DEFAULT NULL COMMENT '计量单位',
  `source` VARCHAR(100) DEFAULT NULL COMMENT '数据来源',
  `impact_level` VARCHAR(50) DEFAULT NULL COMMENT '影响程度',
  `related_field` VARCHAR(100) DEFAULT NULL COMMENT '关联领域',
  PRIMARY KEY (`resource_id`),
  INDEX `idx_category` (`category`),
  CONSTRAINT `fk_resource_policy` FOREIGN KEY (`policy_id`) REFERENCES `policies` (`policy_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='政策投入资源表';

-- ===============================
-- 访谈调研相关表
-- ===============================

DROP TABLE IF EXISTS `interviewees`;
CREATE TABLE `interviewees` (
  `interviewee_id` VARCHAR(50) NOT NULL COMMENT 'IntervieweeID',
  `name` VARCHAR(100) DEFAULT NULL COMMENT '姓名',
  `unit` VARCHAR(100) DEFAULT NULL COMMENT '单位',
  `identity` VARCHAR(50) DEFAULT NULL COMMENT '身份',
  `county_id` VARCHAR(50) DEFAULT NULL COMMENT 'CountyID [FK]',
  PRIMARY KEY (`interviewee_id`),
  CONSTRAINT `fk_interviewee_county` FOREIGN KEY (`county_id`) REFERENCES `counties` (`county_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='受访者表';

DROP TABLE IF EXISTS `interview_events`;
CREATE TABLE `interview_events` (
  `event_id` VARCHAR(50) NOT NULL COMMENT 'EventID',
  `location` VARCHAR(255) DEFAULT NULL COMMENT '访谈地点',
  `event_date` DATE DEFAULT NULL COMMENT '访谈日期',
  `topic` VARCHAR(255) DEFAULT NULL COMMENT '访谈主题',
  PRIMARY KEY (`event_id`),
  INDEX `idx_event_date` (`event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='访谈事件表';

DROP TABLE IF EXISTS `interview_data`;
CREATE TABLE `interview_data` (
  `data_id` VARCHAR(50) NOT NULL COMMENT 'DataID',
  `content` LONGTEXT COMMENT '访谈内容',
  `keywords` VARCHAR(255) DEFAULT NULL COMMENT '关键词',
  `experience_summary` TEXT COMMENT '脱贫经验总结',
  `event_id` VARCHAR(50) NOT NULL COMMENT 'EventID [FK]',
  PRIMARY KEY (`data_id`),
  CONSTRAINT `fk_data_event` FOREIGN KEY (`event_id`) REFERENCES `interview_events` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='访谈数据表';

DROP TABLE IF EXISTS `researchers`;
CREATE TABLE `researchers` (
  `researcher_id` VARCHAR(50) NOT NULL COMMENT 'ResearcherID',
  `name` VARCHAR(100) DEFAULT NULL COMMENT '姓名',
  `unit` VARCHAR(100) DEFAULT NULL COMMENT '单位',
  `role` VARCHAR(50) DEFAULT NULL COMMENT '角色',
  PRIMARY KEY (`researcher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='调研者表';

-- ===============================
-- 关联表（多对多关系）
-- ===============================

DROP TABLE IF EXISTS `rel_interviewee_event`;
CREATE TABLE `rel_interviewee_event` (
  `interviewee_id` VARCHAR(50) NOT NULL COMMENT 'IntervieweeID [FK]',
  `event_id` VARCHAR(50) NOT NULL COMMENT 'EventID [FK]',
  `role` VARCHAR(50) DEFAULT NULL COMMENT '参与角色',
  PRIMARY KEY (`interviewee_id`, `event_id`),
  CONSTRAINT `fk_rel_ie_interviewee` FOREIGN KEY (`interviewee_id`) REFERENCES `interviewees` (`interviewee_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rel_ie_event` FOREIGN KEY (`event_id`) REFERENCES `interview_events` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='受访者与访谈事件关联表';

DROP TABLE IF EXISTS `rel_data_researcher`;
CREATE TABLE `rel_data_researcher` (
  `data_id` VARCHAR(50) NOT NULL COMMENT 'DataID [FK]',
  `researcher_id` VARCHAR(50) NOT NULL COMMENT 'ResearcherID [FK]',
  `collection_role` VARCHAR(50) DEFAULT NULL COMMENT '收集角色',
  PRIMARY KEY (`data_id`, `researcher_id`),
  CONSTRAINT `fk_rel_dr_data` FOREIGN KEY (`data_id`) REFERENCES `interview_data` (`data_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rel_dr_researcher` FOREIGN KEY (`researcher_id`) REFERENCES `researchers` (`researcher_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='访谈数据与调研者关联表';

SET FOREIGN_KEY_CHECKS = 1;

-- ===============================
-- 初始数据
-- ===============================

-- 县基本信息数据
INSERT INTO `counties` (`county_id`, `county_name`, `admin_code`, `city`, `province`, `is_poverty_alleviated`, `alleviation_year`) VALUES
('C001', '阜平县', '130624', '保定市', '河北省', 1, 2020),
('C002', '兰考县', '410225', '开封市', '河南省', 1, 2017),
('C003', '察右前旗', '150926', '乌兰察布市', '内蒙古自治区', 1, 2019);

-- 核心经济指标数据
INSERT INTO `economic_indicators` (`county_id`, `year`, `gdp`, `gdp_primary`, `gdp_secondary`, `gdp_tertiary`, `disp_income_total`, `disp_income_urban`, `disp_income_rural`) VALUES
('C001', 2015, 25.3000, 8.5000, 7.2000, 9.6000, 8500.0000, 15200.0000, 5800.0000),
('C001', 2018, 35.8000, 10.2000, 12.5000, 13.1000, 12800.0000, 22500.0000, 9200.0000),
('C001', 2020, 45.6000, 12.8000, 15.3000, 17.5000, 16500.0000, 28000.0000, 12300.0000),
('C002', 2015, 180.5000, 45.2000, 68.3000, 67.0000, 11200.0000, 18500.0000, 8900.0000),
('C002', 2017, 215.3000, 52.8000, 78.5000, 84.0000, 14500.0000, 23800.0000, 11200.0000),
('C002', 2020, 268.7000, 63.5000, 95.2000, 110.0000, 19800.0000, 31500.0000, 15600.0000);

-- 人口与户籍数据
INSERT INTO `population_indicators` (`county_id`, `year`, `land_area`, `households`, `registered_pop`) VALUES
('C001', 2015, 2496.0000, 45280, 21.5000),
('C001', 2020, 2496.0000, 46120, 20.8000),
('C002', 2015, 1116.0000, 152000, 85.3000),
('C002', 2020, 1116.0000, 158500, 82.7000);

-- 农业指标数据
INSERT INTO `agriculture_indicators` (`county_id`, `year`, `arable_land`, `high_std_farmland`, `sown_area`, `grain_yield`, `oil_yield`) VALUES
('C001', 2015, 35000.0000, 8500.0000, 32000.0000, 95000.0000, 3500.0000),
('C001', 2020, 36200.0000, 25000.0000, 34500.0000, 125000.0000, 4800.0000),
('C002', 2015, 95000.0000, 35000.0000, 88000.0000, 450000.0000, 28000.0000),
('C002', 2020, 96500.0000, 72000.0000, 92000.0000, 580000.0000, 35000.0000);

-- 工业投资贸易数据
INSERT INTO `industry_trade_indicators` (`county_id`, `year`, `industrial_enterprises`, `retail_sales`, `export_total_rmb`) VALUES
('C001', 2015, 12, 85000.0000, 1200.0000),
('C001', 2020, 28, 165000.0000, 8500.0000),
('C002', 2015, 68, 520000.0000, 35000.0000),
('C002', 2020, 95, 890000.0000, 68000.0000);

-- 基础设施数据
INSERT INTO `infrastructure_indicators` (`county_id`, `year`, `road_mileage`, `mobile_users`, `broadband_users`) VALUES
('C001', 2015, 1250.0000, 85000, 12000),
('C001', 2020, 1680.0000, 125000, 45000),
('C002', 2015, 2100.0000, 380000, 68000),
('C002', 2020, 2350.0000, 520000, 185000);

-- 教育科技文旅数据
INSERT INTO `edu_culture_indicators` (`county_id`, `year`, `primary_schools`, `middle_schools`, `stadiums`, `patents_granted`) VALUES
('C001', 2015, 85, 12, 5, 8),
('C001', 2020, 78, 15, 18, 45),
('C002', 2015, 125, 28, 12, 52),
('C002', 2020, 118, 32, 35, 128);

-- 医疗卫生社保数据
INSERT INTO `medical_social_indicators` (`county_id`, `year`, `medical_beds`, `medical_tech_personnel`, `pension_insurance_users`, `medical_insurance_users`) VALUES
('C001', 2015, 450, 520, 85000, 180000),
('C001', 2020, 850, 1250, 95000, 195000),
('C002', 2015, 2500, 3200, 450000, 780000),
('C002', 2020, 3800, 5500, 480000, 810000);

-- 政策数据
INSERT INTO `policies` (`policy_id`, `policy_name`, `policy_type`, `department`, `issue_date`, `implementation_date`, `status`, `summary`) VALUES
('P001', '精准扶贫实施方案', '国家级', '国务院扶贫办', '2013-11-03', '2014-01-01', '已完成', '建立精准扶贫工作机制，实施精准识别、精准帮扶'),
('P002', '产业扶贫专项行动', '省级', '河北省扶贫办', '2015-06-15', '2015-07-01', '已完成', '发展特色产业，增加贫困户收入'),
('P003', '兰考县脱贫攻坚实施方案', '县级', '兰考县人民政府', '2014-05-20', '2014-06-01', '已完成', '三年脱贫、七年小康战略部署');

-- 政策投入资源数据
INSERT INTO `policy_resources` (`resource_id`, `policy_id`, `indicator_name`, `category`, `description`, `unit`, `source`, `impact_level`, `related_field`) VALUES
('PI001', 'P001', '扶贫专项资金', '资金投入', '中央财政专项扶贫资金', '万元', '财政部', '高', '核心经济指标'),
('PI002', 'P002', '产业发展基金', '资金投入', '支持特色产业发展的专项基金', '万元', '省财政厅', '高', '农业指标'),
('PI003', 'P003', '基础设施建设投入', '资金投入', '道路、水利等基础设施投资', '万元', '县财政局', '中', '基础设施');

-- 访谈调研数据
INSERT INTO `interviewees` (`interviewee_id`, `name`, `unit`, `identity`, `county_id`) VALUES
('I001', '张某', '阜平县扶贫办', '扶贫干部', 'C001'),
('I002', '李某', '阜平县某村', '脱贫户代表', 'C001'),
('I003', '王某', '兰考县人民政府', '县长', 'C002');

INSERT INTO `interview_events` (`event_id`, `location`, `event_date`, `topic`) VALUES
('E001', '河北省阜平县', '2021-03-15', '精准扶贫经验总结'),
('E002', '河南省兰考县', '2021-04-20', '产业扶贫模式探讨');

INSERT INTO `interview_data` (`data_id`, `content`, `keywords`, `experience_summary`, `event_id`) VALUES
('D001', '通过发展食用菌产业，带动300多户贫困户脱贫...', '产业扶贫;食用菌;合作社', '产业带动是关键，建立利益联结机制', 'E001'),
('D002', '兰考县通过"1+3"社会扶贫模式，实现稳定脱贫...', '社会扶贫;稳定脱贫;长效机制', '社会力量参与，建立长效脱贫机制', 'E002');

INSERT INTO `researchers` (`researcher_id`, `name`, `unit`, `role`) VALUES
('R001', '赵某', '某大学扶贫研究中心', '研究员'),
('R002', '刘某', '某大学扶贫研究中心', '博士生');

INSERT INTO `rel_interviewee_event` (`interviewee_id`, `event_id`, `role`) VALUES
('I001', 'E001', '主要受访者'),
('I002', 'E001', '代表发言'),
('I003', 'E002', '主要受访者');

INSERT INTO `rel_data_researcher` (`data_id`, `researcher_id`, `collection_role`) VALUES
('D001', 'R001', '主访谈员'),
('D001', 'R002', '记录员'),
('D002', 'R001', '主访谈员');

-- 完成提示
SELECT '数据库初始化完成！' AS message;
