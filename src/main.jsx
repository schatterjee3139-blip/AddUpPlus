import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { StudyMetricsProvider } from './contexts/StudyMetricsContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StudyMetricsProvider>
      <App />
    </StudyMetricsProvider>
  </React.StrictMode>,
)


