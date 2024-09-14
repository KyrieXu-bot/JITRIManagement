const express = require('express');
const router = express.Router();
const db = require('../models/database'); // 确保路径正确

// 获取员工工时和机时统计数据
router.get('/statistics', async (req, res) => {
    const { departmentId } = req.query;
    try {
        const employeePromise = db.getEmployeeWorkStats(departmentId);
        const equipmentPromise = db.getMachineWorkStats(departmentId);
        const [employeeStats, equipmentStats] = await Promise.all([employeePromise, equipmentPromise]);

        res.json({
            employeeStats,
            equipmentStats
        });
    } catch (error) {
        console.error('Failed to fetch statistics:', error);
        res.status(500).send({ message: 'Failed to fetch data', error: error.message });
    }
});



module.exports = router;
