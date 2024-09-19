const express = require('express');
const router = express.Router();
const { getAllMonths } = require('../models/database'); // 确保数据库模块正确导入

router.get('/', async (req, res) => {
    try {
        const results = await getAllMonths();
        res.json(results);
    } catch (error) {
        console.error('Failed to fetch months:', error);
        res.status(500).send({ message: 'Failed to fetch data', error: error.message });
    }
});


module.exports = router;
