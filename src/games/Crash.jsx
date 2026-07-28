import { useEffect, useRef, useState } from 'react'
import { useGame } from './useGame.js'
import { sampleCrash, round2, capPayout, scaleMult } from './engine.js'
import { SBet, fmt } from './parts.jsx'

const K = 0.10 // growth rate
const NICE = [2, 3, 5, 8, 12, 20, 30, 50, 100]
const niceMax = (m) => NICE.find((v) => v > m * 1.06) || Math.ceil(m * 1.2)

export default function Crash({ game }) {
  const { balance, bet, betInput, setBet, canAfford, settle, half, double } = useGame(game.name, 1)
  const [phase, setPhase] = useState('idle') // idle | running | crashed | cashed
  const [mult, setMult] = useState(1)
  const [cashAt, setCashAt] = useState('2.00')
  const [history, setHistory] = useState([1.72, 2.92, 1.31])
  const timer = useRef(0)
  const startTs = useRef(0)
  const crashAt = useRef(0)
  const cashedRef = useRef(false)
  const ptsRef = useRef([]) // [{t, m}]

  useEffect(() => () => clearInterval(timer.current), [])

  const finish = (finalMult) => {
    clearInterval(timer.current)
    setMult(finalMult)
    if (!cashedRef.current) { settle(-bet); setPhase('crashed') } else setPhase('cashed')
    setHistory((h) => [round2(finalMult), ...h].slice(0, 4))
  }

  const tick = () => {
    const s = (performance.now() - startTs.current) / 1000
    const m = round2(Math.exp(K * s))
    ptsRef.current.push({ t: s, m })
    const target = Number(cashAt)
    if (!cashedRef.current && target >= 1.01 && m >= target) {
      cashedRef.current = true
      settle(bet * scaleMult(target) - bet, { mult: scaleMult(target).toFixed(2) })
    }
    if (m >= crashAt.current) { finish(crashAt.current); return }
    setMult(m)
  }

  const start = () => {
    if (!canAfford || phase === 'running') return
    crashAt.current = sampleCrash(balance)
    cashedRef.current = false
    startTs.current = performance.now()
    ptsRef.current = [{ t: 0, m: 1 }]
    setMult(1); setPhase('running')
    clearInterval(timer.current)
    timer.current = setInterval(tick, 60)
  }
  const cashout = () => {
    if (phase !== 'running' || cashedRef.current) return
    cashedRef.current = true
    settle(bet * scaleMult(mult) - bet, { mult: scaleMult(mult).toFixed(2) })
  }

  // Live curve: x = time (window grows), y = multiplier vs stepped max.
  const pts = ptsRef.current
  const tMax = Math.max(4, pts.length ? pts[pts.length - 1].t : 4)
  const yMax = niceMax(mult)
  const path = pts.length > 1
    ? pts.map((p, i) => {
        const x = 4 + (p.t / tMax) * 90
        const y = 94 - ((p.m - 1) / (yMax - 1)) * 86
        return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + Math.max(4, y).toFixed(1)
      }).join(' ')
    : ''
  const area = path ? path + ` L${(4 + 90).toFixed(1)} 94 L4 94 Z` : ''
  const numClass = phase === 'crashed' ? 'dead' : cashedRef.current && phase !== 'idle' ? 'up' : 'live'

  return (
    <div className="game-body">
      <div className="crash-top">
        {history.map((h, i) => (
          <span key={i} className={'crash-pill' + (h >= 2 ? ' good' : '')}>{h.toFixed(2)}×</span>
        ))}
      </div>

      <div className="crash-graph">
        {phase !== 'idle' && (
          <svg className="crash-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d={area} fill="rgba(240,151,0,0.28)" />
            <path d={path} fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
        <div className={'crash-num ' + numClass}>{mult.toFixed(2)}×</div>
        {phase === 'crashed' && <div className="crash-sub dead">Crashé</div>}
        {phase === 'cashed' && <div className="crash-sub up">Encaissé</div>}
        <div className="crash-yscale">{yMax}×</div>
      </div>

      {phase === 'running' && !cashedRef.current ? (
        <button className="s-action green" onClick={cashout}>Encaisser {fmt(capPayout(bet, scaleMult(mult), balance))}</button>
      ) : (
        <button className="s-action" onClick={start} disabled={!canAfford || phase === 'running'}>Pari</button>
      )}

      <SBet value={betInput} setBet={setBet} half={half} double={double} balance={balance} />

      <div className="s-field">
        <label>Retirer à</label>
        <div className="s-box">
          <input type="text" inputMode="decimal" value={cashAt} onChange={(e) => setCashAt(e.target.value.replace(',', '.'))} />
          <span className="unit">×</span>
        </div>
      </div>
    </div>
  )
}
