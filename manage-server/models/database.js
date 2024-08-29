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

async function getAllTestItems() {
    const query = `
        SELECT 
            t.test_item_id,
            t.original_no,
            t.test_item,
            t.test_method,
            t.order_num,
            t.status
        FROM test_items t
    `;
    const [results] = await db.query(query);
    return results;
}

async function assignTestToUser(testId, userId) {
    const query = 'INSERT INTO assignments (test_item_id, account) VALUES (?, ?)';
    await db.query(query, [testId, userId]);
}

async function updateTestItemStatus(testId, status) {
    const query = 'UPDATE test_items SET status =  ? WHERE test_item_id = ?';
    try {
        await db.query(query, [status, testId]);
        console.log(`Status updated for test item ${testId} to ${status}`);
    } catch (error) {
        console.error('Failed to update test item status:', error);
        throw error; // Rethrowing the error is important if you want to handle it further up, e.g., in an Express route.
    }
}


async function getAssignedTestsByUser(userId) {
    const query = `
        SELECT 
            ti.test_item_id,
            ti.original_no,
            ti.test_item,
            ti.test_method,
            ti.order_num,
            ti.status
        FROM assignments a
        JOIN test_items ti ON a.test_item_id = ti.test_item_id
        WHERE a.account = ?
    `;
    const [results] = await db.query(query, [userId]);
    return results;
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
    getAssignedTestsByUser
};