import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export type Role = 'public' | 'admin' | 'member'

interface AuthState {
  userId: string | null
  email: string | null
  role: Role
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  setPasswordAndClaim: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [role, setRole] = useState<Role>('public')
  const [loading, setLoading] = useState(true)

  async function hydrate(user: { id: string; email?: string } | null) {
    if (!user) { setUserId(null); setEmail(null); setRole('public'); return }
    setUserId(user.id)
    setEmail(user.email ?? null)
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    setRole((data?.role as Role) ?? 'member')
  }

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return }
    supabase.auth.getSession().then(async ({ data }) => {
      await hydrate(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      await hydrate(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthState>(() => ({
    userId, email, role, loading,

    async signIn(mail, password) {
      if (!isSupabaseConfigured) return 'Supabase is not connected.'
      const { data, error } = await supabase.auth.signInWithPassword({ email: mail, password })
      if (error) return error.message
      await hydrate(data.user)
      return null
    },

    /**
     * First-time member claim. The member creates their own auth account here
     * with the password they choose, which is why no service-role key is ever
     * needed in the browser. The members row is then linked to that account.
     */
    async setPasswordAndClaim(mail, password) {
      if (!isSupabaseConfigured) return 'Supabase is not connected.'
      const { data, error } = await supabase.auth.signUp({ email: mail, password })
      if (error) return error.message

      let user = data.user
      if (!data.session) {
        const { data: signedIn, error: signInErr } =
          await supabase.auth.signInWithPassword({ email: mail, password })
        if (signInErr) return signInErr.message
        user = signedIn.user
      }
      if (!user) return 'Could not create the account.'

      const { error: claimErr } = await supabase.rpc('member_claim_complete', {
        p_email: mail, p_user: user.id,
      })
      if (claimErr) return claimErr.message

      await hydrate(user)
      return null
    },

    async signOut() {
      if (isSupabaseConfigured) await supabase.auth.signOut()
      setUserId(null); setEmail(null); setRole('public')
    },
  }), [userId, email, role, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
