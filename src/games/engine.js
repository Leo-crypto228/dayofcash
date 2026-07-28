// --- Shared game math -------------------------------------------------------
// Fake money only. Displayed odds look like a fair 99%-RTP casino, but the
// actual outcomes are house-tilted: small wins stay frequent (dopamine),
// big multipliers are heavily crushed, so balances stagnate then bleed.

export const HOUSE_EDGE = 0.99 // what the UI *displays* (fair-looking)

// Hard ceiling on the net profit of any single resolved bet, no exception.
export const MAX_WIN = 50
export const capProfit = (profit) => Math.min(profit, MAX_WIN)
// Total amount actually paid back for a bet at `mult` (stake + capped profit).
export const capPayout = (bet, mult) => bet + capProfit(bet * mult - bet)

// House configuration — the real odds applied when resolving bets.
export const RIG = {
  rtp: 0.90,        // effective payout target (vs 0.99 displayed)
  bigMult: 5,       // payouts >= this are considered "big"
  bigCut: 0.55,     // big-win probability multiplier (crush the tail)
  hugeMult: 20,
  hugeCut: 0.35,    // huge wins almost never land
  microBoost: 1.04, // wins paying <= 1.5x land slightly more often (still < fair)
}

// Effective win probability for a payout of `mult`, given the fair chance.
export function riggedChance(fairChance, mult) {
  let p = fairChance * (RIG.rtp / HOUSE_EDGE)
  if (mult >= RIG.hugeMult) p *= RIG.hugeCut
  else if (mult >= RIG.bigMult) p *= RIG.bigCut
  else if (mult <= 1.5) p *= RIG.microBoost
  return Math.max(0, Math.min(0.98, p))
}

export const rnd = () => Math.random()
export const roll100 = () => Math.random() * 100

// Dice: displayed multiplier for a win chance (fair-looking).
export const diceMultiplier = (winChancePct) =>
  round2((HOUSE_EDGE * 100) / winChancePct)

// Limbo / Crash: crash-point sampler, house-tilted.
export function sampleCrash() {
  const r = Math.random()
  if (r < 0.07) return 1.0 // instant-bust band
  let m = 0.95 / (1 - r)
  if (m > RIG.bigMult && Math.random() < 0.35) m = 1 + Math.random() * 0.8
  if (m > 50 && Math.random() < 0.5) m = 2 + Math.random() * 3
  return Math.max(1.0, Math.floor(m * 100) / 100)
}

// Mines: fair-looking multiplier ladder (display only).
export function minesMultiplier(mines, revealed) {
  const total = 25
  let m = 1
  for (let i = 0; i < revealed; i++) m *= (total - i) / (total - mines - i)
  return round2(m * HOUSE_EDGE)
}

// Mines: real per-click bomb probability. Gets nastier as the multiplier grows.
export function minesBombChance(minesLeft, tilesLeft, currentMult) {
  const base = minesLeft / tilesLeft
  let f
  if (currentMult < 1.3) f = 0.85        // early clicks feel lucky
  else if (currentMult < 2) f = 1.2
  else if (currentMult < 4) f = 1.45
  else f = 1.75                          // deep runs die
  return Math.min(0.95, base * f)
}

export const round2 = (n) => Math.round(n * 100) / 100
export const round1 = (n) => Math.round(n * 10) / 10

// Plinko: displayed multiplier table (fair-looking 99% under binomial).
// The real edge comes from the center-pull applied to the ball path.
function choose(n, k) {
  let r = 1
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1)
  return r
}
export function plinkoPayouts(rows, risk) {
  const SH = { Low: { b: 2.2, eps: 0.4 }, Medium: { b: 3.5, eps: 0.15 }, High: { b: 6, eps: 0.03 } }
  const { b, eps } = SH[risk] || SH.Low
  const w = [], shape = []
  const half = rows / 2
  for (let k = 0; k <= rows; k++) {
    w[k] = choose(rows, k) / Math.pow(2, rows)
    shape[k] = eps + Math.pow(Math.abs(k - half) / half, b)
  }
  const denom = w.reduce((s, wk, k) => s + wk * shape[k], 0)
  return shape.map((s) => Math.max(0.1, round1((s * HOUSE_EDGE) / denom)))
}
// Center pull strength: the ball is magnetically drawn back to the middle.
export const PLINKO_PULL = 0.14

// --- Cards ------------------------------------------------------------------
export const SUITS = ['♠', '♥', '♦', '♣']
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

export function freshDeck() {
  const deck = []
  for (const s of SUITS) for (let i = 0; i < RANKS.length; i++) deck.push({ suit: s, rank: RANKS[i], v: i + 1 })
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

export const isRed = (c) => c.suit === '♥' || c.suit === '♦'

export function handValue(cards) {
  let total = 0
  let aces = 0
  for (const c of cards) {
    if (c.rank === 'A') { total += 11; aces++ }
    else if (['K', 'Q', 'J'].includes(c.rank)) total += 10
    else total += Number(c.rank)
  }
  while (total > 21 && aces > 0) { total -= 10; aces-- }
  return total
}

// Blackjack: house-tilted dealer draw — peeks at the next two cards and,
// 35% of the time, takes whichever helps the dealer more.
export function dealerDraw(deck, dealerCards) {
  if (deck.length < 2 || Math.random() >= 0.35) return deck.pop()
  const a = deck[deck.length - 1]
  const b = deck[deck.length - 2]
  const score = (card) => {
    const v = handValue([...dealerCards, card])
    if (v > 21) return -1
    return v // closer to 21 is better
  }
  const pick = score(a) >= score(b) ? a : b
  // remove picked card, keep the other on top
  deck.splice(deck.indexOf(pick), 1)
  return pick
}

// Hilo: adversarial next card — 30% of the time the deck "chooses" a loser.
export function hiloDraw(deck, cur, dir) {
  if (deck.length === 0) return null
  if (Math.random() < 0.30) {
    const losers = deck.filter((c) => (dir === 'higher' ? c.v < cur : c.v > cur))
    if (losers.length) {
      const pick = losers[Math.floor(Math.random() * losers.length)]
      deck.splice(deck.indexOf(pick), 1)
      return pick
    }
  }
  return deck.pop()
}
