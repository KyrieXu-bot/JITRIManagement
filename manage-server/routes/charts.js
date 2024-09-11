const express = require('express');
const router = express.Router();
const db = require('../models/database'); // 确保路径正确

// 获取员工工时和机时统计数据
router.get('/statistics', async (req, res) => {
    const { departmentId } = req.query;
    try {
        const stats = await db.getEmployeeWorkStats(departmentId);
        res.json(stats);
    } catch (error) {
        console.error('Failed to fetch statistics:', error);
        res.status(500).send({ message: 'Failed to fetch data', error: error.message });
    }
});

module.exports = router;
