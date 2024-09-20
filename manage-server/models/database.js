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
            GROUP_CONCAT(DISTINCT u.name ORDER BY u.name) AS assigned_accounts
        FROM 
            test_items t
        JOIN 
            assignments a ON t.test_item_id = a.test_item_id
        JOIN 
	        users u on u.account = a.account
        WHERE 
            EXISTS (
                SELECT 1
                FROM assignments suba
                WHERE suba.test_item_id = t.test_item_id AND suba.account = ?
            )

    `;
    const params = [];
    params.push(account);
    if (departmentId !== undefined && departmentId !== '') {
        query += ' AND t.department_id = ?';
        params.push(departmentId);
        if (status !== undefined && status !== '') {
            query += ' AND t.status = ?';
            params.push(status);
        }
    }
    if(month !== undefined && month !== ''){
        query += ` AND DATE_FORMAT(t.create_time, '%Y-%m') = ?`;
            params.push(month);
    }
    query += `GROUP BY t.test_item_id;`;
    const [results] = await db.query(query, params);
    return results;
}



async function getAllTestItems(status, departmentId, month) {
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
            COALESCE(GROUP_CONCAT(DISTINCT u.name ORDER BY u.name), '') AS assigned_accounts
        FROM
            test_items t
        LEFT JOIN
            assignments a ON t.test_item_id = a.test_item_id
        left join 
            users u on u.account = a.account 
    `;
    const params = [];
    if (departmentId !== undefined && departmentId !== '') {
        query += ' WHERE t.department_id = ?';
        params.push(departmentId);
        if (status !== undefined && status !== '') {
            query += ' AND t.status = ?';
            params.push(status);
        }
    } else {
        if (status !== undefined && status !== '') {
            query += ' WHERE t.status = ?';
            params.push(status);
        }
    }
    if(month !== undefined && month !== ''){
        query += ` AND DATE_FORMAT(t.create_time, '%Y-%m') = ?`;
            params.push(month);
    }
    query += `GROUP BY t.test_item_id;`;

    const [results] = await db.query(query, params);
    return results;
}


async function assignTestToUser(testId, userId) {
    const query = 'INSERT INTO assignments (test_item_id, account) VALUES (?, ?)';
    const updateQuery = 'UPDATE test_items SET status = ? WHERE test_item_id = ?';
    await db.query(query, [testId, userId]);
    await db.query(updateQuery, ['1', testId])
}

async function reassignTestToUser(newAccount, testItemId) {
    const query = `UPDATE assignments SET account = ? WHERE test_item_id = ?`;
    await db.query(query, [newAccount, testItemId]);
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
            ti.test_item_id,
            ti.original_no,
            ti.test_item,
            ti.test_method,
            ti.order_num,
            ti.status,
            ti.machine_hours,
            ti.work_hours,
            ti.listed_price,
            ti.discounted_price,
            ti.equipment_id,
            ti.check_note,
            ti.create_time,
            ti.deadline
        FROM assignments a
        JOIN test_items ti ON a.test_item_id = ti.test_item_id
        WHERE a.account = ?
    `;

    const params = [];

    if (status !== undefined && status !== '') {
        query += ' AND ti.status = ?';
        params.push(status);
    }
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


module.exports = {
    findUserByAccount,
    getAllOrders,
    updateOrder,
    deleteOrder,
    assignTestToUser,
    updateTestItemStatus,
    getAllSamples,
    getAllTestItems,
    getEmployeeTestItems,
    getAssignedTestsByUser,
    reassignTestToUser,
    updateTestItemPrice,
    getAllSupervisors,
    getAllEmployees,
    getUsersByGroupId,
    updateTestItemCheckStatus,
    getAssignmentsInfo,
    getEquipmentsByDepartment,
    getEmployeeWorkStats,
    getMachineWorkStats,
    getAllMonths,
    updateDiscountedPrice
};