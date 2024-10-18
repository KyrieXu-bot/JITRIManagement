import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Modal, Button, Form, Toast } from 'react-bootstrap'; // 使用React Bootstrap进行模态弹窗和表单处理
import '../css/ContentArea.css'
import '../css/Pagination.css';
import config from '../config/config'; // 确保路径正确
import Pagination from 'react-js-pagination';

import DataStatistics from '../components/DataStatistics';
import EquipmentTimeline from '../components/EquipmentTimeline';

const ContentArea = ({ departmentID, account, selected, role, groupId, name, onLogout }) => {

    const [data, setData] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const [currentItem, setCurrentItem] = useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false); // 控制Toast显示的状态
    const [showFailureToast, setShowFailureToast] = useState(false); // 控制Toast显示的状态

    const [, setError] = useState('');
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [assignableUsers, setAssignableUsers] = useState([]);
    const [checkNote, setCheckNote] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const isAssignedToMeRef = useRef(false); // Use useRef to persist state across renders
    const [equipments, setEquipments] = useState([]);
    const [employeeStats, setEmployeeStats] = useState([]);
    const [equipmentStats, setEquipmentStats] = useState([]);
    const [equipmentTimeline, setEquipmentTimeline] = useState([]);
    const [filterEmployee, setFilterEmployee] = useState('');

    const [activePage, setActivePage] = useState(1);
    const itemsCountPerPage = 10;
    const totalItemsCount = data.length;

    //分页
    const indexOfLastItem = activePage * itemsCountPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsCountPerPage;
    const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);

    //按月份筛选
    const [months, setMonths] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState('');

    //领导点击分配时候的数据
    const [assignmentData, setAssignmentData] = useState({
        equipment_id: '',
        start_time: '',
        end_time: ''
    });
    //员工点击完成时候的数据
    const [finishData, setFinishData] = useState({
        machine_hours: '',
        work_hours: '',
        operator: account, // 默认为当前登录的账户
        equipment_id: '',

    });
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [showReassignmentModal, setShowReassignmentModal] = useState(false);

    const [showCheckModal, setShowCheckModal] = useState(false);
    const [assignmentInfo, setAssignmentInfo] = useState('');

    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedDetails, setSelectedDetails] = useState({});

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


    // 静态部门数据
    const departments = [
        { department_id: 1, department_name: '显微组织表征实验室' },
        { department_id: 2, department_name: '物化性能测试实验室' },
        { department_id: 3, department_name: '力学性能测试实验室' }
    ];


    const fetchData = useCallback(async (endpoint) => {
        try {
            const params = new URLSearchParams();
            if (filterStatus) {
                params.append('status', filterStatus);
            }
            if (selectedMonth) {
                params.append('month', selectedMonth);  // 添加月份到请求参数
            }
            if (filterEmployee) {
                params.append('employeeName', filterEmployee); // 添加员工名称到请求参数
            }
            const response = await axios.get(`${config.API_BASE_URL}/api/${endpoint}?${params}`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to fetch data'); // 更新错误状态
            setTimeout(() => setError(''), 3000); // 3秒后清除错误消息
        }
    }, [setError, filterStatus, selectedMonth, filterEmployee]);

    //拉取工程师显示数据
    const fetchDataForEmployee = useCallback(async (account) => {
        try {
            const params = new URLSearchParams();
            if (filterStatus) {
                params.append('status', filterStatus);
            }
            if (selectedMonth) {
                params.append('month', selectedMonth);  // 添加月份到请求参数
            }
            const response = await axios.get(`${config.API_BASE_URL}/api/tests/assignments/${account}?${params}`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching assigned tests:', error);
        }
    }, [filterStatus, selectedMonth]);

    //拉取组长显示数据
    const fetchDataForSupervisor = useCallback(async (departmentId) => {
        try {
            const params = new URLSearchParams();
            if (filterStatus) params.append('status', filterStatus);
            if (departmentId) params.append('departmentId', departmentId);  // 添加部门ID到请求参数
            if (selectedMonth) {
                params.append('month', selectedMonth);  // 添加月份到请求参数
            }
            if (role === 'supervisor') {
                params.append('account', account)

            }
            const response = await axios.get(`${config.API_BASE_URL}/api/tests?${params}`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching data for supervisor:', error);
            setError('Failed to fetch data');
            setTimeout(() => setError(''), 3000);
        }
    }, [role, account, filterStatus, setError, selectedMonth]);

    // 拉取可分配的用户列表
    const fetchAssignableUsers = useCallback(async () => {
        try {
            let endpoint = '';
            if (role === 'leader') {
                endpoint = `/api/users/supervisors?departmentId=${departmentID}`;
            } else if (role === 'supervisor') {
                endpoint = `/api/users/employees?departmentId=${departmentID}`;
            }
            const response = await axios.get(`${config.API_BASE_URL}${endpoint}`);
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
            const response = await axios.get(`${config.API_BASE_URL}/api/users/group/${groupId}`);
            const users = response.data;
            setAssignableUsers(users);
            if (users.length > 0) {
                setAssignmentInfo(users[0].account); // 默认选中第一个
            }
        } catch (error) {
            console.error('Error fetching group members:', error);
        }
    }, []);


    const fetchEquipments = useCallback(async (departmentID) => {
        try {
            const response = await axios.get(`${config.API_BASE_URL}/api/tests/equipments?departmentId=${departmentID}`);
            const equipments = response.data;
            setEquipments(equipments);
            if (equipments.length > 0) {
                setAssignmentInfo(equipments[0].name); // 默认选中第一个
            }
        } catch (error) {
            console.error('Error fetching equipments:', error);
        }
    }, []);

    // 获取数据图
    const fetchStatistics = useCallback(async () => {
        try {
            const response = await axios.get(`${config.API_BASE_URL}/api/charts/statistics?departmentId=${departmentID}`);
            const { employeeStats, equipmentStats } = response.data;
            const formattedEmployee = employeeStats.map(item => ({
                name: item.name,
                //value: parseFloat(item.total_machine_hours),  // Assuming you want to visualize machine hours
                total_machine_hours: parseFloat(item.total_machine_hours),
                total_work_hours: parseFloat(item.total_work_hours),
                total_samples: parseFloat(item.total_samples),
                total_listed_price: parseFloat(item.total_listed_price)
            }));

            const formattedEquipment = equipmentStats.map(item => ({
                equipment_name: item.equipment_name,
                //value: parseFloat(item.total_machine_hours),  // Assuming you want to visualize machine hours
                total_machine_hours: parseFloat(item.total_machine_hours),
            }));
            setEmployeeStats(formattedEmployee);
            setEquipmentStats(formattedEquipment);

        } catch (error) {
            console.error('Error fetching statistics data:', error);
        }
    }, [departmentID])

    // 获取设备时间线
    const fetchTimeline = useCallback(async () => {
        try {
            const response = await axios.get(`${config.API_BASE_URL}/api/charts/timeline?departmentId=${departmentID}`);
            const equipmentData = response.data;
            console.log("result", response.data)
            // 检查并格式化任务数据
            const tasks = equipmentData.map((equipment, index) => {
                // 验证 start_time 和 end_time 是否有效
                const start = equipment.start_time ? new Date(equipment.start_time) : null;
                const end = equipment.end_time ? new Date(equipment.end_time) : null;

                // 检查 start 和 end 是否为有效的 Date 对象
                if (!start || isNaN(start.getTime()) || !end || isNaN(end.getTime())) {
                    console.error(`Invalid date for equipment: ${equipment.equipment_name}`);
                    return null; // 跳过无效的任务
                }

                return {
                    id: index.toString(),
                    name: equipment.equipment_name,
                    start,
                    end,
                    progress: 100,
                    type: 'task',
                    dependencies: '' // 这里可以添加任务依赖关系


                };
            }).filter(task => task !== null); // 过滤掉无效任务
            setEquipmentTimeline(tasks); // 将设备时间线数据保存在 equipmentTimeline
        } catch (error) {
            console.error('Error fetching statistics data:', error);
        }
    }, [departmentID])


    const fetchMonths = useCallback(async () => {
        try {
            const response = await axios.get(`${config.API_BASE_URL}/api/months`);
            setMonths(response.data);
        } catch (error) {
            console.error('Error fetching months:', error);
        }
    }, []);

    useEffect(() => {
        if ((role === 'employee' || role === 'sales') && selected === 'handleTests') {
            fetchDataForEmployee(account);
        } else if (role === 'supervisor' || role === 'leader') {
            if (selected === 'dataStatistics') {
                fetchStatistics()
            } else if (selected === 'timeline') {
                fetchTimeline()
            } else if (selected === 'getCommission') {
                fetchData('orders');
            } else {
                fetchDataForSupervisor(departmentID);
            }
        } else {
            // 管理员情况
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
        } else if (role === 'supervisor' || role === 'employee') {
            fetchGroupUsers(groupId)
        }
        fetchEquipments(departmentID);
        fetchMonths();
        const savedPage = localStorage.getItem('currentPage');
        if (savedPage) {
            setActivePage(parseInt(savedPage, 10)); // 从localStorage中读取页码，并确保转换为整数
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
        fetchGroupUsers,
        fetchEquipments,
        fetchStatistics,
        fetchTimeline,
        fetchMonths
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
            if (selected === 'getTests') {
                const response = await axios.patch(`${config.API_BASE_URL}/api/tests/${currentItem.test_item_id}`, currentItem);
                if (response.data.success) {
                    // 成功提示
                    setShowModal(false);
                    setShowSuccessToast(true); // 显示成功的Toast
                    setTimeout(() => setShowSuccessToast(false), 3000); // 3秒后自动隐藏Toast                   
                    fetchData(selected);

                } else {
                    setShowFailureToast(true)
                }
            }
        } catch (error) {
            console.error('Error updating test items:', error);
        }
    };

    const deleteItem = async () => {
        try {
            await axios.delete(`${config.API_BASE_URL}/api/${selected}/${currentItem.identifier}`);
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


    const handleReassignment = (testItemId) => {
        setCurrentItem({ testItemId }); // 假设我们需要订单号来处理分配
        setShowReassignmentModal(true);
    };


    const handleCheck = (testItemId) => {
        setCurrentItem({ testItemId }); // 假设我们需要订单号来处理分配
        setShowCheckModal(true);
    };

    const submitAssignment = useCallback(async () => {
        try {
            const payload = {
                testItemId: currentItem.testItemId,
                assignmentInfo,
                equipment_id: assignmentData.equipment_id,
                start_time: assignmentData.start_time,
                end_time: assignmentData.end_time
            };
            const response = await axios.post(`${config.API_BASE_URL}/api/tests/assign`, payload);
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
        assignmentData,
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
    const submitReassignment = async () => {
        try {
            await axios.post(`${config.API_BASE_URL}/api/tests/reassign`, { testItemId: currentItem.testItemId, account, assignmentInfo });

            setShowReassignmentModal(false);

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
    };


    //定义打开和关闭 完成Modal 的函数 
    const handleOpenFinishModal = (item) => {
        // 可以根据需要预填充已知数据
        setFinishData({
            test_item_id: item.test_item_id, // 保存当前项目ID以便提交时使用
            machine_hours: '',
            work_hours: '',
            operator: account,
            equipment_id: item.equipment_id,
            equipment_name: item.equipment_name,
            model: item.model
        });
        setShowFinishModal(true);
    };

    const handleCloseFinishModal = () => {
        setShowFinishModal(false);
    };

    //完成按钮
    const handleFinishTest = async () => {
        const { test_item_id, machine_hours, work_hours, operator, equipment_id } = finishData;
        if (!machine_hours) {
            alert("请填写机时！")
            return;
        }
        if (!work_hours) {
            alert("请填写工时！")
            return;
        }
        if (!equipment_id) {
            alert("请选择设备！")
            return;
        }
        try {
            await axios.post(`${config.API_BASE_URL}/api/tests/update-status`, {
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
            if ((role === 'employee' || role === 'supervisor') && selected === 'handleTests') {
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


    // 查看事件处理函数
    const handleShowDetails = (item) => {
        setSelectedDetails(item);
        setShowDetailsModal(true);
    };


    // 设置标价
    const handleQuote = async (testItemId) => {
        const newPrice = prompt("请输入标准价格:");
        if (newPrice && !isNaN(parseFloat(newPrice))) {
            try {
                const response = await axios.patch(`${config.API_BASE_URL}/api/tests/${testItemId}/price`, { listedPrice: newPrice });
                console.log(response.data.message);
                fetchDataForSupervisor(departmentID); // 重新获取数据以更新UI
            } catch (error) {
                console.error('Error updating price:', error);
            }
        } else {
            alert("请输入有效的价格");
        }
    };


    // 设置优惠价
    const handleDiscount = async (testItemId) => {
        const newPrice = prompt("请输入优惠价格:");
        if (newPrice && !isNaN(parseFloat(newPrice))) {
            try {
                await axios.patch(`${config.API_BASE_URL}/api/tests/${testItemId}/discount`, { discountedPrice: newPrice });
                fetchDataForEmployee(account); // 重新获取数据以更新UI
            } catch (error) {
                console.error('Error updating price:', error);
            }
        } else {
            alert("请输入有效的价格");
        }
    };
    //审批方法
    const submitCheck = (action) => {
        if (action === 'approve' && !window.confirm('请再次确认此操作。点击通过后不可修改！')) {
            return;  // 用户点击取消后，不执行任何操作
        }
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
            await axios.post(`${config.API_BASE_URL}/api/tests/update-check`, payload);
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

    //设置分页
    const handlePageChange = (pageNumber) => {
        setActivePage(pageNumber);
        localStorage.setItem('currentPage', pageNumber); // 保存当前页码到localStorage
    };


    //计算截止日期
    const calculateRemainingDays = (deadlineDate) => {
        const today = new Date();
        const deadline = new Date(deadlineDate);
        const timeDiff = deadline - today;
        return Math.ceil(timeDiff / (1000 * 3600 * 24)); // 将毫秒转换为天数
    };

    const renderDeadlineStatus = (deadlineDays, createDate) => {
        if (!deadlineDays || !createDate) {
            // 如果没有提供截止日期或创建日期，不显示任何内容
            return null;
        }
        const deadlineDate = new Date(new Date(createDate).getTime() + deadlineDays * 24 * 60 * 60 * 1000);
        const daysLeft = calculateRemainingDays(deadlineDate);

        let displayText;
        let style;

        if (daysLeft < 0) {
            // 已逾期
            style = {
                color: 'red', // 逾期字体为红色
                fontWeight: 'bold' // 逾期字体加粗
            };
            displayText = `已逾期 ${Math.abs(daysLeft)} 天`; // 使用 Math.abs 来取得逾期的绝对天数
        } else {
            // 未逾期
            style = {
                color: daysLeft < 5 ? 'red' : 'black', // 少于3天字体为红色
                fontWeight: daysLeft < 5 ? 'bold' : 'normal' // 少于3天字体加粗
            };
            displayText = `剩余 ${daysLeft} 天`;
        }

        return <span style={style}>{displayText}</span>;
    };


    // 将 ISO 日期格式转换为 datetime-local 格式
    const formatDateToLocal = (isoDate) => {
        if (!isoDate) return '';
        const date = new Date(isoDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从 0 开始，所以加 1
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };


    const renderTable = () => {
        let headers = [];
        let rows = [];

        if (role === 'employee' && selected === 'handleTests') {
            // 为员工定制的视图逻辑
            headers = ["委托单号", "样品原号", "分配给我的检测项目", "机时", "工时", "状态", "审批意见", "创建日期", "剩余天数", "操作"];
            rows = currentItems.map((item, index) => (
                <tr key={index}>
                    <td>{item.order_num}</td>
                    <td>{item.original_no}</td>
                    <td>{item.test_item}</td>
                    <td>{item.machine_hours}</td>
                    <td>{item.work_hours}</td>
                    <td>{statusLabels[item.status]}</td>

                    <td>{item.check_note}</td>
                    <td>{item.create_time ? new Date(item.create_time).toISOString().split('T')[0] : ''}</td>
                    <td>
                        {(item.status === '0' || item.status === '1') ? renderDeadlineStatus(item.deadline, item.create_time) : ''}
                    </td>
                    <td>
                        <Button variant="info" onClick={() => handleShowDetails(item)}>详情</Button>
                        {(item.status !== '3') && (
                            <Button onClick={() => handleOpenFinishModal(item)}>完成</Button>
                        )}
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
            headers = ["委托单号", "样品原号", "检测项目", "机时", "工时", "标准价格", "优惠价格", "状态", "人员", "审批意见", "创建时间", "剩余天数", "操作"];
            rows = currentItems.map((item, index) => (

                <tr key={index}>
                    <td>{item.order_num}</td>
                    <td>{item.original_no}</td>
                    <td>{item.test_item}</td>
                    <td>{item.machine_hours}</td>
                    <td>{item.work_hours}</td>
                    <td>{item.listed_price}</td>
                    <td>{item.discounted_price}</td>
                    <td>{statusLabels[item.status]}</td>
                    <td>
                        {item.assigned_accounts ? `${item.assigned_accounts}` : '暂未分配'}
                    </td>
                    <td>{item.check_note}</td>
                    <td>{item.create_time ? new Date(item.create_time).toISOString().split('T')[0] : ''}</td>
                    <td>
                        {(item.status === '0' || item.status === '1') ? renderDeadlineStatus(item.deadline, item.create_time) : ''}
                    </td>

                    <td>
                        <Button variant="info" onClick={() => handleShowDetails(item)}>详情</Button>
                        {(item.status !== '3') && (
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
            headers = ["委托单号", "样品原号", "检测项目", "机时", "工时", "标准价格", "优惠价格", "状态", "人员", "审批意见", "创建时间", "剩余天数", "操作"];
            rows = currentItems.map((item, index) => (
                <tr key={index}>
                    <td>{item.order_num}</td>
                    <td>{item.original_no}</td>
                    <td>{item.test_item}</td>
                    <td>{item.machine_hours}</td>
                    <td>{item.work_hours}</td>
                    <td>{item.listed_price}</td>
                    <td>{item.discounted_price}</td>
                    <td>{statusLabels[item.status]}</td>
                    <td>
                        {item.assigned_accounts ? `${item.assigned_accounts}` : '暂未分配'}
                    </td>

                    <td>{item.check_note}</td>
                    <td>{item.create_time ? new Date(item.create_time).toISOString().split('T')[0] : ''}</td>
                    <td>
                        {(item.status === '0' || item.status === '1') ? renderDeadlineStatus(item.deadline, item.create_time) : ''}

                    </td>

                    <td>
                        <Button variant="info" onClick={() => handleShowDetails(item)}>详情</Button>
                        {/* 只有当状态不是'1'（已检测）时，才显示分配按钮 */}
                        {item.status === '0' && (
                            <Button onClick={() => handleAssignment(item.test_item_id)}>分配</Button>
                        )}
                        {/* 当状态是已检测待审核，且标价写入时，才显示审核按钮 */}
                        {(item.status === '2' || item.status === '4') && item.listed_price && (
                            <Button variant="warning" onClick={() => handleCheck(item.test_item_id)}>审核</Button>
                        )}
                    </td>
                </tr>
            ));
            return { headers, rows };
        } else if (role === 'sales' && selected === 'handleTests') {
            // 为员工定制的视图逻辑
            headers = ["委托单号", "样品原号", "检测项目", "机时", "工时", "标准价格", "优惠价格", "状态", "人员", "审批意见", "创建时间", "操作"];
            rows = currentItems.map((item, index) => (
                <tr key={index}>
                    <td>{item.order_num}</td>
                    <td>{item.original_no}</td>
                    <td>{item.test_item}</td>
                    <td>{item.machine_hours}</td>
                    <td>{item.work_hours}</td>
                    <td>{item.listed_price}</td>
                    <td>{item.discounted_price}</td>
                    <td>{statusLabels[item.status]}</td>
                    <td>
                        {item.assigned_accounts ? `${item.assigned_accounts}` : '暂未分配'}
                    </td>

                    <td>{item.check_note}</td>
                    <td>{item.create_time ? new Date(item.create_time).toISOString().split('T')[0] : ''}</td>
                    <td>
                        {item.status !== '3' && (
                            <Button onClick={() => handleDiscount(item.test_item_id)}>设置优惠价</Button>
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
                    headers = ["委托单号", "委托单位", "联系人", "联系电话", "联系人邮箱", "付款人", "付款人电话", "地址", "检测项目", "材料类型", "样品", "服务加急", "备注"];
                    rows = currentItems.map((item, index) => (
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
                            {/* <td>
                                <Button onClick={() => handleEdit(item)}>修改</Button>
                                <Button onClick={() => handleDelete(item.order_num)}>删除</Button>
                            </td> */}
                        </tr>
                    ));
                    break;
                case 'getSamples':
                    headers = ["样品名称", "材料", "货号", "材料规范", "样品处置", "材料类型", "订单编号", "操作"];
                    rows = currentItems.map((item, index) => (
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
                    headers = ["委托单号", "样品原号", "检测项目", "方法", "机时", "工时", "状态", "人员", "审批意见", "操作"];
                    rows = currentItems.map((item, index) => (
                        <tr key={index}>
                            <td>{item.order_num}</td>
                            <td>{item.original_no}</td>
                            <td>{item.test_item}</td>
                            <td>{item.test_method}</td>
                            <td>{item.machine_hours}</td>
                            <td>{item.work_hours}</td>
                            <td>{statusLabels[item.status]}</td>
                            <td>{item.assigned_accounts}</td>
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

    const { headers, rows } = renderTable(currentItems);

    return (
        <div>
            <nav>
                <span>{name}({account}),欢迎访问集萃检测管理系统</span>
                <button onClick={onLogout}>登出</button>
            </nav>
            {selected === 'dataStatistics' ? (
                <DataStatistics employeeData={employeeStats} equipmentData={equipmentStats} />
            ) : selected === 'timeline' ? (
                <EquipmentTimeline tasks={equipmentTimeline} /> // 显示设备时间线
            ) : (
                <div>
                    <h2>{selected === 'getCommission' ? '详细信息' : selected === 'getSamples' ? '样品管理' : '检测管理'}</h2>
                    <span>筛选项目状态：</span>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="">全部状态</option>
                        <option value="0">待分配</option>
                        <option value="1">已分配待检测</option>
                        <option value="2">已检测待审批</option>
                        <option value="3">审批通过</option>
                        <option value="4">审批失败</option>

                    </select>&nbsp;&nbsp;&nbsp;
                    <span>筛选月份：</span>
                    <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                        <option value="">选择月份</option>
                        {months.map(({ month }) => (
                            <option key={month} value={month}>{month}</option>
                        ))}
                    </select>&nbsp;&nbsp;&nbsp;
                    <span>筛选人员：</span>
                    <input
                        type="text"
                        value={filterEmployee}
                        onChange={(e) => setFilterEmployee(e.target.value)}
                        placeholder="输入员工名称进行搜索"
                    />
                    <button onClick={() => fetchData('tests')}>查询</button>
                    <Pagination
                        activePage={activePage}
                        itemsCountPerPage={itemsCountPerPage}
                        totalItemsCount={totalItemsCount}
                        pageRangeDisplayed={5}
                        onChange={handlePageChange}
                        innerClass="pagination"
                    />
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

            {/* 失败的Toast */}
            <Toast onClose={() => setShowFailureToast(false)} show={showFailureToast} delay={3000} autohide position="top-end" style={{ position: 'absolute', top: 20, right: 20 }}>
                <Toast.Header>
                    <strong className="me-auto">失败</strong>
                    <small>刚刚</small>
                </Toast.Header>
                <Toast.Body>操作失败</Toast.Body>
            </Toast>



            {/* Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>编辑检测项目信息</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group controlId="formOriginalNo">
                            <Form.Label>样品原号</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.original_no || ''}
                                onChange={(e) => setCurrentItem({ ...currentItem, original_no: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group controlId="formTestItem">
                            <Form.Label>检测项目</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.test_item || ''}
                                onChange={(e) => setCurrentItem({ ...currentItem, test_item: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group controlId="formTestMethod">
                            <Form.Label>检测方法</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.test_method || ''}
                                onChange={(e) => setCurrentItem({ ...currentItem, test_method: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group controlId="formSize">
                            <Form.Label>尺寸</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.size || ''}
                                onChange={(e) => setCurrentItem({ ...currentItem, size: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group controlId="formQuantity">
                            <Form.Label>数量</Form.Label>
                            <Form.Control
                                type="number"
                                value={currentItem.quantity || ''}
                                onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group controlId="formNote">
                            <Form.Label>备注</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.note || ''}
                                onChange={(e) => setCurrentItem({ ...currentItem, note: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group controlId="formStatus">
                            <Form.Label>状态</Form.Label>
                            <Form.Control
                                as="select"
                                value={currentItem.status || ''}
                                onChange={(e) => setCurrentItem({ ...currentItem, status: e.target.value })}
                            >
                                <option value="">选择状态</option>
                                <option value="0">待分配</option>
                                <option value="1">已分配</option>
                                <option value="2">已检测</option>
                                <option value="3">已审批</option>
                                <option value="4">审批失败</option>
                            </Form.Control>
                        </Form.Group>
                        <Form.Group controlId="formMachineHours">
                            <Form.Label>机时</Form.Label>
                            <Form.Control
                                type="number"
                                value={currentItem.machine_hours || ''}
                                onChange={(e) => setCurrentItem({ ...currentItem, machine_hours: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group controlId="formWorkHours">
                            <Form.Label>工时</Form.Label>
                            <Form.Control
                                type="number"
                                value={currentItem.work_hours || ''}
                                onChange={(e) => setCurrentItem({ ...currentItem, work_hours: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group controlId="formListedPrice">
                            <Form.Label>标准价格</Form.Label>
                            <Form.Control
                                type="number"
                                value={currentItem.listed_price || ''}
                                onChange={(e) => setCurrentItem({ ...currentItem, listed_price: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group controlId="formDiscountedPrice">
                            <Form.Label>优惠价格</Form.Label>
                            <Form.Control
                                type="number"
                                value={currentItem.discounted_price || ''}
                                onChange={(e) => setCurrentItem({ ...currentItem, discounted_price: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>设备名称</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.equipment_name || ''}
                                disabled
                            />
                        </Form.Group>
                        <Form.Group controlId="formDepartmentId">
                            <Form.Label>所属部门</Form.Label>
                            <Form.Control
                                as="select"
                                value={currentItem.department_id || ''}
                                onChange={(e) => setCurrentItem({ ...currentItem, department_id: e.target.value })}
                            >
                                {departments.map(dept => (
                                    <option key={dept.department_id} value={dept.department_id}>{dept.department_name}</option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                        <Form.Group controlId="formCheckNote">
                            <Form.Label>审批备注</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.check_note || ''}
                                onChange={(e) => setCurrentItem({ ...currentItem, check_note: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group controlId="formDeadline">
                            <Form.Label>截止日期</Form.Label>
                            <Form.Control
                                type="number"
                                value={currentItem.deadline || ''}
                                onChange={(e) => setCurrentItem({ ...currentItem, deadline: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group controlId="formStartTime">
                            <Form.Label>设备使用开始时间</Form.Label>
                            <Form.Control
                                type="datetime-local"
                                value={formatDateToLocal(currentItem.start_time)}
                                onChange={(e) => setCurrentItem({ ...currentItem, start_time: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group controlId="formEndTime">
                            <Form.Label>设备使用结束时间</Form.Label>
                            <Form.Control
                                type="datetime-local"
                                value={formatDateToLocal(currentItem.start_time)}
                                onChange={(e) => setCurrentItem({ ...currentItem, end_time: e.target.value })}
                            />
                        </Form.Group>
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
                    <Modal.Title>确认删除</Modal.Title>
                </Modal.Header>
                <Modal.Body>你确定要删除这条检测项目吗？</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>取消</Button>
                    <Button variant="danger" onClick={deleteItem}>确认删除</Button>
                </Modal.Footer>
            </Modal>

            {/* 领导分配按钮 */}
            <Modal show={showAssignmentModal} onHide={() => setShowAssignmentModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>检测人员分配</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group controlId="formAssignmentInfo">
                            <Form.Label>将检测分配给：</Form.Label>
                            <Form.Control
                                as="select"
                                value={assignmentInfo}
                                onChange={(e) => setAssignmentInfo(e.target.value)}
                            >
                                <option value="">---选择人员---</option>
                                {assignableUsers.map(user => (

                                    <option key={user.account} value={user.account}>
                                        {user.name} ({user.account})
                                    </option>
                                ))}
                            </Form.Control>
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>设备名称</Form.Label>
                            <Form.Control
                                as="select"
                                value={assignmentData.equipment_id}
                                onChange={e => setAssignmentData({ ...assignmentData, equipment_id: e.target.value })}
                            >
                                <option value="">---选择设备---</option>
                                {equipments.map(equipment => (
                                    <option key={equipment.equipment_id} value={equipment.equipment_id}>
                                        {equipment.equipment_name} ({equipment.model})
                                    </option>
                                ))}
                            </Form.Control>
                        </Form.Group>

                        {/* 设备使用开始时间 */}
                        <Form.Group controlId="formStartTime">
                            <Form.Label>设备使用开始时间</Form.Label>
                            <Form.Control
                                type="datetime-local"
                                value={assignmentData.start_time}
                                onChange={e => setAssignmentData({ ...assignmentData, start_time: e.target.value })}
                            />
                        </Form.Group>

                        {/* 设备使用结束时间 */}
                        <Form.Group controlId="formEndTime">
                            <Form.Label>设备使用结束时间</Form.Label>
                            <Form.Control
                                type="datetime-local"
                                value={assignmentData.end_time}
                                onChange={e => setAssignmentData({ ...assignmentData, end_time: e.target.value })}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAssignmentModal(false)}>取消</Button>
                    <Button variant="primary" onClick={submitAssignment}>分配
                    </Button>
                </Modal.Footer>
            </Modal>



            <Modal show={showReassignmentModal} onHide={() => setShowReassignmentModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>检测人员转办</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group controlId="formAssignmentInfo">
                            <Form.Label>将检测转办给：</Form.Label>
                            <Form.Control
                                as="select"
                                value={assignmentInfo}
                                onChange={(e) => setAssignmentInfo(e.target.value)}
                            >
                                <option value="">---选择人员---</option>
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
                    <Button variant="secondary" onClick={() => setShowReassignmentModal(false)}>取消</Button>
                    <Button variant="primary" onClick={submitReassignment}>转办
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
                        {/* <Form.Group>
                            <Form.Label>设备名称</Form.Label>
                            <Form.Control
                                as="select"
                                value={finishData.equipment_id}
                                onChange={e => setFinishData({ ...finishData, equipment_id: e.target.value })}
                            >
                                <option value="">选择设备</option>
                                {equipments.map(equipment => (
                                    <option key={equipment.equipment_id} value={equipment.equipment_id}>
                                        {equipment.equipment_name} ({equipment.model})
                                    </option>
                                ))}
                            </Form.Control>
                        </Form.Group> */}

                        {/* 设备选择框或已选设备名称 */}
                        <Form.Group controlId="formEquipment">
                            <Form.Label>设备名称</Form.Label>
                            <Form.Control
                                as="select"
                                value={finishData.equipment_id}
                                onChange={(e) => setFinishData({ ...finishData, equipment_id: e.target.value })}
                            >
                                {finishData.equipment_name ? (
                                    <option value={finishData.equipment_id}>{finishData.equipment_name} ({finishData.model})</option>
                                ) : (
                                    <option value="">选择设备</option>
                                )}
                                {equipments.map(equipment => (
                                    <option key={equipment.equipment_id} value={equipment.equipment_id}>
                                        {equipment.equipment_name} ({equipment.model})
                                    </option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseFinishModal}>取消</Button>
                    <Button variant="primary" onClick={handleFinishTest}>保存</Button>
                </Modal.Footer>
            </Modal>

            {/* 查看按钮 */}
            <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>详细信息</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>委托单号：{selectedDetails.order_num}</p>
                    <p>样品原号：{selectedDetails.original_no}</p>
                    <p>检测项目：{selectedDetails.test_item}</p>
                    <p>机时：{selectedDetails.machine_hours}</p>
                    <p>工时：{selectedDetails.work_hours}</p>
                    <p>设备名称：{selectedDetails.equipment_name}({selectedDetails.model})</p>
                    <p>状态：{statusLabels[selectedDetails.status]}</p>
                    <p>审批意见：{selectedDetails.check_note}</p>
                    <p>创建时间：{selectedDetails.create_time}</p>
                    <p>剩余天数：{renderDeadlineStatus(selectedDetails.deadline, selectedDetails.create_time)}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>关闭</Button>
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
