import { useState } from 'react'
import { useGame } from './useGame.js'
import { HOUSE_EDGE, round2 } from './engine.js'
import { SBet, fmt } from './parts.jsx'

const DIFF = { Facile: 0.05, Moyen: 0.11, Difficile: 0.18, Expert: 0.26 }

export default function Pump({ game }) {
  const { balance, bet, betInput, setBet, canAfford, settle, half, double } = useGame(game.name, 1)
  const [diff, setDiff] = useState('Moyen')
  const [playing, setPlaying] = useState(false)
  const [pumps, setPumps] = useState(0)
  const [popped, setPopped] = useState(false)
  const [puff, setPuff] = useState(0)

  const p = DIFF[diff]
  // Displayed ladder looks fair; the real pop chance climbs with each pump.
  const multAt = (n) => round2(HOUSE_EDGE / Math.pow(1 - p, n))
  const popChance = (n) => Math.min(0.9, p * (1 + n * 0.13))
  const mult = pumps === 0 ? 1 : multAt(pumps)
  const prevMult = pumps <= 1 ? 1 : multAt(pumps - 1)
  const nextMult = multAt(pumps + 1)

  const start = () => {
    if (!canAfford) return
    setPumps(0); setPopped(false); setPlaying(true)
  }
  const pump = () => {
    if (!playing) return
    setPuff((x) => x + 1)
    if (Math.random() < popChance(pumps)) {
      setPopped(true); setPlaying(false); settle(-bet)
    } else setPumps((n) => n + 1)
  }
  const cashout = () => {
    if (!playing || pumps === 0) return
    settle(bet * mult - bet, { mult: mult.toFixed(2) }); setPlaying(false)
  }

  const scale = Math.min(1.9, 1 + pumps * 0.11)

  return (
    <div className="game-body">
      <div className="pump-tabs">
        <div className="pump-tab">{prevMult.toFixed(2)}×</div>
        <div className="pump-tab cur">{mult.toFixed(2)}×</div>
        <div className="pump-tab next">{nextMult.toFixed(2)}×</div>
      </div>

      <div className="pump-stage">
        <div className="pump-air" data-puff={puff} />
        {!popped ? (
          <div className="balloon-wrap" style={{ transform: `scale(${scale})` }}>
            <div className="balloon2">
              <span className="balloon2-shine" />
              <span className="balloon2-x">{mult.toFixed(2)}x</span>
            </div>
            <div className="balloon2-knot" />
          </div>
        ) : (
          <div className="balloon-pop">💥</div>
        )}
        <div className="pump-machine">
          <span className="pm-dot" /><span className="pm-dot" /><span className="pm-dot on" /><span className="pm-dot" />
          <div className="pm-valve" />
        </div>
      </div>

      {playing ? (
        <>
          <button className="s-action green" onClick={cashout} disabled={pumps === 0}>
            Encaisser {fmt(bet * mult)}
          </button>
          <button className="s-action grey" onClick={pump}>Gonfler</button>
        </>
      ) : (
        <button className="s-action" onClick={start} disabled={!canAfford}>Pari</button>
      )}

      <SBet value={betInput} setBet={setBet} half={half} double={double} balance={balance} />

      <div className="mines-profit">
        <div>
          <div className="lbl">Profit total ({mult.toFixed(2)}×)</div>
          <div className="val">{fmt(Math.max(0, bet * mult - bet))}</div>
        </div>
        <span className="sbet-coin">€</span>
      </div>

      <div className="s-field">
        <label>Difficulté</label>
        <div className="s-box">
          <select value={diff} disabled={playing} onChange={(e) => setDiff(e.target.value)}>
            {Object.keys(DIFF).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}
