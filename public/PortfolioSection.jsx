// 使用全局 React 对象（通过 Babel standalone 和 UMD React）
const { useState, useEffect } = React;

// =============================================================================
// 子组件: 极简主义模态框 (The Void Viewer) - 无外部图标库版
// =============================================================================
const ProjectModal = ({ project, onClose }) => {
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const images = project.processedImages || [];

  useEffect(() => {
    // 禁用背景滚动
    document.body.style.overflow = 'hidden';
    
    // 隐藏页眉
    if (window.hideNavbar) {
      window.hideNavbar();
    }
    
    return () => {
      // 恢复背景滚动
      document.body.style.overflow = '';
      // 显示页眉
      if (window.showNavbar) {
        window.showNavbar();
      }
    };
  }, []); // 只在组件挂载/卸载时执行

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') nextImg();
      if (e.key === 'ArrowLeft') prevImg();
    };
    window.addEventListener('keydown', handleKey);
    
    return () => {
      window.removeEventListener('keydown', handleKey);
    };
  }, [currentImgIdx, onClose]);

  if (!project) return null;

  const nextImg = () => setCurrentImgIdx((prev) => (prev + 1) % images.length);
  const prevImg = () => setCurrentImgIdx((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 overflow-hidden font-sans">
      {/* 1. 背景遮罩: 纯粹的深黑，无噪点 */}
      <div 
        className="absolute inset-0 bg-[#050505]/95 backdrop-blur-md transition-opacity duration-500" 
        onClick={onClose}
      />

      {/* 2. 主体容器 */}
      <div className="relative w-full h-full flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-500">
        
        {/* 左侧: 沉浸式视觉区 (图片) */}
        <div className="relative w-full md:w-[75%] h-full bg-transparent flex items-center justify-center p-4 md:p-12 group select-none" style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          {images.length > 0 ? (
            <img 
              src={images[currentImgIdx]} 
              alt={project.title} 
              className="max-w-full max-h-[80vh] object-contain shadow-2xl shadow-black/50"
              style={{maxWidth: '90%', maxHeight: '80vh', objectFit: 'contain', display: 'block'}}
            />
          ) : (
            <div className="text-gray-600 font-light tracking-widest">NO VISUAL</div>
          )}
          
          {/* 关闭按钮 - 左上角 */}
          <button 
            onClick={(e) => {e.stopPropagation(); onClose();}} 
            className="absolute top-6 left-6 z-50 text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300 text-4xl font-thin leading-none cursor-pointer rounded-full w-12 h-12 flex items-center justify-center backdrop-blur-sm border border-white/10"
            title="关闭 (ESC)"
          >
            ×
          </button>
          
          {/* 隐形导航热区 & 纯文本箭头 */}
          {images.length > 1 && (
            <>
              <div onClick={(e) => {e.stopPropagation(); prevImg()}} className="absolute left-0 top-0 bottom-0 w-[20%] cursor-pointer z-10 hover:bg-gradient-to-r hover:from-white/5 hover:to-transparent transition-all flex items-center justify-start pl-4 opacity-0 hover:opacity-100 text-white text-6xl font-thin leading-none">
                ‹
              </div>
              <div onClick={(e) => {e.stopPropagation(); nextImg()}} className="absolute right-0 top-0 bottom-0 w-[20%] cursor-pointer z-10 hover:bg-gradient-to-l hover:from-white/5 hover:to-transparent transition-all flex items-center justify-end pr-4 opacity-0 hover:opacity-100 text-white text-6xl font-thin leading-none">
                ›
              </div>
            </>
          )}

          {/* 极简页码 */}
          {images.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs font-light text-white/30 tracking-[0.5em] pointer-events-none">
              {String(currentImgIdx + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
            </div>
          )}
        </div>

        {/* 右侧: 信息流 */}
        <div className="relative w-full md:w-[25%] h-full bg-[#0a0a0a] border-l border-white/5 flex flex-col p-8 md:p-12 overflow-y-auto" style={{minHeight: '100vh', maxHeight: '100vh', position: 'relative'}}>
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 z-50 text-white/40 hover:text-white hover:bg-white/10 transition-all duration-300 text-5xl font-thin leading-none cursor-pointer rounded-full w-12 h-12 flex items-center justify-center"
            style={{zIndex: 9999}}
            title="关闭"
          >
            ×
          </button>

          <div className="mt-12 flex-shrink-0">
            <h2 className="text-2xl font-light text-white mb-2 leading-tight tracking-wide">{project.title}</h2>
            <div className="w-8 h-[1px] bg-gradient-to-r from-purple-500 to-cyan-500 mt-6 mb-8"></div>
          </div>

          <div className="space-y-8 text-sm font-light text-gray-400 leading-7 flex-shrink-0">
            <p>{project.description || "No description provided."}</p>
          </div>

          <div className="mt-auto pt-12 space-y-4 text-xs tracking-[0.2em] text-gray-500 font-mono flex-shrink-0">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span>位置</span>
              <span className="text-gray-300">{project.location || "未填写"}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span>日期</span>
              <span className="text-gray-300">{project.created_at?.substring(0, 10) || "未填写"}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span>大小</span>
              <span className="text-gray-300">{project.size ? `${project.size}²` : "未填写"}</span>
            </div>
            {project.cost && (
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>成本</span>
                <span className="text-gray-300">{project.cost}</span>
              </div>
            )}
            {project.duration && (
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>工期</span>
                <span className="text-gray-300">{project.duration}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// 主组件: PortfolioSection
// =============================================================================
const PortfolioSection = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async (retryCount = 0) => {
      try {
        // --- 1. Supabase 客户端初始化 (严格按照 Cursor 要求) ---
        let sb = null;
        try { 
          if (typeof window.getSupabaseClient === 'function') {
            sb = window.getSupabaseClient(); 
          }
        } catch(_) {}

        if (!sb && window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
          // 检查是实例还是构造函数
          if (typeof window.supabase.createClient === 'function') {
             sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
          } else if (window.supabase.from) {
             sb = window.supabase;
          }
        }

        // 兼容其他可能的挂载点
        if (!sb && window.sb) sb = window.sb;

        // 如果没找到客户端，简单的重试机制
        if (!sb) {
          if (retryCount < 3) {
            setTimeout(() => isMounted && fetchData(retryCount + 1), 500);
            return;
          }
          throw new Error("Supabase client failed to initialize.");
        }

        // --- 2. 查询数据 (严格按照 Cursor 要求: is_deleted, is_hidden, 排序) ---
        const { data, error } = await sb
          .from('works')
          .select('*')
          .eq('is_deleted', false)
          .eq('is_hidden', false)
          .order('pinned_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(18);

        if (error) throw error;

        // --- 3. 数据字段映射与清洗 ---
        const cleanData = (data || []).map(item => {
          let processedImages = [];
          
          // 处理 image_urls (支持数组、JSON字符串、逗号分隔字符串)
          if (Array.isArray(item.image_urls)) {
            processedImages = item.image_urls;
          } else if (typeof item.image_urls === 'string' && item.image_urls.trim()) {
            if (item.image_urls.trim().startsWith('[')) {
               try { processedImages = JSON.parse(item.image_urls); } catch(e) { processedImages = [item.image_urls]; }
            } else {
               processedImages = item.image_urls.split(',').map(s => s.trim()).filter(s => s);
            }
          } else if (item.image_url) {
            processedImages = [item.image_url];
          }
          
          // 调试日志
          if (processedImages.length === 0) {
            console.warn('项目没有图片:', item.id, item.title, { image_urls: item.image_urls, image_url: item.image_url });
          } else {
            console.log('项目图片加载成功:', item.id, item.title, processedImages.length, '张图片');
          }
          
          return { ...item, processedImages };
        });

        if (isMounted) {
          setProjects(cleanData);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Portfolio Error:", err);
        if (isMounted) {
          setErrorMsg(err.message);
          setIsLoading(false);
        }
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, []);

  return (
    <section 
      id="portfolio-root"
      // 按照 Cursor 要求添加的 inline style 和 className
      className="relative w-full min-h-screen py-32 px-4 sm:px-8 bg-transparent"
      style={{ display: 'block', visibility: 'visible', opacity: 1, position: 'relative', zIndex: 10 }}
    >
      {/* 极简标题区 */}
      <div className="max-w-7xl mx-auto mb-32 text-center">
        <h2 className="text-4xl md:text-6xl font-thin tracking-[0.2em] mb-4 group cursor-default">
          <span className="text-white/30 group-hover:text-white transition-colors duration-500">精选</span>
          <span className="mx-2 text-white/30 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 transition-all duration-500">作品</span>
        </h2>
        <div className="w-[1px] h-16 bg-gradient-to-b from-white/20 to-transparent mx-auto"></div>
      </div>

      {/* 状态显示 */}
      {isLoading && (
        <div className="w-full h-64 flex items-center justify-center">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping"></div>
        </div>
      )}

      {/* 错误提示 - 保持极简 */}
      {!isLoading && (projects.length === 0 || errorMsg) && (
        <div className="w-full h-64 flex flex-col items-center justify-center opacity-50">
          <div className="text-2xl mb-4 text-white font-thin">?</div>
          <p className="font-light tracking-widest text-white text-xs">NO SIGNALS DETECTED</p>
          {errorMsg && <p className="text-[10px] text-red-400 mt-2 font-mono opacity-50">{errorMsg}</p>}
        </div>
      )}

      {/* 悬浮网格布局 - 错落有致 (失重效果) */}
      {!isLoading && projects.length > 0 && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-32 perspective-[1000px]">
          {projects.map((project, idx) => (
            <div 
              key={project.id || idx}
              onClick={() => setSelectedProject(project)}
              className="group relative cursor-pointer"
              // 错落布局 + 浮动动画
              style={{
                marginTop: idx % 3 === 1 ? '6rem' : '0', 
                animation: `float ${5 + (idx % 3)}s ease-in-out infinite alternate`,
                animationDelay: `${idx * 0.5}s`
              }}
            >
              {/* 图片容器 - 极简，无边框 */}
              <div className="relative aspect-[3/4] overflow-hidden bg-[#050505]/50 transition-all duration-700 ease-out transform group-hover:scale-105 group-hover:shadow-[0_20px_60px_-15px_rgba(168,85,247,0.3)]">
                {project.processedImages[0] ? (
                  <img 
                    src={project.processedImages[0]} 
                    alt={project.title} 
                    className="w-full h-full object-cover opacity-60 transition-all duration-700 ease-out filter grayscale group-hover:grayscale-0 group-hover:opacity-100"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-800 text-xs tracking-widest">NO DATA</div>
                )}
                
                {/* 悬停时的光效 */}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>

              {/* 悬浮标题 - 只有 hover 时完全显现 */}
              <div className="absolute -bottom-12 left-0 w-full text-center transition-all duration-500 transform group-hover:-translate-y-4">
                <span className="block text-[10px] text-cyan-400 tracking-[0.3em] uppercase mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                  NO.0{idx + 1}
                </span>
                <h3 className="text-xl text-white font-thin tracking-wider opacity-50 group-hover:opacity-100 transition-opacity duration-300">
                  {project.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 浮动动画 CSS */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-20px); }
        }
        .perspective-[1000px] { perspective: 1000px; }
      `}</style>

      {/* 模态框 */}
      {selectedProject && (
        <ProjectModal 
          project={selectedProject} 
          onClose={() => setSelectedProject(null)} 
        />
      )}
    </section>
  );
};

// 必须导出到 window，供外部调用
if (typeof window !== 'undefined') {
  window.PortfolioSection = PortfolioSection;
}

// 不需要 export default，因为是通过 window 对象访问