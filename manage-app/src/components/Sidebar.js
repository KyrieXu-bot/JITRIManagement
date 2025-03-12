import React, { useState } from 'react';
import '../css/Sidebar.css';
const Sidebar = ({ onSelect, selected, role }) => {
    const [isCustomersMenuOpen, setIsCustomersMenuOpen] = useState(false);
    const [isCommissionsMenuOpen, setIsCommissionsMenuOpen] = useState(false);
    const [isReservationsMenuOpen, setIsReservationsMenuOpen] = useState(false); // 新增的设备预约菜单状态

    const toggleCustomersMenu = () => {
        setIsCustomersMenuOpen(!isCustomersMenuOpen);
    };
    const toggleCommissionsMenu = () => {
        setIsCommissionsMenuOpen(!isCommissionsMenuOpen);
    };
    const toggleReservationsMenu = () => { // 新增的设备预约菜单切换函数
        setIsReservationsMenuOpen(!isReservationsMenuOpen);
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
                                    委托方信息
                                </li>
                                <li
                                    className={selected === 'payerInfo' ? 'active' : ''}
                                    onClick={() => onSelect('payerInfo')}
                                >
                                    付款方信息
                                </li>
                                <li
                                    className={selected === 'transactionHistory' ? 'active' : ''}
                                    onClick={() => onSelect('transactionHistory')}
                                >
                                    交易流水
                                </li>
                            </ul>
                        )}
                        {/* 委托管理菜单 */}
                        <li className={`menu-item ${isCommissionsMenuOpen ? 'expanded' : ''}`} onClick={toggleCommissionsMenu}>
                            委托单管理
                            <span className="arrow">{isCommissionsMenuOpen ? '▼' : '▶'}</span>
                        </li>

                        {/* 委托管理的二级菜单 */}
                        {isCommissionsMenuOpen && (
                            <ul className="submenu">
                                <li
                                    className={selected === 'getCommission' ? 'active' : ''}
                                    onClick={() => onSelect('getCommission')}
                                >
                                    详细信息
                                </li>
                                <li
                                    className={selected === 'getChecked' ? 'active' : ''}
                                    onClick={() => onSelect('getChecked')}
                                >
                                    已结算订单
                                </li>
                            </ul>
                        )}
                        <li className={selected === 'dataStatistics' ? 'active' : ''} onClick={() => onSelect('dataStatistics')}>数据统计</li>
                        <li className={selected === 'getSamples' ? 'active' : ''} onClick={() => onSelect('getSamples')}>样品管理</li>
                        <li className={selected === 'getTests' ? 'active' : ''} onClick={() => onSelect('getTests')}>检测管理</li>
                        <li className={selected === 'getReports' ? 'active' : ''} onClick={() => onSelect('getReports')}>报告管理</li>
                    </>
                )}
                {role === 'leader' && (
                    <>
                        <li className={selected === 'handleTests' ? 'active' : ''} onClick={() => onSelect('handleTests')}>检测项目处理</li>
                        <li className={selected === 'getCommission' ? 'active' : ''} onClick={() => onSelect('getCommission')}>委托单</li>
                        <li className={selected === 'dataStatistics' ? 'active' : ''} onClick={() => onSelect('dataStatistics')}>数据统计</li>
                        {/* <li className={selected === 'timeline' ? 'active' : ''} onClick={() => onSelect('timeline')}>设备统计(维护中)</li> */}

                    </>
                )}
                {role !== 'admin' && role !== 'leader' && (
                    <>
                        <li className={selected === 'handleTests' ? 'active' : ''} onClick={() => onSelect('handleTests')}>检测项目处理</li>
                        <li className={selected === 'getCommission' ? 'active' : ''} onClick={() => onSelect('getCommission')}>委托单</li>
                        {/* <li className={selected === 'timeline' ? 'active' : ''} onClick={() => onSelect('timeline')}>设备预约(维护中)</li> */}

                    </>
                )}

                {/* 设备预约一级菜单 */}
                <li className={`menu-item ${isReservationsMenuOpen ? 'expanded' : ''}`} onClick={toggleReservationsMenu}>
                    设备预约
                    <span className="arrow">{isReservationsMenuOpen ? '▼' : '▶'}</span>
                </li>

                {/* 设备预约的二级菜单 */}
                {isReservationsMenuOpen && (
                    <ul className="submenu">
                        <li
                            className={selected === 'getReservation' ? 'active' : ''}
                            onClick={() => onSelect('getReservation')}
                        >
                            设备预约时间表
                        </li>
                        <li
                            className={selected === 'myReservation' ? 'active' : ''}
                            onClick={() => onSelect('myReservation')}
                        >
                            我的预约
                        </li>
                    </ul>
                )}
            </ul>

        </div>
    );
};

export default Sidebar;
