import React, { useState } from 'react';
import axios from 'axios';

function LoginForm({ onLoginSuccess }) {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:3003/api/login', { account, password });
      console.log('登录成功:', response.data);
      // 处理登录后逻辑
      onLoginSuccess(); // 调用App组件传递的方法，通知登录成功

    } catch (error) {
      console.error('登录失败:', error.response.data.message);
    }
  };

  return (
    <div>
      <input type="text" value={account} onChange={e => setAccount(e.target.value)} placeholder="账号" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="密码" />
      <button onClick={handleLogin}>登录</button>
    </div>
  );
}

export default LoginForm;
