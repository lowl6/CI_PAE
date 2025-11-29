const dashboardService = require('../services/dashboardService');
const pool = require('../config/db');

class DashboardController {
  /**
   * 确保数据库已选择
   */
  async ensureDatabase() {
    try {
      await pool.query('USE ci_pae');
      console.log('已选择 ci_pae 数据库');
      return true;
    } catch (error) {
      console.error('选择数据库失败:', error);
      return false;
    }
  }
  /**
   * 获取核心指标数据
   */
  async getDashboardData(req, res) {
    try {
      const data = await dashboardService.getIndicatorData();
      res.json({
        code: 200,
        message: 'success',
        data: data
      });
    } catch (error) {
      console.error('获取指标数据失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取指标数据失败',
        data: null
      });
    }
  }

  /**
   * 获取贫困县数据
   */
  async getPoorCountyData(req, res) {
    try {
      const data = await dashboardService.getPoorCountyData();
      res.json({
        code: 200,
        message: 'success',
        data: data
      });
    } catch (error) {
      console.error('获取贫困县数据失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取贫困县数据失败',
        data: null
      });
    }
  }

  /**
   * 获取盟市列表
   */
  async getCityList(req, res) {
    try {
      const cities = [
        '呼和浩特市', '包头市', '呼伦贝尔市', '兴安盟', 
        '通辽市', '赤峰市', '锡林郭勒盟', '乌兰察布市', 
        '鄂尔多斯市', '巴彦淖尔市', '乌海市', '阿拉善盟'
      ];
      
      res.json({
        code: 200,
        message: 'success',
        data: cities
      });
    } catch (error) {
      console.error('获取盟市列表失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取盟市列表失败',
        data: null
      });
    }
  }

  /**
   * 获取统计数据概览
   */
  async getStatisticsOverview(req, res) {
    try {
      const data = await dashboardService.getStatisticsOverview();
      res.json({
        code: 200,
        message: 'success',
        data: data
      });
    } catch (error) {
      console.error('获取统计数据概览失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取统计数据概览失败',
        data: null
      });
    }
  }

  /**
 * 获取盟市详情
 */
async getCityDetail(req, res) {
    try {
        const cityName = req.params.cityName;
        console.log('获取盟市详情:', cityName);
        
        const data = await dashboardService.getCityDetail(cityName);
        res.json({
            code: 200,
            message: 'success',
            data: data
        });
    } catch (error) {
        console.error('获取盟市详情失败:', error);
        res.status(500).json({
            code: 500,
            message: '获取盟市详情失败',
            data: null
        });
    }
}

async getCitiesSummary(req, res) {
    try {
      const data = await dashboardService.getCitiesSummary();
      res.json({
        code: 200,
        message: 'success',
        data: data
      });
    } catch (error) {
      console.error('获取盟市汇总数据失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取盟市汇总数据失败: ' + error.message,
        data: null
      });
    }
  }
}


module.exports = new DashboardController();