import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
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
  { to: '/#feedback', label: 'Feedback' },
]

/**
 * Clean, compact header with balanced proportions, consistent nav item
 * hit targets, and a streamlined chapter title banner.
 */
export default function Header() {
  const [open, setOpen] = useState(false)
  const { role, signOut } = useAuth()
  const { theme, toggle } = useTheme()
  const location = useLocation()
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

  const handleNavClick = (to: string) => {
    setOpen(false)
    if (to === '/#feedback') {
      const el = document.getElementById('feedback')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  const isLinkActive = (to: string, isActive: boolean) => {
    if (to === '/#feedback') return location.hash === '#feedback'
    if (to === '/') return location.pathname === '/' && location.hash !== '#feedback'
    return isActive
  }

  return (
    <header ref={bar} className="sticky top-0 z-40 border-b-2 border-turkish bg-[#0A1628] text-white backdrop-blur">
      {/* Top bar: Left Logos + Center Nav + Right Action Controls */}
      <div className="w-full px-4 sm:px-8 lg:px-10 flex h-20 sm:h-24 lg:h-[108px] items-center justify-between gap-3 sm:gap-4">
        {/* Left: Dual Logos (Easwari then larger circular ISTE logo) */}
        <div className="flex shrink-0 items-center">
          <Link to="/" className="flex items-center gap-2.5 sm:gap-4" onClick={() => setOpen(false)}>
            <EaswariMark className="h-9 sm:h-10 lg:h-11 xl:h-12 w-auto shrink-0" />
            <IsteMark className="h-11 w-11 sm:h-12 sm:w-12 lg:h-[58px] lg:w-[58px] xl:h-[64px] xl:w-[64px] shrink-0" />
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden items-center justify-center gap-4 lg:flex lg:gap-5 xl:gap-7 2xl:gap-8">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              onClick={() => handleNavClick(n.to)}
              className={({ isActive }) => {
                const active = isLinkActive(n.to, isActive)
                return `site-nav-link text-[16.5px] lg:text-[18px] xl:text-[19px] 2xl:text-[20px] font-medium tracking-normal transition-colors duration-200 ${
                  active
                    ? 'text-[#C9A227] font-semibold underline decoration-[#C9A227] decoration-[1.5px] underline-offset-8'
                    : 'text-white/85 hover:text-[#C9A227]'
                }`
              }}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        {/* Right: Actions (Dashboard + Sign Out + Theme Toggle). On narrow screens the
            account buttons live in the menu drawer instead, so the bar never overflows. */}
        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-4 lg:gap-5">
          {role === 'public' ? (
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center justify-center rounded-sm border border-white/30 bg-white/5 px-4 py-2 text-[15px] sm:text-[17px] xl:text-[18px] font-medium text-white transition hover:bg-white/10 hover:border-white/60"
            >
              Login
            </Link>
          ) : (
            <div className="hidden items-center gap-3 sm:gap-4 lg:flex">
              <Link
                to={role === 'admin' ? '/admin' : '/member'}
                className="inline-flex items-center justify-center rounded-sm border border-white/30 bg-white/5 px-4 py-2 text-[15px] sm:text-[17px] xl:text-[18px] font-medium text-white transition hover:bg-white/10 hover:border-white/60"
              >
                {role === 'admin' ? 'Dashboard' : 'My chapter'}
              </Link>
              <button
                onClick={signOut}
                className="text-[15px] sm:text-[17px] xl:text-[18px] font-normal text-white/75 hover:text-white transition-colors"
              >
                Sign out
              </button>
            </div>
          )}

          <button
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-white/30 bg-transparent text-white/85 transition hover:border-white/60 hover:text-white lg:h-9 lg:w-9"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-white/20 text-white lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Sub-bar: Chapter Title */}
      <div className="border-t border-ink/10 bg-[#DCEBF0] px-4 py-2 text-center dark:border-white/10 dark:bg-[#0E1E36] sm:px-6 sm:py-3">
        <h1 className="header-chapter-title w-full font-display text-lg font-semibold tracking-wide leading-snug sm:w-auto sm:text-2xl sm:leading-tight md:text-3xl lg:text-4xl">
          {/* Two stacked layers: a black outline behind, the gold gradient on top */}
          <span aria-hidden className="header-chapter-title-stroke">ISTE – Easwari Student Chapter</span>
          <span className="header-chapter-title-fill">ISTE – Easwari Student Chapter</span>
        </h1>
      </div>

      {/* Mobile Drawer Navigation */}
      {open && (
        <nav className="border-t border-ink/10 bg-[#E8F1F4] dark:border-white/10 dark:bg-[#0A1628] lg:hidden">
          <div className="container-page flex flex-col space-y-1 py-3">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={() => handleNavClick(n.to)}
                className={({ isActive }) => {
                  const active = isLinkActive(n.to, isActive)
                  return `site-nav-link flex min-h-11 items-center rounded-sm px-3.5 py-2.5 text-base font-medium tracking-wide transition ${
                    active
                      ? 'is-active bg-turkish/10 font-semibold text-turkish-dark dark:text-turkish-light'
                      : 'text-ink/80 hover:bg-black/5 dark:text-white/80 dark:hover:bg-white/5'
                  }`
                }}
              >
                {n.label}
              </NavLink>
            ))}
            <div className="border-t border-ink/10 pt-2.5 dark:border-white/10">
              {role === 'public' ? (
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="btn-primary flex min-h-11 items-center justify-center py-2.5 text-base font-semibold"
                >
                  Login
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to={role === 'admin' ? '/admin' : '/member'}
                    onClick={() => setOpen(false)}
                    className="btn-primary flex min-h-11 items-center justify-center py-2.5 text-base font-semibold"
                  >
                    {role === 'admin' ? 'Dashboard' : 'My chapter'}
                  </Link>
                  <button
                    onClick={() => { signOut(); setOpen(false) }}
                    className="btn flex min-h-11 items-center justify-center border border-ink/25 py-2.5 text-base text-ink/80 hover:text-ink dark:border-white/30 dark:text-white/80 dark:hover:text-white"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
