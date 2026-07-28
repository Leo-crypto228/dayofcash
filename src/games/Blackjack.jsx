import { useEffect, useRef, useState } from 'react'
import { useGame } from './useGame.js'
import { freshDeck, handValue, isRed, dealerDraw } from './engine.js'
import { SBet, fmt } from './parts.jsx'

// --- Casino rules -----------------------------------------------------------
// 6-deck shoe, dealer stands on all 17, blackjack pays 3:2, double on first two
// cards, split pairs up to 4 hands, split aces get one card only.
const DECKS = 6
const RESHUFFLE_AT = 52 // reshuffle the shoe when it runs low

const cardVal = (c) => (c.rank === 'A' ? 11 : ['K', 'Q', 'J'].includes(c.rank) ? 10 : Number(c.rank))
const lowTotal = (cards) => cards.reduce((t, c) => t + (c.rank === 'A' ? 1 : cardVal(c)), 0)
const isSoft = (cards) => handValue(cards) !== lowTotal(cards) && handValue(cards) <= 21
const display = (cards) => {
  if (!cards.length) return ''
  const v = handValue(cards)
  return isSoft(cards) ? `${lowTotal(cards)}, ${v}` : `${v}`
}
const isBlackjack = (h) => h.cards.length === 2 && !h.fromSplit && handValue(h.cards) === 21
const pairRank = (c) => (['K', 'Q', 'J', '10'].includes(c.rank) ? '10' : c.rank)
const canSplit = (h) => h.cards.length === 2 && pairRank(h.cards[0]) === pairRank(h.cards[1])

function buildShoe() {
  const shoe = []
  for (let i = 0; i < DECKS; i++) shoe.push(...freshDeck())
  for (let i = shoe.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shoe[i], shoe[j]] = [shoe[j], shoe[i]]
  }
  return shoe
}

export default function Blackjack({ game }) {
  const { balance, bet, betInput, setBet, canAfford, settle, half, double } = useGame(game.name, 1)
  const [dealer, setDealer] = useState([])
  const [hands, setHands] = useState([])
  const [active, setActive] = useState(0)
  const [phase, setPhase] = useState('idle') // idle | dealing | player | dealer | done
  const [msg, setMsg] = useState(null)
  const shoeRef = useRef(buildShoe())
  const timeouts = useRef([])

  useEffect(() => () => timeouts.current.forEach(clearTimeout), [])
  const later = (fn, ms) => { const id = setTimeout(fn, ms); timeouts.current.push(id) }

  const drawCard = () => {
    if (shoeRef.current.length < RESHUFFLE_AT) shoeRef.current = buildShoe()
    return shoeRef.current.pop()
  }

  // --- deal: player, dealer, player, dealer(hole) ---------------------------
  const deal = () => {
    if (!canAfford || phase === 'dealing' || phase === 'dealer') return
    setDealer([]); setHands([]); setMsg(null); setActive(0); setPhase('dealing')

    const p1 = drawCard(), d1 = drawCard(), p2 = drawCard(), d2 = drawCard()
    later(() => setHands([{ cards: [p1], stake: bet, done: false }]), 180)
    later(() => setDealer([d1]), 500)
    later(() => setHands([{ cards: [p1, p2], stake: bet, done: false }]), 820)
    later(() => {
      setDealer([d1, d2])
      const player = { cards: [p1, p2], stake: bet, done: false }
      const playerBJ = handValue([p1, p2]) === 21
      const dealerBJ = handValue([d1, d2]) === 21
      // A natural on either side ends the round immediately.
      if (playerBJ || dealerBJ) later(() => resolve([{ ...player, done: true }], [d1, d2]), 450)
      else setPhase('player')
    }, 1150)
  }

  // --- player actions --------------------------------------------------------
  const hit = () => {
    if (phase !== 'player') return
    const card = drawCard()
    const h = hands.map((hand, i) => (i === active ? { ...hand, cards: [...hand.cards, card] } : hand))
    if (handValue(h[active].cards) >= 21) h[active] = { ...h[active], done: true }
    setHands(h)
    if (h[active].done) later(() => advance(h), 350)
  }

  const stand = () => {
    if (phase !== 'player') return
    const h = hands.map((hand, i) => (i === active ? { ...hand, done: true } : hand))
    setHands(h); advance(h)
  }

  const doubleDown = () => {
    if (phase !== 'player') return
    const cur = hands[active]
    if (!cur || cur.cards.length !== 2 || cur.stake * 2 > balance) return
    const card = drawCard()
    const h = hands.map((hand, i) =>
      i === active ? { ...hand, cards: [...hand.cards, card], stake: hand.stake * 2, done: true } : hand)
    setHands(h); later(() => advance(h), 400)
  }

  const split = () => {
    if (phase !== 'player') return
    const cur = hands[active]
    if (!cur || !canSplit(cur) || hands.length >= 4 || cur.stake * (hands.length + 1) > balance) return
    const aces = cur.cards[0].rank === 'A'
    // Split aces receive exactly one card each and stand.
    const h1 = { cards: [cur.cards[0], drawCard()], stake: cur.stake, done: aces, fromSplit: true, aces }
    const h2 = { cards: [cur.cards[1], drawCard()], stake: cur.stake, done: aces, fromSplit: true, aces }
    const h = [...hands.slice(0, active), h1, h2, ...hands.slice(active + 1)]
    setHands(h)
    if (aces) later(() => advance(h), 500)
  }

  const advance = (h) => {
    const next = h.findIndex((hand) => !hand.done)
    if (next !== -1) { setActive(next); return }
    revealAndPlayDealer(h)
  }

  // --- dealer draws visibly to 17 -------------------------------------------
  const revealAndPlayDealer = (h) => {
    setPhase('dealer')
    const alive = h.some((hand) => handValue(hand.cards) <= 21)
    const dealerCards = [...dealer]
    const step = () => {
      if (alive && handValue(dealerCards) < 17) {
        dealerCards.push(dealerDraw(shoeRef.current, dealerCards))
        setDealer([...dealerCards])
        later(step, 650)
      } else later(() => resolve(h, dealerCards), 450)
    }
    later(step, 600)
  }

  const resolve = (h, dealerCards) => {
    setDealer([...dealerCards])
    const dv = handValue(dealerCards)
    const dealerBJ = dealerCards.length === 2 && dv === 21
    let net = 0
    for (const hand of h) {
      const pv = handValue(hand.cards)
      if (isBlackjack(hand)) {
        net += dealerBJ ? 0 : hand.stake * 1.5   // 3:2, push against dealer BJ
      } else if (pv > 21) net -= hand.stake      // bust
      else if (dealerBJ) net -= hand.stake
      else if (dv > 21 || pv > dv) net += hand.stake
      else if (pv < dv) net -= hand.stake        // push otherwise
    }
    const staked = h.reduce((s, x) => s + x.stake, 0)
    if (net !== 0) settle(net, net > 0 ? { mult: (1 + net / staked).toFixed(2) } : {})
    setMsg(net > 0 ? '+' + fmt(net) : net < 0 ? '−' + fmt(Math.abs(net)) : 'Égalité')
    setHands(h.map((x) => ({ ...x, done: true })))
    setPhase('done')
  }

  const inRound = phase === 'player'
  const cur = hands[active]
  const hideHole = phase === 'player' || phase === 'dealing'
  const busy = phase === 'dealing' || phase === 'dealer'

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
          <div className="bj-hands">
            {hands.map((h, hi) => (
              <div key={hi} className={'bj-hand-block' + (inRound && hands.length > 1 && hi === active ? ' active' : '')}
                   style={{ opacity: inRound && hi !== active ? 0.5 : 1 }}>
                <span className={'bj-badge' + (handValue(h.cards) > 21 ? ' soft' : '')}>{display(h.cards)}</span>
                <div className="bj-cards">
                  {h.cards.map((c, i) => <div key={i} className="pc" style={{ zIndex: i }}><Card c={c} /></div>)}
                </div>
              </div>
            ))}
          </div>
          {msg && <span className={'bj-badge result' + (msg.startsWith('−') ? ' soft' : '')}>{msg}</span>}
        </div>
      </div>

      <button className="s-action" onClick={deal} disabled={!canAfford || inRound || busy}>Pari</button>
      <SBet value={betInput} setBet={setBet} half={half} double={double} balance={balance} />

      <div className="bj-actions2">
        <button onClick={hit} disabled={!inRound}>Tirer <em>🂠</em></button>
        <button onClick={stand} disabled={!inRound}>Rester <em>✋</em></button>
        <button onClick={split} disabled={!inRound || !cur || !canSplit(cur) || hands.length >= 4}>Diviser <em>♠</em></button>
        <button onClick={doubleDown} disabled={!inRound || !cur || cur.cards.length !== 2}>Doubler <em>×2</em></button>
      </div>
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
