// =============================================================================
// 页眉滚动隐藏/显示功能
// =============================================================================
(function() {
    let lastScrollTop = 0;
    let ticking = false;
    const navbar = document.querySelector('.navbar');
    const scrollThreshold = 50; // 滚动超过50px才开始隐藏
    
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
        } else {
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
    if (navbar) {
        navbar.classList.remove('hidden');
    }
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

