import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function useSwipeBack({ threshold = 70, edgeWidth = 40 } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const touchRef = useRef(null);
  const [swipeProgress, setSwipeProgress] = useState(0);

  const isDetailPage = location.pathname.startsWith('/match/') ||
    location.pathname.startsWith('/team/') ||
    location.pathname.startsWith('/news/') ||
    location.pathname.startsWith('/analysis');

  useEffect(() => {
    const isDesktop = window.innerWidth >= 768;
    if (isDesktop) return;

    const onTouchStart = (e) => {
      if (!isDetailPage) return;
      const touch = e.touches[0];
      if (touch.clientX <= edgeWidth) {
        touchRef.current = { x: touch.clientX, y: touch.clientY, valid: true };
      }
    };

    const onTouchMove = (e) => {
      const t = touchRef.current;
      if (!t || !t.valid) return;
      const touch = e.touches[0];
      const dx = touch.clientX - t.x;
      const dy = Math.abs(touch.clientY - t.y);

      // 垂直滑动优先 — 释放手势给浏览器滚动
      if (dy > Math.abs(dx) * 1.3 || dx < -10) {
        touchRef.current = null;
        setSwipeProgress(0);
        return;
      }

      // 确认为水平右滑，阻止浏览器默认行为
      if (dx > 15) {
        e.preventDefault();
      }

      const progress = Math.min(Math.max(dx / (window.innerWidth * 0.6), 0), 1);
      setSwipeProgress(progress);

      if (dx > threshold) {
        touchRef.current = null;
        setSwipeProgress(0);
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate('/');
        }
      }
    };

    const onTouchEnd = () => {
      touchRef.current = null;
      setSwipeProgress(0);
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [location.pathname, isDetailPage, edgeWidth, threshold, navigate]);

  return { swipeProgress, isDetailPage };
}
