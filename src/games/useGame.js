import { useCallback, useState } from 'react'
import { useStore, formatEUR } from '../store/store.jsx'
import { useToast } from '../store/toast.jsx'
import { playWin, playLose } from '../store/sound.js'
import { round2 } from './engine.js'

// Bet amount state + settlement helper shared by every game.
// The input is kept as a raw string so the field can be fully cleared.
export function useGame(gameName, defaultBet = 1) {
  const { state, dispatch } = useStore()
  const { push } = useToast()
  const [betInput, setBetInput] = useState(String(defaultBet))

  const balance = state.balance
  const bet = round2(Math.max(0, Number(betInput) || 0))

  const setBet = useCallback((v) => {
    if (typeof v === 'number') {
      setBetInput(v > 0 ? String(round2(v)) : '')
      return
    }
    const s = String(v).replace(',', '.')
    if (s === '' || /^\d*\.?\d{0,2}$/.test(s)) setBetInput(s)
  }, [])

  const canAfford = bet > 0 && bet <= balance

  // delta = net change (win: +profit, loss: -bet). meta.mult shows on toast.
  const settle = useCallback(
    (delta, meta = {}) => {
      const d = round2(delta)
      dispatch({ type: 'BET_RESULT', delta: d, game: gameName })
      if (d > 0) {
        playWin()
        push({
          kind: 'result', tone: 'win',
          title: 'Gagné', sub: '+' + formatEUR(d),
          mult: meta.mult ? meta.mult + '×' : null,
        })
      } else if (d < 0) {
        playLose()
        push({
          kind: 'result', tone: 'lose',
          title: 'Perdu', sub: '−' + formatEUR(Math.abs(d)),
        })
      } else if (meta.push) {
        push({ kind: 'result', tone: 'neutral', title: 'Égalité', sub: 'mise rendue' })
      }
    },
    [dispatch, gameName, push]
  )

  const half = () => setBet(bet / 2)
  const double = () => setBet(Math.min((bet || 0.5) * 2, balance))

  return { balance, bet, betInput, setBet, canAfford, settle, half, double }
}
