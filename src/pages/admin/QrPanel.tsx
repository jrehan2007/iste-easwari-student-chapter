import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, CameraOff, Download } from 'lucide-react'
import { Panel, Table, Row, Danger, useSaver } from './panels'
import { useAsync } from '../../lib/useAsync'
import * as api from '../../lib/api'
import type { EventPass, Lane, ScanResult } from '../../lib/types'

/** One printable pass card with its QR. The QR encodes the token only. */
function PassCard({ pass, eventTitle, venue, when }: {
  pass: EventPass; eventTitle: string; venue?: string; when?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (ref.current) QRCode.toCanvas(ref.current, pass.token, { width: 150, margin: 1 })
  }, [pass.token])

  function download() {
    const url = ref.current?.toDataURL('image/png')
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = `${(pass.team_name || pass.leader_email).replace(/\W+/g, '-')}.png`
    a.click()
  }

  return (
    <article className="flex gap-4 border border-turkish/30 bg-white p-4 dark:border-night-line dark:bg-night-soft">
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-widest text-turkish-dark dark:text-turkish-light">
          {pass.lane === 'membership' ? 'Membership lane' : 'Public lane'}
        </p>
        <h4 className="font-display mt-1 truncate text-lg font-semibold">{pass.team_name}</h4>
        <dl className="muted mt-2 space-y-0.5 text-xs">
          <div><dt className="inline">Event: </dt><dd className="inline">{eventTitle}</dd></div>
          {pass.leader_name && <div><dt className="inline">Leader: </dt><dd className="inline">{pass.leader_name}</dd></div>}
          <div><dt className="inline">Email: </dt><dd className="inline break-all">{pass.leader_email}</dd></div>
          {pass.room && <div><dt className="inline">Room: </dt><dd className="inline">{pass.room}</dd></div>}
          {pass.track && <div><dt className="inline">Track: </dt><dd className="inline">{pass.track}</dd></div>}
          <div><dt className="inline">Team size: </dt><dd className="inline">{pass.team_size}</dd></div>
          {venue && <div><dt className="inline">Venue: </dt><dd className="inline">{venue}</dd></div>}
          {when && <div><dt className="inline">When: </dt><dd className="inline">{when}</dd></div>}
          <div><dt className="inline">Valid till: </dt>
            <dd className="inline">{new Date(pass.expires_at).toLocaleDateString('en-IN')}</dd></div>
        </dl>
      </div>
      <div className="shrink-0 text-center">
        <canvas ref={ref} className="bg-white p-1" />
        <button onClick={download}
          className="mt-2 inline-flex items-center gap-1 text-xs text-turkish-dark hover:underline dark:text-turkish-light">
          <Download size={12} /> PNG
        </button>
      </div>
    </article>
  )
}

export default function QrPanel() {
  const events = useAsync(() => api.listEvents(), [])
  const { run, banner, busy } = useSaver()

  const [eventId, setEventId] = useState('')
  const [emails, setEmails] = useState('')
  const [form, setForm] = useState({ team_name: '', team_size: 1, track: '', room: '', lane: 'public' as Lane, valid_days: 7 })
  const [issued, setIssued] = useState<EventPass[]>([])

  const passes = useAsync(() => (eventId ? api.listPasses(eventId) : Promise.resolve([])), [eventId, issued.length])
  const event = events.data?.find((e) => e.id === eventId)

  useEffect(() => {
    if (!eventId && events.data?.length) setEventId(events.data[0].id)
  }, [events.data, eventId])

  const emailList = emails.split('\n').map((l) => l.trim()).filter(Boolean)

  return (
    <Panel title="Event passes"
      hint="Paste the registered team leaders' emails, one per line. Each gets a pass valid for the window you set.">
      {banner}

      <div className="card grid gap-3 sm:grid-cols-2">
        <select className="field sm:col-span-2" value={eventId} onChange={(e) => setEventId(e.target.value)}>
          <option value="">Select an event…</option>
          {(events.data ?? []).map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>

        <textarea className="field sm:col-span-2" rows={5}
          placeholder={'One per line:\nrahul@example.com\nPriya S <priya@example.com>'}
          value={emails} onChange={(e) => setEmails(e.target.value)} />
        <p className="muted -mt-2 text-xs sm:col-span-2">
          {emailList.length} {emailList.length === 1 ? 'recipient' : 'recipients'} detected
        </p>

        <input className="field" placeholder="Team name (blank = use leader name)"
          value={form.team_name} onChange={(e) => setForm({ ...form, team_name: e.target.value })} />
        <input className="field" placeholder="Track or problem statement"
          value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })} />
        <input className="field" placeholder="Room allocated"
          value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
        <input className="field" type="number" min={1} placeholder="Team size"
          value={form.team_size} onChange={(e) => setForm({ ...form, team_size: Number(e.target.value) })} />
        <select className="field" value={form.lane}
          onChange={(e) => setForm({ ...form, lane: e.target.value as Lane })}>
          <option value="public">Public lane</option>
          <option value="membership">Membership lane</option>
        </select>
        <input className="field" type="number" min={1} placeholder="Valid for (days)"
          value={form.valid_days} onChange={(e) => setForm({ ...form, valid_days: Number(e.target.value) })} />

        <button className="btn-primary sm:col-span-2" disabled={!eventId || !emailList.length}
          onClick={() => run(
            async () => { setIssued(await api.issuePasses({ event_id: eventId, emails: emailList, ...form })) },
            `${emailList.length} pass${emailList.length === 1 ? '' : 'es'} issued.`,
            () => setEmails(''))}>
          Generate passes
        </button>
      </div>

      {issued.length > 0 && (
        <>
          <h3 className="font-display text-lg font-semibold">Just issued</h3>
          <p className="muted text-sm">
            Download these and send them to the team leaders. Automatic emailing needs a verified
            sending domain — see the README.
          </p>
          <div className="grid gap-3 lg:grid-cols-2">
            {issued.map((p) => (
              <PassCard key={p.id} pass={p} eventTitle={event?.title ?? ''} venue={event?.venue}
                when={event ? new Date(event.starts_at).toLocaleString('en-IN') : undefined} />
            ))}
          </div>
        </>
      )}

      <Scanner eventId={eventId} onScanned={() => passes.reload()} />

      {(passes.data?.length ?? 0) > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">
              Issued passes — {passes.data!.filter((p) => p.checked_in_at).length} of {passes.data!.length} checked in
            </h3>
            <div className="flex flex-wrap justify-end gap-2">
              <button className="btn-outline py-1.5 text-sm" onClick={() => exportCsv(passes.data!, event?.title ?? 'event')}>
                Export attendance
              </button>
              <button className="btn-primary py-1.5 text-sm" disabled={!eventId || busy}
                onClick={() => run(
                  () => api.emailPasses(eventId),
                  ({ sent, failed }) => `Sent ${sent} passes${failed.length ? `. Failed: ${failed.join('; ')}` : ''}`,
                  passes.reload,
                )}>
                {busy ? 'Sending…' : 'Email passes to leaders'}
              </button>
            </div>
          </div>
          <p className="muted -mt-3 text-sm">
            {passes.data!.filter((p) => p.emailed_at).length} of {passes.data!.length} emailed
          </p>
          <Table head={['Team', 'Leader', 'Lane', 'Room', 'Checked in', '']}>
            {passes.data!.map((p) => (
              <Row key={p.id}>
                <td className="p-3">{p.team_name}</td>
                <td className="p-3 muted">{p.leader_email}</td>
                <td className="p-3 capitalize">{p.lane}</td>
                <td className="p-3 muted">{p.room ?? '—'}</td>
                <td className="p-3">{p.checked_in_at
                  ? new Date(p.checked_in_at).toLocaleString('en-IN')
                  : <span className="muted">Not yet</span>}</td>
                <td className="p-3 text-right">
                  <Danger onClick={() => run(() => api.deletePass(p.id), 'Pass removed.', passes.reload)}>Remove</Danger>
                </td>
              </Row>
            ))}
          </Table>
        </>
      )}
    </Panel>
  )
}

function exportCsv(passes: EventPass[], title: string) {
  const head = ['Team', 'Leader name', 'Email', 'Lane', 'Room', 'Track', 'Team size', 'Checked in at']
  const rows = passes.map((p) => [
    p.team_name ?? '', p.leader_name ?? '', p.leader_email, p.lane, p.room ?? '', p.track ?? '',
    String(p.team_size ?? 1), p.checked_in_at ? new Date(p.checked_in_at).toLocaleString('en-IN') : '',
  ])
  const csv = [head, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `attendance-${title.replace(/\W+/g, '-').toLowerCase()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/** Camera scanner with a manual fallback. Needs HTTPS — works on the deployed site. */
function Scanner({ eventId, onScanned }: { eventId: string; onScanned: () => void }) {
  const [on, setOn] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manual, setManual] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastToken = useRef<string>('')

  useEffect(() => {
    if (!on) return
    const el = document.getElementById('scanner-view')
    if (!el) return

    const scanner = new Html5Qrcode('scanner-view')
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      async (token) => {
        // The camera fires continuously; ignore repeats of the same code.
        if (token === lastToken.current) return
        lastToken.current = token
        window.setTimeout(() => { lastToken.current = '' }, 2500)
        try {
          setResult(await api.scanPass(token))
          onScanned()
        } catch (e) { setError((e as Error).message) }
      },
      () => {}
    ).catch((e) => { setError(e.message ?? String(e)); setOn(false) })

    return () => { scanner.stop().then(() => scanner.clear()).catch(() => {}) }
  }, [on, onScanned])

  const tone = {
    valid:     'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100',
    already:   'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
    expired:   'border-red-500 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-100',
    unknown:   'border-red-500 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-100',
    forbidden: 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-100',
  }

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">Scanner</h3>
          <p className="muted text-sm">Point the camera at a pass. Camera access needs HTTPS, so use the deployed site.</p>
        </div>
        <button onClick={() => { setOn(!on); setResult(null); setError(null) }}
          className={on ? 'btn-outline' : 'btn-primary'}>
          {on ? <><CameraOff size={18} /> Stop</> : <><Camera size={18} /> Start scanning</>}
        </button>
      </div>

      {on && <div id="scanner-view" className="mx-auto mt-4 w-full max-w-sm overflow-hidden rounded-sm" />}
      {error && <p className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>}

      {result && (
        <div className={`mt-4 border-l-4 p-4 ${tone[result.result]}`}>
          {result.result === 'valid' && (
            <>
              <p className="font-display text-xl font-semibold">Admit — {result.team_name}</p>
              <p className="mt-1 text-sm">
                {result.team_size} {result.team_size === 1 ? 'person' : 'people'}
                {result.room && ` · Room ${result.room}`}
                {result.track && ` · ${result.track}`}
              </p>
              <p className="mt-1 text-sm uppercase tracking-widest">
                {result.lane === 'membership' ? 'Membership lane' : 'Public lane'}
              </p>
            </>
          )}
          {result.result === 'already' && (
            <p className="font-display text-lg font-semibold">
              Already checked in — {result.team_name} at {new Date(result.checked_in_at!).toLocaleTimeString('en-IN')}
            </p>
          )}
          {result.result === 'expired' && (
            <p className="font-display text-lg font-semibold">
              Expired on {new Date(result.expires_at!).toLocaleDateString('en-IN')}
            </p>
          )}
          {result.result === 'unknown' && <p className="font-display text-lg font-semibold">Pass not recognised</p>}
          {result.result === 'forbidden' && <p className="font-display text-lg font-semibold">Admin sign-in required</p>}
        </div>
      )}

      <div className="mt-4 border-t border-turkish/20 pt-4 dark:border-night-line">
        <p className="muted text-sm">Camera not working? Check someone in by their email.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input className="field max-w-xs" placeholder="Team leader email"
            value={manual} onChange={(e) => setManual(e.target.value)} />
          <button className="btn-outline" disabled={!eventId || !manual}
            onClick={async () => {
              try {
                setResult(await api.checkInByEmail(eventId, manual))
                setManual('')
                onScanned()
              } catch (e) { setError((e as Error).message) }
            }}>
            Check in
          </button>
        </div>
      </div>
    </div>
  )
}
