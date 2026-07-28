import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './auth.jsx'

const round2 = (n) => Math.round(n * 100) / 100

export const formatEUR = (n) =>
  '€' + Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const notifKey = (uid) => `dayofcash.notifs.${uid}`
function loadNotifs(uid) {
  try { return JSON.parse(localStorage.getItem(notifKey(uid))) || null } catch { return null }
}

const DEFAULT_NOTIFS = { promotions: true, results: true, security: true }

const emptyState = {
  user: { name: '', avatar: '' },
  balance: 0,
  target: 1000,
  transactions: [],
  notifications: DEFAULT_NOTIFS,
  loading: true,
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const { user } = useAuth()
  const [state, setState] = useState(emptyState)

  const load = useCallback(async () => {
    if (!user) return
    const [{ data: prof }, { data: txs }] = await Promise.all([
      supabase.from('profiles').select('name, balance, target').eq('id', user.id).single(),
      supabase.from('transactions').select('id, type, amount, game, created_at')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    ])
    setState({
      user: {
        name: prof?.name || user.name,
        avatar: `https://i.pravatar.cc/120?u=${encodeURIComponent(user.email)}`,
      },
      balance: Number(prof?.balance ?? 0),
      target: Number(prof?.target ?? 1000),
      transactions: (txs || []).map((t) => ({
        id: 't' + t.id, type: t.type, amount: Number(t.amount), game: t.game, at: t.created_at,
      })),
      notifications: loadNotifs(user.id) || DEFAULT_NOTIFS,
      loading: false,
    })
  }, [user])

  useEffect(() => {
    let active = true
    if (user) { setState((s) => ({ ...s, loading: true })); load().catch(() => active && setState((s) => ({ ...s, loading: false }))) }
    return () => { active = false }
  }, [user, load])

  // dispatch: optimistic local update + persist to Supabase, then reconcile balance.
  const dispatch = useCallback((action) => {
    setState((prev) => optimistic(prev, action, user))
    persist(action).then((bal) => {
      if (typeof bal === 'number') setState((prev) => ({ ...prev, balance: round2(bal) }))
    }).catch(() => { /* keep optimistic; reload on next mount */ })
  }, [user])

  const value = useMemo(() => ({ state, dispatch, reload: load }), [state, dispatch, load])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// Local optimistic reducer (UI updates instantly; server is source of truth).
function optimistic(state, action, user) {
  switch (action.type) {
    case 'DEPOSIT': {
      const amt = Math.max(0, Number(action.amount) || 0)
      if (!amt) return state
      return { ...state, balance: round2(state.balance + amt), transactions: [tx('deposit', amt), ...state.transactions] }
    }
    case 'WITHDRAW': {
      const amt = Math.max(0, Number(action.amount) || 0)
      if (!amt || amt > state.balance) return state
      return { ...state, balance: round2(state.balance - amt), transactions: [tx('withdraw', amt), ...state.transactions] }
    }
    case 'BET_RESULT': {
      const delta = Number(action.delta) || 0
      return {
        ...state,
        balance: round2(Math.max(0, state.balance + delta)),
        transactions: [tx(delta >= 0 ? 'win' : 'loss', Math.abs(delta), action.game), ...state.transactions],
      }
    }
    case 'TOGGLE_NOTIFICATION': {
      const next = { ...state.notifications, [action.key]: !state.notifications[action.key] }
      if (user) { try { localStorage.setItem(notifKey(user.id), JSON.stringify(next)) } catch { /* ignore */ } }
      return { ...state, notifications: next }
    }
    default:
      return state
  }
}

async function persist(action) {
  switch (action.type) {
    case 'DEPOSIT': {
      const amt = Math.max(0, Number(action.amount) || 0)
      if (!amt) return null
      return rpcDelta(amt, 'deposit')
    }
    case 'WITHDRAW': {
      const amt = Math.max(0, Number(action.amount) || 0)
      if (!amt) return null
      return rpcDelta(-amt, 'withdraw')
    }
    case 'BET_RESULT': {
      const delta = Number(action.delta) || 0
      return rpcDelta(delta, delta >= 0 ? 'win' : 'loss', action.game)
    }
    default:
      return null
  }
}

async function rpcDelta(delta, kind, game) {
  const { data, error } = await supabase.rpc('apply_delta', { delta, kind, game_name: game ?? null })
  if (error) throw error
  return Number(data)
}

let seq = 0
function tx(type, amount, game) {
  return { id: 'opt' + (++seq), type, amount: round2(amount), game, at: new Date().toISOString() }
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
