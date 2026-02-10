// src/main.jsx
import React from 'react' // Reactをインポート
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // 追加
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* アプリ全体をこれで囲む */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
