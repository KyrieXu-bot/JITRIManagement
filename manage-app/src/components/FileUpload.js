import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import config from '../config/config'; // 确保路径正确
import '../css/FileUpload.css'; // 引入CSS文件
import { Modal, Button } from 'react-bootstrap'; // 引入 Modal 组件

const FileUpload = ({ testItemId, onCloseAndRefresh }) => {
    const [files, setFiles] = useState([]);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [fileToDelete, setFileToDelete] = useState(null);

    const fetchUploadedFiles = useCallback(async (testItemId) => {
        try {
            const response = await axios.get(`${config.API_BASE_URL}/api/files/${testItemId}`);
            setUploadedFiles(response.data.files);
        } catch (error) {
            console.error('Error fetching uploaded files', error);
        }
    }, []);


    // 页面加载时获取已上传的文件
    useEffect(() => {
        if (testItemId) {
            fetchUploadedFiles(testItemId);
        }
    }, [testItemId, fetchUploadedFiles]);


    const onFileChange = (event) => {
        // 将现有文件和新选择的文件合并
        const newFiles = Array.from(event.target.files);

        setFiles(prevFiles => [...prevFiles, ...newFiles]);
    };

    const onFileUpload = async () => {

        if (files.length === 0) return;
        for (const file of files) {
            const formData = new FormData();
            formData.append("files", file);
            formData.append("testItemId", testItemId);

            try {
                const response = await axios.post(`${config.API_BASE_URL}/api/files/upload`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                setUploadedFiles(prevUploaded => [...prevUploaded, ...response.data.files]);

                setFiles([]);  // 清空待上传的文件
                console.log('Files uploaded successfully', response.data);
                setUploadStatus({ success: true, message: '上传成功！' });
                setShowUploadModal(true); // 显示上传成功的 Modal


            } catch (error) {
                // 处理错误
                console.error('Error uploading files', error);
                setUploadStatus({ success: false, message: '上传失败' });
            }
        };
    };



    // 删除待上传的文件
    const removeFile = index => {
        setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    };


    // 删除已上传的文件
    const removeUploadedFile = async () => {
        try {
            await axios.delete(`${config.API_BASE_URL}/api/files/delete/${fileToDelete}`);
            setUploadedFiles(prevUploaded => prevUploaded.filter(file => file.project_id !== fileToDelete));
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


    // 在 Modal 关闭时刷新页面
    const handleModalClose = () => {
        setShowUploadModal(false);
        if (uploadStatus && uploadStatus.success) {
            onCloseAndRefresh(); // 调用父组件的回调函数来关闭详情页并刷新页面
        }
    };

    return (
        <div className="file-upload-container">
            <div>
                <input type="file" name="files" multiple onChange={onFileChange}/>
                <button className="upload-button" onClick={onFileUpload}>上传文件</button>
            </div>
            {uploadStatus && <p>{uploadStatus.message}</p>}

            {/* 待上传文件列表 */}
            {files && files.length > 0 && (
                <ul className="file-list">
                    {files.map((file, index) => (
                        <li key={file.name} className="file-item">
                            <span className="file-name">{file.name}</span>
                            <button className="delete-button" onClick={() => removeFile(index)}>删除</button>
                        </li>
                    ))}
                </ul>
            )}

            {/* 已上传文件列表 */}
            {(uploadedFiles || []).length > 0 && (
                <ul className="file-list">
                    {uploadedFiles.map((file, index) => {
                        return (
                            <li key={file.filename} className="file-item">
                                <span className="file-name">{file.filename}</span>
                                <a href={`${config.API_BASE_URL}/api/files/download/${file.filename}`} download>下载</a>
                                <button className="delete-button" onClick={() => confirmDelete(file.project_id)}>删除</button>
                            </li>
                        );
                    })}
                </ul>
            )}

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
