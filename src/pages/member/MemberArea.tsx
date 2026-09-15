import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import QRCode from 'qrcode'
import html2canvas from 'html2canvas'
import { Award, BookOpen, BrainCircuit, IdCard, Settings, Ticket, LogOut, Download, Plus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../lib/useAsync'
import * as api from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { IsteMark } from '../../components/Logo'
import type { MemberRecord } from '../../lib/types'

type Tab = 'card' | 'events' | 'vault' | 'archive' | 'skill' | 'profile'

const tabs: { id: Tab; label: string; icon: typeof IdCard }[] = [
  { id: 'card',    label: 'Membership card', icon: IdCard },
  { id: 'events',  label: 'Priority events', icon: Ticket },
  { id: 'vault',   label: 'My Certificates',  icon: Award },
  { id: 'archive', label: 'Exclusive archive', icon: BookOpen },
  { id: 'skill',   label: 'Skill Zone',      icon: BrainCircuit },
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
    <div className="dash min-h-screen bg-black text-white">
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

      <header className="border-b border-gold/40">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 py-5">
          <Link to="/" className="flex items-center gap-3">
            <IsteMark className="h-10 w-10" />
            <div>
              <p className="text-lg font-semibold tracking-wide text-gold-light">ISTE Easwari · Members</p>
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

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[230px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-2 px-4 py-2.5 text-left transition ${
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
                {tab === 'skill'   && <SkillZone memberId={member.id} />}
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
    <div className="border border-gold/40 p-8">
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
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (qr.current)
      QRCode.toCanvas(qr.current, member.member_code, { width: 108, margin: 0,
        color: { dark: '#111111', light: '#C9A227' } })
  }, [member.member_code])

  async function download() {
    if (!card.current) return
    setBusy(true)
    try {
      const canvas = await html2canvas(card.current, { backgroundColor: '#000', scale: 2 })
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = `${member.member_code}.png`
      a.click()
    } finally { setBusy(false) }
  }

  return (
    <div>
      <h1 className="dash text-3xl font-semibold text-gold-light">Your membership card</h1>
      <p className="mt-2 text-white/60">
        Show the QR at the membership lane. Attach a screenshot to event forms to claim the member discount.
      </p>

      {/* 1.586:1, standard card ratio */}
      <div ref={card}
        className="relative mt-7 w-full max-w-[560px] overflow-hidden border-2 border-gold bg-gradient-to-br from-[#171106] via-[#0B0803] to-black p-6">
        {/* traceable watermark */}
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-5xl font-bold text-white/[0.035]">
          {member.member_code}
        </p>

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <IsteMark className="h-11 w-11" />
            <div className="leading-tight">
              <p className="dash text-sm font-semibold text-gold-light">ISTE Student Chapter</p>
              <p className="text-[11px] text-white/55">Easwari Engineering College, Ramapuram</p>
            </div>
          </div>
          <canvas ref={qr} className="shrink-0 bg-gold p-1" />
        </div>

        <div className="relative mt-5 flex gap-5">
          {member.photo_url ? (
            <img src={member.photo_url} alt={member.full_name}
              className="h-28 w-24 shrink-0 border border-gold/50 object-cover" />
          ) : (
            <div className="dash flex h-28 w-24 shrink-0 items-center justify-center border border-gold/50 text-2xl text-gold-light">
              {member.full_name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="dash truncate text-2xl font-semibold">{member.full_name}</p>
            <p className="truncate text-sm text-white/60">{email}</p>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
              <div><dt className="inline text-white/45">Register no. </dt><dd className="inline">{member.reg_no}</dd></div>
              <div><dt className="inline text-white/45">Dept. </dt><dd className="inline">{member.department ?? '—'}</dd></div>
              <div><dt className="inline text-white/45">Section </dt><dd className="inline">{member.section ?? '—'}</dd></div>
              <div><dt className="inline text-white/45">Year </dt><dd className="inline">{member.year ?? '—'}</dd></div>
            </dl>
          </div>
        </div>

        <div className="relative mt-5 flex items-end justify-between border-t border-gold/30 pt-3">
          <div className="text-[11px] leading-snug">
            <p className="text-white/45">Member ID</p>
            <p className="text-gold-light">{member.member_code}</p>
            <p className="mt-1 text-white/45">Valid till</p>
            <p>{member.valid_till ? new Date(member.valid_till).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric' }) : 'Pending'}</p>
          </div>
          <div className="text-right">
            <img src="/signature.png" alt="" className="ml-auto h-9 opacity-90"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
            <p className="mt-1 border-t border-gold/40 pt-1 text-[10px] text-white/55">President, ISTE Easwari</p>
          </div>
        </div>
      </div>

      <button onClick={download} disabled={busy}
        className="mt-5 inline-flex items-center gap-2 border border-gold px-5 py-2.5 text-gold-light hover:bg-gold/10 disabled:opacity-50">
        <Download size={17} /> {busy ? 'Rendering…' : 'Download card'}
      </button>
      <p className="mt-2 text-xs text-white/40">
        Add <code>public/signature.png</code> to show the authority signature on the card.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------- Events
function PriorityEvents() {
  const { data, loading } = useAsync(() => api.listEvents('upcoming'), [])
  const list = data ?? []
  if (loading) return <p className="text-white/60">Loading…</p>
  if (!list.length) return <p className="text-white/60">No upcoming events yet.</p>

  return (
    <div>
      <h1 className="dash text-3xl font-semibold text-gold-light">Priority registration</h1>
      <p className="mt-2 text-white/60">These open to you before the public.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {list.map((e) => {
          const early = e.public_opens_at && new Date(e.public_opens_at) > new Date()
          return (
            <article key={e.id} className="border border-gold/40 p-5">
              {early && (
                <p className="mb-2 text-xs uppercase tracking-widest text-gold-light">
                  Members only — public from {new Date(e.public_opens_at!).toLocaleDateString('en-IN')}
                </p>
              )}
              <h2 className="dash text-xl font-semibold">{e.title}</h2>
              <p className="mt-2 text-sm text-white/60">
                {e.venue} · {new Date(e.starts_at).toLocaleDateString('en-IN')}
              </p>
              {Boolean(e.member_discount_pct) && (
                <p className="mt-3 text-gold-light">{e.member_discount_pct}% off your registration</p>
              )}
              <Link to={`/events/${e.id}/register`}
                className="mt-4 inline-block bg-gold px-4 py-2 text-black hover:bg-gold-light">
                Register now
              </Link>
            </article>
          )
        })}
      </div>
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
        <form onSubmit={submit} className="mt-6 border border-gold/40 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-white/70">
              Certificate Type
              <select value={certificateType} onChange={(e) => setCertificateType(e.target.value as 'Merit' | 'Participation')}
                className="mt-2 w-full border border-gold/40 bg-black px-3 py-2.5 text-white outline-none focus:border-gold">
                <option value="Merit">Merit</option>
                <option value="Participation">Participation</option>
              </select>
            </label>

            {certificateType === 'Merit' && (
              <label className="block text-sm text-white/70">
                Rank
                <select required value={rank} onChange={(e) => setRank(e.target.value)}
                  className="mt-2 w-full border border-gold/40 bg-black px-3 py-2.5 text-white outline-none focus:border-gold">
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
                className="mt-2 w-full border border-gold/40 bg-black px-3 py-2.5 text-white outline-none focus:border-gold disabled:opacity-50">
                <option value="">{events.loading ? 'Loading events…' : 'Select event'}</option>
                {(events.data ?? []).map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
              </select>
            </label>

            <label className="block text-sm text-white/70">
              Certificate image
              <input required type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-2 block w-full border border-gold/40 bg-black px-3 py-2 text-sm text-white file:mr-3 file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-black" />
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
        <ul className="mt-6 divide-y divide-gold/20 border border-gold/30">
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
                <li key={r.id} className="border border-gold/30 p-4 transition hover:border-gold">
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

// ---------------------------------------------------------------- Skill Zone
function SkillZone({ memberId }: { memberId: string }) {
  const quiz = useAsync(() => api.liveQuiz(), [])
  const questions = useAsync(
    () => (quiz.data ? api.listQuestions(quiz.data.id) : Promise.resolve([])), [quiz.data?.id])
  const attempts = useAsync(() => api.myAttempts(memberId), [memberId])

  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [done, setDone] = useState(false)

  if (quiz.loading) return <p className="text-white/60">Loading…</p>

  const qs = questions.data ?? []
  const score = qs.filter((q) => answers[q.id] === q.correct_index).length

  async function submit() {
    setDone(true)
    if (quiz.data) {
      try {
        await api.recordAttempt({ quiz_id: quiz.data.id, member_id: memberId, score, total: qs.length })
        attempts.reload()
      } catch { /* the score still shows even if recording fails */ }
    }
  }

  return (
    <div>
      <h1 className="dash text-3xl font-semibold text-gold-light">Skill Zone</h1>
      <p className="mt-2 text-white/60">Practice quizzes set by the chapter.</p>

      {!quiz.data ? (
        <p className="mt-6 text-white/50">No quiz is live right now. Check back soon.</p>
      ) : (
        <div className="mt-6 border border-gold/40 p-6">
          <p className="text-sm text-white/50">{quiz.data.topic}</p>
          <h2 className="dash mt-1 text-xl font-semibold">{quiz.data.title}</h2>

          {qs.map((q, qi) => (
            <div key={q.id} className="mt-6 border-t border-gold/20 pt-5 first:border-0 first:pt-0">
              <p className="font-semibold">{qi + 1}. {q.prompt}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {q.options.map((o, oi) => {
                  const picked = answers[q.id] === oi
                  const cls = !done
                    ? picked ? 'border-gold bg-gold/15' : 'border-gold/30 hover:border-gold'
                    : oi === q.correct_index ? 'border-gold bg-gold/15 text-gold-light'
                    : picked ? 'border-red-500/60 text-red-300' : 'border-white/10 text-white/40'
                  return (
                    <button key={oi} disabled={done} onClick={() => setAnswers({ ...answers, [q.id]: oi })}
                      className={`border p-3 text-left transition ${cls}`}>{o}</button>
                  )
                })}
              </div>
              {done && q.explanation && <p className="mt-2 text-sm text-white/65">{q.explanation}</p>}
            </div>
          ))}

          {qs.length > 0 && (
            done ? (
              <p className="dash mt-6 text-xl font-semibold text-gold-light">
                {score} out of {qs.length}
              </p>
            ) : (
              <button onClick={submit} disabled={Object.keys(answers).length < qs.length}
                className="mt-6 bg-gold px-5 py-2.5 text-black hover:bg-gold-light disabled:opacity-40">
                Submit answers
              </button>
            )
          )}
        </div>
      )}

      {attempts.data?.length ? (
        <>
          <h2 className="dash mt-8 text-lg font-semibold">Your past attempts</h2>
          <ul className="mt-3 divide-y divide-gold/20 border border-gold/30">
            {attempts.data.map((a) => (
              <li key={a.id} className="flex justify-between p-3 text-sm">
                <span className="text-white/70">{new Date(a.attempted_at).toLocaleDateString('en-IN')}</span>
                <span className="text-gold-light">{a.score} / {a.total}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
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

      <div className="mt-6 grid max-w-lg gap-4">
        <label className="text-sm text-white/60">Full name
          <input className="mt-1 w-full border border-gold/40 bg-black px-3 py-2 text-white"
            value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="text-sm text-white/60">Photo
          <input type="file" accept="image/*"
            className="mt-1 w-full border border-gold/40 bg-black px-3 py-2 text-white"
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
