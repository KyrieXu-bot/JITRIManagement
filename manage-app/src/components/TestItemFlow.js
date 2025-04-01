import { Steps } from 'antd';
import { 
    UserOutlined, 
    SolutionOutlined, 
    LoadingOutlined, 
    CheckCircleOutlined, 
    FileDoneOutlined, 
    DeliveredProcedureOutlined,
    EditOutlined,
} from '@ant-design/icons';

const departments = [
    { department_id: 1, department_name: '显微组织表征实验室' },
    { department_id: 2, department_name: '物化性能测试实验室' },
    { department_id: 3, department_name: '力学性能测试实验室' }
];


const TestItemFlow = ({ selectedDetails }) => {
    // 获取部门名称
    const department = departments.find(d => d.department_id === selectedDetails.department_id);
    const departmentName = department ? department.department_name : "未知部门";
    
    const steps = [
        {
            title: '开单',
            description: `开单员: 马婷 (KD001)`,
            time: selectedDetails.create_time,
            icon: <UserOutlined />,
        },
        {
            title: '分配',
            description: `室主任: ${departmentName}`, // 需要查询部门的室主任
            time: selectedDetails.assign_time,
            icon: <SolutionOutlined />,
        },
        {
            title: '指派',
            description: `组长: ${selectedDetails.manager_names || '未分配'}`,
            time: selectedDetails.appoint_time,
            icon: <UserOutlined />,
        },
        {
            title: '完成',
            description: `实验员: ${selectedDetails.team_names || '未指派'}`,
            time: selectedDetails.latest_finish_time,
            icon: <EditOutlined />,
        },
        {
            title: '审批',
            description: `组长: ${selectedDetails.manager_names || '未分配'}`,
            time: selectedDetails.check_time,
            icon: <FileDoneOutlined />,
        },
        {
            title: '交付',
            description: `业务员: ${selectedDetails.sales_names || '未指定'}`,
            time: selectedDetails.deliver_time,
            icon: <DeliveredProcedureOutlined />,
        },
    ];

    const currentStep = steps.findIndex(step => !step.time);

    return (
        <Steps
            current={currentStep} // 找到未完成的步骤
            direction="vertical"
        >
            {steps.map((step, index) => (
                <Steps.Step
                    key={index}
                    title={step.title}
                    description={
                        <>
                            <div>{step.description}</div>
                            <div>{step.time ? new Date(step.time).toLocaleString() : '未完成'}</div>
                        </>
                    }
                    icon={
                        index < currentStep
                            ? <CheckCircleOutlined /> 
                            : index === currentStep
                                ? <LoadingOutlined /> 
                                : step.icon
                    }
                />
            ))}
        </Steps>
    );
};

export default TestItemFlow;