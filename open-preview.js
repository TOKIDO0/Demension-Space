// 快速打开前台和后台预览页面的脚本
// 使用方法: node open-preview.js

const http = require('http');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT_FRONTEND = 3000;
const PORT_BACKEND = 3001;

// 检查端口是否被占用
function checkPort(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on('error', () => resolve(false));
  });
}

// 启动简单的HTTP服务器
function startServer(port, directory) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(__dirname, directory, req.url === '/' ? 'index.html' : req.url);
      
      // 处理路径
      if (req.url === '/') {
        filePath = path.join(__dirname, directory, 'index.html');
      }
      
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('File not found');
          return;
        }
        
        // 设置Content-Type
        const ext = path.extname(filePath);
        const contentTypes = {
          '.html': 'text/html',
          '.css': 'text/css',
          '.js': 'application/javascript',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.svg': 'image/svg+xml'
        };
        
        res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
        res.end(data);
      });
    });
    
    server.listen(port, () => {
      console.log(`✅ 服务器已启动: http://localhost:${port}`);
      resolve(server);
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️  端口 ${port} 已被占用，跳过启动服务器`);
        resolve(null);
      } else {
        reject(err);
      }
    });
  });
}

// 打开浏览器
function openBrowser(url) {
  const platform = process.platform;
  let command;
  
  if (platform === 'win32') {
    command = `start ${url}`;
  } else if (platform === 'darwin') {
    command = `open ${url}`;
  } else {
    command = `xdg-open ${url}`;
  }
  
  exec(command, (err) => {
    if (err) {
      console.error(`❌ 无法打开浏览器: ${err.message}`);
    } else {
      console.log(`🌐 已打开: ${url}`);
    }
  });
}

// 主函数
async function main() {
  console.log('🚀 正在启动预览服务器...\n');
  
  // 检查并启动前台服务器
  const frontendAvailable = await checkPort(PORT_FRONTEND);
  if (frontendAvailable) {
    await startServer(PORT_FRONTEND, 'public');
    setTimeout(() => openBrowser(`http://localhost:${PORT_FRONTEND}`), 500);
  } else {
    console.log(`⚠️  前台服务器端口 ${PORT_FRONTEND} 已被占用`);
    openBrowser(`http://localhost:${PORT_FRONTEND}`);
  }
  
  // 检查并启动后台服务器
  const backendAvailable = await checkPort(PORT_BACKEND);
  if (backendAvailable) {
    await startServer(PORT_BACKEND, 'public/admin');
    setTimeout(() => openBrowser(`http://localhost:${PORT_BACKEND}`), 1000);
  } else {
    console.log(`⚠️  后台服务器端口 ${PORT_BACKEND} 已被占用`);
    openBrowser(`http://localhost:${PORT_BACKEND}`);
  }
  
  console.log('\n✨ 预览服务器已启动！');
  console.log(`   前台页面: http://localhost:${PORT_FRONTEND}`);
  console.log(`   后台页面: http://localhost:${PORT_BACKEND}`);
  console.log('\n按 Ctrl+C 停止服务器\n');
}

main().catch(console.error);

