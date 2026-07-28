import { formatEUR } from '../store/store.jsx'

// Reusable bet input row: amount field + ½ / 2× / Max, then the action button.
export default function BetPanel({
  bet, setBet, half, double, max,
  onAction, actionLabel, disabled, accent, secondary,
}) {
  return (
    <div className="bet-panel">
      <label className="bet-field">
        <span className="bet-field-label">Mise</span>
        <div className="bet-input">
          <span>€</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            value={bet}
            onChange={(e) => setBet(e.target.value)}
          />
          <div className="bet-mods">
            <button onClick={half}>½</button>
            <button onClick={double}>2×</button>
            <button onClick={max}>Max</button>
          </div>
        </div>
      </label>

      {secondary}

      <button
        className="bet-action"
        style={accent ? { background: accent } : undefined}
        disabled={disabled}
        onClick={onAction}
      >
        {actionLabel}
      </button>
    </div>
  )
}

export { formatEUR }
