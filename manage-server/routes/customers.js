const express = require('express');
const router = express.Router();

// 假设你有一个数据库模块或使用某种 ORM 来管理数据库操作
const db = require('../models/database'); // 这是一个示例路径，你需要根据你的设置调整

// 获取所有客户
router.get('/', async (req, res) => {
    try {
        let filterData = req.query.filterData;
        const customers = await db.getCustomers(filterData);
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
router.patch('/:customer_id', async (req, res) => {
    const customerId = req.params.customer_id;
    const { customer_name, customer_address, contact_name, contact_phone_num, contact_email, category, area, organization } = req.body;
  
    // 组织更新数据
    const customerData = {
      customer_id: customerId,
      customer_name,
      customer_address,
      contact_name,
      contact_phone_num,
      contact_email,
      category,
      area,
      organization
    };
  
    try {
      const [result] = await db.updateCustomer(customerData);  // 调用 database.js 中的方法执行 SQL
      if (result.affectedRows > 0) {
        res.status(200).json({ success: true, message: 'Customer updated successfully' });
      } else {
        res.status(404).json({ success: false, message: 'Customer not found' });
      }
    } catch (err) {
      console.error('Error updating customer:', err);
      res.status(500).json({ success: false, message: 'Error updating customer' });
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


module.exports = router;
