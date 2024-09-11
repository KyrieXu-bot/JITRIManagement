import React from 'react';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../css/Statistics.css'
const DataStatistics = ({ data }) => {
    return (

<div className="chart-container">
            <div className="bar-chart">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" name="Machine Hours" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="pie-chart">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie dataKey="value" data={data} fill="#82ca9d" label={(entry) => entry.name} />
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

    );
};

export default DataStatistics;

