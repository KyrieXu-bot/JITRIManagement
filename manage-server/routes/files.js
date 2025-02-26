const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../models/database'); // 确保数据库模块正确导入

const router = express.Router();

// 设置存储配置
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/'); // 使用绝对路径
        cb(null, uploadPath) // 确保此目录已存在，否则需要创建
    },
    // filename: function (req, file, cb) {
    //     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    //     cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    // }
    filename: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/');
        const originalName = Buffer.from(file.originalname, "latin1").toString(
            "utf8"
          );
        let fileName = originalName;
        let count = 0;

        // 检查文件是否已经存在，如果存在就添加编号
        while (fs.existsSync(path.join(uploadPath, fileName))) {
            count++;
            const fileExtension = path.extname(originalName);
            const baseName = path.basename(originalName, fileExtension);
            fileName = `${baseName}(${count})${fileExtension}`;
        }
        cb(null, fileName);
    }
});

// 修改Multer配置以接收多个文件
const upload = multer({ storage: storage }).array('files', 10); // 例如，这里设置最多可以上传10个文件

router.post('/upload', (req, res) => {
    upload(req, res, async function (err) {
        const projectId = Date.now();
        const files = req.files;
        const testItemId = req.body.testItemId;
        const category = req.body.category; 
        if (err instanceof multer.MulterError) {
            // 发生错误
            return res.status(500).json(err);
        } else if (err) {
            // 发生错误
            return res.status(500).json(err);
        }

        if (!files || files.length === 0) {
            return res.status(400).send({ message: "No files uploaded" });
        }

        const fileDetails = files.map(file => ({
            filename: file.filename,
            path: file.path,
            projectId: projectId, // 为每个文件关联同一个projectId
            testItemId: testItemId,
            category: category
        }));

        // 保存文件和项目ID到数据库的逻辑
        try {
            await db.saveFilesToDatabase(fileDetails);
            res.send({
                status: "success",
                message: "Files uploaded and project created successfully",
                projectId: projectId,
                files: fileDetails
            });
        } catch (error) {
            console.error('Failed to save files or create project', error);
            res.status(500).send({ status: "error", message: "Failed to process files" });
        }
    });
});



router.get('/:testItemId', async (req, res) => {
    try {
        const { testItemId } = req.params;
        // 查询数据库，获取与 projectId 相关的文件信息
        const files = await db.getFilesByTestItemId(testItemId);
        
        // 如果找不到文件，则返回空数组，状态码为200
        res.status(200).json({
            status: "success",
            message: files.length > 0 ? "Files found." : "No files found for the provided testItemId.",
            files: files
        });
    } catch (error) {
        console.error('Error fetching files for projectId:', error);
        res.status(500).send({
            status: "failed",
            message: "Could not fetch files for the given projectId."
        });
    }
});


router.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    console.log(__dirname)
    const directoryPath = path.resolve(__dirname, '../uploads');
    const filePath = path.join(directoryPath, filename);

    res.download(filePath, filename, (err) => {
        if (err) {
            res.status(500).send({
                message: "Could not download the file. " + err,
            });
        }
    });
});


// 删除文件路由
router.delete('/delete/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;

        // 获取与项目ID关联的文件信息
        const files = await db.getFilesByProjectId(projectId);

        if (!files || files.length === 0) {
            return res.status(404).json({ message: "No files found for the provided projectId." });
        }

        // 遍历每个文件，尝试从服务器中删除
        for (const file of files) {
            const filePath = path.join(__dirname, '../uploads', file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath); // 删除文件
            } else {
                console.warn(`File not found: ${filePath}`);
            }
        }

        // 删除数据库中的文件记录
        await db.deleteFilesByProjectId(projectId);

        res.status(200).json({
            status: "success",
            message: "Files deleted successfully."
        });

    } catch (error) {
        console.error('Error deleting files:', error);
        res.status(500).send({
            status: "failed",
            message: "Could not delete files for the given projectId."
        });
    }
});

module.exports = router;