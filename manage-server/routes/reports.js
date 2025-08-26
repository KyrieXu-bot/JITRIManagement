const express = require('express');
const router = express.Router();
const db = require('../models/database'); // 确保数据库模块正确导入
const pool = require('../config/dbConfig');

router.get('/', async (req, res) => {
    try {
        //const { month, sampleSolutionType, orderNum } = req.query;
        const results = await db.getAllReports();
        res.json(results);
    } catch (error) {
        console.error('Failed to fetch reports:', error);
        res.status(500).send({ message: 'Failed to fetch reports', error: error.message });
    }
});

module.exports = router;

