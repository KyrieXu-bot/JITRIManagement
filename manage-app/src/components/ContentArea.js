import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap'; // 使用React Bootstrap进行模态弹窗和表单处理

const ContentArea = ({ selected }) => {
    const [data, setData] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentItem, setCurrentItem] = useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    useEffect(() => {
        if (selected === 'getCommission') {
            fetchData();
        }
    }, [selected]);

    const fetchData = async () => {
        try {
            const response = await axios.get('http://localhost:3003/api/orders');
            setData(response.data);
            console.log(response.data)
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleEdit = (item) => {
        setCurrentItem(item);
        setShowModal(true);
    };

    const handleDelete = (order_num) => {
        setShowDeleteConfirm(true);
        setCurrentItem({ order_num });
    };

    const updateItem = async () => {
        try {
            await axios.put(`http://localhost:3003/api/orders/${currentItem.order_num}`, currentItem);
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Error updating order:', error);
        }
    };

    const deleteItem = async () => {
        try {
            await axios.delete(`http://localhost:3003/api/orders/${currentItem.order_num}`);
            setShowDeleteConfirm(false);
            fetchData();
        } catch (error) {
            console.error('Error deleting order:', error);
        }
    };


    return (
        <div style={{ width: '70%', float: 'right', overflow: 'auto' }}>
            {selected === 'getCommission' && (
                <div>
                    <h2>详细信息</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>委托单号</th>
                                <th>委托单位</th>
                                <th>联系人</th>
                                <th>联系电话</th>
                                <th>联系人邮箱</th>
                                <th>付款人</th>
                                <th>付款人电话</th>
                                <th>地址</th>
                                <th>检测项目</th>
                                <th>材料类型</th>
                                <th>样品</th>
                                <th>服务加急</th>
                                <th>备注</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, index) => (
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
                            ))}
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
