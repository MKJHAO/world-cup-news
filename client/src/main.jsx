import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { StatusBar, Style } from '@capacitor/status-bar';
import App from './App';
import './index.css';

// 初始化状态栏：深色背景+浅色文字，不覆盖内容
try {
  StatusBar.setStyle({ style: Style.Light });
  StatusBar.setBackgroundColor({ color: '#0a0f16' });
  StatusBar.setOverlaysWebView({ overlay: false });
} catch {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
