const express = require('express');
const router = express.Router();
const db = require('../models/database'); // 确保数据库模块正确导入
const pool = require('../config/dbConfig');

router.get('/', async (req, res) => {
    try {
        const { month, sampleSolutionType, orderNum } = req.query;
        const results = await db.getAllSamples(month, sampleSolutionType, orderNum);
        res.json(results);
    } catch (error) {
        console.error('Failed to fetch samples:', error);
        res.status(500).send({ message: 'Failed to fetch data', error: error.message });
    }
});


// 更新检测项目
router.patch('/:orderNum', async (req, res) => {
    const { orderNum } = req.params;
    const updatedFields = req.body;
    // 过滤掉不需要更新的字段
    const allowedFields = [
        'material', 'material_spec', 'order_num', 'product_no', 
        'sample_name', 'sample_solution_type', 'sample_type'
    ];
    const filteredFields = {};
    for (const key in updatedFields) {
        if (allowedFields.includes(key)) {
            filteredFields[key] = updatedFields[key];
        }
    }
    try {

        // 调用 db 方法进行数据库更新
        const [result] = await db.updateSamples(orderNum, filteredFields);
        if (result.affectedRows > 0) {
            res.json({ success: true, message: '样品信息更新成功' });
        } else {
            res.status(404).json({ success: false, message: '样品信息未找到' });
        }
    } catch (error) {
        console.error('Failed to update samples:', error);
        res.status(500).send({ message: '更新失败', error: error.message });
    }
});

router.post('/exportSampleData', async (req, res) => {
    const { selectedSamples } = req.body;
    let connection;
    if (!Array.isArray(selectedSamples) || !selectedSamples.length) {
      return res.status(400).json({ message: '未选择样品或参数错误' });
    }
    const placeholders = selectedSamples.map(() => '?').join(',');
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        const [rows] =  await connection.execute(
            `SELECT
                s.sample_id,
                s.order_num,
                s.sample_solution_type
            FROM samples s
            WHERE s.sample_id IN (${placeholders})`,
            selectedSamples
        );
      res.json(rows);
      await connection.commit();
    } catch (err) {
      console.error('Export samples failed:', err);
      res.status(500).json({ message: '查询失败', error: err.message });
      if (connection) {
        try { await connection.rollback(); }
        catch (rollbackErr) {
          console.error('事务回滚失败:', rollbackErr);
        }
      }
  
    } finally {
        if (connection) connection.release();
    }
  });
module.exports = router;
