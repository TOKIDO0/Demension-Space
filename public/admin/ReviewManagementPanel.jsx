const { useState, useEffect } = React;
function getClient(){ try{ if(typeof getSupabaseClient==='function') return getSupabaseClient(); if(window.__sb) return window.__sb; if(window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) return window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);}catch(_){} return null; }

const FallbackIcon = (ch) => ({ size=16, className='' }) => (
  <span className={className} style={{ fontSize: size, lineHeight: 1 }}>{ch}</span>
);
const I = (window.lucideReact)||{};
const Search = I.Search || FallbackIcon('🔍');
const Trash2 = I.Trash2 || FallbackIcon('🗑');
const Eye = I.Eye || FallbackIcon('👁');
const EyeOff = I.EyeOff || FallbackIcon('🚫');
const Pin = I.Pin || FallbackIcon('📌');
const Edit3 = I.Edit3 || FallbackIcon('✎');
const Check = I.Check || FallbackIcon('✔');
const Zap = I.Zap || FallbackIcon('⚡');
const Activity = I.Activity || FallbackIcon('📈');
const Signal = I.Signal || FallbackIcon('📶');
const LayoutGrid = I.LayoutGrid || FallbackIcon('▦');
const List = I.List || FallbackIcon('≡');

// -----------------------------------------------------------------------------
// 组件: 信号强度指示器
// -----------------------------------------------------------------------------
const SignalStrength = ({ level }) => {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <div 
          key={i} 
          className={`w-1.5 h-4 rounded-sm transition-all duration-300 ${
            i < level 
              ? 'bg-gradient-to-t from-purple-600 to-cyan-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]' 
              : 'bg-white/10'
          }`}
        />
      ))}
    </div>
  );
};

// -----------------------------------------------------------------------------
// 主面板组件
// -----------------------------------------------------------------------------
const ReviewManagementPanel = () => {
  const [reviews, setReviews] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [viewMode, setViewMode] = useState("list");

  const avgRating = (() => {
    try {
      const list = reviews.filter(r => r.status !== 'hidden');
      if (!list.length) return 0;
      const sum = list.reduce((s, r) => s + (r.rating || 0), 0);
      return sum / list.length;
    } catch(_) { return 0; }
  })();
  const avgText = (Math.round(avgRating * 10) / 10).toFixed(1);
  const avgPct = Math.max(0, Math.min(100, Math.round((avgRating / 5) * 100)));

  // --- 操作逻辑 ---
  useEffect(() => {
    const sb = getClient();
    if (!sb) return;
    (async () => {
      const { data, error } = await sb
        .from('reviews')
        .select('*')
        .eq('is_deleted', false) // 只显示未删除的评价
        .order('pinned_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
      if (error) {
        console.error('加载评价失败:', error);
        return;
      }
      // 获取用户头像和项目返图
      const mapped = await Promise.all((data||[]).map(async (r) => {
        // 获取用户头像
        let avatarUrl = r.user_avatar_url || null;
        if (!avatarUrl && r.user_id && r.user_id !== 'anonymous') {
          try {
            const { data: profile } = await sb
              .from('user_profiles')
              .select('avatar_url')
              .eq('id', r.user_id)
              .single();
            if (profile && profile.avatar_url) {
              avatarUrl = profile.avatar_url;
            }
          } catch (profileError) {
            console.warn('获取用户头像失败:', profileError);
          }
        }
        
        // 处理项目返图
        let projectImages = [];
        if (r.project_image_url) {
          if (typeof r.project_image_url === 'string') {
            projectImages = r.project_image_url.split(',').map(url => url.trim()).filter(url => url);
          } else if (Array.isArray(r.project_image_url)) {
            projectImages = r.project_image_url;
          }
        }
        
        return {
        id: r.id,
          user: r.name || r.user_id || 'Anonymous',
          user_id: r.user_id,
          avatar: avatarUrl || ((r.name||'??').slice(0,2).toUpperCase()),
          avatarUrl: avatarUrl,
        role: r.role || 'Client',
        rating: r.rating || 5,
        content: r.content || r.comment || '',
        date: (r.created_at || '').slice(0,10),
        status: r.is_hidden ? 'hidden' : 'active',
        isPinned: !!r.is_pinned || !!r.pinned_at,
          projectImages: projectImages,
        };
      }));
      setReviews(mapped);
    })();
  }, []);
  const togglePin = async (id) => {
    const sb = getClient();
    const now = new Date().toISOString();
    const target = reviews.find(r => r.id === id);
    const nextPinned = !(target && target.isPinned);
    try { await sb.from('reviews').update({ is_pinned: nextPinned, pinned_at: nextPinned ? now : null, updated_at: now }).eq('id', id); } catch(_) {}
    setReviews(prev => prev.map(r => r.id === id ? { ...r, isPinned: nextPinned } : r).sort((a,b)=> (b.isPinned===a.isPinned?0:(b.isPinned?1:-1))));
  };

  const toggleStatus = async (id) => {
    const sb = getClient();
    const target = reviews.find(r => r.id === id);
    const nextHidden = target ? (target.status !== 'hidden') : true;
    try { await sb.from('reviews').update({ is_hidden: nextHidden, updated_at: new Date().toISOString() }).eq('id', id); } catch(_) {}
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: nextHidden ? 'hidden' : 'active' } : r));
  };

  const deleteReview = async (id) => {
    if (!window.confirm("警告：正在切断该信号源连接。此操作将移入已删除库。确认执行？")) return;
    const sb = getClient();
    try {
      const { data } = await sb.from('reviews').select('*').eq('id', id).single();
      if (data) {
        const archive = {
          original_id: data.id,
          name: data.name || data.user,
          role: data.role,
          rating: data.rating,
          content: data.content || data.comment,
          is_hidden: data.is_hidden || false,
          is_pinned: data.is_pinned || !!data.pinned_at,
          pinned_at: data.pinned_at || null,
          created_at: data.created_at,
          updated_at: data.updated_at,
          deleted_at: new Date().toISOString()
        };
        await sb.from('deleted_reviews').upsert(archive);
      }
      await sb.from('reviews').update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id', id);
    } catch(_) {}
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  const startEdit = (review) => {
    setEditingId(review.id);
    setEditContent(review.content);
    setEditRating(review.rating || 5);
  };

  const saveEdit = async () => {
    const sb = getClient();
    try { 
      await sb.from('reviews').update({ 
        content: editContent, 
        rating: editRating,
        updated_at: new Date().toISOString() 
      }).eq('id', editingId); 
    } catch(_) {}
    setReviews(prev => prev.map(r => r.id === editingId ? { ...r, content: editContent, rating: editRating } : r));
    setEditingId(null);
    setEditContent("");
    setEditRating(5);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
    setEditRating(5);
  };

  return (
    // 修改点：bg-[#050505] 改为 bg-transparent，以便透出后台原本的“小球”动画背景
        <div className="w-full h-full bg-transparent text-gray-200 p-6 font-sans selection:bg-purple-500/30 flex flex-col" style={{overflow: 'hidden'}}>
      
      {/* --- 顶部仪表盘 --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        
        {/* 卡片 1: 信号总量 */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-gray-900/40 border border-white/5 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
            <Activity size={80} className="text-purple-500" />
          </div>
          <div className="flex flex-col mb-1">
             <span className="text-purple-400 font-bold text-sm tracking-wide">信号总量</span>
             <span className="text-[10px] text-purple-500/50 font-mono uppercase tracking-widest">Total Signals</span>
          </div>
          <div className="text-4xl font-bold text-white mb-2">
            {reviews.length} <span className="text-sm font-normal text-gray-500">条记录 / records</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            系统在线 / SYSTEM ONLINE
          </div>
        </div>

        {/* 卡片 2: 平均频率 */}
        <div className="p-6 rounded-2xl bg-gray-900/40 border border-white/5 backdrop-blur-xl group hover:border-purple-500/30 transition-colors">
          <div className="flex flex-col mb-1">
             <span className="text-cyan-400 font-bold text-sm tracking-wide">平均频率</span>
             <span className="text-[10px] text-cyan-500/50 font-mono uppercase tracking-widest">Avg Frequency</span>
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {avgText} <span className="text-sm text-gray-500">/ 5.0</span>
          </div>
          <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full" style={{ width: `${avgPct}%`, backgroundImage: 'linear-gradient(to right, #a855f7, #22d3ee)' }}></div>
          </div>
        </div>

        {/* 卡片 3: 信号增强 */}
        <div className="p-6 rounded-2xl bg-gray-900/40 border border-white/5 backdrop-blur-xl group hover:border-purple-500/30 transition-colors">
          <div className="flex flex-col mb-1">
             <span className="text-pink-400 font-bold text-sm tracking-wide">信号增强</span>
             <span className="text-[10px] text-pink-500/50 font-mono uppercase tracking-widest">Amplified</span>
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {reviews.filter(r => r.isPinned).length} <span className="text-sm text-gray-500">条 / active</span>
          </div>
          <p className="text-xs text-gray-500">已置顶展示 / Pinned</p>
        </div>
      </div>

      {/* --- 控制栏 --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Signal className="text-purple-500" /> 
            <div>
              <span className="block leading-none">信号回想</span>
              <span className="text-[10px] text-gray-500 font-normal uppercase tracking-wider block mt-1">Review Control Center</span>
            </div>
          </h2>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-900/60 p-1.5 rounded-xl border border-white/5 backdrop-blur-md">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
            <input 
              type="text" 
              placeholder="搜索信号源..." 
              className="bg-transparent border-none text-sm text-white placeholder-gray-600 focus:ring-0 pl-9 pr-4 py-1.5 w-48 transition-all focus:w-64 outline-none"
            />
          </div>
          <div className="w-px h-4 bg-white/10 mx-1"></div>
          <button 
            onClick={() => setViewMode('list')}
            title="列表视图"
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <List size={18} />
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            title="网格视图"
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {/* --- 列表视图 / 网格视图 --- */}
      {viewMode === 'list' ? (
        <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1" style={{maxHeight: 'calc(100vh - 350px)', minHeight: '400px'}}>
        {reviews.map((review) => (
          <div 
            key={review.id} 
            className={`
              relative group flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-xl border transition-all duration-300
              ${review.isPinned 
                ? 'bg-purple-900/10 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
                : 'bg-gray-900/40 border-white/5 hover:border-white/10 hover:bg-gray-800/40'
              }
              ${review.status === 'hidden' ? 'opacity-50 grayscale-[0.8]' : 'opacity-100'}
            `}
          >
            {/* 状态指示灯 */}
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl overflow-hidden">
               <div className={`h-full w-full ${review.isPinned ? 'bg-purple-500' : (review.status === 'active' ? 'bg-cyan-500' : 'bg-gray-700')}`} />
            </div>

            {/* 用户信息 */}
            <div className="flex items-center gap-3 w-full md:w-48 pl-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center overflow-hidden">
                {review.avatarUrl ? (
                  <img src={review.avatarUrl} alt={review.user} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold tracking-wider text-gray-300">{review.avatar}</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">{review.user}</span>
                <span className="text-[10px] uppercase font-mono text-gray-500">{review.role}</span>
              </div>
            </div>

            {/* 评价内容 (或编辑框) */}
            <div className="flex-1 min-w-0 pr-4">
              {editingId === review.id ? (
                <div className="flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
                  {/* 星级编辑 */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-400">服务星级</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setEditRating(star)}
                          className={`text-2xl transition-all ${
                            star <= editRating ? 'text-yellow-400' : 'text-gray-600'
                          } hover:scale-110`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* 内容编辑 */}
                  <textarea 
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-black/50 border border-purple-500/50 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none h-24"
                    autoFocus
                  />
                  
                  {/* 项目返图显示（只读） */}
                  {review.projectImages && review.projectImages.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-gray-400">项目返图（不可编辑）</label>
                      <div className="grid grid-cols-3 gap-2">
                        {review.projectImages.slice(0, 3).map((img, idx) => (
                          <img key={idx} src={img} alt={`返图 ${idx + 1}`} className="w-full h-20 object-cover rounded border border-white/10" />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 justify-end">
                    <button onClick={cancelEdit} className="text-xs px-3 py-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors">取消</button>
                    <button onClick={saveEdit} className="text-xs px-3 py-1.5 rounded-md bg-purple-600 text-white hover:bg-purple-500 flex items-center gap-1">
                      <Check size={12} /> 保存 / Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-gray-300 text-sm leading-relaxed truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:z-10 transition-all">
                    "{review.content}"
                  </p>
                  
                  {/* 项目返图显示 */}
                  {review.projectImages && review.projectImages.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {review.projectImages.slice(0, 3).map((img, idx) => (
                        <img key={idx} src={img} alt={`返图 ${idx + 1}`} className="w-16 h-16 object-cover rounded border border-white/10" />
                      ))}
                      {review.projectImages.length > 3 && (
                        <div className="w-16 h-16 rounded border border-white/10 flex items-center justify-center text-xs text-gray-500">
                          +{review.projectImages.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 mt-1">
                    <SignalStrength level={review.rating} />
                    <span className="text-[10px] font-mono text-gray-600">{review.date}</span>
                    {review.isPinned && (
                      <span className="flex items-center gap-1 text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                        <Zap size={10} fill="currentColor" /> 信号增强 / AMPLIFIED
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 操作按钮组 */}
            <div className={`
              flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 transform md:translate-x-4 md:group-hover:translate-x-0
              ${editingId === review.id ? 'opacity-0 pointer-events-none' : ''}
            `}>
              <button 
                onClick={() => togglePin(review.id)}
                title={review.isPinned ? "取消置顶" : "置顶显示"}
                className={`p-2 rounded-lg border transition-all ${
                  review.isPinned 
                    ? 'bg-purple-500 text-white border-purple-400' 
                    : 'bg-gray-800 border-white/5 text-gray-400 hover:text-purple-400 hover:border-purple-500/50'
                }`}
              >
                <Pin size={16} className={review.isPinned ? "fill-current" : ""} />
              </button>

              <button 
                onClick={() => startEdit(review)}
                title="编辑内容"
                className="p-2 rounded-lg bg-gray-800 border border-white/5 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all"
              >
                <Edit3 size={16} />
              </button>

              <button 
                onClick={() => toggleStatus(review.id)}
                title={review.status === 'active' ? "隐藏评价" : "显示评价"}
                className="p-2 rounded-lg bg-gray-800 border border-white/5 text-gray-400 hover:text-yellow-400 hover:border-yellow-500/50 transition-all"
              >
                {review.status === 'active' ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>

              <div className="w-px h-6 bg-white/10 mx-1"></div>

              <button 
                onClick={() => deleteReview(review.id)}
                title="永久删除"
                className="p-2 rounded-lg bg-gray-800 border border-white/5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/50 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        
        {reviews.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600 border border-white/5 rounded-xl border-dashed">
             <Signal size={48} className="mb-4 opacity-20" />
             <div className="text-center">
               <p className="text-gray-400 font-medium">未检测到信号</p>
               <p className="text-xs text-gray-600 uppercase tracking-widest mt-1">NO SIGNALS DETECTED</p>
             </div>
          </div>
        )}
      </div>
      ) : (
        /* --- 网格视图 --- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar flex-1" style={{maxHeight: 'calc(100vh - 350px)', minHeight: '400px'}}>
          {reviews.map((review) => (
            <div 
              key={review.id} 
              className={`
                relative group flex flex-col p-4 rounded-xl border transition-all duration-300
                ${review.isPinned 
                  ? 'bg-purple-900/10 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
                  : 'bg-gray-900/40 border-white/5 hover:border-white/10 hover:bg-gray-800/40'
                }
                ${review.status === 'hidden' ? 'opacity-50 grayscale-[0.8]' : 'opacity-100'}
              `}
            >
              {/* 状态指示灯 */}
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl overflow-hidden">
                 <div className={`h-full w-full ${review.isPinned ? 'bg-purple-500' : (review.status === 'active' ? 'bg-cyan-500' : 'bg-gray-700')}`} />
              </div>

              {/* 用户信息 */}
              <div className="flex items-center gap-3 mb-3 pt-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center overflow-hidden">
                  {review.avatarUrl ? (
                    <img src={review.avatarUrl} alt={review.user} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold tracking-wider text-gray-300">{review.avatar}</span>
                  )}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium text-white truncate">{review.user}</span>
                  <span className="text-[10px] uppercase font-mono text-gray-500">{review.role}</span>
                </div>
              </div>

              {/* 评价内容 */}
              <div className="flex-1 min-h-0 mb-3">
                {editingId === review.id ? (
                  <div className="flex flex-col gap-3">
                    {/* 星级编辑 */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-400">服务星级</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setEditRating(star)}
                            className={`text-xl transition-all ${
                              star <= editRating ? 'text-yellow-400' : 'text-gray-600'
                            } hover:scale-110`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* 内容编辑 */}
                    <textarea 
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-black/50 border border-purple-500/50 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none h-20"
                      autoFocus
                    />
                    
                    {/* 项目返图显示（只读） */}
                    {review.projectImages && review.projectImages.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400">项目返图（不可编辑）</label>
                        <div className="grid grid-cols-2 gap-1">
                          {review.projectImages.slice(0, 2).map((img, idx) => (
                            <img key={idx} src={img} alt={`返图 ${idx + 1}`} className="w-full h-16 object-cover rounded border border-white/10" />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 justify-end">
                      <button onClick={cancelEdit} className="text-xs px-2 py-1 rounded text-gray-400 hover:text-white hover:bg-white/5">取消</button>
                      <button onClick={saveEdit} className="text-xs px-2 py-1 rounded bg-purple-600 text-white hover:bg-purple-500 flex items-center gap-1">
                        <Check size={10} /> 保存
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-3 group-hover:line-clamp-none">
                      "{review.content}"
                    </p>
                    
                    {/* 项目返图显示 */}
                    {review.projectImages && review.projectImages.length > 0 && (
                      <div className="mt-1 flex gap-1 flex-wrap">
                        {review.projectImages.slice(0, 2).map((img, idx) => (
                          <img key={idx} src={img} alt={`返图 ${idx + 1}`} className="w-12 h-12 object-cover rounded border border-white/10" />
                        ))}
                        {review.projectImages.length > 2 && (
                          <div className="w-12 h-12 rounded border border-white/10 flex items-center justify-center text-[10px] text-gray-500">
                            +{review.projectImages.length - 2}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <SignalStrength level={review.rating} />
                      <span className="text-[10px] font-mono text-gray-600">{review.date}</span>
                      {review.isPinned && (
                        <span className="flex items-center gap-1 text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                          <Zap size={8} fill="currentColor" /> 置顶
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 操作按钮组 */}
              <div className={`
                flex items-center justify-center gap-2 pt-3 border-t border-white/5
                ${editingId === review.id ? 'opacity-0 pointer-events-none' : ''}
              `}>
                <button 
                  onClick={() => togglePin(review.id)}
                  title={review.isPinned ? "取消置顶" : "置顶显示"}
                  className={`p-1.5 rounded border transition-all ${
                    review.isPinned 
                      ? 'bg-purple-500 text-white border-purple-400' 
                      : 'bg-gray-800 border-white/5 text-gray-400 hover:text-purple-400 hover:border-purple-500/50'
                  }`}
                >
                  <Pin size={14} className={review.isPinned ? "fill-current" : ""} />
                </button>

                <button 
                  onClick={() => startEdit(review)}
                  title="编辑内容"
                  className="p-1.5 rounded bg-gray-800 border border-white/5 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all"
                >
                  <Edit3 size={14} />
                </button>

                <button 
                  onClick={() => toggleStatus(review.id)}
                  title={review.status === 'active' ? "隐藏评价" : "显示评价"}
                  className="p-1.5 rounded bg-gray-800 border border-white/5 text-gray-400 hover:text-yellow-400 hover:border-yellow-500/50 transition-all"
                >
                  {review.status === 'active' ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>

                <button 
                  onClick={() => deleteReview(review.id)}
                  title="永久删除"
                  className="p-1.5 rounded bg-gray-800 border border-white/5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/50 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          
          {reviews.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-600 border border-white/5 rounded-xl border-dashed">
               <Signal size={48} className="mb-4 opacity-20" />
               <div className="text-center">
                 <p className="text-gray-400 font-medium">未检测到信号</p>
                 <p className="text-xs text-gray-600 uppercase tracking-widest mt-1">NO SIGNALS DETECTED</p>
               </div>
            </div>
          )}
        </div>
      )}
      
    </div>
  );
};

window.ReviewManagementPanel = ReviewManagementPanel;
