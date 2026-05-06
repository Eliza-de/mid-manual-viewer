import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import App from './App.jsx';
import './styles/global.css';
import { antdTheme } from './styles/antd-theme.js';

const basename = import.meta.env.PROD ? '/mid-manual-viewer' : '/';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider theme={antdTheme}>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>
);
