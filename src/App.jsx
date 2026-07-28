import { useState } from 'react'
import TopBar from './components/TopBar.jsx'
import BottomNav from './components/BottomNav.jsx'
import Explore from './pages/Explore.jsx'
import Games from './pages/Games.jsx'
import Profile from './pages/Profile.jsx'
import Modal from './components/Modal.jsx'
import GameScreen from './games/GameScreen.jsx'
import { ToastHost } from './store/toast.jsx'

export default function App() {
  const [tab, setTab] = useState('explore')
  const [menuOpen, setMenuOpen] = useState(false)
  const [gameId, setGameId] = useState(null)

  // A game screen takes over the whole phone frame.
  if (gameId) {
    return (
      <div className="phone">
        <ToastHost />
        <GameScreen gameId={gameId} onBack={() => setGameId(null)} />
      </div>
    )
  }

  return (
    <div className="phone">
      <ToastHost />
      <TopBar onMenu={() => setMenuOpen(true)} />

      <main className="scroll-area">
        {tab === 'explore' && <Explore onOpenGames={() => setTab('games')} onPlay={setGameId} />}
        {tab === 'games' && <Games onPlay={setGameId} />}
        {tab === 'profile' && <Profile />}
      </main>

      <BottomNav active={tab} onChange={setTab} />

      <Modal open={menuOpen} title="Menu" onClose={() => setMenuOpen(false)}>
        <div className="menu-list">
          {[
            ['explore', 'Explore'],
            ['games', 'Jeux'],
            ['profile', 'Profile'],
          ].map(([key, label]) => (
            <button
              key={key}
              className="menu-item"
              onClick={() => { setTab(key); setMenuOpen(false) }}
            >
              {label}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}
