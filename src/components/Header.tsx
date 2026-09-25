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

  // Prevent background scrolling while the mobile menu is open
  useEffect(() => {
    if (open) {
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prevOverflow
      }
    }
  }, [open])

  // Close menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

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
      <div className="w-full px-3.5 sm:px-6 lg:px-10 flex h-16 sm:h-24 lg:h-[108px] items-center justify-between gap-2 sm:gap-4">
        {/* Left: Dual Logos (Easwari then circular ISTE logo) */}
        <div className="flex shrink-0 items-center">
          <Link to="/" className="flex items-center gap-2 sm:gap-4" onClick={() => setOpen(false)} aria-label="ISTE Easwari Home">
            <EaswariMark className="h-7 sm:h-10 lg:h-11 xl:h-12 w-auto shrink-0" tone="onDark" />
            <IsteMark className="h-9 w-9 sm:h-12 sm:w-12 lg:h-[58px] lg:w-[58px] xl:h-[64px] xl:w-[64px] shrink-0" />
          </Link>
        </div>

        {/* Center: Desktop Navigation Links */}
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

        {/* Right: Actions (Dashboard + Sign Out + Theme Toggle + Mobile Menu Button) */}
        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3 lg:gap-5">
          {role === 'public' ? (
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-sm border border-white/30 bg-white/5 px-2.5 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-[15px] xl:text-[18px] font-medium text-white transition hover:bg-white/10 hover:border-white/60"
            >
              Login
            </Link>
          ) : (
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                to={role === 'admin' ? '/admin' : '/member'}
                className="inline-flex items-center justify-center rounded-sm border border-white/30 bg-white/5 px-2.5 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-[15px] xl:text-[18px] font-medium text-white transition hover:bg-white/10 hover:border-white/60"
              >
                {role === 'admin' ? 'Dashboard' : 'My chapter'}
              </Link>
              <button
                onClick={signOut}
                className="hidden text-xs sm:inline-block sm:text-[15px] xl:text-[18px] font-normal text-white/75 hover:text-white transition-colors"
              >
                Sign out
              </button>
            </div>
          )}

          <button
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-sm border border-white/30 bg-transparent text-white/85 transition hover:border-white/60 hover:text-white"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-white/30 text-white transition hover:border-white/60 lg:hidden"
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Sub-bar: Chapter Title */}
      <div className="border-t border-ink/10 bg-[#DCEBF0] px-2 py-1.5 text-center dark:border-white/10 dark:bg-[#0E1E36] sm:px-6 sm:py-3">
        <h1 className="header-chapter-title font-display text-[15px] font-semibold tracking-wide leading-tight xs:text-lg sm:text-2xl sm:leading-tight md:text-3xl lg:text-4xl">
          {/* Two stacked layers: a black outline behind, the gold gradient on top */}
          <span aria-hidden className="header-chapter-title-stroke">ISTE – Easwari Student Chapter</span>
          <span className="header-chapter-title-fill">ISTE – Easwari Student Chapter</span>
        </h1>
      </div>

      {/* Mobile Drawer Navigation with backdrop */}
      {open && (
        <div className="fixed inset-x-0 top-[var(--site-header-h,80px)] bottom-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}>
          <nav
            className="max-h-[calc(100vh-var(--site-header-h,80px))] overflow-y-auto border-t border-ink/10 bg-[#E8F1F4] shadow-2xl dark:border-white/10 dark:bg-[#0A1628]"
            onClick={(e) => e.stopPropagation()}
            aria-label="Mobile Navigation"
          >
            <div className="container-page flex flex-col space-y-1.5 py-4">
              {nav.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  onClick={() => handleNavClick(n.to)}
                  className={({ isActive }) => {
                    const active = isLinkActive(n.to, isActive)
                    return `site-nav-link flex min-h-[44px] items-center rounded-sm px-4 py-2.5 text-base font-medium tracking-wide transition ${
                      active
                        ? 'is-active bg-turkish/15 font-semibold text-turkish-dark dark:text-turkish-light'
                        : 'text-ink/85 hover:bg-black/5 dark:text-white/85 dark:hover:bg-white/5'
                    }`
                  }}
                >
                  {n.label}
                </NavLink>
              ))}

              <div className="border-t border-ink/10 pt-3 mt-2 dark:border-white/10">
                {role === 'public' ? (
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="btn-primary flex min-h-[44px] w-full items-center justify-center py-2.5 text-base font-semibold"
                  >
                    Login
                  </Link>
                ) : (
                  <div className="flex flex-col gap-2 px-1 py-1">
                    <Link
                      to={role === 'admin' ? '/admin' : '/member'}
                      onClick={() => setOpen(false)}
                      className="flex min-h-[44px] items-center justify-center rounded-sm bg-turkish/10 py-2.5 text-base font-semibold text-turkish-dark dark:text-turkish-light"
                    >
                      {role === 'admin' ? 'Dashboard' : 'My chapter'}
                    </Link>
                    <button
                      onClick={() => { signOut(); setOpen(false) }}
                      className="flex min-h-[44px] items-center justify-center rounded-sm border border-ink/20 py-2 text-sm text-ink/70 hover:text-ink dark:border-white/20 dark:text-white/70 dark:hover:text-white"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
