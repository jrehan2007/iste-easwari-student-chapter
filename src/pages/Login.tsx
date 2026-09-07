import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { IsteMark } from '../components/Logo'

type Choice = 'admin' | 'member' | null

/**
 * One sign-in form for both roles.
 *
 * Members created by an admin sign in the first time with their temporary
 * password; the app then has them set a real one, which is what creates their
 * auth account. Nothing here grants a role — the role always comes from
 * profiles.role, and a mismatch signs the user straight back out.
 */
export default function Login() {
  const { signIn, signOut, setPasswordAndClaim } = useAuth()
  const navigate = useNavigate()

  const [choice, setChoice] = useState<Choice>(null)
  const [form, setForm] = useState({ email: '', password: '' })
  const [newPassword, setNewPassword] = useState('')
  const [stage, setStage] = useState<'signin' | 'setPassword'>('signin')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const set = (k: 'email' | 'password') => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value })

  async function handleSignIn() {
    setError(null); setBusy(true)
    try {
      if (choice === 'member') {
        // Is this a first-time claim with a temporary password?
        const { data: claimable } = await supabase.rpc('member_temp_login', {
          p_email: form.email, p_temp: form.password,
        })
        if (claimable) { setStage('setPassword'); return }
      }

      const err = await signIn(form.email, form.password)
      if (err) { setError(err); return }

      // The role is read from the database, never from the button.
      const { data: session } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('profiles')
        .select('role').eq('id', session.user!.id).maybeSingle()

      if (choice === 'admin' && profile?.role !== 'admin') {
        await signOut()
        setError("This account doesn't have admin access.")
        return
      }
      navigate(profile?.role === 'admin' ? '/admin' : '/member')
    } catch (e) {
      setError((e as Error).message)
    } finally { setBusy(false) }
  }

  async function handleSetPassword() {
    setError(null); setBusy(true)
    try {
      const err = await setPasswordAndClaim(form.email, newPassword)
      if (err) { setError(err); return }
      navigate('/member')
    } finally { setBusy(false) }
  }

  if (stage === 'setPassword') {
    return (
      <div className="container-page grid max-w-md gap-5 py-16">
        <IsteMark shine className="h-16 w-16" />
        <h1 className="section-title">Set your password</h1>
        <p className="muted">
          Welcome. Choose a password you'll use from now on — the temporary one stops working.
        </p>
        <div className="rule" />
        <div>
          <label className="label" htmlFor="np">New password</label>
          <input id="np" type="password" className="field" value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && newPassword.length >= 6 && handleSetPassword()} />
          <p className="muted mt-1 text-xs">At least six characters.</p>
        </div>
        {error && <p className="text-sm text-red-700 dark:text-red-300">{error}</p>}
        <button className="btn-primary" disabled={busy || newPassword.length < 6} onClick={handleSetPassword}>
          {busy ? 'Setting…' : 'Set password and continue'}
        </button>
      </div>
    )
  }

  return (
    <div className="container-page grid max-w-md gap-5 py-16">
      <h1 className="section-title">Sign in</h1>
      <div className="rule" />

      {!isSupabaseConfigured && (
        <p className="rounded-sm border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          Supabase isn't connected. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to <code>.env</code>,
          then restart the dev server.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {(['admin', 'member'] as const).map((r) => (
          <button key={r} onClick={() => { setChoice(r); setError(null) }}
            className={`rounded-sm px-4 py-2.5 capitalize transition ${
              choice === r
                ? 'bg-turkish text-white'
                : 'border border-turkish/40 text-turkish-dark hover:bg-turkish-mist dark:text-turkish-light dark:hover:bg-turkish/10'}`}>
            {r}
          </button>
        ))}
      </div>

      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" className="field" value={form.email} onChange={set('email')} />
      </div>
      <div>
        <label className="label" htmlFor="pw">Password</label>
        <input id="pw" type="password" className="field" value={form.password} onChange={set('password')}
          onKeyDown={(e) => e.key === 'Enter' && choice && handleSignIn()} />
        {choice === 'member' && (
          <p className="muted mt-1 text-xs">
            First time? Use the temporary password from the chapter secretary.
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-700 dark:text-red-300">{error}</p>}

      <button className="btn-primary disabled:opacity-50" disabled={busy || !choice || !form.email || !form.password}
        onClick={handleSignIn}>
        {busy ? 'Signing in…' : !choice ? 'Choose Admin or Member' : 'Sign in'}
      </button>

      <p className="muted text-xs">
        Admin access is restricted to authorised chapter emails. Members sign in with the details
        given by the chapter secretary.
      </p>
    </div>
  )
}
