const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'jitri',
    password: 'jitri@123',
    database: 'jitri'
});

module.exports = pool;
