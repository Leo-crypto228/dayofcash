import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthCtx = createContext(null)

function translate(msg = '') {
  if (/already registered|already been registered|already exists/i.test(msg)) return 'Un compte existe déjà avec cet email.'
  if (/Invalid login credentials/i.test(msg)) return 'Email ou mot de passe incorrect.'
  if (/Password should be at least/i.test(msg)) return 'Mot de passe trop court (6 caractères min).'
  if (/Email not confirmed/i.test(msg)) return 'Email non confirmé.'
  return msg || 'Une erreur est survenue.'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const hydrate = useCallback(async (session) => {
    if (!session?.user) { setUser(null); return }
    const u = session.user
    let role = 'user'
    let name = u.user_metadata?.name || u.email?.split('@')[0]
    try {
      const { data: prof } = await supabase.from('profiles').select('name, is_admin').eq('id', u.id).single()
      if (prof) { role = prof.is_admin ? 'admin' : 'user'; name = prof.name || name }
    } catch { /* profile may lag right after signup */ }
    setUser({ id: u.id, email: u.email, name, role })
  }, [])

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      await hydrate(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => { hydrate(session) })
    return () => { active = false; sub.subscription.unsubscribe() }
  }, [hydrate])

  const signup = useCallback(async (email, password, name) => {
    const e = (email || '').trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return { error: 'Adresse email invalide.' }
    if ((password || '').length < 6) return { error: 'Mot de passe : 6 caractères minimum.' }
    const { data, error } = await supabase.auth.signUp({
      email: e, password, options: { data: { name: (name || '').trim() || e.split('@')[0] } },
    })
    if (error) return { error: translate(error.message) }
    if (!data.session) {
      const { error: e2 } = await supabase.auth.signInWithPassword({ email: e, password })
      if (e2) return { error: 'Compte créé — connecte-toi.' }
    }
    return { ok: true }
  }, [])

  const login = useCallback(async (email, password) => {
    const e = (email || '').trim().toLowerCase()
    const { error } = await supabase.auth.signInWithPassword({ email: e, password })
    if (error) return { error: translate(error.message) }
    return { ok: true }
  }, [])

  const logout = useCallback(async () => { await supabase.auth.signOut() }, [])

  // Admin helpers
  const listAccounts = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles').select('id, email, name, balance, is_admin')
      .order('created_at', { ascending: true })
    if (error) return []
    return data.map((p) => ({
      id: p.id, email: p.email, name: p.name,
      role: p.is_admin ? 'admin' : 'user', balance: Number(p.balance),
    }))
  }, [])

  const adminCredit = useCallback(async (targetId, amount) => {
    const { data, error } = await supabase.rpc('admin_credit', { p_target: targetId, p_amt: Number(amount) })
    if (error) return { error: translate(error.message) }
    return { ok: true, balance: Number(data) }
  }, [])

  const value = useMemo(
    () => ({ user, loading, signup, login, logout, listAccounts, adminCredit, isAdmin: user?.role === 'admin' }),
    [user, loading, signup, login, logout, listAccounts, adminCredit]
  )
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth within AuthProvider')
  return ctx
}
