import React, { useState } from 'react';
import { Gantt } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css'; // 必须引入样式

const EquipmentTimeline = ({ tasks }) => {
    // 初始化 viewMode 状态
    const [viewMode, setViewMode] = useState('Hour');

    // 处理筛选框的变化
    const handleViewModeChange = (e) => {
        setViewMode(e.target.value); // 设置新的视图模式
    };

    if (!tasks || tasks.length === 0) {
        return <div>没有数据可显示</div>;
    }

    return (
        <div>
            <h3>设备使用时间</h3>
            {/* 筛选框切换视图模式 */}
            <div>
                <label>选择视图模式：</label>
                <select value={viewMode} onChange={handleViewModeChange}>
                    <option value="HalfHour">半小时</option>
                    <option value="Hour">小时</option>
                    <option value="Day">天</option>
                    <option value="Month">月</option>
                </select>
            </div>


            <Gantt 
                tasks={tasks} 
                viewMode={viewMode === 'HalfHour' ? 'Hour' : viewMode} // 半小时模式也使用 Hour 显示
                locale="zh-CN" // 如果需要中文格式
            />
        </div>
    );
};

export default EquipmentTimeline;
