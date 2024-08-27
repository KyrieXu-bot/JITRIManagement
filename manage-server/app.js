const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const customersRoutes = require('./routes/customers');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// 定义路由
app.use('/api/customers', customersRoutes);
app.listen(3001, () => {
    console.log('Server running on http://localhost:3001');
});

module.exports = app;
