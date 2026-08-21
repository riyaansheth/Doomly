'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { browserClient } from '@/lib/supabase'

type Subject = { id: string; name: string; exam_date: string | null }

export default function Home() {
  const [db] = useState(browserClient)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [progress, setProgress] = useState('')
  const [authError, setAuthError] = useState('')

  const refresh = useCallback(async () => {
    const { data } = await db.from('subjects').select('id,name,exam_date').order('created_at')
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

    setProgress('Reading the PDF…')
    let cards = 0
    for (let done = false, n = 0; !done; n++) {
      let res
      try {
        const r = await fetch('/api/process', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ documentId: doc.id }),
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
      // Scrollable from the first chunk on — no need to wait for the whole PDF.
      setProgress(done
        ? `Done — ${cards} cards. Go scroll.`
        : `Generating… chunk ${n + 1}/${res.total}, ${cards} cards so far. You can start scrolling now.`)
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
