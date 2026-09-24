import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { IsteMark } from '../components/Logo'
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'

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

  const [choice, setChoice] = useState<Choice>('member')
  const [form, setForm] = useState({ email: '', password: '' })
  const [newPassword, setNewPassword] = useState('')
  const [stage, setStage] = useState<'signin' | 'setPassword'>('signin')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
      <div
        onClick={() => navigate('/')}
        className="relative isolate flex min-h-screen cursor-pointer items-center justify-center overflow-hidden bg-[#0A1220] px-4 py-10 text-white sm:px-6 md:px-8"
      >
        <img
          src="/iste-logo.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 w-[min(760px,125vw)] max-w-none -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.06]"
        />
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-md cursor-default rounded-2xl border border-white/10 bg-[#111C2E] p-6 shadow-2xl shadow-black/20 sm:p-8"
        >
          <IsteMark shine className="h-12 w-12" />
          <h1 className="mt-6 font-display text-2xl font-semibold text-white">Set your password</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/60">
          Welcome. Choose a password you'll use from now on — the temporary one stops working.
          </p>
          <div className="mt-6">
            <label className="mb-2 block text-sm text-white/70" htmlFor="np">New password</label>
            <input id="np" type="password" className="w-full rounded-full border border-white/15 bg-[#0A1220] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-turkish" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && newPassword.length >= 6 && handleSetPassword()} />
            <p className="mt-2 text-xs text-white/45">At least six characters.</p>
          </div>
          {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
          <button className="mt-6 w-full rounded-full bg-white px-5 py-3 font-semibold text-[#0A1220] transition hover:bg-turkish-light disabled:cursor-not-allowed disabled:opacity-50" disabled={busy || newPassword.length < 6} onClick={handleSetPassword}>
            {busy ? 'Setting…' : 'Set password and continue'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => navigate('/')}
      className="relative isolate flex min-h-screen cursor-pointer items-center justify-center overflow-hidden bg-[#0A1220] px-4 py-10 text-white sm:px-6 md:px-8"
    >
      <img
        src="/iste-logo.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 w-[min(760px,125vw)] max-w-none -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.06]"
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-md cursor-default rounded-2xl border border-white/10 bg-[#111C2E] p-6 shadow-2xl shadow-black/20 sm:p-8"
      >
        <div className="mb-7">
          <h1 className="text-2xl font-bold tracking-tight text-white">Sign in</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/55">Welcome back to the ISTE Easwari Student Chapter portal.</p>
        </div>

        {!isSupabaseConfigured && (
          <p className="mb-5 rounded-xl border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            Supabase isn't connected. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to <code>.env</code>,
            then restart the dev server.
          </p>
        )}

        <div>
          <label className="sr-only" htmlFor="email">Email</label>
          <div className="relative">
            <Mail aria-hidden size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input id="email" type="email" placeholder="Email address" autoComplete="email"
              className="w-full rounded-full border border-white/15 bg-[#0A1220] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-turkish"
              value={form.email} onChange={set('email')} />
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between px-1">
            <label className="sr-only" htmlFor="pw">Password</label>
            <span className="text-xs text-white/45">Password</span>
            <button type="button" onClick={() => setError('Password resets are handled by the chapter secretary.')} className="text-xs text-turkish-light transition hover:text-white">Forgot password?</button>
          </div>
          <div className="relative">
            <LockKeyhole aria-hidden size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input id="pw" type={showPassword ? 'text' : 'password'} placeholder="Password" autoComplete="current-password"
              className="w-full rounded-full border border-white/15 bg-[#0A1220] py-3 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-turkish"
              value={form.password} onChange={set('password')}
              onKeyDown={(e) => e.key === 'Enter' && choice && handleSignIn()} />
            <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white/45 transition hover:text-white">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {choice === 'member' && <p className="mt-2 px-1 text-xs text-white/45">First time? Use the temporary password from the chapter secretary.</p>}
        </div>

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        <button className="mt-6 w-full rounded-full bg-white px-5 py-3 font-semibold text-[#0A1220] transition duration-300 hover:bg-turkish-light disabled:cursor-not-allowed disabled:opacity-40" disabled={busy || !form.email.trim() || !form.password.trim()}
          onClick={handleSignIn}>
          {busy ? 'Signing in…' : 'Log in'}
        </button>

        <p className="mt-4 text-center text-xs text-white/40">Enter your details above to continue.</p>

        <div className="mt-7 border-t border-white/10 pt-5 text-center text-sm">
          <span className="text-white/45">Signing in as </span>
          <button type="button" onClick={() => { setChoice(choice === 'admin' ? 'member' : 'admin'); setError(null) }} className="font-semibold capitalize text-turkish-light transition hover:text-white">
            {choice ?? 'choose a role'}
          </button>
          <span className="text-white/45"> · </span>
          <button type="button" onClick={() => { setChoice(choice === 'admin' ? 'member' : 'admin'); setError(null) }} className="text-turkish-light transition hover:text-white">
            Switch to {choice === 'admin' ? 'Member' : 'Admin'}
          </button>
        </div>
      </div>
    </div>
  )
}
