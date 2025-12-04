/**
 * 高级鼠标特效：圆形区域反转色 + 平滑跟随
 * 实现要点：
 * - 使用 requestAnimationFrame 驱动位置插值，避免频繁重绘卡顿
 * - 支持两种反转算法：
 *   1) difference：白色圆形 + mix-blend-mode:difference（兼容性较好）
 *   2) backdrop：圆形使用 backdrop-filter: invert(1)（在支持 backdrop-filter 的浏览器上效果更佳）
 * - 边界处理：根据半径对坐标进行 clamp，保证圆形不越界
 * - 性能优化：
 *   - passive 事件监听
 *   - will-change: transform
 *   - 通过线性插值（lerp）平滑跟随，减少抖动
 *   - 支持关闭动画（prefers-reduced-motion）
 */

import React, { useEffect, useRef, useState } from 'react';

type InvertAlgorithm = 'difference' | 'backdrop';

interface CustomCursorProps {
  radius?: number; // 圆形半径
  algorithm?: InvertAlgorithm; // 反转算法
  lerp?: number; // 插值系数(0-1)，越大跟随越快
  visible?: boolean; // 是否显示
  scaleOnHover?: boolean; // 悬停可点击元素时放大
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const supportsBackdropFilter = () => typeof CSS !== 'undefined' && CSS.supports && (CSS.supports('backdrop-filter: invert(1)') || CSS.supports('-webkit-backdrop-filter: invert(1)'));

const CustomCursor: React.FC<CustomCursorProps> = ({
  radius = 40,
  algorithm = 'difference',
  lerp = 0.18,
  visible = true,
  scaleOnHover = true,
}) => {
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [hovering, setHovering] = useState(false);
  const circleRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const target = useRef({ x: -100, y: -100 });
  const current = useRef({ x: -100, y: -100 });

  useEffect(() => {
    if (!visible) return;

    const circle = circleRef.current;
    if (!circle) return;

    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const rx = radius;
      const ry = radius;
      const clampedX = clamp(e.clientX, rx, w - rx);
      const clampedY = clamp(e.clientY, ry, h - ry);
      target.current.x = clampedX;
      target.current.y = clampedY;
      const el = e.target as HTMLElement | null;
      const clickable = el && (el.closest('button') || el.closest('a') || el.closest('[data-hover="true"]'));
      setHovering(!!clickable);
    };

    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = now - last; // 仅用于可选性能监测
      last = now;

      const k = prefersReduced ? 1 : lerp;
      current.current.x += (target.current.x - current.current.x) * k;
      current.current.y += (target.current.y - current.current.y) * k;
      const s = scaleOnHover && hovering ? 1.15 : 1;
      circle.style.transform = `translate3d(${Math.round(current.current.x)}px, ${Math.round(current.current.y)}px, 0) translate(-50%, -50%) scale(${s})`;
      frameRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [visible, radius, lerp, scaleOnHover, prefersReduced]);

  if (!visible) return null;

  const useBackdrop = algorithm === 'backdrop' && supportsBackdropFilter();

  const commonStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 9999,
    width: radius * 2,
    height: radius * 2,
    borderRadius: '50%',
    pointerEvents: 'none',
    willChange: 'transform',
    transform: 'translate3d(-100px, -100px, 0) translate(-50%, -50%)',
    boxShadow: '0 0 10px rgba(255,255,255,0.20)',
  };

  const style: React.CSSProperties = useBackdrop
    ? {
        ...commonStyle,
        backgroundColor: 'transparent',
        backdropFilter: 'invert(1)',
        WebkitBackdropFilter: 'invert(1)',
      }
    : {
        ...commonStyle,
        backgroundColor: '#fff',
        mixBlendMode: 'difference',
      };

  return <div ref={circleRef} style={style} />;
};

export default CustomCursor;
