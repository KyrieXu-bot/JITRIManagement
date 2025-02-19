const express = require('express');
const router = express.Router();
const db = require('../models/database'); // 确保路径正确

// 获取员工工时和机时统计数据
router.get('/statistics', async (req, res) => {
    const { departmentId, timePeriod } = req.query;
    try {
        const employeePromise = db.getEmployeeWorkStats(departmentId, timePeriod);
        const equipmentPromise = db.getMachineWorkStats(departmentId);
        const totalPricePromise = db.getYearlyListedPrice(departmentId);

        const [employeeStats, equipmentStats, totalPriceStats] = await Promise.all([employeePromise, equipmentPromise, totalPricePromise]);
        res.json({
            employeeStats,
            equipmentStats,
            totalPriceStats
        });
    } catch (error) {
        console.error('Failed to fetch statistics:', error);
        res.status(500).send({ message: 'Failed to fetch data', error: error.message });
    }
});


// 获取设备使用数据
router.get('/timeline', async (req, res) => {
    const { departmentId } = req.query;
    try {
        const equipmentTimeline = await db.getEquipmentTimeline(departmentId);
        res.json(equipmentTimeline);
    } catch (error) {
        console.error('Failed to fetch timeline:', error);
        res.status(500).send({ message: 'Failed to fetch data', error: error.message });
    }
});


module.exports = router;
