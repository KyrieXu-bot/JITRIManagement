import React from 'react';
import '../css/Sidebar.css';
const Sidebar = ({ onSelect, selected }) => {
    return (
        // <div style={{ width: '30%', float: 'left', background: '#f0f0f0', height: '100vh' }}>
        //     <h1>集萃检测管理系统</h1>
        //     <ul>
        //         <li onClick={() => onSelect('customers')}>委托单管理</li>
        //         <li onClick={() => onSelect('samples')}>样品管理</li>
        //         <li onClick={() => onSelect('testItems')}>检测管理</li>
        //         <li onClick={() => onSelect('reports')}>报告管理</li>
        //     </ul>
        // </div>

        <div className="sidebar">
            <h1>集萃检测管理系统</h1>
            <ul>
                <li className={selected === 'getCommission' ? 'active' : ''} onClick={() => onSelect('getCommission')}>委托单管理</li>
                <li className={selected === 'samples' ? 'active' : ''} onClick={() => onSelect('samples')}>样品管理</li>
                <li className={selected === 'testItems' ? 'active' : ''} onClick={() => onSelect('testItems')}>检测管理</li>
                <li className={selected === 'reports' ? 'active' : ''} onClick={() => onSelect('reports')}>报告管理</li>
            </ul>
        </div>
    );
};

export default Sidebar;
