import React from 'react';
import ReactDOM from 'react-dom/client';
import QueryProvider from './lib/QueryProvider';
import App from './App';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        // Service worker registered successfully
        if (process.env.NODE_ENV === 'development') {
          console.log('Service worker registered:', registration);
        }
      })
      .catch((error) => {
        console.error('Service worker registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryProvider>
      <App />
    </QueryProvider>
  </React.StrictMode>
);

