import { useEffect, useRef, useState } from 'react'
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
  const bar = useRef<HTMLElement>(null)

  // The hero sizes itself against whatever the bar leaves of the viewport, so
  // the bar publishes its own height and keeps it current through resizes.
  useEffect(() => {
    const el = bar.current
    if (!el) return
    const publish = () => {
      document.documentElement.style.setProperty('--site-header-h', `${el.offsetHeight}px`)
    }
    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const link = ({ isActive }: { isActive: boolean }) =>
    `site-nav-link inline-flex items-center whitespace-nowrap text-[15px] tracking-wide lg:text-base xl:text-[17px] ${
      isActive
        ? 'is-active'
        : 'text-ink/75 dark:text-white/75'
    }`

  return (
    <header ref={bar} className="sticky top-0 z-40 border-b-2 border-turkish bg-[#E8F1F4]/95 backdrop-blur dark:bg-[#0A1628]/95">
      <div className="container-page flex items-center justify-between gap-3 py-2.5 sm:gap-4 xl:gap-6">
        <Link to="/" className="flex shrink-0 items-center gap-2 sm:gap-3" onClick={() => setOpen(false)}>
          <EaswariMark className="h-10 w-[7rem] shrink-0 sm:h-12 sm:w-[8.5rem] xl:h-14 xl:w-[10.5rem]" plate />
          <span className="hidden h-10 w-px bg-ink/20 dark:bg-white/25 sm:block" />
          <IsteMark className="h-12 w-12 sm:h-14 sm:w-14 xl:h-16 xl:w-16" />
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

      <div className="border-t border-ink/10 bg-[#DCEBF0] px-4 py-3 text-center dark:border-white/10 dark:bg-[#0E1E36] sm:py-4">
        <h1 className="header-chapter-title font-display text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
          {/* Two stacked layers: a black outline behind, the gold gradient on top */}
          <span aria-hidden className="header-chapter-title-stroke">ISTE – Easwari Student Chapter</span>
          <span className="header-chapter-title-fill">ISTE – Easwari Student Chapter</span>
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
