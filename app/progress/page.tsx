'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from '@/lib/session'

type Mastery = { subject_id: string; topic: string; score: number; hits: number; misses: number }
type Totals = { seen: number; answered: number; correct: number; minutes: number }

export default function Progress() {
  const { db, user, subjects } = useSession()
  const [mastery, setMastery] = useState<Mastery[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)

  useEffect(() => {
    if (!user) return
    db.from('topic_mastery').select('subject_id,topic,score,hits,misses')
      .then(({ data }) => setMastery((data ?? []) as Mastery[]))

    db.from('interactions').select('action,dwell_ms').then(({ data }) => {
      const rows = data ?? []
      setTotals({
        seen: rows.filter((r) => r.action === 'seen').length,
        answered: rows.filter((r) => ['correct', 'got_it', 'wrong', 'confused'].includes(r.action)).length,
        correct: rows.filter((r) => ['correct', 'got_it'].includes(r.action)).length,
        minutes: Math.round(rows.reduce((n, r) => n + (r.dwell_ms ?? 0), 0) / 60000),
      })
    })
  }, [db, user])

  if (!user) return <main><p className="tag">Starting…</p></main>

  if (totals && !totals.seen) return (
    <main>
      <header className="bar"><h1>Progress</h1></header>
      <p className="empty-inline">
        Nothing to measure yet — <Link href="/feed">scroll a few cards</Link> and this fills in.
      </p>
    </main>
  )

  const recall = totals?.answered ? Math.round((totals.correct / totals.answered) * 100) : null

  return (
    <main>
      <header className="bar"><h1>Progress</h1></header>

      <ul className="stats">
        <li><strong>{totals?.seen ?? '—'}</strong><span>cards</span></li>
        <li><strong>{recall === null ? '—' : `${recall}%`}</strong><span>recall</span></li>
        <li><strong>{totals?.minutes ?? '—'}m</strong><span>scrolled</span></li>
      </ul>

      {subjects.filter((s) => !s.archived).map((s) => {
        const topics = mastery.filter((m) => m.subject_id === s.id)
          .sort((a, b) => a.score - b.score)     // weakest first: that's what needs work
        if (!topics.length) return null
        return (
          <section key={s.id} className="group">
            <h2 className="group-name">{s.name}</h2>
            <ul className="subjects">
              {topics.map((t) => {
                const pct = Math.round(t.score * 100)
                return (
                  <li key={t.topic} className="mastery">
                    <div className="mastery-head">
                      <strong>{t.topic}</strong>
                      <span className="tag">{pct}%</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${pct}%` }}
                        data-weak={pct < 40 ? '1' : undefined} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </main>
  )
}
