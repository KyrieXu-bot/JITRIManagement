const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'jitri',
    database: 'jitri'
});


async function getCustomers() {
    // 使用连接池执行 SQL 查询
    const [rows] = await pool.query("SELECT * FROM customers");
    return rows; // 返回查询结果
}


module.exports = {
    pool,
    getCustomers
};