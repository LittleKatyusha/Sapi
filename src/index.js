import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './AppSecure.jsx';
import reportWebVitals from './reportWebVitals';

// Suppress React DevTools console message in development
if (process.env.NODE_ENV === 'development') {
  const originalLog = console.log;
  console.log = (...args) => {
    const message = args.join(' ');
    if (message.includes('Download the React DevTools') || 
        message.includes('reactjs.org/link/react-devtools')) {
      return; // Suppress React DevTools message
    }
    originalLog.apply(console, args);
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
// Temporary fix: Remove StrictMode to prevent double rendering of Cloudflare Turnstile
root.render(<App />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
