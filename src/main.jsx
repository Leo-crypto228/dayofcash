import React from 'react'
import ReactDOM from 'react-dom/client'
import Root from './Root.jsx'
import { AuthProvider } from './store/auth.jsx'
import './styles.css'
import './games/games.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </React.StrictMode>,
)
