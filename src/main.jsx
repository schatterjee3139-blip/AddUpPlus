import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { StudyMetricsProvider } from './contexts/StudyMetricsContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <StudyMetricsProvider>
        <App />
      </StudyMetricsProvider>
    </AuthProvider>
  </React.StrictMode>,
)


