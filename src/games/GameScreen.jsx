import { gameById } from '../data/games.js'
import { useStore, formatEUR } from '../store/store.jsx'
import Dice from './Dice.jsx'
import Limbo from './Limbo.jsx'
import Mines from './Mines.jsx'
import Crash from './Crash.jsx'
import Pump from './Pump.jsx'
import Wheel from './Wheel.jsx'
import Hilo from './Hilo.jsx'
import Blackjack from './Blackjack.jsx'
import Plinko from './Plinko.jsx'

const REGISTRY = {
  dice: Dice, limbo: Limbo, mines: Mines, crash: Crash, pump: Pump,
  wheel: Wheel, hilo: Hilo, blackjack: Blackjack, plinko: Plinko,
}

export default function GameScreen({ gameId, onBack }) {
  const { state } = useStore()
  const game = gameById(gameId)
  const Comp = REGISTRY[gameId]
  if (!game || !Comp) return null

  return (
    <div className="game-screen">
      <header className="game-header">
        <button className="back-btn" onClick={onBack} aria-label="Retour">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <span className="game-title">{game.name}</span>
        <span className="game-balance">{formatEUR(state.balance)}</span>
      </header>
      <div className="game-scroll">
        <Comp game={game} />
      </div>
    </div>
  )
}
