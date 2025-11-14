const fs = require('fs');
const vm = require('vm');
const path = require('path');

try {
    const scriptPath = path.join(__dirname, 'script.js'); // 已在正确的public目录中
    const code = fs.readFileSync(scriptPath, 'utf8');
    vm.compileFunction(code);
    console.log('代码语法正确！');
} catch (error) {
    console.error('语法错误:', error.message);
    console.error('错误位置:', error.stack);
}