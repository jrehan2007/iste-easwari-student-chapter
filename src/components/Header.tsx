import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, Moon, Sun } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { EaswariMark, IsteMark } from './Logo'

const nav = [
  { to: '/', label: 'Home' },
  { to: '/professional', label: 'Professional' },
  { to: '/events', label: 'Events' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/pin-board', label: 'Pin Board' },
  { to: '/membership', label: 'Membership' },
  { to: '/feedback', label: 'Feedback' },
]

/**
 * The bar uses a pale blue-gray bookend in light mode and keeps its deep navy
 * treatment in dark mode.
 */
export default function Header() {
  const [open, setOpen] = useState(false)
  const { role, signOut } = useAuth()
  const { theme, toggle } = useTheme()

  const link = ({ isActive }: { isActive: boolean }) =>
    `text-[15px] tracking-wide transition ${
      isActive
        ? 'text-ink underline decoration-turkish decoration-2 underline-offset-8 dark:text-white'
        : 'text-ink/75 hover:text-ink dark:text-white/75 dark:hover:text-white'
    }`

  return (
    <header className="sticky top-0 z-40 border-b-2 border-turkish bg-[#E8F1F4]/95 backdrop-blur dark:bg-[#0A1628]/95">
      <div className="container-page flex items-center justify-between gap-4 py-3">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <EaswariMark className="h-8 sm:h-10" plate />
          <span className="hidden h-8 w-px bg-ink/20 dark:bg-white/25 sm:block" />
          <IsteMark className="h-10 w-10 sm:h-12 sm:w-12" />
          <span className="font-display hidden text-lg font-semibold leading-tight text-ink dark:text-white md:block">
            ISTE – Easwari Student Chapter
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <nav className="hidden items-center gap-5 lg:flex">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} className={link}>{n.label}</NavLink>
            ))}
            {role === 'public' ? (
              <Link to="/login" className="btn-primary py-2 text-sm">Sign in</Link>
            ) : (
              <>
                <Link to={role === 'admin' ? '/admin' : '/member'} className="btn-ghost py-2 text-sm">
                  {role === 'admin' ? 'Dashboard' : 'My chapter'}
                </Link>
                <button onClick={signOut} className="text-sm text-ink/75 hover:text-ink dark:text-white/75 dark:hover:text-white">Sign out</button>
              </>
            )}
          </nav>

          <button onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="rounded-sm border border-ink/25 p-2 text-ink/85 hover:border-turkish hover:text-ink dark:border-white/30 dark:text-white/85 dark:hover:text-white">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button className="text-ink lg:hidden dark:text-white" aria-label="Open menu" onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <div className="border-t border-ink/10 bg-[#DCEBF0] dark:border-white/10 dark:bg-[#0E1E36]">
        <div className="container-page py-1.5 text-[13px] tracking-[0.12em] text-turkish-dark dark:text-turkish-light">
          INDIAN SOCIETY FOR TECHNICAL EDUCATION
        </div>
      </div>

      {open && (
        <nav className="border-t border-ink/10 bg-[#E8F1F4] dark:border-white/10 dark:bg-[#0A1628] lg:hidden">
          <div className="container-page flex flex-col py-2">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} onClick={() => setOpen(false)}
                className="border-b border-ink/10 py-3 text-ink/85 dark:border-white/10 dark:text-white/85">{n.label}</NavLink>
            ))}
            {role === 'public' ? (
              <Link to="/login" onClick={() => setOpen(false)} className="py-3 text-turkish-light">Sign in</Link>
            ) : (
              <>
                <Link to={role === 'admin' ? '/admin' : '/member'} onClick={() => setOpen(false)}
                  className="border-b border-ink/10 py-3 text-turkish-dark dark:border-white/10 dark:text-turkish-light">
                  {role === 'admin' ? 'Dashboard' : 'My chapter'}
                </Link>
                <button onClick={() => { signOut(); setOpen(false) }}
                  className="py-3 text-left text-ink/70 dark:text-white/70">Sign out</button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
