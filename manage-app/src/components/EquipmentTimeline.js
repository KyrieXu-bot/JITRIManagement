import React, { useState, useEffect } from 'react';
import { Gantt } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css'; // 必须引入样式
import '../css/EquipmentTimeline.css'
import { Modal, Button, Form, Row, Col } from 'react-bootstrap'; // 使用React Bootstrap进行模态弹窗和表单处理

const EquipmentTimeline = ({ tasks, equipments }) => {
    // 初始化 viewMode 状态
    const [viewMode, setViewMode] = useState('Hour');
    const [listCellWidth, setListCellWidth] = useState('200px');
    const [searchTerm, setSearchTerm] = useState(''); // 新增的搜索状态
    const [showMachineReserveModal, setShowMachineReserveModal] = useState(false); // 新增的搜索状态
    const [filteredEquipments, setFilteredEquipments] = useState([]); // 二级菜单：根据分类标签筛选设备
    const [selectedLabel, setSelectedLabel] = useState(''); // 当前选择的设备分类标签

    //预约时候的数据
    const [reservationData, setReservationData] = useState({
        equipment_id: '',
        start_time: '',
        end_time: ''
    });
    const filteredTasks = tasks
        .filter(task => task.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter(task => task.start && task.end); // 确保 start 和 end 存在;

    useEffect(() => {
        if (filteredTasks && filteredTasks.length > 0) {
            // 找到最长的 name
            const maxLength = Math.max(...filteredTasks.map(task => task.name.length));
            // 根据最长的 name 动态计算宽度，例如每个字符 10px
            setListCellWidth(`${Math.min(maxLength * 11, 400)}px`);
        }
    }, [filteredTasks]);

    // 处理筛选框的变化
    const handleViewModeChange = (e) => {
        setViewMode(e.target.value); // 设置新的视图模式
    };

    // 处理搜索框的变化
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value); // 更新搜索词
    };


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


    const handleReservation = () => {
        setShowMachineReserveModal(true);
    }


    const submitReservation = async () => {

    }

    return (
        <div className="timeline-container">
            <h3 className="gantt-title">设备使用时间</h3>
            {/* 筛选框切换视图模式 */}
            <div className="select-view-mode">
                <div>
                    <label>选择视图模式：</label>
                    <select value={viewMode} onChange={handleViewModeChange}>
                        <option value="HalfHour">半小时</option>
                        <option value="Hour">小时</option>
                        <option value="Day">天</option>
                        <option value="Month">月</option>
                    </select>
                </div>

                <div>
                    <label>按设备名称/委托单号搜索：</label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="输入设备名称/委托单号"
                    />
                </div>


                <Button onClick={handleReservation}>预约设备</Button>

            </div>

            <div className="gantt-container">
                {filteredTasks.length !== 0 ? (
                    <Gantt
                        tasks={filteredTasks}
                        viewMode={viewMode === 'HalfHour' ? 'Hour' : viewMode} // 半小时模式也使用 Hour 显示
                        locale="zh-CN" // 如果需要中文格式
                        listCellWidth={listCellWidth}
                        ganttHeight="100"
                    >
                    </Gantt>
                ) : (
                    <div>
                        没有查询到设备预约信息
                    </div>
                )}
            </div>



            {/* 设备预约按钮 */}
            <Modal show={showMachineReserveModal} onHide={() => setShowMachineReserveModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>设备预约</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
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
                                        value={reservationData.equipment_id}
                                        onChange={e => setReservationData({ ...reservationData, equipment_id: e.target.value })}
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
                        <Form.Group controlId="formStartTime">
                            <Form.Label>设备使用开始时间</Form.Label>
                            <Form.Control
                                type="datetime-local"
                                value={reservationData.start_time}
                                onChange={e => setReservationData({ ...reservationData, start_time: e.target.value })}
                            />
                        </Form.Group>

                        {/* 设备使用结束时间 */}
                        <Form.Group controlId="formEndTime">
                            <Form.Label>设备使用结束时间</Form.Label>
                            <Form.Control
                                type="datetime-local"
                                value={reservationData.end_time}
                                onChange={e => setReservationData({ ...reservationData, end_time: e.target.value })}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowMachineReserveModal(false)}>取消</Button>
                    <Button variant="primary" onClick={submitReservation}>预约
                    </Button>
                </Modal.Footer>
            </Modal>

        </div>
    );
};

export default EquipmentTimeline;
