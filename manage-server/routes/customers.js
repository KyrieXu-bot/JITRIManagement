const express = require('express');
const router = express.Router();

// 假设你有一个数据库模块或使用某种 ORM 来管理数据库操作
const db = require('../models/database'); // 这是一个示例路径，你需要根据你的设置调整

// 获取所有客户
router.get('/', async (req, res) => {
    try {
        const customers = await db.getCustomers();
        res.json(customers);
    } catch (error) {
        res.status(500).send({ message: "Error retrieving customers", error: error.message });
    }
});

// 获取单个客户通过ID
router.get('/:id', async (req, res) => {
    try {
        const customer = await db.getCustomerById(req.params.id);
        if (customer) {
            res.json(customer);
        } else {
            res.status(404).send({ message: "Customer not found" });
        }
    } catch (error) {
        res.status(500).send({ message: "Error retrieving customer", error: error.message });
    }
});

// 创建新客户
router.post('/', async (req, res) => {
    try {
        const newCustomer = await db.createCustomer(req.body);
        res.status(201).json(newCustomer);
    } catch (error) {
        res.status(500).send({ message: "Error creating customer", error: error.message });
    }
});

// 更新客户信息
router.put('/:id', async (req, res) => {
    try {
        const updatedCustomer = await db.updateCustomer(req.params.id, req.body);
        if (updatedCustomer) {
            res.json(updatedCustomer);
        } else {
            res.status(404).send({ message: "Customer not found" });
        }
    } catch (error) {
        res.status(500).send({ message: "Error updating customer", error: error.message });
    }
});

// 删除客户
router.delete('/:id', async (req, res) => {
    try {
        const result = await db.deleteCustomer(req.params.id);
        if (result) {
            res.send({ message: "Customer deleted successfully" });
        } else {
            res.status(404).send({ message: "Customer not found" });
        }
    } catch (error) {
        res.status(500).send({ message: "Error deleting customer", error: error.message });
    }
});


// 为客户充值
router.post('/deposit', async (req, res) => {
    try {
        const {customer_id, amount, description} = req.body;
        const result = await db.makeDeposit(customer_id, amount, description);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).send({ message: "Error creating customer", error: error.message });
    }
});

module.exports = router;
