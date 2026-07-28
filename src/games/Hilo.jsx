import { useRef, useState } from 'react'
import { useGame } from './useGame.js'
import { freshDeck, HOUSE_EDGE, isRed, round2, hiloDraw, capPayout, capProfit } from './engine.js'
import { SBet, fmt } from './parts.jsx'

export default function Hilo({ game }) {
  const { balance, bet, betInput, setBet, canAfford, settle, half, double } = useGame(game.name, 1)
  const deckRef = useRef([])
  const [card, setCard] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [mult, setMult] = useState(1)
  const [history, setHistory] = useState([])

  const deck = deckRef.current
  const remaining = deck.length || 1
  const cur = card?.v ?? 7
  const higherCount = deck.filter((c) => c.v >= cur).length
  const lowerCount = deck.filter((c) => c.v <= cur).length
  const pHigher = higherCount / remaining
  const pLower = lowerCount / remaining
  const stepHigher = pHigher > 0 ? round2(HOUSE_EDGE / pHigher) : 0
  const stepLower = pLower > 0 ? round2(HOUSE_EDGE / pLower) : 0

  const start = () => {
    if (!canAfford) return
    const d = freshDeck()
    const first = d.pop()
    deckRef.current = d
    setCard(first); setMult(1)
    setHistory([{ card: first, tag: 'Carte de départ', start: true }])
    setPlaying(true)
  }

  const guess = (dir) => {
    if (!playing || !card) return
    const next = hiloDraw(deckRef.current, cur, dir)
    if (!next) return
    const ok = dir === 'higher' ? next.v >= cur : next.v <= cur
    const step = dir === 'higher' ? stepHigher : stepLower
    setCard(next)
    if (ok) {
      const nm = round2(mult * step)
      setMult(nm)
      setHistory((h) => [...h, { card: next, tag: nm.toFixed(2) + '×' }])
      if (deckRef.current.length === 0) {
        settle(bet * nm - bet, { mult: nm.toFixed(2) }); setPlaying(false)
      }
    } else {
      setHistory((h) => [...h, { card: next, tag: 'Perdu', bust: true }])
      settle(-bet); setPlaying(false)
    }
  }

  const cashout = () => {
    if (!playing || mult <= 1) { setPlaying(false); return }
    settle(bet * mult - bet, { mult: mult.toFixed(2) }); setPlaying(false)
  }

  return (
    <div className="game-body">
      <div className="hilo-wrap">
        <div className="hilo-main">
          <div className="hilo-deck">
            <div className="pcard d1" /><div className="pcard d2" />
            {card ? (
              <div className={'pcard top ' + (isRed(card) ? 'red' : 'black')}>
                <span className="r">{card.rank}</span><span className="s">{card.suit}</span>
              </div>
            ) : (
              <div className="pcard top back" />
            )}
          </div>

          <div className="hilo-choices">
            <button className="hilo-hex hi" onClick={() => guess('higher')} disabled={!playing}>
              <span className="hex-title">Supérieure<br />ou Égale</span>
              <span className="hex-pct">{(pHigher * 100).toFixed(2)}%</span>
            </button>
            <button className="hilo-hex lo" onClick={() => guess('lower')} disabled={!playing}>
              <span className="hex-title">Inférieure ou<br />Équivalent</span>
              <span className="hex-pct">{(pLower * 100).toFixed(2)}%</span>
            </button>
          </div>
        </div>

        <div className="s-grid2">
          <div className="s-field">
            <label>Profit Supérieur ({stepHigher.toFixed(2)}×)</label>
            <div className="s-box"><span style={{ fontWeight: 600 }}>{fmt(Math.max(0, capProfit(bet * mult * stepHigher - bet)))}</span></div>
          </div>
          <div className="s-field">
            <label>Profit Inférieur ({stepLower.toFixed(2)}×)</label>
            <div className="s-box"><span style={{ fontWeight: 600 }}>{fmt(Math.max(0, capProfit(bet * mult * stepLower - bet)))}</span></div>
          </div>
        </div>

        <div className="hilo-history">
          {history.map((h, i) => (
            <div key={i} className="hilo-hcard">
              <div className={'mini ' + (isRed(h.card) ? 'red' : 'black')}>{h.card.rank}{h.card.suit}</div>
              <span className={'tag' + (h.start || h.bust ? ' start' : '')}>{h.tag}</span>
            </div>
          ))}
        </div>
      </div>

      {playing && mult > 1 ? (
        <button className="s-action green" onClick={cashout}>Encaisser {fmt(capPayout(bet, mult))}</button>
      ) : (
        <button className="s-action" onClick={start} disabled={!canAfford || playing}>Pari</button>
      )}

      <SBet value={betInput} setBet={setBet} half={half} double={double} balance={balance} />
    </div>
  )
}
