'use client'
import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/session'
import { LEVELS, addSource, uploadPdf } from '@/lib/ingest'

type Doc = { id: string; filename: string; source_type: string; chunks_done: number; chunks_total: number | null }

export default function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { db, user, subjects, patch, refresh } = useSession()
  const [docs, setDocs] = useState<Doc[]>([])
  const [progress, setProgress] = useState('')
  const router = useRouter()

  const subject = subjects.find((s) => s.id === id)
  const loaded = !!user && !!subjects.length

  // An id that isn't theirs (or no longer exists) goes back to the list rather
  // than rendering a blank page.
  useEffect(() => { if (loaded && !subject) router.replace('/library') }, [loaded, subject, router])

  useEffect(() => {
    if (!user) return
    db.from('documents').select('id,filename,source_type,chunks_done,chunks_total')
      .eq('subject_id', id).order('created_at')
      .then(({ data }) => setDocs((data ?? []) as Doc[]))
  }, [db, user, id, progress])

  if (!subject) return <main><p className="tag">Loading…</p></main>

  return (
    <main>
      <header className="bar">
        <Link className="back" href="/library">‹ Library</Link>
      </header>
      <h1 contentEditable suppressContentEditableWarning className="editable-title"
        onBlur={(e) => {
          const name = e.currentTarget.textContent?.trim()
          if (name && name !== subject.name) patch(subject.id, { name })
        }}>{subject.name}</h1>

      <h2 className="group-name">Add material</h2>
      <form className="source card-block" onSubmit={(e) => {
        e.preventDefault()
        const f = e.target as HTMLFormElement
        const src = f.elements.namedItem('src') as HTMLInputElement
        const lvl = f.elements.namedItem('level') as HTMLSelectElement
        if (src.value.trim()) {
          addSource(db, subject.id, src.value.trim(), Number(lvl.value), setProgress)
          src.value = ''
        }
      }}>
        <input name="src" placeholder="Paste a YouTube link, or type a topic…" />
        <select name="level" defaultValue={3} aria-label="How well do you know it?">
          {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
        <button>Add</button>
        <label className="file">
          PDF
          <input type="file" accept="application/pdf" hidden
            onChange={(e) => {
              const lvl = (e.target.form?.elements.namedItem('level') as HTMLSelectElement)?.value ?? '3'
              if (e.target.files?.[0] && user) uploadPdf(db, user.id, subject.id, e.target.files[0], Number(lvl), setProgress)
            }} />
        </label>
      </form>
      {progress && <p className="progress">{progress}</p>}

      {docs.length > 0 && (
        <section className="group">
          <h2 className="group-name">Material</h2>
          <ul className="subjects">
            {docs.map((d) => (
              <li key={d.id} className="doc-row">
                <strong>{d.filename}</strong>
                <span className="tag">
                  {d.chunks_total && d.chunks_done < d.chunks_total
                    ? `${d.chunks_done}/${d.chunks_total}`
                    : d.source_type}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="group">
        <h2 className="group-name">Settings</h2>
        <ul className="subjects">
          <li className="setting">
            <span>Exam date</span>
            <input type="date" defaultValue={subject.exam_date ?? ''}
              onChange={(e) => patch(subject.id, { exam_date: e.target.value || null })} />
          </li>
          <li className="setting">
            <span>Card order</span>
            <select value={subject.order_mode} onChange={(e) => patch(subject.id, { order_mode: e.target.value })}>
              <option value="adaptive">Adapt to me</option>
              <option value="syllabus">Follow my syllabus</option>
            </select>
          </li>
          <li className="setting">
            <span>Semester</span>
            <input className="sem" defaultValue={subject.semester ?? ''} placeholder="Sem 4"
              onBlur={(e) => patch(subject.id, { semester: e.target.value.trim() || null })} />
          </li>
          <li className="setting">
            <span>{subject.archived ? 'Hidden from your feed' : 'Showing in your feed'}</span>
            <button className="ghost" onClick={async () => {
              await patch(subject.id, { archived: !subject.archived })
              refresh()
            }}>{subject.archived ? 'Restore' : 'Archive'}</button>
          </li>
        </ul>
      </section>
    </main>
  )
}
