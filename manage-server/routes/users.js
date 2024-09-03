const express = require('express');
const router = express.Router();
const { getAllSupervisors, getAllEmployees } = require('../models/database'); // 确保数据库模块正确导入

router.get('/supervisors', async (req, res) => {
    const { departmentId } = req.query; // 获取部门ID
    if (!departmentId) {
        return res.status(400).json({ message: 'Department ID is required' });
    }
    try {
        const results = await getAllSupervisors(departmentId);
        res.json(results);
    } catch (error) {
        console.error('Failed to fetch samples:', error);
        res.status(500).send({ message: 'Failed to fetch data', error: error.message });
    }
});


router.get('/employees', async (req, res) => {
    const { departmentId } = req.query; // 获取部门ID
    if (!departmentId) {
        return res.status(400).json({ message: 'Department ID is required' });
    }
    try {
        const results = await getAllEmployees(departmentId);
        res.json(results);
    } catch (error) {
        console.error('Failed to fetch samples:', error);
        res.status(500).send({ message: 'Failed to fetch data', error: error.message });
    }
});

module.exports = router;