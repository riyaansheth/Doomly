'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { browserClient } from '@/lib/supabase'

type Subject = { id: string; name: string; exam_date: string | null }

export default function Home() {
  const [db] = useState(browserClient)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [progress, setProgress] = useState('')
  const [authError, setAuthError] = useState('')

  // Surfaced by /auth/callback so a failed sign-in isn't a silent bounce.
  useEffect(() => setAuthError(new URLSearchParams(location.search).get('authError') ?? ''), [])

  const refresh = useCallback(async () => {
    const { data } = await db.from('subjects').select('id,name,exam_date').order('created_at')
    setSubjects(data ?? [])
  }, [db])

  useEffect(() => {
    db.auth.getUser().then(({ data }) => { setUser(data.user); if (data.user) refresh() })
  }, [db, refresh])

  if (!user) return (
    <main className="centre">
      <h1>Doomly</h1>
      <p className="tag">Doomscroll your syllabus.</p>
      {authError && <p className="err">{authError}</p>}
      {sent ? <p>Check your email for the link.</p> : (
        <form onSubmit={async (e) => {
          e.preventDefault()
          await db.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/auth/callback` } })
          setSent(true)
        }}>
          <input type="email" required placeholder="you@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button>Send me a link</button>
        </form>
      )}
    </main>
  )

  const addSubject = async (name: string) => {
    await db.from('subjects').insert({ name, user_id: user.id })
    refresh()
  }

  // The "background buffer": one chunk per request, looped here in the browser.
  // No queue, and no request long enough to hit a serverless timeout.
  const upload = async (subjectId: string, file: File) => {
    const path = `${user.id}/${crypto.randomUUID()}.pdf`
    const up = await db.storage.from('docs').upload(path, file)
    if (up.error) return setProgress(up.error.message)

    const { data: doc, error } = await db.from('documents')
      .insert({ subject_id: subjectId, filename: file.name, storage_path: path })
      .select('id').single()
    if (error || !doc) return setProgress(error?.message ?? 'upload failed')

    for (let done = false; !done; ) {
      const res = await fetch('/api/process', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ documentId: doc.id }),
      }).then((r) => r.json())
      if (res.error) return setProgress(res.error)
      done = res.done
      // Scrollable from the first chunk on — no need to wait for the whole PDF.
      setProgress(done ? 'Done — go scroll.' : `Generating… ${res.total} chunks, cards are landing already.`)
    }
  }

  return (
    <main>
      <header className="bar">
        <h1>Doomly</h1>
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

      <ul className="subjects">
        {subjects.map((s) => (
          <li key={s.id}>
            <strong>{s.name}</strong>
            <label className="file">
              Upload PDF
              <input type="file" accept="application/pdf" hidden
                onChange={(e) => e.target.files?.[0] && upload(s.id, e.target.files[0])} />
            </label>
            <label className="exam">
              Exam
              <input type="date" defaultValue={s.exam_date ?? ''}
                onChange={async (e) => {
                  await db.from('subjects').update({ exam_date: e.target.value || null }).eq('id', s.id)
                  refresh()
                }} />
            </label>
          </li>
        ))}
      </ul>
      {progress && <p className="progress">{progress}</p>}
    </main>
  )
}
