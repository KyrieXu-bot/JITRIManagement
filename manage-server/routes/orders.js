const express = require('express');
const router = express.Router();
const db = require('../models/database'); // 确保数据库模块正确导入

router.get('/', async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT 
                o.order_num, 
                c.customer_name, 
                c.contact_name, 
                c.contact_phone_num, 
                c.contact_email, 
                p.payer_contact_name, 
                p.payer_contact_phone_num,
                p.payer_address,
                t.test_item,
                s.material,
                t.size,
                o.service_type,
                t.note
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            JOIN payments p ON o.payment_id = p.payment_id
            JOIN test_items t ON o.order_num = t.order_num
            JOIN samples s ON o.order_num = s.order_num
        `);
        res.json(results);
    } catch (error) {
        console.error('Failed to fetch commission:', error);
        res.status(500).send({ message: 'Failed to fetch data', error: error.message });
    }
});

router.put('/:orderNum', async (req, res) => {
    try {
        const { orderNum } = req.params;
        const updateData = req.body;  // 获取更新的数据
        await db.query(`
            UPDATE orders SET
            customer_id = ?, service_type = ?, sample_shipping_address = ?
            WHERE order_num = ?
        `, [updateData.customer_id, updateData.service_type, updateData.sample_shipping_address, orderNum]);
        res.send({ message: 'Order updated successfully' });
    } catch (error) {
        console.error('Failed to update order:', error);
        res.status(500).send({ message: 'Failed to update order', error: error.message });
    }
});

router.delete('/:orderNum', async (req, res) => {
    try {
        const { orderNum } = req.params;
        await db.query(`DELETE FROM orders WHERE order_num = ?`, [orderNum]);
        res.send({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Failed to delete order:', error);
        res.status(500).send({ message: 'Failed to delete order', error: error.message });
    }
});
module.exports = router;
