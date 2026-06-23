import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import AdminRoot from './admin/AdminRoot';
import './index.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found. Ensure your HTML has <div id="root"></div>');
}

const isAdmin = window.location.pathname.startsWith('/admin');

createRoot(root).render(
  <React.StrictMode>
    {isAdmin ? <AdminRoot /> : <App />}
  </React.StrictMode>
);
