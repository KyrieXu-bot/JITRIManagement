const express = require('express');
const router = express.Router();
const db = require('../models/database'); // 确保数据库模块正确导入

router.get('/', async (req, res) => {
    let status = req.query.status; // 获取请求中的状态参数
    let departmentId = req.query.departmentId; // 获取请求中的部门参数
    let account = req.query.account;
    let month = req.query.month;
    try {
        if(account != undefined && account != ''){
            const results = await db.getEmployeeTestItems(status, departmentId, account,month);
            res.json(results);

        } else{
            const results = await db.getAllTestItems(status, departmentId, account, month);
            res.json(results);
        }
    } catch (error) {
        console.error('Failed to fetch test items:', error);
        res.status(500).send({ message: 'Failed to fetch data', error: error.message });
    }
});

// Assign a test to a user
router.post('/assign', async (req, res) => {
    const { testItemId, assignmentInfo } = req.body;
    try {
        const results = await db.getAssignmentsInfo(testItemId, assignmentInfo)
        if(!results || results.length === 0){
            await db.assignTestToUser(testItemId, assignmentInfo);
            res.status(200).json({ success: true, message: "检测项目分配成功" });
        }else{
            const userResult = await db.findUserByAccount(assignmentInfo);
            if(userResult.role != 'supervisor'){
                // 如果数据库查询结果表明该项目已被分配并且不是组长指派的
                res.status(409).json({ success: false, message: "项目已经被分配" });
            }else{
                res.status(200).json({ success: true, message: "检测项目分配成功" });
            }

        }

    } catch (error) {
        console.error('Failed to assign test:', error);
        res.status(500).json({ success: false, message: "Failed to assign test", error: error.message });
    }
});

// 在Node.js/Express后端，更新assignments表中的account字段
router.post('/reassign', async (req, res) => {
    const { testItemId, account, assignmentInfo } = req.body;
    try {
        await db.reassignTestToUser(assignmentInfo, account, testItemId);
        res.status(200).json({ message: 'Assignment successfully reassigned' });
    } catch (error) {
        console.error('Failed to reassign assignment:', error);
        res.status(500).send({ message: 'Failed to reassign', error: error.message });
    }
});


//更新状态
router.post('/update-status', async (req, res) => {
    try {
        await db.updateTestItemStatus(req.body); // 更新状态
        res.status(200).json({ success: true, message: "Test status updated successfully" });
    } catch (error) {
        console.error('Failed to update test status:', error);
        res.status(500).json({ success: false, message: "Failed to update status", error: error.message });
    }
});

//更新审批状态
router.post('/update-check', async (req, res) => {
    try {
        const { testItemId, status, checkNote } = req.body;
        await db.updateTestItemCheckStatus(testItemId, status, checkNote);
        res.json({ success: true, message: 'Test status updated successfully' });
    } catch (error) {
        console.error('Failed to update test status:', error);
        res.status(500).send({ message: 'Failed to update test status', error: error.message });
    }
});
// Get all test items assigned to a specific user
router.get('/assignments/:userId', async (req, res) => {
    let status = req.query.status; // 获取请求中的状态参数
    try {

        const results = await db.getAssignedTestsByUser(req.params.userId, status);
        res.json(results);
    } catch (error) {
        console.error('Failed to fetch assignments:', error);
        res.status(500).json({ success: false, message: "Failed to retrieve assignments", error: error.message });
    }
});


// 更新检测项目的标准价格
router.patch('/:testItemId/price', async (req, res) => {
    const { testItemId } = req.params;
    const { listedPrice } = req.body;
    try {
        await db.updateTestItemPrice(testItemId, listedPrice);
        res.json({ success: true, message: '标准价格更新成功' });
    } catch (error) {
        console.error('Failed to update test item price:', error);
        res.status(500).send({ message: '标准价格更新失败', error: error.message });
    }
});

// 更新检测项目的优惠价格
router.patch('/:testItemId/discount', async (req, res) => {
    const { testItemId } = req.params;
    const { discountedPrice } = req.body;
    try {
        await db.updateDiscountedPrice(testItemId, discountedPrice);
        res.json({ success: true, message: '优惠价格更新成功' });
    } catch (error) {
        console.error('Failed to update test item price:', error);
        res.status(500).send({ message: '优惠价格更新失败', error: error.message });
    }
});



// 获取同一组的用户
router.get('/equipments', async (req, res) => {
    try {
        const { departmentId } = req.query;
        const equipments = await db.getEquipmentsByDepartment(departmentId);
        res.json(equipments);
    } catch (error) {
        console.error('Failed to fetch equipments:', error);
        res.status(500).send({ message: 'Failed to fetch equipments', error: error.message });
    }
});


module.exports = router;
