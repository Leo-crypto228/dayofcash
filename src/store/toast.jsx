import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const push = useCallback((toast) => {
    const id = ++idRef.current
    setToasts((t) => [...t.filter((x) => x.kind !== 'result'), { id, ...toast }])
    const ttl = toast.ttl ?? 2600
    setTimeout(() => remove(id), ttl)
    return id
  }, [remove])

  return (
    <ToastCtx.Provider value={{ toasts, push, remove }}>
      {children}
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast within ToastProvider')
  return ctx
}

// Host — render inside the phone frame.
export function ToastHost() {
  const { toasts, remove } = useToast()
  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <button key={t.id} className={'toast toast-' + t.tone} onClick={() => remove(t.id)}>
          {t.tone === 'win' && <span className="toast-spark">🎉</span>}
          {t.tone === 'lose' && <span className="toast-spark">💥</span>}
          <span className="toast-main">
            <span className="toast-title">{t.title}</span>
            {t.sub && <span className="toast-sub">{t.sub}</span>}
          </span>
          {t.mult != null && <span className="toast-mult">{t.mult}</span>}
        </button>
      ))}
    </div>
  )
}
