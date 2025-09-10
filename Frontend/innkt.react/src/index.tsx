import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

console.log('index.tsx is loading');

const rootElement = document.getElementById('root');
console.log('Root element:', rootElement);

if (!rootElement) {
  console.error('Root element not found!');
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement);
console.log('Creating React root');

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('React app rendered');
