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
                {role === 'leader' && (
                    <>
                        <li className={selected === 'handleTests' ? 'active' : ''} onClick={() => onSelect('handleTests')}>检测项目处理</li>
                        <li className={selected === 'getCommission' ? 'active' : ''} onClick={() => onSelect('getCommission')}>委托单管理</li>
                        <li className={selected === 'dataStatistics' ? 'active' : ''} onClick={() => onSelect('dataStatistics')}>数据统计</li>
                    </>
                )}
                {role !== 'admin' && role !== 'leader' && (
                    <>
                        {/* <li className={selected === 'dataStatistics' ? 'active' : ''} onClick={() => onSelect('dataStatistics')}>我的看板</li> */}
                        <li className={selected === 'handleTests' ? 'active' : ''} onClick={() => onSelect('handleTests')}>检测项目处理</li>
                    </>
                )}
            </ul>
        </div>
    );
};

export default Sidebar;
