import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Sidebar from './components/Sidebar';
import ContentArea from './components/ContentArea';
import LoginForm from './components/LoginForm'; // 确保已经创建并导入LoginForm组件
import './App.css';
import { AuthProvider } from './context/AuthContext';

function App() {
  const [selected, setSelected] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 初始时未登录
  const [userRole, setUserRole] = useState('');
  const [userAccount, setUserAccount] = useState('');
  const [userDepartment, setUserDepartment] = useState('');
  const [userGroup, setUserGroup] = useState('');
  const [userName, setUserName] = useState('');


  useEffect(() => {
    const user = localStorage.getItem('userAccount');
    if (user) {
      const userData = JSON.parse(user);
      setIsLoggedIn(true); // 设置为已登录
      setUserRole(userData.role);
      setUserAccount(userData.account);
      setUserDepartment(userData.department_id);
      setUserGroup(userData.group_id);
      setUserName(userData.name)
    }
}, []); // 依赖于user状态

  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true); // 登录成功时更新状态
    setUserRole(user.role); // 存储用户角色状态
    setUserAccount(user.account); // 存储用户角色状态
    setUserDepartment(user.department_id); // 存储用户角色状态
    setUserGroup(user.group_id);
    setUserName(user.name);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('userRole', user.role); // 可选：也可存储到localStorage以便页面刷新后仍可用
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole('');
    setUserAccount('');
    setUserDepartment('');
    setUserGroup('');
    localStorage.removeItem('user');
    localStorage.removeItem('userAccount');
    localStorage.removeItem('userRole');
  };

  return (
    <AuthProvider>
      <div className="App">
      {isLoggedIn ? (
          // 登录后显示的界面
          <>
              <Sidebar 
              onSelect={setSelected} selected={selected} 
              role={userRole} 
              account={userAccount} 
              departmentID={userDepartment} />
              <ContentArea 
              selected={selected} 
              role={userRole} 
              account={userAccount} 
              departmentID={userDepartment}
              groupId={userGroup}
              name={userName}
              onLogout={handleLogout}
              />
          </>
      ) : (
          // 未登录时显示登录界面
          <LoginForm onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
    </AuthProvider>

  );
  
}

export default App;
