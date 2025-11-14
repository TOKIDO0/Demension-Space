// 简化版脚本，只保留最基本功能
console.log('脚本加载成功');

// 导航栏滚动效果
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 10) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
}, { passive: true });

// 简单的页面初始化函数
function initPage() {
    console.log('页面初始化完成');
    
    // 为登录按钮添加点击事件
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            console.log('登录按钮被点击');
            // 这里可以添加登录逻辑
        });
    }
}

// 当DOM加载完成后初始化页面
document.addEventListener('DOMContentLoaded', initPage);