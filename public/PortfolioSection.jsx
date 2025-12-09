// 使用全局 React 对象（通过 Babel standalone 和 UMD React）
const { useState, useEffect } = React;

// =============================================================================
// 主组件: PortfolioSection
// 注意：已移除 ProjectModal 和点击效果，作品图片不再可点击
// =============================================================================
const PortfolioSection = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async (retryCount = 0) => {
      try {
        console.log('[PortfolioSection] 开始获取数据, 重试次数:', retryCount);
        
        // --- 1. Supabase 客户端初始化 (严格按照 Cursor 要求) ---
        let sb = null;
        try { 
          if (typeof window.getSupabaseClient === 'function') {
            sb = window.getSupabaseClient(); 
            console.log('[PortfolioSection] 通过 getSupabaseClient 获取客户端');
          }
        } catch(e) {
          console.warn('[PortfolioSection] getSupabaseClient 失败:', e);
        }

        if (!sb && window.supabase) {
          // 检查是实例还是构造函数
          if (typeof window.supabase.createClient === 'function') {
            const url = window.SUPABASE_URL || 'https://afrasbvtsucsmddcdusi.supabase.co';
            const key = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcmFzYnZ0c3Vjc21kZGNkdXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTkzMDgsImV4cCI6MjA3ODM3NTMwOH0.CBeNwfTUNs1gPwhgiDDvP1N1B1_Lzya8fnYJzDSwbdM';
            sb = window.supabase.createClient(url, key);
            console.log('[PortfolioSection] 通过 createClient 创建客户端');
          } else if (window.supabase.from) {
             sb = window.supabase;
             console.log('[PortfolioSection] 使用现有的 supabase 实例');
          }
        }

        // 兼容其他可能的挂载点
        if (!sb && window.sb) {
          sb = window.sb;
          console.log('[PortfolioSection] 使用 window.sb');
        }

        // 如果没找到客户端，简单的重试机制
        if (!sb) {
          console.warn('[PortfolioSection] 未找到 Supabase 客户端');
          if (retryCount < 5) {
            setTimeout(() => isMounted && fetchData(retryCount + 1), 500);
            return;
          }
          throw new Error("Supabase client failed to initialize after 5 retries.");
        }

        // --- 2. 查询数据 (严格按照 Cursor 要求: is_deleted, is_hidden, 排序) ---
        console.log('[PortfolioSection] 开始查询 works 表');
        const { data, error } = await sb
          .from('works')
          .select('*')
          .eq('is_deleted', false)
          .eq('is_hidden', false)
          .order('pinned_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(18);

        console.log('[PortfolioSection] 查询结果:', { data: data?.length || 0, error });

        if (error) {
          console.error('[PortfolioSection] 查询错误:', error);
          throw error;
        }

        // --- 3. 数据字段映射与清洗 ---
        const cleanData = (data || []).map(item => {
          let processedImages = [];
          
          // 处理 image_urls (支持数组、JSON字符串、逗号分隔字符串)
          if (Array.isArray(item.image_urls)) {
            processedImages = item.image_urls;
          } else if (typeof item.image_urls === 'string') {
            if (item.image_urls.trim().startsWith('[')) {
               try { processedImages = JSON.parse(item.image_urls); } catch(e) { processedImages = [item.image_urls]; }
            } else {
               processedImages = item.image_urls.split(',').map(s => s.trim()).filter(s => s);
            }
          } else if (item.image_url) {
            processedImages = [item.image_url];
          }
          
          return { ...item, processedImages };
        });

        if (isMounted) {
          console.log('[PortfolioSection] 设置项目数据:', cleanData.length);
          setProjects(cleanData);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("[PortfolioSection] 错误:", err);
        if (isMounted) {
          setErrorMsg(err.message || '加载失败，请刷新页面重试');
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
      {/* 状态显示 */}
      {isLoading && (
        <div className="w-full h-64 flex items-center justify-center">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
        </div>
      )}

      {/* 错误提示 - 保持极简 */}
      {!isLoading && (projects.length === 0 || errorMsg) && (
          <div className="w-full h-64 flex flex-col items-center justify-center opacity-50">
          <div className="text-2xl mb-4 text-white font-thin">?</div>
          <p className="font-light tracking-widest text-white text-xs">暂无展示项目</p>
          {errorMsg && <p className="text-[10px] text-red-400 mt-2 font-mono opacity-50">{errorMsg}</p>}
        </div>
      )}

      {/* 悬浮网格布局 - 错落有致 (失重效果) */}
      {!isLoading && projects.length > 0 && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-32 perspective-[1000px]">
          {projects.map((project, idx) => (
            <div 
              key={project.id || idx}
              className="group relative"
              // 错落布局 + 浮动动画
              style={{
                marginTop: idx % 3 === 1 ? '6rem' : '0', 
                animation: `float ${5 + (idx % 3)}s ease-in-out infinite alternate`,
                animationDelay: `${idx * 0.5}s`
              }}
            >
              {/* 图片容器 - 极简，无边框，可点击 */}
              <div 
                className="relative aspect-[3/4] overflow-hidden bg-[#050505]/50 transition-all duration-700 ease-out transform group-hover:scale-105 cursor-pointer"
                onClick={() => {
                  if (typeof window.openWorkDetail === 'function') {
                    window.openWorkDetail(project.id);
                  }
                }}
              >
                {project.processedImages[0] ? (
                  <img 
                    src={project.processedImages[0]} 
                    alt={project.title} 
                    className="w-full h-full object-cover opacity-60 transition-all duration-700 ease-out filter grayscale group-hover:grayscale-0 group-hover:opacity-100"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-800 text-xs tracking-widest">暂无数据</div>
                )}
                
                {/* 悬停时的边缘光线流动效果 */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 border-image-shimmer" style={{
                    border: '2px solid transparent',
                    borderRadius: 'inherit',
                    background: 'conic-gradient(from 0deg, transparent 0deg, transparent 240deg, rgba(255, 255, 255, 0.6) 270deg, rgba(255, 255, 255, 0.6) 300deg, transparent 330deg, transparent 360deg)',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    padding: '2px',
                    animation: 'border-rotate 3s linear infinite'
                  }}></div>
                </div>
              </div>

              {/* 悬浮标题 - 只有 hover 时完全显现 */}
              <div className="absolute -bottom-12 left-0 w-full text-center transition-all duration-500 transform group-hover:-translate-y-4">
                <span className="block text-[10px] text-orange-400 tracking-[0.3em] uppercase mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
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
        @keyframes border-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .perspective-[1000px] { perspective: 1000px; }
      `}</style>

    </section>
  );
};

// 必须导出到 window，供外部调用
if (typeof window !== 'undefined') {
  window.PortfolioSection = PortfolioSection;
}

// 不需要 export default，因为是通过 window 对象访问