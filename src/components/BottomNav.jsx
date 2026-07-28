import { Compass, DiceSolid, User } from './icons.jsx'

const TABS = [
  { key: 'explore', label: 'Explore', Icon: Compass },
  { key: 'games', label: 'Jeux', Icon: DiceSolid },
  { key: 'profile', label: 'Profile', Icon: User },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottomnav">
      {TABS.map(({ key, label, Icon }) => (
        <button
          key={key}
          className={'nav-item' + (active === key ? ' active' : '')}
          onClick={() => onChange(key)}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
