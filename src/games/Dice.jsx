import { useState } from 'react'
import { useGame } from './useGame.js'
import { diceMultiplier, riggedChance, round2 } from './engine.js'
import { SBet } from './parts.jsx'

export default function Dice({ game }) {
  const { balance, bet, betInput, setBet, canAfford, settle, half, double } = useGame(game.name, 1)
  const [target, setTarget] = useState(50)
  const [dir, setDir] = useState('over') // 'over' | 'under' (ref screen shows Roll Over)
  const [result, setResult] = useState(null)
  const [won, setWon] = useState(null)
  const [rolling, setRolling] = useState(false)

  const winChance = round2(dir === 'under' ? target : 100 - target)
  const mult = diceMultiplier(Math.max(0.01, winChance))

  const play = () => {
    if (!canAfford || rolling) return
    setRolling(true)
    // House decides the outcome, then fabricates a consistent roll.
    const isWin = Math.random() < riggedChance(winChance / 100, mult)
    let r
    if (dir === 'under') r = isWin ? Math.random() * target : target + Math.random() * (100 - target)
    else r = isWin ? target + Math.random() * (100 - target) : Math.random() * target
    r = round2(Math.min(99.99, Math.max(0.01, r)))
    setResult(r)
    setWon(isWin)
    settle(isWin ? bet * mult - bet : -bet, { mult: mult.toFixed(2) })
    setTimeout(() => setRolling(false), 220)
  }

  // Track gradient: red = lose zone, green = win zone.
  const track = dir === 'under'
    ? `linear-gradient(90deg, #00e701 0% ${target}%, #ed4163 ${target}% 100%)`
    : `linear-gradient(90deg, #ed4163 0% ${target}%, #00e701 ${target}% 100%)`

  return (
    <div className="game-body">
      <div className="dice-panel">
        <div className="dice-scale"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
        <div className="dice-slider-zone">
          <input
            className="dice-range"
            style={{ background: track }}
            type="range" min="2" max="98" step="1"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
          />
          {result != null && (
            <div className={'dice-marker ' + (won ? 'win' : 'lose')} style={{ left: result + '%' }}>
              {result.toFixed(2)}
            </div>
          )}
        </div>

        <div className="dice-stats3">
          <div className="dice-stat">
            <div className="l">Multiplicateur</div>
            <div className="v">{mult.toFixed(4)}<span className="u">×</span></div>
          </div>
          <div className="dice-stat">
            <div className="l">{dir === 'under' ? 'Lancer en Dessous' : 'Lancer au Dessus'}</div>
            <div className="v">
              {target}.50
              <button onClick={() => setDir((d) => (d === 'under' ? 'over' : 'under'))}>⇄</button>
            </div>
          </div>
          <div className="dice-stat">
            <div className="l">Chance de Gagner</div>
            <div className="v">{winChance.toFixed(4)}<span className="u">%</span></div>
          </div>
        </div>
      </div>

      <button className="s-action" onClick={play} disabled={!canAfford || rolling}>Pari</button>
      <SBet value={betInput} setBet={setBet} half={half} double={double} balance={balance} />
    </div>
  )
}
