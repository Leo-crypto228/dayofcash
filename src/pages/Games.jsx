import { GAMES } from '../data/games.js'
import GameTile from '../components/GameTile.jsx'
import { DiceSolid } from '../components/icons.jsx'
import { useStore, formatEUR } from '../store/store.jsx'

export default function Games({ onPlay }) {
  const { state } = useStore()
  const open = (g) => onPlay(g.id)

  return (
    <div className="page">
      <section className="balance-card compact">
        <div className="bc-left">
          <span className="bc-chip"><DiceSolid /></span>
          <div>
            <div className="bc-label">SOLDE ACTIF</div>
            <div className="bc-amount sm">{formatEUR(state.balance)}</div>
          </div>
        </div>
        <button className="pill-btn" onClick={() => open(GAMES[0])}>JOUER</button>
      </section>

      <h2 className="section-title">Premium Games</h2>

      <div className="game-grid">
        {GAMES.map((g) => (
          <GameTile key={g.id} game={g} onPlay={open} />
        ))}
      </div>
    </div>
  )
}
