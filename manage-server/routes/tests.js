const express = require('express');
const router = express.Router();
const db = require('../models/database'); // 确保数据库模块正确导入

router.get('/', async (req, res) => {
    let status = req.query.status; // 获取请求中的状态参数
    let departmentId = req.query.departmentId; // 获取请求中的部门参数
    let account = req.query.account;
    let month = req.query.month;
    let employeeName = req.query.employeeName
    let orderNum = req.query.orderNum
    try {
        //查询组长数据
        if(account != undefined && account != ''){
            const results = await db.getEmployeeTestItems(status, departmentId, account,month, employeeName, orderNum);
            res.json(results);

        } else{
            const results = await db.getAllTestItems(status, departmentId, month, employeeName, orderNum);
            res.json(results);
        }
    } catch (error) {
        console.error('Failed to fetch test items:', error);
        res.status(500).send({ message: 'Failed to fetch data', error: error.message });
    }
});

// Assign a test to a user
router.post('/assign', async (req, res) => {
    const { 
        testItemId, 
        role,
        assignmentInfo, 
        equipment_id, 
        start_time, 
        end_time 
    } = req.body;

    try {
        if(!assignmentInfo || assignmentInfo === ''){
            return res.status(409).json({ success: false, message: `提交错误：请选择分配人员！` });

        }
        const results = await db.getAssignmentsInfo(testItemId, assignmentInfo)
        if(!results || results.length === 0){
            const employeeCount = await db.checkAssign(testItemId);
            if (employeeCount >= 2) {
                // More than 3 employees already assigned, return an error
                return res.status(409).json({ success: false, message: "错误：只能分配一个员工做实验!" });
            }
            await db.assignTestToUser(testItemId, assignmentInfo, equipment_id, start_time, end_time, role);
            res.status(200).json({ success: true, message: "检测项目分配成功!" });
        }else{
            const userResult = await db.findUserByAccount(assignmentInfo);
            if(userResult.role != 'supervisor' || userResult.role != 'sales'){
                // 如果数据库查询结果表明该项目已被分配并且不是组长指派的
                res.status(409).json({ success: false, message: `错误：项目已经分配给${userResult.name}(${userResult.account})了！` });
            }else{
                res.status(200).json({ success: true, message: "检测项目分配成功!" });
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
    let month = req.query.month;
    let employeeName = req.query.employeeName
    let orderNum = req.query.orderNum
    try {
        const results = await db.getAssignedTestsByUser(req.params.userId, status, month, employeeName, orderNum);
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


// 添加检测项目
router.patch('/add', async (req, res) => {
    const addedFields = req.body;
    try {
        // 调用 db 方法进行数据库更新
        const result = await db.addTestItem(addedFields);
        if (result.affectedRows > 0) {
            res.json({ success: true, message: '检测项目新增成功' });
        } else {
            res.status(404).json({ success: false, message: '检测项目新增失败' });
        }
    } catch (error) {
        console.error('Failed to add test item:', error);
        res.status(500).send({ message: '新增失败', error: error.message });
    }
});


// 更新检测项目
router.patch('/:testItemId', async (req, res) => {
    const { testItemId } = req.params;
    const updatedFields = req.body;
    // 过滤掉不需要更新的字段
    const allowedFields = ['original_no', 'test_item', 'test_method', 'size', 'quantity', 'order_num', 'note', 'status', 'machine_hours', 'work_hours', 'listed_price', 'discounted_price', 'check_note', 'create_time', 'deadline', 'department_id', 'start_time', 'end_time'];
    const filteredFields = {};
    for (const key in updatedFields) {
        if (allowedFields.includes(key)) {
            // 检查是否是日期字段并转换格式
            if (['create_time', 'start_time', 'end_time'].includes(key) && updatedFields[key]) {
                filteredFields[key] = formatDateForMySQL(updatedFields[key]);
            } else {
                filteredFields[key] = updatedFields[key];
            }
        }
    }
    try {

        // 调用 db 方法进行数据库更新
        const [result] = await db.updateTestItem(testItemId, filteredFields);
        if (result.affectedRows > 0) {
            res.json({ success: true, message: '检测项目更新成功' });
        } else {
            res.status(404).json({ success: false, message: '检测项目未找到' });
        }
    } catch (error) {
        console.error('Failed to update test item:', error);
        res.status(500).send({ message: '更新失败', error: error.message });
    }
});


// 将 ISO 日期格式转换为 MySQL 的日期时间格式 YYYY-MM-DD HH:MM:SS
const formatDateForMySQL = (isoDate) => {
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};


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


// 删除检测项目
router.delete('/:testItemId', async (req, res) => {
    const { testItemId } = req.params;

    try {
        // 调用数据库方法删除 test_item_id 相关的数据
        const result = await db.deleteTestItem(testItemId);
        if (result.affectedRows > 0) {
            res.json({ success: true, message: '检测项目删除成功' });
        } else {
            res.status(404).json({ success: false, message: '检测项目未找到' });
        }
    } catch (error) {
        console.error('Failed to delete test item:', error);
        res.status(500).send({ message: '删除失败', error: error.message });
    }
});


module.exports = router;
