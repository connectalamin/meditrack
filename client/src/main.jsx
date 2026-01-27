import React from 'react';
import ReactDOM from 'react-dom/client';
import QueryProvider from './lib/QueryProvider';
import App from './App';
import './index.css';

// Only register the service worker in production so local dev (Vite) doesn't
// get a cached shell that can cause unexpected full-page reloads.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('Service worker registered:', registration);
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

