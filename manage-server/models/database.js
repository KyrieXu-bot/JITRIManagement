const db = require('../config/dbConfig'); // 确保路径正确

/**
 * 根据账号查找用户
 * @param {string} account 用户账号
 * @returns {Promise<object>} 用户对象或null
 */
async function findUserByAccount(account) {
    const query = 'SELECT * FROM users WHERE account = ?';
    const [results] = await db.query(query, [account]);
    return results[0] || null;
}

async function getAllOrders() {
    const query = `
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
    `;
    const [results] = await db.query(query);
    return results;
}

async function updateOrder(orderNum, updateData) {
    let updates = [];
    let values = [];

    Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
            updates.push(`${key} = ?`);
            values.push(updateData[key]);
        }
    });

    if (updates.length === 0) {
        throw new Error('No valid fields provided for update');
    }

    values.push(orderNum);
    const sql = `UPDATE orders SET ${updates.join(', ')} WHERE order_num = ?`;
    await db.query(sql, values);
}

async function deleteOrder(orderNum) {
    const sql = `DELETE FROM orders WHERE order_num = ?`;
    await db.query(sql, [orderNum]);
}


async function getAllSamples() {
    const query = `
        SELECT 
            s.sample_name,
            s.material,
            s.product_no,
            s.material_spec,
            s.sample_solution_type,
            s.sample_type,
            s.order_num
        FROM samples s
    `;
    const [results] = await db.query(query);
    return results;
}

// async function getEmployeeTestItems(status, departmentId, account, month) {
//     let query = `
//         SELECT 
//             t.test_item_id,
//             t.original_no,
//             t.test_item,
//             t.test_method,
//             t.order_num,
//             t.status,
//             t.machine_hours,
//             t.work_hours,
//             t.listed_price,
//             t.discounted_price,
//             t.equipment_id,
//             t.check_note,
//             t.create_time,
//             t.deadline,
//             e.equipment_name,
//             e.model,
//             GROUP_CONCAT(DISTINCT u.name ORDER BY u.name) AS assigned_accounts
//         FROM 
//             test_items t
//         JOIN 
//             assignments a ON t.test_item_id = a.test_item_id
//         JOIN 
//             equipment e ON e.equipment_id = t.equipment_id
//         JOIN 
// 	        users u on u.account = a.account
//         WHERE 
//             EXISTS (
//                 SELECT 1
//                 FROM assignments suba
//                 WHERE suba.test_item_id = t.test_item_id AND suba.account = ?
//             )

//     `;
//     const params = [];
//     params.push(account);
//     if (departmentId !== undefined && departmentId !== '') {
//         query += ' AND t.department_id = ?';
//         params.push(departmentId);
//         if (status !== undefined && status !== '') {
//             query += ' AND t.status = ?';
//             params.push(status);
//         }
//     }
//     if(month !== undefined && month !== ''){
//         query += ` AND DATE_FORMAT(t.create_time, '%Y-%m') = ?`;
//             params.push(month);
//     }
//     query += `GROUP BY t.test_item_id;`;
//     const [results] = await db.query(query, params);
//     return results;
// }

async function getEmployeeTestItems(status, departmentId, account, month) {
    let query = `
        SELECT 
            t.test_item_id,
            t.original_no,
            t.test_item,
            t.test_method,
            t.order_num,
            t.status,
            t.machine_hours,
            t.work_hours,
            t.listed_price,
            t.discounted_price,
            t.equipment_id,
            t.check_note,
            t.create_time,
            t.deadline,
            IFNULL(e.equipment_name, '') AS equipment_name,
            e.model,
            GROUP_CONCAT(DISTINCT u.name ORDER BY u.name) AS assigned_accounts
        FROM 
            test_items t
        LEFT JOIN 
            assignments a ON t.test_item_id = a.test_item_id
        LEFT JOIN 
            equipment e ON e.equipment_id = t.equipment_id
        JOIN 
	        users u ON u.account = a.account
        WHERE 
            EXISTS (
                SELECT 1
                FROM assignments suba
                WHERE suba.test_item_id = t.test_item_id AND suba.account = ?
            )
    `;

    const params = [account];  // 将 account 添加为第一个参数

    // 动态构建 WHERE 子句
    if (departmentId !== undefined && departmentId !== '') {
        query += ' AND t.department_id = ?';
        params.push(departmentId);
    }

    if (status !== undefined && status !== '') {
        query += ' AND t.status = ?';
        params.push(status);
    }

    if (month !== undefined && month !== '') {
        query += ` AND DATE_FORMAT(t.create_time, '%Y-%m') = ?`;
        params.push(month);
    }

    // 按 test_item_id 进行分组
    query += ` GROUP BY t.test_item_id, e.equipment_name, e.model;`;

    const [results] = await db.query(query, params);
    return results;
}


// async function getAllTestItems(status, departmentId, month) {
//     let query = `
//         SELECT 
//             t.test_item_id,
//             t.original_no,
//             t.test_item,
//             t.test_method,
//             t.order_num,
//             t.status,
//             t.machine_hours,
//             t.work_hours,
//             t.listed_price,
//             t.discounted_price,
//             t.equipment_id,
//             t.check_note,
//             t.create_time,
//             t.deadline,
//             e.equipment_name,
//             e.model,
//             COALESCE(GROUP_CONCAT(DISTINCT u.name ORDER BY u.name), '') AS assigned_accounts
//         FROM
//             test_items t
//         LEFT JOIN
//             assignments a ON t.test_item_id = a.test_item_id
//         LEFT JOIN 
//             equipment e ON e.equipment_id = t.equipment_id
//         left join 
//             users u on u.account = a.account 
//     `;
//     const params = [];
//     if (departmentId !== undefined && departmentId !== '') {
//         query += ' WHERE t.department_id = ?';
//         params.push(departmentId);
//         if (status !== undefined && status !== '') {
//             query += ' AND t.status = ?';
//             params.push(status);
//         }
//     } else {
//         if (status !== undefined && status !== '') {
//             query += ' WHERE t.status = ?';
//             params.push(status);
//         }
//     }
//     if(month !== undefined && month !== ''){
//         query += ` AND DATE_FORMAT(t.create_time, '%Y-%m') = ?`;
//             params.push(month);
//     }
//     query += `GROUP BY t.test_item_id;`;

//     const [results] = await db.query(query, params);
//     return results;
// }



async function getAllTestItems(status, departmentId, month, employeeName) {
    let query = `
        SELECT 
            t.test_item_id,
            t.original_no,
            t.test_item,
            t.test_method,
            t.size,
            t.quantity,
            t.order_num,
            t.note,
            t.status,
            t.machine_hours,
            t.work_hours,
            t.listed_price,
            t.discounted_price,
            t.equipment_id,
            t.check_note,
            t.create_time,
            t.deadline,
            t.department_id,
            t.start_time,
            t.end_time,
            IFNULL(e.equipment_name, '') AS equipment_name,
            e.model,
            (SELECT COALESCE(GROUP_CONCAT(DISTINCT ua.name ORDER BY ua.name SEPARATOR ', '), '') 
             FROM assignments aa 
             JOIN users ua ON ua.account = aa.account
             WHERE aa.test_item_id = t.test_item_id) AS assigned_accounts
        FROM
            test_items t
        LEFT JOIN
            assignments a ON t.test_item_id = a.test_item_id
        LEFT JOIN 
            equipment e ON e.equipment_id = t.equipment_id
        LEFT JOIN 
            users u ON u.account = a.account 
    `;

    const params = [];
    let whereClauseAdded = false;
    // 动态添加 WHERE 条件
    if (departmentId !== undefined && departmentId !== '') {
        query += ' WHERE t.department_id = ?';
        params.push(departmentId);
        whereClauseAdded = true;
    }

    if (status !== undefined && status !== '') {
        query += (whereClauseAdded ? ' AND' : ' WHERE') + ' t.status = ?';
        params.push(status);
        whereClauseAdded = true;
    }

    if (month !== undefined && month !== '') {
        query += (whereClauseAdded ? ' AND' : ' WHERE') + ` DATE_FORMAT(t.create_time, '%Y-%m') = ?`;
        params.push(month);
        whereClauseAdded = true;
    }

    if (employeeName !== undefined && employeeName !== '') {
        query += (whereClauseAdded ? ' AND' : ' WHERE') + ' u.name LIKE ?';
        params.push(`%${employeeName}%`);
        whereClauseAdded = true;
    }
    // 按照 test_item_id 和 equipment_name 分组
    query += ` GROUP BY t.test_item_id, e.equipment_name, e.model;`;
    const [results] = await db.query(query, params);

    return results;
}

async function assignTestToUser(testId, userId, equipment_id, start_time, end_time) {
    const query = 'INSERT INTO assignments (test_item_id, account) VALUES (?, ?)';
    const updateQuery =
        `UPDATE test_items 
            SET status = ?, equipment_id = ?, start_time = ?, end_time = ? 
            WHERE test_item_id = ?
        `;
    try {
        // 执行插入分配的用户信息
        await db.query(query, [testId, userId]);
        // 执行更新 test_items 的状态、设备ID、设备开始和结束时间
        await db.query(updateQuery, ['1', equipment_id, start_time, end_time, testId]);
    } catch (error) {
        console.error('Error assigning test to user:', error);
        throw new Error('Failed to assign test and update test item.');
    }
}

async function reassignTestToUser(newAccount, account, testItemId) {
    const query = `UPDATE assignments SET account = ? WHERE test_item_id = ? AND account = ? `;
    await db.query(query, [newAccount, testItemId, account]);
}


async function updateTestItemStatus(finishData) {
    const query = `UPDATE 
                    test_items 
                        SET 
                            status =  ? ,
                            machine_hours = ?,
                            work_hours = ?,
                            equipment_id = ?
                            WHERE test_item_id = ?`;
    try {
        await db.query(query, [finishData.status, finishData.machine_hours, finishData.work_hours, finishData.equipment_id, finishData.testId]);
    } catch (error) {
        console.error('Failed to update test item status:', error);
        throw error; // Rethrowing the error is important if you want to handle it further up, e.g., in an Express route.
    }
}

async function updateTestItemCheckStatus(testItemId, status, checkNote) {
    const query = `
        UPDATE test_items
        SET status = ?, check_note = ?
        WHERE test_item_id = ?
    `;
    await db.query(query, [status, checkNote, testItemId]);
}

async function getAssignedTestsByUser(userId, status) {
    let query = `
 SELECT 
        t.test_item_id,
        t.original_no,
        t.test_item,
        t.test_method,
        t.order_num,
        t.status,
        t.machine_hours,
        t.work_hours,
        t.listed_price,
        t.discounted_price,
        t.equipment_id,
        t.check_note,
        t.create_time,
        t.deadline,
        IFNULL(e.equipment_name, '') AS equipment_name,
        e.model,
        GROUP_CONCAT(DISTINCT u.name ORDER BY u.name) AS assigned_accounts
    FROM 
        test_items t
    LEFT JOIN 
        equipment e ON e.equipment_id = t.equipment_id
    JOIN 
        assignments a ON t.test_item_id = a.test_item_id
    JOIN 
        users u ON u.account = a.account
    WHERE 
        EXISTS (
            SELECT 1
            FROM assignments suba
            WHERE suba.test_item_id = t.test_item_id AND suba.account = ?
        )

    `;

    const params = [];

    if (status !== undefined && status !== '') {
        query += ' AND ti.status = ?';
        params.push(status);
    }
    query += '    GROUP BY t.test_item_id';
    const [results] = await db.query(query, [userId, status]);
    return results;
}


async function updateTestItemPrice(testItemId, listedPrice) {
    const query = `UPDATE test_items SET listed_price = ? WHERE test_item_id = ?`;
    const [results] = await db.query(query, [listedPrice, testItemId]);
    return results;
}

async function updateDiscountedPrice(testItemId, listedPrice) {
    const query = `UPDATE test_items SET discounted_price = ? WHERE test_item_id = ?`;
    const [results] = await db.query(query, [listedPrice, testItemId]);
    return results;
}


async function getAllSupervisors(departmentId) {
    const query = `
        SELECT 
            u.name,
            u.account
        FROM users u
        WHERE u.role = 'supervisor' AND u.department_id = ?

    `;
    const [results] = await db.query(query, [departmentId]);
    return results;
}

async function getAllEmployees(departmentId) {
    const query = `
        SELECT 
            u.name,
            u.account
        FROM users u
        WHERE u.role = 'employee' AND u.department_id = ?

    `;
    const [results] = await db.query(query, [departmentId]);
    return results;
}


async function getUsersByGroupId(groupId) {
    const query = `
        SELECT 
            u.name,
            u.account,
            u.role
        FROM users u
        WHERE u.group_id = ?
    `;
    const [results] = await db.query(query, [groupId]);
    return results;
}


async function getAssignmentsInfo(testItemId, account) {
    const query = `
        SELECT 
            test_item_id,
            account
        FROM assignments
        WHERE test_item_id = ? AND account = ?
    `;
    const [results] = await db.query(query, [testItemId, account]);
    return results;
}

async function getEquipmentsByDepartment(departmentId) {
    const query = `
        SELECT 
            equipment_id,
            equipment_name,
            model
        FROM equipment
        WHERE department_id = ?
    `;
    const [results] = await db.query(query, departmentId);
    return results;
}

// 获取员工的总机时和工时
async function getEmployeeWorkStats(departmentId) {
    const query = `
        SELECT 
            u.account,
            u.name,
            COALESCE(SUM(t.machine_hours), 0) AS total_machine_hours,
            COALESCE(SUM(t.work_hours), 0) AS total_work_hours,
            COALESCE(SUM(t.size), 0) AS total_samples,
            COALESCE(SUM(t.listed_price), 0) AS total_listed_price
        FROM 
            users u
        LEFT JOIN 
            assignments a ON u.account = a.account
        LEFT JOIN 
            test_items t ON a.test_item_id = t.test_item_id AND t.department_id = u.department_id
        WHERE 
            u.department_id = ?
        GROUP BY 
            u.account, u.name
        ;

    `;
    try {
        const [results] = await db.query(query, [departmentId]);
        return results;
    } catch (error) {
        console.error('Failed to fetch employee work stats:', error);
        throw error;
    }
}


// 获取员工的总机时和工时
async function getMachineWorkStats(departmentId) {
    const query = `
        SELECT
            e.equipment_id,
            e.equipment_name,
            SUM(t.machine_hours) AS total_machine_hours
        FROM
            equipment e
        LEFT JOIN
            test_items t ON e.equipment_id = t.equipment_id
        WHERE e.department_id = ?
        GROUP BY
            e.equipment_id, e.equipment_name;

    `;
    try {
        const [results] = await db.query(query, [departmentId]);
        return results;

    } catch (error) {
        console.error('Failed to fetch employee work stats:', error);
        throw error;
    }
}

//获取设备的使用数据
async function getEquipmentTimeline(departmentId) {
    const query = `
        SELECT 
            e.equipment_name, 
            e.model, 
            t.start_time, 
            t.end_time
        FROM 
            test_items t
        JOIN 
            equipment e ON t.equipment_id = e.equipment_id
        WHERE 
            t.department_id = ?;
    `;
    try {
        const [results] = await db.query(query, [departmentId]);
        return results;
    } catch (error) {
        console.error('Error fetching equipment timeline from database:', error);
        throw new Error('Failed to fetch equipment timeline');
    }

}

// 获取所有月份
async function getAllMonths() {
    const query = `
        SELECT DISTINCT 
            DATE_FORMAT(create_time, '%Y-%m') as month
        FROM 
            test_items
        WHERE 
            create_time is not null
        ORDER BY 
            month DESC;

    `;
    try {
        const [results] = await db.query(query);
        return results;
    } catch (error) {
        console.error('Failed to fetch employee work stats:', error);
        throw error;
    }
}


// 更新检测项目
async function updateTestItem(testItemId, updatedFields) {
    try {
        // 构造动态 SQL 查询
        const fields = Object.keys(updatedFields);
        const values = Object.values(updatedFields);

        if (fields.length === 0) {
            throw new Error('没有提供需要更新的字段');
        }

        // 使用字段名和占位符生成 SQL
        const setClause = fields.map((field) => `${field} = ?`).join(', ');

        const query = `
            UPDATE test_items
            SET ${setClause}
            WHERE test_item_id = ?;
        `;

        // 执行查询
        const result = await db.query(query, [...values, testItemId]);

        return result; // 返回执行结果
    } catch (error) {
        console.error('Error updating test item:', error);
        throw error;
    }
}



module.exports = {
    findUserByAccount,
    deleteOrder,
    assignTestToUser,
    reassignTestToUser,
    getAllOrders,
    getAllSamples,
    getAllTestItems,
    getEmployeeTestItems,
    getAssignedTestsByUser,
    getAllSupervisors,
    getAllEmployees,
    getUsersByGroupId,
    getAssignmentsInfo,
    getEquipmentsByDepartment,
    getEmployeeWorkStats,
    getMachineWorkStats,
    getAllMonths,
    getEquipmentTimeline,
    updateOrder,
    updateTestItemPrice,
    updateTestItemStatus,
    updateTestItemCheckStatus,
    updateDiscountedPrice,
    updateTestItem
};