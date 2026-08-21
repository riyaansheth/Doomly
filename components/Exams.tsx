'use client'
import { googleCalendarUrl, ics, daysUntil, type Exam } from '@/lib/calendar'

const when = (d: number) =>
  d < 0 ? 'done' : d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`

export default function Exams({ exams }: { exams: Exam[] }) {
  const upcoming = exams
    .filter((e) => daysUntil(e) >= 0)
    .sort((a, b) => a.exam_date.localeCompare(b.exam_date))

  if (!upcoming.length) return null

  const download = () => {
    const url = URL.createObjectURL(new Blob([ics(upcoming)], { type: 'text/calendar' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: 'doomly-exams.ics' })
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="exams">
      <div className="exams-head">
        <h2 className="group-name">Exams</h2>
        <button className="ghost" onClick={download}>Download .ics</button>
      </div>
      <ul>
        {upcoming.map((e) => {
          const d = daysUntil(e)
          return (
            <li key={e.name + e.exam_date} className={d <= 3 ? 'soon' : ''}>
              <strong>{e.name}</strong>
              <span className="exam-when">{when(d)}</span>
              <time>{new Date(e.exam_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                {e.exam_time ? ` · ${e.exam_time.slice(0, 5)}` : ''}</time>
              <a className="ghost" href={googleCalendarUrl(e)} target="_blank" rel="noopener noreferrer">
                Add to Calendar
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
