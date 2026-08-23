'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useSession, type Subject } from '@/lib/session'

export default function Library() {
  const { db, user, subjects, error, refresh } = useSession()
  const [adding, setAdding] = useState(false)

  if (error) return <main><p className="err">{error}</p></main>
  if (!user) return <main><p className="tag">Starting…</p></main>

  const add = async (name: string) => {
    setAdding(true)
    await db.from('subjects').insert({ name, user_id: user.id })
    await refresh()
    setAdding(false)
  }

  // Archived subjects sink to their own group so nothing looks deleted.
  const live = subjects.filter((s) => !s.archived)
  const groups: [string, Subject[]][] = [
    ...Map.groupBy(live, (s) => s.semester?.trim() || 'Subjects').entries(),
  ]
  const archived = subjects.filter((s) => s.archived)
  if (archived.length) groups.push(['Archived', archived])

  return (
    <main>
      <header className="bar"><h1>Library</h1></header>

      <form onSubmit={(e) => {
        e.preventDefault()
        const input = (e.target as HTMLFormElement).elements.namedItem('name') as HTMLInputElement
        if (input.value.trim()) { add(input.value.trim()); input.value = '' }
      }}>
        <input name="name" placeholder="New subject — DSA, CN, OS…" />
        <button disabled={adding}>Add</button>
      </form>

      {!subjects.length && <p className="empty-inline">No subjects yet. Add one above, then feed it a PDF, a YouTube link or just a topic.</p>}

      {groups.map(([semester, items]) => (
        <section key={semester} className="group">
          <h2 className="group-name">{semester}</h2>
          <ul className="subjects">
            {items.map((s) => (
              <li key={s.id}>
                <Link className="row-link" href={`/library/${s.id}`}>
                  <strong>{s.name}</strong>
                  {s.exam_date && <span className="tag">{new Date(s.exam_date)
                    .toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>}
                  <span className="chevron" aria-hidden>›</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  )
}
