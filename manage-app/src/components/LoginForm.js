import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../css/Login.css'
import config from '../config/config'
function LoginForm({ onLoginSuccess }) {
  const { login } = useAuth();

  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${config.API_BASE_URL}/api/login`, { account, password });
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
      alert(`登录失败: ${error.response && error.response.data ? error.response.data.message : 'Login failed'}`);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="login-container">
      <h1>集萃检测管理系统(Beta)</h1>
      <div className="form-group">
        <input 
          type="text" 
          value={account} 
          onChange={e => setAccount(e.target.value)} 
          onKeyDown={handleKeyDown}
          placeholder="账号" 
        />
      </div>
      <div className="form-group">
        <input 
          type="password"
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          onKeyDown={handleKeyDown}
          placeholder="密码" />
      </div>
      <button class="loginButton" onClick={handleLogin}>登录</button>
    </div>
  );
}

export default LoginForm;
