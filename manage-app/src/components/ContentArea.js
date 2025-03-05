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
import Timeline from 'react-calendar-timeline';
import "react-calendar-timeline/styles.css";
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
    const [yearlyPriceStats, setYearlyPriceStats] = useState([]);
    const [sumPrice, setSumPrice] = useState('');
    const [equipmentTimeline, setEquipmentTimeline] = useState([]);
    const [accountTime, setAccountTime] = useState([]);
    const [checkoutTime, setCheckoutTime] = useState([]);
    const [filterCustomer, setFilterCustomer] = useState('');
    const [filterOrderNum, setFilterOrderNum] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [description, setDescription] = useState('');
    const [filterData, setFilterData] = useState('');
    const [activePage, setActivePage] = useState(1);
    const [finalPrice, setFinalPrice] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [periodOptions, setPeriodOptions] = useState([]);
    const [months, setMonths] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState();  // 存储具体选中的月份、季度或年份

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
    const [deliverTest, setDeliverTest] = useState({});
    // const [showEquipmentSchedule, setShowEquipmentSchedule] = useState(false); // 控制设备预约视图的显示
    const [equipmentReservations, setEquipmentReservations] = useState([]); // 设备预约数据
    const [selectedItem, setSelectedItem] = useState(null); // 存储当前选中的条目信息
    const [isEditMode, setIsEditMode] = useState(false); // 控制预约功能是否为编辑模式
    const [reservationDeptId, setReservationDeptId] = useState('');
    const [timelineKey, setTimelineKey] = useState(0);
    const [editingRow, setEditingRow] = useState(null); // 存储当前正在编辑的行
    const [editingValue, setEditingValue] = useState(""); // 存储当前输入框的值
    const [filteredData, setFilteredData] = useState(""); // 存储选择预约设备时候的检测项目
    const [myReservationInfo, setMyReservationInfo] = useState(""); // 存储选择预约设备时候的检测项目
    const [editingPrice, setEditingPrice] = useState(false); // 存储选择预约设备时候的检测项目
    // const [editingMachineHours, setEditingMachineHours] = useState(false);
    const [timePeriod, setTimePeriod] = useState('month'); // 按月、季度、年筛选数据统计
    const [timeStatus, setTimeStatus] = useState('month'); // 按月、季度、年筛选数据统计
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
    // const [showFinalPriceModal, setShowFinalPriceModal] = useState(false);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showExcelExportModal, setShowExcelExportModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [handleDeliverModal, setHandleDeliverModal] = useState(false);
    const [showSingleReservationModal, setShowSingleReservationModal] = useState(false);
    const [showAccountSuccessModal, setShowAccountSuccessModal] = useState(false); // 控制Toast显示的状态
    const [publicReserveModal, setPublicReserveModal] = useState(false); // 控制Toast显示的状态


    //分页
    const itemsCountPerPage = 20;
    const totalItemsCount = data.length;
    const indexOfLastItem = activePage * itemsCountPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsCountPerPage;
    const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);

    const totalReservationCount = myReservationInfo.length;
    const lastRes = activePage * itemsCountPerPage;
    const firstRes = lastRes - itemsCountPerPage
    const reservationPaging = myReservationInfo.slice(firstRes, lastRes);

    //领导点击分配时候的数据
    const [assignmentData, setAssignmentData] = useState({
        equipment_id: '',
        start_time: '',
        end_time: ''
    });

    //员工点击完成时候的数据
    const [finishData, setFinishData] = useState({
        test_item: '',
        machine_hours: '',
        work_hours: '',
        operator: account, // 默认为当前登录的账户
        equipment_id: '',
        quantity: '',
        test_note: '',
        listed_price: '',
        unit_price: ''
    });

    const [reserveData, setReserveData] = useState({
        equipment_id: '',
        start_time: '',
        end_time: ''
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

    //充值数据
    const [rollbackData, setRollbackData] = useState({
        note: '',
    });

    //检测项目状态标签
    const statusLabels = {
        0: '待分配',
        1: '已分配待检测',
        2: '已检测待审批',
        3: '审批通过',
        4: '审批失败',
        5: '已交付',
        6: '客户驳回'

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



    // const headerLabelFormats = {
    //     yearShort: "YY年",
    //     yearLong: "YYYY年",
    //     monthShort: "MM月",
    //     monthMedium: "YYYY年MM月",
    //     monthMediumLong: "YYYY年MMM",
    //     monthLong: "YYYY年MMMM",
    //     dayShort: "MM/DD",
    //     dayLong: "YYYY年MM月DD日",
    //     hourShort: "HH点",
    //     hourMedium: "HH点",
    //     hourMediumLong: "YYYY年MM月DD日 HH点",
    //     hourLong: "YYYY年MM月DD日 HH点",
    //     time: "YYYY年MM月DD日 HH点mm分"
    // };

    // const subHeaderLabelFormats = {
    //     yearShort: "YY",
    //     yearLong: "YYYY",
    //     monthShort: "MM",
    //     monthMedium: "MMM",
    //     monthLong: "MMMM",
    //     dayShort: "D日",
    //     dayMedium: "MM月D日",
    //     dayMediumLong: "MM月DD日",
    //     dayLong: "YYYY年MM月DD日",
    //     hourShort: "HH时",
    //     hourLong: "HH点mm分",
    //     minuteShort: "mm分",
    //     minuteLong: "HH点mm分"
    // };


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
            if (filterCustomer) {
                params.append('customerName', filterCustomer); // 添加员工名称到请求参数
            }
            if (departmentID) {
                params.append('departmentId', departmentID);
            }
            if (filterData) {
                params.append('filterData', filterData);
            }
            const response = await axios.get(`${config.API_BASE_URL}/api/${endpoint}?${params}`);
            if (response.data) {
                const sortedData = response.data.sort((a, b) => {
                    const numA = parseInt(a.order_num.substring(2)); // 提取数字部分进行比较
                    const numB = parseInt(b.order_num.substring(2));
                    return numA - numB;
                });
                setData(sortedData);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to fetch data'); // 更新错误状态
            setTimeout(() => setError(''), 3000); // 3秒后清除错误消息
        }
    }, [setError, filterStatus, selectedMonth, filterCustomer, filterOrderNum, departmentID, filterData]);

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
            if (filterCustomer) {
                params.append('customerName', filterCustomer); // 添加员工名称到请求参数
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
    }, [filterStatus, selectedMonth, filterCustomer, filterOrderNum]);

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
            } else if (role === 'sales') {
                params.append('role', role);
            }

            if (filterOrderNum) {
                params.append('orderNum', filterOrderNum); // 添加员工名称到请求参数
            }
            if (filterCustomer) {
                params.append('customerName', filterCustomer); // 添加员工名称到请求参数
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
    }, [role, account, filterStatus, setError, selectedMonth, filterCustomer, filterOrderNum]);

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


    //拉取业务委托信息
    const fetchOrdersForSales = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filterData) {
                params.append('filterData', filterData);
            }
            if (account !== 'YW001') {
                params.append('account', account);
            }
            const response = await axios.get(`${config.API_BASE_URL}/api/orders/sales?${params}`);
            const results = response.data;
            setData(results);
        } catch (error) {
            console.error('拉取业务委托单错误:', error);
        }
    }, [account, filterData]);


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
            if (role === 'supervisor') {
                users.push({ name, account });
            }
            setAssignableUsers(users);
            if (users && users.length > 0) {
                setAssignmentInfo(users[0].account); // 设置默认选项为列表的第一个账号
            } else {
                setAssignmentInfo(''); // 如果没有可分配用户，清空当前选择
            }
        } catch (error) {
            console.error('Failed to fetch assignable users:', error);
        }
    }, [role, departmentID, account, name]);

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
            const response = await axios.get(`${config.API_BASE_URL}/api/charts/statistics?departmentId=${departmentID}&timePeriod=${timePeriod}`);
            const { employeeStats, equipmentStats, totalPriceStats } = response.data;
            const formattedEmployee = employeeStats.map(item => ({
                name: item.name,
                //value: parseFloat(item.total_machine_hours),  // Assuming you want to visualize machine hours
                total_machine_hours: parseFloat(item.total_machine_hours),
                total_work_hours: parseFloat(item.total_work_hours),
                total_samples: parseFloat(item.total_samples),
                total_listed_price: parseFloat(item.total_listed_price),
                year: item.year,
                month: item.month,
                quarter: item.quarter
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
            setYearlyPriceStats(totalPriceStats);
            setSumPrice(totalPrice);
        } catch (error) {
            console.error('Error fetching statistics data:', error);
        }
    }, [departmentID, timePeriod])

    // 用于更改时间筛选条件
    const handleTimePeriodChange = async (e) => {
        const selectedPeriod = e.target.value;
        setTimePeriod(selectedPeriod);
        //选择时间段以后，存储当前查询的时间段
        setTimeStatus(selectedPeriod);
        setSelectedPeriod('');
        await fetchTimePeriods(selectedPeriod);
    };

    const handlePeriodChange = async (e) => {
        setTimePeriod(e.target.value);
        fetchStatistics(); 
        fetchTimePeriods(timeStatus)
    };
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

    const fetchTimePeriods = useCallback(async (selectedPeriod) => {
        try {
            const response = await axios.get(`${config.API_BASE_URL}/api/months/time-periods?timePeriod=${selectedPeriod}`);
            setPeriodOptions(response.data);

        } catch (error) {
            console.error('Error fetching time periods:', error);
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

    //拉取预约时间           
    const fetchEquipmentSchedule = useCallback(async () => {
        try {
            const deptId = (departmentID === 4 || role === 'admin') ? reservationDeptId : departmentID;

            if (deptId) {
                const response = await axios.get(`${config.API_BASE_URL}/api/tests/equipments/schedule?departmentId=${deptId}`);
                setEquipmentReservations(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch equipment schedule:', error);
        }
    }, [departmentID, reservationDeptId, role]);

    // 将预约记录转换为 Timeline items 格式
    const equipmentTimelineItems = equipmentReservations.flatMap((reservation, index) =>
        reservation.reservations.map((item, itemIndex) => ({
            id: `${reservation.equipment_id}-${itemIndex}`, // 唯一ID，组合设备ID和预约的索引
            group: reservation.equipment_id, // 设备ID
            title: `${item.order_num}-${item.test_item}-${item.customer_name}(${item.contact_name})-${item.sales_name}`, // 设备名称作为标题
            start_time: new Date(item.start_time).getTime(), // 预约的开始时间
            end_time: new Date(item.end_time).getTime(), // 预约的结束时间
        }))
    );


    // 设备分组
    const groups = equipmentReservations.map(reservation => ({
        id: reservation.equipment_id,
        title: `${reservation.equipment_name}(${reservation.equipment_label})` // 使用设备名称作为标题
    }));


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

    //拉取预约时间           
    const fetchMyReservation = useCallback(async () => {
        try {
            const response = await axios.get(`${config.API_BASE_URL}/api/reservations/myReservation`, {
                params: { account: account }  // 将账号传递给后端
            });
            setMyReservationInfo(response.data.reservations);
        } catch (error) {
            console.error('Failed to fetch my reservation:', error);
        }
    }, [account]);


    useEffect(() => {
        if ((role === 'employee')) {
            if (selected === 'timeline') {
                fetchTimeline()
            } else if (selected === 'getCommission') {
                fetchData('orders');
            } else if(selected === 'handleTests'){
                fetchTimePeriods('month');
                fetchDataForEmployee(account);
            } else if (selected === 'getReservation'){
                fetchDataForEmployee(account);
            } else if (selected === ''){
                fetchDataForEmployee(account);
            }
        } else if (role === 'supervisor' || role === 'leader') {
            fetchTimePeriods(timeStatus)
            if (selected === 'dataStatistics') {
                fetchStatistics()
            } else if (selected === 'timeline') {
                fetchTimeline()
            } else if (selected === 'getCommission') {
                fetchData('orders');
            } else if (selected === 'handleTests'){
                fetchTimePeriods('month');
                fetchDataForSupervisor(departmentID);
            } else if (selected === 'getReservation' || selected === ''){
                fetchDataForSupervisor(departmentID);
            }
        } else if (role === 'sales') {
            fetchTimePeriods('month');
            if (selected === 'timeline') {
                fetchTimeline()
            } else if (selected === 'getCommission') {
                fetchOrdersForSales();
            } else {
                if (account === 'YW001') {
                    fetchDataForSupervisor()
                } else {
                    fetchDataForEmployee(account);
                }
            }
        } else {
            // 管理员情况
            if (selected === 'getCommission') {
                fetchData('orders');
            } else if (selected === 'getSamples') {
                fetchData('samples');
            } else if (selected === 'getTests') {
                fetchData('tests');
                fetchTimePeriods('month');
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
        fetchMyReservation();
        fetchEquipmentSchedule(); // 拉取新的预约数据
        setTimelineKey((prevKey) => prevKey + 1);
        const savedPage = localStorage.getItem('currentPage');
        if (savedPage) {
            setActivePage(parseInt(savedPage, 10)); // 从localStorage中读取页码，并确保转换为整数
        }

    }, [selected,
        account,
        departmentID,
        role,
        groupId,
        timeStatus,
        fetchData,
        fetchDataForEmployee,
        fetchDataForSupervisor,
        fetchAssignableUsers,
        fetchGroupUsers,
        fetchEquipments,
        fetchStatistics,
        fetchTimeline,
        fetchTimePeriods,
        fetchTransMonths,
        fetchCustomers,
        fetchTransactions,
        fetchInvoices,
        fetchPayers,
        fetchOrdersForSales,
        fetchEquipmentSchedule,
        fetchMyReservation,
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

    const handleRollBack = (item) => {
        setRollbackData({
            test_item_id: item.test_item_id,
            note: item.note
        });
        setShowRollbackModal(true);
    };



    const handleCheck = (item) => {
        setCurrentItem(item); // 假设我们需要订单号来处理分配
        setShowCheckModal(true);
    };

    const handleFinish = (item) => {
        setFinishData({
            test_item: item.test_item,
            test_item_id: item.test_item_id, // 保存当前项目ID以便提交时使用
            machine_hours: item.machine_hours,
            work_hours: item.work_hours,
            operator: account,
            equipment_id: item.equipment_id,
            equipment_name: item.equipment_name,
            model: item.model,
            quantity: item.quantity,
            test_note: item.test_note,
            listed_price: '',
            unit_price: item.unit_price
        });
        setShowFinishModal(true);
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

    // 执行Excel导出委托单的操作
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
                "total_listed_price": "委托总金额",
                "total_discounted_price": "业务总价",
                "name": "业务员",
                "area": "区域",
                "organization": "客户性质"
            };
            // 使用映射表调整 data 中的字段名
            const mappedData = data.map(item => {
                const mappedItem = {};
                Object.keys(item).forEach(key => {
                    const mappedKey = fieldMapping[key] || key;  // 如果有映射字段名就使用映射值，否则保持原字段名
                    let value = item[key];
                    if (key === 'order_status') {
                        mappedItem[mappedKey] = orderStatusLabels[value] || '';  // 如果没有找到对应状态，则设置为空
                    }
                    else if (key === 'service_type') {
                        mappedItem[mappedKey] = serviceTypeLabels[value] || '';  // 如果没有找到对应状态，则设置为空
                    }
                    else {
                        mappedItem[mappedKey] = value;  // 其他字段保持原值
                    }
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
                "委托总金额",
                "业务总价",
                "业务员",
                "区域",
                "客户性质"];
            setCommissionData({ data: mappedData, headers, filename: "委托单统计" });
            setShowExcelExportModal(true);

        } catch (error) {
            console.error("导出数据失败:", error);
        } finally {
            setLoading(false);
        }
    };

    // 执行Excel导出检测项目的操作
    const handleExportTestData = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${config.API_BASE_URL}/api/tests/exportTestData`, { selectedOrders });
            const data = response.data;
            // 定义字段名映射，将英文字段名转换为中文
            const fieldMapping = {
                "order_num": "委托单号",
                "test_item": "检测项目",
                "customer_name": "委托单位",
                "contact_name": "联系人",
                "check_note": "审批意见",
                "create_time": "创建时间",
                "deadline": "截止时间",
                "department_id": "所属部门",
                "test_note": "检测备注",
                "order_status": "订单状态",
                "listed_price": "标准价格",
                "discounted_price": "业务价格",
                "start_time": "预约开始时间",
                "end_time": "预约结束时间",
                "equipment_name": "设备名称",
                "model": "设备型号",
                "hasAttachments": "附件",
                "machine_hours": "机时",
                "work_hours": "工时",
                "original_no": "样品原号",
                "test_method": "检测方法",
                "manager_names": "负责人",
                "team_names": "检测员",
                "sales_names": "业务员",
                "size": "尺寸",
                "quantity": "数量",
                "note": "客户备注",
                "status": "状态",
                "appoint_time": "分配时间",
            };
            // 使用映射表调整 data 中的字段名
            const mappedData = data.map(item => {
                const mappedItem = {};
                Object.keys(item).forEach(key => {
                    const mappedKey = fieldMapping[key] || key;
                    let value = item[key];

                    // 转换订单状态
                    if (key === 'status') {
                        mappedItem[mappedKey] = statusLabels[value] || '';  // 如果没有找到对应状态，则设置为空
                    }
                    // 转换部门名称
                    else if (key === 'department_id') {
                        const department = departments.find(department => department.department_id === value);
                        mappedItem[mappedKey] = department ? department.department_name : '';  // 找不到部门时为空
                    }
                    // 转换时间格式
                    else if (['create_time', 'start_time', 'end_time', 'appoint_time'].includes(key)) {
                        mappedItem[mappedKey] = formatDateToLocal(value); // 调用你定义的 formatDateToLocal 函数
                    }
                    else {
                        mappedItem[mappedKey] = value;  // 其他字段保持原值
                    }
                });
                return mappedItem;
            });
            const headers = [
                "委托单号",
                "检测项目",
                "委托单位",
                "联系人",
                "审批意见",
                "创建时间",
                "截止时间",
                "所属部门",
                "检测备注",
                "订单状态",
                "标准价格",
                "业务价格",
                "预约开始时间",
                "预约结束时间",
                "设备名称",
                "设备型号",
                "附件",
                "机时",
                "工时",
                "样品原号",
                "检测方法",
                "负责人",
                "检测员",
                "业务员",
                "尺寸",
                "数量",
                "状态",
                "分配时间"
            ];
            setCommissionData({ data: mappedData, headers, filename: "检测项目统计" });
            setShowExcelExportModal(true);

        } catch (error) {
            console.error("导出数据失败:", error);
        } finally {
            setLoading(false);
        }
    }


    // 执行Excel导出检测项目的操作
    const handleExportTestDataForSales = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${config.API_BASE_URL}/api/tests/exportTestDataForSales`, { selectedOrders });
            const data = response.data;
            // 定义字段名映射，将英文字段名转换为中文
            const fieldMapping = {
                "create_time": "收样日期",
                "order_num": "任务编号",
                "test_item": "检测项目",
                "quantity": "数量",
                "machine_hours": "机时",
                "listed_price": "标准价格",
                "note": "客户备注",
                "customer_name": "委托单位",
                "contact_name": "联系人",
            };
            // 使用映射表调整 data 中的字段名
            const mappedData = data.map(item => {
                const mappedItem = {};
                Object.keys(item).forEach(key => {
                    const mappedKey = fieldMapping[key] || key;
                    let value = item[key];
                    // 转换时间格式
                    if (['create_time', 'start_time', 'end_time', 'appoint_time'].includes(key)) {
                        mappedItem[mappedKey] = formatDateToLocal(value); // 调用你定义的 formatDateToLocal 函数
                    }
                    else {
                        mappedItem[mappedKey] = value;  // 其他字段保持原值
                    }
                });
                return mappedItem;
            });
            const headers = [
                "收样日期",
                "任务编号",
                "检测项目",
                "单价",
                "数量",
                "机时",
                "标准价格",
                "客户备注",
                "委托单位",
                "联系人",

            ];
            setCommissionData({ data: mappedData, headers, filename: "检测项目统计" });
            setShowExcelExportModal(true);

        } catch (error) {
            console.error("导出数据失败:", error);
        } finally {
            setLoading(false);
        }
    }

    // 执行结算操作
    const handleCheckout = async () => {
        try {
            if (checkoutTime.length === 0) {
                setAlertMessage("入账时间未填写！");
                setShowAlert(true);
            } else {
                // 发送请求到后端检查每个订单的交易价格
                setShowCheckoutModal(false);
                const response = await axios.post(`${config.API_BASE_URL}/api/orders/checkout`, {
                    orderNums: selectedOrders,
                    checkoutTime: checkoutTime
                });
                if (response.data.success) {
                    // 如果结算成功，更新状态
                    setShowSuccessToast(true); // 显示成功提示
                    setTimeout(() => setShowSuccessToast(false), 3000);
                    fetchData('orders');
                    setSelectedOrders([]);
                }
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
            test_item: item.test_item,
            test_item_id: item.test_item_id, // 保存当前项目ID以便提交时使用
            machine_hours: item.machine_hours,
            work_hours: item.work_hours,
            operator: account,
            equipment_id: item.equipment_id,
            equipment_name: item.equipment_name,
            model: item.model,
            quantity: item.quantity,
            test_note: item.test_note,
            listed_price: '',
            unit_price: item.unit_price
        });
        setShowFinishModal(true);
    };

    const handleCloseFinishModal = () => {
        setShowFinishModal(false);
    };

    //完成按钮
    const handleFinishTest = async () => {
        const { test_item_id, machine_hours, work_hours, operator, equipment_id, quantity, test_note, calculated_price } = finishData;
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
            const response = await axios.post(`${config.API_BASE_URL}/api/tests/update-status`, {
                testId: test_item_id,
                status: 2,  // 标记为已检测
                machine_hours,
                work_hours,
                operator,
                equipment_id,
                quantity,
                test_note,
                listed_price: calculated_price,
            });
            if (response.status === 200) {
                setShowFinishModal(false); // 成功后关闭 Modal
                setShowSuccessToast(true); // 显示成功提示
                setTimeout(() => setShowSuccessToast(false), 3000);
                // 根据 role 和 selected 的值直接调用相应的 fetchData 函数
                if (role === 'employee') {
                    fetchDataForEmployee(account); // 重新获取该员工分配的测试数据
                } else if (role === 'supervisor') {
                    fetchDataForSupervisor(departmentID)
                } else {
                    fetchData(selected); // 对于非 handleTests 的情况，根据 selected 重新获取数据
                }
            } else {
                setError('点击完成操作失败。请联系技术支持');
                setTimeout(() => setError(''), 3000);
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
    // const handleAddFinalPrice = (invoiceId) => {
    //     setCurrentItem({ invoiceId });
    //     setShowFinalPriceModal(true);
    // }

    const handleAccount = (item) => {
        setCurrentItem(item);
        setShowAccountModal(true);
    }

    const handleRollbackAccount = async (item) => {
        if (!window.confirm('请确认是否要回退，回退后不会删除委托单。')) {
            return;  // 用户点击取消后，不执行任何操作
        }
        try {
            const response = await axios.post(`${config.API_BASE_URL}/api/orders/rollbackAccount`, {
                invoice_id: item.invoice_id,
            });
            if (response.status === 200) {
                setShowSuccessToast(true); // 显示成功提示
                setTimeout(() => setShowSuccessToast(false), 3000);
                fetchInvoices();
            } else {
                setError("回退操作失败。请重试或联系技术支持");
                setTimeout(() => setError(''), 3000);
            }
        } catch (error) {
            console.error('Error rollback orders:', error);
            setError('Failed to rollback orders'); // 更新错误状态
            setTimeout(() => setError(''), 3000); // 3秒后清除错误消息
        }

    }


    // 设置标价
    // const handleQuote = async (testItemId) => {
    //     const newPrice = prompt("请输入标准价格:");
    //     if (newPrice && !isNaN(parseFloat(newPrice))) {
    //         try {
    //             await axios.patch(`${config.API_BASE_URL}/api/tests/${testItemId}/price`, { listedPrice: newPrice });
    //             fetchDataForSupervisor(departmentID); // 重新获取数据以更新UI
    //         } catch (error) {
    //             console.error('Error updating price:', error);
    //         }
    //     } else {
    //         alert("请输入有效的价格");
    //     }
    // };


    // 设置优惠价
    // const handleDiscount = async (testItemId) => {
    //     const newPrice = prompt("请输入优惠价格:");
    //     if (newPrice && !isNaN(parseFloat(newPrice))) {
    //         try {
    //             await axios.patch(`${config.API_BASE_URL}/api/tests/${testItemId}/discount`, { discountedPrice: newPrice });
    //             fetchDataForEmployee(account); // 重新获取数据以更新UI
    //         } catch (error) {
    //             console.error('Error updating price:', error);
    //         }
    //     } else {
    //         alert("请输入有效的价格");
    //     }
    // };

    // 交付
    const handleDeliver = async (item) => {
        setDeliverTest(item);
        setHandleDeliverModal(true);
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
            setSelectedOrders(data.map(item => item.order_num));  // 全选所有委托单号
        }
        setIsAllSelected(!isAllSelected);  // 切换全选状态
    };

    //处理检测项目全选按钮
    const handleSelectAllTest = () => {
        if (isAllSelected) {
            setSelectedOrders([]);  // 如果已经全选，则取消全选
        } else {
            setSelectedOrders(data.map(item => item.test_item_id));  // 全选所有委托单号
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

    //获取设备预约时间线
    // const toggleScheduleView = () => {
    //     setShowEquipmentSchedule(!showEquipmentSchedule);
    // };


    // 点击条目时触发
    const handleItemClick = (itemId) => {

        // 拆分 itemId，获取 equipment_id 和预约索引
        const [equipment_id, itemIndex] = itemId.split("-");

        // 在 equipmentReservations 中找到匹配的设备
        const reservation = equipmentReservations.find(
            (r) => r.equipment_id === parseInt(equipment_id, 10) // 将字符串转换为数字比较
        );

        if (reservation && reservation.reservations[itemIndex]) {
            // 获取选中的预约记录
            const selectedReservation = reservation.reservations[itemIndex];

            // 存储选中的预约信息
            setSelectedItem({
                equipment_name: reservation.equipment_name, // 设备名称
                order_num: selectedReservation.order_num,
                test_item: selectedReservation.test_item,
                start_time: selectedReservation.start_time, // 预约开始时间
                end_time: selectedReservation.end_time, // 预约结束时间
                equip_user: `${selectedReservation.equip_user_name}(${selectedReservation.equip_user})`,
                operator: `${selectedReservation.operator_name}(${selectedReservation.operator})`

            });
            setShowSingleReservationModal(true);
        } else {
            console.error("未找到对应的条目");
        }
    };


    // 定义点击按钮时更新部门 ID 的函数
    const handleDepartmentClick = (deptId) => {
        setReservationDeptId(deptId); // 更新部门 ID
    };

    // 定义点击设备预约后的模块
    const handleReserve = () => {
        const filteredData = data.filter(item => item.status === '0' || item.status === '1')
        setFilteredData(filteredData);
        setPublicReserveModal(true);
    }
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


    const handleDoubleClick = (index, initialValue) => {
        setEditingRow(index);
        setEditingValue(initialValue);
    };

    const handleBlurOrSave = async (item, newValue) => {
        // 停止编辑模式
        setEditingRow(null);

        // 如果值未更改，则不执行更新操作
        if (item.discounted_price === newValue) return;

        // 更新逻辑
        if (newValue && !isNaN(parseFloat(newValue))) {
            try {
                await axios.patch(`${config.API_BASE_URL}/api/tests/${item.test_item_id}/discount`, { discountedPrice: newValue });
                fetchDataForEmployee(account); // 重新获取数据以更新UI
            } catch (error) {
                console.error('Error updating price:', error);
            }
        } else {
            alert("请输入有效的价格");
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
            let endpoint = '';
            let fetchFunction = () => { };  // Function to fetch updated data after deletion

            // Determine the API endpoint and fetch function based on selection
            if (selected === 'getTests') {
                endpoint = `/api/tests/${currentItem.identifier}`;
                fetchFunction = () => fetchData('tests');
            } else if (selected === 'getCommission') {
                endpoint = `/api/orders/${currentItem.identifier}`;
                fetchFunction = () => fetchData("orders");
            } else if (selected === 'customerInfo') {
                endpoint = `/api/customers/${currentItem.identifier}`;
                fetchFunction = () => fetchCustomers();
            } else if (selected === 'payerInfo') {
                endpoint = `/api/payers/${currentItem.identifier}`;
                fetchFunction = () => fetchPayers();
            }

            // Make the delete request
            if (endpoint) {
                const response = await axios.delete(`${config.API_BASE_URL}${endpoint}`);
                // Check if the response status is 200 (success)
                if (response.status === 200) {
                    setShowSuccessToast(true);  // Show success toast
                    setShowDeleteConfirm(false);  // Close confirmation modal
                    fetchFunction();  // Fetch updated data
                } else {
                    // Handle case where response status is not 200
                    console.error('Failed to delete item, status:', response.status);
                }
            }
        } catch (error) {
            console.error('Error deleting order:', error);
        }
    };

    const submitAssignment = async () => {
        try {

            const payload = {
                testItemId: currentItem.testItemId ? currentItem.testItemId : testId,
                assignmentInfo,
                equipment_id: assignmentData.equipment_id,
                // start_time: assignmentData.start_time,
                // end_time: assignmentData.end_time,
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
    };

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
        const { test_item_id, note } = rollbackData;
        try {
            await axios.post(`${config.API_BASE_URL}/api/tests/rollback`,
                {
                    testItemId: test_item_id,
                    note: note,
                    account
                });
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
            orderNum: currentItem.order_num,
            listedPrice: currentItem.listed_price,
            machine_hours: currentItem.machine_hours
        };
        updateTestStatus(payload);
    };

    //交付
    const deliver = async (testItemId) => {
        try {
            const response = await axios.patch(`${config.API_BASE_URL}/api/tests/${testItemId}/deliver`, { status: '5' });
            if (response.status === 200) {
                setShowSuccessToast(true); // Show success message
                setTimeout(() => setShowSuccessToast(false), 3000);
                setHandleDeliverModal(false);
                fetchDataForEmployee(account); // 重新获取数据以更新UI
            } else {
                setError('交付操作超时！请重试或联系技术支持');
                setTimeout(() => setError(''), 3000);
            }
        } catch (error) {
            setError('交付操作失败');
            setTimeout(() => setError(''), 3000);
            console.error('Error delivering:', error);
        }
    };


    const submitReservation = async (item) => {
        try {
            item.operator = account;
            // **前端验证：检查结束时间是否晚于开始时间**
            if (new Date(item.end_time) <= new Date(item.start_time)) {
                setAlertMessage("结束时间必须晚于开始时间，请重新选择时间。");
                setShowAlert(true);
                return; // 阻止提交
            }
            // 先检查设备是否有时间冲突
            const checkResponse = await axios.get(`${config.API_BASE_URL}/api/reservations/checkTimeConflict`, {
                params: {
                    equipment_id: item.equipment_id,
                    start_time: item.start_time,
                    end_time: item.end_time,
                    reservation_id: item.reservation_id || null,
                }
            });
            if (checkResponse.data.conflict) {
                // 如果有冲突，提示用户冲突的设备预约时间
                const conflictMessage = checkResponse.data.conflictDetails.map(
                    (item) => `${item.test_item}(${item.order_num}): \n${new Date(item.start_time).toLocaleString()} 到 ${new Date(item.end_time).toLocaleString()}`
                ).join('\n');
                setAlertMessage(`该设备在选择的时间段已被预约，请选择其他时间。\n冲突时间段(一个月内)：\n${conflictMessage}`);
                setShowAlert(true);
                return; // 阻止继续提交
            }


            // 如果是编辑模式，调用修改接口
            const apiUrl = isEditMode
                ? `${config.API_BASE_URL}/api/reservations/update`  // 修改预约
                : `${config.API_BASE_URL}/api/reservations/`; // 新增预约

            const response = await axios.post(apiUrl, item);

            if (response.data.success) {
                console.log('预约成功', response.data);
                setPublicReserveModal(false);
                setShowSuccessToast(true);
                setTimeout(() => setShowSuccessToast(false), 3000);
                if (isEditMode) {
                    fetchMyReservation();
                }
            } else {
                console.error('预约失败', response.data.message);
            }
        } catch (error) {
            setError('交付操作失败');
            setTimeout(() => setError(''), 3000);
            console.error('Error delivering:', error);
        }
    }

    //编辑预约
    const handleEditReservation = (reservation) => {
        setIsEditMode(true);
        setPublicReserveModal(true);
        const filteredData = data.filter(item => item.status === '0' || item.status === '1')
        setFilteredData(filteredData);
        setReserveData({
            equipment_id: reservation.equipment_id,
            equip_user: reservation.equip_user,
            test_item_id: reservation.test_item_id,
            start_time: formatDateToLocal(reservation.start_time),
            end_time: formatDateToLocal(reservation.end_time),
            reservation_id: reservation.reservation_id, // 记录修改的 reservation_id
        });
    };

    const handleCancelReservation = async (reservationId) => {
        try {
            if (!window.confirm('确定取消此项预约吗？确认后提交！')) {
                return;  // 用户点击取消后，不执行任何操作
            }
            const response = await axios.post(`${config.API_BASE_URL}/api/reservations/cancel`, {
                reservationId: reservationId  // 发送预约ID到后端
            });

            if (response.data.success) {
                setShowSuccessToast(true);
                setTimeout(() => setShowSuccessToast(false), 3000);

                console.log('预约取消成功', response.data);
                // 重新加载预约信息，刷新页面
                fetchMyReservation();
            } else {
                console.error('取消预约失败', response.data.message);
            }
        } catch (error) {
            console.error('请求失败:', error);
        }
    };

    //设置最终价操作
    // const submitFinalPrice = async (invoiceId) => {
    //     try {
    //         if (finalPrice) {
    //             await axios.post(`${config.API_BASE_URL}/api/orders/finalPrice`, {
    //                 invoiceId: invoiceId,
    //                 finalPrice: finalPrice
    //             })
    //             fetchInvoices();
    //             setShowSuccessToast(true); // Show success message
    //             setTimeout(() => setShowSuccessToast(false), 3000);
    //             setShowFinalPriceModal(false);
    //         }

    //     } catch (error) {
    //         console.error('开票价设置失败:', error);
    //         setError('未能成功设置开票价');
    //         setTimeout(() => setError(''), 3000);
    //     }
    // }

    //入账操作
    const submitAccount = async (invoiceId) => {
        try {
            if (!invoiceNumber) {
                setAlertMessage("请输入发票号！");
                setShowAlert(true);
            } else if (!finalPrice) {
                setAlertMessage("最终开票价格未填写！");
                setShowAlert(true);
            } else if (accountTime.length === 0) {
                setAlertMessage("入账时间未填写！");
                setShowAlert(true);
            } else {
                if (!window.confirm('请再次确认此【入账】操作！')) {
                    return;  // 用户点击取消后，不执行任何操作
                }
                const response = await axios.post(`${config.API_BASE_URL}/api/orders/account`, {
                    invoiceId: invoiceId,
                    invoiceNumber: invoiceNumber,
                    orderStatus: '2',
                    amount: finalPrice,
                    description: description,
                    accountTime: accountTime
                })
                const { newBalance } = response.data;
                setShowAccountSuccessModal({
                    show: true,
                    newBalance,
                });
                fetchInvoices();
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
            const response = await axios.post(`${config.API_BASE_URL}/api/tests/update-check`, payload);
            if (response.status === 200) {
                setShowCheckModal(false); // Close the modal after submission
                fetchDataForSupervisor(departmentID);
                setShowSuccessToast(true); // Show success toast only after successful response
                setTimeout(() => setShowSuccessToast(false), 3000); // Hide success toast after 3 seconds
            } else {
                // Handle non-success status if necessary
                setError('请求超时，修改测试状态失败！');
                setTimeout(() => setError(''), 3000);
            }
        } catch (error) {
            console.error('Error updating test status:', error);
            setError('Failed to update test status');
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
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    };

    // 将 ISO 日期格式转换为 date 格式
    const formatDateToDate = (isoDate) => {
        if (!isoDate) return '';
        const date = new Date(isoDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从 0 开始，所以加 1
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;  // 仅返回日期部分
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
                    headers = ["委托单号", "我的检测项目", "状态", "客户名称", "联系人", "剩余天数", "负责人", "数量", "机时", "工时", "标准价格", "附件", "组长指派时间", "样品原号", "客户备注", "审批意见"];
                    rows = currentItems.map((item, index) => (
                        <tr key={index}
                            className={item.status === '5' ? 'row-delivered' : ''}
                        >
                            <td className='order-num-fixed'>{item.order_num}</td>
                            <td className='test-item-fixed'>{item.test_item}</td>
                            <td>{statusLabels[item.status]}</td>
                            <td>{item.customer_name}</td>
                            <td>{item.contact_name}</td>
                            <td>
                                {(item.status === '1' || item.status === '2') ? renderDeadlineStatus(item.deadline, item.appoint_time) : ''}
                            </td>
                            <td>
                                {item.manager_names ? `${item.manager_names}` : '暂未分配'}
                            </td>
                            <td>{item.quantity}</td>
                            <td>{item.machine_hours}</td>
                            <td>{item.work_hours}</td>
                            <td>{item.listed_price}</td>
                            <td>{item.hasAttachments === 1 ? "已上传" : "无"}</td>
                            <td>{item.appoint_time ? new Date(item.appoint_time).toLocaleString() : ''}</td>
                            <td>{item.original_no}</td>
                            <td>{item.note}</td>
                            <td>{item.check_note}</td>
                            <td className='fixed-column'>
                                <Button variant="info" onClick={() => handleShowDetails(item)}>详情</Button>
                                {(item.status !== '3' && item.status !== '5') && (
                                    <Button onClick={() => handleOpenFinishModal(item)}>完成</Button>
                                )}

                                {/* 只有当状态不是'2'（已检测）时，才显示转办按钮 */}
                                {(item.status === '0' || item.status === '1') && (
                                    <Button onClick={() => handleReassignment(item.test_item_id)}>转办</Button>

                                )}

                                {item.status === '2' && (
                                    <Button variant="secondary" onClick={() => handleRollBack(item)}>回退</Button>
                                )}

                                {/* {item.status !== '3' && (
                                    <Button onClick={() => handleQuote(item.test_item_id)}>改标准价(选)</Button>
                                )} */}
                            </td>
                        </tr>
                    ));
                    break;
                case 'getCommission':
                    headers = ["委托单号", "委托单位", "联系人", "联系电话", "联系人邮箱", "付款人", "付款人电话", "地址", "检测项目", "材料类型", "服务加急"];
                    rows = currentItems.map((item, index) => (
                        <tr key={index}>
                            <td>{highlightText(item.order_num, filterData)}</td>
                            <td>{highlightText(item.customer_name, filterData)}</td>
                            <td>{highlightText(item.contact_name, filterData)}</td>
                            <td>{highlightText(item.contact_phone_num, filterData)}</td>
                            <td>{highlightText(item.contact_email, filterData)}</td>
                            <td>{highlightText(item.payer_contact_name, filterData)}</td>
                            <td>{highlightText(item.payer_contact_phone_num, filterData)}</td>
                            <td>{highlightText(item.payer_address, filterData)}</td>
                            <td>{highlightText(item.test_items, filterData)}</td>
                            <td>{highlightText(item.material, filterData)}</td>
                            <td>{serviceTypeLabels[item.service_type]}</td>
                        </tr>
                    ));
                    break;
                case 'myReservation':
                    headers = ["委托单号", "检测项目", "设备名称", "设备型号", "操作员", "预约开始时间", "预约结束时间时间"];
                    rows = reservationPaging.map((item, index) => (
                        <tr key={index}>
                            <td>{item.order_num}</td>
                            <td>{item.test_item}</td>
                            <td>{item.equipment_name}</td>
                            <td>{item.model}</td>
                            <td>{item.name}</td>
                            <td>{new Date(item.start_time).toLocaleString()}</td>
                            <td>{new Date(item.end_time).toLocaleString()}</td>
                            <td className='fixed-column'>
                                <Button onClick={() => handleCancelReservation(item.reservation_id)}>取消预约</Button>
                                <Button onClick={() => handleEditReservation(item)}>修改</Button>
                            </td>
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
                    headers = ["委托单号", "检测项目", "状态", "剩余天数", "客户名称", "联系人", "检测人员", "业务人员", "附件", "客户备注", "审批意见", "数量", "机时", "工时", "标准价格", "样品原号"];
                    rows = currentItems.map((item, index) => (
                        <tr key={index}
                            className={item.status === '5' ? 'row-delivered' : ''}
                        >
                            <td className='order-num-fixed'>{item.order_num}</td>
                            <td className='test-item-fixed'>{item.test_item}</td>
                            <td>{statusLabels[item.status]}</td>
                            <td>
                                {(item.status === '1' || item.status === '2') ? renderDeadlineStatus(item.deadline, item.appoint_time) : ''}
                            </td>
                            <td>{item.customer_name}</td>
                            <td>{item.contact_name}</td>
                            <td>
                                {item.team_names ? `${item.team_names}` : '暂未指派'}
                            </td>
                            <td>
                                {item.sales_names ? `${item.sales_names}` : '暂未分配'}
                            </td>
                            <td>{item.hasAttachments === 1 ? "已上传" : "无"}</td>
                            <td>{item.note}</td>
                            <td>{item.check_note}</td>
                            <td>{item.quantity}</td>
                            <td>{item.machine_hours}</td>
                            <td>{item.work_hours}</td>
                            <td>{item.listed_price}</td>
                            <td>{item.original_no}</td>
                            <td className='fixed-column'>
                                <Button variant="info" onClick={() => handleShowDetails(item)}>详情</Button>
                                {item.team_names === item.manager_names && item.status !== '3' && item.status !== '5' && (
                                    <>
                                        <Button onClick={() => handleOpenFinishModal(item)}>完成</Button>
                                        {/* <Button onClick={() => handleQuote(item.test_item_id)}>改标准价(选)</Button> */}
                                    </>

                                )}

                                {(item.status ==='1' || item.status === '2') && (
                                    <Button
                                        onClick={() => handleAssignment(item.test_item_id)}
                                        className={item.appoint_time ? 'assigned-btn' : 'unassigned-btn'}
                                    >
                                        指派
                                    </Button>
                                )}
                                {/* 当状态是已检测待审核，且标价写入时，才显示审核按钮 */}
                                {(item.status === '2' || item.status === '4') && (
                                    <Button variant="warning" onClick={() => handleCheck(item)}>审核</Button>
                                )}
                                {(item.status === '2' || item.status === '1') && (
                                    <Button variant="secondary" onClick={() => handleRollBack(item)}>回退</Button>
                                )}
                            </td>

                        </tr>
                    ));
                    break;
                case 'getCommission':
                    headers = ["委托单号", "委托单位", "联系人", "联系电话", "联系人邮箱", "付款人", "付款人电话", "地址", "检测项目", "材料类型", "服务加急"];
                    rows = currentItems.map((item, index) => (
                        <tr key={index}>
                            <td>{highlightText(item.order_num, filterData)}</td>
                            <td>{highlightText(item.customer_name, filterData)}</td>
                            <td>{highlightText(item.contact_name, filterData)}</td>
                            <td>{highlightText(item.contact_phone_num, filterData)}</td>
                            <td>{highlightText(item.contact_email, filterData)}</td>
                            <td>{highlightText(item.payer_contact_name, filterData)}</td>
                            <td>{highlightText(item.payer_contact_phone_num, filterData)}</td>
                            <td>{highlightText(item.payer_address, filterData)}</td>
                            <td>{highlightText(item.test_items, filterData)}</td>
                            <td>{highlightText(item.material, filterData)}</td>
                            <td>{serviceTypeLabels[item.service_type]}</td>
                            <td className='fixed-column'>
                                <Button onClick={() => handleAdd(item)}>添加检测</Button>
                            </td>
                        </tr>
                    ));
                    break;
                case 'myReservation':
                    headers = ["委托单号", "检测项目", "设备名称", "设备型号", "操作员", "预约开始时间", "预约结束时间时间"];
                    rows = reservationPaging.map((item, index) => (
                        <tr key={index}>
                            <td>{item.order_num}</td>
                            <td>{item.test_item}</td>
                            <td>{item.equipment_name}</td>
                            <td>{item.model}</td>
                            <td>{item.name}</td>
                            <td>{new Date(item.start_time).toLocaleString()}</td>
                            <td>{new Date(item.end_time).toLocaleString()}</td>
                            <td className='fixed-column'>
                                <Button onClick={() => handleCancelReservation(item.reservation_id)}>取消预约</Button>
                                <Button onClick={() => handleEditReservation(item)}>修改</Button>
                            </td>
                        </tr>
                    ));
                    break;
                default:

                    break;

            }

            return { headers, rows };
        } else if (role === 'leader') {
            switch (selected) {
                case 'handleTests':
                    // 为员工定制的视图逻辑
                    headers = ["委托单号", "检测项目", "状态", "附件", "客户名称", "联系人", "机时", "工时", "标准价格", "实收(含税)价", "负责人", "检测人员", "业务人员", "客户备注", "审批意见", "样品原号", "剩余天数"];
                    rows = currentItems.map((item, index) => (
                        <tr key={index}>
                            <td>
                                <input
                                    type="checkbox"
                                    checked={selectedOrders.includes(item.test_item_id)}
                                    onChange={() => handleCheckboxChange(item.test_item_id)}
                                />
                            </td>
                            <td className='order-num-fixed'>{item.order_num}</td>
                            <td className='test-item-fixed'>{item.test_item}</td>
                            <td>{statusLabels[item.status]}</td>
                            <td>{item.hasAttachments === 1 ? "已上传" : "无"}</td>
                            <td>{item.customer_name}</td>
                            <td>{item.contact_name}</td>
                            <td>{item.machine_hours}</td>
                            <td>{item.work_hours}</td>
                            <td>{item.listed_price}</td>
                            <td>{item.discounted_price}</td>
                            <td>
                                {item.manager_names ? `${item.manager_names}` : '暂未分配'}
                            </td>
                            <td>
                                {item.team_names ? `${item.team_names}` : '暂未分配'}
                            </td>
                            <td>
                                {item.sales_names ? `${item.sales_names}` : '暂未分配'}
                            </td>
                            <td>{item.note}</td>
                            <td>{item.check_note}</td>
                            <td>{item.original_no}</td>
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
                    break;
                case 'getCommission':
                    headers = ["委托单号", "委托单位", "联系人", "联系电话", "结算状态", "委托总金额", "交易总价", "业务员", "联系人邮箱", "付款人", "付款人电话", "地址", "区域", "客户性质", "检测项目", "材料类型", "服务加急"];
                    rows = currentItems.map((item, index) => (
                        <tr key={index}>
                            <td>{highlightText(item.order_num, filterData)}</td>
                            <td>{highlightText(item.customer_name, filterData)}</td>
                            <td>{highlightText(item.contact_name, filterData)}</td>
                            <td>{highlightText(item.contact_phone_num, filterData)}</td>
                            <td>{orderStatusLabels[item.order_status]}</td>
                            <td>{item.total_listed_price}</td>
                            <td>{item.total_discounted_price}</td>
                            <td>{highlightText(item.name, filterData)}</td>
                            <td>{highlightText(item.contact_email, filterData)}</td>
                            <td>{highlightText(item.payer_contact_name, filterData)}</td>
                            <td>{highlightText(item.payer_contact_phone_num, filterData)}</td>
                            <td>{highlightText(item.payer_address, filterData)}</td>
                            <td>{highlightText(item.area, filterData)}</td>
                            <td>{highlightText(item.organization, filterData)}</td>
                            <td>{highlightText(item.test_items, filterData)}</td>
                            <td>{highlightText(item.material, filterData)}</td>
                            <td>{serviceTypeLabels[item.service_type]}</td>
                            <td className='fixed-column'>
                                <Button onClick={() => handleAdd(item)}>添加检测</Button>
                                <Button variant="danger" onClick={() => handleDelete(item.order_num)}>删除</Button>
                            </td>
                        </tr>
                    ));
                    break;
                case 'myReservation':
                    headers = ["委托单号", "检测项目", "设备名称", "设备型号", "操作员", "预约开始时间", "预约结束时间时间"];
                    rows = reservationPaging.map((item, index) => (
                        <tr key={index}>
                            <td>{item.order_num}</td>
                            <td>{item.test_item}</td>
                            <td>{item.equipment_name}</td>
                            <td>{item.model}</td>
                            <td>{item.name}</td>
                            <td>{new Date(item.start_time).toLocaleString()}</td>
                            <td>{new Date(item.end_time).toLocaleString()}</td>
                            <td className='fixed-column'>
                                <Button onClick={() => handleCancelReservation(item.reservation_id)}>取消预约</Button>
                                <Button onClick={() => handleEditReservation(item)}>修改</Button>
                            </td>
                        </tr>
                    ));
                    break;
                default:
                    break;
            }

            return { headers, rows };
        } else if (role === 'sales') {
            switch (selected) {
                case 'handleTests':
                    headers = ["委托单号", "检测项目", "客户名称", "联系人", "数量", "机时", "标准价格", "实收(含税)价", "附件", "状态", "样品原号", "检测人员", "业务人员", "审批意见"];
                    rows = currentItems.map((item, index) => (
                        <tr key={index}
                            className={item.status === '5' ? 'row-delivered' : ''}
                        >
                            <td>
                                <input
                                    type="checkbox"
                                    checked={selectedOrders.includes(item.test_item_id)}
                                    onChange={() => handleCheckboxChange(item.test_item_id)}
                                />
                            </td>
                            <td className='order-num-fixed'>{item.order_num}</td>
                            <td className='test-item-fixed'>{item.test_item}</td>
                            <td>{item.customer_name}</td>
                            <td>{item.contact_name}</td>
                            <td>{item.quantity}</td>
                            <td>{item.machine_hours}</td>
                            <td>{item.listed_price}</td>
                            {/* <td>{item.discounted_price}</td> */}
                            {/* 双击编辑逻辑 */}
                            <td
                                onDoubleClick={() => handleDoubleClick(index, item.discounted_price)}
                            >
                                {editingRow === index ? (
                                    <input
                                        type="text"
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        onBlur={() => handleBlurOrSave(item, editingValue)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                handleBlurOrSave(item, editingValue);
                                            }
                                        }}
                                        autoFocus
                                    />
                                ) : (
                                    item.discounted_price
                                )}
                            </td>
                            <td>{item.hasAttachments === 1 ? "已上传" : "无"}</td>
                            <td>{statusLabels[item.status]}</td>
                            <td>{item.original_no}</td>
                            <td>
                                {item.team_names ? `${item.team_names}` : '暂未分配'}
                            </td>
                            <td>
                                {item.sales_names ? `${item.sales_names}` : '暂未分配'}
                            </td>
                            <td>{item.check_note}</td>
                            <td className='fixed-column'>
                                <Button variant="info" onClick={() => handleShowDetails(item)}>详情</Button>
                                {/* {item.status !== '3' && item.status !== '5' && (
                                    <Button onClick={() => handleDiscount(item.test_item_id)}>设置优惠价</Button>
                                )} */}
                                {item.status === '3' && (
                                    <Button onClick={() => handleDeliver(item)}>交付</Button>
                                )}
                            </td>
                        </tr>
                    ));
                    break;
                case 'getCommission':
                    headers = ["委托单号", "委托单位", "联系人", "联系电话", "结算状态", "交易总价", "服务加急", "寄送地址", "创建时间"];
                    rows = currentItems.map((item, index) => (
                        <tr key={index}>
                            <td>{highlightText(item.order_num, filterData)}</td>
                            <td>{highlightText(item.customer_name, filterData)}</td>
                            <td>{highlightText(item.contact_name, filterData)}</td>
                            <td>{highlightText(item.contact_phone_num, filterData)}</td>
                            <td>{orderStatusLabels[item.order_status]}</td>
                            <td>{highlightText(item.total_discounted_price, filterData)}</td>
                            <td>{serviceTypeLabels[item.service_type]}</td>
                            <td>{highlightText(item.sample_shipping_address, filterData)}</td>
                            <td>{new Date(item.create_time).toLocaleString()}</td>
                        </tr>
                    ));
                    break;
                case 'myReservation':
                    headers = ["委托单号", "检测项目", "设备名称", "设备型号", "操作员", "预约开始时间", "预约结束时间时间"];
                    rows = reservationPaging.map((item, index) => (
                        <tr key={index}>
                            <td>{item.order_num}</td>
                            <td>{item.test_item}</td>
                            <td>{item.equipment_name}</td>
                            <td>{item.model}</td>
                            <td>{item.name}</td>
                            <td>{new Date(item.start_time).toLocaleString()}</td>
                            <td>{new Date(item.end_time).toLocaleString()}</td>
                            <td className='fixed-column'>
                                <Button onClick={() => handleCancelReservation(item.reservation_id)}>取消预约</Button>
                                <Button onClick={() => handleEditReservation(item)}>修改</Button>
                            </td>
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
                    headers = ["委托单号", "委托单位", "联系人", "联系电话", "结算状态", "委托总金额", "交易总价", "业务员", "联系人邮箱", "付款人", "付款人电话", "地址", "区域", "客户性质", "检测项目", "材料类型", "服务加急"];
                    rows = currentItems.map((item, index) => (
                        <tr key={index}>
                            {/* 选择框 */}
                            {role === 'admin' && (
                                <>
                                    {item.order_status === '0' ? (
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedOrders.includes(item.order_num)}
                                                onChange={() => handleCheckboxChange(item.order_num)}
                                            />
                                        </td>
                                    ) : (
                                        <td>
                                        </td>
                                    )}
                                </>
                            )}
                            <td>{highlightText(item.order_num, filterData)}</td>
                            <td>{highlightText(item.customer_name, filterData)}</td>
                            <td>{highlightText(item.contact_name, filterData)}</td>
                            <td>{highlightText(item.contact_phone_num, filterData)}</td>
                            <td>{orderStatusLabels[item.order_status]}</td>
                            <td>{item.total_listed_price}</td>
                            <td>{item.total_discounted_price}</td>
                            <td>{highlightText(item.name, filterData)}</td>
                            <td>{highlightText(item.contact_email, filterData)}</td>
                            <td>{highlightText(item.payer_contact_name, filterData)}</td>
                            <td>{highlightText(item.payer_contact_phone_num, filterData)}</td>
                            <td>{highlightText(item.payer_address, filterData)}</td>
                            <td>{highlightText(item.area, filterData)}</td>
                            <td>{highlightText(item.organization, filterData)}</td>
                            <td>{highlightText(item.test_items, filterData)}</td>
                            <td>{highlightText(item.material, filterData)}</td>
                            <td>{serviceTypeLabels[item.service_type]}</td>
                            <td className='fixed-column'>
                                <Button onClick={() => handleAdd(item)}>添加检测</Button>
                                <Button variant="danger" onClick={() => handleDelete(item.order_num)}>删除</Button>
                            </td>
                        </tr>
                    ));
                    break;
                case 'getChecked':
                    headers = ["发票号", "开票时间", "委托单号", "客户名称", "联系人", "联系电话", "付款方", "付款联系人", "业务员", "检测项目", "开票价", "创建时间"];
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
                                        {orderIndex === 0 && (
                                            <td className="invoice-id-cell" rowSpan={invoice.order_details.length}>
                                                <strong>
                                                    {highlightText(formatDateToDate(invoice.checkout_time), filterData)}
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
                                                    {highlightText(formatDateToLocal(invoice.created_at), filterData)}
                                                </td>

                                            </>


                                        )}
                                        {/* 操作按钮 */}
                                        {orderIndex === 0 && (
                                            <td rowSpan={invoice.order_details.length} className='fixed-column'>
                                                <div className="action-btns">
                                                    {/* <Button onClick={() => handleAddFinalPrice(invoice.invoice_id)}>设置最终价</Button> */}
                                                    <Button variant='secondary' onClick={() => handleRollbackAccount(invoice)}>回退</Button>

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
                    headers = ["委托单号", "样品原号", "检测项目", "方法", "客户名称", "联系人", "机时", "工时", "标准价格", "实收(含税)价", "状态", "实验人员", "业务人员", "审批意见"];
                    rows = currentItems.map((item, index) => (
                        <tr key={index}>
                            {/* 选择框 */}
                            {role === 'admin' && (
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedOrders.includes(item.test_item_id)}
                                        onChange={() => handleCheckboxChange(item.test_item_id)}
                                    />
                                </td>
                            )}
                            <td>{item.order_num}</td>
                            <td>{item.original_no}</td>
                            <td>{item.test_item}</td>
                            <td>{item.test_method}</td>
                            <td>{item.customer_name}</td>
                            <td>{item.contact_name}</td>
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
                                <Button variant="info" onClick={() => handleShowDetails(item)}>详情</Button>
                                {/* {item.status === '0' && (
                                    <Button onClick={() => handleAssignment(item.test_item_id)}>分配</Button>
                                )} */}
                                <Button onClick={() => handleEdit(item)}>修改</Button>
                                <Button variant="danger" onClick={() => handleDelete(item.test_item_id)}>删除</Button>
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
                    headers = ["ID", "付款方", "地址", "电话", "联系人/导师名称", "联系人手机号", "邮箱", "银行名称", "税号", "银行账号", "区域", "单位性质", "当前余额"];
                    rows = currentItems.map((item, index) => (
                        <tr key={index}>
                            <td>{highlightText(item.payment_id, filterData)}</td>
                            <td>{highlightText(item.payer_name, filterData)}</td>
                            <td>{highlightText(item.payer_address, filterData)}</td>
                            <td>{highlightText(item.payer_phone_num, filterData)}</td>
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

                case 'myReservation':
                    headers = ["委托单号", "检测项目", "设备名称", "设备型号", "操作员", "预约开始时间", "预约结束时间时间"];
                    rows = reservationPaging.map((item, index) => (
                        <tr key={index}>
                            <td>{item.order_num}</td>
                            <td>{item.test_item}</td>
                            <td>{item.equipment_name}</td>
                            <td>{item.model}</td>
                            <td>{item.name}</td>
                            <td>{new Date(item.start_time).toLocaleString()}</td>
                            <td>{new Date(item.end_time).toLocaleString()}</td>
                            <td className='fixed-column'>
                                <Button onClick={() => handleCancelReservation(item.reservation_id)}>取消预约</Button>
                            </td>
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
                    <DataStatistics
                        employeeData={employeeStats}
                        equipmentData={equipmentStats}
                        sumPrice={sumPrice}
                        handleTimePeriodChange={handleTimePeriodChange}
                        timePeriod={timePeriod}
                        timeStatus={timeStatus}
                        yearlyPriceData={yearlyPriceStats}
                        periodOptions={periodOptions}
                        handlePeriodChange={handlePeriodChange}
                        selectedPeriod={selectedPeriod}
                    />
                ) : selected === 'timeline' ? (
                    <EquipmentTimeline tasks={equipmentTimeline} equipments={equipments} /> // 显示设备时间线
                ) : selected === 'getReservation' ? (
                    <>
                        <h2>设备预约情况</h2>
                        <button className='reserve-button' onClick={handleReserve}>设备预约</button>
                        {(role === 'sales' || role === 'admin') && (
                            <div>
                                <Button
                                    variant='secondary'
                                    onClick={() => handleDepartmentClick('1')} // 设置部门 ID 为 '1'
                                >
                                    显微组织表征
                                </Button>
                                <Button
                                    variant='secondary'
                                    onClick={() => handleDepartmentClick('2')} // 设置部门 ID 为 '2'
                                >
                                    物化性能测试
                                </Button>
                                <Button
                                    variant='secondary'
                                    onClick={() => handleDepartmentClick('3')} // 设置部门 ID 为 '3'
                                >
                                    力学性能测试
                                </Button>
                            </div>

                        )}
                        <div>
                            <Timeline
                                key={timelineKey} // 每次 key 改变时重新挂载组件
                                groups={groups}
                                items={equipmentTimelineItems}
                                defaultTimeStart={new Date()}
                                defaultTimeEnd={new Date().setMonth(new Date().getMonth() + 1)} // 设置时间范围为当前月份
                                onItemClick={handleItemClick} // 注册点击事件
                                sidebarWidth={250}
                                sidebarContent={<div>设备列表</div>} // 自定义左侧整体标题

                            />
                        </div>
                    </>
                ) : (
                    <>
                        <div className='content-head'>
                            <h2>{selected === 'getCommission' ? '委托单信息'
                                : selected === 'getSamples' ? '样品管理'
                                    : selected === 'getTests' || selected === 'handleTests' ? '检测管理'
                                        : selected === 'customerInfo' ? '客户信息'
                                            : selected === 'transactionHistory' ? '交易流水'
                                                : selected === 'getChecked' ? '结算账单明细'
                                                    : selected === 'myReservation' ? '我的预约'
                                                        : '首页'}</h2>
                            {selected === 'handleTests' || selected === 'getTests' ? (
                                <div className="searchBar">
                                    <span>项目状态：</span>
                                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                        <option value="">全部状态</option>
                                        <option value="0">待分配</option>
                                        <option value="1">已分配待检测</option>
                                        <option value="2">已检测待审批</option>
                                        <option value="3">审批通过</option>
                                        <option value="4">审批失败</option>
                                        <option value="5">已交付</option>


                                    </select>&nbsp;&nbsp;&nbsp;
                                    <span>月份：</span>
                                    {periodOptions && (
                                        <>
                                            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                                                <option value="">选择月份</option>
                                                {periodOptions.map((option, index) => (
                                                    <option key={index} value={option.month}>
                                                        {option.month}
                                                    </option>
                                                ))}
                                            </select>&nbsp;&nbsp;&nbsp;
                                        </>
                                    )}
                                    <span>委托单号：</span>
                                    <input
                                        type="text"
                                        value={filterOrderNum}
                                        onChange={(e) => setFilterOrderNum(e.target.value)}
                                        placeholder="输入委托单号进行搜索"
                                    />
                                    &nbsp;&nbsp;&nbsp;
                                    <span>客户名称：</span>
                                    <input
                                        type="text"
                                        value={filterCustomer}
                                        onChange={(e) => setFilterCustomer(e.target.value)}
                                        placeholder="输入客户名称进行搜索"
                                    />
                                    {(role === 'leader' || role === 'admin') && (
                                        <>
                                            <span>表格：</span>
                                            <button onClick={handleExportTestData} disabled={loading}>
                                                {loading ? '正在准备...' : '一键导出'}
                                            </button>
                                        </>
                                    )}

                                    {role === 'sales' && (
                                        <>
                                            <span>表格：</span>
                                            <button onClick={handleExportTestDataForSales} disabled={loading}>
                                                {loading ? '正在准备...' : '一键导出'}
                                            </button>
                                        </>
                                    )}

                                </div>
                            ) : selected === 'getCommission' ? (

                                <div className="searchBar">
                                    {/* <div>
                                        <span>筛选委托单号：</span>
                                        <input
                                            type="text"
                                            value={filterOrderNum}
                                            onChange={(e) => setFilterOrderNum(e.target.value)}
                                            placeholder="输入委托单号进行搜索"
                                        />
                                        <button onClick={() => fetchData('orders')}>查询单号</button>
                                    </div> */}

                                    <div>
                                        <span>页面搜索：</span>
                                        <input
                                            type="text"
                                            value={filterData}
                                            onChange={(e) => setFilterData(e.target.value)}
                                            placeholder="搜索"
                                        />

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
                                        {months && (
                                            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                                                <option value="">选择月份</option>
                                                {months.map(({ month }) => (
                                                    <option key={month} value={month}>{month}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                </div>
                            )}

                            {selected === 'myReservation' ? (
                                <Pagination
                                    activePage={activePage}
                                    itemsCountPerPage={itemsCountPerPage}
                                    totalItemsCount={totalReservationCount}
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
                            ) : (
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
                            )}
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
                                            {(((role === 'leader' || role === 'sales') && selected === 'handleTests') || selected === 'getTests') && (
                                                <th>
                                                    <input
                                                        type="checkbox"
                                                        checked={isAllSelected}
                                                        onChange={handleSelectAllTest}
                                                    />
                                                    &nbsp;全选
                                                </th>
                                            )}
                                            {(role === 'admin' && selected === 'getCommission') && (
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
                        onShowCheck={handleCheck}
                        onShowFinish={handleFinish}
                        renderDeadlineStatus={renderDeadlineStatus}
                        account={account}
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
                                <option value="5">已交付</option>

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
            <Modal show={showAssignmentModal} onHide={() => setShowAssignmentModal(false)} >
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
                                        {user.name}
                                        {user.account === account ? (
                                            <p>(--自己--)</p>
                                        ) : (
                                            <p>({user.account})</p>
                                        )}
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
                        {/* <Form.Group controlId="formStartTime">
                            <Form.Label>设备使用开始时间</Form.Label>
                            <Form.Control
                                type="datetime-local"
                                value={assignmentData.start_time}
                                onChange={e => setAssignmentData({ ...assignmentData, start_time: e.target.value })}
                            />
                        </Form.Group> */}

                        {/* 设备使用结束时间 */}
                        {/* <Form.Group controlId="formEndTime">
                            <Form.Label>设备使用结束时间</Form.Label>
                            <Form.Control
                                type="datetime-local"
                                value={assignmentData.end_time}
                                onChange={e => setAssignmentData({ ...assignmentData, end_time: e.target.value })}
                            />
                        </Form.Group> */}

                        {/* 查看所有设备预约情况按钮 */}
                        {/* <Button variant="info" onClick={toggleScheduleView}>查看所有设备预约情况</Button> */}

                        {/* 如果需要显示设备预约情况 */}
                        {/* {showEquipmentSchedule && (
                            <div style={{ marginTop: '20px' }}>
                                <h5>设备预约情况</h5>
                                <Timeline
                                    groups={groups}
                                    items={equipmentTimelineItems}
                                    defaultTimeStart={new Date()}
                                    defaultTimeEnd={new Date().setMonth(new Date().getMonth() + 1)} // 设置时间范围为当前月份
                                    onItemClick={handleItemClick} // 注册点击事件
                                    headerLabelFormats={headerLabelFormats} // 设置中文的时间头部格式
                                    subHeaderLabelFormats={subHeaderLabelFormats} // 设置中文的子时间头部格式
                                    sidebarWidth={250}
                                    sidebarContent={<div>设备列表</div>} // 自定义左侧整体标题

                                />

                            </div>
                        )} */}

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
                        <h2>确定要回退至上级吗？</h2>
                        <p>回退操作会导致指派后的人员和任务清空。因此执行回退操作前请与组长/室主任进行沟通。</p>
                        <br></br>
                        <Form.Group controlId="formAssignmentInfo">
                            <Form.Label>回退备注填写请跟在客户委托备注后面(选填)</Form.Label>

                            <Form.Control
                                type="text"
                                value={rollbackData.note}
                                onChange={e => setRollbackData({ ...rollbackData, note: e.target.value })}>

                            </Form.Control>
                        </Form.Group>
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
                        <h4>{currentItem.order_num}-{currentItem.test_item}</h4>
                        <hr></hr>
                        <strong style={{ color: 'red' }}>请核对信息：</strong>
                        <div className='check-box'>

                            <div>
                                <strong>机时：</strong> {currentItem.machine_hours} 小时
                                {/* <Button
                                    variant="link"
                                    onClick={() => setEditingMachineHours(true)}
                                    style={{ marginLeft: '10px', padding: 0, marginTop: 0 }}
                                >
                                    修改
                                </Button>
                                {editingMachineHours && (
                                    <Form.Control
                                        type="number"
                                        placeholder="输入新的机时"
                                        defaultValue={currentItem.machine_hours || ''}
                                        onBlur={(e) => {
                                            setCurrentItem({
                                                ...currentItem,
                                                machine_hours: e.target.value ? parseFloat(e.target.value) : ''
                                            });
                                            setEditingMachineHours(false);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                setCurrentItem({
                                                    ...currentItem,
                                                    machine_hours: e.target.value ? parseFloat(e.target.value) : ''
                                                });
                                                setEditingMachineHours(false);
                                            }
                                        }}
                                        style={{ marginTop: '5px', width: '150px' }}
                                        min={0}
                                    />
                                )} */}
                            </div>
                            <div>
                                <strong>工时：</strong> {currentItem.work_hours} 小时
                            </div>
                        </div>
                        <div className='check-box'>
                            <div>
                                <strong>标准价格：</strong>
                                <span>¥ {currentItem.listed_price}</span>
                                <Button
                                    variant="link"
                                    onClick={() => setEditingPrice(true)}
                                    style={{ marginLeft: '10px', padding: 0, marginTop: 0 }}
                                >
                                    修改
                                </Button>
                                {editingPrice && (
                                    <Form.Control
                                        type="number"
                                        placeholder="输入新的标准价格"
                                        defaultValue={currentItem.listed_price || ''}
                                        onBlur={(e) => {
                                            setCurrentItem({
                                                ...currentItem,
                                                listed_price: e.target.value ? parseFloat(e.target.value) : ''
                                            });
                                            setEditingPrice(false);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                setCurrentItem({
                                                    ...currentItem,
                                                    listed_price: e.target.value ? parseFloat(e.target.value) : ''
                                                });
                                                setEditingPrice(false);
                                            }
                                        }}
                                        style={{ marginTop: '5px', width: '150px' }}
                                        min={0}
                                    />
                                )}
                            </div>
                            <div>
                                <strong>检测人员：</strong>{currentItem.team_names}
                            </div>
                        </div>
                        <div style={{ marginTop: '10px' }}>
                            <strong>数量：</strong> {currentItem.quantity}
                        </div>
                        <div style={{ marginTop: '10px' }}>
                            <strong>实验备注：</strong> {currentItem.test_note}
                        </div>
                        <div style={{ marginTop: '10px' }}>
                            <strong>使用设备：</strong> {currentItem.equipment_name}({currentItem.model})
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
            <Modal show={showFinishModal} onHide={handleCloseFinishModal} size='lg'>
                <Modal.Header closeButton>
                    <Modal.Title>完成检测</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>检测项目</Form.Label>
                            <br></br>
                            <strong>{finishData.test_item}</strong>

                        </Form.Group>

                        <Form.Group>
                            <Form.Label>机时</Form.Label>
                            <Form.Control
                                type="number"
                                value={finishData.machine_hours}
                                onChange={e => {
                                    const updatedMachineHours = e.target.value;
                                    const calculatedPrice = finishData.calculationMode === 'machineHours'
                                        ? finishData.listed_price * updatedMachineHours
                                        : finishData.listed_price * finishData.quantity;
                                    setFinishData({
                                        ...finishData,
                                        machine_hours: updatedMachineHours,
                                        calculated_price: calculatedPrice.toFixed(2)
                                    });
                                }}
                                min='0'
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>工时</Form.Label>
                            <Form.Control
                                type="number"
                                value={finishData.work_hours}
                                onChange={e => setFinishData({ ...finishData, work_hours: e.target.value })}
                                min='0'
                            />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>数量</Form.Label>
                            <Form.Control
                                type="number"
                                value={finishData.quantity}
                                onChange={e => {
                                    const updatedQuantity = e.target.value;
                                    const calculatedPrice = finishData.calculationMode === 'machineHours'
                                        ? finishData.listed_price * finishData.machine_hours
                                        : finishData.listed_price * updatedQuantity;
                                    setFinishData({
                                        ...finishData,
                                        quantity: updatedQuantity,
                                        calculated_price: calculatedPrice.toFixed(2)
                                    });
                                }}
                                min='0'
                            />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>单价 - (若显示，则该项目为标准项目，单价为默认单价)</Form.Label>
                            <Form.Control
                                type="number"
                                value={finishData.unit_price || ''}
                                onChange={e => {
                                    const updatedListedPrice = e.target.value;
                                    const calculatedPrice = finishData.calculationMode === 'machineHours'
                                        ? updatedListedPrice * finishData.machine_hours
                                        : updatedListedPrice * finishData.quantity;
                                    setFinishData({
                                        ...finishData,
                                        unit_price: updatedListedPrice,
                                        calculated_price: calculatedPrice.toFixed(2)
                                    });
                                }}
                            />

                        </Form.Group>
                        <hr></hr>
                        {/* 动态选择计算标准价格方式 */}
                        <Form.Group>
                            <Form.Label>选择标准价格计算方式</Form.Label>
                            <div className='finish-cal-type'>
                                <Form.Check
                                    type="radio"
                                    label="按照数量"
                                    name="priceCalculation"
                                    checked={finishData.calculationMode === 'quantity'}
                                    onChange={() => {
                                        const calculatedPrice = finishData.unit_price * finishData.quantity;
                                        setFinishData({
                                            ...finishData,
                                            calculationMode: 'quantity',
                                            calculated_price: calculatedPrice.toFixed(2)
                                        });
                                    }}
                                />
                                <Form.Check
                                    type="radio"
                                    label="按照机时"
                                    name="priceCalculation"
                                    checked={finishData.calculationMode === 'machineHours'}
                                    onChange={() => {
                                        const calculatedPrice = finishData.unit_price * finishData.machine_hours;
                                        setFinishData({
                                            ...finishData,
                                            calculationMode: 'machineHours',
                                            calculated_price: calculatedPrice.toFixed(2)
                                        });
                                    }}
                                />
                            </div>
                        </Form.Group>

                        {/* 动态显示计算结果 */}
                        <div>
                            <strong>标准价格(单价×数量/机时)：</strong>
                            {finishData.calculated_price || 'N/A'}
                        </div>
                        <hr></hr>
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
            <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{selectedDetails.test_item_id} - 详细信息</Modal.Title>
                </Modal.Header>
                <Modal.Body className='detailModal'>
                    <div className="detail-container">
                        <div className="detail-item">
                            <p>委托单号：<span>{selectedDetails.order_num}</span></p>
                        </div>
                        <div className="detail-item">
                            <p>样品原号：<span>{selectedDetails.original_no}</span></p>
                        </div>
                        <div className="detail-item">
                            <p>检测项目：<span>{selectedDetails.test_item}</span></p>
                        </div>
                        <div className="detail-item">
                            <p>尺寸：<span>{selectedDetails.size}</span></p>
                        </div>
                        <div className="detail-item">
                            <p>数量：<span>{selectedDetails.quantity}</span></p>
                        </div>
                        <div className="detail-item">
                            <p>客户备注：<span>{selectedDetails.note}</span></p>
                        </div>
                        <div className="detail-item">
                            <p>机时：<span>{selectedDetails.machine_hours}</span></p>
                        </div>
                        <div className="detail-item">
                            <p>工时：<span>{selectedDetails.work_hours}</span></p>
                        </div>
                        <div className="detail-item">
                            <p>标准价格：<span>{selectedDetails.listed_price}</span></p>
                        </div>
                        <div className="detail-item">
                            <p>优惠价格：<span>{selectedDetails.discounted_price}</span></p>
                        </div>
                        <div className="detail-item">
                            <p>设备名称：<span>{selectedDetails.equipment_name}({selectedDetails.model})</span></p>
                        </div>
                        <div className="detail-item">
                            <p>状态：<span>{statusLabels[selectedDetails.status]}</span></p>
                        </div>
                    </div>
                    <p>实验备注：<span>{selectedDetails.test_note}</span></p>
                    <p>审批意见：<span>{selectedDetails.check_note}</span></p>
                    <p>创建时间：
                        <span>
                            {selectedDetails.create_time ? new Date(selectedDetails.create_time).toLocaleString() : ''}
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
                    <Form.Group controlId="formStartTime">
                        <Form.Label>开票日期</Form.Label>
                        <Form.Control
                            type="date"
                            value={formatDateToDate(checkoutTime)}
                            onChange={e => setCheckoutTime(e.target.value)}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCheckoutModal(false)}>取消</Button>
                    <Button variant="primary" onClick={handleCheckout}>确认结算</Button>
                </Modal.Footer>
            </Modal>

            {/* 交付Modal */}
            <Modal show={handleDeliverModal} onHide={() => setHandleDeliverModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>交付确认</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>确认交付选中的检测项目：{deliverTest.test_item} </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setHandleDeliverModal(false)}>取消</Button>
                    <Button variant="primary" onClick={() => deliver(deliverTest.test_item_id)}>确认交付</Button>
                </Modal.Footer>
            </Modal>


            {/* 设置最终价按钮 */}
            {/* <Modal show={showFinalPriceModal} onHide={() => setShowFinalPriceModal(false)}>
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
            </Modal> */}

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
                            <Form.Label>请输入最终开票价格(必填)</Form.Label>
                            <Form.Control
                                type="number"
                                onChange={(e) => setFinalPrice(e.target.value)}>
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
                                (电话: ${currentItem.order_details[0].payer_contact_phone_num})`
                                    : '未提供'}
                            </strong>
                            </p>
                            <p>余额: <strong>
                                {currentItem.order_details ?
                                    `${currentItem.order_details[0].balance}` : '未提供'}
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


            {/* 入账成功的Modal */}
            <Modal show={showAccountSuccessModal} onHide={() => setShowAccountSuccessModal(false)}>
                <Modal.Header>
                    <Modal.Title>入账通知</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div>
                        <h2>入账操作成功！ </h2>
                        <div>当前账户余额：<strong>{showAccountSuccessModal?.newBalance} 元</strong></div>
                    </div>

                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAccountSuccessModal(false)}>关闭</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showSingleReservationModal} onHide={() => setShowSingleReservationModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>设备预约信息</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {/* 显示选中的时间条目详细信息 */}
                    {selectedItem ? (
                        <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ddd" }}>
                            <h4>选中的预约信息</h4>
                            <hr></hr>

                            <p>
                                <strong>预约人：</strong>
                                {selectedItem.operator}
                            </p>
                            <p>
                                <strong>设备名称：</strong>
                                {selectedItem.equipment_name}
                            </p>
                            <p>
                                <strong>委托单号：</strong>
                                {selectedItem.order_num}
                            </p>
                            <p>
                                <strong>检测项目：</strong>
                                {selectedItem.test_item}
                            </p>
                            <p>
                                <strong>设备操作员：</strong>
                                {selectedItem.equip_user}
                            </p>

                            <p>
                                <strong>开始时间：</strong>
                                {new Date(selectedItem.start_time).toLocaleString("zh-CN")}
                            </p>
                            <p>
                                <strong>结束时间：</strong>
                                {new Date(selectedItem.end_time).toLocaleString("zh-CN")}
                            </p>
                        </div>
                    ) : (
                        <div>数据拉取出错。请重试</div>
                    )}

                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowSingleReservationModal(false)}>关闭</Button>
                </Modal.Footer>
            </Modal>


            <Modal show={publicReserveModal} onHide={() => setPublicReserveModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditMode ? '修改预约' : '设备预约'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>

                    <Form.Group controlId="formAssignmentInfo">
                        <Form.Label>设备使用人员：</Form.Label>
                        <Form.Control
                            as="select"
                            value={reserveData.equip_user}
                            onChange={(e) => setReserveData({ ...reserveData, equip_user: e.target.value })}
                        >
                            <option value="">---选择人员---</option>
                            {assignableUsers.map(user => (
                                <option key={user.account} value={user.account}>
                                    {user.name}
                                    {user.account === account ? (
                                        <p>(--自己--)</p>
                                    ) : (
                                        <p>({user.account})</p>
                                    )}
                                </option>
                            ))}
                        </Form.Control>
                    </Form.Group>

                    <Form.Group controlId="formAssignmentInfo">
                        <Form.Label>选择检测项目：<span style={{ color: 'red' }}>*</span></Form.Label>
                        <Form.Control
                            as="select"
                            value={reserveData.test_item_id}
                            onChange={(e) => setReserveData({ ...reserveData, test_item_id: e.target.value })}
                        >
                            {filteredData && (
                                <>
                                    <option value="">---选择检测---</option>
                                    {filteredData.map(item => (
                                        <option key={item.test_item_id} value={item.test_item_id}>
                                            {item.test_item}
                                            <p>({item.order_num})</p>
                                        </option>
                                    ))}
                                </>
                            )}
                        </Form.Control>
                    </Form.Group>


                    {/* 设备使用开始时间 */}
                    <Form.Group controlId="formStartTime">
                        <Form.Label>设备使用开始时间<span style={{ color: 'red' }}>*</span></Form.Label>
                        <Form.Control
                            type="datetime-local"
                            value={reserveData.start_time}
                            onChange={e => setReserveData({ ...reserveData, start_time: e.target.value })}
                        />
                    </Form.Group>

                    {/* 设备使用结束时间 */}
                    <Form.Group controlId="formEndTime">
                        <Form.Label>设备使用结束时间<span style={{ color: 'red' }}>*</span></Form.Label>
                        <Form.Control
                            type="datetime-local"
                            value={reserveData.end_time}
                            onChange={e => setReserveData({ ...reserveData, end_time: e.target.value })}
                        />
                    </Form.Group>

                    <Row>
                        {/* 设备分类标签选择（一级菜单，使用select） */}
                        <Col md={6}>
                            <Form.Group controlId="formEquipmentLabel">
                                <Form.Label>设备分类标签<span style={{ color: 'red' }}>*</span></Form.Label>
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
                                <Form.Label>设备名称<span style={{ color: 'red' }}>*</span></Form.Label>
                                <Form.Control
                                    as="select"
                                    value={reserveData.equipment_id}
                                    onChange={e => setReserveData({ ...reserveData, equipment_id: e.target.value })}
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
                    <div style={{ fontSize: '12px', marginTop: '10px' }}>注: *为必填项</div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setPublicReserveModal(false)}>关闭</Button>
                    <Button variant="primary" onClick={() => submitReservation(reserveData)}>{isEditMode ? '修改' : '预约'}</Button>
                </Modal.Footer>
            </Modal>

        </div>
    );
};

export default ContentArea;
