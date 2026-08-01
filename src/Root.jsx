import App from './App.jsx'
import Login from './pages/Login.jsx'
import Logo from './components/Logo.jsx'
import { useAuth } from './store/auth.jsx'
import { StoreProvider } from './store/store.jsx'
import { ToastProvider } from './store/toast.jsx'

export default function Root() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="phone">
        <div className="splash">
          <div className="splash-logo"><Logo size={44} light /><span>Janero</span></div>
          <div className="spinner" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="phone">
        <Login />
      </div>
    )
  }

  return (
    <StoreProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </StoreProvider>
  )
}
