import { useState } from 'react'
import { useGame } from './useGame.js'
import { minesMultiplier, minesBombChance, capPayout, capProfit } from './engine.js'
import { SBet, ModeToggle, Gem, Bomb, fmt } from './parts.jsx'

const TOTAL = 25

export default function Mines({ game }) {
  const { balance, bet, betInput, setBet, canAfford, settle, half, double } = useGame(game.name, 1)
  const [mineCount, setMineCount] = useState(3)
  const [revealed, setRevealed] = useState([])
  const [bombCell, setBombCell] = useState(null)
  const [bombLayout, setBombLayout] = useState([])
  const [playing, setPlaying] = useState(false)
  const [dead, setDead] = useState(false)

  const safeRevealed = revealed.length
  const mult = playing || dead ? minesMultiplier(mineCount, safeRevealed) : 1
  const profit = bet * mult - bet

  const start = () => {
    if (!canAfford) return
    setRevealed([]); setBombCell(null); setBombLayout([]); setDead(false); setPlaying(true)
  }

  const clickTile = (i) => {
    if (!playing || dead || revealed.includes(i)) return
    const tilesLeft = TOTAL - revealed.length
    const p = minesBombChance(mineCount, tilesLeft, mult)
    if (Math.random() < p) {
      // Reveal: clicked cell is a bomb; scatter the rest for display.
      const pool = Array.from({ length: TOTAL }, (_, k) => k).filter((k) => k !== i && !revealed.includes(k))
      const others = []
      while (others.length < mineCount - 1 && pool.length) {
        others.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
      }
      setBombCell(i); setBombLayout([i, ...others])
      setDead(true); setPlaying(false)
      settle(-bet)
    } else {
      const nr = [...revealed, i]
      setRevealed(nr)
      if (nr.length === TOTAL - mineCount) {
        const m = minesMultiplier(mineCount, nr.length)
        settle(bet * m - bet, { mult: m.toFixed(2) }); setPlaying(false)
      }
    }
  }

  const cashout = () => {
    if (!playing || safeRevealed === 0) return
    settle(bet * mult - bet, { mult: mult.toFixed(2) }); setPlaying(false)
  }

  return (
    <div className="game-body">
      <div className="mines-grid">
        {Array.from({ length: TOTAL }, (_, i) => {
          const isGem = revealed.includes(i)
          const isBomb = dead && bombLayout.includes(i)
          return (
            <button
              key={i}
              className={'mine-cell' + (isGem || isBomb ? ' revealed' : '') + (isBomb && i === bombCell ? ' hit' : '')}
              onClick={() => clickTile(i)}
              disabled={!playing}
            >
              {isGem ? <Gem /> : isBomb ? <Bomb /> : null}
            </button>
          )
        })}
      </div>

      {playing && safeRevealed > 0 ? (
        <button className="s-action green" onClick={cashout}>Encaisser {fmt(capPayout(bet, mult))}</button>
      ) : (
        <button className="s-action" onClick={start} disabled={!canAfford || playing}>Pari</button>
      )}

      <SBet value={betInput} setBet={setBet} half={half} double={double} balance={balance} />

      <div className="s-grid2">
        <div className="s-field">
          <label>Mines</label>
          <div className="s-box">
            <select value={mineCount} disabled={playing} onChange={(e) => setMineCount(Number(e.target.value))}>
              {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div className="s-field">
          <label>Gemmes</label>
          <div className="s-box"><span style={{ color: 'var(--s-text)', fontWeight: 600 }}>{TOTAL - mineCount}</span></div>
        </div>
      </div>

      <div className="mines-profit">
        <div>
          <div className="lbl">Profit total ({mult.toFixed(2)}×)</div>
          <div className="val">{fmt(Math.max(0, capProfit(profit)))}</div>
        </div>
        <span className="sbet-coin">€</span>
      </div>

    </div>
  )
}
