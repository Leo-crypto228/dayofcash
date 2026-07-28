// Shared building blocks styled like the reference screens (French labels).
import { formatEUR } from '../store/store.jsx'

export const fmt = formatEUR

export function SBet({ value, setBet, half, double, balance }) {
  return (
    <div className="sbet">
      <div className="sbet-label">
        <span>Montant du Pari</span>
        <span>{balance != null ? fmt(balance) : ''}</span>
      </div>
      <div className="sbet-row">
        <div className="sbet-input grouped">
          <input
            type="text" inputMode="decimal" placeholder="0.00"
            value={value} onChange={(e) => setBet(e.target.value)}
          />
          <span className="sbet-coin">€</span>
        </div>
        <div className="sbet-mods">
          <button type="button" onClick={half}>½</button>
          <button type="button" onClick={double}>2×</button>
        </div>
      </div>
    </div>
  )
}

export function ModeToggle({ mode = 'manual', onChange }) {
  return (
    <div className="mode-toggle">
      <button className={mode === 'manual' ? 'on' : ''} onClick={() => onChange?.('manual')}>Manuel</button>
      <button className={mode === 'auto' ? 'on' : ''} onClick={() => onChange?.('auto')}>Auto</button>
    </div>
  )
}

export function Gem({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <path d="M24 6l14 9-14 27L10 15z" fill="#12e04a" />
      <path d="M24 6l14 9-14 6-14-6z" fill="#4dff7a" />
      <path d="M24 21l14-6-14 27z" fill="#0bb23c" />
      <path d="M24 21l-14-6 14 27z" fill="#17d24a" />
      <path d="M19 12l3-3 4 3-3 2z" fill="#c9ffd6" opacity="0.9" />
    </svg>
  )
}

export function Bomb({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <circle cx="22" cy="28" r="13" fill="#e01e3c" />
      <circle cx="18" cy="24" r="4" fill="#ff6b81" opacity="0.7" />
      <rect x="26" y="12" width="4" height="8" rx="2" transform="rotate(35 28 16)" fill="#8a0f22" />
      <path d="M31 11c3-2 6 0 5 3" stroke="#ffce54" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="37" cy="10" r="2.2" fill="#ffce54" />
    </svg>
  )
}
