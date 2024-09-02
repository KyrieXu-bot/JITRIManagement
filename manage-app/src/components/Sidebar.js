import React from 'react';
import '../css/Sidebar.css';
const Sidebar = ({ onSelect, selected, role  }) => {
    return (
        <div className="sidebar">
            <h1>集萃检测管理系统</h1>
            <ul>
            {role === 'admin' && (
                    <>
                        <li className={selected === 'getCommission' ? 'active' : ''} onClick={() => onSelect('getCommission')}>委托单管理</li>
                        <li className={selected === 'getSamples' ? 'active' : ''} onClick={() => onSelect('getSamples')}>样品管理</li>
                        <li className={selected === 'getTests' ? 'active' : ''} onClick={() => onSelect('getTests')}>检测管理</li>
                        <li className={selected === 'getReports' ? 'active' : ''} onClick={() => onSelect('getReports')}>报告管理</li>
                    </>
                )}
                {(role === 'employee' || role === 'supervisor')&& (
                    <li className={selected === 'handleTests' ? 'active' : ''} onClick={() => onSelect('handleTests')}>检测项目处理</li>
                )}
            </ul>
        </div>
    );
};

export default Sidebar;
