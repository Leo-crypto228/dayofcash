export default function GameTile({ game, onPlay }) {
  return (
    <button className="game-tile" onClick={() => onPlay(game)}>
      <img className="game-img" src={game.img} alt={game.name} />
    </button>
  )
}
