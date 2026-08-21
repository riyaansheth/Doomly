'use client'
import Link from 'next/link'
import { daysUntil, type Exam } from '@/lib/calendar'

/** The one line that should actually make someone open the feed. */
export default function ExamBanner({ exams, weakest }: { exams: Exam[]; weakest?: string }) {
  const next = exams
    .filter((e) => daysUntil(e) >= 0)
    .sort((a, b) => a.exam_date.localeCompare(b.exam_date))[0]
  if (!next) return null

  const d = daysUntil(next)
  if (d > 14) return null            // too far out to nag about

  return (
    <Link className={'banner' + (d <= 3 ? ' urgent' : '')} href="/feed">
      <strong>{next.name}</strong> exam {d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`}
      {weakest ? <> — you&apos;re weakest on <strong>{weakest}</strong></> : null}
      <span className="banner-go">Revise →</span>
    </Link>
  )
}
