import { Link } from 'react-router-dom'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Hero from '../components/Hero'
import EmptyState from '../components/EmptyState'
import { useAsync } from '../lib/useAsync'
import { listAnnouncements, listEvents } from '../lib/api'
import LiveTicker from '../components/LiveTicker'
import AnnouncementLink from '../components/AnnouncementLink'

import FeedbackSection from '../components/FeedbackSection'

export default function Home() {
  const posts = useAsync(() => listAnnouncements(3), [])
  const upcoming = useAsync(() => listEvents('upcoming'), [])
  const tickerRef = useRef<HTMLDivElement>(null)
  const tickerVisible = useInView(tickerRef, { once: true, amount: 0.4 })
  const announcementsRef = useRef<HTMLElement>(null)
  const announcementsVisible = useInView(announcementsRef, { once: true, amount: 0.2 })
  const calendarRef = useRef<HTMLElement>(null)
  const calendarVisible = useInView(calendarRef, { once: true, amount: 0.2 })
  const feedbackRef = useRef<HTMLDivElement>(null)
  const feedbackVisible = useInView(feedbackRef, { once: true, amount: 0.2 })

  // The hero fills the first screen; everything below it arrives as it scrolls in.
  return (
    <>
      <Hero />

      <motion.div
        ref={tickerRef}
        initial={{ opacity: 0, y: 16 }}
        animate={tickerVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <LiveTicker />
      </motion.div>

      <motion.section
        ref={announcementsRef}
        initial={{ opacity: 0, y: 36 }}
        animate={announcementsVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="container-page py-16"
      >
        <div className="flex items-end justify-between gap-4">
          <h2 className="section-title">Live Wire</h2>
          <Link to="/pin-board" className="text-turkish-dark hover:underline dark:text-turkish-light">Open the pin board</Link>
        </div>
        <div className="rule mt-4" />

        {posts.loading ? <p className="muted mt-8">Loading…</p>
          : !posts.data?.length ? <EmptyState title="No posts yet" hint="Publish one from the admin pin board." />
          : (
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {posts.data.map((a) => (
                <article key={a.id} className="card flex min-w-0 flex-col overflow-hidden">
                  <p className="text-sm text-turkish-dark dark:text-turkish-light">
                    {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {a.source === 'instagram' && ' · from Instagram'}
                  </p>
                  <h3 className="mt-2 text-xl [overflow-wrap:anywhere]">{a.title}</h3>
                  <p className="muted mt-2 flex-1 [overflow-wrap:anywhere]">{a.body}</p>
                  <AnnouncementLink href={a.external_url} className="mt-4 self-start" />
                </article>
              ))}
            </div>
          )}
      </motion.section>

      <motion.section
        ref={calendarRef}
        initial={{ opacity: 0, y: 36 }}
        animate={calendarVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#E8F1F4] py-16 dark:bg-night-soft"
      >
        <div className="container-page">
          <h2 className="section-title">Next on the calendar</h2>
          <div className="rule mt-4" />
          {upcoming.loading ? <p className="muted mt-8">Loading…</p>
            : !upcoming.data?.length ? <EmptyState title="No upcoming events" hint="Add one from the admin dashboard." />
            : (
              <div className="mt-8 grid gap-5 md:grid-cols-2">
                {upcoming.data.slice(0, 4).map((e) => (
                  <article key={e.id} className="card">
                    <h3 className="text-2xl">{e.title}</h3>
                    <p className="muted mt-2">{e.description}</p>
                    <dl className="muted mt-4 space-y-1 text-sm">
                      <div><dt className="inline font-bold">Venue: </dt><dd className="inline">{e.venue}</dd></div>
                      <div><dt className="inline font-bold">When: </dt>
                        <dd className="inline">{new Date(e.starts_at).toLocaleString('en-IN')}</dd></div>
                    </dl>
                    <Link to={`/events/${e.id}/register`} className="btn-primary mt-5">Register</Link>
                  </article>
                ))}
              </div>
            )}
        </div>
      </motion.section>

      <motion.div
        ref={feedbackRef}
        initial={{ opacity: 0, y: 36 }}
        animate={feedbackVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <FeedbackSection />
      </motion.div>
    </>
  )
}
