import React from 'react';
import '../css/HomePage.css'
const HomePage = ({ role, assignedNotTestedOrders, onShowAssignment}) => {
    const notAssigned = assignedNotTestedOrders.filter(order => order.status === '0');
    const notTested = assignedNotTestedOrders.filter(order => order.status === '1');
    const checked = assignedNotTestedOrders.filter(order => order.status === '3');

    const renderRoleContent = () => {
        switch (role) {
            case 'leader':
                return (
                    <div>
                        <p>欢迎室主任！这里是您的工作面板。这里有已分配但未检测的委托单号。</p>
                    </div>
                );
            case 'supervisor':
                return (
                    <div>
                        <p>欢迎组长！您可以查看您负责的已分配但未指派/检测的委托单号。</p>
                    </div>
                );
            case 'employee':
                return (
                    <div>
                        <p>欢迎实验员！这是您的工作面板，显示您当前已分配但未检测的委托单号。</p>
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
                                            <button onClick={() => onShowAssignment(order)}>立即分配</button>
                                        </li>

                                    ))}
                                </ul>
                                
                            </div>
                            <div className='countGroup'>
                                检测项目总数量：
                                <br />
                                {assignedNotTestedOrders.length}个
                            </div>
                            <div className='countGroup'>
                                审批通过总量：
                                <br />
                                {checked.length}个
                            </div>
                        </div>
                    ) : (
                        <p>没有找到任何待检测的委托单号。</p>
                    )
                ) : role === 'supervisor' || role === 'employee' ? (
                    notTested.length > 0 ? (
                        <div className='block'>
                            <div>
                                <h3>待检测项目：{notTested.length}个</h3>
                                <ul>

                                    {notTested.map((order) => (
                                        <li key={order.order_num} className="order-item">
                                            委托单号: {order.order_num}
                                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                            检测项目：{order.test_item}
                                        </li>
                                    ))}
                                </ul>
                                
                            </div>
                            <div>
                                需要展示的其他内容
                            </div>
                        </div>

                    ) : (
                        <p>没有找到任何待检测的委托单号。</p>
                    )
                ) : (
                    <div></div>
                )}

            </div>
        </div>
    );
};

export default HomePage;
