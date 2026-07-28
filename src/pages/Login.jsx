import { useState } from 'react'
import { useAuth } from '../store/auth.jsx'

export default function Login() {
  const { login, signup } = useAuth()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(null); setBusy(true)
    const res = mode === 'login'
      ? await login(email, password)
      : await signup(email, password, name)
    setBusy(false)
    if (res?.error) setError(res.error)
  }

  const switchMode = () => { setMode((m) => (m === 'login' ? 'signup' : 'login')); setError(null) }

  return (
    <div className="auth2">
      <div className="auth2-top">
        <div className="auth2-logo">dayofcash</div>
        <p className="auth2-tag">{mode === 'login' ? 'Content de te revoir.' : 'Crée ton compte en 10 secondes.'}</p>
      </div>

      <form className="auth2-form" onSubmit={submit}>
        {mode === 'signup' && (
          <input
            className="auth2-input"
            placeholder="Pseudo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="nickname"
          />
        )}
        <input
          className="auth2-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          className="auth2-input"
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />

        {error && <div className="auth2-error">{error}</div>}

        <button className="auth2-submit" type="submit" disabled={busy}>
          {busy ? '…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
        </button>
      </form>

      <button className="auth2-switch" type="button" onClick={switchMode}>
        {mode === 'login' ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
      </button>

      <p className="auth2-legal">Argent fictif · aucun argent réel</p>
    </div>
  )
}
