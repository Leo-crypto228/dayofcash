import { useRef } from 'react'
import { Menu } from './icons.jsx'
import Logo from './Logo.jsx'
import { useStore } from '../store/store.jsx'

export default function TopBar({ onMenu }) {
  const { state, dispatch } = useStore()
  const fileRef = useRef(null)

  const pick = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const url = URL.createObjectURL(f)
    const img = new Image()
    img.onload = () => {
      // Square-crop + downscale to keep the stored data small.
      const s = 160
      const c = document.createElement('canvas')
      c.width = c.height = s
      const ctx = c.getContext('2d')
      const m = Math.min(img.width, img.height)
      ctx.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s)
      dispatch({ type: 'SET_AVATAR', dataUrl: c.toDataURL('image/jpeg', 0.85) })
      URL.revokeObjectURL(url)
    }
    img.src = url
    e.target.value = ''
  }

  return (
    <header className="topbar">
      <button className="icon-btn" aria-label="Menu" onClick={onMenu}>
        <Menu />
      </button>
      <div className="brand"><Logo size={22} /><span>Janero</span></div>
      <img
        className="avatar"
        src={state.user.avatar}
        alt={state.user.name}
        onClick={() => fileRef.current?.click()}
        style={{ cursor: 'pointer' }}
      />
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
    </header>
  )
}
