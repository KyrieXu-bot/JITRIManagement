import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Modal, Button, Form, Toast } from 'react-bootstrap'; // 使用React Bootstrap进行模态弹窗和表单处理
import '../css/ContentArea.css'


const ContentArea = ({ departmentID, account, selected, role, groupId, onLogout }) => {

    const [data, setData] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentItem, setCurrentItem] = useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false); // 控制Toast显示的状态
    const [, setError] = useState('');
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [assignableUsers, setAssignableUsers] = useState([]);
    const [checkNote, setCheckNote] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const isAssignedToMeRef = useRef(false); // Use useRef to persist state across renders

    const [finishData, setFinishData] = useState({
        machine_hours: '',
        work_hours: '',
        operator: account, // 默认为当前登录的账户
        equipment_id: ''
    });
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [showCheckModal, setShowCheckModal] = useState(false);
    const [assignmentInfo, setAssignmentInfo] = useState('');

    const statusLabels = {
        0: '待分配',
        1: '已分配待检测',
        2: '已检测待审批',
        3: '审批通过',
        4: '审批失败'

    };

    const serviceTypeLabels = {
        1: '常规(正常排单周期)',
        2: '加急',
        3: '特急'
    };

    const fetchData = useCallback(async (endpoint) => {
        try {
            const response = await axios.get(`http://localhost:3003/api/${endpoint}?status=${filterStatus}`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to fetch data'); // 更新错误状态
            setTimeout(() => setError(''), 3000); // 3秒后清除错误消息
        }
    }, [setError, filterStatus]);

    //拉取工程师显示数据
    const fetchDataForEmployee = useCallback(async (account) => {
        try {
            const response = await axios.get(`http://localhost:3003/api/tests/assignments/${account}?status=${filterStatus}`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching assigned tests:', error);
        }
    }, [filterStatus]);

    //拉取组长显示数据
    const fetchDataForSupervisor = useCallback(async (departmentId) => {
        try {
            const params = new URLSearchParams();
            if (filterStatus) params.append('status', filterStatus);
            if (departmentId) params.append('departmentId', departmentId);  // 添加部门ID到请求参数
            if (role === 'supervisor') {
                params.append('account', account)

            }
            const response = await axios.get(`http://localhost:3003/api/tests?${params}`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching data for supervisor:', error);
            setError('Failed to fetch data');
            setTimeout(() => setError(''), 3000);
        }
    }, [role, account, filterStatus, setError]);

    // 拉取可分配的用户列表
    const fetchAssignableUsers = useCallback(async () => {
        try {
            let endpoint = '';
            if (role === 'leader') {
                endpoint = `/api/users/supervisors?departmentId=${departmentID}`;
            } else if (role === 'supervisor') {
                endpoint = `/api/users/employees?departmentId=${departmentID}`;
            }
            const response = await axios.get(`http://localhost:3003${endpoint}`);
            const users = response.data;
            setAssignableUsers(users);
            if (users && users.length > 0) {
                setAssignmentInfo(users[0].account); // 设置默认选项为列表的第一个账号
            } else {
                setAssignmentInfo(''); // 如果没有可分配用户，清空当前选择
            }
        } catch (error) {
            console.error('Failed to fetch assignable users:', error);
        }
    }, [role, departmentID]);


    const fetchGroupUsers = useCallback(async (groupId) => {
        try {
            const response = await axios.get(`http://localhost:3003/api/users/group/${groupId}`);
            const users = response.data;
            setAssignableUsers(users);
            if (users.length > 0) {
                setAssignmentInfo(users[0].account); // 默认选中第一个
            }
        } catch (error) {
            console.error('Error fetching group members:', error);
        }
    }, []);


    useEffect(() => {
        if (role === 'employee' && selected === 'handleTests') {
            fetchDataForEmployee(account);
        } else if (role === 'supervisor' || role === 'leader') {
            fetchDataForSupervisor(departmentID);
        } else {
            if (selected === 'getCommission') {
                fetchData('orders');
            } else if (selected === 'getSamples') {
                fetchData('samples');
            } else if (selected === 'getTests') {
                fetchData('tests');
            }
        }
        if (role === 'leader') {
            fetchAssignableUsers();
        } else if (role === 'supervisor') {
            fetchGroupUsers(groupId)
        }
    }, [selected,
        account,
        departmentID,
        role,
        groupId,
        fetchData,
        fetchDataForEmployee,
        fetchDataForSupervisor,
        fetchAssignableUsers,
        fetchGroupUsers
    ]);




    const handleEdit = (item) => {
        setCurrentItem(item);
        setShowModal(true);
    };

    const handleDelete = (identifier) => {
        setShowDeleteConfirm(true);
        setCurrentItem({ identifier });
    };

    const updateItem = async () => {
        try {
            await axios.patch(`http://localhost:3003/api/${selected}/${currentItem.identifier}`, currentItem);
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Error updating order:', error);
        }
    };

    const deleteItem = async () => {
        try {
            await axios.delete(`http://localhost:3003/api/${selected}/${currentItem.identifier}`);
            setShowDeleteConfirm(false);
            fetchData(selected);
        } catch (error) {
            console.error('Error deleting order:', error);
        }
    };

    const handleAssignment = (testItemId) => {
        setCurrentItem({ testItemId }); // 假设我们需要订单号来处理分配
        setShowAssignmentModal(true);
    };

    const handleCheck = (testItemId) => {
        setCurrentItem({ testItemId }); // 假设我们需要订单号来处理分配
        setShowCheckModal(true);
    };

    const submitAssignment = useCallback(async () => {
        try {
            const payload = { testItemId: currentItem.testItemId, assignmentInfo };
            const response = await axios.post(`http://localhost:3003/api/tests/assign`, payload);
            isAssignedToMeRef.current = (assignmentInfo === account); // Update the ref value based on the condition
            setShowAssignmentModal(false);
            //setAssignmentInfo(''); // 清空分配信息
            // 根据 role 和 selected 的值直接调用相应的 fetchData 函数
            if (role === 'employee' && selected === 'handleTests') {
                fetchDataForEmployee(account); // 重新获取该员工分配的测试数据
            } else if ((role === 'supervisor' || role === 'leader') && selected === 'handleTests') {
                fetchDataForSupervisor(departmentID)
            }
            else {
                fetchData('tests'); // 对于非 handleTests 的情况，根据 selected 重新获取数据
            }

            if (response.data.success) {
                setShowSuccessToast(true); // 显示成功的Toast
                setTimeout(() => setShowSuccessToast(false), 3000); // 3秒后自动隐藏Toast
            } else {
                setAlertMessage(response.data.message); // 设置从后端接收到的错误消息
                setShowAlert(true);
            }
        } catch (error) {
            console.error('Error submitting assignment:', error);
            setError('Failed to fetch data'); // 更新错误状态
            setAlertMessage('该项目已分配给指定成员，请勿重复分配！');
            setShowAlert(true);
            setTimeout(() => setError(''), 3000); // 3秒后清除错误消息
        }
    }, [currentItem,
        account,
        role,
        assignmentInfo,
        selected,
        fetchData,
        setError,
        fetchDataForEmployee,
        departmentID,
        fetchDataForSupervisor,

    ]);

    // 转办
    const handleReassignment = async (testItemId) => {
        const newAccount = prompt("请输入想要转办的人员工号/账号:");
        if (newAccount && newAccount !== '') {
            try {
                await axios.post('http://localhost:3003/api/tests/reassign', { testItemId, newAccount });
                // 根据 role 和 selected 的值直接调用相应的 fetchData 函数
                if (role === 'employee' && selected === 'handleTests') {
                    fetchDataForEmployee(account); // 重新获取该员工分配的测试数据
                } else {
                    fetchData(selected); // 对于非 handleTests 的情况，根据 selected 重新获取数据
                }
                setShowSuccessToast(true); // Show success message
                setTimeout(() => setShowSuccessToast(false), 3000);
            } catch (error) {
                console.error('Error reassigning test item:', error);
                setError('Failed to reassign test item');
                setTimeout(() => setError(''), 3000);
            }
        }
    };


    //定义打开和关闭 完成Modal 的函数 
    const handleOpenFinishModal = (item) => {
        // 可以根据需要预填充已知数据
        setFinishData({
            test_item_id: item.test_item_id, // 保存当前项目ID以便提交时使用
            machine_hours: '',
            work_hours: '',
            operator: account,
            equipment_id: ''
        });
        setShowFinishModal(true);
    };

    const handleCloseFinishModal = () => {
        setShowFinishModal(false);
    };

    //完成按钮
    const handleFinishTest = async () => {
        const { test_item_id, machine_hours, work_hours, operator, equipment_id } = finishData;
        try {
            await axios.post('http://localhost:3003/api/tests/update-status', {
                testId: test_item_id,
                status: 2,  // 标记为已检测
                machine_hours,
                work_hours,
                operator,
                equipment_id
            });
            setShowFinishModal(false); // 成功后关闭 Modal
            setShowSuccessToast(true); // 显示成功提示
            setTimeout(() => setShowSuccessToast(false), 3000);
            // 根据 role 和 selected 的值直接调用相应的 fetchData 函数
            if ((role === 'employee' || role === 'supervisor')&& selected === 'handleTests') {
                fetchDataForEmployee(account); // 重新获取该员工分配的测试数据
            } else {
                fetchData(selected); // 对于非 handleTests 的情况，根据 selected 重新获取数据
            }
        } catch (error) {
            console.error('Error finishing test:', error);
            setError('Failed to complete test'); // 更新错误状态
            setTimeout(() => setError(''), 3000); // 3秒后清除错误消息
        }
    };


    // 在ContentArea.js或相应的组件中
    const handleQuote = async (testItemId) => {
        const newPrice = prompt("请输入价格:");
        if (newPrice && !isNaN(parseFloat(newPrice))) {
            try {
                const response = await axios.patch(`http://localhost:3003/api/tests/${testItemId}/price`, { listedPrice: newPrice });
                console.log(response.data.message);
                fetchDataForSupervisor(departmentID); // 重新获取数据以更新UI
            } catch (error) {
                console.error('Error updating price:', error);
            }
        } else {
            alert("请输入有效的价格");
        }
    };

    //审批方法
    const submitCheck = (action) => {
        const status = action === 'approve' ? 3 : 4; // 3 for approve, 4 for reject
        const payload = {
            testItemId: currentItem.testItemId,
            status: status,
            checkNote: checkNote,
        };
        updateTestStatus(payload);
    };

    const updateTestStatus = async (payload) => {
        try {
            await axios.post(`http://localhost:3003/api/tests/update-check`, payload);
            setShowCheckModal(false); // Close the modal after submission
            fetchDataForSupervisor(departmentID);
            setShowSuccessToast(true); // Optionally show a success message
            setTimeout(() => setShowSuccessToast(false), 3000);
        } catch (error) {
            console.error('Error updating test status:', error);
            setError('Failed to update test status');
            setTimeout(() => setError(''), 3000);
        }
    };

    const renderTable = () => {
        let headers = [];
        let rows = [];
        if (role === 'employee' && selected === 'handleTests') {
            // 为员工定制的视图逻辑
            headers = ["ID", "样品原号", "分配给我的检测项目", "机时", "工时", "设备名称", "状态", "操作"];
            rows = data.map((item, index) => (
                <tr key={index}>
                    <td>{item.test_item_id}</td>
                    <td>{item.original_no}</td>
                    <td>{item.test_item}</td>
                    <td>{item.machine_hours}</td>
                    <td>{item.work_hours}</td>
                    <td>{item.equipment_id}</td>
                    <td>{statusLabels[item.status]}</td>
                    <td>
                        <Button onClick={() => handleOpenFinishModal(item)}>完成</Button>
                        {/* 只有当状态不是'2'（已检测）时，才显示转办按钮 */}
                        {(item.status === '0' || item.status === '1') && (
                            <Button onClick={() => handleReassignment(item.test_item_id)}>转办</Button>
                        )}
                    </td>
                </tr>
            ));
            return { headers, rows };
        } else if (role === 'supervisor' && selected === 'handleTests') {

            // 为员工定制的视图逻辑
            headers = ["ID", "样品原号", "检测项目", "机时", "工时", "设备名称", "标准价格", "状态", "审批意见", "操作"];
            rows = data.map((item, index) => (

                <tr key={index}>
                    <td>{item.test_item_id}</td>
                    <td>{item.original_no}</td>
                    <td>{item.test_item}</td>
                    <td>{item.machine_hours}</td>
                    <td>{item.work_hours}</td>
                    <td>{item.equipment_id}</td>
                    <td>{item.listed_price}</td>
                    <td>{statusLabels[item.status]}</td>
                    <td>{item.check_note}</td>

                    <td>
                        {(item.status === '1' && isAssignedToMeRef.current) && (
                            <Button onClick={() => handleOpenFinishModal(item)}>完成</Button>
                        )}
                        {item.status === '1' && role === 'supervisor' && (
                            <Button onClick={() => handleAssignment(item.test_item_id)}>指派</Button>
                        )}
                        {item.status !== '3' && (
                            <Button onClick={() => handleQuote(item.test_item_id)}>确定报价</Button>
                        )}
                    </td>
                </tr>
            ));
            return { headers, rows };
        } else if (role === 'leader' && selected === 'handleTests') {
            // 为员工定制的视图逻辑
            headers = ["ID", "样品原号", "检测项目", "机时", "工时", "设备名称", "标准价格", "优惠价格", "状态", "审批意见", "操作"];
            rows = data.map((item, index) => (
                <tr key={index}>
                    <td>{item.test_item_id}</td>
                    <td>{item.original_no}</td>
                    <td>{item.test_item}</td>
                    <td>{item.machine_hours}</td>
                    <td>{item.work_hours}</td>
                    <td>{item.equipment_id}</td>
                    <td>{item.listed_price}</td>
                    <td>{item.diescounted_price}</td>
                    <td>{statusLabels[item.status]}</td>
                    <td>{item.check_note}</td>

                    <td>
                        {/* 只有当状态不是'1'（已检测）时，才显示分配按钮 */}
                        {item.status === '0' && (
                            <Button onClick={() => handleAssignment(item.test_item_id)}>分配</Button>
                        )}
                        {/* 当状态是已检测待审核，且标价写入时，才显示审核按钮 */}
                        {item.status === '2' && item.listed_price && (
                            <Button onClick={() => handleCheck(item.test_item_id)}>审核</Button>
                        )}
                    </td>
                </tr>
            ));
            return { headers, rows };
        }
        else {
            // 默认视图

            switch (selected) {
                case 'getCommission':
                    headers = ["委托单号", "委托单位", "联系人", "联系电话", "联系人邮箱", "付款人", "付款人电话", "地址", "检测项目", "材料类型", "样品", "服务加急", "备注", "操作"];
                    rows = data.map((item, index) => (
                        <tr key={index}>
                            <td>{item.order_num}</td>
                            <td>{item.customer_name}</td>
                            <td>{item.contact_name}</td>
                            <td>{item.contact_phone_num}</td>
                            <td>{item.contact_email}</td>
                            <td>{item.payer_contact_name}</td>
                            <td>{item.payer_contact_phone_num}</td>
                            <td>{item.payer_address}</td>
                            <td>{item.test_item}</td>
                            <td>{item.material}</td>
                            <td>{item.size}</td>
                            <td>{serviceTypeLabels[item.service_type]}</td>
                            <td>{item.note}</td>
                            <td>
                                <Button onClick={() => handleEdit(item)}>修改</Button>
                                <Button onClick={() => handleDelete(item.order_num)}>删除</Button>
                            </td>
                        </tr>
                    ));
                    break;
                case 'getSamples':
                    headers = ["样品名称", "材料", "货号", "材料规范", "样品处置", "材料类型", "订单编号", "操作"];
                    rows = data.map((item, index) => (
                        <tr key={index}>
                            <td>{item.sample_name}</td>
                            <td>{item.material}</td>
                            <td>{item.product_no}</td>
                            <td>{item.material_spec}</td>
                            <td>{item.sample_solution_type}</td>
                            <td>{item.sample_type}</td>
                            <td>{item.order_num}</td>
                            <td>
                                <Button onClick={() => handleEdit(item)}>修改</Button>
                                <Button onClick={() => handleDelete(item.order_num)}>删除</Button>
                            </td>
                        </tr>
                    ));
                    break;
                case 'getTests':
                    headers = ["ID", "样品原号", "检测项目", "方法", "委托单号", "机时", "工时", "设备名称", "状态", "审批意见", "操作"];
                    rows = data.map((item, index) => (
                        <tr key={index}>
                            <td>{item.test_item_id}</td>
                            <td>{item.original_no}</td>
                            <td>{item.test_item}</td>
                            <td>{item.test_method}</td>
                            <td>{item.order_num}</td>
                            <td>{item.machine_hours}</td>
                            <td>{item.work_hours}</td>
                            <td>{item.equipment_id}</td>
                            <td>{statusLabels[item.status]}</td>
                            <td>{item.check_note}</td>

                            <td>
                                {/* 当状态是待检测时，显示分配按钮 */}
                                {item.status === '0' && (
                                    <Button onClick={() => handleAssignment(item.test_item_id)}>分配</Button>
                                )}
                                <Button onClick={() => handleEdit(item)}>修改</Button>
                                <Button onClick={() => handleDelete(item.order_num)}>删除</Button>
                            </td>
                        </tr>
                    ));
                    break;
                default:
                    headers = ["No data available"];
                    rows = <tr><td colSpan={headers.length}>No data selected or available</td></tr>;
                    break;
            }
            return { headers, rows };
        }

    };

    const { headers, rows } = renderTable();

    return (
        <div>
            <nav>
                <span>{account},欢迎访问集萃检测管理系统</span>
                <button onClick={ onLogout }>登出</button>
            </nav>
            {selected && (
                <div>
                    <h2>{selected === 'getCommission' ? '详细信息' : selected === 'getSamples' ? '样品管理' : '检测管理'}</h2>
                    <span>请选择状态进行筛选：</span>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="">全部状态</option>
                        <option value="0">待分配</option>
                        <option value="1">已分配待检测</option>
                        <option value="2">已检测待审批</option>
                        <option value="3">审批通过</option>
                        <option value="4">审批失败</option>

                    </select>
                    <div class='content'>
                        <table>
                            <thead>
                                <tr>{headers.map(header => <th key={header}>{header}</th>)}</tr>
                            </thead>
                            <tbody>
                                {rows}

                            </tbody>
                        </table>
                    </div>



                </div>
            )}

            {/* 分配成功的Toast */}
            <Toast onClose={() => setShowSuccessToast(false)} show={showSuccessToast} delay={3000} autohide position="top-end" style={{ position: 'absolute', top: 20, right: 20 }}>
                <Toast.Header>
                    <strong className="me-auto">成功</strong>
                    <small>刚刚</small>
                </Toast.Header>
                <Toast.Body>操作成功！</Toast.Body>
            </Toast>
            {/* Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Item</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group controlId="formCustomerName">
                            <Form.Label>Customer Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.customer_name || ''}
                                onChange={(e) => setCurrentItem({ ...currentItem, customer_name: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group controlId="formContactName">
                            <Form.Label>Contact Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.contact_name || ''}
                                onChange={(e) => setCurrentItem({ ...currentItem, contact_name: e.target.value })}
                            />
                        </Form.Group>
                        {/* Repeat for other fields */}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>关闭</Button>
                    <Button variant="primary" onClick={updateItem}>保存更改</Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Confirmation */}
            <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to delete this item?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                    <Button variant="danger" onClick={deleteItem}>Delete</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showAssignmentModal} onHide={() => setShowAssignmentModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>检测人员分配</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group controlId="formAssignmentInfo">
                            <Form.Label>将检测分配给：</Form.Label>
                            {/* <Form.Control
                                type="text"
                                placeholder="请输入检测人员工号"
                                value={assignmentInfo}
                                onChange={(e) => setAssignmentInfo(e.target.value)}
                            /> */}

                            <Form.Control
                                as="select"
                                value={assignmentInfo}
                                onChange={(e) => setAssignmentInfo(e.target.value)}
                            >
                                {assignableUsers.map(user => (
                                    <option key={user.account} value={user.account}>
                                        {user.name} ({user.account})
                                    </option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAssignmentModal(false)}>取消</Button>
                    <Button variant="primary" onClick={submitAssignment}>分配
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* 审批按钮 */}
            <Modal show={showCheckModal} onHide={() => setShowCheckModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>审批页面</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group controlId="formAssignmentInfo">
                            <Form.Label>请审批：</Form.Label>

                            <Form.Control
                                type="text"
                                placeholder="请写审批意见"
                                onChange={(e) => setCheckNote(e.target.value)}>
                            </Form.Control>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCheckModal(false)}>取消</Button>
                    <Button variant="danger" onClick={() => submitCheck('reject')}>拒绝</Button>
                    <Button variant="success" onClick={() => submitCheck('approve')}>通过</Button>

                </Modal.Footer>
            </Modal>


            {/* 完成按钮modal */}
            <Modal show={showFinishModal} onHide={handleCloseFinishModal}>
                <Modal.Header closeButton>
                    <Modal.Title>完成检测</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>机时</Form.Label>
                            <Form.Control
                                type="number"
                                value={finishData.machine_hours}
                                onChange={e => setFinishData({ ...finishData, machine_hours: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>工时</Form.Label>
                            <Form.Control
                                type="number"
                                value={finishData.work_hours}
                                onChange={e => setFinishData({ ...finishData, work_hours: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>操作员</Form.Label>
                            <Form.Control
                                type="text"
                                value={finishData.operator}
                                disabled // 操作员默认为登录账户，禁止编辑
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>设备名称</Form.Label>
                            <Form.Control
                                type="text"
                                value={finishData.equipment_id}
                                onChange={e => setFinishData({ ...finishData, equipment_id: e.target.value })}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseFinishModal}>取消</Button>
                    <Button variant="primary" onClick={handleFinishTest}>保存</Button>
                </Modal.Footer>
            </Modal>



            <Modal show={showAlert} onHide={() => setShowAlert(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>分配状态</Modal.Title>
                </Modal.Header>
                <Modal.Body>{alertMessage}</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAlert(false)}>关闭</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ContentArea;
