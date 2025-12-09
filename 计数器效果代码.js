// 计数器效果完整代码 - 供Gemini检查
// 位置：public/index.html 中的 initCounterAnimation 函数

function initCounterAnimation() {
    // 获取所有带有 'counter-number' 类的元素
    const counters = document.querySelectorAll('.counter-number');
    
    counters.forEach(counter => {
        counter.textContent = '0'; // 初始化为 0
        
        const updateCounter = () => {
            // 获取目标值 (也就是 data-target 里的 100 和 40)
            // 之所以在前面加 + 号，是为了把字符串转为数字
            const target = +counter.getAttribute('data-target');
            
            // 获取当前显示的数字
            const c = +counter.textContent;
            
            // 计算每次增加的步长
            // target / 50 意味着无论数字多大，都在大约 50 帧内完成
            // 如果想让动画更快，把 50 改小；想更慢，把 50 改大
            const increment = target / 50;
            
            if (c < target) {
                // 如果还没到目标值，继续加
                // Math.ceil 向上取整，保证数字是整数
                counter.textContent = Math.ceil(c + increment);
                
                // 每 20 毫秒执行一次 updateCounter
                setTimeout(updateCounter, 20);
            } else {
                // 确保最后显示的数字精准等于目标值
                counter.textContent = target;
            }
        };
        
        // 使用 Intersection Observer 在元素进入视口时启动动画
        // 降低threshold并添加rootMargin，确保更容易触发
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.dataset.animated) {
                    // 启动动画
                    updateCounter();
                    entry.target.dataset.animated = 'true';
                    observer.unobserve(entry.target);
                }
            });
        }, { 
            threshold: 0.1,  // 降低阈值，只要10%可见就触发
            rootMargin: '0px 0px -50px 0px'  // 提前50px触发
        });
        
        observer.observe(counter);
        
        // 如果元素已经在视口中，立即启动动画（防止页面加载时元素已经在视口内）
        const rect = counter.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        if (isVisible && !counter.dataset.animated) {
            updateCounter();
            counter.dataset.animated = 'true';
        }
    });
}

// 初始化计数器动画（延迟执行确保DOM完全加载）
setTimeout(initCounterAnimation, 500);

// HTML结构：
// <div class="text-center md:text-left">
//     <h3 class="text-3xl font-semibold tracking-tight text-white">
//         <span class="counter-number" data-target="100">0</span>+
//     </h3>
//     <p class="mt-1 text-xs uppercase tracking-widest text-neutral-500">设计案例</p>
// </div>
// <div class="text-center md:text-left">
//     <h3 class="text-3xl font-semibold tracking-tight text-white">
//         <span class="counter-number" data-target="40">0</span>+
//     </h3>
//     <p class="mt-1 text-xs uppercase tracking-widest text-neutral-500">可定制板块</p>
// </div>

