import { useMemo, useState } from 'react'
import { useGame } from './useGame.js'
import { SBet, fmt } from './parts.jsx'
import { scaleMult } from './engine.js'

// Segment sets per risk — real RTP ≈ 0.90 (sum/segments).
// The former easiest tier is gone: old Moyen is now Facile, old Difficile is Moyen.
const CONFIGS = {
  Facile: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1.5, 1.5, 1.5, 1.5, 1.5, 1.7, 2, 3, 4],
  Moyen:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18],
}
const COLOR = {
  0: '#2f4553', 1.2: '#00e701', 1.5: '#00e701', 1.7: '#e2e8f0',
  2: '#ffd800', 3: '#a855f7', 4: '#f97316', 18: '#f97316',
}
const segColor = (m) => COLOR[m] || '#00e701'

// Interleave so identical values are spread around the ring.
function spread(arr) {
  const len = arr.length
  const out = []
  let step = 7 % len === 0 ? 3 : 7
  for (let k = 0; k < len; k++) out.push(arr[(step * k) % len])
  return out
}

export default function Wheel({ game }) {
  const { balance, bet, betInput, setBet, canAfford, settle, half, double } = useGame(game.name, 1)
  const [risk, setRisk] = useState('Facile')
  const [angle, setAngle] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [hit, setHit] = useState(null)

  const wheel = useMemo(() => spread(CONFIGS[risk].map((m) => (m > 0 ? scaleMult(m) : 0))), [risk])
  const distinct = useMemo(() => [...new Set(CONFIGS[risk].map((m) => (m > 0 ? scaleMult(m) : 0)))].sort((a, b) => a - b), [risk])
  const SEG = 360 / wheel.length

  const play = () => {
    if (!canAfford || spinning) return
    setSpinning(true); setHit(null)
    const idx = Math.floor(Math.random() * wheel.length)
    const m = wheel[idx]
    const target = 360 * 6 - (idx * SEG + SEG / 2)
    setAngle((a) => a - (a % 360) + target)
    setTimeout(() => {
      settle(m > 0 ? bet * m - bet : -bet, m > 0 ? { mult: m.toFixed(2) } : {})
      setHit(m); setSpinning(false)
    }, 4200)
  }

  // Thin ring: colored arcs with small gaps between segments.
  const gapDeg = Math.min(2, SEG * 0.18)
  const stops = wheel.map((m, i) => {
    const a0 = i * SEG, a1 = (i + 1) * SEG
    return `${segColor(m)} ${a0 + gapDeg / 2}deg ${a1 - gapDeg / 2}deg, #223541 ${a1 - gapDeg / 2}deg ${a1 + gapDeg / 2}deg`
  }).join(',')
  const gradient = `conic-gradient(#223541 0deg ${gapDeg / 2}deg, ${stops})`

  return (
    <div className="game-body">
      <div className="wheel-stage">
        <div className="wheel-pointer" />
        <div
          className="wheel-ring"
          style={{ background: gradient, transform: `rotate(${angle}deg)`, transition: spinning ? 'transform 4s cubic-bezier(0.15,0.7,0.15,1)' : 'none' }}
        />
        <div className="wheel-hole">
          <span className="wheel-center-x" style={hit != null ? { color: segColor(hit) } : undefined}>
            {hit != null ? hit.toFixed(2) + '×' : (spinning ? '…' : '')}
          </span>
        </div>
      </div>

      <div className="wheel-result-tabs" style={{ gridTemplateColumns: `repeat(${distinct.length}, 1fr)` }}>
        {distinct.map((m) => (
          <div key={m} className={'wheel-rt' + (hit === m ? ' cur' : '')}>
            {m.toFixed(2)}×
            <span className="barfill" style={{ background: segColor(m) }} />
          </div>
        ))}
      </div>

      <button className="s-action" onClick={play} disabled={!canAfford || spinning}>Pari</button>
      <SBet value={betInput} setBet={setBet} half={half} double={double} balance={balance} />

      <div className="s-field">
        <label>Difficulté</label>
        <div className="s-box">
          <select value={risk} disabled={spinning} onChange={(e) => setRisk(e.target.value)}>
            {Object.keys(CONFIGS).map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}
