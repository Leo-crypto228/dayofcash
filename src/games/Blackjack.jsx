import { useEffect, useRef, useState } from 'react'
import { useGame } from './useGame.js'
import { freshDeck, handValue, isRed, dealerDraw } from './engine.js'
import { SBet, fmt } from './parts.jsx'

const lowTotal = (cards) => cards.reduce((t, c) => t + (c.rank === 'A' ? 1 : ['K', 'Q', 'J'].includes(c.rank) ? 10 : Number(c.rank)), 0)
const display = (cards) => {
  if (!cards.length) return ''
  const v = handValue(cards), low = lowTotal(cards)
  return v !== low && v <= 21 ? `${low}, ${v}` : `${v}`
}
const tenVal = (c) => (['K', 'Q', 'J', '10'].includes(c.rank) ? 10 : c.rank)
const canSplit = (h) => h.cards.length === 2 && tenVal(h.cards[0]) === tenVal(h.cards[1])

export default function Blackjack({ game }) {
  const { balance, bet, betInput, setBet, canAfford, settle, half, double } = useGame(game.name, 1)
  const [dealer, setDealer] = useState([])
  const [hands, setHands] = useState([])
  const [active, setActive] = useState(0)
  const [phase, setPhase] = useState('idle') // idle | dealing | player | dealer | done
  const [msg, setMsg] = useState(null)
  const deckRef = useRef([])
  const timeouts = useRef([])

  useEffect(() => () => timeouts.current.forEach(clearTimeout), [])
  const later = (fn, ms) => { const id = setTimeout(fn, ms); timeouts.current.push(id) }

  // --- deal: cards appear one by one -----------------------------
  const deal = () => {
    if (!canAfford) return
    const d = freshDeck()
    deckRef.current = d
    setDealer([]); setHands([]); setMsg(null); setActive(0); setPhase('dealing')
    const p1 = d.pop(), d1 = d.pop(), p2 = d.pop(), d2 = d.pop()
    later(() => setHands([{ cards: [p1], stake: bet, done: false }]), 200)
    later(() => setDealer([d1]), 550)
    later(() => setHands([{ cards: [p1, p2], stake: bet, done: false }]), 900)
    later(() => {
      setDealer([d1, d2])
      const pv = handValue([p1, p2]), dv = handValue([d1, d2])
      if (pv === 21 || dv === 21) {
        revealAndResolve([{ cards: [p1, p2], stake: bet, done: true }], [d1, d2])
      } else setPhase('player')
    }, 1250)
  }

  // --- player actions --------------------------------------------
  const hit = () => {
    const d = deckRef.current
    const card = d.pop()
    const h = hands.map((hand, i) => (i === active ? { ...hand, cards: [...hand.cards, card] } : hand))
    setHands(h)
    if (handValue(h[active].cards) > 21) { h[active] = { ...h[active], done: true }; setHands([...h]); advance(h) }
  }
  const stand = () => {
    const h = hands.map((hand, i) => (i === active ? { ...hand, done: true } : hand))
    setHands(h); advance(h)
  }
  const doubleDown = () => {
    const d = deckRef.current
    const card = d.pop()
    const h = hands.map((hand, i) => (i === active ? { ...hand, cards: [...hand.cards, card], stake: hand.stake * 2, done: true } : hand))
    setHands(h); advance(h)
  }
  const split = () => {
    const d = deckRef.current
    const cur = hands[active]
    const h1 = { cards: [cur.cards[0], d.pop()], stake: cur.stake, done: false }
    const h2 = { cards: [cur.cards[1], d.pop()], stake: cur.stake, done: false }
    setHands([...hands.slice(0, active), h1, h2, ...hands.slice(active + 1)])
  }

  const advance = (h) => {
    const next = h.findIndex((hand) => !hand.done)
    if (next !== -1) { setActive(next); return }
    revealAndResolve(h, dealer)
  }

  // --- dealer plays visibly, one card at a time -------------------
  const revealAndResolve = (h, dl) => {
    setPhase('dealer')
    const anyAlive = h.some((hand) => handValue(hand.cards) <= 21)
    const dealerCards = [...dl]
    const stepDraw = () => {
      if (anyAlive && handValue(dealerCards) < 17) {
        const card = dealerDraw(deckRef.current, dealerCards)
        dealerCards.push(card)
        setDealer([...dealerCards])
        later(stepDraw, 600)
      } else {
        resolve(h, dealerCards)
      }
    }
    later(stepDraw, 500)
  }

  const resolve = (h, dealerCards) => {
    const dv = handValue(dealerCards)
    let net = 0
    for (const hand of h) {
      const pv = handValue(hand.cards)
      const natural = h.length === 1 && hand.cards.length === 2 && pv === 21
      if (pv > 21) net -= hand.stake
      else if (natural && dv !== 21) net += hand.stake * 1.5
      else if (dv > 21 || pv > dv) net += hand.stake
      else if (pv < dv) net -= hand.stake
    }
    if (net !== 0) settle(net, net > 0 ? { mult: (1 + net / h.reduce((s, x) => s + x.stake, 0)).toFixed(2) } : {})
    setMsg(net > 0 ? '+' + fmt(net) : net < 0 ? '−' + fmt(Math.abs(net)) : 'Égalité')
    setPhase('done')
    setHands(h.map((x) => ({ ...x, done: true })))
  }

  const hideHole = phase === 'player' || phase === 'dealing'
  const cur = hands[active]
  const inRound = phase === 'player'

  return (
    <div className="game-body">
      <div className="bj-felt">
        <div className="bj-deckpile" />
        <div className="bj-side">
          {dealer.length > 0 && (
            <span className="bj-badge">{hideHole ? display([dealer[0]]) : display(dealer)}</span>
          )}
          <div className="bj-cards">
            {dealer.map((c, i) => (
              <div key={i} className="pc" style={{ zIndex: i }}>
                {hideHole && i === 1 ? <div className="pcard back" /> : <Card c={c} />}
              </div>
            ))}
          </div>
        </div>

        <div className="bj-pays">BLACKJACK PAYS 3 TO 2<br /><span>INSURANCE PAYS 2 TO 1</span></div>

        <div className="bj-side">
          {hands.map((h, hi) => (
            <div key={hi} className="bj-hand-block" style={{ opacity: inRound && hi !== active ? 0.55 : 1 }}>
              <span className={'bj-badge' + (handValue(h.cards) > 21 ? ' soft' : '')}>{display(h.cards)}</span>
              <div className="bj-cards">
                {h.cards.map((c, i) => <div key={i} className="pc" style={{ zIndex: i }}><Card c={c} /></div>)}
              </div>
            </div>
          ))}
          {msg && <span className={'bj-badge result' + (msg.startsWith('−') ? ' soft' : '')}>{msg}</span>}
        </div>
      </div>

      {inRound ? (
        <div className="bj-actions2">
          <button onClick={hit}>Tirer <em>🂠</em></button>
          <button onClick={stand}>Rester <em>✋</em></button>
          <button onClick={split} disabled={!cur || !canSplit(cur) || hands.length > 3}>Diviser <em>♠</em></button>
          <button onClick={doubleDown} disabled={!cur || cur.cards.length !== 2}>Doubler <em>×2</em></button>
        </div>
      ) : (
        <>
          <button className="s-action" onClick={deal} disabled={!canAfford || phase === 'dealing' || phase === 'dealer'}>Pari</button>
          <SBet value={betInput} setBet={setBet} half={half} double={double} balance={balance} />
        </>
      )}
    </div>
  )
}

function Card({ c }) {
  return (
    <div className={'pcard deal-in ' + (isRed(c) ? 'red' : 'black')}>
      <span className="r">{c.rank}</span>
      <span className="s">{c.suit}</span>
    </div>
  )
}
