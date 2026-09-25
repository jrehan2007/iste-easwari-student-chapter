import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import QRCode from 'https://esm.sh/qrcode@1.5.4'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
}
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // The function is reachable by anyone who knows its URL, so it verifies
  // the caller is a signed-in admin itself rather than trusting the UI.
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return new Response('Unauthorized', { status: 401, headers: cors })

  const { data: caller } = await admin.auth.getUser(token)
  if (!caller.user) return new Response('Unauthorized', { status: 401, headers: cors })

  const { data: profile } = await admin
    .from('profiles').select('role').eq('id', caller.user.id).single()
  if (profile?.role !== 'admin')
    return new Response('Forbidden', { status: 403, headers: cors })

  const { event_id } = await req.json()

  const { data: event } = await admin
    .from('events').select('*').eq('id', event_id).single()
  if (!event)
    return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404, headers: cors })

  // Only passes that haven't been sent yet, so re-running doesn't spam anyone.
  const { data: passes } = await admin
    .from('event_passes').select('*').eq('event_id', event_id).is('emailed_at', null)

  if (!passes?.length)
    return new Response(JSON.stringify({ sent: 0, message: 'No unsent passes.' }),
      { headers: { ...cors, 'Content-Type': 'application/json' } })

  const SMTP_USER = Deno.env.get('SMTP_USER')!
  const SMTP_PASS = Deno.env.get('SMTP_PASS')!

  let sent = 0
  const failed: string[] = []

  for (const p of passes) {
    try {
      const qrBuffer = await QRCode.toBuffer(p.token, { width: 320, margin: 1 })
      const qrPath = `${p.id}.png`
      await admin.storage.from('passes').upload(qrPath, qrBuffer, {
        contentType: 'image/png',
        upsert: true,
      })
      const qr = admin.storage.from('passes').getPublicUrl(qrPath).data.publicUrl
      // The function runs on a UTC server: pin the time to IST or 1:30 PM reads as 8:00 AM
      const when = new Date(event.starts_at).toLocaleString('en-IN', {
        dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Kolkata',
      }).replace(/\b(am|pm)\b/i, (m) => m.toUpperCase())

      const html = `
        <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#0E1B33">
          <div style="background:#0A1628;padding:20px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:20px">ISTE &ndash; Easwari Student Chapter</h1>
            <p style="color:#7FDCEF;margin:6px 0 0;font-size:12px;letter-spacing:2px">
              INDIAN SOCIETY FOR TECHNICAL EDUCATION</p>
          </div>
          <div style="padding:24px;border:1px solid #d8e6ee;border-top:none">
            <h2 style="margin:0 0 4px">${event.title}</h2>
            <p style="margin:0 0 18px;color:#5A6577">${p.team_name ?? ''}</p>
            <table style="font-size:14px;line-height:1.7">
              <tr><td style="color:#5A6577;padding-right:14px">When</td><td>${when}</td></tr>
              <tr><td style="color:#5A6577;padding-right:14px">Venue</td><td>${event.venue ?? '&mdash;'}</td></tr>
              ${p.room ? `<tr><td style="color:#5A6577;padding-right:14px">Room</td><td>${p.room}</td></tr>` : ''}
              ${p.track ? `<tr><td style="color:#5A6577;padding-right:14px">Track</td><td>${p.track}</td></tr>` : ''}
              <tr><td style="color:#5A6577;padding-right:14px">Team size</td><td>${p.team_size ?? 1}</td></tr>
              <tr><td style="color:#5A6577;padding-right:14px">Entry lane</td><td>${
                p.lane === 'membership' ? 'Membership lane' : 'Public lane'}</td></tr>
            </table>
            <div style="text-align:center;margin:26px 0">
              <img src="${qr}" width="220" height="220" alt="Entry pass" />
              <p style="font-size:12px;color:#5A6577;margin:8px 0 0">
                Show this at the entrance. Valid until
                ${new Date(p.expires_at).toLocaleDateString('en-IN')}.</p>
            </div>
            <p style="font-size:12px;color:#5A6577;border-top:1px solid #d8e6ee;padding-top:14px">
              Bring your college ID as well. This pass admits one team and can only be scanned once.</p>
          </div>
        </div>`

      // Gmail SMTP over TLS
      const client = new (await import('https://deno.land/x/denomailer@1.6.0/mod.ts')).SMTPClient({
        connection: {
          hostname: 'smtp.gmail.com',
          port: 465,
          tls: true,
          auth: { username: SMTP_USER, password: SMTP_PASS },
        },
      })

      await client.send({
        from: `ISTE Easwari Student Chapter <${SMTP_USER}>`,
        to: p.leader_email,
        subject: `Your entry pass — ${event.title}`,
        html,
      })
      await client.close()

      await admin.from('event_passes')
        .update({ emailed_at: new Date().toISOString() }).eq('id', p.id)
      sent++
    } catch (e) {
      failed.push(`${p.leader_email}: ${(e as Error).message}`)
    }
  }

  return new Response(JSON.stringify({ sent, failed }), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
})