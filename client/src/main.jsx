import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { StatusBar, Style } from '@capacitor/status-bar';
import App from './App';
import './index.css';

// 初始化状态栏：深色背景+浅色文字，不覆盖内容
async function initStatusBar() {
  try {
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#0a0f16' });
    await StatusBar.setOverlaysWebView({ overlay: false });
    console.log('✅ StatusBar 已配置');
  } catch (e) {
    console.warn('StatusBar 插件不可用，使用CSS兜底');
  }

  // JS兜底：如果 safe-area-inset-top 为 0（部分旧设备），使用固定值
  const style = getComputedStyle(document.documentElement);
  const safeTop = style.getPropertyValue('padding-top');
  if (!safeTop || safeTop === '0px') {
    // 安卓状态栏通常是 24px，iOS刘海屏更大
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const fallback = isIOS ? '44px' : '24px';
    document.documentElement.style.paddingTop = `max(env(safe-area-inset-top, 0px), ${fallback})`;
    console.log(`📱 安全区域兜底: ${fallback}`);
  }
}

initStatusBar();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
