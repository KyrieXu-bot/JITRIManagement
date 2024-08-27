import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ContentArea = ({ selected }) => {
    const [customers, setCustomers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({}); // Form data for create or update

    useEffect(() => {
        if (selected === 'customers') {
            fetchCustomers();
        }
    }, [selected]);

    const fetchCustomers = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/customers');
            setCustomers(response.data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const handleDelete = async (customerId) => {
        try {
            await axios.delete(`http://localhost:3001/api/customers/${customerId}`);
            fetchCustomers(); // Refresh the list after delete
        } catch (error) {
            console.error('Error deleting customer:', error);
        }
    };

    const handleEdit = (customer) => {
        setFormData(customer);
        setShowForm(true);
    };

    const handleNew = () => {
        setFormData({}); // clear form for new entry
        setShowForm(true);
    };

    return (
        <div style={{ width: '70%', float: 'right' }}>
            {selected === 'customers' && (
                <div>
                    <h2>客户列表</h2>
                    <button onClick={handleNew}>新增</button>
                    {showForm && (
                        <div>
                            {/* Simple form for demonstration */}
                            <input type="text" placeholder="Customer Name" value={formData.customer_name || ''} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} />
                            {/* Additional fields should be added here */}
                            <button onClick={() => {/* Submit form logic here */}}>保存</button>
                        </div>
                    )}
                    <table>
                        <thead>
                            <tr>
                                <th>客户名称</th>
                                <th>委托联系人名称</th>
                                <th>电话号码</th>
                                <th>Email</th>
                                <th>Payment ID</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((customer) => (
                                <tr key={customer.customer_id}>
                                    <td>{customer.customer_name}</td>
                                    <td>{customer.contact_name}</td>
                                    <td>{customer.contact_phone_num}</td>
                                    <td>{customer.contact_email}</td>
                                    <td>{customer.payment_id || '无'}</td>
                                    <td>
                                        <button onClick={() => handleEdit(customer)}>修改</button>
                                        <button onClick={() => handleDelete(customer.customer_id)}>删除</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ContentArea;

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';

// const ContentArea = ({ selected }) => {


//     const [customers, setCustomers] = useState([]);

//     useEffect(() => {
//         if (selected === 'customers') {
//             fetchCustomers();
//         }
//     }, [selected]);

//     const fetchCustomers = async () => {
//         try {
//             const response = await axios.get('http://localhost:3001/api/customers');
//             setCustomers(response.data);
//         } catch (error) {
//             console.error('Error fetching customers:', error);
//         }
//     };


//     return (
//         <div style={{ width: '70%', float: 'right' }}>
//             {selected === 'customers' && (
//                 <div>
//                     <h2>客户列表</h2>
//                     <table>
//                         <thead>
//                             <tr>
//                                 <th>客户名称</th>
//                                 <th>委托联系人名称</th>
//                                 <th>电话号码</th>
//                                 <th>Email</th>
//                                 <th>Payment ID</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {customers.map((customer) => (
//                                 <tr key={customer.customer_id}>
//                                     <td>{customer.customer_name}</td>
//                                     <td>{customer.contact_name}</td>
//                                     <td>{customer.contact_phone_num}</td>
//                                     <td>{customer.contact_email}</td>
//                                     <td>{customer.payment_id || '无'}</td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default ContentArea;
