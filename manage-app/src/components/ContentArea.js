import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Modal, Button, Form, Toast } from 'react-bootstrap'; // 使用React Bootstrap进行模态弹窗和表单处理
import '../css/ContentArea.css'


const ContentArea = ({ account, selected, role }) => {
    const [data, setData] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentItem, setCurrentItem] = useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false); // 控制Toast显示的状态
    const [ setError ] = useState('');

    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [assignmentInfo, setAssignmentInfo] = useState('');

    const fetchData = useCallback(async (endpoint) => {
        try {
            const response = await axios.get(`http://localhost:3003/api/${endpoint}`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to fetch data'); // 更新错误状态
            setTimeout(() => setError(''), 3000); // 3秒后清除错误消息
        }
    }, [setError]);


    useEffect(() => {
        if (role === 'employee' && selected === 'handleTests') {
            fetchDataForEmployee(account);
        } else {
            if (selected === 'getCommission') {
                fetchData('orders');
            } else if (selected === 'getSamples') {
                fetchData('samples');
            } else if (selected === 'getTests') {
                fetchData('tests');
            }
        }
        
    }, [selected, account, role, fetchData]);


    

    const fetchDataForEmployee = async (account) => {
        try {
            const response = await axios.get(`http://localhost:3003/api/tests/assignments/${account}`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching assigned tests:', error);
        }
    };

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

    const submitAssignment = useCallback(async () => {
        try {
            const payload = { testItemId: currentItem.testItemId, assignmentInfo };
            console.log(payload)
            await axios.post(`http://localhost:3003/api/tests/assign`, payload);
            setShowAssignmentModal(false);
            setAssignmentInfo(''); // 清空分配信息
            fetchData(selected); // 刷新数据
            setShowSuccessToast(true); // 显示成功的Toast
            setTimeout(() => setShowSuccessToast(false), 3000); // 3秒后自动隐藏Toast
        } catch (error) {
            console.error('Error submitting assignment:', error);
            setError('Failed to fetch data'); // 更新错误状态
            setTimeout(() => setError(''), 3000); // 3秒后清除错误消息
        }
    }, [currentItem, assignmentInfo, selected, fetchData, setError]);


    const renderTable = () => {
        let headers = [];
        let rows = [];
        if (role === 'employee' && selected === 'handleTests') {
            // 为员工定制的视图逻辑
            headers = ["检测编号", "分配给我的检测项目", "状态"];
            rows = data.map((item, index) => (
                <tr key={index}>
                    <td>{item.original_no}</td>
                    <td>{item.test_item}</td>
                    <td>{item.status}</td>
                </tr>
            ));
            return { headers, rows };
        } else {
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
                            <td>{item.service_type}</td>
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
                    headers = ["ID", "样品原号", "检测项目", "方法", "委托单号", "操作"];
                    rows = data.map((item, index) => (
                        <tr key={index}>
                            <td>{item.test_item_id}</td>
                            <td>{item.original_no}</td>
                            <td>{item.test_item}</td>
                            <td>{item.test_method}</td>
                            <td>{item.order_num}</td>
                            <td>
                                <Button onClick={() => handleAssignment(item.test_item_id)}>分配</Button>
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
        <div style={{ width: '70%', float: 'right', overflow: 'auto' }}>
            {selected && (
                <div>
                    <h2>{selected === 'getCommission' ? '详细信息' : selected === 'getSamples' ? '样品管理' : '检测管理'}</h2>
                    <table>
                        <thead>
                            <tr>{headers.map(header => <th key={header}>{header}</th>)}</tr>
                        </thead>
                        <tbody>
                            {rows}

                        </tbody>
                    </table>


                </div>
            )}

            {/* 分配成功的Toast */}
            <Toast onClose={() => setShowSuccessToast(false)} show={showSuccessToast} delay={3000} autohide position="top-end" style={{ position: 'absolute', top: 20, right: 20 }}>
                <Toast.Header>
                    <strong className="me-auto">分配成功</strong>
                    <small>刚刚</small>
                </Toast.Header>
                <Toast.Body>检测项目已成功分配！</Toast.Body>
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
                            <Form.Control
                                type="text"
                                placeholder="请输入检测人员工号"
                                value={assignmentInfo}
                                onChange={(e) => setAssignmentInfo(e.target.value)}
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


        </div>
    );
};

export default ContentArea;
