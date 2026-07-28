import { Menu } from './icons.jsx'
import { useStore } from '../store/store.jsx'

export default function TopBar({ onMenu }) {
  const { state } = useStore()
  return (
    <header className="topbar">
      <button className="icon-btn" aria-label="Menu" onClick={onMenu}>
        <Menu />
      </button>
      <div className="brand">dayofcash</div>
      <img className="avatar" src={state.user.avatar} alt={state.user.name} />
    </header>
  )
}
