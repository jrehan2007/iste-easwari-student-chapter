import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, Moon, Sun } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { EaswariMark, IsteMark } from './Logo'

const nav = [
  { to: '/', label: 'Home' },
  { to: '/professional', label: 'Office Bearers' },
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
    `site-nav-link inline-flex items-center whitespace-nowrap text-[15px] tracking-wide ${
      isActive
        ? 'is-active'
        : 'text-ink/75 dark:text-white/75'
    }`

  return (
    <header className="sticky top-0 z-40 border-b-2 border-turkish bg-[#E8F1F4]/95 backdrop-blur dark:bg-[#0A1628]/95">
      <div className="container-page flex items-center justify-between gap-4 py-3 xl:gap-6">
        <Link to="/" className="flex shrink-0 items-center gap-3" onClick={() => setOpen(false)}>
          <EaswariMark className="h-8 w-[6.25rem] shrink-0 sm:h-9 sm:w-[7.5rem] xl:h-10 xl:w-[9rem]" plate />
          <span className="hidden h-8 w-px bg-ink/20 dark:bg-white/25 sm:block" />
          <IsteMark className="h-10 w-10 sm:h-11 sm:w-11 xl:h-12 xl:w-12" />
        </Link>

        <div className="flex min-w-0 items-center justify-end gap-3">
          <nav className="hidden flex-nowrap items-center justify-end gap-2 lg:flex xl:gap-3">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} className={link}>{n.label}</NavLink>
            ))}
            {role === 'public' ? (
              <Link to="/login" className="btn-primary hero-interactive py-2 text-sm">Login</Link>
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

      <div className="border-t border-ink/10 bg-[#DCEBF0] py-3 text-center dark:border-white/10 dark:bg-[#0E1E36] sm:py-4">
        <h1 className="header-chapter-title font-display text-xl font-semibold leading-tight sm:text-2xl lg:text-3xl">
          ISTE – Easwari Student Chapter
        </h1>
      </div>

      {open && (
        <nav className="border-t border-ink/10 bg-[#E8F1F4] dark:border-white/10 dark:bg-[#0A1628] lg:hidden">
          <div className="container-page flex flex-col py-2">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} onClick={() => setOpen(false)}
                className={({ isActive }) => `${link({ isActive })} border-b border-ink/10 py-3 text-ink/85 dark:border-white/10 dark:text-white/85`}>{n.label}</NavLink>
            ))}
            {role === 'public' ? (
              <Link to="/login" onClick={() => setOpen(false)} className="hero-interactive py-3 text-turkish-light">Login</Link>
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
