const bcrypt = require('bcrypt');
const saltRounds = 10; // 可以根据需要调整加密强度

async function generateHashedPassword(password) {
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log("Hashed password:", hashedPassword);
        return hashedPassword;
    } catch (error) {
        console.error("Error hashing password:", error);
    }
}

// 使用方法：将需要加密的密码替换成'your_plain_password'
generateHashedPassword('jitri');
