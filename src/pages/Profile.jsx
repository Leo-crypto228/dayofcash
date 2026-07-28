import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useStore, formatEUR } from '../store/store.jsx'
import { useAuth } from '../store/auth.jsx'
import { playCash } from '../store/sound.js'
import Modal from '../components/Modal.jsx'
import {
  Bank, ArrowDownLeft, ArrowUpRight, QR,
  User, Shield, Bell, Headset, Logout, Chevron,
} from '../components/icons.jsx'

export default function Profile() {
  const { state, dispatch, reload } = useStore()
  const { user, logout, isAdmin, listAccounts, adminCredit } = useAuth()
  const [modal, setModal] = useState(null) // 'deposit' | 'withdraw' | 'qr' | settings key
  const [amount, setAmount] = useState('')

  const remaining = Math.max(0, state.target - state.balance)
  const progress = Math.min(100, (state.balance / state.target) * 100)
  const canWithdraw = remaining <= 0

  const close = () => { setModal(null); setAmount('') }

  // Real scannable QR with the pseudo drawn in the middle.
  // Error-correction level H (30% redundancy) keeps it readable despite the
  // centre label covering part of the code.
  const [qrUrl, setQrUrl] = useState(null)
  const pseudo = state.user.name || user?.name || ''
  useEffect(() => {
    if (modal !== 'qr') return
    let cancelled = false
    const payload = `https://dayofcash.pages.dev/?to=${encodeURIComponent(user?.email || '')}`
    const canvas = document.createElement('canvas')
    QRCode.toCanvas(canvas, payload, {
      width: 560, margin: 1, errorCorrectionLevel: 'H',
      color: { dark: '#0b1220', light: '#ffffff' },
    })
      .then(() => {
        if (cancelled) return
        const ctx = canvas.getContext('2d')
        const W = canvas.width
        const label = '@' + pseudo
        ctx.font = `700 ${Math.round(W * 0.062)}px -apple-system, "Segoe UI", Roboto, sans-serif`
        const textW = ctx.measureText(label).width
        const boxW = Math.min(W * 0.56, textW + W * 0.075)
        const boxH = W * 0.13
        const x = (W - boxW) / 2
        const y = (W - boxH) / 2
        const r = boxH * 0.28
        // white plate with a dark outline
        ctx.beginPath()
        ctx.moveTo(x + r, y)
        ctx.arcTo(x + boxW, y, x + boxW, y + boxH, r)
        ctx.arcTo(x + boxW, y + boxH, x, y + boxH, r)
        ctx.arcTo(x, y + boxH, x, y, r)
        ctx.arcTo(x, y, x + boxW, y, r)
        ctx.closePath()
        ctx.fillStyle = '#ffffff'
        ctx.fill()
        ctx.lineWidth = W * 0.012
        ctx.strokeStyle = '#0b1220'
        ctx.stroke()
        ctx.fillStyle = '#0b1220'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(label, W / 2, y + boxH / 2, boxW - W * 0.05)
        setQrUrl(canvas.toDataURL('image/png'))
      })
      .catch(() => setQrUrl(null))
    return () => { cancelled = true }
  }, [modal, user, pseudo])

  const submitDeposit = () => {
    if (Number(amount) > 0) playCash()
    dispatch({ type: 'DEPOSIT', amount })
    close()
  }
  const submitWithdraw = () => {
    dispatch({ type: 'WITHDRAW', amount })
    close()
  }

  // Admin: credit fictional money to any account (server-side RPC).
  const [adminTarget, setAdminTarget] = useState('')
  const [adminAmount, setAdminAmount] = useState('')
  const [accounts, setAccounts] = useState([])
  const [adminBusy, setAdminBusy] = useState(false)

  useEffect(() => {
    if (isAdmin && modal === 'admin') listAccounts().then(setAccounts)
  }, [isAdmin, modal, listAccounts])

  const submitAdminCredit = async () => {
    const amt = Number(adminAmount)
    const target = adminTarget || accounts[0]?.id
    if (!target || !amt || amt <= 0 || adminBusy) return
    setAdminBusy(true)
    const res = await adminCredit(target, amt)
    setAdminBusy(false)
    if (res?.ok) {
      playCash()
      setAdminAmount('')
      const fresh = await listAccounts()
      setAccounts(fresh)
      if (target === user.id) reload() // reflect in my own live balance
    }
  }

  const settings = [
    ...(isAdmin ? [{ key: 'admin', label: 'Espace admin', Icon: Bank }] : []),
    { key: 'account', label: 'Account details', Icon: User },
    { key: 'security', label: 'Security', Icon: Shield },
    { key: 'notifications', label: 'Notification preferences', Icon: Bell },
    { key: 'support', label: 'Support', Icon: Headset },
  ]

  return (
    <div className="page">
      {/* Cashback balance card */}
      <section className="balance-card">
        <div className="bc-top">
          <span className="bc-label">CASHBACK BALANCE</span>
          <Bank className="bc-bank" />
        </div>
        <div className="bc-amount">{formatEUR(state.balance)}</div>
        <div className="bc-progress-row">
          <span>Progress</span>
          <span>Target: {formatEUR(state.target).replace(',00', '')}</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: progress + '%' }} />
        </div>
        <div className="bc-hint">
          {canWithdraw
            ? 'Withdrawal unlocked.'
            : `${formatEUR(remaining)} more needed to unlock withdrawal.`}
        </div>
      </section>

      <p className="cashback-note">
        Cashback récupérable à partir de 5 000 € de dépenses sur les sites de voyage.
      </p>

      {/* Actions */}
      <div className="actions">
        <button className="action" onClick={() => setModal('deposit')}>
          <span className="action-circle"><ArrowDownLeft /></span>
          <span className="action-label">Deposit</span>
        </button>
        <button className="action" onClick={() => setModal('qr')}>
          <span className="action-circle dark"><QR /></span>
          <span className="action-label">QR Code</span>
        </button>
        <button
          className="action"
          onClick={() => canWithdraw && setModal('withdraw')}
          disabled={!canWithdraw}
        >
          <span className="action-circle"><ArrowUpRight /></span>
          <span className="action-label">Withdraw</span>
        </button>
      </div>

      {/* Settings */}
      <h2 className="section-title">Settings</h2>
      <div className="list-card">
        {settings.map(({ key, label, Icon }) => (
          <button key={key} className="list-row" onClick={() => setModal(key)}>
            <span className="list-icon"><Icon /></span>
            <span className="list-label">{label}</span>
            <Chevron className="list-chevron" />
          </button>
        ))}
        <button className="list-row danger" onClick={() => setModal('logout')}>
          <span className="list-icon danger"><Logout /></span>
          <span className="list-label">Logout</span>
        </button>
      </div>

      {/* --- Modals --- */}
      <Modal open={modal === 'admin'} title="Espace admin" onClose={() => { setModal(null); setAdminAmount('') }}>
        <div className="admin-panel">
          <p className="muted">Ajoute de l'argent fictif à un compte.</p>
          <div className="admin-accounts">
            {accounts.map((a) => (
              <button
                key={a.id}
                className={'admin-acc' + (adminTarget === a.id || (!adminTarget && accounts[0]?.id === a.id) ? ' sel' : '')}
                onClick={() => setAdminTarget(a.id)}
              >
                <span className="admin-acc-main">
                  <span className="admin-acc-name">{a.name}{a.role === 'admin' && <em className="admin-tag">admin</em>}</span>
                  <span className="admin-acc-email">{a.email}</span>
                </span>
                <span className="admin-acc-bal">{formatEUR(a.balance)}</span>
              </button>
            ))}
            {accounts.length === 0 && <div className="tx-empty">Aucun compte.</div>}
          </div>
          <div className="amount-input">
            <span>€</span>
            <input type="number" inputMode="decimal" placeholder="Montant" value={adminAmount} onChange={(e) => setAdminAmount(e.target.value)} />
          </div>
          <div className="quick-row">
            {[10, 50, 100, 500, 1000].map((q) => (
              <button key={q} className="chip" onClick={() => setAdminAmount(String(q))}>{formatEUR(q).replace(',00', '')}</button>
            ))}
          </div>
          <button className="cta" disabled={!Number(adminAmount) || Number(adminAmount) <= 0 || adminBusy} onClick={submitAdminCredit}>
            {adminBusy ? 'Crédit…' : 'Créditer ' + (adminTarget ? '' : (accounts[0]?.name ? '(' + accounts[0].name + ')' : ''))}
          </button>
        </div>
      </Modal>

      <Modal open={modal === 'deposit'} title="Dépôt" onClose={close}>
        <AmountForm
          value={amount}
          onChange={setAmount}
          cta="Déposer"
          onSubmit={submitDeposit}
          quick={[20, 50, 100, 250]}
        />
      </Modal>

      <Modal open={modal === 'withdraw'} title="Retrait" onClose={close}>
        <AmountForm
          value={amount}
          onChange={setAmount}
          cta="Retirer"
          onSubmit={submitWithdraw}
          max={state.balance}
          quick={[50, 100, 250, state.balance]}
        />
      </Modal>

      <Modal open={modal === 'qr'} title="QR Code" onClose={close}>
        <div className="qr-wrap">
          {qrUrl ? <img className="qr-img" src={qrUrl} alt="QR code" /> : <div className="qr-loading">Génération…</div>}
          <p className="muted">Scanne pour recevoir un paiement sur ton compte dayofcash.</p>
        </div>
      </Modal>

      <Modal open={modal === 'account'} title="Account details" onClose={close}>
        <div className="kv">
          <Row k="Nom" v={state.user.name} />
          <Row k="Email" v={user?.email || '—'} />
          <Row k="Solde" v={formatEUR(state.balance)} />
          <Row k="Membre depuis" v="2026" />
        </div>
      </Modal>

      <Modal open={modal === 'security'} title="Security" onClose={close}>
        <div className="kv">
          <Row k="Authentification 2FA" v="Activée" />
          <Row k="Dernière connexion" v="Aujourd'hui" />
          <button className="cta ghost">Changer le mot de passe</button>
        </div>
      </Modal>

      <Modal open={modal === 'notifications'} title="Notification preferences" onClose={close}>
        <div className="toggles">
          <Toggle k="promotions" label="Promotions" state={state} dispatch={dispatch} />
          <Toggle k="results" label="Résultats de jeu" state={state} dispatch={dispatch} />
          <Toggle k="security" label="Alertes de sécurité" state={state} dispatch={dispatch} />
        </div>
      </Modal>

      <Modal open={modal === 'support'} title="Support" onClose={close}>
        <p className="muted">Une question ? On te répond sous 24 h.</p>
        <button className="cta">Contacter le support</button>
      </Modal>

      <Modal open={modal === 'logout'} title="Déconnexion" onClose={close}>
        <p className="muted">Veux-tu vraiment te déconnecter ?</p>
        <button className="cta danger" onClick={() => { close(); logout() }}>Se déconnecter</button>
        <button className="cta ghost" onClick={close}>Annuler</button>
      </Modal>
    </div>
  )
}

function AmountForm({ value, onChange, cta, onSubmit, quick = [], max }) {
  const num = Number(value)
  const invalid = !num || num <= 0 || (max != null && num > max)
  return (
    <div className="amount-form">
      <div className="amount-input">
        <span>€</span>
        <input
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
      </div>
      <div className="quick-row">
        {quick.map((q) => (
          <button key={q} className="chip" onClick={() => onChange(String(q))}>
            {formatEUR(q).replace(',00', '')}
          </button>
        ))}
      </div>
      <button className="cta" disabled={invalid} onClick={onSubmit}>{cta}</button>
    </div>
  )
}

function Toggle({ k, label, state, dispatch }) {
  const on = state.notifications[k]
  return (
    <button
      className="toggle-row"
      onClick={() => dispatch({ type: 'TOGGLE_NOTIFICATION', key: k })}
    >
      <span>{label}</span>
      <span className={'switch' + (on ? ' on' : '')}><span className="knob" /></span>
    </button>
  )
}

function Row({ k, v }) {
  return (
    <div className="kv-row">
      <span className="kv-k">{k}</span>
      <span className="kv-v">{v}</span>
    </div>
  )
}

