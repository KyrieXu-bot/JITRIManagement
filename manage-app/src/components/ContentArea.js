import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Modal, Button, Form, Toast, Row, Col } from 'react-bootstrap'; // 使用React Bootstrap进行模态弹窗和表单处理
import '../css/ContentArea.css'
import '../css/Pagination.css';
import config from '../config/config'; // 确保路径正确
import Pagination from 'react-js-pagination';
import DataStatistics from '../components/DataStatistics';
import EquipmentTimeline from '../components/EquipmentTimeline';
import ExportExcelButton from '../components/ExportExcelButton';
import HomePage from '../components/HomePage';

import FileUpload from '../components/FileUpload'; // 确保路径正确


const ContentArea = ({ departmentID, account, selected, role, groupId, name, onLogout }) => {
    const isAssignedToMeRef = useRef(false); // Use useRef to persist state across renders
    const [data, setData] = useState([]);
    const [testId, setTestId] = useState('');
    const [currentItem, setCurrentItem] = useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false); // 控制Toast显示的状态
    const [showFailureToast, setShowFailureToast] = useState(false); // 控制Toast显示的状态
    const [, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [assignableUsers, setAssignableUsers] = useState([]);
    const [checkNote, setCheckNote] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [equipments, setEquipments] = useState([]);
    const [employeeStats, setEmployeeStats] = useState([]);
    const [equipmentStats, setEquipmentStats] = useState([]);
    const [sumPrice, setSumPrice] = useState('');
    const [equipmentTimeline, setEquipmentTimeline] = useState([]);
    const [accountTime, setAccountTime] = useState([]);
    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterOrderNum, setFilterOrderNum] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [description, setDescription] = useState('');
    const [filterData, setFilterData] = useState('');
    const [activePage, setActivePage] = useState(1);
    const [months, setMonths] = useState([]);    //按月份筛选
    const [finalPrice, setFinalPrice] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [selectedInvoices, setSelectedInvoices] = useState(new Set());
    const [isAllSelected, setIsAllSelected] = useState(false);
    const [isAllSelectedInvoices, setIsAllSelectedInvoices] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState(''); // 当前选择的设备分类标签
    const [filteredEquipments, setFilteredEquipments] = useState([]); // 二级菜单：根据分类标签筛选设备
    const [transactionType, setTransactionType] = useState('');
    const [filterPayerContactName, setFilterPayerContactName] = useState('');
    const [filterPayerName, setFilterPayerName] = useState('');
    const [checkedData, setCheckedData] = useState(null);  // 用来存储导出的数据
    const [commissionData, setCommissionData] = useState(null);  // 存储导出的数据
    const [assignmentInfo, setAssignmentInfo] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedDetails, setSelectedDetails] = useState({});
    const [errorMessage, setErrorMessage] = useState('');


    const [showModal, setShowModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [showSampleModal, setShowSampleModal] = useState(false);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [showReassignmentModal, setShowReassignmentModal] = useState(false);
    const [showRollbackModal, setShowRollbackModal] = useState(false);
    const [showCheckModal, setShowCheckModal] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showPayerModal, setShowPayerModal] = useState(false);
    const [showFinalPriceModal, setShowFinalPriceModal] = useState(false);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showExcelExportModal, setShowExcelExportModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showAccountSuccessToast, setShowAccountSuccessToast] = useState(false); // 控制Toast显示的状态

    //分页
    const itemsCountPerPage = 20;
    const totalItemsCount = data.length;
    const indexOfLastItem = activePage * itemsCountPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsCountPerPage;
    const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);

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
        quantity: '',
        test_note:'',
        listed_price: ''

    });

    //添加检测项目时候的数据
    const [addData, setAddData] = useState({
        order_num: '',
        original_no: '',
        test_item: '',
        test_method: '',
        size: '',
        quantity: '',
        deadline: '',
        note: '',
        department_id: '',
        name: '',
        account: ''

    });

    //充值数据
    const [depositData, setDepositData] = useState({
        amount: '',
        description: ''
    });

    //检测项目状态标签
    const statusLabels = {
        0: '待分配',
        1: '已分配待检测',
        2: '已检测待审批',
        3: '审批通过',
        4: '审批失败'

    };

    // 委托单服务类型标签
    const serviceTypeLabels = {
        1: '常规(正常排单周期)',
        2: '加急',
        3: '特急'
    };

    // 样品类型标签
    const sampleTypeLabels = {
        1: '板材',
        2: '棒材',
        3: '粉末',
        4: '液体',
        5: '其他'
    };

    // 样品处置标签
    const sampleSolutionTypeLabels = {
        1: '不退(样品留存90天，逾期销毁)',
        2: '客户自取',
        3: '寄回'
    }

    //委托单结算状态标签
    const orderStatusLabels = {
        0: '未结算',
        1: '已结算',
        2: '已入账'
    }

    //交易类型标签
    const transactionTypeLabels = {
        'DEPOSIT': '充值',
        'WITHDRAWAL': '消费'
    }
    // 静态部门数据
    const departments = [
        { department_id: 1, department_name: '显微组织表征实验室' },
        { department_id: 2, department_name: '物化性能测试实验室' },
        { department_id: 3, department_name: '力学性能测试实验室' }
    ];

    const areas = ['上海', '省内', '省外', '苏州', '相城'];
    const organizations = ['高校', '集萃体系', '企业', '研究所']

    // 获取委托单数据
    const fetchData = useCallback(async (endpoint) => {
        try {
            const params = new URLSearchParams();
            if (filterStatus) {
                params.append('status', filterStatus);
            }
            if (selectedMonth) {
                params.append('month', selectedMonth);  // 添加月份到请求参数
            }
            if (filterOrderNum) {
                params.append('orderNum', filterOrderNum); // 添加员工名称到请求参数
            }
            if (filterEmployee) {
                params.append('employeeName', filterEmployee); // 添加员工名称到请求参数
            }
            if (departmentID) {
                params.append('departmentId', departmentID);
            }
            const response = await axios.get(`${config.API_BASE_URL}/api/${endpoint}?${params}`);
            const sortedData = response.data.sort((a, b) => {
                const numA = parseInt(a.order_num.substring(2)); // 提取数字部分进行比较
                const numB = parseInt(b.order_num.substring(2));
                return numA - numB;
            });
            setData(sortedData);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to fetch data'); // 更新错误状态
            setTimeout(() => setError(''), 3000); // 3秒后清除错误消息
        }
    }, [setError, filterStatus, selectedMonth, filterEmployee, filterOrderNum, departmentID]);

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
            if (filterOrderNum) {
                params.append('orderNum', filterOrderNum); // 添加员工名称到请求参数
            }
            if (filterEmployee) {
                params.append('employeeName', filterEmployee); // 添加员工名称到请求参数
            }
            const response = await axios.get(`${config.API_BASE_URL}/api/tests/assignments/${account}?${params}`);
            const sortedData = response.data.sort((a, b) => {
                const numA = parseInt(a.order_num.substring(2)); // 提取数字部分进行比较
                const numB = parseInt(b.order_num.substring(2));
                return numA - numB;
            });
            setData(sortedData);
        } catch (error) {
            console.error('Error fetching assigned tests:', error);
        }
    }, [filterStatus, selectedMonth, filterEmployee, filterOrderNum]);

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
            if (filterOrderNum) {
                params.append('orderNum', filterOrderNum); // 添加员工名称到请求参数
            }
            if (filterEmployee) {
                params.append('employeeName', filterEmployee); // 添加员工名称到请求参数
            }
            const response = await axios.get(`${config.API_BASE_URL}/api/tests?${params}`);
            const sortedData = response.data.sort((a, b) => {
                const numA = parseInt(a.order_num.substring(2)); // 提取数字部分进行比较
                const numB = parseInt(b.order_num.substring(2));
                return numA - numB;
            });
            setData(sortedData);
        } catch (error) {
            console.error('Error fetching data for supervisor:', error);
            setError('Failed to fetch data');
            setTimeout(() => setError(''), 3000);
        }
    }, [role, account, filterStatus, setError, selectedMonth, filterEmployee, filterOrderNum]);

    //拉取发票信息
    const fetchInvoices = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filterData) params.append('filterData', filterData);
            const response = await axios.get(`${config.API_BASE_URL}/api/orders/invoices?${params}`);
            const invoices = response.data;
            setData(invoices);
        } catch (error) {
            console.error('拉取发票信息错误:', error);
        }
    }, [filterData]);


    //拉取发票信息
    const fetchOrdersForSales = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filterOrderNum) params.append('orderNum', filterOrderNum);
            params.append('account', account);
            const response = await axios.get(`${config.API_BASE_URL}/api/orders/sales?${params}`);
            const results = response.data;
            setData(results);
        } catch (error) {
            console.error('拉取业务委托单错误:', error);
        }
    }, [filterOrderNum, account]);


    // 拉取可分配的用户列表
    const fetchAssignableUsers = useCallback(async () => {
        try {
            let endpoint = '';
            if (role === 'leader') {
                endpoint = `/api/users/supervisors?departmentId=${departmentID}`;
            } else if (role === 'supervisor' || role === 'employee') {
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

    //拉取小组成员（暂时停用）
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

    // 根据不同角色查询对应的数据
    const fetchEquipments = useCallback(async () => {
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
    }, [departmentID]);

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

            let totalPrice = 0;
            for (let employee of employeeStats) {
                totalPrice += parseFloat(employee.total_listed_price);
            }
            setEmployeeStats(formattedEmployee);
            setEquipmentStats(formattedEquipment);
            setSumPrice(totalPrice);
        } catch (error) {
            console.error('Error fetching statistics data:', error);
        }
    }, [departmentID])

    // 获取设备时间线
    const fetchTimeline = useCallback(async () => {
        try {
            const response = await axios.get(`${config.API_BASE_URL}/api/charts/timeline?departmentId=${departmentID}`);
            const equipmentData = response.data;
            // 检查并格式化任务数据
            const tasks = equipmentData.map((equipment, index) => {
                // 验证 start_time 和 end_time 是否有效
                const start = equipment.start_time ? new Date(equipment.start_time) : null;
                const end = equipment.end_time ? new Date(equipment.end_time) : null;

                // 检查 start 和 end 是否为有效的 Date 对象
                if (!start || isNaN(start.getTime()) || !end || isNaN(end.getTime())) {
                    return null; // 跳过无效的任务
                }
                return {
                    id: index.toString(),
                    name: `${equipment.equipment_name}(${equipment.order_num})`,
                    start,
                    end,
                    progress: 100,
                    type: 'task',
                    dependencies: '', // 这里可以添加任务依赖关系
                    order_num: equipment.order_num,
                    styles: { progressColor: "#ffbb54", progressSelectedColor: "#ff9e0d" }

                };

            }).filter(task => task !== null); // 过滤掉无效任务
            setEquipmentTimeline(tasks); // 将设备时间线数据保存在 equipmentTimeline
        } catch (error) {
            console.error('Error fetching statistics data:', error);
        }
    }, [departmentID])

    //获取检测信息所包含的月份
    const fetchMonths = useCallback(async () => {
        try {
            const response = await axios.get(`${config.API_BASE_URL}/api/months`);
            setMonths(response.data);
        } catch (error) {
            console.error('Error fetching months:', error);
        }
    }, []);

    //获取交易时间所包含的月份
    const fetchTransMonths = useCallback(async () => {
        try {
            const response = await axios.get(`${config.API_BASE_URL}/api/months/trans`);
            setMonths(response.data);
        } catch (error) {
            console.error('Error fetching months:', error);
        }
    }, []);

    //获取委托方信息
    const fetchCustomers = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filterData) params.append('filterData', filterData);
            const response = await axios.get(`${config.API_BASE_URL}/api/customers?${params}`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    }, [filterData]);

    //获取付款方信息
    const fetchPayers = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filterData) params.append('filterData', filterData);
            const response = await axios.get(`${config.API_BASE_URL}/api/payers?${params}`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching payers:', error);
        }
    }, [filterData]);

    // 获取交易信息
    const fetchTransactions = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filterPayerName) {
                params.append('filterPayerName', filterPayerName);
            }
            if (filterPayerContactName) {
                params.append('filterPayerContactName', filterPayerContactName);  // 添加月份到请求参数
            }
            if (transactionType) {
                params.append('transactionType', transactionType); // 添加员工名称到请求参数
            }
            if (selectedMonth) {
                params.append('month', selectedMonth); // 添加员工名称到请求参数
            }
            const response = await axios.get(`${config.API_BASE_URL}/api/transactions?${params}`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching transaction:', error);
        }
    }, [filterPayerName, filterPayerContactName, transactionType, selectedMonth]);


    useEffect(() => {
        if ((role === 'employee')) {
            fetchMonths();
            if (selected === 'handleTests') {
                fetchDataForEmployee(account);
            } else if (selected === 'timeline') {
                fetchTimeline()
            } else if (selected === 'getCommission') {
                fetchData('orders');
            }
        } else if (role === 'supervisor' || role === 'leader') {
            fetchMonths();
            if (selected === 'dataStatistics') {
                fetchStatistics()
            } else if (selected === 'timeline') {
                fetchTimeline()
            } else if (selected === 'getCommission') {
                fetchData('orders');
            } else {
                fetchDataForSupervisor(departmentID);
            }
        } else if (role === 'sales') {
            fetchMonths();
            if (selected === 'handleTests') {
                fetchDataForEmployee(account);
            } else if (selected === 'timeline') {
                fetchTimeline()
            } else if (selected === 'getCommission') {
                fetchOrdersForSales();
            }
        } else {
            // 管理员情况
            if (selected === 'getCommission') {
                fetchData('orders');
            } else if (selected === 'getSamples') {
                fetchData('samples');
            } else if (selected === 'getTests') {
                fetchData('tests');
                fetchMonths();
            } else if (selected === 'customerInfo') {
                fetchCustomers();
            } else if (selected === 'payerInfo') {
                fetchPayers();
            } else if (selected === 'transactionHistory') {
                fetchTransactions();
                fetchTransMonths();
            } else if (selected === 'getChecked') {
                fetchInvoices();
            }
        }
        if (role !== "sales" && role !== "admin") {
            fetchAssignableUsers();
        }
        fetchEquipments();
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
        fetchMonths,
        fetchTransMonths,
        fetchCustomers,
        fetchTransactions,
        fetchInvoices,
        fetchPayers,
        fetchOrdersForSales
    ]);


    // 当用户选择标签时，直接更新筛选后的设备
    const handleLabelChange = (e) => {
        const label = e.target.value;
        setSelectedLabel(label);
        if (label) {
            const filtered = equipments.filter(equipment => equipment.equipment_label === label);
            setFilteredEquipments(filtered);
        } else {
            setFilteredEquipments([]);
        }
    };


    const handleEdit = (item) => {
        setCurrentItem(item);
        setShowModal(true);
    };


    const handleEditCustomer = (item) => {
        setCurrentItem(item);
        setShowCustomerModal(true);
    }

    const handleEditPayer = (item) => {
        setCurrentItem(item);
        setShowPayerModal(true);
    }


    const handleDeposit = (item) => {
        setCurrentItem(item);
        setShowDepositModal(true);
    };


    //定义打开和关闭 完成Modal 的函数 
    const handleAdd = (item) => {
        // 可以根据需要预填充已知数据
        setAddData({
            order_num: item.order_num,
            original_no: '',
            test_item: '',
            test_method: '',
            size: '',
            quantity: '',
            deadline: '',
            note: '',
            department_id: '',
            status: '0',
            name: item.name,
            account: item.account
        });
        setShowAddModal(true);
    };

    // 编辑样品按钮
    const handleEditSamples = (item) => {
        setCurrentItem(item);
        setShowSampleModal(true);
    }

    // 删除按钮
    const handleDelete = (identifier) => {
        setShowDeleteConfirm(true);
        setCurrentItem({ identifier });
    };

    // 控制分配Modal显示的方法
    const showAssignmentModalHandler = (data) => {
        setTestId(data.test_item_id)
        setShowAssignmentModal(true);
    };

    const handleAssignment = (testItemId) => {
        setCurrentItem({ testItemId }); // 假设我们需要订单号来处理分配
        setShowAssignmentModal(true);
    };


    const handleReassignment = (testItemId) => {
        setCurrentItem({ testItemId }); // 假设我们需要订单号来处理分配
        setShowReassignmentModal(true);
    };

    const handleRollBack = (testItemId) => {
        setCurrentItem({ testItemId }); // 假设我们需要订单号来处理分配
        setShowRollbackModal(true);
    };



    const handleCheck = (item) => {
        setCurrentItem(item); // 假设我们需要订单号来处理分配
        setShowCheckModal(true);
    };


    // 处理选中的委托单
    const handleCheckboxChange = (orderNum) => {
        setSelectedOrders(prev => {
            if (prev.includes(orderNum)) {
                return prev.filter(order => order !== orderNum);
            } else {
                return [...prev, orderNum];
            }
        });
    };

    // 处理单个复选框选中/取消选中
    const handleInvoiceCheckboxchange = (invoiceId) => {
        setSelectedInvoices(prev => {
            const updatedSelectedInvoices = new Set(prev);
            if (updatedSelectedInvoices.has(invoiceId)) {
                updatedSelectedInvoices.delete(invoiceId);  // 如果已经选中，取消选中
            } else {
                updatedSelectedInvoices.add(invoiceId);  // 如果没有选中，添加到选中的列表
            }
            return updatedSelectedInvoices;
        });
    };

    // 获取导出数据
    const handleExportCheckedData = async () => {
        setLoading(true);
        try {
            const invoiceIds = [...selectedInvoices];
            const response = await axios.post(`${config.API_BASE_URL}/api/orders/exportCheckedData`, { invoiceIds });
            const data = response.data;
            // 定义字段名映射，将英文字段名转换为中文
            const fieldMapping = {
                "invoice_number": "发票号",
                "order_num": "委托单号",
                "customer_name": "客户名称",
                "contact_name": "联系人",
                "contact_phone_num": "联系电话",
                "payer_name": "付款方",
                "payer_contact_name": "付款联系人",
                "sales_name": "业务员",
                "test_items": "检测项目",
                "final_price": "开票价",
                "created_at": "创建时间"
            };
            // 使用映射表调整 data 中的字段名
            const mappedData = data.map(item => {
                const mappedItem = {};
                Object.keys(item).forEach(key => {
                    const mappedKey = fieldMapping[key] || key;  // 如果有映射字段名就使用映射值，否则保持原字段名
                    mappedItem[mappedKey] = item[key];
                });
                return mappedItem;
            });
            const headers = ["发票号", "委托单号", "客户名称", "联系人", "联系电话", "付款方", "付款联系人", "业务员", "检测项目", "开票价", "创建时间"];
            setCheckedData({ data: mappedData, headers, filename: "getCheckedData" });
            setShowExcelExportModal(true);
        } catch (error) {
            console.error("导出数据失败:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCommissionData = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${config.API_BASE_URL}/api/orders/exportCommissionData`, { selectedOrders });
            const data = response.data;
            // 定义字段名映射，将英文字段名转换为中文
            const fieldMapping = {
                "order_num": "委托单号",
                "customer_name": "委托单位",
                "contact_name": "联系人",
                "contact_phone_num": "联系电话",
                "contact_email": "联系邮箱",
                "payer_contact_name": "付款联系人",
                "payer_contact_phone_num": "付款联系人电话",
                "payer_address": "付款人地址",
                "test_items": "检测项目",
                "material": "材料",
                "service_type": "服务类型",
                "order_status": "订单状态",
                "total_discounted_price": "业务总价",
                "name": "业务员"
            };
            // 使用映射表调整 data 中的字段名
            const mappedData = data.map(item => {
                const mappedItem = {};
                Object.keys(item).forEach(key => {
                    const mappedKey = fieldMapping[key] || key;  // 如果有映射字段名就使用映射值，否则保持原字段名
                    mappedItem[mappedKey] = item[key];
                });
                return mappedItem;
            });
            const headers = [
                "委托单号",
                "委托单位",
                "联系人",
                "联系电话",
                "联系邮箱",
                "付款联系人",
                "付款联系人电话",
                "付款人地址",
                "检测项目",
                "材料",
                "服务类型",
                "订单状态",
                "业务总价",
                "业务员"];
            setCommissionData({ data: mappedData, headers, filename: "getCommissionData" });
            setShowExcelExportModal(true);

        } catch (error) {
            console.error("导出数据失败:", error);
        } finally {
            setLoading(false);
        }
    };

    // 执行结算操作
    const handleCheckout = async () => {
        try {
            // 发送请求到后端检查每个订单的交易价格
            setShowCheckoutModal(false);
            const response = await axios.post(`${config.API_BASE_URL}/api/orders/checkout`, { orderNums: selectedOrders });
            if (response.data.success) {
                // 如果结算成功，更新状态
                setShowSuccessToast(true); // 显示成功提示
                setTimeout(() => setShowSuccessToast(false), 3000);
                fetchData('orders');
                setSelectedOrders([]);
            }
        } catch (error) {
            // 如果请求失败，显示详细错误信息
            if (error.response) {
                // 如果后端有响应，显示后端返回的消息
                alert(`错误: \n${error.response.data.message || '发生错误，请稍后重试'}`);
            } else if (error.request) {
                // 如果没有收到响应，显示请求发送失败的提示
                alert('请求失败，请稍后重试');

            } else {
                // 如果是其他错误
                alert(`发生未知错误: ${error.message}`);
            }
        }
    };

    //定义打开和关闭 完成Modal 的函数 
    const handleOpenFinishModal = (item) => {
        // 可以根据需要预填充已知数据
        setFinishData({
            test_item_id: item.test_item_id, // 保存当前项目ID以便提交时使用
            machine_hours: item.machine_hours,
            work_hours: item.work_hours,
            operator: account,
            equipment_id: item.equipment_id,
            equipment_name: item.equipment_name,
            model: item.model,
            quantity: item.quantity,
            test_note: item.test_note,
            listed_price: item.listed_price
        });
        setShowFinishModal(true);
    };

    const handleCloseFinishModal = () => {
        setShowFinishModal(false);
    };

    //完成按钮
    const handleFinishTest = async () => {
        const { test_item_id, machine_hours, work_hours, operator, equipment_id, quantity, test_note, listed_price } = finishData;
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
                equipment_id,
                quantity,
                test_note,
                listed_price: listed_price * quantity
            });
            setShowFinishModal(false); // 成功后关闭 Modal
            setShowSuccessToast(true); // 显示成功提示
            setTimeout(() => setShowSuccessToast(false), 3000);
            // 根据 role 和 selected 的值直接调用相应的 fetchData 函数
            if (role === 'employee' || role === 'supervisor') {
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

    // 设置最终价
    const handleAddFinalPrice = (invoiceId) => {
        setCurrentItem({ invoiceId });
        setShowFinalPriceModal(true);
    }

    const handleAccount = (item) => {
        setCurrentItem(item);

        setShowAccountModal(true);
    }

    // 设置标价
    const handleQuote = async (testItemId) => {
        const newPrice = prompt("请输入标准价格:");
        if (newPrice && !isNaN(parseFloat(newPrice))) {
            try {
                await axios.patch(`${config.API_BASE_URL}/api/tests/${testItemId}/price`, { listedPrice: newPrice });
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

    //设置分页
    const handlePageChange = (pageNumber) => {
        setActivePage(pageNumber);
        localStorage.setItem('currentPage', pageNumber); // 保存当前页码到localStorage
    };


    const handleCloseAndRefresh = () => {
        setShowDetailsModal(true);  // 关闭详情页

    };

    //充值判断
    const handleDepositChange = (e) => {
        const value = parseFloat(e.target.value);
        setDepositData({ ...depositData, amount: value });

        // 检查金额是否超出阈值
        if (value > 1000000) {
            setErrorMessage('充值金额不能超过 1000000 元。');
        } else if (value < 0) {
            setErrorMessage('充值金额不能为负数。');
        } else {
            setErrorMessage(''); // 清除错误信息
        }
    };

    //处理委托单全选按钮
    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedOrders([]);  // 如果已经全选，则取消全选
        } else {
            setSelectedOrders(currentItems.map(item => item.order_num));  // 全选所有委托单号
        }
        setIsAllSelected(!isAllSelected);  // 切换全选状态
    };

    //处理发票全选按钮
    const handleSelectAllInvoices = () => {
        if (isAllSelectedInvoices) {
            setSelectedInvoices(new Set());  // 如果已经全选，则取消全选
        } else {
            // 获取所有的 invoice_id 并全选
            const allSelectedInvoices = new Set();
            currentItems.forEach((invoice) => {
                if (invoice.invoice_id) {
                    allSelectedInvoices.add(invoice.invoice_id);  // 只添加 invoice_id
                }
            });
            setSelectedInvoices(allSelectedInvoices);
        }
        setIsAllSelectedInvoices(!isAllSelectedInvoices);  // 切换全选状态
    };

    const addItem = async () => {
        if (!addData.test_item) {
            alert(`提交失败！"检测项目"为必填项，请重新填写`);
            return; // 停止提交
        }
        if (!addData.quantity) {
            alert(`提交失败！"数量"为必填项，请重新填写`);
            return; // 停止提交
        }

        if (!window.confirm('请确认添加内容是否有误，确认后提交！')) {
            return;  // 用户点击取消后，不执行任何操作
        }
        try {
            const response = await axios.patch(`${config.API_BASE_URL}/api/tests/add`, addData);
            if (response.data.success) {
                // 成功提示
                setShowAddModal(false);
                setShowSuccessToast(true); // 显示成功的Toast
                setTimeout(() => setShowSuccessToast(false), 3000); // 3秒后自动隐藏Toast                   
                fetchData('orders');

            } else {
                setShowFailureToast(true)
            }
        } catch (error) {
            console.error('Error updating test items:', error);
        }
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
                    fetchData("tests");

                } else {
                    setShowFailureToast(true)
                }
            }
        } catch (error) {
            console.error('Error updating test items:', error);
        }
    };

    const updateSample = async () => {

        try {
            if (selected === 'getSamples') {
                const response = await axios.patch(`${config.API_BASE_URL}/api/samples/${currentItem.order_num}`, currentItem);
                if (response.data.success) {
                    // 成功提示
                    setShowSampleModal(false);
                    setShowSuccessToast(true); // 显示成功的Toast
                    setTimeout(() => setShowSuccessToast(false), 3000); // 3秒后自动隐藏Toast                   
                    fetchData("samples");

                } else {
                    setShowFailureToast(true)
                }
            }
        } catch (error) {
            console.error('Error updating samples:', error);
        }
    };

    const updateCustomer = async () => {

        try {
            const response = await axios.patch(`${config.API_BASE_URL}/api/customers/${currentItem.customer_id}`, currentItem);
            if (response.data.success) {
                // 成功提示
                setShowCustomerModal(false);
                setShowSuccessToast(true); // 显示成功的Toast
                setTimeout(() => setShowSuccessToast(false), 3000); // 3秒后自动隐藏Toast                   
                fetchCustomers()
            } else {
                setShowFailureToast(true)
            }
        } catch (error) {
            console.error('Error updating customers:', error);
        }
    };

    const updatePayer = async () => {

        try {
            const response = await axios.patch(`${config.API_BASE_URL}/api/payers/${currentItem.payment_id}`, currentItem);
            if (response.data.success) {
                // 成功提示
                setShowPayerModal(false);
                setShowSuccessToast(true); // 显示成功的Toast
                setTimeout(() => setShowSuccessToast(false), 3000); // 3秒后自动隐藏Toast                   
                fetchPayers()
            } else {
                setShowFailureToast(true)
            }
        } catch (error) {
            console.error('Error updating payers:', error);
        }
    };
    const deleteItem = async () => {
        try {
            if (!window.confirm('请再次确认此【删除】操作！')) {
                return;  // 用户点击取消后，不执行任何操作
            }
            if (selected === 'getTests') {
                await axios.delete(`${config.API_BASE_URL}/api/tests/${currentItem.identifier}`);
                setShowSuccessToast(true); // 显示成功的Toast
                setTimeout(() => setShowSuccessToast(false), 3000); // 3秒后自动隐藏Toast                   
                setShowDeleteConfirm(false);
                fetchData(selected);
            } else if (selected === 'getCommission') {
                await axios.delete(`${config.API_BASE_URL}/api/orders/${currentItem.identifier}`);
                setShowSuccessToast(true); // 显示成功的Toast
                setTimeout(() => setShowSuccessToast(false), 3000); // 3秒后自动隐藏Toast                   
                setShowDeleteConfirm(false);
                fetchData("orders");
            } else if (selected === 'customerInfo') {
                await axios.delete(`${config.API_BASE_URL}/api/customers/${currentItem.identifier}`);
                setShowSuccessToast(true); // 显示成功的Toast
                setTimeout(() => setShowSuccessToast(false), 3000); // 3秒后自动隐藏Toast                   
                setShowDeleteConfirm(false);
                fetchCustomers();
            } else if (selected === 'payerInfo') {
                await axios.delete(`${config.API_BASE_URL}/api/payers/${currentItem.identifier}`);
                setShowSuccessToast(true); // 显示成功的Toast
                setTimeout(() => setShowSuccessToast(false), 3000); // 3秒后自动隐藏Toast                   
                setShowDeleteConfirm(false);
                fetchPayers();
            }
        } catch (error) {
            console.error('Error deleting order:', error);
        }
    };

    const submitAssignment = useCallback(async () => {
        try {
            // 先检查设备是否有时间冲突
            const checkResponse = await axios.get(`${config.API_BASE_URL}/api/tests/checkTimeConflict`, {
                params: {
                    equipment_id: assignmentData.equipment_id,
                    start_time: assignmentData.start_time,
                    end_time: assignmentData.end_time,
                }
            });
            console.log(checkResponse)
            if (checkResponse.data.conflict) {
                // 如果有冲突，提示用户冲突的设备预约时间
                const conflictMessage = checkResponse.data.conflictDetails.map(
                    (item) => `${item.test_item}(${item.order_num}): \n${new Date(item.start_time).toLocaleString()} 到 ${new Date(item.end_time).toLocaleString()}`
                ).join('\n');
                setAlertMessage(`该设备在选择的时间段已被预约，请选择其他时间。\n冲突时间段(一个月内)：\n${conflictMessage}`);
                setShowAlert(true);
                return; // 阻止继续提交
            }

            const payload = {
                testItemId: currentItem.testItemId ? currentItem.testItemId : testId,
                assignmentInfo,
                equipment_id: assignmentData.equipment_id,
                start_time: assignmentData.start_time,
                end_time: assignmentData.end_time,
                role: role
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
            setAlertMessage(error.response.data.message);
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
        testId

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

    // 回退
    const submitRollback = async () => {
        try {
            await axios.post(`${config.API_BASE_URL}/api/tests/rollback`, { testItemId: currentItem.testItemId, account });
            setShowRollbackModal(false);
            fetchDataForEmployee(account); // 重新获取该员工分配的测试数据
            setShowSuccessToast(true); // Show success message
            setTimeout(() => setShowSuccessToast(false), 3000);
        } catch (error) {
            console.error('Error robllback test item:', error);
            setError('Failed to rollback test item');
            setTimeout(() => setError(''), 3000);
        }
    };


    const submitDeposit = async () => {
        if (depositData.amount <= 0) {
            setErrorMessage('请输入有效的充值金额，必须大于 0。');
            return;
        }

        if (depositData.amount > 1000000) {
            setErrorMessage('充值金额不能超过 1000000 元。');
            return;
        }

        // 清除错误信息并提交
        setErrorMessage('');

        try {
            await axios.post(`${config.API_BASE_URL}/api/payers/deposit`, {
                payment_id: currentItem.payment_id,
                amount: depositData.amount,
                description: depositData.description
            })
            fetchPayers();
            setShowSuccessToast(true); // Show success message
            setTimeout(() => setShowSuccessToast(false), 3000);
            setShowDepositModal(false);
        } catch (error) {
            console.error('充值失败:', error);
            setError('未能给客户充值');
            setTimeout(() => setError(''), 3000);
        }
    }
    //审批方法
    const submitCheck = (action) => {
        if (action === 'approve' && !window.confirm('请再次确认此操作。点击通过后不可修改！')) {
            return;  // 用户点击取消后，不执行任何操作
        }
        const status = action === 'approve' ? 3 : 4; // 3 for approve, 4 for reject
        const payload = {
            testItemId: currentItem.test_item_id,
            status: status,
            checkNote: checkNote,
            discountedPrice: currentItem.discounted_price,
            orderNum: currentItem.order_num
        };
        updateTestStatus(payload);
    };

    //设置最终价操作
    const submitFinalPrice = async (invoiceId) => {
        try {
            if (finalPrice) {
                await axios.post(`${config.API_BASE_URL}/api/orders/finalPrice`, {
                    invoiceId: invoiceId,
                    finalPrice: finalPrice
                })
                fetchInvoices();
                setShowSuccessToast(true); // Show success message
                setTimeout(() => setShowSuccessToast(false), 3000);
                setShowFinalPriceModal(false);
            }

        } catch (error) {
            console.error('开票价设置失败:', error);
            setError('未能成功设置开票价');
            setTimeout(() => setError(''), 3000);
        }
    }

    //入账操作
    const submitAccount = async (invoiceId) => {
        try {
            if (!invoiceNumber) {
                setAlertMessage("请输入发票号！");
                setShowAlert(true);
            } else if (!currentItem.order_details[0].final_price) {
                setAlertMessage("最终开票价格未填写！");
                setShowAlert(true);
            } else if (accountTime.length === 0) {
                setAlertMessage("入账时间未填写！");
                setShowAlert(true);
            } else {
                if (!window.confirm('请再次确认此【入账】操作！')) {
                    return;  // 用户点击取消后，不执行任何操作
                }
                await axios.post(`${config.API_BASE_URL}/api/orders/account`, {
                    invoiceId: invoiceId,
                    invoiceNumber: invoiceNumber,
                    orderStatus: '2',
                    amount: currentItem.order_details[0].final_price,
                    description: description,
                    accountTime: accountTime
                })
                fetchInvoices();
                setShowAccountSuccessToast(true); // Show success message
                setTimeout(() => setShowSuccessToast(false), 3000);
                setShowAccountModal(false);
            }

        } catch (error) {
            // 捕获错误并展示错误消息
            if (error.response && error.response.data && error.response.data.message) {
                setAlertMessage(error.response.data.message);  // 设置错误消息
                setShowAlert(true);  // 显示警告框
            } else {
                console.error('入账失败:', error);
                setAlertMessage('未能成功入账');
                setShowAlert(true);
            }
            setTimeout(() => setAlertMessage(''), 5000);  // 5秒后清除警告消息
        }
    }


    const updateTestStatus = async (payload) => {
        try {
            await axios.post(`${config.API_BASE_URL}/api/tests/update-check`, payload);
            setShowCheckModal(false); // Close the modal after submission
            fetchDataForSupervisor(departmentID);
            setShowSuccessToast(true); // Optionally show a success message
            setTimeout(() => setShowSuccessToast(false), 3000);
        } catch (error) {
            console.error('Error updating test status:', error);
            setError('Failed to update test                    status');
            setTimeout(() => setError(''), 3000);
        }
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


    const formatSampleType = (type) => {
        let parsedType = [];

        // 尝试将 sample_type 解析为数组
        if (type) {
            try {
                parsedType = JSON.parse(type);
                return parsedType;
            } catch (e) {
                console.error('Error parsing sample_type:', e);
            }
        }
    }


    // 高亮匹配部分
    const highlightText = (text, searchText) => {
        if (!searchText) return text;  // 如果没有输入查询条件，直接返回原始文本
        if (text) {
            const regex = new RegExp(`(${searchText})`, 'gi'); // 使用正则表达式进行不区分大小写的匹配
            const parts = text.toString().split(regex);  // 根据匹配结果拆分字符串

            // 将匹配的部分包裹在 <span> 标签中，添加高亮样式
            return parts.map((part, index) =>
                regex.test(part) ? <span key={index} className="highlight">{part}</span> : part
            );
        }
    };

    const renderTable = () => {
        let headers = [];
        let rows = [];

        if (role === 'employee') {
            switch (selected) {
                case 'handleTests':
                    // 为员工定制的视图逻辑
                    headers = ["委托单号", "分配给我的检测项目", "状态", "样品原号", "机时", "工时", "审批意见", "剩余天数"];
                    rows = currentItems.map((item, index) => (
                        <tr key={index}>
                            <td className='order-num-fixed'>{item.order_num}</td>
                            <td className='test-item-fixed'>{item.test_item}</td>
                            <td>{statusLabels[item.status]}</td>
                            <td>{item.original_no}</td>
                            <td>{item.machine_hours}</td>
                            <td>{item.work_hours}</td>
                            <td>{item.check_note}</td>
                            <td>
                                {(item.status === '1' || item.status === '2') ? renderDeadlineStatus(item.deadline, item.appoint_time) : ''}
                            </td>
                            <td className='fixed-column'>
                                <Button variant="info" onClick={() => handleShowDetails(item)}>详情</Button>
                                {(item.status !== '3') && (
                                    <Button onClick={() => handleOpenFinishModal(item)}>完成</Button>
                                )}
                                {/* 只有当状态不是'2'（已检测）时，才显示转办按钮 */}
                                {(item.status === '0' || item.status === '1') && (
                                    <Button onClick={() => handleReassignment(item.test_item_id)}>转办</Button>

                                )}
                                <Button variant="secondary" onClick={() => handleRollBack(item.test_item_id)}>回退</Button>

                                {/* {item.status !== '3' && (
                                    <Button onClick={() => handleQuote(item.test_item_id)}>确定报价</Button>
                                )} */}
                            </td>
                        </tr>
                    ));
                    break;
                case 'getCommission':
                    headers = ["委托单号", "委托单位", "联系人", "联系电话", "联系人邮箱", "付款人", "付款人电话", "地址", "检测项目", "材料类型", "服务加急"];
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
                            <td>{item.test_items}</td>
                            <td>{item.material}</td>
                            <td>{serviceTypeLabels[item.service_type]}</td>
                        </tr>
                    ));
                    break;
                default:
                    headers = ["暂无数据"];
                    rows = <tr><td colSpan={headers.length}>No data selected or available</td></tr>;
                    break;
            }

            return { headers, rows };
        } else if (role === 'supervisor') {
            switch (selected) {
                case 'handleTests':
                    // 为员工定制的视图逻辑
                    headers = ["委托单号", "检测项目", "状态", "样品原号", "机时", "工时", "检测人员", "标准价格", "优惠价格", "业务人员", "审批意见", "剩余天数"];
                    rows = currentItems.map((item, index) => (

                        <tr key={index}>
                            <td className='order-num-fixed'>{item.order_num}</td>
                            <td className='test-item-fixed'>{item.test_item}</td>
                            <td>{statusLabels[item.status]}</td>
                            <td>{item.original_no}</td>
                            <td>{item.machine_hours}</td>
                            <td>{item.work_hours}</td>
                            <td>
                                {item.team_names ? `${item.team_names}` : '暂未分配'}
                            </td>
                            <td>{item.listed_price}</td>
                            <td>{item.discounted_price}</td>
                            <td>
                                {item.sales_names ? `${item.sales_names}` : '暂未分配'}
                            </td>
                            <td>{item.check_note}</td>
                            <td>
                                {(item.status === '1' || item.status === '2') ? renderDeadlineStatus(item.deadline, item.appoint_time) : ''}
                            </td>

                            <td className='fixed-column'>
                                <Button variant="info" onClick={() => handleShowDetails(item)}>详情</Button>
                                {(item.status !== '3') && (
                                    <Button onClick={() => handleOpenFinishModal(item)}>完成</Button>
                                )}
                                {item.status === '1' && role === 'supervisor' && (
                                    <Button onClick={() => handleAssignment(item.test_item_id)}>指派</Button>
                                )}
                                {/* {item.status !== '3' && (
                                    <Button onClick={() => handleQuote(item.test_item_id)}>确定报价</Button>
                                )} */}
                                {/* 当状态是已检测待审核，且标价写入时，才显示审核按钮 */}
                                {(item.status === '2' || item.status === '4') && item.discounted_price && (
                                    <Button variant="warning" onClick={() => handleCheck(item)}>审核</Button>
                                )}
                            </td>
                        </tr>
                    ));
                    break;
                case 'getCommission':
                    headers = ["委托单号", "委托单位", "联系人", "联系电话", "联系人邮箱", "付款人", "付款人电话", "地址", "检测项目", "材料类型", "服务加急"];
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
                            <td>{item.test_items}</td>
                            <td>{item.material}</td>
                            <td>{serviceTypeLabels[item.service_type]}</td>
                            <td className='fixed-column'>
                                <Button onClick={() => handleAdd(item)}>添加检测</Button>
                            </td>
                        </tr>
                    ));
                    break;
                default:

                    break;

            }

            return { headers, rows };
        } else if (role === 'leader' && selected === 'handleTests') {
            // 为员工定制的视图逻辑
            headers = ["委托单号", "检测项目", "状态", "样品原号", "机时", "工时", "标准价格", "检测人员", "业务人员", "审批意见", "剩余天数"];
            rows = currentItems.map((item, index) => (
                <tr key={index}>
                    <td className='order-num-fixed'>{item.order_num}</td>
                    <td className='test-item-fixed'>{item.test_item}</td>
                    <td>{statusLabels[item.status]}</td>
                    <td>{item.original_no}</td>
                    <td>{item.machine_hours}</td>
                    <td>{item.work_hours}</td>
                    <td>{item.listed_price}</td>
                    <td>
                        {item.team_names ? `${item.team_names}` : '暂未分配'}
                    </td>
                    <td>
                        {item.sales_names ? `${item.sales_names}` : '暂未分配'}
                    </td>

                    <td>{item.check_note}</td>
                    <td>
                        {(item.status === '1' || item.status === '2') ? renderDeadlineStatus(item.deadline, item.appoint_time) : ''}

                    </td>

                    <td className='fixed-column'>
                        <Button variant="info" onClick={() => handleShowDetails(item)}>详情</Button>
                        {/* 只有当状态不是'1'（已检测）时，才显示分配按钮 */}
                        {item.status === '0' && (
                            <Button onClick={() => handleAssignment(item.test_item_id)}>分配</Button>
                        )}

                    </td>
                </tr>
            ));
            return { headers, rows };
        } else if (role === 'sales') {
            switch (selected) {
                case 'handleTests':
                    headers = ["委托单号", "检测项目", "状态", "样品原号", "数量", "机时", "标准价格", "优惠价格", "检测人员", "业务人员", "审批意见"];
                    rows = currentItems.map((item, index) => (
                        <tr key={index}>
                            <td className='order-num-fixed'>{item.order_num}</td>
                            <td className='test-item-fixed'>{item.test_item}</td>
                            <td>{statusLabels[item.status]}</td>
                            <td>{item.original_no}</td>
                            <td>{item.quantity}</td>
                            <td>{item.machine_hours}</td>
                            <td>{item.listed_price}</td>
                            <td>{item.discounted_price}</td>
                            <td>
                                {item.team_names ? `${item.team_names}` : '暂未分配'}
                            </td>
                            <td>
                                {item.sales_names ? `${item.sales_names}` : '暂未分配'}
                            </td>
                            <td>{item.check_note}</td>
                            <td className='fixed-column'>
                                <Button variant="info" onClick={() => handleShowDetails(item)}>详情</Button>
                                {item.status !== '3' && (
                                    <Button onClick={() => handleDiscount(item.test_item_id)}>设置优惠价</Button>
                                )}
                            </td>
                        </tr>
                    ));
                    break;
                case 'getCommission':
                    headers = ["委托单号", "委托单位", "联系人", "联系电话", "结算状态", "交易总价", "服务加急", "寄送地址", "创建时间"];
                    rows = currentItems.map((item, index) => (
                        <tr key={index}>
                            <td>{item.order_num}</td>
                            <td>{item.customer_name}</td>
                            <td>{item.contact_name}</td>
                            <td>{item.contact_phone_num}</td>
                            <td>{orderStatusLabels[item.order_status]}</td>
                            <td>{item.total_discounted_price}</td>
                            <td>{serviceTypeLabels[item.service_type]}</td>
                            <td>{item.sample_shipping_address}</td>
                            <td>{new Date(item.create_time).toLocaleString()}</td>
                        </tr>
                    ));
                    break;
                default:
                    headers = ["暂无数据"];
                    rows = <tr><td colSpan={headers.length}>No data selected or available</td></tr>;
                    break;
            }

            return { headers, rows };
        }
        else {
            // 默认视图
            switch (selected) {
                case 'getCommission':
                    headers = ["委托单号", "委托单位", "联系人", "联系电话", "结算状态", "交易总价", "业务员", "联系人邮箱", "付款人", "付款人电话", "地址", "检测项目", "材料类型", "服务加急"];
                    rows = currentItems.map((item, index) => (
                        <tr key={index}>
                            {/* 选择框 */}
                            {role === 'admin' && (
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedOrders.includes(item.order_num)}
                                        onChange={() => handleCheckboxChange(item.order_num)}
                                    />
                                </td>
                            )}
                            <td>{item.order_num}</td>
                            <td>{item.customer_name}</td>
                            <td>{item.contact_name}</td>
                            <td>{item.contact_phone_num}</td>
                            <td>{orderStatusLabels[item.order_status]}</td>
                            <td>{item.total_discounted_price}</td>
                            <td>{item.name}</td>
                            <td>{item.contact_email}</td>
                            <td>{item.payer_contact_name}</td>
                            <td>{item.payer_contact_phone_num}</td>
                            <td>{item.payer_address}</td>
                            <td>{item.test_items}</td>
                            <td>{item.material}</td>
                            <td>{serviceTypeLabels[item.service_type]}</td>
                            <td className='fixed-column'>
                                <Button onClick={() => handleAdd(item)}>添加检测</Button>
                                <Button variant="danger" onClick={() => handleDelete(item.order_num)}>删除</Button>
                            </td>
                        </tr>
                    ));
                    break;
                case 'getChecked':
                    headers = ["发票号", "委托单号", "客户名称", "联系人", "联系电话", "付款方", "付款联系人", "业务员", "检测项目", "开票价", "创建时间"];
                    currentItems.forEach((invoice) => {
                        if (invoice && invoice.order_details && Array.isArray(invoice.order_details)) {
                            invoice.order_details.forEach((order, orderIndex) => {
                                rows.push(
                                    <tr key={order.order_num}>
                                        {/* 选择框 */}
                                        {orderIndex === 0 && (
                                            <td rowSpan={invoice.order_details.length}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedInvoices.has(Number(invoice.invoice_id))}
                                                    onChange={() => handleInvoiceCheckboxchange(invoice.invoice_id)}
                                                />
                                            </td>
                                        )}
                                        {/* 合并 Invoice ID 和 操作列 */}
                                        {orderIndex === 0 && (
                                            <td className="invoice-id-cell" rowSpan={invoice.order_details.length}>
                                                <strong>
                                                    {highlightText(invoice.invoice_number ? invoice.invoice_number : '暂未填写', filterData)}
                                                </strong>
                                            </td>

                                        )}

                                        <td>{highlightText(order.order_num, filterData)}</td>
                                        <td>{highlightText(order.customer_name, filterData)}</td>
                                        <td>{highlightText(order.contact_name, filterData)}</td>
                                        <td>{highlightText(order.contact_phone_num, filterData)}</td>
                                        <td>{highlightText(order.payer_name, filterData)}</td>
                                        <td>{highlightText(order.payer_contact_name, filterData)}</td>
                                        <td>{highlightText(order.name, filterData)}</td>
                                        <td className="test-items">
                                            {/* 展示检测项目 */}
                                            <ul className="test-item-list">
                                                {order.items.map((item, index) => (
                                                    <li key={index} className="test-item">
                                                        <div className="test-item-details">
                                                            <span className="test-item-name">{item.test_item}</span>
                                                            <span className="test-item-price">{item.discounted_price} 元</span>
                                                        </div>
                                                        <Button className="details-btn" onClick={() => handleShowDetails(item)}>详情</Button>

                                                    </li>

                                                ))}
                                            </ul>
                                        </td>

                                        {/* 合并 Invoice ID 和 操作列 */}
                                        {orderIndex === 0 && (
                                            <>
                                                <td className="invoice-id-cell" rowSpan={invoice.order_details.length}>
                                                    <strong>{highlightText(order.final_price, filterData)}</strong>
                                                </td>
                                                <td className="invoice-id-cell" rowSpan={invoice.order_details.length}>
                                                    {highlightText(new Date(invoice.created_at).toLocaleString(), filterData)}
                                                </td>

                                            </>


                                        )}
                                        {/* 操作按钮 */}
                                        {orderIndex === 0 && (
                                            <td rowSpan={invoice.order_details.length} className='fixed-column'>
                                                <div className="action-btns">
                                                    <Button onClick={() => handleAddFinalPrice(invoice.invoice_id)}>设置最终价</Button>
                                                    <Button onClick={() => handleAccount(invoice)}>入账</Button>

                                                </div>
                                            </td>
                                        )}

                                    </tr>
                                );
                            });
                        }
                    });
                    break;
                case 'getSamples':
                    headers = ["样品名称", "材料", "货号", "材料规范", "样品处置", "材料类型", "订单编号"];
                    rows = currentItems.map((item, index) => (
                        <tr key={index}>
                            <td>{item.sample_name}</td>
                            <td>{item.material}</td>
                            <td>{item.product_no}</td>
                            <td>{item.material_spec}</td>
                            <td>{sampleSolutionTypeLabels[item.sample_solution_type]}</td>
                            <td>
                                {sampleTypeLabels[formatSampleType(item.sample_type)]}
                            </td>
                            <td>{item.order_num}</td>
                            <td className='fixed-column'>
                                <Button onClick={() => handleEditSamples(item)}>修改</Button>
                            </td>
                        </tr>
                    ));
                    break;
                case 'getTests':
                    headers = ["委托单号", "样品原号", "检测项目", "方法", "机时", "工时", "标准价格", "优惠价格", "状态", "实验人员", "业务人员", "审批意见"];
                    rows = currentItems.map((item, index) => (
                        <tr key={index}>
                            <td>{item.order_num}</td>
                            <td>{item.original_no}</td>
                            <td>{item.test_item}</td>
                            <td>{item.test_method}</td>
                            <td>{item.machine_hours}</td>
                            <td>{item.work_hours}</td>
                            <td>{item.listed_price}</td>
                            <td>{item.discounted_price}</td>
                            <td>{statusLabels[item.status]}</td>
                            <td>{item.team_names}</td>

                            <td>{item.sales_names}</td>
                            <td>{item.check_note}</td>

                            <td className='fixed-column'>
                                {/* 当状态是待检测时，显示分配按钮 */}
                                {item.status === '0' && (
                                    <Button onClick={() => handleAssignment(item.test_item_id)}>分配</Button>
                                )}
                                <Button onClick={() => handleEdit(item)}>修改</Button>
                                {/* <Button onClick={() => handleDelete(item.test_item_id)}>删除</Button> */}
                            </td>
                        </tr>
                    ));
                    break;
                case 'customerInfo':
                    headers = ["ID", "客户/单位名称", "地址", "联系人名称", "联系人手机号", "邮箱"];
                    rows = currentItems.map((item, index) => (
                        <tr key={index}>
                            <td>{highlightText(item.customer_id, filterData)}</td>
                            <td>{highlightText(item.customer_name, filterData)}</td>
                            <td>{highlightText(item.customer_address, filterData)}</td>
                            <td>{highlightText(item.contact_name, filterData)}</td>
                            <td>{highlightText(item.contact_phone_num, filterData)}</td>
                            <td>{highlightText(item.contact_email, filterData)}</td>
                            <td className='fixed-column'>
                                <Button onClick={() => handleEditCustomer(item)}>修改</Button>
                                <Button variant="danger" onClick={() => handleDelete(item.customer_id)}>删除</Button>


                            </td>
                        </tr>
                    ));
                    break;

                case 'payerInfo':
                    headers = ["ID", "付款方", "地址", "联系人/导师名称", "联系人手机号", "邮箱", "银行名称", "税号", "银行账号", "区域", "单位性质", "当前余额"];
                    rows = currentItems.map((item, index) => (
                        <tr key={index}>
                            <td>{highlightText(item.payment_id, filterData)}</td>
                            <td>{highlightText(item.payer_name, filterData)}</td>
                            <td>{highlightText(item.payer_address, filterData)}</td>
                            <td>{highlightText(item.payer_contact_name, filterData)}</td>
                            <td>{highlightText(item.payer_contact_phone_num, filterData)}</td>
                            <td>{highlightText(item.payer_contact_email, filterData)}</td>
                            <td>{highlightText(item.bank_name, filterData)}</td>
                            <td>{highlightText(item.tax_number, filterData)}</td>
                            <td>{highlightText(item.bank_account, filterData)}</td>
                            <td>{highlightText(item.area, filterData)}</td>
                            <td>{highlightText(item.organization, filterData)}</td>
                            <td>{highlightText(item.balance, filterData)}</td>
                            <td className='fixed-column'>
                                <Button variant="success" onClick={() => handleDeposit(item)}>充值</Button>
                                <Button onClick={() => handleEditPayer(item)}>修改</Button>
                                <Button variant="danger" onClick={() => handleDelete(item.payment_id)}>删除</Button>


                            </td>
                        </tr>
                    ));
                    break;
                case 'transactionHistory':
                    headers = ["客户/单位名称", "联系人/导师名称", "交易类型", "交易金额", "交易后余额", "交易时间", "描述"];
                    rows = currentItems.map((item, index) => (
                        <tr key={index}>
                            <td>{item.payer_name}</td>
                            <td>{item.payer_contact_name}</td>
                            <td>{transactionTypeLabels[item.transaction_type]}</td>
                            <td>{item.amount}</td>
                            <td>{item.balance_after_transaction}</td>
                            <td>{new Date(item.transaction_time).toLocaleString()}</td>
                            <td>{item.description}</td>
                        </tr>
                    ));
                    break;
                default:
                    headers = ["暂无数据"];
                    rows = <tr><td colSpan={headers.length}>No data selected or available</td></tr>;
                    break;
            }
            return { headers, rows };
        }

    };

    const { headers, rows } = renderTable(currentItems);


    return (
        <div className='content-area'>
            <nav>
                <span>{name}({account}),欢迎访问集萃检测管理系统</span>
                <button onClick={onLogout}>登出</button>
            </nav>

            {selected ? (
                selected === 'dataStatistics' ? (
                    <DataStatistics employeeData={employeeStats} equipmentData={equipmentStats} sumPrice={sumPrice} />
                ) : selected === 'timeline' ? (
                    <EquipmentTimeline tasks={equipmentTimeline} equipments={equipments} /> // 显示设备时间线
                ) : (
                    <>
                        <div className='content-head'>
                            <h2>{selected === 'getCommission' ? '委托单信息'
                                : selected === 'getSamples' ? '样品管理'
                                    : selected === 'getTests' || selected === 'handleTests' ? '检测管理'
                                        : selected === 'customerInfo' ? '客户信息'
                                            : selected === 'transactionHistory' ? '交易流水'
                                                : selected === 'getChecked' ? '结算账单明细'
                                                    : '首页'}</h2>
                            {selected === 'handleTests' || selected === 'getTests' ? (
                                <div className="searchBar">
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
                                    <span>筛选委托单号：</span>
                                    <input
                                        type="text"
                                        value={filterOrderNum}
                                        onChange={(e) => setFilterOrderNum(e.target.value)}
                                        placeholder="输入委托单号进行搜索"
                                    />
                                    {role === 'supervisor' || role === 'leader' ? (
                                        <button onClick={() => fetchDataForSupervisor(departmentID)}>查询单号</button>
                                    ) : (
                                        <button onClick={() => fetchDataForEmployee(account)}>查询单号</button>

                                    )}&nbsp;&nbsp;&nbsp;
                                    <span>筛选人员：</span>
                                    <input
                                        type="text"
                                        value={filterEmployee}
                                        onChange={(e) => setFilterEmployee(e.target.value)}
                                        placeholder="输入员工名称进行搜索"
                                    />
                                    <button onClick={() => fetchData('tests')}>查询员工</button>
                                </div>
                            ) : selected === 'getCommission' ? (

                                <div className="searchBar">
                                    <div>
                                        <span>筛选委托单号：</span>
                                        <input
                                            type="text"
                                            value={filterOrderNum}
                                            onChange={(e) => setFilterOrderNum(e.target.value)}
                                            placeholder="输入委托单号进行搜索"
                                        />
                                        <button onClick={() => fetchData('orders')}>查询单号</button>
                                    </div>
                                    {role === 'admin' && (
                                        <div>
                                            多选操作&nbsp;&nbsp;|&nbsp;&nbsp;
                                            <span>开票入账请点：</span>
                                            <button onClick={() => setShowCheckoutModal(true)} disabled={selectedOrders.length === 0}>
                                                一键结算
                                            </button>
                                            <span>导出表格请点：</span>
                                            <button onClick={handleExportCommissionData} disabled={loading}>
                                                {loading ? '正在准备...' : '一键导出'}
                                            </button>
                                        </div>
                                    )}

                                </div>
                            ) : selected === 'getChecked' ? (
                                <div>
                                    <div className="searchBar">
                                        <div>
                                            <span>页面搜索：</span>
                                            <input
                                                type="text"
                                                value={filterData}
                                                onChange={(e) => setFilterData(e.target.value)}
                                                placeholder="搜索"
                                            />
                                            <button onClick={() => fetchInvoices()}>查询</button>
                                            <button onClick={handleExportCheckedData} disabled={loading}>
                                                {loading ? '正在准备...' : '一键导出'}
                                            </button>

                                        </div>

                                    </div>
                                </div>
                            ) : selected === 'customerInfo' ? (
                                <div className="searchBar">
                                    <div>
                                        <span>页面搜索：</span>
                                        <input
                                            type="text"
                                            value={filterData}
                                            onChange={(e) => setFilterData(e.target.value)}
                                            placeholder="搜索"
                                        />
                                        <button onClick={() => fetchPayers()}>查询</button>
                                    </div>
                                </div>
                            ) : selected === 'payerInfo' ? (
                                <div className="searchBar">
                                    <div>
                                        <span>页面搜索：</span>
                                        <input
                                            type="text"
                                            value={filterData}
                                            onChange={(e) => setFilterData(e.target.value)}
                                            placeholder="搜索"
                                        />
                                        <button onClick={() => fetchPayers()}>查询</button>
                                    </div>
                                </div>
                            ) : selected === 'transactionHistory' ? (
                                <div className="searchBar">
                                    <div>
                                        <span>付款方：</span>
                                        <input
                                            type="text"
                                            value={filterPayerName}
                                            onChange={(e) => setFilterPayerName(e.target.value)}
                                            placeholder="输入付款方进行搜索"
                                        />
                                        <button onClick={() => fetchTransactions()}>查询</button>
                                    </div>
                                    <div>
                                        <span>付款/导师联系人：</span>
                                        <input
                                            type="text"
                                            value={filterPayerContactName}
                                            onChange={(e) => setFilterPayerContactName(e.target.value)}
                                            placeholder="输入付款联系人进行搜索"
                                        />
                                        <button onClick={() => fetchTransactions()}>查询</button>
                                    </div>
                                    <div>
                                        <span>交易类型: </span>
                                        <select value={transactionType} onChange={e => setTransactionType(e.target.value)}>
                                            <option value="DEPOSIT">充值</option>
                                            <option value="WITHDRAWAL">消费</option>
                                        </select>
                                    </div>

                                    <div>
                                        <span>筛选月份：</span>
                                        <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                                            <option value="">选择月份</option>
                                            {months.map(({ month }) => (
                                                <option key={month} value={month}>{month}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                </div>
                            )}

                            <Pagination
                                activePage={activePage}
                                itemsCountPerPage={itemsCountPerPage}
                                totalItemsCount={totalItemsCount}
                                onChange={handlePageChange}
                                pageRangeDisplayed={3}
                                innerClass="pagination"
                                itemClass="pagination-item" // 添加样式类
                                linkClass="pagination-link" // 添加样式类
                                hideDisabled={true} // 隐藏不可用的分页链接
                                firstPageText="首页"  // 首页
                                lastPageText="尾页"   // 尾页
                                prevPageText="上一页"
                                nextPageText="下一页"
                            />
                        </div>
                        <div class='content'>
                            {selected === 'getChecked' ? (
                                <table className='invoice-table'>
                                    <thead>
                                        <tr>
                                            <th>
                                                <input
                                                    type="checkbox"
                                                    checked={isAllSelectedInvoices}
                                                    onChange={handleSelectAllInvoices}
                                                />
                                                &nbsp;全选
                                            </th>
                                            {headers.map(header =>

                                                <th key={header}>{header}</th>
                                            )}
                                            <th className="fixed-column">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows}
                                    </tbody>
                                </table>
                            ) : (
                                <table>
                                    <thead>
                                        <tr>
                                            {role === 'admin' && selected === 'getCommission' && (
                                                <th>
                                                    <input
                                                        type="checkbox"
                                                        checked={isAllSelected}
                                                        onChange={handleSelectAll}
                                                    />
                                                    &nbsp;全选
                                                </th>
                                            )}
                                            {headers.map((header, index) =>
                                                <th key={header}
                                                    className={(selected === 'handleTests' && index < 2) ? (index === 0 ? 'order-num-header-fixed' : 'test-item-header-fixed') : ''}

                                                >
                                                    {header}
                                                </th>
                                            )}
                                            {!(
                                                selected === 'transactionHistory' ||
                                                (role === 'sales' && selected === 'getCommission') ||
                                                (role === 'employee' && selected === 'getCommission')
                                            )
                                                && (
                                                    <th className="fixed-column">操作</th>
                                                )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows}
                                    </tbody>
                                </table>
                            )}
                        </div>

                    </>


                )
            ) : (
                <div>
                    <HomePage
                        role={role}
                        assignedNotTestedOrders={data}
                        onShowAssignment={showAssignmentModalHandler}
                        renderDeadlineStatus={renderDeadlineStatus}
                    />
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


            {/* 入账成功的Toast */}
            <Toast onClose={() => setShowAccountSuccessToast(false)} show={showAccountSuccessToast} delay={8000} autohide position="top-end" style={{ position: 'absolute', top: 20, right: 20 }}>
                <Toast.Header>
                    <strong className="me-auto">入账成功</strong>
                    <small>刚刚</small>
                </Toast.Header>
                <Toast.Body>
                    <div>
                        <h1>操作成功！ </h1>
                    </div>

                </Toast.Body>
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
                                value={formatDateToLocal(currentItem.end_time)}
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



            {/* Add Modal */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>添加检测项目信息</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group controlId="orderNum">
                            <Form.Label>委托单号</Form.Label>
                            <Form.Control
                                type="text"
                                value={addData.order_num}
                                disabled
                            />
                        </Form.Group>
                        <Form.Group controlId="formOriginalNo">
                            <Form.Label>样品原号</Form.Label>
                            <Form.Control
                                type="text"
                                value={addData.original_no}
                                onChange={(e) => setAddData({ ...addData, original_no: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group controlId="formTestItem">
                            <Form.Label>检测项目<span style={{ color: 'red' }}>*</span></Form.Label>

                            <Form.Control
                                type="text"
                                value={addData.test_item}
                                onChange={(e) => setAddData({ ...addData, test_item: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group controlId="formTestMethod">
                            <Form.Label>检测方法</Form.Label>
                            <Form.Control
                                type="text"
                                value={addData.test_method}
                                onChange={(e) => setAddData({ ...addData, test_method: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group controlId="formSize">
                            <Form.Label>尺寸</Form.Label>
                            <Form.Control
                                type="text"
                                value={addData.size}
                                onChange={(e) => setAddData({ ...addData, size: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group controlId="formQuantity">
                            <Form.Label>数量<span style={{ color: 'red' }}>*</span></Form.Label>
                            <Form.Control
                                type="number"
                                value={addData.quantity}
                                onChange={(e) => setAddData({ ...addData, quantity: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group controlId="formDeadline">
                            <Form.Label>截止日期</Form.Label>
                            <Form.Control
                                type="number"
                                value={addData.deadline}
                                onChange={(e) => setAddData({ ...addData, deadline: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group controlId="formNote">
                            <Form.Label>备注</Form.Label>
                            <Form.Control
                                type="text"
                                value={addData.note}
                                onChange={(e) => setAddData({ ...addData, note: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group controlId="formDepartmentId">
                            <Form.Label>所属部门<span style={{ color: 'red' }}>*</span></Form.Label>
                            <Form.Control
                                as="select"
                                value={addData.department_id}
                                onChange={(e) => setAddData({ ...addData, department_id: e.target.value })}
                            >
                                <option value="" disabled>---请选择---</option>
                                {departments.map(dept => (
                                    <option key={dept.department_id} value={dept.department_id}>{dept.department_name}</option>
                                ))}
                            </Form.Control>
                            <Form.Group controlId="formName">
                                <Form.Label>业务员</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={addData.name}
                                    disabled
                                />
                            </Form.Group>
                        </Form.Group>

                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddModal(false)}>关闭</Button>
                    <Button variant="primary" onClick={addItem}>添加</Button>
                </Modal.Footer>
            </Modal>



            {/* 编辑样品 */}
            <Modal show={showSampleModal} onHide={() => setShowSampleModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>编辑样品：{currentItem.order_num}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        {/* 样品名称 */}
                        <Form.Group controlId="sampleName">
                            <Form.Label>样品名称</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.sample_name}
                                onChange={(e) => setCurrentItem({ ...currentItem, sample_name: e.target.value })}
                            />
                        </Form.Group>
                        {/* 材料 */}
                        <Form.Group controlId="material">
                            <Form.Label>材料</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.material}
                                onChange={(e) => setCurrentItem({ ...currentItem, material: e.target.value })}
                            />
                        </Form.Group>
                        {/* 货号 */}
                        <Form.Group controlId="productNo">
                            <Form.Label>货号</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.product_no}
                                onChange={(e) => setCurrentItem({ ...currentItem, product_no: e.target.value })}
                            />
                        </Form.Group>
                        {/* 材料规范 */}
                        <Form.Group controlId="materialSpec">
                            <Form.Label>材料规范</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.material_spec}
                                onChange={(e) => setCurrentItem({ ...currentItem, material_spec: e.target.value })}
                            />
                        </Form.Group>
                        {/* 样品处置 */}
                        <Form.Group controlId="sampleSolutionType">
                            <Form.Label>样品处置</Form.Label>
                            <Form.Control
                                as="select"
                                value={sampleSolutionTypeLabels[currentItem.sample_solution_type]}
                                onChange={(e) => setCurrentItem({ ...currentItem, sample_solution_type: e.target.value })}
                            >
                                {Object.entries(sampleSolutionTypeLabels).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                        {/* 材料类型 */}
                        <Form.Group controlId="sampleType">
                            <Form.Label>材料类型</Form.Label>
                            {Object.entries(sampleTypeLabels).map(([key, label]) => (
                                <Form.Check
                                    key={key}
                                    type="checkbox"
                                    label={label}

                                    onChange={(e) => {
                                        const sampleTypeArray = formatSampleType(currentItem.sample_type);
                                        const newSampleType = e.target.checked
                                            ? [parseInt(key)]
                                            : sampleTypeArray.filter(type => type !== parseInt(key));
                                        setCurrentItem({ ...currentItem, sample_type: newSampleType });
                                    }}
                                />
                            ))}
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowSampleModal(false)}>关闭</Button>
                    <Button variant="primary" onClick={updateSample}>保存更改</Button>
                </Modal.Footer>
            </Modal>


            {/* Delete Confirmation */}
            <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>确认删除</Modal.Title>
                </Modal.Header>
                <Modal.Body>你确定要删除这条数据吗？</Modal.Body>
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

                        <Row>
                            {/* 设备分类标签选择（一级菜单，使用select） */}
                            <Col md={6}>
                                <Form.Group controlId="formEquipmentLabel">
                                    <Form.Label>设备分类标签</Form.Label>
                                    <Form.Control
                                        as="select"
                                        value={selectedLabel}
                                        onChange={handleLabelChange}
                                    >
                                        <option value="">---选择设备分类---</option>
                                        {[...new Set(equipments.map(equipment => equipment.equipment_label))].map(equipment_label => (
                                            <option key={equipment_label} value={equipment_label}>
                                                {equipment_label}
                                            </option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>
                            </Col>

                            {/* 设备选择（根据分类标签展示，二级菜单） */}
                            <Col md={6}>
                                <Form.Group controlId="formEquipment">
                                    <Form.Label>设备名称</Form.Label>
                                    <Form.Control
                                        as="select"
                                        value={assignmentData.equipment_id}
                                        onChange={e => setAssignmentData({ ...assignmentData, equipment_id: e.target.value })}
                                        disabled={!selectedLabel} // 如果没有选择分类标签则禁用
                                    >
                                        <option value="">---选择设备---</option>
                                        {filteredEquipments.map(equipment => (
                                            <option key={equipment.equipment_id} value={equipment.equipment_id}>
                                                {equipment.equipment_name} ({equipment.model})
                                            </option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>
                            </Col>
                        </Row>

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


            {/* 转办按钮 */}
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


            {/* 确认按钮 */}
            <Modal show={showRollbackModal} onHide={() => setShowRollbackModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>检测任务回退</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <h1>确定要回退至组长吗？</h1>
                        <p>执行回退操作前请与组长进行沟通。</p>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRollbackModal(false)}>取消</Button>
                    <Button variant="primary" onClick={submitRollback}>回退
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
                        <div className='check-box'>
                            <div>
                                <strong>机时：</strong> {currentItem.machine_hours} 小时
                            </div>
                            <div>
                                <strong>工时：</strong> {currentItem.work_hours} 小时
                            </div>
                        </div>
                        <div>
                            <strong>优惠价格：</strong> ¥ {currentItem.discounted_price}
                        </div>
                        {/* <p className='check-note'>
                            注：审批以后将以交易价"{currentItem.discounted_price}"对该检测客户的余额进行扣款
                        </p> */}
                        <hr></hr>
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
                            <Form.Label>单价 (标准价格=单价×数量)</Form.Label>
                            <Form.Control
                                type="number"
                                value={finishData.listed_price}
                                onChange={e => setFinishData({ ...finishData, listed_price: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>数量</Form.Label>
                            <Form.Control
                                type="number"
                                value={finishData.quantity}
                                onChange={e => setFinishData({ ...finishData, quantity: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>实验备注</Form.Label>
                            <Form.Control
                                type="textarea"
                                value={finishData.test_note}
                                onChange={e => setFinishData({ ...finishData, test_note: e.target.value })}
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

                        <Row>
                            {/* 设备分类标签选择（一级菜单，使用select） */}
                            <Col md={6}>
                                <Form.Group controlId="formEquipmentLabel">
                                    <Form.Label>设备分类标签</Form.Label>
                                    <Form.Control
                                        as="select"
                                        value={selectedLabel}
                                        onChange={handleLabelChange}
                                    >
                                        <option value="">---选择设备分类---</option>
                                        {[...new Set(equipments.map(equipment => equipment.equipment_label))].map(equipment_label => (
                                            <option key={equipment_label} value={equipment_label}>
                                                {equipment_label}
                                            </option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>
                            </Col>

                            {/* 设备选择（根据分类标签展示，二级菜单） */}
                            <Col md={6}>
                                <Form.Group controlId="formEquipment">
                                    <Form.Label>设备名称</Form.Label>
                                    <Form.Control
                                        as="select"
                                        value={finishData.equipment_id}
                                        onChange={e => setFinishData({ ...finishData, equipment_id: e.target.value })}
                                        disabled={!selectedLabel} // 如果没有选择分类标签则禁用
                                    >
                                        <option value="">---选择设备---</option>
                                        {filteredEquipments.map(equipment => (
                                            <option key={equipment.equipment_id} value={equipment.equipment_id}>
                                                {equipment.equipment_name} ({equipment.model})
                                            </option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>
                            </Col>
                        </Row>

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
                <Modal.Body className='detailModal'>
                    <p>委托单号：<span>{selectedDetails.order_num}</span></p>
                    <p>样品原号：<span>{selectedDetails.original_no}</span></p>
                    <p>检测项目：<span>{selectedDetails.test_item}</span></p>
                    <p>尺寸：<span>{selectedDetails.size}</span></p>
                    <p>数量：<span>{selectedDetails.quantity}</span></p>
                    <p>客户备注：<span>{selectedDetails.note}</span></p>
                    <p>实验备注：<span>{selectedDetails.test_note}</span></p>

                    <p>机时：<span>{selectedDetails.machine_hours}</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        工时：<span>{selectedDetails.work_hours}</span></p>
                    <p>标准价格：<span>{selectedDetails.listed_price}</span></p>
                    <p>优惠价格：<span>{selectedDetails.discounted_price}</span></p>
                    <p>设备名称：<span>{selectedDetails.equipment_name}({selectedDetails.model})</span></p>
                    <p>状态：<span>{statusLabels[selectedDetails.status]}</span></p>
                    <p>审批意见：<span>{selectedDetails.check_note}</span></p>
                    <p>创建时间：
                        <span>
                            {selectedDetails.create_time ? new Date(selectedDetails.create_time).toLocaleString() : ''}
                        </span>
                    </p>
                    <p>设备开始时间：
                        <span>
                            {selectedDetails.start_time ? new Date(selectedDetails.start_time).toLocaleString() : ''}
                        </span>
                    </p>
                    <p>设备结束时间：
                        <span>
                            {selectedDetails.end_time ? new Date(selectedDetails.end_time).toLocaleString() : ''}
                        </span>
                    </p>

                    <p>剩余天数：{renderDeadlineStatus(selectedDetails.deadline, selectedDetails.appoint_time)}</p>
                    <FileUpload testItemId={selectedDetails.test_item_id} onCloseAndRefresh={handleCloseAndRefresh} />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>关闭</Button>
                </Modal.Footer>
            </Modal>


            {/* 充值按钮 */}
            <Modal show={showDepositModal} onHide={() => setShowDepositModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>客户充值</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>充值金额:</Form.Label>
                            <Form.Control
                                type="number"
                                value={depositData.amount}
                                onChange={handleDepositChange}
                                step="0.01" // 确保支持小数输入
                                min="0" // 限制输入为非负数
                                max="1000000" // 设置最大金额
                                required
                            />
                            {errorMessage && (
                                <Form.Text className="text-danger">{errorMessage}</Form.Text>
                            )}
                        </Form.Group>
                    </Form>
                    <Form>
                        <Form.Group>
                            <Form.Label>交易描述:</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3} // 设置显示行数，调整文本框的高度
                                name="description"
                                value={depositData.description}
                                onChange={e => setDepositData({ ...depositData, description: e.target.value })}
                                placeholder="请输入交易备注/描述信息"
                            />
                            {errorMessage && (
                                <Form.Text className="text-danger">{errorMessage}</Form.Text>
                            )}
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDepositModal(false)}>取消</Button>
                    <Button variant="success" onClick={submitDeposit}>充值
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* 编辑客户 */}
            <Modal show={showCustomerModal} onHide={() => setShowCustomerModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>编辑客户：{currentItem.customer_name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        {/* 客户名称 */}
                        <Form.Group controlId="customerName">
                            <Form.Label>客户名称</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.customer_name}
                                onChange={(e) => setCurrentItem({ ...currentItem, customer_name: e.target.value })}
                            />
                        </Form.Group>
                        {/* 地址 */}
                        <Form.Group controlId="address">
                            <Form.Label>地址</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.customer_address}
                                onChange={(e) => setCurrentItem({ ...currentItem, customer_address: e.target.value })}
                            />
                        </Form.Group>
                        {/* 联系人名称 */}
                        <Form.Group controlId="contactName">
                            <Form.Label>联系人名称</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.contact_name}
                                onChange={(e) => setCurrentItem({ ...currentItem, contact_name: e.target.value })}
                            />
                        </Form.Group>
                        {/* 联系人手机 */}
                        <Form.Group controlId="contactPhoneNum">
                            <Form.Label>联系人手机</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.contact_phone_num}
                                onChange={(e) => setCurrentItem({ ...currentItem, contact_phone_num: e.target.value })}
                            />
                        </Form.Group>
                        {/* 联系人邮箱 */}
                        <Form.Group controlId="contactEmail">
                            <Form.Label>联系人邮箱</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.contact_email}
                                onChange={(e) => setCurrentItem({ ...currentItem, contact_email: e.target.value })}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCustomerModal(false)}>关闭</Button>
                    <Button variant="primary" onClick={updateCustomer}>保存更改</Button>
                </Modal.Footer>
            </Modal>


            {/* 编辑付款方 */}
            <Modal show={showPayerModal} onHide={() => setShowPayerModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>编辑付款方：{currentItem.payer_name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        {/* 付款方名称 */}
                        <Form.Group controlId="payerName">
                            <Form.Label></Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.payer_name}
                                onChange={(e) => setCurrentItem({ ...currentItem, payer_name: e.target.value })}
                            />
                        </Form.Group>
                        {/* 地址 */}
                        <Form.Group controlId="address">
                            <Form.Label>地址</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.payer_address}
                                onChange={(e) => setCurrentItem({ ...currentItem, payer_address: e.target.value })}
                            />
                        </Form.Group>
                        {/* 付款方电话 */}
                        <Form.Group controlId="payerPhoneNum">
                            <Form.Label>付款方电话</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.payer_phone_num}
                                onChange={(e) => setCurrentItem({ ...currentItem, payer_phone_num: e.target.value })}
                            />
                        </Form.Group>

                        {/* 开户银行 */}
                        <Form.Group controlId="bankName">
                            <Form.Label>开户银行</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.bank_name}
                                onChange={(e) => setCurrentItem({ ...currentItem, bank_name: e.target.value })}
                            />
                        </Form.Group>

                        {/* 税号 */}
                        <Form.Group controlId="taxNumber">
                            <Form.Label>税号</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.tax_number}
                                onChange={(e) => setCurrentItem({ ...currentItem, tax_number: e.target.value })}
                            />
                        </Form.Group>

                        {/* 银行账号 */}
                        <Form.Group controlId="taxNumber">
                            <Form.Label>银行账号</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.bank_account}
                                onChange={(e) => setCurrentItem({ ...currentItem, bank_account: e.target.value })}
                            />
                        </Form.Group>


                        {/* 联系人名称 */}
                        <Form.Group controlId="payerContactName">
                            <Form.Label>联系人名称</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.payer_contact_name}
                                onChange={(e) => setCurrentItem({ ...currentItem, payer_contact_name: e.target.value })}
                            />
                        </Form.Group>
                        {/* 联系人手机 */}
                        <Form.Group controlId="payerContactPhoneNum">
                            <Form.Label>联系人手机</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.payer_contact_phone_num}
                                onChange={(e) => setCurrentItem({ ...currentItem, payer_contact_phone_num: e.target.value })}
                            />
                        </Form.Group>
                        {/* 联系人邮箱 */}
                        <Form.Group controlId="payerContactEmail">
                            <Form.Label>联系人邮箱</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentItem.payer_contact_email}
                                onChange={(e) => setCurrentItem({ ...currentItem, payer_contact_email: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group controlId="area">
                            <Form.Label>所在区域</Form.Label>
                            <Form.Control
                                as="select"
                                value={currentItem.area}
                                onChange={(e) => setCurrentItem({ ...currentItem, area: e.target.value })}
                            >
                                {areas.map((area, idx) => (
                                    <option key={idx} value={area}>{area}</option>
                                ))}
                            </Form.Control>
                        </Form.Group>

                        <Form.Group controlId="organization">
                            <Form.Label>组织性质</Form.Label>
                            <Form.Control
                                as="select"
                                value={currentItem.organization}
                                onChange={(e) => setCurrentItem({ ...currentItem, organization: e.target.value })}
                            >
                                {organizations.map((organization, idx) => (
                                    <option key={idx} value={organization}>{organization}</option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowPayerModal(false)}>关闭</Button>
                    <Button variant="primary" onClick={updatePayer}>保存更改</Button>
                </Modal.Footer>
            </Modal>



            <Modal show={showAlert} onHide={() => setShowAlert(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>错误</Modal.Title>
                </Modal.Header>
                <Modal.Body><pre>{alertMessage}</pre></Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAlert(false)}>关闭</Button>
                </Modal.Footer>
            </Modal>

            {/* 结算Modal */}
            <Modal show={showCheckoutModal} onHide={() => setShowCheckoutModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>结算确认</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>确认结算选中的 {selectedOrders.length} 个委托单吗？</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCheckoutModal(false)}>取消</Button>
                    <Button variant="primary" onClick={handleCheckout}>确认结算</Button>
                </Modal.Footer>
            </Modal>

            {/* 设置最终价按钮 */}
            <Modal show={showFinalPriceModal} onHide={() => setShowFinalPriceModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>开票价格填写</Modal.Title>
                </Modal.Header>
                <Modal.Body>

                    <Form>
                        <Form.Group>
                            <Form.Label>请输入开票的总价格：（精确到两位小数）</Form.Label>

                            <Form.Control
                                type="number"
                                onChange={(e) => setFinalPrice(e.target.value)}>
                            </Form.Control>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowFinalPriceModal(false)}>取消</Button>
                    <Button variant="success" onClick={() => submitFinalPrice(currentItem.invoiceId)}>设置价格</Button>

                </Modal.Footer>
            </Modal>

            {/* 设置最终价按钮 */}
            <Modal show={showAccountModal} onHide={() => setShowAccountModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>入账信息填写</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>请输入发票号(必填)</Form.Label>
                            <Form.Control
                                type="number"
                                onChange={(e) => setInvoiceNumber(e.target.value)}>
                            </Form.Control>
                        </Form.Group>
                        <hr style={{ borderWidth: '3px' }}></hr>
                        <Form.Group>
                            <Form.Label style={{ color: 'red' }}>请再次确认扣款信息！</Form.Label>
                            <p>客户名称：
                                <strong>
                                    {currentItem.order_details ? currentItem.order_details[0].customer_name : '未提供'}
                                </strong>
                            </p>
                            <p>付款方/导师: <strong>
                                {currentItem.order_details ?
                                    `${currentItem.order_details[0].payer_name} | ${currentItem.order_details[0].payer_contact_name}
                                (Tel: ${currentItem.order_details[0].payer_contact_phone_num})`
                                    : '未提供'}
                            </strong>
                            </p>
                            <p>最终开票价格:
                                <strong>
                                    {currentItem.order_details ?
                                        `${currentItem.order_details[0].final_price}`
                                        : '未提供'}
                                </strong>
                            </p>

                        </Form.Group>

                        <Form.Group>
                            <Form.Label>请输入备注描述(选填)</Form.Label>
                            <Form.Control
                                type="textarea"
                                onChange={(e) => setDescription(e.target.value)}>
                            </Form.Control>
                        </Form.Group>

                        {/* 入账时间 */}
                        <Form.Group controlId="accountTime">
                            <Form.Label>入账时间</Form.Label>
                            <Form.Control
                                type="datetime-local"
                                value={accountTime}
                                onChange={e => setAccountTime(e.target.value)}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAccountModal(false)}>取消</Button>
                    <Button variant="success" onClick={() => submitAccount(currentItem.invoice_id)}>扣款并入账</Button>

                </Modal.Footer>
            </Modal>


            <Modal show={showExcelExportModal} onHide={() => setShowExcelExportModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>导出</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    请选择导出格式为：
                    <br></br>
                    {checkedData && <ExportExcelButton data={checkedData.data} headers={checkedData.headers} filename={checkedData.filename} />}
                    {commissionData && <ExportExcelButton data={commissionData.data} headers={commissionData.headers} filename={commissionData.filename} />}

                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowExcelExportModal(false)}>关闭</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ContentArea;
