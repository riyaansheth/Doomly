'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession, dated } from '@/lib/session'
import { daysUntil } from '@/lib/calendar'
import ExamBanner from '@/components/ExamBanner'

type Today = { cards: number; minutes: number; answered: number; correct: number }

export default function Home() {
  const { db, user, subjects, error } = useSession()
  const [today, setToday] = useState<Today | null>(null)
  const [weakest, setWeakest] = useState<{ topic: string; score: number } | null>(null)

  useEffect(() => {
    if (!user) return

    // Local midnight, not a UTC day bucket. 2am in IST is 20:30 UTC the previous
    // day, so a UTC boundary would file late-night scrolling — the exact habit
    // this app is built around — under yesterday.
    const midnight = new Date()
    midnight.setHours(0, 0, 0, 0)

    db.from('interactions').select('action,dwell_ms').gte('created_at', midnight.toISOString())
      .then(({ data }) => {
        const rows = data ?? []
        setToday({
          cards: rows.filter((r) => r.action === 'seen').length,
          minutes: Math.round(rows.reduce((n, r) => n + (r.dwell_ms ?? 0), 0) / 60000),
          answered: rows.filter((r) => ['correct', 'got_it', 'wrong', 'confused'].includes(r.action)).length,
          correct: rows.filter((r) => ['correct', 'got_it'].includes(r.action)).length,
        })
      })

    db.from('topic_mastery').select('topic,score').order('score').limit(1)
      .then(({ data }) => setWeakest(data?.[0] ?? null))
  }, [db, user])

  if (error) return <main className="centre"><h1>Doomly</h1><p className="err">{error}</p></main>
  if (!user) return <main className="centre"><h1>Doomly</h1><p className="tag">Starting…</p></main>

  const recall = today?.answered ? Math.round((today.correct / today.answered) * 100) : null
  const hasSubjects = subjects.some((s) => !s.archived)

  return (
    <main>
      <header className="bar">
        <h1>Today</h1>
        <Link className="gear" href="/settings" aria-label="Settings">⚙</Link>
      </header>

      <ExamBanner exams={dated(subjects)} weakest={weakest?.topic} />

      <ul className="stats">
        <li><strong>{today?.cards ?? 0}</strong><span>cards</span></li>
        <li><strong>{recall === null ? '—' : `${recall}%`}</strong><span>recall</span></li>
        <li><strong>{today?.minutes ?? 0}m</strong><span>scrolled</span></li>
      </ul>

      {weakest && (
        <Link className="weakest" href="/progress">
          Weakest right now: <strong>{weakest.topic}</strong>
          <span className="tag">{Math.round(weakest.score * 100)}%</span>
        </Link>
      )}

      {/* The primary action changes with what's actually missing, so it never
          points someone at an empty feed. */}
      {!hasSubjects ? (
        <>
          <p className="empty-inline">Nothing to scroll yet. Add a subject, then feed it a PDF, a YouTube link or just a topic.</p>
          <Link className="primary" href="/library">Add your first subject</Link>
        </>
      ) : (
        <Link className="primary" href="/feed">Start scrolling →</Link>
      )}

      {hasSubjects && !subjects.some((s) => s.exam_date) && (
        <p className="tag foot">
          Got an exam timetable? <Link href="/exams">Upload it</Link> and Doomly will shift the
          feed as the dates get closer.
        </p>
      )}
    </main>
  )
}
