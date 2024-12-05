const express = require('express');
const router = express.Router();

// 假设你有一个数据库模块或使用某种 ORM 来管理数据库操作
const db = require('../models/database'); // 这是一个示例路径，你需要根据你的设置调整

// 获取所有客户
router.get('/', async (req, res) => {
    try {
        let filterPayerName = req.query.filterPayerName;
        let filterPayerContactName = req.query.filterPayerContactName;
        let transactionType = req.query. transactionType;
        const transactions = await db.getTransactions(filterPayerContactName, filterPayerName, transactionType);
        res.json(transactions);
    } catch (error) {
        res.status(500).send({ message: "交易流水获取失败", error: error.message });
    }
});


module.exports = router;
