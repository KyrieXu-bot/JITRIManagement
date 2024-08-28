import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ContentArea from './components/ContentArea';
import LoginForm from './components/LoginForm'; // 确保已经创建并导入LoginForm组件
import './App.css';

function App() {
  const [selected, setSelected] = useState('customers');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 初始时未登录

  const handleLoginSuccess = () => {
    setIsLoggedIn(true); // 登录成功时更新状态
};
  return (
    <div className="App">
      {isLoggedIn ? (
          // 登录后显示的界面
          <>
              <Sidebar onSelect={setSelected} />
              <ContentArea selected={selected} />
          </>
      ) : (
          // 未登录时显示登录界面
          <LoginForm onLoginSuccess={handleLoginSuccess} />
      )}
    </div>

  );
  
}

export default App;
