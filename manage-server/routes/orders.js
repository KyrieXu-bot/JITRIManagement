const express = require('express');
const router = express.Router();
const { getAllOrders, updateOrder, deleteOrder } = require('../models/database'); // 确保数据库模块正确导入

router.get('/', async (req, res) => {
    try {
        const orderNum = req.query.orderNum;
        const departmentId = req.query.departmentId;
        const results = await getAllOrders(orderNum, departmentId);
        res.json(results);
    } catch (error) {
        console.error('Failed to fetch commission:', error);
        res.status(500).send({ message: 'Failed to fetch data', error: error.message });
    }
});

router.patch('/:orderNum', async (req, res) => {
    const { orderNum } = req.params;
    try {
        await updateOrder(orderNum, req.body);
        res.send({ message: 'Order updated successfully' });
    } catch (error) {
        console.error('Failed to update order:', error);
        res.status(500).send({ message: error.message, error: error.message });
    }
});
router.delete('/:orderNum', async (req, res) => {
    try {
        const { orderNum } = req.params;
        await deleteOrder(orderNum);
        res.send({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Failed to delete order:', error);
        res.status(500).send({ message: 'Failed to delete order', error: error.message });
    }
});
module.exports = router;
