import { useState, useEffect } from 'react';
import FOOTBALL_IMAGES from '../services/photos';

export default function HeroCarousel() {
  const images = FOOTBALL_IMAGES.stadiums;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent(c => (c + 1) % images.length), 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {images.map((url, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <img
            src={url}
            alt=""
            className="w-full h-full object-cover"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        </div>
      ))}
      {/* 暗色叠加层确保文字可读 */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(135deg, rgba(10,22,40,0.92) 0%, rgba(15,25,51,0.88) 40%, rgba(26,71,42,0.85) 70%, rgba(10,22,40,0.92) 100%)'
      }} />
      {/* 纹理叠加 */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
    </div>
  );
}
