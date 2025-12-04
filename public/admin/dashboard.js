const SUPABASE_URL = "https://afrasbvtsucsmddcdusi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcmFzYnZ0c3Vjc21kZGNkdXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTkzMDgsImV4cCI6MjA3ODM3NTMwOH0.CBeNwfTUNs1gPwhgiDDvP1N1B1_Lzya8fnYJzDSwbdM";

// 全局错误捕获
window.onerror = function(msg, url, lineNo, columnNo, error) {
    alert('Script Error: ' + msg + '\nLine: ' + lineNo);
    return false;
};

let sb = null;

// 安全初始化 Supabase 客户端
try {
    if (window.supabase) {
        sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.__sb = sb;
        window.SUPABASE_URL = SUPABASE_URL;
        window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
        window.getSupabaseClient = function(){ return sb; };
    } else {
        console.error('Supabase SDK not loaded');
    }
} catch (e) {
    console.error('Supabase init error:', e);
}

const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const toastContainer = document.getElementById('toast-notifications');

async function init() {
    if (!sb) {
        showLogin();
        document.getElementById('login-error').innerText = '系统错误: 数据库组件未加载，请检查网络连接或刷新页面';
        return;
    }

    const { data: { session } } = await sb.auth.getSession();
    if (session) showDashboard(session.user);
    else showLogin();

    sb.auth.onAuthStateChange((event, session) => {
        if (session) showDashboard(session.user);
        else showLogin();
    });
}

function showLogin() {
    loginView.style.display = 'flex';
    dashboardView.style.display = 'none';
}

function showDashboard(user) {
    loginView.style.display = 'none';
    dashboardView.style.display = 'flex';
    document.getElementById('current-user-email').innerText = user.email.split('@')[0].toUpperCase();
    switchView('messages');
    enableRealtimeSubscription();
}

window.switchView = function(viewName) {
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    // 简单的选中高亮逻辑
    const allBtns = document.querySelectorAll('.nav-item');
    if (viewName === 'messages') allBtns[0].classList.add('active');
    if (viewName === 'projects') allBtns[1].classList.add('active');
    if (viewName === 'reviews') allBtns[2].classList.add('active');

    document.querySelectorAll('.content-panel').forEach(panel => panel.style.display = 'none');
    
    if (viewName === 'messages') {
        document.getElementById('view-messages').style.display = 'flex';
        fetchMessages();
    } else if (viewName === 'projects') {
        document.getElementById('view-projects').style.display = 'flex';
        fetchProjects();
    } else if (viewName === 'reviews') {
        document.getElementById('view-reviews').style.display = 'flex';
        if (window.__renderReviewsPanel) window.__renderReviewsPanel();
    }
}
let viewTrash = false;

// 留言逻辑
async function fetchMessages() {
    const list = document.getElementById('message-list');
    list.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#666;">扫描数据中...</td></tr>';
    const statusFilter = document.getElementById('status-filter').value;
    const table = viewTrash ? 'contact_messages_trash' : 'contact_messages';
    let query = sb.from(table).select('*');
    if (!viewTrash) query = query.order('is_important', { ascending: false });
    query = query.order(viewTrash ? 'deleted_at' : 'created_at', { ascending: false });
    if (!viewTrash) {
        if (statusFilter === 'important') {
            query = query.eq('is_important', true);
        } else if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }
    }
    const { data, error } = await query;
    if (error) return console.error(error);
    if (!data || !data.length) {
        list.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">无信号输入</td></tr>';
        return;
    }
    list.innerHTML = data.map(msg => {
        const dateStr = new Date(viewTrash ? msg.deleted_at : msg.created_at).toLocaleString('zh-CN', { hour12: false });
        const statusText = msg.status === 'read' ? '已读' : (msg.status === 'replied' ? '已回复' : '未读');
        const statusClass = `pill-${msg.status || 'unread'}`;
        const nameText = `${msg.name || '未知用户'}${msg.is_important ? ' ★' : ''}`;
        const ops = [
            (!viewTrash && msg.status !== 'read') ? `<button class="action-link" onclick="updateStatus('${msg.id}','read')">[ 标记已读 ]</button>` : '',
            (!viewTrash && msg.status !== 'replied') ? `<button class="action-link" onclick="updateStatus('${msg.id}','replied')">[ 标记已回复 ]</button>` : '',
            (!viewTrash && !msg.is_important) ? `<button class="action-link" onclick="setImportant('${msg.id}',true)">[ 标记重要 ]</button>` : (!viewTrash ? `<button class="action-link" onclick="setImportant('${msg.id}',false)">[ 取消重要 ]</button>` : ''),
            (!viewTrash) ? `<button class="action-link" style="color:#ef4444" onclick="deleteMessage('${msg.id}')">[ 删除 ]</button>` : ''
        ].join('');
        return `
            <tr>
                <td style="font-family:'Orbitron'; color:var(--neon-cyan)">${dateStr}</td>
                <td>${nameText}</td>
                <td>${msg.phone || '-'}</td>
                <td style="color:#aaa">${msg.message || ''}</td>
                <td>
                    <span class="status-pill ${statusClass}">${statusText}</span>
                    <div style="margin-top:8px">${ops}</div>
                </td>
            </tr>
        `;
    }).join('');
}

window.updateStatus = async (id, newStatus) => {
    const { error } = await sb.from('contact_messages').update({ status: newStatus }).eq('id', id);
    if (error) showToast('状态更新失败'); else fetchMessages();
};

window.setImportant = async (id, flag) => {
    const { error } = await sb.from('contact_messages').update({ is_important: flag }).eq('id', id);
    if (error) showToast('设置失败'); else fetchMessages();
};

window.deleteMessage = (id) => {
    showGlassConfirm(
        "检测到删除指令。该操作不可逆，确定要从数据库中擦除此条通讯记录吗？",
        async () => {
            showToast('正在处理...', 0);
            try {
                await sb.from('contact_messages_trash').delete().eq('id', id);
                const { error: deleteError } = await sb
                    .from('contact_messages')
                    .delete()
                    .eq('id', id);
                
                if (deleteError) {
                    throw new Error('删除原始数据失败: ' + deleteError.message);
                }
                showToast('记录已永久擦除');
                fetchMessages();

            } catch (err) {
                console.error('Delete message error:', err);
                showToast('操作失败: ' + err.message);
            }
        }
    );
};

let currentPage = 1;
const pageSize = 8; // 每页显示8个项目

// 项目逻辑
async function fetchProjects() {
    const grid = document.getElementById('project-grid');
    grid.innerHTML = '<div class="loading-text">正在从矩阵下载全息数据...</div>';

    let totalCount = 0;
    try {
        const { count, error: countError } = await sb
            .from('works')
            .select('*', { count: 'exact' })
            .eq('is_deleted', false);
        if (!countError) totalCount = count || 0;
    } catch (_) {}

    // 2. 获取当前页数据
    const { data, error } = await sb
        .from('works')
        .select('*')
        .eq('is_deleted', false)
        .order('pinned_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

    let projects = data || [];
    if (error) projects = [];

    const totalPages = Math.ceil((totalCount || projects.length || 0) / pageSize);

    const listHtml = projects.map(p => {
        const isBadImage = !p.image_url || p.image_url.includes('picsum') || p.image_url.includes('unsplash');
        const imgHtml = isBadImage 
            ? `<div style="width:100%;height:100%;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;color:#444;font-size:12px;">NO IMAGE</div>`
            : `<img src="${p.image_url}" alt="${p.title}">`;
            
        return `
        <div class="project-card" onclick="openProjectActionCenter('${p.id}')" style="cursor:pointer; display:flex; flex-direction:column; min-height:420px;">
            <div class="project-status ${p.is_hidden ? 'status-hidden' : 'status-published'}">
                ${p.is_hidden ? '已隐藏' : '已发布'}${p.pinned_at ? '<span class="status-pinned">已置顶</span>' : ''}
            </div>
            <div class="project-img-box" style="flex-shrink:0;">
                ${imgHtml}
            </div>
            <div class="project-info" style="flex:1; min-height:120px;">
                <h4 class="project-title" style="font-size:16px; font-weight:bold; margin-bottom:8px; line-height:1.4; word-break:break-word;">${p.title}
                    ${p.is_hidden ? '<span class="badge badge-hidden">已隐藏</span>' : '<span class="badge badge-published">已发布</span>'}
                    ${p.pinned_at ? '<span class="badge badge-pinned">已置顶</span>' : ''}
                </h4>
                <div class="project-date" style="font-size:12px; color:#888; margin-top:auto; line-height:1.5;">施工地点：${p.location || '未填写'} // 日期：${new Date(p.created_at).toLocaleDateString()}</div>
            </div>
            <div class="project-actions" style="flex-shrink:0; padding:0 16px 16px;">
                <button class="card-btn glass-action-btn" style="width:100%; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.3); padding:10px;" onclick="event.stopPropagation(); openProjectActionCenter('${p.id}')">
                    <span style="margin-right:5px">⚡</span> 项目控制台
                </button>
            </div>
        </div>
    `}).join('');

    // 分页控件 - 移到顶部header bar
    const headerBar = document.querySelector('#view-projects .panel-header-bar .panel-actions');
    if (headerBar) {
        const existingPagination = headerBar.querySelector('.pagination-in-header');
        if (existingPagination) {
            existingPagination.remove();
        }
        
        const paginationHtml = `
            <div class="pagination-in-header" style="display: flex; align-items: center; gap: 12px; margin-right: 12px;">
                <button class="cyber-btn-small" onclick="changePage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                    < 上一页
                </button>
                <span style="color: var(--neon-cyan); font-size: 13px; font-weight: bold; white-space: nowrap;">PAGE ${currentPage} / ${totalPages || 1}</span>
                <button class="cyber-btn-small" onclick="changePage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                    下一页 >
                </button>
            </div>
        `;
        headerBar.insertAdjacentHTML('afterbegin', paginationHtml);
    }

    grid.innerHTML = listHtml;
}

window.changePage = function(page) {
    currentPage = page;
    fetchProjects();
}

// 项目控制台 (Action Center)
window.openProjectActionCenter = async (id) => {
    try {
        // 预加载数据
        const { data, error } = await sb.from('works').select('*').eq('id', id).single();
        if (error || !data) throw new Error('无法获取项目数据');

        const isHidden = data.is_hidden;
        const isPinned = !!data.pinned_at;

        const actionHtml = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 10px;">
                <!-- 状态显示 -->
                <div style="grid-column: 1 / -1; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 10px; display:flex; justify-content:space-between; align-items:center;">
                     <div>
                        <div style="color:#888; font-size:12px;">PROJECT ID</div>
                        <div style="font-family:monospace; color:var(--neon-cyan);">${id.slice(0,8)}...</div>
                     </div>
                     <div style="text-align:right;">
                        <div style="color:#888; font-size:12px;">STATUS</div>
                        <div style="color:${isHidden ? '#ff4444' : '#00cc88'}">${isHidden ? 'HIDDEN (已隐藏)' : 'PUBLISHED (已发布)'}</div>
                     </div>
                </div>

                <button class="glass-btn" onclick="editProject('${id}')" style="height: 80px; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:5px;">
                    <span style="font-size:24px">📝</span>
                    <span>编辑详情</span>
                </button>
                
                <button class="glass-btn" onclick="handleProjectAction('toggle', '${id}', ${isHidden})" style="height: 80px; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:5px; border-color:${isHidden ? '#00cc88' : '#ffaa00'}">
                    <span style="font-size:24px">${isHidden ? '🚀' : '🔒'}</span>
                    <span>${isHidden ? '发布项目' : '隐藏项目'}</span>
                </button>

                <button class="glass-btn" onclick="handleProjectAction('pin', '${id}', ${isPinned})" style="height: 80px; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:5px; border-color:${isPinned ? '#aaa' : '#ff00ff'}">
                    <span style="font-size:24px">${isPinned ? '📌' : '📍'}</span>
                    <span>${isPinned ? '取消置顶' : '设为置顶'}</span>
                </button>

                <button class="glass-btn danger" onclick="deleteProject('${id}')" style="height: 80px; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:5px;">
                    <span style="font-size:24px">🗑️</span>
                    <span>删除归档</span>
                </button>
            </div>
        `;

        showGlassModal({
            title: `项目控制台: ${data.title}`,
            html: actionHtml,
            confirmText: '关闭 (CLOSE)',
            cancelText: '',
            width: '500px',
            customActions: '<button class="glass-btn" onclick="hideGlassModal()" style="height:42px;padding:0 16px;border-color:rgba(255,255,255,0.25);background:rgba(255,255,255,0.06)">关闭控制台</button>'
        });

    } catch (e) {
        showToast('无法打开控制台: ' + e.message);
    }
};

window.handleProjectAction = async (action, id, param) => {
    if (action === 'pin') await pinProject(id, param);
    if (action === 'toggle') await toggleProject(id, param);
    // 重新打开模态框以刷新状态
    await openProjectActionCenter(id);
};

window.toggleProject = async (id, isHidden) => {
    const newHidden = !isHidden;
    const { error } = await sb.from('works').update({ is_hidden: newHidden, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) showToast('状态更新失败'); else { showToast(newHidden ? '已隐藏' : '已发布'); fetchProjects(); }
};

let currentConfirmCallback = null;
let currentModalConfig = { confirmText: '确认', cancelText: '取消' };
let modalOverlay, modalTitle, modalBody, modalConfirm, modalCancel;

function initModalElements() {
    modalOverlay = document.getElementById('modal-overlay');
    modalTitle = document.getElementById('modal-title');
    modalBody = document.getElementById('modal-body');
    modalConfirm = document.getElementById('modal-confirm');
    modalCancel = document.getElementById('modal-cancel');

    if (!modalOverlay) return console.error('Modal elements not found in DOM');

    // 绑定关闭事件
    modalCancel.onclick = hideModal;
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) hideModal();
    };
    
    // 绑定确认事件
    modalConfirm.onclick = async () => {
        if (currentConfirmCallback) {
            // 允许回调函数处理异步逻辑
            await currentConfirmCallback();
            hideModal();
        }
    };
}

function showModal(title, bodyHtml, onConfirm, options = {}) {
    if (!modalOverlay) initModalElements();
    
    if (!modalOverlay) return alert('错误: 模态框组件加载失败');

    currentModalConfig = { confirmText: '确认', cancelText: '取消', ...options };
    modalTitle.innerText = title;
    modalBody.innerHTML = bodyHtml;
    modalConfirm.innerText = currentModalConfig.confirmText;
    modalCancel.innerText = currentModalConfig.cancelText;
    modalOverlay.classList.add('active');
    currentConfirmCallback = onConfirm;
}

function hideModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('active');
    currentConfirmCallback = null;
}

window.deleteProject = async (id) => {
    // 使用新的 Glass Modal
    showGlassConfirm('检测到删除指令。确定要删除此项目并移动到已删除库吗？', async () => {
        showToast('正在处理删除请求...', 0);
        try {
            // 1. 获取数据
            const { data, error: fetchError } = await sb.from('works').select('*').eq('id', id).single();
            
            if (fetchError) throw new Error('无法读取原始数据: ' + fetchError.message);
            if (!data) throw new Error('未找到该项目');

            // 2. 移动到 deleted_works
            // 包含所有字段，数据库已添加支持
            const deletedData = {
                id: data.id,
                original_id: data.id, // 保存原始引用
                title: data.title,
                description: data.description,
                image_url: data.image_url,
                category: data.category,
                location: data.location,
                duration: data.duration,
                cost: data.cost,
                created_at: data.created_at,
                updated_at: data.updated_at,
                deleted_at: new Date().toISOString()
            };
            
            // 使用 upsert 避免 duplicate key (主键冲突)
            const { error: insertError } = await sb.from('deleted_works').upsert(deletedData);
            
            if (insertError) {
                console.error('Insert to deleted_works failed:', insertError);
                // 即使归档失败，也允许继续删除吗？用户要求解决报错，所以这里如果失败应该停止或提示
                // 但为了保证删除功能可用，如果只是归档失败，我们记录日志并继续删除可能是更好的体验？
                // 不，用户明确指出了 insert 报错，所以必须解决这个 insert 报错。
                // 上面的 deletedData 已经排除了 cost 等字段，应该能解决问题。
                throw new Error('归档失败: ' + insertError.message);
            }

            // 3. 标记删除 (软删除)
            // const { error: updateError } = await sb.from('works').update({ is_deleted: true }).eq('id', id);
            
            // 用户似乎想要彻底删除？或者只是 is_deleted=true?
            // 之前的代码是 update is_deleted=true. 但 fetchProjects 用的是 neq('is_deleted', true)
            // 如果用户说 "delete message error" 是 "duplicate key", 那是 message.
            // 项目删除报错是 "Could not find cost column".
            // 照旧维持软删除逻辑
            const { error: updateError } = await sb.from('works').update({ is_deleted: true }).eq('id', id);
            
            if (updateError) throw new Error('更新状态失败: ' + updateError.message);

            showToast('项目已删除并归档'); 
            fetchProjects();
            
        } catch (err) {
            console.error('Delete operation failed:', err);
            showToast('删除失败: ' + err.message);
        }
    });
};

window.pinProject = async (id, pinned) => {
    const v = pinned ? null : new Date().toISOString();
    const { error } = await sb.from('works').update({ pinned_at: v, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) showToast('置顶失败'); else { showToast(pinned ? '已取消置顶' : '已置顶'); fetchProjects(); }
};

window.editProject = async (id) => {
    console.log('Starting editProject for ID:', id);
    
    const loadingToast = showToast('正在读取项目数据...', 0);
    
    try {
        if (!sb) {
            alert('系统错误: 数据库未连接');
            return;
        }

        const { data, error } = await sb.from('works').select('*').eq('id', id).single();
        
        if (error) {
            console.error('Supabase fetch error:', error);
            showToast('数据读取失败: ' + error.message);
            alert('读取失败: ' + error.message);
            return;
        }
        
        if (!data) {
            console.error('No data returned for ID:', id);
            showToast('错误: 未找到项目数据');
            return;
        }

        console.log('Project data loaded:', data);

        const formHtml = `
            <div class="form-grid">
                <div class="field span-2">
                    <label style="display:block; margin-bottom:8px; color:#888; font-size:12px;">PROJECT COVER (项目封面)</label>
                    <div style="display:flex; gap:15px; align-items:center; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px;">
                        <img id="preview-img" src="${data.image_url}" style="height:80px; width:120px; object-fit:cover; border-radius:4px; border:1px solid #444;">
                        <div style="flex:1">
                            <input type="file" id="edit-image-file" accept="image/*" style="display:none" onchange="document.getElementById('preview-img').src = window.URL.createObjectURL(this.files[0])">
                            <button class="glass-btn-small" style="padding:8px 14px; border:1px solid rgba(168,85,247,0.35); background:linear-gradient(90deg, rgba(168,85,247,0.14), rgba(6,182,212,0.14)); color:#fff;" onclick="document.getElementById('edit-image-file').click()">📂 更换图片</button>
                            <div style="font-size:12px; color:#666; margin-top:5px;">支持 JPG/PNG/GIF (建议 16:9)</div>
                        </div>
                    </div>
                </div>
                <div class="field">
                    <label for="edit-title">项目名称</label>
                    <input type="text" id="edit-title" value="${data.title || ''}">
                </div>
                <div class="field">
                    <label for="edit-location">项目地点</label>
                    <input type="text" id="edit-location" value="${data.location || ''}">
                </div>
                <div class="field">
                    <label for="edit-date">项目日期 (YYYY-MM-DD)</label>
                    <input type="text" id="edit-date" value="${(data.created_at || '').slice(0,10)}" oninput="autoFormatDate(this)">
                </div>
                <div class="field">
                    <label for="edit-category">房屋大小</label>
                    <input type="text" id="edit-category" value="${data.category || ''}">
                </div>
                <div class="field">
                    <label for="edit-duration">项目工期 (Duration)</label>
                    <input type="text" id="edit-duration" value="${data.duration || ''}">
                </div>
                <div class="field">
                    <label for="edit-cost">项目费用 (Cost)</label>
                    <input type="text" id="edit-cost" value="${data.cost || ''}">
                </div>
                <div class="field span-2">
                    <label for="edit-description">项目描述</label>
                    <textarea id="edit-description" style="height:100px">${data.description || ''}</textarea>
                </div>
                <div class="field span-2">
                    <label for="edit-images-files">更多图片（可多选）</label>
                    <input type="file" id="edit-images-files" accept="image/*" multiple>
                </div>
            </div>
        `;

        // 使用新的 showGlassModal
        showGlassModal({
            title: '项目信息矩阵 (EDIT MODE)',
            html: formHtml,
            confirmText: '保存所有更改 (SAVE)',
            cancelText: '放弃 (CANCEL)',
            isDanger: false,
            width: '540px',
            onConfirm: async () => {
                const title = document.getElementById('edit-title').value;
                const location = document.getElementById('edit-location').value;
                const description = document.getElementById('edit-description').value;
                const dateStr = document.getElementById('edit-date').value;
                const category = document.getElementById('edit-category').value;
                const duration = document.getElementById('edit-duration').value;
                const cost = document.getElementById('edit-cost').value;
                const fileInput = document.getElementById('edit-image-file');
                const multiInput = document.getElementById('edit-images-files');

                showToast('正在同步数据...', 0);

                let imageUrl = data.image_url;
                const extraUrls = [];

                // 1. 处理图片上传
                if (fileInput.files && fileInput.files[0]) {
                    try {
                        const file = fileInput.files[0];
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${Date.now()}.${fileExt}`;
                        const filePath = `${fileName}`;
                        
                        // 尝试上传到 'works' 桶
                        const { error: uploadError } = await sb.storage
                            .from('works')
                            .upload(filePath, file);

                        if (uploadError) {
                            // 如果 works 桶不存在，尝试 fallback 到 avatars 或报错
                            console.error('Image upload failed:', uploadError);
                            if (uploadError.message.includes('Bucket not found')) {
                                alert('错误: 存储桶 "works" 不存在。请联系管理员创建。');
                                return;
                            }
                            throw uploadError;
                        }

                        const { data: { publicUrl } } = sb.storage
                            .from('works')
                            .getPublicUrl(filePath);
                            
                        imageUrl = publicUrl;
                    } catch (upErr) {
                        console.error('Upload exception:', upErr);
                        showToast('图片上传失败: ' + upErr.message);
                        return; // 终止保存
                    }
                }

                if (multiInput && multiInput.files && multiInput.files.length > 0) {
                    for (let i = 0; i < multiInput.files.length; i++) {
                        const f = multiInput.files[i];
                        const ext = f.name.split('.').pop();
                        const name = `${Date.now()}_${i}.${ext}`;
                        const { error: upErr } = await sb.storage.from('works').upload(name, f);
                        if (upErr) { console.error(upErr); continue; }
                        const { data: { publicUrl } } = sb.storage.from('works').getPublicUrl(name);
                        extraUrls.push(publicUrl);
                    }
                }

                console.log('Saving project updates...');
                const { error: updateError } = await sb.from('works').update({
                    title,
                    location,
                    description,
                    category,
                    duration,
                    cost,
                    image_url: imageUrl,
                    image_urls: Array.isArray(data.image_urls) ? [...data.image_urls, ...extraUrls] : (extraUrls.length ? extraUrls : []),
                    created_at: dateStr ? new Date(dateStr).toISOString() : data.created_at,
                    updated_at: new Date().toISOString()
                }).eq('id', id);

                if (updateError) {
                    console.error('Update error:', updateError);
                    showToast('保存失败: ' + updateError.message);
                } else {
                    showToast('已保存项目信息');
                    // 延迟刷新，避免请求被中断
                    setTimeout(fetchProjects, 500);
                }
            }
        });
        
    } catch (err) {
        console.error('Unexpected error in editProject:', err);
        showToast('系统异常: ' + err.message);
        alert('系统异常: ' + err.message);
    }
};

window.showToast = function(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.innerHTML = `<div style="width:8px;height:8px;background:var(--neon-cyan);border-radius:50%"></div> ${msg}`;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}


function enableRealtimeSubscription() {
    // 监听消息
    sb.channel('public:contact_messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contact_messages' }, payload => {
        showToast(`新信号接入: ${payload.new.name}`);
        const list = document.getElementById('message-list');
        if (list && list.offsetParent !== null) fetchMessages();
    }).subscribe();

    // 监听项目变化 (支持多端同步)
    sb.channel('public:works')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'works' }, () => {
        const grid = document.getElementById('project-grid');
        if (grid && grid.offsetParent !== null) fetchProjects();
    }).subscribe();
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard script loaded');
    console.log('Supabase Status:', sb ? 'Ready' : 'Not Loaded');
    
    // 绑定其他事件
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', async () => await sb.auth.signOut());
    
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) statusFilter.addEventListener('change', fetchMessages);
    
    const trashBtn = document.getElementById('trash-btn');
    if (trashBtn) trashBtn.addEventListener('click', () => {
        viewTrash = !viewTrash;
        trashBtn.textContent = viewTrash ? '返回列表' : '回收站';
        fetchMessages();
    });

    init();
});

// 确保函数全局可用
window.handleLogin = handleLogin;

async function handleLogin(e) {
    if (e) e.preventDefault();
    console.log('Login initiated...');
    
    const btn = document.getElementById('login-btn');
    // 确保获取到正确的按钮元素
    if (!btn) return console.error('Login button missing');

    const label = btn.querySelector('.btn-content');
    const spinner = document.getElementById('login-loading');
    const errorMsg = document.getElementById('login-error');
    
    // 清除旧错误
    if (errorMsg) errorMsg.innerText = '';

    // 检查 SDK 状态
    if (!sb) {
        const msg = '错误: 无法连接数据库 (Supabase SDK 未加载)';
        if (errorMsg) errorMsg.innerText = msg;
        console.error(msg);
        return;
    }

    // 1. 立即更新 UI 状态 (证明函数已执行)
    btn.disabled = true;
    if (label) label.textContent = '正在连接...';
    if (spinner) spinner.style.display = 'inline-block';
    
    try {
        const emailInput = document.getElementById('email');
        const passInput = document.getElementById('password');

        if (!emailInput || !passInput) throw new Error('找不到输入框');

        console.log('Sending login request for:', emailInput.value);
        
        const { data, error } = await sb.auth.signInWithPassword({
            email: emailInput.value,
            password: passInput.value
        });

        console.log('Login response:', { data, error });

        if (error) {
            if (errorMsg) errorMsg.innerText = '登录失败: ' + error.message;
        } else if (data?.session) {
            console.log('Login success, switching view...');
            showDashboard(data.session.user);
        }
    } catch (err) {
        if (errorMsg) errorMsg.innerText = '异常: ' + err.message;
        console.error('Login exception:', err);
    } finally {
        // 仅在失败时恢复按钮（成功时页面切换）
        // 为了防止卡死，总是恢复也可以，但在成功切换前恢复可能会让用户误点
        // 这里我们加个简单的判断，如果页面没切才恢复
        const loginVisible = document.getElementById('login-view').style.display !== 'none';
        if (loginVisible) {
            btn.disabled = false;
            if (label) label.textContent = '初始化神经连接';
            if (spinner) spinner.style.display = 'none';
        }
    }
}

window.openUploadModal = () => {
    const formHtml = `
        <div class="form-grid">
            <div class="field span-2">
                <label style="display:block; margin-bottom:8px; color:#888; font-size:12px;">PROJECT COVER (项目封面)</label>
                <div style="display:flex; gap:15px; align-items:center; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px;">
                    <div id="new-preview-frame" style="height:80px; width:120px; border-radius:4px; border:1px solid #444; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.03);">
                        <img id="new-preview-img" src="" style="display:none; height:100%; width:100%; object-fit:cover; border-radius:4px;">
                        <div id="new-preview-tip" style="color:#aaa; font-size:12px; display:flex; align-items:center; gap:6px;">
                            <span>上传您的作品图片</span>
                            <span>📤</span>
                        </div>
                    </div>
                    <div style="flex:1">
                        <input type="file" id="new-image-file" accept="image/*" style="display:none" onchange="handleNewImageChange(event)">
                        <button class="glass-btn-small" style="padding:8px 14px; border:1px solid rgba(168,85,247,0.35); background:linear-gradient(90deg, rgba(168,85,247,0.14), rgba(6,182,212,0.14)); color:#fff;" onclick="document.getElementById('new-image-file').click()">📂 选择图片</button>
                        <div style="font-size:12px; color:#666; margin-top:5px;">支持 JPG/PNG/GIF (建议 16:9)</div>
                    </div>
                </div>
            </div>

            <div class="field">
                <label for="new-work-title">项目名称</label>
                <input type="text" id="new-work-title" value="">
            </div>
            <div class="field">
                <label for="new-work-location">项目地点</label>
                <input type="text" id="new-work-location" value="">
            </div>
            <div class="field">
                <label for="new-work-date">项目日期 (YYYY-MM-DD)</label>
                <input type="text" id="new-work-date" value="" oninput="autoFormatDate(this)">
            </div>
            <div class="field">
                <label for="new-work-category">房屋大小</label>
                <input type="text" id="new-work-category" value="">
            </div>
            <div class="field">
                <label for="new-work-duration">项目工期 (Duration)</label>
                <input type="text" id="new-work-duration" value="">
            </div>
            <div class="field">
                <label for="new-work-cost">项目费用 (Cost)</label>
                <input type="text" id="new-work-cost" value="">
            </div>
            <div class="field span-2">
                <label for="new-work-desc">项目描述</label>
                <textarea id="new-work-desc" style="height:100px"></textarea>
            </div>

            <div class="field span-2">
                <label for="new-images-files">更多图片（可多选）</label>
                <input type="file" id="new-images-files" accept="image/*" multiple>
            </div>

            <div class="field span-2">
                <label for="new-work-image">或填写封面链接 (IMAGE URL)</label>
                <input type="text" id="new-work-image" value="">
            </div>

            <div class="field span-2" style="display:flex; align-items:center; gap:10px;">
                <input type="checkbox" id="new-work-hidden" checked>
                <span style="color:#ccc; font-size:12px;">初始状态设为隐藏 (Hidden)</span>
            </div>
        </div>
    `;

        showGlassModal({
        title: 'NEW UPLOAD // 上传新作品',
        html: formHtml,
        confirmText: '上传并保存 (UPLOAD)',
        width: '540px',
            onConfirm: async () => {
            const title = document.getElementById('new-work-title').value;
            const location = document.getElementById('new-work-location').value;
            const description = document.getElementById('new-work-desc').value;
            const dateStr = document.getElementById('new-work-date').value;
            const category = document.getElementById('new-work-category').value;
            const duration = document.getElementById('new-work-duration').value;
            const cost = document.getElementById('new-work-cost').value;
            const urlInput = document.getElementById('new-work-image').value;
            const fileInput = document.getElementById('new-image-file');
            const multiInput = document.getElementById('new-images-files');
            const isHidden = document.getElementById('new-work-hidden').checked;

            if (!title) {
                showToast('上传失败: 标题必填');
                throw new Error('Validation failed');
            }

            showToast('正在上传...', 0);

            let imageUrl = urlInput;
            const imageUrls = [];
            if (fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;
                const { error: uploadError } = await sb.storage.from('works').upload(filePath, file);
                if (uploadError) {
                    console.error(uploadError);
                    if (uploadError.message && uploadError.message.includes('Bucket not found')) {
                        alert('错误: 存储桶 "works" 不存在');
                        throw uploadError;
                    }
                    throw uploadError;
                }
                const { data: { publicUrl } } = sb.storage.from('works').getPublicUrl(filePath);
                imageUrl = publicUrl;
            }

            if (multiInput && multiInput.files && multiInput.files.length > 0) {
                for (let i = 0; i < multiInput.files.length; i++) {
                    const f = multiInput.files[i];
                    const ext = f.name.split('.').pop();
                    const name = `${Date.now()}_${i}.${ext}`;
                    const { error: upErr } = await sb.storage.from('works').upload(name, f);
                    if (upErr) { showToast('额外图片上传失败: ' + upErr.message); continue; }
                    const { data: { publicUrl } } = sb.storage.from('works').getPublicUrl(name);
                    imageUrls.push(publicUrl);
                }
            }

            const { error } = await sb.from('works').insert({
                title,
                location,
                description,
                category,
                duration,
                cost,
                image_url: imageUrl,
                image_urls: imageUrls.length ? [imageUrl, ...imageUrls] : (imageUrl ? [imageUrl] : []),
                is_hidden: isHidden,
                created_at: dateStr ? new Date(dateStr).toISOString() : new Date().toISOString()
            });

            if (error) {
                showToast('上传失败: ' + error.message);
                console.error(error);
            } else {
                showToast('作品已上传');
                fetchProjects();
            }
        }
    });
};

window.handleNewImageChange = (e) => {
    try {
        const file = e.target && e.target.files && e.target.files[0];
        if (!file) return;
        const url = window.URL.createObjectURL(file);
        const img = document.getElementById('new-preview-img');
        const tip = document.getElementById('new-preview-tip');
        if (img) { img.src = url; img.style.display = 'block'; }
        if (tip) { tip.style.display = 'none'; }
    } catch(_) {}
};

window.autoFormatDate = (inputEl) => {
    try {
        const raw = String(inputEl.value || '').replace(/[^0-9]/g, '').slice(0, 8);
        let out = raw;
        if (raw.length >= 5) {
            const y = raw.slice(0,4);
            const m = raw.slice(4,6);
            const d = raw.slice(6,8);
            out = y + (m ? '-' + m : '') + (d ? '-' + d : '');
        }
        inputEl.value = out;
    } catch(_) {}
};
