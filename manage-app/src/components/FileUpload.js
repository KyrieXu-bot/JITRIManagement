import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import config from '../config/config'; // 确保路径正确
import '../css/FileUpload.css'; // 引入CSS文件
import { Modal, Button } from 'react-bootstrap'; // 引入 Modal 组件

const FileUpload = ({ role, name, listedPrice, testItemId, onCloseAndRefresh }) => {

    const [qrcode, setQrcode] = useState('');
    const [files, setFiles] = useState({
        commissionFiles: [],   // 委托单附件
        rawDataFiles: [],      // 实验数据原始文件/记录
        reportFiles: []        // 文件报告
    });
    const [uploadedFiles, setUploadedFiles] = useState({
        commissionFiles: [],   // 委托单附件已上传
        rawDataFiles: [],      // 实验数据原始文件/记录已上传
        reportFiles: []        // 文件报告已上传
    });
    const [uploadStatus, setUploadStatus] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [fileToDelete, setFileToDelete] = useState(null);

    const [uploadProgress, setUploadProgress] = useState({
        '委托单附件': 0,
        '实验数据原始文件/记录': 0,
        '文件报告': 0
    }); // 进度条
    const [uploading, setUploading] = useState({
        '委托单附件': false,
        '实验数据原始文件/记录': false,
        '文件报告': false
    }); // 是否正在上传
    const [cancelSource, setCancelSource] = useState({
        '委托单附件': null,
        '实验数据原始文件/记录': null,
        '文件报告': null
    }); // 用于取消上传

    const fetchUploadedFiles = useCallback(async (testItemId) => {
        try {
            const response = await axios.get(`${config.API_BASE_URL}/api/files/${testItemId}`);
            const categorizedFiles = {
                commissionFiles: response.data.files.filter(file => file.category === '委托单附件'),
                rawDataFiles: response.data.files.filter(file => file.category === '实验数据原始文件/记录'),
                reportFiles: response.data.files.filter(file => file.category === '文件报告')
            };
            setUploadedFiles(categorizedFiles);
        } catch (error) {
            console.error('Error fetching uploaded files', error);
        }
    }, []);

    const generateQRCode = async (filename) => {
        try {
            const response = await axios.get(`${config.API_BASE_URL}/api/files/qrcode/${filename}`);
            setQrcode(response.data.qrcode);
        } catch (error) {
            console.error('Error generating QR Code:', error);
        }
    };

    // 页面加载时获取已上传的文件
    useEffect(() => {
        if (testItemId) {
            fetchUploadedFiles(testItemId);
        }
    }, [testItemId, fetchUploadedFiles]);


    const onFileChange = (category, event) => {
        // 将现有文件和新选择的文件合并
        const newFiles = Array.from(event.target.files);
        setFiles(prevFiles => ({
            ...prevFiles,
            [category]: [...prevFiles[category] || [], ...newFiles]
        }));
        // setFiles(prevFiles => [...prevFiles, ...newFiles]);
    };

    const onFileUpload = async (category) => {
        const categoryFiles = files[category];
        if (categoryFiles.length === 0) return;

        if (category === '实验数据原始文件/记录' && (!listedPrice || listedPrice === 0)) {
            setUploadStatus({ success: false, message: '请先 点击“完成”并填写标准价格！' });
            setShowUploadModal(true);
            return;
        }
        
        setUploading(prev => ({ ...prev, [category]: true }));
        const source = axios.CancelToken.source();
        setCancelSource(prev => ({ ...prev, [category]: source }));

        for (const file of categoryFiles) {
            const formData = new FormData();
            formData.append("files", file);
            formData.append("testItemId", testItemId);
            formData.append("category", category); // 添加分类信息

            try {
                const response = await axios.post(`${config.API_BASE_URL}/api/files/upload`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    onUploadProgress: (progressEvent) => {
                        if (progressEvent.total) {
                            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            setUploadProgress(percent); // 更新进度条
                        }
                    },
                    cancelToken: source.token // 传递取消令牌
                });
                // 更新已上传文件列表
                setUploadedFiles(prevUploaded => ({
                    ...prevUploaded,
                    [category]: [...prevUploaded[category] || [], ...response.data.files]
                }));

                setFiles(prevFiles => ({
                    ...prevFiles,
                    [category]: [] // 上传完成后清空该类别文件
                }));
                console.log('Files uploaded successfully', response.data);
                setUploadStatus({ success: true, message: '上传成功！' });

                setShowUploadModal(true); // 显示上传成功的 Modal
                fetchUploadedFiles(testItemId);


            } catch (error) {
                if (axios.isCancel(error)) {
                    console.log('Upload canceled');
                    setUploadStatus({ success: false, message: '上传已取消' });
                } else {
                    console.error('Error uploading files', error);
                    setUploadStatus({ success: false, message: '上传失败' });
                }
            }
        }
        setUploading(prev => ({ ...prev, [category]: false }));
    };



    // 删除待上传的文件
    const removeFile = (category, index) => {
        setFiles(prevFiles => ({
            ...prevFiles,
            [category]: prevFiles[category].filter((_, i) => i !== index)
        }));
    };


    // 删除已上传的文件
    const removeUploadedFile = async () => {
        try {
            await axios.delete(`${config.API_BASE_URL}/api/files/delete/${fileToDelete}`);
            // 更新已上传文件列表
            setUploadedFiles(prevUploaded => ({
                ...prevUploaded,
                commissionFiles: prevUploaded.commissionFiles.filter(file => file.project_id !== fileToDelete),
                rawDataFiles: prevUploaded.rawDataFiles.filter(file => file.project_id !== fileToDelete),
                reportFiles: prevUploaded.reportFiles.filter(file => file.project_id !== fileToDelete)
            }));
            setShowDeleteModal(false); // 隐藏删除确认 Modal
            setUploadStatus({ success: true, message: '删除成功！' });
            setShowUploadModal(true); // 显示删除成功的 Modal

        } catch (error) {
            console.error('Error deleting file', error);
        }
    };


    // 显示删除确认 Modal
    const confirmDelete = (projectId) => {
        setFileToDelete(projectId);
        setShowDeleteModal(true);
    };


    // 取消上传
    const cancelUpload = () => {
        if (cancelSource) {
            cancelSource.cancel('Upload canceled by user');
        }
    };


    // 在 Modal 关闭时刷新页面
    const handleModalClose = () => {
        setShowUploadModal(false);
        if (uploadStatus && uploadStatus.success) {
            onCloseAndRefresh(); // 调用父组件的回调函数来关闭详情页并刷新页面
        }
    };

    const formatDateTime = (isoString) => {
        const d = new Date(isoString);
        return d.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };


    return (
        <div className="file-upload-container">
            <h5>委托单附件：</h5>

            <div className="file-upload-module">
                <input type="file" multiple onChange={(e) => onFileChange('委托单附件', e)} />
                <button className="upload-button" onClick={() => onFileUpload('委托单附件')}>上传文件</button>
                {/* 进度条 */}
                {uploading['委托单附件'] && (
                    <div className="progress-bar">
                        <div className="progress" style={{ width: `${uploadProgress['委托单附件']}%` }} />
                        <button className="cancel-button" onClick={() => cancelUpload('委托单附件')}>取消</button>
                    </div>
                )}

                {files['委托单附件'] && files['委托单附件'].length > 0 && (
                    <ul className="file-list">
                        {files['委托单附件'].map((file, index) => (
                            <li key={file.name} className="file-item">
                                <span className="file-name">{file.name}</span>
                                <button className="delete-button" onClick={() => removeFile('委托单附件', index)}>删除</button>
                            </li>
                        ))}
                    </ul>
                )}
                {/* 显示已上传的委托单附件文件 */}
                {uploadedFiles.commissionFiles && uploadedFiles.commissionFiles.length > 0 && (
                    <ul className="file-list">
                        {uploadedFiles.commissionFiles.map((file) => (
                            <li key={file.filename} className="file-item">
                                <span className="file-name">{file.filename}</span>
                                <span
                                    className="upload-time"
                                >
                                    (上传于{formatDateTime(file.upload_time)})
                                </span>
                                {/* 预览按钮（仅支持特定文件类型） */}
                                {/\.(pdf|png|jpg|jpeg|gif|docx|pptx|xlsx|txt)$/i.test(file.filename) && (
                                    <a href={`${config.API_BASE_URL}/api/files/preview/${file.filename}`} target="_blank" rel="noopener noreferrer">
                                        预览
                                    </a>
                                )}
                                &nbsp;
                                <a href={`${config.API_BASE_URL}/api/files/download/${file.filename}`} download>下载</a>
                                {role !== 'sales' && (
                                    <button className="delete-button" onClick={() => confirmDelete(file.project_id)}>删除</button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Module for 实验数据原始文件/记录 */}
            <h5>实验数据原始文件/记录：</h5>
            <div className="file-upload-module">
                <input type="file" multiple onChange={(e) => onFileChange('实验数据原始文件/记录', e)} />
                <button className="upload-button" onClick={() => onFileUpload('实验数据原始文件/记录')}>上传文件</button>

                {/* 进度条 */}
                {uploading['实验数据原始文件/记录'] && (
                    <div className="progress-bar">
                        <div className="progress" style={{ width: `${uploadProgress['实验数据原始文件/记录']}%` }} />
                        <button className="cancel-button" onClick={() => cancelUpload('实验数据原始文件/记录')}>取消</button>
                    </div>
                )}

                {files['实验数据原始文件/记录'] && files['实验数据原始文件/记录'].length > 0 && (
                    <ul className="file-list">
                        {files['实验数据原始文件/记录'].map((file, index) => (
                            <li key={file.name} className="file-item">
                                <span className="file-name">{file.name}</span>
                                <button className="delete-button" onClick={() => removeFile('实验数据原始文件/记录', index)}>删除</button>
                            </li>
                        ))}
                    </ul>
                )}
                {/* 显示已上传的实验数据原始文件/记录 */}
                {uploadedFiles.rawDataFiles && uploadedFiles.rawDataFiles.length > 0 && (
                    <ul className="file-list">
                        {uploadedFiles.rawDataFiles.map((file) => (
                            <li key={file.filename} className="file-item">
                                <span className="file-name">{file.filename}</span>
                                <span
                                    className="upload-time"
                                >
                                    (上传于{formatDateTime(file.upload_time)})
                                </span>

                                {file.last_download_time && (
                                    <span className="upload-time">（{file.last_download_by}下载于 {formatDateTime(file.last_download_time)}）</span>
                                )}
                                {/* 预览按钮（仅支持特定文件类型） */}
                                <div className="file-actions">
                                    {/* 预览和下载链接另起一行 */}
                                    {/\.(pdf|png|jpg|jpeg|gif|docx|pptx|xlsx|txt)$/i.test(file.filename) && (
                                        <a href={`${config.API_BASE_URL}/api/files/preview/${file.filename}`} target="_blank" rel="noopener noreferrer">
                                            预览
                                        </a>
                                    )}
                                    &nbsp;
                                    <button
                                        className="download-button"
                                        onClick={async () => {
                                            try {
                                                if (role === 'sales') {
                                                    await axios.post(`${config.API_BASE_URL}/api/files/record-download`, {
                                                        filename: file.filename,
                                                        name,
                                                    });
                                                }

                                                const response = await axios.get(`${config.API_BASE_URL}/api/files/download/${file.filename}`, {
                                                    responseType: 'blob',
                                                });

                                                const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
                                                const link = document.createElement('a');
                                                link.href = blobUrl;
                                                link.setAttribute('download', file.filename);
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                            } catch (error) {
                                                console.error('下载失败', error);
                                            }
                                        }}
                                    >
                                        下载
                                    </button>
                                    {role !== 'sales' && (
                                        <button className="delete-button" onClick={() => confirmDelete(file.project_id)}>删除</button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Module for 文件报告 */}
            <h5>文件报告：</h5>
            <div className="file-upload-module">
                <input type="file" multiple onChange={(e) => onFileChange('文件报告', e)} />
                <button className="upload-button" onClick={() => onFileUpload('文件报告')}>上传文件</button>

                {/* 进度条 */}
                {uploading['文件报告'] && (
                    <div className="progress-bar">
                        <div className="progress" style={{ width: `${uploadProgress['文件报告']}%` }} />
                        <button className="cancel-button" onClick={() => cancelUpload('文件报告')}>取消</button>
                    </div>
                )}

                {files['文件报告'] && files['文件报告'].length > 0 && (
                    <ul className="file-list">
                        {files['文件报告'].map((file, index) => (
                            <li key={file.name} className="file-item">
                                <span className="file-name">{file.name}</span>
                                <button className="delete-button" onClick={() => removeFile('文件报告', index)}>删除</button>
                            </li>
                        ))}
                    </ul>
                )}
                {/* 显示已上传的文件报告 */}
                {uploadedFiles.reportFiles && uploadedFiles.reportFiles.length > 0 && (
                    <ul className="file-list">
                        {uploadedFiles.reportFiles.map((file) => (
                            <li key={file.filename} className="file-item">
                                <span className="file-name">{file.filename}</span>
                                <span
                                    className="upload-time"
                                >
                                    (上传于{formatDateTime(file.upload_time)})
                                </span>
                                {/* 预览按钮（仅支持特定文件类型） */}
                                {/\.(pdf|png|jpg|jpeg|gif|docx|pptx|xlsx|txt)$/i.test(file.filename) && (
                                    <a href={`${config.API_BASE_URL}/api/files/preview/${file.filename}`} target="_blank" rel="noopener noreferrer">
                                        预览
                                    </a>
                                )}
                                &nbsp;
                                <a href={`${config.API_BASE_URL}/api/files/download/${file.filename}`} download>下载</a>
                                <button className="delete-button" onClick={() => confirmDelete(file.project_id)}>删除</button>
                                <button className="qrcode-button" onClick={() => generateQRCode(file.filename)}>生成二维码</button>

                            </li>
                        ))}
                    </ul>
                )}
                {qrcode && <img src={qrcode} alt="QR Code" />}
            </div>
            {/* {uploadStatus && <p>{uploadStatus.message}</p>} */}

            {/* 上传成功 Modal */}
            <Modal show={showUploadModal} onHide={handleModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>操作提示</Modal.Title>
                </Modal.Header>
                <Modal.Body>{uploadStatus && uploadStatus.message}</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleModalClose}>确定</Button>
                </Modal.Footer>
            </Modal>

            {/* 删除确认 Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>确认删除</Modal.Title>
                </Modal.Header>
                <Modal.Body>您确定要删除这个文件吗？</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>取消</Button>
                    <Button variant="danger" onClick={removeUploadedFile}>删除</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default FileUpload;
