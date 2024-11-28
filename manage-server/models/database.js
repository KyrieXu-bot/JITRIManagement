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

async function getAllOrders(orderNum, departmentId) {
    let query = `
        SELECT 
            o.order_num, 
            c.customer_name, 
            c.contact_name, 
            c.contact_phone_num, 
            c.contact_email, 
            p.payer_contact_name, 
            p.payer_contact_phone_num,
            p.payer_address,
            GROUP_CONCAT(t.test_item SEPARATOR ', ') AS test_items,
            s.material,
            o.service_type,
            o.order_status,
            SUM(t.discounted_price) AS total_discounted_price,
            u.name
        FROM orders o
        JOIN customers c ON o.customer_id = c.customer_id
        JOIN payments p ON o.payment_id = p.payment_id
        JOIN test_items t ON o.order_num = t.order_num
        JOIN samples s ON o.order_num = s.order_num
        LEFT JOIN assignments a ON t.test_item_id = a.test_item_id
        LEFT JOIN users u ON a.account = u.account
    `;
    const params = [];
    query += 'WHERE u.role = ?';
    params.push('sales');
    if (orderNum !== undefined && orderNum !== '') {
        query += ' AND o.order_num LIKE ?';
        params.push(`%${orderNum}%`);
    }
    if (departmentId !== undefined && departmentId !== '') {
        query += 'AND t.department_id = ?';
        params.push(departmentId);
    }
    
    query += `GROUP BY o.order_num, c.customer_name, c.contact_name, c.contact_phone_num, 
                c.contact_email, p.payer_contact_name, p.payer_contact_phone_num, 
                p.payer_address, o.service_type, o.order_status, u.name`;
    const [results] = await db.query(query, params);
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
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. 删除 assignments 表中的记录
        let sql = `
            DELETE FROM assignments 
            WHERE test_item_id IN (
                SELECT test_item_id FROM test_items WHERE order_num = ?
            )`;
        await connection.query(sql, [orderNum]);

        // 2. 删除 test_items 表中的记录
        sql = `DELETE FROM test_items WHERE order_num = ?`;
        await connection.query(sql, [orderNum]);

        // 3. 删除 reports 表中的记录
        sql = `DELETE FROM reports WHERE order_num = ?`;
        await connection.query(sql, [orderNum]);

        // 4. 删除 samples 表中的记录
        sql = `DELETE FROM samples WHERE order_num = ?`;
        await connection.query(sql, [orderNum]);

        // 5. 删除 orders 表中的记录
        sql = `DELETE FROM orders WHERE order_num = ?`;
        await connection.query(sql, [orderNum]);

        // 6. 删除 payments 表中的记录
        sql = `
            DELETE FROM payments 
            WHERE payment_id IN (
                SELECT payment_id FROM orders WHERE order_num = ?
            )`;
        await connection.query(sql, [orderNum]);

        // 7. 删除 customers 表中的记录
        sql = `
            DELETE FROM customers 
            WHERE customer_id IN (
                SELECT customer_id FROM orders WHERE order_num = ?
            )`;
        await connection.query(sql, [orderNum]);

        // 提交事务
        await connection.commit();
    } catch (error) {
        await connection.rollback(); // 如果有错误，回滚事务
        throw error; // 将错误抛出以便捕获和处理
    } finally {
        connection.release(); // 释放连接
    }
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

async function getEmployeeTestItems(status, departmentId, account, month, employeeName, orderNum) {
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
            t.appoint_time,
            e.model,
            (SELECT COALESCE(GROUP_CONCAT(DISTINCT ua.name ORDER BY ua.name SEPARATOR ', '), '') 
             FROM assignments aa 
             JOIN users ua ON ua.account = aa.account
             WHERE aa.test_item_id = t.test_item_id 
               AND ua.role IN ('supervisor', 'employee')) AS team_names,
            (SELECT COALESCE(GROUP_CONCAT(DISTINCT CASE WHEN ua.role = 'sales' THEN ua.name ELSE NULL END ORDER BY ua.name SEPARATOR ', '), '') 
             FROM assignments aa 
             JOIN users ua ON ua.account = aa.account
             WHERE aa.test_item_id = t.test_item_id) AS sales_names
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

    if (orderNum !== undefined && orderNum !== '') {
        query += ' AND t.order_num LIKE ?';
        params.push(`%${orderNum}%`);
        whereClauseAdded = true;
    }
    if (employeeName !== undefined && employeeName !== '') {
        query += ' AND u.name LIKE ?';
        params.push(`%${employeeName}%`);
        whereClauseAdded = true;
    }
    // 按 test_item_id 进行分组
    query += ` GROUP BY t.test_item_id, e.equipment_name, e.model;`;

    const [results] = await db.query(query, params);
    return results;
}


async function getAllTestItems(status, departmentId, month, employeeName, orderNum) {
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
            t.appoint_time,
            IFNULL(e.equipment_name, '') AS equipment_name,
            e.model,
            (SELECT COALESCE(GROUP_CONCAT(DISTINCT ua.name ORDER BY ua.name SEPARATOR ', '), '') 
             FROM assignments aa 
             JOIN users ua ON ua.account = aa.account
             WHERE aa.test_item_id = t.test_item_id 
               AND ua.role IN ('supervisor', 'employee')) AS team_names,
            (SELECT COALESCE(GROUP_CONCAT(DISTINCT CASE WHEN ua.role = 'sales' THEN ua.name ELSE NULL END ORDER BY ua.name SEPARATOR ', '), '') 
             FROM assignments aa 
             JOIN users ua ON ua.account = aa.account
             WHERE aa.test_item_id = t.test_item_id) AS sales_names
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

    if (orderNum !== undefined && orderNum !== '') {
        query += (whereClauseAdded ? ' AND' : ' WHERE') + ' t.order_num LIKE ?';
        params.push(`%${orderNum}%`);
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

async function assignTestToUser(testId, userId, equipment_id, start_time, end_time, role) {
    const connection = await db.getConnection();

    const query = 'INSERT INTO assignments (test_item_id, account) VALUES (?, ?)';
    let updateQuery =
        `UPDATE test_items 
            SET status = ?
        `;

    try {
        await connection.beginTransaction();

        // 执行插入分配的用户信息
        await connection.query(query, [testId, userId]);


        // 执行更新 test_items 的状态、设备ID、设备开始和结束时间
        const params = [];
        params.push('1');
        if (equipment_id !== undefined && equipment_id !== '') {
            updateQuery += ', equipment_id = ?';
            params.push(equipment_id);
        }
        if (start_time !== undefined && start_time !== '') {
            updateQuery += `, start_time = ?`;
            params.push(start_time);
        }
        if (end_time !== undefined && end_time !== '') {
            updateQuery += ', end_time = ?';
            params.push(end_time);
        }
        // 判断室主任还是组长，以存储不同的修改时间
        if (role !== undefined && role !== '') {
            if (role === 'leader') {
                updateQuery += ', assign_time = NOW()';
            } else if (role === 'supervisor') {
                updateQuery += ', appoint_time = NOW()';

            }
        }
        updateQuery += 'WHERE test_item_id = ?';
        params.push(testId);
        await connection.query(updateQuery, params);
        await connection.commit();

    } catch (error) {
        await connection.rollback();

        console.error('Error assigning test to user:', error);
        throw new Error('Failed to assign test and update test item.');
    } finally {
        // Always release the connection back to the pool
        connection.release();
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
        SET status = ?, check_note = ? , check_time = NOW()
        WHERE test_item_id = ?
    `;
    await db.query(query, [status, checkNote, testItemId]);
}

async function getAssignedTestsByUser(userId, status, month, employeeName, orderNum) {
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
        t.appoint_time,
        (SELECT COALESCE(GROUP_CONCAT(DISTINCT ua.name ORDER BY ua.name SEPARATOR ', '), '') 
        FROM assignments aa 
        JOIN users ua ON ua.account = aa.account
        WHERE aa.test_item_id = t.test_item_id 
        AND ua.role IN ('supervisor', 'employee')) AS team_names,
        (SELECT COALESCE(GROUP_CONCAT(DISTINCT CASE WHEN ua.role = 'sales' THEN ua.name ELSE NULL END ORDER BY ua.name SEPARATOR ', '), '') 
        FROM assignments aa 
        JOIN users ua ON ua.account = aa.account
        WHERE aa.test_item_id = t.test_item_id) AS sales_names
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

    const params = [userId];

    if (status !== undefined && status !== '') {
        query += ' AND t.status = ?';
        params.push(status);
    }
    if (month !== undefined && month !== '') {
        query += ` AND DATE_FORMAT(t.create_time, '%Y-%m') = ?`;
        params.push(month);
    }
    if (orderNum !== undefined && orderNum !== '') {
        query += ' AND t.order_num LIKE ?';
        params.push(`%${orderNum}%`);
    }
    if (employeeName !== undefined && employeeName !== '') {
        query += ' AND u.name LIKE ?';
        params.push(`%${employeeName}%`);
    }
    query += ' GROUP BY t.test_item_id';
    const [results] = await db.query(query, params);
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
            e.equipment_id,
            e.equipment_name,
            e.model,
            e.equipment_label
        FROM equipment e
        WHERE e.department_id = ?
    `;

    const [results] = await db.query(query, [departmentId]);
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
            t.end_time,
            t.order_num
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


// 删除检测项目及相关记录
async function deleteTestItem(testItemId) {
    const connection = await db.getConnection(); // 获取数据库连接
    try {
        // 开启事务
        await connection.beginTransaction();

        // 删除与 test_item_id 相关的其他数据
        await connection.query('DELETE FROM assignments WHERE test_item_id = ?', [testItemId]);
        // 可以根据需要添加更多关联表的删除操作

        // 最后删除 test_items 表中的记录
        const result = await connection.query('DELETE FROM test_items WHERE test_item_id = ?', [testItemId]);

        // 提交事务
        await connection.commit();

        return result[0]; // 返回删除结果
    } catch (error) {
        // 如果出现错误，回滚事务
        await connection.rollback();
        console.error('Error deleting test item:', error);
        throw error;
    } finally {
        connection.release(); // 释放数据库连接
    }
}

//保存文件到服务器
async function saveFilesToDatabase(fileDetails) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction(); // 开始事务

        for (const file of fileDetails) {
            const sql = `INSERT INTO project_files (filename, filepath, project_id, test_item_id) VALUES (?, ?, ?, ?)`;
            const values = [file.filename, file.path, file.projectId, file.testItemId];
            await connection.query(sql, values);
        }

        await connection.commit(); // 提交事务
    } catch (error) {
        await connection.rollback(); // 回滚事务
        throw error; // 抛出错误以便调用者处理
    } finally {
        connection.release(); // 释放连接
    }
}


async function getFilesByTestItemId(testItemId) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction(); // 开始事务

        const query = `SELECT filename, filepath, project_id FROM project_files WHERE test_item_id = ?`;
        const [results] = await connection.query(query, [testItemId]);
        return results;
    } catch (error) {
        throw error;
    } finally {
        connection.release(); // 确保连接被释放
    }
}

// 获取与项目ID关联的文件
async function getFilesByProjectId(projectId) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction(); // 开始事务

        const query = `SELECT filename, filepath, project_id FROM project_files WHERE project_id = ?`;
        const [results] = await connection.query(query, [projectId]);
        return results;
    } finally {
        connection.release();
    }
};

// 删除与项目ID相关的文件记录
async function deleteFilesByProjectId(projectId) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const query = `DELETE FROM project_files WHERE project_id = ?`;
        await connection.query(query, [projectId]);
        // 提交事务
        await connection.commit();
    } catch (error) {
        await connection.rollback(); // 如果有错误，回滚事务
        throw error; // 将错误抛出以便捕获和处理
    } finally {
        connection.release();
    }
};

// 更新样品信息
async function updateSamples(orderNum, updatedFields) {
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
            UPDATE samples
            SET ${setClause}
            WHERE order_num = ?;
        `;

        // 执行查询
        const result = await db.query(query, [...values, orderNum]);

        return result; // 返回执行结果
    } catch (error) {
        console.error('Error updating test item:', error);
        throw error;
    }
}

// 更新样品信息
async function addTestItem(addedFields) {
    try {

        // 构造动态 SQL 查询
        const fields = Object.keys(addedFields);
        const values = Object.values(addedFields);
        fields.push('create_time');  // 创建时间字段
        values.push(new Date());  // 获取当前时间并添加到值列表中

        const columnNames = fields.join(', ');
        const placeholders = fields.map(() => '?').join(', ');

        const query = `
            INSERT INTO test_items (${columnNames})
            VALUES (${placeholders});
        `;

        // 执行查询
        const result = await db.query(query, values);

        return result; // 返回执行结果
    } catch (error) {
        console.error('Error updating test item:', error);
        throw error;
    }
}

async function checkAssign(testItemId) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Check the number of employees assigned to this test item
        const employeeCountQuery = `
            SELECT COUNT(*) AS employeeCount
            FROM assignments
            WHERE test_item_id = ? AND account NOT LIKE '%YW%'
        `;
        const [employeeCountResult] = await connection.query(employeeCountQuery, [testItemId]);
        const employeeCount = employeeCountResult[0].employeeCount;
        return employeeCount;
    } catch (error) {
        await connection.rollback(); // 如果有错误，回滚事务
        throw error; // 将错误抛出以便捕获和处理
    } finally {
        connection.release();
    }

}


async function getCustomers(searchNameTerm, searchContactNameTerm, searchContactPhoneTerm) {
    const connection = await db.getConnection();
    try {
        let query = `
            SELECT 
                customer_id,
                customer_name,
                customer_address,
                contact_name,
                contact_phone_num,
                contact_email,
                balance
            FROM customers
        `;

        const queryParams = [];
        const conditions = [];

        if (searchNameTerm) {
            conditions.push('customer_name LIKE ?');
            queryParams.push(`%${searchNameTerm}%`);
        }

        if (searchContactNameTerm) {
            conditions.push('contact_name LIKE ?');
            queryParams.push(`%${searchContactNameTerm}%`);
        }

        if (searchContactPhoneTerm) {
            conditions.push('contact_phone_num LIKE ?');
            queryParams.push(`%${searchContactPhoneTerm}%`);
        }

        // 如果有任何条件，添加 WHERE 子句
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        const [rows] = await connection.query(query, queryParams);
        return rows;

    } finally {
        connection.release();
    }
}

async function getTransactions() {
    const connection = await db.getConnection();
    try {
        let query = `
            SELECT 
                t.transaction_id,
                c.customer_name,
                t.transaction_type,
                t.amount,
                t.balance_after_transaction,
                t.transaction_time,
                t.description
            FROM transactions t
            LEFT JOIN
                customers c
                ON c.customer_id = t.customer_id
        `;
        const queryParams = [];

        const [rows] = await connection.query(query, queryParams);
        return rows;

    } finally {
        connection.release();
    }
}

async function makeDeposit(customerId, amount, description) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        // 更新客户余额
        const updateBalanceQuery = `
            UPDATE customers 
            SET balance = balance + ? 
            WHERE customer_id = ?
        `;
        await connection.execute(updateBalanceQuery, [amount, customerId]);

        // 获取更新后的余额
        const [balanceResult] = await connection.execute(`
            SELECT balance 
            FROM customers 
            WHERE customer_id = ?
        `, [customerId]);

        const newBalance = balanceResult[0].balance;

        // 插入交易记录
        const insertTransactionQuery = `
            INSERT INTO transactions (customer_id, transaction_type, amount, balance_after_transaction, transaction_time, description)
            VALUES (?, 'DEPOSIT', ?, ?, NOW(), ?)
        `;
        await connection.execute(insertTransactionQuery, [customerId, amount, newBalance, description]);

        // 提交事务
        await connection.commit();

        console.log('充值成功');
    } catch (error) {
        // 回滚事务
        await connection.rollback();
        console.error('充值失败:', error.message);
        throw error;
    } finally {
        connection.release();
    }
}

async function handleCheckout( orderNums ) {
    try {
        // 查询指定订单的discounted_price是否存在
        let query = `
            SELECT 
                o.order_num, 
                t.test_item,
                t.discounted_price 
            FROM orders o
            JOIN test_items t ON o.order_num = t.order_num
            WHERE o.order_num IN (?) AND t.discounted_price IS NULL
        `;
        const [missingPrices] = await db.query(query, [orderNums]);

        // 如果有订单没有填写交易价格，返回错误信息
        if (missingPrices.length > 0) {
            let errorMessage = '';
            let currentOrderNum = '';
            missingPrices.forEach(item => {
                if (item.order_num !== currentOrderNum) {
                    if (currentOrderNum !== '') {
                        errorMessage += '\n';  // 添加顿号分隔符
                    }
                    currentOrderNum = item.order_num;
                    errorMessage += `${item.order_num}委托单的`;
                }
                errorMessage += `"${item.test_item}"项目未填写交易价格;\n`;
            });

            return {
                success: false,
                message: errorMessage
            };
        }

        // 如果所有价格都存在，更新订单状态为已结算
        query = `
            UPDATE orders
            SET order_status = 1
            WHERE order_num IN (?) AND order_status = 0
        `;
        await db.query(query, [orderNums]);


        // 在invoices表中插入一条记录（自增ID）
        query = `
            INSERT INTO invoices (created_at)
            VALUES (NOW())
        `;
        const [invoiceResult] = await db.query(query);

        // 获取新生成的发票ID
        const invoiceId = invoiceResult.insertId;

        // 在invoice_orders表中将开票ID和委托单号关联起来
        const invoiceOrders = orderNums.map(orderNum => [invoiceId, orderNum]);
        query = `
            INSERT INTO invoice_orders (invoice_id, order_num)
            VALUES ?
        `;
        await db.query(query, [invoiceOrders]);



        return { success: true };
    } catch (error) {
        console.error('结算操作失败:', error);
        throw new Error('结算失败，请稍后重试');
    } 
}


async function getInvoiceDetails() {
    const query = `
        SELECT 
            io.invoice_id, 
            o.order_num, 
            c.customer_name, 
            c.contact_name, 
            c.contact_phone_num, 
            t.test_item, 
            t.discounted_price, 
            t.listed_price,
            t.work_hours,
            t.machine_hours,
            u.name
        FROM invoice_orders io
        JOIN orders o ON io.order_num = o.order_num
        JOIN customers c ON o.customer_id = c.customer_id
        JOIN test_items t ON o.order_num = t.order_num
        JOIN assignments a ON a.test_item_id = t.test_item_id
        JOIN users u ON a.account = u.account
        WHERE u.role = 'sales'
        ORDER BY io.invoice_id, o.order_num, t.test_item_id;
    `;

    try {
        const [results] = await db.query(query);
        return results;  // 返回扁平化的查询结果
    } catch (error) {
        console.error('获取发票详情失败:', error);
        throw new Error('查询发票详情时出错');
    }
}

module.exports = {
    findUserByAccount,
    deleteOrder,
    assignTestToUser,
    reassignTestToUser,
    getAllOrders,
    getAllSamples,
    updateSamples,
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
    updateTestItem,
    deleteTestItem,
    saveFilesToDatabase,
    getFilesByProjectId,
    getFilesByTestItemId,
    deleteFilesByProjectId,
    addTestItem,
    checkAssign,
    getCustomers,
    getTransactions,
    makeDeposit,
    handleCheckout,
    getInvoiceDetails
};