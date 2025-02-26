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

async function getAllOrders(orderNum, departmentId, filterData) {
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
            p.area,
            p.organization,
            GROUP_CONCAT(t.test_item SEPARATOR ', ') AS test_items,
            s.material,
            o.service_type,
            o.order_status,
            SUM(t.discounted_price) AS total_discounted_price,
            SUM(t.listed_price) AS total_listed_price,
            a.account,
            u.name
        FROM orders o
        JOIN customers c ON o.customer_id = c.customer_id
        AND o.customer_id IS NOT NULL
        JOIN payments p ON o.payment_id = p.payment_id
        AND o.payment_id IS NOT NULL
        JOIN test_items t ON o.order_num = t.order_num
        JOIN samples s ON o.order_num = s.order_num
        LEFT JOIN assignments a ON t.test_item_id = a.test_item_id
        LEFT JOIN users u ON a.account = u.account
    `;
    const params = [];
    query += `WHERE c.category = '1' AND p.category = '1' and u.role = 'sales'`;
    if (orderNum !== undefined && orderNum !== '') {
        query += ' AND o.order_num LIKE ?';
        params.push(`%${orderNum}%`);
    }
    if (departmentId) {
        query += 'AND t.department_id = ?';
        params.push(departmentId);
    }
    if(filterData && filterData.trim().length > 0){
        query += `
            AND (
                o.order_num LIKE ? OR
                c.customer_name LIKE ? OR
                c.contact_name LIKE ? OR
                c.contact_phone_num LIKE ? OR
                c.contact_email LIKE ? OR
                u.name LIKE ? OR
                s.material LIKE ? OR
                t.test_item LIKE ? OR
                p.area LIKE ? OR
                p.organization LIKE ? OR
                p.payer_contact_name LIKE ? OR
                p.payer_contact_phone_num LIKE ? OR
                p.payer_address LIKE ?
            )
        `;
        // 填充查询参数，所有字段都使用 filterData 进行模糊查询
        params.push(...Array(13).fill(`%${filterData}%`));
    }
    query += ` GROUP BY o.order_num, c.customer_name, c.contact_name, c.contact_phone_num, 
                c.contact_email, p.payer_contact_name, p.payer_contact_phone_num, 
                p.payer_address, o.service_type, o.order_status, a.account, u.name, p.area, p.organization`;


    const [results] = await db.query(query, params);
    return results;
}


async function getInvoicesForExcel(invoiceIds) {
    // 将传入的 invoiceIds 转为数组形式，以防止 SQL 注入
    const placeholders = invoiceIds.map(() => '?').join(', ');

    const query = `
        SELECT 
            i.invoice_number, 
            io.order_num,
            c.customer_name, 
            c.contact_name, 
            c.contact_phone_num, 
            p.payer_name, 
            p.payer_contact_name, 
            u.name AS sales_name, 
            GROUP_CONCAT(t.test_item SEPARATOR ', ') AS test_items, 
            i.final_price, 
            i.created_at
        FROM invoices i
        JOIN invoice_orders io ON i.invoice_id = io.invoice_id
        JOIN orders o ON io.order_num = o.order_num
        JOIN customers c ON o.customer_id = c.customer_id
        JOIN payments p ON o.payment_id = p.payment_id
        LEFT JOIN test_items t ON o.order_num = t.order_num
        LEFT JOIN assignments a ON a.test_item_id = t.test_item_id
        LEFT JOIN users u ON u.account = a.account
        WHERE i.invoice_id IN (${placeholders}) AND u.role = 'sales'
        GROUP BY i.invoice_id, io.order_num, c.customer_name, c.contact_name, 
                 c.contact_phone_num, c.contact_email, p.payer_name, 
                 p.payer_contact_name, u.name, i.final_price, i.created_at
    `;

    try {
        const [results] = await db.query(query, invoiceIds);
        return results;
    } catch (error) {
        console.error("Error fetching invoices:", error);
        throw error;  // 错误捕获并抛出
    }
}

async function getCommissionForExcel(selectedOrders) {
    // 将传入的 orderNum 转为数组形式，以防止 SQL 注入
    const placeholders = selectedOrders.map(() => '?').join(', ');

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
        GROUP_CONCAT(t.test_item SEPARATOR ', ') AS test_items,
        s.material,
        o.service_type,
        o.order_status,
        p.organization,
        p.area,
        SUM(t.listed_price) AS total_listed_price,
        SUM(t.discounted_price) AS total_discounted_price,
        u.name
    FROM orders o
    JOIN customers c ON o.customer_id = c.customer_id
    AND o.customer_id IS NOT NULL
    JOIN payments p ON o.payment_id = p.payment_id
    AND o.payment_id IS NOT NULL
    JOIN test_items t ON o.order_num = t.order_num
    JOIN samples s ON o.order_num = s.order_num
    LEFT JOIN assignments a ON t.test_item_id = a.test_item_id
    LEFT JOIN users u ON a.account = u.account
    WHERE c.category = '1' AND p.category = '1' and u.role = 'sales'
    AND o.order_num IN (${placeholders})
    GROUP BY o.order_num, c.customer_name, c.contact_name, c.contact_phone_num, 
            c.contact_email, p.payer_contact_name, p.payer_contact_phone_num, 
            p.payer_address, o.service_type, o.order_status, a.account, u.name,
            p.area, p.organization
    `;

    try {
        const [results] = await db.query(query, selectedOrders);
        return results;
    } catch (error) {
        console.error("Error fetching orders:", error);
        throw error;  // 错误捕获并抛出
    }
}

async function getTestForExcel(selectedOrders) {
    // 将传入的 test_item_id 转为数组形式，以防止 SQL 注入
    const placeholders = selectedOrders.map(() => '?').join(', ');
    const query = `
    SELECT 
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
            t.check_note,
            t.test_note,
            t.create_time,
            t.deadline,
            t.department_id,
            r.start_time,
            r.end_time,
            t.appoint_time,
            IFNULL(e.equipment_name, '') AS equipment_name,
            e.model,
            (SELECT COALESCE(GROUP_CONCAT(DISTINCT ua.name ORDER BY ua.name SEPARATOR ', '), '') 
             FROM assignments aa 
             JOIN users ua ON ua.account = aa.account
             WHERE aa.test_item_id = t.test_item_id 
               AND ua.role = 'supervisor'
               ) AS manager_names,
            (SELECT COALESCE(GROUP_CONCAT(DISTINCT ua.name ORDER BY ua.name SEPARATOR ', '), '') 
             FROM assignments aa 
             JOIN users ua ON ua.account = aa.account
             WHERE aa.test_item_id = t.test_item_id 
                AND (ua.role = 'employee' OR (ua.role = 'supervisor' AND aa.is_assigned = 1))
               ) AS team_names,
            (SELECT COALESCE(GROUP_CONCAT(DISTINCT CASE WHEN ua.role = 'sales' THEN ua.name ELSE NULL END ORDER BY ua.name SEPARATOR ', '), '') 
             FROM assignments aa 
             JOIN users ua ON ua.account = aa.account
             WHERE aa.test_item_id = t.test_item_id
             ) AS sales_names,
             CASE 
                WHEN EXISTS (
                    SELECT 1 
                    FROM project_files f 
                    WHERE f.test_item_id = t.test_item_id
                ) THEN 1
                ELSE 0
            END AS hasAttachments,
            c.customer_name,
            c.contact_name
        FROM
            test_items t
        LEFT JOIN
            orders o ON t.order_num = o.order_num
        LEFT JOIN 
            reservation r ON r.test_item_id = t.test_item_id 
        LEFT JOIN
            customers c ON o.customer_id = c.customer_id
        LEFT JOIN
            assignments a ON t.test_item_id = a.test_item_id
        LEFT JOIN 
            equipment e ON e.equipment_id = t.equipment_id
        LEFT JOIN 
            users u ON u.account = a.account
        WHERE t.test_item_id IN (${placeholders})
        GROUP BY t.test_item_id, e.equipment_name, e.model, c.customer_name, c.contact_name, r.start_time, r.end_time;
    `
    try {
        const [results] = await db.query(query, selectedOrders);
        return results;
    } catch (error) {
        console.error("Error fetching test items:", error);
        throw error;  // 错误捕获并抛出
    }
}


async function getTestForExcelForSales(selectedOrders) {
    // 将传入的 test_item_id 转为数组形式，以防止 SQL 注入
    const placeholders = selectedOrders.map(() => '?').join(', ');
    const query = `
    SELECT 
            t.test_item,
            t.quantity,
            t.order_num,
            t.note,
            t.machine_hours,
            t.listed_price,
            t.create_time,
            c.customer_name,
            c.contact_name
        FROM
            test_items t
        LEFT JOIN
            orders o ON t.order_num = o.order_num
        LEFT JOIN
            customers c ON o.customer_id = c.customer_id
        WHERE t.test_item_id IN (${placeholders})
        GROUP BY t.test_item_id, c.customer_name, c.contact_name;
    `
    try {
        const [results] = await db.query(query, selectedOrders);
        return results;
    } catch (error) {
        console.error("Error fetching test items:", error);
        throw error;  // 错误捕获并抛出
    }
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

/**
 * 根据 account 查找所有委托单信息
 * @param {string} account 账户名
 * @returns {Promise<Array>} 返回一个包含订单信息的数组
 */
async function getSalesOrders(account, filterData) {
    try {
        let query = `
            SELECT DISTINCT 
                o.order_num, o.customer_id, o.create_time, o.service_type, o.sample_shipping_address, 
                o.payment_id, o.total_price, o.vat_type, o.order_status,
                c.customer_name, c.customer_address, c.contact_name, c.contact_phone_num
            FROM assignments a
            JOIN test_items t ON a.test_item_id = t.test_item_id
            JOIN orders o ON t.order_num = o.order_num
            JOIN customers c ON c.customer_id = o.customer_id
            JOIN users u ON u.account = a.account
        `
        const params = [];
        let whereClauseAdded = false;

        if (account !== undefined && account !== '') {
            query += ' WHERE a.account = ?';
            params.push(`${account}`);
            whereClauseAdded = true;
        } else {
            query += ' WHERE u.role = ?';
            params.push('sales')
            whereClauseAdded = true;
        }

        // 处理 filterData 模糊查询
        if (filterData && filterData.trim().length > 0) {
            query += `
                ${whereClauseAdded ? 'AND' : 'WHERE'} (
                    o.order_num LIKE ? OR
                    o.sample_shipping_address LIKE ? OR
                    o.total_price LIKE ? OR
                    c.customer_name LIKE ? OR
                    c.customer_address LIKE ? OR
                    c.contact_name LIKE ? OR
                    c.contact_phone_num LIKE ?
                )
            `;

            // 填充查询参数，所有字段都使用 filterData 进行模糊查询
            params.push(...Array(7).fill(`%${filterData}%`));
        }

        const [results] = await db.query(query, params);
        return results; // 返回查询结果
    } catch (error) {
        console.error('Error fetching sales orders:', error);
        throw new Error('Failed to fetch sales orders');
    }
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


async function getEmployeeTestItems(status, departmentId, account, month, customerName, orderNum) {
    let query = `
        SELECT 
            t.test_item_id,
            t.original_no,
            t.test_item,
            t.test_method,
            t.order_num,
            t.status,
            t.note,
            t.machine_hours,
            t.work_hours,
            t.listed_price,
            t.discounted_price,
            t.equipment_id,
            t.check_note,
            t.create_time,
            t.deadline,
            t.test_note,
            t.size,
            t.quantity,
            IFNULL(e.equipment_name, '') AS equipment_name,
            t.appoint_time,
            e.model,
            p.unit_price,
            (SELECT COALESCE(GROUP_CONCAT(DISTINCT ua.name ORDER BY ua.name SEPARATOR ', '), '') 
             FROM assignments aa 
             JOIN users ua ON ua.account = aa.account
             WHERE aa.test_item_id = t.test_item_id 
               AND ua.role = 'supervisor') AS manager_names,
            (SELECT COALESCE(GROUP_CONCAT(DISTINCT ua.name ORDER BY ua.name SEPARATOR ', '), '') 
             FROM assignments aa 
             JOIN users ua ON ua.account = aa.account
             WHERE aa.test_item_id = t.test_item_id
               AND (ua.role = 'employee' OR (ua.role = 'supervisor' AND aa.is_assigned = 1))
               ) AS team_names,
            (SELECT COALESCE(GROUP_CONCAT(DISTINCT CASE WHEN ua.role = 'sales' THEN ua.name ELSE NULL END ORDER BY ua.name SEPARATOR ', '), '') 
             FROM assignments aa 
             JOIN users ua ON ua.account = aa.account
             WHERE aa.test_item_id = t.test_item_id
             ) AS sales_names,
             CASE 
                WHEN EXISTS (
                    SELECT 1 
                    FROM project_files f 
                    WHERE f.test_item_id = t.test_item_id
                ) THEN 1
                ELSE 0
            END AS hasAttachments,
            c.customer_name,
            c.contact_name
        FROM 
            test_items t
        LEFT JOIN
            orders o ON t.order_num = o.order_num
        LEFT JOIN
            customers c ON o.customer_id = c.customer_id
        LEFT JOIN 
            assignments a ON t.test_item_id = a.test_item_id
        LEFT JOIN 
            equipment e ON e.equipment_id = t.equipment_id
        JOIN 
	        users u ON u.account = a.account
        LEFT JOIN 
            reservation r ON r.test_item_id = t.test_item_id
        LEFT JOIN
            price p ON p.price_id = t.price_id
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
        const [year, monthPart] = month.split('-');
        const monthComparison = `${year.slice(2)}${monthPart}`;
        query += ' AND MID(t.order_num, 3, 4) = ?';
        params.push(monthComparison); 
    }

    if (orderNum !== undefined && orderNum !== '') {
        query += ' AND t.order_num LIKE ?';
        params.push(`%${orderNum}%`);
        whereClauseAdded = true;
    }
    if (customerName !== undefined && customerName !== '') {
        query += ' AND c.customer_name LIKE ?';
        params.push(`%${customerName}%`);
        whereClauseAdded = true;
    }
    // 按 test_item_id 进行分组
    query += ` GROUP BY t.test_item_id, e.equipment_name, e.model, c.customer_name, c.contact_name;`;

    const [results] = await db.query(query, params);
    return results;
}


async function getAllTestItems(status, departmentId, month, customerName, orderNum, role) {
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
            t.test_note,
            t.create_time,
            t.deadline,
            t.department_id,
            t.appoint_time,
            IFNULL(e.equipment_name, '') AS equipment_name,
            e.model,
            p.unit_price,
            (SELECT COALESCE(GROUP_CONCAT(DISTINCT ua.name ORDER BY ua.name SEPARATOR ', '), '') 
             FROM assignments aa 
             JOIN users ua ON ua.account = aa.account
             WHERE aa.test_item_id = t.test_item_id 
               AND ua.role = 'supervisor'
               ) AS manager_names,
            (SELECT COALESCE(GROUP_CONCAT(DISTINCT ua.name ORDER BY ua.name SEPARATOR ', '), '') 
             FROM assignments aa 
             JOIN users ua ON ua.account = aa.account
             WHERE aa.test_item_id = t.test_item_id 
                AND (ua.role = 'employee' OR (ua.role = 'supervisor' AND aa.is_assigned = 1))
               ) AS team_names,
            (SELECT COALESCE(GROUP_CONCAT(DISTINCT CASE WHEN ua.role = 'sales' THEN ua.name ELSE NULL END ORDER BY ua.name SEPARATOR ', '), '') 
             FROM assignments aa 
             JOIN users ua ON ua.account = aa.account
             WHERE aa.test_item_id = t.test_item_id
             ) AS sales_names,
             CASE 
                WHEN EXISTS (
                    SELECT 1 
                    FROM project_files f 
                    WHERE f.test_item_id = t.test_item_id
                ) THEN 1
                ELSE 0
            END AS hasAttachments,
            c.customer_name,
            c.contact_name
        FROM
            test_items t
        LEFT JOIN
            orders o ON t.order_num = o.order_num
        LEFT JOIN
            customers c ON o.customer_id = c.customer_id
        LEFT JOIN
            assignments a ON t.test_item_id = a.test_item_id
        LEFT JOIN 
            equipment e ON e.equipment_id = t.equipment_id
        LEFT JOIN 
            users u ON u.account = a.account 
        LEFT JOIN
            price p ON p.price_id = t.price_id
    `;

    const params = [];
    let whereClauseAdded = false;
    // 动态添加 WHERE 条件
    if (departmentId !== undefined && departmentId !== '') {
        query += ' WHERE t.department_id = ?';
        params.push(departmentId);
        whereClauseAdded = true;
    }
    // 动态添加 WHERE 条件
    if (role !== undefined && role !== '') {
        query += ' WHERE u.role = ? && u.account != ?';
        params.push(role);
        params.push('YW001');

        whereClauseAdded = true;
    }
    if (status !== undefined && status !== '') {
        query += (whereClauseAdded ? ' AND' : ' WHERE') + ' t.status = ?';
        params.push(status);
        whereClauseAdded = true;
    }

    if (month !== undefined && month !== '') {
        const [year, monthPart] = month.split('-');
        const monthComparison = `${year.slice(2)}${monthPart}`;
        query += (whereClauseAdded ? ' AND' : ' WHERE') + ` MID(t.order_num, 3, 4) = ?`;
        params.push(monthComparison); 
        whereClauseAdded = true;
    }

    if (orderNum !== undefined && orderNum !== '') {
        query += (whereClauseAdded ? ' AND' : ' WHERE') + ' t.order_num LIKE ?';
        params.push(`%${orderNum}%`);
        whereClauseAdded = true;
    }
    if (customerName !== undefined && customerName !== '') {
        query += (whereClauseAdded ? ' AND' : ' WHERE') + ' c.customer_name LIKE ?';
        params.push(`%${customerName}%`);
        whereClauseAdded = true;
    }
    // 按照 test_item_id 和 equipment_name 分组
    query += ` GROUP BY t.test_item_id, e.equipment_name, e.model, c.customer_name, c.contact_name;`;
    const [results] = await db.query(query, params);
    return results;
}

async function assignTestToUser(testId, userId, equipment_id, role, isAssigned) {
    const connection = await db.getConnection();
    const query = 'INSERT INTO assignments (test_item_id, account, is_assigned) VALUES (?, ?, ?)';
    let updateQuery =
        `UPDATE test_items 
            SET status = ?
        `;

    try {
        await connection.beginTransaction();


        // 执行插入分配的用户信息
        await connection.query(query, [testId, userId, isAssigned]);


        // 执行更新 test_items 的状态、设备ID、设备开始和结束时间
        const params = [];
        params.push('1');
        if (equipment_id !== undefined && equipment_id !== '') {
            updateQuery += ', equipment_id = ?';
            params.push(equipment_id);
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


// 回退操作
async function rollbackTest(account, testItemId, note) {
    const connection = await db.getConnection();

    // 查询用户角色
    const accountQuery = `
        SELECT role 
        FROM users 
        WHERE account = ?
    `;

    // 删除 `assignments` 表中指定 account 和 test_item_id 的记录
    const deleteEmployeeQuery = `
        DELETE FROM assignments 
        WHERE account = ? AND test_item_id = ?
    `;

    // 删除 `assignments` 表中 test_item_id 相关的所有非业务员（sales）记录
    const deleteNonSalesAssignmentsQuery = `
        DELETE FROM assignments 
        WHERE test_item_id = ? 
          AND account NOT IN (
            SELECT account 
            FROM users 
            WHERE role = 'sales'
          )
    `;

    // 更新 `test_items` 表中的状态
    const updateTestItemsStatusQuery = `
        UPDATE test_items 
        SET status = '0', note = ?, appoint_time = NULL
        WHERE test_item_id = ?
    `;

    const updateNoteQuery = `
        UPDATE test_items
        SET note = ?, appoint_time = NULL
        WHERE test_item_id = ?
    `
    try {
        // 开启事务
        await connection.beginTransaction();

        // 查询角色
        const [roleResult] = await connection.query(accountQuery, [account]);
        const userRole = roleResult[0]?.role;

        if (!userRole) {
            throw new Error("用户角色未找到");
        }

        if (userRole === "employee") {
            // 员工回退：仅删除自己的记录
            await connection.query(deleteEmployeeQuery, [account, testItemId]);
            await connection.query(updateNoteQuery, [note, testItemId]);


        } else if (userRole === "supervisor") {
            // 组长回退：删除所有非业务员（sales）的记录，并更新状态
            await connection.query(deleteNonSalesAssignmentsQuery, [testItemId]);
            await connection.query(updateTestItemsStatusQuery, [note, testItemId]);
        } else {
            throw new Error("不支持的用户角色执行回退操作");
        }

        // 提交事务
        await connection.commit();

    } catch (error) {
        // 回滚事务
        await connection.rollback();
        console.error("Fail to roll back", error);
        throw error;
    } finally {
        // 释放数据库连接
        connection.release();
    }
}



async function updateTestItemStatus(finishData) {
    const connection = await db.getConnection();

    const query = `UPDATE 
                    test_items 
                        SET 
                            status =  ? ,
                            machine_hours = ?,
                            work_hours = ?,
                            equipment_id = ?,
                            quantity = ?,
                            listed_price = ?,
                            test_note = ?,
                            latest_finish_time = NOW()
                            WHERE test_item_id = ?`;
    try {
        await connection.beginTransaction();
        await connection.query(query, [finishData.status, finishData.machine_hours, finishData.work_hours, finishData.equipment_id, finishData.quantity, finishData.listed_price, finishData.test_note, finishData.testId]);
        await connection.commit();

    } catch (error) {
        await connection.rollback();
        console.error('Failed to update test item', error);
        throw error; 
    } finally {
        connection.release();
    }
}

async function updateTestItemCheckStatus(testItemId, status, checkNote, listedPrice, machine_hours) {
    const query = `
        UPDATE test_items
        SET status = ?, check_note = ? , check_time = NOW(), listed_price = ?, machine_hours = ?
        WHERE test_item_id = ?
    `;
    await db.query(query, [status, checkNote, listedPrice, machine_hours, testItemId]);
}

async function getAssignedTestsByUser(userId, status, month, customerName, orderNum) {
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
        t.size,
        t.quantity,
        t.note,
        t.test_note,
        t.equipment_id,
        t.check_note,
        t.create_time,
        t.deadline,
        IFNULL(e.equipment_name, '') AS equipment_name,
        e.model,
        t.appoint_time,
        p.unit_price,
        (SELECT COALESCE(GROUP_CONCAT(DISTINCT ua.name ORDER BY ua.name SEPARATOR ', '), '') 
            FROM assignments aa 
            JOIN users ua ON ua.account = aa.account
            WHERE aa.test_item_id = t.test_item_id 
            AND ua.role = 'supervisor'
            ) AS manager_names,
        (SELECT COALESCE(GROUP_CONCAT(DISTINCT ua.name ORDER BY ua.name SEPARATOR ', '), '') 
            FROM assignments aa 
            JOIN users ua ON ua.account = aa.account
            WHERE aa.test_item_id = t.test_item_id 
            AND (ua.role = 'employee' OR (ua.role = 'supervisor' AND aa.is_assigned = 1))

            ) AS team_names,
        (SELECT COALESCE(GROUP_CONCAT(DISTINCT CASE WHEN ua.role = 'sales' THEN ua.name ELSE NULL END ORDER BY ua.name SEPARATOR ', '), '') 
        FROM assignments aa 
        JOIN users ua ON ua.account = aa.account
        WHERE aa.test_item_id = t.test_item_id
        ) AS sales_names,
        c.customer_name,
        c.contact_name
    FROM 
        test_items t
    LEFT JOIN
        orders o ON t.order_num = o.order_num
    LEFT JOIN
        customers c ON o.customer_id = c.customer_id
    LEFT JOIN 
        equipment e ON e.equipment_id = t.equipment_id
    JOIN 
        assignments a ON t.test_item_id = a.test_item_id
    JOIN 
        users u ON u.account = a.account
    LEFT JOIN 
        price p ON p.price_id = t.price_id
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
        const [year, monthPart] = month.split('-');
        const monthComparison = `${year.slice(2)}${monthPart}`;
        query += ' AND MID(t.order_num, 3, 4) = ?';
        params.push(monthComparison); 
    }
    if (orderNum !== undefined && orderNum !== '') {
        query += ' AND t.order_num LIKE ?';
        params.push(`%${orderNum}%`);
    }
    if (customerName !== undefined && customerName !== '') {
        query += ' AND c.customer_name LIKE ?';
        params.push(`%${customerName}%`);
    }
    query += ' GROUP BY t.test_item_id, c.customer_name, c.contact_name';
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
            u.account,
            u.role
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
            u.account
        FROM users u
        WHERE u.group_id = ?
    `;
    const [results] = await db.query(query, [groupId]);
    return results;
}


// async function getAssignmentsInfo(testItemId, account) {
//     const query = `
//         SELECT 
//             test_item_id,
//             account
//         FROM assignments
//         WHERE test_item_id = ? AND account = ?
//     `;
//     const [results] = await db.query(query, [testItemId, account]);
//     return results;
// }


// 查询某检测项目的所有分配记录
async function getAssignmentsByTestItemId(testItemId) {
    const connection = await db.getConnection();
    try {
        const query = `SELECT 
             a.assignment_id,
             a.test_item_id,
             a.account,
             a.is_assigned,
             u.role
             FROM assignments a 
             JOIN
                users u ON u.account = a.account
            WHERE a.test_item_id = ? `;
        const [results] = await connection.query(query, [testItemId]);
        return results;
    } catch (error) {
        console.error("Error while querying assignments: ", error);
        throw error; // Rethrow the error to handle it in the calling function
    } finally {
        connection.release();
    }
}

// 更新是否执行
async function updateIsAssigned(testItemId, account, isAssigned) {

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const query = `UPDATE assignments SET is_assigned = ? WHERE test_item_id = ? AND account = ?`;
        await connection.query(query, [isAssigned, testItemId, account]);
        await connection.commit();

    } catch (error) {
        // 发生错误时回滚事务
        console.error("Error during updateIsAssigned: ", error);
        await connection.rollback();
        throw error; // Rethrow the error to handle it in the calling function
    } finally {
        connection.release();
    }
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
        ORDER BY e.equipment_label
    `;

    const [results] = await db.query(query, [departmentId]);
    return results;
}

// 获取员工的总机时和工时
async function getEmployeeWorkStats(departmentId, timePeriod) {
    let query;
    let queryParams = [departmentId];

    // 按具体的月份（yyyy-MM）处理
    if (timePeriod.includes('-')) {
        const [year, month] = timePeriod.split('-');  // 获取年份和月份
        query = `
            SELECT 
                u.account,
                u.name,
                COALESCE(SUM(t.machine_hours), 0) AS total_machine_hours,
                COALESCE(SUM(t.work_hours), 0) AS total_work_hours,
                COALESCE(SUM(t.size), 0) AS total_samples,
                COALESCE(SUM(t.listed_price), 0) AS total_listed_price,
                CONCAT('20', MID(t.order_num, 3, 2)) AS year,
                MID(t.order_num, 5, 2) AS month
            FROM 
                users u
            LEFT JOIN 
                assignments a ON u.account = a.account
            LEFT JOIN 
                test_items t ON a.test_item_id = t.test_item_id AND t.department_id = u.department_id
            WHERE 
                u.department_id = ? 
                and u.role != 'leader' 
                AND t.order_num IS NOT NULL
                AND a.is_assigned = '1'
                AND CONCAT('20', MID(t.order_num, 3, 2)) = ? 
                AND MID(t.order_num, 5, 2) = ?
            GROUP BY 
                u.account, u.name, 
                CONCAT('20', MID(t.order_num, 3, 2)),
                MID(t.order_num, 5, 2)
            ORDER BY 
                year, month;
        `;
        queryParams.push(year, month);
    }
    // 按季度（例如：'2025年第一季度' 或 '2025年Q1'）处理
    else if (timePeriod.includes('季度')) {
        const year = timePeriod.split('年')[0].trim(); // 获取年份
        const quarter = timePeriod.includes('第一') ? '第一季度' :
                        timePeriod.includes('第二') ? '第二季度' :
                        timePeriod.includes('第三') ? '第三季度' : '第四季度'; // 获取季度

        query = `
            SELECT 
                u.account,
                u.name,
                COALESCE(SUM(t.machine_hours), 0) AS total_machine_hours,
                COALESCE(SUM(t.work_hours), 0) AS total_work_hours,
                COALESCE(SUM(t.size), 0) AS total_samples,
                COALESCE(SUM(t.listed_price), 0) AS total_listed_price,
                CONCAT('20', MID(t.order_num, 3, 2)) AS year,
                CASE 
                    WHEN MID(t.order_num, 5, 2) IN ('01', '02', '03') THEN '第一季度'
                    WHEN MID(t.order_num, 5, 2) IN ('04', '05', '06') THEN '第二季度'
                    WHEN MID(t.order_num, 5, 2) IN ('07', '08', '09') THEN '第三季度'
                    ELSE '第四季度'
                END AS quarter
            FROM 
                users u
            LEFT JOIN 
                assignments a ON u.account = a.account
            LEFT JOIN 
                test_items t ON a.test_item_id = t.test_item_id AND t.department_id = u.department_id
            WHERE 
                u.department_id = ? 
                and u.role != 'leader' 
                AND t.order_num IS NOT NULL
                AND a.is_assigned = '1'
                AND CONCAT('20', MID(t.order_num, 3, 2)) = ? 
                AND CASE 
                    WHEN MID(t.order_num, 5, 2) IN ('01', '02', '03') THEN '第一季度'
                    WHEN MID(t.order_num, 5, 2) IN ('04', '05', '06') THEN '第二季度'
                    WHEN MID(t.order_num, 5, 2) IN ('07', '08', '09') THEN '第三季度'
                    ELSE '第四季度'
                END = ?
            GROUP BY 
                u.account, u.name, 
                CONCAT('20', MID(t.order_num, 3, 2)),
                CASE 
                    WHEN MID(t.order_num, 5, 2) IN ('01', '02', '03') THEN '第一季度'
                    WHEN MID(t.order_num, 5, 2) IN ('04', '05', '06') THEN '第二季度'
                    WHEN MID(t.order_num, 5, 2) IN ('07', '08', '09') THEN '第三季度'
                    ELSE '第四季度'
                END
            ORDER BY 
                year, quarter;
        `;
        queryParams.push(year, quarter);
    }
    // 按年（例如：'2024'）处理
    else if (timePeriod.length === 4 && !isNaN(timePeriod)) {
        const year = timePeriod; // 获取年份
        query = `
            SELECT 
                u.account,
                u.name,
                COALESCE(SUM(t.machine_hours), 0) AS total_machine_hours,
                COALESCE(SUM(t.work_hours), 0) AS total_work_hours,
                COALESCE(SUM(t.size), 0) AS total_samples,
                COALESCE(SUM(t.listed_price), 0) AS total_listed_price,
                CONCAT('20', MID(t.order_num, 3, 2)) AS year
            FROM 
                users u
            LEFT JOIN 
                assignments a ON u.account = a.account
            LEFT JOIN 
                test_items t ON a.test_item_id = t.test_item_id AND t.department_id = u.department_id
            WHERE 
                u.department_id = ?  
                and u.role != 'leader' 
                AND t.order_num IS NOT NULL
                AND a.is_assigned = '1'
                AND CONCAT('20', MID(t.order_num, 3, 2)) = ?
            GROUP BY 
                u.account, u.name, 
                CONCAT('20', MID(t.order_num, 3, 2))
            ORDER BY 
                year;
        `;
        queryParams.push(year);
    } else if (timePeriod === 'month') {
        // 根据时间筛选条件，生成不同的查询
        query = `
            SELECT 
                u.account,
                u.name,
                COALESCE(SUM(t.machine_hours), 0) AS total_machine_hours,
                COALESCE(SUM(t.work_hours), 0) AS total_work_hours,
                COALESCE(SUM(t.size), 0) AS total_samples,
                COALESCE(SUM(t.listed_price), 0) AS total_listed_price,
                CONCAT('20', MID(t.order_num, 3, 2)) AS year,
                MID(t.order_num, 5, 2) AS month
            FROM 
                users u
            LEFT JOIN 
                assignments a ON u.account = a.account
            LEFT JOIN 
                test_items t ON a.test_item_id = t.test_item_id AND t.department_id = u.department_id
            WHERE 
                u.department_id = ? 
                and u.role != 'leader' 
                AND t.order_num IS NOT NULL
                AND a.is_assigned = '1'

            GROUP BY 
                u.account, u.name, 
                CONCAT('20', MID(t.order_num, 3, 2)),
                MID(t.order_num, 5, 2)
            ORDER BY 
                year, month;
        `;
    } else if (timePeriod === 'quarter') {
        query = `
            SELECT 
                u.account,
                u.name,
                COALESCE(SUM(t.machine_hours), 0) AS total_machine_hours,
                COALESCE(SUM(t.work_hours), 0) AS total_work_hours,
                COALESCE(SUM(t.size), 0) AS total_samples,
                COALESCE(SUM(t.listed_price), 0) AS total_listed_price,
                CONCAT('20', MID(t.order_num, 3, 2)) AS year,
                CASE 
                    WHEN MID(t.order_num, 5, 2) IN ('01', '02', '03') THEN '-第一季度'
                    WHEN MID(t.order_num, 5, 2) IN ('04', '05', '06') THEN '-第二季度'
                    WHEN MID(t.order_num, 5, 2) IN ('07', '08', '09') THEN '-第三季度'
                    ELSE '-第四季度'
                END AS quarter
            FROM 
                users u
            LEFT JOIN 
                assignments a ON u.account = a.account
            LEFT JOIN 
                test_items t ON a.test_item_id = t.test_item_id AND t.department_id = u.department_id
            WHERE 
                u.department_id = ? 
                and u.role != 'leader' 
                AND t.order_num IS NOT NULL
                AND a.is_assigned = '1'
            GROUP BY 
                u.account, u.name, 
                CONCAT('20', MID(t.order_num, 3, 2)),
                CASE 
                    WHEN MID(t.order_num, 5, 2) IN ('01', '02', '03') THEN '-第一季度'
                    WHEN MID(t.order_num, 5, 2) IN ('04', '05', '06') THEN '-第二季度'
                    WHEN MID(t.order_num, 5, 2) IN ('07', '08', '09') THEN '-第三季度'
                    ELSE '-第四季度'
                END
            ORDER BY 
                year, quarter;
        `;
    } else if (timePeriod === 'year') {
        query = `
            SELECT 
                u.account,
                u.name,
                COALESCE(SUM(t.machine_hours), 0) AS total_machine_hours,
                COALESCE(SUM(t.work_hours), 0) AS total_work_hours,
                COALESCE(SUM(t.size), 0) AS total_samples,
                COALESCE(SUM(t.listed_price), 0) AS total_listed_price,
                CONCAT('20', MID(t.order_num, 3, 2)) AS year
            FROM 
                users u
            LEFT JOIN 
                assignments a ON u.account = a.account
            LEFT JOIN 
                test_items t ON a.test_item_id = t.test_item_id AND t.department_id = u.department_id
            WHERE 
                u.department_id = ?  
                and u.role != 'leader' 
                AND t.order_num IS NOT NULL
                AND a.is_assigned = '1'
            GROUP BY 
                u.account, u.name, 
                CONCAT('20', MID(t.order_num, 3, 2))
            ORDER BY 
                year;
        `;
    } else {
        throw new Error('Invalid time period');
    }

    try {
        const [results] = await db.query(query, queryParams);
        return results;
    } catch (error) {
        console.error('Failed to fetch employee work stats:', error);
        throw error;
    }
}

// 获取部门的年度总委托额
async function getYearlyListedPrice(departmentId) {
    const query = `
        SELECT 
            CONCAT('20', MID(t.order_num, 3, 2)) AS year,
            MID(t.order_num, 5, 2) AS month,
            COALESCE(SUM(t.listed_price), 0) AS total_listed_price
        FROM 
            test_items t
        WHERE 
            t.department_id = ?
        GROUP BY 
            year, month
        ORDER BY 
            year DESC, month ASC;

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

// Fetch all months based on order_num
async function getAllMonths() {
    const query = `
        SELECT DISTINCT 
            CONCAT('20', MID(order_num, 3, 2), '-', MID(order_num, 5, 2)) AS month
        FROM 
            test_items
        WHERE 
            order_num IS NOT NULL
        ORDER BY 
            month DESC;
    `;
    try {
        const [results] = await db.query(query);
        return results;
    } catch (error) {
        console.error('Error fetching months:', error);
        throw error;
    }
}

// Fetch all quarters based on order_num
async function getAllQuarters() {
    const query = `
        SELECT DISTINCT 
            CONCAT('20', MID(order_num, 3, 2), '年第', 
                   CASE 
                       WHEN MID(order_num, 5, 2) BETWEEN '01' AND '03' THEN '一季度'
                       WHEN MID(order_num, 5, 2) BETWEEN '04' AND '06' THEN '二季度'
                       WHEN MID(order_num, 5, 2) BETWEEN '07' AND '09' THEN '三季度'
                       ELSE '四季度' 
                   END) AS quarter
        FROM 
            test_items
        WHERE 
            order_num IS NOT NULL
        ORDER BY 
            quarter DESC;
    `;
    try {
        const [results] = await db.query(query);
        return results;
    } catch (error) {
        console.error('Error fetching quarters:', error);
        throw error;
    }
}

// Fetch all years based on order_num
async function getAllYears() {
    const query = `
        SELECT DISTINCT 
            CONCAT('20', MID(order_num, 3, 2)) AS year
        FROM 
            test_items
        WHERE 
            order_num IS NOT NULL
        ORDER BY 
            year DESC;
    `;
    try {
        const [results] = await db.query(query);
        return results;
    } catch (error) {
        console.error('Error fetching years:', error);
        throw error;
    }
}


// 获取所有月份
async function getAllTransMonths() {
    const query = `
        SELECT DISTINCT 
            DATE_FORMAT(transaction_time, '%Y-%m') as month
        FROM 
            transactions
        WHERE 
            transaction_time is not null
        ORDER BY 
            month DESC;

    `;
    try {
        const [results] = await db.query(query);
        return results;
    } catch (error) {
        console.error('获取交易月份失败:', error);
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
        await connection.beginTransaction();

        // 删除与 test_item_id 相关的其他数据
        await connection.query('DELETE FROM assignments WHERE test_item_id = ?', [testItemId]);
        // 可以根据需要添加更多关联表的删除操作

        // 最后删除 test_items 表中的记录
        const result = await connection.query('DELETE FROM test_items WHERE test_item_id = ?', [testItemId]);
        await connection.commit();

        return result[0]; // 返回删除结果
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting test item:', error);
        throw error;
    } finally {
        connection.release();
    }
}

//保存文件到服务器
async function saveFilesToDatabase(fileDetails) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction(); // 开始事务

        for (const file of fileDetails) {
            const sql = `INSERT INTO project_files (filename, filepath, project_id, test_item_id, category) VALUES (?, ?, ?, ?, ?)`;
            const values = [file.filename, file.path, file.projectId, file.testItemId, file.category];
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

        const query = `SELECT filename, filepath, project_id, category FROM project_files WHERE test_item_id = ?`;
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

// 删除委托方信息
async function deleteCustomer(customerId) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const updateQuery = `UPDATE orders SET customer_id = NULL WHERE customer_id = ?`;
        await connection.query(updateQuery, [customerId]);
        const query = `DELETE FROM customers WHERE customer_id = ?`;
        await connection.query(query, [customerId]);
        // 提交事务
        await connection.commit();
        return { success: true, message: '委托方信息已成功删除并处理关联订单' };
    } catch (error) {
        await connection.rollback(); // 如果有错误，回滚事务
        throw error; // 将错误抛出以便捕获和处理
    } finally {
        connection.release();
    }
};

// 删除委托方信息
async function deletePayer(paymentId) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const updateQuery = `UPDATE orders SET payment_id = NULL WHERE payment_id = ?`;
        await connection.query(updateQuery, [paymentId]);
        const query = `DELETE FROM payments WHERE payment_id = ?`;
        await connection.query(query, [paymentId]);
        // 提交事务
        await connection.commit();
        return { success: true, message: '委托方信息已成功删除并处理关联订单' };

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

// 添加检测信息
async function addTestItem(addedFields) {
    const connection = await db.getConnection(); // 假设你使用的是连接池
    try {
        await connection.beginTransaction(); // 开始事务
        // 过滤掉不在 test_items 表中的字段
        const testItemFields = ['order_num', 'original_no', 'test_item', 'test_method', 'size', 'quantity', 'deadline', 'note', 'department_id', 'status']; // test_items 表中的字段
        const filteredFields = {};
        for (let field of testItemFields) {
            if (addedFields[field] !== undefined) {
                filteredFields[field] = addedFields[field];
            }
        }
        // 构造动态 SQL 查询
        const fields = Object.keys(filteredFields);
        const values = Object.values(filteredFields);
        fields.push('create_time');  // 创建时间字段
        values.push(new Date());  // 获取当前时间并添加到值列表中

        const columnNames = fields.join(', ');
        const placeholders = fields.map(() => '?').join(', ');

        const query = `
            INSERT INTO test_items (${columnNames})
            VALUES (${placeholders});
        `;

        // 执行查询
        const [result] = await db.query(query, values);
        const testItemId = result.insertId;
        // 将 test_item_id 和 account 插入到 assignments 表中
        const insertAssignmentQuery = `
            INSERT INTO assignments (test_item_id, account, is_assigned)
            VALUES (?, ?, 1);
        `;
        const account = addedFields.account; // 假设 `account` 存在于 addedFields 中
        await connection.query(insertAssignmentQuery, [testItemId, account]);
        await connection.commit();
        return result; // 返回执行结果
    } catch (error) {
        await connection.rollback(); // 出错时回滚事务
        console.error('Error updating test item and assignment:', error);
        throw error;
    } finally {
        connection.release(); // 释放连接
    }
}

// async function checkAssign(testItemId) {
//     const connection = await db.getConnection();
//     try {
//         await connection.beginTransaction();

//         // Check the number of employees assigned to this test item
//         const employeeCountQuery = `
//             SELECT COUNT(*) AS employeeCount
//             FROM assignments
//             WHERE test_item_id = ? AND account NOT LIKE '%YW%'
//         `;
//         const [employeeCountResult] = await connection.query(employeeCountQuery, [testItemId]);
//         const employeeCount = employeeCountResult[0].employeeCount;
//         return employeeCount;
//     } catch (error) {
//         await connection.rollback(); // 如果有错误，回滚事务
//         throw error; // 将错误抛出以便捕获和处理
//     } finally {
//         connection.release();
//     }

// }


async function getCustomers(filterData) {
    const connection = await db.getConnection();
    let whereSql='';
    let queryParams = [];

    // 如果 filterData 有值，添加模糊查询条件
    if (filterData) {
        // 通过字段名数组动态构建模糊查询条件
        const fields = [
            'customer_name',
            'customer_address',
            'contact_name',
            'contact_phone_num',
            'contact_email',
        ];
        // 动态生成 WHERE 子句的查询条件
        const conditions = fields.map(field => `${field} LIKE ?`).join(' OR ');

        whereSql = `AND (${conditions})`;

        // 填充查询参数，所有字段都使用 filterData 进行模糊查询
        queryParams = Array(fields.length).fill(`%${filterData}%`);
    }

    try {
        let query = `
            SELECT 
                customer_id,
                customer_name,
                customer_address,
                contact_name,
                contact_phone_num,
                contact_email
            FROM customers
            WHERE category = '1'
            ${whereSql};
        `;
        const [rows] = await connection.query(query, queryParams);

        return rows;


    } catch (error) {
        await connection.rollback(); // 如果有错误，回滚事务
        throw error; // 将错误抛出以便捕获和处理
    } finally {
        connection.release();
    }
}

async function getPayers(filterData) {
    const connection = await db.getConnection();
    // 如果 filterData 有值，添加模糊查询条件
    let whereSql = '';
    let queryParams = [];

    if (filterData) {
        // 通过字段名数组动态构建模糊查询条件
        const fields = [
            'payer_name',
            'payer_address',
            'payer_phone_num',
            'payer_contact_name',
            'payer_contact_phone_num',
            'bank_name',
            'tax_number',
            'bank_account',
            'payer_contact_email',
            'balance',
            'area',
            'organization'
        ];
        // 动态生成 WHERE 子句的查询条件
        const conditions = fields.map(field => `${field} LIKE ?`).join(' OR ');
        whereSql = `AND (${conditions})`;
        // 填充查询参数，所有字段都使用 filterData 进行模糊查询
        queryParams = Array(fields.length).fill(`%${filterData}%`);
    }
    try {
        let query = `
            SELECT 
                payment_id,
                payer_name,
                payer_address,
                payer_phone_num,
                payer_contact_name,
                payer_contact_phone_num,
                bank_name,
                tax_number,
                bank_account,
                payer_contact_email,
                balance,
                area,
                organization
            FROM payments
            WHERE category = '1'
            ${whereSql};
        `;
        const [rows] = await connection.query(query, queryParams);
        return rows;

    } catch(error) {
        console.error('查询付款方失败:', error.message);
        throw error;
    } finally {
        connection.release();
    }
}
async function getTransactions(filterPayerContactName, filterPayerName, transactionType, month) {
    const connection = await db.getConnection();
    try {
        let query = `
            SELECT 
                t.transaction_id,
                p.payer_name,
                p.payer_contact_name,
                t.transaction_type,
                t.amount,
                t.balance_after_transaction,
                t.transaction_time,
                t.description
            FROM transactions t
            LEFT JOIN
                payments p
                ON p.payment_id = t.payment_id
        `;
        const params = [];
        let whereClauseAdded = false;
        // 动态添加 WHERE 条件
        if (filterPayerContactName) {
            query += ' WHERE p.payer_contact_name LIKE ?';
            params.push(`%${filterPayerContactName}%`);
            whereClauseAdded = true;
        }

        if (filterPayerName) {
            query += (whereClauseAdded ? ' AND' : ' WHERE') + ' p.payer_name LIKE ?';
            params.push(`%${filterPayerName}%`);
            whereClauseAdded = true;
        }
        if (transactionType) {
            query += (whereClauseAdded ? ' AND' : ' WHERE') + ' t.transaction_type = ?';
            params.push(transactionType);
            whereClauseAdded = true;
        }

        if (month !== undefined && month !== '') {
            query += (whereClauseAdded ? ' AND' : ' WHERE') + ` DATE_FORMAT(t.transaction_time, '%Y-%m') = ?`;
            params.push(month);
            whereClauseAdded = true;
        }
        const [rows] = await connection.query(query, params);
        return rows;

    } finally {
        connection.release();
    }
}

async function makeDeposit(paymentId, amount, description) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        // 更新客户余额
        const updateBalanceQuery = `
            UPDATE payments 
            SET balance = balance + ? 
            WHERE payment_id = ?
        `;
        await connection.execute(updateBalanceQuery, [amount, paymentId]);

        // 获取更新后的余额
        const [balanceResult] = await connection.execute(`
            SELECT balance 
            FROM payments 
            WHERE payment_id = ?
        `, [paymentId]);

        const newBalance = balanceResult[0].balance;

        // 插入交易记录
        const insertTransactionQuery = `
            INSERT INTO transactions (payment_id, transaction_type, amount, balance_after_transaction, transaction_time, description)
            VALUES (?, 'DEPOSIT', ?, ?, NOW(), ?)
        `;
        await connection.execute(insertTransactionQuery, [paymentId, amount, newBalance, description]);

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

async function handleCheckout( orderNums, checkoutTime ) {
    const connection = await db.getConnection(); 
    try {
        await connection.beginTransaction();
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

            await connection.rollback();
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
            INSERT INTO invoices (created_at, checkout_time)
            VALUES (NOW(), ?)
        `;
        const [invoiceResult] = await db.query(query, [checkoutTime]);

        // 获取新生成的发票ID
        const invoiceId = invoiceResult.insertId;

        // 在invoice_orders表中将开票ID和委托单号关联起来
        const invoiceOrders = orderNums.map(orderNum => [invoiceId, orderNum]);
        query = `
            INSERT INTO invoice_orders (invoice_id, order_num)
            VALUES ?
        `;
        await db.query(query, [invoiceOrders]);


        await connection.commit();
        return { success: true };
    } catch (error) {
        console.error('结算操作失败:', error);
        // 回滚事务
        await connection.rollback();
        throw new Error('结算失败，请稍后重试');
    } finally {
        connection.release();
    }
}


async function getInvoiceDetails(filterData) {
    // 如果 filterData 为空，只筛选 sales 角色
    let whereSql = `
        WHERE u.role = 'sales'
        AND o.customer_id IS NOT NULL
        AND p.payment_id IS NOT NULL
        AND o.order_status IN ('1', '2')
    `;
    let queryParams = [];

    // 如果 filterData 有值，添加模糊查询条件
    if (filterData) {
        whereSql += `
            AND (
                o.order_num LIKE ? OR
                c.customer_name LIKE ? OR
                c.contact_name LIKE ? OR
                c.contact_phone_num LIKE ? OR
                t.test_item LIKE ? OR
                t.discounted_price LIKE ? OR
                t.listed_price LIKE ? OR
                i.invoice_number LIKE ? OR
                i.final_price LIKE ? OR
                u.name LIKE ?
            )
        `;
        // 填充查询参数，所有字段都使用 filterData 进行模糊查询
        queryParams = Array(10).fill(`%${filterData}%`);
    }

    const query = `
        SELECT 
            io.invoice_id, 
            io.created_at,
            o.order_num, 
            c.customer_name, 
            c.contact_name, 
            c.contact_phone_num, 
            p.payer_contact_name,
            p.payer_contact_phone_num,
            p.payer_name,
            p.balance,
            t.test_item, 
            t.discounted_price, 
            t.listed_price,
            t.work_hours,
            t.machine_hours,
            t.size,
            t.quantity,
            t.check_note,
            t.original_no,
            t.test_method,
            t.status,
            t.create_time,
            t.note,
            i.invoice_number,
            i.final_price,
            i.checkout_time,
            u.name
        FROM invoice_orders io
        JOIN orders o ON io.order_num = o.order_num
        JOIN customers c ON o.customer_id = c.customer_id
        JOIN payments p on p.payment_id = o.payment_id
        JOIN test_items t ON o.order_num = t.order_num
        JOIN assignments a ON a.test_item_id = t.test_item_id
        JOIN users u ON a.account = u.account
        JOIN invoices i ON i.invoice_id = io.invoice_id

        ${whereSql}
        ORDER BY i.checkout_time, o.order_num, t.test_item_id;
    `;

    try {
        const [results] = await db.query(query, queryParams);
        return results;  // 返回扁平化的查询结果
    } catch (error) {
        console.error('获取发票详情失败:', error);
        throw new Error('查询发票详情时出错');
    }
}

async function setFinalPrice(invoiceId, finalPrice) {
    try {
        // 更新订单的最终价格
        const [result] = await db.execute(`
            UPDATE invoices
            SET final_price = ?
            WHERE invoice_id = ?
        `, [finalPrice, invoiceId]);

        return result;
    } catch (error) {
        console.error('数据库操作最终价修改错误:', error);
        throw error; // 抛出错误供上层处理
    }
}

// 执行更新操作的函数
const updateCustomer = (customerData) => {
    const { customer_id, customer_name, customer_address, contact_name, contact_phone_num, contact_email} = customerData;
      const sql = `
      UPDATE customers
      SET 
        customer_name = ?, 
        customer_address = ?, 
        contact_name = ?, 
        contact_phone_num = ?, 
        contact_email = ?
      WHERE customer_id = ?
    `;
  
    const values = [customer_name || null, 
                    customer_address || null, 
                    contact_name || null, 
                    contact_phone_num || null, 
                    contact_email || null, 
                    customer_id];
    return db.execute(sql, values);
  };
  
  const updatePayer = (paymentData) => {
    const { payment_id, payer_name, payer_address, payer_phone_num, bank_name, tax_number, bank_account, payer_contact_name, payer_contact_phone_num, payer_contact_email, category, area, organization } = paymentData;
    const sql = `
      UPDATE payments
      SET 
        payer_name = ?, 
        payer_address = ?, 
        payer_phone_num = ?, 
        bank_name = ?, 
        tax_number = ?, 
        bank_account = ?, 
        payer_contact_name = ?, 
        payer_contact_phone_num = ?, 
        payer_contact_email = ?, 
        area = ?, 
        organization = ?
      WHERE payment_id = ?
    `;
  
    const values = [payer_name || null,
                    payer_address || null, 
                    payer_phone_num || null,
                    bank_name || null,
                    tax_number || null,
                    bank_account || null,
                    payer_contact_name || null,
                    payer_contact_phone_num || null,
                    payer_contact_email || null,
                    area || null, 
                    organization || null, 
                    payment_id];
    return db.execute(sql, values);
  };



  // 更新发票表
const updateInvoice = async (invoiceId, invoiceNumber, accountTime) => {
    return db.query(`
        UPDATE invoices 
        SET invoice_number = ?, updated_at = ?
        WHERE invoice_id = ?
    `, [invoiceNumber, accountTime, invoiceId]);
};

// 获取与发票关联的订单
const getInvoiceOrders = async (invoiceId) => {
    // 查询数据库
    const result = await db.query(`
        SELECT order_num FROM invoice_orders WHERE invoice_id = ?
    `, [invoiceId]);

    // result[0]是包含数据的部分，移除无效的元数据部分
    const validInvoiceOrders = result[0] || [];  // 获取实际数据（第一个元素）

    // 返回所有有效的订单号
    return validInvoiceOrders.map(row => row.order_num);  // 提取出所有的 order_num
};

// 更新订单状态
const updateOrderStatus = async (orderNums, orderStatus) => {
    return db.query(`
        UPDATE orders 
        SET order_status = ?
        WHERE order_num IN (?)
    `, [orderStatus, orderNums]);
};

// 获取付款方的余额
const getPaymentBalance = async (paymentId) => {
    const [result] = await db.query(`
        SELECT balance FROM payments WHERE payment_id = ?
    `, [paymentId]);
    return result;
};

// 更新付款方余额
const updatePaymentBalance = async (paymentId, newBalance) => {
    return db.query(`
        UPDATE payments 
        SET balance = ? 
        WHERE payment_id = ?
    `, [newBalance, paymentId]);
};

// 插入交易记录
const insertTransaction = async (paymentId, amount, newBalance, description) => {
    return db.query(`
        INSERT INTO transactions (payment_id, transaction_type, amount, balance_after_transaction, transaction_time, description) 
        VALUES (?, 'WITHDRAWAL', ?, ?, NOW(), ?)
    `, [paymentId, amount, newBalance, description]);
};

// 获取订单的支付方ID
const getPaymentIdByOrderNum = async (orderNum) => {
    const [result] = await db.query(`
        SELECT payment_id FROM orders WHERE order_num = ? LIMIT 1
    `, [orderNum]);
    return result;
};


// 检查预约时间是否被冲突
async function checkTimeConflict(equipment_id, start_time, end_time, reservation_id) {
    try {
        const query = `
            SELECT 
                r.reservation_id,
                r.equipment_id,
                r.start_time, 
                r.end_time, 
                t.test_item, 
                t.order_num
            FROM test_items t
            JOIN reservation r ON r.test_item_id = t.test_item_id
            WHERE r.equipment_id = ?
            AND r.start_time >= NOW() 
            AND r.start_time <= DATE_ADD(NOW(), INTERVAL 1 MONTH)
            AND (
                ? <= r.end_time AND ? >= r.start_time
            )
            ${reservation_id ? "AND r.reservation_id != ?" : ""}
        `;

        // 执行查询并返回结果
        const params = reservation_id ? [equipment_id, start_time, end_time, reservation_id] : [equipment_id, start_time, end_time];
        const [result] = await db.query(query, params);        
        
        // 返回冲突状态
        if (result.length > 0) {
            // 如果存在时间冲突，返回详细的冲突时间段
            return {
                conflict: true,
                conflictDetails: result.map(item => ({
                    start_time: item.start_time,
                    end_time: item.end_time,
                    test_item: item.test_item,
                    order_num: item.order_num
                })),
            };
        }

        // 如果没有冲突
        return { conflict: false };
    } catch (error) {
        console.error('Error checking time conflict in database:', error);
        throw error;  // 将错误抛出给调用者处理
    }
    
}

async function deliverTest(testItemId, status) {
    const connection = await db.getConnection(); // 从连接池获取数据库连接
    try {
        await connection.beginTransaction(); // 开始事务

        // 检查并更新状态
        const [result] = await connection.query(`
            UPDATE test_items 
            SET status = ?,
            deliver_time = NOW()
            WHERE test_item_id = ? AND status NOT IN ('5')
        `, [status, testItemId]);

        if (result.affectedRows === 0) {
            throw new Error('未能更新状态，检测项目可能已交付或不符合条件');
        }

        await connection.commit(); // 提交事务
        return { success: true, message: '状态更新成功' };
    } catch (error) {
        await connection.rollback(); // 发生错误时回滚事务
        console.error('Error delivering test item:', error);
        return { success: false, message: error.message };
    } finally {
        connection.release(); // 确保连接释放到连接池
    }
}

// 获取检测项目的详细信息
async function getTestItemById(testItemId) {
    const query = `SELECT original_no, test_item, test_method, size, quantity, note, status, department_id, deadline,order_num
                   FROM test_items WHERE test_item_id = ?`;
    const [results] = await db.query(query, [testItemId]);
    return results[0];
}

// 复制检测项目并生成新的 ID
async function duplicateTestItem(testItemData) {
    if (testItemData.equipment_id === '') {
        testItemData.equipment_id = null;
    }

    // 获取当前项目名称的基础名称
    let baseTestItemName = testItemData.test_item;
    const suffixRegex = /-(\d+)$/;  // 用于匹配名称后缀

    // 去除名称中的后缀部分
    let newTestItemName = baseTestItemName.replace(suffixRegex, '');

    // 初始化后缀为 1
    let suffix = 1;
    try {
        // 查询数据库中的测试项目，获取相同名称的项目（不需要排除委托单号）
        const [existingItems] = await db.query(
            `SELECT test_item FROM test_items WHERE test_item LIKE ? AND order_num = ? AND department_id = ?`,
            [`${newTestItemName}%`, testItemData.order_num, testItemData.department_id]
        );

        // 如果已经有相同名称的项目，获取最大后缀并递增
        if (existingItems.length > 0) {
            // 提取所有已存在的后缀，并排序后获取最大后缀
            const suffixes = existingItems
                .map(item => {
                    const match = item.test_item.match(/-(\d+)$/);
                    return match ? parseInt(match[1], 10) : 0; // 提取数字后缀
                })
                .sort((a, b) => b - a); // 降序排列

            // 获取最大后缀并递增
            suffix = suffixes[0] + 1; // 增加后缀
        }
        newTestItemName = `${newTestItemName}-${suffix}`;
        const query = 
        `INSERT INTO test_items (
            order_num, 
            original_no, 
            test_item, 
            test_method, 
            size, 
            quantity, 
            note, 
            status, 
            department_id, 
            deadline, 
            create_time, 
            equipment_id,
            assign_time,
            appoint_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW(),NOW())`;
    
        const params = [
            testItemData.order_num,
            testItemData.original_no,
            newTestItemName,
            testItemData.test_method,
            testItemData.size,
            testItemData.quantity,
            testItemData.note,
            testItemData.status,
            testItemData.department_id,
            testItemData.deadline,
            testItemData.equipment_id,
        ];
    
        const [result] = await db.query(query, params);
        return result.insertId; // 返回新生成的 test_item_id
        

    } catch (error) {
        console.error('Error while checking for duplicate test items:', error);
        throw new Error('Error while checking for duplicate test items');
    }


}


// 获取设备的预约情况
async function getEquipmentReservations() {
    const query = `
        SELECT 
            r.equipment_id,
            t.order_num,
            t.test_item,
            r.start_time,
            r.end_time,
            r.equip_user,
            r.operator,
            u1.name AS equip_user_name,
            u2.name AS operator_name
        FROM test_items t
        LEFT JOIN reservation r ON r.test_item_id = t.test_item_id
        LEFT JOIN users u1 ON u1.account = r.equip_user
        LEFT JOIN users u2 ON u2.account = r.operator
        WHERE t.equipment_id IS NOT NULL;
    `;
    const [testItems] = await db.query(query);
    return testItems;
}

// 创建预约
async function createReservation(equipment_id, start_time, end_time, equip_user, test_item_id, operator) {
    const query = `
        INSERT INTO reservation (equipment_id, start_time, end_time, equip_user, test_item_id, operator)
        VALUES (?, ?, ?, ?, ?, ?);
    `;
    const [result] = await db.query(query, [equipment_id, start_time, end_time, equip_user, test_item_id, operator]);
    return result; // 返回插入结果
}

// 查找我的预约
async function getMyReservation(account) {
    const query = `
        SELECT 
            r.reservation_id,
            t.test_item,
            t.test_item_id,
            r.equipment_id,
            r.start_time,
            r.equip_user,
            u.name,
            r.end_time,
            e.equipment_name,
            e.model
        FROM reservation r
        JOIN equipment e ON r.equipment_id = e.equipment_id
        JOIN users u ON u.account = r.equip_user
        JOIN test_items t ON t.test_item_id = r.test_item_id
        WHERE r.operator = ?;
    `;
    const [result] = await db.query(query, [account]);
    return result;  // 返回查询结果
}

// 取消我的预约
async function cancelReservation(reservationId) {
    const query = `DELETE FROM reservation WHERE reservation_id = ?`;
    const [result] = await db.query(query, [reservationId]);
    return result;  // 返回删除操作的结果
}

// 修改我的预约
async function updateReservation(reservation_id, equipment_id, start_time, end_time, equip_user, test_item_id, operator) {
    const query = `
        UPDATE reservation 
        SET equipment_id = ?, start_time = ?, end_time = ?, equip_user = ?, test_item_id = ?, operator = ?
        WHERE reservation_id = ?;
    `;
    const [result] = await db.query(query, [equipment_id, start_time, end_time, equip_user, test_item_id, operator, reservation_id]);
    return result;
}

//回退结算订单的sql函数
async function deleteInvoice(invoiceId) {
    const query = 'DELETE FROM invoices WHERE invoice_id = ?';
    await db.query(query, [invoiceId]);
}

async function deleteInvoiceOrders(invoiceId) {
    const query = 'DELETE FROM invoice_orders WHERE invoice_id = ?';
    await db.query(query, [invoiceId]);
}

async function rollbackOrdersByInvoice(invoiceId) {
    const query = `
        UPDATE orders 
        SET order_status = 0
        WHERE order_num IN (
            SELECT order_num 
            FROM invoice_orders 
            WHERE invoice_id = ?
        )
    `;
    await db.query(query, [invoiceId]);
}

async function updateAppointTime(testItemId) {
    try {
        const query = `
            UPDATE test_items
            SET appoint_time = NOW()
            WHERE test_item_id = ?;
        `;
        
        const [results] = await db.query(query, [testItemId]);
        
        // 返回成功信息
        return results;
    } catch (error) {
        console.error("Error updating appoint_time:", error);
        throw new Error("Error updating appoint_time");
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
    //getAssignmentsInfo,
    getEquipmentsByDepartment,
    getEmployeeWorkStats,
    getMachineWorkStats,
    getAllMonths,
    getEquipmentTimeline,
    getInvoicesForExcel,
    getCommissionForExcel,
    getMyReservation,
    updateOrder,
    updateTestItemPrice,
    updateTestItemStatus,
    updateTestItemCheckStatus,
    updateDiscountedPrice,
    updateTestItem,
    deleteTestItem,
    deleteCustomer,
    deletePayer,
    saveFilesToDatabase,
    getFilesByProjectId,
    getFilesByTestItemId,
    deleteFilesByProjectId,
    addTestItem,
    //checkAssign,
    getCustomers,
    getTransactions,
    makeDeposit,
    handleCheckout,
    getInvoiceDetails,
    setFinalPrice,
    getPayers,
    updateCustomer,
    updatePayer,
    updateInvoice,
    getInvoiceOrders,
    updateOrderStatus,
    getPaymentBalance,
    updatePaymentBalance,
    insertTransaction,
    getPaymentIdByOrderNum,
    getAllTransMonths,
    getSalesOrders,
    rollbackTest,
    checkTimeConflict,
    deliverTest,
    getAssignmentsByTestItemId,
    updateIsAssigned,
    getTestItemById,
    getTestForExcel,
    duplicateTestItem,
    getEquipmentReservations,
    getTestForExcelForSales,
    createReservation,
    cancelReservation,
    updateReservation,
    deleteInvoice,
    deleteInvoiceOrders,
    rollbackOrdersByInvoice,
    updateAppointTime,
    getYearlyListedPrice,
    getAllMonths,
    getAllQuarters,
    getAllYears
};