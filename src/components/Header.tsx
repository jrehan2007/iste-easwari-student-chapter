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
 * Clean, compact header with balanced proportions, consistent nav item
 * hit targets, and a streamlined chapter title banner.
 */
export default function Header() {
  const [open, setOpen] = useState(false)
  const { role, signOut } = useAuth()
  const { theme, toggle } = useTheme()

  const link = ({ isActive }: { isActive: boolean }) =>
    `site-nav-link inline-flex items-center whitespace-nowrap px-2.5 py-1 text-[13.5px] font-medium transition xl:px-3 xl:py-1.5 xl:text-[14.5px] ${
      isActive
        ? 'is-active'
        : 'text-ink/75 hover:text-ink dark:text-white/75 dark:hover:text-white'
    }`

  return (
    <header className="sticky top-0 z-40 border-b-2 border-turkish bg-[#E8F1F4]/95 shadow-sm backdrop-blur dark:bg-[#0A1628]/95">
      {/* Top bar: Logos + Desktop Nav + Action Controls */}
      <div className="container-page flex items-center justify-between gap-3 py-2 sm:py-2.5 xl:gap-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5 sm:gap-3" onClick={() => setOpen(false)}>
          <EaswariMark className="h-7 w-auto shrink-0 sm:h-8 xl:h-8.5" plate />
          <span className="hidden h-6 w-px bg-ink/20 dark:bg-white/25 sm:block" />
          <IsteMark className="h-8 w-8 shrink-0 sm:h-9 sm:w-9 xl:h-9.5 xl:w-9.5" />
        </Link>

        <div className="flex min-w-0 items-center justify-end gap-2 xl:gap-3">
          <nav className="hidden flex-nowrap items-center justify-end gap-1 lg:flex xl:gap-1.5">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} className={link}>{n.label}</NavLink>
            ))}
            {role === 'public' ? (
              <Link to="/login" className="btn-primary hero-interactive ml-1.5 px-3.5 py-1.5 text-xs xl:ml-2 xl:text-sm">Login</Link>
            ) : (
              <div className="ml-1.5 flex items-center gap-2 xl:ml-2">
                <Link to={role === 'admin' ? '/admin' : '/member'} className="btn-ghost px-3 py-1.5 text-xs xl:text-sm">
                  {role === 'admin' ? 'Dashboard' : 'My chapter'}
                </Link>
                <button onClick={signOut} className="px-2 py-1 text-xs text-ink/75 hover:text-ink dark:text-white/75 dark:hover:text-white xl:text-sm">Sign out</button>
              </div>
            )}
          </nav>

          <button onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-ink/25 text-ink/85 transition hover:border-turkish hover:text-ink dark:border-white/30 dark:text-white/85 dark:hover:text-white">
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <button className="flex h-8 w-8 shrink-0 items-center justify-center text-ink lg:hidden dark:text-white" aria-label="Open menu" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Sub-bar: Chapter Title */}
      <div className="border-t border-ink/10 bg-[#DCEBF0] px-4 py-1.5 text-center dark:border-white/10 dark:bg-[#0E1E36] sm:px-6 sm:py-2 md:px-8 lg:px-12">
        <h1 className="header-chapter-title font-display text-base font-semibold tracking-wide sm:text-lg lg:text-xl">
          ISTE – Easwari Student Chapter
        </h1>
      </div>

      {/* Mobile Drawer Navigation */}
      {open && (
        <nav className="border-t border-ink/10 bg-[#E8F1F4] dark:border-white/10 dark:bg-[#0A1628] lg:hidden">
          <div className="container-page flex flex-col space-y-0.5 py-2.5">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `site-nav-link flex items-center rounded-sm px-3 py-2 text-sm tracking-wide transition ${
                    isActive
                      ? 'is-active bg-turkish/10 font-semibold'
                      : 'text-ink/80 hover:bg-black/5 dark:text-white/80 dark:hover:bg-white/5'
                  }`
                }>{n.label}</NavLink>
            ))}
            <div className="border-t border-ink/10 pt-2 dark:border-white/10">
              {role === 'public' ? (
                <Link to="/login" onClick={() => setOpen(false)} className="btn-primary flex items-center justify-center py-2 text-sm">Login</Link>
              ) : (
                <div className="flex items-center justify-between px-3 py-1.5">
                  <Link to={role === 'admin' ? '/admin' : '/member'} onClick={() => setOpen(false)}
                    className="text-sm font-medium text-turkish-dark dark:text-turkish-light">
                    {role === 'admin' ? 'Dashboard' : 'My chapter'}
                  </Link>
                  <button onClick={() => { signOut(); setOpen(false) }}
                    className="text-sm text-ink/70 hover:text-ink dark:text-white/70 dark:hover:text-white">Sign out</button>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
