import { Steps } from 'antd';
import {
    UserOutlined,
    SolutionOutlined,
    LoadingOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    DeliveredProcedureOutlined,
    EditOutlined,
    AuditOutlined,       // 用于审批类步骤
    FileDoneOutlined,    // 用于报告审核
    CustomerServiceOutlined, // 用于客户确认
    SafetyCertificateOutlined // 用于质量归档
} from '@ant-design/icons';

const departments = [
    { department_id: 1, department_name: '显微组织表征实验室' },
    { department_id: 2, department_name: '物化性能测试实验室' },
    { department_id: 3, department_name: '力学性能测试实验室' },
    { department_id: 5, department_name: '委外' }
];

const TestItemFlow = ({ selectedDetails }) => {
    const department = departments.find(d => d.department_id === selectedDetails.department_id);
    const departmentName = department ? department.department_name : "未知部门";

    const steps = [
        {
            title: '开单',
            description: `开单员: KD001`,
            time: selectedDetails.create_time,
            icon: <UserOutlined />,
            required: true
        },
        {
            title: '分配小组',
            description: `室主任: ${departmentName}`,
            time: selectedDetails.assign_time,
            icon: <SolutionOutlined />,
            required: true
        },
        {
            title: '指派检测员',
            description: `组长: ${selectedDetails.manager_names || '未分配'}`,
            time: selectedDetails.appoint_time,
            icon: <UserOutlined />,
            required: true
        },
        {
            title: '测试完成',
            description: `实验员: ${selectedDetails.team_names || '未指派'}`,
            time: selectedDetails.latest_finish_time,
            icon: <EditOutlined />,
            required: true
        },
        {
            title: '组长审核',
            description: `组长: ${selectedDetails.manager_names || '未分配'}\n备注: ${selectedDetails.check_note || '无'}`,
            time: selectedDetails.check_time,
            rejectTime: selectedDetails.check_reject_time,
            statusField: selectedDetails.status,
            successCode: '3',
            failCode: '4',
            icon: <AuditOutlined />,  // 审批图标
            required: true
        },
        {
            title: '报告批准',
            description: `室主任: ${departmentName}\n备注: ${selectedDetails.report_note || '无'}`,
            time: selectedDetails.report_approved_time,
            rejectTime: selectedDetails.report_rejected_time,
            statusField: selectedDetails.status,
            successCode: '7',
            failCode: '8',
            icon: <FileDoneOutlined />,  // 报告审核图标
            required: true
        },
        {
            title: '客户确认',
            description: `业务员: ${selectedDetails.sales_names || '未指定'}\n备注: ${selectedDetails.business_note || '无'}`,
            time: selectedDetails.cust_approve_time,
            rejectTime: selectedDetails.cust_reject_time,
            statusField: selectedDetails.status,
            successCode: '9',
            failCode: '6',
            icon: <CustomerServiceOutlined />,  // 客户服务图标
            required: true
        },
        {
            title: '质量归档',
            description: `质量专员: ZL003\n备注: ${selectedDetails.archive_note || '无'}`,
            time: selectedDetails.archive_time,
            rejectTime: selectedDetails.archive_reject_time,
            statusField: selectedDetails.status,
            successCode: '10',
            failCode: '11',
            icon: <SafetyCertificateOutlined />,  // 质量认证图标
            required: true
        },
        {
            title: '交付',
            description: `业务员: ${selectedDetails.sales_names || '未指定'}`,
            time: selectedDetails.deliver_time,
            icon: <DeliveredProcedureOutlined />,
            required: true
        }
    ];

    // 计算当前步骤
    const calculateCurrentStep = () => {
        // 找到最后一个完成的步骤
        const lastCompletedIndex = steps.findLastIndex(step => {
            if (step.successCode !== undefined) {
                // 对于审批步骤，检查状态码
                return step.statusField === step.successCode || step.statusField === step.failCode;
            } else {
                // 对于普通步骤，检查时间
                return step.time !== null;
            }
        });

        // 如果找到已完成步骤，则当前步骤是下一个
        if (lastCompletedIndex >= 0 && lastCompletedIndex < steps.length - 1) {
            return lastCompletedIndex + 1;
        }
        
        // 如果没有任何步骤完成，则从第一个开始
        return 0;
    };

    const currentStep = calculateCurrentStep();

    return (
        <Steps current={currentStep} direction="vertical">
            {steps.map((step, index) => {
                const isReviewStep = step.successCode !== undefined;
                const isSuccess = isReviewStep && step.statusField === step.successCode;
                const isFail = isReviewStep && step.statusField === step.failCode;
                const isCompleted = index < currentStep || isSuccess || (step.time && !isReviewStep);
                const isCurrent = index === currentStep;

                const finalIcon = isSuccess
                    ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    : isFail
                        ? <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                        : isCurrent
                            ? <LoadingOutlined />
                            : isCompleted
                                ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                : step.icon;

                // 时间显示逻辑
                const timeLabel = (() => {
                    if (isReviewStep) {
                        if (isSuccess && step.time) {
                            return <div>[已通过] {new Date(step.time).toLocaleString()}</div>;
                        } else if (isFail && step.rejectTime) {
                            return <div style={{ color: '#ff4d4f' }}>[已驳回] {new Date(step.rejectTime).toLocaleString()}</div>;
                        }
                    } else if (step.time) {
                        return <div>{new Date(step.time).toLocaleString()}</div>;
                    }
                    return <div>未完成</div>;
                })();

                return (
                    <Steps.Step
                        key={index}
                        title={step.title}
                        description={
                            <>
                                <div style={{ whiteSpace: 'pre-wrap' }}>{step.description}</div>
                                {timeLabel}
                            </>
                        }
                        icon={finalIcon}
                        status={
                            isFail ? 'error' : 
                            isCurrent ? 'process' : 
                            isCompleted ? 'finish' : 'wait'
                        }
                    />
                );
            })}
        </Steps>
    );
};

export default TestItemFlow;