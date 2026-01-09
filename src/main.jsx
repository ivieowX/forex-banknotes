// src/main.jsx
import React from 'react' // <--- บรรทัดนี้สำคัญ ต้องมี!
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // (ถ้าคุณมีไฟล์ css หลัก)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)