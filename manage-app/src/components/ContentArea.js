import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap'; // 使用React Bootstrap进行模态弹窗和表单处理
import '../css/ContentArea.css'

const ContentArea = ({ selected }) => {
    const [data, setData] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentItem, setCurrentItem] = useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    useEffect(() => {
        if (selected === 'getCommission') {
            fetchData('orders');
        } else if (selected === 'getSamples') {
            fetchData('samples');
        } else if (selected === 'getTests') {
            fetchData('tests');
        }
    }, [selected]);

    const fetchData = async (endpoint) => {
        try {
            const response = await axios.get(`http://localhost:3003/api/${endpoint}`);
            setData(response.data);
        } catch (error) {       
            console.error('Error fetching data:', error);
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


    const handleAssignment = async () =>{

    }
    const renderTable = () => {
        let headers = [];
        let rows = [];
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
                headers = ["样品名称", "材料","货号","材料规范","样品处置","材料类型", "订单编号", "操作"];
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
                headers = ["检测编号", "检测项目", "方法", "委托单号", "操作"];
                rows = data.map((item, index) => (
                    <tr key={index}>
                        <td>{item.original_no}</td>
                        <td>{item.test_item}</td>
                        <td>{item.test_method}</td>
                        <td>{item.order_num}</td>
                        <td>
                            <Button onClick={() => handleAssignment(item.order_num)}>分配</Button>
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


        </div>
    );
};

export default ContentArea;
