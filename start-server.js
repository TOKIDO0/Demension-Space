// 启动本地服务器脚本
const { exec } = require('child_process');
const path = require('path');

console.log('🚀 正在启动Dimension Space网站...');

// 安装http-server（如果尚未安装）
console.log('\n📦 正在检查并安装必要的依赖...');
exec('npm install -g http-server', (installErr, installStdout, installStderr) => {
    if (installErr && !installStderr.includes('already installed')) {
        console.error('❌ 安装http-server失败:', installErr.message);
        console.log('\n💡 提示: 您也可以使用其他静态文件服务器，如:');
        console.log('1. Python: `python -m http.server`');
        console.log('2. Live Server VS Code插件');
        console.log('3. 其他您熟悉的静态文件服务器');
        return;
    }

    if (!installErr) {
        console.log('✅ http-server安装成功');
    }

    // 进入public目录并启动服务器
    const publicDir = path.join(__dirname, 'public');
    console.log(`\n🌐 正在public目录启动服务器...`);
    
    // 在Windows环境下，使用不同的方式处理路径和命令
    const serverProcess = exec(`cd /d ${publicDir.replace(/\\/g, '/')} && http-server -p 3000`, (err, stdout, stderr) => {
        if (err) {
            console.error('❌ 启动服务器失败:', err.message);
            return;
        }
    });

    // 捕获服务器输出
    serverProcess.stdout.on('data', (data) => {
        console.log(data.toString());
    });

    serverProcess.stderr.on('data', (data) => {
        console.error(data.toString());
    });

    // 等待服务器启动
    setTimeout(() => {
        console.log('\n✅ 服务器已成功启动!');
        console.log('====================================');
        console.log('🌍 网站访问地址: http://localhost:3000');
        console.log('📱 您可以在浏览器中打开以上地址查看网站');
        console.log('👥 要让客户访问，请参考以下部署方案:');
        console.log('1. GitHub Pages (免费)');
        console.log('2. Netlify (免费)');
        console.log('3. Vercel (免费)');
        console.log('4. 您自己的服务器');
        console.log('====================================');
        console.log('\n💡 提示: 按 Ctrl+C 可以停止服务器');
    }, 1000);
});
