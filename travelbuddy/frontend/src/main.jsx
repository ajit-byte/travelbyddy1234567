// src/main.jsx          ← this is usually the only place you put BrowserRouter
import './i18n'           // ← must be first so translations are ready before render
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { PostCreationProvider } from './context/PostCreationContext.jsx'
import { WebSettingsProvider } from './context/WebSettingsContext.jsx'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <WebSettingsProvider>
            <PostCreationProvider>
              <App />
            </PostCreationProvider>
          </WebSettingsProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
)