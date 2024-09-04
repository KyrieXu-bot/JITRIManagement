const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { findUserByAccount } = require('../models/database'); // 这是一个示例路径，你需要根据你的设置调整

router.post('/', async (req, res) => {
  const { account, password } = req.body;
  // 这里添加数据库查询逻辑
  const user = await findUserByAccount(account);

  if (user && await bcrypt.compare(password, user.password)) {
    res.json({ success: true, message: '登录成功', user: {
      role:user.role,
      account:user.account,
      department_id:user.department_id,
      group_id: user.group_id
    } });
  } else {
    res.status(401).json({ success: false, message: '账号或密码错误' });
  }
});

module.exports = router;
