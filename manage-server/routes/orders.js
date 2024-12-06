const express = require('express');
const router = express.Router();
const db = require('../models/database'); // 确保数据库模块正确导入

router.get('/', async (req, res) => {
    try {
        const orderNum = req.query.orderNum;
        const departmentId = req.query.departmentId;
        const results = await db.getAllOrders(orderNum, departmentId);
        res.json(results);
    } catch (error) {
        console.error('Failed to fetch commission:', error);
        res.status(500).send({ message: 'Failed to fetch data', error: error.message });
    }
});

router.patch('/:orderNum', async (req, res) => {
    const { orderNum } = req.params;
    try {
        await db.updateOrder(orderNum, req.body);
        res.send({ message: 'Order updated successfully' });
    } catch (error) {
        console.error('Failed to update order:', error);
        res.status(500).send({ message: error.message, error: error.message });
    }
});
router.delete('/:orderNum', async (req, res) => {
    try {
        const { orderNum } = req.params;
        await db.deleteOrder(orderNum);
        res.send({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Failed to delete order:', error);
        res.status(500).send({ message: 'Failed to delete order', error: error.message });
    }
});

// 结算操作
router.post('/checkout', async (req, res) => {
    const { orderNums } = req.body; // 接收前端传过来的订单号数组
    try {
        // 调用handleCheckout函数，检查是否有订单的discounted_price为空
        const result = await db.handleCheckout(orderNums);

        if (result.success) {
            res.status(200).json({ success: true, message: '结算成功' });
        } else {
            res.status(400).json({ message: result.message }); // 返回错误信息
        }
    } catch (error) {
        console.error('结算操作失败:', error);
        res.status(500).json({ message: '结算失败，请稍后重试' });
    }
});


// 获取所有发票及其对应的订单和检测项
router.get('/invoices', async (req, res) => {
    try {
        let filterData = req.query.filterData;
        // 获取所有发票详细信息
        const invoiceDetails = await db.getInvoiceDetails(filterData);
        // 用来存储按发票分组的数据
        const invoiceData = [];
        let currentInvoiceId = null;
        let createdAt = null;
        let currentInvoiceNum = null;
        let currentOrderNum = null;
        let orderDetails = [];
        // 按照 invoice_id 和 order_num 分组数据
        invoiceDetails.forEach(item => {
            // 按 invoice_id 分组
            if (currentInvoiceId !== item.invoice_id) {
                if (currentInvoiceId !== null) {
                    // 添加当前的发票信息
                    invoiceData.push({
                        invoice_id: currentInvoiceId,
                        invoice_number: currentInvoiceNum,
                        created_at: createdAt,
                        order_details: orderDetails
                    });
                }
                // 更新 currentInvoiceId 并重置 orderDetails
                currentInvoiceId = item.invoice_id;
                currentInvoiceNum = item.invoice_number;
                createdAt = item.created_at;
                orderDetails = [];
            }

            // 按 order_num 分组
            if (currentOrderNum !== item.order_num) {
                currentOrderNum = item.order_num;
                orderDetails.push({
                    order_num: item.order_num,
                    customer_name: item.customer_name,
                    contact_name: item.contact_name,
                    contact_phone_num: item.contact_phone_num,
                    name: item.name,
                    final_price: item.final_price,
                    payer_name: item.payer_name,
                    payer_contact_name: item.payer_contact_name,
                    payer_contact_phone_num: item.payer_contact_phone_num,
                    items: []
                });
            }

            // 每个订单下的检测项目添加到 items 数组
            const lastOrder = orderDetails[orderDetails.length - 1];
            lastOrder.items.push({
                test_item: item.test_item,
                discounted_price: item.discounted_price,
                size:item.size,
                quantity:item.quantity,
                check_note:item.check_note,
                listed_price:item.listed_price,
                work_hours:item.work_hours,
                machine_hours:item.machine_hours,
                note:item.note,
                status:item.status,
                test_method:item.test_method,
                original_no:item.original_no,
                order_num: item.order_num,
                create_time:item.create_time
            });
        });

        // 最后一组发票数据
        if (currentInvoiceId !== null) {
            invoiceData.push({
                invoice_id: currentInvoiceId,
                invoice_number: currentInvoiceNum,
                created_at: createdAt,
                order_details: orderDetails
            });
        }
        // 返回发票数据给前端
        res.status(200).json(invoiceData);
    } catch (error) {
        console.error('获取发票信息失败:', error);
        res.status(500).json({
            success: false,
            message: '获取发票信息失败，请稍后重试'
        });
    }
});


// 设置开票价的路由
router.post('/finalPrice', async (req, res) => {
    const { invoiceId, finalPrice } = req.body;

    // 确保传入的参数有效
    if (!invoiceId || finalPrice === undefined || finalPrice === null) {
        return res.status(400).json({ message: '缺少必要的参数：invoiceId 或 finalPrice' });
    }

    try {
        // 调用数据库函数设置开票价
        const result = await db.setFinalPrice(invoiceId, finalPrice);

        if (result.affectedRows > 0) {
            // 如果更新成功，返回成功响应
            return res.status(200).json({ message: '开票价设置成功' });
        } else {
            // 如果没有找到该订单或其他问题，返回失败响应
            return res.status(404).json({ message: '未找到对应的发票记录，开票价设置失败' });
        }
    } catch (error) {
        console.error('设置开票价时发生错误:', error);
        return res.status(500).json({ message: '服务器错误，未能成功设置开票价' });
    }
});


// 入账的路由
router.post('/account', async (req, res) => {
    const { invoiceId, invoiceNumber, orderStatus, amount, description, accountTime} = req.body;
    try {
        // 1. 更新发票表的发票号和更新时间
        await db.updateInvoice(invoiceId, invoiceNumber, accountTime);

        // 2. 获取与发票关联的所有订单
        const invoiceOrders = await db.getInvoiceOrders(invoiceId);

        if (invoiceOrders.length > 0) {

            // 更新订单表的状态为 '2'（已入账）
            await db.updateOrderStatus(invoiceOrders, orderStatus);


            // 3. 扣款逻辑
            // 假设 orders[0] 是与支付方相关的第一条订单
            const paymentIdResult = await db.getPaymentIdByOrderNum(invoiceOrders[0]);


            const paymentId = paymentIdResult[0]?.payment_id;

            if (!paymentId) {
                return res.status(400).json({ message: '未找到支付方信息' });
            }

            // 获取付款方账户余额
            const paymentResult = await db.getPaymentBalance(paymentId);

            const balance = paymentResult[0]?.balance;


            if (parseFloat(balance) < parseFloat(amount)) {
                console.log("能不？",balance - amount)
                return res.status(400).json({ message: `余额不足，无法入账。\n当前余额:${balance}` });
            }

            // 扣款，更新付款方余额
            const newBalance = balance - amount;
            await db.updatePaymentBalance(paymentId, newBalance);

            // 4. 在交易表中插入一条交易记录
            await db.insertTransaction(paymentId, amount, newBalance, description);

            // 返回成功响应
            res.status(200).json({ message: '入账成功' });
        } else {
            return res.status(400).json({ message: '未找到关联的订单' });
        }

    } catch (error) {
        console.error('入账失败:', error);
        res.status(500).json({ message: '服务器错误，未能成功入账' });
    }
});


module.exports = router;
