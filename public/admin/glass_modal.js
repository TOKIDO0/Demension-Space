/**
 * 维度空间 | 液态玻璃交互模态框 (Liquid Glass Modal)
 * 功能：提供带有 3D 视差特效的确认弹窗，替代原生 confirm()
 */

(function() {
    // === 1. 注入 CSS 样式 ===
    const style = document.createElement('style');
    style.textContent = `
        /* 遮罩层 */
        .glass-modal-overlay {
            position: fixed;
            top: 0; left: 0;
            width: 100vw; height: 100vh;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }

        .glass-modal-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }

        /* 模态框本体 (复刻 effect_demo.html 的样式) */
        .glass-modal-card {
            width: 400px;
            padding: 40px;
            background: rgba(20, 20, 30, 0.1);
            backdrop-filter: blur(12px) saturate(180%);
            -webkit-backdrop-filter: blur(12px) saturate(180%);
            border-radius: 32px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-top: 1px solid rgba(255, 255, 255, 0.3);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 
                inset 0 0 0 1px rgba(255, 255, 255, 0.05),
                inset 0 0 40px rgba(255, 255, 255, 0.02),
                0 30px 60px rgba(0, 0, 0, 0.5),
                -5px -5px 30px rgba(0, 255, 255, 0.1),
                5px 5px 30px rgba(255, 0, 255, 0.1);
            text-align: center;
            transform: perspective(1000px) rotateX(0) rotateY(0);
            transition: transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease, scale 0.3s ease;
            opacity: 0;
            scale: 0.9;
            max-height: 90vh;
            overflow-y: auto;
        }
        .glass-modal-card::-webkit-scrollbar { width: 8px; }
        .glass-modal-card::-webkit-scrollbar-track { background: rgba(255,255,255,0.06); border-radius: 8px; }
        .glass-modal-card::-webkit-scrollbar-thumb { background: linear-gradient(180deg, rgba(168,85,247,0.5), rgba(59,130,246,0.5)); border-radius: 8px; }
        .glass-modal-card::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, rgba(168,85,247,0.7), rgba(59,130,246,0.7)); }

        .glass-modal-overlay.active .glass-modal-card {
            opacity: 1;
            scale: 1;
        }

        /* 标题与文本 */
        .glass-modal-title {
            font-family: 'Orbitron', sans-serif;
            font-size: 24px;
            color: white;
            margin-bottom: 15px;
            text-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
        }

        .glass-modal-text {
            font-family: 'Microsoft YaHei', sans-serif;
            color: rgba(255, 255, 255, 0.7);
            font-size: 14px;
            margin-bottom: 30px;
            line-height: 1.6;
        }

        /* 按钮组 */
        .glass-modal-actions {
            display: flex;
            gap: 15px;
            justify-content: center;
        }

        .glass-btn {
            padding: 10px 24px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.05);
            color: white;
            cursor: pointer;
            font-family: 'Microsoft YaHei', sans-serif;
            font-size: 14px;
            transition: all 0.2s;
        }

        .glass-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
        }

        .glass-btn.danger {
            border-color: rgba(239, 68, 68, 0.5);
            background: rgba(239, 68, 68, 0.1);
            color: #fca5a5;
        }

        .glass-btn.danger:hover {
            background: rgba(239, 68, 68, 0.2);
            box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
        }
    `;
    document.head.appendChild(style);

    // === 2. 注入 DOM 结构 ===
    const overlay = document.createElement('div');
    overlay.className = 'glass-modal-overlay';
    overlay.innerHTML = `
        <div class="glass-modal-card" id="glass-modal-card">
            <h3 class="glass-modal-title" id="glass-modal-title">SYSTEM ALERT</h3>
            <div id="glass-modal-content-area">
                <p class="glass-modal-text" id="glass-modal-message">确认要执行此操作吗？</p>
            </div>
            <div class="glass-modal-actions" id="glass-modal-actions">
                <button class="glass-btn" id="glass-btn-cancel">取消 (CANCEL)</button>
                <button class="glass-btn danger" id="glass-btn-confirm">确认删除 (DELETE)</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // === 3. 核心逻辑封装 ===
    let confirmCallback = null;
    const card = document.getElementById('glass-modal-card');
    const titleEl = document.getElementById('glass-modal-title');
    const msgEl = document.getElementById('glass-modal-message');
    const contentArea = document.getElementById('glass-modal-content-area');
    const actionsArea = document.getElementById('glass-modal-actions');
    const confirmBtn = document.getElementById('glass-btn-confirm');
    const cancelBtn = document.getElementById('glass-btn-cancel');

    // 通用模态框 (支持自定义 HTML 内容)
    window.showGlassModal = function(options) {
        const { 
            title = 'SYSTEM ALERT', 
            html = '', 
            text = '',
            confirmText = '确认 (CONFIRM)',
            cancelText = '取消 (CANCEL)',
            onConfirm = null,
            isDanger = false,
            customActions = null, // 允许完全自定义按钮区
            width = null // 自定义宽度
        } = options;

        titleEl.innerText = title;
        confirmCallback = onConfirm;

        // 设置宽度
        if (width) {
            card.style.width = width;
            card.style.maxWidth = '95vw'; // 防止溢出
        } else {
            card.style.width = '400px'; // 默认宽度
        }

        // 内容区
        if (html) {
            contentArea.innerHTML = html;
        } else {
            contentArea.innerHTML = `<p class="glass-modal-text" id="glass-modal-message">${text}</p>`;
        }

        // 按钮区
        if (customActions) {
            actionsArea.innerHTML = customActions;
            // 需自行绑定事件
        } else {
            // 恢复默认按钮
            actionsArea.innerHTML = '';
            actionsArea.appendChild(cancelBtn);
            actionsArea.appendChild(confirmBtn);
            
            confirmBtn.innerText = confirmText;
            cancelBtn.innerText = cancelText;
            
            if (isDanger) {
                confirmBtn.classList.add('danger');
            } else {
                confirmBtn.classList.remove('danger');
            }

            // 重新绑定事件 (因为 appendChild 可能移动了元素)
            cancelBtn.onclick = closeModal;
            confirmBtn.onclick = async () => {
                if (confirmCallback) await confirmCallback();
                closeModal();
            };
        }

        overlay.classList.add('active');
        document.addEventListener('mousemove', handleParallax);
    };

    // 兼容旧 API: 确认弹窗
    window.showGlassConfirm = function(message, onConfirm) {
        showGlassModal({
            title: 'SYSTEM ALERT',
            text: message,
            confirmText: '确认删除 (DELETE)',
            isDanger: true,
            onConfirm: onConfirm
        });
    };

    // 关闭模态框
    window.hideGlassModal = closeModal; // 暴露给外部使用
    function closeModal() {
        overlay.classList.remove('active');
        confirmCallback = null;
        document.removeEventListener('mousemove', handleParallax);
        card.style.transform = `perspective(1000px) rotateX(0) rotateY(0)`;
    }

    // 绑定默认关闭事件
    // 注意: confirmBtn 的事件在 showGlassModal 中动态绑定
    cancelBtn.onclick = closeModal;


    // 点击遮罩层关闭
    overlay.onclick = (e) => {
        if (e.target === overlay) closeModal();
    };

    // === 4. 3D 视差算法 (移植自 effect_demo) ===
    function handleParallax(e) {
        if (!overlay.classList.contains('active')) return;

        const x = e.clientX;
        const y = e.clientY;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // 计算旋转角度 (除以 40 控制灵敏度)
        const rotateX = (y - centerY) / 40; 
        const rotateY = (centerX - x) / 40;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }

})();
