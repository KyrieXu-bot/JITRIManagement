import React from 'react';
import '../css/HomePage.css'
const HomePage = ({ role, assignedNotTestedOrders, onShowAssignment, onShowCheck, renderDeadlineStatus }) => {
    const notAssigned = assignedNotTestedOrders.filter(order => order.status === '0');
    const notTested = assignedNotTestedOrders.filter(order => order.status === '1');
    const notChecked = assignedNotTestedOrders.filter(order => order.status === '2');

    const checked = assignedNotTestedOrders.filter(order => order.status === '3');
    let totalMachineHours = 0;
    let totalWorkHours = 0;
    let totalListedPrice = 0;
    let totalDiscountedPrice = 0;
    for (let order of assignedNotTestedOrders) {
        // 使用 Number() 将所有数值转换为数字，并检查是否为有效数值
        totalMachineHours += Number(order.machine_hours) || 0;   // 如果不是有效数值，就加0
        totalWorkHours += Number(order.work_hours) || 0;
        totalListedPrice += Number(order.listed_price) || 0;
        totalDiscountedPrice += Number(order.discounted_price) || 0;
    }
    totalDiscountedPrice = Number(totalDiscountedPrice);
    totalListedPrice = Number(totalListedPrice);
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
        switch (role) {
            case 'leader':
                return (
                    <div>
                        <p>欢迎室主任！这里是您的工作面板，显示您当前负责的检测项目。</p>
                    </div>
                );
            case 'supervisor':
                return (
                    <div>
                        <p>欢迎组长！您可以查看您负责的指派/检测的委托单号。</p>
                    </div>
                );
            case 'employee':
                return (
                    <div>
                        <p>欢迎实验员！这是您的工作面板，显示您当前负责的检测项目。</p>
                    </div>
                );
            case 'sales':
                return (
                    <div>
                        <p>欢迎业务员！这是您的工作面板，显示您当前负责的业务委托数据。</p>
                    </div>
                );
            default:
                return (
                    <div>
                        <h2>欢迎来到 JITRI Management</h2>
                        <p>这里是您的工作面板。</p>
                    </div>
                );
        }
    };

    return (
        <div className="homepage">
            <h1>集萃检测管理系统</h1>
            {renderRoleContent()}
            {role === 'leader' || role === 'supervisor' ? (
                <nav className='navGroup'>
                    <div className='countGroup'>
                        检测项目总数量：
                        <br />
                        <p>{assignedNotTestedOrders.length}个</p>
                    </div>
                    <div className='countGroup'>
                        审批通过总量：
                        <br />
                        <p>{checked.length}个</p>
                    </div>
                    <div className='countGroup'>
                        小组总委托额：
                        <br />
                        <p>{formattedListed}元</p>
                    </div>
                    <div className='countGroup'>
                        最终优惠总额：
                        <br />
                        <p>{formattedDiscount}元</p>
                    </div>
                </nav>
            ) : role === 'employee' ? (
                <nav className='navGroup'>
                    <div className='countGroup'>
                        检测项目总数量：
                        <br />
                        <p>{assignedNotTestedOrders.length}个</p>
                    </div>
                    <div className='countGroup'>
                        审批通过总量：
                        <br />
                        <p>{checked.length}个</p>
                    </div>
                    <div className='countGroup'>
                        我的总工时
                        <br />
                        <p>{totalWorkHours}小时</p>
                    </div>
                    <div className='countGroup'>
                        我的总机时
                        <br />
                        <p>{totalMachineHours}小时</p>
                    </div>
                </nav>
            ) : (
                <nav className='navGroup'>
                    <div className='countGroup'>
                        检测项目总数量：
                        <br />
                        <p>{assignedNotTestedOrders.length}个</p>
                    </div>
                    <div className='countGroup'>
                        检测项目总委托额：
                        <br />
                        <p>{formattedListed}元</p>
                    </div>
                    <div className='countGroup'>
                        总优惠委托额：
                        <br />
                        <p>{formattedDiscount}元</p>
                    </div>
                </nav>
            )}
            <div className="dashboard">

                {role === 'leader' ? (
                    notAssigned.length > 0 ? (
                        <div className='block'>
                            <div>
                                <h3>待分配项目：{notAssigned.length}个</h3>

                                <ul>
                                    {notAssigned.map((order) => (
                                        <li key={order.order_num} className="order-item">
                                            委托单号: {order.order_num}
                                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                            检测项目：{order.test_item}
                                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                            开单时间：{new Date(order.create_time).toLocaleString()}
                                            <button onClick={() => onShowAssignment(order)}>立即分配</button>

                                        </li>

                                    ))}
                                </ul>

                            </div>

                        </div>
                    ) : (
                        <p>没有找到任何待检测的委托单号。</p>
                    )
                ) : role === 'supervisor' || role === 'employee' ? (
                    <div className='block-group'>
                        <div className='block'>
                            <h3>待完成项目：<span className='projTitle'>{notTested.length}个</span></h3>
                            {notTested.length > 0 ? (


                                <div>
                                    <ul>
                                        {notTested.map((order) => (
                                            <li key={order.order_num} className="order-item">
                                                委托单号: {order.order_num}
                                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                                检测项目：{order.test_item}
                                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                                <br></br>
                                                检测人员：{order.team_names}
                                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;

                                                开单时间：{order.create_time ? new Date(order.create_time).toLocaleString() : ''}
                                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                                <br></br>
                                                {renderDeadlineStatus(order.deadline, order.appoint_time)}

                                            </li>
                                        ))}
                                    </ul>

                                </div>
                            ) : (
                                <p>没有找到任何待检测的委托单号。</p>
                            )}
                        </div>

                        <div className='block'>
                            <h3>待审批项目：<span className='projTitle'>{notChecked.length}个</span></h3>
                            {notChecked.length > 0 ? (


                                <div>
                                    <ul>
                                        {notChecked.map((order) => (
                                            <li key={order.order_num} className="order-item">
                                                委托单号: {order.order_num}
                                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                                检测项目：{order.test_item}
                                                <br></br>
                                                检测人员：{order.team_names}
                                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;

                                                开单时间：{order.create_time ? new Date(order.create_time).toLocaleString() : ''}
                                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                                <br></br>
                                                {renderDeadlineStatus(order.deadline, order.appoint_time)}
                                                <button className='home-check' onClick={() => onShowCheck(order)}>审批</button>

                                            </li>
                                            
                                        ))}
                                    </ul>

                                </div>
                            ) : (
                                <p>当前暂无审批任务</p>
                            )}
                        </div>
                    </div>


                ) : (
                    <div></div>
                )}

            </div>
        </div>
    );
};

export default HomePage;
