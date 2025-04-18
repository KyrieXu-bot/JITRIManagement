const express = require('express');
const router = express.Router();
const db = require('../models/database'); // 确保数据库模块正确导入

router.post('/', async (req, res) => {
    const { equipment_id, start_time, end_time, equip_user, test_item_id, operator } = req.body;

    try {
        // 调用数据库函数插入预约记录
        const result = await db.createReservation(equipment_id, start_time, end_time, equip_user, test_item_id, operator);
        
        // 返回成功响应
        res.status(201).json({ success: true, message: '设备预约成功', reservation_id: result.insertId });
    } catch (error) {
        console.error('设备预约失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

router.post('/update', async (req, res) => {
    const { reservation_id, equipment_id, start_time, end_time, equip_user, test_item_id, operator } = req.body;

    try {
        // 调用数据库函数更新预约记录
        const result = await db.updateReservation(reservation_id, equipment_id, start_time, end_time, equip_user, test_item_id, operator);

        if (result.affectedRows > 0) {
            res.status(200).json({ success: true, message: '预约修改成功' });
        } else {
            res.status(404).json({ success: false, message: '预约记录未找到' });
        }
    } catch (error) {
        console.error('修改预约失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 路由处理：检查时间冲突
router.get('/checkTimeConflict', async (req, res) => {
    const { equipment_id, start_time, end_time, reservation_id } = req.query;

    // 转换时间格式
    const start = new Date(start_time);
    const end = new Date(end_time);

    try {
        // 调用数据库方法检查时间冲突
        const conflictInfo = await db.checkTimeConflict(equipment_id, start, end, reservation_id);
        if (conflictInfo.conflict) {
            // 如果有冲突，返回详细的冲突时间段
            return res.status(200).json({
                success: false,
                message: '设备时间冲突，请查看以下预约信息：',
                conflict: true,
                conflictDetails: conflictInfo.conflictDetails,
            });
        }

        res.status(200).json({
            success: true,
            message: '设备分配成功',
        });
    } catch (error) {
        console.error('Error checking time conflict:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
        });
    }
});


// 路由处理：检查时间冲突
router.get('/myReservation', async (req, res) => {
    const { account } = req.query;
    try {
        // 调用数据库方法检查时间冲突
        const myReservation = await db.getMyReservation(account);
        // 返回查询结果
        res.status(200).json({
            success: true,
            reservations: myReservation,
        });
    } catch (error) {
        console.error('Error getting my reservation:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
        });
    }
});

router.post('/cancel', async (req, res) => {
    const { reservationId } = req.body;  // 从请求体中获取 reservation_id
    
    try {
        // 调用数据库函数取消预约
        const result = await db.cancelReservation(reservationId);
        
        if (result.affectedRows > 0) {
            res.status(200).json({ success: true, message: '预约取消成功' });
        } else {
            res.status(404).json({ success: false, message: '预约记录未找到' });
        }
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
        });
    }
});

module.exports = router;

