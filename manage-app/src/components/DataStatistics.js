import React from 'react';
import { LineChart, Line, BarChart, Bar,  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../css/Statistics.css'
const DataStatistics = ({ employeeData, equipmentData, sumPrice, handleTimePeriodChange, timePeriod, timeStatus, yearlyPriceData, periodOptions, handlePeriodChange, selectedPeriod}) => {
    const groupByPeriod = (data, period) => {
        const grouped = {};
        data.forEach(item => {
            let key;

            if (period === 'year') {
                // 按年份分组：例如 2024
                key = `${item.year}`;
            } else if (period === 'month') {
                // 按月份分组：例如 2024-11
                key = `${item.year}-${item.month}`;
            } else if (period === 'quarter') {
                // 按季度分组：例如 2024-Q1
                key = `${item.year}${item.quarter}`;
            } else if (period.includes('季度')) {
                // 处理类似 '2024第四季度' 或 '2024年第一季度' 的具体季度
                const [year, quarter] = period.split('年');
                key = `${year}-${quarter}`; // 去掉 "季度" 字符
            } else if (period.includes('-')) {
                // 处理类似 '2023-11' 的月份格式
                key = period;  // 直接用 'yyyy-MM'
            } else {
                // 如果是类似 '2021' 的年份
                key = period;
            }
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(item);
        });
        return grouped;
    };


    const groupByYear = (data) => {
        const grouped = {};
        
        data.forEach(item => {
            const year = item.year;
            const month = item.month;
    
            if (!grouped[year]) {
                // 生成 12 个月的数据，并初始化为 0
                grouped[year] = Array.from({ length: 12 }, (_, index) => ({
                    month: `${year}-${String(index + 1).padStart(2, '0')}`, // 生成 '2024-01', '2024-02', ...
                    total_listed_price: 0
                }));
            }
            // 填充已有数据
            const monthIndex = parseInt(month, 10) - 1; // 转换为数组索引
            grouped[year][monthIndex].total_listed_price = item.total_listed_price;
        });
    
        return grouped;
    };

    const groupedData = groupByPeriod(employeeData, timePeriod);
    const groupedPrice = groupByYear(yearlyPriceData);  // 调用数据处理函数

    return (
        
        <div className="chart-container">
            {/* 总委托金额 */}
            <div className="total-price-container">
                <h2>总委托金额</h2>
                <div className="total-price-value">
                    {sumPrice.toLocaleString()} 元
                </div>
            </div>
            <hr className='chart-horizon'></hr>
            <h1 className='chart-title'>员工统计</h1>
            <div className="time-period-selector">
                <h4>请按时间段进行筛选：</h4>
                <select onChange={handleTimePeriodChange} value={timeStatus}>
                    <option value="month">按月</option>
                    <option value="quarter">按季度</option>
                    <option value="year">按年</option>
                </select>
                &nbsp;&nbsp;
                {timePeriod && periodOptions && (
                    <select onChange={handlePeriodChange} value={selectedPeriod}>
                    {timeStatus === 'month' ? (
                        <option value="">请选择月份</option>
                    ) : timeStatus === 'quarter'? (
                        <option value="">请选择季度</option>
                    ) : (
                        <option value="">请选择年份</option>
                    )}
                    {periodOptions.map((option, index) => (
                        <option key={index} value={option.month || option.quarter || option.year}>
                            {option.month || option.quarter || option.year}
                        </option>
                    ))}
                </select>
                )}
            </div>

            
            {/* 按时间粒度展示多个图表 */}
            {Object.keys(groupedData).map((periodKey) => {
                const periodData = groupedData[periodKey];                
                return (
                    <div key={periodKey} className={`bar-chart ${timePeriod !== 'year' ? 'time-classify' : ''}`}>
                        <h3>{periodKey}</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={periodData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="name" 
                                    textAnchor="end" // Align the rotated labels properly
                                    tick={{ fontSize: 12 }} // Adjust the font size for X-axis labels
                                />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="total_listed_price" fill="#ff7300" name="标准委托金额" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                );
            })}

            {/* <div className="bar-chart">
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
                        <Bar dataKey="total_samples" fill="#ffc658" name="样品数量" />
                    </BarChart>
                </ResponsiveContainer>
            </div> */}
            <hr className='chart-horizon'></hr>
            <h1 className='chart-title'>部门统计</h1>

            <h2>（每年每月的总委托金额）</h2>
            
            {/* 遍历每个年份，生成多个折线图 */}
            {Object.keys(groupedPrice).map(year => (
                <div key={year} className="bar-chart">
                    <h3>{year} 年</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={groupedPrice[year]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis 
                                domain={[0, Math.max(...groupedPrice[year].map(item => item.total_listed_price)) * 1.1]} 
                            />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="total_listed_price" stroke="#0066cc" name="总委托金额" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ))}


            <hr className='chart-horizon'></hr>
            <h1 className='chart-title'>设备统计</h1>
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

        </div>

    );
};

export default DataStatistics;

