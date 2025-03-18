const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const app = express();

// const allowedOrigins = ['http://192.168.9.46:3003', 'https://jicuijiance.mat-jitri.cn'];

// app.use(cors({
//     origin: function (origin, callback) {
//         if (!origin || allowedOrigins.includes(origin)) {
//             callback(null, true);
//         } else {
//             callback(new Error('Not allowed by CORS'));
//         }
//     },
//     credentials: true,
//     methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PUT'],
//     allowedHeaders: ['Authorization', 'Content-Type']
// }));

// app.options('*', cors());

app.use(cors());
app.use(bodyParser.json());
// 提供静态文件（前端的build目录）
app.use(express.static(path.join(__dirname, '../manage-app/build')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');  // 防止 MIME 类型欺骗
    res.removeHeader('X-Powered-By');  // 隐藏 Express.js 信息，避免暴露服务器类型
    next();
});

const customersRoutes = require('./routes/customers');
const payersRoutes = require('./routes/payers');
const transactionRoutes = require('./routes/transactions');
const ordersRoutes = require('./routes/orders')
const samplesRoutes = require('./routes/samples')
const testsRoutes = require('./routes/tests')
const loginRoutes = require('./routes/login')
const usersRoutes = require('./routes/users')
const chartsRoutes = require('./routes/charts')
const monthsRoutes = require('./routes/months')
const filesRoutes = require('./routes/files')
const reservationRoutes = require('./routes/reservation')

app.use('/api/customers', customersRoutes);
app.use('/api/payers', payersRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/samples', samplesRoutes);
app.use('/api/tests', testsRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/charts', chartsRoutes);
app.use('/api/months', monthsRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/reservations', reservationRoutes);





// 捕获所有其他路由并返回 React 的 index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../manage-app/build', 'index.html'));
});

// 监听 80 端口（HTTP）
// const PORT = process.env.PORT || 3003;

// app.listen(3003, () => {
//     console.log('Server running on http://localhost:3003');
// });

// 监听 80 和 3003
const http = require('http');
const server = http.createServer(app);

// server.listen(443, () => {
//     console.log('Server running on http://localhost:443');
// });

server.listen(3003, () => {
    console.log('Server running on http://localhost:3003');
});


module.exports = app;
