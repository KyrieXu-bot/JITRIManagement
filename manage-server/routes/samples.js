const express = require('express');
const router = express.Router();
const db = require('../models/database'); // 确保数据库模块正确导入

router.get('/', async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT 
                s.sample_name,
                s.material,
                s.product_no,
                s.material_spec,
                s.sample_solution_type,
                s.sample_type,
                s.order_num
            FROM samples s
        `);
        res.json(results);
    } catch (error) {
        console.error('Failed to fetch commission:', error);
        res.status(500).send({ message: 'Failed to fetch data', error: error.message });
    }
});

module.exports = router;
