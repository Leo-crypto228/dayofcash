import { useState } from 'react'
import { useGame } from './useGame.js'
import { HOUSE_EDGE, riggedChance, round2 } from './engine.js'
import { SBet, fmt } from './parts.jsx'

export default function Limbo({ game }) {
  const { balance, bet, betInput, setBet, canAfford, settle, half, double } = useGame(game.name, 1)
  const [target, setTarget] = useState('2.00')
  const [result, setResult] = useState(null)
  const [won, setWon] = useState(null)
  const [rolling, setRolling] = useState(false)

  const t = Math.max(1.01, Number(target) || 1.01)
  const winChance = (HOUSE_EDGE / t) * 100

  const play = () => {
    if (!canAfford || rolling) return
    setRolling(true)
    // House decides, then fabricates a consistent multiplier.
    const isWin = Math.random() < riggedChance(HOUSE_EDGE / t, t)
    let r
    if (isWin) r = round2(t * (1 - Math.log(1 - Math.random()) * 0.35))
    else r = round2(1 + (t - 1) * Math.pow(Math.random(), 1.6))
    if (isWin && r < t) r = round2(t)
    if (!isWin && r >= t) r = round2(Math.max(1, t - 0.01))
    setResult(r)
    setWon(isWin)
    settle(isWin ? bet * t - bet : -bet, { mult: t.toFixed(2) })
    setTimeout(() => setRolling(false), 260)
  }

  return (
    <div className="game-body">
      <div className="limbo-hero">
        <span className={'limbo-x ' + (won == null ? '' : won ? 'win' : 'lose')}>
          {(result == null ? 1 : result).toFixed(2)}×
        </span>
      </div>

      <div className="s-grid2">
        <div className="s-field">
          <label>Multiplicateur Cible</label>
          <div className="s-box">
            <input type="text" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value.replace(',', '.'))} />
            <span className="unit">×</span>
          </div>
        </div>
        <div className="s-field">
          <label>Chance de Gagner</label>
          <div className="s-box">
            <span style={{ color: 'var(--s-text)', fontWeight: 600 }}>{winChance.toFixed(4)}</span>
            <span className="unit">%</span>
          </div>
        </div>
      </div>

      <button className="s-action" onClick={play} disabled={!canAfford || rolling}>Pari</button>
      <SBet value={betInput} setBet={setBet} half={half} double={double} balance={balance} />

      <div className="s-field">
        <label>Profit sur une Victoire</label>
        <div className="s-box">
          <span style={{ color: 'var(--s-text)', fontWeight: 600 }}>{fmt(Math.max(0, bet * t - bet))}</span>
          <span className="sbet-coin">€</span>
        </div>
      </div>

    </div>
  )
}
