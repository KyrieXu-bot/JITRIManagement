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
        res.status(200).json({ success: true, message: "检测项目分配成功" });
    } catch (error) {
        console.error('Failed to assign test:', error);
        res.status(500).json({ success: false, message: "Failed to assign test", error: error.message });
    }
});

// Get all test items assigned to a specific user
router.get('/assignments/:userId', async (req, res) => {
    console.log(req)
    try {
        const results = await db.getAssignedTestsByUser(req.params.userId);
        res.json(results);
    } catch (error) {
        console.error('Failed to fetch assignments:', error);
        res.status(500).json({ success: false, message: "Failed to retrieve assignments", error: error.message });
    }
});

module.exports = router;
