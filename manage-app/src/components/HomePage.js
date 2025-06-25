import React from 'react';
import '../css/HomePage.css';

const HomePage = ({ role, account, summaryData, deliveredData = [], onShowAssignment, onShowDetail, onShowCheck, onShowFinish, renderDeadlineStatus, loading, deliveredLoading }) => {
    const statusCounts = { '0': 0, '1': 0, '2': 0, '3': 0, '5': 0 };
    console.log(deliveredLoading)
    let totalMachineHours = 0;
    let totalWorkHours = 0;
    let totalListedPrice = 0;
    let totalDiscountedPrice = 0;
    const salesStats = {};
    const notAssigned = [];
    const notTested = [];
    const notChecked = [];
    const rawDataProjects = deliveredData.filter(d => d.has_raw_data);
    summaryData.forEach(order => {
        const status = order.status;
        if (statusCounts[status] !== undefined) {
            statusCounts[status]++;
        }

        totalMachineHours += Number(order.machine_hours) || 0;
        totalWorkHours += Number(order.work_hours) || 0;
        totalListedPrice += Number(order.listed_price) || 0;
        totalDiscountedPrice += Number(order.discounted_price) || 0;

        if (order.sales_names) {
            const salesName = order.sales_names;
            if (!salesStats[salesName]) {
                salesStats[salesName] = {
                    deliveredCount: 0,
                    totalProjects: 0,
                    totalListedPrice: 0,
                    totalDiscountedPrice: 0
                };
            }
            salesStats[salesName].totalProjects++;
            if (order.status === '5') {
                salesStats[salesName].deliveredCount++;
            }
            salesStats[salesName].totalListedPrice += Number(order.listed_price) || 0;
            salesStats[salesName].totalDiscountedPrice += Number(order.discounted_price) || 0;
        }

        // leader 直接看所有未指派
        if (role === 'leader' && status === '0') notAssigned.push(order);
        // supervisor 看 status = 1 且没有检测人
        if (role === 'supervisor' && status === '1' && !order.team_names) notTested.push(order);
        // employee 看自己待完成的
        if (role === 'employee' && status === '1') notTested.push(order);

        if (status === '2') {
            if (role === 'supervisor') {
                const managerAccounts = (order.manager_accounts || '').split(',').map(a => a.trim());
                if (managerAccounts.includes(account)) {
                    notChecked.push(order);
                }
            } else if (role === 'employee') {
                notChecked.push(order);
            }
        }
    });

    const formattedDiscount = new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
        minimumFractionDigits: 2
    }).format(totalDiscountedPrice);

    const formattedListed = new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
        minimumFractionDigits: 2
    }).format(totalListedPrice);

    const renderRoleContent = () => {
        const roleMessages = {
            leader: "欢迎室主任！这里是您的工作面板，显示您当前负责的检测项目。",
            supervisor: "欢迎组长！您可以查看您负责的指派/检测的委托单号。",
            employee: "欢迎实验员！这是您的工作面板，显示您当前负责的检测项目。",
            sales: "欢迎业务员！这是您的工作面板，显示您当前负责的业务委托数据。",
        };
        return <p>{roleMessages[role] || '欢迎来到 JITRI Management，这里是您的工作面板。'}</p>;
    };

    return (
        <div className="homepage">
            <h1>集萃检测管理系统</h1>
            {renderRoleContent()}

            <nav className='navGroup'>
                <div className='countGroup'>
                    检测项目总数量：
                    <p>{summaryData.length}个</p>
                </div>
                {role === 'leader' || role === 'supervisor' ? (
                    <>
                        <div className='countGroup'>
                            审批通过总量：
                            <p>{statusCounts['3']}个</p>
                        </div>
                        <div className='countGroup'>
                            小组总委托额：
                            <p>{formattedListed}元</p>
                        </div>
                        <div className='countGroup'>
                            最终优惠总额：
                            <p>{formattedDiscount}元</p>
                        </div>
                    </>
                ) : role === 'employee' ? (
                    <>
                        <div className='countGroup'>
                            审批通过总量：
                            <p>{statusCounts['3']}个</p>
                        </div>
                        <div className='countGroup'>
                            我的总工时：
                            <p>{totalWorkHours}小时</p>
                        </div>
                        <div className='countGroup'>
                            我的总机时：
                            <p>{totalMachineHours}小时</p>
                        </div>
                        <div className='countGroup'>
                            我的总委托额：
                            <p>{totalListedPrice}元</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className='countGroup'>
                            交付项目总数量：
                            <p>{statusCounts['5']}个</p>
                        </div>
                        <div className='countGroup'>
                            检测项目总委托额：
                            <p>{formattedListed}元</p>
                        </div>
                        <div className='countGroup'>
                            总优惠委托额：
                            <p>{formattedDiscount}元</p>
                        </div>
                    </>
                )}
            </nav>

            <div className="dashboard">
                {loading ? (
                    <div className="loading-container">
                        <p className="loading-text">正在加载页面，请稍等......</p>
                    </div>
                ) : (
                    <>
                        {role === 'leader' && notAssigned.length > 0 && (
                            <div className='block'>
                                <h3>待分配项目：{notAssigned.length}个</h3>
                                <ul>
                                    {notAssigned.map(order => (
                                        <li key={order.test_item_id} className="order-item">
                                            委托单号: {order.order_num} 检测项目: {order.test_item}
                                            开单时间：{order.create_time ? new Date(order.create_time).toLocaleString() : ''}
                                            <button onClick={() => onShowAssignment(order)}>立即分配</button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {(role === 'supervisor' || role === 'employee') && (
                            <div className="block-group">
                                <div className="block">
                                    <h3>待完成项目：{notTested.length}个</h3>
                                    <ul>
                                        {notTested.map(order => (
                                            <li key={order.test_item_id} className="order-item">
                                                委托单号: {order.order_num} 检测项目: {order.test_item}
                                                检测人员: {order.team_names} 开单时间: {order.create_time ? new Date(order.create_time).toLocaleString() : ''}
                                                <br />
                                                {renderDeadlineStatus(order.deadline, order.appoint_time)}
                                                {order.team_names
                                                    ? <button onClick={() => onShowFinish(order)}>完成</button>
                                                    : <button onClick={() => onShowAssignment(order)}>指派</button>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                {role === 'supervisor' && notChecked.length > 0 && (
                                    <div className="block">
                                        <h3>待审批项目：{notChecked.length}个</h3>
                                        <ul>
                                            {notChecked.map(order => (
                                                <li key={order.test_item_id} className="order-item">
                                                    委托单号: {order.order_num} 检测项目: {order.test_item}
                                                    检测人员: {order.team_names} 开单时间: {order.create_time ? new Date(order.create_time).toLocaleString() : ''}
                                                    <br />
                                                    {renderDeadlineStatus(order.deadline, order.appoint_time)}
                                                    <button onClick={() => onShowCheck(order)}>审批</button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {role === 'sales' && account === 'YW001' && (
                            <div className="market-department">
                                <h3>市场部门销售员工统计</h3>
                                <table className="stats-table">
                                    <thead>
                                        <tr>
                                            <th>销售员工</th>
                                            <th>已交付数量</th>
                                            <th>检测项目总数</th>
                                            <th>总委托额 (元)</th>
                                            <th>总优惠额 (元)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(salesStats).map(([name, stat]) => (
                                            <tr key={name}>
                                                <td>{name}</td>
                                                <td>{stat.deliveredCount}</td>
                                                <td>{stat.totalProjects}</td>
                                                <td>{stat.totalListedPrice.toFixed(2)}</td>
                                                <td>{stat.totalDiscountedPrice.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {role === 'sales' && rawDataProjects.length > 0 && account !== 'YW001' && (
                        <div className="block">
                            <h3>已上传原始实验数据的项目：{rawDataProjects.length} 个</h3>

                            {deliveredLoading ? (
                                <p style={{opacity:.6}}>加载中…</p>
                            ) : rawDataProjects.length === 0 ? (
                                <p style={{opacity:.6}}>暂无数据</p>
                            ) : (
                                <ul>
                                {rawDataProjects.map(item => (
                                    <li key={item.test_item_id} className="order-item">
                                    委托单号: {item.order_num} ｜ 检测项目: {item.test_item}
                                    <button onClick={() => onShowDetail(item)}>详情</button>
                                    </li>
                                ))}
                                </ul>
                            )}
                        </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default HomePage;
