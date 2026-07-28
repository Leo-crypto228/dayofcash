import { useState } from 'react'
import { useAuth } from '../store/auth.jsx'

// Small travel-partner chips shown in the reverse-scrolling strip.
const TRAVEL = [
  { name: 'Booking.com', logo: '/luxe/booking.jpg', cb: '8%' },
  { name: 'Expedia', logo: '/luxe/expedia.jpg', cb: '10%' },
  { name: 'Four Seasons', logo: '/luxe/fourseasons.jpg', cb: '12%' },
  { name: 'Rosewood', logo: '/luxe/rosewood.jpg', cb: '10%' },
  { name: 'Air France', logo: '/luxe/aflogo.jpg', cb: '12%' },
  { name: 'Emirates', logo: '/luxe/emirateslogo.jpg', cb: '10%' },
  { name: 'NetJets', logo: '/luxe/ultra/netjets-logo.png', cb: '10%' },
  { name: 'Soneva', logo: '/luxe/ultra/soneva-logo.png', cb: '14%' },
  { name: 'Aman', logo: '/luxe/ultra/aman-logo.png', cb: '12%' },
]

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

export default function Login() {
  const { login, signup } = useAuth()
  const [mode, setMode] = useState('signup')
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
    <div className="lg">
      <div className="lg-brand">dayofcash</div>

      <div className="lg-body">
        <h1 className="lg-title">{mode === 'signup' ? 'Créer ton compte' : 'Se connecter'}</h1>

        <form className="lg-form" onSubmit={submit}>
          {mode === 'signup' && (
            <Field
              placeholder="Pseudo"
              value={name}
              onChange={setName}
              valid={name.trim().length >= 2}
              autoComplete="nickname"
            />
          )}
          <Field
            type="email"
            placeholder="Email"
            value={email}
            onChange={setEmail}
            valid={emailOk(email)}
            autoComplete="email"
          />
          <Field
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={setPassword}
            valid={password.length >= 6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />

          {error && <div className="lg-error">{error}</div>}

          <button className="lg-switch" type="button" onClick={switchMode}>
            {mode === 'signup' ? "J'ai déjà un compte" : "Créer un compte"}
          </button>

          <button className="lg-submit" type="submit" disabled={busy}>
            {busy ? '…' : mode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
          </button>
        </form>
      </div>

      {/* Travel partners scrolling past the form. */}
      <div className="lg-strip">
        <div className="lg-track rev">
          {[...TRAVEL, ...TRAVEL].map((t, i) => (
            <div className="lg-chip" key={t.name + i}>
              <img src={t.logo} alt="" />
              <span className="lg-chip-name">{t.name}</span>
              <span className="lg-chip-cb">{t.cb}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Field({ type = 'text', placeholder, value, onChange, valid, autoComplete }) {
  return (
    <label className="lg-field">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
      />
      {valid && (
        <span className="lg-check" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L20 6" />
          </svg>
        </span>
      )}
    </label>
  )
}
