const express = require('express');
const router = express.Router();
const db = require('../models/database'); // 确保数据库模块正确导入

router.get('/', async (req, res) => {
    try {
        const results = await db.getAllSamples();
        res.json(results);
    } catch (error) {
        console.error('Failed to fetch samples:', error);
        res.status(500).send({ message: 'Failed to fetch data', error: error.message });
    }
});


// 更新检测项目
router.patch('/:orderNum', async (req, res) => {
    const { orderNum } = req.params;
    const updatedFields = req.body;
    // 过滤掉不需要更新的字段
    const allowedFields = [
        'material', 'material_spec', 'order_num', 'product_no', 
        'sample_name', 'sample_solution_type', 'sample_type'
    ];
    const filteredFields = {};
    for (const key in updatedFields) {
        if (allowedFields.includes(key)) {
            filteredFields[key] = updatedFields[key];
        }
    }
    try {

        // 调用 db 方法进行数据库更新
        const [result] = await db.updateSamples(orderNum, filteredFields);
        if (result.affectedRows > 0) {
            res.json({ success: true, message: '样品信息更新成功' });
        } else {
            res.status(404).json({ success: false, message: '样品信息未找到' });
        }
    } catch (error) {
        console.error('Failed to update samples:', error);
        res.status(500).send({ message: '更新失败', error: error.message });
    }
});
module.exports = router;
