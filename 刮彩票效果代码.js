// 刮彩票效果完整代码 - 供Gemini检查
// 位置：public/index.html 中的 initScratchEffect 函数

function initScratchEffect() {
    const container = document.getElementById('scratch-image-container');
    const canvas = document.getElementById('scratch-canvas');
    if (!container || !canvas) {
        console.warn('刮奖容器或canvas未找到');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('无法获取canvas上下文');
        return;
    }
    
    let scratchImage = null;
    
    // 设置 Canvas 尺寸 - 参考 caipiao.html（不使用dpr）
    const width = container.offsetWidth || 600;
    const height = container.offsetHeight || 400;
    canvas.width = width;
    canvas.height = height;
    
    // 加载覆盖层图片（第二张图片）- 参考 caipiao.html
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = 'https://afrasbvtsucsmddcdusi.supabase.co/storage/v1/object/public/works_images/test-images/zhuangxiu.png';
    
    img.onload = function() {
        scratchImage = img;
        console.log('刮奖覆盖层图片加载成功');
        // 将图片绘制到 Canvas 上
        ctx.drawImage(img, 0, 0, width, height);
        // 【核心代码】设置混合模式：
        // destination-out 会根据新绘制形状的透明度，把原有图像"擦除"
        ctx.globalCompositeOperation = 'destination-out';
    };
    
    img.onerror = () => {
        console.error('覆盖层图片加载失败，使用纯色覆盖层');
        // 使用深色覆盖层
        ctx.fillStyle = "#171717";
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'destination-out';
    };
    
    // 兼容鼠标和触摸设备的位置获取 - 参考 caipiao.html
    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };
    
    // 核心刮除函数 - 参考 caipiao.html 的实现方式
    const scratch = (e) => {
        e.preventDefault(); // 防止移动端滚动
        const pos = getPos(e);
        const x = pos.x;
        const y = pos.y;
        
        // 【核心代码】制造"云层拨开"的柔和感
        // 我们不画实心圆，而是画一个径向渐变
        const brushSize = 50; // 笔刷半径
        
        // 创建径向渐变：从中心(x,y)向外扩散
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, brushSize);
        
        // 颜色并不重要，重要的是 Alpha 透明度
        // 1 (不透明) = 完全擦除
        // 0 (全透明) = 不擦除
        // 中间的过渡值 = 半透明擦除（制造柔和边缘）
        gradient.addColorStop(0, 'rgba(0,0,0,1)');   // 中心完全擦除
        gradient.addColorStop(0.4, 'rgba(0,0,0,0.8)'); // 中间过渡
        gradient.addColorStop(1, 'rgba(0,0,0,0)');   // 边缘不擦除，实现羽化
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, brushSize, 0, Math.PI * 2);
        ctx.fill();
    };
    
    // 事件监听 - 参考 caipiao.html
    canvas.addEventListener('mousemove', scratch);
    canvas.addEventListener('touchmove', scratch, { passive: false });
    
    // 窗口大小改变时重新初始化
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const newWidth = container.offsetWidth || 600;
            const newHeight = container.offsetHeight || 400;
            canvas.width = newWidth;
            canvas.height = newHeight;
            if (scratchImage && scratchImage.complete) {
                ctx.drawImage(scratchImage, 0, 0, newWidth, newHeight);
                ctx.globalCompositeOperation = 'destination-out';
            } else {
                ctx.fillStyle = "#171717";
                ctx.fillRect(0, 0, newWidth, newHeight);
                ctx.globalCompositeOperation = 'destination-out';
            }
        }, 150);
    });
}

// HTML结构：
// <div class="relative aspect-square overflow-hidden rounded-2xl bg-neutral-900 md:aspect-[4/5] cursor-crosshair" id="scratch-image-container">
//     <!-- 底层图片（第一张） -->
//     <img src="https://afrasbvtsucsmddcdusi.supabase.co/storage/v1/object/public/works_images/test-images/weizhuangxiu.png" alt="Abstract Architecture" class="h-full w-full object-cover absolute inset-0 z-0">
//     
//     <!-- 顶层图片（第二张，被刮开显示） -->
//     <canvas id="scratch-canvas" class="absolute inset-0 z-30 cursor-crosshair" style="touch-action: none; pointer-events: auto;"></canvas>
// </div>

