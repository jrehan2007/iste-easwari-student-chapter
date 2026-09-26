import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ShieldCheck, ShieldAlert, ShieldX, CheckCircle2, Copy, Check,
  Camera, CameraOff, Search, ArrowLeft, RefreshCw, ExternalLink
} from 'lucide-react'
import { verifyMember } from '../lib/api'
import { useQrScanner } from '../lib/useQrScanner'
import { EaswariMark, IsteMark } from '../components/Logo'
import type { MemberVerificationResult } from '../lib/types'

export default function VerifyMember() {
  const params = useParams<{ verificationId?: string; memberCode?: string; memberId?: string }>()
  const rawId = params.verificationId || params.memberCode || params.memberId || ''
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<MemberVerificationResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [inputCode, setInputCode] = useState('')
  const [cameraActive, setCameraActive] = useState(false)

  // Run backend verification whenever rawId changes
  useEffect(() => {
    let active = true
    setLoading(true)

    if (!rawId.trim()) {
      setData(null)
      setLoading(false)
      setShowSearchModal(true)
      return
    }

    verifyMember(rawId)
      .then((res) => {
        if (active) {
          setData(res)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setData({
            status: 'not_found',
            verifiedAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'medium' }),
            verificationId: `VRF-ISTE-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
          })
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [rawId])

  // Camera QR scanner: turning cameraActive off stops the camera.
  const camera = useQrScanner('verify-camera-box', cameraActive, (decodedText) => {
    let code = decodedText.trim()
    if (code.includes('/verify/')) {
      code = code.split('/verify/').pop()?.split(/[?#]/)[0] || code
    }
    setCameraActive(false)
    setShowSearchModal(false)
    navigate(`/verify/${encodeURIComponent(code)}`)
  })
  // If the camera can't start, go back to the "Scan QR" button and show why.
  useEffect(() => { if (camera.error) setCameraActive(false) }, [camera.error])

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    let code = inputCode.trim()
    if (!code) return
    if (code.includes('/verify/')) {
      code = code.split('/verify/').pop()?.split(/[?#]/)[0] || code
    }
    setShowSearchModal(false)
    setInputCode('')
    setCameraActive(false)
    navigate(`/verify/${encodeURIComponent(code)}`)
  }

  function formatDate(dateStr?: string | null) {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).toUpperCase()
    } catch {
      return dateStr
    }
  }

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[#060B14] font-sans text-slate-100 selection:bg-gold/30">
      {/* Background ambient lighting */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(201,162,39,0.14),transparent_70%)]" />
        <div className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-turkish/10 blur-[130px]" />
        <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-gold/5 blur-[120px]" />
      </div>

      {/* Top Header Bar */}
      <header className="border-b border-white/10 bg-[#09111F]/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="flex items-center gap-2.5 transition hover:opacity-90">
            <EaswariMark className="h-6 w-auto sm:h-7" />
            <span className="hidden h-5 w-px bg-white/20 sm:block" />
            <IsteMark className="h-7 w-7 sm:h-8 sm:w-8" />
            <div className="hidden min-w-0 flex-col leading-tight sm:flex">
              <span className="text-xs font-semibold uppercase tracking-wider text-gold-light">ISTE Student Chapter</span>
              <span className="text-[10px] text-white/50">Easwari Engineering College</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSearchModal(true)}
              className="inline-flex items-center gap-1.5 rounded-sm border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold-light transition hover:bg-gold/20"
            >
              <Search size={13} />
              <span>Verify Another</span>
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-xs text-white/60 transition hover:text-white"
            >
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Verification Container */}
      <main className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-8 sm:py-12">
        {loading ? (
          /* Step 13: Loading State */
          <div className="my-16 flex flex-col items-center text-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-gold/30 bg-gold/5 shadow-[0_0_30px_rgba(201,162,39,0.15)]">
              <RefreshCw className="h-9 w-9 animate-spin text-gold-light" />
            </div>
            <h2 className="mt-6 font-display text-xl font-semibold tracking-wider text-white">VERIFYING MEMBERSHIP...</h2>
            <p className="mt-2 text-sm text-white/60">Querying ISTE Easwari Central Registry…</p>
          </div>
        ) : data?.status === 'server_error' || data?.status === 'network_error' ? (
          /* Step 13: Server / Network Error State */
          <div className="w-full overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-b from-[#181206] via-[#0E0B04] to-[#040301] p-6 shadow-2xl sm:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-500/60 bg-amber-950/50 text-amber-400">
                <ShieldAlert size={34} />
              </div>
              <h1 className="font-display mt-4 text-2xl font-bold tracking-tight text-amber-100 sm:text-3xl">
                {data.status === 'server_error' ? '⚠ VERIFICATION SERVICE UNAVAILABLE' : '⚠ UNABLE TO VERIFY MEMBERSHIP'}
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
                Unable to contact the central ISTE membership registry. Please verify your connection and try again.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 rounded-sm border border-gold bg-gold px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-gold-light"
                >
                  <RefreshCw size={15} />
                  <span>TRY AGAIN</span>
                </button>
              </div>
            </div>
          </div>
        ) : !data || data.status === 'not_found' ? (
          /* STATE 2: MEMBER NOT FOUND */
          <div className="w-full overflow-hidden rounded-2xl border border-red-500/40 bg-gradient-to-b from-[#160B0B] via-[#0F0808] to-[#0A0707] p-6 shadow-2xl shadow-black/80 sm:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-500/60 bg-red-950/50 text-red-400 shadow-[0_0_24px_rgba(239,68,68,0.25)]">
                <ShieldAlert size={34} />
              </div>

              <span className="mt-4 rounded-full border border-red-500/30 bg-red-900/30 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-red-300">
                Invalid Credential
              </span>

              <h1 className="font-display mt-4 text-2xl font-bold tracking-tight text-red-100 sm:text-3xl">
                ✕ MEMBERSHIP NOT FOUND
              </h1>

              <p className="mt-3 max-w-md text-sm leading-relaxed text-red-200/70">
                The membership credential could not be verified.
              </p>

              {rawId && (
                <div className="mt-6 w-full rounded-lg border border-red-500/20 bg-black/40 p-4 text-left">
                  <span className="text-[11px] uppercase tracking-wider text-white/40">Queried ID</span>
                  <p className="font-mono text-sm text-red-200">{rawId}</p>
                </div>
              )}

              <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="inline-flex w-full flex-1 items-center justify-center gap-2 rounded-sm border border-gold/60 bg-gold px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-gold-light"
                >
                  <Search size={16} />
                  <span>VERIFY ANOTHER MEMBERSHIP</span>
                </button>
                <Link
                  to="/"
                  className="inline-flex w-full flex-1 items-center justify-center gap-2 rounded-sm border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Return to Home
                </Link>
              </div>

              <div className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-white/40">
                <span>Verified on: {data?.verifiedAt || new Date().toLocaleString('en-IN')}</span>
                <span className="mx-2">·</span>
                <span>ID: {data?.verificationId || 'VER-UNKNOWN'}</span>
              </div>
            </div>
          </div>
        ) : data.status === 'expired' ? (
          /* 10. EXPIRED STATE */
          <div className="w-full overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-b from-[#1B1405] via-[#120D03] to-[#0A0702] p-6 shadow-2xl shadow-black/80 sm:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-500/60 bg-amber-950/50 text-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.25)]">
                <ShieldAlert size={34} />
              </div>

              <span className="mt-4 rounded-full border border-amber-500/30 bg-amber-900/30 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-amber-300">
                Status: Expired
              </span>

              <h1 className="font-display mt-4 text-2xl font-bold tracking-tight text-amber-100 sm:text-3xl">
                ⚠ MEMBERSHIP EXPIRED
              </h1>

              <p className="mt-2 text-sm text-amber-200/70">
                This membership has expired and is no longer active.
              </p>

              {/* Member Details */}
              <div className="mt-6 w-full divide-y divide-amber-500/20 rounded-xl border border-amber-500/30 bg-black/40 text-left text-sm">
                <div className="flex items-center justify-between p-3.5">
                  <span className="text-white/50">Member</span>
                  <span className="font-semibold text-white">{data.fullName}</span>
                </div>
                <div className="flex items-center justify-between p-3.5">
                  <span className="text-white/50">Member ID</span>
                  <span className="font-mono text-amber-200">{data.memberId}</span>
                </div>
                <div className="flex items-center justify-between p-3.5">
                  <span className="text-white/50">Status</span>
                  <span className="font-semibold uppercase text-amber-400">EXPIRED</span>
                </div>
                <div className="flex items-center justify-between p-3.5">
                  <span className="text-white/50">Expired On</span>
                  <span className="text-white">{formatDate(data.validTill)}</span>
                </div>
              </div>

              <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="inline-flex w-full flex-1 items-center justify-center gap-2 rounded-sm border border-gold/60 bg-gold px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-gold-light"
                >
                  <Search size={16} />
                  <span>VERIFY ANOTHER MEMBERSHIP</span>
                </button>
              </div>

              <div className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-white/40">
                <span>Verified on: {data.verifiedAt}</span>
                <span className="mx-2">·</span>
                <span>Verification ID: {data.verificationId}</span>
              </div>
            </div>
          </div>
        ) : data.status === 'inactive' ? (
          /* 11. INACTIVE STATE */
          <div className="w-full overflow-hidden rounded-2xl border border-slate-600/40 bg-gradient-to-b from-[#131720] via-[#0D1017] to-[#07090D] p-6 shadow-2xl shadow-black/80 sm:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-slate-500/60 bg-slate-900/50 text-slate-300 shadow-[0_0_24px_rgba(148,163,184,0.15)]">
                <ShieldX size={34} />
              </div>

              <span className="mt-4 rounded-full border border-slate-500/30 bg-slate-800/40 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-slate-300">
                Status: Inactive
              </span>

              <h1 className="font-display mt-4 text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
                ✕ MEMBERSHIP INACTIVE
              </h1>

              <p className="mt-2 text-sm text-slate-300/70">
                This membership record is currently inactive or pending chapter approval.
              </p>

              <div className="mt-6 w-full divide-y divide-white/10 rounded-xl border border-white/15 bg-black/40 text-left text-sm">
                <div className="flex items-center justify-between p-3.5">
                  <span className="text-white/50">Member</span>
                  <span className="font-semibold text-white">{data.fullName}</span>
                </div>
                <div className="flex items-center justify-between p-3.5">
                  <span className="text-white/50">Member ID</span>
                  <span className="font-mono text-slate-200">{data.memberId}</span>
                </div>
                <div className="flex items-center justify-between p-3.5">
                  <span className="text-white/50">Status</span>
                  <span className="font-semibold uppercase text-slate-300">INACTIVE</span>
                </div>
              </div>

              <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="inline-flex w-full flex-1 items-center justify-center gap-2 rounded-sm border border-gold/60 bg-gold px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-gold-light"
                >
                  <Search size={16} />
                  <span>VERIFY ANOTHER MEMBERSHIP</span>
                </button>
              </div>

              <div className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-white/40">
                <span>Verified on: {data.verifiedAt}</span>
                <span className="mx-2">·</span>
                <span>Verification ID: {data.verificationId}</span>
              </div>
            </div>
          </div>
        ) : (
          /* 8. ACTIVE & VALID STATE (The Premium Verified Card) */
          <div className="w-full overflow-hidden rounded-xl sm:rounded-2xl border-2 border-gold/70 bg-gradient-to-b from-[#181206] via-[#0E0B04] to-[#040301] shadow-[0_0_50px_rgba(201,162,39,0.25)]">
            {/* Gold Banner Top */}
            <div className="relative border-b border-gold/30 bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 px-4 py-5 text-center sm:px-8 sm:py-6">
              <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border-2 border-gold bg-[#120E05] shadow-[0_0_25px_rgba(201,162,39,0.35)]">
                <ShieldCheck className="h-8 w-8 sm:h-9 sm:w-9 text-gold-light" />
              </div>

              <div className="mt-3.5 sm:mt-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/60 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ACTIVE</span>
              </div>

              <h1 className="font-display mt-2.5 sm:mt-3 text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">
                ✓ VERIFIED MEMBER
              </h1>

              <p className="mt-1 font-display text-xs font-semibold tracking-wider text-gold-light">
                Official Membership Verification
              </p>

              <div className="mt-2 space-y-0.5 font-display text-[11px] sm:text-xs uppercase tracking-[0.14em] sm:tracking-[0.2em] text-gold-light/80">
                <p>ISTE EASWARI</p>
                <p className="text-[10px] sm:text-[11px] text-white/60">EASWARI ENGINEERING COLLEGE, RAMAPURAM</p>
              </div>

              <div className="mt-3 sm:mt-4 mx-auto max-w-md border-t border-gold/20 pt-2.5 sm:pt-3">
                <p className="text-xs text-white/75 leading-relaxed sm:text-sm">
                  This membership is authentic and verified by ISTE Easwari Student Chapter.
                </p>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-8">
              {/* Member Identification Row */}
              <div className="flex flex-col items-center gap-3.5 sm:gap-4 border-b border-gold/25 pb-5 sm:pb-6 text-center sm:flex-row sm:items-center sm:text-left">
                {data.photoUrl ? (
                  <img
                    src={data.photoUrl}
                    alt={data.fullName}
                    className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg border-2 border-gold/60 object-cover shadow-md shadow-black/60 shrink-0"
                  />
                ) : (
                  <div className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-lg border-2 border-gold/60 bg-gold/10 font-display text-xl sm:text-2xl font-bold text-gold-light shadow-md shadow-black/60">
                    {data.fullName?.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-white/50">Member Name</span>
                  <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-semibold text-gold-light [overflow-wrap:anywhere]">
                    {data.fullName}
                  </h2>
                  {data.email && (
                    <p className="mt-0.5 font-mono text-xs text-white/70 [overflow-wrap:anywhere]">
                      {data.email}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <span className="font-mono text-xs sm:text-sm text-white/85">{data.memberId}</span>
                    <button
                      onClick={() => data.memberId && handleCopy(data.memberId)}
                      className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-xs text-white/70 transition hover:bg-white/20 hover:text-white"
                      title="Copy Member ID"
                    >
                      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Specification Grid */}
              <dl className="mt-5 sm:mt-6 grid grid-cols-1 gap-2.5 sm:gap-x-6 sm:gap-y-4 text-xs sm:text-sm sm:grid-cols-2">
                <div className="rounded-lg border border-gold/15 bg-black/40 p-3 sm:p-3.5">
                  <dt className="text-[10px] sm:text-xs uppercase tracking-wider text-white/45">Membership Type</dt>
                  <dd className="mt-0.5 sm:mt-1 font-semibold text-white">{data.membershipType || 'ISTE Student Chapter'}</dd>
                </div>

                <div className="rounded-lg border border-gold/15 bg-black/40 p-3 sm:p-3.5">
                  <dt className="text-[10px] sm:text-xs uppercase tracking-wider text-white/45">Institution</dt>
                  <dd className="mt-0.5 sm:mt-1 font-semibold text-white">{data.institution || 'Easwari Engineering College, Ramapuram'}</dd>
                </div>

                {data.regNo && (
                  <div className="rounded-lg border border-gold/15 bg-black/40 p-3 sm:p-3.5">
                    <dt className="text-[10px] sm:text-xs uppercase tracking-wider text-white/45">Register Number</dt>
                    <dd className="mt-0.5 sm:mt-1 font-mono text-white/90">{data.regNo}</dd>
                  </div>
                )}

                {data.department && (
                  <div className="rounded-lg border border-gold/15 bg-black/40 p-3 sm:p-3.5">
                    <dt className="text-[10px] sm:text-xs uppercase tracking-wider text-white/45">Department</dt>
                    <dd className="mt-0.5 sm:mt-1 text-white/90">
                      {[data.department, data.year ? `Year ${data.year}` : '', data.section ? `Sec ${data.section}` : '']
                        .filter(Boolean)
                        .join(' · ')}
                    </dd>
                  </div>
                )}

                <div className="rounded-lg border border-gold/15 bg-black/40 p-3 sm:p-3.5">
                  <dt className="text-[10px] sm:text-xs uppercase tracking-wider text-white/45">Valid From</dt>
                  <dd className="mt-0.5 sm:mt-1 text-white/80">{formatDate(data.validFrom)}</dd>
                </div>

                <div className="rounded-lg border border-gold/15 bg-black/40 p-3 sm:p-3.5">
                  <dt className="text-[10px] sm:text-xs uppercase tracking-wider text-white/45">Valid Until</dt>
                  <dd className="mt-0.5 sm:mt-1 font-semibold text-gold-light">{formatDate(data.validTill)}</dd>
                </div>
              </dl>

              {/* Official Seal Guarantee */}
              <div className="mt-6 sm:mt-8 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 rounded-xl border border-gold/30 bg-gold/5 p-3.5 sm:p-4">
                <div className="flex items-center gap-3">
                  <IsteMark className="h-9 w-9 sm:h-10 sm:w-10 shrink-0" />
                  <div>
                    <p className="font-display text-xs sm:text-sm font-semibold text-gold-light">Verified Member</p>
                    <p className="text-[11px] sm:text-xs text-white/60">✓ Official ISTE Membership</p>
                  </div>
                </div>
                <div className="text-left xs:text-right text-[10px] sm:text-[11px] text-white/40">
                  <p>Certified by</p>
                  <p className="font-medium text-white/70">ISTE Easwari Chapter</p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 sm:mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="inline-flex min-h-[44px] w-full flex-1 items-center justify-center gap-2 rounded-sm border border-gold bg-gold px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-gold-light"
                >
                  <Search size={16} />
                  <span>VERIFY ANOTHER MEMBERSHIP</span>
                </button>
              </div>

              {/* Audit Meta */}
              <div className="mt-5 sm:mt-6 border-t border-white/10 pt-3.5 sm:pt-4 text-center text-[10px] sm:text-[11px] text-white/40">
                <p>Verified on: {data.verifiedAt}</p>
                <p className="mt-0.5 font-mono">Verification ID: {data.verificationId}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Verify Another Modal / Scanner */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-gold/40 bg-[#0E1524] p-5 shadow-2xl sm:p-7">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-gold-light">Verify Membership</h3>
              <button
                onClick={() => {
                  setShowSearchModal(false)
                  setCameraActive(false)
                }}
                className="text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-xs text-white/60">
              Enter an ISTE Member ID or scan a membership card QR code.
            </p>

            {/* Manual ID input form */}
            <form onSubmit={handleSearchSubmit} className="mt-5 space-y-3">
              <div>
                <label htmlFor="manual-id" className="mb-1 block text-xs uppercase tracking-wider text-white/50">
                  Member ID or Verification URL
                </label>
                <input
                  id="manual-id"
                  type="text"
                  placeholder="e.g. ISTE-EEC-2026-UDQU"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="w-full rounded-sm border border-white/20 bg-black/50 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold placeholder:text-white/30"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={!inputCode.trim()}
                className="w-full rounded-sm border border-gold bg-gold px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-gold-light disabled:opacity-40"
              >
                Verify Member ID
              </button>
            </form>

            <div className="relative my-5 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
              <span className="relative bg-[#0E1524] px-3 text-xs uppercase tracking-wider text-white/40">Or scan card</span>
            </div>

            {/* Camera Scan Trigger */}
            <div className="text-center">
              {!cameraActive ? (
                <button
                  type="button"
                  onClick={() => setCameraActive(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white transition hover:bg-white/10"
                >
                  <Camera size={16} className="text-gold-light" />
                  <span>Scan QR with Camera</span>
                </button>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => setCameraActive(false)}
                    className="mb-3 inline-flex items-center gap-1 text-xs text-red-300 hover:underline"
                  >
                    <CameraOff size={14} /> Stop Camera
                  </button>
                  <div id="verify-camera-box" className="mx-auto w-full max-w-xs overflow-hidden rounded-lg border border-gold/40 bg-black" />
                  {camera.starting && <p className="mt-2 text-xs text-white/50">Starting camera…</p>}
                </div>
              )}

              {camera.error && (
                <p role="alert" className="mt-2 text-xs text-red-300">{camera.error}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}