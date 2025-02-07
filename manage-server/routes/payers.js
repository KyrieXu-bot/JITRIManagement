const express = require('express');
const router = express.Router();

// 假设你有一个数据库模块或使用某种 ORM 来管理数据库操作
const db = require('../models/database'); // 这是一个示例路径，你需要根据你的设置调整

// 获取所有客户
router.get('/', async (req, res) => {
    try {
        let filterData = req.query.filterData;
        const payers = await db.getPayers(filterData);
        res.json(payers);
    } catch (error) {
        res.status(500).send({ message: "Error retrieving customers", error: error.message });
    }
});


// 创建新客户
router.post('/', async (req, res) => {
    try {
        const newCustomer = await db.createPayer(req.body);
        res.status(201).json(newCustomer);
    } catch (error) {
        res.status(500).send({ message: "Error creating customer", error: error.message });
    }
});

// 更新付款方信息
router.patch('/:payment_id', async (req, res) => {
    const paymentId = req.params.payment_id;
  const {payer_name, payer_address, payer_phone_num, bank_name, tax_number, bank_account, payer_contact_name, payer_contact_phone_num, payer_contact_email, category, area, organization } = req.body;

  // 组织更新数据
  const paymentData = {
    payment_id: paymentId,
    payer_name,
    payer_address,
    payer_phone_num,
    bank_name,
    tax_number,
    bank_account,
    payer_contact_name,
    payer_contact_phone_num,
    payer_contact_email,
    category,
    area,
    organization
  };

  try {
    const [result] = await db.updatePayer(paymentData);  // 调用 database.js 中的方法执行 SQL
    if (result.affectedRows > 0) {
      res.status(200).json({ success: true, message: 'Payer updated successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Payer not found' });
    }
  } catch (err) {
    console.error('Error updating payer:', err);
    res.status(500).json({ success: false, message: 'Error updating payer' });
  }
});

// 删除付款方
router.delete('/:id', async (req, res) => {
    try {
        const result = await db.deletePayer(req.params.id);
        if (result) {
            res.send(result);
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
        const {payment_id, amount, description} = req.body;
        const result = await db.makeDeposit(payment_id, amount, description);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).send({ message: "充值失败", error: error.message });
    }
});
module.exports = router;
