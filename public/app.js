// 全新的JavaScript文件
console.log('app.js 加载成功');

const API_BASE = '';
const SUPABASE_URL = 'https://afrasbvtsucsmddcdusi.supabase.co';
let SUPABASE_ANON_KEY = (typeof window !== 'undefined' && window.SUPABASE_ANON_KEY) ? window.SUPABASE_ANON_KEY : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcmFzYnZ0c3Vjc21kZGNkdXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTkzMDgsImV4cCI6MjA3ODM3NTMwOH0.CBeNwfTUNs1gPwhgiDDvP1N1B1_Lzya8fnYJzDSwbdM';
function getSupabaseClient(){ try { const url = (typeof window !== 'undefined' && window.SUPABASE_URL) ? window.SUPABASE_URL : SUPABASE_URL; if (!window.supabase || !url || !SUPABASE_ANON_KEY) return null; return window.supabase.createClient(url, SUPABASE_ANON_KEY); } catch(_) { return null; } }
const PREVIEW_MODE = false;
const FRONTEND_ONLY = !API_BASE;

try { document.addEventListener('DOMContentLoaded', function(){ try { if (!document.body.style.backgroundColor) document.body.style.backgroundColor = '#0a0a14'; if (!document.body.style.color) document.body.style.color = '#ffffff'; } catch(_){} }); } catch(_){}
try { window.addEventListener('error', function(){ try { hideLoadingIndicator(); } catch(_){} }); } catch(_){}

// 创建加载动画样式
function createLoadingStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .loading-spinner {
            width: 30px;
            height: 30px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 10px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .loading-indicator p {
            margin: 0;
            color: #333;
            font-size: 14px;
        }
    `;
    document.head.appendChild(style);
}

// 创建加载指示器元素
function createLoadingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'loading-indicator';
    indicator.innerHTML = `
        <div class="loading-spinner"></div>
        <p>加载中...</p>
    `;
    indicator.style.position = 'fixed';
    indicator.style.top = '50%';
    indicator.style.left = '50%';
    indicator.style.transform = 'translate(-50%, -50%)';
    indicator.style.zIndex = '9999';
    indicator.style.backgroundColor = 'rgba(10, 10, 20, 0.6)';
    indicator.style.padding = '20px 40px';
    indicator.style.borderRadius = '8px';
    indicator.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
    indicator.style.display = 'flex';
    indicator.style.flexDirection = 'column';
    indicator.style.alignItems = 'center';
    indicator.style.justifyContent = 'center';
    indicator.style.display = 'none';
    return indicator;
}

// 全局加载指示器
let loadingIndicator = null;

// 显示加载指示器
function showLoadingIndicator() {
    if (!loadingIndicator) {
        createLoadingStyles();
        loadingIndicator = createLoadingIndicator();
        document.body.appendChild(loadingIndicator);
    }
    loadingIndicator.style.display = 'flex';
}

// 隐藏加载指示器
function hideLoadingIndicator() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

// 全局变量存储用户信息
let currentUser = null;

function loadUsers() {
    try {
        const s = localStorage.getItem('ds_users');
        return s ? JSON.parse(s) : {};
    } catch (_) { return {}; }
}
function saveUsers(u) {
    try { localStorage.setItem('ds_users', JSON.stringify(u)); } catch(_){}
}
function saveSession(u) {
    try { localStorage.setItem('ds_session', JSON.stringify(u)); } catch(_){}
}
function loadSession() {
    try { const s = localStorage.getItem('ds_session'); return s ? JSON.parse(s) : null; } catch(_) { return null; }
}

function attachAuthStateListener() {
    try {
        if (window.__dsAuthListener__) return;
        const sb = getSupabaseClient();
        if (!sb || PREVIEW_MODE) return;
        const sub = sb.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
                currentUser = null;
                try { localStorage.removeItem('ds_session'); } catch(_){}
                updateUIForLoggedInState();
                const uw = document.getElementById('user-works');
                if (uw) uw.remove();
            }
        });
        window.__dsAuthListener__ = sub;
    } catch(_) {}
}

function highlightSection(sectionId, duration = 1500) {
    const el = document.getElementById(sectionId);
    if (!el) return;
    el.classList.add('section-highlight');
    setTimeout(() => { el.classList.remove('section-highlight'); }, duration);
}

function validatePhone(phone) {
    return /^1\d{10}$/.test(String(phone).trim());
}

function validateNickname(nick) {
    const s = String(nick).trim();
    return s.length >= 2 && s.length <= 20;
}

async function hashPassword(pwd) {
    try { if (window.bcrypt && bcrypt.hash) { return await bcrypt.hash(pwd, 10); } } catch(_) {}
    try {
        const buf = await (crypto && crypto.subtle).digest('SHA-256', new TextEncoder().encode(pwd));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
    } catch(_) { return btoa(pwd); }
}

async function checkPassword(pwd, hash) {
    try { if (window.bcrypt && bcrypt.compare) { return await bcrypt.compare(pwd, hash); } } catch(_) {}
    try {
        const sha = await hashPassword(pwd);
        if (/^[A-Fa-f0-9]{64}$/.test(hash)) return sha === hash;
        return btoa(pwd) === hash;
    } catch(_) { return false; }
}

async function updateUserProfile(patch) {
    const payload = Object.assign({}, patch);
    if (!currentUser || !currentUser.id) throw new Error('未登录');
    
    showLoadingIndicator();
    try {
        const sb = getSupabaseClient();
        if (sb && !PREVIEW_MODE) {
            // 更新 public.user_profiles 表
            const updates = {};
            if (payload.nickName !== undefined) updates.nick_name = payload.nickName;
            if (payload.phone !== undefined) updates.phone = payload.phone;
            if (payload.avatar !== undefined) updates.avatar_url = payload.avatar;
            updates.updated_at = new Date().toISOString();

            const { error } = await sb
                .from('user_profiles')
                .update(updates)
                .eq('id', currentUser.id);

            if (error) throw error;

            // 更新本地状态
            if (payload.nickName !== undefined) currentUser.nickName = payload.nickName;
            if (payload.phone !== undefined) currentUser.phone = payload.phone;
            if (payload.avatar !== undefined) currentUser.avatar = payload.avatar;
            
            // 保存到本地存储，防止刷新丢失
            saveSession(currentUser);
            
            // 刷新 UI
            if (typeof updateUIForLoggedInState === 'function') {
                updateUIForLoggedInState();
            }
            
            return { code: '0', msg: '成功' };
        } else {
            const users = loadUsers();
            const email = currentUser.email;
            const u = users[email] || { id: currentUser.id || Date.now(), email, username: currentUser.username };
            if (payload.nickName !== undefined) u.username = payload.nickName;
            if (payload.phone !== undefined) u.phone = payload.phone;
            if (payload.avatar !== undefined) u.avatar = payload.avatar;
            users[email] = u;
            saveUsers(users);
            currentUser = { id: u.id, email, username: u.username || email.split('@')[0], avatar: u.avatar || currentUser.avatar, phone: u.phone || '', nickName: u.username || email.split('@')[0] };
            saveSession(currentUser);
            updateUIForLoggedInState();
            return { code: '0', msg: '成功' };
        }
    } finally {
        hideLoadingIndicator();
    }
}

async function changeUserPassword(oldPwd, newPwd) {
    if (!currentUser || !currentUser.username) throw new Error('未登录');
    showLoadingIndicator();
    try {
        const sb = getSupabaseClient();
        if (sb && !PREVIEW_MODE) {
            const re = await sb.auth.signInWithPassword({ email: currentUser.email, password: oldPwd });
            if (re.error) throw new Error('密码错误');
            const r = await sb.auth.updateUser({ password: newPwd });
            if (r.error) throw new Error(r.error.message || '修改密码失败');
            return { code: '0', msg: '成功' };
        } else {
            const users = loadUsers();
            const u = users[currentUser.email];
            if (!u) throw new Error('未登录');
            const ok = await bcrypt.compare(oldPwd, u.passwordHash);
            if (!ok) throw new Error('密码错误');
            u.passwordHash = await bcrypt.hash(newPwd, 10);
            saveUsers(users);
            return { code: '0', msg: '成功' };
        }
    } finally {
        hideLoadingIndicator();
    }
}

function fileToImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = reader.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function compressImage(file, maxW = 512, maxH = 512, quality = 0.8) {
    const img = await fileToImage(file);
    const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
    const w = Math.round(img.width * ratio);
    const h = Math.round(img.height * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
    });
}

// Toast 提示功能 - 深色主题风格
function showToast(message, type = 'success', targetContainer = null) {
    // 如果指定了目标容器，在容器内显示，否则在页面顶部显示
    let container;
    let isInForm = false;
    
    if (targetContainer) {
        // 在指定容器内显示
        container = targetContainer;
        isInForm = true;
        // 确保容器是相对定位
        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }
    } else {
        container = document.querySelector('.toast-container') || createToastContainer();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    if (isInForm) {
        // 表单内的提示样式
        toast.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            background: rgba(30, 30, 30, 0.95);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid ${type === 'success' ? 'rgba(255, 77, 0, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
            color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            font-size: 13px;
            animation: toastFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(-10px);
            z-index: 1000;
            opacity: 0;
            min-width: 240px;
        `;
    } else {
        // 页面顶部的提示样式
        toast.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 20px;
            background: rgba(30, 30, 30, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid ${type === 'success' ? 'rgba(255, 77, 0, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
            color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            font-size: 14px;
            animation: toastFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            min-width: 280px;
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        `;
    }
    
    const icon = type === 'success' ? '✓' : '⚠';
    const iconColor = type === 'success' ? '#ff4d00' : '#ef4444';
    toast.innerHTML = `
        <span style="color: ${iconColor}; font-size: 18px; font-weight: bold;">${icon}</span>
        <span style="flex: 1;">${message}</span>
    `;
    
    container.appendChild(toast);
    
    // 强制重排以触发动画
    toast.offsetHeight;
    
    // 2.5秒后自动消失
    setTimeout(() => {
        toast.style.animation = 'toastFadeOut 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards';
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 2500);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// =============================================================================
// NTFY 推送通知集成
// =============================================================================
// 配置：使用公共 ntfy.sh 服务
// 注意：ntfy.sh 的主题名不能包含下划线，只能包含字母、数字、连字符
// 如果用户创建的主题包含下划线，代码会自动替换为连字符
const NTFY_SERVER_URL = window.NTFY_SERVER_URL || 'https://ntfy.sh';
// 用户创建的主题是 weidu_studio_alerts，会自动转换为 weidu-studio-alerts
const NTFY_TOPIC = window.NTFY_TOPIC || 'weidu-studio-alerts'; // 推送主题

/**
 * 发送 ntfy 推送通知
 * @param {string} title - 通知标题
 * @param {string} message - 通知内容
 * @param {string} priority - 优先级: 'default', 'low', 'min', 'high', 'max'
 * @param {string} tags - 标签（逗号分隔）
 */
async function sendNtfyNotification(title, message, priority = 'default', tags = '') {
  // 如果未配置 NTFY_SERVER_URL 或 NTFY_TOPIC，则跳过推送
  if (!NTFY_SERVER_URL || !NTFY_TOPIC) {
    console.log('NTFY 推送未配置，跳过通知');
    return;
  }

  try {
    // 注意：ntfy.sh 的主题名不能包含下划线，只能包含字母、数字、连字符
    // 如果用户创建的主题包含下划线，需要替换为连字符
    const topic = NTFY_TOPIC.replace(/_/g, '-');
    const url = `${NTFY_SERVER_URL}/${topic}`;
    
    console.log('发送 NTFY 推送:', { url, title, message: message.substring(0, 50) + '...' });
    
    // 注意：HTTP headers 只能包含 ISO-8859-1 字符，不能包含中文等非ASCII字符
    // 所以 Title 使用英文，避免编码问题
    // 中文内容放在 body 中，body 支持 UTF-8
    const headers = {
      'Title': 'New Message', // 使用英文标题，避免编码问题
      'Priority': priority,
      'Tags': tags || undefined,
      'Content-Type': 'text/plain; charset=utf-8'
    };

    // 移除 undefined 的 headers
    Object.keys(headers).forEach(key => {
      if (headers[key] === undefined) {
        delete headers[key];
      }
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: message
    });

    if (response.ok) {
      console.log('✅ NTFY 推送发送成功');
      const responseText = await response.text();
      console.log('NTFY 响应:', responseText);
    } else {
      const errorText = await response.text();
      console.warn('❌ NTFY 推送发送失败:', response.status, response.statusText, errorText);
      throw new Error(`NTFY 推送失败: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ NTFY 推送异常:', error);
    // 抛出错误，让调用者知道推送失败
    throw error;
  }
}

// 导出到全局，供其他组件使用
window.sendNtfyNotification = sendNtfyNotification;

// =============================================================================
// 百度地图初始化
// =============================================================================
function initBaiduMap() {
  try {
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) {
      console.warn('地图容器未找到');
      return;
    }

    // 检查 BMap 是否已加载
    if (typeof BMap === 'undefined') {
      console.error('百度地图 API 未加载，请检查 API Key 和白名单配置');
      mapContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:14px;">地图加载失败，请检查网络连接</div>';
      return;
    }

    // 创建地图实例（新疆阿克苏新和县迎宾花园小区）
    const map = new BMap.Map("map-container");
    // 设置中心点坐标（新和县迎宾花园小区准确坐标）
    const point = new BMap.Point(82.606214, 41.559476); // 经度, 纬度
    map.centerAndZoom(point, 17); // 17 是缩放级别，数字越大越详细
    
    // 添加标记
    const marker = new BMap.Marker(point);
    map.addOverlay(marker);
    
    // 添加信息窗口
    const infoWindow = new BMap.InfoWindow("维度空间设计工作室<br/>地址：新疆阿克苏新和县迎宾花园小区门面房", {
      width: 250,
      height: 100,
      title: "维度空间"
    });
    marker.addEventListener("click", function() {
      map.openInfoWindow(infoWindow, point);
    });
    
    // 启用滚轮缩放
    map.enableScrollWheelZoom(true);
    // 添加缩放控件
    map.addControl(new BMap.NavigationControl());
    // 添加比例尺控件
    map.addControl(new BMap.ScaleControl());
    
    console.log('百度地图初始化成功');
  } catch (error) {
    console.error('百度地图初始化失败:', error);
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
      mapContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:14px;">地图加载失败：' + error.message + '</div>';
    }
  }
}

// 导出到全局
window.initBaiduMap = initBaiduMap;

// 联系表单处理
async function handleContactFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('.submit-btn');
    if (!submitBtn) {
        console.error('未找到提交按钮');
        showToast('表单提交失败：未找到提交按钮', 'error');
        return;
    }
    const submitBtnText = submitBtn.querySelector('span:last-child');
    const originalBtnText = submitBtnText ? submitBtnText.textContent.trim() : submitBtn.textContent.trim();
    
    // 获取表单数据
    const name = form.querySelector('#contact-name').value.trim();
    const phone = form.querySelector('#contact-phone').value.trim();
    const message = form.querySelector('#contact-message').value.trim();
    
    // 简单验证
    if (!name || !phone || !message) {
        showToast('请填写所有必填项', 'error');
        return;
    }
    
    if (!validatePhone(phone)) {
        showToast('请输入有效的手机号码', 'error');
        return;
    }
    
    try {
        submitBtn.disabled = true;
        if (submitBtnText) {
            submitBtnText.textContent = '发送中...';
        } else {
            submitBtn.textContent = '发送中...';
        }
        
        const sb = getSupabaseClient();
        if (!sb) {
            throw new Error('Supabase 连接未配置，请联系管理员');
        }
        
        const { error } = await sb
            .from('contact_messages')
            .insert([
                { name, phone, message }
            ]);
            
        if (error) throw error;
        
        // 立即显示成功提示，不等待 NTFY 通知
        const formContainer = form.closest('.p-8');
        if (formContainer) {
            showToast('发送成功，我们会尽快联系您', 'success', formContainer);
        } else {
            showToast('发送成功，我们会尽快联系您', 'success');
        }
        form.reset();
        
        // 异步发送 ntfy 推送通知（不阻塞表单提交）
        (async () => {
            try {
                const now = new Date();
                const timeStr = now.toLocaleString('zh-CN', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                });
                const notificationMessage = `👤 姓名：${name}\n📞 电话：${phone}\n🕐 留言时间：${timeStr}\n\n📝 需求描述：\n${message}`;
                await sendNtfyNotification(
                    'New Message',
                    notificationMessage,
                    'high',
                    'mail,phone'
                );
                console.log('NTFY 推送已发送');
            } catch (ntfyError) {
                console.error('NTFY 推送失败（不影响留言提交）:', ntfyError);
                // 推送失败不影响留言提交
            }
        })();
        
    } catch (error) {
        console.error('发送失败:', error);
        showToast(error.message || '发送失败，请稍后重试', 'error');
    } finally {
        submitBtn.disabled = false;
        if (submitBtnText) {
            submitBtnText.textContent = originalBtnText;
        } else {
            submitBtn.textContent = originalBtnText;
        }
    }
}

// 初始化联系表单监听
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.querySelector('.contact-form');
    if (contactForm && contactForm.dataset.bound !== '1') {
        contactForm.dataset.bound = '1';
        contactForm.addEventListener('submit', handleContactFormSubmit);
    }
    // 作品加载已由 React 组件 PortfolioSection 处理，无需在此调用
    // fetchFrontProjects(); // 已移除：页面使用 React 组件，不需要此函数

    try {
        const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        if (!isCoarse) {
            const dot = document.createElement('div');
            dot.className = 'cursor-dot';
            document.body.appendChild(dot);
            let x = 0, y = 0, tx = 0, ty = 0, s = 1;
            const k = 0.22;
            const damp = 0.12;
            const r = () => {
                x += (tx - x) * k;
                y += (ty - y) * k;
                const dx = tx - x, dy = ty - y;
                const v = Math.min(Math.hypot(dx, dy) * 0.02, 0.35);
                s += (1 + v - s) * damp;
                dot.style.transform = `translate(${x - 9}px, ${y - 9}px) scale(${s})`;
                requestAnimationFrame(r);
            };
            window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
            window.addEventListener('mousedown', () => { s = 1.4; });
            window.addEventListener('mouseup', () => { s = 1; });
            window.addEventListener('mouseleave', () => { dot.style.opacity = '0'; });
            window.addEventListener('mouseenter', () => { dot.style.opacity = '1'; });
            r();
        }
    } catch(_) {}

    try {
        // 为导航链接添加平滑滚动
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href === '#' || href === '#!') return;
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    e.preventDefault();
                    smoothScrollTo(targetId, 80); // 80px offset for navbar
                }
            });
        });

        // 登录相关功能已移除 - 前台页面不需要登录功能
    } catch(_) {}
});

function updateUIForLoggedInState() {
    try {
        const avatarWrap = document.getElementById('user-avatar');
        const loginBtn = document.getElementById('login-btn');
        const userDetailsLink = document.getElementById('user-details-link');
        const navAvatar = document.getElementById('nav-user-avatar');
        const sb = getSupabaseClient();
        if (!sb) return;
        sb.auth.getUser().then(({ data }) => {
            const user = data && data.user;
            if (user) {
                if (avatarWrap) avatarWrap.style.display = 'block';
                if (loginBtn) loginBtn.style.display = 'none';
                if (userDetailsLink) userDetailsLink.textContent = '账号详情';
                currentUser = { id: user.id, email: user.email };
                saveSession(currentUser);
                sb.from('user_profiles').select('avatar_url,nick_name,phone').eq('id', user.id).single().then(({ data: prof }) => {
                    if (prof && prof.avatar_url && navAvatar) navAvatar.src = prof.avatar_url;
                    if (prof && prof.nick_name) currentUser.nickName = prof.nick_name;
                    if (prof && prof.phone) currentUser.phone = prof.phone;
                    saveSession(currentUser);
                }).catch(() => {});
            } else {
                if (avatarWrap) avatarWrap.style.display = 'none';
                if (loginBtn) loginBtn.style.display = 'inline-block';
            }
        });
    } catch(_) {}
}

// 前台作品获取 - 已废弃：现在由 React 组件 PortfolioSection 处理
// 此函数保留用于向后兼容，但不会被调用
// async function fetchFrontProjects() { ... }

async function openWorkDetail(id) {
    try {
        const sb = getSupabaseClient();
        const { data, error } = await sb.from('works').select('*').eq('id', id).single();
        if (error || !data) throw new Error('作品不存在');
        const body = document.getElementById('work-detail-body');
        const modal = document.getElementById('work-detail-modal');
        const card = document.getElementById('work-detail-card');
        const images = Array.isArray(data.image_urls) && data.image_urls.length ? data.image_urls : (data.image_url ? [data.image_url] : []);
        const cover = images[0] || '';
        card.style.width = 'min(90vw, 900px)';
        body.innerHTML = `
            <div style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:16px;align-items:start;">
                <div style="position:relative;border-radius:16px;overflow:hidden;background:rgba(255,255,255,0.04);">
                    ${cover ? `<img id="work-slide-img" src="${cover}" alt="${data.title}" style="width:100%;display:block;">` : '<div style="height:280px;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;">无封面</div>'}
                    <button id="work-prev" class="glass-button" style="position:absolute;top:50%;left:10px;transform:translateY(-50%);opacity:0.8">◀</button>
                    <button id="work-next" class="glass-button" style="position:absolute;top:50%;right:10px;transform:translateY(-50%);opacity:0.8">▶</button>
                </div>
                <div style="display:grid;gap:8px;">
                    <h4 style="margin:0;">项目名称：${data.title}</h4>
                    <p style="margin:0;color:#bbb;">项目日期：${(data.created_at || '').slice(0,10)}</p>
                    <p style="margin:0;color:#bbb;">项目地点：${data.location || '未填写'}</p>
                    <p style="margin:0;color:#bbb;">房屋大小：${data.category || '未填写'} ²</p>
                    <p style="margin:0;color:#bbb;">项目工期：${data.duration || '未填写'}</p>
                    <p style="margin:0;color:#fff;font-weight:600;">项目费用：${data.cost || '未填写'}</p>
                    <p style="margin:0;color:#ccc;">项目描述：${data.description || '暂无描述'}</p>
                </div>
            </div>
        `;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        const closeBtn = document.getElementById('close-work-detail');
        closeBtn.onclick = () => { 
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        };
        const onMove = (e) => {
            const rect = card.getBoundingClientRect();
            const cx = rect.left + rect.width/2; const cy = rect.top + rect.height/2;
            const dx = (e.clientX - cx)/rect.width; const dy = (e.clientY - cy)/rect.height;
            card.style.transform = `translateZ(0) rotateX(${dy*-8}deg) rotateY(${dx*8}deg)`;
        };
        window.addEventListener('mousemove', onMove);
        closeBtn.addEventListener('click', () => { 
            window.removeEventListener('mousemove', onMove); 
            card.style.transform='none';
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        });

        let idx = 0; const imgEl = document.getElementById('work-slide-img');
        const prev = document.getElementById('work-prev'); const next = document.getElementById('work-next');
        const show = (i) => { if (!imgEl || images.length<=1) return; idx = (i+images.length)%images.length; imgEl.src = images[idx]; };
        if (prev) prev.onclick = () => show(idx-1);
        if (next) next.onclick = () => show(idx+1);
        let timer = null; if (images.length>1) { timer = setInterval(() => show(idx+1), 3000); }
        closeBtn.addEventListener('click', () => { 
            if (timer) clearInterval(timer);
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        });
    } catch(err) {
        showToast('打开失败: '+ err.message, 'error');
    }
}

// 导出到全局
window.openWorkDetail = openWorkDetail;

async function uploadAvatarAndSave(file) {
    const blob = await compressImage(file);
    showLoadingIndicator();
    try {
        const sb = getSupabaseClient();
        if (sb && !PREVIEW_MODE) {
            const u = await sb.auth.getUser();
            if (u.error || !u.data.user) throw new Error('未登录');
            
            const userId = u.data.user.id;
            // 使用 userId/timestamp.jpg 格式，符合存储桶策略
            const name = `${userId}/${Date.now()}.jpg`;
            
            const up = await sb.storage.from('avatars').upload(name, blob, { upsert: true });
            if (up.error) throw up.error;

            // 获取公开链接
            const { data: { publicUrl } } = sb.storage.from('avatars').getPublicUrl(name);
            
            await updateUserProfile({ avatar: publicUrl });
            
            // 更新 UI
            const userAvatarImg = document.getElementById('nav-user-avatar');
            if (userAvatarImg) userAvatarImg.src = publicUrl;
            const preview = document.getElementById('profile-avatar-preview');
            if (preview) preview.src = publicUrl;
            currentUser.avatar = publicUrl;
            return publicUrl;
        } else {
            const reader = new FileReader();
            const urlData = await new Promise((resolve, reject) => { reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
            await updateUserProfile({ avatar: urlData });
            const userAvatarImg = document.getElementById('nav-user-avatar');
            if (userAvatarImg) userAvatarImg.src = urlData;
            const preview = document.getElementById('profile-avatar-preview');
            if (preview) preview.src = urlData;
            currentUser.avatar = urlData;
            return urlData;
        }
    } finally {
        hideLoadingIndicator();
    }
}

function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function animateScrollTo(targetY, duration = 500, onComplete = null) {
    try {
        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) { window.scrollTo(0, targetY); return; }
        const startY = window.pageYOffset;
        const delta = targetY - startY;
        const start = performance.now();
        function step(now) {
            const elapsed = Math.min((now - start) / duration, 1);
            const eased = easeInOutCubic(elapsed);
            window.scrollTo(0, Math.round(startY + delta * eased));
            if (elapsed < 1) {
                requestAnimationFrame(step);
            } else {
                if (typeof onComplete === 'function') {
                    try { onComplete(); } catch(_) {}
                }
            }
        }
        requestAnimationFrame(step);
    } catch (error) {
        window.scrollTo(0, targetY);
        if (typeof onComplete === 'function') {
            try { onComplete(); } catch(_) {}
        }
    }
}
function smoothScrollTo(elementId, offset = 0, onComplete = null) {
    try {
        const element = document.getElementById(elementId);
        if (!element) { console.warn(`目标元素 #${elementId} 未找到`); return; }
        const elementTop = element.getBoundingClientRect().top;
        let target = elementTop + window.pageYOffset - offset;
        const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        if (target > max) target = max;
        if (target < 0) target = 0;
        animateScrollTo(target, 500, onComplete);
    } catch (error) { console.error('平滑滚动出错:', error); }
}

// 将 smoothScrollTo 暴露到全局，供其他脚本使用
window.smoothScrollTo = smoothScrollTo;

function enableMouseInvertCursor(options){
    try {
        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const radius = Math.max(10, Math.min(200, Number(options && options.radius) || 40));
        const lerp = Math.max(0, Math.min(1, Number(options && options.lerp) || 0.18));
        const algo = (options && options.algorithm) || 'difference';
        const supportsBackdrop = typeof CSS !== 'undefined' && CSS.supports && (CSS.supports('backdrop-filter: invert(1)') || CSS.supports('-webkit-backdrop-filter: invert(1)'));
        const useBackdrop = algo === 'backdrop' && supportsBackdrop;
        const el = document.createElement('div');
        el.style.position = 'fixed';
        el.style.top = '0';
        el.style.left = '0';
        el.style.zIndex = '9999';
        el.style.width = String(radius * 2) + 'px';
        el.style.height = String(radius * 2) + 'px';
        el.style.borderRadius = '50%';
        el.style.pointerEvents = 'none';
        el.style.willChange = 'transform';
        el.style.transform = 'translate3d(-100px, -100px, 0) translate(-50%, -50%)';
        el.style.boxShadow = '0 0 10px rgba(255,255,255,0.20)';
        if (useBackdrop) {
            el.style.backgroundColor = 'transparent';
            el.style.backdropFilter = 'invert(1) saturate(1.06) contrast(1.05)';
            el.style.webkitBackdropFilter = 'invert(1) saturate(1.06) contrast(1.05)';
            el.style.opacity = '0.88';
        } else {
            el.style.backgroundColor = '#fff';
            el.style.mixBlendMode = 'difference';
        }
        // 增加镜片边缘 CSS 遮罩增强层
        const edge = document.createElement('div');
        edge.style.position = 'absolute';
        edge.style.top = '0'; edge.style.left = '0';
        edge.style.width = '100%'; edge.style.height = '100%';
        edge.style.borderRadius = '50%';
        edge.style.pointerEvents = 'none';
        edge.style.willChange = 'transform, filter';
        edge.style.filter = 'brightness(1.02) saturate(1.06)';
        edge.style.maskImage = 'radial-gradient(circle at center, rgba(0,0,0,0) 42%, rgba(0,0,0,0.85) 70%, rgba(0,0,0,1) 100%)';
        edge.style.webkitMaskImage = edge.style.maskImage;
        edge.style.border = '2.5px solid rgba(255,255,255,0.28)';
        el.appendChild(edge);

        const inner = document.createElement('div');
        inner.style.position = 'absolute';
        inner.style.top = '0'; inner.style.left = '0';
        inner.style.width = '100%'; inner.style.height = '100%';
        inner.style.borderRadius = '50%';
        inner.style.pointerEvents = 'none';
        inner.style.willChange = 'opacity, transform, filter';
        inner.style.background = 'radial-gradient(circle at center, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 35%, rgba(255,255,255,0) 65%)';
        inner.style.mixBlendMode = 'screen';
        inner.style.opacity = '0.6';
        el.appendChild(inner);
        document.body.appendChild(el);
        let feDisp = null;
        (function(){
            try {
                const NS = 'http://www.w3.org/2000/svg';
                const svg = document.createElementNS(NS, 'svg');
                const w = radius * 2; const h = radius * 2;
                svg.setAttribute('xmlns', NS);
                svg.setAttribute('width', String(w));
                svg.setAttribute('height', String(h));
                svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
                svg.style.position = 'absolute';
                svg.style.top = '0';
                svg.style.left = '0';
                svg.style.zIndex = '10000';
                svg.style.pointerEvents = 'none';
                svg.style.willChange = 'transform';
            } catch (_) {}
        })();
    } catch (_) {}
}

// =============================================================================
// 页眉滚动隐藏/显示功能
// =============================================================================
(function() {
    let lastScrollTop = 0;
    let ticking = false;
    let navbar = null;
    const scrollThreshold = 50; // 滚动超过50px才开始隐藏
    
    function initNavbarScroll() {
        navbar = document.querySelector('.navbar');
        if (!navbar) {
            // 如果navbar还没加载，等待一下
            setTimeout(initNavbarScroll, 100);
            return;
        }
        
        function handleScroll() {
            if (!navbar) return;
            
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // 如果滚动到顶部，始终显示
            if (scrollTop < scrollThreshold) {
                navbar.classList.remove('hidden');
                return;
            }
            
            // 向下滚动隐藏，向上滚动显示
            if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
                // 向下滚动
                navbar.classList.add('hidden');
            } else if (scrollTop < lastScrollTop) {
                // 向上滚动
                navbar.classList.remove('hidden');
            }
            
            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
            ticking = false;
        }
        
        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(handleScroll);
                ticking = true;
            }
        }, { passive: true });
        
        // 初始化
        navbar.classList.remove('hidden');
    }
    
    // 等待DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavbarScroll);
    } else {
        initNavbarScroll();
    }
    
    // 暴露函数供外部调用（用于模态框）
    window.hideNavbar = function() {
        if (navbar) navbar.classList.add('hidden');
    };
    window.showNavbar = function() {
        if (navbar) navbar.classList.remove('hidden');
    };
})();

// =============================================================================
// 滚动时板块从无到有生长的动画效果
// =============================================================================
(function() {
    // 添加CSS动画样式
    const style = document.createElement('style');
    style.textContent = `
        .section-fade-in {
            opacity: 0;
            transform: translateY(50px) scale(0.95);
            transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), 
                        transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .section-fade-in.visible {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
        
        /* 首页始终可见 */
        #home {
            opacity: 1 !important;
            transform: none !important;
        }
    `;
    document.head.appendChild(style);
    
    // Intersection Observer 用于检测元素进入视口
    const observerOptions = {
        root: null,
        rootMargin: '-10% 0px -10% 0px', // 提前10%触发
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // 等待DOM加载完成后初始化
    function initScrollAnimations() {
        // 获取所有section（除了home）
        const sections = document.querySelectorAll('section:not(#home)');
        sections.forEach(section => {
            section.classList.add('section-fade-in');
            observer.observe(section);
        });
    }
    
    // DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScrollAnimations);
    } else {
        initScrollAnimations();
    }
    
    // 确保首页在页面顶部
    window.addEventListener('load', function() {
        // 如果URL中没有hash，滚动到顶部
        if (!window.location.hash || window.location.hash === '#home') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
})();
