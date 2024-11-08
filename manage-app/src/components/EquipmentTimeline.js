import React, { useState, useEffect } from 'react';
import { Gantt } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css'; // 必须引入样式
import '../css/EquipmentTimeline.css'
const EquipmentTimeline = ({ tasks }) => {
    // 初始化 viewMode 状态
    const [viewMode, setViewMode] = useState('Hour');
    const [listCellWidth, setListCellWidth] = useState('200px');

    useEffect(() => {
        if (tasks && tasks.length > 0) {
            // 找到最长的 name
            const maxLength = Math.max(...tasks.map(task => task.name.length));
            // 根据最长的 name 动态计算宽度，例如每个字符 10px
            setListCellWidth(`${Math.min(maxLength * 11, 400)}px`);
        }
    }, [tasks]);

    // 处理筛选框的变化
    const handleViewModeChange = (e) => {
        setViewMode(e.target.value); // 设置新的视图模式
    };

    if (!tasks || tasks.length === 0) {
        return <div>没有数据可显示</div>;
    }

    return (
        <div className="timeline-container">
            <h3 className="gantt-title">设备使用时间</h3>
            {/* 筛选框切换视图模式 */}
            <div className="select-view-mode">
                <label>选择视图模式：</label>
                <select value={viewMode} onChange={handleViewModeChange}>
                    <option value="HalfHour">半小时</option>
                    <option value="Hour">小时</option>
                    <option value="Day">天</option>
                    <option value="Month">月</option>
                </select>


            </div>

            <div className="gantt-container">
                <Gantt 
                    tasks={tasks} 
                    viewMode={viewMode === 'HalfHour' ? 'Hour' : viewMode} // 半小时模式也使用 Hour 显示
                    locale="zh-CN" // 如果需要中文格式
                    listCellWidth={listCellWidth}
                >
                </Gantt>
            </div>
        </div>
    );
};

export default EquipmentTimeline;
