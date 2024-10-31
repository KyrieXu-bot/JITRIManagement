const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// 设置存储配置
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/'); // 使用绝对路径

        console.log("Upload path: ", uploadPath); // 日志记录路径

        cb(null, uploadPath) // 确保此目录已存在，否则需要创建
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
});

// 修改Multer配置以接收多个文件
const upload = multer({ storage: storage }).array('files', 10); // 例如，这里设置最多可以上传10个文件

router.post('/', (req, res) => {
    upload(req, res, function (err) {

        if (err instanceof multer.MulterError) {
            // 发生错误
            return res.status(500).json(err);
        } else if (err) {
            // 发生错误
            return res.status(500).json(err);
        }
        // 没有错误，处理文件，检查重复
        const files = req.files;
        let filenames = files.map(file => file.filename);
        // 检查重复文件
        let existingFiles = [];
        filenames.forEach(filename => {
            if (fs.existsSync(path.join(__dirname, 'uploads', filename))) {
                existingFiles.push(filename);
            }
        });

        if (existingFiles.length > 0) {
            return res.status(400).send({
                message: "Files already exist: " + existingFiles.join(", "),
            });
        }

        // 所有文件均成功上传
        console.log('Files uploaded successfully');
        res.send({
            status: "success",
            message: "Files uploaded successfully",
            files: filenames
        });
    });
});


router.get('/api/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const directoryPath = path.join(__dirname, 'uploads');
    const filePath = path.join(directoryPath, filename);

    res.download(filePath, filename, (err) => {
        if (err) {
            res.status(500).send({
                message: "Could not download the file. " + err,
            });
        }
    });
});

module.exports = router;