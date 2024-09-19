const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const customersRoutes = require('./routes/customers');
const ordersRoutes = require('./routes/orders')
const samplesRoutes = require('./routes/samples')
const testsRoutes = require('./routes/tests')
const loginRoutes = require('./routes/login')
const usersRoutes = require('./routes/users')
const chartsRoutes = require('./routes/charts')
const monthsRoutes = require('./routes/months')

const app = express();

app.use(cors());
app.use(bodyParser.json());

// 定义路由
app.use('/api/customers', customersRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/samples', samplesRoutes);
app.use('/api/tests', testsRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/charts', chartsRoutes);
app.use('/api/months', monthsRoutes);

app.listen(3003, () => {
    console.log('Server running on http://localhost:3003');
});

module.exports = app;
