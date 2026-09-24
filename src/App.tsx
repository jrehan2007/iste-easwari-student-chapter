import { Route, Routes, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Professional from './pages/Professional'
import Events from './pages/Events'
import EventRegister from './pages/EventRegister'
import Gallery from './pages/Gallery'
import PinBoard from './pages/PinBoard'
import Membership from './pages/Membership'
import Feedback from './pages/Feedback'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import MemberArea from './pages/member/MemberArea'
import Protected from './components/Protected'
import VerifyMember from './pages/VerifyMember'
import IntroGate, { shouldPlayIntro } from './components/IntroGate'

export default function App() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '')
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        return
      } else {
        const timer = setTimeout(() => {
          const delayedEl = document.getElementById(id)
          if (delayedEl) delayedEl.scrollIntoView({ behavior: 'smooth' })
        }, 150)
        return () => clearTimeout(timer)
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  // The entry film plays on a bare screen: while it runs, neither the header,
  // the ticker nor any page is mounted, so nothing can show through it.
  const [introPlaying, setIntroPlaying] = useState(() => pathname === '/' && shouldPlayIntro())

  // Matched precisely: '/membership' is a public page and must keep its chrome.
  const bare = pathname === '/member' || pathname.startsWith('/member/') || pathname === '/login' || pathname.startsWith('/verify')
  const watermarkRoutes = ['/professional', '/events', '/gallery', '/pin-board', '/membership', '/feedback']
  const showWatermark = watermarkRoutes.includes(pathname)

  if (introPlaying) return <IntroGate onDone={() => setIntroPlaying(false)} />

  return (
    <div className="flex min-h-screen w-full flex-col">
      {!bare && <Header />}
      <main className={`flex-1 w-full ${showWatermark ? 'relative page-watermark isolate' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/professional" element={<Professional />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id/register" element={<EventRegister />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/pin-board" element={<PinBoard />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify/:memberCode" element={<VerifyMember />} />
          <Route path="/verify" element={<VerifyMember />} />
          <Route path="/admin/*" element={<Protected role="admin"><AdminDashboard /></Protected>} />
          <Route path="/member/*" element={<Protected role="member"><MemberArea /></Protected>} />
          <Route path="*" element={
            <div className="container-page py-28">
              <h1 className="section-title">That page isn’t here</h1>
              <p className="mt-3 text-ink/70">Check the address, or head back to the home page.</p>
            </div>
          } />
        </Routes>
      </main>
      {!bare && <Footer />}
    </div>
  )
}
