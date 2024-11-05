const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(bodyParser.json());
// 提供静态文件（前端的build目录）
app.use(express.static(path.join(__dirname, '../manage-app/build')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


// 定义路由

const customersRoutes = require('./routes/customers');
const ordersRoutes = require('./routes/orders')
const samplesRoutes = require('./routes/samples')
const testsRoutes = require('./routes/tests')
const loginRoutes = require('./routes/login')
const usersRoutes = require('./routes/users')
const chartsRoutes = require('./routes/charts')
const monthsRoutes = require('./routes/months')
const filesRoutes = require('./routes/files')

app.use('/api/customers', customersRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/samples', samplesRoutes);
app.use('/api/tests', testsRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/charts', chartsRoutes);
app.use('/api/months', monthsRoutes);
app.use('/api/files', filesRoutes);




// 捕获所有其他路由并返回 React 的 index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../manage-app/build', 'index.html'));
});

const PORT = process.env.PORT || 3003;

app.listen(3003, () => {
    console.log('Server running on http://localhost:3003');
});

module.exports = app;
