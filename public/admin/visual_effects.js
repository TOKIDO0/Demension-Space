/**
 * 维度空间 | 视觉场域增强插件 (Visual Field Enhancement Plugin)
 * 作用：自动注入动态粒子背景和科幻光标，不影响原有业务逻辑。
 */

(function() {
    // === 1. 自动注入 CSS 样式 ===
    const style = document.createElement('style');
    style.textContent = `
        body, html { cursor: none !important; }
        .admin-root, .admin-root * { cursor: none !important; }
        #particle-canvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: -1;
            pointer-events: none;
        }

        /* 自定义光标 */
        .cursor-dot, .cursor-ring {
            position: fixed;
            top: 0; left: 0;
            transform: translate(-50%, -50%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 99999;
        }
        .cursor-dot {
            width: 8px; height: 8px;
            background-color: #a855f7;
            box-shadow: 0 0 10px #a855f7;
        }
        .cursor-ring {
            width: 40px; height: 40px;
            border: 1px solid rgba(168, 85, 247, 0.5);
            box-shadow: 0 0 20px rgba(168, 85, 247, 0.2);
            transition: width 0.2s, height 0.2s, background-color 0.2s;
        }
        /* 点击反馈 */
        body.is-clicking .cursor-ring {
            width: 30px; height: 30px;
            background-color: rgba(168, 85, 247, 0.2);
            border-color: #a855f7;
        }
    `;
    document.head.appendChild(style);

    // === 2. 注入 DOM 元素 ===
    // 创建 Canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    document.body.appendChild(canvas);

    // 创建光标
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    // === 3. 激活光标逻辑 ===
    let mouseX = -100, mouseY = -100;
    let ringX = -100, ringY = -100;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.left = mouseX + 'px';
        dot.style.top = mouseY + 'px';
    });

    document.addEventListener('mousedown', () => document.body.classList.add('is-clicking'));
    document.addEventListener('mouseup', () => document.body.classList.remove('is-clicking'));

    function animateCursor() {
        ringX += (mouseX - ringX) * 0.15;
        ringY += (mouseY - ringY) * 0.15;
        ring.style.left = ringX + 'px';
        ring.style.top = ringY + 'px';
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // === 4. 激活粒子背景逻辑 ===
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    
    const CONFIG = {
        spacing: 30,
        baseRadius: 1.2,
        maxRadius: 5.0,
        mouseRadius: 150,
        color: '66, 165, 245'
    };

    // 粒子系统专用的鼠标位置
    const particleMouse = { x: -1000, y: -1000 };
    window.addEventListener('mousemove', (e) => {
        particleMouse.x = e.clientX;
        particleMouse.y = e.clientY;
    });

    class Particle {
        constructor(x, y) {
            this.baseX = x; this.baseY = y;
            this.x = x; this.y = y;
            this.size = CONFIG.baseRadius;
            this.angle = Math.random() * Math.PI * 2;
            this.velocity = 0.02 + Math.random() * 0.03;
            this.floatRange = 2 + Math.random() * 4;
        }

        draw() {
            ctx.fillStyle = `rgba(${CONFIG.color}, ${this.alpha})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }

        update() {
            this.angle += this.velocity;
            let floatX = Math.cos(this.angle) * (this.floatRange * 0.5);
            let floatY = Math.sin(this.angle) * this.floatRange;
            let currentBaseX = this.baseX + floatX;
            let currentBaseY = this.baseY + floatY;

            let dx = particleMouse.x - currentBaseX;
            let dy = particleMouse.y - currentBaseY;
            let distance = Math.sqrt(dx*dx + dy*dy);

            if (distance < CONFIG.mouseRadius) {
                let force = 1 - (distance / CONFIG.mouseRadius);
                this.size = CONFIG.baseRadius + (CONFIG.maxRadius * force);
                this.alpha = 0.2 + (force * 0.8);
                let angleMouse = Math.atan2(dy, dx);
                let push = force * 20;
                this.x = currentBaseX - Math.cos(angleMouse) * push;
                this.y = currentBaseY - Math.sin(angleMouse) * push;
            } else {
                this.size = CONFIG.baseRadius;
                this.alpha = 0.15;
                this.x = currentBaseX;
                this.y = currentBaseY;
            }
            this.draw();
        }
    }

    function initParticles() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        particles = [];
        for (let y = 0; y < height; y += CONFIG.spacing) {
            for (let x = 0; x < width; x += CONFIG.spacing) {
                particles.push(new Particle(x, y));
            }
        }
    }

    function animateParticles() {
        ctx.fillStyle = 'rgba(5, 5, 5, 0.2)';
        ctx.fillRect(0, 0, width, height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
        }
        requestAnimationFrame(animateParticles);
    }

    window.addEventListener('resize', initParticles);
    initParticles();
    animateParticles();

})();
