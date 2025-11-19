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
-- 初始数据说明
-- ===============================
-- 数据来源：backend/database/data_all 目录
-- - real/sql: 真实的832个贫困县数据及各类指标
-- - fake/sql: 模拟的访谈、政策等调研数据
-- 
-- 注意：initDb.js 会在插入前检查表是否为空，避免重复插入
-- 如需重新导入数据，请先清空对应表的数据

-- ===============================
-- 初始数据：真实832个贫困县及指标数据
-- ===============================

-- SOURCE: backend/database/data_all/real/sql/counties.sql
-- IMPORT_CMD: mysql -u root -p ci_pae < backend/database/data_all/real/sql/counties.sql

-- SOURCE: backend/database/data_all/real/sql/economic_indicators.sql
-- IMPORT_CMD: mysql -u root -p ci_pae < backend/database/data_all/real/sql/economic_indicators.sql

-- SOURCE: backend/database/data_all/real/sql/population_indicators.sql
-- IMPORT_CMD: mysql -u root -p ci_pae < backend/database/data_all/real/sql/population_indicators.sql

-- SOURCE: backend/database/data_all/real/sql/agriculture_indicators.sql
-- IMPORT_CMD: mysql -u root -p ci_pae < backend/database/data_all/real/sql/agriculture_indicators.sql

-- SOURCE: backend/database/data_all/real/sql/industry_trade_indicators.sql
-- IMPORT_CMD: mysql -u root -p ci_pae < backend/database/data_all/real/sql/industry_trade_indicators.sql

-- SOURCE: backend/database/data_all/real/sql/infrastructure_indicators.sql
-- IMPORT_CMD: mysql -u root -p ci_pae < backend/database/data_all/real/sql/infrastructure_indicators.sql

-- SOURCE: backend/database/data_all/real/sql/edu_culture_indicators.sql
-- IMPORT_CMD: mysql -u root -p ci_pae < backend/database/data_all/real/sql/edu_culture_indicators.sql

-- SOURCE: backend/database/data_all/real/sql/medical_social_indicators.sql
-- IMPORT_CMD: mysql -u root -p ci_pae < backend/database/data_all/real/sql/medical_social_indicators.sql

-- ===============================
-- 初始数据：模拟的访谈与政策数据
-- ===============================

-- SOURCE: backend/database/data_all/fake/sql/policies.sql
-- IMPORT_CMD: mysql -u root -p ci_pae < backend/database/data_all/fake/sql/policies.sql

-- SOURCE: backend/database/data_all/fake/sql/policy_resources.sql
-- IMPORT_CMD: mysql -u root -p ci_pae < backend/database/data_all/fake/sql/policy_resources.sql

-- SOURCE: backend/database/data_all/fake/sql/interviewees.sql
-- IMPORT_CMD: mysql -u root -p ci_pae < backend/database/data_all/fake/sql/interviewees.sql

-- SOURCE: backend/database/data_all/fake/sql/interview_events.sql
-- IMPORT_CMD: mysql -u root -p ci_pae < backend/database/data_all/fake/sql/interview_events.sql

-- SOURCE: backend/database/data_all/fake/sql/interview_data.sql
-- IMPORT_CMD: mysql -u root -p ci_pae < backend/database/data_all/fake/sql/interview_data.sql

-- SOURCE: backend/database/data_all/fake/sql/researchers.sql
-- IMPORT_CMD: mysql -u root -p ci_pae < backend/database/data_all/fake/sql/researchers.sql

-- SOURCE: backend/database/data_all/fake/sql/rel_interviewee_event.sql
-- IMPORT_CMD: mysql -u root -p ci_pae < backend/database/data_all/fake/sql/rel_interviewee_event.sql

-- SOURCE: backend/database/data_all/fake/sql/rel_data_researcher.sql
-- IMPORT_CMD: mysql -u root -p ci_pae < backend/database/data_all/fake/sql/rel_data_researcher.sql

-- 完成提示
SELECT '数据库表结构初始化完成！数据导入请使用 initDb.js 或手动执行上述 IMPORT_CMD 命令' AS message;
