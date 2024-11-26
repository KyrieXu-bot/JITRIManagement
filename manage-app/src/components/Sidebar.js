import React, { useState } from 'react';
import '../css/Sidebar.css';
const Sidebar = ({ onSelect, selected, role }) => {
    const [isCustomersMenuOpen, setIsCustomersMenuOpen] = useState(false);

    const toggleCustomersMenu = () => {
        setIsCustomersMenuOpen(!isCustomersMenuOpen);
    };
    return (
        <div className="sidebar">
            <div className="logo-container">
                <img src='/JITRI-logo.png' alt='logo' className="sidebar-logo" onClick={() => onSelect('')}></img>
                <div className="home-link">回到首页</div>
            </div>
            <ul>
                {role === 'admin' && (
                    <>
                        <li className={selected === 'getCommission' ? 'active' : ''} onClick={() => onSelect('getCommission')}>委托单</li>
                        <li className={selected === 'getSamples' ? 'active' : ''} onClick={() => onSelect('getSamples')}>样品管理</li>
                        <li className={selected === 'getTests' ? 'active' : ''} onClick={() => onSelect('getTests')}>检测管理</li>
                        <li className={selected === 'getReports' ? 'active' : ''} onClick={() => onSelect('getReports')}>报告管理</li>
                        {/* 客户管理菜单 */}
                        <li className={`menu-item ${isCustomersMenuOpen ? 'expanded' : ''}`} onClick={toggleCustomersMenu}>
                            客户管理
                            <span className="arrow">{isCustomersMenuOpen ? '▼' : '▶'}</span>
                        </li>

                        {/* 客户管理的二级菜单 */}
                        {isCustomersMenuOpen && (
                            <ul className="submenu">
                                <li
                                    className={selected === 'customerInfo' ? 'active' : ''}
                                    onClick={() => onSelect('customerInfo')}
                                >
                                    客户信息
                                </li>
                                <li
                                    className={selected === 'transactionHistory' ? 'active' : ''}
                                    onClick={() => onSelect('transactionHistory')}
                                >
                                    交易流水
                                </li>
                            </ul>
                        )}


                    </>
                )}
                {role === 'leader' && (
                    <>
                        <li className={selected === 'handleTests' ? 'active' : ''} onClick={() => onSelect('handleTests')}>检测项目处理</li>
                        <li className={selected === 'getCommission' ? 'active' : ''} onClick={() => onSelect('getCommission')}>委托单</li>
                        <li className={selected === 'dataStatistics' ? 'active' : ''} onClick={() => onSelect('dataStatistics')}>数据统计</li>
                        <li className={selected === 'timeline' ? 'active' : ''} onClick={() => onSelect('timeline')}>设备统计</li>

                    </>
                )}
                {role !== 'admin' && role !== 'leader' && (
                    <>
                        <li className={selected === 'handleTests' ? 'active' : ''} onClick={() => onSelect('handleTests')}>检测项目处理</li>
                        <li className={selected === 'getCommission' ? 'active' : ''} onClick={() => onSelect('getCommission')}>委托单</li>

                    </>
                )}
            </ul>
        </div>
    );
};

export default Sidebar;
