const { useState, useEffect, useRef } = React;
const Icon = {
  Quote: (p) => <span {...p}>❝</span>,
  Star: (p) => <span {...p}>★</span>,
  ChevronLeft: (p) => <span {...p}>◀</span>,
  ChevronRight: (p) => <span {...p}>▶</span>,
  Zap: (p) => <span {...p}>⚡</span>,
  User: (p) => <span {...p}>👤</span>,
  Fingerprint: (p) => <span {...p}>⌘</span>,
  Loader2: (p) => <span {...p}>⏳</span>,
  AlertCircle: (p) => <span {...p}>⚠️</span>,
  Upload: (p) => <span {...p}>⬆️</span>,
  X: (p) => <span {...p}>✕</span>,
  Signal: (p) => <span {...p}>📶</span>,
  CheckCircle: (p) => <span {...p}>✓</span>
};

// -----------------------------------------------------------------------------
// 组件: 自定义提示框 (Toast Notification)
// -----------------------------------------------------------------------------
const ToastNotification = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] animate-fade-in">
      <div className={`
        relative px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border
        ${type === 'success' 
          ? 'bg-gradient-to-r from-purple-600/90 to-cyan-500/90 border-purple-400/50' 
          : 'bg-gradient-to-r from-red-600/90 to-orange-500/90 border-red-400/50'
        }
        transform transition-all duration-500 ease-out
        hover:scale-105
      `}>
        {/* 背景光效 */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 rounded-2xl animate-shimmer" />
        
        {/* 内容 */}
        <div className="relative flex items-center gap-3">
          {type === 'success' ? (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Icon.CheckCircle className="text-white text-xl" />
            </div>
          ) : (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Icon.AlertCircle className="text-white text-xl" />
            </div>
          )}
          <p className="text-white font-medium text-sm md:text-base">{message}</p>
          <button 
            onClick={onClose}
            className="ml-2 text-white/70 hover:text-white transition-colors"
          >
            <Icon.X className="w-4 h-4" />
          </button>
        </div>
        
        {/* 进度条 */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-2xl overflow-hidden">
          <div className="h-full bg-white/40 animate-progress" />
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// 组件: 项目返图轮播
// -----------------------------------------------------------------------------
const ProjectImageCarousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (!images || images.length === 0) return null;
  
  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };
  
  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  
  return (
    <div className="mt-4 rounded-xl overflow-hidden border border-white/10 relative group">
      <img 
        src={images[currentIndex]} 
        alt={`项目返图 ${currentIndex + 1}`} 
        className="w-full max-h-64 object-cover"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Icon.ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Icon.ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white w-6' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// 组件: 评价板块 (Testimonial Section) - 包含前卫模态框设计
// -----------------------------------------------------------------------------
const TestimonialSection = () => {
  // 状态管理
  const [testimonials, setTestimonials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // 表单状态
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]); // 改为支持多文件
  const [previewUrls, setPreviewUrls] = useState([]); // 改为支持多预览
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const autoPlayRef = useRef(null);
  const fileInputRef = useRef(null);

  // ---------------------------------------------------------------------------
  // 数据加载
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        let sb = null;
        try { if (typeof getSupabaseClient === 'function') sb = getSupabaseClient(); } catch (_) {}
        if (!sb && window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
          sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
        }
        if (!sb) { if (mounted) setIsLoading(false); return; }
        
        // 获取未隐藏且未删除的评价
        const { data, error } = await sb
          .from('reviews')
          .select('*')
          .eq('is_deleted', false)
          .eq('is_hidden', false) // 仅显示已审核通过的 (Show only approved)
          .order('pinned_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false });

        if (error) throw error;

        // 处理数据，获取用户头像
        const mapped = await Promise.all((data || []).map(async (item) => {
          // 尝试获取用户头像
          let avatarUrl = item.user_avatar_url || null;
          
          // 如果没有 user_avatar_url，尝试从 user_profiles 表获取
          if (!avatarUrl && item.user_id && item.user_id !== 'anonymous') {
            try {
              const { data: profile } = await sb
                .from('user_profiles')
                .select('avatar_url')
                .eq('id', item.user_id)
                .single();
              if (profile && profile.avatar_url) {
                avatarUrl = profile.avatar_url;
              }
            } catch (profileError) {
              // 静默失败，继续使用默认值
              console.warn('获取用户头像失败:', profileError);
            }
          }
          
          // 如果还是没有，且没有项目返图，则 image_url 可能是旧数据的头像
          if (!avatarUrl && !item.project_image_url) {
            avatarUrl = item.image_url || null;
          }
          
          // 处理项目返图：如果是字符串（逗号分隔），转换为数组
          let projectImages = [];
          if (item.project_image_url) {
            if (typeof item.project_image_url === 'string') {
              projectImages = item.project_image_url.split(',').map(url => url.trim()).filter(url => url);
            } else if (Array.isArray(item.project_image_url)) {
              projectImages = item.project_image_url;
            }
          }
          
          return {
            id: item.id,
            name: item.name || item.user_id || 'Anonymous',
            role: item.role || 'Client',
            rating: item.rating || 5,
            content: item.content || item.comment || '',
            tag: item.tag || 'Review',
            // 用户头像（用于显示在头像位置）
            image_url: avatarUrl,
            // 项目返图数组（用于显示在评价内容中，支持轮播）
            project_images: projectImages
          };
        }));
        
        if (mounted) setTestimonials(mapped);
      } catch (e) {
        console.error('加载评价失败:', e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // ---------------------------------------------------------------------------
  // 轮播逻辑
  // ---------------------------------------------------------------------------
  const nextSlide = () => {
    if (testimonials.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    if (testimonials.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    if (isAutoPlaying && testimonials.length > 0) {
      autoPlayRef.current = setInterval(nextSlide, 5000); 
    }
    return () => clearInterval(autoPlayRef.current);
  }, [isAutoPlaying, testimonials.length]);

  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  // ---------------------------------------------------------------------------
  // 3D 轮播样式计算
  // ---------------------------------------------------------------------------
  const getSlideStyle = (index) => {
    const total = testimonials.length;
    let offset = (index - activeIndex + total) % total;
    if (offset > total / 2) offset -= total;

    const isActive = offset === 0;
    const isPrev = offset === -1;
    const isNext = offset === 1;

    let style = {
      opacity: 0,
      transform: 'translateX(0) scale(0.8) translateZ(-100px)',
      zIndex: 0,
      pointerEvents: 'none',
      filter: 'blur(10px)',
      transition: 'all 0.7s cubic-bezier(0.2, 0.8, 0.2, 1)'
    };

    if (isActive) {
      style = {
        ...style,
        opacity: 1,
        transform: 'translateX(0) scale(1) translateZ(0)',
        zIndex: 20,
        pointerEvents: 'auto',
        filter: 'blur(0px)',
        borderColor: 'rgba(168, 85, 247, 0.5)', 
      };
    } else if (isPrev) {
      style = {
        ...style,
        opacity: 0.4,
        transform: 'translateX(-60%) scale(0.85) perspective(1000px) rotateY(15deg)',
        zIndex: 10,
        pointerEvents: 'none',
        filter: 'blur(2px)',
      };
    } else if (isNext) {
      style = {
        ...style,
        opacity: 0.4,
        transform: 'translateX(60%) scale(0.85) perspective(1000px) rotateY(-15deg)',
        zIndex: 10,
        pointerEvents: 'none',
        filter: 'blur(2px)',
      };
    }

    return { style, isActive };
  };

  // ---------------------------------------------------------------------------
  // 提交评价逻辑
  // ---------------------------------------------------------------------------
  const handleSubmit = async () => {
    if (!content.trim()) {
      alert('请输入评价内容');
      return;
    }
    setIsSubmitting(true);
    try {
      let sb = null;
      try { if (typeof getSupabaseClient === 'function') sb = getSupabaseClient(); } catch (_) {}
      if (!sb && window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
        sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
      }
      if (!sb) { alert('数据库连接异常'); return; }

      // 检查登录状态 - 允许匿名用户提交评价
      let userName = '匿名用户';
      let userEmail = null;
      let userRole = 'Guest';
      let userAvatarUrl = null;
      
      try {
        const { data: { session } } = await sb.auth.getSession();
        if (session && session.user) {
          userName = session.user.email ? session.user.email.split('@')[0] : '用户';
          userEmail = session.user.email;
          userRole = 'User';
          
          // 尝试获取用户头像
          try {
            const { data: profile } = await sb
              .from('user_profiles')
              .select('avatar_url')
              .eq('id', session.user.id)
              .single();
            if (profile && profile.avatar_url) {
              userAvatarUrl = profile.avatar_url;
            }
          } catch (profileError) {
            console.warn('获取用户头像失败:', profileError);
          }
        }
      } catch (authError) {
        console.warn('获取登录状态失败，将使用匿名身份:', authError);
        // 继续使用匿名身份
      }

      // 上传多张图片
      let projectImageUrls = [];
      if (files && files.length > 0) {
        try {
          // 并行上传所有图片
          const uploadPromises = files.map(async (file, index) => {
            try {
              const path = `reviews/${Date.now()}_${index}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
              const { data: uploadData, error: uploadError } = await sb.storage
                .from('reviews')
                .upload(path, file, { upsert: false });
              
              if (uploadError) {
                console.error(`图片 ${index + 1} 上传失败:`, uploadError);
                return null;
              } else {
                const { data: publicUrlData } = sb.storage.from('reviews').getPublicUrl(path);
                return publicUrlData.publicUrl;
              }
            } catch (uploadErr) {
              console.error(`图片 ${index + 1} 上传异常:`, uploadErr);
              return null;
            }
          });
          
          const uploadedUrls = await Promise.all(uploadPromises);
          projectImageUrls = uploadedUrls.filter(url => url !== null);
        } catch (uploadErr) {
          console.error('批量上传图片异常:', uploadErr);
        }
      }

      // 准备插入数据
      const insertData = {
        name: userName,
        user_id: userEmail || 'anonymous',
        role: userRole,
        rating: rating || 5,
        content: content.trim(),
        is_hidden: true, // 提交后默认隐藏，需要管理员审核
        is_deleted: false
      };

      // 分离用户头像和项目返图
      // 如果有上传的项目返图，存储到 project_image_url（多张图片用逗号分隔）
      if (projectImageUrls && projectImageUrls.length > 0) {
        insertData.project_image_url = projectImageUrls.join(',');
      }
      
      // 用户头像存储到 user_avatar_url（如果存在）
      if (userAvatarUrl && userAvatarUrl.trim() !== '') {
        insertData.user_avatar_url = userAvatarUrl;
      }
      
      // 为了向后兼容，image_url 字段存储用户头像（用于显示）
      if (userAvatarUrl && userAvatarUrl.trim() !== '') {
        insertData.image_url = userAvatarUrl;
      }

      // 插入数据
      const { data: insertResult, error: insertError } = await sb.from('reviews').insert(insertData);

      if (insertError) {
        console.error('插入评价数据失败:', insertError);
        // 提供更详细的错误信息
        if (insertError.code === '42501') {
          throw new Error('权限不足，请联系管理员检查数据库权限设置');
        } else if (insertError.code === '23505') {
          throw new Error('您已经提交过评价了');
        } else if (insertError.message) {
          throw new Error(`提交失败: ${insertError.message}`);
        } else {
          throw insertError;
        }
      }

      // 成功后重置表单
      setShowModal(false);
      setContent('');
      setRating(0);
      // 清理所有预览URL
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setFiles([]);
      setPreviewUrls([]);
      
      // 显示自定义成功提示
      setToast({
        message: '您的评价已发送，很快就会出现在这里啦！✨',
        type: 'success'
      });

      // 发送 ntfy 推送通知（如果已配置）
      if (typeof window.sendNtfyNotification === 'function') {
        const notificationMessage = `新评价：${userName} 给了 ${rating} 星评价\n${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`;
        window.sendNtfyNotification(
          '📝 收到新评价',
          notificationMessage,
          'high',
          'star,mail'
        );
      }

    } catch (e) {
      console.error('提交评价失败:', e);
      const errorMessage = e.message || '提交失败，请稍后重试';
      setToast({
        message: errorMessage,
        type: 'error'
      });
      // 如果是权限问题，提供更详细的提示
      if (errorMessage.includes('权限')) {
        console.error('数据库权限问题，请检查 Supabase RLS 策略');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      // 为每个文件创建预览URL
      const urls = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
    }
  };
  
  const removeImage = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviewUrls(newUrls);
    // 清理被移除的预览URL
    URL.revokeObjectURL(previewUrls[index]);
  };

  // ---------------------------------------------------------------------------
  // 渲染
  // ---------------------------------------------------------------------------
  return (
    <section id="testimonials" className="relative w-full min-h-[700px] bg-transparent overflow-hidden flex flex-col items-center justify-center py-20">
      
      {/* 氛围背景 */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* 标题区 */}
      <div className="relative z-20 text-center mb-16 px-4">
        <div className="flex items-center justify-center gap-2 mb-4">
            <Icon.Zap className="w-5 h-5 text-cyan-400 animate-pulse inline-block" />
            <span className="text-cyan-400 font-mono tracking-[0.3em] text-xs uppercase">System Feedback</span>
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 drop-shadow-lg">
          信号 <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500">回响</span>
        </h2>
        <div className="mt-6 flex items-center justify-center">
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-sm font-bold shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)] transition-all border border-white/10 backdrop-blur-md hover:scale-105 active:scale-95"
          >
            <span className="mr-2">📡</span> 发送信号 (添加评价)
          </button>
        </div>
      </div>

      {/* 内容展示区 */}
      {isLoading ? (
        <div className="relative w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 z-20">
          {/* 骨架屏已在 index.html 实现，这里是 React 挂载后的加载状态，双重保险 */}
          {Array.from({length:3}).map((_,i)=> (
            <div key={i} className="relative bg-white/5 rounded-2xl overflow-hidden h-[240px] animate-pulse border border-white/10">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite]"/>
            </div>
          ))}
        </div>
      ) : testimonials.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[400px] text-gray-500 z-20 bg-black/20 backdrop-blur-sm rounded-xl p-8 border border-white/5">
             <Icon.AlertCircle className="w-10 h-10 mb-4 opacity-50 inline-block" />
             <p>暂无回响数据 (No Signals Detected)</p>
        </div>
      ) : (
        /* 3D 轮播主体 */
        <div 
          className="relative w-full max-w-6xl h-[400px] md:h-[500px] flex items-center justify-center perspective-1000 z-20"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {testimonials.map((item, index) => {
            const { style, isActive } = getSlideStyle(index);
            return (
              <div
                key={item.id || index}
                className="absolute w-[90%] md:w-[600px] bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 flex flex-col justify-between shadow-2xl group"
                style={{
                  ...style,
                  boxShadow: isActive ? '0 25px 50px -12px rgba(147, 51, 234, 0.25)' : 'none'
                }}
              >
                <div className="absolute top-6 right-6 text-white/5 group-hover:text-purple-500/20 transition-colors duration-500">
                  <Icon.Quote className="text-6xl inline-block" />
                </div>
                
                <div className="flex items-center gap-4 mb-6 relative z-10">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${isActive ? 'border-purple-500 bg-purple-500/20' : 'border-white/10 bg-white/5'}`}>
                     {item.image_url ? (
                       <img src={item.image_url} alt="user" className="w-full h-full rounded-full object-cover" />
                     ) : (
                       <Icon.User className={`w-6 h-6 ${isActive ? 'text-purple-400' : 'text-gray-400'} inline-block`} />
                     )}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg tracking-wide">{item.name}</h4>
                    <p className="text-xs text-cyan-400 font-mono uppercase tracking-wider flex items-center gap-1">
                      {item.role} 
                      {isActive && <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping ml-2"/>}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar">
                  <p className="text-gray-200 text-lg leading-relaxed font-light italic mb-4">
                    "{item.content}"
                  </p>
                  
                  {/* 项目返图轮播显示 */}
                  {item.project_images && item.project_images.length > 0 && (
                    <ProjectImageCarousel images={item.project_images} />
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                      <Icon.Fingerprint className="w-3 h-3 text-gray-400 inline-block" />
                      <span className="text-xs text-gray-400 font-mono">{item.tag}</span>
                  </div>
                  
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Icon.Star 
                        key={i} 
                        className={`${i < (item.rating || 5) ? 'text-purple-500 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]' : 'text-gray-700'} inline-block text-sm`} 
                      />
                    ))}
                  </div>
                </div>
                
                {/* 边框光效 */}
                {isActive && (
                  <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-purple-500/30 pointer-events-none animate-pulse" />
                )}
              </div>
            );
          })}
          
          {/* 轮播按钮 */}
          <button 
            onClick={prevSlide}
            className="absolute left-2 md:left-10 z-30 w-12 h-12 rounded-full bg-black/40 hover:bg-purple-600 border border-white/10 hover:border-purple-500 text-white transition-all flex items-center justify-center backdrop-blur-md group"
          >
            <Icon.ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform inline-block" />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-2 md:right-10 z-30 w-12 h-12 rounded-full bg-black/40 hover:bg-purple-600 border border-white/10 hover:border-purple-500 text-white transition-all flex items-center justify-center backdrop-blur-md group"
          >
            <Icon.ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform inline-block" />
          </button>
        </div>
      )}

      {/* 进度条 */}
      {!isLoading && testimonials.length > 0 && (
        <div className="mt-10 flex gap-3 z-20">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                activeIndex === idx ? 'w-12 bg-gradient-to-r from-purple-500 to-cyan-500 shadow-[0_0_10px_#a855f7]' : 'w-2 bg-gray-700 hover:bg-gray-600'
              }`}
            />
          ))}
        </div>
      )}

      {/* -----------------------------------------------------------------------
          ★★★ 全新设计的"前卫/脑洞"模态框 ★★★ 
          ----------------------------------------------------------------------- */}
      {showModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{overflow: 'hidden', position: 'fixed'}}
          onWheel={(e) => {
            // 阻止模态框背景的滚动
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* 背景遮罩 */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setShowModal(false)}
            onWheel={(e) => {
              // 阻止背景滚动
              e.preventDefault();
              e.stopPropagation();
            }}
          />

          {/* 模态框主体 - Cyberpunk Terminal */}
          <div 
            className="relative w-full max-w-2xl bg-[#0a0a10] border border-purple-500/30 rounded-lg shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col animate-in fade-in zoom-in-95 duration-300"
            style={{
              maxHeight: '75vh',
              marginTop: '80px', // 避免被页眉挡住
              overflow: 'hidden' // 禁用模态框容器滚动
            }}
            onClick={(e) => {
              // 阻止点击模态框内容时关闭
              e.stopPropagation();
            }}
            onWheel={(e) => {
              // 阻止模态框容器滚动
              e.stopPropagation();
            }}
          >
            
            {/* 顶部装饰条 */}
            <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-600 animate-[shimmer_2s_infinite]" style={{backgroundSize: '200% 100%'}} />
            
            <div className="p-1 bg-white/5 border-b border-white/5 flex items-center justify-between px-4">
               <div className="flex items-center gap-2 text-sm text-purple-400">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"/>
                  用户评价系统
               </div>
               <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors">
                 <Icon.X className="w-5 h-5" />
               </button>
            </div>

            <div className="p-6 md:p-8 relative" style={{maxHeight: 'calc(85vh - 120px)', overflowY: 'auto'}}>
              {/* 背景网格 */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" 
                   style={{backgroundImage: 'radial-gradient(#4f4f4f 1px, transparent 1px)', backgroundSize: '20px 20px'}} 
              />

              <div className="relative z-10">
                <h3 className="text-3xl font-black text-white mb-1 tracking-tight">
                  发表 <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">用户评价</span>
                </h3>
                <p className="text-gray-400 text-sm mb-8">请填写您的评价信息，帮助我们改进服务</p>

                {/* 评分区域 */}
                <div className="mb-6">
                   <label className="block text-sm font-bold text-gray-300 mb-3">服务星级 <span className="text-gray-500 text-xs font-normal">(必填)</span></label>
                   <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                      <div className="flex gap-2">
                        {[...Array(5)].map((_, i) => (
                          <button
                            key={i}
                            onMouseEnter={() => setHoverRating(i+1)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(i+1)}
                            className="group relative p-1 transition-transform hover:scale-110 focus:outline-none"
                          >
                            <Icon.Star 
                              className={`text-3xl transition-all duration-200 ${
                                (hoverRating || rating) > i 
                                  ? 'text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]' 
                                  : 'text-gray-700 group-hover:text-gray-500'
                              }`} 
                            />
                          </button>
                        ))}
                      </div>
                      <div className="text-sm text-purple-300 ml-auto">
                         {(hoverRating || rating) > 0 ? `已选择 ${hoverRating || rating} 星` : '请选择星级'}
                      </div>
                   </div>
                </div>

                {/* 内容输入 */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-300 mb-3">评价内容 <span className="text-gray-500 text-xs font-normal">(必填)</span></label>
                  <textarea 
                    value={content} 
                    onChange={(e)=>setContent(e.target.value)} 
                    placeholder="请详细描述您的使用体验、服务感受等..." 
                    className="w-full h-24 bg-black/50 border border-white/10 rounded-xl p-4 text-base text-gray-200 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder-gray-500 resize-none"
                  />
                </div>

                {/* 多图上传 */}
                <div className="mb-6">
                   <label className="block text-sm font-bold text-gray-300 mb-3">项目返图 <span className="text-gray-500 text-xs font-normal">(选填，可上传多张)</span></label>
                   <div 
                     onClick={() => fileInputRef.current?.click()}
                     className="group relative w-full min-h-24 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all overflow-hidden p-4"
                   >
                      {previewUrls.length > 0 ? (
                        <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-3">
                          {previewUrls.map((url, index) => (
                            <div key={index} className="relative group/item">
                              <img src={url} alt={`preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg border border-white/10" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeImage(index);
                                }}
                                className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity text-xs"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <div className="w-full h-24 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center text-gray-500 hover:text-purple-400 transition-colors">
                            <span className="text-xs">+ 添加更多</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-purple-400 transition-colors">
                           <Icon.Upload className="text-2xl mb-1" />
                           <span className="text-xs">⬆️ 点击上传图片（可多选）</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*" 
                        multiple
                        onChange={handleFileChange} 
                        className="hidden"
                      />
                   </div>
                </div>

                {/* 提交按钮 */}
                <div className="flex justify-end pt-4 border-t border-white/10">
                  <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="relative overflow-hidden px-8 py-3 bg-white text-black font-bold uppercase tracking-widest rounded hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isSubmitting ? (
                       <span className="flex items-center gap-2">
                         <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/>
                         提交中...
                       </span>
                    ) : (
                       <span className="relative z-10 flex items-center gap-2">
                         提交评价 <Icon.Signal className="w-4 h-4" />
                       </span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 opacity-0 group-hover:opacity-20 transition-opacity"/>
                  </button>
                </div>

              </div>
            </div>
            
            {/* 底部装饰 */}
            <div className="bg-black p-2 border-t border-white/5 flex justify-between items-center text-xs text-gray-600 px-4">
               <span>您的评价对我们很重要</span>
               <span>感谢您的反馈</span>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {toast && (
        <ToastNotification 
          message={toast.message} 
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </section>
  );
};

window.TestimonialSection = TestimonialSection;
