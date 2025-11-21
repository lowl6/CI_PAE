// 政策控制器
const policyService = require('../services/policyService');

/**
 * 获取政策列表
 * GET /api/policies?type=&city=&yearStart=&yearEnd=&keyword=
 */
exports.getPolicies = async (req, res) => {
  try {
    const { type, city, year, yearStart, yearEnd, keyword, page = 1, pageSize = 100 } = req.query;
    
    const policies = await policyService.getPolicyList({
      type,
      city,
      year: year ? parseInt(year) : null,
      yearStart: yearStart ? parseInt(yearStart) : null,
      yearEnd: yearEnd ? parseInt(yearEnd) : null,
      keyword
    });
    
    // 分页处理
    const currentPage = parseInt(page);
    const size = parseInt(pageSize);
    const total = policies.length;
    const startIndex = (currentPage - 1) * size;
    const endIndex = startIndex + size;
    const paginatedPolicies = policies.slice(startIndex, endIndex);
    
    res.json({
      ok: true,
      data: {
        policies: paginatedPolicies,
        total: total,
        page: currentPage,
        pageSize: size
      }
    });
  } catch (error) {
    console.error('获取政策列表失败:', error);
    res.status(500).json({
      ok: false,
      error: error.message || '获取政策列表失败'
    });
  }
};

/**
 * 获取政策详情
 * GET /api/policies/:id
 */
exports.getPolicyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const detail = await policyService.getPolicyDetail(id);
    
    res.json({
      ok: true,
      data: detail
    });
  } catch (error) {
    console.error('获取政策详情失败:', error);
    res.status(error.message === '政策不存在' ? 404 : 500).json({
      ok: false,
      error: error.message || '获取政策详情失败'
    });
  }
};

/**
 * 获取政策统计信息
 * GET /api/policies/stats
 */
exports.getPolicyStats = async (req, res) => {
  try {
    const stats = await policyService.getPolicyStats();
    
    res.json({
      ok: true,
      data: stats
    });
  } catch (error) {
    console.error('获取政策统计失败:', error);
    res.status(500).json({
      ok: false,
      error: error.message || '获取政策统计失败'
    });
  }
};

/**
 * 获取访谈完整内容
 * GET /api/policies/interviews/:dataId
 */
exports.getInterviewFullContent = async (req, res) => {
  try {
    const { dataId } = req.params;
    
    const interview = await policyService.getInterviewFullContent(dataId);
    if (!interview) {
      return res.status(404).json({
        ok: false,
        error: '访谈记录不存在'
      });
    }
    
    res.json({
      ok: true,
      data: interview
    });
  } catch (error) {
    console.error('获取访谈完整内容失败:', error);
    res.status(500).json({
      ok: false,
      error: error.message || '获取访谈完整内容失败'
    });
  }
};

/**
 * 获取城市列表
 * GET /api/policies/cities
 */
exports.getCities = async (req, res) => {
  try {
    const cities = await policyService.getCities();
    
    res.json({
      ok: true,
      data: cities
    });
  } catch (error) {
    console.error('获取城市列表失败:', error);
    res.status(500).json({
      ok: false,
      error: error.message || '获取城市列表失败'
    });
  }
};
