'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { browserClient } from '@/lib/supabase'
import ThemeToggle from '@/components/ThemeToggle'
import { isYouTube } from '@/lib/youtube'

type Subject = {
  id: string; name: string; exam_date: string | null
  archived: boolean; semester: string | null; order_mode: string
}
type NewDoc = { filename: string; source_type: string; source_ref?: string; storage_path?: string; level: number }

const LEVELS = [
  { value: 1, label: 'New to this' },
  { value: 3, label: 'Know the basics' },
  { value: 5, label: 'Revising for an exam' },
]

export default function Home() {
  const [db] = useState(browserClient)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [progress, setProgress] = useState('')
  const [authError, setAuthError] = useState('')

  const refresh = useCallback(async () => {
    const { data } = await db.from('subjects')
      .select('id,name,exam_date,archived,semester,order_mode').order('created_at')
    setSubjects(data ?? [])
  }, [db])

  // No login step: an anonymous Supabase user is still a real auth.users row, so
  // every RLS policy keeps working untouched and there is nothing to sign into.
  // ponytail: account lives in this browser's cookies. Add email sign-in when you
  // need the same account on a second device.
  useEffect(() => {
    db.auth.getUser().then(async ({ data }) => {
      const u = data.user ?? (await db.auth.signInAnonymously()).data.user
      if (!u) return setAuthError('Enable Anonymous sign-ins: Supabase → Authentication → Sign In / Providers')
      setUser(u)
      refresh()
    })
  }, [db, refresh])

  if (!user) return (
    <main className="centre">
      <h1>Doomly</h1>
      <p className="tag">Doomscroll your syllabus.</p>
      {authError ? <p className="err">{authError}</p> : <p className="tag">Starting…</p>}
    </main>
  )

  const patch = async (id: string, fields: Partial<Subject>) => {
    await db.from('subjects').update(fields).eq('id', id)
    refresh()
  }

  const addSubject = async (name: string) => {
    await db.from('subjects').insert({ name, user_id: user.id })
    refresh()
  }

  // The "background buffer": one chunk per request, looped here in the browser.
  // No queue, and no request long enough to hit a serverless timeout.
  const ingest = async (subjectId: string, doc: NewDoc) => {
    const { data: row, error } = await db.from('documents')
      .insert({ ...doc, subject_id: subjectId }).select('id').single()
    if (error || !row) return setProgress(error?.message ?? 'could not start')

    setProgress('Reading it…')
    let cards = 0
    for (let done = false, n = 0; !done; n++) {
      let res
      try {
        const r = await fetch('/api/process', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ documentId: row.id }),
        })
        res = await r.json()
      } catch (e) {
        return setProgress(`Request failed: ${(e as Error).message}`)
      }
      if (res.error) return setProgress(res.error)
      // The server only reports done once chunks_done passes the total, so a
      // stuck counter would otherwise loop here forever.
      if (n > res.total + 2) return setProgress('Stopped: generation is not advancing.')
      cards += res.added
      done = res.done
      // Scrollable from the first chunk on — no need to wait for the whole source.
      setProgress(done
        ? `Done — ${cards} cards. Go scroll.`
        : `Generating… part ${n + 1}/${res.total}, ${cards} cards so far. You can start scrolling now.`)
    }
  }

  const uploadPdf = async (subjectId: string, file: File, level: number) => {
    const path = `${user.id}/${crypto.randomUUID()}.pdf`
    const { error } = await db.storage.from('docs').upload(path, file)
    if (error) return setProgress(error.message)
    ingest(subjectId, { filename: file.name, source_type: 'pdf', storage_path: path, level })
  }

  // One box for both: a link is a link, anything else is a topic to teach.
  const addSource = (subjectId: string, text: string, level: number) =>
    isYouTube(text)
      ? ingest(subjectId, { filename: 'YouTube video', source_type: 'youtube', source_ref: text, level })
      : ingest(subjectId, { filename: text, source_type: 'topic', source_ref: text, level })

  // Archived subjects sink to their own group so nothing looks deleted.
  const live = subjects.filter((s) => !s.archived)
  const groups: [string, Subject[]][] = [
    ...Map.groupBy(live, (s) => s.semester?.trim() || 'Subjects').entries(),
  ]
  const archived = subjects.filter((s) => s.archived)
  if (archived.length) groups.push(['Archived', archived])

  return (
    <main>
      <header className="bar">
        <h1>Doomly</h1>
        <ThemeToggle />
        <Link className="cta" href="/feed">Start scrolling →</Link>
      </header>

      <form onSubmit={(e) => {
        e.preventDefault()
        const input = (e.target as HTMLFormElement).elements.namedItem('name') as HTMLInputElement
        if (input.value.trim()) { addSubject(input.value.trim()); input.value = '' }
      }}>
        <input name="name" placeholder="New subject — DSA, CN, OS…" />
        <button>Add</button>
      </form>

      {groups.map(([semester, items]) => (
        <section key={semester} className="group">
          {groups.length > 1 && <h2 className="group-name">{semester}</h2>}
          <ul className="subjects">
            {items.map((s) => (
              <li key={s.id}>
                <div className="subject-head">
                  {/* Rename in place: blur commits, nothing to open or save. */}
                  <strong contentEditable suppressContentEditableWarning
                    onBlur={(e) => {
                      const name = e.currentTarget.textContent?.trim()
                      if (name && name !== s.name) patch(s.id, { name })
                    }}>{s.name}</strong>
                  <label className="exam">
                    Exam
                    <input type="date" defaultValue={s.exam_date ?? ''}
                      onChange={(e) => patch(s.id, { exam_date: e.target.value || null })} />
                  </label>
                </div>

                <div className="subject-opts">
                  <select value={s.order_mode} aria-label="Card order"
                    onChange={(e) => patch(s.id, { order_mode: e.target.value })}>
                    <option value="adaptive">Adapt to me</option>
                    <option value="syllabus">Follow my syllabus</option>
                  </select>
                  <input className="sem" defaultValue={s.semester ?? ''} placeholder="Semester"
                    onBlur={(e) => patch(s.id, { semester: e.target.value.trim() || null })} />
                  <button className="ghost" onClick={() => patch(s.id, { archived: !s.archived })}>
                    {s.archived ? 'Restore' : 'Archive'}
                  </button>
                </div>

                {!s.archived && (
                  <form className="source" onSubmit={(e) => {
                    e.preventDefault()
                    const f = e.target as HTMLFormElement
                    const src = f.elements.namedItem('src') as HTMLInputElement
                    const lvl = f.elements.namedItem('level') as HTMLSelectElement
                    if (src.value.trim()) { addSource(s.id, src.value.trim(), Number(lvl.value)); src.value = '' }
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
                          if (e.target.files?.[0]) uploadPdf(s.id, e.target.files[0], Number(lvl))
                        }} />
                    </label>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {progress && <p className="progress">{progress}</p>}
    </main>
  )
}
