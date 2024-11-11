import React from 'react';
import { BarChart, Bar,  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../css/Statistics.css'
const DataStatistics = ({ employeeData, equipmentData, sumPrice}) => {
    return (

        <div className="chart-container">

            {/* 总委托金额 */}
            <div className="total-price-container">
                <h2>总委托金额</h2>
                <div className="total-price-value">
                    {sumPrice.toLocaleString()} 元
                </div>
            </div>
            <div className="bar-chart">
                <h2>各员工委托金额</h2>
                <ResponsiveContainer width="85%" height="85%">
                    <BarChart data={employeeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total_listed_price" fill="#ff7300" name="标准委托金额" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="bar-chart">
                <h2>员工工时</h2>
                <ResponsiveContainer width="85%" height="85%">
                    <BarChart data={employeeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {/* <Bar dataKey="total_machine_hours" fill="#8884d8" name="Machine Hours" /> */}
                        <Bar dataKey="total_work_hours" fill="#82ca9d" name="工时" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bar-chart">
                <h2>样品数据</h2>
                <ResponsiveContainer width="85%" height="85%">
                    <BarChart data={employeeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {/* <Bar dataKey="total_machine_hours" fill="#8884d8" name="Machine Hours" /> */}
                        <Bar dataKey="total_samples" fill="#ffc658" name="样品数量" />
                    </BarChart>
                </ResponsiveContainer>
            </div>


            <div className="bar-chart equipment-bar">
                <h2>设备数据</h2>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                        data={equipmentData}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 100, // 增大底部的边距以显示设备名称
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="equipment_name"
                            angle={-45}
                            textAnchor="end"
                            interval={0}
                            tickFormatter={(name) => name.length > 10 ? `${name.substring(0, 10)}...` : name}

                            tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend verticalAlign="top" height={36} /> {/* 将 Legend 放置在顶部 */}
                        <Bar 
                            dataKey="total_machine_hours" 
                            fill="#ffc658" 
                            name="机时数据" 
                            />
                    </BarChart>
                </ResponsiveContainer>

            </div>


            {/* <div className="pie-chart">
                <h2>设备数据</h2>
                <ResponsiveContainer width="85%" height="85%">
                    <PieChart>
                        <Pie
                            dataKey="total_machine_hours"
                            data={equipmentData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#82ca9d"
                            labelLine={true}
                            label={({ equipment_name, total_machin_hours, cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                const RADIAN = Math.PI / 180;
                                const radius = outerRadius + 30; // Radius of the label
                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                return (
                                    <text
                                        x={x}
                                        y={y}
                                        fill="#8884d8"
                                        textAnchor={x > cx ? 'start' : 'end'}
                                        dominantBaseline="central"
                                    >
                                        {`${equipment_name} (${total_machin_hours} hrs)`}
                                    </text>
                                );
                            }}
                        />
                        <Tooltip formatter={(value) => [`${value} hrs`, 'Machine Hours']} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div> */}

        </div>

    );
};

export default DataStatistics;

