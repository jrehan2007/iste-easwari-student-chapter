import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import QRCode from 'qrcode'
import html2canvas from 'html2canvas'
import { ArrowRight, Award, BookOpen, CalendarDays, IdCard, MapPin, Settings, Ticket, LogOut, Download, Plus, QrCode, ShieldCheck, TicketCheck, WalletCards, MoveHorizontal } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../lib/useAsync'
import * as api from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { EaswariMark, IsteMark } from '../../components/Logo'
import DashboardVideoBackground from '../../components/DashboardVideoBackground'
import LiveTicker from '../../components/LiveTicker'
import { getMemberVerificationUrl } from '../../lib/url'
import type { MemberRecord } from '../../lib/types'

type Tab = 'card' | 'events' | 'vault' | 'archive' | 'profile'

const tabs: { id: Tab; label: string; icon: typeof IdCard }[] = [
  { id: 'card',    label: 'Membership card', icon: IdCard },
  { id: 'events',  label: 'Priority events', icon: Ticket },
  { id: 'vault',   label: 'My Certificates',  icon: Award },
  { id: 'archive', label: 'Exclusive archive', icon: BookOpen },
  { id: 'profile', label: 'Profile',         icon: Settings },
]

export default function MemberArea() {
  const [tab, setTab] = useState<Tab>('card')
  const { email, userId, signOut } = useAuth()
  const { data: member, loading, reload } = useAsync(() => api.myMembership(userId!), [userId])
  const [intro, setIntro] = useState(() => !sessionStorage.getItem('iste_member_intro'))

  useEffect(() => {
    if (!intro) return
    const t = window.setTimeout(() => {
      setIntro(false)
      sessionStorage.setItem('iste_member_intro', '1')
    }, 2600)
    return () => window.clearTimeout(t)
  }, [intro])

  return (
    <div className="member-portal member-shell relative isolate min-h-screen overflow-hidden text-white">
      <DashboardVideoBackground src="/memberbg.mp4" />
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(55%_38%_at_50%_0%,rgba(201,162,39,0.16),transparent_72%)]" />
      {intro && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          animate={{ opacity: [1, 1, 0] }} transition={{ duration: 2.6, times: [0, 0.72, 1] }}
          onClick={() => setIntro(false)}>
          <div className="absolute inset-0 bg-[radial-gradient(55%_55%_at_50%_45%,#241B06_0%,#000_100%)]" />
          <motion.div className="relative text-center"
            initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}>
            <IsteMark shine className="mx-auto h-44 w-44" />
            <motion.p className="mt-6 tracking-[0.3em] text-gold-light"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.8 }}>
              MEMBERS
            </motion.p>
          </motion.div>
        </motion.div>
      )}

      <header className="relative z-10 border-b border-gold/40 bg-black/20">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 py-5">
          <Link to="/" className="flex items-center gap-3">
            <IsteMark className="h-10 w-10" />
            <div>
              <p className="font-display text-lg font-semibold tracking-wide text-gold-light">ISTE Easwari · Members</p>
              <p className="font-serif text-xs text-white/50">Indian Society for Technical Education</p>
            </div>
          </Link>
          <div className="flex items-center gap-4 font-serif text-sm">
            <span className="text-white/60">{email}</span>
            <button onClick={signOut}
              className="flex items-center gap-2 border border-gold/50 px-3 py-1.5 text-gold-light hover:bg-gold/10">
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <LiveTicker member />

      <div className="container-page relative z-10 grid gap-8 py-10 lg:grid-cols-[230px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`member-tab flex shrink-0 items-center gap-2 px-4 py-2.5 text-left transition ${
                tab === t.id ? 'bg-gold text-black' : 'text-white/70 hover:text-gold-light'}`}>
              <t.icon size={18} /> {t.label}
            </button>
          ))}
        </nav>

        <section className="font-serif">
          {loading ? <p className="text-white/60">Loading your membership…</p>
            : !member ? <NotAMember />
            : (
              <>
                {tab === 'card'    && <MemberCard member={member} email={email ?? ''} />}
                {tab === 'events'  && <PriorityEvents />}
                {tab === 'vault'   && <Vault memberId={member.id} />}
                {tab === 'archive' && <Archive />}
                {tab === 'profile' && <Profile member={member} email={email ?? ''} onSaved={reload} />}
              </>
            )}
        </section>
      </div>
    </div>
  )
}

function NotAMember() {
  return (
    <div className="member-panel p-8">
      <h1 className="dash text-2xl font-semibold text-gold-light">No active membership on this account</h1>
      <p className="mt-3 text-white/60">
        If you've paid, ask the chapter secretary to create your record. Your card and certificate
        vault appear here once it's active.
      </p>
      <Link to="/membership" className="mt-5 inline-block bg-gold px-5 py-2.5 text-black hover:bg-gold-light">
        See membership
      </Link>
    </div>
  )
}

// ---------------------------------------------------------------- ID card
function MemberCard({ member, email }: { member: MemberRecord; email: string }) {
  const qr = useRef<HTMLCanvasElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const cardInner = useRef<HTMLDivElement>(null)
  const front = useRef<HTMLDivElement>(null)
  const back = useRef<HTMLDivElement>(null)
  const qrRender = useRef<Promise<void>>(Promise.resolve())
  const [busy, setBusy] = useState(false)
  const [flipped, setFlipped] = useState(false)

  const validTill = member.valid_till ? new Date(member.valid_till).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric' }) : 'Pending'

  useEffect(() => {
    if (qr.current) {
      const verificationUrl = getMemberVerificationUrl(member.member_code)
      qrRender.current = QRCode.toCanvas(qr.current, verificationUrl, { width: 156, margin: 1,
        color: { dark: '#111111', light: '#F4E4BC' } }).then(() => undefined)
    }
  }, [member.member_code])

  async function download() {
    setBusy(true)
    const exportWidth = 1024
    const exportHeight = 646
    const verificationUrl = getMemberVerificationUrl(member.member_code)

    function text(value: string | undefined | null) {
      return (value ?? '—').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
      }[character] ?? character))
    }

    function loadImage(src: string) {
      return new Promise<HTMLImageElement | null>((resolve) => {
        const image = new Image()
        image.crossOrigin = 'anonymous'
        image.onload = () => resolve(image)
        image.onerror = () => resolve(null)
        image.src = src
      })
    }

    async function waitForExportAssets(root: HTMLElement) {
      await document.fonts.ready
      await Promise.all(Array.from(root.querySelectorAll('img')).map(async (image) => {
        if (!image.complete) {
          await Promise.race([new Promise<void>((resolve) => {
            image.addEventListener('load', () => resolve(), { once: true })
            image.addEventListener('error', () => resolve(), { once: true })
          }), new Promise<void>((resolve) => window.setTimeout(resolve, 3000))])
        }
        await Promise.race([image.decode().catch(() => undefined), new Promise<void>((resolve) => window.setTimeout(resolve, 3000))])
      }))
    }

    function exportShell(content: string) {
      const shell = document.createElement('div')
      shell.style.cssText = [
        `width:${exportWidth}px`, `height:${exportHeight}px`, 'box-sizing:border-box',
        'position:relative', 'overflow:hidden', 'isolation:isolate',
        'font-family:Cinzel, Georgia, serif', 'color:#fff',
        'background:linear-gradient(135deg,#171106 0%,#0B0803 55%,#020202 100%)',
        'border:2px solid #C9A227', 'padding:46px',
      ].join(';')
      shell.innerHTML = content
      return shell
    }

    const exportLayer = document.createElement('div')
    exportLayer.setAttribute('aria-hidden', 'true')
    exportLayer.style.cssText = 'position:fixed;left:-12000px;top:0;width:1024px;z-index:-1;pointer-events:none;'

    await qrRender.current
    if (!qr.current || qr.current.width === 0 || qr.current.height === 0) {
      setBusy(false)
      return
    }

    const [profileImage, signatureImage] = await Promise.all([
      member.photo_url ? loadImage(member.photo_url) : Promise.resolve(null),
      loadImage('/signature.png'),
    ])

    const frontExport = exportShell(`
      <div style="position:absolute;inset:28px;border:1px solid rgba(201,162,39,.2);pointer-events:none"></div>
      <div style="position:absolute;right:-100px;top:-260px;width:540px;height:540px;border:1px solid rgba(232,206,114,.24);border-radius:50%;box-shadow:0 0 0 44px rgba(201,162,39,.04),0 0 0 88px rgba(201,162,39,.025)"></div>
      <div style="position:relative;display:flex;align-items:flex-start;justify-content:space-between;gap:22px">
        <div style="display:flex;align-items:center;gap:16px;min-width:0">
          <span style="display:inline-flex;background:#fff;padding:8px 12px;border-radius:2px"><img src="/easwari-logo.webp" alt="Easwari Engineering College" style="display:block;width:176px;height:38px;object-fit:contain"></span>
          <img src="/iste-logo.png" alt="ISTE" style="display:block;width:76px;height:76px;border-radius:50%;object-fit:cover">
          <div style="min-width:0;line-height:1.25"><div style="font-size:24px;font-weight:600;letter-spacing:2px;color:#E8CE72;white-space:nowrap">ISTE STUDENT CHAPTER</div><div style="margin-top:5px;font-family:Arial,sans-serif;font-size:16px;letter-spacing:.7px;color:rgba(255,255,255,.72);white-space:nowrap">EASWARI ENGINEERING COLLEGE · RAMAPURAM</div></div>
        </div>
        <div style="color:#E8CE72;font-family:Arial,sans-serif;font-size:28px">✓</div>
      </div>
      <div style="position:relative;display:flex;gap:28px;margin-top:38px;min-width:0">
        <div style="width:152px;height:184px;flex:0 0 152px;border:2px solid rgba(201,162,39,.75);display:flex;align-items:center;justify-content:center;color:#E8CE72;font-size:38px;text-align:center;overflow:hidden">${profileImage ? `<img src="${text(member.photo_url)}" alt="${text(member.full_name)} profile" style="width:100%;height:100%;object-fit:cover">` : text(member.full_name.split(' ').map((word) => word[0]).slice(0, 2).join(''))}</div>
        <div style="min-width:0;flex:1;font-family:Arial,sans-serif">
          <div style="font-family:Cinzel,Georgia,serif;font-size:38px;line-height:1.12;font-weight:600;color:#fff;overflow-wrap:anywhere">${text(member.full_name)}</div>
          <div style="margin-top:10px;font-size:20px;line-height:1.3;color:rgba(255,255,255,.72);overflow-wrap:anywhere;word-break:break-word">${text(email)}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 28px;margin-top:24px;font-size:17px;line-height:1.25">
            <div><span style="color:rgba(255,255,255,.48)">Register no. </span>${text(member.reg_no)}</div><div><span style="color:rgba(255,255,255,.48)">Department </span>${text(member.department)}</div>
            <div><span style="color:rgba(255,255,255,.48)">Section </span>${text(member.section)}</div><div><span style="color:rgba(255,255,255,.48)">Year </span>${text(member.year)}</div>
          </div>
        </div>
      </div>
      <div style="position:absolute;left:46px;right:46px;bottom:42px;display:flex;align-items:flex-end;justify-content:space-between;border-top:1px solid rgba(201,162,39,.45);padding-top:16px;font-family:Arial,sans-serif;font-size:16px;line-height:1.35">
        <div><div style="color:rgba(255,255,255,.48)">Member ID</div><div style="color:#E8CE72">${text(member.member_code)}</div><div style="margin-top:6px;color:rgba(255,255,255,.48)">Valid till <span style="color:#fff">${text(validTill)}</span></div></div>
        <div style="text-align:right">${signatureImage ? '<img src="/signature.png" alt="Authority signature" style="display:block;width:150px;height:42px;object-fit:contain;margin-left:auto;opacity:.9">' : ''}<div style="margin-top:5px;border-top:1px solid rgba(201,162,39,.55);padding-top:5px;font-size:14px;color:rgba(255,255,255,.62)">President, ISTE Easwari</div></div>
      </div>
    `)

    const backExport = exportShell(`
      <div style="position:absolute;inset:28px;border:1px solid rgba(201,162,39,.2);pointer-events:none"></div>
      <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 8%,rgba(201,162,39,.2),transparent 46%);pointer-events:none"></div>
      <div style="position:relative;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center">
        <div><img src="/iste-logo.png" alt="ISTE" style="display:block;width:92px;height:92px;border-radius:50%;object-fit:cover;margin:0 auto"><div style="margin-top:14px;font-size:25px;line-height:1.2;letter-spacing:5px;color:#E8CE72;white-space:nowrap">ISTE STUDENT CHAPTER</div><div style="margin-top:8px;font-family:Arial,sans-serif;font-size:17px;letter-spacing:1px;color:rgba(255,255,255,.68);white-space:nowrap">EASWARI ENGINEERING COLLEGE · RAMAPURAM</div></div>
        <div><div style="display:inline-block;background:#F4E4BC;border:6px solid #C9A227;padding:14px;box-shadow:0 0 30px rgba(201,162,39,.22)"><canvas data-export-qr="true" aria-label="Membership verification QR code" style="display:block;width:220px;height:220px"></canvas></div><div style="margin-top:12px;font-family:Arial,sans-serif;font-size:15px;letter-spacing:2px;color:rgba(255,255,255,.7);white-space:nowrap">SCAN TO VERIFY MEMBERSHIP</div></div>
        <div style="width:100%;border-top:1px solid rgba(201,162,39,.45);padding-top:12px;font-family:Arial,sans-serif;font-size:15px;letter-spacing:2px;color:rgba(255,255,255,.55)">MEMBER ID <span style="color:#E8CE72">${text(member.member_code)}</span></div>
      </div>
    `)

    try {
      const qrExportCanvas = backExport.querySelector<HTMLCanvasElement>('[data-export-qr]')
      if (!qrExportCanvas) return
      qrExportCanvas.width = qr.current.width
      qrExportCanvas.height = qr.current.height
      const qrExportContext = qrExportCanvas.getContext('2d')
      if (!qrExportContext) return
      qrExportContext.drawImage(qr.current, 0, 0)
      exportLayer.append(frontExport, backExport)
      document.body.appendChild(exportLayer)
      await waitForExportAssets(exportLayer)
      const captureOptions = { backgroundColor: '#050505', scale: 3, width: exportWidth, height: exportHeight, windowWidth: exportWidth, windowHeight: exportHeight, useCORS: true }
      const frontCanvas = await html2canvas(frontExport, captureOptions)
      const backCanvas = await html2canvas(backExport, captureOptions)
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] })
      pdf.addImage(frontCanvas.toDataURL('image/png'), 'PNG', 0, 0, 85.6, 54, undefined, 'FAST')
      pdf.addPage([85.6, 54], 'landscape')
      pdf.addImage(backCanvas.toDataURL('image/png'), 'PNG', 0, 0, 85.6, 54, undefined, 'FAST')
      const qrPdfSize = 220 / exportWidth * 85.6
      const qrPdfX = (exportWidth - 220) / 2 / exportWidth * 85.6
      const qrPdfY = 264 / exportHeight * 54
      pdf.addImage(qr.current.toDataURL('image/png'), 'PNG', qrPdfX, qrPdfY, qrPdfSize, qrPdfSize, undefined, 'FAST')
      pdf.save(`${member.member_code}-membership-card.pdf`)
    } finally {
      exportLayer.remove()
      setBusy(false)
    }
  }

  function handleFlip() { setFlipped((current) => !current) }

  return (
    <div className="membership-card-section">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-gold-light/70">Digital credential</p>
          <h1 className="dash mt-2 text-3xl font-semibold text-gold-light sm:text-4xl">Your membership card</h1>
          <p className="mt-2 max-w-2xl text-white/60">Your official ISTE Student Chapter identity card. Tap the card or use the control to view its verification side.</p>
        </div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/50" aria-label={`Showing ${flipped ? 'back' : 'front'} side`}>
          <span className={flipped ? 'text-white/40' : 'text-gold-light'}>Front</span><span className="h-px w-6 bg-gold/40" /><span className={flipped ? 'text-gold-light' : 'text-white/40'}>Back</span>
        </div>
      </div>

      <div className="mt-7 max-w-[600px]">
        <div ref={card} className="membership-card-stage" onClick={handleFlip} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleFlip() } }} aria-label={`Membership card, showing ${flipped ? 'back' : 'front'}; activate to flip`}>
          <div ref={cardInner} className={`membership-card-inner ${flipped ? 'is-flipped' : ''}`}>
            <div ref={front} className="membership-card-face membership-card-front member-panel">
              <div aria-hidden className="membership-card-orbit" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <EaswariMark className="h-7 w-[5.1rem] sm:h-8 sm:w-[5.5rem]" plate /><IsteMark className="h-10 w-10 sm:h-11 sm:w-11" />
                  <div className="min-w-0 leading-tight"><p className="dash text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-light sm:text-sm">ISTE Student Chapter</p><p className="truncate text-[9px] text-white/55 sm:text-[11px]">Easwari Engineering College, Ramapuram</p></div>
                </div>
                <ShieldCheck className="shrink-0 text-gold-light/80" size={21} aria-label="Verified membership" />
              </div>
              <div className="relative mt-4 flex min-w-0 gap-3 sm:mt-5 sm:gap-5">
                {member.photo_url ? <img src={member.photo_url} alt={`${member.full_name} profile`} crossOrigin="anonymous" className="h-[5.8rem] w-[4.7rem] shrink-0 border border-gold/60 object-cover sm:h-28 sm:w-24" /> : <div className="dash flex h-[5.8rem] w-[4.7rem] shrink-0 items-center justify-center border border-gold/60 text-xl text-gold-light sm:h-28 sm:w-24 sm:text-2xl">{member.full_name.split(' ').map((word) => word[0]).slice(0, 2).join('')}</div>}
                <div className="min-w-0 flex-1"><p className="dash truncate text-lg font-semibold text-white sm:text-2xl">{member.full_name}</p><p className="truncate text-[10px] text-white/60 sm:text-sm">{email}</p>
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] sm:mt-3 sm:gap-x-4 sm:text-[12px]"><div><dt className="inline text-white/45">Register no. </dt><dd className="inline">{member.reg_no}</dd></div><div><dt className="inline text-white/45">Dept. </dt><dd className="inline">{member.department ?? '—'}</dd></div><div><dt className="inline text-white/45">Section </dt><dd className="inline">{member.section ?? '—'}</dd></div><div><dt className="inline text-white/45">Year </dt><dd className="inline">{member.year ?? '—'}</dd></div></dl>
                </div>
              </div>
              <div className="relative mt-3 flex items-end justify-between border-t border-gold/30 pt-2 sm:mt-5 sm:pt-3"><div className="text-[9px] leading-snug sm:text-[11px]"><p className="text-white/45">Member ID</p><p className="text-gold-light">{member.member_code}</p><p className="mt-1 text-white/45">Valid till <span className="text-white">{validTill}</span></p></div><div className="text-right"><img src="/signature.png" alt="Authority signature" crossOrigin="anonymous" className="ml-auto h-7 opacity-90 sm:h-9" onError={(event) => { event.currentTarget.style.display = 'none' }} /><p className="mt-1 border-t border-gold/40 pt-1 text-[8px] text-white/55 sm:text-[10px]">President, ISTE Easwari</p></div></div>
            </div>
            <div ref={back} className="membership-card-face membership-card-back member-panel"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(201,162,39,0.2),transparent_46%)]" /><div className="relative flex h-full flex-col items-center justify-between text-center"><div><IsteMark shine className="mx-auto h-14 w-14" /><p className="mt-2 text-xs uppercase tracking-[0.3em] text-gold-light">ISTE Student Chapter</p><p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/50">Easwari Engineering College · Ramapuram</p></div><div className="flex flex-col items-center"><div className="border-4 border-gold/80 bg-[#F4E4BC] p-2 shadow-[0_0_30px_rgba(201,162,39,0.22)]"><canvas ref={qr} aria-label="Membership verification QR code" className="block h-[118px] w-[118px] sm:h-[140px] sm:w-[140px]" /></div><p className="mt-2 flex items-center gap-1 text-[9px] uppercase tracking-[0.18em] text-white/60"><QrCode size={12} /> Scan to verify membership</p></div><div className="w-full border-t border-gold/30 pt-2 text-[9px] uppercase tracking-[0.15em] text-white/45">Member ID <span className="text-gold-light">{member.member_code}</span></div></div></div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" onClick={handleFlip} aria-pressed={flipped} className="inline-flex items-center gap-2 border border-gold bg-gold px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-gold-light"><WalletCards size={17} /> {flipped ? 'View Front' : 'Flip Card'}</button><button type="button" onClick={download} disabled={busy} className="inline-flex items-center gap-2 border border-gold/60 px-5 py-2.5 text-sm text-gold-light transition hover:bg-gold/10 disabled:opacity-50"><Download size={17} /> {busy ? 'Preparing PDF…' : 'Download Card'}</button><span className="text-xs text-white/45">PDF · front + QR back</span></div>
        {import.meta.env.DEV && (
          <p className="mt-2 text-[11px] text-gold-light/65">
            <span className="font-semibold text-gold-light">Phone QR Target:</span>{' '}
            <code className="rounded bg-black/50 border border-gold/20 px-1.5 py-0.5 text-gold-light font-mono text-[10px]">
              {getMemberVerificationUrl(member.member_code)}
            </code>
          </p>
        )}
      </div>

      <div className="mt-8 grid max-w-[900px] gap-px overflow-hidden border border-gold/25 bg-gold/25 sm:grid-cols-2 lg:grid-cols-4">{[[QrCode, 'Show QR', 'At the membership lane'], [TicketCheck, 'Event forms', 'Attach your card'], [WalletCards, 'Member perks', 'Unlock discounts'], [ShieldCheck, 'Valid till', validTill]].map(([Icon, title, text]) => { const ItemIcon = Icon as typeof QrCode; return <div key={title as string} className="bg-black/70 p-4"><ItemIcon size={18} className="text-gold-light" /><p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-white">{title as string}</p><p className="mt-1 text-xs text-white/50">{text as string}</p></div> })}</div>
      <p className="mt-3 text-xs text-white/40">Add <code>public/signature.png</code> to show the authority signature on the card.</p>
    </div>
  )
}

// ---------------------------------------------------------------- Events
function PriorityEvents() {
  const { data, loading } = useAsync(() => api.listEvents('upcoming'), [])
  const list = data ?? []

  if (loading && !data) return <p className="text-white/60">Loading…</p>
  if (!list.length) return <p className="text-white/60">No upcoming events yet.</p>

  return (
    <div>
      <h1 className="dash text-3xl font-semibold text-gold-light">Priority registration</h1>
      <p className="mt-2 text-white/60">These open to you before the public.</p>
      <PriorityEventCarousel events={list} />
    </div>
  )
}

function PriorityEventCarousel({ events }: { events: Awaited<ReturnType<typeof api.listEvents>> }) {
  // Start on the soonest event
  const [activeIndex, setActiveIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef(0)
  const moved = useRef(false)
  const pointerId = useRef<number | null>(null)

  function move(direction: 1 | -1) {
    if (!events.length) return
    setActiveIndex((current) => (current + direction + events.length) % events.length)
  }

  function relativeIndex(index: number) {
    if (!events.length) return 0
    const distance = index - activeIndex
    const wrapped = ((distance % events.length) + events.length) % events.length
    if (wrapped > events.length / 2) return wrapped - events.length
    return wrapped
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    pointerId.current = event.pointerId
    dragStart.current = event.clientX
    moved.current = false
    setDragging(true)
    event.preventDefault()
    try { event.currentTarget.setPointerCapture(event.pointerId) } catch { }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging || pointerId.current !== event.pointerId) return
    const offset = event.clientX - dragStart.current
    if (Math.abs(offset) > 8) moved.current = true
    setDragOffset(offset)
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (pointerId.current !== event.pointerId) return
    const threshold = Math.min(120, Math.max(52, event.currentTarget.clientWidth * 0.12))
    if (Math.abs(dragOffset) > threshold) {
      move(dragOffset < 0 ? 1 : -1)
    }
    setDragOffset(0)
    setDragging(false)
    pointerId.current = null
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    } catch { }
    window.setTimeout(() => { moved.current = false }, 0)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1) }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1) }
  }

  return (
    <div
      className={`priority-carousel mt-6 ${dragging ? 'is-dragging' : ''}`}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Priority registration events"
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="priority-carousel-shell">
        <button type="button" className="priority-carousel-arrow priority-carousel-arrow-left" onClick={() => move(-1)} aria-label="Previous event">
          <span aria-hidden="true">‹</span>
        </button>

        <div className="priority-carousel-track">
          {events.map((event, index) => {
            const position = relativeIndex(index)
            const isActive = position === 0
            const early = event.public_opens_at && new Date(event.public_opens_at) > new Date()
            const x = Number.isFinite(position) ? position * 210 + dragOffset * 0.46 : 0
            const y = Number.isFinite(position) ? Math.abs(position) * 46 + (position === 0 ? 0 : 18) : 0
            const rotation = Number.isFinite(position) ? position * 16 : 0
            const scale = isActive ? 1 : position === 1 || position === -1 ? 0.84 : 0.7
            const opacity = isActive ? 1 : position === 1 || position === -1 ? 0.85 : 0.55
            const blur = isActive ? 0 : Math.abs(position) > 1 ? 0.4 : 0

            const style = {
              '--carousel-x': `${Number.isFinite(x) ? x : 0}px`,
              '--carousel-y': `${Number.isFinite(y) ? y : 0}px`,
              '--carousel-scale': `${Number.isFinite(scale) ? scale : 1}`,
              '--carousel-rotate': `${Number.isFinite(rotation) ? rotation : 0}deg`,
              '--carousel-opacity': `${Number.isFinite(opacity) ? opacity : 1}`,
              '--carousel-blur': `${Number.isFinite(blur) ? blur : 0}px`,
              zIndex: isActive ? 20 : Math.max(1, 12 - Math.abs(position)),
            } as React.CSSProperties

            const registrationHref = event.google_form_url || `/events/${event.id}/register`
            const externalLink = /^https?:\/\//i.test(registrationHref)

            return (
              <article
                key={event.id}
                className={`priority-event-card ${isActive ? 'is-active' : ''}`}
                style={style}
                aria-hidden={!isActive}
                onClick={(clickEvent) => {
                  if (moved.current) {
                    clickEvent.preventDefault()
                    clickEvent.stopPropagation()
                  }
                }}
              >
                <div className="priority-event-card-inner">
                  <div className="priority-event-card-top">
                    <p className="priority-event-label">Priority access</p>
                    {event.member_discount_pct ? (
                      <span className="priority-event-badge">{event.member_discount_pct}% OFF</span>
                    ) : null}
                  </div>

                  <h2 className="dash priority-event-title">{event.title}</h2>

                  <div className="priority-event-meta">
                    <p className="priority-event-detail"><CalendarDays size={15} className="priority-event-icon" />{new Date(event.starts_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    <p className="priority-event-detail"><MapPin size={15} className="priority-event-icon" />{event.venue}</p>
                  </div>

                  {early && (
                    <p className="priority-event-note">Members first · public from {new Date(event.public_opens_at!).toLocaleDateString('en-IN')}</p>
                  )}

                  {externalLink ? (
                    <a
                      href={registrationHref}
                      target="_blank"
                      rel="noreferrer"
                      tabIndex={isActive ? 0 : -1}
                      onClick={(clickEvent) => {
                        if (moved.current) clickEvent.preventDefault()
                      }}
                      className="priority-register-button group"
                    >
                      Register now
                      <ArrowRight size={16} className="priority-register-arrow" />
                    </a>
                  ) : (
                    <Link
                      to={registrationHref}
                      tabIndex={isActive ? 0 : -1}
                      onClick={(clickEvent) => {
                        if (moved.current) clickEvent.preventDefault()
                      }}
                      className="priority-register-button group"
                    >
                      Register now
                      <ArrowRight size={16} className="priority-register-arrow" />
                    </Link>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        <button type="button" className="priority-carousel-arrow priority-carousel-arrow-right" onClick={() => move(1)} aria-label="Next event">
          <span aria-hidden="true">›</span>
        </button>
      </div>

      {events.length > 1 && (
        <div className="priority-carousel-footer">
          <div className="priority-carousel-dots" aria-label="Select an event">
            {events.map((event, index) => (
              <button
                key={event.id}
                type="button"
                className={`priority-carousel-dot ${index === activeIndex ? 'is-active' : ''}`}
                onClick={() => {
                  const delta = (index - activeIndex + events.length) % events.length
                  setActiveIndex((current) => (current + delta + events.length) % events.length)
                }}
                aria-label={`Go to ${event.title}`}
                aria-pressed={index === activeIndex}
              />
            ))}
          </div>

          <div className="priority-carousel-hint" aria-live="polite">
            <MoveHorizontal size={14} className="priority-carousel-hint-icon" />
            <span>Drag to explore events</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- Vault
function Vault({ memberId }: { memberId: string }) {
  const { data, loading, error, reload } = useAsync(() => api.listCertificates(memberId), [memberId])
  const events = useAsync(() => api.listEvents(), [])
  const [showForm, setShowForm] = useState(false)
  const [certificateType, setCertificateType] = useState<'Merit' | 'Participation'>('Participation')
  const [rank, setRank] = useState('')
  const [eventId, setEventId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const certs = data ?? []

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const event = events.data?.find((item) => item.id === eventId)
    if (!event || !file) {
      setFormError('Choose an event and certificate image before submitting.')
      return
    }
    setSubmitting(true)
    setFormError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be signed in to submit a certificate.')
      const { data: memberData, error: memberError } = await supabase.from('members').select('id').eq('profile_id', user.id).single()
      if (memberError) throw memberError

      const fileUrl = await api.uploadCertificate(file)
      console.log('Certificate member IDs:', { userId: user.id, memberId: memberData.id })
      await api.submitCertificate({
        member_id: memberData.id,
        event_id: event.id,
        event_title: event.title,
        certificate_type: certificateType,
        rank: certificateType === 'Merit' ? (rank as '1st Prize' | '2nd Prize' | '3rd Prize' | 'Excellence') : null,
        file_url: fileUrl,
        issued_on: new Date().toISOString().slice(0, 10),
        status: 'pending',
      })
      setShowForm(false)
      setCertificateType('Participation')
      setRank('')
      setEventId('')
      setFile(null)
      reload()
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : 'Could not submit certificate.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="dash text-3xl font-semibold text-gold-light">My Certificates</h1>
          <p className="mt-2 text-white/60">Submit certificates earned at ISTE events for review.</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setFormError(null) }}
          className="inline-flex items-center gap-2 bg-gold px-4 py-2.5 text-sm text-black hover:bg-gold-light">
          <Plus size={17} /> {showForm ? 'Close' : 'Add Certificate'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="member-panel mt-6 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-white/70">
              Certificate Type
              <select value={certificateType} onChange={(e) => setCertificateType(e.target.value as 'Merit' | 'Participation')}
                className="member-field mt-2 w-full border px-3 py-2.5 text-white outline-none">
                <option value="Merit">Merit</option>
                <option value="Participation">Participation</option>
              </select>
            </label>

            {certificateType === 'Merit' && (
              <label className="block text-sm text-white/70">
                Rank
                <select required value={rank} onChange={(e) => setRank(e.target.value)}
                  className="member-field mt-2 w-full border px-3 py-2.5 text-white outline-none">
                  <option value="">Select rank</option>
                  <option>1st Prize</option>
                  <option>2nd Prize</option>
                  <option>3rd Prize</option>
                  <option>Excellence</option>
                </select>
              </label>
            )}

            <label className="block text-sm text-white/70">
              Event
              <select required value={eventId} onChange={(e) => setEventId(e.target.value)} disabled={events.loading}
                className="member-field mt-2 w-full border px-3 py-2.5 text-white outline-none disabled:opacity-50">
                <option value="">{events.loading ? 'Loading events…' : 'Select event'}</option>
                {(events.data ?? []).map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
              </select>
            </label>

            <label className="block text-sm text-white/70">
              Certificate image
              <input required type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="member-field mt-2 block w-full border px-3 py-2 text-sm text-white file:mr-3 file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-black" />
            </label>
          </div>
          {formError && <p className="mt-4 text-sm text-red-300">{formError}</p>}
          <button type="submit" disabled={submitting || events.loading}
            className="mt-5 bg-gold px-5 py-2.5 text-black hover:bg-gold-light disabled:opacity-50">
            {submitting ? 'Submitting…' : 'Submit for review'}
          </button>
        </form>
      )}

      {loading ? <p className="mt-6 text-white/60">Loading…</p> : error ? <p className="mt-6 text-red-300">{error}</p> : null}
      {!certs.length ? (
        !loading && <p className="mt-6 text-white/50">No certificates submitted yet.</p>
      ) : (
        <ul className="member-panel mt-6 divide-y divide-gold/20">
          {certs.map((c) => (
            <li key={c.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{c.event_title}</p>
                <p className="mt-1 text-sm text-white/60">
                  {c.certificate_type}{c.rank ? ` · ${c.rank}` : ''} · Issued {new Date(c.issued_on).toLocaleDateString('en-IN')}
                </p>
              </div>
              {c.status === 'pending' ? (
                <span className="w-fit border border-yellow-500/60 px-3 py-1.5 text-sm text-yellow-300">Pending Review</span>
              ) : (
                <a href={c.file_url} target="_blank" rel="noreferrer">
                  <img src={c.file_url} alt={`${c.event_title} certificate`} className="h-24 w-36 border border-gold/40 object-cover" />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- Archive
function Archive() {
  const { data, loading } = useAsync(() => api.listResources(), [])
  const list = data ?? []
  if (loading) return <p className="text-white/60">Loading…</p>

  const groups = ['newsletter', 'recording', 'note'] as const
  const labels = { newsletter: 'Newsletters', recording: 'Workshop recordings', note: 'Notes' }

  return (
    <div>
      <h1 className="dash text-3xl font-semibold text-gold-light">Exclusive archive</h1>
      <p className="mt-2 text-white/60">Members only.</p>
      {!list.length ? <p className="mt-6 text-white/50">The archive is empty for now.</p> : groups.map((g) => {
        const items = list.filter((r) => r.kind === g)
        if (!items.length) return null
        return (
          <section key={g} className="mt-7">
            <h2 className="dash text-lg font-semibold">{labels[g]}</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {items.map((r) => (
                <li key={r.id} className="member-panel p-4">
                  <p className="dash font-semibold">{r.title}</p>
                  {r.description && <p className="mt-1 text-sm text-white/60">{r.description}</p>}
                  <a href={r.external_url || r.file_url} target="_blank" rel="noreferrer"
                    className="mt-2 inline-block text-sm text-gold-light hover:underline">Open</a>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------- Profile
function Profile({ member, email, onSaved }:
  { member: MemberRecord; email: string; onSaved: () => void }) {
  const [name, setName] = useState(member.full_name)
  const [photo, setPhoto] = useState<File | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function save() {
    setBusy(true); setMsg(null)
    try {
      await api.updateMyProfile(member.id, { full_name: name }, photo)
      setMsg('Saved.')
      setPhoto(null)
      onSaved()
    } catch (e) { setMsg((e as Error).message) } finally { setBusy(false) }
  }

  return (
    <div>
      <h1 className="dash text-3xl font-semibold text-gold-light">Profile</h1>
      <p className="mt-2 text-white/60">
        Renewal due {member.valid_till ? new Date(member.valid_till).toLocaleDateString('en-IN') : '—'}.
      </p>

      <div className="member-panel mt-6 grid max-w-lg gap-4 p-5">
        <label className="text-sm text-white/60">Full name
          <input className="member-field mt-1 w-full border px-3 py-2 text-white"
            value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="text-sm text-white/60">Photo
          <input type="file" accept="image/*"
            className="member-field mt-1 w-full border px-3 py-2 text-white"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          {[['Email', email], ['Register number', member.reg_no],
            ['Department', member.department ?? '—'], ['Member ID', member.member_code]].map(([k, v]) => (
            <div key={k} className="text-sm">
              <p className="text-white/45">{k}</p>
              <p className="border-b border-white/10 pb-1">{v}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-white/40">
          Register number, department and validity are set by the chapter. Ask an admin to change them.
        </p>

        <button onClick={save} disabled={busy}
          className="w-fit bg-gold px-5 py-2.5 text-black hover:bg-gold-light disabled:opacity-50">
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        {msg && <p className="text-sm text-gold-light">{msg}</p>}
      </div>
    </div>
  )
}
