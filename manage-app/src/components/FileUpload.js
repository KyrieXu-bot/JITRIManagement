import React, { useState } from 'react';
import axios from 'axios';
import config from '../config/config'; // 确保路径正确
import '../css/FileUpload.css'; // 引入CSS文件

const FileUpload = () => {
    const [files, setFiles] = useState([]);

    const onFileChange = (event) => {
        // 将现有文件和新选择的文件合并
        const newFiles = Array.from(event.target.files);

        setFiles(prevFiles => [...prevFiles, ...newFiles]);
    };

    const onFileUpload = async () => {
        const formData = new FormData();
        files.forEach(file => {
            formData.append("files", file);
        });
        try {
            const response = await axios.post(`${config.API_BASE_URL}/api/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log('Files uploaded successfully', response.data);
            // 更新文件列表状态或其他UI组件
        } catch (error) {
            console.error('Error uploading files', error);
            // 处理错误
        }
    };


    const removeFile = index => {
        setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    };

    return (
        <div className="file-upload-container">
            <p>上传文件</p>
            <input type="file" name="files" multiple onChange={onFileChange} />
            <button className="upload-button" onClick={onFileUpload}>
                上传文件
            </button>
            {/* 显示文件列表和下载链接 */}
            {files && files.length > 0 > 0 && (
                <ul className="file-list">
                    {files.map((file, index) => (
                        <li key={file.name} className="file-item">
                            <span className="file-name">{file.name}</span>
                            <button className="delete-button" onClick={() => removeFile(index)}>删除</button>                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default FileUpload;
