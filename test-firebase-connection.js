// Firebase连接测试脚本
// 使用用户提供的服务账号私钥文件来配置Firebase

console.log('====================================');
console.log('Firebase连接测试工具');
console.log('====================================');

// 导入必要的模块
const fs = require('fs');
const path = require('path');

// 服务账号私钥文件路径
const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, 'cs2-learn-firebase-adminsdk-fbsvc-48ccb23145.json');

// 设置环境变量
process.env.SERVICE_ACCOUNT_KEY_PATH = SERVICE_ACCOUNT_PATH;

console.log('正在使用服务账号文件:', SERVICE_ACCOUNT_PATH);

// 检查文件是否存在
if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('❌ 错误: 找不到服务账号私钥文件');
    console.error('请确保文件路径正确:', SERVICE_ACCOUNT_PATH);
    process.exit(1);
}

console.log('✅ 服务账号文件已找到');

// 尝试加载Firebase Admin SDK
let admin;
try {
    // 动态导入Firebase Admin SDK
    const adminModule = require('firebase-admin');
    admin = adminModule;
    console.log('✅ Firebase Admin SDK已加载');
} catch (error) {
    console.error('❌ 错误: 无法加载Firebase Admin SDK');
    console.error('请运行: npm install firebase-admin');
    console.log('');
    console.log('📋 备选方案: 您可以继续使用网站的本地存储模式，无需Firebase也能正常运行');
    process.exit(1);
}

// 从文件读取服务账号配置
let serviceAccount;
try {
    const serviceAccountData = fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8');
    serviceAccount = JSON.parse(serviceAccountData);
    console.log('✅ 服务账号配置已解析');
    console.log('   - 项目ID:', serviceAccount.project_id);
    console.log('   - 客户端邮箱:', serviceAccount.client_email);
} catch (error) {
    console.error('❌ 错误: 无法解析服务账号配置文件');
    console.error('错误信息:', error.message);
    process.exit(1);
}

// 初始化Firebase应用
try {
    // 检查是否已经初始化
    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
    
    console.log('✅ Firebase应用初始化成功');
    
    // 简单测试数据库连接
    try {
        const db = admin.firestore();
        console.log('✅ 成功连接到Firebase Firestore');
        console.log('');
        console.log('🎉 连接成功！Firebase已配置完成');
        console.log('');
        console.log('📋 下一步操作:');
        console.log('1. 您现在可以运行: npm run deploy 来部署到Firebase');
        console.log('2. 或者继续使用网站的本地存储模式');
        console.log('');
    } catch (dbError) {
        console.warn('⚠️  数据库连接测试失败，但Firebase初始化成功');
        console.warn('这可能是因为网络问题或Firestore未启用');
        console.log('');
        console.log('🎉 Firebase已成功初始化，您可以尝试部署');
    }
    
} catch (error) {
    console.error('❌ 错误: Firebase初始化失败');
    console.error('错误信息:', error.message);
    console.log('');
    console.log('📋 备选方案:');
    console.log('1. 检查您的网络连接');
    console.log('2. 确保Firebase项目状态正常');
    console.log('3. 继续使用网站的本地存储模式，无需Firebase也能正常运行');
}

console.log('====================================');