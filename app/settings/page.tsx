'use client'
import { useSession } from '@/lib/session'
import ThemeToggle from '@/components/ThemeToggle'
import PushToggle from '@/components/PushToggle'

export default function Settings() {
  const { user } = useSession()

  return (
    <main>
      <header className="bar"><h1>Settings</h1></header>

      <section className="group">
        <h2 className="group-name">Appearance</h2>
        <ul className="subjects">
          <li className="setting"><span>Theme</span><ThemeToggle /></li>
        </ul>
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
