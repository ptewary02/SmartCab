import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Global styles
const style = document.createElement('style');
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body { background: #0D1B2A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; }
  input, select, button { font-family: inherit; }
  input::placeholder { color: #4a5a6a; }
  select option { background: #1B263B; color: #fff; }
  @keyframes spin { to { transform: rotate(360deg); } }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #0D1B2A; }
  ::-webkit-scrollbar-thumb { background: #2a3a50; border-radius: 4px; }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
