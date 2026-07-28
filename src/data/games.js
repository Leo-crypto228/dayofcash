// Game catalogue. Each tile image already contains the name + badge baked in,
// so tiles render the image full-bleed with no text overlay.
// `accent` is used for in-game UI theming (buttons, highlights).
export const GAMES = [
  { id: 'mines',     name: 'Mines',     img: '/games/mines.jpeg',     accent: '#2f8bfd' },
  { id: 'dice',      name: 'Dice',      img: '/games/dice.jpeg',      accent: '#8b3ff2' },
  { id: 'plinko',    name: 'Plinko',    img: '/games/plinko.jpeg',    accent: '#a855f7' },
  { id: 'limbo',     name: 'Limbo',     img: '/games/limbo.jpeg',     accent: '#f97316' },
  { id: 'pump',      name: 'Pump',      img: '/games/pump.jpeg',      accent: '#ef4444' },
  { id: 'crash',     name: 'Crash',     img: '/games/crash.jpeg',     accent: '#2563eb' },
  { id: 'wheel',     name: 'Wheel',     img: '/games/wheel.jpeg',     accent: '#f59e0b' },
  { id: 'blackjack', name: 'Blackjack', img: '/games/blackjack.jpeg', accent: '#dc2626' },
  { id: 'hilo',      name: 'Hilo',      img: '/games/hilo.jpeg',      accent: '#16a34a' },
]

export const gameById = (id) => GAMES.find((g) => g.id === id)
