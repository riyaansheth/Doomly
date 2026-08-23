'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useSession, dated } from '@/lib/session'
import { uploadTimetable } from '@/lib/ingest'
import Exams from '@/components/Exams'

export default function ExamsPage() {
  const { db, user, subjects, refresh } = useSession()
  const [progress, setProgress] = useState('')

  if (!user) return <main><p className="tag">Starting…</p></main>
  const withDates = dated(subjects)

  return (
    <main>
      <header className="bar"><h1>Exams</h1></header>

      <div className="card-block stack">
        <label className="file">
          Upload exam timetable
          <input type="file" accept="application/pdf" hidden
            onChange={async (e) => {
              if (!e.target.files?.[0]) return
              await uploadTimetable(db, user.id, e.target.files[0], setProgress)
              refresh()
            }} />
        </label>
        <p className="tag">Doomly reads the sheet your college hands out and dates your subjects for you.</p>
      </div>
      {progress && <p className="progress">{progress}</p>}

      {withDates.length
        ? <Exams exams={withDates} />
        : <p className="empty-inline">
            No exam dates yet. Upload a timetable above, or set a date on a subject in{' '}
            <Link href="/library">Library</Link>.
          </p>}
    </main>
  )
}
