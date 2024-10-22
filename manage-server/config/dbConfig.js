const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'jitri',
    password: 'jitri@123',
    database: 'jitri'
});


// const pool = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     password: 'jitri',
//     database: 'jitri'
// });
module.exports = pool;
