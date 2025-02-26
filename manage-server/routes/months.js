const express = require('express');
const router = express.Router();
const db = require('../models/database'); // 确保数据库模块正确导入


// Get time periods based on order_num
router.get('/time-periods', async (req, res) => { 
    const { timePeriod } = req.query; // 'month', 'quarter', or 'year'
    try {
        let results;
        if (timePeriod === 'month') {
            results = await db.getAllMonths();
        } else if (timePeriod === 'quarter') {
            results = await db.getAllQuarters();
        } else if (timePeriod === 'year') {
            results = await db.getAllYears();
        }
        res.json(results);
    } catch (error) {
        console.error('Failed to fetch time periods:', error);
        res.status(500).send({ message: 'Failed to fetch data', error: error.message });
    }
});


router.get('/trans', async (req, res) => {
    try {
        const results = await db.getAllTransMonths();
        res.json(results);
    } catch (error) {
        console.error('Failed to fetch months:', error);
        res.status(500).send({ message: 'Failed to fetch data', error: error.message });
    }
});

module.exports = router;
