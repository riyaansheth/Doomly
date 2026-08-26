'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from '@/lib/session'
import ThemeToggle from '@/components/ThemeToggle'
import PushToggle from '@/components/PushToggle'
import BrainrotToggle from '@/components/BrainrotToggle'

export default function Settings() {
  const { db, user } = useSession()
  const [coverage, setCoverage] = useState<{ total: number; withRetelling: number } | null>(null)

  // A toggle that silently does nothing is broken, even when the code is right.
  // Cards made before brainrot existed have no retelling and fall back to normal
  // wording — so say that plainly rather than letting the switch look dead.
  useEffect(() => {
    if (!user) return
    Promise.all([
      db.from('cards').select('id', { count: 'exact', head: true }),
      db.from('cards').select('id', { count: 'exact', head: true }).not('brainrot', 'is', null),
    ]).then(([all, withBr]) =>
      setCoverage({ total: all.count ?? 0, withRetelling: withBr.count ?? 0 }))
  }, [db, user])

  return (
    <main>
      <header className="bar"><h1>Settings</h1></header>

      <section className="group">
        <h2 className="group-name">Appearance</h2>
        <ul className="subjects">
          <li className="setting"><span>Theme</span><ThemeToggle /></li>
          <li className="setting"><span>Brainrot mode</span><BrainrotToggle /></li>
        </ul>
        <p className="tag foot">
          Same cards, told like a chronically-online narrator. Questions, options and code
          stay exactly as they are — only the wording around them changes.
        </p>
        {coverage && coverage.total > 0 && coverage.withRetelling < coverage.total && (
          <p className="tag foot">
            {coverage.withRetelling === 0
              ? <>None of your {coverage.total} cards have a brainrot version yet, so this
                  switch won&apos;t change anything. Cards get one when they&apos;re
                  generated — <Link href="/library">add material</Link> to see it.</>
              : <>Only {coverage.withRetelling} of your {coverage.total} cards have a brainrot
                  version. Older cards keep their normal wording.</>}
          </p>
        )}
      </section>

      <section className="group">
        <h2 className="group-name">Reminders</h2>
        <ul className="subjects">
          <li className="setting"><span>Before exams</span><PushToggle /></li>
        </ul>
        <p className="tag foot">Doomly reminds you 7, 3 and 1 days before each exam, and on the day.</p>
      </section>

      <section className="group">
        <h2 className="group-name">Account</h2>
        <ul className="subjects">
          <li className="setting"><span>Signed in</span><span className="tag">Anonymously</span></li>
        </ul>
        <p className="tag foot">
          Your account lives in this browser. Clearing site data loses your subjects and progress
          {user ? ` (${user.id.slice(0, 8)})` : ''}.
        </p>
      </section>
    </main>
  )
}
