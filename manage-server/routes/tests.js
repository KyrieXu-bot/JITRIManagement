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
        if (account != undefined && account != '') {
            const results = await db.getEmployeeTestItems(status, departmentId, account, month, employeeName, orderNum);
            res.json(results);

        } else {
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
        if (!assignmentInfo || assignmentInfo === '') {
            return res.status(409).json({ success: false, message: `提交错误：请选择分配人员！` });

        }
        // 获取该检测项目的所有分配记录
        const existingAssignments = await db.getAssignmentsByTestItemId(testItemId);

        // 检查当前用户是否已经分配过
        const alreadyAssigned = existingAssignments.find(a => a.account === assignmentInfo);
        if (alreadyAssigned) {
            // 如果是组长并选择了自己为执行人，更新 is_assigned 为 1
            if (role === 'supervisor' && assignmentInfo === alreadyAssigned.account) {
                await db.updateIsAssigned(testItemId, assignmentInfo, 1); // 更新为执行人
                return res.status(200).json({ success: true, message: `组长 ${assignmentInfo} 已选择自行完成检测项目` });
            } else {
                return res.status(409).json({ success: false, message: `项目已分配给 ${assignmentInfo}` });
            }
        }


        // 如果是组长分配给别人（非自己），则复制检测项目
        if (role === 'supervisor') {
            const hasSupervisor = existingAssignments.some(a => a.is_assigned === 0);  // 是否已经有组长
            const hasEmployee = existingAssignments.some(a => a.is_assigned === 1);    // 是否已经有员工
            const hasAssignedSupervisor = existingAssignments.some(a => a.is_assigned === 1);  // 是否已经有组长自己做的

            //两种情况：这个项目有不执行的组长+执行的组员；有自己执行的组长。
            //这些情况下都需要复制项目
            if ((hasSupervisor && hasEmployee) || hasAssignedSupervisor) {
                // 如果已有组长和员工，复制检测项目
                const originalTestItem = await db.getTestItemById(testItemId);
                if (!originalTestItem) {
                    return res.status(404).json({ success: false, message: '未找到原始检测项目' });
                }

                // 创建新的检测项目
                const newTestItemId = await db.duplicateTestItem({
                    ...originalTestItem,
                    equipment_id,
                    start_time,
                    end_time,
                    status: '1', // 新项目为未分配状态
                });


                // 复制检测项目时，将原组长和实验员也分配到新项目
                const supervisorAssignment = existingAssignments.find(a => a.role === 'supervisor'); // 通过角色找到组长
                if (supervisorAssignment) {
                    await db.assignTestToUser(newTestItemId, supervisorAssignment.account, equipment_id, start_time, end_time, 'supervisor', 0); // 绑定组长到新项目
                }

                // 分配新检测项目给新用户
                await db.assignTestToUser(newTestItemId, assignmentInfo, equipment_id, start_time, end_time, role, 1);

                return res.status(200).json({ success: true, message: "检测项目复制并分配成功!", newTestItemId });
            }
        }

        //如果组长分配给组长。设置组长初始为不执行
        if (role === 'leader') {
            await db.assignTestToUser(testItemId, assignmentInfo, equipment_id, start_time, end_time, role, 0);

        } else {
            // 否则，按照正常组长逻辑。给分配的组员添加新记录
            await db.assignTestToUser(testItemId, assignmentInfo, equipment_id, start_time, end_time, role, 1);
        }

        res.status(200).json({ success: true, message: "检测项目分配成功!" });

    } catch (error) {
        console.error('Failed to assign test:', error);
        res.status(500).json({ success: false, message: "分配项目失败！请联系开发者", error: error.message });
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

router.post('/rollback', async (req, res) => {
    const { testItemId, account } = req.body;

    try {
        await db.rollbackTest(account, testItemId);
        res.status(200).json({ message: 'Assignment successfully rollback' });
    } catch (error) {
        console.error('Failed to rollback assignment:', error);
        res.status(500).send({ message: 'Failed to rollback', error: error.message });
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


// 交付检测项目
router.patch('/:testItemId/deliver', async (req, res) => {
    const { testItemId } = req.params;
    const { status } = req.body;
    try {
        await db.deliverTest(testItemId, status);
        res.json({ success: true, message: '交付状态设置成功' });
    } catch (error) {
        console.error('Failed to deliver test item:', error);
        res.status(500).send({ message: '交付状态更新失败', error: error.message });
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


// 获取同一组的设备
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

// 获取设备的预约情况
router.get('/equipments/schedule', async (req, res) => {
    try {
        const { departmentId } = req.query;
        // 1. 获取所有设备的基本信息
        const equipments = await db.getEquipmentsByDepartment(departmentId);

        // 2. 获取设备的预约情况
        const testItems = await db.getEquipmentReservations();

        // 3. 创建一个设备ID到预约记录的映射
        const equipmentSchedule = {};

        // 将预约记录按设备ID分组
        testItems.forEach(item => {
            if (!equipmentSchedule[item.equipment_id]) {
                equipmentSchedule[item.equipment_id] = [];
            }
            equipmentSchedule[item.equipment_id].push({
                order_num: item.order_num,
                test_item: item.test_item,
                start_time: item.start_time,
                end_time: item.end_time
            });
        });

        // 4. 合并设备信息和预约记录
        const result = equipments.map(equipment => {
            return {
                equipment_id: equipment.equipment_id,
                equipment_name: equipment.equipment_name,
                model: equipment.model,
                equipment_label: equipment.equipment_label,
                reservations: equipmentSchedule[equipment.equipment_id] || [] // 如果没有预约，返回空数组
            };
        });

        // 返回合并后的设备预约信息
        res.json(result);
    } catch (error) {
        console.error('Failed to fetch equipment schedule:', error);
        res.status(500).send({ message: 'Failed to fetch equipment schedule', error: error.message });
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


// 路由处理：检查时间冲突
router.get('/checkTimeConflict', async (req, res) => {
    const { equipment_id, start_time, end_time } = req.query;

    // 转换时间格式
    const start = new Date(start_time);
    const end = new Date(end_time);

    try {
        // 调用数据库方法检查时间冲突
        const conflictInfo = await db.checkTimeConflict(equipment_id, start, end);
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

// 导出检测项目excel的路由
router.post('/exportTestData', async (req, res) => {
    try {
        const { selectedOrders } = req.body;
        if (!selectedOrders || selectedOrders.length === 0) {
            return res.status(400).send('No test items provided');
        }
        // 获取数据库中的发票数据
        const tests = await db.getTestForExcel(selectedOrders);  // 你可以根据实际情况调用数据库查询
        // 返回查询结果
        res.json(tests);
        return tests;
    } catch (error) {
        console.error(error);
        res.status(500).send('Error exporting data');
    }
});



module.exports = router;
