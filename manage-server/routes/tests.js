const express = require('express');
const router = express.Router();
const db = require('../models/database'); // 确保数据库模块正确导入
const multer = require('multer')
const fs = require('fs');
const path = require('path')
const PizZip  = require('pizzip');
const Docx    = require('docxtemplater');

const ck = (cond) => (cond ? '☑' : '☐');

// multer 配置
const storage = multer.diskStorage({
destination(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'))
},
filename(req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/');
    // 把 originalname 从 latin1 解码成 utf8，避免中文乱码
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    // 以时间戳+原始名为基础，避免同名冲突
    let fileName = `${originalName}`;
    let count = 0;
    // 如已存在，则加序号
    while (fs.existsSync(path.join(uploadPath, fileName))) {
      count++;
      const ext = path.extname(originalName);
      const base = path.basename(originalName, ext);
      fileName = `${base}(${count})${ext}`;
    }
    cb(null, fileName);
  }
})
const upload = multer({ storage })

router.get('/', async (req, res) => {
    let status = req.query.status; // 获取请求中的状态参数
    let departmentId = req.query.departmentId; // 获取请求中的部门参数
    let account = req.query.account;
    let month = req.query.month;
    let customerName = req.query.customerName
    let orderNum = req.query.orderNum
    let role = req.query.role
    let filterTestData = req.query.filterTestData;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    try {
        //查询组长数据
        if (account != undefined && account != '') {
            const results = await db.getEmployeeTestItems(status, departmentId, account, month, customerName, orderNum, filterTestData, limit, offset);
            res.json(results);
        } else {
            const results = await db.getAllTestItems(status, departmentId, month, customerName, orderNum, filterTestData, role, limit, offset);
            res.json(results);
        }
    } catch (error) {
        console.error('Failed to fetch test items:', error);
        res.status(500).send({ message: 'Failed to fetch data', error: error.message });
    }
});

// Get all test items assigned to a specific user
router.get('/assignments/:userId', async (req, res) => {
    let status = req.query.status; // 获取请求中的状态参数
    let month = req.query.month;
    let customerName = req.query.customerName
    let orderNum = req.query.orderNum
    let filterTestData = req.query.filterTestData;

    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    try {
        const results = await db.getAssignedTestsByUser(req.params.userId, status, month, customerName, orderNum, filterTestData, limit, offset);
        res.json(results);
    } catch (error) {
        console.error('Failed to fetch assignments:', error);
        res.status(500).json({ success: false, message: "Failed to retrieve assignments", error: error.message });
    }
});


router.get('/count', async (req, res) => {
    let status = req.query.status;
    let departmentId = req.query.departmentId;
    let month = req.query.month;
    let customerName = req.query.customerName;
    let orderNum = req.query.orderNum;
    let role = req.query.role;
    let account = req.query.account;
    let filterTestData = req.query.filterTestData;
    try {
        let total = 0;
        if (role === 'supervisor' && account) {
            total = await db.getEmployeeTestItemsCount(status, departmentId, account, month, customerName, orderNum, filterTestData);
        } else if (role === 'sales' && account) {
            total = await db.getAssignedTestsCountByUser(account, status, month, customerName, orderNum, filterTestData);
        } else if (account) {
            total = await db.getAssignedTestsCountByUser(account, status, month, customerName, orderNum, filterTestData);
        } else {
            total = await db.getAllTestItemsCount(status, departmentId, month, customerName, orderNum, role, filterTestData);

        }

        res.json({ total });
    } catch (error) {
        console.error('Failed to get test item count:', error);
        res.status(500).send({ message: 'Failed to count test items', error: error.message });
    }
});

// Assign a test to a user
router.post('/assign', async (req, res) => {
    const {
        testItemId,
        role,
        assignmentInfo,
        equipment_id,
    } = req.body;

    if (!assignmentInfo || assignmentInfo === '') {
        return res.status(409).json({ success: false, message: `提交错误：请选择分配人员！` });

    }
    const connection = await db.getConnection(); // 获取数据库连接

    try {
        await connection.beginTransaction();
        // 获取该检测项目的所有分配记录
        const existingAssignments = await db.getAssignmentsByTestItemId(testItemId);
        // 检查当前用户是否已经分配过
        const alreadyAssigned = existingAssignments.find(a => a.account === assignmentInfo);
        if (alreadyAssigned) {
            // 如果是组长并选择了自己为执行人，更新 is_assigned 为 1
            if (role === 'supervisor' && assignmentInfo === alreadyAssigned.account) {
                const hasEmployeeAssigned = existingAssignments.some(a => a.role === 'employee' && a.is_assigned === 1);
                if (hasEmployeeAssigned) {
                    // 复制检测项目
                    const originalTestItem = await db.getTestItemById(testItemId);
                    if (!originalTestItem) {
                        await connection.rollback();
                        return res.status(404).json({ success: false, message: '未找到原始检测项目' });
                    }

                    // 创建新的检测项目
                    const newTestItemId = await db.duplicateTestItem({
                        ...originalTestItem,
                        equipment_id,
                        status: '1', // 新项目为未分配状态
                    });

                    const salesAssignment = existingAssignments.find(a => a.role === 'sales'); // 通过角色找到业务员
                    if (salesAssignment) {
                        await db.assignTestToUser(newTestItemId, salesAssignment.account, equipment_id, 'sales', 0); // 绑定业务员到新项目
                    }
                    // 分配新检测项目给组长
                    await db.assignTestToUser(newTestItemId, assignmentInfo, equipment_id, 'supervisor', 1);
                    await connection.commit();
                    return res.status(200).json({ success: true, message: "检测项目复制并分配成功!", newTestItemId });
                } else {
                    // 如果没有员工被指派，直接更新组长状态为执行人
                    await db.updateIsAssigned(testItemId, assignmentInfo, 1); // 更新为执行人
                    await db.updateAppointTime(testItemId);
                    await connection.commit();
                    return res.status(200).json({ success: true, message: `组长 ${assignmentInfo} 已选择自行完成检测项目` });
                }
            } else {
                await connection.rollback();
                return res.status(409).json({ success: false, message: `项目已分配给 ${assignmentInfo}` });
            }
        }


        // 如果是组长分配给别人（非自己），则复制检测项目
        if (role === 'supervisor') {
            const hasSupervisor = existingAssignments.some(a => a.is_assigned === 0);  // 是否已经有组长
            const hasEmployee = existingAssignments.some(a => a.role === 'employee' && a.is_assigned === 1);  
            const hasAssignedSupervisor = existingAssignments.some(a => a.role === 'supervisor' && a.is_assigned === 1);

            //两种情况：这个项目有不执行的组长+执行的组员；有自己执行的组长。
            //这些情况下都需要复制项目
            if ((hasSupervisor && hasEmployee) || hasAssignedSupervisor) {
                // 如果已有组长和员工，复制检测项目
                const originalTestItem = await db.getTestItemById(testItemId);
                if (!originalTestItem) {
                    await connection.rollback();
                    return res.status(404).json({ success: false, message: '未找到原始检测项目' });
                }

                // 创建新的检测项目
                const newTestItemId = await db.duplicateTestItem({
                    ...originalTestItem,
                    equipment_id,
                    status: '1', // 新项目为未分配状态
                });

                // 复制检测项目时，将原组长和实验员也分配到新项目
                const supervisorAssignment = existingAssignments.find(a => a.role === 'supervisor'); // 通过角色找到组长
                const salesAssignment = existingAssignments.find(a => a.role === 'sales'); // 通过角色找到业务员
                if (supervisorAssignment) {
                    await db.assignTestToUser(newTestItemId, supervisorAssignment.account, equipment_id, 'supervisor', 0); // 绑定组长到新项目
                }

                if (salesAssignment) {
                    await db.assignTestToUser(newTestItemId, salesAssignment.account, equipment_id,  'sales', 0); // 绑定业务员到新项目
                }

                // 分配新检测项目给新用户
                await db.assignTestToUser(newTestItemId, assignmentInfo, equipment_id, role, 1);
                await connection.commit();
                return res.status(200).json({ success: true, message: "检测项目复制并分配成功!", newTestItemId });
            }
        }

        //如果组长分配给组长。设置组长初始为不执行
        if (role === 'leader') {
            await db.assignTestToUser(testItemId, assignmentInfo, equipment_id, role, 0);

        } else {
            // 否则，按照正常组长逻辑。给分配的组员添加新记录
            await db.assignTestToUser(testItemId, assignmentInfo, equipment_id, role, 1);
        }
        await connection.commit();
        res.status(200).json({ success: true, message: "检测项目分配成功!" });

    } catch (error) {
        await connection.rollback();
        console.error('Failed to assign test:', error);
        res.status(500).json({ success: false, message: "分配项目失败！请联系开发者", error: error.message });
    } finally {
        connection.release(); // 释放连接
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
    const { testItemId, note, account } = req.body;
    try {
        await db.rollbackTest(account, testItemId, note);
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
        const { testItemId, status, checkNote, listedPrice, machine_hours } = req.body;
        await db.updateTestItemCheckStatus(testItemId, status, checkNote, listedPrice, machine_hours);
        res.json({ success: true, message: 'Test status updated successfully' });
    } catch (error) {
        console.error('Failed to update test status:', error);
        res.status(500).send({ message: 'Failed to update test status', error: error.message });
    }
});

//更新报告审批状态
router.post('/update-report-check', async (req, res) => {
    try {
        const { testItemId, status, reportNote } = req.body;
        await db.updateReportCheckStatus(testItemId, status, reportNote);
        res.json({ success: true, message: '报告审批状态更新成功' });
    } catch (error) {
        console.error('Failed to update report check status:', error);
        res.status(500).send({ message: '报告审批状态更新失败', error: error.message });
    }
});

//更新客户审查状态
router.post('/update-business-check', async (req, res) => {
    try {
        const { testItemId, status, businessNote } = req.body;
        await db.updateBusinessCheckStatus(testItemId, status, businessNote);
        res.json({ success: true, message: '业务审查状态更新成功' });
    } catch (error) {
        console.error('Failed to update business check status:', error);
        res.status(500).send({ message: '业务审查更新失败', error: error.message });
    }
});

//更新质量归档状态
router.post('/update-archive', async (req, res) => {
    try {
        const { testItemId, status, archiveNote } = req.body;
        await db.updateArchiveStatus(testItemId, status, archiveNote);
        res.json({ success: true, message: '归档状态更新成功' });
    } catch (error) {
        console.error('Failed to update archive status:', error);
        res.status(500).send({ message: '归档状态更新失败', error: error.message });
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
    const allowedFields = ['original_no', 'test_item', 'test_method', 'size', 'quantity', 'order_num', 'note', 'status', 'machine_hours', 'work_hours', 'listed_price', 'discounted_price', 'check_note', 'create_time', 'deadline', 'department_id', 'price_id'];
    const filteredFields = {};
    for (const key in updatedFields) {
        if (allowedFields.includes(key)) {
            // 检查是否是日期字段并转换格式
            if (['create_time'].includes(key) && updatedFields[key]) {
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
                end_time: item.end_time,
                equip_user_name: item.equip_user_name,
                equip_user: item.equip_user,
                operator: item.operator,
                operator_name: item.operator_name,
                sales_name: item.sales_name,
                customer_name: item.customer_name,
                contact_name: item.contact_name
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

// 导出检测项目excel的路由
router.post('/exportTestDataForSales', async (req, res) => {
    try {
        const { selectedOrders } = req.body;
        if (!selectedOrders || selectedOrders.length === 0) {
            return res.status(400).send('No test items provided');
        }
        // 获取数据库中的发票数据
        const tests = await db.getTestForExcelForSales(selectedOrders);  // 你可以根据实际情况调用数据库查询
        // 返回查询结果
        res.json(tests);
        return tests;
    } catch (error) {
        console.error(error);
        res.status(500).send('Error exporting data');
    }
});

router.get('/prices', async (req, res) => {
    try {
        const { searchTestCode, searchTestItem, searchTestCondition } = req.query;
        const results = await db.getPrices(searchTestCode, searchTestItem, searchTestCondition);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 查询所有的检测id(用于全选导出用)
router.get('/ids', async (req, res) => {
    const { status, departmentId, month, filterTestData, role, account } = req.query;
    try {
        const ids = await db.getAllTestItemIds(status, departmentId, month, filterTestData, role, account);
        res.json(ids);
    } catch (error) {
        console.error('Failed to fetch all test item IDs:', error);
        res.status(500).json({ message: 'Failed to fetch IDs', error: error.message });
    }
});

router.post('/getOrderNums', async (req, res) => {
    const { ids } = req.body;  // array
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: '参数 ids 不能为空' });
      }
    
      try {
        const rows = await db.getSelectedOrderNums(ids);
        if (!rows.length) {
          return res.status(404).json({ message: '未找到对应记录' });
        }
        res.json(rows);   // [{ test_item_id, order_num }, ...]
      } catch (err) {
        console.error('getOrderNums 出错:', err);
        res.status(500).json({ message: '服务器错误' });
      }
  });


router.get('/summary', async (req, res) => {
    const { role, account, departmentId } = req.query;
    try {
        const results = await db.getTestItemSummary(role, account, departmentId); // ✅ 使用新的函数
        res.json(results);
    } catch (error) {
        console.error('Failed to fetch homepage summary data:', error);
        res.status(500).json({ message: 'Failed to fetch homepage summary data', error: error.message });
    }
});

router.post(
    '/importAttachments',
    upload.single('file'),
    async (req, res) => {
      try {
        // 解析前端传来的 testItemIds
        let raw = req.body.testItemIds;
        const testItemIds = typeof raw === 'string'
          ? JSON.parse(raw)
          : raw;
  
        if (!req.file) {
          return res.status(400).json({ success: false, message: '未收到文件' });
        }
        if (!Array.isArray(testItemIds) || testItemIds.length === 0) {
          return res.status(400).json({ success: false, message: '请先选择检测项目' });
        }
        const projectId = Date.now();
        // 准备要插入的多条记录
        const filePath = `/uploads/${req.file.filename}`; 
        const details = testItemIds.map(id => ({
          filename: req.file.filename,
          filepath: filePath,
          test_item_id: id,
          category: '委托单附件',
          project_id : projectId
        }));
  
        // 调用你在 database.js 里写的 insertProjectFiles
        await db.insertProjectFiles(details);
  
        res.json({ success: true, message: '附件上传并关联成功' });
      } catch (err) {
        console.error('importAttachments error:', err);
        res.status(500).json({ success: false, message: '服务器错误' });
      }
    }
  );

  // POST /api/tests/exportCommissionWord
router.post('/exportCommissionWord', async (req, res) => {
    const { selectedOrders } = req.body;
    /* ---------- 1. 参数/一致性校验 ---------- */
    const rows = await db.getSelectedOrderNums(selectedOrders);
    const uniq = [...new Set(rows.map(r => r.order_num))];
    if (uniq.length !== 1) {
      return res.status(400).json({ message: '请选择同一个委托单下的检测项目' });
    }
    const orderNum = uniq[0];
    /* ---------- 2. 拉数据 ---------- */
    const info = await db.getCommissionInfo(orderNum, selectedOrders);

    if (!info) return res.status(404).send('委托单不存在');
    const { order, report = {}, sample = {}, items } = info;
  
    /* ---------- 3. 拼装 templateData ---------- */
    const hazardsArr = JSON.parse(sample.hazards || '[]');
    const toArr = (s) => (s ? String(s).split(',') : []);
  
    const templateData = {
      /* —— 订单信息 —— */
      serviceType1Symbol: ck(order.service_type === '1'),
      serviceType2Symbol: ck(order.service_type === '2'),
      serviceType3Symbol: ck(order.service_type === '3'),
      delivery_days_after_receipt: order.delivery_days_after_receipt || '',
      sample_shipping_address:     order.sample_shipping_address     || '',
      total_price:                 order.total_price                 || '',
      order_num:                   order.order_num,
      other_requirements:          order.other_requirements || '',
      subcontractingNotAcceptedSymbol: ck(order.subcontracting_not_accepted),
      /* 报告标识章 - 多选 */
      reportSeals1Symbol: ck(toArr(order.report_seals).includes('normal')),
      reportSeals2Symbol: ck(toArr(order.report_seals).includes('cnas')),
      reportSeals3Symbol: ck(toArr(order.report_seals).includes('cma')),
  
      /* —— 增值税 / 报告信息 —— */
      invoiceType1Symbol: ck(order.vat_type === '1'),
      invoiceType2Symbol: ck(order.vat_type === '2'),
  
      reportContent1Symbol: ck(toArr(report.type).includes('1')),
      reportContent2Symbol: ck(toArr(report.type).includes('2')),
      reportContent3Symbol: ck(toArr(report.type).includes('3')),
      reportContent4Symbol: ck(toArr(report.type).includes('4')),
      reportContent5Symbol: ck(toArr(report.type).includes('5')),
      reportContent6Symbol: ck(toArr(report.type).includes('6')),
  
      paperReportType1Symbol: ck(report.paper_report_shipping_type === '1'),
      paperReportType2Symbol: ck(report.paper_report_shipping_type === '2'),
      paperReportType3Symbol: ck(report.paper_report_shipping_type === '3'),
  
      headerType1Symbol: ck(report.header_type === 1),
      headerType2Symbol: ck(report.header_type === 2),
      header_additional_info: report.header_other || '',
  
      reportForm1Symbol: ck(report.format_type === 1),
      reportForm2Symbol: ck(report.format_type === 2),
      report_additional_info: report.report_additional_info || '',
  
      /* —— 样品处置 / 危险特性 —— */
      sampleHandlingType1Symbol: ck(sample.sample_solution_type === '1'),
      sampleHandlingType2Symbol: ck(sample.sample_solution_type === '2'),
      sampleHandlingType3Symbol: ck(sample.sample_solution_type === '3'),
      sampleHandlingType4Symbol: ck(sample.sample_solution_type === '4'),
      returnOptionSameSymbol:  ck(sample.returnAddressOption === 'same'),
      returnOptionOtherSymbol: ck(sample.returnAddressOption === 'other'),
      return_address:          sample.returnAddress || '',
  
      hazardSafetySymbol:       ck(hazardsArr.includes('Safety')),
      hazardFlammabilitySymbol: ck(hazardsArr.includes('Flammability')),
      hazardIrritationSymbol:   ck(hazardsArr.includes('Irritation')),
      hazardVolatilitySymbol:   ck(hazardsArr.includes('Volatility')),
      hazardFragileSymbol:      ck(hazardsArr.includes('Fragile')),
      hazardOtherSymbol:        ck(hazardsArr.includes('Other')),
      hazard_other: sample.hazard_other || '',
  
      magnetismNonMagneticSymbol: ck(sample.magnetism === 'Non-magnetic'),
      magnetismWeakMagneticSymbol: ck(sample.magnetism === 'Weak-magnetic'),
      magnetismStrongMagneticSymbol: ck(sample.magnetism === 'Strong-magnetic'),
      magnetismUnknownSymbol:      ck(sample.magnetism === 'Unknown'),
  
      conductivityConductorSymbol:    ck(sample.conductivity === 'Conductor'),
      conductivitySemiconductorSymbol:ck(sample.conductivity === 'Semiconductor'),
      conductivityInsulatorSymbol:    ck(sample.conductivity === 'Insulator'),
      conductivityUnknownSymbol:      ck(sample.conductivity === 'Unknown'),
  
      breakableYesSymbol: ck(sample.breakable === 'yes'),
      breakableNoSymbol:  ck(sample.breakable === 'no'),
      brittleYesSymbol:   ck(sample.brittle === 'yes'),
      brittleNoSymbol:    ck(sample.brittle === 'no'),
  
      /* —— 客户 —— */
      customer_name:        order.customer_name,
      customer_address:     order.customer_address,
      customer_contactName: order.contact_name,
      customer_contactEmail:order.contact_email,
      customer_contactPhone:order.contact_phone_num,
  
      /* —— 付款方 —— */
      payer_name:          order.payer_name,
      payer_address:       order.payer_address,
      payer_contactName:   order.payer_contact_name,
      payer_contactEmail:  order.payer_contact_email,
      payer_contactPhone:  order.payer_contact_phone_num,
      payer_bankName:      order.bank_name,
      payer_taxNumber:     order.tax_number,
      payer_bankAccount:   order.bank_account,
  
      /* —— 测试项目 —— */
      testItems: items.map(it => ({
        ...it,
        sampleTypeLabel: {1:'板材',2:'棒材',3:'粉末',4:'液体',5:'其他'}[it.sample_type] || '',
        samplePrepYesSymbol: ck(it.sample_preparation === 1),
        samplePrepNoSymbol:  ck(it.sample_preparation === 0),
      })),
    };
  
    /* ---------- 4. 渲染模板 ---------- */
    const tpl = fs.readFileSync(path.resolve(__dirname, '../templates/order_template.docx'), 'binary');
    const doc = new Docx(new PizZip(tpl), {
      paragraphLoop: true,
      linebreaks:    true,
      nullGetter:      ()=>'',
      undefinedGetter: ()=>'',
    });
    
    console.log(order)
    try {
      doc.render(templateData);
    } catch (e) {
      console.error('渲染错误:', e);
      return res.status(500).send('模板渲染失败');
    }
    const buf = doc.getZip().generate({ type: 'nodebuffer' });
  
    /* ---------- 5. 返回文件 ---------- */
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename=${orderNum}-${templateData.customer_name}-${templateData.contact_name}.docx`,
    });
    res.end(buf);
  });

module.exports = router;
