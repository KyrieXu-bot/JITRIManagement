const express = require('express');
const router = express.Router();
const db = require('../models/database'); // 确保数据库模块正确导入

router.get('/', async (req, res) => {
    try {
        const results = await db.getAllTestItems();
        res.json(results);
    } catch (error) {
        console.error('Failed to fetch test items:', error);
        res.status(500).send({ message: 'Failed to fetch data', error: error.message });
    }
});

// Assign a test to a user
router.post('/assign', async (req, res) => {
    const { testItemId, assignmentInfo } = req.body;
    try {
        await db.assignTestToUser(testItemId, assignmentInfo);
        await db.updateTestItemStatus(testItemId, 0); // 设置状态为“待检测”
        res.status(200).json({ success: true, message: "检测项目分配成功" });
    } catch (error) {
        console.error('Failed to assign test:', error);
        res.status(500).json({ success: false, message: "Failed to assign test", error: error.message });
    }
});

//更新状态
router.post('/update-status', async (req, res) => {
    const { testId, status } = req.body;
    try {
        await db.updateTestItemStatus(testId, status); // 更新状态
        res.status(200).json({ success: true, message: "Test status updated successfully" });
    } catch (error) {
        console.error('Failed to update test status:', error);
        res.status(500).json({ success: false, message: "Failed to update status", error: error.message });
    }
});


// Get all test items assigned to a specific user
router.get('/assignments/:userId', async (req, res) => {
    try {
        const results = await db.getAssignedTestsByUser(req.params.userId);
        res.json(results);
    } catch (error) {
        console.error('Failed to fetch assignments:', error);
        res.status(500).json({ success: false, message: "Failed to retrieve assignments", error: error.message });
    }
});

module.exports = router;
