# ISTE – Easwari Student Chapter

React + TypeScript + Tailwind + Framer Motion, with Supabase (Postgres, Auth, Storage).
Deploys to Vercel and points at your GoDaddy domain.

There is **no dummy data anywhere**. Every page reads from Supabase; until you add content
through the admin dashboard, pages show an empty state.

---

## 1. Run it

```bash
npm install
npm run dev            # http://localhost:5175
```

## 2. Database — start clean

In the Supabase **SQL Editor**:

1. If you ran an earlier version of this project, run **`supabase/reset.sql`** first.
   It drops every chapter table so the new schema applies cleanly. Then go to
   **Authentication → Users** and delete the test users.
2. Run **`supabase/schema.sql`**. One pass, no errors.
3. **Storage** → create four buckets: `event-banners`, `gallery`, `member-photos`
   (all **Public**) and `certificates` (private).
4. **Authentication → Sign In / Providers → Email**:
   - **Allow new users to sign up: ON** — members create their own account when they
     claim a membership.
   - **Confirm email: OFF** — the claim flow can't wait for an email round trip.
5. Copy `.env.example` to `.env`, fill in your Project URL and publishable key, and
   restart `npm run dev`. Env files only load at startup.

## 3. Become admin

Admin access is locked to an allowlist enforced by a database trigger — the UI cannot
grant it. Your email is seeded at the bottom of `schema.sql`.

Sign in once as a member to create your account, then:

```sql
update profiles set role = 'admin' where email = 'jrehan2007@gmail.com';
```

To add the President and VP later:

```sql
insert into admin_allowlist (email) values ('president@example.com');
update profiles set role = 'admin' where email = 'president@example.com';
```

Allowlist first, then promote. The trigger rejects the promotion otherwise.

---

## How membership works

No email is involved, so nothing depends on a mail provider.

1. **Admin creates the member** — Members panel. Fill in name, email, register number,
   department, section, year, upload their photo, hit **Generate** for a temporary
   password, and create. The email and temporary password appear in a copyable box.
2. **The secretary hands those over** in person or on WhatsApp — usually at the same
   moment as collecting the fee.
3. **The student signs in**, picks **Member**, enters their email and the temporary
   password. The app recognises it as a first claim and asks them to set their own
   password. That step is what creates their login account.
4. **From then on** they sign in normally and everything in the member area works.

Reset password on any member row issues a fresh temporary password the same way.

### Why no service-role key

Creating a login account for another person needs the service-role key, which can never
be exposed in browser code. Instead, the member creates their own account using the
temporary password as proof they were invited. Same outcome, nothing secret in the frontend.

---

## The public Membership page is admin-controlled

Everything a visitor sees there comes from **Admin → Membership page**: headline, intro,
perks, price, opening and closing dates, the Google Form link, and whether registration
is open at all. When it's closed, visitors see your closed message instead of the form.

## Event passes and the scanner

**Admin → Passes & scanner.**

1. Pick the event, paste team leader emails one per line (accepts `Name <email>`), set
   room, track, team size, lane and how many days the pass stays valid.
2. **Generate passes.** Each card shows the event, venue, timing, leader, room, track,
   team size and lane, with its QR. Download as PNG and send them out.
3. On the day, **Start scanning**. Green means admit and shows team, size, room and lane.
   Amber means the pass was already used, with the time. Red means expired or unknown.
4. **Export attendance** downloads a CSV of everyone who checked in.

Two things to know:

- **The QR encodes only a random token.** Team names and emails stay in the database and
  are looked up at scan time, because anything inside a QR is readable by any scanner app.
- **Camera access needs HTTPS.** It will not work from `localhost` on another phone. Test
  the scanner on the deployed site, on the actual phone a volunteer will use, days before
  the event. The manual email check-in below the scanner is the fallback.

## Two-stage event publishing

Each event has "Opens to members" and "Opens to public" — the public one defaults to a
week later. This is enforced by a row-level security policy, so an event genuinely isn't
readable by non-members before its public date, not merely hidden in the interface.

## The ID card

Members get a downloadable card with photo, register number, department, section, year,
member code, validity, QR and a faint traceable watermark. Drop your President's
signature at `public/signature.png` and it appears above the signature line; without it
the card renders fine, just without a signature.

---

## Deploy to your GoDaddy domain

```bash
git init
git add .
git commit -m "initial"
```

Create a GitHub repo, push, then at **vercel.com** → Add New → Project → import it.
**Add the four environment variables before deploying.** Then:

1. Vercel → your project → **Settings → Domains** → add your domain, e.g. `istaeaswari.in`.
2. Vercel shows you the DNS records it needs. Usually:
   - `A` record, host `@`, value `76.76.21.21`
   - `CNAME` record, host `www`, value `cname.vercel-dns.com`
3. In **GoDaddy → My Products → your domain → DNS → Manage Zones**, delete GoDaddy's
   default parked `A` record for `@`, then add the records Vercel gave you.
4. Wait for propagation — usually minutes, occasionally a few hours. Vercel's Domains
   page turns green when it's verified and issues the HTTPS certificate automatically.
5. Back in Supabase → **Authentication → URL Configuration** → set **Site URL** to your
   domain, and add it under Redirect URLs.

## Sending email later

Nothing in the app currently needs email, by design. When you want automatic pass
delivery or certificate emails, verify your GoDaddy domain in Resend:

1. Resend → **Domains** → Add domain → enter your domain.
2. Resend gives you DKIM and SPF records. Add them in GoDaddy's DNS manager.
3. Once verified, change the sender in Supabase → Authentication → SMTP from
   `onboarding@resend.dev` to `noreply@yourdomain`.

Until that's done, `onboarding@resend.dev` only delivers to the address you registered
with Resend — which is why the membership flow deliberately avoids email entirely.

---

## Brand

Turkish blue `#00A9CE` (dark `#00758E`, mist `#E8F7FB`), ink `#0E1B33`, night `#0A1220`
for dark surfaces, and gold `#C9A227` reserved for the members' area. Body text is Times
New Roman; headings and both dashboards use Fraunces. Tokens live in `tailwind.config.js`.

The ISTE seal is masked to a true circle with transparency. A specular band sweeps across
it left to right roughly once every ten seconds, with a halo breathing in the same rhythm.
Use the `IsteMark` component with `shine` rather than a raw `<img>`.
