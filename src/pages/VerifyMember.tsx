import { useParams } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { verifyMember } from '../lib/api'
import { EaswariMark, IsteMark } from '../components/Logo'

export default function VerifyMember() {
  const { memberCode = '' } = useParams()
  const result = useAsync(() => verifyMember(memberCode), [memberCode])

  if (result.loading) return <div className="container-page py-24 text-center muted">Checking membership…</div>
  if (result.error || !result.data) {
    return (
      <main className="container-page py-24 text-center">
        <p className="text-sm uppercase tracking-[0.18em] text-gold-deep">ISTE Easwari</p>
        <h1 className="section-title mt-3">Membership not verified</h1>
        <p className="muted mx-auto mt-3 max-w-md">This membership link is invalid or no longer active.</p>
      </main>
    )
  }

  const member = result.data
  return (
    <main className="container-page py-12 sm:py-20">
      <div className="mx-auto max-w-xl overflow-hidden rounded-sm border-2 border-gold bg-gradient-to-br from-[#171106] via-[#0B0803] to-black p-6 text-white shadow-[0_16px_60px_rgba(14,27,51,0.22)] sm:p-8">
        <div className="flex items-center justify-between gap-4 border-b border-gold/30 pb-5">
          <div className="flex items-center gap-3"><EaswariMark className="h-8 w-[5.5rem]" plate /><IsteMark className="h-11 w-11" /></div>
          <div className="text-right"><p className="font-display text-lg font-semibold text-gold-light">ISTE Easwari</p><p className="text-xs text-white/55">Member verification</p></div>
        </div>
        <div className="mt-7 flex gap-5">
          {member.photo_url ? <img src={member.photo_url} alt={member.full_name} className="h-28 w-24 shrink-0 border border-gold/50 object-cover" /> : <div className="flex h-28 w-24 shrink-0 items-center justify-center border border-gold/50 text-2xl text-gold-light">{member.full_name.split(' ').map((word) => word[0]).slice(0, 2).join('')}</div>}
          <div><p className="font-display text-2xl font-semibold text-gold-light">{member.full_name}</p><p className="mt-1 text-sm text-green-300">Valid ISTE Easwari member</p><p className="mt-3 text-sm text-white/65">Member ID: <span className="text-white">{member.member_code}</span></p></div>
        </div>
        <dl className="mt-7 grid grid-cols-2 gap-4 border-t border-gold/30 pt-5 text-sm">
          <div><dt className="text-white/45">Register no.</dt><dd>{member.reg_no}</dd></div><div><dt className="text-white/45">Department</dt><dd>{member.department ?? '—'}</dd></div>
          <div><dt className="text-white/45">Section</dt><dd>{member.section ?? '—'}</dd></div><div><dt className="text-white/45">Year</dt><dd>{member.year ?? '—'}</dd></div>
          <div><dt className="text-white/45">Valid from</dt><dd>{member.valid_from ?? '—'}</dd></div><div><dt className="text-white/45">Valid till</dt><dd>{member.valid_till ?? '—'}</dd></div>
        </dl>
      </div>
    </main>
  )
}