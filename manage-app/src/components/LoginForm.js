import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../css/Login.css'
function LoginForm({ onLoginSuccess }) {
  const { login } = useAuth();

  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:3003/api/login', { account, password });
      console.log('登录成功:', response.data);
      // 处理登录后逻辑
      // // 存储用户信息和角色
      localStorage.setItem('userRole', response.data.user.role); // 存储角色
      localStorage.setItem('userAccount', JSON.stringify(response.data.user)); // 存储用户信息
      if (response.data) {
        login(response.data.user); // 存储用户信息，假设包括角色信息
        onLoginSuccess(response.data.user); // 修改以传递用户信息
    }
    } catch (error) {
      console.error('登录失败:', error.response && error.response.data ? error.response.data.message : 'Login failed');
    }
  };

  return (
    <div className="login-container">
      <h1>集萃检测管理系统(Beta)</h1>
      <div className="form-group">
        <input type="text" value={account} onChange={e => setAccount(e.target.value)} placeholder="账号" />
      </div>
      <div className="form-group">
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="密码" />
      </div>
      <button class="loginButton" onClick={handleLogin}>登录</button>
    </div>
  );
}

export default LoginForm;
