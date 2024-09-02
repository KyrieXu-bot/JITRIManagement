import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Sidebar from './components/Sidebar';
import ContentArea from './components/ContentArea';
import LoginForm from './components/LoginForm'; // 确保已经创建并导入LoginForm组件
import './App.css';

function App() {
  const [selected, setSelected] = useState('customers');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 初始时未登录
  const [userRole, setUserRole] = useState('');
  const [userAccount, setUserAccount] = useState('');
  const [userDepartment, setUserDepartment] = useState('');

  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true); // 登录成功时更新状态
    setUserRole(user.role); // 存储用户角色状态
    setUserAccount(user.account); // 存储用户角色状态
    setUserDepartment(user.department_id); // 存储用户角色状态
    console.log(userDepartment)
    localStorage.setItem('userRole', user.role); // 可选：也可存储到localStorage以便页面刷新后仍可用
  };
  return (
    <div className="App">
      {isLoggedIn ? (
          // 登录后显示的界面
          <>
              <Sidebar onSelect={setSelected} role={userRole} account={userAccount} departmentID={userDepartment} />
              <ContentArea selected={selected} role={userRole} account={userAccount} departmentID={userDepartment}/>
          </>
      ) : (
          // 未登录时显示登录界面
          <LoginForm onLoginSuccess={handleLoginSuccess} />
      )}
    </div>

  );
  
}

export default App;
