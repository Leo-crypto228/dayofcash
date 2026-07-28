import { useMemo, useRef, useState } from 'react'
import { useGame } from './useGame.js'
import { plinkoPayouts, PLINKO_PULL } from './engine.js'
import { SBet, ModeToggle } from './parts.jsx'

const RISKS = [['Low', 'Facile'], ['Medium', 'Moyen'], ['High', 'Difficile']]

// Bin color by payout magnitude (yellow edges -> green center, like the ref).
const binColor = (m, max) => {
  const r = m / max
  if (r >= 0.5) return '#ffe000'
  if (r >= 0.12) return '#cbe22a'
  if (m >= 1) return '#8bd42b'
  return '#37b24d'
}

export default function Plinko({ game }) {
  const { balance, bet, betInput, setBet, canAfford, settle, half, double } = useGame(game.name, 1)
  const [risk, setRisk] = useState('Medium')
  const [rows, setRows] = useState(16)
  const [ball, setBall] = useState(null) // {step, net}
  const [dropping, setDropping] = useState(false)
  const [lastBin, setLastBin] = useState(null)
  const timer = useRef(null)

  const payouts = useMemo(() => plinkoPayouts(rows, risk), [rows, risk])
  const maxPay = Math.max(...payouts)

  // Geometry shared by pegs and ball so the ball always sits inside the pyramid.
  const sx = 100 / (rows + 2)          // horizontal peg spacing (viewBox units)
  const yTop = 6
  const yBot = 92
  const dy = (yBot - yTop) / rows

  const drop = () => {
    if (!canAfford || dropping) return
    setDropping(true); setLastBin(null)
    let step = 0, net = 0
    setBall({ step: 0, net: 0 })
    timer.current = setInterval(() => {
      // Center pull: the further from center, the more it drifts back.
      const pRight = net > 0 ? 0.5 - PLINKO_PULL : net < 0 ? 0.5 + PLINKO_PULL : 0.5
      net += Math.random() < pRight ? 1 : -1
      step += 1
      setBall({ step, net })
      if (step >= rows) {
        clearInterval(timer.current)
        const bin = Math.max(0, Math.min(rows, Math.round((net + rows) / 2)))
        const m = payouts[bin]
        settle(bet * m - bet, m >= 1 ? { mult: String(m) } : {})
        setLastBin(bin)
        setTimeout(() => { setDropping(false); setBall(null) }, 500)
      }
    }, 240)
  }

  const ballX = ball ? 50 + (ball.net * sx) / 2 : 50
  const ballY = ball ? yTop + ball.step * dy : yTop

  return (
    <div className="game-body">
      <div className="plinko-wrap">
        <svg className="plinko-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          {Array.from({ length: rows }, (_, r) => {
            const n = r + 3
            const y = yTop + (r + 0.5) * dy
            return Array.from({ length: n }, (_, c) => {
              const x = 50 + (c - (n - 1) / 2) * sx
              return <circle key={r + '-' + c} cx={x} cy={y} r={0.9} fill="#ffffff" />
            })
          })}
        </svg>
        {ball && (
          <div className="plinko-ball" style={{ left: ballX + '%', top: ballY + '%' }} />
        )}
        <div className="plinko-bins">
          {payouts.map((m, i) => (
            <span key={i} className={'bin' + (lastBin === i ? ' hit' : '')} style={{ background: binColor(m, maxPay) }}>
              {m >= 10 ? Math.round(m) : m}
            </span>
          ))}
        </div>
      </div>

      <button className="s-action" onClick={drop} disabled={!canAfford || dropping}>Pari</button>
      <SBet value={betInput} setBet={setBet} half={half} double={double} balance={balance} />

      <div className="s-field">
        <label>Difficulté</label>
        <div className="s-box">
          <select value={risk} disabled={dropping} onChange={(e) => setRisk(e.target.value)}>
            {RISKS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </div>
      </div>
      <div className="s-field">
        <label>Lignes</label>
        <div className="s-box">
          <select value={rows} disabled={dropping} onChange={(e) => setRows(Number(e.target.value))}>
            {[8, 10, 12, 14, 16].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <ModeToggle mode="manual" />
    </div>
  )
}
